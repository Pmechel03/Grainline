/* Grainline shop: the custom designer, the cart and checkout. */
import { WOODS, MATERIALS, LIGHTS, TYPES, DEFAULTS, BUNDLE, FREE_SHIPPING_MIN, priceOf, cartTotals, bundleSaving, money, inch, dimsText, clampSpec, materialOf, describe } from "./pricing.js?v=13";
import { render, swatch, esc } from "./drawing.js?v=13";

const $ = s => document.querySelector(s);
// Shown in the material comparison. durability is 1-5: how well it shrugs off dents and scratches.
const MATERIAL_INFO = {
  "Walnut":      {look: "Rich chocolate brown",            durability: 5, best: "A premium, statement piece",
                  note: "Our most premium wood and the toughest finish. Deep color that warms up as it ages."},
  "Dark stain":  {look: "Walnut-like brown, even color",   durability: 3, best: "The walnut look for less",
                  note: "Real wood with a walnut-colored stain, for the walnut look for less. Deep scratches can show lighter wood underneath."},
  "Matte black": {look: "Flat black, no grain",            durability: 3, best: "Modern rooms, LED glow",
                  note: "Painted MDF: smooth, bold and modern, and makes LED light pop. Keep it away from standing water."},
  "Matte white": {look: "Soft white, no grain",            durability: 3, best: "Bright, minimal rooms",
                  note: "Painted MDF: clean and bright, and blends into light walls. Wipe with a damp cloth; keep it away from standing water."}
};

/* ---------- custom designer ---------- */
let spec = clampSpec(DEFAULTS.led);
let viewer = null;   // the 3D preview, once loaded (see the bottom of this file)

/* Product picker: a button that opens a short list, each product with a
   small drawing and its starting price. Arrow keys, Enter and Escape work. */
const pickerItem = k => {
  const p = clampSpec(DEFAULTS[k]);
  return `<span class="picker-thumb${LIGHTS[p.light] ? " lit" : ""}">${render(p)}</span>
    <span class="picker-text">${TYPES[k].label}<small>From ${money(priceOf(p).total)}</small></span>`;
};
const PRODUCT_KEYS = Object.keys(TYPES);
$("#pickerMenu").innerHTML = PRODUCT_KEYS.map(k => `<li role="option" id="pick-${k}" data-type="${k}">${pickerItem(k)}</li>`).join("");
function openPicker(open) {
  $("#pickerMenu").hidden = !open;
  $("#pickerBtn").setAttribute("aria-expanded", open);
  if (open) {
    const cur = $(`#pick-${spec.type}`);
    highlight(cur);
    $("#pickerMenu").focus();
  }
}
function highlight(li) {
  $("#pickerMenu").querySelectorAll("li").forEach(x => x.classList.toggle("active", x === li));
  $("#pickerMenu").setAttribute("aria-activedescendant", li.id);
}
function choose(type) {
  openPicker(false);
  $("#pickerBtn").focus();
  if (type !== spec.type) setSpec({...DEFAULTS[type], wood: spec.wood});
}
$("#pickerBtn").onclick = () => openPicker($("#pickerMenu").hidden);
$("#pickerMenu").onclick = e => { const li = e.target.closest("li"); if (li) choose(li.dataset.type); };
$("#pickerMenu").onkeydown = e => {
  const items = [...$("#pickerMenu").querySelectorAll("li")];
  const i = items.findIndex(x => x.classList.contains("active"));
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    highlight(items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]);
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    choose(items[i].dataset.type);
  } else if (e.key === "Escape" || e.key === "Tab") {
    openPicker(false);
    if (e.key === "Escape") $("#pickerBtn").focus();
  }
};
document.addEventListener("click", e => { if (!$("#picker").contains(e.target)) openPicker(false); });

