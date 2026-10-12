/* Grainline product drawings and custom designer.
   Every product picture on the page is drawn here from a small spec, so the
   catalog cards and the designer preview always match. */

/* ---------- data ---------- */
const WOODS = {
  "White Oak":    "#C9A275",
  "Walnut":       "#6E4A31",
  "Maple":        "#E1C69C",
  "Cherry":       "#A2603C",
  "Ash":          "#D7C19C",
  "Ebonized Oak": "#2F2722"
};
const FINISHES = ["Satin", "Matte", "Natural Oil"];
const LIGHTS = {
  "None":       null,
  "Warm white": ["#FFC46B"],
  "Cool white": ["#DCEBFF"],
  "RGB":        ["#FF3B6B", "#FFB03B", "#3BFF8A", "#3B9BFF", "#B03BFF"]
};
// H is the second slider: [min, max, step, label, unit]
const TYPES = {
  led:     {label: "LED floating shelf",    W: [12, 60], H: [1.5, 3, 0.25, "Thickness", "in"], D: [4, 10], edges: ["square", "rounded"], lights: ["Warm white", "Cool white", "RGB"]},
  cologne: {label: "Cologne display steps", W: [12, 36], H: [2, 4, 1, "Steps", "count"],         D: [6, 12], edges: ["square", "rounded"], lights: ["None", "Warm white", "Cool white", "RGB"]},
  charger: {label: "Charging station",      W: [8, 14],  H: [10, 16, 1, "Height", "in"],         D: [5, 8],  edges: ["square", "rounded"], lights: null}
};

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const inch = n => (Math.round(n * 100) / 100) + "″";
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
let uid = 0;

/* ---------- drawing ---------- */
function grainDefs(id, hex, seed) {
  const r = rng(seed), dark = shade(hex, -0.3), light = shade(hex, 0.14);
  let paths = "";
  for (let i = 0; i < 14; i++) {
    const y = r() * 160, a = (r() - 0.5) * 18;
    paths += `<path d="M-20 ${y.toFixed(1)} C 150 ${(y + a).toFixed(1)}, 450 ${(y - a).toFixed(1)}, 620 ${(y + a * 0.4).toFixed(1)}" stroke="${r() < 0.25 ? light : dark}" stroke-width="${(0.5 + r() * 1.8).toFixed(2)}" fill="none" opacity="${(0.22 + r() * 0.4).toFixed(2)}"/>`;
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="600" height="160"><rect width="600" height="160" fill="${hex}"/>${paths}</pattern>`;
}
// Light gradient running across (for RGB) and fading downward.
function lightDefs(id, colors) {
  const across = colors.map((c, i) => `<stop offset="${colors.length > 1 ? i / (colors.length - 1) : 0}" stop-color="${c}"/>`).join("");
  return `<linearGradient id="${id}x" x1="0" y1="0" x2="1" y2="0">${colors.length > 1 ? across : `<stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[0]}"/>`}</linearGradient>
    <radialGradient id="${id}f" cx=".5" cy="0" r=".5" fx=".5" fy="0"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".45" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <mask id="${id}m" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${id}f)"/></mask>`;
}
// A soft wash of light spilling down from a lit edge at (x, y) with width w, reaching down by h.
const glow = (id, x, y, w, h, spread = 0.12) =>
  `<rect x="${x - w * spread}" y="${y}" width="${w * (1 + 2 * spread)}" height="${h}" fill="url(#${id}x)" mask="url(#${id}m)" opacity=".9"/>
   <rect x="${x + 2}" y="${y - 1.5}" width="${w - 4}" height="2.5" rx="1.25" fill="url(#${id}x)"/>`;

function bottle(x, base, h, w, glass, cap) {
  const neck = w * 0.32, capH = h * 0.22, body = h - capH - 4;
  return `<rect x="${x}" y="${base - body}" width="${w}" height="${body}" rx="${w * 0.12}" fill="${glass}" opacity=".88"/>
    <rect x="${x + w * 0.14}" y="${base - body + 4}" width="${w * 0.14}" height="${body - 8}" rx="2" fill="#fff" opacity=".3"/>
    <rect x="${x + (w - neck) / 2}" y="${base - body - 4}" width="${neck}" height="4" fill="${shade(glass, -0.3)}"/>
    <rect x="${x + w * 0.18}" y="${base - h}" width="${w * 0.64}" height="${capH}" rx="2" fill="${cap}"/>`;
}

