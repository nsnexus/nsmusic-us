# US market research and experience decisions

Research checked October 26, 2026. These sources describe music consumption, not proven conversion rates for this store. Prices are the owner's choices; no claim that this research validates profitability.

## Listening tastes are diverse

[Luminate’s 2025 year-end report](https://view.ceros.com/luminate-data/luminate-year-end-music-report-2025-1/p/1) reports that R&B/Hip-Hop represents roughly one in four US streams. It also highlights share gains for Rock, Christian/Gospel and Latin. This supports a varied genre selector, rather than treating the US as a single country-music audience. The catalog includes Country, Pop, R&B/Soul, Rock, Folk/Acoustic, Christian/Worship, Gospel/Soul, Hip-Hop, Jazz and English-language Latin Pop.

**Design inference:** Country and Folk suit a story-led gift, while Pop and Soul offer familiar alternatives. The site prioritizes personal memories over technical production settings. Genre descriptions explain instrumentation and feeling; they never promise a celebrity's sound.

## Christian and Gospel deserve distinct choices

[Luminate’s Christian/Gospel audience study](https://luminatedata.com/blog/the-new-wave-of-christian-and-gospel-music/) describes a growing younger audience and the importance of personal recommendations. It measures a genre audience, not a single theology or cultural identity. Christian/Worship and Gospel/Soul therefore have separate sound descriptions. Explicit religious themes require a separate opt-in; choosing a genre does not automatically insert beliefs into someone's family story.

## Sell a gift, rather than a generic download

[RIAA’s 2025 wholesale revenue report](https://www.riaa.com/wp-content/uploads/2026/03/RIAA-Year-End-Revenue-2025.pdf) places premium subscriptions at more than half of US recorded-music revenue. A personalized one-time gift has a different value proposition from access to a streaming catalog. The presentation consequently emphasizes the recipient, memories, an editable letter and optional photo keepsakes—not access to a music catalog or a replacement for a streaming subscription.

**Design inference:** a warm editorial record-sleeve identity, plain English, and occasion-led storytelling communicate a keepsake. No fabricated testimonials, sales counters, artist endorsements, urgency timers or assumed US address are included. Birthday, anniversary, family gratitude and milestones are examples, not claims about market share.

## Packages and purchase flow

The Song $4.99; The Letter $5.99; The Film $7.99; The Keepsake $9.99. Packages are cumulative and one-time. The interface shows USD and what is included before Stripe. Lyrics can be reviewed before paying; audio is generated only after verified payment to avoid unpaid compute abuse.

[Stripe fulfillment guidance](https://docs.stripe.com/checkout/fulfillment) requires server-side fulfillment rather than treating a success redirect as proof of payment. This edition validates the session against its stored order, SKU, integer USD amount and currency. Webhook and return-page checks converge on an atomic database function. [Stripe currency guidance](https://docs.stripe.com/currencies) describes the distinction between charge and settlement currency; this application charges USD, while settlement and processor eligibility remain account configuration.

## What still needs real US validation

- Compare genre selection and checkout completion using actual US traffic, without inferring ethnicity, religion or gender from a visitor.
- Test names, diverse English accents, accessibility, mobile checkout and export on Safari/Chrome.
- Measure generation cost, Stripe's actual account-specific fees, refunds and support cost against the fixed prices.
- Validate operating entity/support contact, tax settings and customer policy before launch. No tax obligation or processor fee is invented by this implementation.
- No real payment or personal customer data was used for this research or local QA.
