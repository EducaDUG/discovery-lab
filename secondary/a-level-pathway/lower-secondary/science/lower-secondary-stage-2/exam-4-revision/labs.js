/* Exam 4 revision: the hyper-real 3D hero and the three live labs (Neutralisation Lab, Circuit Workshop, Current Lab).
   Plain ES module on engine/revision-kit.js (make3D with real:true = ACES tone mapping, soft shadows, studio environment). */
import { $, $$, el, rnd, clamp, popIt, burstOn, T, isES, rafLoop, make3D, glowTexture, labelSprite, reduced } from "../../../../../../engine/revision-kit.js?v=16";
import { PHCOL, phColour, makeBeaker, makeBubbles, addBench, makeBulb, makeCell, wire, glassMat } from "./scene.js?v=4";

const saltName = (b, a) => { const c = T(BASES[b][1]), an = T(ACIDS[a][1]); return isES() ? an.charAt(0).toUpperCase() + an.slice(1) + " de " + c.toLowerCase() : c + " " + an; };
const hex = n => "#" + n.toString(16).padStart(6, "0");

/* ================================================================ HERO: a lab bench with a fizzing beaker and a glowing bulb */
export function buildHero() {
  const host = $("#heroStage"); if (!host) return;
  const S = make3D(host, { cam: [0, 5.2, 11.5], target: [0, 1.4, 0], auto: 0.16, bg: 0x141c2b, real: true, hint: "Drag sideways to turn the bench" });
  if (!S) return; const THREE = S.THREE; S.scene.fog = new THREE.Fog(0x141c2b, 22, 48);
  addBench(THREE, S.scene, 24, 12);
  const beaker = makeBeaker(THREE, { r: 1.6, h: 3.6 }); beaker.position.set(-2.6, 0, 0); S.scene.add(beaker);
  const fizz = makeBubbles(THREE, 1.4, 3.6, 110); fizz.position.set(-2.6, 0, 0); S.scene.add(fizz);
  const bulb = makeBulb(THREE); bulb.position.set(3.2, 0, 0.3); bulb.traverse(o => { if (o.isMesh) o.castShadow = true; }); S.scene.add(bulb);
  const cell = makeCell(THREE, 2.1); cell.position.set(0.4, 0.45, 2.2); S.scene.add(cell);
  const red = 0xc0392b, blk = 0x20242b;
  S.scene.add(wire(THREE, new THREE.Vector3(1.5, 0.45, 2.2), new THREE.Vector3(3.2, 0.12, 2.2), red), wire(THREE, new THREE.Vector3(3.2, 0.12, 2.2), new THREE.Vector3(3.2, 0.12, 0.3), red));
  S.scene.add(wire(THREE, new THREE.Vector3(-0.7, 0.45, 2.2), new THREE.Vector3(-0.7, 0.12, 0.3), blk), wire(THREE, new THREE.Vector3(-0.7, 0.12, 0.3), new THREE.Vector3(2.7, 0.12, 0.3), blk));
  const lab = labelSprite(THREE, T("Acid + base"), "#9fe7ff"); lab.position.set(-2.6, 4.6, 0); S.scene.add(lab);
  const lab2 = labelSprite(THREE, T("Complete circuit"), "#ffe9a8"); lab2.position.set(3.2, 3.6, 0); S.scene.add(lab2);
  S.onFrameHook = null;
  let t0 = performance.now();
  (function loop() {
    requestAnimationFrame(loop); const t = (performance.now() - t0) / 1000; const ph = (Math.sin(t * 0.35) * 0.5 + 0.5) * 13 + 0.5;
    beaker.userData.set(0.62, phColour(ph)); fizz.userData.rate = 0.55 + Math.sin(t * 0.9) * 0.3; fizz.update(0.016, 0.62);
    bulb.userData.set(0.55 + Math.sin(t * 1.3) * 0.45 * (reduced() ? 0 : 1));
  })();
}

