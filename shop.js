/* Grainline shop: the custom designer, the cart and checkout. */
import { WOODS, MATERIALS, LIGHTS, TYPES, DEFAULTS, priceOf, money, inch, dimsText, clampSpec, materialOf, describe } from "./pricing.js?v=7";
import { render, esc } from "./drawing.js?v=7";

const $ = s => document.querySelector(s);
// Shown in the material comparison. durability is 1-5: how well it shrugs off dents and scratches.
const MATERIAL_INFO = {
  "Oak":         {look: "Light, with bold open grain",     durability: 5, best: "Everyday use, natural look",
                  note: "The toughest option. Resists dents, and scratches can be sanded and re-oiled."},
  "Walnut":      {look: "Rich chocolate brown",            durability: 4, best: "A premium, statement piece",
                  note: "Our most premium wood. Deep color that warms up as it ages."},
  "Dark stain":  {look: "Walnut-like brown, even color",   durability: 3, best: "The walnut look for less",
                  note: "Gets the dark walnut look for less. Deep scratches can show lighter wood underneath."},
  "Matte black": {look: "Flat black, no grain",            durability: 3, best: "Modern rooms, LED glow",
                  note: "Bold and modern, and makes LED light pop. Shows dust more than wood does."},
  "Matte white": {look: "Soft white, no grain",            durability: 3, best: "Bright, minimal rooms",
                  note: "Clean and bright, blends into light walls. Wipe with a damp cloth to keep it fresh."}
};

/* ---------- custom designer ---------- */
let spec = clampSpec(DEFAULTS.led);

$("#cType").innerHTML = Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join("");

const fmtH = (t, v) => t.H[4] === "count" ? String(v) : inch(v);
const cap = s => s[0].toUpperCase() + s.slice(1);
function setSpec(p) { spec = clampSpec(p); syncControls(); draw(); }
function syncControls() {
  const t = TYPES[spec.type];
  $("#cType").value = spec.type;
  const setR = (el, lo, hi, step, v) => { el.min = lo; el.max = hi; el.step = step; el.value = v; };
  setR($("#cW"), t.W[0], t.W[1], 1, spec.width);
  setR($("#cH"), t.H[0], t.H[1], t.H[2], spec.height);
  setR($("#cD"), t.D[0], t.D[1], 1, spec.depth);
  $("#lH").textContent = t.H[3];
  $("#woodNote").textContent = materialOf(spec);
  $("#matNote").textContent = MATERIAL_INFO[spec.wood].note;
  $("#cWood").innerHTML = MATERIALS.map(k => `<button type="button" aria-pressed="${k === spec.wood}" data-w="${k}"><i style="background:${WOODS[k].hex}"></i>${k}</button>`).join("");
  $("#cEdge").innerHTML = t.edges.map(e => `<button type="button" aria-pressed="${e === spec.edge}" data-e="${e}">${cap(e)}</button>`).join("");
  $("#optLabel").textContent = t.opt.label;
  $("#cOpt").innerHTML = t.opt.values.map(v => `<button type="button" aria-pressed="${v === spec[t.opt.key]}" data-o="${v}">${v}</button>`).join("");
}
function draw() {
  const t = TYPES[spec.type], stage = $("#stage");
  stage.querySelector("svg")?.remove();
  stage.insertAdjacentHTML("afterbegin", render(spec));
  stage.classList.toggle("lit", !!LIGHTS[spec.light]);
  $("#vW").textContent = inch(spec.width); $("#vH").textContent = fmtH(t, spec.height); $("#vD").textContent = inch(spec.depth);
  $("#dimTag").textContent = dimsText(spec);
  const rows = [["Material", spec.wood], ["Finish", spec.finish], ["Edge", cap(spec.edge)], [t.opt.key === "light" ? "LED" : "Charging", t.opt.key === "light" ? spec.light : spec.pad]];
  $("#spec").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  const pr = priceOf(spec);
  $("#total").textContent = money(pr.total);
  $("#lines").innerHTML = pr.lines.map(([k, v], i) => `<li><span>${esc(k)}</span><span>${i ? (v > 0 ? "+" : "") : ""}${money(v)}</span></li>`).join("");
  if (!$("#matInfo").hidden) drawCompare();
}
// Material comparison; prices are for the piece as currently designed.
function drawCompare() {
  const dots = n => `<span class="dots" title="Durability ${n} out of 5">${"●".repeat(n)}<i>${"●".repeat(5 - n)}</i></span>`;
  $("#matInfo").innerHTML = MATERIALS.map(m => `
    <div class="mat-row${m === spec.wood ? " on" : ""}">
      <div class="mat-top"><span class="sw-dot" style="background:${WOODS[m].hex}"></span><b>${m}</b><small>${WOODS[m].material[TYPES[spec.type].build]}</small><span class="mat-price">${money(priceOf({...spec, wood: m}).total)}</span></div>
      <div class="mat-meta"><span>${MATERIAL_INFO[m].look}</span><span>Best for: ${MATERIAL_INFO[m].best}</span><span>Durability ${dots(MATERIAL_INFO[m].durability)}</span></div>
    </div>`).join("");
}
$("#matInfoBtn").onclick = () => {
  const open = $("#matInfo").hidden;
  $("#matInfo").hidden = !open; $("#matInfoBtn").setAttribute("aria-expanded", open);
  if (open) drawCompare();
};
$("#cType").onchange = e => setSpec({...DEFAULTS[e.target.value], wood: spec.wood});
$("#cW").oninput = e => { spec.width = +e.target.value; draw(); };
$("#cH").oninput = e => { spec.height = +e.target.value; draw(); };
$("#cD").oninput = e => { spec.depth = +e.target.value; draw(); };
$("#cWood").onclick = e => { const b = e.target.closest("[data-w]"); if (!b) return; spec = clampSpec({...spec, wood: b.dataset.w}); syncControls(); draw(); };
$("#cEdge").onclick = e => { const b = e.target.closest("[data-e]"); if (!b) return; spec.edge = b.dataset.e; syncControls(); draw(); };
$("#cOpt").onclick = e => { const b = e.target.closest("[data-o]"); if (!b) return; spec[TYPES[spec.type].opt.key] = b.dataset.o; syncControls(); draw(); };
$("#addBtn").onclick = () => addToCart(spec);

