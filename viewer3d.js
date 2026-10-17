/* 3D preview for the custom studio.

   Each piece is built from the design's real size in inches (1 unit = 1 inch)
   and wrapped in the wood textures from textures/ (made by
   tools/make_textures.py). The LED shelf hangs on a wall with its strip
   washing the wall below; the cologne steps and charging station stand on a
   tabletop in front of a wall. Customers can drag to turn the piece. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { WOODS, LIGHTS } from "./pricing.js?v=14";

// How each material looks. tex: which textures/ file; null means paint.
const FINISHES = {
  "Oak":         {tex: "oak",        roughness: 0.52, clearcoat: 0.2,  bump: 0.9},
  "Walnut":      {tex: "walnut",     roughness: 0.48, clearcoat: 0.25, bump: 0.7},
  "Dark stain":  {tex: "dark-stain", roughness: 0.42, clearcoat: 0.35, bump: 0.5},
  "Matte black": {tex: null,         roughness: 0.78, clearcoat: 0,    bump: 0.25},
  "Matte white": {tex: null,         roughness: 0.85, clearcoat: 0,    bump: 0.25}
};
// Room light, key light and LED strength for each view.
const MOODS = {
  day:     {env: 0.42, key: 1.45, led: 0.45},
  evening: {env: 0.15, key: 0.6, led: 0.85}
};
// LED strips are drawn with a fixed set of area lights (changing the count
// would make the browser rebuild its shaders mid-drag). RGB strips are split
// into segments so the colors fade along them.
const AREA_LIGHTS = 6;
const LED_NITS = 90;
const edgeRadius = (edge, thinnest) => Math.min(edge === "rounded" ? 0.4 : 0.05, thinnest / 2 - 0.01);

export async function createViewer(stage) {
  const canvas = document.createElement("canvas");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: "low-power"});
  } catch {
    return null;   // no WebGL: the studio keeps using drawings
  }
  canvas.className = "stage-3d";
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#2A2521");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(26, 480 / 340, 1, 2000);
  camera.position.set(-0.3, 0.36, 1).normalize();   // a little left and above, like a product photo
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, {enablePan: false, enableZoom: false, enableDamping: false, rotateSpeed: 0.6,
    minAzimuthAngle: -0.75, maxAzimuthAngle: 0.75, minPolarAngle: 0.9, maxPolarAngle: 1.7});
  // Let the page scroll when someone swipes up or down over the preview on a phone.
  canvas.style.touchAction = "pan-y";

  /* ---------- the room ---------- */
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const load = (url, srgb) => loader.loadAsync(url).then(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
  const paintBump = await load("textures/paint-bump.jpg", false);

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshStandardMaterial({color: "#E7E2DA", roughness: 0.95}));
  wall.position.y = -40;
  wall.receiveShadow = true;
  // The top of a painted dresser, for pieces that stand rather than hang.
  const table = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshStandardMaterial({color: "#D3CCC1", roughness: 0.62}));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  // Soft darkening where a piece meets the wall or table, which the lights alone don't give.
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({map: softRect(), transparent: true, depthWrite: false, color: "#000"}));
  scene.add(wall, table, contact);

  const hemi = new THREE.HemisphereLight("#FFF6EC", "#3A2E26", 0.4);
  const key = new THREE.DirectionalLight("#FFF1E2", 2);
  key.position.set(-70, 110, 120);
  key.castShadow = true;
  Object.assign(key.shadow, {radius: 10, blurSamples: 16, bias: -0.0004});
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -60, right: 60, top: 40, bottom: -40, near: 10, far: 400});
  scene.add(hemi, key, key.target);

  const areaLights = Array.from({length: AREA_LIGHTS}, () => {
    const light = new THREE.RectAreaLight("#fff", 0, 1, 0.5);
    scene.add(light);
    return light;
  });

  const kit = makeKit();
  let piece = new THREE.Group();
  scene.add(piece);

  // Wood materials, loaded once per material: the face grain and a darker end grain.
  const woods = {};
  function woodFor(name) {
    if (!woods[name]) {
      const f = FINISHES[name];
      woods[name] = Promise.all(f.tex ? [load(`textures/${f.tex}.jpg`, true), load(`textures/${f.tex}-bump.jpg`, false)] : [null, paintBump])
        .then(([map, bump]) => {
          const face = new THREE.MeshPhysicalMaterial({
            map, color: map ? "#fff" : WOODS[name].hex, bumpMap: bump, bumpScale: f.bump,
            roughness: f.roughness, clearcoat: f.clearcoat, clearcoatRoughness: 0.45
          });
          // End grain soaks up more finish, so it reads darker and duller.
          const end = face.clone();
          end.color.multiplyScalar(map ? 0.72 : 0.94);
          end.roughness = Math.min(1, f.roughness + 0.15);
          return {face, end};
        });
    }
    return woods[name];
  }

  /* ---------- updating ---------- */
  let spec = null, wood = null, mood = "evening", moodPicked = false, view = null;

  function build() {
    // Materials are shared, so they stay, except ones made for a single piece (engraving).
    piece.traverse(o => {
      o.geometry?.dispose();
      if (o.userData.ownMaterial) { o.material.map?.dispose(); o.material.dispose(); }
    });
    scene.remove(piece);
    piece = new THREE.Group();
    scene.add(piece);
    view = BUILDERS[spec.type](spec, piece, wood, kit);

    const onWall = view.mount === "wall";
    table.visible = !onWall;
    wall.position.z = onWall ? 0 : -view.gap;
    // The contact shadow's dark core covers 176 x 48 of its 256 x 128 texture.
    if (onWall) {
      contact.rotation.set(0, 0, 0);
      contact.position.set(0, 0, 0.02);
      contact.scale.set(spec.width / 0.6875, spec.height / 0.375, 1);
      contact.material.opacity = 0.55;
    } else {
      contact.rotation.set(-Math.PI / 2, 0, 0);
      contact.position.set(view.footprint.x, 0.02, view.footprint.z);
      contact.scale.set(view.footprint.w / 0.6875, view.footprint.d / 0.375, 1);
      contact.material.opacity = 0.4;
    }
    placeStrips(view.strips || []);
    if (!moodPicked) setMood(view.lit ? "evening" : "day");
    applyMood();
    frame();
  }

  // Point the area lights along each strip, and draw the glowing strip itself.
  function placeStrips(strips) {
    const colors = LIGHTS[spec.light] || ["#fff"];
    const segs = colors.length > 1 && strips.length ? Math.min(5, Math.floor(AREA_LIGHTS / strips.length)) : 1;
    let n = 0;
    for (const s of strips) {
      const segW = s.width / segs;
      for (let i = 0; i < segs; i++, n++) {
        const light = areaLights[n];
        light.color.set(colors[Math.round((segs > 1 ? i / (segs - 1) : 0) * (colors.length - 1))]);
        light.width = segW;
        light.height = 0.5;
        light.position.set(s.x - s.width / 2 + segW * (i + 0.5), s.y, s.z);
        light.lookAt(light.position.x + s.aim[0], s.y + s.aim[1], s.z + s.aim[2]);
        light.userData.power = s.power ?? 1;
      }
      const glow = new THREE.Mesh(new THREE.BoxGeometry(s.width, 0.18, 0.35), colors.length > 1 ? kit.rgbStrip : kit.ledStrip(colors[0]));
      glow.position.set(s.x, s.y, s.z);
      piece.add(glow);
    }
    for (; n < AREA_LIGHTS; n++) areaLights[n].userData.power = 0;
  }

  function applyMood() {
    const m = MOODS[mood];
    scene.environmentIntensity = m.env;
    key.intensity = m.key;
    hemi.intensity = m.env * 0.5;
    areaLights.forEach(l => { l.intensity = LED_NITS * m.led * (l.userData.power || 0); });
  }

  // Keep the viewing angle the customer chose, and fit the piece in view.
  function frame() {
    const b = view.bounds;
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight) || 480 / 340;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const vfov = THREE.MathUtils.degToRad(camera.fov / 2);
    const hfov = Math.atan(Math.tan(vfov) * aspect);
    const dist = Math.max((b.w * 1.3 / 2) / Math.tan(hfov), (b.h * 1.15 / 2) / Math.tan(vfov)) + b.d;
    const dir = camera.position.clone().sub(controls.target).normalize();
    controls.target.set(b.x, b.y, b.z);
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    controls.update();
    key.target.position.set(b.x, 0, b.z);
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    if (view) { frame(); render(); }
  }
  const render = () => renderer.render(scene, camera);
  controls.addEventListener("change", render);
  controls.addEventListener("start", () => hint.classList.add("used"));
  new ResizeObserver(resize).observe(stage);

  /* ---------- controls drawn over the preview ---------- */
  const ui = document.createElement("div");
  ui.className = "stage-ui";
  ui.innerHTML = `<div class="mood" role="group" aria-label="Room lighting">
      <button type="button" data-mood="day" aria-pressed="false">Day</button><button type="button" data-mood="evening" aria-pressed="true">Evening</button>
    </div><span class="stage-hint">Drag to turn</span>`;
  const hint = ui.querySelector(".stage-hint");
  function setMood(m) {
    mood = m;
    ui.querySelectorAll("[data-mood]").forEach(x => x.setAttribute("aria-pressed", x.dataset.mood === m));
  }
  ui.querySelector(".mood").onclick = e => {
    const b = e.target.closest("[data-mood]");
    if (!b) return;
    moodPicked = true;
    setMood(b.dataset.mood);
    applyMood();
    render();
  };

  let showing = false, request = 0;
  return {
    // Show this design. Resolves once its materials have loaded and it's on screen.
    async show(next) {
      const mine = ++request;
      const mats = await woodFor(next.wood);
      if (mine !== request) return;   // a newer design arrived while textures loaded
      spec = {...next};
      wood = mats;
      if (!showing) {
        showing = true;
        stage.prepend(canvas);
        stage.append(ui);
        resize();
      }
      build();
      render();
    }
  };
}

