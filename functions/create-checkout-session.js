// MAISON HAN - Stripe Checkout Session (Cloudflare Pages Function)
// Route: POST /create-checkout-session
// Dynamic line_items via price_data (storefront prices in USD); no Stripe price IDs required.

import { stripeCheckoutSessionCreate } from './_lib/stripeRest.js';

const SHIPPING_COUNTRIES = [
  'US','CA','GB','AU','NZ','JP','HK','SG','TW','MO',
  'DE','FR','IT','ES','NL','BE','SE','DK','FI','NO',
  'CH','AT','IE','PT','LU','PL',
];

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function resolveMhMemberIdFromPortal(env, request) {
  const base = String(env.MAISON_HAN_API_BASE || '').trim().replace(/\/+$/, '');
  const rawAuth = request.headers.get('Authorization') || request.headers.get('authorization') || '';
  const auth = rawAuth.trim();
  if (!base || !/^Bearer\s+\S+/i.test(auth)) return null;
  try {
    const r = await fetch(`${base}/portal/me`, {
      method: 'GET',
      headers: { Authorization: auth, Accept: 'application/json' },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (Number(j.code) !== 200 || !j.data) return null;
    const mid = j.data.memberId ?? j.data.member_id;
    if (mid == null) return null;
    const s = String(mid).trim();
    return s.length ? s : null;
  } catch (err) {
    console.warn('[create-checkout-session] portal/me', err);
    return null;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return jsonResponse(500, {
      error: 'Server is missing STRIPE_SECRET_KEY.',
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_e) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) return jsonResponse(400, { error: 'Cart is empty' });
  if (items.length > 50) return jsonResponse(400, { error: 'Too many items' });

  // Build line_items with price_data (no catalog price IDs).
  const line_items = [];
  for (const it of items) {
    const name = String(it.name || '').trim().slice(0, 250);
    const priceUsd = Number(it.priceUsd);
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));

    if (!name) return jsonResponse(400, { error: 'Missing item name' });
    if (!priceUsd || priceUsd <= 0) return jsonResponse(400, { error: `Invalid price for: ${name}` });
    if (priceUsd > 50000) return jsonResponse(400, { error: `Price exceeds limit: ${name}` });

    const product_data = { name };
    if (it.sub) product_data.description = String(it.sub).slice(0, 500);
    if (it.image && /^https?:\/\//.test(it.image)) product_data.images = [it.image];

    line_items.push({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(priceUsd * 100),
        product_data,
      },
      quantity: qty,
    });
  }

  const origin =
    request.headers.get('origin') ||
    (request.headers.get('referer') || '').replace(/(.*?:\/\/[^/]+).*/, '$1') ||
    `https://${request.headers.get('host') || 'example.com'}`;

  try {
    // 创建或查找 Stripe Customer（让买家成为正式 Customer，而非访客）
    let customerId = null;
    if (payload.email) {
      const email = String(payload.email).trim().toLowerCase();
      try {
        const searchRes = await fetch(
          `https://api.stripe.com/v1/customers/search?query=email:'${email.replace(/'/g,"\\'")}'&limit=1`,
          { headers: { Authorization: `Bearer ${secretKey}` } }
        );
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id;
        } else {
          const createRes = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ email }).toString(),
          });
          const createData = await createRes.json();
          if (createData.id) customerId = createData.id;
        }
      } catch (e) {
        console.warn('Customer lookup failed:', e);
      }
    }

    const mhMemberId = await resolveMhMemberIdFromPortal(env, request);
    const md = {
      site: 'maison-han',
      age_confirmed: payload.ageConfirmed ? 'true' : 'false',
      item_count: String(items.reduce((s, x) => s + (parseInt(x.qty, 10) || 0), 0)),
      lang: ['en','zh-CN','zh-TW','ja'].includes(payload.lang) ? payload.lang : 'en',
    };
    if (mhMemberId) md.mh_member_id = mhMemberId;

    const session = await stripeCheckoutSessionCreate(secretKey, {
      mode: 'payment',
      customer_creation: 'always',
      customer: customerId || undefined,
      customer_email: customerId ? undefined : (payload.email || undefined),
      payment_method_types: ['card'],
      line_items,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      phone_number_collection: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: 'Insured premium courier',
            type: 'fixed_amount',
            fixed_amount: { amount: 5000, currency: 'usd' },
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
      ],
      custom_text: {
        shipping_address: {
          message: 'Insured, signature-required delivery. Recipient must be 21+ and present valid ID at handover.',
        },
        submit: {
          message: 'By placing this order you confirm you are of legal drinking age in your jurisdiction.',
        },
      },
      metadata: md,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
    });

    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return jsonResponse(500, {
      error: err && err.message ? err.message : 'Failed to create checkout session',
    });
  }
}
