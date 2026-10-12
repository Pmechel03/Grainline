/* Grainline checkout server (Cloudflare Worker).

   The website POSTs the cart here. This worker recalculates every price from
   pricing.js (the same file the website uses), so a customer can't change a
   price in their browser, then creates a Stripe Checkout session and returns
   its URL for the website to redirect to. */
import { TYPES, clampSpec, priceOf, describe } from "../../pricing.js";

const MAX_LINES = 20;
const MAX_QTY = 10;

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

    const lineItems = items.map(item => {
      const spec = clampSpec(item?.spec || {});
      const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(item?.qty)) || 1));
      return {
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount: priceOf(spec).total * 100,
          product_data: {
            name: `${TYPES[spec.type].label}, ${spec.wood}`,
            description: describe(spec),
            // The full design, so it shows on the order in the Stripe dashboard.
            metadata: {design: JSON.stringify(spec).slice(0, 500)}
          }
        }
      };
    });

    const params = {
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: {allowed_countries: ["US"]},
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Standard shipping",
          fixed_amount: {amount: Number(env.SHIPPING_CENTS || 1500), currency: "usd"}
        }
      }],
      phone_number_collection: {enabled: true},
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
      return json({error: "Checkout is unavailable right now."}, 502, cors);
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