/* ---------- the pieces ----------
   Each builder adds its meshes to the group and returns how to show it:
   mount ("wall" or "table"), the gap to the wall, the footprint for the
   contact shadow, LED strips ({x, y, z, width, aim, power}), whether it's a lit
   piece, and bounds ({x, y, z, w, h, d}) for framing the camera. */
const BUILDERS = {led: buildShelf, cologne: buildSteps, charger: buildCharger};

function buildShelf(p, group, wood, kit) {
  const W = p.width, T = p.height, D = p.depth;
  const shelf = woodPart(new RoundedBoxGeometry(W, T, D, 5, edgeRadius(p.edge, T)), "x", wood);
  shelf.position.set(0, 0, D / 2);
  group.add(shelf);

  // A vase and books for scale, left off shelves too small for them.
  if (W >= 14) {
    const vase = kit.vase();
    vase.position.set(W >= 24 ? -W * 0.28 : 0, T / 2, D / 2);
    vase.scale.setScalar(Math.min(1, D / 7));
    group.add(vase);
  }
  if (W >= 24) {
    const books = kit.books(Math.min(6, D - 1));
    books.position.set(W * 0.2 - books.userData.width / 2, T / 2, D / 2);
    group.add(books);
  }
  return {
    mount: "wall", lit: true,
    // The strip runs under the back edge, angled toward the wall.
    strips: [{x: 0, y: -T / 2 - 0.05, z: 1.2, width: W - 2, aim: [0, -10, -3.8]}],
    bounds: {x: 0, y: -0.5, z: D / 2, w: Math.max(W, 20), h: 24, d: D}
  };
}

