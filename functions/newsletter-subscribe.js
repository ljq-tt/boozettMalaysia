// MAISON HAN �� Newsletter Subscribe
// Route: POST /newsletter-subscribe

export async function onRequestPost(context) {
  // 速率限制：同一 IP 每60秒最多5次
  const ip = context.request.headers.get('cf-connecting-ip') ||
             context.request.headers.get('x-forwarded-for') ||
             'unknown';
  try {
    const now = Date.now();
    const stored = await context.env.RATE_LIMIT?.get(`news_rl_${ip}`);
    const record = stored ? JSON.parse(stored) : { count: 0, start: now };
    if (now - record.start > 60_000) { record.count = 0; record.start = now; }
    record.count++;
    await context.env.RATE_LIMIT?.put(`news_rl_${ip}`, JSON.stringify(record), { expirationTtl: 60 });
    if (record.count > 5) {
      return json(429, { error: 'Too many requests.' });
    }
  } catch (e) {}
  const { request, env } = context;
  const resendKey = env.RESEND_API_KEY;
  const audienceId = '7d7c2225-7b04-4c60-af3e-4e5ee1e282ce';

  if (!resendKey) {
    return json(500, { error: 'Missing RESEND_API_KEY' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return json(400, { error: 'Invalid email' });
  }

  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          unsubscribed: false,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return json(res.status, { error: data.message || 'Failed to subscribe' });
    }

    return json(200, { success: true });
  } catch (err) {
    return json(500, { error: 'Internal error' });
  }
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ['https://www.boozett.top','https://boozett.top'].includes(
      context.request.headers.get('Origin') || ''
    ) ? (context.request.headers.get('Origin') || 'https://www.boozett.top') : 'https://www.boozett.top',
    },
  });
}
