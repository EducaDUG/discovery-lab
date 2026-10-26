/* Exam 5 revision: the hyper-real 3D hero and three live labs (Breathing Lab, Muscle Lab, Particle Lab).
   Plain ES modules on engine/revision-kit.js (make3D with real:true = ACES tone mapping, soft shadows, studio environment). */
import { $, $$, el, rnd, clamp, popIt, burstOn, T, make3D, glowTexture, labelSprite, reduced } from "../../../../../../engine/revision-kit.js?v=17";

const IVORY = 0xe9dfc8;
const setHTML = (el, v) => { if (el.dataset.h !== v) { el.dataset.h = v; el.innerHTML = v; } };
const setText = (el, v) => { if (el.textContent !== v) el.textContent = v; };
function boneMat(THREE, c = IVORY) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0.02 }); }
function floorAndBench(THREE, scene) {
  const fm = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 }); fm.envMapIntensity = 0.12; const f = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), fm); f.rotation.x = -Math.PI / 2; f.position.y = -0.6; f.receiveShadow = true; scene.add(f);
}

/* ---------------------------------------------------------------- torso: ribs, spine, lungs, trachea, diaphragm, heart */
export function buildTorso(THREE, { shadow = true } = {}) {
  const g = new THREE.Group(); const parts = {};
  const reg = (k, m) => { m.userData.part = k; (parts[k] = parts[k] || []).push(m); if (shadow) m.castShadow = true; return m; };
  const bone = boneMat(THREE);
  for (let i = 0; i < 17; i++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.34, 14), bone); v.position.set(0, 0.6 + i * 0.4, -1.1 - Math.sin(i / 16 * Math.PI) * 0.16); g.add(reg("spine", v)); const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.4, 8), bone); sp.rotation.x = 1.2; sp.position.set(0, v.position.y, v.position.z - 0.3); g.add(sp); }
  const ribs = new THREE.Group(); g.add(ribs); const ribMat = new THREE.MeshStandardMaterial({ color: 0xf0e6cf, roughness: 0.55 });
  for (let i = 0; i < 10; i++) for (const s of [-1, 1]) {
    const y = 2.0 + i * 0.5, w = 1.55 + Math.sin((i + 1) / 11 * Math.PI) * 1.05; const pts = [new THREE.Vector3(s * 0.15, y + 0.25, -1.05), new THREE.Vector3(s * w * 0.75, y + 0.1, -0.75), new THREE.Vector3(s * w, y - 0.25, 0.1), new THREE.Vector3(s * w * 0.72, y - 0.75, 0.95), new THREE.Vector3(s * 0.28, y - 1.0, 1.22)];
    const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.05, 8), ribMat); rib.userData.base = y; ribs.add(reg("ribs", rib));
  }
  const ster = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.18), ribMat); ster.position.set(0, 4.0, 1.25); g.add(reg("ribs", ster));
  const lungMat = new THREE.MeshPhysicalMaterial({ color: 0xf08a98, roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3, transparent: true, opacity: 0.95, emissive: 0x4a0f1a });
  const lungs = []; for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 28), lungMat); l.scale.set(0.95, 1.75, 0.85); l.position.set(s * 1.15, 3.9, 0); l.userData.s = s; g.add(reg("lungs", l)); lungs.push(l); }
  const trach = new THREE.Group(); const tm = new THREE.MeshStandardMaterial({ color: 0xcfd8e6, roughness: 0.35, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 18), tm); r.rotation.x = Math.PI / 2; r.position.set(0, 6.3 - i * 0.2, 0.2); trach.add(reg("trachea", r)); }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.8, 16), tm); tube.position.set(0, 5.5, 0.2); trach.add(reg("trachea", tube)); g.add(trach);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.5, 12), tm); b.position.set(s * 0.55, 4.9, 0.2); b.rotation.z = s * 0.95; g.add(reg("bronchi", b)); }
  const dia = new THREE.Mesh(new THREE.SphereGeometry(2.1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb4423e, roughness: 0.55, side: THREE.DoubleSide })); dia.scale.set(1.0, 0.55, 0.78); dia.position.set(0, 1.55, 0); g.add(reg("diaphragm", dia));
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 18), new THREE.MeshStandardMaterial({ color: 0xa3121f, roughness: 0.4, emissive: 0x2a0306 })); heart.scale.set(0.9, 1.1, 0.9); heart.position.set(0.35, 3.1, 0.35); g.add(reg("heart", heart));
  const alv = new THREE.Group(); const am = new THREE.MeshPhysicalMaterial({ color: 0xffd0d8, roughness: 0.2, transparent: true, opacity: 0.75, clearcoat: 1 });
  for (let i = 0; i < 16; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.17 + Math.random() * 0.06, 14, 10), am); a.position.set(-1.0 + Math.random() * 0.7 - 0.15, 2.7 + Math.random() * 0.7, 0.55 + Math.random() * 0.4); alv.add(reg("alveoli", a)); } g.add(alv);
  g.userData = { parts, lungs, dia, ribs, heart, base: lungs.map(l => l.scale.clone()) };
  g.userData.update = b => { /* b = 0 (out) .. 1 (in) */ lungs.forEach((l, i) => { const k = 1 + b * 0.16; l.scale.set(g.userData.base[i].x * k, g.userData.base[i].y * (1 + b * 0.1), g.userData.base[i].z * k); }); dia.position.y = 1.55 - b * 0.4; dia.scale.y = 0.55 - b * 0.18; ribs.position.y = b * 0.08; ribs.scale.set(1 + b * 0.05, 1, 1 + b * 0.04); };
  return g;
}