function buildSteps(p, group, wood, kit) {
  const n = Math.round(p.height), W = p.width, D = p.depth;
  const rise = 2.25, tread = D / n, R = p.edge === "rounded" ? 0.3 : 0.04;

  // The side profile of the steps (z toward the front, y up), with the
  // outside corners rounded. It's drawn as x = -z so that turning the
  // extrusion to run along the width puts the front of the steps forward.
  const shape = new THREE.Shape();
  const corner = (z, y, fromUp) => {
    // An outside corner reached going up the riser, leaving along the tread toward the back.
    if (fromUp) { shape.lineTo(-z, y - R); shape.quadraticCurveTo(-z, y, -(z - R), y); }
    else { shape.lineTo(-(z + R), y); shape.quadraticCurveTo(-z, y, -z, y - R); }
  };
  shape.moveTo(-D, 0);
  for (let i = 0; i < n; i++) {
    const front = D - i * tread, top = (i + 1) * rise;
    corner(front, top, true);
    if (i < n - 1) shape.lineTo(-(front - tread), top);
  }
  corner(0, n * rise, false);
  shape.lineTo(0, 0);
  shape.lineTo(-D, 0);

  const bevel = Math.min(R, 0.25);
  const geo = new THREE.ExtrudeGeometry(shape, {depth: W - 2 * bevel, curveSegments: 8,
    bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 3});
  geo.rotateY(Math.PI / 2);
  geo.translate(-W / 2 + bevel, 0, 0);
  grainUVs(geo, "x");
  // Veneered all over, so the ends show face grain too.
  const steps = new THREE.Mesh(geo, [wood.face, wood.face]);
  steps.castShadow = steps.receiveShadow = true;
  group.add(steps);

  // Bottles on every step, and an LED strip at the back of each tread that
  // lights the riser behind the bottles.
  const rand = rng(7);
  const strips = [];
  const lit = p.light !== "None";
  for (let i = 0; i < n; i++) {
    const back = D - (i + 1) * tread, y = (i + 1) * rise;
    const count = Math.max(2, Math.min(5, Math.round(W / 7)));
    const gap = (W - 1.5) / count;
    for (let j = 0; j < count; j++) {
      const bottle = kit.bottle(rand, Math.min(1.5, tread - 0.5));
      bottle.position.set(-W / 2 + 0.75 + gap * (j + 0.5) + (rand() - 0.5) * gap * 0.15, y, back + tread * 0.55);
      group.add(bottle);
    }
    if (lit && i < n - 1) strips.push({x: 0, y: y + 0.1, z: back + 0.25, width: W - 1.2, aim: [0, 3, -2.5], power: 0.45});
  }
  return {
    mount: "table", gap: 2.5, lit,
    footprint: {x: 0, z: D / 2, w: W, d: D},
    strips,
    bounds: {x: 0, y: (n * rise + 5) / 2, z: D / 2, w: Math.max(W, 16), h: n * rise + 8, d: D}
  };
}

