// MAISON HAN — Stripe Webhook Handler
// Route: POST /stripe-webhook
// 处理支付成功事件，确保买家成为正式 Customer

export async function onRequestPost(context) {
  const { request, env } = context;

  const secretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return json(500, { error: 'Missing environment variables' });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return json(400, { error: 'Missing stripe-signature header' });
  }

  // 读取原始 body（验签用）
  const rawBody = await request.text();

  // 验证 Stripe 签名
  const verified = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!verified) {
    return json(400, { error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  // 只处理支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const existingCustomerId = session.customer;

    if (email && !existingCustomerId) {
      // 访客支付 → 创建正式 Customer
      try {
        const searchRes = await fetch(
          `https://api.stripe.com/v1/customers/search?query=email:'${email.replace(/'/g, "\\'")}'&limit=1`,
          { headers: { Authorization: `Bearer ${secretKey}` } }
        );
        const searchData = await searchRes.json();

        let customerId;
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id;
        } else {
          const createRes = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              email,
              name: session.customer_details?.name || '',
              metadata: JSON.stringify({ source: 'maison-han-webhook' }),
            }).toString(),
          });
          const createData = await createRes.json();
          customerId = createData.id;
        }

        // 把 Customer 关联到这个 session 的支付记录
        if (customerId && session.payment_intent) {
          await fetch(`https://api.stripe.com/v1/payment_intents/${session.payment_intent}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ customer: customerId }).toString(),
          });
        }

        console.log(`Customer created/linked: ${customerId} for ${email}`);
      } catch (err) {
        console.error('Customer creation failed:', err);
      }
    }
  }

  return json(200, { received: true });
}

export async function onRequestGet() {
  return json(200, { ok: true, route: '/stripe-webhook' });
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Stripe 签名验证（使用 Web Crypto API，Cloudflare Workers 支持）
async function verifyStripeSignature(payload, signature, secret) {
  try {
    const parts = signature.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts['t'];
    const sig = parts['v1'];
    if (!timestamp || !sig) return false;

    // 防重放：时间戳不能超过5分钟
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const computed = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signedPayload)
    );
    const computedHex = Array.from(new Uint8Array(computed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedHex === sig;
  } catch {
    return false;
  }
}
