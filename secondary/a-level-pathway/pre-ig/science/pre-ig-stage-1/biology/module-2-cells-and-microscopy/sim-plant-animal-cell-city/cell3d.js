/* Cell City - hyper-real procedural 3D animal and plant cell (local to this activity).
   Scenes only READ game state. Every organelle is a pickable group carrying userData.key. */
import { T, C, rng, std, mesh, glowSprite, noiseTex, canvasTex, reduced, clamp, lerp } from "./kit.js?v=1";
import { ORG } from "./data.js?v=1";

const SOLID = new Set(["nucleus", "mito", "ribosome", "chloroplast", "wall", "vacuole"]);
const soft = (color, op, ei = .35) => new T.MeshStandardMaterial({ color: C(color), transparent: true, opacity: op, roughness: .7, metalness: 0, side: T.DoubleSide, depthWrite: false, emissive: C(color), emissiveIntensity: ei });
const phys = (color, op, extra = {}) => new T.MeshPhysicalMaterial(Object.assign({ color: C(color), transparent: true, opacity: op, roughness: .22, metalness: 0, clearcoat: 1, clearcoatRoughness: .12, side: T.DoubleSide, depthWrite: false, emissive: C(color), emissiveIntensity: 0 }, extra));

/* ---------- organelle models ---------- */
export function makeNucleus() {
  const g = new T.Group();
  const bump = noiseTex("#808080", .5, 1800, [2, 1], 128, 4);
  g.add(mesh(new T.SphereGeometry(.64, 40, 28), phys(ORG.nucleus.color, .5, { bumpMap: bump, bumpScale: .03, emissiveIntensity: .05 }), 0, 0, 0, false));
  g.add(mesh(new T.SphereGeometry(.23, 24, 18), std(0x2b1f86, .5, 0, { emissive: C(0x2b1f86), emissiveIntensity: .15 }), -.14, .06, .1));
  const knot = mesh(new T.TorusKnotGeometry(.3, .035, 120, 8, 2, 3), std(0xe8e2ff, .35, .1, { emissive: C(0x9d90ff), emissiveIntensity: .25 }), .1, -.05, -.06); g.add(knot);
  const r = rng(3); const pm = std(0xe6e0ff, .4);
  for (let i = 0; i < 26; i++) { const a = r() * 6.283, b = Math.acos(2 * r() - 1); const p = mesh(new T.SphereGeometry(.035, 8, 6), pm, .66 * Math.sin(b) * Math.cos(a), .66 * Math.cos(b), .66 * Math.sin(b) * Math.sin(a), false); g.add(p); }
  g.userData.spin = .25; return g;
}
export function makeMito(seed = 1) {
  const g = new T.Group(), r = rng(seed * 17);
  const outer = mesh(new T.SphereGeometry(.4, 28, 20), phys(ORG.mito.color, .62, { roughness: .3, emissiveIntensity: .08 }), 0, 0, 0, false); outer.scale.set(1.5, .72, .72); g.add(outer);
  const cm = std(0x8a2c0e, .55, 0, { emissive: C(0xff5a1e), emissiveIntensity: .18 });
  for (let i = 0; i < 5; i++) { const d = mesh(new T.CylinderGeometry(.2, .2, .03, 16), cm, -.38 + i * .19, (i % 2 ? .06 : -.06), 0, false); d.rotation.z = Math.PI / 2; d.scale.set(1, 1, 1); g.add(d); }
  g.rotation.set(r() * 3, r() * 3, r() * 3); g.userData.seed = seed; return g;
}
export function makeChloro(seed = 1) {
  const g = new T.Group(), r = rng(seed * 29);
  const outer = mesh(new T.SphereGeometry(.4, 28, 20), phys(ORG.chloroplast.color, .62, { roughness: .3, emissiveIntensity: .12 }), 0, 0, 0, false); outer.scale.set(1.3, .62, .9); g.add(outer);
  const gm = std(0x137a2c, .5, 0, { emissive: C(0x1fd24a), emissiveIntensity: .22 });
  [[-.28, 0], [.0, .04], [.28, -.03]].forEach(([x, z]) => { for (let i = 0; i < 4; i++) { const d = mesh(new T.CylinderGeometry(.11, .11, .028, 14), gm, x, -.1 + i * .07, z, false); g.add(d); } });
  g.rotation.set(r() * .6, r() * 6, r() * .6); g.userData.seed = seed; return g;
}
export function makeRibosomes(seed = 1) {
  const g = new T.Group(), r = rng(seed * 41), m = std(0x38c6c6, .4, .1, { emissive: C(0x2fe0d8), emissiveIntensity: .35 });
  for (let i = 0; i < 12; i++) g.add(mesh(new T.SphereGeometry(.05 + r() * .03, 10, 8), m, (r() - .5) * .5, (r() - .5) * .5, (r() - .5) * .5, false));
  const proxy = new T.Mesh(new T.SphereGeometry(.36, 8, 6), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); g.add(proxy); g.userData.jitter = true; return g;
}

