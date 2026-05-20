// functions/contact.js
// Cloudflare Pages Function — 处理联系表单，通过 Resend 发邮件
// 环境变量需要在 Cloudflare Pages 设置：RESEND_API_KEY

export async function onRequestPost(context) {
  // 简单速率限制：同一 IP 每60秒最多3次
  const ip = context.request.headers.get('cf-connecting-ip') || 
             context.request.headers.get('x-forwarded-for') || 
             'unknown';
  const rateLimitKey = `contact_rl_${ip}`;
  try {
    const now = Date.now();
    const windowMs = 60_000;
    const maxRequests = 3;
    const stored = await context.env.RATE_LIMIT?.get(rateLimitKey);
    const record = stored ? JSON.parse(stored) : { count: 0, start: now };
    if (now - record.start > windowMs) {
      record.count = 0;
      record.start = now;
    }
    record.count++;
    await context.env.RATE_LIMIT?.put(rateLimitKey, JSON.stringify(record), { expirationTtl: 60 });
    if (record.count > maxRequests) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (e) {
    // KV 未配置时跳过速率限制，不影响主流程
  }
  const allowedOrigins = ['https://www.boozett.top', 'https://boozett.top'];
  const origin = context.request.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await context.request.json();
    const { name, email, phone, service, message, lang } = body;
    // HTML 转义，防止注入
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const safeName    = escapeHtml(name);
const safeEmail   = escapeHtml(email);
const safePhone   = escapeHtml(phone);
const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
const safeService = escapeHtml(serviceLabels[service] || service || '—');
    // 基本校验
    if (!name || !email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid input.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const RESEND_API_KEY = context.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 服务标签映射
    const serviceLabels = {
      cellar:    'Private Cellar / 私人酒窖',
      sourcing:  'Rare Sourcing / 稀有定制采购',
      tasting:   'House Tasting / 私厅品鉴',
      gift:      'Gift Concierge / 礼赠管家',
      other:     'Other / 其他',
    };
    const serviceLabel = serviceLabels[service] || service || '—';

    // 发送通知邮件到你的 Gmail
    const notifyRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MAISON HAN <orders@boozett.top>',
        to: ['almodovarbato711@gmail.com'],
        subject: `[Maison Han] New enquiry from ${name}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FAF8F5;padding:40px 32px;border:1px solid #e8ddd4;">
            <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#A07845;margin-bottom:8px;">Maison Han · New Enquiry</div>
            <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#292420;margin:0 0 24px;border-bottom:1px solid #e8ddd4;padding-bottom:20px;">
              ${name}
            </h1>
            <table style="width:100%;font-family:'Helvetica Neue',sans-serif;font-size:14px;border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0e8df;color:#999;width:120px;vertical-align:top;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0e8df;color:#292420;">
                  <a href="mailto:${email}" style="color:#A07845;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0e8df;color:#999;vertical-align:top;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0e8df;color:#292420;">${phone || '—'}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0e8df;color:#999;vertical-align:top;">Service</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0e8df;color:#292420;">${serviceLabel}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#999;vertical-align:top;">Message</td>
                <td style="padding:10px 0;color:#292420;line-height:1.6;">${(message || '—').replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
            <div style="margin-top:32px;font-family:'Helvetica Neue',sans-serif;font-size:11px;color:#bbb;letter-spacing:0.2em;text-transform:uppercase;border-top:1px solid #e8ddd4;padding-top:20px;">
              Maison Han · A House of Rare Pours · boozett.top
            </div>
          </div>
        `,
      }),
    });

    if (!notifyRes.ok) {
      const err = await notifyRes.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 发送确认邮件给用户
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MAISON HAN <orders@boozett.top>',
        to: [email],
        subject: lang === 'zh-CN' || lang === 'zh-TW'
          ? '您的引荐申请已收到 · MAISON HAN'
          : 'Your enquiry has been received · MAISON HAN',
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FAF8F5;padding:40px 32px;border:1px solid #e8ddd4;">
            <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#A07845;margin-bottom:8px;">Maison Han</div>
            <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#292420;margin:0 0 20px;">
              ${lang === 'zh-CN' || lang === 'zh-TW' ? '您的申请已收到。' : 'Your enquiry is received.'}
            </h1>
            <p style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#6b6258;line-height:1.7;margin:0 0 24px;">
              ${lang === 'zh-CN' || lang === 'zh-TW'
                ? '感谢您联系本馆。我们的管家团队将在 1-2 个工作日内与您联系。'
                : 'Thank you for reaching out to Maison Han. Our concierge team will be in touch within 1–2 business days.'}
            </p>
            <div style="border-top:1px solid #e8ddd4;padding-top:20px;font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#aaa;letter-spacing:0.15em;">
              <em style="font-family:Georgia,serif;font-style:italic;color:#8a7d72;">Maison Han</em> · A House of Rare Pours
            </div>
          </div>
        `,
      }),
    }).catch(() => {}); // 确认邮件失败不影响主流程

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err) {
    console.error('Contact function error:', err);
    return new Response(JSON.stringify({ error: 'Server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
