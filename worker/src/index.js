/* Grainline checkout server (Cloudflare Worker).

   The website POSTs the cart here. This worker prices every line again from
   pricing.js (the same file the website uses), so a customer can't change a
   price in their browser, then creates a Stripe Checkout session and returns
   its URL for the website to send the customer to. Stripe's page collects the
   email, shipping address and payment. */
import { TYPES, canOrder, clampSpec, priceOf, describe, optText, cartTotals, bundleSaving } from "../../pricing.js";

const MAX_LINES = 20;
const MAX_QTY = 10;
// The fields of a design, as clampSpec returns them.
const FIELDS = ["type", "width", "height", "depth", "wood", "edge", "light", "pad", "engrave"];

// A cart line is accepted only if it's a design the site offers, exactly as
// the site sends it. Anything else (an out-of-date cart, an edited request)
// is refused rather than charged as some other piece.
function readLine(item) {
  const s = item?.spec, qty = item?.qty;
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
  const spec = clampSpec(s);
  return FIELDS.every(k => spec[k] === s[k] || (spec[k] === undefined && s[k] == null)) ? {spec, qty} : null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin"}
      : {};

    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: cors});
    if (request.method !== "POST" || new URL(request.url).pathname !== "/checkout") return json({error: "Not found."}, 404, cors);
    if (!cors["Access-Control-Allow-Origin"]) return json({error: "This site isn't allowed to use checkout."}, 403, cors);

    let body;
    try { body = await request.json(); } catch { return json({error: "Your cart couldn't be read."}, 400, cors); }
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return json({error: "Your cart is empty."}, 400, cors);
    if (items.length > MAX_LINES) return json({error: `Checkout takes up to ${MAX_LINES} different designs at a time.`}, 400, cors);
    if (items.some(item => !canOrder(item?.spec?.type))) {
      return json({error: "Only the LED shelves can be ordered right now. Please remove anything else from your cart."}, 400, cors);
    }
    const cart = items.map(readLine);
    if (cart.some(line => !line)) return json({error: "Something in your cart has changed. Please refresh the page and check your cart."}, 400, cors);

    // Same offers as the cart: the LED shelf pair discount comes off each shelf's
    // price, and big enough orders ship free.
    const totals = cartTotals(cart);
    const tax = env.STRIPE_TAX === "on";
    const lineItems = cart.map(({spec, qty}) => {
      const unit = priceOf(spec).total - (totals.bundled ? bundleSaving(spec) : 0);
      return {
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount: unit * 100,
          ...(tax ? {tax_behavior: "exclusive"} : {}),
          product_data: {
            name: `${TYPES[spec.type].label}, ${spec.wood}` + (totals.bundled && bundleSaving(spec) ? " (pair price, 10% off)" : ""),
            description: describe(spec),
            // The full design, so it shows on the order in the Stripe dashboard.
            metadata: {design: JSON.stringify(spec).slice(0, 500)}
          }
        }
      };
    });

    // What was ordered, in one line, e.g. "2 x LED floating shelf (Matte black, 24″ wide, RGB LED)".
    // It goes on the payment, which is what the Stripe dashboard lists first.
    const summary = cart.map(({spec, qty}) => `${qty} x ${TYPES[spec.type].label} (${spec.wood}, ${spec.width}″ wide, ${optText(spec)})`).join("; ").slice(0, 500);

    const params = {
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: {allowed_countries: ["US"]},
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: totals.freeShipping ? "Free shipping" : "Standard shipping",
          fixed_amount: {amount: totals.shipping * 100, currency: "usd"},
          ...(tax ? {tax_behavior: "exclusive"} : {})
        }
      }],
      phone_number_collection: {enabled: true},
      // Two optional questions on Stripe's page. The answers show on the order in the dashboard.
      custom_fields: [
        {key: "giftmessage", label: {type: "custom", custom: "Gift message"}, type: "text", optional: true, text: {maximum_length: 255}},
        {key: "heardabout", label: {type: "custom", custom: "How did you hear about us?"}, type: "dropdown", optional: true,
          dropdown: {options: [
            {label: "Instagram", value: "instagram"}, {label: "TikTok", value: "tiktok"},
            {label: "A friend or family member", value: "friend"}, {label: "Google search", value: "google"}, {label: "Other", value: "other"}
          ]}}
      ],
      // Sales tax, worked out by Stripe Tax once it's set up in the Stripe dashboard (see README).
      ...(tax ? {automatic_tax: {enabled: true}} : {}),
      metadata: {order: summary},
      payment_intent_data: {description: summary, metadata: {order: summary}},
      success_url: `${env.SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.SITE_URL}/#cart`
    };

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {"Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded"},
      body: formEncode(params)
    });
    const session = await res.json();
    if (!res.ok) {
      console.error("Stripe error:", session?.error?.message);
      return json({error: "Checkout is unavailable right now. Please try again in a few minutes."}, 502, cors);
    }
    return json({url: session.url}, 200, cors);
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {status, headers: {...headers, "Content-Type": "application/json"}});
}

// Stripe's API takes form encoding with bracketed keys: line_items[0][quantity]=1
function formEncode(value, key = "", out = new URLSearchParams()) {
  if (Array.isArray(value)) value.forEach((v, i) => formEncode(v, `${key}[${i}]`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) formEncode(v, key ? `${key}[${k}]` : k, out);
  else if (value !== undefined) out.append(key, String(value));
  return out;
}
