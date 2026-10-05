/* Pentagon Quest — the 3D Pentagon Park (Three.js r128, vendored).
   Five pillars stand at the corners of a pentagon. Their height is how well
   that part of Pip's life is going. A glowing pentagon floor stretches between
   the pillar tops, so a neglected part visibly makes the whole floor tilt, and
   Pip leans and slides downhill. Care "ripples" fly between linked pillars.
   Drag (or arrow keys) to orbit. Everything cosmetic runs on requestAnimationFrame;
   no game state lives here. */
import { PILLARS, IDS } from "./model.js?v=1";

const THREE_URL = "../../../../../../engine/vendor/three.min.js";
let threePromise = null;
export function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!threePromise) threePromise = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = THREE_URL;
    s.onload = () => res(window.THREE); s.onerror = () => rej(new Error("three failed")); document.head.appendChild(s);
  });
  return threePromise;
}
const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
const RAD = 3.1, hOf = v => 0.6 + (v / 100) * 4.6;

function canvasTex(THREE, w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }

export function drawFace(ctx, mood, w = 256) {
  ctx.clearRect(0, 0, w, w); const c = w / 2;
  const eye = (x, y, open) => {
    ctx.fillStyle = "#2b2140";
    if (open === "closed") { ctx.lineWidth = 7; ctx.strokeStyle = "#2b2140"; ctx.beginPath(); ctx.arc(x, y, 14, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); return; }
    ctx.beginPath(); ctx.ellipse(x, y, 13, open === "half" ? 7 : 17, 0, 0, 7); ctx.fill();
    if (open !== "half") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 4, y - 6, 5, 0, 7); ctx.fill(); }
  };
  const brow = (x, y, tilt) => { ctx.strokeStyle = "#2b2140"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x - 20, y + tilt); ctx.lineTo(x + 20, y - tilt); ctx.stroke(); };
  const eyeKind = { happy: "open", okay: "open", tired: "half", upset: "open", calm: "closed", excited: "open", worried: "open", angry: "open" }[mood] || "open";
  eye(c - 44, c - 8, eyeKind); eye(c + 44, c - 8, eyeKind);
  if (mood === "upset" || mood === "worried") { brow(c - 44, c - 44, mood === "upset" ? -9 : 9); brow(c + 44, c - 44, mood === "upset" ? 9 : -9); }
  if (mood === "angry") { brow(c - 44, c - 42, 12); brow(c + 44, c - 42, -12); }
  ctx.fillStyle = "rgba(255,120,150,.45)"; ctx.beginPath(); ctx.arc(c - 74, c + 22, 14, 0, 7); ctx.arc(c + 74, c + 22, 14, 0, 7); ctx.fill();
  ctx.strokeStyle = "#2b2140"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath();
  if (mood === "happy" || mood === "calm") ctx.arc(c, c + 14, 30, .12 * Math.PI, .88 * Math.PI);
  else if (mood === "excited") { ctx.fillStyle = "#7a2b3a"; ctx.ellipse(c, c + 34, 24, 20, 0, 0, 7); ctx.fill(); ctx.beginPath(); }
  else if (mood === "okay") { ctx.moveTo(c - 22, c + 40); ctx.lineTo(c + 22, c + 40); }
  else if (mood === "tired") { ctx.ellipse(c, c + 44, 14, 10, 0, 0, 7); }
  else { ctx.arc(c, c + 60, 28, 1.15 * Math.PI, 1.85 * Math.PI); }
  ctx.stroke();
  if (mood === "tired") { ctx.fillStyle = "#6a5ad6"; ctx.font = "bold 40px sans-serif"; ctx.fillText("z", c + 70, c - 70); ctx.font = "bold 28px sans-serif"; ctx.fillText("z", c + 100, c - 96); }
}

