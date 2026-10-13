/* 3D preview for the custom studio. Prototype: LED floating shelf only; the
   other pieces still use the drawings in drawing.js.

   The shelf is built from the design's real size in inches (1 unit = 1 inch),
   wrapped in the wood textures from textures/ (made by tools/make_textures.py)
   and hung on a wall. The LED strip runs under the back edge and washes the
   wall below. Customers can drag to turn it. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { WOODS, LIGHTS } from "./pricing.js?v=9";

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
const STRIP_SEGMENTS = 5;       // the strip is split so RGB can fade along it
const LED_NITS = 90;
const EDGE_RADIUS = {square: 0.05, rounded: 0.4};

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
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, {enablePan: false, enableZoom: false, enableDamping: false, rotateSpeed: 0.6,
    minAzimuthAngle: -0.75, maxAzimuthAngle: 0.75, minPolarAngle: 0.95, maxPolarAngle: 1.7});
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
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(600, 400),
    new THREE.MeshStandardMaterial({color: "#E7E2DA", roughness: 0.95}));
  wall.position.y = -40;
  wall.receiveShadow = true;
  scene.add(wall);

  // Soft darkening where the shelf meets the wall, which the lights alone don't give.
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({map: softRect(), transparent: true, depthWrite: false, opacity: 0.55, color: "#000"}));
  contact.position.z = 0.02;
  scene.add(contact);

  const hemi = new THREE.HemisphereLight("#FFF6EC", "#3A2E26", 0.4);
  scene.add(hemi);
  const key = new THREE.DirectionalLight("#FFF1E2", 2);
  key.position.set(-70, 110, 120);
  key.castShadow = true;
  Object.assign(key.shadow, {radius: 10, blurSamples: 16, bias: -0.0004});
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -60, right: 60, top: 40, bottom: -40, near: 10, far: 400});
  scene.add(key, key.target);

  /* ---------- the shelf ---------- */
  const shelf = new THREE.Mesh(new THREE.BufferGeometry(), []);
  shelf.castShadow = shelf.receiveShadow = true;
  scene.add(shelf);

  const strip = [];
  for (let i = 0; i < STRIP_SEGMENTS; i++) {
    const light = new THREE.RectAreaLight("#fff", 0, 1, 0.5);
    strip.push(light);
    scene.add(light);
  }
  const glowBar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.4), new THREE.MeshBasicMaterial({toneMapped: false}));
  scene.add(glowBar);

  const props = makeProps();
  scene.add(props.group);

  const materials = {};
  function materialFor(wood) {
    if (!materials[wood]) {
      const f = FINISHES[wood];
      materials[wood] = Promise.all(f.tex ? [load(`textures/${f.tex}.jpg`, true), load(`textures/${f.tex}-bump.jpg`, false)] : [null, paintBump])
        .then(([map, bump]) => {
          const face = new THREE.MeshPhysicalMaterial({
            map, color: map ? "#fff" : WOODS[wood].hex, bumpMap: bump, bumpScale: f.bump,
            roughness: f.roughness, clearcoat: f.clearcoat, clearcoatRoughness: 0.45
          });
          // End grain soaks up more finish, so it reads darker and duller.
          const end = face.clone();
          end.color.multiplyScalar(map ? 0.72 : 0.94);
          end.roughness = Math.min(1, f.roughness + 0.15);
          return [end, end, face, face, face, face];   // BoxGeometry face order: +x, -x, +y, -y, +z, -z
        });
    }
    return materials[wood];
  }

  /* ---------- updating ---------- */
  let spec = null, mood = "evening", shape = "";
  const target = new THREE.Vector3();
  camera.position.set(-0.3, 0.36, 1).normalize();   // a little left and above, like a product photo

  function build() {
    const W = spec.width, T = spec.height, D = spec.depth;
    const newShape = [W, T, D, spec.edge].join();
    if (newShape !== shape) {
      shape = newShape;
      shelf.geometry.dispose();
      shelf.geometry = woodUVs(new RoundedBoxGeometry(W, T, D, 5, Math.min(EDGE_RADIUS[spec.edge], T / 2 - 0.01)));
      shelf.position.set(0, 0, D / 2);
      contact.scale.set(W + 5, T + 5, 1);
      props.place(W, T, D);
    }
    // LED strip under the back edge, angled toward the wall.
    const colors = LIGHTS[spec.light] || LIGHTS["Warm white"];
    const segW = (W - 2) / STRIP_SEGMENTS;
    strip.forEach((light, i) => {
      const color = colors[Math.round(i / (STRIP_SEGMENTS - 1) * (colors.length - 1))];
      light.color.set(color);
      light.width = segW;
      light.position.set(-W / 2 + 1 + segW * (i + 0.5), -T / 2 - 0.05, 1.2);
      light.lookAt(light.position.x, -T / 2 - 10, -2.6);
    });
    glowBar.scale.set(W - 2, 1, 1);
    glowBar.position.set(0, -T / 2 - 0.1, 1.2);
    glowBar.material.color.set(colors.length > 1 ? "#ffffff" : colors[0]);
    applyMood();
    frame();
  }

  function applyMood() {
    const m = MOODS[mood];
    scene.environmentIntensity = m.env;
    key.intensity = m.key;
    hemi.intensity = m.env * 0.5;
    strip.forEach(l => { l.intensity = LED_NITS * m.led; });
  }

  // Keep the viewing angle the customer chose, and fit the shelf (plus its glow) in view.
  function frame() {
    const W = Math.max(spec.width, 20), D = spec.depth;
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight) || 480 / 340;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
    // Wide enough for the shelf with some wall either side, tall enough for the props and the glow below.
    const dist = Math.max((W * 1.3 / 2) / Math.tan(hfov / 2), 14 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) + D;
    const dir = camera.position.clone().sub(controls.target).normalize();
    target.set(0, -0.5, D / 2);
    controls.target.copy(target);
    camera.position.copy(target).addScaledVector(dir, dist);
    controls.update();
    key.target.position.set(0, 0, D / 2);
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    if (spec) { frame(); render(); }
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
  ui.querySelector(".mood").onclick = e => {
    const b = e.target.closest("[data-mood]");
    if (!b) return;
    mood = b.dataset.mood;
    ui.querySelectorAll("[data-mood]").forEach(x => x.setAttribute("aria-pressed", x === b));
    applyMood();
    render();
  };

  let showing = false, request = 0;
  return {
    // Show this design. Resolves once its materials have loaded and it's on screen.
    async show(next) {
      spec = {...next};
      const mine = ++request;
      const mats = await materialFor(spec.wood);
      if (mine !== request) return;   // a newer design arrived while textures loaded
      shelf.material = mats;
      if (!showing) {
        showing = true;
        stage.prepend(canvas);
        stage.append(ui);
        resize();
      }
      build();
      render();
    },
    hide() {
      if (!showing) return;
      showing = false;
      request++;
      canvas.remove();
      ui.remove();
    }
  };
}

