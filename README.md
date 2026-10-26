# NS Music US
A separate US edition of NS Music. The original Brazil project, customer data and credentials are not included.

## Included
- English customer storefront with an original editorial design, responsive story-and-sound creation wizard, editable lyrics and private delivery workspace.
- Country, Pop, R&B/Soul, Rock, Folk/Acoustic, Christian/Worship, Gospel/Soul, Hip-Hop, Jazz and English-language Latin Pop. Religious lyrics are opt-in.
- Four one-time, cumulative USD packages: song $4.99; song + letter $5.99; song + letter + video $7.99; all those + retrospective $9.99.
- Stripe hosted card checkout only. Music starts after server-verified payment. No PIX, subscriptions, credits, voice cloning, karaoke or playback sales.
- Private paid audio, editable/printable letter, browser-rendered photo film and retrospective exports, private R2 uploads. Video export requires a browser supporting MediaRecorder; its supported format is shown in the editor.
- Existing Portuguese admin retained for internal use, behind server-validated Supabase admin authorization. Legacy Brazilian integrations are disabled in the US public store.

## Run locally
Requires Node 22+ and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev -- --port 3011
```

Open http://localhost:3011. Without service keys you can review the design and wizard, but lyrics, orders and checkout intentionally return a clear unavailable message.

## Configure an independent US environment
1. Create a NEW Supabase project and NEW private Cloudflare R2 bucket. Never use the Brazilian production database or bucket. In the new Supabase SQL editor run ONLY `supabase/schema.sql`, followed by `supabase/us.sql`. Other copied legacy migrations are not the US setup path.
2. Fill the blank values documented in `.env.example`. Use the new Supabase URL, anon key and service role key. Keep the service role key server-only. Create an admin through Supabase Auth and add its verified email to `ADMIN_EMAILS`, or assign role=admin in trusted app_metadata.
3. Set a dedicated Stripe account/environment secret key, initially in TEST mode. Configure the webhook endpoint `/api/us/stripe-webhook` and its signing secret. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, and `charge.dispute.created`. Prices are defined on the server; no Dashboard Price IDs are required. Stripe settlement currency, payout timing, fees and tax settings depend on the account.
4. Set an OpenAI key (optional Gemini fallback), Kie API key and a strong random `KIE_WEBHOOK_SECRET`. Kie callback URLs contain a per-order HMAC, never the secret itself. The provider must be able to reach the public HTTPS deployment; localhost callbacks need a temporary test tunnel. Current integration uses Kie's V6 jobs API.
5. Use a NEW Cloudflare Worker with OpenNext, rather than the original Pages deployment. Update the new bucket name in `wrangler.jsonc`, keep it private and bind it as `nsmusic_media`. Set `NEXT_PUBLIC_SITE_URL` to the new HTTPS origin. The US copy uses patched Next 15 and Node-compatible handlers on Workers. Run `npm run build:cloudflare` and `npm run preview:cloudflare` before deployment; `npm run build` validates Next, not a deployed Cloudflare environment. No Cloudflare resource is created by this repository setup.
6. Review the English Terms/Privacy pages and add your real operating entity, support contact, retention and refund practices. Search indexing remains disabled until launch. Add edge rate limits for public lyrics/orders and set AI spending limits before exposing public traffic.

## Verification
```powershell
npm test
npm run lint
npm run build
```

The tests cover server-owned USD prices, cumulative entitlements, Stripe session matching, ownership, generation concurrency/failure behavior and gift validation. No test charges a real card or uses customer records.

Before launch, use a dedicated Stripe test order to verify: create story → review lyrics → each package checkout → duplicate webhook/return handling → generation callback + polling → protected download → included gift exports → full refund revokes access. Also verify a second browser cannot access the private order. Finish an end-to-end test with the configured US Supabase, R2 and Kie environment; local mocks cannot prove those integrations.

## Operational limits
- Private orders currently return only in the creating browser via a 90-day HttpOnly ownership cookie. The order URL alone does not recover access on another device. Customers download files to share gifts; emailed recovery is not implemented.
- Ambiguous provider submissions enter `US_GENERATION_REVIEW` instead of automatically buying another generation. An operator must reconcile the provider job before retrying.
- Audio is archived privately in R2. Failed archives retry on subsequent music status requests; no background archive-repair scheduler is included.
- Browser video exports depend on device codec/memory support; test on your supported Safari/Chrome devices with a full-length paid track. Uploaded videos are limited to 50 MB, images to 5 MB and 12 photos.
- The retained admin includes legacy reporting/advertising modules. It is an internal starting point, not a complete US accounting integration; Stripe is the authority for refunds, balances and fees.

Research and design rationale: [docs/US-MARKET-RESEARCH.md](docs/US-MARKET-RESEARCH.md).

