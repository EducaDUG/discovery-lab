/* Orchard Market 3D helpers: a hyper-real stall scene built on vendored Three.js (r13x).
   ACES tone mapping, soft shadows, procedural textures, physically based apples, dust motes.
   Game logic never depends on these animations (they are cosmetic and driven by rAF). */
const THREE_URL = "../../../../../engine/vendor/three.min.js";
const REDUCED = () => document.documentElement.getAttribute("data-reduced-motion") === "on";

export function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = THREE_URL; s.onload = () => res(window.THREE); s.onerror = () => rej(new Error("three failed"));
    document.head.append(s);
  });
}
export function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

export const C = (THREE, hex) => new THREE.Color(hex).convertSRGBToLinear();
const rnd = (a, b) => a + Math.random() * (b - a);
function canvasTex(THREE, w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

export function makeTextures(THREE) {
  const wood = canvasTex(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#a9733f"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${60 + rnd(0, 40)},${35 + rnd(0, 25)},15,${rnd(.08, .3)})`; g.lineWidth = rnd(.6, 2.6); const y = rnd(0, h); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + rnd(-5, 5), w * .7, y + rnd(-5, 5), w, y + rnd(-3, 3)); g.stroke(); }
    for (let i = 0; i < 3; i++) { g.fillStyle = "rgba(70,40,15,.35)"; g.beginPath(); g.ellipse(rnd(30, w - 30), rnd(30, h - 30), rnd(5, 9), rnd(3, 5), 0, 0, 7); g.fill(); }
  }, [1, 1]);
  const grass = canvasTex(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#4f8a3a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${30 + rnd(0, 60)},${95 + rnd(0, 80)},${20 + rnd(0, 40)},${rnd(.25, .7)})`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 2.5), rnd(2, 7)); }
  }, [14, 14]);
  const stripes = canvasTex(THREE, 256, 64, (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f6efe2" : "#c8382f"; g.fillRect(i * (w / 8), 0, w / 8, h); }
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${rnd(.02, .06)})`; g.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
  });
  const wicker = canvasTex(THREE, 128, 128, (g, w, h) => {
    g.fillStyle = "#c79a55"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 16) { const o = (y / 8) % 2 ? 8 : 0; g.fillStyle = `rgba(${110 + rnd(0, 40)},${70 + rnd(0, 30)},30,.55)`; g.fillRect(x + o, y, 14, 6); }
  }, [4, 2]);
  const sky = canvasTex(THREE, 4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#4f93d8"); gr.addColorStop(.55, "#a9d2f2"); gr.addColorStop(1, "#f3e7cf"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const apple = (c1, c2, streak) => canvasTex(THREE, 128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { g.strokeStyle = streak + rnd(.1, .35) + ")"; g.lineWidth = rnd(1, 4); const x = rnd(0, w); g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + rnd(-8, 8), h / 2, x + rnd(-6, 6), h); g.stroke(); }
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,240,200,${rnd(.15, .5)})`; g.fillRect(rnd(0, w), rnd(0, h), 1.4, 1.4); }
  });
  return { wood, grass, stripes, wicker, sky, appleRed: apple("#e0392b", "#7d1410", "rgba(255,120,60,"), appleGreen: apple("#b9d543", "#5f8f1f", "rgba(240,240,90,"), appleGold: apple("#f2c04a", "#c9742a", "rgba(255,90,40,") };
}

export function makeAppleKit(THREE, tex) {
  const geo = new THREE.SphereGeometry(0.46, 28, 20); geo.scale(1, .88, 1);
  const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > .3) { const dip = (y - .3) * .32 * Math.exp(-(pos.getX(i) ** 2 + pos.getZ(i) ** 2) * 6); pos.setY(i, y - dip); } }
  geo.computeVertexNormals();
  const mk = map => new THREE.MeshPhysicalMaterial({ map, roughness: .38, metalness: 0, clearcoat: .55, clearcoatRoughness: .28 });
  const mats = { red: mk(tex.appleRed), green: mk(tex.appleGreen), gold: mk(tex.appleGold) };
  const stemGeo = new THREE.CylinderGeometry(.025, .035, .22, 6), stemMat = new THREE.MeshStandardMaterial({ color: C(THREE, 0x5a3a1a), roughness: .9 });
  const leafGeo = new THREE.SphereGeometry(.13, 8, 6); leafGeo.scale(1, .2, .6); const leafMat = new THREE.MeshStandardMaterial({ color: C(THREE, 0x3f8a2a), roughness: .7 });
  return {
    mats,
    make(kind = "red") {
      const g = new THREE.Group();
      const m = new THREE.Mesh(geo, mats[kind]); m.castShadow = true; m.receiveShadow = true; m.rotation.y = rnd(0, 6.28); g.add(m);
      const s = new THREE.Mesh(stemGeo, stemMat); s.position.set(0, .36, 0); s.rotation.z = rnd(-.2, .2); s.castShadow = true; g.add(s);
      if (Math.random() < .55) { const l = new THREE.Mesh(leafGeo, leafMat); l.position.set(.1, .4, 0); l.rotation.z = .4; g.add(l); }
      return g;
    }
  };
}

