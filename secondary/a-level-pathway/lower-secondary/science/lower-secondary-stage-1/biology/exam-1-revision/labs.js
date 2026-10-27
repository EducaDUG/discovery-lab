/* Stage 1 Biology Exam 1 revision: hyper-real 3D hero (microbes under a microscope) and four live labs
   (Yeast Balloon Lab, Germination Lab, Pollination Lab, Heart Lab). Plain ES modules on engine/revision-kit.js
   (make3D with real:true = ACES tone mapping, soft shadows, studio environment). Never write DOM text every frame without a change check. */
import { $, $$, el, rnd, clamp, popIt, burstOn, T, make3D, glowTexture, labelSprite, mat, reduced } from "../../../../../../../engine/revision-kit.js?v=22";

const BG = 0x111a2a;
const setHTML = (e, v) => { if (e.dataset.h !== v) { e.dataset.h = v; e.innerHTML = v; } };
const setText = (e, v) => { if (e.textContent !== v) e.textContent = v; };
const lerp = (a, b, t) => a + (b - a) * t;
function floor(THREE, scene, y = -0.6, col = 0x090d16) {
  const fm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.95 }); fm.envMapIntensity = 0.12;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), fm); f.rotation.x = -Math.PI / 2; f.position.y = y; f.receiveShadow = true; scene.add(f);
}
function dust(THREE, scene, n = 100, box = [8, 6, 6], y0 = 0) {
  const d = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: n }, () => new THREE.Vector3(rnd(-box[0], box[0]), y0 + rnd(0, box[1]), rnd(-box[2], box[2])))), new THREE.PointsMaterial({ size: 0.06, color: 0x9fe7ff, map: glowTexture(THREE), transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(d); return d;
}
const noStage = (info, S) => { if (!S) { if (info) info.innerHTML = `<b>${T("3D view is not available on this device. Everything else on the page still works.")}</b>`; return true; } return false; };

/* ---------------------------------------------------------------- microbe builders (hero) */
function bacterium(THREE, col) {
  const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: new THREE.Color(col).multiplyScalar(0.12) });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 18), m); const a = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), m), b = a.clone(); a.position.y = 0.45; b.position.y = -0.45; g.add(body, a, b);
  const fm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
  for (let i = 0; i < 3; i++) { const pts = Array.from({ length: 8 }, (_, k) => new THREE.Vector3(Math.sin(k * 0.9 + i) * 0.12, -0.7 - k * 0.22, Math.cos(k * 0.9 + i) * 0.12)); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018, 5), fm)); }
  return g;
}
function virus(THREE) {
  const g = new THREE.Group(), core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), new THREE.MeshPhysicalMaterial({ color: 0xd04ea8, roughness: 0.35, clearcoat: 0.7, emissive: 0x3a0a2c, flatShading: true })); g.add(core);
  const sp = new THREE.MeshStandardMaterial({ color: 0xff8fd8, roughness: 0.4, emissive: 0x401030 });
  core.geometry.vertices ? core.geometry.vertices.forEach(v => { const s = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), sp); const d = v.clone().normalize(); s.position.copy(d.clone().multiplyScalar(0.44)); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); g.add(s); }) : null;
  if (!core.geometry.vertices) { const p = core.geometry.attributes.position; const seen = new Set(); for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)); const k = v.toArray().map(x => x.toFixed(2)).join(); if (seen.has(k)) continue; seen.add(k); const d = v.clone().normalize(); const s = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), sp); s.position.copy(d.multiplyScalar(0.44)); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); g.add(s); } }
  return g;
}
function yeast(THREE) {
  const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ color: 0xe8d6a6, roughness: 0.5, clearcoat: 0.4, emissive: 0x2a2010 });
  const a = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), m), b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), m); b.position.set(0.42, 0.25, 0); g.add(a, b);
  const n = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), new THREE.MeshStandardMaterial({ color: 0xb7955a, roughness: 0.6 })); n.position.set(-0.08, -0.04, 0.28); g.add(n);
  return g;
}

/* ================================================================ HERO */
export function buildHero() {
  const host = $("#heroStage"); if (!host) return;
  const S = make3D(host, { cam: [0, 1.8, 9], target: [0, 0, 0], auto: 0.15, bg: BG, real: true, hint: "Drag sideways to turn the view" });
  if (!S) return; const THREE = S.THREE; S.scene.fog = new THREE.Fog(BG, 12, 30);
  const items = [];
  const kinds = [() => bacterium(THREE, 0x35c9a1), () => bacterium(THREE, 0x6aa8ff), () => virus(THREE), () => yeast(THREE)];
  for (let i = 0; i < 26; i++) { const o = kinds[i % 4](); o.position.set(rnd(-5, 5), rnd(-2.2, 3.2), rnd(-3.5, 2.5)); o.rotation.set(rnd(0, 6), rnd(0, 6), rnd(0, 6)); const s = (i % 4 === 2 ? 1.1 : 1) * rnd(0.8, 1.4); o.scale.setScalar(s); o.traverse(c => { if (c.isMesh) c.castShadow = true; }); S.scene.add(o); items.push({ o, p: o.position.clone(), r: rnd(0.1, 0.4), ph: rnd(0, 6), sp: rnd(0.2, 0.6) }); }
  floor(THREE, S.scene, -3); const d = dust(THREE, S.scene, 160, [9, 7, 6], -3);
  const t0 = performance.now(); (function loop() { requestAnimationFrame(loop); const t = (performance.now() - t0) / 1000; if (reduced()) return; items.forEach(it => { it.o.position.set(it.p.x + Math.sin(t * it.sp + it.ph) * 0.5, it.p.y + Math.cos(t * it.sp * 0.8 + it.ph) * 0.4, it.p.z); it.o.rotation.y += it.r * 0.01; it.o.rotation.x += it.r * 0.004; }); d.rotation.y = t * 0.02; })();
}

