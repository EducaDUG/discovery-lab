/* Grid Commander - the 3D living diorama (vendored Three.js r128, global THREE).
   Hyper-real levers (CLAUDE.md 18): ACES tone mapping, soft shadows, physically based materials, fog,
   a procedural sky with a real sun/moon arc and stars, drifting clouds, animated water, vertex-coloured
   terrain, instanced trees, particle smoke/steam, lit windows at night, energy packets flowing along the
   power lines, a repair drone and van. Own orbit camera (drag / right-drag pan / wheel / pinch / keys). */
import { CATALOG, terrainHeight, spotCheck, HYDRO_CAP_MWH, BESS_CAP_MWH } from "./grid-engine.js?v=11";

export function loadThree(url) {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = url; s.onload = () => res(window.THREE); s.onerror = () => rej(new Error("three.js failed to load")); document.head.appendChild(s); });
}

export const CITY = [6, 17], SUB = [1.5, 2.2], UPPER = [-14, -8], LOWER = [-2, 8];
export const PRESETS = {
  overview: [[36, 32, 46], [0, 1, 2]], profile: [[-30, 12, 8], [-10, 6, -5]], plateau: [[24, 12, -2], [11, 5, -10]],
  city: [[22, 13, 38], [6, 2, 15]], topdown: [[0, 52, 1], [0, 0, 0]],
};

