/**
 * Stripe REST via fetch only (no npm `stripe` package).
 * Lets Cloudflare Pages bundle Functions without running `npm install`.
 */

const STRIPE_V1 = 'https://api.stripe.com/v1';

export async function stripeGet(secretKey, pathAndQuery) {
  const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
  const res = await fetch(`${STRIPE_V1}${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: { message: text } };
  }
  if (!res.ok) {
    throw new Error(json?.error?.message || text || `Stripe HTTP ${res.status}`);
  }
  return json;
}

/** application/x-www-form-urlencoded body (Stripe bracket notation). */
export function stripeFormEncode(obj) {
  const pairs = [];
  function walk(keyPath, value) {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      pairs.push([keyPath, value ? 'true' : 'false']);
      return;
    }
    if (typeof value !== 'object') {
      pairs.push([keyPath, String(value)]);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        walk(`${keyPath}[${i}]`, item);
      });
      return;
    }
    for (const [k, v] of Object.entries(value)) {
      walk(`${keyPath}[${k}]`, v);
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    walk(k, v);
  }
  return new URLSearchParams(pairs);
}

export async function stripePostForm(secretKey, path, obj) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${STRIPE_V1}${p}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: stripeFormEncode(obj).toString(),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: { message: text } };
  }
  if (!res.ok) {
    throw new Error(json?.error?.message || text || `Stripe HTTP ${res.status}`);
  }
  return json;
}

export async function stripeProductsListPage(secretKey, startingAfter) {
  const params = new URLSearchParams({ active: 'true', limit: '100' });
  if (startingAfter) params.set('starting_after', startingAfter);
  return stripeGet(secretKey, `/products?${params}`);
}

export async function stripePricesForProduct(secretKey, productId) {
  const params = new URLSearchParams({
    product: productId,
    active: 'true',
    limit: '10',
  });
  return stripeGet(secretKey, `/prices?${params}`);
}

export async function stripePriceRetrieve(secretKey, priceId) {
  const q = new URLSearchParams();
  q.append('expand[]', 'product');
  return stripeGet(secretKey, `/prices/${encodeURIComponent(priceId)}?${q}`);
}

export async function stripeProductRetrieve(secretKey, productId) {
  return stripeGet(secretKey, `/products/${encodeURIComponent(productId)}`);
}

export async function stripeCheckoutSessionCreate(secretKey, body) {
  return stripePostForm(secretKey, '/checkout/sessions', body);
}