/* ================================================================ LAB 1: NEUTRALISATION LAB (3D) */
const ACIDS = { hcl: ["Hydrochloric acid", "chloride", "strong", "HCl"], h2so4: ["Sulfuric acid", "sulfate", "strong", "H₂SO₄"], hno3: ["Nitric acid", "nitrate", "strong", "HNO₃"], vin: ["Vinegar (ethanoic acid)", "ethanoate", "weak", "CH₃COOH"] };
const BASES = { naoh: ["Sodium hydroxide", "Sodium", "alkali"], koh: ["Potassium hydroxide", "Potassium", "alkali"], caoh: ["Calcium hydroxide", "Calcium", "alkali"], mgo: ["Magnesium oxide", "Magnesium", "base"], soda: ["Baking soda (sodium hydrogencarbonate)", "Sodium", "carbonate"] };
function indicatorColour(k, pH) {
  if (k === "ui") return phColour(pH);
  if (k === "phen") return pH < 8.2 ? 0xe8f2f8 : pH > 10 ? 0xff2d9b : 0xf7a8d4;
  if (k === "mo") return pH < 3.1 ? 0xe4261c : pH > 4.4 ? 0xffc928 : 0xf27a1c;
  return pH < 5 ? 0xe53935 : pH > 8 ? 0x2e63d6 : 0x9b5fc0; /* litmus */
}
function titrationPH(acid, f) { /* f = volume of base added / volume needed to neutralise */
  if (ACIDS[acid][2] === "weak") { if (f < 0.02) return 2.9 + f / 0.02 * 1.1; if (f < 0.98) return 4.76 + Math.log10(f / (1 - f)); if (f < 1.02) return 7.5 + (f - 0.98) / 0.04 * 1.5; return 14 + Math.log10(0.1 * (f - 1) / (1 + f)); }
  const strong = x => x < 1 ? clamp(-Math.log10(Math.max(1e-7, 0.1 * (1 - x) / (1 + x))), 1, 7) : clamp(14 + Math.log10(Math.max(1e-7, 0.1 * (x - 1) / (1 + x))), 7, 13.7);
  if (f <= 0.96) return strong(f); if (f >= 1.04) return strong(f); const a = strong(0.96), b = strong(1.04); return a + (b - a) * (f - 0.96) / 0.08; /* smoothed equivalence region */
}
export function buildNeutral(award) {
  const host = $("#neuStage"); const tip = $("#neuTip"), info = $("#neuInfo");
  const aSel = $("#neuAcid"), bSel = $("#neuBase"), iSel = $("#neuInd");
  aSel.innerHTML = Object.keys(ACIDS).map(k => `<option value="${k}">${T(ACIDS[k][0])}</option>`).join(""); bSel.innerHTML = Object.keys(BASES).map(k => `<option value="${k}">${T(BASES[k][0])}</option>`).join("");
  const S = make3D(host, { cam: [0, 6.8, 13.5], target: [0, 4.9, 0], auto: 0.0, bg: 0x141c2b, real: true, hint: null });
  let added = 0, drip = false, done = new Set(), rows = [], rec = new Set(), over = false;
  const f = () => added / 25;
  const pH = () => titrationPH(aSel.value, f());
  function update3D() { }
  let beaker, fizz, tubeLiq, drops = [], THREE, probeLbl;
  if (S) {
    THREE = S.THREE; S.scene.fog = new THREE.Fog(0x141c2b, 24, 50); S.spin = 0; addBench(THREE, S.scene, 24, 12);
    beaker = makeBeaker(THREE, { r: 2.1, h: 3.8 }); S.scene.add(beaker); fizz = makeBubbles(THREE, 1.9, 3.8, 160); S.scene.add(fizz);
    /* burette: a tall glass tube on a retort stand, with a tap */
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 10.5, 10), new THREE.MeshStandardMaterial({ color: 0x8892a0, metalness: 0.9, roughness: 0.3 })); stand.position.set(3.6, 5.2, -0.8); stand.castShadow = true; S.scene.add(stand);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 2.2), new THREE.MeshStandardMaterial({ color: 0x20242b, metalness: 0.6, roughness: 0.5 })); foot.position.set(3, 0.12, -0.8); foot.castShadow = true; S.scene.add(foot);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.14), stand.material); arm.position.set(1.8, 9.2, -0.8); S.scene.add(arm);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 6.6, 20, 1, true), glassMat(THREE)); tube.position.set(0, 7, 0); tube.renderOrder = 3; S.scene.add(tube);
    tubeLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1, 16), new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.85, roughness: 0.1 })); S.scene.add(tubeLiq);
    const tap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: 0xc98a4b, metalness: 0.9, roughness: 0.3 })); tap.position.set(0, 3.55, 0); S.scene.add(tap);
    const tip3 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.03, 0.5, 10), glassMat(THREE, { opacity: 0.5 })); tip3.position.set(0, 3.2, 0); S.scene.add(tip3);
    const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 12), new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.4, metalness: 0.4 })); probe.position.set(-1.1, 3.2, 0.2); probe.rotation.z = 0.12; probe.castShadow = true; S.scene.add(probe);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: 0xffffff })); pad.visible = false;
  } else tip.textContent = T("3D view is not available on this device. Everything else on the page still works.");
  const pHWord = p => p < 6.5 ? "acid" : p > 7.5 ? "alkali" : "neutral";
  function status() {
    const p = pH(), a = aSel.value, b = bSel.value, rec1 = ACIDS[a], base = BASES[b];
    $("#neuPH").textContent = p.toFixed(1); $("#neuPH").style.color = hex(phColour(p)); $("#neuVol").textContent = added.toFixed(1) + " mL";
    const carb = base[2] === "carbonate"; const salt = saltName(b, a);
    if (p >= 6 && p <= 8.5) { info.innerHTML = `<b>${T("Neutralised!")}</b><p>${T(ACIDS[a][0])} + ${T(base[0])} → ${salt} + ${T("water")}${carb ? " + " + T("carbon dioxide") : ""}. ${T("The pH is about 7: no acid or alkali is left over.")}</p>`; mark(a, b, p); }
    else if (p > 8.5) info.innerHTML = `<b>${T("Too much base!")}</b><p>${T("The mixture is now alkaline. Press Start again and add the base more slowly near pH 7.")}</p>`;
    else info.innerHTML = `<b>${T("Still acidic")}</b><p>${T("Keep adding the base a little at a time and watch the indicator change colour.")}</p>`;
  }
  function mark(a, b, p) {
    const key = a + "|" + b; if (done.has(key)) return; done.add(key); const base = BASES[b], rec1 = ACIDS[a];
    rows.push([T(rec1[0]), T(base[0]), saltName(b, a), p.toFixed(1)]); $("#neuRec").innerHTML = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");
    const acids = new Set([...done].map(x => x.split("|")[0])); if (done.size >= 3 && acids.size >= 2) award("neutral");
    if (S) { burstOn($("#neuStage")); }
    tip.textContent = T("Neutralised! Pick another acid or base and try again.");
  }
  function reset() { added = 0; drip = false; $("#neuDrip").textContent = T("Hold to add the base"); status(); }
  aSel.addEventListener("change", reset); bSel.addEventListener("change", reset); iSel.addEventListener("change", status); $("#neuReset").addEventListener("click", reset);
  const dripBtn = $("#neuDrip"); const on = e => { drip = true; e.preventDefault(); }, off = () => { drip = false; };
  dripBtn.addEventListener("pointerdown", on); addEventListener("pointerup", off); dripBtn.addEventListener("pointerleave", off); dripBtn.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { drip = true; e.preventDefault(); } }); dripBtn.addEventListener("keyup", () => { drip = false; });
  $("#neuSmall").addEventListener("click", () => { const near = Math.abs(added - 25) < 2.5; added = Math.min(40, added + (near ? 0.1 : 0.5)); popIt($("#neuSmall")); status(); });
  const sl = $("#neuLevel"); if (sl) sl.addEventListener("input", e => { added = +e.target.value / 10; status(); });
  let acc = 0, lastP = 1, cur = new (window.THREE ? window.THREE.Color : Object)(0xe53935);
  if (S) {
    S.onFrameHook = null;
    const THREEc = S.THREE; cur = new THREEc.Color(0xe53935);
    (function loop() {
      requestAnimationFrame(loop); const dt = 0.016;
      if (drip && added < 40) { acc += dt; if (acc > 0.07) { acc = 0; const near = Math.abs(added - 25) < 2.5; added = Math.min(40, added + (near ? 0.1 : 0.5)); status(); if (S) { const d = new THREEc.Mesh(new THREEc.SphereGeometry(0.1, 10, 8), new THREEc.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.9, roughness: 0.1 })); d.position.set(0, 3.0, 0); d.userData.v = 0; S.scene.add(d); drops.push(d); } } }
      drops = drops.filter(d => { d.userData.v += 0.02; d.position.y -= d.userData.v; if (d.position.y < 2.9 - (0 )&& d.position.y < 0.62 * 3.8 * 0.82 + 0.18) { S.scene.remove(d); return false; } return true; });
      const p = pH(); const target = new THREEc.Color(indicatorColour(iSel.value, p)); cur.lerp(target, 0.12); const lv = clamp(0.35 + added / 40 * 0.3, 0, 1);
      beaker.userData.set(lv, cur.getHex()); const carb = BASES[bSel.value][2] === "carbonate"; fizz.userData.rate = (carb && (drip || added > 0) && p < 7.2) ? (drip ? 1 : 0.35) : 0; fizz.update(dt, lv);
      tubeLiq.scale.y = Math.max(0.02, (1 - added / 40) * 6.4); tubeLiq.position.set(0, 3.7 + tubeLiq.scale.y / 2, 0);
      if (probeLbl && Math.abs(p - lastP) > 0.05) { lastP = p; }
    })();
  }
  status(); reset();
}

