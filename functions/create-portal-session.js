// MAISON HAN - Stripe Customer Portal Session (Cloudflare Pages Function)
// Route: POST /create-portal-session
// Email -> Stripe Customer Search -> Billing Portal session URL

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return json(500, { error: 'Missing STRIPE_SECRET_KEY' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return json(400, { error: 'Valid email required' });
  }

  const origin =
    request.headers.get('origin') ||
    (request.headers.get('referer') || '').replace(/(.*?:\/\/[^/]+).*/, '$1').replace(/\/+$/, '') ||
    `https://${request.headers.get('host') || 'example.com'}`;

  const safeEmail = email.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const query = `email:'${safeEmail}'`;
  const searchUrl = `https://api.stripe.com/v1/customers/search?${new URLSearchParams({ query, limit: '1' })}`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      return json(500, { error: searchData.error?.message || 'Stripe search failed' });
    }

    const customers = searchData.data || [];
    if (customers.length === 0) {
      return json(404, { error: 'No orders found for this email' });
    }

    const customerId = customers[0].id;

    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${origin}/`,
      }).toString(),
    });

    const portalData = await portalRes.json();
    if (!portalRes.ok) {
      return json(500, { error: portalData.error?.message || 'Portal creation failed' });
    }

    return json(200, { url: portalData.url });
  } catch (err) {
    return json(500, { error: err.message || 'Internal error' });
  }
}
export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, method: 'GET', route: '/create-portal-session' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}