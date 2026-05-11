# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MAISON HAN — a premium spirits e-commerce storefront (luxury baijiu, whisky, wine, cognac). Static HTML + vanilla JS frontend with Cloudflare Pages Functions backend and Stripe payment processing.

## Development Commands

```bash
# Install dependencies
npm install

# Local dev server (Cloudflare Pages)
npm run pages:dev

# Deploy to Cloudflare Pages
npm run pages:deploy

# Install without dev dependencies (for CF Pages build)
npm run cf-pages-install
```

Local dev requires a `.dev.vars` file with `STRIPE_SECRET_KEY=sk_test_...` for the Cloudflare Pages dev server.

## Architecture

**Frontend:** Single-page storefront in `index.html` (3500+ lines). All product display, cart logic, i18n (10 languages), and currency switching are inline. No build step, no framework.

**Backend:** Serverless functions with two parallel implementations:
- `functions/` — Cloudflare Pages Functions (primary deployment)
- `netlify/functions/` — Netlify Functions (backup deployment)

Both implementations share the same logic but differ in handler signatures.

**Key data flow:**
1. `GET /list-products` fetches products from TaTa backend → Stripe API → static `catalog.json` (fallback chain)
2. `POST /create-checkout-session` validates cart items against Stripe, creates a Checkout Session, returns redirect URL
3. Frontend handles cart in localStorage, calls these two endpoints

**Stripe integration:** `functions/_lib/stripeRest.js` is a pure REST wrapper (no npm `stripe` package at runtime) so Cloudflare Pages can bundle without `npm install`. The npm `stripe` package is only used by Netlify functions.

## Environment Variables

- `STRIPE_SECRET_KEY` (required) — Stripe API key
- `MAISON_HAN_API_BASE` (optional) — TaTa backend URL with context path, no trailing slash
- `STATIC_CATALOG` (optional) — set to `1`/`true`/`yes` to force static catalog.json
- `PRODUCT_IMAGE_BASE` (optional) — prefix for relative image URLs

## Product Management

Products are managed in Stripe Dashboard. Required metadata fields on each product:
- `maison_han=true` and `maison_han_id` > 0 (for filtering)
- `cat` (category: baijiu/whisky/wine/cognac/sparkling)
- `sort_order` (display ordering)

Full metadata reference is in README.md.

## Deployment

- **Cloudflare Pages** (primary): functions auto-deploy from `functions/` directory
- **Netlify** (backup): functions from `netlify/functions/`, redirects in `netlify.toml`

Both serve static files from the repo root (no build output directory).

## Key Constraints

- Node.js ≥18 required
- The Cloudflare functions intentionally avoid importing the npm `stripe` package — they use the REST wrapper in `_lib/stripeRest.js`
- Shipping is fixed at $50 USD to 26 supported countries
- Product list has a 60-second server-side cache
- All prices are in USD (Stripe handles currency conversion at checkout)