function render(p) {
  const id = "w" + (++uid), hex = WOODS[p.wood] || WOODS.Walnut;
  const seed = hashStr(p.type + p.wood + p.width);
  const sheen = {"Natural Oil": 0.2, "Satin": 0.12, "Matte": 0.04}[p.finish] ?? 0.1;
  const colors = LIGHTS[p.light];
  const G = `url(#${id}g)`, S = `url(#${id}s)`, D = `url(#${id}d)`;
  const top = shade(hex, 0.12), side = shade(hex, -0.2), dark = shade(hex, -0.5);
  let defs = grainDefs(id + "g", hex, seed) +
    `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${sheen}"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
     <filter id="${id}d" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#1a0f08" flood-opacity=".3"/></filter>`;
  if (colors) defs += lightDefs(id, colors);
  // Lit pieces sit on a dark wall so the LEDs read.
  let body = colors ? `<rect width="480" height="340" fill="#241C17"/>` : "";

  if (p.type === "led") {
    const s = Math.min(380 / p.width, 13), w = p.width * s, t = Math.max(p.height * s, 9), dd = p.depth * s * 0.3, k = dd * 0.5;
    const x = 240 - w / 2, y = 150, rx = p.edge === "rounded" ? t / 2 : 1.5;
    body += glow(id, x + 6, y + t, w - 12, 120, 0.08);
    const ty = `M ${x} ${y} L ${x + w} ${y} L ${x + w - k} ${y - dd} L ${x + k} ${y - dd} Z`;
    body += `<g filter="${D}"><path d="${ty}" fill="${G}"/><path d="${ty}" fill="${top}" opacity=".35"/>
      <rect x="${x}" y="${y}" width="${w}" height="${t}" rx="${rx}" fill="${G}"/><rect x="${x}" y="${y}" width="${w}" height="${t}" rx="${rx}" fill="${side}" opacity=".25"/>
      <rect x="${x}" y="${y}" width="${w}" height="${t}" rx="${rx}" fill="${S}"/></g>`;
    // a few things on the shelf
    const base = y - dd * 0.45, vx = x + w * 0.2;
    body += `<path d="M ${vx - 12} ${base} C ${vx - 20} ${base - 26}, ${vx - 5} ${base - 38}, ${vx - 5} ${base - 52} H ${vx + 5} C ${vx + 5} ${base - 38}, ${vx + 20} ${base - 26}, ${vx + 12} ${base} Z" fill="#E8DCCB"/>`;
    const bx = x + w * 0.6; let off = 0;
    ["#2F3640", "#B98B4C", "#8C9A8A", "#5A3A26"].forEach((c, i) => { const bh = 46 + (i % 2) * 8, bw = 10 + (i % 3) * 2; body += `<rect x="${bx + off}" y="${base - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${c}"/>`; off += bw + 1; });
  }

  else if (p.type === "cologne") {
    const n = Math.round(p.height), s = Math.min(330 / p.width, 14), w = p.width * s;
    const rise = Math.min(46, 190 / n), dd = Math.min(p.depth * s * 0.32 / n * 2.2, 30), k = dd * 0.35;
    const x = 240 - w / 2, floor = 300, rx = p.edge === "rounded" ? 5 : 1.5;
    body += `<ellipse cx="240" cy="${floor + 2}" rx="${w * 0.55}" ry="7" fill="#000" opacity="${colors ? 0.35 : 0.15}"/>`;
    const r = rng(seed), glasses = ["#C98A3C", "#5B6B73", "#BFD6DD", "#7A2E2E", "#2E3B4E"], caps = ["#141414", "#C8A04A", "#2A2A2A"];
    // back (highest) step first; each step i rises i+1 blocks above the floor and sits further back
    for (let i = n - 1; i >= 0; i--) {
      const fx = x + k * i, fw = w - 2 * k * i, fy = floor - rise * (i + 1) - dd * i, fh = floor - dd * i - fy;
      const tp = `M ${fx} ${fy} L ${fx + fw} ${fy} L ${fx + fw - k} ${fy - dd} L ${fx + k} ${fy - dd} Z`;
      body += `<g filter="${D}"><path d="${tp}" fill="${G}"/><path d="${tp}" fill="${top}" opacity=".35"/>
        <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${rx}" fill="${G}"/><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${rx}" fill="${side}" opacity=".3"/>
        <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${rx}" fill="${S}"/></g>`;
      // LED strip at the back of this step's tread, drawn before the bottles so it backlights them
      if (colors && i < n - 1) {
        const ux = x + k * (i + 1), uw = w - 2 * k * (i + 1), uy = fy - dd + 0.5;
        body += glow(id, ux + 4, uy, uw - 8, rise * 0.9, 0.02);
      }
      // bottles stand on this step's tread, in front of the light
      const count = Math.max(2, Math.min(5, Math.round(fw / 70))), gap = fw / count, base = fy - dd * 0.4;
      for (let j = 0; j < count; j++) {
        const bw = 18 + r() * 10, bh = Math.min(38 + r() * 26, rise + dd + 20);
        body += bottle(fx + gap * j + (gap - bw) / 2, base, bh, bw, glasses[(i * 2 + j) % glasses.length], caps[(i + j) % caps.length]);
      }
    }
  }

  else if (p.type === "charger") {
    const s = Math.min(300 / p.width, 240 / p.height);
    const bw = p.width * s * 1.35, bh = Math.max(p.depth * s * 0.28, 26), H = p.height * s;
    const floor = 312, bx = 240 - bw / 2, by = floor - bh;
    const pw = Math.max(1.4 * s, 18), px = bx + bw * 0.5 - pw / 2, topY = by - H + bh;
    const rr = p.edge === "rounded" ? pw / 2 : 3;
    body += `<ellipse cx="240" cy="${floor + 2}" rx="${bw * 0.55}" ry="7" fill="#000" opacity=".15"/>`;
    // post, headphone arm (left, high) and watch bar (right, lower)
    const armY = topY + 26, armL = bx - 10, armH = pw * 0.75;
    const watchY = topY + H * 0.32, watchR = bx + bw * 0.86;
    body += `<g filter="${D}">
      <rect x="${px}" y="${topY}" width="${pw}" height="${by - topY + 6}" rx="${rr}" fill="${G}"/><rect x="${px}" y="${topY}" width="${pw}" height="${by - topY + 6}" rx="${rr}" fill="${side}" opacity=".2"/>
      <rect x="${armL}" y="${armY}" width="${px - armL + pw / 2}" height="${armH}" rx="${armH / 2}" fill="${G}"/>
      <rect x="${px + pw / 2}" y="${watchY}" width="${watchR - px - pw / 2}" height="${armH * 0.9}" rx="${armH * 0.45}" fill="${G}"/>
      <rect x="${px}" y="${topY}" width="${pw}" height="${by - topY + 6}" rx="${rr}" fill="${S}"/></g>`;
    // headphones hanging on the arm
    const hx = armL + (px - armL) * 0.45, cupW = 30, cupH = 46, spread = 58;
    body += `<path d="M ${hx - spread / 2} ${armY + 70} C ${hx - spread / 2 - 6} ${armY - 20}, ${hx + spread / 2 + 6} ${armY - 20}, ${hx + spread / 2} ${armY + 70}" stroke="#1C1C1E" stroke-width="10" fill="none" stroke-linecap="round"/>
      <rect x="${hx - spread / 2 - cupW / 2 - 2}" y="${armY + 58}" width="${cupW}" height="${cupH}" rx="${cupW / 2}" fill="#2A2A2D"/>
      <rect x="${hx + spread / 2 - cupW / 2 + 2}" y="${armY + 58}" width="${cupW}" height="${cupH}" rx="${cupW / 2}" fill="#2A2A2D"/>
      <rect x="${hx - spread / 2 - cupW / 2 + 4}" y="${armY + 66}" width="6" height="${cupH - 18}" rx="3" fill="#fff" opacity=".12"/>`;
    // two watches on the watch bar
    [[px + pw / 2 + (watchR - px - pw / 2) * 0.3, "#3A3A3C", "#C9A27A", true], [px + pw / 2 + (watchR - px - pw / 2) * 0.72, "#1F2A3A", "#1F2A3A", false]].forEach(([wx, band, face, round]) => {
      body += `<rect x="${wx - 8}" y="${watchY - 14}" width="16" height="${armH * 0.9 + 40}" rx="6" fill="${band}"/>
        ${round ? `<circle cx="${wx}" cy="${watchY + armH * 0.45 + 12}" r="14" fill="${face}"/><circle cx="${wx}" cy="${watchY + armH * 0.45 + 12}" r="10" fill="#EFE6D8"/><path d="M ${wx} ${watchY + armH * 0.45 + 12} l 0 -7 M ${wx} ${watchY + armH * 0.45 + 12} l 5 3" stroke="#333" stroke-width="1.4"/>`
                : `<rect x="${wx - 12}" y="${watchY + armH * 0.45}" width="24" height="28" rx="7" fill="#111"/><rect x="${wx - 9}" y="${watchY + armH * 0.45 + 3}" width="18" height="22" rx="5" fill="#2F6FE0" opacity=".85"/>`}`;
    });
    // tray with a raised rim
    body += `<g filter="${D}"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${p.edge === "rounded" ? 10 : 3}" fill="${G}"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${p.edge === "rounded" ? 10 : 3}" fill="${side}" opacity=".2"/>
      <rect x="${bx + 8}" y="${by + 6}" width="${bw - 16}" height="${bh * 0.35}" rx="4" fill="${dark}" opacity=".55"/>
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${p.edge === "rounded" ? 10 : 3}" fill="${S}"/></g>`;
    // wallet, earbuds case and phone on a wireless pad, sitting in the tray
    const ty = by + 6 + bh * 0.2;
    body += `<path d="M ${bx + 16} ${ty} l 6 -26 h 48 l -4 26 Z" fill="#4A3426"/><path d="M ${bx + 24} ${ty - 22} h 40" stroke="#C8A04A" stroke-width="1.2" opacity=".6"/>`;
    const ex = bx + bw * 0.5 + 8;
    body += `<rect x="${ex}" y="${ty - 22}" width="34" height="24" rx="10" fill="#F4F4F2"/><path d="M ${ex} ${ty - 12} h 34" stroke="#D2D2CF" stroke-width="1"/>`;
    const cx = bx + bw * 0.78;
    body += `<ellipse cx="${cx}" cy="${ty - 2}" rx="34" ry="9" fill="#1A1A1C"/><ellipse cx="${cx}" cy="${ty - 2}" rx="26" ry="6" fill="none" stroke="#34E27A" stroke-width="2" opacity=".85"/>
      <path d="M ${cx - 30} ${ty - 6} L ${cx + 18} ${ty - 22} L ${cx + 40} ${ty - 14} L ${cx - 8} ${ty + 2} Z" fill="#1C1F24"/>
      <path d="M ${cx - 24} ${ty - 6} L ${cx + 16} ${ty - 19} L ${cx + 33} ${ty - 13} L ${cx - 7} ${ty} Z" fill="#0F2A1E"/>
      <ellipse cx="${cx + 4}" cy="${ty - 10}" rx="8" ry="3" fill="none" stroke="#34E27A" stroke-width="1.4"/>`;
  }
  return `<svg viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(TYPES[p.type].label)} in ${esc(p.wood)}"><defs>${defs}</defs>${body}</svg>`;
}

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
  if (!WOODS[out.wood]) out.wood = "Walnut";
  if (!FINISHES.includes(out.finish)) out.finish = "Satin";
  if (!t.edges.includes(out.edge)) out.edge = t.edges[0];
  out.light = t.lights ? (t.lights.includes(out.light) ? out.light : t.lights[0]) : "None";
  return out;
}

