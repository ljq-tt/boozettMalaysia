// MAISON HAN ¡ª Stripe Checkout Session (Cloudflare Pages Function).
// Route: POST /create-checkout-session
// Netlify backup: netlify/functions/create-checkout-session.js (kept; do not delete).
// Stripe via REST + fetch only (no npm `stripe`) so Pages can bundle without `npm install`.
//
// Env: STRIPE_SECRET_KEY (encrypted in Cloudflare Pages).

import {
  stripePriceRetrieve,
  stripeProductRetrieve,
  stripeCheckoutSessionCreate,
} from './_lib/stripeRest.js';

const SHIPPING_COUNTRIES = [
  'US', 'CA', 'GB', 'AU', 'NZ', 'JP', 'HK', 'SG', 'TW', 'MO',
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'DK', 'FI', 'NO',
  'CH', 'AT', 'IE', 'PT', 'LU', 'PL',
];

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isMaisonHan(meta) {
  const v = String(meta?.maison_han || '')
    .trim()
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

async function assertValidStorefrontPrice(secretKey, priceId) {
  const pr = await stripePriceRetrieve(secretKey, priceId);
  let prod = pr.product;
  if (typeof prod === 'string') {
    prod = await stripeProductRetrieve(secretKey, prod);
  }
  if (!pr.active) throw new Error(`Price inactive: ${priceId}`);
  if (!prod || !prod.active) throw new Error(`Product inactive: ${priceId}`);
  if (!isMaisonHan(prod.metadata)) {
    throw new Error(`Price not linked to a Maison Han product: ${priceId}`);
  }
  if (pr.type !== 'one_time') {
    throw new Error(`Only one-time prices are supported: ${priceId}`);
  }
  if (String(pr.currency).toLowerCase() !== 'usd') {
    throw new Error(`Only USD prices are supported: ${priceId}`);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return jsonResponse(500, {
      error:
        'Server is missing STRIPE_SECRET_KEY. Set it in Cloudflare Pages (Settings -> Environment variables), then redeploy.',
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

  const line_items = [];
  for (const it of items) {
    const priceId = it && it.priceId ? String(it.priceId) : '';
    const qty = Math.max(1, Math.min(99, parseInt(it && it.qty, 10) || 0));
    if (!priceId) {
      return jsonResponse(400, { error: 'Missing price in cart line' });
    }
    try {
      await assertValidStorefrontPrice(secretKey, priceId);
    } catch (err) {
      console.error('Price validation failed:', err);
      return jsonResponse(400, {
        error: err.message || `Invalid price: ${priceId}`,
      });
    }
    line_items.push({ price: priceId, quantity: qty });
  }

  const origin =
    request.headers.get('origin') ||
    (request.headers.get('referer') &&
      request.headers.get('referer').replace(/(.*?:\/\/[^/]+).*/, '$1')) ||
    `https://${request.headers.get('host') || 'example.com'}`;

  try {
    const session = await stripeCheckoutSessionCreate(secretKey, {
      mode: 'payment',
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
          message:
            'Insured, signature-required delivery. Recipient must be 21+ and present valid ID at handover.',
        },
        submit: {
          message:
            'By placing this order you confirm you are of legal drinking age in your jurisdiction.',
        },
      },
      metadata: {
        site: 'maison-han',
        age_confirmed: payload.ageConfirmed ? 'true' : 'false',
        item_count: String(items.reduce((s, x) => s + (parseInt(x.qty, 10) || 0), 0)),
      },
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