export async function createScene(host, opts = {}) {
  const THREE = await loadThree();
  const test = document.createElement("canvas");
  if (!(test.getContext("webgl") || test.getContext("experimental-webgl"))) throw new Error("no webgl");
  const wrap = document.createElement("div"); wrap.className = "pq-3d"; host.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const cv = renderer.domElement; cv.tabIndex = 0; cv.style.touchAction = "pan-y"   /* horizontal drag orbits, vertical swipe still scrolls the page; nothing here is picked by tap */; cv.style.display = "block"; cv.style.width = "100%"; cv.style.height = "100%";
  cv.setAttribute("role", "img"); cv.setAttribute("aria-label", opts.label || "3D Pentagon Park: five pillars show how well each part of Pip's health is going. Drag to look around.");
  wrap.appendChild(cv);

  const scene = new THREE.Scene();
  scene.background = canvasTex(THREE, 8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5fb7ff"); gr.addColorStop(.6, "#bfe6ff"); gr.addColorStop(1, "#ffe9c9"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.fog = new THREE.Fog(0xcfeaff, 18, 38);
  const camera = new THREE.PerspectiveCamera(45, 1.6, .1, 80);
  scene.add(new THREE.HemisphereLight(0xdff1ff, 0x6a8f5a, .85));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.0); sun.position.set(6, 12, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.far = 40; scene.add(sun);

  /* ground with painted grass noise + a pale plaza under the pillars */
  const gtex = canvasTex(THREE, 512, 512, (g, w, h) => {
    g.fillStyle = "#79c36a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60},${130 + Math.random() * 80},${50 + Math.random() * 40},${.12 + Math.random() * .2})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 7); }
  });
  gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping; gtex.repeat.set(5, 5);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshStandardMaterial({ map: gtex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(RAD + 1.6, RAD + 1.9, .25, 40), new THREE.MeshStandardMaterial({ color: 0xf1e3c4, roughness: .9 }));
  plaza.position.y = .12; plaza.receiveShadow = true; scene.add(plaza);

  /* trees, clouds */
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + .2, r = 9 + (i % 3) * 1.6; const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0x8a5a33 })); trunk.position.y = .55; trunk.castShadow = true;
    const top = new THREE.Mesh(new THREE.ConeGeometry(.95, 2.1, 9), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.33 + (i % 4) * .015, .55, .33 + (i % 3) * .04), roughness: .8 })); top.position.y = 1.9; top.castShadow = true;
    g.add(trunk, top); g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); scene.add(g);
  }
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: .92 });
    [[0, 0, 0, 1], [.9, -.1, .2, .75], [-.9, -.15, -.1, .7], [.3, .35, 0, .6]].forEach(([x, y, z, s]) => { const s1 = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 10), m); s1.position.set(x, y, z); g.add(s1); });
    g.position.set(-14 + i * 6, 7 + (i % 3), -8 + (i * 5) % 12); g.userData.sp = .15 + (i % 3) * .06; scene.add(g); clouds.push(g);
  }

  /* five pillars with toppers */
  const pil = {};
  PILLARS.forEach((p, i) => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 5), x = Math.cos(a) * RAD, z = Math.sin(a) * RAD;
    const col = new THREE.Color(p.color);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.55, .68, 1, 24), new THREE.MeshPhysicalMaterial({ color: col, roughness: .35, metalness: .05, clearcoat: .6, clearcoatRoughness: .3 }));
    body.geometry.translate(0, .5, 0); body.castShadow = true; body.receiveShadow = true;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.0, .3, 24), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: .8 })); base.position.y = .15; base.receiveShadow = true;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.add(base, body);
    const top = new THREE.Group(); g.add(top); top.add(topper(THREE, p.id));
    scene.add(g);
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.3, 36), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = .27; g.add(halo);
    pil[p.id] = { g, body, top, halo, x, z, h: hOf(50), target: hOf(50), punch: 0, color: col, i };
  });

  /* the stretchy pentagon floor between the pillar tops */
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(15 * 3), 3));
  fgeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(15 * 3), 3));
  const floor = new THREE.Mesh(fgeo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .3, metalness: .15, transparent: true, opacity: .93, emissive: 0x222222 }));
  floor.receiveShadow = true; floor.frustumCulled = false; scene.add(floor);
  const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(IDS.map(() => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: 0xffffff })); edge.frustumCulled = false; scene.add(edge);
  const centreCol = new THREE.Color(0xffffff);

  /* Pip */
  const pip = new THREE.Group(); pip.scale.setScalar(1.35); scene.add(pip);
  const pb = new THREE.Mesh(new THREE.SphereGeometry(.6, 28, 22), new THREE.MeshPhysicalMaterial({ color: 0xffb347, roughness: .45, clearcoat: .4 })); pb.position.y = .62; pb.castShadow = true; pip.add(pb);
  [-.3, .3].forEach(x => { const f = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 10), new THREE.MeshStandardMaterial({ color: 0xff8a3d })); f.position.set(x, .08, .15); f.castShadow = true; pip.add(f); });
  const arms = [-1, 1].map(s => { const a = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 10), new THREE.MeshStandardMaterial({ color: 0xff9d45 })); a.position.set(s * .66, .6, 0); pip.add(a); return a; });
  const faceCv = document.createElement("canvas"); faceCv.width = faceCv.height = 256;
  const faceTex = new THREE.CanvasTexture(faceCv); faceTex.encoding = THREE.sRGBEncoding;
  const face = new THREE.Sprite(new THREE.SpriteMaterial({ map: faceTex, transparent: true, depthWrite: false })); face.scale.set(1.38, 1.38, 1); scene.add(face);
  let curMood = "happy"; const setMood = m => { curMood = m; drawFace(faceCv.getContext("2d"), m); faceTex.needsUpdate = true; }; setMood("happy");

  /* sparkles + effects + storm cloud */
  const SP = 90, spGeo = new THREE.BufferGeometry(), spPos = new Float32Array(SP * 3), spSeed = [];
  for (let i = 0; i < SP; i++) { const a = Math.random() * 6.28, r = 1 + Math.random() * 5; spPos.set([Math.cos(a) * r, Math.random() * 5, Math.sin(a) * r], i * 3); spSeed.push(Math.random() * 6.28); }
  spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
  scene.add(new THREE.Points(spGeo, new THREE.PointsMaterial({ size: .09, color: 0xfff6b0, transparent: true, opacity: .8, depthWrite: false })));
  const fx = [];
  const storm = new THREE.Group(); storm.visible = false; scene.add(storm);
  { const dm = new THREE.MeshStandardMaterial({ color: 0x4b5568, roughness: 1 });
    [[0, 0, 0, .9], [.8, -.1, 0, .65], [-.8, -.1, 0, .65]].forEach(([x, y, z, s]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 9), dm); m.position.set(x, y, z); storm.add(m); }); }
  let stormId = null;

  /* camera orbit: pointer drag with touch-action:none, wheel zoom, arrow keys */
  let theta = .5, phi = 1.0, radius = opts.radius || 11.5, lastDrag = -1e9, dragging = false, px = 0, py = 0;
  cv.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; py = e.clientY; lastDrag = performance.now(); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener("pointermove", e => { if (!dragging) return; theta -= (e.clientX - px) * .008; phi = Math.max(.35, Math.min(1.45, phi - (e.clientY - py) * .006)); px = e.clientX; py = e.clientY; lastDrag = performance.now(); });
  const up = () => { dragging = false; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => { e.preventDefault(); radius = Math.max(8, Math.min(20, radius + e.deltaY * .01)); lastDrag = performance.now(); }, { passive: false });
  cv.addEventListener("keydown", e => {
    const k = e.key;
    if (k === "ArrowLeft") theta -= .12; else if (k === "ArrowRight") theta += .12;
    else if (k === "ArrowUp") phi = Math.max(.35, phi - .08); else if (k === "ArrowDown") phi = Math.min(1.45, phi + .08);
    else if (k === "+" || k === "=") radius = Math.max(8, radius - 1); else if (k === "-") radius = Math.min(20, radius + 1); else return;
    e.preventDefault(); lastDrag = performance.now();
  });

  function resize() { const w = wrap.clientWidth || 600, h = wrap.clientHeight || 360; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

  let running = true, last = performance.now(), T = 0, stopped = false;
  const tmpV = new THREE.Vector3();
  const topPos = id => new THREE.Vector3(pil[id].x, pil[id].h + .55, pil[id].z);

  function frame(now) {
    if (stopped) return; requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt; if (!running || document.hidden) return;
    const rm = reduced();
    IDS.forEach(id => {
      const p = pil[id]; p.h += (p.target - p.h) * Math.min(1, dt * 4.5);
      p.punch = Math.max(0, p.punch - dt * 2.4); const pu = rm ? 0 : Math.sin(p.punch * 9) * p.punch * .12;
      p.body.scale.y = Math.max(.1, p.h); p.body.scale.x = p.body.scale.z = 1 + pu;
      p.top.position.y = p.h + .1 + (rm ? 0 : Math.sin(T * 2 + p.i) * .06); p.top.rotation.y = rm ? 0 : T * .8 + p.i;
      p.halo.material.opacity = Math.max(0, p.punch * .8);
    });
    const hs = IDS.map(id => pil[id].h), hc = hs.reduce((a, b) => a + b, 0) / 5;
    const P0 = new THREE.Vector3(0, hc, 0), tops = IDS.map(id => new THREE.Vector3(pil[id].x, pil[id].h, pil[id].z));
    const pa = fgeo.attributes.position, ca = fgeo.attributes.color; let k = 0;
    for (let i = 0; i < 5; i++) {
      const a = tops[i], b = tops[(i + 1) % 5];
      [P0, a, b].forEach((v, j) => { pa.setXYZ(k, v.x, v.y + .02, v.z); const c = j === 0 ? centreCol : (j === 1 ? pil[IDS[i]].color : pil[IDS[(i + 1) % 5]].color); ca.setXYZ(k, c.r, c.g, c.b); k++; });
    }
    pa.needsUpdate = true; ca.needsUpdate = true; fgeo.computeVertexNormals();
    edge.geometry.setFromPoints(tops.map(v => new THREE.Vector3(v.x, v.y + .04, v.z)));
    /* plane fit: Pip leans and slides toward the low side */
    let sx = 0, sz = 0, qx = 0; IDS.forEach((id, i) => { sx += (hs[i] - hc) * pil[id].x; sz += (hs[i] - hc) * pil[id].z; qx += pil[id].x * pil[id].x; });
    const sa = sx / (qx || 1), sb = sz / (qx || 1);
    const px2 = -sa * 1.1, pz2 = -sb * 1.1;
    pip.position.set(px2, hc + sa * px2 + sb * pz2 + .02, pz2);
    pip.rotation.z = Math.atan(sa); pip.rotation.x = -Math.atan(sb);
    const bob = rm ? 0 : Math.sin(T * 2.6) * .05; pb.position.y = .62 + bob; arms.forEach((m, i) => m.position.y = .6 + (rm ? 0 : Math.sin(T * 3 + i * 3) * .12));
    tmpV.copy(camera.position).sub(pip.position).normalize();
    face.position.set(pip.position.x, pip.position.y + .86 + bob, pip.position.z).addScaledVector(tmpV, .78);
    if (!rm) {
      clouds.forEach(c => { c.position.x += c.userData.sp * dt; if (c.position.x > 20) c.position.x = -20; });
      const sp = spGeo.attributes.position; for (let i = 0; i < SP; i++) { let y = sp.getY(i) + dt * .35; if (y > 5.5) y = 0; sp.setY(i, y); sp.setX(i, sp.getX(i) + Math.sin(T + spSeed[i]) * dt * .15); } sp.needsUpdate = true;
    }
    if (stormId) { const p = pil[stormId]; storm.visible = true; storm.position.set(p.x + (rm ? 0 : Math.sin(T * 5) * .08), p.h + 2.3, p.z); } else storm.visible = false;
    for (let i = fx.length - 1; i >= 0; i--) if (!fx[i].update(dt)) { scene.remove(fx[i].mesh); fx.splice(i, 1); }
    if (!rm && !dragging && performance.now() - lastDrag > 3500) theta += dt * .12;
    camera.position.set(Math.sin(theta) * Math.sin(phi) * radius, Math.cos(phi) * radius + 1.2, Math.cos(theta) * Math.sin(phi) * radius);
    camera.lookAt(0, 2.3, 0); renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  const api = {
    ok: true, canvas: cv, wrap, THREE, pil,
    setValues(v, instant) { IDS.forEach(id => { pil[id].target = hOf(v[id]); if (instant) pil[id].h = pil[id].target; }); },
    setMood, get mood() { return curMood; },
    pulse(id, col) { const p = pil[id]; if (!p) return; p.punch = 1; this.burst(id, col || PILLARS[p.i].color); },
    burst(id, color) {
      const p = pil[id]; if (!p || reduced()) return; const n = 26, g = new THREE.BufferGeometry(), ps = new Float32Array(n * 3), vs = [];
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, u = Math.random() * 2 + 1; vs.push([Math.cos(a) * u, 2 + Math.random() * 2.5, Math.sin(a) * u]); }
      g.setAttribute("position", new THREE.BufferAttribute(ps, 3));
      const m = new THREE.Points(g, new THREE.PointsMaterial({ size: .16, color: new THREE.Color(color), transparent: true, depthWrite: false }));
      m.frustumCulled = false; m.position.set(p.x, p.h + .6, p.z); scene.add(m); let age = 0;
      fx.push({ mesh: m, update(dt) { age += dt; const a = g.attributes.position; for (let i = 0; i < n; i++) a.setXYZ(i, a.getX(i) + vs[i][0] * dt, a.getY(i) + vs[i][1] * dt - age * 2 * dt, a.getZ(i) + vs[i][2] * dt); a.needsUpdate = true; m.material.opacity = Math.max(0, 1 - age / 1.1); return age < 1.1; } });
    },
    ripple(from, to, color) {
      if (reduced() || !pil[from] || !pil[to]) return;
      const m = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(color || PILLARS[pil[from].i].color) }));
      scene.add(m); let age = 0; const A = topPos(from), B = topPos(to);
      fx.push({ mesh: m, update(dt) { age += dt; const u = Math.min(1, age / .9); m.position.lerpVectors(A, B, u); m.position.y += Math.sin(u * Math.PI) * 1.6; m.scale.setScalar(1 + Math.sin(u * Math.PI) * .6); if (u >= 1) { api.pulse(to); return false; } return true; } });
    },
    setStorm(id) { stormId = id || null; },
    pause(p) { running = !p; },
    dispose() { stopped = true; ro.disconnect(); renderer.dispose(); wrap.remove(); },
  };
  return api;
}