/* ================================================================ HERO */
export function buildHero() {
  const host = $("#heroStage"); if (!host) return;
  const S = make3D(host, { cam: [0, 4.4, 11], target: [0, 3.6, 0], auto: 0.2, bg: 0x111a2a, real: true, hint: "Drag sideways to turn the body" });
  if (!S) return; const THREE = S.THREE; S.scene.fog = new THREE.Fog(0x111a2a, 22, 50); floorAndBench(THREE, S.scene);
  const torso = buildTorso(THREE); S.scene.add(torso);
  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 120 }, () => new THREE.Vector3(rnd(-8, 8), rnd(0, 9), rnd(-6, 6)))), new THREE.PointsMaterial({ size: 0.06, color: 0x9fe7ff, map: glowTexture(THREE), transparent: true, opacity: 0.5, depthWrite: false })); S.scene.add(dust);
  const t0 = performance.now(); (function loop() { requestAnimationFrame(loop); const t = (performance.now() - t0) / 1000; const b = reduced() ? 0.5 : (Math.sin(t * 1.3 - 1.57) * 0.5 + 0.5); torso.userData.update(b); torso.userData.heart.scale.setScalar(0.95 + Math.max(0, Math.sin(t * 7)) * 0.07); dust.rotation.y = t * 0.02; })();
}