/* ================================================================ LAB 2: CIRCUIT WORKSHOP (3D) */
export function buildCircuit(award) {
  const host = $("#cirStage"); const tip = $("#cirTip"); const S = make3D(host, { cam: [0, 10.5, 12.5], target: [0, 0.5, 0.2], auto: 0, bg: 0x141c2b, real: true, hint: null, onPick: rc => pickBulb(rc) });
  if (!S) { tip.textContent = T("3D view is not available on this device. Everything else on the page still works."); }
  let mode = "series", nB = 2, nC = 1, closed = true; const blown = [false, false, false]; const flags = {};
  const R = 3, Vc = 1.5;
  let THREE, group, bulbs = [], electrons = [], segs = [], leverMesh, flowT = 0, stored = null;
  function calc() {
    const V = Vc * nC; const act = [0, 1, 2].slice(0, nB).map(i => !blown[i]);
    if (!closed) return { V, I: 0, branch: act.map(() => 0), vb: act.map(() => 0), P: act.map(() => 0) };
    if (mode === "series") { const ok = act.every(a => a); const I = ok ? V / (R * nB) : 0; return { V, I, branch: act.map(() => I), vb: act.map(() => ok ? I * R : 0), P: act.map(() => I * I * R) }; }
    const m = act.filter(Boolean).length; const Ib = V / R; return { V, I: m * Ib, branch: act.map(a => a ? Ib : 0), vb: act.map(a => a ? V : 0), P: act.map(a => a ? Ib * Ib * R : 0) };
  }
  const P0 = 0.75;
  function rebuild() {
    if (!S) return; THREE = S.THREE; if (group) S.scene.remove(group); group = new THREE.Group(); S.scene.add(group); bulbs = []; segs = []; electrons = [];
    const v3 = (x, z, y = 0.12) => new THREE.Vector3(x, y, z); const RED = 0xc0392b, BLK = 0x20242b;
    const board = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 8.6), new THREE.MeshStandardMaterial({ color: 0x0a2820, roughness: 0.7 })); board.position.y = -0.15; board.receiveShadow = true; group.add(board);
    const addW = (a, b, c = RED) => group.add(wire(THREE, a, b, c));
    /* cells along the bottom edge, positive end on the right */
    const len = 1.7 * nC; for (let i = 0; i < nC; i++) { const c = makeCell(THREE, 1.7); c.position.set(-len / 2 + 0.85 + i * 1.7, 0.45, 3.2); group.add(c); }
    const xL = -len / 2 - 0.25, xR = len / 2 + 0.25;
    const lab = labelSprite(THREE, nC + (nC > 1 ? " cells " : " cell ") + (Vc * nC).toFixed(1) + " V", "#9fe7ff"); lab.position.set(0, 2.1, 3.2); group.add(lab);
    addW(v3(xR, 3.2), v3(5, 3.2)); addW(v3(5, 3.2), v3(5, -2.6)); addW(v3(-5, 3.2), v3(xL, 3.2), BLK);
    /* switch on the left edge */
    addW(v3(-5, 3.2), v3(-5, 1.1), BLK); addW(v3(-5, -0.3), v3(-5, -2.6), BLK);
    [1.1, -0.3].forEach(z => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.35, 14), new THREE.MeshStandardMaterial({ color: 0xc98a4b, metalness: 0.9, roughness: 0.3 })); p.position.set(-5, 0.2, z); group.add(p); });
    leverMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 1.55), new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.9, roughness: 0.25 })); leverMesh.castShadow = true; group.add(leverMesh);
    const bulbAt = (x, z, i) => { const b = makeBulb(THREE, { light: true }); b.position.set(x, 0, z); b.userData.idx = i; b.userData.blow(blown[i]); b.traverse(o => { if (o.isMesh) o.castShadow = true; }); group.add(b); bulbs.push(b); };
    if (mode === "series") {
      const xs = nB === 1 ? [0] : nB === 2 ? [-1.8, 1.8] : [-3, 0, 3]; addW(v3(5, -2.6), v3(-5, -2.6)); xs.forEach((x, i) => bulbAt(x, -2.6, i));
      segs = [{ pts: [v3(xR, 3.2, 0.5), v3(5, 3.2), v3(5, -2.6), v3(-5, -2.6), v3(-5, 3.2), v3(xL, 3.2, 0.5)], I: () => calc().I }];
    } else {
      const rows = [-2.6, -0.7, 1.2].slice(0, nB); addW(v3(5, -2.6), v3(3, -2.6)); addW(v3(-3, -2.6), v3(-5, -2.6), BLK);
      rows.forEach((z, i) => { addW(v3(3, z), v3(0.5, z)); addW(v3(-0.5, z), v3(-3, z), BLK); bulbAt(0, z, i); });
      if (nB > 1) { addW(v3(3, -2.6), v3(3, rows[nB - 1])); addW(v3(-3, -2.6), v3(-3, rows[nB - 1]), BLK); }
      segs.push({ pts: [v3(xR, 3.2, 0.5), v3(5, 3.2), v3(5, -2.6), v3(3, -2.6)], I: () => calc().I });
      segs.push({ pts: [v3(-3, -2.6), v3(-5, -2.6), v3(-5, 3.2), v3(xL, 3.2, 0.5)], I: () => calc().I });
      rows.forEach((z, i) => { segs.push({ pts: [v3(3, z), v3(-3, z)], I: () => calc().branch[i] }); if (i < nB - 1) { segs.push({ pts: [v3(3, z), v3(3, rows[i + 1])], I: () => calc().branch.slice(i + 1).reduce((a, b) => a + b, 0) }); segs.push({ pts: [v3(-3, rows[i + 1]), v3(-3, z)], I: () => calc().branch.slice(i + 1).reduce((a, b) => a + b, 0) }); } });
    }
    /* electrons: charge carriers drawn as blue glowing points that flow in the conventional current direction */
    segs.forEach(s => { s.len = 0; s.cum = [0]; for (let i = 1; i < s.pts.length; i++) { s.len += s.pts[i].distanceTo(s.pts[i - 1]); s.cum.push(s.len); } s.n = Math.max(3, Math.round(s.len * 1.4)); s.off = Math.random(); });
    const total = segs.reduce((a, s) => a + s.n, 0); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x66d9ff, size: 0.26, map: glowTexture(THREE, "102,217,255"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; group.add(pts); electrons = { pts, total };
    stored = { flowT: 0 };
    lever(); readouts();
  }
  function lever() { if (!leverMesh) return; leverMesh.position.set(-5, 0.35, 0.4); leverMesh.rotation.set(closed ? 0 : -0.7, 0, 0); leverMesh.position.y = closed ? 0.32 : 0.8; leverMesh.position.z = closed ? 0.4 : 0.05; }
  function readouts() {
    const c = calc(); $("#cirI").textContent = c.I.toFixed(2) + " A"; $("#cirV").textContent = c.V.toFixed(1) + " V";
    $("#cirBulbs").innerHTML = bulbs.length ? c.vb.slice(0, nB).map((v, i) => `<li><b>${T("Bulb")} ${i + 1}</b>: ${v.toFixed(2)} V · ${c.branch[i].toFixed(2)} A · ${blown[i] ? T("blown") : (c.P[i] / P0 > 0.02 ? T("lit") : T("off"))}</li>`).join("") : "";
    const bright = c.P.map(p => clamp(Math.sqrt(p / P0) * 0.65, 0, 1)); bulbs.forEach((b, i) => { b.userData.blow(blown[i]); b.userData.set(bright[i]); });
    let msg;
    if (!closed) msg = "The switch is open, so the circuit is broken and no current flows.";
    else if (mode === "series") msg = blown.slice(0, nB).some(Boolean) ? "A blown bulb breaks the only loop, so every bulb goes out." : nB > 1 ? "Series: the same current flows through every bulb, and the cell's voltage is shared between them, so the bulbs are dimmer." : "One bulb on one cell. This is the reference brightness.";
    else msg = nB > 1 ? "Parallel: every bulb gets the full cell voltage, so each is as bright as a single bulb. The cell supplies more current in total, and a blown bulb leaves the others on." : "One bulb on one cell. This is the reference brightness.";
    $("#cirInfo").innerHTML = `<b>${T(mode === "series" ? "Series circuit" : "Parallel circuit")}</b><p>${T(msg)}</p>`;
    tasks();
  }
  function tasks() {
    const c = calc(), anyB = blown.slice(0, nB).some(Boolean);
    if (mode === "series" && nB === 3 && closed && !anyB) flags.s3 = 1; if (mode === "parallel" && nB === 3 && closed && !anyB) flags.p3 = 1;
    if (mode === "series" && nB >= 2 && anyB) flags.sb = 1; if (mode === "parallel" && nB >= 2 && anyB && c.I > 0) flags.pb = 1;
    if (nC >= 2 && closed) flags.cell = 1; if (!closed) flags.sw = 1;
    const T5 = [["s3", "Build a series circuit with 3 bulbs"], ["p3", "Build a parallel circuit with 3 bulbs"], ["sb", "Blow a bulb in a series circuit"], ["pb", "Blow a bulb in a parallel circuit"], ["cell", "Add a second cell"], ["sw", "Open the switch"]];
    $("#cirTasks").innerHTML = T5.map(t => `<li class="${flags[t[0]] ? "done" : ""}">${T(t[1])}</li>`).join("");
    if (T5.every(t => flags[t[0]])) award("circuit");
  }
  function pickBulb(rc) { if (!group) return; const meshes = []; bulbs.forEach(b => b.traverse(o => { if (o.isMesh) { o.userData.bi = b.userData.idx; meshes.push(o); } })); const hit = rc.intersectObjects(meshes, false)[0]; if (hit) { const i = hit.object.userData.bi; blown[i] = !blown[i]; readouts(); popIt($("#cirStage")); } }
  $$("#cirMode button").forEach(b => b.addEventListener("click", () => { mode = b.dataset.m; $$("#cirMode button").forEach(x => x.setAttribute("aria-pressed", x === b)); rebuild(); }));
  $("#cirBulbN").addEventListener("input", e => { nB = +e.target.value; $("#cirBulbL").textContent = nB; rebuild(); });
  $("#cirCellN").addEventListener("input", e => { nC = +e.target.value; $("#cirCellL").textContent = nC; rebuild(); });
  $("#cirSwitch").addEventListener("click", () => { closed = !closed; $("#cirSwitch").textContent = closed ? T("Open the switch") : T("Close the switch"); lever(); readouts(); });
  $$("#cirBlow button").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i; if (i < nB) { blown[i] = !blown[i]; readouts(); } }));
  $("#cirFix").addEventListener("click", () => { blown.fill(false); readouts(); });
  if (!S) { readouts(); return; }
  rebuild();
  let last = performance.now();
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; if (!electrons.pts) return;
    const arr = electrons.pts.geometry.attributes.position.array; let k = 0;
    segs.forEach(s => { const I = s.I(); s.off = (s.off + dt * I * 1.5 * (reduced() ? 0.3 : 1) / Math.max(1, s.len) * 3) % 1; for (let i = 0; i < s.n; i++) { let u = ((i / s.n) + s.off) % 1; const d = u * s.len; let j = 1; while (j < s.cum.length - 1 && s.cum[j] < d) j++; const a = s.pts[j - 1], b = s.pts[j], t = (d - s.cum[j - 1]) / Math.max(1e-6, s.cum[j] - s.cum[j - 1]); arr[k++] = a.x + (b.x - a.x) * t; arr[k++] = a.y + (b.y - a.y) * t + 0.12; arr[k++] = a.z + (b.z - a.z) * t; if (I < 0.001) arr[k - 2] = -9; } });
    electrons.pts.geometry.attributes.position.needsUpdate = true; electrons.pts.visible = calc().I > 0.001;
  })();
}