function topper(THREE, id) {
  const g = new THREE.Group(); const std = c => new THREE.MeshStandardMaterial({ color: c, roughness: .4 });
  if (id === "food") { const a = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), std(0xd8322f)); a.scale.y = .9; const l = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), std(0x3da04a)); l.scale.set(1.6, .4, .8); l.position.set(.12, .45, 0); g.add(a, l); }
  else if (id === "move") { const b = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), std(0xffffff)); const r = new THREE.Mesh(new THREE.TorusGeometry(.42, .04, 8, 24), std(0x222222)); const r2 = r.clone(); r2.rotation.y = Math.PI / 2; g.add(b, r, r2); }
  else if (id === "sleep") { const m = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfff1a8, emissive: 0x6b5a10, roughness: .6 })); const cut = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 12), std(0x6a5ad6)); cut.position.set(.2, .1, .12); g.add(m, cut); }
  else if (id === "calm") { for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(.16, .6, 8), std(0xaef0f6)); p.position.set(Math.cos(i * 1.047) * .22, .3, Math.sin(i * 1.047) * .22); p.rotation.set(Math.sin(i * 1.047) * .5, 0, -Math.cos(i * 1.047) * .5); g.add(p); } }
  else { [-.22, .22].forEach((x, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 12), std(i ? 0xff7aa8 : 0xff4f8b)); s.position.x = x; g.add(s); }); }
  g.position.y = .3; return g;
}
