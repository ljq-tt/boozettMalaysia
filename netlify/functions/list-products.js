// MAISON HAN — Public product list endpoint（Netlify 备用实现，勿删；主站可为 Cloudflare functions/list-products.js）
// GET /.netlify/functions/list-products
//
// When MAISON_HAN_API_BASE is set (your TaTa backend origin, no trailing slash),
// returns JSON from GET {MAISON_HAN_API_BASE}/storefront/products (same shape as before).
// Otherwise falls back to Stripe (metadata.maison_han='true') for backward compatibility.

const Stripe = require('stripe');

const CACHE_TTL_MS = 60 * 1000;
let cache = null;
let cacheExpiry = 0;

/** TaTa often stores `/profile/...` paths; storefront origin must load images from API host. */
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

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

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

async function resolvePriceObject(stripe, product) {
  const dp = product.default_price;
  if (!dp) {
    const list = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 10,
    });
    const oneTime = list.data.find((pr) => pr.type === 'one_time');
    return oneTime || list.data[0] || null;
  }
  if (typeof dp === 'string') {
    try {
      return await stripe.prices.retrieve(dp);
    } catch (_e) {
      return null;
    }
  }
  return dp;
}

async function listAllActiveProducts(stripe) {
  const all = [];
  let startingAfter = undefined;
  for (;;) {
    const page = await stripe.products.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    });
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

async function loadFromStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY missing (needed when MAISON_HAN_API_BASE is unset).',
    );
  }
  const stripe = new Stripe(secretKey);
  const rawProducts = await listAllActiveProducts(stripe);
  const tagged = rawProducts.filter((p) => isMaisonHan(p.metadata));

  const withPrices = await Promise.all(
    tagged.map(async (p) => {
      const priceObj = await resolvePriceObject(stripe, p);
      return transform(p, priceObj);
    }),
  );

  return withPrices
    .filter((item) => item.priceId && item.id > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  if (cache && Date.now() < cacheExpiry) {
    return json(200, cache, { 'X-Cache': 'HIT' });
  }

  const apiBase = process.env.MAISON_HAN_API_BASE;

  try {
    let products;
    if (apiBase) {
      const raw = await loadFromTataBackend(apiBase);
      if (!raw) {
        return json(502, { error: 'Invalid catalog response from TaTa backend' });
      }
      products = absolutizeCatalogImages(
        raw
          .filter((item) => item && item.priceId && item.id > 0)
          .sort(
            (a, b) =>
              (a.sortOrder || 999) - (b.sortOrder || 999) ||
              (a.id || 0) - (b.id || 0),
          ),
        apiBase,
      );
    } else {
      products = await loadFromStripe();
    }

    cache = products;
    cacheExpiry = Date.now() + CACHE_TTL_MS;

    return json(200, products, {
      'X-Cache': 'MISS',
      'X-Catalog-Source': apiBase ? 'tata' : 'stripe',
    });
  } catch (err) {
    console.error('list-products error:', err);
    return json(500, {
      error: err.message || 'Failed to list products',
    });
  }
};
