# MAISON HAN — 烈酒独立站

一个静态 HTML 商店 + 一个 Netlify Function 收 Stripe。
单瓶客单价 ¥3 千到 4 万的高端烈酒站，**真能下单收钱**。

---

## 当前状态

```
酒水独立站1/
├── index.html                              ← 主站（2300 行，独立装好）
├── success.html                            ← 支付成功页
├── cancel.html                             ← 支付取消页
├── package.json                            ← stripe 依赖
├── netlify.toml                            ← Netlify 配置
├── README.md                               ← 本文件
├── images/                                 ← 12 张商品图本地化
└── netlify/
    └── functions/
        └── create-checkout-session.js      ← 后端：调 Stripe API 创建 Session
```

**已经能做：** 12 件商品展示 · 多语言（en/zh-CN/zh-TW/ja/ko/fr/es/vi/th/ar）· 多币种显示 · 加购物车 · 年龄确认 · 跳转 Stripe 托管支付页 · 成功/取消页

**还没做：** 库存管理 · 订单后台 · 邮件自动通知（暂时靠 Stripe 邮件）· 真品溯源/扫码验证

---

## 上线四步走

### Step 1：注册 Stripe（5 分钟）

1. 去 https://dashboard.stripe.com/register
2. 邮箱注册，**先不用填公司信息**——拿到测试密钥就够先跑通
3. 登录后右上角默认是 **Test mode**（开关，不要切到 Live）
4. 左侧菜单 → **Developers** → **API keys**
5. 复制两个值：
   - **Publishable key**：`pk_test_51...`（前端可见，没事）
   - **Secret key**：点 "Reveal test key"，复制 `sk_test_51...`（**绝不能进 HTML/Git**）

> ⚠️ **酒水生意提醒**：Stripe 把酒精饮料列为 Restricted Business。Test mode 随便用，但要**切到 Live mode 收真钱前**必须在 Dashboard → **Settings** → **Business** 里完成 KYC，并向 Stripe 申请酒类业务审核（提交牌照）。审核通过前 Live 模式会拒绝你的所有支付。

### Step 2：部署到 Netlify（5 分钟）

#### 选项 A · 最快：拖文件夹（Netlify Drop）

1. 把整个 `酒水独立站1` 文件夹拖到 https://app.netlify.com/drop
2. 等 30 秒，拿到一个域名 `https://random-name-12345.netlify.app`
3. **此时 Function 已经被检测到但缺密钥**——下一步配置

#### 选项 B · 推荐长期方案：Git → Netlify

```bash
git init
git add .
git commit -m "initial"
git remote add origin <你的 GitHub 仓库>
git push -u origin main
```

然后在 Netlify 控制台 → **Add new site** → **Import from Git** → 选这个仓库。
之后每次 `git push`，Netlify 自动重新部署。

### Step 3：环境变量（2 分钟）

部署完成后，在 Netlify → **Site configuration** → **Environment variables** 配置：

| 变量 | 说明 |
|------|------|
| `STRIPE_SECRET_KEY` | `sk_test_...`，结账 Function 必需 |
| `MAISON_HAN_API_BASE` | （可选）TaTa **对外访问根地址**，**不要尾斜杠**。须与管理后台前端请求的 API 前缀一致：若依生产常见 **`/prod-api`**，则应填 **`https://你的域名/prod-api`**（不能只填域名否则会得到 **404**）。本地直连 Tomcat 且 `context-path` 为 `/` 时可填 `http://IP:8080`。目录接口：`GET {BASE}/storefront/products`。 |

保存后到 **Deploys** → **Trigger deploy**，让 Function 读到新变量。

TaTa 侧需先执行 `TaTa/sql/mh_storefront_product.sql` 建表并在表中维护 `stripe_price_id` 等字段；结账仍走 Stripe，Stripe 里对应 Product 建议保留 `metadata.maison_han=true` 以便 `create-checkout-session` 校验通过。

### Step 4：用测试卡跑一遍真实流程

1. 打开你的 Netlify 站
2. 点 "Reserve" 加几瓶到购物车
3. 打开购物车 → 勾上 "I am 21+" → 点 **Proceed to Checkout**
4. 跳转到 Stripe 托管支付页
5. 用以下任一**测试卡**：