/* ---------- cart ---------- */
// The checkout server's address (see worker/README.md). While it's empty,
// Checkout emails the order to us instead of opening Stripe.
const CHECKOUT_URL = "";
const ORDER_EMAIL = "creationsgrainline@gmail.com";
const MAX_QTY = 10;

let cart = [];
try {
  cart = (JSON.parse(localStorage.getItem("gl-cart")) || [])
    .map(l => ({spec: clampSpec(l.spec), qty: Math.min(MAX_QTY, Math.max(1, l.qty | 0))}));
} catch { cart = []; }
const saveCart = () => { try { localStorage.setItem("gl-cart", JSON.stringify(cart)); } catch {} };
const sameDesign = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const subtotal = () => cart.reduce((sum, l) => sum + priceOf(l.spec).total * l.qty, 0);

function addToCart(p) {
  p = clampSpec(p);
  const line = cart.find(l => sameDesign(l.spec, p));
  if (line) line.qty = Math.min(MAX_QTY, line.qty + 1); else cart.push({spec: p, qty: 1});
  saveCart(); renderCart(); openCart(true);
}
function renderCart() {
  const count = cart.reduce((sum, l) => sum + l.qty, 0);
  $("#cartCount").textContent = count; $("#cartCount").hidden = !count;
  $("#cartFoot").hidden = !cart.length;
  $("#cartMsg").textContent = "";
  if (!cart.length) {
    $("#cartLines").innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p><a class="btn btn-ghost" href="#products" data-close>Browse the collection</a></div>`;
    return;
  }
  $("#cartLines").innerHTML = cart.map((l, i) => `
    <div class="cart-line">
      <div class="cart-thumb${LIGHTS[l.spec.light] ? " lit" : ""}">${render(l.spec)}</div>
      <div class="cart-info">
        <b>${esc(TYPES[l.spec.type].label)}</b>
        <small>${esc(describe(l.spec))}</small>
        <div class="qty">
          <button type="button" data-dec="${i}" aria-label="Remove one">−</button><span>${l.qty}</span><button type="button" data-inc="${i}" aria-label="Add one"${l.qty >= MAX_QTY ? " disabled" : ""}>+</button>
          <button type="button" class="link" data-rm="${i}">Remove</button>
        </div>
      </div>
      <div class="cart-price">${money(priceOf(l.spec).total * l.qty)}</div>
    </div>`).join("");
  $("#cartSubtotal").textContent = money(subtotal());
  $("#checkoutBtn").textContent = CHECKOUT_URL ? "Checkout" : "Place order by email";
  $("#checkoutBtn").disabled = false;
}
function openCart(open) {
  $("#cart").hidden = !open; $("#scrim").hidden = !open;
  document.body.classList.toggle("no-scroll", open);
  if (open) $("#cartClose").focus();
}
$("#cartLines").onclick = e => {
  const t = e.target.closest("[data-inc],[data-dec],[data-rm],[data-close]");
  if (!t) return;
  if (t.dataset.close !== undefined) return openCart(false);
  const i = +(t.dataset.inc ?? t.dataset.dec ?? t.dataset.rm);
  if (t.dataset.inc) cart[i].qty = Math.min(MAX_QTY, cart[i].qty + 1);
  if (t.dataset.dec) cart[i].qty--;
  if (t.dataset.rm || cart[i].qty < 1) cart.splice(i, 1);
  saveCart(); renderCart();
};
$("#cartBtn").onclick = () => openCart(true);
$("#cartClose").onclick = $("#scrim").onclick = () => openCart(false);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#cart").hidden) openCart(false); });

$("#checkoutBtn").onclick = async () => {
  const btn = $("#checkoutBtn");
  if (!CHECKOUT_URL) {
    const list = cart.map(l => `- ${l.qty} × ${TYPES[l.spec.type].label}: ${describe(l.spec)} (${money(priceOf(l.spec).total)} each)`).join("\n");
    location.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent("Order request")}&body=${encodeURIComponent(`Hi Grainline, I'd like to order:\n\n${list}\n\nSubtotal: ${money(subtotal())} plus shipping\n\nMy name:\nShipping address:\n\nThanks!`)}`;
    $("#cartMsg").innerHTML = `If your email app didn't open, email your order to <a href="mailto:${ORDER_EMAIL}">${ORDER_EMAIL}</a>.`;
    return;
  }
  btn.disabled = true; btn.textContent = "Opening secure checkout…";
  try {
    const res = await fetch(CHECKOUT_URL, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({items: cart.map(l => ({spec: l.spec, qty: l.qty}))})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error);
    location.href = data.url;
  } catch (err) {
    btn.disabled = false; btn.textContent = "Checkout";
    $("#cartMsg").innerHTML = `${esc(err.message || "Checkout couldn't open.")} Please try again, or email us at <a href="mailto:${ORDER_EMAIL}">${ORDER_EMAIL}</a>.`;
  }
};

/* ---------- product cards and hero ---------- */
document.querySelectorAll("[data-art]").forEach(el => { const p = clampSpec(JSON.parse(el.dataset.art)); el.insertAdjacentHTML("afterbegin", render(p)); el.classList.toggle("lit", !!LIGHTS[p.light]); });
document.querySelectorAll("[data-from]").forEach(el => { el.textContent = money(priceOf(clampSpec(DEFAULTS[el.dataset.from])).total); });
document.querySelectorAll("[data-customize]").forEach(b => b.onclick = () => { setSpec({...DEFAULTS[b.dataset.customize]}); document.getElementById("custom").scrollIntoView({behavior: "smooth"}); });
document.querySelectorAll("[data-add]").forEach(b => b.onclick = () => addToCart(DEFAULTS[b.dataset.add]));

syncControls(); draw(); renderCart();
// Stripe sends people back to #cart if they leave checkout without paying.
if (location.hash === "#cart") openCart(true);
