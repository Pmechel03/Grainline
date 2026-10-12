/* Grainline products, materials and prices.
   Shared by the website (shop.js, drawing.js) and the checkout server
   (worker/), so the price a customer sees is the price they pay. */

/* ---------- materials ---------- */
// Every product offers the same five materials. grain: how visible the wood
// grain is (0 = painted). finish: the one finish each material gets.
// material: what it's really made of, for solid-wood pieces and for the
// veneer-plywood cologne steps.
const WOODS = {
  "Oak":         {hex: "#C9A275", grain: 1,   finish: "Hardwax oil",   material: {solid: "Solid red oak",          veneer: "Oak veneer"}},
  "Walnut":      {hex: "#6E4A31", grain: 1,   finish: "Hardwax oil",   material: {solid: "Solid walnut",           veneer: "Walnut veneer"}},
  "Dark stain":  {hex: "#4B3020", grain: 0.4, finish: "Stain + satin", material: {solid: "Walnut-stained poplar",  veneer: "Stained oak veneer"}},
  "Matte black": {hex: "#2E2B29", grain: 0,   finish: "Matte paint",   material: {solid: "Painted poplar",         veneer: "Painted birch plywood"}},
  "Matte white": {hex: "#ECE8E1", grain: 0,   finish: "Matte paint",   material: {solid: "Painted poplar",         veneer: "Painted birch plywood"}}
};
const MATERIALS = Object.keys(WOODS);
const LIGHTS = {
  "None":       null,
  "Warm white": ["#FFC46B"],
  "Cool white": ["#DCEBFF"],
  "RGB":        ["#FF3B6B", "#FFB03B", "#3BFF8A", "#3B9BFF", "#B03BFF"]
};
// H is the second slider: [min, max, step, label, unit].
// opt is the product's one extra choice, stored on the spec under opt.key.
const TYPES = {
  led:     {label: "LED floating shelf",    W: [12, 60], H: [1.5, 3, 0.25, "Thickness", "in"], D: [4, 10], edges: ["square", "rounded"],
            build: "solid",
            opt: {key: "light", label: "LED light", values: ["Warm white", "Cool white", "RGB"]}},
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
    base: {Oak: 139, Walnut: 179, "Dark stain": 125, "Matte black": 125, "Matte white": 125}, min: 99,
    size: (p, walnut) => (p.width - 36) * (walnut ? 4 : 2.5) + (p.depth - 8) * (walnut ? 9 : 6) + (p.height - 1.75) * 20,
    extras: p => p.light === "RGB" ? [["RGB lights", 15]] : []
  },
  cologne: {
    base: {Oak: 79, Walnut: 95, "Dark stain": 79, "Matte black": 79, "Matte white": 79}, min: 59,
    size: (p, walnut) => (p.width - 20) * (walnut ? 2.5 : 2) + (p.depth - 9) * 3 + (p.height - 3) * 18,
    extras: p => p.light !== "None" ? [[`LED lighting (${p.height - 1} strip${p.height > 2 ? "s" : ""})`, 10 + 10 * (p.height - 1)]] : []
  },
  charger: {
    // Poplar barely saves money on a piece this small, and painting adds work, so finishes cost the same as oak.
    base: {Oak: 109, Walnut: 129, "Dark stain": 109, "Matte black": 109, "Matte white": 109}, min: 79,
    size: p => (p.width - 11) * 4 + (p.height - 13) * 3 + (p.depth - 6) * 4,
    extras: p => p.pad === "Not included" ? [["Without charging pad", -24]] : []
  }
};
function priceOf(p) {
  const rule = PRICING[p.type], base = rule.base[p.wood];
  // Size savings never take the base piece below the product's minimum; add-ons go on top.
  const size = Math.max(Math.round(rule.size(p, p.wood === "Walnut") / 5) * 5, rule.min - base);
  const lines = [[`${TYPES[p.type].label}, ${p.wood.toLowerCase()}`, base]];
  if (size) lines.push([size > 0 ? "Larger size" : "Smaller size", size]);
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
  out.width = cl(out.width, t.W[0], t.W[1], 1);
  out.height = cl(out.height, t.H[0], t.H[1], t.H[2]);
  out.depth = cl(out.depth, t.D[0], t.D[1], 1);
  if (!WOODS[out.wood]) out.wood = "Oak";
  out.finish = WOODS[out.wood].finish;
  if (!t.edges.includes(out.edge)) out.edge = t.edges[0];
  out.light = t.opt.key === "light" && t.opt.values.includes(out.light) ? out.light : (t.opt.key === "light" ? t.opt.values[0] : "None");
  out.pad = t.opt.key === "pad" && t.opt.values.includes(out.pad) ? out.pad : (t.opt.key === "pad" ? t.opt.values[0] : undefined);
  return out;
}

// The standard version of each product; catalog "from" prices use these.
const DEFAULTS = {
  led:     {type: "led", width: 36, height: 1.75, depth: 8, wood: "Oak", edge: "square", light: "Warm white"},
  cologne: {type: "cologne", width: 20, height: 3, depth: 9, wood: "Oak", edge: "square", light: "None"},
  charger: {type: "charger", width: 11, height: 13, depth: 6, wood: "Oak", edge: "rounded", pad: "Included"}
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
  return `${dimsText(p)} · ${p.wood} (${materialOf(p).toLowerCase()}) · ${p.edge} edge · ${optText(p)}`;
}

export { WOODS, MATERIALS, LIGHTS, TYPES, PRICING, DEFAULTS, priceOf, money, inch, dimsText, clampSpec, materialOf, optText, describe };