/* Wood grain runs along the shelf on the top, front and bottom, and wraps
   round the edges without a seam. The short ends show end grain. Texture
   coordinates are in inches, matching the 64 x 16 inch texture images. */
function woodUVs(geo) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const [a, b] = Math.abs(nor.getX(i)) > 0.7 ? [z + 20, y] : [x, z - y];
    uv.setXY(i, (a + 32) / 64, (b + 8) / 16);
  }
  uv.needsUpdate = true;
  return geo;
}

// A blurred dark rectangle, for the soft shadow where the shelf meets the wall.
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

// A ceramic vase and a few books, for a sense of scale.
function makeProps() {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshStandardMaterial({color: "#E6DDCF", roughness: 0.55});
  const profile = [[0, 0], [1.5, 0], [1.85, 0.35], [2.05, 1.6], [1.95, 3.4], [1.45, 5.2], [0.85, 6.4], [0.62, 7.4], [0.72, 8.3], [0.6, 8.4], [0.5, 8.0]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const vase = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), ceramic);
  vase.castShadow = vase.receiveShadow = true;
  group.add(vase);

  const books = new THREE.Group();
  const BOOKS = [[1.1, 9.2, "#2F3640"], [0.8, 8.6, "#B98B4C"], [1.3, 9.6, "#7F8E7E"], [0.9, 8.2, "#5A3A26"]];
  const pages = new THREE.MeshStandardMaterial({color: "#EFE6D6", roughness: 0.9});
  let x = 0;
  for (const [t, h, color] of BOOKS) {
    const cover = new THREE.MeshStandardMaterial({color, roughness: 0.7});
    const book = new THREE.Mesh(new RoundedBoxGeometry(t, h, 6, 2, 0.08), [cover, cover, pages, cover, cover, cover]);
    book.position.set(x + t / 2, h / 2, 0);
    book.castShadow = book.receiveShadow = true;
    books.add(book);
    x += t + 0.05;
  }
  books.userData.width = x;
  group.add(books);

  return {
    group,
    // Put the props on a shelf of this size, leaving them off shelves too small for them.
    place(W, T, D) {
      const depth = Math.min(6, D - 1) / 6;
      vase.visible = W >= 14;
      vase.position.set(W >= 24 ? -W * 0.28 : 0, T / 2, D * 0.5);
      vase.scale.setScalar(Math.min(1, D / 7));
      books.visible = W >= 24;
      books.position.set(W * 0.2 - books.userData.width / 2, T / 2, D * 0.5);
      books.scale.set(1, 1, depth);
    }
  };
}