function buildCharger(p, group, wood, kit) {
  const W = p.width, D = p.depth, H = p.height;
  const t = 0.45, plate = 0.45, rimH = 0.9;      // tray wall thickness, floor thickness, tray height
  const r = (thinnest) => edgeRadius(p.edge, thinnest);
  const add = (geo, long, x, y, z, offset) => {
    const part = woodPart(geo, long, wood, offset);
    part.position.set(x, y, z);
    group.add(part);
    return part;
  };

  // The tray: a floor with four rims.
  add(new RoundedBoxGeometry(W, plate, D, 3, r(plate)), "x", 0, plate / 2, 0, 0);
  add(new RoundedBoxGeometry(W, rimH, t, 3, r(t)), "x", 0, rimH / 2, D / 2 - t / 2, 9);
  add(new RoundedBoxGeometry(W, rimH, t, 3, r(t)), "x", 0, rimH / 2, -D / 2 + t / 2, 17);
  add(new RoundedBoxGeometry(t, rimH, D - 2 * t, 3, r(t)), "z", -W / 2 + t / 2, rimH / 2, 0, 5);
  add(new RoundedBoxGeometry(t, rimH, D - 2 * t, 3, r(t)), "z", W / 2 - t / 2, rimH / 2, 0, 13);

  // Engraved initials on the front rim. Engraving cuts through paint to bare
  // wood, so it shows light on dark paint and dark on everything else.
  if (p.engrave) {
    const tag = kit.engraving(p.engrave, rimH * 0.9, p.wood === "Matte black" || p.wood === "Dark stain" ? "#D9B98E" : "#2A170B");
    tag.position.set(0, rimH / 2, D / 2 + 0.012);
    group.add(tag);
  }

  // The post at the back, a headphone arm near the top and a lower watch bar.
  const post = 1.4, pz = -D / 2 + t + post / 2 + 0.25, postH = H - plate;
  add(new RoundedBoxGeometry(post, postH, post, 4, r(post)), "y", 0, plate + postH / 2, pz, 23);
  const armLen = W / 2 + 1.5, armY = H - 1, arm = 0.9;
  add(new RoundedBoxGeometry(armLen, arm, arm, 4, r(arm)), "x", -post / 2 - armLen / 2 + 0.2, armY, pz, 31);
  const barLen = W / 2 + 0.2, barY = H * 0.66, bar = 0.75;
  add(new RoundedBoxGeometry(barLen, bar, bar, 4, r(bar)), "x", post / 2 + barLen / 2 - 0.2, barY, pz, 37);

  const phones = kit.headphones();
  phones.position.set(-post / 2 - armLen * 0.55, armY + arm / 2, pz);
  group.add(phones);
  [[0.38, "analog"], [0.78, "smart"]].forEach(([at, kind]) => {
    const watch = kit.watch(kind);
    watch.position.set(post / 2 + barLen * at, barY + bar / 2, pz);
    group.add(watch);
  });

  // What sits in the tray: a phone on the charging pad (right), a wallet and earbuds (left).
  const floor = plate, inside = D - 2 * t, rightW = W / 2 - t - post / 2 - 0.2;
  const phoneLen = Math.min(5.8, inside - 0.3);
  const px = post / 2 + 0.2 + rightW / 2, phoneZ = (D / 2 - t) - phoneLen / 2 - 0.15;
  let phoneY = floor;
  if (p.pad === "Included") {
    const pad = kit.pad(Math.min(1.8, rightW / 2 - 0.1));
    pad.position.set(px, floor, phoneZ);
    group.add(pad);
    phoneY += pad.userData.height;
  }
  const phone = kit.phone(phoneLen, rightW - 0.3);
  phone.position.set(px, phoneY, phoneZ);
  phone.rotation.y = 0.06;
  group.add(phone);
  const leftW = W / 2 - t - post / 2 - 0.2, lx = -post / 2 - 0.2 - leftW / 2;
  const wallet = kit.wallet(Math.min(3.4, leftW - 0.3), Math.min(4, inside - (inside >= 6 ? 2.1 : 0.4)));
  wallet.position.set(lx, floor, -D / 2 + t + wallet.userData.depth / 2 + 0.2);
  wallet.rotation.y = -0.07;
  group.add(wallet);
  if (inside >= 6) {
    const buds = kit.earbuds();
    buds.position.set(lx + 0.3, floor, D / 2 - t - 1.0);
    buds.rotation.y = 0.35;
    group.add(buds);
  }

  const left = -post / 2 - armLen, right = W / 2;
  return {
    mount: "table", gap: D / 2 + 3, lit: false,   // room behind for the headphones' back cup
    footprint: {x: 0, z: 0, w: W, d: D},
    bounds: {x: (left + right) / 2, y: H / 2 + 0.5, z: 0, w: Math.max(right - left + 2, 14), h: H + 3, d: D / 2}
  };
}

