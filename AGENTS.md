# NS Music — US edition

Independent US storefront; never deploy or connect it to the Brazil database/bucket.
Customer UI, prompts and API errors are English, except countries set to Spanish in the admin (`/admin/paises`, today México), whose create flow and lyrics are in Mexican Spanish. Retained internal admin may use Portuguese.
Countries and their music styles live in `us_settings` (key `us_countries`, see `supabase/us_settings.sql`) with defaults in `src/lib/usCountries.js`; the server validates country + style and snapshots the style prompt into the order spec. All prices stay in USD.
Next.js 15 / React 18 / JavaScript / npm / Cloudflare Workers via OpenNext (Node-compatible handlers); no Tailwind.
Only four cumulative products: audio_only 499, combo_carta 599, combo 799, combo_retrospectiva 999 USD cents.
Stripe is the only customer payment provider (embedded Checkout when `STRIPE_PUBLISHABLE_KEY` is set, hosted Checkout otherwise). No PIX, credits, voice clone, playback or karaoke sales.
Never derive entitlement from a URL or browser flag. Server checks Stripe session, USD amount, SKU and stored order association; SQL applies rights atomically.
An HttpOnly owner cookie is required for private order/media. Never expose source audio URLs or service keys.
The legacy admin source is retained, while middleware blocks excluded routes and authenticates legacy APIs.
Run npm test and npm run build. Use a separate test order and Stripe test mode for manual payment checks.