/* ================================================================ LAB 1: BREATHING LAB (3D) */
const BPARTS = {
  trachea: ["Trachea", "The windpipe: a tube with rings that carries air from the nose and mouth down to the lungs."],
  bronchi: ["Bronchi", "The trachea splits into two bronchi, one going into each lung."],
  lungs: ["Lungs", "The main breathing organs. They fill with air and pass oxygen into the blood."],
  alveoli: ["Alveoli", "Tiny air sacs where gas exchange happens: oxygen moves into the blood and carbon dioxide moves out."],
  diaphragm: ["Diaphragm", "The muscle under the lungs. When it contracts it flattens and air is drawn in; when it relaxes air is pushed out."],
  ribs: ["Ribs", "The ribcage protects the lungs and heart, and it moves up and out as you breathe in."]
};
export function buildBreath(award) {
  const host = $("#brStage"), info = $("#brInfo"), chips = $("#brParts");
  Object.values(BPARTS).forEach(p => { T(p[0]); T(p[1]); });
  const S = make3D(host, { cam: [0, 4.4, 12], target: [0, 3.6, 0], auto: 0.0, bg: 0x111a2a, real: true, hint: null, onPick: rc => pick(rc) });
  const seen = new Set(); let rate = 14, ex = false, hold = false, breaths = 0, atp = 0.15, t = 0, last = 0, sel = null, pulse = 0, exDone = false;
  function choose(k) { sel = k; pulse = 1; seen.add(k); info.innerHTML = `<b>${T(BPARTS[k][0])}</b><p>${T(BPARTS[k][1])}</p>`; $$("button", chips).forEach(b => b.classList.toggle("on", b.dataset.k === k)); check(); }
  Object.keys(BPARTS).forEach(k => { const b = el("button", "", T(BPARTS[k][0])); b.dataset.k = k; b.addEventListener("click", () => choose(k)); chips.append(b); });
  function check() { if (seen.size >= 6 && breaths >= 5 && exDone) award("breath"); }
  const rs = $("#brRate"); rs.addEventListener("input", e => { rate = +e.target.value; $("#brRateL").textContent = rate; });
  $("#brEx").addEventListener("click", () => { ex = !ex; $("#brEx").setAttribute("aria-pressed", ex); $("#brEx").textContent = T(ex ? "Stop exercising" : "Start exercising"); rate = ex ? 40 : 14; rs.value = rate; $("#brRateL").textContent = rate; if (ex) exDone = true; check(); });
  $("#brHold").addEventListener("click", () => { hold = !hold; $("#brHold").setAttribute("aria-pressed", hold); $("#brHold").textContent = T(hold ? "Breathe again" : "Hold your breath"); });
  if (!S) { info.innerHTML = `<b>${T("3D view is not available on this device. Everything else on the page still works.")}</b>`; return; }
  const THREE = S.THREE; floorAndBench(THREE, S.scene); S.scene.fog = new THREE.Fog(0x111a2a, 24, 50);
  const torso = buildTorso(THREE); S.scene.add(torso);
  const meshes = []; Object.values(torso.userData.parts).forEach(a => a.forEach(m => meshes.push(m)));
  function pick(rc) { const h = rc.intersectObjects(meshes, false)[0]; if (h && BPARTS[h.object.userData.part]) choose(h.object.userData.part); }
  /* air particles: blue oxygen goes in, red carbon dioxide goes out */
  const N = 46, geo = new THREE.BufferGeometry(); const pos = new Float32Array(N * 3), col = new Float32Array(N * 3); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const air = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, map: glowTexture(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); air.frustumCulled = false; S.scene.add(air);
  const seed = Array.from({ length: N }, () => ({ o: Math.random(), s: Math.random() < 0.5 ? -1 : 1, r: Math.random() }));
  const meters = { o2: $("#brO2"), co2: $("#brCO2"), atp: $("#brATP") };
  let lastB = 0;
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; if (!hold) t += dt * rate / 60 * Math.PI * 2; const ph = Math.sin(t - 1.57) * 0.5 + 0.5; const b = hold ? lastB : ph; lastB = b;
    torso.userData.update(b); const inhale = Math.cos(t - 1.57) > 0 && !hold; const bi = Math.floor((t - 1.57 + Math.PI * 2 * 100) / (Math.PI * 2)); if (bi !== loop.bi) { if (loop.bi !== undefined && !hold) { breaths++; check(); $("#brCount").textContent = breaths; } loop.bi = bi; }
    for (let i = 0; i < N; i++) { const s = seed[i]; const u = ((s.o + (t / (Math.PI * 2)) * 1.0) % 1 + 1) % 1; const along = inhale ? u : 1 - u; const y = 7.2 - along * 3.6; const spread = along > 0.55 ? (along - 0.55) * 2.0 * s.s : 0; pos[i * 3] = (spread * 1.3) + (s.r - 0.5) * 0.2; pos[i * 3 + 1] = y; pos[i * 3 + 2] = 0.2 + (s.r - 0.5) * 0.2;
      if (hold) { pos[i * 3 + 1] = -20; } col[i * 3] = inhale ? 0.3 : 1; col[i * 3 + 1] = inhale ? 0.8 : 0.35; col[i * 3 + 2] = inhale ? 1 : 0.3; }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    const demand = ex ? 1 : 0.3; atp += ((hold ? -0.05 : (rate / 60) * demand * 0.35) - 0.05 - (ex ? 0.02 : 0)) * dt * 0.8; atp = clamp(atp + (hold ? -0.1 * dt : (rate / 60) * dt * 0.12), 0.05, 1);
    meters.o2.style.width = (hold ? 0 : 25 + b * 75) + "%"; meters.co2.style.width = (hold ? 0 : 100 - b * 75) + "%"; meters.atp.style.width = (atp * 100) + "%"; pulse = Math.max(0, pulse - dt * 0.8);
    Object.keys(torso.userData.parts).forEach(k => torso.userData.parts[k].forEach(m => { if (m.material && m.material.emissive) { const v = k === sel ? 0.4 + Math.sin(now / 160) * 0.3 * pulse : 0; if (k !== "lungs" && k !== "heart") m.material.emissive.setRGB(v * 0.6, v * 0.5, v * 0.1); } }));
  })();
}