| 场景 | 卡号 | CVC | 过期 |
|---|---|---|---|
| 成功支付 | `4242 4242 4242 4242` | 任意 3 位 | 未来任意月份 |
| 需要 3DS 验证 | `4000 0027 6000 3184` | 任意 | 未来 |
| 失败：余额不足 | `4000 0000 0000 9995` | 任意 | 未来 |
| 失败：卡被拒 | `4000 0000 0000 0002` | 任意 | 未来 |

地址随便填、邮箱填你自己的（会收到 Stripe 的 receipt 邮件）。

6. 成功后会跳到 `/success.html` 显示订单号
7. Stripe Dashboard → **Payments** 能看到这笔测试支付

---

## Cloudflare Pages 部署（与本仓库 `functions/`）

本站静态页请求 **`GET /list-products`**、**`POST /create-checkout-session`**，由仓库根目录 **`functions/*.js`**（Pages Functions）提供，与 Netlify 的 `/.netlify/functions/...` 等价。

### 商品不显示 / 一直 Loading — 按顺序自查

1. **先用浏览器打开** `https://你的域名/list-products`  
   - 应是 **JSON 数组** `[...]`。  
   - 若是 **`{"error":"..."}`**：按文案处理（多为未配置密钥或 Stripe/TaTa 报错）。  
   - 若是 **404 HTML**：说明 **Pages Functions 未生效**（见下条）。

2. **`404 Not Found`（`/storefront/products`）**  
   - **九成是 `MAISON_HAN_API_BASE` 少了 context-path。** 若依生产前端一般用 **`/prod-api`**（见 `RuoYi-Vue3/.env.production`），则 BASE 必须是 **`https://你的域名/prod-api`**，完整接口：`https://你的域名/prod-api/storefront/products`。  
   - **自检**：浏览器 Network 里登录请求若是 **`/dev-api/login`**，那是 **本地开发**：Vite 会把 `/dev-api` **去掉**再转发到后端，Spring 实际路径仍是 **`/login`**（且 `application.yml` 里多为 **`context-path: /`**）。  
     **Cloudflare Worker 不能访问你电脑上的 `/dev-api`**，须填 TaTa **真实地址**：例如内网穿透/`ngrok` 的 **`https://xxx.ngrok.io`**（无 `/dev-api`），或服务器上的 **`https://域名/prod-api`**（生产常见，见 `.env.production`）。  
   - 若生产环境 Network 里是 **`/prod-api/login`**，则 **`MAISON_HAN_API_BASE = https://你的域名/prod-api`**。

3. **确认 Cloudflare 用的是「含 Functions 的部署」**  
   - 项目 **Root directory** 须指向含 **`index.html` + `functions/`** 的这一层（即本仓库 `酒水独立站` 根）。  
   - 推荐 **Git 集成** 或 `wrangler pages deploy`。纯「只上传静态文件」且未带上 `functions` 时，`/list-products` 会 404。

4. **环境变量**（Dashboard → **Workers & Pages** → 项目 → **Settings** → **Variables**）  
   | 变量 | 说明 |
   |------|------|
   | **`MAISON_HAN_API_BASE`** | （可选）TaTa **HTTPS + context-path**，无尾斜杠。若设置，列表走 TaTa。 |
   | **`STRIPE_SECRET_KEY`** | （可选）未设 TaTa、`STATIC_CATALOG` 亦非真时启用；Stripe 中带 `metadata.maison_han` 的商品。**结账**同样需要此变量。 |
   | **`STATIC_CATALOG`** | 设为 **`1`** 或 **`true`** 时，**一律**读取站点根路径 **`catalog.json`**，与 TaTa / Stripe 目录无关——适合「先不接管理系统、只展示橱窗」同时又保留 Stripe 密钥做结账准备。 |
   | **`PRODUCT_IMAGE_BASE`** | （可选）商品图为 `/profile/...` 时，填图片同源前缀。 |

   **不写 TaTa、也不写 Stripe密钥** 时：`/list-products` 会尝试 **同域静态** `GET /catalog.json`（需在仓库根与 `index.html` 一并部署）。

   改完后 **重新部署** 一次，使 Workers 读到新变量。

5. **Stripe 目录为空数组 `[]`**（接口 200 但站上像「没商品」）  
   - 商品需 **`metadata.maison_han`** = `true` / `1` / `yes`。  
   - **`metadata.maison_han_id`** 为正整数（与前端 `id` 对应）。  
   - 至少一条 **`active` 的 one-time USD Price**。  
   - 列表有约 **60 秒缓存**，改 Stripe 后稍等再硬刷新。

