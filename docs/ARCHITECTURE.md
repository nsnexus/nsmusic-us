# NS Music US architecture

Independent Next.js 15 / React 18 app with JavaScript application code. Cloudflare Workers through OpenNext replaces the deprecated Pages/next-on-pages adapter in this copy. A tiny context bridge preserves legacy admin binding access. The original Brazil checkout/deployment remains separate.

## Customer flow
English story → chosen US sound → AI lyrics reviewed/edited → private unpaid order + random HttpOnly ownership cookie → fixed-price USD Stripe Checkout → independent server verification → atomic SQL fulfillment + cumulative rights → atomic generation reservation → Kie job → independently queried webhook/polling result → private R2 archive → protected audio and gift workspace.

Payment precedes music generation in this edition. Lyric drafting can be reviewed before payment. Stripe events and customer return checks converge on the same fulfillment RPC, keyed by session ID. Generation is reserved once in SQL; ambiguous provider submissions require operator reconciliation rather than an automatic second paid job.

## Trust boundaries
- The browser chooses a whitelisted SKU but cannot set prices or paid rights. Integer USD cents come from the server catalog and are constrained again in SQL.
- Stripe webhook signatures are mandatory; checkout status is independently fetched from Stripe and matched to stored session/order/amount/currency/SKU. Refunds/disputes revoke rights from the remaining non-revoked purchases.
- All order and media reads require the creating browser's hashed owner cookie. An order ID is not access authority. Downloads are shared as files; recipient-facing public share links and email recovery are not implemented.
- Kie callback URLs include an order-bound HMAC. Callback body data is ignored; the stored task is independently queried. Provider media redirects are allowlisted at every hop.
- Service role remains server-only. Tables use RLS and report views/RPCs are restricted. SQL patches merge extras atomically to avoid overwriting another gift/payment update.
- R2 objects are private under `us/orders/<orderId>/`; upload/read endpoints enforce paid rights and ownership. Video rendering occurs in the browser and uploads only its finished file.
- Legacy public payment, PIX, voice, playback, karaoke and credits routes return 410. Other copied APIs require verified server admin authorization. Unsupported legacy admin tools do not become customer offerings.

## Isolation and deployment
Use a new Supabase project, private R2 bucket and Stripe webhook. No original database credentials, customer data or Git remote are copied. `wrangler.jsonc` declares a new Worker/bucket name; setup does not create either remotely. Provider keys are blank in `.env.example`.

Local unit/SQL tests do not prove remote service configuration. Before launch, complete a Stripe test-mode order through Kie, R2 and each gift export, verify second-browser denial/refunds and configure edge abuse limits. See README operational limits and the market research document.