/* ================================================================ LAB 2: MUSCLE LAB (3D) */
const LIMBS = {
  arm: { flex: ["Biceps", "Triceps"], upper: "Humerus", lower: "Radius and ulna", dir: 1, bend: "Bend the elbow", joint: "elbow" },
  leg: { flex: ["Hamstrings", "Quadriceps"], upper: "Femur", lower: "Tibia and fibula", dir: -1, bend: "Bend the knee", joint: "knee" }
};
export function buildMuscle(award) {
  const host = $("#muStage"), info = $("#muInfo"), slider = $("#muAngle");
  const S = make3D(host, { cam: [0, 3.2, 11], target: [0, 1.6, 0], auto: 0, bg: 0x111a2a, real: true, hint: null });
  Object.values(LIMBS).forEach(l => { l.flex.forEach(T); T(l.upper); T(l.lower); T(l.bend); });
  let limb = "arm", theta = 0.1, target = 0.1, auto = false, prevTh = 0.1; const done = new Set(); const seenLimb = new Set(["arm"]); let minTh = 9, maxTh = 0;
  $$("#muMode button").forEach(b => b.addEventListener("click", () => { limb = b.dataset.l; seenLimb.add(limb); $$("#muMode button").forEach(x => x.setAttribute("aria-pressed", x === b)); target = theta = 0.1; slider.value = 10; $("#muBend").textContent = T(LIMBS[limb].bend); build(); }));
  slider.addEventListener("input", e => { auto = false; $("#muAuto").setAttribute("aria-pressed", "false"); target = +e.target.value / 100 * 2.4; });
  $("#muAuto").addEventListener("click", () => { auto = !auto; $("#muAuto").setAttribute("aria-pressed", auto); });
  if (!S) { info.innerHTML = `<b>${T("3D view is not available on this device. Everything else on the page still works.")}</b>`; return; }
  const THREE = S.THREE; floorAndBench(THREE, S.scene); S.scene.fog = new THREE.Fog(0x111a2a, 22, 50);
  let grp = null, meshes = {};
  const ptV = (x, y) => new THREE.Vector3(x, y, 0);
  function between(mesh, a, b, girth, cyl) { const d = new THREE.Vector3().subVectors(b, a); const len = d.length(); mesh.position.copy(a).addScaledVector(d, 0.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); mesh.scale.set(girth, cyl ? len : len / 2, girth * 0.9); }
  function build() {
    if (grp) S.scene.remove(grp); grp = new THREE.Group(); S.scene.add(grp); meshes = {}; const L = LIMBS[limb];
    const bone = boneMat(THREE); const head = r => new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), bone);
    const top = ptV(0, 5.2); const joint = ptV(0, 1.7);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 1, 14), bone); up.castShadow = true; between(up, top, joint, 1, true); grp.add(up);
    [top, joint].forEach(p => { const h = head(0.34); h.position.copy(p); h.castShadow = true; grp.add(h); });
    const low = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 1, 14), bone); low.castShadow = true; grp.add(low); meshes.low = low;
    const low2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 1, 12), bone); grp.add(low2); meshes.low2 = low2;
    const end = head(0.26); grp.add(end); meshes.end = end;
    const mm = col => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.45, clearcoat: 0.4, emissive: 0x220000 }); const tm = new THREE.MeshStandardMaterial({ color: 0xe7d9b8, roughness: 0.5 });
    meshes.flex = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mm(0xc2403a)); meshes.flex.castShadow = true; grp.add(meshes.flex);
    meshes.ext = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mm(0xb5383a)); meshes.ext.castShadow = true; grp.add(meshes.ext);
    meshes.tF = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), tm); meshes.tE = meshes.tF.clone(); grp.add(meshes.tF, meshes.tE);
    meshes.lblF = labelSprite(THREE, T(L.flex[0]), "#ff9d8d"); meshes.lblE = labelSprite(THREE, T(L.flex[1]), "#9fd8ff"); grp.add(meshes.lblF, meshes.lblE);
    const lu = labelSprite(THREE, T(L.upper), "#e9dfc8"); lu.position.set(-1.6 * L.dir, 3.5, 0); grp.add(lu); meshes.lblL = labelSprite(THREE, T(L.lower), "#e9dfc8"); grp.add(meshes.lblL);
    meshes.top = top; meshes.joint = joint; frame(0);
  }
  let f0 = 0, f1 = 0;
  function frame(dt) {
    const L = LIMBS[limb], s = L.dir, th = theta; const joint = meshes.joint, top = meshes.top; const dir = ptV(s * Math.sin(th), -Math.cos(th)); const n = ptV(-dir.y * s, dir.x * s);
    const endP = joint.clone().addScaledVector(dir, 3.2); between(meshes.low, joint, endP, 1, true);
    const side = n.clone().multiplyScalar(0.25); between(meshes.low2, joint.clone().add(side), endP.clone().add(side), 1, true); meshes.end.position.copy(endP);
    /* flexor: front of the upper bone to the lower bone; extensor: behind the joint */
    const fa = ptV(s * 0.45, 4.7), fb = joint.clone().addScaledVector(dir, 0.9).addScaledVector(n, 0.2); const ea = ptV(-s * 0.45, 4.6), eb = joint.clone().addScaledVector(n, -0.42).addScaledVector(dir, -0.05);
    const fl = fa.distanceTo(fb), el = ea.distanceTo(eb); if (!f0) { f0 = fa.distanceTo(joint.clone().add(ptV(0, -0.9)).add(ptV(s * 0.2, 0))); f1 = ea.distanceTo(joint.clone().add(ptV(-s * 0.42, 0))); }
    const rest = x => x; const fcon = clamp((theta - prevTh) * 60, -1, 1), moving = Math.abs(theta - prevTh) > 0.0006;
    const flexAct = moving ? (theta > prevTh ? 1 : 0.1) : (theta > 1.2 ? 0.6 : 0.25), extAct = moving ? (theta < prevTh ? 1 : 0.1) : (theta < 0.8 ? 0.4 : 0.1);
    const belly = (m, a, b, act, base) => { const d = new THREE.Vector3().subVectors(b, a); const len = d.length(); const mid = a.clone().addScaledVector(d, 0.5); m.position.copy(mid); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); const g = base * (0.92 + act * 0.35) * clamp(3.4 / len, 0.7, 1.5); m.scale.set(g, len * 0.34, g * 0.9); m.material.emissive.setRGB(act * 0.45, 0.02, 0.02); };
    belly(meshes.flex, fa, fb, flexAct, 0.28); belly(meshes.ext, ea, eb, extAct, 0.26);
    between(meshes.tF, fa, fb, 1, true); between(meshes.tE, ea, eb, 1, true);
    meshes.lblF.position.set(s * 1.5, (fa.y + fb.y) / 2 + 0.6, 0.4); meshes.lblE.position.set(-s * 1.5, (ea.y + eb.y) / 2 + 0.2, 0.4); meshes.lblL.position.set(endP.x + s * 1.2, endP.y, 0);
    const flexName = T(L.flex[0]), extName = T(L.flex[1]);
    if (moving) setHTML(info, theta > prevTh ? `<b>${flexName} ${T("contracts")}</b><p>${extName} ${T("relaxes")}. ${T("The tendon pulls the bone.")}</p>` : `<b>${extName} ${T("contracts")}</b><p>${flexName} ${T("relaxes")}. ${T("The tendon pulls the bone.")}</p>`);
    if (moving && theta > prevTh) done.add(limb + "b"); if (moving && theta < prevTh) done.add(limb + "s"); if (done.size >= 4) award("muscle");
    prevTh = theta;
  }
  build();
  info.innerHTML = `<b>${T("Move the slider or press Auto")}</b><p>${T("Muscles can only pull. Watch which muscle contracts and which relaxes.")}</p>`;
  let last = performance.now(), ta = 0; (function loop() { requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; if (auto) { ta += dt * 0.9; target = (Math.sin(ta) * 0.5 + 0.5) * 2.3 + 0.1; slider.value = target / 2.4 * 100; } theta += (target - theta) * Math.min(1, dt * 7); if (Math.abs(theta - prevTh) < 0.0006) { /* static */ } frame(dt); })();
}

