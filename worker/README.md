# Grainline checkout server

A small Cloudflare Worker that turns the website's cart into a Stripe Checkout
page. It recalculates every price from `../pricing.js` (the same file the
website uses), so the price a customer pays always matches the site and can't
be edited in their browser.

Until this is set up, the website's **Checkout** button emails the order
instead, so nothing breaks.

## What you need

- A **Stripe** account (stripe.com). Stripe charges 2.9% + 30¢ per sale, with no monthly fee.
- A free **Cloudflare** account (cloudflare.com).
- **Node.js** installed on the computer you deploy from (nodejs.org, the LTS version).

## Set up (about 20 minutes)

1. **Stripe:** sign up, then go to **Developers → API keys**. Start in **Test mode**
   and copy the **Secret key** (it starts with `sk_test_`). Don't share it or put it in any file.
2. In Terminal, from this `worker` folder:

   ```bash
   npx wrangler login
   ```

   This opens Cloudflare in your browser. Sign in and approve.
3. Save the Stripe key as a secret (paste it when asked):

   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY
   ```

4. Deploy:

   ```bash
   npx wrangler deploy
   ```

   It prints an address like `https://grainline-checkout.<your-name>.workers.dev`.
5. In `../shop.js`, set `CHECKOUT_URL` to that address plus `/checkout`, for example
   `https://grainline-checkout.<your-name>.workers.dev/checkout`, and push.

## Test it

Add something to the cart on the site and check out. In Test mode, pay with card
`4242 4242 4242 4242`, any future date and any CVC. The order shows up in Stripe
under **Payments**, with the full design on each item.

## Go live

1. In Stripe, finish **Activate payments** (business details and bank account).
2. Switch off Test mode, copy the live Secret key (`sk_live_...`) and run
   `npx wrangler secret put STRIPE_SECRET_KEY` again with it.

## Settings (in `wrangler.toml`)

- `SHIPPING_CENTS`: flat shipping per order, in cents. Currently `1500` ($15). Set this to your real rate, then run `npx wrangler deploy`.
- `SITE_URL`: where customers land after paying.
- `ALLOWED_ORIGINS`: which sites can start a checkout.

Prices themselves live in `../pricing.js`. Change them there, then push the
website **and** run `npx wrangler deploy`, so both stay in sync.