/* ---------- the cell ---------- */
export function buildCell(st, kind, o = {}) {
  const plant = kind === "plant", scene = st.scene, G = new T.Group(); scene.add(G);
  const parts = {}, all = [], r = rng(plant ? 12 : 5);
  const reg = (key, obj, hide) => { (parts[key] = parts[key] || []).push(obj); obj.userData.key = key; obj.traverse(m => { if (m.isMesh) { m.userData.key = key; if (m.material && m.material.emissive) { m.userData.ei0 = m.material.emissiveIntensity; m.userData.e0 = m.material.emissive.clone(); } } }); if (hide) obj.visible = false; G.add(obj); return obj; };

  /* shells */
  let inside; /* test: is a point inside the usable cytoplasm? */
  if (!plant) {
    const sc = [1.15, .9, 1];
    const mem = mesh(new T.SphereGeometry(3, 64, 44), phys("#ff9bbf", .2, { bumpMap: noiseTex("#808080", .6, 2400, [3, 2], 128, 9), bumpScale: .02 }), 0, 0, 0, false); mem.scale.set(...sc); mem.userData.s0 = mem.scale.clone(); reg("membrane", mem, o.empty);
    const jel = mesh(new T.SphereGeometry(2.55, 48, 32), phys("#ffd9a0", .14), 0, 0, 0, false); jel.scale.set(...sc); jel.userData.s0 = jel.scale.clone(); reg("cytoplasm", jel, o.empty);
    inside = (x, y, z, m = 0) => (x / (2.3 * sc[0] - m)) ** 2 + (y / (2.3 * sc[1] - m)) ** 2 + (z / (2.3 * sc[2] - m)) ** 2 < 1;
  } else {
    const W = 3.5, H = 2.0, D = 2.3;
    const mem = mesh(new T.BoxGeometry(2 * W - .3, 2 * H - .3, 2 * D - .3), soft("#ff9bbf", .10, 1), 0, 0, 0, false); mem.userData.s0 = mem.scale.clone(); reg("membrane", mem, o.empty);
    const jel = mesh(new T.BoxGeometry(2 * W - 1.0, 2 * H - 1.0, 2 * D - 1.0), soft("#ffd9a0", .08, 1), 0, 0, 0, false); jel.userData.s0 = jel.scale.clone(); reg("cytoplasm", jel, o.empty);
    /* thick cellulose wall = 12 edge bars + faint faces */
    const wallG = new T.Group(), wm = std(0xb7dc5d, .6, 0, { map: noiseTex("#b7dc5d", .35, 1800, [2, 2], 128, 6), emissive: C(0x6fa31e), emissiveIntensity: .08 });
    const t = .26;
    [[0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1]].forEach(([_, sy, sz]) => wallG.add(mesh(new T.BoxGeometry(2 * W + t, t, t), wm, 0, sy * H, sz * D)));
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => wallG.add(mesh(new T.BoxGeometry(t, 2 * H + t, t), wm, sx * W, 0, sz * D)));
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sy]) => wallG.add(mesh(new T.BoxGeometry(t, t, 2 * D + t), wm, sx * W, sy * H, 0)));
    const face = mesh(new T.BoxGeometry(2 * W, 2 * H, 2 * D), soft("#b7dc5d", .09, 1), 0, 0, 0, false); face.userData.s0 = face.scale.clone(); wallG.add(face);
    reg("wall", wallG, o.empty); face.userData.key = "wallface";
    inside = (x, y, z, m = 0) => Math.abs(x) < W - .75 - m && Math.abs(y) < H - .7 - m && Math.abs(z) < D - .75 - m;
    /* permanent vacuole */
    const vac = mesh(new T.SphereGeometry(1, 40, 28), phys("#5aa9ff", .5, { roughness: .12, emissiveIntensity: .1, bumpMap: noiseTex("#808080", .3, 1200, [2, 1], 128, 2), bumpScale: .015 }), .2, 0, 0, false); vac.scale.set(2.2, 1.15, 1.3); vac.userData.s0 = vac.scale.clone(); reg("vacuole", vac, o.empty);
  }
  const vacTest = (x, y, z) => plant && ((x - .2) / 2.4) ** 2 + (y / 1.3) ** 2 + (z / 1.5) ** 2 < 1;

  /* nucleus */
  const nuc = makeNucleus(); nuc.position.set(plant ? -2.35 : .45, plant ? .55 : .1, plant ? .5 : 0); nuc.userData.home = nuc.position.clone(); reg("nucleus", nuc, o.empty);

  /* scatter helper */
  const placed = [nuc.position.clone()];
  const spot = (minD, tries = 80) => {
    for (let i = 0; i < tries; i++) {
      const x = (r() - .5) * 7, y = (r() - .5) * 4, z = (r() - .5) * 4.6;
      if (!inside(x, y, z, .35) || vacTest(x, y, z)) continue;
      const p = new T.Vector3(x, y, z); if (placed.every(q => q.distanceTo(p) > minD)) { placed.push(p); return p; }
    }
    return new T.Vector3((r() - .5) * 2, (r() - .5), (r() - .5)); };
  const dm = o.dense ? .7 : 1;
  const nM = o.mitoCount || (plant ? 6 : 8), nC = o.chloroCount || 12, nR = plant ? 7 : 8;
  for (let i = 0; i < nM; i++) { const m = makeMito(i + 1), p = spot(1.05 * dm); m.position.copy(p); m.userData.home = p.clone(); reg("mito", m, o.empty); }
  for (let i = 0; i < nR; i++) { const m = makeRibosomes(i + 2), p = spot(.8 * dm); m.position.copy(p); m.userData.home = p.clone(); reg("ribosome", m, o.empty); }
  if (plant) for (let i = 0; i < nC; i++) { const m = makeChloro(i + 1), p = spot(.95 * dm); m.position.copy(p); m.userData.home = p.clone(); reg("chloroplast", m, o.empty); }

  /* ambient dressing: cytoplasm specks that drift, and out-of-focus bokeh outside */
  const nS = 140, sp = new Float32Array(nS * 3), sb = [];
  for (let i = 0; i < nS; i++) { let x, y, z, k = 0; do { x = (r() - .5) * 7; y = (r() - .5) * 4; z = (r() - .5) * 4.6; k++; } while ((!inside(x, y, z, .3) || vacTest(x, y, z)) && k < 30); sp.set([x, y, z], i * 3); sb.push([x, y, z, r() * 6]); }
  const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(sp, 3));
  const specks = new T.Points(sg, new T.PointsMaterial({ color: C(0xfff0c8), size: .05, transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending })); G.add(specks);
  const bk = []; for (let i = 0; i < 22; i++) { const s = glowSprite(i % 2 ? 0x2aa8c8 : 0x7a6bff, 2 + r() * 3); s.material.opacity = .13; s.position.set((r() - .5) * 26, (r() - .5) * 12, -7 - r() * 8); scene.add(s); bk.push(s); }
  scene.background = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0b2a3a"); gr.addColorStop(1, "#04121c"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const rim = new T.PointLight(C(0x4de3ff), 1.1, 30); rim.position.set(-6, 3, -6); scene.add(rim);
  const core = new T.PointLight(C(plant ? 0xd9ffb0 : 0xffd9b0), .9, 12); core.position.set(0, 0, 0); scene.add(core);

  /* pick: solid organelle first, then cytoplasm, then membrane rim */
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const visibleChain = o => { for (let n = o; n; n = n.parent) if (n.visible === false) return false; return true; };
  function pick(cx, cy) {
    const rc = st.canvas.getBoundingClientRect(); ndc.set((cx - rc.left) / rc.width * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, st.camera);
    const hits = ray.intersectObject(G, true); let cyto = false, mem = false;
    for (const h of hits) { if (!visibleChain(h.object)) continue; const k = h.object.userData.key; if (!k || k === "wallface") continue; if (SOLID.has(k)) return k; if (k === "cytoplasm") cyto = true; else if (k === "membrane") mem = true; }
    return cyto ? "cytoplasm" : mem ? "membrane" : null;
  }

  /* highlight (emissive pulse) */
  const fx = { k: 0, key: null };
  const meshesOf = key => { const a = []; (parts[key] || []).forEach(p => p.traverse(m => { if (m.isMesh && m.material && m.material.emissive) a.push(m); })); return a; };
  function pulse(key) {
    fx.key = key; fx.k = 0; st.tween(fx, { k: 1 }, .22, { done: () => st.tween(fx, { k: 0 }, .9, { done: () => { meshesOf(key).forEach(m => { m.material.emissiveIntensity = m.userData.ei0; m.material.emissive.copy(m.userData.e0); }); fx.key = null; } }) });
  }
  const col = new T.Color();
  st.onFrame.push((dt, t) => {
    if (fx.key) { col.copy(C(ORG[fx.key].color)); meshesOf(fx.key).forEach(m => { m.material.emissive.copy(col); m.material.emissiveIntensity = m.userData.ei0 + fx.k * 1.4; }); }
    if (reduced()) return;
    Object.values(parts).forEach(arr => arr.forEach(p => {
      const h = p.userData.home; if (h && p.visible) { p.position.y = h.y + Math.sin(t * .9 + (p.userData.seed || 1) * 1.7) * .06; p.position.x = h.x + Math.cos(t * .6 + (p.userData.seed || 1)) * .05; }
      if (p.userData.spin) p.rotation.y += dt * p.userData.spin;
      if (p.userData.jitter && p.visible) p.rotation.y += dt * .6;
    }));
    const a = sp, n = sg.attributes.position; for (let i = 0; i < nS; i++) { const b = sb[i]; a[i * 3] = b[0] + Math.sin(t * .5 + b[3]) * .12; a[i * 3 + 1] = b[1] + Math.cos(t * .4 + b[3]) * .12; } n.needsUpdate = true;
    bk.forEach((s, i) => { s.position.x += Math.sin(t * .2 + i) * dt * .15; });
  });

  /* build mode: drop a part in */
  function install(key, burstCol) {
    (parts[key] || []).forEach(obj => {
      if (obj.visible) return; obj.visible = true; const shell = !!obj.userData.s0 || obj.userData.key === "wall";
      const s0 = obj.userData.s0 ? obj.userData.s0.clone() : new T.Vector3(1, 1, 1);
      const home = obj.userData.home ? obj.userData.home.clone() : null;
      obj.scale.copy(s0).multiplyScalar(.25);
      if (home) { obj.position.y = home.y + 3.2; st.tween(obj.position, { y: home.y }, .8, { ease: k => 1 - Math.pow(1 - k, 3) }); }
      st.tween(obj.scale, { x: s0.x, y: s0.y, z: s0.z }, .8, { done: () => { if (home) st.burst(obj.position.clone(), burstCol || C(ORG[key].color).getHex(), 18, 1.6, .1); } });
      if (!home && shell) st.burst(new T.Vector3(0, 0, 0), C(ORG[key].color).getHex(), 24, 2.6, .12);
    });
  }
  const setCount = (key, n) => (parts[key] || []).forEach((p, i) => { const on = i < n; if (on && !p.visible) { p.visible = true; p.scale.setScalar(.2); st.tween(p.scale, { x: 1, y: 1, z: 1 }, .45); } else if (!on) p.visible = false; });
  const centerOf = key => { const p = (parts[key] || []).find(x => x.visible) || (parts[key] || [])[0]; if (!p) return [0, 0, 0]; if (key === "membrane" || key === "cytoplasm" || key === "wall") return [0, 0, 0]; const v = new T.Vector3(); p.getWorldPosition(v); return [v.x, v.y, v.z]; };

  return {
    kind, group: G, parts, pick, pulse, install, setCount, centerOf, inside,
    dispose() { scene.remove(G); bk.forEach(s => scene.remove(s)); scene.remove(rim); scene.remove(core); },
  };
}