/* ---------- custom designer ---------- */
// Set this to the shop's email once it exists; until then "Request a quote" copies the design instead.
const QUOTE_EMAIL = "[EMAIL]";
const DEFAULTS = {
  led:     {type: "led", width: 36, height: 1.75, depth: 8, wood: "Walnut", finish: "Satin", edge: "square", light: "Warm white"},
  cologne: {type: "cologne", width: 20, height: 3, depth: 9, wood: "Walnut", finish: "Satin", edge: "square", light: "Warm white"},
  charger: {type: "charger", width: 11, height: 13, depth: 6, wood: "Walnut", finish: "Matte", edge: "rounded", light: "None"}
};
let spec = clampSpec(DEFAULTS.led);

$("#cType").innerHTML = Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join("");
$("#cFinish").innerHTML = FINISHES.map(f => `<option>${f}</option>`).join("");

const fmtH = (t, v) => t.H[4] === "count" ? String(v) : inch(v);
function setSpec(p) { spec = clampSpec(p); syncControls(); draw(); }
function syncControls() {
  const t = TYPES[spec.type];
  $("#cType").value = spec.type;
  const setR = (el, lo, hi, step, v) => { el.min = lo; el.max = hi; el.step = step; el.value = v; };
  setR($("#cW"), t.W[0], t.W[1], 1, spec.width);
  setR($("#cH"), t.H[0], t.H[1], t.H[2], spec.height);
  setR($("#cD"), t.D[0], t.D[1], 1, spec.depth);
  $("#lH").textContent = t.H[3];
  $("#cFinish").value = spec.finish;
  $("#cWood").innerHTML = Object.entries(WOODS).map(([k, hex]) => `<button type="button" aria-pressed="${k === spec.wood}" data-w="${k}"><i style="background:${hex}"></i>${k}</button>`).join("");
  $("#cEdge").innerHTML = t.edges.map(e => `<button type="button" aria-pressed="${e === spec.edge}" data-e="${e}">${e[0].toUpperCase() + e.slice(1)}</button>`).join("");
  $("#lightWrap").hidden = !t.lights;
  if (t.lights) $("#cLight").innerHTML = t.lights.map(l => `<button type="button" aria-pressed="${l === spec.light}" data-l="${l}">${l}</button>`).join("");
}
function summary() {
  const light = TYPES[spec.type].lights && spec.light !== "None" ? `, ${spec.light} LED` : "";
  return `${TYPES[spec.type].label}: ${dimsText(spec)}, ${spec.wood}, ${spec.finish} finish, ${spec.edge} edge${light}`;
}
function draw() {
  const t = TYPES[spec.type], stage = $("#stage");
  stage.querySelector("svg")?.remove();
  stage.insertAdjacentHTML("afterbegin", render(spec));
  stage.classList.toggle("lit", !!LIGHTS[spec.light]);
  $("#vW").textContent = inch(spec.width); $("#vH").textContent = fmtH(t, spec.height); $("#vD").textContent = inch(spec.depth);
  $("#dimTag").textContent = dimsText(spec);
  const rows = [["Product", t.label], ["Wood", spec.wood], ["Finish", spec.finish], t.lights ? ["LED", spec.light] : ["Edge", spec.edge[0].toUpperCase() + spec.edge.slice(1)]];
  $("#spec").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  $("#quoteMsg").textContent = "";
}
$("#cType").onchange = e => setSpec({...DEFAULTS[e.target.value], wood: spec.wood});
$("#cW").oninput = e => { spec.width = +e.target.value; draw(); };
$("#cH").oninput = e => { spec.height = +e.target.value; draw(); };
$("#cD").oninput = e => { spec.depth = +e.target.value; draw(); };
$("#cFinish").onchange = e => { spec.finish = e.target.value; draw(); };
$("#cWood").onclick = e => { const b = e.target.closest("[data-w]"); if (!b) return; spec.wood = b.dataset.w; syncControls(); draw(); };
$("#cEdge").onclick = e => { const b = e.target.closest("[data-e]"); if (!b) return; spec.edge = b.dataset.e; syncControls(); draw(); };
$("#cLight").onclick = e => { const b = e.target.closest("[data-l]"); if (!b) return; spec.light = b.dataset.l; syncControls(); draw(); };

$("#quoteBtn").onclick = async () => {
  if (/^[^\s@\[\]]+@[^\s@]+\.[^\s@]+$/.test(QUOTE_EMAIL)) {
    location.href = `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent("Custom quote request")}&body=${encodeURIComponent("Hi Grainline, I'd like a quote for:\n\n" + summary() + "\n\nThanks!")}`;
    $("#quoteMsg").textContent = "Your email app should open with the design filled in.";
    return;
  }
  try { await navigator.clipboard.writeText(summary()); $("#quoteMsg").textContent = "Design copied. Quote requests by email are coming soon."; }
  catch { $("#quoteMsg").textContent = summary(); }
};

/* ---------- product cards ---------- */
document.querySelectorAll("[data-art]").forEach(el => { const p = clampSpec(JSON.parse(el.dataset.art)); el.innerHTML = render(p); el.classList.toggle("lit", !!LIGHTS[p.light]); });
document.querySelectorAll("[data-customize]").forEach(b => b.onclick = () => { setSpec(JSON.parse(b.dataset.customize)); document.getElementById("custom").scrollIntoView({behavior: "smooth"}); });

syncControls(); draw();