6. **走 TaTa 时**  
   - 公网须能访问 **`GET .../storefront/products`**（防火墙放行 Cloudflare 出口 IP 段或先放宽测试）。  
   - 返回需为 **数组**；每条含 **`id`、`priceId`（或后端映射字段）** 等，与 `list-products.js` 里过滤逻辑一致。

### 前端提示（已改进）

- 接口报错时，典藏区会显示 **简短错误原文**（便于区分缺密钥、Stripe 报错等）。  
- 接口成功但 **`[]`** 时，会显示 **空目录说明**（中/英），不再卡在 Loading。

---

## 切到真实收款

测试跑通后，切 Live 模式步骤：

1. Stripe Dashboard 完成 KYC + 申请酒类业务审核（可能要 1–2 周，需要提交营业执照、酒类经营许可证、银行账户）
2. 审核通过后，Dashboard 右上角切到 **Live mode**
3. **Developers** → **API keys** → 拿 `sk_live_...`
4. Netlify 环境变量里把 `STRIPE_SECRET_KEY` 改成 `sk_live_...`
5. **Trigger deploy**
6. 用真卡测一笔 1 美元订单，确认到账后再宣传开张

---

## 改价格 / 加 / 删商品

**若已配置 `MAISON_HAN_API_BASE`：** 商品列表以 **TaTa** 数据库为准（运行时拉接口），在管理端或直连库维护；Stripe 仍用于收款，`stripe_price_id` 需与 Dashboard 里 Price 一致，`metadata.maison_han` 建议保持为 `true` 以便结账校验。

**若未配置：** 仍只从 **Stripe Products** 拉列表（`metadata.maison_han='true'`），改 Dashboard 即可。

### 加新商品

1. 进 https://dashboard.stripe.com/test/products （Live 模式审核通过后改 `/products`）
2. 点 **"+ Add product"**
3. 填：
   - **Name**：商品名（纯文本，比如 `Hibiki 30 Years Old`）
   - **Description**：详情页那段长描述
   - **Image**：拖一张图上传（Stripe 自己托管）
   - **Price**：USD 整数 + 选 "One time"
4. **重点：填 metadata**（页面下方 "Advanced options" → "Metadata"）—— 这些字段决定商品在你站上怎么显示：

| Key | Value 例子 | 说明 |
|---|---|---|
| `maison_han` | `true` | **必填**，标记为本站商品（不填的不会显示）|
| `maison_han_id` | `113` | **必填**，没用过的数字，用作前端引用 ID |
| `cat` | `whisky` | 品类：`baijiu`（白酒大类）/`whisky`（威士忌大类，含苏格兰与日本等）/`wine`/`sparkling`/`cognac` |
| `cat_label` | `Japanese Whisky` | 商品卡上方品类小字 |
| `bv` | `bv-japan` | 视觉风格类，跟着 cat 走（`bv-` + cat） |
| `bottle` | `hibiki-30` | 图片加载失败时的 SVG 兜底标识 |
| `name_html` | `Hibiki <em>30</em> Years Old` | 商品名（数字部分用 `<em>` 包起来会斜体） |
| `sub` | `Suntory · 30 years` | 商品卡副标题 |
| `display_no` | `199` | 商品卡左上角的"序号"装饰 |
| `abv` | `43% ABV` | 酒精度 |
| `vol` | `700 ml` | 容量 |
| `origin` | `Yamazaki, Japan` | 产地 |
| `year` | `2024 release` | 年份/批次 |
| `sort_order` | `13` | 商品排序权重，数字越小越靠前 |
| `badge` | `Limited` | 可选，商品卡右上角徽章文字 |

5. 点 **Save product**
6. **等约 60 秒**（`list-products` 服务端缓存）；在浏览器里对你站点 **Ctrl+F5 硬刷新** 再试

### 新商品在站上不显示？按这个清单查