/* ================================================================ LAB 1: YEAST BALLOON LAB */
const rateAt = T_ => T_ <= 2 ? 0.02 : T_ < 38 ? lerp(0.05, 1, (T_ - 2) / 36) : T_ < 62 ? lerp(1, 0.15, (T_ - 38) / 24) : 0;
export function buildYeast(award) {
  const host = $("#yeStage"), info = $("#yeInfo"), log = $("#yeLog");
  const S = make3D(host, { cam: [0, 4.2, 14], target: [0, 3.1, 0], auto: 0, bg: BG, real: true, hint: null });
  const st = { yeast: true, sugar: true, temp: 35, gas: 0, run: 0, running: false, dead: false, tests: [] };
  const chk = () => { if (st.tests.length >= 4 && st.tests.some(t => !t.yeast) && st.tests.some(t => t.temp >= 65)) award("yeast"); };
  const sync = () => { $("#yeYeast").setAttribute("aria-pressed", st.yeast); $("#yeYeast").textContent = T(st.yeast ? "Yeast: in" : "Yeast: out"); $("#yeSugar").setAttribute("aria-pressed", st.sugar); $("#yeSugar").textContent = T(st.sugar ? "Sugar: in" : "Sugar: out"); };
  $("#yeYeast").addEventListener("click", () => { if (!st.running) { st.yeast = !st.yeast; sync(); look(); } });
  $("#yeSugar").addEventListener("click", () => { if (!st.running) { st.sugar = !st.sugar; sync(); look(); } });
  $("#yeTemp").addEventListener("input", e => { if (!st.running) { st.temp = +e.target.value; $("#yeTempL").textContent = st.temp; look(); } });
  $("#yeReset").addEventListener("click", () => { st.gas = 0; st.run = 0; st.running = false; $("#yeRun").disabled = false; info.innerHTML = `<b>${T("Ready")}</b><p>${T("Yeast is a fungus. It feeds on sugar and makes carbon dioxide gas.")}</p>`; });
  $("#yeRun").addEventListener("click", () => { if (st.running) return; st.gas = 0; st.run = 0; st.running = true; $("#yeRun").disabled = true; });
  sync(); if (noStage(info, S)) return;
  const THREE = S.THREE; floor(THREE, S.scene, -0.3); S.scene.fog = new THREE.Fog(BG, 22, 50);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 7), mat(THREE, 0x3a2716, { roughness: 0.8 })); bench.material.envMapIntensity = 0.15; bench.position.y = -0.2; bench.receiveShadow = true; S.scene.add(bench);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe9ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.4, 40, 1, true), glass); body.position.y = 1.9; S.scene.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 28, 1, true), glass); neck.position.y = 4.3; S.scene.add(neck);
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.5, 0.5, 40, 1, true), glass); shoulder.position.y = 3.85; S.scene.add(shoulder);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 2.3, 40), new THREE.MeshPhysicalMaterial({ color: 0xd8c690, roughness: 0.3, transparent: true, opacity: 0.8, clearcoat: 0.6 })); liq.position.y = 1.35; S.scene.add(liq);
  const sugarMat = mat(THREE, 0xffffff, { roughness: 0.3 }); const sugars = new THREE.Group(); for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), sugarMat); c.position.set(rnd(-1, 1), 0.3 + rnd(0, 0.3), rnd(-1, 1)); c.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); sugars.add(c); } S.scene.add(sugars);
  const cells = new THREE.Group(); const cm = mat(THREE, 0xe8d6a6, { roughness: 0.5 }); for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), cm); c.position.set(rnd(-1.2, 1.2), rnd(0.3, 2.3), rnd(-1.2, 1.2)); cells.add(c); } S.scene.add(cells);
  const balloon = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xff5a7a, roughness: 0.25, clearcoat: 0.8, transparent: true, opacity: 0.92 })); balloon.castShadow = true; S.scene.add(balloon);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.09, 10, 28), mat(THREE, 0xff5a7a)); lip.rotation.x = Math.PI / 2; lip.position.y = 4.95; S.scene.add(lip);
  const N = 70, bg = new THREE.BufferGeometry(), bp = new Float32Array(N * 3), seed = Array.from({ length: N }, () => ({ u: Math.random(), x: rnd(-1.1, 1.1), z: rnd(-1.1, 1.1), s: rnd(0.6, 1.2) }));
  bg.setAttribute("position", new THREE.BufferAttribute(bp, 3)); const bub = new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.2, color: 0xffffff, map: glowTexture(THREE), transparent: true, opacity: 0.85, depthWrite: false })); bub.frustumCulled = false; S.scene.add(bub);
  const thermo = labelSprite(THREE, "35 °C", "#ffd479"); thermo.position.set(0, 5.6, 0); thermo.scale.set(1.5, 0.38, 1); S.scene.add(thermo);
  const heat = new THREE.PointLight(0xff8040, 0.0, 8); heat.position.set(0, 0.4, 1.5); S.scene.add(heat);
  function look() { liq.material.color.set(st.yeast ? (st.sugar ? 0xd8c690 : 0xe7e1c4) : 0xbfe3f5); cells.visible = st.yeast && !st.dead; sugars.visible = st.sugar; const hot = clamp((st.temp - 35) / 40, 0, 1), cold = clamp((20 - st.temp) / 20, 0, 1); heat.color.set(hot > 0 ? 0xff7a30 : 0x5aa8ff); heat.intensity = Math.max(hot, cold) * 1.8; }
  look();
  let rate = 0, last = 0;
  S.onTick = null;
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    const dead = st.temp >= 65 && st.yeast; st.dead = dead; rate = st.yeast && st.sugar && !dead ? rateAt(st.temp) : 0; cells.visible = st.yeast && !dead;
    if (st.running) { st.run += dt * 10; st.gas += rate * dt * 10 * 0.75; if (st.run >= 60) { st.running = false; $("#yeRun").disabled = false; finish(); } }
    const r = 0.55 + clamp(st.gas, 0, 60) * 0.022, flat = st.gas < 0.5;
    balloon.scale.set(flat ? 0.5 : r, flat ? 0.25 : r * 1.12, flat ? 0.5 : r); balloon.position.set(0, 5.0 + (flat ? 0.2 : r * 1.0), 0);
    const bubbling = st.running ? rate : 0;
    for (let i = 0; i < N; i++) { const s = seed[i]; s.u = (s.u + dt * (0.2 + bubbling * 0.9) * s.s) % 1; bp[i * 3] = s.x * (1 - s.u * 0.3); bp[i * 3 + 1] = bubbling > 0.02 ? 0.3 + s.u * 2.3 : -20; bp[i * 3 + 2] = s.z * (1 - s.u * 0.3); }
    bg.attributes.position.needsUpdate = true;
    setText($("#yeGas"), String(Math.round(st.gas))); setText($("#yeBal"), T(st.gas < 1 ? "flat" : st.gas < 15 ? "small" : st.gas < 35 ? "round" : "big"));
    if (st.running) { thermo.visible = true; }
    cells.rotation.y += dt * 0.3;
  })();
  function finish() {
    const g = Math.round(st.gas); st.tests.push({ yeast: st.yeast, sugar: st.sugar, temp: st.temp, gas: g });
    const tr = el("tr"); tr.innerHTML = `<td>${T(st.yeast ? "Yes" : "No")}</td><td>${T(st.sugar ? "Yes" : "No")}</td><td>${st.temp}</td><td>${g}</td>`; log.append(tr);
    const msg = !st.yeast ? "No yeast, so no carbon dioxide is made. The balloon stays flat." : !st.sugar ? "No sugar means no food for the yeast, so almost no gas is made." : st.temp >= 65 ? "Too hot! The yeast was killed, so no gas is made." : st.temp < 10 ? "Too cold: the yeast is nearly asleep, so very little gas is made." : st.temp >= 50 ? "Getting too hot: the yeast is struggling, so less gas is made." : "Yeast fed on the sugar and made carbon dioxide gas, which inflated the balloon. Warm water helps yeast work fast.";
    info.innerHTML = `<b>${g} ml ${T("of gas")}</b><p>${T(msg)}</p>`; burstOn($("#yeRun"), "#ffd479"); chk();
  }
}

