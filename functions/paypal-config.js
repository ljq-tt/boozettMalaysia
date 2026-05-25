// MAISON HAN - PayPal client config for the storefront SDK
// Route: GET /paypal-config
// Returns the public client id + environment so the browser can load
// the PayPal JS SDK without hardcoding the id in HTML.

export async function onRequestGet(context) {
  const { env } = context;
  const clientId = String(env.PAYPAL_CLIENT_ID || '').trim();
  const mode = String(env.PAYPAL_ENV || 'live').toLowerCase() === 'sandbox'
    ? 'sandbox'
    : 'live';

  if (!clientId) {
    return new Response(
      JSON.stringify({ enabled: false, error: 'PAYPAL_CLIENT_ID not set' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ enabled: true, clientId, env: mode, currency: 'USD' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}
