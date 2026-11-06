# Grainline checkout server

A small Cloudflare Worker that turns the website's cart into a Stripe Checkout
page. It recalculates every price from `../pricing.js` (the same file the
website uses), so the price a customer pays always matches the site and can't
be edited in their browser.

How an order works:

1. The customer adds LED shelves to the cart and presses **Checkout**.
2. The website sends the cart here. This server prices it and asks Stripe for a
   checkout page.
3. The customer pays on Stripe's page, which collects their email, shipping
   address and phone number, plus an optional gift message and "How did you
   hear about us?".
4. Stripe sends them to `success.html` and emails a receipt. The order shows
   in Stripe under **Payments**, with the full design on each shelf.

Only products that `canOrder` in `../pricing.js` allows can be bought (the LED
shelf for now). To launch the cologne steps or charging station later, remove
`comingSoon: true` from that product in `../pricing.js`, then update the site
and this server.

Until this server is set up and its address is in `../shop.js`, the cart's
button says "Ordering opens soon", so nothing breaks.

## What you need

- A **Stripe** account (stripe.com). Stripe charges 2.9% + 30¢ per card payment, with no monthly fee.
- A free **Cloudflare** account (cloudflare.com).
- **Node.js** on the computer you deploy from (nodejs.org, the LTS version).

## Set up (about 20 minutes)

1. **Stripe:** sign up, then go to **Developers → API keys**. Start in **Test mode**
   and copy the **Secret key** (it starts with `sk_test_`). Don't share it or put it in any file.
2. In Stripe, go to **Settings → Customer emails** and turn on emails for
   **Successful payments**, so customers get a receipt.
3. In Terminal, from this `worker` folder, sign in to Cloudflare (it opens your browser):

   ```bash
   npx wrangler login
   ```

4. Save the Stripe key as a secret (paste it when asked):

   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY
   ```

5. Deploy:

   ```bash
   npx wrangler deploy
   ```

   It prints an address like `https://grainline-checkout.<your-name>.workers.dev`.
6. In `../shop.js`, set `CHECKOUT_URL` to that address plus `/checkout`, for example
   `https://grainline-checkout.<your-name>.workers.dev/checkout`. Bump `shop.js?v=`
   in `../index.html` and push.

## Test it

Add a shelf to the cart on the site and check out. In Test mode, pay with card
`4242 4242 4242 4242`, any future date and any CVC. The order shows up in Stripe
under **Payments** (with Test mode on).

## Go live

1. In Stripe, finish **Activate payments** (business details and bank account).
2. Switch off Test mode, copy the live Secret key (`sk_live_...`) and run
   `npx wrangler secret put STRIPE_SECRET_KEY` again with it.

## Settings

- **Prices, the pair discount, free shipping and the shipping rate** are in
  `../pricing.js` (`SHIPPING` is the flat rate, in dollars, for orders under
  `FREE_SHIPPING_MIN`). Change them there, then push the website **and** run
  `npx wrangler deploy`, so both stay in sync.
- In `wrangler.toml`:
  - `STRIPE_TAX`: set to `"on"` to charge sales tax with Stripe Tax. First set
    it up in Stripe under **Tax** (your business address and where you're
    registered to collect), then run `npx wrangler deploy`. Leave it `"off"`
    otherwise.
  - `SITE_URL`: where customers land after paying.
  - `ALLOWED_ORIGINS`: which sites can start a checkout.