const fmtH = (t, v) => t.H[4] === "count" ? String(v) : inch(v);
const cap = s => s[0].toUpperCase() + s.slice(1);
function setSpec(p) { spec = clampSpec(p); syncControls(); draw(); }
function syncControls() {
  const t = TYPES[spec.type];
  $("#pickerBtn").innerHTML = pickerItem(spec.type);
  $("#pickerMenu").querySelectorAll("li").forEach(li => li.setAttribute("aria-selected", li.dataset.type === spec.type));
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
  $("#engraveOpt").hidden = spec.type !== "charger";
  $("#cEngrave").value = spec.engrave || "";
  $("#pairBtn").hidden = spec.type !== BUNDLE.type;
}
function draw() {
  const t = TYPES[spec.type], stage = $("#stage");
  stage.querySelector(":scope > svg")?.remove();
  if (viewer) viewer.show(spec);
  else stage.insertAdjacentHTML("afterbegin", render(spec));
  stage.classList.toggle("lit", !viewer && !!LIGHTS[spec.light]);
  stage.classList.toggle("in3d", !!viewer);
  $("#vW").textContent = inch(spec.width); $("#vH").textContent = fmtH(t, spec.height); $("#vD").textContent = inch(spec.depth);
  $("#dimTag").textContent = dimsText(spec);
  const rows = [["Material", spec.wood], ["Finish", spec.finish], ["Edge", cap(spec.edge)], [t.opt.key === "light" ? "LED" : "Charging", t.opt.key === "light" ? spec.light : spec.pad]];
  $("#spec").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  const pr = priceOf(spec);
  $("#total").textContent = $("#barTotal").textContent = money(pr.total);
  $("#pairPrice").textContent = `(${money(2 * (pr.total - bundleSaving(spec)))} for 2)`;
  $("#lines").innerHTML = pr.lines.map(([k, v], i) => `<li><span>${esc(k)}</span><span>${i ? (v > 0 ? "+" : "") : ""}${money(v)}</span></li>`).join("");
  if (!$("#matInfo").hidden) drawCompare();
}
const dots = n => `<span class="dots" title="Durability ${n} out of 5">${"●".repeat(n)}<i>${"●".repeat(5 - n)}</i></span>`;
// Material comparison; prices are for the piece as currently designed.
function drawCompare() {
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
$("#cW").oninput = e => { spec.width = +e.target.value; draw(); };
$("#cH").oninput = e => { spec.height = +e.target.value; draw(); };
$("#cD").oninput = e => { spec.depth = +e.target.value; draw(); };
$("#cWood").onclick = e => { const b = e.target.closest("[data-w]"); if (!b) return; spec = clampSpec({...spec, wood: b.dataset.w}); syncControls(); draw(); };
$("#cEdge").onclick = e => { const b = e.target.closest("[data-e]"); if (!b) return; spec.edge = b.dataset.e; syncControls(); draw(); };
$("#cOpt").onclick = e => { const b = e.target.closest("[data-o]"); if (!b) return; spec[TYPES[spec.type].opt.key] = b.dataset.o; syncControls(); draw(); };
$("#cEngrave").oninput = e => {
  spec = clampSpec({...spec, engrave: e.target.value});
  e.target.value = spec.engrave || "";   // letters only, upper case
  draw();
};
$("#addBtn").onclick = $("#barAdd").onclick = () => addToCart(spec);
$("#pairBtn").onclick = () => addToCart(spec, 2);

/* ---------- cart ---------- */
// The cart lives in the visitor's browser and checkout.html reads it from there.
const MAX_QTY = 10;

let cart = [];
try {
  cart = (JSON.parse(localStorage.getItem("gl-cart")) || [])
    .map(l => ({spec: clampSpec(l.spec), qty: Math.min(MAX_QTY, Math.max(1, l.qty | 0))}));
} catch { cart = []; }
const saveCart = () => { try { localStorage.setItem("gl-cart", JSON.stringify(cart)); } catch {} };
const sameDesign = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function addToCart(p, n = 1) {
  p = clampSpec(p);
  const line = cart.find(l => sameDesign(l.spec, p));
  if (line) line.qty = Math.min(MAX_QTY, line.qty + n); else cart.push({spec: p, qty: Math.min(MAX_QTY, n)});
  saveCart(); renderCart(); openCart(true);
}
function renderCart() {
  const count = cart.reduce((sum, l) => sum + l.qty, 0);
  $("#cartCount").textContent = count; $("#cartCount").hidden = !count;
  $("#cartFoot").hidden = !cart.length;
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
    </div>`).join("") + pairNudge();
  const totals = cartTotals(cart);
  $("#discountRow").hidden = !totals.discount;
  $("#cartDiscount").textContent = money(-totals.discount);
  $("#cartSubtotal").textContent = money(totals.total);
  $("#shipMsg").innerHTML = totals.freeShipping
    ? "<b>Your order ships free.</b>"
    : `You're <b>${money(totals.toFreeShipping)}</b> away from free shipping.`;
  $("#shipBar").style.width = `${Math.min(100, totals.total / FREE_SHIPPING_MIN * 100)}%`;
  $("#shipNote").textContent = totals.freeShipping ? "Free shipping. Every piece is made to order." : "Plus shipping. Every piece is made to order.";
}
// With exactly one LED shelf in the cart, offer a second one at the pair discount.
function pairNudge() {
  const shelves = cart.filter(l => l.spec.type === BUNDLE.type);
  if (shelves.length !== 1 || shelves[0].qty !== 1) return "";
  const i = cart.indexOf(shelves[0]);
  return `<div class="cart-nudge"><span>Add a second LED shelf and save 10% on both.</span><button type="button" class="btn btn-line btn-sm" data-inc="${i}">Add another</button></div>`;
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

$("#checkoutBtn").onclick = () => { location.href = "checkout.html"; };

/* ---------- materials section ---------- */
$("#materialsGrid").innerHTML = MATERIALS.map(m => `
  <article class="material">
    <div class="material-swatch">${swatch(m)}</div>
    <h3>${m}</h3>
    <div class="made">${WOODS[m].material.solid} · ${WOODS[m].finish.toLowerCase()}</div>
    <p>${MATERIAL_INFO[m].note}</p>
    <div class="meta"><span>Durability ${dots(MATERIAL_INFO[m].durability)}</span><button type="button" class="text-btn" data-pick-wood="${m}">Design in ${m.toLowerCase()}</button></div>
  </article>`).join("");
// The custom studio is its own page (see the page switcher in index.html).
const openStudio = () => { location.hash = "custom"; };
document.querySelectorAll("[data-pick-wood]").forEach(b => b.onclick = () => { setSpec({...spec, wood: b.dataset.pickWood}); openStudio(); });

/* ---------- product cards and hero ---------- */
document.querySelectorAll("[data-swatches]").forEach(el => { el.innerHTML = MATERIALS.map(m => `<i style="background:${WOODS[m].hex}" title="${m}"></i>`).join(""); });
document.querySelectorAll("[data-art]").forEach(el => { const p = clampSpec(JSON.parse(el.dataset.art)); el.insertAdjacentHTML("afterbegin", render(p)); el.classList.toggle("lit", !!LIGHTS[p.light]); });
document.querySelectorAll("[data-from]").forEach(el => { el.textContent = money(priceOf(clampSpec(DEFAULTS[el.dataset.from])).total); });
document.querySelectorAll("[data-customize]").forEach(b => b.onclick = () => { setSpec({...DEFAULTS[b.dataset.customize]}); openStudio(); });
document.querySelectorAll("[data-add]").forEach(b => b.onclick = () => addToCart(DEFAULTS[b.dataset.add]));

/* ---------- 3D preview ----------
   The studio shows the design in 3D (viewer3d.js). It's loaded the first
   time the studio is on screen, so other pages don't download it, and the
   drawings stay if a device can't show 3D. */
new IntersectionObserver((entries, io) => {
  if (!entries.some(e => e.isIntersecting)) return;
  io.disconnect();
  import("./viewer3d.js?v=10")
    .then(m => m.createViewer($("#stage")))
    .then(v => { viewer = v; if (v) draw(); })
    .catch(err => console.warn("3D preview unavailable:", err));
}).observe($("#stage"));

// The pinned phone preview sits just under the header, whatever its height.
const header = document.querySelector(".site-header");
const setHeaderH = () => document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
setHeaderH();
new ResizeObserver(setHeaderH).observe(header);

syncControls(); draw(); renderCart();
// Stripe sends people back to #cart if they leave checkout without paying.
if (location.hash === "#cart") openCart(true);
