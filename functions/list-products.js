// MAISON HAN -- Public product list (Cloudflare Pages Function).
// Route: GET /list-products
// Netlify backup: netlify/functions/list-products.js (kept; do not delete).
//
// Env:
//   MAISON_HAN_API_BASE - TaTa public origin + servlet context-path, NO trailing slash.
//     Catalog URL is resolved with URL() so stray slashes / whitespace do not become GET //storefront/products (seen as 84-byte wrong hits on api vhosts).
//   STRIPE_SECRET_KEY - Stripe catalog when MAISON_HAN_API_BASE is unset and STATIC_CATALOG is off.
//   STATIC_CATALOG - if "1"/"true"/"yes": always read site-root /catalog.json (lets you keep STRIPE_SECRET_KEY for checkout while browsing uses static rows).
//   PRODUCT_IMAGE_BASE - optional; prefix relative image URLs (/profile/...) when using Stripe-only catalog
//
// Fallback: when MAISON_HAN_API_BASE and STRIPE_SECRET_KEY are both absent, tries GET same-origin /catalog.json (static showcase — no Stripe/TaTa).
import {
  stripeProductsListPage,
  stripePricesForProduct,
  stripePriceRetrieve,
} from './_lib/stripeRest.js';

const CACHE_TTL_MS = 60 * 1000;
let cache = null;
let cacheExpiry = 0;

/** TaTa often stores `/profile/...` paths; browser on Pages must load images from the API origin. */
function absolutizeImageUrl(apiBase, image) {
  const s = String(image ?? '').trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  const base = String(apiBase ?? '').replace(/\/$/, '');
  if (!base) return s;
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
}

function absolutizeCatalogImages(products, apiBase) {
  if (!apiBase || !Array.isArray(products)) return products;
  return products.map((p) =>
    p && typeof p === 'object'
      ? { ...p, image: absolutizeImageUrl(apiBase, p.image) }
      : p,
  );
}

/** Prefix relative `/profile/...` image paths without forcing TaTa catalog (Stripe-only setups). */
function catalogImageBase(env) {
  const b = env.PRODUCT_IMAGE_BASE || env.MAISON_HAN_API_BASE || '';
  return String(b).trim().replace(/\/$/, '');
}

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
      ...extraHeaders,
    },
  });
}

