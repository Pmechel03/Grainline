/* Grainline products, materials and prices.
   Shared by the website (shop.js, drawing.js) and the checkout server
   (worker/), so the price a customer sees is the price they pay. */

/* ---------- materials ---------- */
// Every product offers the same four materials. grain: how visible the wood
// grain is (0 = painted). finish: the one finish each material gets.
// material: what it's really made of, for solid-wood pieces and for the
// veneer-plywood cologne steps.
const WOODS = {
  "Walnut":      {hex: "#6E4A31", grain: 1,   finish: "Hardwax oil",   material: {solid: "Solid walnut",           veneer: "Walnut veneer"}},
  "Dark stain":  {hex: "#4B3020", grain: 0.4, finish: "Stain + satin", material: {solid: "Walnut-stained poplar",  veneer: "Walnut-stained poplar"}},
  "Matte black": {hex: "#2E2B29", grain: 0,   finish: "Matte paint",   material: {solid: "Painted MDF",            veneer: "Painted MDF"}},
  "Matte white": {hex: "#ECE8E1", grain: 0,   finish: "Matte paint",   material: {solid: "Painted MDF",            veneer: "Painted MDF"}}
};
const MATERIALS = Object.keys(WOODS);
const LIGHTS = {
  "None":       null,
  "Warm white": ["#FFC46B"],
  "Cool white": ["#DCEBFF"],
  "RGB":        ["#FF3B6B", "#FFB03B", "#3BFF8A", "#3B9BFF", "#B03BFF"]
};
// H is the second slider: [min, max, step, label, unit].
// sizes, when set, replaces the sliders with a fixed list of widths; depth and
// thickness then stay at D[0] and H[0].
// opt is the product's one extra choice, stored on the spec under opt.key.
const TYPES = {
  led:     {label: "LED floating shelf",    W: [16, 24], H: [1.5, 1.5, 0.25, "Thickness", "in"], D: [5.5, 5.5], edges: ["square", "rounded"],
            sizes: [16, 24], build: "solid",
            opt: {key: "light", label: "LED light", values: ["Warm white", "Cool white", "RGB", "None"]}},
  cologne: {label: "Cologne display steps", W: [12, 36], H: [2, 4, 1, "Steps", "count"],         D: [6, 12], edges: ["square", "rounded"],
            build: "veneer",
            opt: {key: "light", label: "LED light", values: ["None", "Warm white", "Cool white", "RGB"]}},
  charger: {label: "Charging station",      W: [8, 14],  H: [10, 16, 1, "Height", "in"],         D: [5, 8],  edges: ["square", "rounded"],
            build: "solid",
            opt: {key: "pad", label: "Wireless charging pad", values: ["Included", "Not included"]}}
};

/* ---------- pricing ----------
   Base prices are for the standard size (see DEFAULTS). Size changes are
   rounded to the nearest $5 so prices stay tidy. min keeps small sizes
   profitable, since hardware and LEDs cost about the same at any size. */
const PRICING = {
  led: {
    // 16″ is the base; 24″ adds $20, or $30 in walnut. Without LEDs it's $10 less.
    base: {Walnut: 79, "Dark stain": 59, "Matte black": 59, "Matte white": 59}, min: 59,
    size: (p, walnut) => p.width === 24 ? (walnut ? 30 : 20) : 0,
    sizeLabel: p => `${p.width}″ size`,
    extras: p => p.light === "RGB" ? [["RGB lights", 15]] : p.light === "None" ? [["Without LED lights", -10]] : []
  },
  cologne: {
    base: {Walnut: 95, "Dark stain": 79, "Matte black": 79, "Matte white": 79}, min: 59,
    size: (p, walnut) => (p.width - 20) * (walnut ? 2.5 : 2) + (p.depth - 9) * 3 + (p.height - 3) * 18,
    extras: p => p.light !== "None" ? [[`LED lighting (${p.height - 1} strip${p.height > 2 ? "s" : ""})`, 10 + 10 * (p.height - 1)]] : []
  },
  charger: {
    // Poplar and MDF barely save money on a piece this small, so every finish but walnut costs the same.
    base: {Walnut: 129, "Dark stain": 109, "Matte black": 109, "Matte white": 109}, min: 79,
    size: p => (p.width - 11) * 4 + (p.height - 13) * 3 + (p.depth - 6) * 4,
    extras: p => [
      ...(p.pad === "Not included" ? [["Without charging pad", -24]] : []),
      ...(p.engrave ? [[`Engraved initials (${p.engrave})`, ENGRAVING_PRICE]] : [])
    ]
  }
};
const ENGRAVING_PRICE = 15;

/* ---------- cart offers ----------
   Two or more LED shelves in a cart take 10% off every LED shelf, and orders
   over FREE_SHIPPING_MIN (after that discount) ship free. The discount is
   worked out per shelf in whole dollars, so the checkout server can charge
   each shelf exactly what the cart shows. */
