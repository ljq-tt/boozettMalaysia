// MAISON HAN ¡¤ Newsletter Subscribe
// Route: POST /newsletter-subscribe

export async function onRequestPost(context) {
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
      'Access-Control-Allow-Origin': '*',
    },
  });
}
