/* Solar System Command - shared hyper-real 3D helpers (vendored Three.js, no CDN).
   PBR-ish materials, ACES tone mapping, procedural canvas textures, starfield, glow sprites. */
const THREE = window.THREE;

export const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
export const webgl = () => { try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; } };
export const C = hex => new THREE.Color(hex).convertSRGBToLinear();

export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  r.outputEncoding = THREE.sRGBEncoding;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.15;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.localClippingEnabled = true;
  r.setClearColor(0x03040a, 1);
  return r;
}

/* ---- value noise / fbm ---- */
function hash(x, y, s) { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, s = 1, oct = 5) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * vnoise(x * f, y * f, s + i); f *= 2; a *= 0.5; } return v; }

export function canvasTex(w, h, px, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const col = px(x / w, y / h), i = (y * w + x) * 4;
    img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return t;
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const wrapN = (u, v, k, s, oct) => fbm(Math.cos(u * 6.283) * k + 10, v * k * 0.5 + Math.sin(u * 6.283) * k, s, oct); // seamless in u

export const TEX = {
  sun() { return canvasTex(512, 256, (u, v) => { const n = wrapN(u, v, 5, 3, 5), g = wrapN(u, v, 22, 9, 3); const t = Math.min(1, n * 1.1 + g * 0.35); return mix([190, 60, 5], [255, 214, 110], t); }); },
  earth() { return canvasTex(512, 256, (u, v) => {
      const n = wrapN(u, v, 4, 11, 6), cl = wrapN(u, v, 6, 31, 5), lat = Math.abs(v - 0.5) * 2;
      let col = n > 0.5 ? mix([40, 92, 38], [150, 128, 78], Math.min(1, (n - 0.5) * 3)) : mix([6, 28, 78], [20, 80, 150], n * 2);
      if (lat > 0.86) col = [240, 246, 250];
      const c = Math.max(0, cl - 0.52) * 3.2; return mix(col, [255, 255, 255], Math.min(0.9, c)); }); },
  moon() { return canvasTex(512, 256, (u, v) => { const n = wrapN(u, v, 7, 5, 6), cr = wrapN(u, v, 26, 17, 3); const d = 150 + n * 70 - Math.max(0, 0.46 - cr) * 120; const q = Math.max(60, Math.min(235, d)); return [q, q, q * 0.97]; }); },
  rock(a, b, k = 6, s = 2) { return canvasTex(256, 128, (u, v) => mix(a, b, wrapN(u, v, k, s, 6))); },
  bands(cols, k = 3, s = 4, turb = 0.25) { return canvasTex(256, 128, (u, v) => { const w = v + (wrapN(u, v, 5, s, 4) - 0.5) * turb; const i = (Math.sin(w * 3.1416 * k * 2) * 0.5 + 0.5); const j = Math.min(cols.length - 2, Math.floor(i * (cols.length - 1))); return mix(cols[j], cols[j + 1], i * (cols.length - 1) - j); }); },
  star() { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
};

export function starField(scene, n = 1800, rmin = 60, rmax = 120) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = rmin + Math.random() * (rmax - rmin), th = Math.random() * 6.2832, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); pos[i * 3 + 2] = r * Math.cos(ph);
    const k = Math.random(); col[i * 3] = 0.7 + k * 0.3; col[i * 3 + 1] = 0.75 + k * 0.2; col[i * 3 + 2] = 1 - k * 0.25;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.55, map: TEX.star(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(p); return p;
}

export function glow(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}

export function sunMesh(radius) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), new THREE.MeshBasicMaterial({ map: TEX.sun() }));
  g.add(m, glow(0xffb347, radius * 5.2), glow(0xff7a1a, radius * 9));
  g.userData.surface = m; return g;
}

export function planetMesh(radius, map, opts = {}) {
  const mat = new THREE.MeshPhysicalMaterial({ map, roughness: opts.rough ?? 0.85, metalness: 0, clearcoat: opts.clearcoat || 0, clearcoatRoughness: 0.4 });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), mat); m.castShadow = true; m.receiveShadow = true;
  if (opts.atmos) { const a = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.04, 48, 32), new THREE.MeshBasicMaterial({ color: opts.atmos, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false })); m.add(a); }
  return m;
}