| 检查项 | 说明 |
|---|---|
| **`maison_han` 必须有** | 值写成 `true`（小写）最稳；`1` / `yes` 也可以。写成 `True` 或漏空格后以前会出问题——现已兼容，但仍建议 `true` |
| **`maison_han_id` 必须是新数字** | 例如已有 101–112，新商品填 `113`。**不能空、不能和已有重复**。空或 0 的商品会被 API 直接丢掉 |
| **价格必须是一次性 USD** | Pricing 里选 **One time**，币种 **USD**。订阅价（Recurring）结账会拒收 |
| **商品状态 Active** | 详情页右上角不能是 Archived |
| **价格状态 Active** | 价格被 Archive 了也不会出现在列表里 |
| **在 Stripe 里没找到「默认价格」** | 代码已支持：只要商品下有一条**在用的 One-time USD 价**，即使用户没点「Set as default」，也会显示 |
| **没在「全部」里找** | `cat` 必须是小写英文：`japan` 而不是 `Japanese`。填错时商品只在 **Filter → All** 下归类到 `other`，在「日威」Tab 里看不到 |
| **Netlify 没重新部署** | 若你改的是**本地** `list-products.js`，必须重新拖部署；只改 Stripe 不用部署 |
| **用 JSON 自检** | 浏览器打开 `https://你的站.netlify.app/.netlify/functions/list-products` —— 看返回的 JSON 里有没有你的 `maison_han_id`。没有就是上面某条没过 |

### 改价格

⚠ Stripe 的 Price 一旦创建就**不能修改 unit_amount**——这是 Stripe 的设计（保证账单可审计）。

要改价格：
1. 进商品详情页 → 找现有 Price → **Archive**（停用）
2. 添加 **New price** → 填新金额 → **Save**
3. 把新 Price 设为 **Default price**

### 下架商品

商品详情页右上角 → **Archive product** → 商品在 Stripe 还在，但 `active=false`，前端 `list-products` 自动过滤掉，站上不再显示。

### 删除商品

Stripe 不支持完全删除已有 Price 的商品（会留有交易记录）。**Archive 等同于删除**（不显示、不可购买）。

---

## 数据流（理解一下整套架构）

```
你 → Stripe Dashboard 改商品
        ↓ Stripe Products + Prices
        ↓
前端 fetch /list-products（缓存 60s）
        ↓
访客看到商品 → 加购物车 → 点 Checkout
        ↓
前端把 cart 转成 [{priceId, qty}] → POST /create-checkout-session
        ↓
后端再次校验每个 priceId 是不是本站合法商品 → 调 Stripe 建 Session
        ↓
Stripe 托管支付页（带商品图、描述、自动税）
        ↓
用户付完 → 跳回 success.html
```

**安全要点**：
- 前端**永远不发送价格金额**给后端，只发 priceId
- 后端**绝不信任 priceId 来自前端**——必查 Stripe 现有商品表，不在表里就拒绝
- 即使有人改前端 JS 想 1 块钱买茅台，他能伪造的最多就是别的合法 Price ID，仍然按 Stripe 真实价格收

---

## 常见问题

**Q：访客显示 EUR/JPY/CNY 价格，但 Stripe 收的是 USD，会被投诉吗？**
A：购物车里有醒目说明 "All charges processed in USD"。这是高端烈酒站的标准做法（Whisky Exchange、Cask Cartel 都这样）。如要按访客币种实收，需要为每种货币单独建 Stripe Session 并维护汇率表（汇率波动风险转移到你身上）。

**Q：`STRIPE_SECRET_KEY` 安全吗？**
A：它在 Netlify 环境变量里，只在 Function 运行时（服务端 Node 进程）能读到，**绝不会出现在 HTML / 浏览器 / Git**。前端只跟 `/.netlify/functions/create-checkout-session` 通信，永远拿不到密钥。

**Q：用户跳到 Stripe 然后取消，购物车还在吗？**
A：在。购物车现在写进 `localStorage`，刷新和跳转都不丢。

**Q：图片版权问题怎么办？**
A：现在 `images/` 里 12 张图是从 caskcartel.com / dekanta.com 下载的，**法律上仍归原网站/品牌方所有**。正式上线前必须换成：（1）你自己拍的；（2）品牌方官方素材库（Suntory Press、Edrington Media、LVMH Press 等，向品牌方申请）；或（3）找替代抽象瓶型 SVG/CSS。

**Q：Netlify 免费层够用吗？**
A：免费层 100GB 流量/月 + 125k Function 调用/月。一笔下单约 1 次 Function 调用，单月 12 万订单是免费层极限——你应该早就该升 Pro 了 😄

---

## 退到本地预览

直接双击 `index.html` 在浏览器打开就能看到主站效果。
**但 Checkout 按钮在本地双击模式下不工作**——因为没有 Function 服务器。
本地完整测试要装 Netlify CLI：

```bash
npm install -g netlify-cli
netlify dev
```

然后访问 http://localhost:8888，会有完整 Function 行为（也能用测试卡）。
注意：本地需要 `.env` 文件包含 `STRIPE_SECRET_KEY=sk_test_...`
