// MAISON HAN - Create a PayPal order (Cloudflare Pages Function)
// Route: POST /create-paypal-order
// Builds an Orders v2 request from the same cart payload Stripe checkout uses.

import { paypalCreateOrder } from './_lib/paypalRest.js';

const SHIPPING_FLAT_USD = 50.00; // mirrors the Stripe shipping_rate ($50)

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function money(usd) {
  return { currency_code: 'USD', value: Number(usd).toFixed(2) };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch (_e) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) return jsonResponse(400, { error: 'Cart is empty' });
  if (items.length > 50) return jsonResponse(400, { error: 'Too many items' });

  // Validate + build PayPal items array
  const paypalItems = [];
  let itemTotal = 0;
  for (const it of items) {
    const name = String(it.name || '').trim().slice(0, 127);
    const priceUsd = Number(it.priceUsd);
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));

    if (!name) return jsonResponse(400, { error: 'Missing item name' });
    if (!priceUsd || priceUsd <= 0) return jsonResponse(400, { error: `Invalid price for: ${name}` });
    if (priceUsd > 50000) return jsonResponse(400, { error: `Price exceeds limit: ${name}` });

    itemTotal += priceUsd * qty;
    paypalItems.push({
      name,
      description: it.sub ? String(it.sub).slice(0, 127) : undefined,
      quantity: String(qty),
      unit_amount: money(priceUsd),
      category: 'PHYSICAL_GOODS',
    });
  }

  const shipping = SHIPPING_FLAT_USD;
  const grandTotal = itemTotal + shipping;

  const lang = ['en', 'zh-CN', 'zh-TW', 'ja'].includes(payload.lang) ? payload.lang : 'en';
  const origin =
    request.headers.get('origin') ||
    (request.headers.get('referer') || '').replace(/(.*?:\/\/[^/]+).*/, '$1') ||
    `https://${request.headers.get('host') || 'example.com'}`;

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: 'maison-han-cart',
        description: 'MAISON HAN — rare pours',
        custom_id: `mh-${Date.now()}`,
        soft_descriptor: 'MAISONHAN',
        amount: {
          currency_code: 'USD',
          value: grandTotal.toFixed(2),
          breakdown: {
            item_total: money(itemTotal),
            shipping: money(shipping),
          },
        },
        items: paypalItems,
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'Maison Han',
          locale: lang === 'zh-CN' ? 'zh-CN'
                 : lang === 'zh-TW' ? 'zh-HK'
                 : lang === 'ja'    ? 'ja-JP'
                 : 'en-US',
          shipping_preference: 'GET_FROM_FILE',
          user_action: 'PAY_NOW',
          return_url: `${origin}/success.html`,
          cancel_url: `${origin}/cancel.html`,
        },
      },
    },
  };

  try {
    const order = await paypalCreateOrder(env, body);
    return jsonResponse(200, { id: order.id, status: order.status });
  } catch (err) {
    console.error('PayPal create-order error:', err);
    return jsonResponse(500, {
      error: err && err.message ? err.message : 'Failed to create PayPal order',
    });
  }
}
