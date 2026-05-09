// MAISON HAN ¡ª Public product list (Cloudflare Pages Function).
// Route: GET /list-products
// Netlify backup: netlify/functions/list-products.js (kept; do not delete).
// Stripe catalog uses REST + fetch only (no npm `stripe`) so Pages can bundle without `npm install`.
//
// Env (Cloudflare Pages -> Settings -> Variables):
//   MAISON_HAN_API_BASE ¡ª TaTa backend origin (no trailing slash); GET {base}/storefront/products
// If unset: STRIPE_SECRET_KEY required (Stripe catalog fallback, metadata.maison_han).

import {
  stripeProductsListPage,
  stripePricesForProduct,
  stripePriceRetrieve,
} from './_lib/stripeRest.js';

const CACHE_TTL_MS = 60 * 1000;
let cache = null;
let cacheExpiry = 0;

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

async function loadFromTataBackend(apiBase) {
  const base = String(apiBase || '').replace(/\/$/, '');
  if (!base) return null;
  const url = `${base}/storefront/products`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
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
    image: (p.images && p.images[0]) || '',
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
  const { env } = context;

  if (cache && Date.now() < cacheExpiry) {
    return jsonResponse(200, cache, { 'X-Cache': 'HIT' });
  }

  const apiBase = env.MAISON_HAN_API_BASE;

  try {
    let products;
    if (apiBase) {
      const raw = await loadFromTataBackend(apiBase);
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
    } else {
      const secretKey = env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        return jsonResponse(500, {
          error:
            'Set MAISON_HAN_API_BASE or STRIPE_SECRET_KEY in Cloudflare Pages environment variables.',
        });
      }
      products = await loadFromStripe(secretKey);
    }

    cache = products;
    cacheExpiry = Date.now() + CACHE_TTL_MS;

    return jsonResponse(200, products, {
      'X-Cache': 'MISS',
      'X-Catalog-Source': apiBase ? 'tata' : 'stripe',
    });
  } catch (err) {
    console.error('list-products error:', err);
    return jsonResponse(500, {
      error: err.message || 'Failed to list products',
    });
  }
}