/* ---------- helpers ---------- */

// A wood part with its grain along one axis: end grain on the two faces across it.
function woodPart(geo, long, wood, offset = 0) {
  grainUVs(geo, long, offset);
  const ends = {x: [0, 1], y: [2, 3], z: [4, 5]}[long];   // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(geo, [0, 1, 2, 3, 4, 5].map(i => ends.includes(i) ? wood.end : wood.face));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/* Texture coordinates in inches, matching the 64 x 16 inch texture images.
   The grain runs along the part's long axis and wraps round its edges
   without a seam; faces across the grain get the end-grain mapping. offset
   shifts which stretch of the board a part shows, so parts don't repeat. */
function grainUVs(geo, long, offset = 0) {
  const L = {x: 0, y: 1, z: 2}[long];
  const [A, B] = [2, 1, 0].filter(i => i !== L);
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  const p = [0, 0, 0], n = [0, 0, 0];
  for (let i = 0; i < pos.count; i++) {
    p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i);
    n[0] = nor.getX(i); n[1] = nor.getY(i); n[2] = nor.getZ(i);
    const [a, b] = Math.abs(n[L]) > 0.7 ? [p[A] + 20, p[B]] : [p[L] + offset, p[A] - p[B]];
    uv.setXY(i, (a + 32) / 64, (b + 8) / 16);
  }
  uv.needsUpdate = true;
  return geo;
}

// A blurred dark rectangle, for the soft shadow where a piece meets the wall or table.
function softRect() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const ctx = c.getContext("2d");
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 1000;
  ctx.fillRect(-1000 + 40, 40, 176, 48);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const shadowed = mesh => { mesh.castShadow = mesh.receiveShadow = true; return mesh; };

/* The things shown with the pieces, for scale: a vase and books, cologne
   bottles, headphones, watches, a phone, a wallet and earbuds. Materials
   are made once and shared; each call makes fresh geometry. */
