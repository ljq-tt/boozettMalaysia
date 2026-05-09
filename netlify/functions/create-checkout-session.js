// MAISON HAN — Stripe Checkout Session creator（Netlify 备用实现，勿删；主站可为 Cloudflare functions/create-checkout-session.js）
// Receives a cart of {priceId, qty} from the storefront.
// Validates each price ID against the live Stripe catalog (we never trust the client),
// then asks Stripe to create a hosted Checkout Session.
//
// Required env var (set in Netlify → Site settings → Environment):
//   STRIPE_SECRET_KEY = sk_test_... (or sk_live_... once approved for alcohol)

const Stripe = require('stripe');

// Countries we are willing to ship to. Edit per your liquor licensing & courier reach.
// Note: cross-border alcohol shipping is heavily regulated. Verify each lane before
// switching to live mode.
const SHIPPING_COUNTRIES = [
  'US', 'CA', 'GB', 'AU', 'NZ', 'JP', 'HK', 'SG', 'TW', 'MO',
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'DK', 'FI', 'NO',
  'CH', 'AT', 'IE', 'PT', 'LU', 'PL',
];

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function isMaisonHan(meta) {
  const v = String(meta?.maison_han || '')
    .trim()
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

// Verify a Price belongs to an active tagged Product (not just default_price — fixes
// Dashboard-created items where default price was never set).
async function assertValidStorefrontPrice(stripe, priceId) {
  const pr = await stripe.prices.retrieve(priceId, { expand: ['product'] });
  let prod = pr.product;
  if (typeof prod === 'string') {
    prod = await stripe.products.retrieve(prod);
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return json(500, {
      error:
        'Server is missing STRIPE_SECRET_KEY. Set it in Netlify → Site settings → ' +
        'Environment variables, then redeploy. See README §Stripe setup.',
    });
  }
  const stripe = new Stripe(secretKey);

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) return json(400, { error: 'Cart is empty' });
  if (items.length > 50) return json(400, { error: 'Too many items' });

  const line_items = [];
  for (const it of items) {
    const priceId = it && it.priceId ? String(it.priceId) : '';
    const qty = Math.max(1, Math.min(99, parseInt(it && it.qty, 10) || 0));
    if (!priceId) {
      return json(400, { error: 'Missing price in cart line' });
    }
    try {
      await assertValidStorefrontPrice(stripe, priceId);
    } catch (err) {
      console.error('Price validation failed:', err);
      return json(400, {
        error: err.message || `Invalid price: ${priceId}`,
      });
    }
    line_items.push({ price: priceId, quantity: qty });
  }

  const headers = event.headers || {};
  const origin =
    headers.origin ||
    headers.Origin ||
    (headers.referer && headers.referer.replace(/(.*?:\/\/[^/]+).*/, '$1')) ||
    `https://${headers.host || 'example.com'}`;

  try {
    const session = await stripe.checkout.sessions.create({
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

    return json(200, { url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return json(500, {
      error: err && err.message ? err.message : 'Failed to create checkout session',
    });
  }
};
