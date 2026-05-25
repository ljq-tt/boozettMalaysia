/**
 * PayPal REST via fetch only (no npm `@paypal/checkout-server-sdk`).
 * Mirrors the style of stripeRest.js so Cloudflare Pages bundles Functions
 * without running `npm install`.
 *
 * Env vars (set in Cloudflare Pages dashboard):
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_ENV          // 'live' (default) or 'sandbox'
 */

export function paypalBaseUrl(env) {
  const mode = String(env.PAYPAL_ENV || 'live').toLowerCase();
  return mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

export function paypalCredentials(env) {
  const clientId = String(env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = String(env.PAYPAL_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) {
    throw new Error('Server is missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.');
  }
  return { clientId, clientSecret };
}

export async function paypalAccessToken(env) {
  const { clientId, clientSecret } = paypalCredentials(env);
  const base = paypalBaseUrl(env);
  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { error_description: text }; }
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || `PayPal auth HTTP ${res.status}`);
  }
  return json.access_token;
}

async function paypalRequest(env, method, path, body) {
  const token = await paypalAccessToken(env);
  const base = paypalBaseUrl(env);
  const p = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { message: text }; }
  if (!res.ok) {
    const msg = json?.message
      || json?.details?.[0]?.description
      || text
      || `PayPal HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export async function paypalCreateOrder(env, body) {
  return paypalRequest(env, 'POST', '/v2/checkout/orders', body);
}

export async function paypalCaptureOrder(env, orderId) {
  const id = encodeURIComponent(orderId);
  return paypalRequest(env, 'POST', `/v2/checkout/orders/${id}/capture`, {});
}

export async function paypalGetOrder(env, orderId) {
  const id = encodeURIComponent(orderId);
  return paypalRequest(env, 'GET', `/v2/checkout/orders/${id}`);
}