/* ================================================================ LAB 3: PARTICLE LAB (3D) */
export function buildParticles(award) {
  const host = $("#paStage"), info = $("#paInfo"); const S = make3D(host, { cam: [0, 4.5, 11.5], target: [0, 2.2, 0], auto: 0, bg: 0x111a2a, real: true, hint: null });
  if (!S) { info.innerHTML = `<b>${T("3D view is not available on this device. Everything else on the page still works.")}</b>`; return; }
  const THREE = S.THREE; floorAndBench(THREE, S.scene); S.scene.fog = new THREE.Fog(0x111a2a, 22, 50);
  const W = 3, D = 1.6, H0 = 5.2; let H = H0, temp = 0.15, squeeze = 0, marked = false; const seen = new Set(); let maxComp = 0, hotSpread = false, pressure = 0, impulse = 0, impAcc = 0;
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, roughness: 0.04, transparent: true, opacity: 0.14, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  const box = new THREE.Mesh(new THREE.BoxGeometry(W * 2, 1, D * 2), glass); S.scene.add(box); const frameM = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W * 2, 1, D * 2)), new THREE.LineBasicMaterial({ color: 0x9fe7ff, transparent: true, opacity: 0.8 })); S.scene.add(frameM);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 0.5, 0.3, D * 2 + 0.5), new THREE.MeshStandardMaterial({ color: 0x20242b, metalness: 0.7, roughness: 0.4 })); base.position.y = -0.15; base.castShadow = base.receiveShadow = true; S.scene.add(base);
  const piston = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 0.1, 0.25, D * 2 + 0.1), new THREE.MeshStandardMaterial({ color: 0xc98a4b, metalness: 0.9, roughness: 0.3 })); piston.castShadow = true; S.scene.add(piston); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 12), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.9, roughness: 0.3 })); S.scene.add(rod);
  const NX = 5, NY = 4, NZ = 3, N = NX * NY * NZ; const parts = [];
  const geo = new THREE.SphereGeometry(0.24, 18, 14);
  for (let i = 0; i < N; i++) { const ix = i % NX, iy = Math.floor(i / NX) % NY, iz = Math.floor(i / (NX * NY)); const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0x4fa3ff, roughness: 0.25, clearcoat: 0.8 })); m.castShadow = true; const home = new THREE.Vector3((ix - (NX - 1) / 2) * 0.66, 0.4 + iy * 0.62, (iz - (NZ - 1) / 2) * 0.66); m.position.copy(home); S.scene.add(m); parts.push({ m, home: home.clone(), h0: home.clone(), v: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)), tag: ix === 0 }); }
  const lblS = labelSprite(THREE, "Solid", "#9fe7ff"); lblS.position.set(0, 7.6, 0); S.scene.add(lblS);
  const stateOf = t => t < 0.3 ? "Solid" : t < 0.62 ? "Liquid" : "Gas"; const STEXT = { Solid: "Particles are tightly packed in a fixed pattern and only vibrate on the spot. A solid cannot be compressed.", Liquid: "Particles are close together but slide over each other. A liquid takes the shape of its container and cannot be compressed.", Gas: "Particles are far apart and move fast in all directions. A gas fills its container and can be compressed." };
  Object.values(STEXT).forEach(T); ["Solid", "Liquid", "Gas"].forEach(T);
  const ts = $("#paTemp"), sq = $("#paSqueeze"); ts.addEventListener("input", e => { temp = +e.target.value / 100; }); sq.addEventListener("input", e => { squeeze = +e.target.value / 100; });
  $("#paMark").addEventListener("click", () => { marked = true; parts.forEach(p => { p.m.material.color.setHex(p.tag ? 0xff9f1c : 0x4fa3ff); p.tag0 = p.tag; }); $("#paMark").textContent = T("Left-hand particles marked"); });
  $$("#paPreset button").forEach(b => b.addEventListener("click", () => { temp = +b.dataset.t; ts.value = temp * 100; }));
  let last = performance.now(), kick = 0, wallMsg = 0;
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.033, (now - last) / 1000); last = now; kick += dt;
    const st = stateOf(temp); seen.add(st); const minH = st === "Gas" ? 2.4 : 2.95; const wantH = H0 - squeeze * (H0 - 2.4); H += (Math.max(wantH, minH) - H) * Math.min(1, dt * 6); const comp = (H0 - H) / (H0 - 2.4); if (st === "Gas") maxComp = Math.max(maxComp, comp);
    piston.position.y = H + 0.12; rod.position.y = H + 2.1; box.scale.y = H; box.position.y = H / 2; frameM.scale.y = H; frameM.position.y = H / 2;
    const k = st === "Solid" ? 24 : st === "Liquid" ? 1.4 : 0; const sp = st === "Solid" ? 0.25 + temp * 2 : st === "Liquid" ? 1.1 + (temp - 0.3) * 4 : 3 + (temp - 0.62) * 14;
    if (st === "Liquid" && kick > 0.35) { kick = 0; parts.forEach(p => { p.home.set(clamp(p.home.x + rnd(-0.9, 0.9), -W + 0.3, W - 0.3), clamp(p.home.y + rnd(-0.5, 0.5), 0.3, 2.4), clamp(p.home.z + rnd(-0.7, 0.7), -D + 0.3, D - 0.3)); }); }
    if (st === "Solid") parts.forEach(p => p.home.copy(p.h0));
    let imp = 0;
    parts.forEach(p => {
      const v = p.v, pos = p.m.position;
      if (k > 0) { v.addScaledVector(new THREE.Vector3().subVectors(p.home, pos), k * dt); v.multiplyScalar(1 - Math.min(0.9, dt * (st === "Solid" ? 5 : 2.2))); v.x += rnd(-1, 1) * sp * dt * 6; v.y += rnd(-1, 1) * sp * dt * 6; v.z += rnd(-1, 1) * sp * dt * 6; if (st === "Liquid") v.y -= 5 * dt; }
      else { const l = v.length() || 1; v.multiplyScalar(1 + (sp / l - 1) * Math.min(1, dt * 3)); }
      pos.addScaledVector(v, dt);
      const lo = new THREE.Vector3(-W + 0.24, 0.24, -D + 0.24), hi = new THREE.Vector3(W - 0.24, H - 0.24, D - 0.24);
      ["x", "y", "z"].forEach(a => { if (pos[a] < lo[a]) { pos[a] = lo[a]; if (v[a] < 0) { imp += -v[a]; v[a] *= -0.9; } } else if (pos[a] > hi[a]) { pos[a] = hi[a]; if (v[a] > 0) { imp += v[a]; v[a] *= -0.9; } } });
      const c = st === "Solid" ? 0x4fa3ff : st === "Liquid" ? 0x3ec9a7 : 0xff6b4a; if (!marked || !p.tag) p.m.material.color.setHex(c);
    });
    impAcc += imp; wallMsg += dt; if (wallMsg > 0.25) { pressure = pressure * 0.6 + (impAcc / wallMsg / (W * D * 2 + (W + D) * H * 2)) * 0.4 * 3.2; impAcc = 0; wallMsg = 0; $("#paPres").style.width = clamp(pressure * 1.6, 0, 100) + "%"; setText($("#paPresT"), (pressure / 10).toFixed(1)); }
    if (marked) { const xs = parts.filter(p => p.tag).map(p => p.m.position.x); const mean = xs.reduce((a, b) => a + b, 0) / xs.length; const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length); const mx = (mean + W) / (2 * W); setText($("#paSpread"), Math.round(clamp(sd / 1.7 * 100, 0, 100)) + "%"); if (st === "Gas" && sd > 1.4) hotSpread = true; }
    setText($("#paState"), T(st)); lblS.material.map && 0;
    if (info.dataset.s !== st) { info.dataset.s = st; info.innerHTML = `<b>${T(st)}</b><p>${T(STEXT[st])}</p>`; }
    if (seen.size >= 3 && maxComp >= 0.5 && hotSpread) award("particles");
  })();
}
