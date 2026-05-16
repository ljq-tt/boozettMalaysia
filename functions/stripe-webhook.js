// MAISON HAN · Stripe Webhook Handler
// Route: POST /stripe-webhook

export async function onRequestPost(context) {
  const { request, env } = context;

  const secretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const resendKey = env.RESEND_API_KEY;

  if (!secretKey || !webhookSecret) {
    return json(500, { error: 'Missing environment variables' });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return json(400, { error: 'Missing stripe-signature header' });
  }

  const rawBody = await request.text();

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || '';
    const existingCustomerId = session.customer;
    const sessionId = session.id;
    const amountTotal = session.amount_total;
    const currency = session.currency?.toUpperCase() || 'USD';

    // ── 1. 建档逻辑（原有）──
    if (email && !existingCustomerId) {
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
              name,
              metadata: JSON.stringify({ source: 'maison-han-webhook' }),
            }).toString(),
          });
          const createData = await createRes.json();
          customerId = createData.id;
        }

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

    // ── 2. 发确认邮件 ──
    if (email && resendKey) {
      try {
        const amount = amountTotal
          ? (amountTotal / 100).toLocaleString('en-US', {
              style: 'currency',
              currency,
            })
          : '—';

        const firstName = name ? name.split(' ')[0] : 'Valued Guest';
        const html = buildEmailHtml({
          firstName,
          email,
          sessionId,
          amount,
          currency,
        });

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MAISON HAN <orders@boozett.top>',
            to: [email],
            subject: 'Your reservation is confirmed · Maison Han',
            html,
          }),
        });

        const emailData = await emailRes.json();
        console.log('Email sent:', emailData.id || emailData);
      } catch (err) {
        console.error('Email sending failed:', err);
      }
    }
  }

  return json(200, { received: true });
}

export async function onRequestGet() {
  return json(200, { ok: true, route: '/stripe-webhook' });
}

function buildEmailHtml({ firstName, email, sessionId, amount, currency }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Reservation confirmed · Maison Han</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:48px 0;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td align="center" style="padding-bottom:40px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:400;letter-spacing:0.2em;color:#292420;">MAISON HAN</p>
            <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#A07845;">A House of Rare Pours</p>
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;border:1px solid rgba(41,36,36,0.09);border-radius:16px;padding:48px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <div style="width:56px;height:56px;border-radius:50%;border:1px solid rgba(160,120,69,0.35);background:rgba(160,120,69,0.06);display:inline-flex;align-items:center;justify-content:center;font-size:24px;line-height:56px;">?</div>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;text-align:center;font-family:Georgia,serif;font-size:36px;font-weight:400;color:#292420;letter-spacing:-0.01em;">Thank you, ${firstName}.</p>
            <p style="margin:0 0 32px;text-align:center;font-family:Georgia,serif;font-style:italic;font-size:17px;color:rgba(41,36,36,0.72);">Your bottles have been set aside.</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:32px;"><div style="width:48px;height:1px;background:#A07845;margin:0 auto;"></div></td>
              </tr>
            </table>
            <p style="margin:0 0 32px;text-align:center;font-size:14px;line-height:1.8;color:rgba(41,36,36,0.72);">We have received your order and a member of our cellar team will write personally within one business day to confirm provenance, schedule insured shipment, and arrange the recipient identity check.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(41,36,36,0.09);border-radius:10px;background:#FAF8F5;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#A07845;">Order Reference</p>
                  <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:rgba(41,36,36,0.72);word-break:break-all;">${sessionId}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 20px;">
                  <div style="height:1px;background:rgba(41,36,36,0.09);margin-bottom:20px;"></div>
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#A07845;">Amount Charged</p>
                  <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#292420;">${amount}</p>
                  <p style="margin:10px 0 0;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(41,36,36,0.4);">Currency · ${currency}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <a href="https://www.boozett.top" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#A07845,#7E5F38);color:#fffefb;text-decoration:none;border-radius:999px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">Return to the Cellar</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;text-align:center;font-family:Georgia,serif;font-style:italic;font-size:13px;color:rgba(41,36,36,0.4);line-height:1.7;">This confirmation was sent to ${email}.<br/>Questions? Reply to this email and we will respond within one business day.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:32px;">
            <p style="margin:0;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:rgba(41,36,36,0.35);">? MMXXVI MAISON HAN · Drink with intention</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

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