/* ================================================================ LAB 2: GERMINATION LAB */
export function buildGerm(award) {
  const host = $("#geStage"), info = $("#geInfo"), log = $("#geLog");
  const S = make3D(host, { cam: [0, 3.6, 10.5], target: [0, 2.4, 0], auto: 0, bg: BG, real: true, hint: null });
  const st = { water: true, air: true, light: true, temp: 20, day: 0, g: 0, ok: false, running: false, tried: false };
  const seen = { water: false, air: false, cold: false, dark: false };
  const sync = () => { [["geWater", st.water, "Water: yes", "Water: no"], ["geAir", st.air, "Oxygen: yes", "Oxygen: no"], ["geLight", st.light, "Light: on", "Light: off"]].forEach(a => { $("#" + a[0]).setAttribute("aria-pressed", a[1]); $("#" + a[0]).textContent = T(a[1] ? a[2] : a[3]); }); };
  ["geWater", "geAir", "geLight"].forEach(id => $("#" + id).addEventListener("click", () => { if (st.running) return; const k = { geWater: "water", geAir: "air", geLight: "light" }[id]; st[k] = !st[k]; sync(); look(); }));
  $("#geTemp").addEventListener("input", e => { if (st.running) return; st.temp = +e.target.value; $("#geTempL").textContent = st.temp; });
  $("#geReset").addEventListener("click", () => { if (st.running) return; st.day = 0; st.g = 0; st.tried = false; info.innerHTML = `<b>${T("Plant the seed")}</b><p>${T("Change the conditions, then press Grow.")}</p>`; });
  $("#geGrow").addEventListener("click", () => { if (st.running) return; st.day = 0; st.g = 0; st.ok = st.water && st.air && st.temp >= 8 && st.temp <= 38; st.running = true; st.tried = true; $("#geGrow").disabled = true; });
  sync(); if (noStage(info, S)) return;
  const THREE = S.THREE; floor(THREE, S.scene, -0.3); S.scene.fog = new THREE.Fog(BG, 20, 45);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 7), mat(THREE, 0x3a2716, { roughness: 0.8 })); bench.material.envMapIntensity = 0.15; bench.position.y = -0.2; bench.receiveShadow = true; S.scene.add(bench);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe9ff, roughness: 0.05, transparent: true, opacity: 0.18, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 5, 40, 1, true), glass); jar.position.y = 2.5; S.scene.add(jar);
  const soilM = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 1 }); soilM.envMapIntensity = 0.2; const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 2.4, 36), soilM); soil.position.y = 1.2; soil.receiveShadow = true; S.scene.add(soil);
  const crumbs = new THREE.Group(); for (let i = 0; i < 60; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.05, 0.12), 6, 5), soilM); const a = rnd(0, 6.28), r = Math.sqrt(Math.random()) * 1.55; c.position.set(Math.cos(a) * r, 2.4 + rnd(0, 0.08), Math.sin(a) * r); crumbs.add(c); } S.scene.add(crumbs);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.3, 36), mat(THREE, 0x2a6dd0, { roughness: 0.4 })); lid.position.y = 5.1; S.scene.add(lid);
  const lamp = new THREE.Group(); const lampHead = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.8, 24, 1, true), mat(THREE, 0x333a44, { side: THREE.DoubleSide })); lampHead.position.y = 8.2; lamp.add(lampHead); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); bulb.position.y = 7.9; lamp.add(bulb); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 8), mat(THREE, 0x333a44)); arm.position.set(-3, 5.6, 0); S.scene.add(lamp);
  const lampLight = new THREE.PointLight(0xfff1c0, 1.2, 20); lampLight.position.y = 7.4; S.scene.add(lampLight);
  const dark = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 5.4, 36, 1, true), new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })); dark.position.y = 2.7; S.scene.add(dark);
  const seedG = new THREE.Group(); seedG.position.set(0, 2.0, 1.5); S.scene.add(seedG);
  const seedM = new THREE.MeshPhysicalMaterial({ color: 0xb4592f, roughness: 0.45, clearcoat: 0.5 }); const seedB = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 16), seedM); seedB.scale.set(1.3, 0.85, 0.85); seedB.castShadow = true; seedG.add(seedB);
  const rootM = new THREE.MeshStandardMaterial({ color: 0xf1e6c9, roughness: 0.7 }); const root = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 1, 8), rootM); seedG.add(root);
  const root2 = root.clone(), root3 = root.clone(); seedG.add(root2, root3);
  const shootM = new THREE.MeshStandardMaterial({ color: 0x57c24a, roughness: 0.6 }); const shoot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1, 10), shootM); shoot.castShadow = true; seedG.add(shoot);
  const leafM = new THREE.MeshStandardMaterial({ color: 0x4fc24a, roughness: 0.5, side: THREE.DoubleSide }); const leafG = new THREE.SphereGeometry(0.5, 14, 10); const leaf1 = new THREE.Mesh(leafG, leafM), leaf2 = leaf1.clone(); leaf1.scale.set(1, 0.08, 0.55); leaf2.scale.set(1, 0.08, 0.55); leaf1.castShadow = leaf2.castShadow = true; seedG.add(leaf1, leaf2);
  const drops = []; const dm = new THREE.MeshPhysicalMaterial({ color: 0x7ac8ff, roughness: 0.05, transparent: true, opacity: 0.75 }); for (let i = 0; i < 12; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), dm); d.position.set(rnd(-1.3, 1.3), 2.5, rnd(-1.3, 1.3)); d.userData.u = Math.random(); S.scene.add(d); drops.push(d); }
  const heatL = new THREE.PointLight(0xff8040, 0, 9); heatL.position.set(0, 1.2, 2); S.scene.add(heatL);
  function look() { soilM.color.set(st.water ? 0x3b2515 : 0x8a6a45); lid.visible = !st.air; lampLight.intensity = st.light ? 1.2 : 0; bulb.material.color.set(st.light ? 0xfff1b0 : 0x333333); dark.visible = !st.light; drops.forEach(d => d.visible = st.water); }
  look();
  const dayT = [0]; let last = 0, tShow = 0;
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; tShow += dt;
    if (st.running) { st.day += dt * 1.8; st.g = st.ok ? clamp(st.day / 7, 0, 1) : 0; if (st.day >= 7) { st.day = 7; st.running = false; $("#geGrow").disabled = false; done(); } }
    const g = st.g, gr = clamp((g - 0.0) / 0.35, 0, 1), up = clamp((g - 0.3) / 0.7, 0, 1);
    const rl = gr * 1.1; [[root, 0, -0.4], [root2, 0.25, -0.35], [root3, -0.25, -0.3]].forEach(a => { a[0].scale.set(1, Math.max(0.001, rl * (a[0] === root ? 1 : 0.6)), 1); a[0].position.set(a[1] * gr * 0.8, -rl * 0.5 * (a[0] === root ? 1 : 0.6), 0); a[0].rotation.z = a[1] * 1.2; });
    seedB.scale.set(1.3 - gr * 0.2, 0.85 - gr * 0.1, 0.85); seedB.position.y = 0;
    const sh = up * 2.2; shoot.scale.set(1, Math.max(0.001, sh), 1); shoot.position.set(0, sh * 0.5, 0); shootM.color.set(st.light ? 0x57c24a : 0xe8e6a0);
    const lf = clamp((up - 0.5) / 0.5, 0, 1); leaf1.visible = leaf2.visible = lf > 0.02; leaf1.position.set(0.45 * lf, sh, 0); leaf2.position.set(-0.45 * lf, sh, 0); leaf1.rotation.z = 0.5 - lf * 0.5; leaf2.rotation.z = -0.5 + lf * 0.5; leaf1.scale.x = leaf2.scale.x = Math.max(0.05, lf); leafM.color.set(st.light ? 0x4fc24a : 0xe5e39a);
    seedM.color.set(!st.tried || st.ok ? 0xb4592f : (!st.air ? 0x4a2c20 : !st.water ? 0x9c7a50 : 0x8d5a45));
    heatL.color.set(st.temp > 28 ? 0xff7a30 : 0x5aa8ff); heatL.intensity = Math.max(clamp((st.temp - 28) / 12, 0, 1), clamp((12 - st.temp) / 12, 0, 1)) * 1.6;
    drops.forEach(d => { d.userData.u = (d.userData.u + dt * 0.4) % 1; d.position.y = 4.8 - d.userData.u * 2.4; });
    setText($("#geDay"), String(Math.floor(st.day))); setText($("#geState"), T(st.g > 0.55 ? "Seedling" : st.g > 0.05 ? "Germinating" : "Dormant"));
  })();
  function done() {
    const res = st.ok ? "Seedling grew" : "Seed did not germinate";
    const tr = el("tr"); tr.innerHTML = `<td>${T(st.water ? "Yes" : "No")}</td><td>${T(st.air ? "Yes" : "No")}</td><td>${st.temp}</td><td>${T(st.light ? "Yes" : "No")}</td><td>${T(res)}</td>`; log.append(tr);
    let msg;
    if (!st.water) { msg = "No water: the seed stays dormant. Water softens the seed coat and activates it."; seen.water = true; }
    else if (!st.air) { msg = "No oxygen: the seed cannot respire to release energy, so it cannot grow."; seen.air = true; }
    else if (st.temp < 8) { msg = "Too cold: the reactions inside the seed are too slow, so it stays dormant."; seen.cold = true; }
    else if (st.temp > 38) { msg = "Too hot: the seed is damaged and does not germinate."; }
    else if (!st.light) { msg = "It germinated in the dark. A seed does not need light to start growing: it uses its own food store."; seen.dark = true; }
    else msg = "Water, warmth and oxygen are all present, so the seed germinated and grew a root and a shoot.";
    info.innerHTML = `<b>${T(res)}</b><p>${T(msg)}</p>`; burstOn($("#geGrow"), st.ok ? "#57c24a" : "#c9791b");
    if (seen.water && seen.air && seen.cold && seen.dark) award("germ");
  }
}

