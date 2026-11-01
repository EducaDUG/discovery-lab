/* Pre-IG Stage 1 Spanish Internal Exam 4 revision: the three hyper-real 3D scenes.
   buildHero    - a rotating boutique carousel of real clothing photos with floating grammar words
   buildStreet  - the Demonstrative Street: items at close / medium / far distance on a lit street (este / ese / aquel)
   buildGlobe   - the Season Flip globe: real NASA Earth texture, tilt by month, Madrid / Mexico City / Buenos Aires pins
   Plain ES module on engine/revision-kit.js (make3D with real:true = ACES tone mapping, soft shadows, studio environment).
   Never write to the DOM every frame without a change check. */
import { rnd, clamp, make3D, glowTexture, labelSprite, reduced } from "../../../../../../engine/revision-kit.js?v=22";

const texCache = {};
function photoTex(THREE, file) {
  if (!texCache[file]) { const t = new THREE.TextureLoader().load("photos/" + file + ".jpg"); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; texCache[file] = t; }
  return texCache[file];
}
function noiseTex(THREE, base, spread, size = 256, repeat = [4, 12]) {
  const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) { const v = Math.floor(rnd(-spread, spread)); x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`; x.fillRect(rnd(0, size), rnd(0, size), 2, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t;
}
const C = (THREE, hex) => (THREE.Color.prototype.convertSRGBToLinear ? new THREE.Color(hex).convertSRGBToLinear() : new THREE.Color(hex));
function board(THREE, file, scale = 1) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.1), new THREE.MeshStandardMaterial({ color: C(THREE, 0x3a2a1c), roughness: 0.55 })); frame.castShadow = true; g.add(frame);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({ map: photoTex(THREE, file), roughness: 0.6, emissive: 0x111111 })); pic.position.z = 0.056; g.add(pic);
  const back = pic.clone(); back.rotation.y = Math.PI; back.position.z = -0.056; g.add(back);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.2, 10), new THREE.MeshStandardMaterial({ color: C(THREE, 0x2c2c34), roughness: 0.5, metalness: 0.6 })); post.position.y = -1.4; post.castShadow = true; g.add(post);
  g.scale.setScalar(scale); return g;
}

/* ---------------------------------------------------------------- hero: boutique carousel */
export function buildHero(host, files, words) {
  const S = make3D(host, { cam: [0, 2.6, 8.4], target: [0, 1.5, 0], fov: 45, auto: 0.22, bg: 0x0d1424, real: true, onFrame: (dt, t, S) => S.onFrameHook && S.onFrameHook(dt, t) });
  if (!S) return null;
  const THREE = S.THREE, scene = S.scene;
  scene.fog = new THREE.Fog(0x0d1424, 14, 34);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: C(THREE, 0x1c2540), roughness: 0.35, metalness: 0.3 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const rim = new THREE.Mesh(new THREE.RingGeometry(5.1, 5.25, 80), new THREE.MeshBasicMaterial({ color: 0xffc94d, side: THREE.DoubleSide })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.02; scene.add(rim);
  const ring = new THREE.Group(); scene.add(ring);
  files.forEach((f, i) => {
    const a = (i / files.length) * Math.PI * 2, b = board(THREE, f, 0.95);
    b.position.set(Math.sin(a) * 4.1, 2.2, Math.cos(a) * 4.1); b.rotation.y = a; ring.add(b);
  });
  const tilt = new THREE.Group(); scene.add(tilt);
  const sprites = words.map((w, i) => {
    const s = labelSprite(THREE, w, i % 2 ? "#ffd166" : "#7dffd0"); s.scale.set(2.1, 0.52, 1); tilt.add(s); s.userData = { a: (i / words.length) * Math.PI * 2, r: 2 + (i % 3) * 0.5, y: 3.4 + (i % 4) * 0.45, sp: 0.25 + (i % 3) * 0.08 }; return s;
  });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "255,201,77"), transparent: true, opacity: 0.55, depthWrite: false })); glow.scale.set(7, 7, 1); glow.position.y = 2.6; scene.add(glow);
  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 140 }, () => new THREE.Vector3(rnd(-8, 8), rnd(0, 7), rnd(-8, 8)))), new THREE.PointsMaterial({ size: 0.05, color: 0xffe9b0, transparent: true, opacity: 0.7 })); scene.add(dust);
  const spot = new THREE.SpotLight(0xfff1d0, 1.4, 30, 0.8, 0.6); spot.position.set(0, 12, 2); spot.castShadow = true; scene.add(spot);
  S.onFrameHook = (dt, t) => {
    if (!reduced()) ring.rotation.y -= dt * 0.18;
    sprites.forEach(s => { const u = s.userData, a = u.a + t * u.sp * (reduced() ? 0 : 1); s.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 1.2 + u.a) * 0.15, Math.sin(a) * u.r); });
    dust.rotation.y += dt * 0.02;
  };
  return S;
}

/* ---------------------------------------------------------------- lab: Demonstrative Street */
const ZONES = { close: { z: 0, s: 1, label: "AQUÍ" }, mid: { z: -6.5, s: 1.3, label: "AHÍ / ALLÍ" }, far: { z: -14.5, s: 1.7, label: "ALLÁ" } };
export function buildStreet(host) {
  const S = make3D(host, { cam: [0, 3.3, 7.2], target: [0, 1.3, -6], fov: 52, auto: 0, bg: 0x0b1630, real: true, onFrame: (dt, t, S) => S.onFrameHook && S.onFrameHook(dt, t), hint: "Drag sideways to look around the street." });
  if (!S) return null;
  const THREE = S.THREE, scene = S.scene;
  scene.fog = new THREE.Fog(0x0b1630, 14, 40);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 60), new THREE.MeshStandardMaterial({ map: noiseTex(THREE, "#2b2f3a", 40, 256, [3, 14]), roughness: 0.9 })); road.rotation.x = -Math.PI / 2; road.position.z = -12; road.receiveShadow = true; scene.add(road);
  [-1, 1].forEach(sd => { const p = new THREE.Mesh(new THREE.BoxGeometry(3, 0.18, 60), new THREE.MeshStandardMaterial({ map: noiseTex(THREE, "#7a7d86", 30, 256, [2, 14]), roughness: 0.85 })); p.position.set(sd * 6, 0.05, -12); p.receiveShadow = true; scene.add(p); });
  for (let i = 0; i < 12; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.4), new THREE.MeshBasicMaterial({ color: 0xf2f2e6 })); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.02, 4 - i * 3.6); scene.add(d); }
  Object.keys(ZONES).forEach((k, i) => {
    const Z = ZONES[k], col = [0x3fd9a0, 0xffc94d, 0xff7a8c][i];
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.5 * Z.s, 1.7 * Z.s, 48), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.03, Z.z); scene.add(ring);
    const sign = labelSprite(THREE, Z.label, "#ffffff"); sign.scale.set(2.4 * Math.sqrt(Z.s), 0.6 * Math.sqrt(Z.s), 1); sign.position.set(0, 0.45, Z.z + 1.2); scene.add(sign);
  });
  const me = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.9, 14), new THREE.MeshStandardMaterial({ color: C(THREE, 0x2f7dd1), roughness: 0.5 })); body.position.y = 0.55; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), new THREE.MeshStandardMaterial({ color: C(THREE, 0xf0c9a0), roughness: 0.6 })); head.position.y = 1.28; head.castShadow = true; me.add(body, head);
  const meTag = labelSprite(THREE, "YO", "#ffd166"); meTag.position.y = 1.9; meTag.scale.set(1.1, 0.28, 1); me.add(meTag); me.position.set(0, 0, 3.6); scene.add(me);
  [-1, 1].forEach(sd => [2, -5, -12, -19].forEach(z => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.2, 10), new THREE.MeshStandardMaterial({ color: C(THREE, 0x22262e), roughness: 0.5, metalness: 0.6 })); pole.position.set(sd * 4.6, 2.1, z); pole.castShadow = true; scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffe3a0 })); bulb.position.set(sd * 4.6, 4.3, z); scene.add(bulb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "255,214,140"), transparent: true, opacity: 0.32, depthWrite: false })); halo.scale.set(2.0, 2.0, 1); halo.position.copy(bulb.position); scene.add(halo);
  }));
  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 160 }, () => new THREE.Vector3(rnd(-8, 8), rnd(0, 6), rnd(-24, 4)))), new THREE.PointsMaterial({ size: 0.05, color: 0xfff2c4, transparent: true, opacity: 0.65 })); scene.add(dust);
  const items = new THREE.Group(); scene.add(items);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 14), new THREE.MeshBasicMaterial({ color: 0xffc94d })); arrow.rotation.x = Math.PI; scene.add(arrow); arrow.visible = false;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "255,201,77"), transparent: true, opacity: 0.9, depthWrite: false })); scene.add(halo); halo.visible = false;
  let pops = [], tgt = null;
  S.onFrameHook = (dt, t) => {
    pops = pops.filter(p => { p.t += dt * 3; const k = Math.min(1, p.t), e = 1 - Math.pow(1 - k, 3); p.g.scale.setScalar(p.s * e); return k < 1; });
    if (tgt) { arrow.visible = halo.visible = true; arrow.position.set(tgt.x, tgt.y + 1.9 * tgt.s + Math.sin(t * 3) * 0.15, tgt.z); halo.position.set(tgt.x, tgt.y + 0.6 * tgt.s, tgt.z - 0.1); halo.scale.setScalar(3.6 * tgt.s * (1 + Math.sin(t * 2.4) * 0.06)); }
    else arrow.visible = halo.visible = false;
    me.position.y = Math.sin(t * 2) * 0.04; dust.rotation.y += dt * 0.01;
  };
  /* list: [{ file, zone, plural, side, target }] */
  S.setScene = list => {
    while (items.children.length) items.remove(items.children[0]);
    pops = []; tgt = null;
    list.forEach(it => {
      const Z = ZONES[it.zone], n = it.plural ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const g = board(THREE, it.file, Z.s), dx = it.side * 2.6 * Math.sqrt(Z.s) + (n === 2 ? (k - 0.5) * 1.9 * Z.s : 0);
        g.position.set(dx, 2.0 * Z.s - 0.4, Z.z); g.rotation.y = -it.side * 0.12; g.scale.setScalar(0.01); items.add(g); pops.push({ g, s: Z.s, t: -Math.random() * 0.3 });
        if (it.target && k === 0) tgt = { x: n === 2 ? it.side * 2.6 * Math.sqrt(Z.s) : dx, y: 2.0 * Z.s - 0.4, z: Z.z, s: Z.s };
      }
    });
  };
  return S;
}

/* ---------------------------------------------------------------- lab: Season Flip globe */
const CITIES = { madrid: { lat: 40.4, lon: -3.7, name: "Madrid" }, mexico: { lat: 19.4, lon: -99.1, name: "Ciudad de México" }, bsas: { lat: -34.6, lon: -58.4, name: "Buenos Aires" } };
const toVec = (THREE, lat, lon, r) => { const a = lat * Math.PI / 180, o = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.cos(o) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(o) * r); };
export function buildGlobe(host, onPick) {
  const S = make3D(host, { cam: [0, 0.5, 9.2], target: [0, 0, 0], fov: 42, auto: 0, bg: 0x050a18, real: true, onFrame: (dt, t, S) => S.onFrameHook && S.onFrameHook(dt, t), hint: "Drag to turn the globe. Tap a pin, or use the buttons.", onPick: rc => { const hit = rc.intersectObjects(pinMeshes); if (hit.length && onPick) onPick(hit[0].object.userData.key); } });
  if (!S) return null;
  const THREE = S.THREE, scene = S.scene;
  const stars = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 500 }, () => { const v = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(30, 60)); return v; })), new THREE.PointsMaterial({ size: 0.12, color: 0xffffff, transparent: true, opacity: 0.85 })); scene.add(stars);
  const tiltG = new THREE.Group(); scene.add(tiltG);
  const earthTex = new THREE.TextureLoader().load("photos/earth.jpg"); if (THREE.sRGBEncoding) earthTex.encoding = THREE.sRGBEncoding;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 48), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.85, metalness: 0 })); earth.castShadow = true; tiltG.add(earth);
  const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "110,190,255"), transparent: true, opacity: 0.55, depthWrite: false })); atm.scale.set(6.2, 6.2, 1); scene.add(atm);
  const eq = new THREE.Mesh(new THREE.RingGeometry(2.03, 2.05, 90), new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })); eq.rotation.x = Math.PI / 2; earth.add(eq);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 5.4, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })); earth.add(axis);
  const sunKey = new THREE.DirectionalLight(0xfff3dc, 1.5); sunKey.position.set(5, 2, 7); scene.add(sunKey);
  const pinMeshes = [];
  Object.keys(CITIES).forEach(k => {
    const c = CITIES[k], p = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff3b5c })); p.position.copy(toVec(THREE, c.lat, c.lon, 2.05)); p.userData.key = k; earth.add(p); pinMeshes.push(p);
    const s = labelSprite(THREE, c.name, "#ffffff"); s.scale.set(1.5, 0.38, 1); s.position.copy(toVec(THREE, c.lat, c.lon, 2.45)); earth.add(s);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), new THREE.MeshBasicMaterial({ color: 0xff3b5c })); stem.position.copy(toVec(THREE, c.lat, c.lon, 2.2)); stem.lookAt(new THREE.Vector3(0, 0, 0)); stem.rotateX(Math.PI / 2); earth.add(stem);
  });
  const season = { n: labelSprite(THREE, "", "#7dffd0"), s: labelSprite(THREE, "", "#ffd166") };
  season.n.position.set(0, 3.1, 0); season.s.position.set(0, -3.1, 0); season.n.scale.set(2.6, 0.65, 1); season.s.scale.set(2.6, 0.65, 1); scene.add(season.n, season.s);
  let spin = -Math.PI / 2 - (-3.7 * Math.PI / 180), spinTo = null, tiltTo = 0, tilt = 0, auto = true;
  /* month 0..11 -> sun declination (about +23.4 in June, -23.4 in December); the globe tips toward the viewer by that amount */
  S.setMonth = (m, labels) => { const lam = 2 * Math.PI * (m - 5.7) / 12; tiltTo = Math.sin(23.44 * Math.PI / 180) * Math.cos(lam); tiltTo = Math.asin(tiltTo); S._decl = tiltTo; S._labels = labels; };
  S.faceCity = k => { const c = CITIES[k]; spinTo = -Math.PI / 2 - c.lon * Math.PI / 180; auto = false; };
  S.autoSpin = on => { auto = on; if (on) spinTo = null; };
  S.setMonth(5);
  let lastN = "", lastS = "";
  S.onFrameHook = (dt, t) => {
    if (spinTo != null) { let d = spinTo - spin; d = Math.atan2(Math.sin(d), Math.cos(d)); spin += d * Math.min(1, dt * 3); if (Math.abs(d) < 0.003) spinTo = null; }
    else if (auto && !reduced()) spin += dt * 0.25;
    tilt += (tiltTo - tilt) * Math.min(1, dt * 3);
    earth.rotation.y = spin; tiltG.rotation.x = tilt - 0.0; tiltG.rotation.z = 0.41;
    const n = tilt > 0.05 ? (S._labels && S._labels.summer) : tilt < -0.05 ? (S._labels && S._labels.winter) : (S._labels && S._labels.mild);
    const s2 = tilt > 0.05 ? (S._labels && S._labels.winter) : tilt < -0.05 ? (S._labels && S._labels.summer) : (S._labels && S._labels.mild);
    if (n != null && n !== lastN) { lastN = n; relabel(season.n, "N · " + n, "#7dffd0"); }
    if (s2 != null && s2 !== lastS) { lastS = s2; relabel(season.s, "S · " + s2, "#ffd166"); }
    atm.material.opacity = 0.5 + Math.sin(t) * 0.04;
    pinMeshes.forEach((p, i) => p.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.15));
  };
  function relabel(spr, text, color) { const nw = labelSprite(THREE, text, color); spr.material.map.dispose(); spr.material.map = nw.material.map; spr.material.needsUpdate = true; }
  return S;
}