function makeKit() {
  const std = (color, roughness, extra) => new THREE.MeshStandardMaterial({color, roughness, ...extra});
  const M = {
    ceramic: std("#E6DDCF", 0.55),
    pages: std("#EFE6D6", 0.9),
    covers: ["#2F3640", "#B98B4C", "#7F8E7E", "#5A3A26"].map(c => std(c, 0.7)),
    glass: ["#C98A3C", "#5B6B73", "#BFD6DD", "#7A2E2E", "#2E3B4E"].map(c => new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.06, transmission: 1, thickness: 1.2, ior: 1.5, attenuationColor: c, attenuationDistance: 1.4})),
    caps: [std("#141414", 0.4), new THREE.MeshStandardMaterial({color: "#C8A04A", metalness: 1, roughness: 0.28}), std("#2A2A2A", 0.3)],
    headphone: std("#26262A", 0.55),
    cushion: std("#1A1A1D", 0.85),
    strap: std("#3A3A3C", 0.6),
    navy: std("#1F2A3A", 0.55),
    steel: new THREE.MeshStandardMaterial({color: "#B8B8BC", metalness: 1, roughness: 0.25}),
    dial: std("#EFE6D8", 0.4),
    black: std("#111214", 0.3),
    screen: new THREE.MeshPhysicalMaterial({color: "#07090C", roughness: 0.05, clearcoat: 1}),
    frame: new THREE.MeshStandardMaterial({color: "#4A4D52", metalness: 0.8, roughness: 0.35}),
    leather: std("#4A3426", 0.55),
    white: new THREE.MeshPhysicalMaterial({color: "#F4F4F2", roughness: 0.25, clearcoat: 0.6}),
    pad: std("#1A1A1C", 0.6),
    padRing: new THREE.MeshBasicMaterial({color: "#34E27A", toneMapped: false})
  };
  const rgbTexture = (() => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 1;
    const ctx = c.getContext("2d"), g = ctx.createLinearGradient(0, 0, 256, 0);
    LIGHTS.RGB.forEach((color, i) => g.addColorStop(i / (LIGHTS.RGB.length - 1), color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 1);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const stripMats = {};

  return {
    rgbStrip: new THREE.MeshBasicMaterial({map: rgbTexture, toneMapped: false}),
    ledStrip: color => stripMats[color] ||= new THREE.MeshBasicMaterial({color, toneMapped: false}),

    vase() {
      const profile = [[0, 0], [1.5, 0], [1.85, 0.35], [2.05, 1.6], [1.95, 3.4], [1.45, 5.2], [0.85, 6.4], [0.62, 7.4], [0.72, 8.3], [0.6, 8.4], [0.5, 8.0]]
        .map(([r, y]) => new THREE.Vector2(r, y));
      return shadowed(new THREE.Mesh(new THREE.LatheGeometry(profile, 48), M.ceramic));
    },

    books(depth) {
      const g = new THREE.Group();
      let x = 0;
      [[1.1, 9.2], [0.8, 8.6], [1.3, 9.6], [0.9, 8.2]].forEach(([w, h], i) => {
        const c = M.covers[i];
        const book = shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, h, depth, 2, 0.08), [c, c, M.pages, c, c, c]));
        book.position.set(x + w / 2, h / 2, 0);
        g.add(book);
        x += w + 0.05;
      });
      g.userData.width = x;
      return g;
    },

    // A cologne bottle standing on its base, no deeper than maxDepth.
    bottle(rand, maxDepth) {
      const g = new THREE.Group();
      const glass = M.glass[Math.floor(rand() * M.glass.length)], cap = M.caps[Math.floor(rand() * M.caps.length)];
      const kind = rand();
      let top;
      if (kind < 0.45) {          // flat rectangular flask
        const w = 1.9 + rand() * 0.6, h = 3 + rand() * 1.2, d = Math.min(1.25, maxDepth);
        const body = shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(0.25, d / 2 - 0.01)), glass));
        body.position.y = h / 2;
        g.add(body);
        top = h;
      } else if (kind < 0.75) {   // tall round bottle
        const rad = Math.min(0.8, maxDepth / 2), h = 3.6 + rand() * 1.2;
        const body = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 32), glass));
        body.position.y = h / 2;
        g.add(body);
        top = h;
      } else {                    // chunky square bottle
        const s = Math.min(1.9, maxDepth), h = 2.4 + rand() * 0.6;
        const body = shadowed(new THREE.Mesh(new RoundedBoxGeometry(s, h, s, 3, 0.2), glass));
        body.position.y = h / 2;
        g.add(body);
        top = h;
      }
      const neck = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.3, 16), M.steel));
      neck.position.y = top + 0.15;
      const tall = rand() < 0.5;
      const capMesh = shadowed(new THREE.Mesh(tall ? new THREE.CylinderGeometry(0.5, 0.5, 1.1, 24) : new RoundedBoxGeometry(1.1, 0.8, 0.8, 2, 0.12), cap));
      capMesh.position.y = top + 0.3 + (tall ? 0.55 : 0.4);
      g.add(neck, capMesh);
      return g;
    },

    // Over-ear headphones hanging over an arm that runs along x; y = 0 is the top of the arm.
    headphones() {
      const g = new THREE.Group();
      const R = 3, tube = 0.3;
      const band = shadowed(new THREE.Mesh(new THREE.TorusGeometry(R, tube, 12, 48, Math.PI), M.headphone));
      band.rotation.y = Math.PI / 2;
      band.position.y = tube - R;
      g.add(band);
      for (const side of [-1, 1]) {
        const cup = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 1.1, 40), M.headphone));
        cup.rotation.x = Math.PI / 2;
        cup.scale.set(0.85, 1, 1.08);
        cup.position.set(0, tube - R - 1.5, side * (R - 0.2));
        const pad = shadowed(new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.38, 12, 32), M.cushion));
        pad.scale.set(0.85, 1.08, 1);
        pad.position.set(0, tube - R - 1.5, side * (R - 0.85));
        const yoke = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.18), M.steel));
        yoke.position.set(0, tube - R - 0.3, side * (R - 0.05));
        g.add(cup, pad, yoke);
      }
      return g;
    },

    // A watch with its strap looped over a bar that runs along x; y = 0 is the top of the bar.
    watch(kind) {
      const g = new THREE.Group();
      const loop = shadowed(new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.11, 8, 40), kind === "smart" ? M.navy : M.strap));
      loop.rotation.y = Math.PI / 2;
      loop.scale.set(1, 1, 3.6);   // flatten the tube into a strap about 0.8" wide
      loop.position.y = -0.95;
      g.add(loop);
      if (kind === "smart") {
        const body = shadowed(new THREE.Mesh(new RoundedBoxGeometry(1.55, 1.85, 0.45, 4, 0.36), M.black));
        const screen = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.6, 0.05, 2, 0.24), M.screen);
        body.position.set(0, -0.95, 1.2);
        screen.position.set(0, -0.95, 1.43);
        g.add(body, screen);
      } else {
        const body = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.38, 40), M.steel));
        const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.02, 40), M.dial);
        body.rotation.x = dial.rotation.x = Math.PI / 2;
        body.position.set(0, -0.95, 1.22);
        dial.position.set(0, -0.95, 1.42);
        const hand = (len, angle) => {
          const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, len, 0.02), M.black);
          h.geometry.translate(0, len / 2, 0);
          h.rotation.z = angle;
          h.position.set(0, -0.95, 1.44);
          return h;
        };
        g.add(body, dial, hand(0.45, -0.9), hand(0.6, 2.2));
      }
      return g;
    },

    // A wireless charging pad lying flat, with its status light.
    pad(radius) {
      const g = new THREE.Group();
      const disc = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.28, 48), M.pad));
      disc.position.y = 0.14;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.12, 0.03, 6, 48), M.padRing);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.285;
      g.add(disc, ring);
      g.userData.height = 0.28;
      return g;
    },

    // A phone lying screen up, sized to fit the space it's given.
    phone(len, maxW) {
      const w = Math.min(2.85 * len / 5.8, maxW), f = M.frame;
      const g = new THREE.Group();
      const body = shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, 0.32, len, 3, 0.15), [f, f, M.screen, f, f, f]));
      body.position.y = 0.16;
      g.add(body);
      return g;
    },

    wallet(w, d) {
      const g = new THREE.Group();
      const body = shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, 0.45, d, 3, 0.12), M.leather));
      body.position.y = 0.225;
      g.add(body);
      g.userData.depth = d;
      return g;
    },

    // Engraved letters as a flat label, height inches tall, for the front of a part.
    engraving(text, height, color) {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.font = "700 112px Georgia, serif";
      ctx.letterSpacing = "18px";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(text, 256, 68);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const mat = new THREE.MeshStandardMaterial({map: tex, transparent: true, roughness: 0.9, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2});
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * 4, height), mat);
      mesh.userData.ownMaterial = true;
      return mesh;
    },

    earbuds() {
      const g = new THREE.Group();
      const body = shadowed(new THREE.Mesh(new RoundedBoxGeometry(2.1, 0.85, 1.6, 4, 0.4), M.white));
      body.position.y = 0.425;
      g.add(body);
      return g;
    }
  };
}
