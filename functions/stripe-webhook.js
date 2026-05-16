// MAISON HAN · Stripe Webhook Handler
// Route: POST /stripe-webhook

const EMAIL_COPY = {
  en: {
    subject: 'Your reservation is confirmed - Maison Han',
    eyebrow: 'Reservation confirmed',
    title: (name) => `Thank you, ${name}.`,
    sub: 'Your bottles have been set aside.',
    body: 'We have received your order and a member of our cellar team will write personally within one business day to confirm provenance, schedule insured shipment, and arrange the recipient identity check.',
    orderRef: 'Order Reference',
    amountCharged: 'Amount Charged',
    cta: 'Return to the Cellar',
    footer: (email) => `This confirmation was sent to ${email}. Questions? Reply to this email and we will respond within one business day.`,
    tagline: 'A House of Rare Pours',
  },
  'zh-CN': {
    subject: '您的预订已确认 - Maison Han',
    eyebrow: '预订已确认',
    title: (name) => `感谢您，${name}。`,
    sub: '您选中的酒款已为您预留。',
    body: '我们已收到您的订单，确认邮件已发送至您的邮箱。酒窖同事将在一个工作日内亲自回信，核对溯源信息、安排承保物流，并协调收件人身份核验。',
    orderRef: '订单编号',
    amountCharged: '扣款金额',
    cta: '返回酒窖',
    footer: (email) => `本确认邮件已发送至 ${email}。如有疑问，请直接回复本邮件，我们将在一个工作日内回复。`,
    tagline: '稀世甄选之馆',
  },
  'zh-TW': {
    subject: '您的預訂已確認 - Maison Han',
    eyebrow: '預訂已確認',
    title: (name) => `感謝您，${name}。`,
    sub: '您選中的酒款已為您預留。',
    body: '我們已收到您的訂單，確認郵件已寄至您的信箱。酒窖同事將在一個工作日內親自回信，核對溯源資訊、安排承保物流，並協調收件人身份核驗。',
    orderRef: '訂單編號',
    amountCharged: '扣款金額',
    cta: '返回酒窖',
    footer: (email) => `本確認郵件已寄至 ${email}。如有疑問，請直接回覆本郵件，我們將在一個工作日內回覆。`,
    tagline: '稀世甄選之館',
  },
  ja: {
    subject: 'ご予約確定 - Maison Han',
    eyebrow: 'ご予約確定',
    title: (name) => `ありがとうございます、${name}様。`,
    sub: 'ご選定のボトルをお取り置きしました。',
    body: 'ご注文を承りました。確認メールをお送りしています。セラーチームのスタッフが1営業日以内に直接ご連絡し、来歴の確認、保険付き配送の手配、および受取人の本人確認を行います。',
    orderRef: '注文番号',
    amountCharged: 'お支払い金額',
    cta: 'セラーに戻る',
    footer: (email) => `このメールは ${email} 宛に送信されました。ご不明な点はこのメールにご返信ください。`,
    tagline: '稀少な一杯の館',
  },
};

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
    const lang = session.metadata?.lang || 'en';

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
          lang,
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
            subject: (EMAIL_COPY[lang] || EMAIL_COPY.en).subject,
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

function buildEmailHtml({ firstName, email, sessionId, amount, currency, lang }) {
  const copy = EMAIL_COPY[lang] || EMAIL_COPY.en;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${copy.subject}</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:48px 0;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td align="center" style="padding-bottom:40px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:400;letter-spacing:0.2em;color:#292420;">MAISON HAN</p>
            <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#A07845;">${copy.tagline}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;border:1px solid rgba(41,36,36,0.09);border-radius:16px;padding:48px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <div style="width:56px;height:56px;border-radius:50%;border:1px solid rgba(160,120,69,0.35);background:rgba(160,120,69,0.06);display:inline-flex;align-items:center;justify-content:center;font-size:24px;line-height:56px;">&#10003;</div>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;text-align:center;font-family:Georgia,serif;font-size:36px;font-weight:400;color:#292420;letter-spacing:-0.01em;">${copy.eyebrow}</p>
            <p style="margin:0 0 32px;text-align:center;font-family:Georgia,serif;font-style:italic;font-size:17px;color:rgba(41,36,36,0.72);">${copy.sub}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:32px;"><div style="width:48px;height:1px;background:#A07845;margin:0 auto;"></div></td>
              </tr>
            </table>
            <p style="margin:0 0 32px;text-align:center;font-size:14px;line-height:1.8;color:rgba(41,36,36,0.72);">${copy.body}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(41,36,36,0.09);border-radius:10px;background:#FAF8F5;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#A07845;">${copy.orderRef}</p>
                  <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:rgba(41,36,36,0.72);word-break:break-all;">${sessionId}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 20px;">
                  <div style="height:1px;background:rgba(41,36,36,0.09);margin-bottom:20px;"></div>
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#A07845;">${copy.amountCharged}</p>
                  <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#292420;">${amount}</p>
                  <p style="margin:10px 0 0;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(41,36,36,0.4);">Currency — ${currency}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <a href="https://www.boozett.top" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#A07845,#7E5F38);color:#fffefb;text-decoration:none;border-radius:999px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">${copy.cta}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;text-align:center;font-family:Georgia,serif;font-style:italic;font-size:13px;color:rgba(41,36,36,0.4);line-height:1.7;">${copy.footer(email)}</p>
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