const BUNDLE = {type: "led", min: 2, off: 0.10};
const FREE_SHIPPING_MIN = 200;
const bundleSaving = p => p.type === BUNDLE.type ? Math.round(priceOf(p).total * BUNDLE.off) : 0;
function cartTotals(items) {
  const bundleQty = items.reduce((n, l) => n + (l.spec.type === BUNDLE.type ? l.qty : 0), 0);
  const bundled = bundleQty >= BUNDLE.min;
  const subtotal = items.reduce((sum, l) => sum + priceOf(l.spec).total * l.qty, 0);
  const discount = bundled ? items.reduce((sum, l) => sum + bundleSaving(l.spec) * l.qty, 0) : 0;
  const total = subtotal - discount;
  return {subtotal, discount, total, bundleQty, bundled,
    freeShipping: total >= FREE_SHIPPING_MIN, toFreeShipping: Math.max(0, FREE_SHIPPING_MIN - total)};
}
function priceOf(p) {
  const rule = PRICING[p.type], base = rule.base[p.wood];
  // Size savings never take the base piece below the product's minimum; add-ons go on top.
  const size = Math.max(Math.round(rule.size(p, p.wood === "Walnut") / 5) * 5, rule.min - base);
  const lines = [[`${TYPES[p.type].label}, ${p.wood.toLowerCase()}`, base]];
  if (size) lines.push([rule.sizeLabel ? rule.sizeLabel(p) : size > 0 ? "Larger size" : "Smaller size", size]);
  lines.push(...rule.extras(p));
  return {lines, total: lines.reduce((sum, l) => sum + l[1], 0)};
}
const money = n => (n < 0 ? "−$" : "$") + Math.abs(n);

const inch = n => (Math.round(n * 100) / 100) + "″";
function dimsText(p) {
  if (p.type === "led") return `${inch(p.width)} W × ${inch(p.depth)} D × ${inch(p.height)} thick`;
  if (p.type === "cologne") return `${inch(p.width)} W × ${inch(p.depth)} D, ${p.height} steps`;
  return `${inch(p.width)} W × ${inch(p.depth)} D × ${inch(p.height)} H`;
}
function clampSpec(p) {
  const out = {...p};
  if (!TYPES[out.type]) out.type = "led";
  const t = TYPES[out.type];
  const cl = (v, lo, hi, step) => { v = Number(v); if (!isFinite(v)) v = (lo + hi) / 2; v = Math.min(hi, Math.max(lo, v)); return Math.round(v / step) * step; };
  if (t.sizes) {
    // Fixed sizes: snap to the nearest offered width; depth and thickness are set.
    const w = Number(out.width);
    out.width = t.sizes.reduce((best, s) => Math.abs(s - w) < Math.abs(best - w) ? s : best, t.sizes[0]);
    out.height = t.H[0];
    out.depth = t.D[0];
  } else {
    out.width = cl(out.width, t.W[0], t.W[1], 1);
    out.height = cl(out.height, t.H[0], t.H[1], t.H[2]);
    out.depth = cl(out.depth, t.D[0], t.D[1], 1);
  }
  if (!WOODS[out.wood]) out.wood = "Dark stain";
  out.finish = WOODS[out.wood].finish;
  if (!t.edges.includes(out.edge)) out.edge = t.edges[0];
  out.light = t.opt.key === "light" && t.opt.values.includes(out.light) ? out.light : (t.opt.key === "light" ? t.opt.values[0] : "None");
  out.pad = t.opt.key === "pad" && t.opt.values.includes(out.pad) ? out.pad : (t.opt.key === "pad" ? t.opt.values[0] : undefined);
  // Engraving is up to three letters, on the charging station only.
  const initials = out.type === "charger" ? String(out.engrave || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) : "";
  if (initials) out.engrave = initials; else delete out.engrave;
  return out;
}

// The standard version of each product; catalog "from" prices use these.
const DEFAULTS = {
  led:     {type: "led", width: 16, height: 1.5, depth: 5.5, wood: "Dark stain", edge: "square", light: "Warm white"},
  cologne: {type: "cologne", width: 20, height: 3, depth: 9, wood: "Dark stain", edge: "square", light: "None"},
  charger: {type: "charger", width: 11, height: 13, depth: 6, wood: "Dark stain", edge: "rounded", pad: "Included"}
};

function materialOf(p) {
  return WOODS[p.wood].material[TYPES[p.type].build];
}
function optText(p) {
  const t = TYPES[p.type];
  return t.opt.key === "light" ? (p.light === "None" ? "No LED" : `${p.light} LED`) : `Charging pad ${p.pad === "Included" ? "included" : "not included"}`;
}
// One line describing a design, for the cart, the order email and Stripe receipts.
function describe(p) {
  return `${dimsText(p)} · ${p.wood} (${materialOf(p).toLowerCase()}) · ${p.edge} edge · ${optText(p)}` +
    (p.engrave ? ` · Engraved "${p.engrave}"` : "");
}

export { WOODS, MATERIALS, LIGHTS, TYPES, PRICING, DEFAULTS, BUNDLE, FREE_SHIPPING_MIN, ENGRAVING_PRICE,
  priceOf, cartTotals, bundleSaving, money, inch, dimsText, clampSpec, materialOf, optText, describe };