/* ================================================================ LAB 3: POLLINATION LAB */
export function buildPollen(award) {
  const host = $("#poStage"), info = $("#poInfo"), steps = $$("#poSteps li");
  const S = make3D(host, { cam: [0, 3.6, 8.8], target: [0, 3.5, 0], auto: 0, bg: BG, real: true, hint: null });
  const st = { mode: "insect", stage: 0, t: 0, busy: false, tube: 0, fruit: 0, caught: 0 }; const done = { insect: false, wind: false };
  const msgs = { start: ["Two flowers", "The first flower makes pollen. The second flower needs it on its stigma."], insect: ["Pollination", "The bee carried pollen from the anther of the first flower to the sticky stigma of the second. This is pollination."], wind: ["Pollination", "The wind carried light pollen to the feathery stigma. Most pollen is wasted, so wind flowers make huge amounts."], fert: ["Fertilisation", "The pollen cell joined with an ovule in the ovary. This is fertilisation and it forms a seed."], fruit: ["Fruit", "The ovary swelled into a fruit that protects the seeds."] };
  const setMsg = k => info.innerHTML = `<b>${T(msgs[k][0])}</b><p>${T(msgs[k][1])}</p>`;
  const stepUi = n => { setText($("#poStep"), String(n)); steps.forEach((li, i) => li.classList.toggle("on", i < n)); };
  $$("#poMode button").forEach(b => b.addEventListener("click", () => { if (st.busy) return; st.mode = b.dataset.m; $$("#poMode button").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#poGo").textContent = T(st.mode === "insect" ? "Send the bee" : "Release the wind"); reset(); }));
  $("#poGo").addEventListener("click", () => { if (st.busy || st.stage > 0) return; st.busy = true; st.t = 0; st.caught = 0; });
  $("#poReset").addEventListener("click", () => { if (!st.busy) reset(); });
  if (noStage(info, S)) return;
  const THREE = S.THREE; floor(THREE, S.scene, -0.3, 0x0f1a12); S.scene.fog = new THREE.Fog(BG, 22, 50);
  const grass = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 8), mat(THREE, 0x0f2a14, { roughness: 0.95 })); grass.material.envMapIntensity = 0.2; grass.position.y = -0.15; grass.receiveShadow = true; S.scene.add(grass);
  const flowers = [];
  function makeFlower(x, kind) {
    const g = new THREE.Group(); g.position.set(x, 0, 0); const o = {};
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.4, 10), mat(THREE, 0x3a8a3a)); stem.position.y = 1.7; stem.castShadow = true; g.add(stem);
    o.ovary = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), mat(THREE, 0x6fbf4a, { roughness: 0.5 })); o.ovary.position.y = 3.5; o.ovary.castShadow = true; g.add(o.ovary);
    const pm = new THREE.MeshPhysicalMaterial({ color: kind === "insect" ? 0xff6fa5 : 0x8fae6a, roughness: 0.45, clearcoat: 0.3, side: THREE.DoubleSide });
    const np = kind === "insect" ? 7 : 3, pl = kind === "insect" ? 1.6 : 0.5;
    for (let i = 0; i < np; i++) { const a = i / np * Math.PI * 2, p = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), pm); p.scale.set(pl * 0.5, 0.06, pl * 0.38); p.position.set(Math.cos(a) * pl * 0.7, 3.95, Math.sin(a) * pl * 0.7); p.rotation.y = -a; p.rotation.z = 0.35; p.castShadow = true; g.add(p); }
    const fm = mat(THREE, 0xf1ede0), am = new THREE.MeshStandardMaterial({ color: 0xffd23a, roughness: 0.6, emissive: 0x4a3a00 }); o.anthers = [];
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + 0.4, fl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), fm), r = kind === "insect" ? 0.3 : 0.5; fl.position.set(Math.cos(a) * r, 4.35, Math.sin(a) * r); fl.rotation.z = Math.cos(a) * -0.3; fl.rotation.x = Math.sin(a) * 0.3; g.add(fl); const an = new THREE.Mesh(new THREE.SphereGeometry(kind === "insect" ? 0.1 : 0.14, 10, 8), am); an.scale.y = 1.5; an.position.set(Math.cos(a) * (r + 0.1), 4.8, Math.sin(a) * (r + 0.1)); an.castShadow = true; g.add(an); o.anthers.push(an); }
    const style = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), fm); style.position.y = 4.3; g.add(style);
    if (kind === "insect") { o.stigma = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0xff3d71, roughness: 0.1, clearcoat: 1 })); o.stigma.position.y = 4.9; g.add(o.stigma); }
    else { o.stigma = new THREE.Group(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, f = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.025, 0.7, 4), fm); f.position.set(Math.cos(a) * 0.14, 5.0, Math.sin(a) * 0.14); f.rotation.z = Math.cos(a) * 0.5; f.rotation.x = -Math.sin(a) * 0.5; o.stigma.add(f); } o.stigma.position.y = 0; g.add(o.stigma); }
    o.sp = new THREE.Vector3(x, 4.9, 0); o.tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), new THREE.MeshStandardMaterial({ color: 0xffe27a, emissive: 0x6a5000 })); o.tube.position.y = 4.9; o.tube.visible = false; g.add(o.tube);
    o.grp = g; S.scene.add(g); return o;
  }
  const bee = new THREE.Group(); { const by = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), mat(THREE, 0xf2b81a, { roughness: 0.5 })); by.scale.set(1.2, 0.9, 0.9); const st1 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 18), mat(THREE, 0x1a1a1a)); st1.rotation.y = Math.PI / 2; st1.position.x = 0.1; const st2 = st1.clone(); st2.position.x = -0.2; st2.scale.setScalar(0.85); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat(THREE, 0x2a2a2a)); hd.position.x = 0.56; bee.add(by, st1, st2, hd); const wm = new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, roughness: 0.1 }); bee.wL = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), wm); bee.wL.scale.set(0.8, 0.04, 0.5); bee.wL.position.set(0, 0.35, 0.3); bee.wR = bee.wL.clone(); bee.wR.position.z = -0.3; bee.add(bee.wL, bee.wR); bee.pollen = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0x6a5000 })); bee.pollen.position.set(-0.1, -0.1, 0.38); bee.add(bee.pollen); bee.traverse(c => { if (c.isMesh) c.castShadow = true; }); S.scene.add(bee); }
  const PN = 90, pg = new THREE.BufferGeometry(), pp = new Float32Array(PN * 3), pv = Array.from({ length: PN }, () => ({ x: 0, y: -20, z: 0, vx: 0, vy: 0, vz: 0, on: false, stuck: false }));
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3)); const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.16, color: 0xffd23a, map: glowTexture(THREE, "255,210,60"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; S.scene.add(pts);
  const stuckDots = new THREE.Group(); S.scene.add(stuckDots);
  let A, B; dust(THREE, S.scene, 60, [8, 5, 4], 0.5);
  function build() { flowers.forEach(f => S.scene.remove(f.grp)); flowers.length = 0; A = makeFlower(-3.4, st.mode); B = makeFlower(3.4, st.mode); flowers.push(A, B); bee.visible = st.mode === "insect"; while (stuckDots.children.length) stuckDots.remove(stuckDots.children[0]); pv.forEach(p => { p.on = false; p.y = -20; }); bee.position.set(-6, 6.5, 2); bee.pollen.visible = false; }
  function reset() { st.stage = 0; st.busy = false; st.tube = 0; st.fruit = 0; st.t = 0; stepUi(0); setMsg("start"); build(); }
  function stick(n) { for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0x6a5000 })); d.position.set(B.sp.x + rnd(-0.15, 0.15), 4.9 + rnd(-0.1, 0.18), rnd(-0.15, 0.15)); stuckDots.add(d); } }
  build(); setMsg("start"); stepUi(0);
  let last = 0, t0 = 0;
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t0 += dt;
    const sway = Math.sin(t0 * 1.3) * 0.03; flowers.forEach((f, i) => { f.grp.rotation.z = sway * (i ? -1 : 1); });
    bee.wL.rotation.x = Math.sin(t0 * 60) * 0.7; bee.wR.rotation.x = -Math.sin(t0 * 60) * 0.7;
    if (st.busy && st.stage === 0) {
      st.t += dt;
      if (st.mode === "insect") {
        const u = clamp(st.t / 5, 0, 1); const e = u < 0.3 ? u / 0.3 : u < 0.55 ? 1 : 1; let x, y, z = 0.4;
        if (u < 0.25) { const k = u / 0.25; x = lerp(-6, -3.4, k); y = lerp(6.5, 5.4, k); }
        else if (u < 0.45) { x = -3.4; y = 5.4 + Math.sin(t0 * 6) * 0.08; bee.pollen.visible = true; if (st.t > 1.6) A.anthers.forEach(a => a.scale.set(0.7, 1.0, 0.7)); }
        else if (u < 0.75) { const k = (u - 0.45) / 0.3; x = lerp(-3.4, 3.4, k); y = lerp(5.4, 5.6, k) + Math.sin(k * 3.14) * 0.8; }
        else { x = 3.4; y = 5.4 + Math.sin(t0 * 6) * 0.08; }
        bee.position.set(x, y, z); bee.rotation.y = u < 0.45 ? 0 : 0; bee.rotation.z = Math.sin(t0 * 4) * 0.05;
        if (u >= 0.8 && !stuckDots.children.length) { stick(14); bee.pollen.visible = false; st.stage = 1; st.t = 0; stepUi(1); setMsg("insect"); }
      } else {
        const u = st.t;
        if (u < 3.4) { pv.forEach((p, i) => { if (!p.on && Math.random() < 0.5 * dt * 30 && i % 1 === 0) { const a = A.anthers[Math.floor(Math.random() * 5)]; p.x = A.sp.x + rnd(-0.4, 0.4); p.y = 4.8 + rnd(-0.1, 0.2); p.z = rnd(-0.3, 0.3); p.vx = rnd(2.2, 3.8); p.vy = rnd(-0.1, 0.5); p.vz = rnd(-0.6, 0.6); p.on = true; p.stuck = false; } }); }
        pv.forEach(p => { if (!p.on) return; p.vy += Math.sin(t0 * 3 + p.x) * dt * 0.8; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx += rnd(-1, 1) * dt; if (Math.abs(p.x - B.sp.x) < 0.45 && Math.abs(p.y - 5.0) < 0.5 && Math.abs(p.z) < 0.5 && st.caught < 6) { p.on = false; p.y = -20; st.caught++; stick(2); } if (p.x > 8 || p.y < 0.1 || p.y > 9) { p.on = false; p.y = -20; } });
        if (u > 4.2) { pv.forEach(p => { p.on = false; p.y = -20; }); if (st.caught < 1) { stick(8); } st.stage = 1; st.t = 0; stepUi(1); setMsg("wind"); }
      }
    }
    pv.forEach((p, i) => { pp[i * 3] = p.on ? p.x : 0; pp[i * 3 + 1] = p.on ? p.y : -20; pp[i * 3 + 2] = p.on ? p.z : 0; }); pg.attributes.position.needsUpdate = true;
    if (st.stage === 1) { st.t += dt; if (st.t > 1.2) { B.tube.visible = true; st.tube = clamp((st.t - 1.2) / 1.8, 0, 1); const L = 0.5 + st.tube * 1.1; B.tube.scale.set(1, L, 1); B.tube.position.y = 4.9 - L * 0.5; if (st.tube >= 1) { st.stage = 2; st.t = 0; stepUi(2); setMsg("fert"); } } }
    else if (st.stage === 2 && st.t >= 0) { st.t += dt; if (st.t > 1.2) { st.fruit = clamp((st.t - 1.2) / 2.4, 0, 1); B.ovary.scale.setScalar(1 + st.fruit * 0.9); B.ovary.material.color.set(st.mode === "insect" ? new THREE.Color(0x6fbf4a).lerp(new THREE.Color(0xe0412c), st.fruit) : new THREE.Color(0x6fbf4a).lerp(new THREE.Color(0xd9b44a), st.fruit)); if (st.fruit >= 1) { st.stage = 3; st.busy = false; stepUi(3); setMsg("fruit"); done[st.mode] = true; burstOn($("#poGo"), "#e0412c"); if (done.insect && done.wind) award("pollen"); } } }
  })();
}

