# NS Music — US edition

Independent US storefront; never deploy or connect it to the Brazil database/bucket.
Customer UI, prompts and API errors are English. Retained internal admin may use Portuguese.
Next.js 15 / React 18 / JavaScript / npm / Cloudflare Workers via OpenNext (Node-compatible handlers); no Tailwind.
Only four cumulative products: audio_only 499, combo_carta 599, combo 799, combo_retrospectiva 999 USD cents.
Stripe is the only customer payment provider. No PIX, credits, voice clone, playback or karaoke sales.
Never derive entitlement from a URL or browser flag. Server checks Stripe session, USD amount, SKU and stored order association; SQL applies rights atomically.
An HttpOnly owner cookie is required for private order/media. Never expose source audio URLs or service keys.
The legacy admin source is retained, while middleware blocks excluded routes and authenticates legacy APIs.
Run npm test and npm run build. Use a separate test order and Stripe test mode for manual payment checks.