export function makeCrate(THREE, tex, w, d, h = .9) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: tex.wood, roughness: .82 });
  const box = (bw, bh, bd, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), wood); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  box(w, .1, d, 0, .05, 0);
  const slats = 3, sh = (h - .1) / slats;
  for (let i = 0; i < slats; i++) {
    const y = .1 + sh * i + sh / 2 - .02; const gap = .93;
    box(w, sh * gap, .08, 0, y, d / 2 - .04); box(w, sh * gap, .08, 0, y, -d / 2 + .04);
    box(.08, sh * gap, d - .16, w / 2 - .04, y, 0); box(.08, sh * gap, d - .16, -w / 2 + .04, y, 0);
  }
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(.14, h, .14, sx * (w / 2 - .07), h / 2, sz * (d / 2 - .07)));
  return g;
}

export function makeBasket(THREE, tex) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ map: tex.wicker, roughness: .9, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.25, 1.5, 28, 1, true), m); body.position.y = .75; body.castShadow = body.receiveShadow = true; g.add(body);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(1.25, 24), m); bottom.rotation.x = -Math.PI / 2; bottom.position.y = .05; g.add(bottom);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.7, .07, 8, 36), m); rim.rotation.x = Math.PI / 2; rim.position.y = 1.5; rim.castShadow = true; g.add(rim);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(1.7, .07, 8, 24, Math.PI), m); handle.position.y = 1.5; handle.castShadow = true; g.add(handle);
  return g;
}

export function makeStall(THREE, tex, w = 18, d = 12, withCloth = true) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: tex.wood, roughness: .8 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, .5, d), wood); top.position.y = -.25; top.receiveShadow = top.castShadow = true; g.add(top);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.6, 5, .6), wood); l.position.set(sx * (w / 2 - .6), -2.8, sz * (d / 2 - .6)); l.castShadow = true; g.add(l); });
  if (!withCloth) return g;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(w * .9, d * .22), new THREE.MeshStandardMaterial({ map: tex.stripes, roughness: 1, color: C(THREE, 0xd9d2c4) })); cloth.rotation.x = -Math.PI / 2; cloth.position.set(0, .01, d / 2 - d * .12); cloth.receiveShadow = true; g.add(cloth);
  return g;
}