/* ================================================================ LAB 4: HEART LAB */
const HPARTS = {
  ra: ["Right atrium", "Receives blue, deoxygenated blood from the body through the vena cava."],
  rv: ["Right ventricle", "Pumps deoxygenated blood to the lungs through the pulmonary artery."],
  la: ["Left atrium", "Receives red, oxygenated blood from the lungs through the pulmonary veins."],
  lv: ["Left ventricle", "Has the thickest wall. It pumps oxygenated blood through the aorta to the whole body."],
  ao: ["Aorta", "The biggest artery. It carries oxygenated blood away from the heart to the body."],
  vc: ["Vena cava", "The biggest vein. It brings deoxygenated blood back from the body to the heart."]
};
export function buildHeart(award) {
  const host = $("#heStage"), info = $("#heInfo"), chips = $("#hePartsB");
  Object.values(HPARTS).forEach(p => { T(p[0]); T(p[1]); });
  const S = make3D(host, { cam: [0, 2, 14.5], target: [0, 1.4, 0], auto: 0.12, bg: BG, real: true, hint: "Drag sideways to turn the heart", onPick: rc => pick(rc) });
  const st = { bpm: 70, target: 70, ex: false, seen: new Set(), counted: 0, exDone: false, beats: 0, sel: null }; let phase = 0;
  const chk = () => { if (st.seen.size >= 6 && st.exDone && st.counted >= 2) award("heart"); };
  function choose(k) { st.sel = k; st.seen.add(k); info.innerHTML = `<b>${T(HPARTS[k][0])}</b><p>${T(HPARTS[k][1])}</p>`; $$("button", chips).forEach(b => b.classList.toggle("on", b.dataset.k === k)); chk(); }
  Object.keys(HPARTS).forEach(k => { const b = el("button", "", T(HPARTS[k][0])); b.dataset.k = k; b.addEventListener("click", () => choose(k)); chips.append(b); });
  const rate = $("#heRate"); rate.addEventListener("input", e => { st.target = +e.target.value; st.ex = false; $("#heEx").setAttribute("aria-pressed", "false"); $("#heEx").textContent = T("Start exercising"); });
  $("#heEx").addEventListener("click", () => { st.ex = !st.ex; $("#heEx").setAttribute("aria-pressed", st.ex); $("#heEx").textContent = T(st.ex ? "Stop exercising" : "Start exercising"); st.target = st.ex ? 150 : 70; rate.value = st.target; if (st.ex) st.exDone = true; chk(); });
  let counting = false; $("#heCount").addEventListener("click", () => { if (counting) return; counting = true; const out = $("#heOut"); out.textContent = T("Counting..."); let s = 0; const b0 = st.beats; const iv = setInterval(() => { s++; if (s >= 15) { clearInterval(iv); const n = Math.round(st.bpm * 15 / 60 + rnd(-0.4, 0.4)); out.innerHTML = `${T("Counted")} <b>${n}</b> ${T("beats in 15 seconds.")} ${n} × 4 = <b>${n * 4}</b> ${T("beats per minute")}`; counting = false; st.counted++; chk(); } }, 200); });
  if (noStage(info, S)) return;
  const THREE = S.THREE; S.scene.fog = new THREE.Fog(BG, 18, 40); floor(THREE, S.scene, -4);
  const rm = c => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, emissive: new THREE.Color(c).multiplyScalar(0.04) }); m.envMapIntensity = 0.45; return m; };
  const BLUE = 0x2748b8, RED = 0xb01824; const g = new THREE.Group(); S.scene.add(g); const parts = {}, meshes = [];
  function chamber(k, c, pos, sc) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 28), rm(c)); m.scale.set(...sc); m.position.set(...pos); m.castShadow = true; m.userData.part = k; m.userData.base = m.scale.clone(); g.add(m); parts[k] = m; meshes.push(m); return m; }
  chamber("ra", BLUE, [-1.5, 1.7, 0.1], [0.95, 0.9, 0.9]); chamber("rv", BLUE, [-0.8, -0.7, 0.5], [1.25, 1.75, 1.05]);
  chamber("la", RED, [1.5, 1.8, -0.5], [0.9, 0.85, 0.85]); chamber("lv", RED, [0.85, -0.8, -0.1], [1.45, 2.0, 1.25]);
  const tube = (pts, c, r, k) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 30, r, 14), rm(c)); m.castShadow = true; if (k) { m.userData.part = k; meshes.push(m); parts[k] = m; } g.add(m); return m; };
  const vcP = [[-1.7, 5.4, 0.1], [-1.7, 3.6, 0.1], [-1.55, 2.4, 0.1]], aoP = [[0.6, 1.6, -0.2], [0.5, 3.4, -0.1], [-0.3, 4.6, -0.2], [-1.3, 4.5, -0.3], [-2.0, 3.6, -0.4], [-2.4, 1.0, -0.6], [-2.5, -2.0, -0.7]], paP = [[-0.2, 0.7, 0.5], [-0.4, 2.2, 0.8], [-0.2, 3.7, 0.8], [1.2, 4.3, 0.5], [3.1, 4.4, 0.0]], paP2 = [[-0.4, 2.2, 0.8], [-2.6, 4.0, 0.5], [-3.4, 3.9, 0.5]], pvP = [[2.6, 1.8, -0.5], [3.8, 2.4, -0.2]], pvP2 = [[2.4, 2.2, -0.6], [3.7, 3.2, -0.4]];
  tube(vcP, BLUE, 0.34, "vc"); tube(aoP, RED, 0.38, "ao"); tube(paP, BLUE, 0.3); tube(paP2, BLUE, 0.26); tube([[-1.7, 3.6, 0.1], [-3.6, 3.3, 0.0]], BLUE, 0.2); tube(pvP, RED, 0.22); tube(pvP2, RED, 0.2);
  const lungM = new THREE.MeshPhysicalMaterial({ color: 0xf08a98, roughness: 0.5, clearcoat: 0.4, transparent: true, opacity: 0.55, emissive: 0x4a0f1a }); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 22), lungM); l.scale.set(0.9, 1.6, 0.9); l.position.set(s * 5.0, 3.6, -0.2); g.add(l); }
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 16), new THREE.MeshPhysicalMaterial({ color: 0xc87a6a, roughness: 0.6, transparent: true, opacity: 0.7 })); body.scale.set(1.8, 0.9, 1.0); body.position.set(-2.5, -2.9, -0.7); g.add(body);
  const body2 = body.clone(); body2.position.set(-1.7, 6.3, 0.1); body2.scale.set(1.2, 0.7, 0.9); g.add(body2);
  const labelB = labelSprite(THREE, T("Body"), "#ffd1c4"); labelB.position.set(-2.5, -4.1, -0.7); g.add(labelB); const labelL = labelSprite(THREE, T("Lungs"), "#ffc3cd"); labelL.position.set(5.0, 5.6, 0); g.add(labelL);
  /* blood particles flowing along the two loops */
  function stream(paths, col, n) { const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.26, color: col, map: glowTexture(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; g.add(pts); const curves = paths.map(p => new THREE.CatmullRomCurve3(p.map(q => new THREE.Vector3(...q)))); return { geo, pos, n, curves, off: Array.from({ length: n }, () => ({ u: Math.random(), c: Math.floor(Math.random() * curves.length), j: rnd(-0.12, 0.12) })) }; }
  const sB = stream([[[-1.7, 5.4, 0.1], [-1.7, 3.6, 0.1], [-1.5, 1.8, 0.1], [-1.0, -0.3, 0.5], [-0.3, 1.5, 0.6], [-0.3, 3.4, 0.8], [1.2, 4.3, 0.5], [3.1, 4.4, 0.0]], [[-0.4, 2.2, 0.8], [-2.6, 4.0, 0.5], [-3.4, 3.9, 0.5]]], 0x7da4ff, 70);
  const sR = stream([[[3.8, 2.4, -0.2], [2.6, 1.9, -0.5], [1.5, 1.8, -0.5], [1.0, -0.5, -0.1], [0.6, 1.6, -0.2], [0.5, 3.4, -0.1], [-0.3, 4.6, -0.2], [-1.3, 4.5, -0.3], [-2.0, 3.6, -0.4], [-2.4, 1.0, -0.6], [-2.5, -2.0, -0.7]]], 0xff6a6a, 70);
  let last = 0, t0 = 0, lastBeat = -1;
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t0 += dt;
    st.bpm += (st.target - st.bpm) * Math.min(1, dt * 0.8); phase += dt * st.bpm / 60; const f = phase % 1, bi = Math.floor(phase); if (bi !== lastBeat) { lastBeat = bi; st.beats++; }
    const atr = f < 0.18 ? Math.sin(f / 0.18 * Math.PI) : 0, ven = f > 0.15 && f < 0.5 ? Math.sin((f - 0.15) / 0.35 * Math.PI) : 0;
    ["ra", "la"].forEach(k => { const m = parts[k], b = m.userData.base; const s = 1 - atr * 0.18; m.scale.set(b.x * s, b.y * s, b.z * s); });
    ["rv", "lv"].forEach(k => { const m = parts[k], b = m.userData.base; const s = 1 - ven * 0.14; m.scale.set(b.x * s, b.y * s, b.z * s); });
    meshes.forEach(m => { const on = m.userData.part === st.sel; if (m.material.emissive) { const base = new THREE.Color(m.material.color).multiplyScalar(0.04); m.material.emissive.copy(base).addScalar(on ? 0.22 + Math.sin(t0 * 6) * 0.08 : 0); } });
    [sB, sR].forEach(s => { for (let i = 0; i < s.n; i++) { const o = s.off[i]; o.u = (o.u + dt * st.bpm / 60 * 0.22) % 1; const p = s.curves[o.c].getPoint(o.u); s.pos[i * 3] = p.x + o.j; s.pos[i * 3 + 1] = p.y + o.j * 0.6; s.pos[i * 3 + 2] = p.z + o.j; } s.geo.attributes.position.needsUpdate = true; });
    g.position.y = Math.sin(t0 * 1.4) * 0.06;
    setText($("#heBpm"), String(Math.round(st.bpm))); setText($("#heBeats"), String(st.beats)); setText($("#heRateL"), String(Math.round(st.bpm))); $("#heO2").style.width = clamp(30 + (st.bpm - 50) / 130 * 70, 0, 100) + "%";
  })();
  function pick(rc) { const h = rc.intersectObjects(meshes, false)[0]; if (h && HPARTS[h.object.userData.part]) choose(h.object.userData.part); }
}