export async function createScene(container, hooks, threeUrl) {
  const THREE = await loadThree(threeUrl);
  const V3 = THREE.Vector3, reduced = !!hooks.reduced;
  const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
  if (!gl) throw new Error("WebGL unavailable");
  const dbg = gl.getExtension("WEBGL_debug_renderer_info"); const soft = /SwiftShader|llvmpipe|Software|Basic Render/i.test(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""));
  const C = hex => new THREE.Color(hex).convertSRGBToLinear();

  const renderer = new THREE.WebGLRenderer({ antialias: !soft, powerPreference: "high-performance" });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(soft ? 1 : Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = !soft; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = renderer.domElement; cv.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none"; cv.tabIndex = 0; cv.setAttribute("aria-label", "3D energy island. Drag to orbit, scroll to zoom, arrow keys also work.");
  container.appendChild(cv);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, 0.5, 900);
  scene.fog = new THREE.FogExp2(0x9ec9ff, 0.0085);

  /* ---------- procedural helpers ---------- */
  const tex = (w, h, draw, rep) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); } return t; };
  const glowTex = tex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const puffTex = tex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, "rgba(255,255,255,.9)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const noiseTex = tex(256, 256, (g, w, h) => { const d = g.createImageData(w, h); for (let i = 0; i < d.data.length; i += 4) { const v = 150 + Math.random() * 70 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }, 6);
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: C(color), roughness: 0.6, metalness: 0.05 }, o));
  const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: C(color), roughness: 0.3, metalness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.3 }, o));
  const box = (w, h, d, m, x = 0, y = 0, z = 0, cast = true) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = cast && !soft; o.receiveShadow = true; return o; };
  const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 20) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = !soft; o.receiveShadow = true; return o; };

  /* ---------- sky dome, sun, moon, stars ---------- */
  const skyU = { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: "varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "uniform vec3 top;uniform vec3 bot;varying vec3 p;void main(){float h=clamp(p.y*1.4+.15,0.,1.);gl_FragColor=vec4(mix(bot,top,pow(h,.7)),1.);}" }));
  scene.add(sky);
  const starGeo = new THREE.BufferGeometry(), sp = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) { const u = Math.random() * 6.283, v = Math.acos(Math.random() * 0.95 + 0.04); sp.set([260 * Math.sin(v) * Math.cos(u), 260 * Math.cos(v), 260 * Math.sin(v) * Math.sin(u)], i * 3); }
  starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.6, color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false, sizeAttenuation: false })); scene.add(stars);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1b8, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })); sunSprite.scale.set(70, 70, 1); scene.add(sunSprite);
  const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbcd0ff, fog: false, depthWrite: false })); moonSprite.scale.set(26, 26, 1); scene.add(moonSprite);
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x4a5a3a, 0.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d6, 2.4); sun.castShadow = !soft;
  if (!soft) { sun.shadow.mapSize.set(2048, 2048); const s = sun.shadow.camera; s.left = -34; s.right = 34; s.top = 34; s.bottom = -34; s.near = 1; s.far = 140; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; }
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight(0x8fb0ff, 0.0); scene.add(moon);

  /* ---------- terrain, sea, lakes ---------- */
  const N = 120, SZ = 60, tg = new THREE.PlaneGeometry(SZ, SZ, N, N); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position, tcol = new Float32Array(tp.count * 3), tmp = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i); let y = terrainHeight(x, z); const e = Math.max(Math.abs(x), Math.abs(z));
    if (e > 25) y = y - Math.pow((e - 25) / 5, 1.6) * 5.5;
    tp.setY(i, y);
    const n = Math.sin(x * 1.7) * Math.cos(z * 1.3) * 0.04;
    if (y < 0.7) tmp.setRGB(0.80, 0.74, 0.5); else if (y < 5.5) tmp.setRGB(0.22 + n, 0.46 + n * 2, 0.18); else if (y < 10) tmp.setRGB(0.34 + n, 0.38 + n, 0.22); else if (y < 13) tmp.setRGB(0.45, 0.42, 0.38); else tmp.setRGB(0.9, 0.92, 0.95);
    tmp.convertSRGBToLinear(); tcol.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  tg.setAttribute("color", new THREE.BufferAttribute(tcol, 3)); tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, bumpMap: noiseTex, bumpScale: 0.18 })); terrain.receiveShadow = true; terrain.castShadow = !soft; scene.add(terrain);
  const slab = box(SZ + 0.4, 5, SZ + 0.4, mat(0x2a2118, { roughness: 1 }), 0, -5.2, 0, false); scene.add(slab);
  const seaG = new THREE.PlaneGeometry(260, 260, 48, 48); seaG.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaG, new THREE.MeshPhysicalMaterial({ color: C(0x1d6f9a), roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.88, clearcoat: 1 })); sea.position.y = 0.1; sea.receiveShadow = true; scene.add(sea);
  const lakeMat = () => new THREE.MeshPhysicalMaterial({ color: C(0x2b86b6), roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.85, clearcoat: 1 });
  const upper = new THREE.Mesh(new THREE.CircleGeometry(4.5, 40), lakeMat()); upper.rotation.x = -Math.PI / 2; upper.position.set(UPPER[0], 7.5, UPPER[1]); scene.add(upper);
  const lower = new THREE.Mesh(new THREE.CircleGeometry(4.9, 40), lakeMat()); lower.rotation.x = -Math.PI / 2; lower.position.set(LOWER[0], 0.78, LOWER[1]); scene.add(lower);

  /* ---------- trees (instanced) ---------- */
  { const cone = new THREE.ConeGeometry(0.55, 1.7, 7), trunk = new THREE.CylinderGeometry(0.08, 0.1, 0.5, 5);
    const pos = []; let tries = 0; while (pos.length < 190 && tries++ < 4000) { const x = (Math.random() - 0.5) * 50, z = (Math.random() - 0.5) * 50, y = terrainHeight(x, z);
      if (y < 1.0 || y > 9.5 || Math.hypot(x + 14, z + 8) < 5.5 || Math.hypot(x + 2, z - 8) < 6 || Math.hypot(x - CITY[0], z - CITY[1]) < 7 || Math.hypot(x - 12, z + 10) < 7.5) continue; pos.push([x, y, z]); }
    const leaf = new THREE.InstancedMesh(cone, mat(0x2f6b34, { roughness: 0.9 }), pos.length), wood = new THREE.InstancedMesh(trunk, mat(0x4b3321), pos.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
    pos.forEach((p, i) => { const s = 0.7 + Math.random() * 0.9; sc.set(s, s, s); m4.compose(new V3(p[0], p[1] + 0.9 * s + 0.2, p[2]), q, sc); leaf.setMatrixAt(i, m4); leaf.setColorAt(i, col.setHSL(0.3 + Math.random() * 0.06, 0.45, 0.2 + Math.random() * 0.1).convertSRGBToLinear());
      m4.compose(new V3(p[0], p[1] + 0.15, p[2]), q, sc); wood.setMatrixAt(i, m4); });
    leaf.castShadow = !soft; scene.add(leaf, wood); }

  /* ---------- city with lit windows ---------- */
  const cityMats = []; const city = new THREE.Group(); city.position.set(CITY[0], 0, CITY[1]); scene.add(city);
  { const winTex = tex(128, 256, (g, w, h) => { g.fillStyle = "#1b2433"; g.fillRect(0, 0, w, h); for (let y = 8; y < h - 8; y += 16) for (let x = 8; x < w - 8; x += 16) { g.fillStyle = Math.random() < 0.72 ? "#ffd98a" : "#222c3d"; g.fillRect(x, y, 8, 10); } });
    const baseGround = tmpGround(); city.add(baseGround);
    function tmpGround() { const g = box(13, 0.3, 11, mat(0x555a63, { roughness: 0.95 }), 0, 0.15, 0, false); g.position.y = 1.1; return g; }
    for (let i = 0; i < 26; i++) { const gx = (i % 6) - 2.5, gz = Math.floor(i / 6) - 2, h = 1.2 + Math.random() * 3.6 * (1 - Math.hypot(gx / 3.4, gz / 2.8) * 0.55), w = 1.0 + Math.random() * 0.4;
      const m = new THREE.MeshStandardMaterial({ color: C(0xaab4c4), roughness: 0.55, metalness: 0.25, emissive: new THREE.Color(0xffffff), emissiveMap: winTex, emissiveIntensity: 0 }); cityMats.push(m);
      const b = box(w, h, w, m, gx * 2.0 + (Math.random() - 0.5) * 0.4, 1.25 + h / 2, gz * 2.1 + (Math.random() - 0.5) * 0.4); city.add(b); }
    const lbl = new THREE.Object3D(); lbl.position.set(0, 7, 0); city.add(lbl); city.userData.label = lbl; }

  /* ---------- facility models ---------- */
  const M = { white: mat(0xf1f5f9, { roughness: 0.35, metalness: 0.15 }), conc: mat(0xb7b2a6, { roughness: 0.9 }), dark: mat(0x2b2f36, { roughness: 0.5, metalness: 0.6 }), steel: phys(0x9aa4b2, { metalness: 0.9, roughness: 0.28 }), red: mat(0xc0392b), glass: phys(0x16397a, { metalness: 0.9, roughness: 0.12, clearcoat: 1, emissive: new THREE.Color(0x0a2a66), emissiveIntensity: 0.25 }) };
  const puffMat = (color, size, op = 0.5) => new THREE.PointsMaterial({ size, map: puffTex, color, transparent: true, opacity: op, depthWrite: false, sizeAttenuation: true });
  function plume(n, height, spread, mc) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n * 2); for (let i = 0; i < n; i++) { s[i * 2] = Math.random(); s[i * 2 + 1] = (Math.random() - 0.5); }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(g, mc); pts.frustumCulled = false; pts.userData = { n, s, height, spread, speed: 0.25 }; return pts; }
  function stepPlume(pts, dt, t, on, wind) { const { n, s, height, spread } = pts.userData, p = pts.geometry.attributes.position.array; pts.visible = on;
    if (!on) return; for (let i = 0; i < n; i++) { s[i * 2] = (s[i * 2] + dt * pts.userData.speed * (0.7 + (i % 5) * 0.12)) % 1; const k = s[i * 2]; p[i * 3] = Math.sin(i * 12.9 + t * 0.5) * spread * k + wind * k * k * 1.6; p[i * 3 + 1] = k * height; p[i * 3 + 2] = Math.cos(i * 7.7) * spread * k; } pts.geometry.attributes.position.needsUpdate = true; pts.material.opacity = 0.5; }

  function windModel(f) {
    const g = new THREE.Group(), rotors = [];
    [[0, 0], [3.4, 1.2], [-2.8, 2.4]].forEach(([ox, oz], i) => { const t = new THREE.Group(); t.position.set(ox, 0, oz); const sc = i === 0 ? 1 : 0.86;
      t.add(cyl(0.12 * sc, 0.22 * sc, 5.2 * sc, M.white, 0, 2.6 * sc, 0, 16)); const nac = box(0.7 * sc, 0.45 * sc, 1.1 * sc, M.white, 0, 5.3 * sc, 0.05); t.add(nac);
      const rot = new THREE.Group(); rot.position.set(0, 5.3 * sc, 0.65 * sc); t.add(rot);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2 * sc, 14, 10), M.white); rot.add(hub);
      for (let b = 0; b < 3; b++) { const bl = new THREE.Group(); bl.rotation.z = b * 2.094; const sh = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 2.5 * sc, 0.05), M.white); sh.position.y = 1.35 * sc; sh.castShadow = !soft; sh.rotation.y = 0.18; bl.add(sh); rot.add(bl); }
      g.add(t); rotors.push(rot); });
    g.userData.update = (dt, t, f2, tel) => { const w = tel.wind, w0 = Math.max(0, f2.out) / f2.cap; const sp = f2.status === "broken" ? 0 : (w > 25 ? 0.3 : (w0 * 2.2 + (w > 3 ? 0.35 : 0))); rotors.forEach((r, i) => { r.rotation.z += dt * sp * (1 + i * 0.07); }); g.rotation.y = f2.rot * 0.2 + Math.sin(t * 0.1) * 0.05; };
    return g; }
  function solarModel(f) {
    const g = new THREE.Group(), pans = []; const frame = mat(0xcbd5e1, { metalness: 0.8, roughness: 0.3 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const pivot = new THREE.Group(); pivot.position.set((c - 2) * 1.8, 0.55, (r - 1) * 2.1); const p = box(1.65, 0.07, 1.15, M.glass, 0, 0, 0); p.castShadow = !soft; pivot.add(p); const rim = box(1.72, 0.05, 1.22, frame, 0, -0.04, 0); pivot.add(rim); pivot.add(cyl(0.04, 0.04, 0.55, frame, 0, -0.3, 0, 6)); g.add(pivot); pans.push(pivot); }
    const pad = box(10.5, 0.1, 7, mat(0x74777c, { roughness: 1 }), 0, 0.05, 0, false); g.add(pad);
    g.userData.update = (dt, t, f2, tel, env) => { const a = Math.max(-1.1, Math.min(1.1, env.sunAng)); pans.forEach(p => { p.rotation.z = -a * 0.55; }); M.glass.emissiveIntensity = 0.1 + (tel.sun / 100) * 0.55; };
    return g; }
  function hydroModel(f) {
    const g = new THREE.Group(); g.add(box(4.2, 2, 3, M.conc, 0, 1, 0)); g.add(box(4.6, 0.3, 3.4, mat(0x3d4a59, { roughness: 0.5, metalness: 0.4 }), 0, 2.15, 0));
    const vents = []; for (let i = 0; i < 3; i++) { g.add(box(0.7, 0.9, 0.05, mat(0x1c2735), -1.3 + i * 1.3, 1.1, 1.52, false)); }
    g.add(cyl(0.32, 0.32, 3.2, M.steel, 1.6, 2.4, -1.0, 14)); const gen = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 8, 24), new THREE.MeshStandardMaterial({ color: C(0x38bdf8), emissive: C(0x38bdf8), emissiveIntensity: 0 })); gen.position.set(-1.2, 1.1, 1.55); g.add(gen);
    g.userData.update = (dt, t, f2) => { gen.material.emissiveIntensity = Math.min(1.4, Math.abs(f2.out) / f2.cap * 1.4); gen.rotation.z += dt * (f2.out > 0 ? 3 : f2.out < 0 ? -3 : 0); };
    return g; }
  function gasModel(f) {
    const g = new THREE.Group(); g.add(box(5, 2.2, 2.6, mat(0x8b8f96, { roughness: 0.7, metalness: 0.3 }), 0, 1.1, 0)); g.add(box(2.2, 1.6, 2.2, M.dark, 2.8, 0.8, 0.4));
    [[-1.4, 0], [-0.4, 0.2]].forEach(([x, z]) => g.add(cyl(0.32, 0.38, 5.2, mat(0xc7c9cc, { roughness: 0.5, metalness: 0.4 }), x, 3.9, z, 16)));
    g.add(cyl(0.7, 0.7, 2.6, mat(0xe2e8f0, { roughness: 0.4 }), 3.0, 1.6, -1.6)).rotation.z = 0;
    const smoke = plume(70, 6, 1.4, puffMat(0x6b6f76, 1.5, 0.45)); smoke.position.set(-0.9, 6.3, 0.1); smoke.userData.speed = 0.2; g.add(smoke);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); glow.position.set(-0.9, 6.55, 0.1); g.add(glow);
    g.userData.update = (dt, t, f2, tel, env) => { const on = f2.out > 1; stepPlume(smoke, dt, t, on, env.wind * 0.05); glow.visible = on; glow.scale.setScalar(0.8 + f2.out / f2.cap); };
    return g; }
  function batteryModel(f) {
    const g = new THREE.Group(), leds = []; for (let i = 0; i < 6; i++) { const cx = (i % 3) * 1.9 - 1.9, cz = Math.floor(i / 3) * 2.2 - 1.1; g.add(box(1.7, 1.5, 1.8, mat(0xe8edf2, { roughness: 0.45, metalness: 0.3 }), cx, 0.8, cz));
      const led = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: C(0x1ee08a), emissive: C(0x1ee08a), emissiveIntensity: 1 })); led.position.set(cx, 1.3, cz + 0.92); g.add(led); leds.push(led); g.add(box(1.5, 0.1, 1.6, M.dark, cx, 1.58, cz)); }
    g.userData.update = (dt, t, f2, tel, env) => { const soc = env.bess / BESS_CAP_MWH; const col = f2.out < -1 ? 0x38bdf8 : f2.out > 1 ? 0xffb020 : 0x1ee08a; leds.forEach((l, i) => { const on = soc * 6 > i; l.material.color.set(C(col)); l.material.emissive.set(C(col)); l.material.emissiveIntensity = on ? 1.1 : 0.06; }); };
    return g; }
  function geoModel(f) {
    const g = new THREE.Group(); g.add(box(3.4, 1.8, 2.6, M.conc, 0, 0.9, 0)); g.add(box(3.6, 0.25, 2.8, M.dark, 0, 1.9, 0));
    const lathe = new THREE.LatheGeometry([[1, 0], [0.82, 1.2], [0.7, 2.2], [0.78, 3.2]].map(p => new THREE.Vector2(p[0] * 0.8, p[1] * 0.9)), 22);
    const tw = new THREE.Mesh(lathe, mat(0xdedcd5, { roughness: 0.85, side: THREE.DoubleSide })); tw.position.set(2.4, 0.2, -0.8); tw.castShadow = !soft; g.add(tw);
    const tw2 = tw.clone(); tw2.position.set(2.4, 0.2, 1.4); g.add(tw2);
    for (let i = 0; i < 3; i++) g.add(cyl(0.1, 0.1, 3.2, M.steel, -2.2 + i * 0.35, 0.4, 1.9, 8)).rotation.z = Math.PI / 2;
    const steam = plume(80, 5, 0.9, puffMat(0xffffff, 1.7, 0.5)); steam.position.set(2.4, 3.3, -0.8); steam.userData.speed = 0.32; g.add(steam);
    const steam2 = plume(80, 5, 0.9, puffMat(0xffffff, 1.7, 0.5)); steam2.position.set(2.4, 3.3, 1.4); steam2.userData.speed = 0.28; g.add(steam2);
    g.userData.update = (dt, t, f2, tel, env) => { const on = f2.out > 1; stepPlume(steam, dt, t, on, env.wind * 0.06); stepPlume(steam2, dt, t, on, env.wind * 0.06); };
    return g; }
  const MODELS = { wind_turbine: windModel, solar_pv: solarModel, pumped_hydro: hydroModel, gas_peaker: gasModel, battery_bess: batteryModel, geothermal: geoModel };

  /* ---------- substation, pylons, power lines with energy packets ---------- */
  const sub = new THREE.Group(); sub.position.set(SUB[0], terrainHeight(SUB[0], SUB[1]), SUB[1]); scene.add(sub);
  sub.add(box(3.2, 0.2, 3.2, mat(0x6b6e73, { roughness: 1 }), 0, 0.1, 0, false));
  for (let i = 0; i < 3; i++) { sub.add(box(0.8, 0.9, 0.8, mat(0x7c8a99, { roughness: 0.4, metalness: 0.5 }), -1 + i, 0.65, -0.6)); sub.add(cyl(0.08, 0.08, 1.6, M.steel, -1 + i, 1.5, 0.6, 8)); }
  const subPos = new V3(SUB[0], sub.position.y + 1.7, SUB[1]);
  const lineGroup = new THREE.Group(); scene.add(lineGroup); const lines = new Map();
  const lineMat = new THREE.LineBasicMaterial({ color: 0xc7d2e0, transparent: true, opacity: 0.8 });
  const packetGeo = new THREE.SphereGeometry(0.16, 8, 6);
  function makeLine(id, from, to, sag) { const mid = from.clone().lerp(to, 0.5); mid.y -= sag; const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), lineMat); lineGroup.add(ln);
    const pk = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(packetGeo, new THREE.MeshBasicMaterial({ color: 0xffd23f })); lineGroup.add(m); pk.push({ m, u: i / 5 }); }
    lines.set(id, { curve, ln, pk, load: 0 }); }
  makeLine("city", subPos, new V3(CITY[0] - 3.6, 3.2, CITY[1] - 4), 0.5);
  function disposeLine(id) { const l = lines.get(id); if (!l) return; lineGroup.remove(l.ln); l.pk.forEach(p => lineGroup.remove(p.m)); lines.delete(id); }

  /* ---------- facility registry ---------- */
  const fgroup = new THREE.Group(); scene.add(fgroup); const reg = new Map();
  function addFacility(f, pop) { if (reg.has(f.id)) return; const g = MODELS[f.type](f); g.position.set(f.pos[0], f.pos[1], f.pos[2]); g.rotation.y = f.rot; g.userData.fid = f.id; g.traverse(o => { o.userData.fid = f.id; });
    const base = new V3(f.pos[0], f.pos[1] + 2.0, f.pos[2]);
    if (f.type === "pumped_hydro") { const pen = new THREE.Group(); const a = new V3(UPPER[0] + 2.2, 7.4, UPPER[1] + 1.2), b = new V3(f.pos[0], f.pos[1] + 2.6, f.pos[2]); const len = a.distanceTo(b); const pipe = cyl(0.3, 0.3, len, M.steel, 0, 0, 0, 12); pipe.position.copy(a.clone().lerp(b, 0.5)); pipe.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize()); scene.add(pipe); g.userData.pipe = { a, b, mesh: pipe };
      const dots = []; for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7dd3fc })); scene.add(d); dots.push({ d, u: i / 9 }); } g.userData.dots = dots; }
    fgroup.add(g); reg.set(f.id, { g, f, base }); makeLine(f.id, base.clone().add(new V3(0, 0.5, 0)), subPos.clone(), 0.8); if (pop) burst(base, C(CATALOG[f.type].color), 70, true);
    g.scale.setScalar(pop ? 0.01 : 1); g.userData.grow = pop ? 0 : 1; }
  function removeFacility(id) { const r = reg.get(id); if (!r) return; fgroup.remove(r.g); if (r.g.userData.pipe) { scene.remove(r.g.userData.pipe.mesh); r.g.userData.dots.forEach(d => scene.remove(d.d)); } reg.delete(id); disposeLine(id); }

  /* ---------- clouds ---------- */
  const clouds = []; const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.85, depthWrite: false });
  for (let i = 0; i < 9; i++) { const c = new THREE.Group(); for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 2.2, 10, 8), cloudMat); s.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.3) * 1.2, (Math.random() - 0.5) * 4); s.scale.y = 0.55; c.add(s); } c.position.set(-70 + Math.random() * 140, 26 + Math.random() * 8, -35 + Math.random() * 70); scene.add(c); clouds.push(c); }

  /* ---------- units ---------- */
  const drone = new THREE.Group(); drone.add(box(0.7, 0.18, 0.7, M.dark, 0, 0, 0)); [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([x, z]) => { drone.add(cyl(0.3, 0.3, 0.03, mat(0xdbeafe, { transparent: true, opacity: 0.6 }), x, 0.15, z, 14)); });
  const dLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x4ade80 })); dLight.position.y = -0.12; drone.add(dLight); scene.add(drone);
  const van = new THREE.Group(); van.add(box(1.4, 0.7, 0.8, mat(0xf59e0b, { roughness: 0.4 }), 0, 0.5, 0)); van.add(box(0.6, 0.45, 0.78, mat(0x1f2937), 0.55, 0.88, 0)); [[-0.45, 0.4], [0.45, 0.4], [-0.45, -0.4], [0.45, -0.4]].forEach(([x, z]) => van.add(cyl(0.2, 0.2, 0.15, M.dark, x, 0.2, z, 12)).rotation.x = Math.PI / 2); scene.add(van);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.9, 3, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })); beam.visible = false; scene.add(beam);

  /* ---------- selection ring and placement ghost ---------- */
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.0, 40), new THREE.MeshBasicMaterial({ color: 0xffd23f, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false })); ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 5; scene.add(ring);
  let ghost = null, ghostType = null, ghostOk = false;
  function setGhost(type) { if (ghost) { scene.remove(ghost); ghost = null; } ghostType = type; gring.visible = false; if (!type) return; ghost = MODELS[type]({ rot: 0 }); ghost.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; } o.castShadow = false; }); ghost.visible = false; scene.add(ghost); }
  const gring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.8, 40), new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false })); gring.rotation.x = -Math.PI / 2; gring.visible = false; gring.renderOrder = 5; scene.add(gring);

  /* ---------- bursts (particles + ring) ---------- */
  const bursts = [];
  function burst(pos, color, n = 50, withRing = false) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = []; for (let i = 0; i < n; i++) { p.set([pos.x, pos.y, pos.z], i * 3); const a = Math.random() * 6.283, b = Math.random() * 1.2 + 0.2, s = 2 + Math.random() * 5; v.push([Math.cos(a) * s, b * s, Math.sin(a) * s]); }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.5, map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; scene.add(pts);
    let rg = null; if (withRing) { rg = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.0, 36), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false })); rg.rotation.x = -Math.PI / 2; rg.position.set(pos.x, pos.y - 1.6, pos.z); scene.add(rg); }
    bursts.push({ pts, v, rg, age: 0 }); }

  /* ---------- camera: own damped orbit ---------- */
  const cur = { th: 0, ph: 1, r: 40, tg: new V3() }, goal = { th: 0, ph: 1, r: 40, tg: new V3() };
  function setView(p, t) { const pp = new V3(...p), tt = new V3(...t), d = pp.clone().sub(tt); goal.r = d.length(); goal.th = Math.atan2(d.x, d.z); goal.ph = Math.acos(Math.max(-1, Math.min(1, d.y / goal.r))); goal.tg.copy(tt); }
  setView(...PRESETS.overview); Object.assign(cur, { th: goal.th, ph: goal.ph, r: goal.r * 1.4 }); cur.tg.copy(goal.tg);
  let punchT = 0, userCam = false;
  const ptrs = new Map(); let travel = 0, lastPinch = 0, btn = 0, hover = { x: 0, y: 0 };
  cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); travel = 0; btn = e.button; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); } hooks.onUserCamera && hooks.onUserCamera(); });
  cv.addEventListener("pointermove", e => { const p = ptrs.get(e.pointerId); const r = cv.getBoundingClientRect(); hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (!p) { if (ghost) updateGhost(); return; } const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; travel += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); goal.r = Math.max(8, Math.min(95, goal.r * (lastPinch / Math.max(20, d)))); lastPinch = d; return; }
    if (btn === 2 || e.shiftKey) { const s = goal.r * 0.0016, right = new V3(Math.cos(goal.th), 0, -Math.sin(goal.th)); goal.tg.addScaledVector(right, -dx * s); goal.tg.addScaledVector(new V3(Math.sin(goal.th), 0, Math.cos(goal.th)), -dy * s); goal.tg.x = Math.max(-30, Math.min(30, goal.tg.x)); goal.tg.z = Math.max(-30, Math.min(30, goal.tg.z)); }
    else { goal.th -= dx * 0.0065; goal.ph = Math.max(0.22, Math.min(1.5, goal.ph - dy * 0.0055)); } });
  const up = e => { ptrs.delete(e.pointerId); lastPinch = 0; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("contextmenu", e => e.preventDefault());
  cv.addEventListener("wheel", e => { e.preventDefault(); goal.r = Math.max(8, Math.min(110, goal.r * (1 + Math.sign(e.deltaY) * 0.1))); hooks.onUserCamera && hooks.onUserCamera(); }, { passive: false });
  cv.addEventListener("keydown", e => { const k = e.key; if (k === "ArrowLeft") goal.th += 0.12; else if (k === "ArrowRight") goal.th -= 0.12; else if (k === "ArrowUp") goal.ph = Math.max(0.22, goal.ph - 0.08); else if (k === "ArrowDown") goal.ph = Math.min(1.5, goal.ph + 0.08); else if (k === "+" || k === "=") goal.r = Math.max(8, goal.r * 0.9); else if (k === "-") goal.r = Math.min(95, goal.r * 1.1); else return; e.preventDefault(); });

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(x, y) { const r = cv.getBoundingClientRect(); ndc.set(((x) / r.width) * 2 - 1, -((y) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray; }
  function groundPoint() { pickAt(hover.x, hover.y); const h = ray.intersectObject(terrain, false)[0]; return h ? h.point : null; }
  function updateGhost() { const p = groundPoint(); if (!p) { ghost.visible = false; gring.visible = false; return; } const v = hooks.checkSpot(ghostType, p.x, p.z); ghostOk = v.ok; ghost.visible = true; ghost.position.set(p.x, v.y, p.z); gring.visible = true; gring.position.set(p.x, v.y + 0.1, p.z); gring.material.color.set(v.ok ? 0x4ade80 : 0xf87171); hooks.onGhost && hooks.onGhost(v); }
  cv.addEventListener("click", e => { if (travel > 7) return; const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; hover = { x, y };
    if (ghostType) { const p = groundPoint(); if (!p) return; const v = hooks.checkSpot(ghostType, p.x, p.z); if (!v.ok) { hooks.onBadSpot && hooks.onBadSpot(v, p); return; } hooks.onPlace(ghostType, [p.x, v.y, p.z]); return; }
    pickAt(x, y); const objs = []; reg.forEach(rr => objs.push(rr.g)); const hit = ray.intersectObjects(objs, true)[0]; let id = null; if (hit) { let o = hit.object; while (o && !o.userData.fid) o = o.parent; id = o ? o.userData.fid : null; }
    hooks.onSelect && hooks.onSelect(id); });

  /* ---------- markers (screen positions for the HTML overlay) ---------- */
  const tmpV = new V3();
  function project(v) { tmpV.copy(v).project(cam); const r = cv.getBoundingClientRect(); return { x: (tmpV.x * 0.5 + 0.5) * r.width, y: (-tmpV.y * 0.5 + 0.5) * r.height, z: tmpV.z }; }

  /* ---------- per-frame update ---------- */
  const env = { sunAng: 0, wind: 8, bess: 60 }; let ctxTel = null, ctxS = null, t = 0, last = performance.now(), running = true, visible = true, raf = 0;
  const DAY = { top: new THREE.Color(0x3b82d9), bot: new THREE.Color(0xbfe0ff) }, DUSK = { top: new THREE.Color(0x3a3b7a), bot: new THREE.Color(0xff9a5c) }, NIGHT = { top: new THREE.Color(0x020617), bot: new THREE.Color(0x0e1a38) }, STORM = { top: new THREE.Color(0x3b4452), bot: new THREE.Color(0x7d8794) };
  function applyEnv() { const S = ctxS; if (!S || !S.tel) return; const tel = S.tel, tm = (S.t % 1440) / 1440, a = (tm - 0.25) * 2 * Math.PI, sy = Math.sin(a), day = Math.max(0, Math.min(1, sy * 2.2 + 0.3)), dusk = Math.max(0, 1 - Math.abs(sy) * 5) ;
    env.sunAng = Math.cos(a); env.wind = tel.wind; env.bess = S.bess;
    const sx = Math.cos(a) * 60, sy2 = Math.sin(a) * 60; sun.position.set(sx, Math.max(2, sy2 + 6), 18); sun.target.position.set(0, 0, 0); sun.intensity = 2.6 * day * (1 - 0.65 * tel.cloud); sun.color.setHSL(0.11 - 0.04 * dusk, 0.5 + 0.4 * dusk, 0.85 - 0.18 * dusk);
    moon.position.set(-sx, Math.max(8, -sy2 + 10), -16); moon.intensity = 0.95 * (1 - day); hemi.intensity = 0.3 + 0.45 * day; hemi.color.setHex(day > 0.3 ? 0xcfe4ff : 0x5b6cb0);
    sunSprite.position.set(sx * 3.4, sy2 * 3.4 + 20, 120 + 20); sunSprite.visible = sy > -0.12; sunSprite.material.opacity = Math.min(1, day + 0.3); moonSprite.position.set(-sx * 3.2, -sy2 * 3.2 + 30, -140); moonSprite.visible = sy < 0.15; moonSprite.material.opacity = 1 - day;
    const base = new THREE.Color(); const top = base.clone().copy(NIGHT.top).lerp(DAY.top, day).lerp(DUSK.top, dusk * 0.6); const bot = new THREE.Color().copy(NIGHT.bot).lerp(DAY.bot, day).lerp(DUSK.bot, dusk * 0.85);
    const st = Math.max(0, tel.cloud - 0.45) * 1.4 * (S.stormMode ? 1 : 0.3); top.lerp(STORM.top, st * day); bot.lerp(STORM.bot, st * day);
    skyU.top.value.copy(top); skyU.bot.value.copy(bot); scene.fog.color.copy(bot); scene.fog.density = 0.0075 + tel.cloud * 0.003; stars.material.opacity = Math.max(0, 1 - day * 1.6);
    cityMats.forEach(m => { m.emissiveIntensity = Math.max(0, 1 - day * 1.3) * (0.35 + 0.65 * (tel.demand / 330)); });
    cloudMat.opacity = 0.35 + tel.cloud * 0.55; cloudMat.color.setRGB(0.55 + 0.45 * day, 0.58 + 0.42 * day, 0.66 + 0.34 * day).convertSRGBToLinear(); }

  function frame(now) {
    raf = requestAnimationFrame(frame); if (!running || !visible) { last = now; return; }
    const dt = Math.min(0.06, (now - last) / 1000); last = now; t += dt; const S = ctxS; const tel = S && S.tel;
    cur.th += (goal.th - cur.th) * Math.min(1, dt * 7); cur.ph += (goal.ph - cur.ph) * Math.min(1, dt * 7); cur.r += (goal.r - cur.r) * Math.min(1, dt * 7); cur.tg.lerp(goal.tg, Math.min(1, dt * 7));
    if (!userCam && !reduced && ptrs.size === 0 && hooks.autoOrbit && hooks.autoOrbit()) goal.th += dt * 0.05;
    const fit = cam.aspect < 1.25 ? Math.min(1.8, 1.0 / cam.aspect) : 1, R = cur.r * fit; cam.position.set(cur.tg.x + R * Math.sin(cur.ph) * Math.sin(cur.th), cur.tg.y + R * Math.cos(cur.ph), cur.tg.z + R * Math.sin(cur.ph) * Math.cos(cur.ph > 0 ? cur.th : cur.th)); cam.lookAt(cur.tg);
    if (punchT > 0) { punchT = Math.max(0, punchT - dt * 3.2); cam.fov = 42 - Math.sin(punchT * Math.PI) * 6; } else cam.fov = 42; cam.updateProjectionMatrix();
    if (S && tel) {
      applyEnv();
      if (!soft && !reduced) { const p = seaG.attributes.position; for (let i = 0; i < p.count; i += 1) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Math.sin(x * 0.12 + t * 0.9) * 0.12 + Math.cos(z * 0.1 + t * 0.7) * 0.1); } p.needsUpdate = true; }
      const lvl = S.stored / HYDRO_CAP_MWH; upper.position.y += ((7.42 + lvl * 0.46) - upper.position.y) * Math.min(1, dt * 2);
      reg.forEach(r => { const f = S.facs.find(x => x.id === r.f.id); if (!f) return; r.f = f; const gg = r.g;
        if (gg.userData.grow < 1) { gg.userData.grow = Math.min(1, gg.userData.grow + dt * 1.8); const k = gg.userData.grow, s = 1 + Math.sin(k * Math.PI) * 0.18; gg.scale.setScalar(Math.max(0.01, k * (k < 1 ? s : 1))); }
        gg.userData.update && gg.userData.update(dt, t, f, tel, env);
        gg.traverse(o => { if (o.material && o.material.emissive && f.status === "broken" && o.userData.fid === f.id && !o.userData.dim) { o.userData.dim = 1; } });
        const L = lines.get(f.id); if (L) L.load = f.status === "broken" ? 0 : f.out / f.cap;
        if (gg.userData.dots) { const fl = tel.flow; gg.userData.dots.forEach(d => { d.u = (d.u + dt * (fl === 0 ? 0 : Math.sign(fl) * (0.25 + Math.abs(fl) / 90))) % 1; if (d.u < 0) d.u += 1; const pa = gg.userData.pipe; d.d.position.copy(pa.a).lerp(pa.b, d.u); d.d.visible = fl !== 0; d.d.material.color.set(fl < 0 ? 0x5eead4 : 0x7dd3fc); }); }
      });
      const cl = lines.get("city"); if (cl) cl.load = Math.min(1, tel.demand / 260);
      lines.forEach((L, id) => { const mag = Math.abs(L.load), dir = L.load >= 0 ? 1 : -1, toCity = id === "city"; L.pk.forEach(p => { p.u = (p.u + dt * (0.1 + mag * 0.55) * (toCity ? 1 : dir)) % 1; if (p.u < 0) p.u += 1; const pt = L.curve.getPoint(toCity ? p.u : (1 - p.u)); p.m.position.copy(pt); p.m.visible = mag > 0.03; p.m.scale.setScalar(0.6 + mag); p.m.material.color.set(L.load < 0 ? 0x38bdf8 : toCity ? 0xffe28a : 0xffd23f); }); });
      clouds.forEach((c, i) => { c.position.x += dt * (0.8 + tel.wind * 0.18); if (c.position.x > 90) c.position.x = -90; c.visible = true; c.children.forEach(s => { s.visible = (i / clouds.length) < (0.2 + tel.cloud * 0.9); }); });
      S.units.forEach(u => { const m = u.kind === "drone" ? drone : van; m.position.set(u.pos[0], u.kind === "van" ? terrainHeight(u.pos[0], u.pos[2]) : u.pos[1] + Math.sin(t * 3) * 0.08, u.pos[2]);
        if (u.kind === "van") { const tp2 = u.target || u.home; const d = new V3(tp2[0] - u.pos[0], 0, tp2[2] - u.pos[2]); if (d.length() > 0.3) m.rotation.y = Math.atan2(d.x, d.z) + Math.PI / 2; m.position.y = terrainHeight(u.pos[0], u.pos[2]) + 0.1; }
        else { drone.rotation.y += dt * 2; drone.children.forEach((c, i) => { if (i > 0 && i < 5) c.rotation.y += dt * 40; }); dLight.material.color.set(u.state === "servicing" ? 0xffd23f : u.state === "docked" ? 0x4ade80 : 0x38bdf8); }
        if (u.state === "servicing") { const tf = reg.get(u.fid); if (tf) { beam.visible = true; beam.position.set(tf.base.x, tf.base.y + 0.6, tf.base.z); beam.scale.set(1, 1, 1); beam.material.color.set(u.kind === "drone" ? 0x4ade80 : 0xffb020); } } });
      if (!S.units.some(u => u.state === "servicing")) beam.visible = false;
      if (S.sel) { const r = reg.get(S.sel); if (r) { ring.visible = true; ring.position.set(r.f.pos[0], r.f.pos[1] + 0.12, r.f.pos[2]); ring.scale.setScalar(1 + Math.sin(t * 2.4) * 0.05); } else ring.visible = false; } else ring.visible = false;
    }
    for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.age += dt; const p = b.pts.geometry.attributes.position.array; for (let k = 0; k < b.v.length; k++) { b.v[k][1] -= 9 * dt; p[k * 3] += b.v[k][0] * dt; p[k * 3 + 1] += b.v[k][1] * dt; p[k * 3 + 2] += b.v[k][2] * dt; } b.pts.geometry.attributes.position.needsUpdate = true; b.pts.material.opacity = Math.max(0, 1 - b.age / 1.4);
      if (b.rg) { b.rg.scale.setScalar(1 + b.age * 7); b.rg.material.opacity = Math.max(0, 0.9 - b.age / 1.2); } if (b.age > 1.5) { scene.remove(b.pts); if (b.rg) scene.remove(b.rg); bursts.splice(i, 1); } }
    renderer.render(scene, cam);
    if (hooks.onFrame) hooks.onFrame(project, reg, t);
  }

  function resize() { const w = container.clientWidth || 600, h = container.clientHeight || 400; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.01 }) : null; io && io.observe(container);
  raf = requestAnimationFrame(frame);

  return {
    THREE, sceneRef: scene, camera: cam,
    sync(S) { ctxS = S; const ids = new Set(S.facs.map(f => f.id)); S.facs.forEach(f => addFacility(f, false)); [...reg.keys()].forEach(id => { if (!ids.has(id)) removeFacility(id); }); },
    commission(f) { addFacility(f, true); this.punch(); },
    setState(S) { ctxS = S; }, setSelected(id) { if (ctxS) ctxS.sel = id; },
    setGhost, preset(n) { const p = PRESETS[n] || PRESETS.overview; setView(...p); userCam = false; },
    flyTo(pos, target) { setView(pos, target); }, focus(id) { const r = reg.get(id); if (!r) return; setView([r.f.pos[0] + 9, r.f.pos[1] + 7, r.f.pos[2] + 11], [r.f.pos[0], r.f.pos[1] + 1.5, r.f.pos[2]]); },
    punch() { if (!reduced) punchT = 1; }, burst: (v, c, n) => burst(new V3(...v), C(c || 0xffd23f), n || 60, true),
    facilityPos(id) { const r = reg.get(id); return r ? r.base : null; }, cityPos: () => new V3(CITY[0], 6, CITY[1]), subPos: () => subPos,
    project, pause(p) { running = !p; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io && io.disconnect(); try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {} cv.remove(); },
  };
}
