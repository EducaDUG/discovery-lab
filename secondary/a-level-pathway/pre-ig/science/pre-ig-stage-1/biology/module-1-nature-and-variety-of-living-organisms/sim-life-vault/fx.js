/* Life Vault — shared 3D/juice helpers, local to this activity.
   Three.js r128 is loaded globally from engine/vendor/three.min.js.
   Rules honoured here (CLAUDE.md §4, §6, §12.7):
   - textured, particle-dressed scenes with continuous idle motion;
   - drag-to-orbit uses a cumulative-travel threshold + touch-action:none;
   - game-state never depends on requestAnimationFrame (rAF only draws);
   - everything respects data-reduced-motion; no flashing. */
import { reduced } from "./data.js?v=1";

const T = () => window.THREE;
export const hasWebGL = (() => {
  try { const c = document.createElement("canvas"); return !!(window.THREE && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
  catch { return false; }
})();

/* ---------- textures ---------- */
export function glowTexture(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, inner); gr.addColorStop(0.35, inner.replace(/[\d.]+\)$/, "0.45)")); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new (T().CanvasTexture)(c); t.encoding = T().sRGBEncoding; return t;
}
export function noiseTexture(base = [40, 120, 90], spread = 40, size = 128, cells = false) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), d = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const x = i % size, y = (i / size) | 0;
    let n = (Math.sin(x * 0.21) + Math.sin(y * 0.17) + Math.sin((x + y) * 0.11)) * 0.5 + Math.random() * 1.2;
    if (cells) n += ((Math.sin(x * 0.6) * Math.sin(y * 0.6)) > 0.6 ? 1.6 : 0);
    for (let k = 0; k < 3; k++) d.data[i * 4 + k] = Math.max(0, Math.min(255, base[k] + n * spread * 0.4));
    d.data[i * 4 + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  const t = new (T().CanvasTexture)(c); t.wrapS = t.wrapT = T().RepeatWrapping; t.encoding = T().sRGBEncoding; return t;
}
/* a mesh-like lattice for cell walls: cellulose = fibres, chitin = hexes, peptidoglycan = net */
export function latticeTexture(kind, color) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, 256, 256);
  g.strokeStyle = color; g.lineWidth = kind === "cellulose" ? 5 : 4; g.globalAlpha = 0.95;
  if (kind === "cellulose") {
    for (let i = -256; i < 512; i += 22) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 140, 256); g.stroke(); }
    g.globalAlpha = 0.5; for (let i = -256; i < 512; i += 30) { g.beginPath(); g.moveTo(i, 256); g.lineTo(i + 160, 0); g.stroke(); }
  } else if (kind === "chitin") {
    const r = 18, h = r * Math.sqrt(3);
    for (let y = 0; y < 300; y += h) for (let x = 0, k = 0; x < 300; x += r * 1.5, k++) {
      const cy = y + (k % 2 ? h / 2 : 0); g.beginPath();
      for (let a = 0; a < 6; a++) { const ang = Math.PI / 3 * a; g[a ? "lineTo" : "moveTo"](x + r * Math.cos(ang), cy + r * Math.sin(ang)); }
      g.closePath(); g.stroke();
    }
  } else {
    for (let i = 0; i < 256; i += 26) { g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    g.lineWidth = 2; for (let i = 0; i < 256; i += 13) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); }
  }
  const t = new (T().CanvasTexture)(c); t.wrapS = t.wrapT = T().RepeatWrapping; t.repeat.set(3, 2); t.encoding = T().sRGBEncoding; return t;
}
/* text label as a sprite */
export function textSprite(text, { color = "#fff", bg = "rgba(8,20,28,.82)", border = "#5ee6c8", size = 44, padX = 26 } = {}) {
  const c = document.createElement("canvas"); const g = c.getContext("2d");
  g.font = `700 ${size}px system-ui, sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + padX * 2, h = size + 30;
  c.width = w; c.height = h;
  g.font = `700 ${size}px system-ui, sans-serif`;
  g.fillStyle = bg; roundRect(g, 3, 3, w - 6, h - 6, h / 2.2); g.fill();
  g.lineWidth = 4; g.strokeStyle = border; roundRect(g, 3, 3, w - 6, h - 6, h / 2.2); g.stroke();
  g.fillStyle = color; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText(text, w / 2, h / 2 + 2);
  const tex = new (T().CanvasTexture)(c); tex.encoding = T().sRGBEncoding; tex.anisotropy = 4;
  const s = new (T().Sprite)(new (T().SpriteMaterial)({ map: tex, transparent: true, depthWrite: false }));
  s.userData.aspect = w / h; s.scale.set(0.5 * w / h, 0.5, 1);
  return s;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* a photo, loaded as a texture that never renders black: drawn onto a canvas
   first (see commit ef4089b: some images uploaded as black otherwise). */
const photoCache = {};
export function photoTexture(src, round = false) {
  const key = src + (round ? "#r" : "");
  if (photoCache[key]) return photoCache[key];
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d"); g.fillStyle = "#123"; g.fillRect(0, 0, 512, 512);
  const tex = new (T().CanvasTexture)(c); tex.encoding = T().sRGBEncoding;
  const im = new Image();
  im.onload = () => {
    const s = Math.min(im.width, im.height), sx = (im.width - s) / 2, sy = (im.height - s) / 2;
    g.clearRect(0, 0, 512, 512);
    if (round) { g.save(); g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.clip(); }
    g.drawImage(im, sx, sy, s, s, 0, 0, 512, 512);
    if (round) g.restore();
    tex.needsUpdate = true;
  };
  im.src = src;
  photoCache[key] = tex; return tex;
}

/* ---------- a stage: renderer + camera + resize + drag-orbit ---------- */
export function makeStage(wrap, { fov = 45, dist = 9, target = [0, 0.6, 0], fog = 0x07161d, minPhi = 0.25, maxPhi = 1.35, autoSpin = 0.05 } = {}) {
  const THREE = T();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(fog, 0.045);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.setAttribute("aria-hidden", "true");
  wrap.appendChild(renderer.domElement);

  const tgt = new THREE.Vector3(...target);
  const orbit = { theta: 0.5, phi: 1.05, r: dist, punch: 0 };
  let dragging = false, travel = 0, lx = 0, ly = 0, userTouched = 0;
  const el = renderer.domElement;
  el.addEventListener("pointerdown", e => { dragging = true; travel = 0; lx = e.clientX; ly = e.clientY; el.setPointerCapture?.(e.pointerId); });
  el.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    travel += Math.abs(dx) + Math.abs(dy);
    if (travel < 6) return;
    orbit.theta -= dx * 0.008; orbit.phi = Math.max(minPhi, Math.min(maxPhi, orbit.phi - dy * 0.006));
    userTouched = performance.now();
  });
  const end = () => { dragging = false; };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  // ctrl/cmd + wheel zooms; a plain wheel keeps scrolling the page (never trap the student)
  el.addEventListener("wheel", e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); orbit.r = Math.max(dist * 0.55, Math.min(dist * 1.6, orbit.r + e.deltaY * 0.006)); }, { passive: false });

  let cw = 0, ch = 0;
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h || (w === cw && h === ch)) return;
    cw = w; ch = h; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(wrap);
  // only draw while on screen: four scenes share one page and one GPU
  let onScreen = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }).observe(wrap);
  // if the browser drops the WebGL context, say so instead of showing a blank box
  el.addEventListener("webglcontextlost", e => { e.preventDefault(); wrap.classList.add("lv-lost"); });
  el.addEventListener("webglcontextrestored", () => wrap.classList.remove("lv-lost"));

  const tickers = [];
  let raf = 0, last = performance.now(), alive = true;
  function frame(now) {
    if (!alive) return;
    if (!wrap.isConnected) { alive = false; renderer.dispose(); renderer.forceContextLoss(); return; }
    if (!onScreen) { last = now; raf = requestAnimationFrame(frame); return; }
    resize();
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduced() && !dragging && now - userTouched > 2500) orbit.theta += autoSpin * dt;
    orbit.punch *= 0.9;
    const r = orbit.r * (1 - orbit.punch);
    camera.position.set(tgt.x + r * Math.sin(orbit.phi) * Math.sin(orbit.theta), tgt.y + r * Math.cos(orbit.phi), tgt.z + r * Math.sin(orbit.phi) * Math.cos(orbit.theta));
    camera.lookAt(tgt);
    tickers.forEach(f => f(dt, now));
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    THREE, scene, camera, renderer, orbit, target: tgt,
    tick(f) { tickers.push(f); },
    punch(a = 0.12) { if (!reduced()) orbit.punch = a; },
    setTarget(x, y, z) { tgt.set(x, y, z); },
    isDragging: () => dragging, wasDrag: () => travel >= 6,
  };
}

/* lab lighting + floor + floating spores: the shared "vault" dressing */
export function dressVault(st, { floorColor = [14, 52, 58], accent = 0x5ee6c8, spores = 220, radius = 9 } = {}) {
  const { THREE, scene } = st;
  scene.add(new THREE.HemisphereLight(0xbfefff, 0x0b1a20, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  scene.add(key);
  const rim = new THREE.PointLight(accent, 1.4, 22); rim.position.set(-5, 3, -4); scene.add(rim);
  const warm = new THREE.PointLight(0xffb36b, 0.7, 18); warm.position.set(5, 2, -3); scene.add(warm);

  const floorTex = noiseTexture(floorColor, 18, 128, true); floorTex.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // glowing rings in the floor
  for (let i = 1; i <= 3; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(i * 2.2, i * 2.2 + 0.04, 96), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.35 / i }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; scene.add(ring);
  }
  // floating spores (Points, additive glow)
  const n = reduced() ? Math.round(spores / 3) : spores;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = [];
  const palette = [new THREE.Color(accent), new THREE.Color(0xffd27a), new THREE.Color(0x9fb8ff), new THREE.Color(0xa8ff9e)];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, rr = 1.5 + Math.random() * radius;
    pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = Math.random() * 7; pos[i * 3 + 2] = Math.sin(a) * rr;
    const c = palette[i % palette.length]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    seed.push(Math.random() * 10);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts);
  st.tick((dt, now) => {
    if (reduced()) return;
    const p = g.attributes.position.array;
    for (let i = 0; i < n; i++) {
      p[i * 3 + 1] += dt * 0.12; if (p[i * 3 + 1] > 7) p[i * 3 + 1] = 0;
      p[i * 3] += Math.sin(now / 1500 + seed[i]) * dt * 0.05;
    }
    g.attributes.position.needsUpdate = true;
    pts.rotation.y += dt * 0.02;
  });
  return { floor, rim };
}

/* particle burst inside a 3D scene (sprites flying outward, fading) */
export function burst3D(st, pos, color = 0x5ee6c8, count = 26, speed = 2.4) {
  if (reduced()) count = 6;
  const { THREE, scene } = st;
  const mat = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const parts = [];
  for (let i = 0; i < count; i++) {
    const s = new THREE.Sprite(mat.clone()); s.position.copy(pos); s.scale.setScalar(0.28);
    const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 - 0.1, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.5 + Math.random()));
    s.userData = { v, life: 0 }; scene.add(s); parts.push(s);
  }
  let done = false;
  st.tick(dt => {
    if (done) return;
    let alive = 0;
    parts.forEach(s => {
      if (!s.parent) return;
      s.userData.life += dt; const l = s.userData.life;
      if (l > 1) { scene.remove(s); return; }
      alive++; s.position.addScaledVector(s.userData.v, dt); s.userData.v.y -= dt * 1.5;
      s.material.opacity = 1 - l; s.scale.setScalar(0.28 * (1 - l * 0.6));
    });
    if (!alive) done = true;
  });
}

/* DOM burst over any element: in-place feedback at the point of interaction */
export function burstAt(el, color = "#5ee6c8", n = 14) {
  if (!el || reduced()) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span"); p.className = "lv-spark";
    p.style.left = (r.left + r.width / 2) + "px"; p.style.top = (r.top + r.height / 2) + "px"; p.style.background = color;
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
    p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d + "px");
    document.body.append(p); setTimeout(() => p.remove(), 700);
  }
}
export function shake(el) {
  if (!el) return;
  el.classList.remove("lv-shake"); void el.offsetWidth; el.classList.add("lv-shake");
  setTimeout(() => el.classList.remove("lv-shake"), 500);
}
export function floatText(el, text, color = "#2fbf71") {
  if (!el) return;
  const r = el.getBoundingClientRect(); const f = document.createElement("span"); f.className = "lv-float";
  f.textContent = text; f.style.color = color; f.style.left = (r.left + r.width / 2) + "px"; f.style.top = (r.top + window.scrollY) + "px";
  document.body.append(f); setTimeout(() => f.remove(), 1100);
}

/* tiny WebAudio blips, silenced by the activity's own mute button */
let actx = null; export const sound = { on: true };
export function blip(kind = "ok") {
  if (!sound.on) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime;
    const seq = { ok: [523, 784], bad: [220, 160], tap: [660], win: [523, 659, 784, 1046], whoosh: [300] }[kind] || [440];
    o.type = kind === "bad" ? "sawtooth" : "triangle";
    seq.forEach((f, i) => o.frequency.setValueAtTime(f, t0 + i * 0.08));
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1 + seq.length * 0.08);
    o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + 0.15 + seq.length * 0.08);
  } catch {}
}
