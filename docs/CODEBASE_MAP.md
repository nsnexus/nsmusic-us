# NS Music US codebase map

| Responsibility | Entry point |
|---|---|
| Storefront, collection | `src/app/page.jsx:HomePage` |
| Four-step story/song wizard | `src/app/create/page.jsx:CreatePage` |
| Payment return, generation and private tracks | `src/app/delivery/page.jsx:DeliveryPage` |
| Paid letter, video and retrospective editors | `src/app/gift/page.jsx:GiftPage` |
| Four USD prices and cumulative rights | `src/lib/usCatalog.js:US_PACKAGES`, `usRights` |
| Private owner cookie and sanitized order projection | `src/lib/usOrders.js:requireOwnedUsOrder`, `publicUsOrder` |
| English prompts and paid, reserved Kie submissions | `src/lib/usGeneration.js:startPaidUsMusic`, `refreshPaidUsMusic` |
| Stripe REST, independent session verification | `src/lib/usStripe.js:createUsCheckout`, `fulfillUsSession` |
| Gift entitlement/input validation | `src/lib/usGifts.js:validateGiftUpdate` |
| Private provider audio archive | `src/lib/usArchive.js:archiveUsTracks` |
| Provider URL/redirect allowlist | `src/lib/usAssets.js:fetchUsAudio` |
| US API boundary | `src/app/api/us/*/route.js` (orders, lyrics, checkout, payment-status, music, music-webhook, stripe-webhook, audio, upload, assets, gifts) |
| Private USD reports | `src/app/api/admin/reports/route.js:GET` |
| Removed products and legacy API admin gate | `src/middleware.js:middleware` |
| Cloudflare binding compatibility bridge | `src/lib/cloudflareContext.js:getRequestContext` |
| Supabase baseline / US atomic payment functions | `supabase/schema.sql`, `supabase/us.sql:us_fulfill_checkout` |
| Cloudflare build/runtime configuration | `open-next.config.ts`, `wrangler.jsonc` |

The retained admin and its legacy helpers remain in `src/app/admin`, `src/components/admin` and `src/lib`. The public US flow calls only `/api/us/*`. Existing Brazilian checkout/webhook/voice/credits routes are disabled by middleware. No copied migration script should be applied to the original database.
