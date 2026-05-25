// MAISON HAN - Capture a PayPal order (Cloudflare Pages Function)
// Route: POST /capture-paypal-order  body: { orderID: "..." }

import { paypalCaptureOrder } from './_lib/paypalRest.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch (_e) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const orderID = String(payload.orderID || payload.orderId || '').trim();
  if (!orderID) return jsonResponse(400, { error: 'Missing orderID' });

  try {
    const result = await paypalCaptureOrder(env, orderID);
    const capture = result?.purchase_units?.[0]?.payments?.captures?.[0] || null;
    const payer = result?.payer || null;

    return jsonResponse(200, {
      id: result.id,
      status: result.status,
      captureId: capture?.id || null,
      amount: capture?.amount || null,
      payerEmail: payer?.email_address || null,
      payerName: payer?.name
        ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim()
        : null,
    });
  } catch (err) {
    console.error('PayPal capture error:', err);
    return jsonResponse(500, {
      error: err && err.message ? err.message : 'Failed to capture PayPal order',
    });
  }
}
