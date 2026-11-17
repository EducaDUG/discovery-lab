/* Solar Forge — shared local kit (hyper-real 3D stage, fx, sfx).
   Local to this activity (CLAUDE.md: content lives in the activity folder).
   Game state never depends on this file's render loop: scenes only READ state. */
/* global THREE */
import { getLang } from "../../../../../../engine/i18n.js?v=10";

export const L = (en, es) => (getLang() === "es" ? es : en);
export const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
export const T = window.THREE;
export const C = hex => new T.Color(hex).convertSRGBToLinear();
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ------------------------------------------------------------------ photos */
export const CREDITS = /*CREDITS*/{"cell": ["A monocrystalline silicon solar cell", "Stephan Kambor", "CC BY-SA 2.5", "https://creativecommons.org/licenses/by-sa/2.5"], "girl": ["Clearing snow from solar panels, UK", "1010 Climate Action", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0"], "earthship": ["Passive solar Earthship, Germany", "Sharhues", "CC0", "http://creativecommons.org/publicdomain/zero/1.0/deed.en"], "gemasolar": ["Gemasolar power tower, Spain", "kallerna", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0"], "helio": ["Heliostat mirrors, CSIRO, Australia", "Stefan Moore, CSIRO", "CC BY 3.0", "https://creativecommons.org/licenses/by/3.0"], "ivan": ["Ivanpah solar tower, California", "Garth Weals", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0"], "turbine": ["Steam turbine rotor", "Siemens Pressebild, http://www.siemens.com", "CC BY-SA 3.0", "http://creativecommons.org/licenses/by-sa/3.0/"], "roof": ["Rooftop solar panels, Wales", "Jaggery", "CC BY-SA 2.0", "https://creativecommons.org/licenses/by-sa/2.0"]};
export const img = id => `photos/${id}.jpg`;
export function creditLine(ids) {
  return L("Photos (Wikimedia Commons): ", "Fotos (Wikimedia Commons): ") + ids.map(id => {
    const c = CREDITS[id]; const lic = c[3] ? `<a href="${c[3]}" target="_blank" rel="noopener noreferrer">${c[2]}</a>` : c[2];
    return `${c[0]} — ${c[1]}, ${lic}`;
  }).join(" · ");
}

/* --------------------------------------------------------------------- sfx */
let ac = null;
export const audio = {
  get muted() { try { return localStorage.getItem("sf-mute") === "1"; } catch (e) { return true; } },
  set muted(v) { try { localStorage.setItem("sf-mute", v ? "1" : "0"); } catch (e) {} },
};
const SEQ = {
  ok: [[660, .07], [880, .11]], bad: [[196, .16, "triangle"]], tick: [[540, .035]], pop: [[340, .05], [520, .06]],
  win: [[523, .09], [659, .09], [784, .09], [1047, .2]], zap: [[110, .08, "sawtooth"], [70, .2, "sawtooth"]], coin: [[988, .05], [1319, .12]],
};
export function sfx(kind) {
  if (audio.muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    let t = ac.currentTime;
    (SEQ[kind] || SEQ.tick).forEach(([f, d, type]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.9;
    });
  } catch (e) {}
}
export function muteButton(cls = "sf-mute") {
  const b = document.createElement("button"); b.type = "button"; b.className = cls;
  const paint = () => { b.textContent = audio.muted ? L("🔇 Sound off", "🔇 Sonido apagado") : L("🔊 Sound on", "🔊 Sonido activado"); b.setAttribute("aria-pressed", String(!audio.muted)); };
  b.addEventListener("click", () => { audio.muted = !audio.muted; paint(); if (!audio.muted) sfx("ok"); document.querySelectorAll("." + cls).forEach(x => x !== b && x.dispatchEvent(new Event("sf-repaint"))); });
  b.addEventListener("sf-repaint", paint); paint(); return b;
}

/* ------------------------------------------------------------------ DOM fx */
export function burstAt(el, color = "#ffd166", n = 14) {
  if (reduced() || !el) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i"); s.className = "sf-spark"; const a = Math.random() * 6.283, d = 30 + Math.random() * 60;
    s.style.cssText = `left:${cx}px;top:${cy}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    document.body.append(s); setTimeout(() => s.remove(), 750);
  }
}
export function floatText(el, text, color = "#ffd166") {
  if (!el) return; const r = el.getBoundingClientRect();
  const s = document.createElement("span"); s.className = "sf-float"; s.textContent = text;
  s.style.cssText = `left:${r.left + r.width / 2 + scrollX}px;top:${r.top + scrollY - 4}px;color:${color}`;
  document.body.append(s); setTimeout(() => s.remove(), 1200);
}
export function shake(el) { if (!el) return; el.classList.remove("sf-shake"); void el.offsetWidth; el.classList.add("sf-shake"); }

/* ---------------------------------------------------------------- textures */
export function canvasTex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
export function noiseTex(base, spread, n = 2600, rep, size = 256, seed = 7) {
  const r = rng(seed);
  return canvasTex(size, size, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const v = (r() - .5) * spread; g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
      const s = 1 + r() * 5; g.beginPath(); g.arc(r() * w, r() * h, s, 0, 6.283); g.fill();
    }
  }, rep);
}
let _wool, _grass, _steel, _glow;
export const woolBump = () => _wool || (_wool = (() => { const r = rng(11); const t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#808080"; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h, s = 4 + r() * 9; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(0,0,0,.0)"); g.fillStyle = gr; g.fillRect(x - s, y - s, 2 * s, 2 * s); g.strokeStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.arc(x, y, s * .8, r() * 6, r() * 6 + 2.5); g.stroke(); } }, [3, 3]); t.encoding = T.LinearEncoding; return t; })());
export const grassTex = (rep = [18, 18]) => { if (!_grass) { const r = rng(5); _grass = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#4c7f34"; g.fillRect(0, 0, w, h); for (let i = 0; i < 5200; i++) { g.strokeStyle = `hsla(${84 + r() * 36},${35 + r() * 28}%,${18 + r() * 30}%,.75)`; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 5, y - 3 - r() * 7); g.stroke(); } }, rep); } return _grass; };
export const steelTex = () => _steel || (_steel = (() => { const r = rng(3); return canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#c9d2d8"; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.strokeStyle = `rgba(${r() > .5 ? 255 : 60},${r() > .5 ? 255 : 70},${r() > .5 ? 255 : 80},${.05 + r() * .09})`; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (r() - .5) * 2); g.stroke(); } }, [2, 2]); })());
export const glowTex = () => _glow || (_glow = canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, w); }));
export function glowSprite(color, size) {
  const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: C(color), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  s.scale.set(size, size, 1); return s;
}
export const glassMat = (tint = 0xffffff, op = .2) => new T.MeshPhysicalMaterial({ color: C(tint), transparent: true, opacity: op, roughness: .04, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide });
export const std = (color, rough = .7, metal = 0, extra = {}) => new T.MeshStandardMaterial(Object.assign({ color: C(color), roughness: rough, metalness: metal }, extra));
export function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = shadow; return m; }

/* ------------------------------------------------------------------- stage */
export function makeStage(host, o = {}) {
  host.classList.add("sf-stage");
  if (!T) { host.classList.add("sf-nogl"); return null; }
  const canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true"); host.prepend(canvas);
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
  catch (e) { canvas.remove(); host.classList.add("sf-nogl"); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure || .86;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(o.fov || 40, 1.6, .05, 600);

  /* procedural studio environment for PBR reflections (no HDR file needed) */
  try {
    const pm = new T.PMREMGenerator(renderer), es = new T.Scene();
    const top = o.envTop || "#7fa9d6", bot = o.envBot || "#2a2622";
    es.add(new T.Mesh(new T.SphereGeometry(50, 24, 16), new T.MeshBasicMaterial({ side: T.BackSide, map: canvasTex(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(.55, o.envMid || "#8497a8"); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })));
    [[0, 30, 0, 14, 1, 14], [-30, 12, 10, 1, 10, 14]].forEach(p => { const b = new T.Mesh(new T.BoxGeometry(p[3], p[4], p[5]), new T.MeshBasicMaterial({ color: 0xffffff })); b.position.set(p[0], p[1], p[2]); es.add(b); });
    scene.environment = pm.fromScene(es, .03).texture; pm.dispose();
  } catch (e) {}

  /* lights */
  const hemi = new T.HemisphereLight(C(o.skyLight || 0xdfeeff), C(o.groundLight || 0x48503c), o.hemi == null ? .55 : o.hemi); scene.add(hemi);
  const sun = new T.DirectionalLight(C(o.sunColor || 0xfff1d6), o.sun == null ? 2.2 : o.sun);
  sun.position.set(...(o.sunPos || [6, 10, 5])); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sr = o.shadowRange || 9; Object.assign(sun.shadow.camera, { left: -sr, right: sr, top: sr, bottom: -sr, near: .5, far: 60 }); sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
  scene.add(sun); scene.add(sun.target);

  /* camera rig: spherical orbit with damped goal (so flyTo() and drag share one path) */
  const v0 = Object.assign({ theta: .6, phi: 1.1, dist: 8, target: [0, 1, 0] }, o.cam || {});
  const cur = { theta: v0.theta, phi: v0.phi, dist: v0.dist, tx: v0.target[0], ty: v0.target[1], tz: v0.target[2] }, goal = Object.assign({}, cur);
  const lim = Object.assign({ minPhi: .25, maxPhi: 1.5, minDist: 2, maxDist: 30 }, o.limits || {});
  let fit = 1, dragging = false, travel = 0, lastX = 0, lastY = 0, idleT = 0, orbitOn = o.orbit !== false;
  const st = {
    scene, camera, renderer, sun, hemi, canvas, host, t: 0, pickables: [], alive: true,
    flyTo(p, snap) { Object.assign(goal, { theta: p.theta ?? goal.theta, phi: p.phi ?? goal.phi, dist: p.dist ?? goal.dist }); if (p.target) { goal.tx = p.target[0]; goal.ty = p.target[1]; goal.tz = p.target[2]; } if (snap || reduced()) Object.assign(cur, goal); },
    setOrbit(on) { orbitOn = on; },
    punch(k = .88) { if (!reduced()) cur.dist *= k; },
    onFrame: [], tweens: [], bursts: [],
    tween(obj, to, dur = .6, opt = {}) {
      st.tweens = st.tweens.filter(tw => tw.obj !== obj);
      if (reduced() || dur <= 0) { Object.assign(obj, to); opt.done && opt.done(); return; }
      const from = {}; Object.keys(to).forEach(k => from[k] = obj[k]);
      st.tweens.push({ obj, from, to, dur, t: -(opt.delay || 0), ease: opt.ease || ease, done: opt.done });
    },
    burst(pos, color = 0xffd166, n = 26, speed = 2.2, size = .09) {
      if (reduced()) return;
      const geo = new T.BufferGeometry(), p = new Float32Array(n * 3), vel = [];
      for (let i = 0; i < n; i++) { p[i * 3] = pos.x; p[i * 3 + 1] = pos.y; p[i * 3 + 2] = pos.z; const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), s = speed * (.4 + Math.random()); vel.push(Math.sin(b) * Math.cos(a) * s, Math.abs(Math.cos(b)) * s + .6, Math.sin(b) * Math.sin(a) * s); }
      geo.setAttribute("position", new T.BufferAttribute(p, 3));
      const pts = new T.Points(geo, new T.PointsMaterial({ color: C(color), size, map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      pts.frustumCulled = false; scene.add(pts); st.bursts.push({ pts, vel, life: 0 });
    },
    pickable(obj, fn) { obj.userData.onPick = fn; st.pickables.push(obj); return obj; },
    dispose() {
      if (!st.alive) return; st.alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      scene.traverse(x => { if (x.geometry) x.geometry.dispose(); });
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {}
      canvas.remove();
    },
  };

  /* pointer: orbit on drag, pick on click (cumulative-travel threshold) */
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", e => { dragging = true; travel = 0; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) { if (st.pickables.length) canvas.style.cursor = hit(e) ? "pointer" : (orbitOn ? "grab" : "default"); return; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; travel += Math.abs(dx) + Math.abs(dy);
    if (orbitOn && travel > 6) { goal.theta -= dx * .006; goal.phi = clamp(goal.phi - dy * .005, lim.minPhi, lim.maxPhi); idleT = 0; }
  });
  const end = () => { dragging = false; };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("wheel", e => { if (!orbitOn) return; e.preventDefault(); goal.dist = clamp(goal.dist * (e.deltaY > 0 ? 1.1 : .9), lim.minDist, lim.maxDist); }, { passive: false });
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function hit(e) {
    const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(st.pickables.filter(p => p.visible), true)[0]; if (!h) return null;
    let n = h.object; while (n && !n.userData.onPick) n = n.parent; return n ? { node: n, point: h.point } : null;
  }
  canvas.addEventListener("click", e => { if (travel > 8) return; const h = hit(e); if (h) h.node.userData.onPick(h.node, h.point); });

  let visible = true;
  const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; }); io.observe(host);
  const resize = () => { const w = host.clientWidth || 600, h = host.clientHeight || 360; renderer.setSize(w, h, false); camera.aspect = w / h; fit = Math.max(1, (o.fitAspect || 1.35) / camera.aspect); camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); host.classList.add("sf-lost"); });

  let raf = 0, last = performance.now();
  function frame(now) {
    if (!st.alive) return; raf = requestAnimationFrame(frame);
    if (!host.isConnected) { st.dispose(); return; }
    const dt = clamp((now - last) / 1000, 0, .05); last = now; if (!visible || document.hidden) return;
    st.t += dt; idleT += dt;
    const k = 1 - Math.exp(-dt * 5); ["theta", "phi", "dist", "tx", "ty", "tz"].forEach(a => cur[a] = lerp(cur[a], goal[a], k));
    const sway = (!reduced() && o.sway !== false && idleT > 2) ? Math.sin(st.t * .25) * (o.swayAmp || .12) : 0;
    const d = cur.dist * fit, th = cur.theta + sway, sp = Math.sin(cur.phi);
    camera.position.set(cur.tx + d * sp * Math.sin(th), cur.ty + d * Math.cos(cur.phi), cur.tz + d * sp * Math.cos(th)); camera.lookAt(cur.tx, cur.ty, cur.tz);
    for (let i = st.tweens.length - 1; i >= 0; i--) {
      const tw = st.tweens[i]; tw.t += dt; if (tw.t < 0) continue; const q = tw.ease(clamp(tw.t / tw.dur, 0, 1));
      for (const key in tw.to) tw.obj[key] = lerp(tw.from[key], tw.to[key], q);
      if (tw.t >= tw.dur) { st.tweens.splice(st.tweens.indexOf(tw), 1); tw.done && tw.done(); }
    }
    for (let i = st.bursts.length - 1; i >= 0; i--) {
      const b = st.bursts[i]; b.life += dt; const p = b.pts.geometry.attributes.position;
      for (let j = 0; j < p.count; j++) { b.vel[j * 3 + 1] -= 4.5 * dt; p.array[j * 3] += b.vel[j * 3] * dt; p.array[j * 3 + 1] += b.vel[j * 3 + 1] * dt; p.array[j * 3 + 2] += b.vel[j * 3 + 2] * dt; }
      p.needsUpdate = true; b.pts.material.opacity = 1 - b.life / .9;
      if (b.life > .9) { scene.remove(b.pts); b.pts.geometry.dispose(); st.bursts.splice(i, 1); }
    }
    for (const f of st.onFrame) f(dt, st.t);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  return st;
}

/* -------------------------------------------------------------- world bits */
export function skyBackdrop(st, top = "#6fb4ee", mid = "#cfe6f7", low = "#f3ead2") {
  st.scene.background = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(.6, mid); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  st.scene.fog = new T.Fog(C(0xcfe2ee), 28, 120);
}
export function meadow(st, size = 160) {
  const g = mesh(new T.PlaneGeometry(size, size), std(0xffffff, 1, 0, { map: grassTex([size / 4, size / 4]) }), 0, 0, 0); g.rotation.x = -Math.PI / 2; g.castShadow = false; st.scene.add(g);
  const r = rng(21), hillMat = std(0x6f9a52, 1), farMat = std(0x7f96a8, 1);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + r() * .3, d = 42 + r() * 26, s = 9 + r() * 14; const h = mesh(new T.SphereGeometry(s, 20, 12), i % 3 ? hillMat : farMat, Math.cos(a) * d, -s * .45, Math.sin(a) * d, false); h.scale.y = .55 + r() * .3; st.scene.add(h); }
  /* drifting clouds */
  const clouds = [];
  for (let i = 0; i < 9; i++) { const s = glowSprite(0xffffff, 16 + r() * 14); s.material.blending = T.NormalBlending; s.material.opacity = .75; s.position.set((r() - .5) * 120, 22 + r() * 10, -30 - r() * 50); s.scale.y *= .45; st.scene.add(s); clouds.push(s); }
  st.onFrame.push(dt => { if (!reduced()) clouds.forEach(c => { c.position.x += dt * .5; if (c.position.x > 70) c.position.x = -70; }); });
  return g;
}

/* ------------------------------------------------------------ shared UI bits */
export function shuffled(arr, seed) { const r = rng(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) + 1; };
/* Station shell: sticky 3D view with camera presets on the left, control panel on the right. */
export function shell(host, cams, o = {}) {
  host.innerHTML = `<div class="sf-split"><div class="sf-view"><div class="sf-stage3d" data-fallback="${esc(L("3D view unavailable on this device. Every control still works.", "Vista 3D no disponible en este dispositivo. Todos los controles siguen funcionando."))}"><div class="sf-over"></div></div>
    <div class="sf-cams">${Object.keys(cams).map(k => `<button type="button" data-cam="${k}">${cams[k].label}</button>`).join("")}</div></div><div class="sf-panel" aria-live="polite"></div></div>`;
  const first = Object.keys(cams)[0];
  const st = makeStage(host.querySelector(".sf-stage3d"), Object.assign({ cam: cams[first] }, o));
  host.querySelectorAll("[data-cam]").forEach(b => b.addEventListener("click", () => { st && st.flyTo(cams[b.dataset.cam]); sfx("tick"); }));
  return { st, panel: host.querySelector(".sf-panel"), over: host.querySelector(".sf-over") };
}
/* A decision with in-place feedback. opts: [{t, ok, why}]. Every option looks identical until tapped. */
export function ask(box, q, opts, done) {
  const list = shuffled(opts, hash(q)); let tries = 0, solved = false;
  box.innerHTML = `<p class="sf-q">${q}</p><div class="sf-opts">${list.map((o, i) => `<button type="button" class="sf-opt" data-i="${i}">${o.t}</button>`).join("")}</div><div class="sf-fb" role="status"></div>`;
  const fb = box.querySelector(".sf-fb");
  box.querySelectorAll(".sf-opt").forEach(b => b.addEventListener("click", () => {
    if (solved) return; const o = list[+b.dataset.i]; tries++;
    if (o.ok) { solved = true; b.classList.add("good"); burstAt(b); sfx("ok"); fb.className = "sf-fb good"; fb.innerHTML = "✔ " + o.why; box.querySelectorAll(".sf-opt").forEach(x => x.disabled = true); done && done(tries === 1, o); }
    else { b.classList.add("bad"); b.disabled = true; shake(b); sfx("bad"); fb.className = "sf-fb bad"; fb.innerHTML = o.why; o.wrong && o.wrong(); }
  }));
}
export function track(names, now) { return `<ol class="sf-track">${names.map((n, i) => `<li class="${i < now ? "done" : i === now ? "now" : ""}">${n}</li>`).join("")}</ol>`; }
export function goalsHTML(list, done) { return `<ul class="sf-goals">${list.map(g => `<li class="${done[g[0]] ? "done" : ""}">${g[1]}</li>`).join("")}</ul>`; }

/* ------------------------------------------------------------ world bits 2 */
export function desert(st, size = 220) {
  const g = mesh(new T.PlaneGeometry(size, size), std(0xffffff, 1, 0, { map: noiseTex("#b07f4c", .18, 3600, [size / 8, size / 8], 256, 31) }), 0, 0, 0); g.rotation.x = -Math.PI / 2; g.castShadow = false; st.scene.add(g);
  const r = rng(77), m1 = std(0x9a6a44, 1), m2 = std(0x7a6478, 1);
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + r() * .3, d = 60 + r() * 30, s = 10 + r() * 18; const h = mesh(new T.ConeGeometry(s, s * (.5 + r() * .5), 7), i % 2 ? m1 : m2, Math.cos(a) * d, s * .12, Math.sin(a) * d, false); h.rotation.y = r() * 6; st.scene.add(h); }
  return g;
}
/* Sky that can blend day -> dusk -> night. Returns set(k) with k = 0 (night) .. 1 (day). */
export function liveSky(st, o = {}) {
  const c = document.createElement("canvas"); c.width = 8; c.height = 128; const g = c.getContext("2d"), tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; st.scene.background = tex;
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k)), rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
  const day = [[74, 150, 226], [176, 216, 244], [246, 232, 200]], dusk = [[40, 52, 110], [224, 122, 84], [250, 190, 110]], night = [[4, 8, 22], [10, 18, 44], [22, 30, 60]];
  const stars = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: 0xffffff, size: .9, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  const r = rng(5), p = []; for (let i = 0; i < 500; i++) { const a = r() * 6.283, e = .08 + r() * 1.4; p.push(Math.cos(a) * Math.cos(e) * 190, Math.sin(e) * 190, Math.sin(a) * Math.cos(e) * 190); }
  stars.geometry.setAttribute("position", new T.Float32BufferAttribute(p, 3)); stars.frustumCulled = false; st.scene.add(stars);
  const fogDay = C(o.fog || 0xd9e6ee), fogNight = C(0x0a1226); st.scene.fog = new T.Fog(fogDay.clone(), o.fogNear || 40, o.fogFar || 190);
  let last = -1;
  function set(k) {
    k = clamp(k, 0, 1); if (Math.abs(k - last) < .004) return; last = k;
    const a = k < .5 ? night : dusk, b = k < .5 ? dusk : day, q = k < .5 ? k * 2 : (k - .5) * 2, gr = g.createLinearGradient(0, 0, 0, 128);
    [0, .6, 1].forEach((s, i) => gr.addColorStop(s, rgb(mix(a[i], b[i], q)))); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); tex.needsUpdate = true;
    stars.material.opacity = clamp(1 - k * 2.2, 0, 1); st.scene.fog.color.copy(fogNight).lerp(fogDay, k);
    st.sun.intensity = (o.sunMax || 2.4) * clamp(k * 1.25 - .15, 0, 1); st.hemi.intensity = .1 + .3 * k;
  }
  set(1); return set;
}
export function sunDisc(st, size = 14) { const g = new T.Group(); const a = glowSprite(0xfff2b0, size), b = glowSprite(0xffffff, size * .38); a.material.fog = b.material.fog = false; g.add(a, b); st.scene.add(g); return g; }
export function cloudPuff(n = 6, seed = 3, s = 3) { const g = new T.Group(), r = rng(seed); for (let i = 0; i < n; i++) { const c = glowSprite(0xffffff, s * (1 + r())); c.material.blending = T.NormalBlending; c.material.opacity = .9; c.material.fog = false; c.position.set((r() - .5) * s * 2.2, (r() - .5) * s * .5, (r() - .5) * s); c.scale.y *= .6; g.add(c); } return g; }
/* Small floating text label (canvas sprite) for naming parts inside a 3D scene. */
export function label3d(text, o = {}) {
  const pad = 22, fs = 44, c = document.createElement("canvas"), g = c.getContext("2d"); g.font = `800 ${fs}px system-ui, sans-serif`; const w = Math.ceil(g.measureText(text).width) + pad * 2; c.width = w; c.height = 76;
  g.font = `800 ${fs}px system-ui, sans-serif`; g.fillStyle = o.bg || "rgba(8,14,30,.82)"; const rr = 26; g.beginPath(); g.moveTo(rr, 0); g.arcTo(w, 0, w, 76, rr); g.arcTo(w, 76, 0, 76, rr); g.arcTo(0, 76, 0, 0, rr); g.arcTo(0, 0, w, 0, rr); g.fill();
  g.fillStyle = o.color || "#ffffff"; g.textBaseline = "middle"; g.fillText(text, pad, 40);
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; const s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, fog: false })); const h = o.size || .24; s.scale.set(h * w / 76, h, 1); s.renderOrder = 10; return s;
}
