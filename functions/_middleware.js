// functions/_middleware.js
// 拦截爬虫请求，动态注入商品 OG 标签

export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';
  
    // 只对爬虫注入 OG，普通用户直接放行
    const isCrawler = /facebookexternalhit|twitterbot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|googlebot|bingbot|curl|wget|python/i.test(ua);
  
    // 只处理首页（带 #/product/ 的分享链接）
    const isHome = url.pathname === '/' || url.pathname === '/index.html';
  
    if (!isCrawler || !isHome) {
      return next();
    }
  
    // 从 hash 里拿不到（爬虫不执行 JS），改用 ?pid= 参数
    const pid = url.searchParams.get('pid');
    if (!pid) return next();
  
    // 从 TaTa 拉商品数据
    let product = null;
    try {
      const apiBase = env.MAISON_HAN_API_BASE || 'https://api.boozett.top/prod-api';
      const res = await fetch(`${apiBase}/storefront/products`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.rows || data.data || []);
      product = list.find(p => String(p.id) === String(pid) || String(p.legacyId) === String(pid));
    } catch (e) {}
  
    if (!product) return next();
  
    const name = (product.nameHtml || product.name || 'Maison Han').replace(/<[^>]+>/g, '');
    const desc = product.sub || product.subText || 'A rare pour from Maison Han.';
    const image = product.imageUrl || product.image || 'https://booze-b56.pages.dev/images/hero-shelf.png';
    const price = product.priceUsd || product.price || '';
    const priceStr = price ? ` · USD ${Number(price).toLocaleString()}` : '';
    const pageUrl = `https://www.boozett.top/?pid=${pid}`;
  
    // 拉原始 HTML
    const original = await next();
    let html = await original.text();
  
    // 注入 OG 标签（替换已有的 og:title 等）
    const ogTags = `
      <meta property="og:title" content="${name}${priceStr}" />
      <meta property="og:description" content="${desc}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:url" content="${pageUrl}" />
      <meta property="og:type" content="product" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${name}${priceStr}" />
      <meta name="twitter:description" content="${desc}" />
      <meta name="twitter:image" content="${image}" />
    `;
  
    html = html.replace('</head>', ogTags + '</head>');
  
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  }