/* ================================================================ LAB 3: CURRENT LAB (canvas) */
export function buildCurrent(award) {
  const cv = $("#curCanvas"), vS = $("#curV"), rS = $("#curR"); let V = 6, Rr = 3; const hits = new Set();
  const TARGETS = [[3, 12, 4], [1.5, 6, 4], [0.5, 6, 12], [4, 12, 3], [2, 6, 3], [1, 9, 9]]; let ti = 0, solved = 0, flash = 0;
  const cur = () => V / Rr;
  function label() { $("#curVL").textContent = V.toFixed(1); $("#curRL").textContent = Rr; const I = cur(); $("#curEq").innerHTML = `V = I × R<br><b>${V.toFixed(1)} V = ${I.toFixed(2)} A × ${Rr} Ω</b>`; const t = TARGETS[ti % TARGETS.length]; $("#curTarget").textContent = `${T("Target")}: ${t[0]} A`; }
  function check() { const t = TARGETS[ti % TARGETS.length]; if (Math.abs(cur() - t[0]) < 0.06) { solved++; flash = 1; burstOn($("#curCanvas")); ti++; $("#curScore").textContent = solved + " / 4"; if (solved >= 4) award("current"); label(); } }
  vS.addEventListener("input", e => { V = +e.target.value; label(); check(); }); rS.addEventListener("input", e => { Rr = +e.target.value; label(); check(); });
  $("#curNext").addEventListener("click", () => { ti++; label(); });
  label(); let phase = 0;
  const loop = [[60, 80], [560, 80], [560, 330], [60, 330]]; const LEN = 500 * 2 + 250 * 2;
  const at = d => { d = ((d % LEN) + LEN) % LEN; for (let i = 0; i < 4; i++) { const a = loop[i], b = loop[(i + 1) % 4], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]; d -= l; } return loop[0]; };
  rafLoop(cv, (ctx, dt) => {
    const I = cur(); phase += dt * I * 38 * (reduced() ? 0.3 : 1); flash = Math.max(0, flash - dt * 1.4);
    ctx.clearRect(0, 0, 640, 420); const bg = ctx.createLinearGradient(0, 0, 0, 420); bg.addColorStop(0, "#1b2433"); bg.addColorStop(1, "#0b0f18"); ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 420);
    ctx.strokeStyle = "#b87333"; ctx.lineWidth = 9; ctx.lineJoin = "round"; ctx.beginPath(); loop.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke(); ctx.strokeStyle = "#e0a96d"; ctx.lineWidth = 3; ctx.stroke();
    /* cell on the left */
    ctx.fillStyle = "#101826"; ctx.fillRect(40, 170, 40, 90); ctx.fillStyle = "#1f3f8a"; ctx.fillRect(44, 176, 32, 78); ctx.fillStyle = "#ffd23f"; ctx.fillRect(44, 196, 32, 14); ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.fillText("+", 54, 170); ctx.fillText(V.toFixed(1) + " V", 30, 285);
    /* resistor on the bottom: glows with heat */
    const heat = clamp(I * I * Rr / 40, 0, 1); ctx.fillStyle = `rgb(${90 + heat * 165},${60 + heat * 30},${40})`; ctx.fillRect(250, 312, 120, 36); if (heat > 0.05) { const g = ctx.createRadialGradient(310, 330, 4, 310, 330, 90); g.addColorStop(0, `rgba(255,120,40,${heat * 0.8})`); g.addColorStop(1, "rgba(255,120,40,0)"); ctx.fillStyle = g; ctx.fillRect(200, 250, 220, 160); }
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText(Rr + " Ω", 288, 368);
    /* bulb on the top */
    const br = clamp(I * I * Rr / 30, 0, 1); const g2 = ctx.createRadialGradient(310, 80, 4, 310, 80, 20 + br * 90); g2.addColorStop(0, `rgba(255,230,150,${0.3 + br * 0.7})`); g2.addColorStop(1, "rgba(255,200,80,0)"); ctx.fillStyle = g2; ctx.fillRect(190, 0, 240, 190);
    ctx.fillStyle = `rgba(255,${210 + br * 40},${120 + br * 80},${0.35 + br * 0.65})`; ctx.beginPath(); ctx.arc(310, 80, 24, 0, 6.28); ctx.fill(); ctx.strokeStyle = "#fff8"; ctx.lineWidth = 3; ctx.stroke();
    /* electrons in the conventional current direction */
    const n = 46; for (let i = 0; i < n; i++) { const p = at(phase + i * LEN / n); ctx.fillStyle = "rgba(102,217,255,.95)"; ctx.shadowColor = "#66d9ff"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 6.28); ctx.fill(); } ctx.shadowBlur = 0;
    /* ammeter dial */
    const cx = 500, cy = 235, rr = 84; ctx.fillStyle = "#eef2f6"; ctx.beginPath(); ctx.arc(cx, cy, rr + 12, 0, 6.28); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.28); ctx.fill();
    for (let i = 0; i <= 12; i++) { const a = Math.PI * 0.85 + i / 12 * Math.PI * 1.3; ctx.strokeStyle = "#223"; ctx.lineWidth = i % 2 ? 1.5 : 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (rr - 6), cy + Math.sin(a) * (rr - 6)); ctx.lineTo(cx + Math.cos(a) * (rr - (i % 2 ? 14 : 20)), cy + Math.sin(a) * (rr - (i % 2 ? 14 : 20))); ctx.stroke(); if (i % 2 === 0) { ctx.fillStyle = "#223"; ctx.font = "bold 12px sans-serif"; ctx.fillText(String(i), cx + Math.cos(a) * (rr - 34) - 6, cy + Math.sin(a) * (rr - 34) + 4); } }
    const na = Math.PI * 0.85 + clamp(I, 0, 12) / 12 * Math.PI * 1.3; ctx.strokeStyle = "#d32f2f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na) * (rr - 10), cy + Math.sin(na) * (rr - 10)); ctx.stroke(); ctx.fillStyle = "#223"; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 6.28); ctx.fill(); ctx.fillText("A", cx - 5, cy + 30); ctx.font = "bold 18px sans-serif"; ctx.fillText(I.toFixed(2) + " A", cx - 30, cy + 58);
    if (flash > 0) { ctx.fillStyle = `rgba(125,255,176,${flash * 0.35})`; ctx.fillRect(0, 0, 640, 420); ctx.fillStyle = "#fff"; ctx.font = "bold 34px sans-serif"; ctx.fillText(T("On target!"), 230, 220); }
  });
}
