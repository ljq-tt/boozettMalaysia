// functions/_middleware.js
// 拦截爬虫请求，动态注入商品 OG 标签与首页 ItemList Schema

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';

  const isCrawler = /facebookexternalhit|twitterbot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|googlebot|bingbot|curl|wget|python|yandex|baidu|duckduck/i.test(ua);
  const isHome = url.pathname === '/' || url.pathname === '/index.html';

  // 非首页直接放行
  if (!isHome) return next();

  // 有 pid 参数走原来的产品 OG 逻辑
  const pid = url.searchParams.get('pid');
  if (pid && isCrawler) {
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

    if (product) {
      const name = (product.nameHtml || product.name || 'Maison Han').replace(/<[^>]+>/g, '');
      const desc = product.sub || product.subText || 'A rare pour from Maison Han.';
      const image = product.imageUrl || product.image || 'https://www.boozett.top/images/hero-shelf.png';
      const price = product.priceUsd || product.price || '';
      const priceStr = price ? ` · USD ${Number(price).toLocaleString()}` : '';
      const pageUrl = `https://www.boozett.top/?pid=${pid}`;

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
        <meta name="twitter:image" content="${image}" />
      `;
      html = html.replace('</head>', ogTags + '</head>');
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }
  }

  // 首页爬虫访问：注入完整产品 Schema
  if (isCrawler) {
    let products = [];
    try {
      const apiBase = env.MAISON_HAN_API_BASE || 'https://api.boozett.top/prod-api';
      const res = await fetch(`${apiBase}/storefront/products`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      products = Array.isArray(data) ? data : (data.rows || data.data || []);
    } catch (e) {}

    if (products.length > 0) {
      const itemList = products.slice(0, 20).map((p, i) => {
        const name = (p.nameHtml || p.name || '').replace(/<[^>]+>/g, '');
        const image = p.imageUrl || p.image || '';
        const price = p.priceUsd || p.price || 0;
        const pid = p.id || p.legacyId;
        return {
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "Product",
            "@id": `https://www.boozett.top/?pid=${pid}`,
            "name": name,
            "description": p.sub || p.subText || '',
            "image": image.startsWith('http') ? image : `https://www.boozett.top/${image}`,
            "sku": `MH-${p.no || pid}`,
            "brand": {
              "@type": "Brand",
              "name": p.catLabel || 'Maison Han'
            },
            "offers": {
              "@type": "Offer",
              "url": `https://www.boozett.top/?pid=${pid}`,
              "priceCurrency": "USD",
              "price": String(price),
              "availability": "https://schema.org/InStock",
              "seller": { "@id": "https://www.boozett.top/#organization" }
            }
          }
        };
      });

      const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Featured Collection — Maison Han",
        "url": "https://www.boozett.top/",
        "itemListElement": itemList
      };

      const original = await next();
      let html = await original.text();
      html = html.replace(
        '</head>',
        `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>\n</head>`
      );
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }
  }

  return next();
}
