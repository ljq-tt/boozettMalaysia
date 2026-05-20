// functions/index.js
// 拦截首页请求，为爬虫注入商品 OG 标签

export async function onRequestGet(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';
    const pid = url.searchParams.get('pid');

    // 没有 pid 或不是爬虫，直接放行
    const isCrawler = /facebookexternalhit|twitterbot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|googlebot|bingbot|curl|wget|python/i.test(ua);
    if (!pid || !isCrawler) return next();

    // 从 TaTa 拉商品数据
    let product = null;
    try {
        const apiBase = env.MAISON_HAN_API_BASE || 'https://api.boozett.top/prod-api';
        const res = await fetch(`${apiBase}/storefront/products`, {
            headers: { Accept: 'application/json' },
        });
        const list = await res.json();
        const arr = Array.isArray(list) ? list : (list.rows || list.data || []);
        product = arr.find(p => String(p.id) === pid || String(p.legacyId) === pid);
    } catch (e) {}

    if (!product) return next();

    const name  = (product.nameHtml || product.name || 'Maison Han').replace(/<[^>]+>/g, '');
    const desc  = product.sub || product.subText || 'A rare pour from Maison Han.';
    const image = product.imageUrl || product.image || 'https://booze-b56.pages.dev/images/hero-shelf.png';
    const price = product.priceUsd || product.price || '';
    const priceStr = price ? ` · USD ${Number(price).toLocaleString()}` : '';
    const pageUrl = `https://www.boozett.top/?pid=${pid}`;

    // 拉原始 HTML 再注入
    const original = await next();
    let html = await original.text();

    const ogTags = `
    <meta property="og:title" content="${name}${priceStr}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${name}${priceStr}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />`;

    html = html.replace('</head>', ogTags + '\n</head>');

    return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
}