export function makeLabelSprite(THREE, text, { w = 256, h = 128, bg = "#fff8e6", fg = "#3a2412", size = 64, border = "#7a4a1d" } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  g.fillStyle = bg; g.strokeStyle = border; g.lineWidth = 8;
  const r = 18; g.beginPath(); g.moveTo(r, 4); g.lineTo(w - r, 4); g.quadraticCurveTo(w - 4, 4, w - 4, r); g.lineTo(w - 4, h - r); g.quadraticCurveTo(w - 4, h - 4, w - r, h - 4); g.lineTo(r, h - 4); g.quadraticCurveTo(4, h - 4, 4, h - r); g.lineTo(4, r); g.quadraticCurveTo(4, 4, r, 4); g.fill(); g.stroke();
  g.fillStyle = fg; g.font = `800 ${size}px "Trebuchet MS", system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 3);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.renderOrder = 10; s.scale.set(w / 64, h / 64, 1); return s;
}

/* The stage: renderer + camera orbit + lights + environment + tween/burst engines. */
export function createStage(host, THREE, opts = {}) {
  const o = Object.assign({ height: 400, az: .35, pol: 1.0, dist: 20, target: [0, 1, 0], sway: true, trees: true }, opts);
  const wrap = document.createElement("div");
  wrap.style.cssText = `position:relative;width:100%;height:${o.height}px;border-radius:14px;overflow:hidden;background:#cfe3f3;box-shadow:0 10px 28px rgba(30,40,20,.28)`;
  host.appendChild(wrap);
  const st = { ok: false, THREE, wrap, scene: null, camera: null, renderer: null, tex: null };
  if (!THREE.WebGLRenderer || !webglOK()) { wrap.innerHTML = `<p style="margin:0;padding:22px;color:#33415c;font-weight:600">3D view is not available on this device. You can still complete everything with the controls below.</p>`; st.dispose = () => wrap.remove(); st.onFrame = st.onPick = st.tween = st.burst = st.punch = () => {}; return st; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); } catch (e) { wrap.innerHTML = `<p style="margin:0;padding:22px">3D view could not start. Use the controls below.</p>`; st.dispose = () => wrap.remove(); st.onFrame = st.onPick = st.tween = st.burst = st.punch = () => {}; return st; }
  st.ok = true; st.renderer = renderer;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = renderer.domElement; cv.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline:none"; cv.tabIndex = 0;
  cv.setAttribute("aria-label", "3D orchard market scene. Drag or use arrow keys to look around.");
  wrap.appendChild(cv);

  const tex = makeTextures(THREE); st.tex = tex;
  const scene = new THREE.Scene(); st.scene = scene;
  scene.background = tex.sky; scene.fog = new THREE.Fog(C(THREE, 0xcfe0ea), 40, 95);
  const es = new THREE.Scene(); es.background = new THREE.Color(0xbcd7ee);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, .04).texture; pm.dispose();
  scene.add(new THREE.HemisphereLight(0xdcecff, 0x5b7a3a, .75));
  const sun = new THREE.DirectionalLight(0xfff0d2, 1.6); sun.position.set(-9, 16, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 60; sun.shadow.bias = -.0004; sun.shadow.normalBias = .04;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ map: tex.grass, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -5.3; ground.receiveShadow = true; scene.add(ground);
  if (o.trees) {
    const trunk = new THREE.MeshStandardMaterial({ color: C(THREE, 0x5a3b21), roughness: 1 }), leaf = [0x2f6f2a, 0x3b8a33, 0x2a5f26].map(c => new THREE.MeshStandardMaterial({ color: C(THREE, c), roughness: .9 }));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rnd(-.15, .15), r = rnd(30, 46), t = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(.5, .8, 7, 7), trunk); tr.position.y = -1.8; t.add(tr);
      for (let k = 0; k < 3; k++) { const cn = new THREE.Mesh(new THREE.SphereGeometry(rnd(3, 4.4), 12, 9), leaf[k]); cn.position.set(rnd(-1.5, 1.5), 2.6 + rnd(0, 2.6), rnd(-1.5, 1.5)); cn.castShadow = false; t.add(cn); }
      t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); scene.add(t);
    }
  }
  const motes = new THREE.BufferGeometry(); const mp = new Float32Array(160 * 3); for (let i = 0; i < 160; i++) { mp[i * 3] = rnd(-14, 14); mp[i * 3 + 1] = rnd(-1, 12); mp[i * 3 + 2] = rnd(-10, 10); }
  motes.setAttribute("position", new THREE.BufferAttribute(mp, 3));
  const glow = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,244,200,.9)"); gr.addColorStop(1, "rgba(255,244,200,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const moteObj = new THREE.Points(motes, new THREE.PointsMaterial({ size: .22, map: glow, transparent: true, depthWrite: false, opacity: .8 })); scene.add(moteObj);

  const camera = new THREE.PerspectiveCamera(38, 1, .1, 200); st.camera = camera;
  const S = { az: o.az, pol: o.pol, dist: o.dist, tgt: new THREE.Vector3(...o.target), dragging: false, travel: 0, lx: 0, ly: 0, punch: 0, idle: 0 };
  st.orbit = S;
  const frameFns = [], tweens = [], bursts = [];
  st.onFrame = fn => frameFns.push(fn);
  const place = t => {
    const swayA = (o.sway && !REDUCED() && !S.dragging) ? Math.sin(t * .00035) * .18 : 0;
    const asp = camera.aspect || 1.7, fit = asp < 1.7 ? Math.min(2.4, 1.7 / asp) : 1; const d = S.dist * fit - S.punch * 2.2; const az = S.az + swayA;
    camera.position.set(S.tgt.x + d * Math.sin(S.pol) * Math.sin(az), S.tgt.y + d * Math.cos(S.pol), S.tgt.z + d * Math.sin(S.pol) * Math.cos(az));
    camera.lookAt(S.tgt);
  };
  cv.addEventListener("pointerdown", e => { S.dragging = true; S.travel = 0; S.lx = e.clientX; S.ly = e.clientY; cv.style.cursor = "grabbing"; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
  cv.addEventListener("pointermove", e => { if (!S.dragging) return; const dx = e.clientX - S.lx, dy = e.clientY - S.ly; S.lx = e.clientX; S.ly = e.clientY; S.travel += Math.abs(dx) + Math.abs(dy); S.az -= dx * .006; S.pol = Math.max(.35, Math.min(1.45, S.pol - dy * .005)); });
  const up = () => { S.dragging = false; cv.style.cursor = "grab"; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("keydown", e => { const k = e.key; if (k === "ArrowLeft") S.az += .12; else if (k === "ArrowRight") S.az -= .12; else if (k === "ArrowUp") S.pol = Math.max(.35, S.pol - .08); else if (k === "ArrowDown") S.pol = Math.min(1.45, S.pol + .08); else return; e.preventDefault(); });
  let pickFn = null; st.onPick = fn => { pickFn = fn; };
  cv.addEventListener("click", e => { if (S.travel > 6 || !pickFn) return; const r = cv.getBoundingClientRect(); const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera); pickFn(rc, e); });

  const ease = { out: t => 1 - Math.pow(1 - t, 3), inout: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 };
  st.tween = (obj, to, ms = 600, { arc = 0, delay = 0, ease: ez = "inout", onDone } = {}) => {
    if (REDUCED()) { ms = 1; delay = 0; arc = 0; }
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj) tweens.splice(i, 1);
    const p = obj.position;
    tweens.push({ obj, from: p.clone(), to: to.clone ? to.clone() : new THREE.Vector3(...to), t0: performance.now() + delay, ms, arc, ez: ease[ez], onDone });
  };
  st.burst = (pos, color = 0xffd54a, n = 26) => {
    if (REDUCED()) return;
    const g = new THREE.BufferGeometry(), arr = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { arr[i * 3] = pos.x; arr[i * 3 + 1] = pos.y; arr[i * 3 + 2] = pos.z; vel.push(new THREE.Vector3(rnd(-3, 3), rnd(2, 6), rnd(-3, 3))); }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .38, color, map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts);
    bursts.push({ pts, vel, arr, t0: performance.now() });
  };
  st.punch = () => { if (!REDUCED()) S.punch = 1; };

  const resize = () => { const w = wrap.clientWidth || 600, h = wrap.clientHeight || o.height; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(wrap); resize();
  let raf = 0, last = performance.now(), dead = false;
  const loop = t => {
    if (dead) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i]; const k = (t - w.t0) / w.ms; if (k < 0) continue;
      const e = w.ez(Math.min(1, k)); w.obj.position.lerpVectors(w.from, w.to, e); if (w.arc) w.obj.position.y += Math.sin(Math.min(1, k) * Math.PI) * w.arc;
      if (k >= 1) { w.obj.position.copy(w.to); tweens.splice(i, 1); if (w.onDone) w.onDone(); }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i], age = (t - b.t0) / 1000; if (age > 1.3) { scene.remove(b.pts); b.pts.geometry.dispose(); bursts.splice(i, 1); continue; }
      for (let j = 0; j < b.vel.length; j++) { b.vel[j].y -= 9 * dt; b.arr[j * 3] += b.vel[j].x * dt; b.arr[j * 3 + 1] += b.vel[j].y * dt; b.arr[j * 3 + 2] += b.vel[j].z * dt; }
      b.pts.geometry.attributes.position.needsUpdate = true; b.pts.material.opacity = 1 - age / 1.3;
    }
    if (S.punch > 0) S.punch = Math.max(0, S.punch - dt * 2.4);
    if (!REDUCED()) { const a = motes.attributes.position; for (let i = 0; i < 160; i++) { a.array[i * 3 + 1] += dt * .25; if (a.array[i * 3 + 1] > 12) a.array[i * 3 + 1] = -1; a.array[i * 3] += Math.sin(t * .0004 + i) * dt * .2; } a.needsUpdate = true; }
    for (const fn of frameFns) fn(dt, t);
    place(t); renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);
  st.dispose = () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {} wrap.remove(); };
  return st;
}