function envFlagTrue(env, key) {
  const v = String(env[key] ?? '')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Reads /catalog.json from the deployed site (same project root as index.html).
 * priceId may be null: grid/checkout still render; Stripe checkout skips lines without priceId.
 */
async function loadStaticCatalog(request) {
  const u = new URL('/catalog.json', request.url);
  const res = await fetch(u.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const raw = await res.json().catch(() => null);
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const id = Number(p.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const priceIdRaw = p.priceId;
    let priceId = null;
    if (priceIdRaw != null && String(priceIdRaw).trim() !== '') {
      priceId = String(priceIdRaw).trim();
    }
    out.push({
      id,
      productId: p.productId != null ? String(p.productId) : '',
      priceId,
      no: String(p.no ?? ''),
      cat: String(p.cat ?? 'other').toLowerCase(),
      catLabel: String(p.catLabel ?? p.cat ?? ''),
      bv: String(p.bv ?? 'bv-maotai'),
      bottle: String(p.bottle ?? 'generic'),
      image: String(p.image ?? ''),
      name: String(p.name ?? ''),
      sub: String(p.sub ?? ''),
      price:
        typeof p.price === 'number' ? p.price : parseFloat(String(p.price)) || 0,
      abv: String(p.abv ?? ''),
      vol: String(p.vol ?? ''),
      origin: String(p.origin ?? ''),
      year: String(p.year ?? ''),
      badge: p.badge != null && String(p.badge).trim() ? String(p.badge) : undefined,
      desc: String(p.desc ?? ''),
      sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : 999,
    });
  }
  out.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  return out.length ? out : null;
}

/** Single canonical TaTa catalog URL; avoids //storefront/products when base has trailing slash or hidden whitespace. */
function tataCatalogUrl(apiBase) {
  const raw = String(apiBase ?? '')
    .trim()
    .replace(/\s+/g, '');
  const b = raw.replace(/\/+$/, '');
  if (!b) return '';
  const baseForResolve = b.endsWith('/') ? b : `${b}/`;
  try {
    return new URL('storefront/products', baseForResolve).href;
  } catch {
    return '';
  }
}

async function loadFromTataBackend(apiBase, referer) {
  const url = tataCatalogUrl(apiBase);
  if (!url) return null;
  const ref =
    (typeof referer === 'string' && referer.trim()) ||
    'https://www.boozett.top/';
  // Some Nginx/WAF stacks return 403 for Workers' default fetch fingerprint; a neutral browser UA often fixes it.
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: ref,
    },
  });
  if (!res.ok) {
    throw new Error(`TaTa catalog HTTP ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : null;
}

function isMaisonHan(meta) {
  if (!meta) return false;
  const v = String(meta.maison_han || '')
    .trim()
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

async function resolvePriceObject(secretKey, product) {
  const dp = product.default_price;
  if (!dp) {
    const list = await stripePricesForProduct(secretKey, product.id);
    const oneTime = list.data.find((pr) => pr.type === 'one_time');
    return oneTime || list.data[0] || null;
  }
  if (typeof dp === 'string') {
    try {
      return await stripePriceRetrieve(secretKey, dp);
    } catch (_e) {
      return null;
    }
  }
  return dp;
}

async function listAllActiveProducts(secretKey) {
  const all = [];
  let startingAfter;
  for (;;) {
    const page = await stripeProductsListPage(secretKey, startingAfter);
    all.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return all;
}

function stripeProductImage(p, meta) {
  const fromStripe = p.images && p.images[0];
  if (fromStripe) return fromStripe;
  const m =
    meta.image_url ||
    meta.image ||
    meta.cover_image ||
    meta.photo_url ||
    '';
  return String(m || '').trim();
}

function transform(p, priceObj) {
  const meta = p.metadata || {};
  const legacyId = parseInt(meta.maison_han_id, 10);
  return {
    id: Number.isFinite(legacyId) && legacyId > 0 ? legacyId : 0,
    productId: p.id,
    priceId: priceObj && priceObj.id ? priceObj.id : null,
    no: meta.display_no || '',
    cat: (meta.cat || 'other').toLowerCase(),
    catLabel: meta.cat_label || meta.cat || 'Spirits',
    bv: meta.bv || `bv-${(meta.cat || 'wine').toLowerCase()}`,
    bottle: meta.bottle || 'generic',
    image: stripeProductImage(p, meta),
    name: meta.name_html || p.name,
    sub:
      meta.sub ||
      (p.description ? String(p.description).slice(0, 80) : ''),
    price:
      priceObj && priceObj.unit_amount != null
        ? priceObj.unit_amount / 100
        : 0,
    abv: meta.abv || '',
    vol: meta.vol || '',
    origin: meta.origin || '',
    year: meta.year || '',
    badge: meta.badge || undefined,
    desc: p.description || '',
    sortOrder: parseInt(meta.sort_order, 10) || 999,
  };
}

async function loadFromStripe(secretKey) {
  const rawProducts = await listAllActiveProducts(secretKey);
  const tagged = rawProducts.filter((p) => isMaisonHan(p.metadata));

  const withPrices = await Promise.all(
    tagged.map(async (p) => {
      const priceObj = await resolvePriceObject(secretKey, p);
      return transform(p, priceObj);
    }),
  );

  return withPrices
    .filter((item) => item.priceId && item.id > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function onRequestGet(context) {
  const { env, request } = context;

  if (cache && Date.now() < cacheExpiry) {
    return jsonResponse(200, cache, { 'X-Cache': 'HIT' });
  }

  const apiBase = String(env.MAISON_HAN_API_BASE ?? '').trim();
  const secretKey = String(env.STRIPE_SECRET_KEY ?? '').trim();
  const forceStatic = envFlagTrue(env, 'STATIC_CATALOG');

  try {
    let products;
    let sourceTag = 'stripe';

    if (forceStatic) {
      products = await loadStaticCatalog(request);
      sourceTag = 'static';
      if (!products) {
        return jsonResponse(500, {
          error:
            'STATIC_CATALOG is enabled but /catalog.json is missing or invalid.',
        });
      }
    } else if (apiBase) {
      sourceTag = 'tata';
      const raw = await loadFromTataBackend(
        apiBase,
        new URL(context.request.url).origin + '/',
      );
      if (!raw) {
        return jsonResponse(502, {
          error: 'Invalid catalog response from TaTa backend',
        });
      }
      products = raw
        .filter((item) => item && item.priceId && item.id > 0)
        .sort(
          (a, b) =>
            (a.sortOrder || 999) - (b.sortOrder || 999) ||
            (a.id || 0) - (b.id || 0),
        );
    } else if (secretKey) {
      products = await loadFromStripe(secretKey);
    } else {
      products = await loadStaticCatalog(request);
      sourceTag = 'static';
      if (!products) {
        return jsonResponse(500, {
          error:
            'Set MAISON_HAN_API_BASE, STRIPE_SECRET_KEY, STATIC_CATALOG=1 with catalog.json, or deploy catalog.json with no TaTa/Stripe keys.',
        });
      }
    }

    products = absolutizeCatalogImages(products, catalogImageBase(env));

    cache = products;
    cacheExpiry = Date.now() + CACHE_TTL_MS;

    return jsonResponse(200, products, {
      'X-Cache': 'MISS',
      'X-Catalog-Source': sourceTag,
    });
  } catch (err) {
    console.error('list-products error:', err);
    return jsonResponse(500, {
      error: err.message || 'Failed to list products',
    });
  }
}
