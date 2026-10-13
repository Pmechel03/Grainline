/* Product drawings. Every picture on the site is drawn here from a design
   spec, so catalog cards, the designer preview and the cart always match. */
import { WOODS, LIGHTS, TYPES } from "./pricing.js?v=12";

export const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
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
function grainDefs(id, hex, seed, strength = 1) {
  const r = rng(seed), dark = shade(hex, -0.3), light = shade(hex, 0.14);
  let paths = "";
  for (let i = 0; i < (strength ? 14 : 0); i++) {
    const y = r() * 160, a = (r() - 0.5) * 18;
    paths += `<path d="M-20 ${y.toFixed(1)} C 150 ${(y + a).toFixed(1)}, 450 ${(y - a).toFixed(1)}, 620 ${(y + a * 0.4).toFixed(1)}" stroke="${r() < 0.25 ? light : dark}" stroke-width="${(0.5 + r() * 1.8).toFixed(2)}" fill="none" opacity="${((0.22 + r() * 0.4) * strength).toFixed(2)}"/>`;
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

export function render(p) {
  const wood = WOODS[p.wood] || WOODS.Oak, id = "w" + (++uid), hex = wood.hex;
  const seed = hashStr(p.type + p.wood + p.width);
  const sheen = {"Hardwax oil": 0.16, "Stain + satin": 0.12, "Matte paint": 0.03}[wood.finish] ?? 0.1;
  const colors = LIGHTS[p.light];
  const G = `url(#${id}g)`, S = `url(#${id}s)`, D = `url(#${id}d)`;
  const top = shade(hex, 0.12), side = shade(hex, -0.2), dark = shade(hex, -0.5);
  let defs = grainDefs(id + "g", hex, seed, wood.grain) +
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
    // engraved initials on the front of the tray
    if (p.engrave) {
      const fs = Math.min(15, bh * 0.42);
      body += `<text x="${bx + bw / 2}" y="${by + bh - bh * 0.18}" text-anchor="middle" font-family="Georgia, serif" font-size="${fs.toFixed(1)}" letter-spacing="${(fs * 0.25).toFixed(1)}" fill="${shade(hex, -0.55)}" opacity=".8">${esc(p.engrave)}</text>`;
    }
    // wallet, earbuds case and phone on a wireless pad, sitting in the tray
    const ty = by + 6 + bh * 0.2;
    body += `<path d="M ${bx + 16} ${ty} l 6 -26 h 48 l -4 26 Z" fill="#4A3426"/><path d="M ${bx + 24} ${ty - 22} h 40" stroke="#C8A04A" stroke-width="1.2" opacity=".6"/>`;
    const ex = bx + bw * 0.5 + 8;
    body += `<rect x="${ex}" y="${ty - 22}" width="34" height="24" rx="10" fill="#F4F4F2"/><path d="M ${ex} ${ty - 12} h 34" stroke="#D2D2CF" stroke-width="1"/>`;
    const cx = bx + bw * 0.78, pad = p.pad !== "Not included";
    if (pad) body += `<ellipse cx="${cx}" cy="${ty - 2}" rx="34" ry="9" fill="#1A1A1C"/><ellipse cx="${cx}" cy="${ty - 2}" rx="26" ry="6" fill="none" stroke="#34E27A" stroke-width="2" opacity=".85"/>`;
    body += `<path d="M ${cx - 30} ${ty - 6} L ${cx + 18} ${ty - 22} L ${cx + 40} ${ty - 14} L ${cx - 8} ${ty + 2} Z" fill="#1C1F24"/>
      <path d="M ${cx - 24} ${ty - 6} L ${cx + 16} ${ty - 19} L ${cx + 33} ${ty - 13} L ${cx - 7} ${ty} Z" fill="${pad ? "#0F2A1E" : "#15181C"}"/>`;
    if (pad) body += `<ellipse cx="${cx + 4}" cy="${ty - 10}" rx="8" ry="3" fill="none" stroke="#34E27A" stroke-width="1.4"/>`;
  }
  return `<svg viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(TYPES[p.type].label)} in ${esc(p.wood)}"><defs>${defs}</defs>${body}</svg>`;
}


// A flat sample of one material, for the materials section. The grain runs
// top to bottom, like a board standing on end.
export function swatch(name) {
  const wood = WOODS[name] || WOODS.Oak, id = "w" + (++uid);
  return `<svg viewBox="0 0 300 375" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(name)} sample"><defs>${grainDefs(id, wood.hex, hashStr(name), wood.grain)}</defs><rect width="375" height="300" fill="url(#${id})" transform="translate(300 0) rotate(90)"/></svg>`;
}