/* Simple orbit-drag + wheel camera on a canvas. Taps never pick anything here, so no tap/drag heuristic needed. */
export function orbitControls(canvas, camera, target, init = { th: 0.6, ph: 1.1, r: 12 }, lim = { rmin: 3, rmax: 40 }) {
  const s = { ...init, drag: false, x: 0, y: 0, auto: true };
  const apply = () => { camera.position.set(target.x + s.r * Math.sin(s.ph) * Math.cos(s.th), target.y + s.r * Math.cos(s.ph), target.z + s.r * Math.sin(s.ph) * Math.sin(s.th)); camera.lookAt(target); };
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", e => { s.drag = true; s.auto = false; s.x = e.clientX; s.y = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", e => { if (!s.drag) return; s.th -= (e.clientX - s.x) * 0.006; s.ph = Math.max(0.15, Math.min(3.0, s.ph - (e.clientY - s.y) * 0.005)); s.x = e.clientX; s.y = e.clientY; });
  const up = () => { s.drag = false; }; canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", e => { e.preventDefault(); s.r = Math.max(lim.rmin, Math.min(lim.rmax, s.r * (1 + e.deltaY * 0.001))); }, { passive: false });
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", e => { const k = e.key; if (k === "ArrowLeft") s.th += 0.1; else if (k === "ArrowRight") s.th -= 0.1; else if (k === "ArrowUp") s.ph = Math.max(0.15, s.ph - 0.08); else if (k === "ArrowDown") s.ph = Math.min(3, s.ph + 0.08); else if (k === "+" || k === "=") s.r = Math.max(lim.rmin, s.r * 0.9); else if (k === "-") s.r = Math.min(lim.rmax, s.r * 1.1); else return; e.preventDefault(); s.auto = false; });
  s.apply = apply; s.set = (o) => Object.assign(s, o); apply(); return s;
}

export function fitRenderer(renderer, camera, host) {
  const f = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 60 : 45; camera.updateProjectionMatrix(); };
  new ResizeObserver(f).observe(host); f();
}

/* Runs fn(dt) every frame while the element is visible & on screen; stops when removed. Rendering only: never game-state timing. */
export function loop(host, fn) {
  let last = performance.now(), alive = true;
  const step = now => { if (!alive) return; if (!document.body.contains(host)) { alive = false; return; } const dt = Math.min(0.05, (now - last) / 1000); last = now; if (host.offsetParent !== null && !document.hidden) fn(dt, now / 1000); requestAnimationFrame(step); };
  requestAnimationFrame(step); return () => { alive = false; };
}

/* DOM particle burst (juice) layered over a stage */
export function burst(stage, x, y, color = "#ffd27a", n = 16) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const d = document.createElement("i"); const a = Math.random() * 6.283, v = 40 + Math.random() * 70;
    d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:6px;height:6px;border-radius:50%;background:${color};pointer-events:none;z-index:6;transition:transform .7s cubic-bezier(.1,.7,.3,1),opacity .7s;box-shadow:0 0 8px ${color}`;
    stage.append(d); requestAnimationFrame(() => { d.style.transform = `translate(${Math.cos(a) * v}px,${Math.sin(a) * v}px) scale(.2)`; d.style.opacity = "0"; });
    setTimeout(() => d.remove(), 760);
  }
}
export function popText(stage, text, x, y, color = "#ffe9a8") {
  const d = document.createElement("div"); d.textContent = text;
  d.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,0);font:700 1.05rem var(--font-data,monospace);color:${color};text-shadow:0 2px 8px #000;pointer-events:none;z-index:7;transition:transform .9s ease-out,opacity .9s`;
  stage.append(d); requestAnimationFrame(() => { d.style.transform = "translate(-50%,-46px)"; d.style.opacity = "0"; }); setTimeout(() => d.remove(), 950);
}
