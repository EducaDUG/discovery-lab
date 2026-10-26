/* Exam 6 revision: the hyper-real 3D hero and four live labs (Spring Lab, Friction Lab, Pressure Lab, Natural Selection Lab).
   Plain ES modules on engine/revision-kit.js (make3D with real:true = ACES tone mapping, soft shadows, studio environment).
   Rule: never write to the DOM every frame without a change check (see setText/setHTML): in Spanish mode observeDom() re-translates on each mutation. */
import { $, $$, el, rnd, clamp, popIt, burstOn, T, isES, make3D, glowTexture, labelSprite, reduced } from "../../../../../../engine/revision-kit.js?v=19";

const setText = (e, v) => { if (e.textContent !== v) e.textContent = v; };
const setHTML = (e, v) => { if (e.dataset.h !== v) { e.dataset.h = v; e.innerHTML = v; } };
function darkFloor(THREE, scene, y = -0.6) { const m = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 }); m.envMapIntensity = 0.12; const f = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), m); f.rotation.x = -Math.PI / 2; f.position.y = y; f.receiveShadow = true; scene.add(f); return f; }
const steel = (THREE) => new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.9, roughness: 0.3 });

/* ---------------------------------------------------------------- a coil spring built as a helix tube */
export function makeSpring(THREE, coils = 16, radius = 0.45) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.95, roughness: 0.25 }); const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.castShadow = true; m.userData.len = -1;
  m.userData.set = len => { if (Math.abs(len - m.userData.len) < 0.004) return; m.userData.len = len; const pts = []; const N = coils * 14; for (let i = 0; i <= N; i++) { const t = i / N; const a = t * coils * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, -t * len, Math.sin(a) * radius)); } m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, 0.045, 7); };
  return m;
}
/* a retort-style stand: base, rod and top arm; returns the point where the spring hangs */
function buildStand(THREE, scene, h = 8) {
  const s = steel(THREE); const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0x20242b, metalness: 0.7, roughness: 0.4 })); base.position.set(-0.8, -0.15, 0); base.castShadow = base.receiveShadow = true; scene.add(base);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, h, 14), s); rod.position.set(-2.8, h / 2, 0); rod.castShadow = true; scene.add(rod);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 14), s); arm.rotation.z = Math.PI / 2; arm.position.set(-1.2, h, 0); arm.castShadow = true; scene.add(arm);
  return new THREE.Vector3(0.4, h - 0.1, 0);
}
function rulerTexture(THREE, cm = 60) {
  const c = document.createElement("canvas"); c.width = 128; c.height = 1024; const x = c.getContext("2d"); x.fillStyle = "#f4ecd2"; x.fillRect(0, 0, 128, 1024); x.fillStyle = "#222"; x.font = "bold 22px sans-serif";
  for (let i = 0; i <= cm; i++) { const y = 10 + i / cm * 1000; const w = i % 10 === 0 ? 60 : i % 5 === 0 ? 42 : 24; x.fillRect(0, y, w, 2); if (i % 10 === 0) x.fillText(String(i), 66, y + 8); }
  const t = new THREE.CanvasTexture(c); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t;
}

/* ================================================================ HERO: spring and slotted masses */
export function buildHero() {
  const host = $("#heroStage"); if (!host) return;
  const S = make3D(host, { cam: [0, 4.5, 12], target: [0, 3.6, 0], auto: 0.14, bg: 0x111a2a, real: true, hint: "Drag sideways to turn the bench" });
  if (!S) return; const THREE = S.THREE; S.scene.fog = new THREE.Fog(0x111a2a, 22, 50); darkFloor(THREE, S.scene, -0.3);
  const top = buildStand(THREE, S.scene, 8); const sp = makeSpring(THREE, 16, 0.45); sp.position.copy(top); S.scene.add(sp);
  const hang = new THREE.Group(); S.scene.add(hang); const brass = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.85, roughness: 0.3 });
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20), steel(THREE)); hook.position.y = 0.1; hang.add(hook); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 10), steel(THREE)); rod.position.y = -0.6; hang.add(rod);
  for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 28), brass); d.position.y = -0.8 - i * 0.2; d.castShadow = true; hang.add(d); }
  const t0 = performance.now(); const L0 = 3.2;
  (function loop() { requestAnimationFrame(loop); const t = (performance.now() - t0) / 1000; const e = 2.2 + (reduced() ? 0 : Math.cos(t * 2.4) * 0.6 * Math.exp(-((t % 12) * 0.04))); const len = L0 + e; sp.userData.set(len); hang.position.set(top.x, top.y - len, 0); })();
}

/* ================================================================ LAB 1: SPRING AND WEIGHT LAB */
const SPRINGS = { soft: [20, 6, "Soft spring"], medium: [50, 8, "Medium spring"], stiff: [100, 12, "Stiff spring"] };
const PLANETS = { earth: [10, "Earth"], moon: [1.6, "Moon"], mars: [3.7, "Mars"], jupiter: [25, "Jupiter"] };
export function buildSpring(award) {
  const host = $("#spStage"), info = $("#spInfo"), graph = $("#spGraph");
  ["Soft spring", "Medium spring", "Stiff spring", "Earth", "Moon", "Mars", "Jupiter"].forEach(T);
  const S = make3D(host, { cam: [0, 5.2, 13], target: [0, 4.2, 0], auto: 0, bg: 0x111a2a, real: true, hint: null });
  let sk = "medium", pk = "earth", grams = 200, perm = 0, points = [], overs = false, usedMoon = false;
  const sel = $("#spSpring"), pl = $("#spPlanet"); sel.innerHTML = Object.keys(SPRINGS).map(k => `<option value="${k}">${T(SPRINGS[k][2])}</option>`).join(""); sel.value = sk; pl.innerHTML = Object.keys(PLANETS).map(k => `<option value="${k}">${T(PLANETS[k][1])}</option>`).join(""); pl.value = pk;
  const calc = () => { const [k, lim] = SPRINGS[sk]; const g = PLANETS[pk][0]; const m = grams / 1000, F = m * g; let e; if (F <= lim) e = F / k + perm; else e = lim / k + (F - lim) / (k * 0.35) + perm; return { k, lim, g, m, F, e, over: F > lim }; };
  function refresh() { const c = calc(); if (c.over) { overs = true; perm = Math.max(perm, (c.F - c.lim) / (c.k * 0.35) * 0.45); } info.dataset.o = ""; setHTML($("#spRead"), `<b>${T("Mass")}</b> ${c.m.toFixed(2)} kg · <b>${T("Weight")}</b> ${c.F.toFixed(1)} N · <b>${T("Extension")}</b> ${(c.e * 100).toFixed(1)} cm`); setHTML(info, c.over ? `<b>${T("Past the elastic limit!")}</b><p>${T("The spring is permanently stretched. Press Replace spring.")}</p>` : `<b>F = k × e</b><p>${c.F.toFixed(1)} N = ${c.k} N/m × ${c.e.toFixed(3)} m</p>`); setText($("#spMassL"), grams + " g"); drawGraph(); }
  $("#spMass").addEventListener("input", e => { grams = +e.target.value; refresh(); });
  sel.addEventListener("change", () => { sk = sel.value; perm = 0; refresh(); }); pl.addEventListener("change", () => { pk = pl.value; if (pk === "moon") usedMoon = true; refresh(); });
  $("#spFix").addEventListener("click", () => { perm = 0; refresh(); });
  $("#spRec").addEventListener("click", () => { const c = calc(); points.push([c.F, c.e * 100, c.over]); popIt($("#spRec")); $("#spTab").innerHTML = points.map(p => `<tr><td>${p[0].toFixed(1)}</td><td>${p[1].toFixed(1)}</td></tr>`).join(""); drawGraph(); check(); });
  $("#spClear").addEventListener("click", () => { points = []; $("#spTab").innerHTML = ""; drawGraph(); });
  function check() { if (points.length >= 5 && usedMoon && overs) award("spring"); }
  function drawGraph() { const g = graph.getContext("2d"), W = graph.width, H = graph.height; g.clearRect(0, 0, W, H); g.fillStyle = "#0e1624"; g.fillRect(0, 0, W, H); g.strokeStyle = "#ffffff44"; g.lineWidth = 1; g.beginPath(); g.moveTo(34, 8); g.lineTo(34, H - 24); g.lineTo(W - 8, H - 24); g.stroke(); g.fillStyle = "#a9c9bc"; g.font = "11px sans-serif"; g.fillText(T("Force (N)"), 4, 12); g.fillText(T("Extension (cm)"), W - 90, H - 6);
    const mx = 30, my = 40; const px = e => 34 + e / my * (W - 44), py = F => H - 24 - F / mx * (H - 38); points.forEach(p => { g.fillStyle = p[2] ? "#ff6b4a" : "#7dffd0"; g.beginPath(); g.arc(px(p[1]), py(p[0]), 4, 0, 6.28); g.fill(); }); const c = calc(); g.strokeStyle = "#ffd166"; g.lineWidth = 2; g.beginPath(); g.arc(px(c.e * 100), py(c.F), 6, 0, 6.28); g.stroke(); }
  if (!S) { setText($("#spRead"), T("3D view is not available on this device. Everything else on the page still works.")); refresh(); return; }
  const THREE = S.THREE; darkFloor(THREE, S.scene, -0.3); S.scene.fog = new THREE.Fog(0x111a2a, 24, 50); const top = buildStand(THREE, S.scene, 9);
  const sp = makeSpring(THREE, 14, 0.4); sp.position.copy(top); S.scene.add(sp);
  const hang = new THREE.Group(); S.scene.add(hang); const brass = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.85, roughness: 0.3 }); const hook = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20), steel(THREE)); hook.position.y = 0.1; hang.add(hook); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 10), steel(THREE)); rod.position.y = -0.6; hang.add(rod);
  const discs = []; for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.55 + (i % 2) * 0.05, 0.55 + (i % 2) * 0.05, 0.12, 28), brass); d.position.y = -0.8 - i * 0.14; d.castShadow = true; hang.add(d); discs.push(d); }
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 9), new THREE.MeshStandardMaterial({ map: rulerTexture(THREE, 60), roughness: 0.6 })); ruler.position.set(1.6, top.y - 8.3, 0.3); S.scene.add(ruler);
  const ptr = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0xff4d4d })); ptr.rotation.z = Math.PI / 2; S.scene.add(ptr);
  const L0 = 3.0, SC = 0.15; let disp = 0, vel = 0;
  refresh();
  let last = performance.now(); (function loop() { requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.03, (now - last) / 1000); last = now; const c = calc(); const target = c.e * 100 * SC; vel += (target - disp) * 90 * dt - vel * 6 * dt; disp += vel * dt; const len = L0 + Math.max(0, disp); sp.userData.set(len); hang.position.set(top.x, top.y - len, 0); const n = Math.round(grams / 100); discs.forEach((d, i) => d.visible = i < n); ptr.position.set(1.2, top.y - len - 0.8, 0.35); if (pk === "moon" && !sp.userData.m) sp.userData.m = 1; })();
}

/* ================================================================ LAB 2: FRICTION LAB */
const SURF = { ice: [0.03, "Ice", 0xcfe9ff], wood: [0.25, "Wood", 0x9b6a3a], grass: [0.4, "Grass", 0x3f8f3a], sandpaper: [0.7, "Rough sandpaper", 0xb48a52] };
export function buildFriction(award) {
  const host = $("#frStage"), cv = $("#frGraph"), info = $("#frInfo"); Object.values(SURF).forEach(s => T(s[1]));
  const S = make3D(host, { cam: [0, 3.2, 11], target: [0, 1.0, 0], auto: 0, bg: 0x111a2a, real: true, hint: null });
  let surf = "wood", F = 12, chute = false, v = 0, x = 0, running = false, hist = [], seen = new Set(), steady = false, slowed = false, braking = false; const m = 2, g = 10;
  const sel = $("#frSurf"); sel.innerHTML = Object.keys(SURF).map(k => `<option value="${k}">${T(SURF[k][1])}</option>`).join(""); sel.value = surf;
  sel.addEventListener("change", () => { surf = sel.value; seen.add(surf); resetRun(); }); $("#frForce").addEventListener("input", e => { F = +e.target.value; setText($("#frForceL"), F + " N"); });
  $("#frChute").addEventListener("click", () => { chute = !chute; $("#frChute").setAttribute("aria-pressed", chute); setText($("#frChute"), T(chute ? "Remove the parachute" : "Add a parachute")); });
  $("#frGo").addEventListener("click", () => { running = !running; $("#frGo").setAttribute("aria-pressed", running); setText($("#frGo"), T(running ? "Stop pushing" : "Start pushing")); });
  const br = $("#frBrake"); br.addEventListener("pointerdown", e => { braking = true; e.preventDefault(); }); addEventListener("pointerup", () => { braking = false; }); br.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { braking = true; e.preventDefault(); } }); br.addEventListener("keyup", () => { braking = false; });
  function resetRun() { v = 0; x = 0; hist = []; running = false; $("#frGo").setAttribute("aria-pressed", "false"); setText($("#frGo"), T("Start pushing")); steady = false; slowed = false; }
  $("#frReset").addEventListener("click", resetRun); seen.add(surf);
  const draw = () => { const c = cv.getContext("2d"), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H); c.fillStyle = "#0e1624"; c.fillRect(0, 0, W, H); c.strokeStyle = "#ffffff44"; c.beginPath(); c.moveTo(34, 8); c.lineTo(34, H - 22); c.lineTo(W - 8, H - 22); c.stroke(); c.fillStyle = "#a9c9bc"; c.font = "11px sans-serif"; c.fillText(T("Speed (m/s)"), 4, 12); c.fillText(T("Time"), W - 36, H - 6); c.strokeStyle = "#7dffd0"; c.lineWidth = 2; c.beginPath(); hist.forEach((p, i) => { const px = 34 + (i / 300) * (W - 44), py = H - 22 - clamp(p / 14, 0, 1) * (H - 34); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); };
  if (!S) { setText(info, T("3D view is not available on this device. Everything else on the page still works.")); return; }
  const THREE = S.THREE; darkFloor(THREE, S.scene, -0.05); S.scene.fog = new THREE.Fog(0x111a2a, 20, 46);
  const tex = () => { const c = document.createElement("canvas"); c.width = c.height = 256; const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 1); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; };
  const track = new THREE.Mesh(new THREE.BoxGeometry(40, 0.3, 4.4), new THREE.MeshStandardMaterial({ roughness: 0.6 })); track.position.set(0, 0.0, 0); track.receiveShadow = true; S.scene.add(track);
  function paintTrack() { const s = SURF[surf]; const c = document.createElement("canvas"); c.width = c.height = 256; const g2 = c.getContext("2d"); g2.fillStyle = "#" + s[2].toString(16).padStart(6, "0"); g2.fillRect(0, 0, 256, 256); for (let i = 0; i < 700; i++) { g2.fillStyle = `rgba(${surf === "ice" ? "255,255,255" : "0,0,0"},${0.05 + Math.random() * 0.12})`; const sz = surf === "sandpaper" ? 2 : surf === "ice" ? 1 : 3; g2.fillRect(Math.random() * 256, Math.random() * 256, sz, sz * (surf === "grass" ? 4 : 1)); } g2.fillStyle = "rgba(255,255,255,.35)"; g2.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 4.4); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; track.material.map = t; track.material.color.setHex(0xffffff); track.material.roughness = surf === "ice" ? 0.08 : 0.8; track.material.metalness = 0; track.material.needsUpdate = true; }
  paintTrack(); let paintedFor = surf;
  const posts = []; for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffd166 : 0xef476f })); p.position.set(-18 + i * 3, 0.35, -1.9); p.castShadow = true; S.scene.add(p); posts.push(p); }
  const block = new THREE.Group(); const bx = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), new THREE.MeshStandardMaterial({ color: 0x4f8ef7, metalness: 0.2, roughness: 0.4 })); bx.position.y = 0.65; bx.castShadow = true; block.add(bx); S.scene.add(block);
  const chuteMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xef476f, side: THREE.DoubleSide, roughness: 0.6 })); chuteMesh.position.set(-1.4, 2.3, 0); chuteMesh.scale.set(1, 0.8, 1); chuteMesh.rotation.z = -0.4; block.add(chuteMesh);
  const arrow = col => { const g3 = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), new THREE.MeshBasicMaterial({ color: col })); sh.rotation.z = Math.PI / 2; sh.position.x = 0.5; const hd = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12), new THREE.MeshBasicMaterial({ color: col })); hd.rotation.z = -Math.PI / 2; hd.position.x = 1.1; g3.add(sh, hd); g3.userData = { sh, hd }; return g3; };
  const aF = arrow(0x7dffb0), aR = arrow(0xff6b6b); aF.position.set(0.8, 2.0, 0.9); aR.position.set(-0.8, 1.5, 0.9); block.add(aF, aR);
  const setArrow = (a, len, dir) => { const L = Math.max(0.001, Math.abs(len)); a.userData.sh.scale.y = L; a.userData.sh.position.x = dir * L / 2; a.userData.hd.position.x = dir * (L + 0.2); a.userData.hd.rotation.z = dir > 0 ? -Math.PI / 2 : Math.PI / 2; a.visible = L > 0.05; };
  let last = performance.now(), gt = 0; (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.03, (now - last) / 1000); last = now;
    if (paintedFor !== surf) { paintedFor = surf; paintTrack(); }
    const mu = SURF[surf][0], N = m * g; const drive = running ? F : 0; let fr; const mvF = Math.abs(v) < 0.02;
    const frMax = mu * N * (braking ? 3.5 : 1); const drag = chute ? 0.9 * v * v : 0.05 * v * v;
    let net; if (mvF && drive <= frMax) { fr = drive; net = 0; v = 0; } else { fr = frMax + drag; net = drive - fr; if (v <= 0.0001 && net < 0) { net = 0; v = 0; fr = Math.min(frMax, drive); } }
    v = Math.max(0, v + net / m * dt); x += v * dt; gt += dt; if (gt > 0.1) { gt = 0; hist.push(v); if (hist.length > 300) hist.shift(); draw(); }
    posts.forEach(p => { p.position.x -= v * dt * 1.6; if (p.position.x < -19) p.position.x += 42; }); chuteMesh.visible = chute;
    track.material.map && (track.material.map.offset.x -= v * dt * 0.025);
    setArrow(aF, drive / 6, 1); setArrow(aR, (running || v > 0.05 ? Math.min(fr, drive + 30) : 0) / 6, -1);
    const bal = running && Math.abs(net) < 0.6 && v > 0.3; if (bal) steady = true; if (!running && v < 3 && hist.length > 20 && Math.max(...hist.slice(-150)) > 4 && v < Math.max(...hist.slice(-150)) - 1) slowed = true;
    setText($("#frSpeed"), v.toFixed(1) + " m/s"); setText($("#frDist"), x.toFixed(1) + " m"); setHTML(info, `<b>${T(bal ? "Balanced forces" : drive > fr + 0.5 ? "Unbalanced: speeding up" : v > 0.05 && fr > drive + 0.5 ? "Unbalanced: slowing down" : "Balanced: not moving")}</b><p>${T("Push")} ${drive.toFixed(0)} N · ${T("Friction")} ${fr.toFixed(0)} N</p>`);
    if (seen.size >= 3 && steady && slowed) award("friction");
  })();
}

/* ================================================================ LAB 3: PRESSURE LAB */
const WEAR = { heels: ["Person in high heels", 60, 0.0016, "heels"], trainers: ["Person in trainers", 60, 0.03, "trainers"], snowshoes: ["Person in snowshoes", 60, 0.24, "snowshoes"], elephant: ["Elephant", 4000, 0.45, "elephant"] };
export function buildPressure(award) {
  const host = $("#prStage"), info = $("#prInfo"); Object.values(WEAR).forEach(w => T(w[0]));
  const S = make3D(host, { cam: [0, 2.6, 9], target: [0, 1.5, 0], auto: 0, bg: 0x111a2a, real: true, hint: null });
  let key = "trainers", extra = 0, done = new Set(), goals = 0, sink = 0;
  const sel = $("#prWear"); sel.innerHTML = Object.keys(WEAR).map(k => `<option value="${k}">${T(WEAR[k][0])}</option>`).join(""); sel.value = key;
  const calc = () => { const w = WEAR[key]; const mass = w[1] + (key === "elephant" ? 0 : extra); const Fn = mass * 10; const A = w[2]; return { F: Fn, A, P: Fn / A, mass }; };
  function upd() { const c = calc(); done.add(key); setHTML($("#prRead"), `<b>F</b> ${c.F.toFixed(0)} N · <b>A</b> ${c.A < 0.01 ? c.A.toFixed(4) : c.A.toFixed(2)} m² · <b>P = F ÷ A</b> = ${Math.round(c.P).toLocaleString("en")} Pa`); setText($("#prPres"), Math.round(c.P / 1000) + " kPa"); $("#prBar").style.width = clamp(c.P / 3000, 2, 100) + "%"; setText($("#prSink"), sink.toFixed(0) + " cm"); if (c.P < 20000 && !done.has("g1")) { done.add("g1"); goals++; } if (c.P > 200000 && !done.has("g2")) { done.add("g2"); goals++; } if (done.size >= 6 && goals >= 2) award("pressure"); setHTML(info, c.P < 20000 ? `<b>${T("Low pressure")}</b><p>${T("The force is spread over a large area, so you do not sink.")}</p>` : c.P > 120000 ? `<b>${T("High pressure")}</b><p>${T("The force acts on a small area, so you sink in deeply.")}</p>` : `<b>${T("Medium pressure")}</b><p>${T("You sink in a little.")}</p>`); }
  sel.addEventListener("change", () => { key = sel.value; upd(); }); $("#prExtra").addEventListener("input", e => { extra = +e.target.value; setText($("#prExtraL"), "+" + extra + " kg"); upd(); });
  if (!S) { setText(info, T("3D view is not available on this device. Everything else on the page still works.")); upd(); return; }
  const THREE = S.THREE; darkFloor(THREE, S.scene, -1.6); S.scene.fog = new THREE.Fog(0x111a2a, 20, 46);
  const snow = new THREE.Mesh(new THREE.BoxGeometry(9, 3, 4.5), new THREE.MeshStandardMaterial({ color: 0xf2f7ff, roughness: 0.95 })); snow.position.y = -0.4 - 1.5 + 1.5 - 1.5; snow.position.y = -1.5 + 0; snow.receiveShadow = true; snow.position.y = -1.5; S.scene.add(snow);
  const sn = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 1 })); sn.rotation.x = -Math.PI / 2; sn.position.y = 0.002; sn.receiveShadow = true; S.scene.add(sn);
  const dent = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color: 0x9fb4cc })); dent.rotation.x = -Math.PI / 2; dent.position.y = 0.01; S.scene.add(dent);
  const figure = new THREE.Group(); S.scene.add(figure); let shape = null;
  function build() { if (shape) figure.remove(shape); shape = new THREE.Group(); const w = WEAR[key]; const body = new THREE.MeshStandardMaterial({ color: key === "elephant" ? 0x8c8c94 : 0x3a6fd8, roughness: 0.6 });
    if (key === "elephant") { const b = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 1.7), body); b.position.y = 2.4; b.castShadow = true; shape.add(b); [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]].forEach(p => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 1.4, 16), body); l.position.set(p[0], 0.7, p[1]); l.castShadow = true; shape.add(l); }); const h = new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 14), body); h.position.set(2.2, 3.0, 0); shape.add(h); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.6, 10), body); tr.position.set(2.9, 2.2, 0); tr.rotation.z = -0.3; shape.add(tr); }
    else { const torso = new THREE.Mesh(THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.4, 1.3, 6, 14) : new THREE.CylinderGeometry(0.4, 0.4, 1.6, 14), body); torso.position.y = 2.2; torso.castShadow = true; shape.add(torso); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.6 })); hd.position.y = 3.4; shape.add(hd);
      [-0.22, 0.22].forEach(x => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x23262e })); leg.position.set(x, 0.95, 0); leg.castShadow = true; shape.add(leg); const r = key === "heels" ? 0.04 : key === "trainers" ? 0.17 : 0.7; if (key === "heels") { const ft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0xc0262d })); ft.position.set(x, 0.3, 0.12); shape.add(ft); const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.025, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xc0262d })); hl.position.set(x, 0.18, -0.1); shape.add(hl); } else if (key === "trainers") { const ft = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.7), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 })); ft.position.set(x, 0.12, 0.15); shape.add(ft); } else { const ft = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 1.3), new THREE.MeshStandardMaterial({ color: 0x14a085 })); ft.position.set(x, 0.05, 0.25); shape.add(ft); } }); }
    figure.add(shape); const c = calc(); const rr = Math.sqrt(c.A / Math.PI); dent.scale.setScalar(Math.max(0.05, key === "elephant" ? 0.55 : Math.min(0.9, rr * (key === "snowshoes" ? 1.2 : 2.2)))); }
  let lastKey = "", lastP = -1;
  upd(); let last = performance.now(); (function loop() { requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.03, (now - last) / 1000); last = now; if (lastKey !== key) { lastKey = key; build(); } const c = calc(); const target = clamp(c.P / 1000 / 35, 0, 1) * 1.4; sink += (target - sink) * Math.min(1, dt * 5); figure.position.y = -sink * 0.45; dent.position.y = 0.01 - sink * 0.0; const sc = Math.max(0.05, dent.scale.x); if (Math.abs(c.P - lastP) > 1) { lastP = c.P; upd(); } })();
}

/* ================================================================ LAB 4: NATURAL SELECTION LAB ("Gone Fishing") */
const FISH = [["Bright orange", 0xff7a1a], ["Light grey", 0xb8c0c8], ["Muddy brown", 0x7a5a3a], ["Weedy green", 0x4f8f4a], ["Deep blue", 0x2f6fd0]];
const WATER = { clear: [0x7fc4ee, 0xb9a577, "Clear water"], muddy: [0x7b5d3c, 0x5a4630, "Muddy water"], weedy: [0x3d7f48, 0x2a5a30, "Weedy water"] };
export function buildSelection(award) {
  const host = $("#nsStage"), info = $("#nsInfo"), chart = $("#nsChart"); FISH.forEach(f => T(f[0])); Object.values(WATER).forEach(w => T(w[2]));
  const S = make3D(host, { cam: [0, 6.5, 8.5], target: [0, 0, 0], auto: 0, bg: 0x7fc4ee, real: true, hint: null, onPick: rc => pick(rc) });
  let water = "clear", gen = 1, caught = 0, fishes = [], hunts = 0, surv = [], hist = [], done = false;
  const sel = $("#nsWater"); sel.innerHTML = Object.keys(WATER).map(k => `<option value="${k}">${T(WATER[k][2])}</option>`).join(""); sel.value = water;
  const mk = (kinds) => kinds.map(k => ({ k, alive: true, x: rnd(-3.2, 3.2), z: rnd(-2.2, 2.2), ph: rnd(0, 6.28), sp: rnd(0.4, 0.9), dir: Math.random() < 0.5 ? 1 : -1 }));
  const start = () => { const kinds = []; for (let i = 0; i < 20; i++) kinds.push(i % 5); fishes = mk(kinds); gen = 1; caught = 0; hist = [counts(fishes)]; rebuildFish(); setTank(); redraw(); };
  const counts = arr => FISH.map((_, i) => arr.filter(f => f.alive && f.k === i).length);
  function redraw() { setText($("#nsGen"), T("Generation") + " " + gen); setText($("#nsCaught"), String(caught)); const c = chart.getContext("2d"), W = chart.width, H = chart.height; c.clearRect(0, 0, W, H); c.fillStyle = "#0e1624"; c.fillRect(0, 0, W, H); const n = hist.length; const bw = Math.min(110, (W - 20) / Math.max(n, 1)); hist.forEach((cn, gi) => { const tot = cn.reduce((a, b) => a + b, 0) || 1; let y = H - 22; cn.forEach((v, i) => { const h = v / tot * (H - 44); c.fillStyle = "#" + FISH[i][1].toString(16).padStart(6, "0"); c.fillRect(14 + gi * bw, y - h, bw - 8, h); y -= h; }); c.fillStyle = "#a9c9bc"; c.font = "11px sans-serif"; c.fillText("G" + (gi + 1), 18 + gi * bw, H - 6); }); }
  $("#nsWater").addEventListener("change", () => { water = sel.value; start(); }); $("#nsNew").addEventListener("click", start);
  $("#nsNext").addEventListener("click", breed); $("#nsAuto").addEventListener("click", () => { const al = fishes.filter(f => f.alive); if (!al.length) return; al.sort((a, b) => vis(b.k) - vis(a.k)); take(al[0]); });
  const vis = k => { const wc = WATER[water][0], fc = FISH[k][1]; const d = (a, b) => ((a >> 16 & 255) - (b >> 16 & 255)) ** 2 + ((a >> 8 & 255) - (b >> 8 & 255)) ** 2 + ((a & 255) - (b & 255)) ** 2; return d(wc, fc); };
  function take(f) { if (!f.alive || done) return; f.alive = false; caught++; hist[hist.length - 1] = counts(fishes); const cn = counts(fishes); const alive = cn.reduce((a, b) => a + b, 0); redraw(); if (alive <= 8) { setHTML(info, `<b>${T("Hunt over!")}</b><p>${T("Press Next generation. The survivors breed.")}</p>`); } else setHTML(info, `<b>${isES() ? T("You caught a") + " " + T(FISH[f.k][0]).toLowerCase() : T("You caught a") + " " + T(FISH[f.k][0]) + " " + T("fish")}</b><p>${T("Bright fish are easy to see in this water, so they are caught first.")}</p>`); }
  function breed() { const sv = fishes.filter(f => f.alive); if (sv.length < 3) { start(); return; } const kids = []; for (let i = 0; i < 20; i++) { const p = sv[Math.floor(Math.random() * sv.length)]; kids.push(Math.random() < 0.05 ? Math.floor(Math.random() * 5) : p.k); } fishes = mk(kids); gen++; caught = 0; hunts++; hist.push(counts(fishes)); rebuildFish(); redraw(); const cn = counts(fishes); const best = cn.indexOf(Math.max(...cn)); setHTML(info, `<b>${T("Generation")} ${gen}</b><p>${T("The most common colour now is")} ${T(FISH[best][0])}. ${T("The fish that were harder to see survived and had young. This is natural selection.")}</p>`); if (gen >= 4 && hist.length >= 4) award("selection"); }
  if (!S) { setText(info, T("3D view is not available on this device. Everything else on the page still works.")); start(); return; }
  const THREE = S.THREE; S.scene.fog = new THREE.Fog(0x7fc4ee, 8, 22);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshStandardMaterial({ color: 0xd8c9a0, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1; floor.receiveShadow = true; S.scene.add(floor);
  const weeds = new THREE.Group(); S.scene.add(weeds); for (let i = 0; i < 16; i++) { const w = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.6 + Math.random(), 5), new THREE.MeshStandardMaterial({ color: 0x2a6a34, roughness: 0.8 })); w.position.set(rnd(-4.5, 4.5), -0.2, rnd(-2.8, 2.8)); weeds.add(w); }
  function setTank() { const w = WATER[water]; S.scene.background = new THREE.Color(w[0]); S.scene.fog.color.setHex(w[0]); floor.material.color.setHex(w[1]); weeds.visible = water === "weedy"; }
  const group = new THREE.Group(); S.scene.add(group); const meshes = [];
  function rebuildFish() { while (group.children.length) group.remove(group.children[0]); meshes.length = 0; fishes.forEach(f => { const g = new THREE.Group(); const col = FISH[f.k][1]; const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.1 }); const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), mat); body.scale.set(1.6, 0.8, 0.6); body.castShadow = true; g.add(body); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 4), mat); tail.rotation.z = Math.PI / 2; tail.position.x = -0.95; g.add(tail); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); eye.position.set(0.55, 0.12, 0.28); g.add(eye); g.userData.f = f; body.userData.f = f; tail.userData.f = f; g.userData.tail = tail; group.add(g); meshes.push(g); f.g = g; f.body = body; }); }
  function pick(rc) { const hit = rc.intersectObjects(meshes.flatMap(g => g.children), false)[0]; if (hit && hit.object.userData.f) take(hit.object.userData.f); }
  start(); let last = performance.now(); (function loop() { requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.03, (now - last) / 1000), t = now / 1000; fishes.forEach(f => { if (!f.g) return; f.g.visible = f.alive; if (!f.alive) return; f.x += f.dir * f.sp * dt; if (f.x > 4 || f.x < -4) f.dir *= -1; f.g.position.set(f.x, Math.sin(t * 1.5 + f.ph) * 0.25, f.z); f.g.rotation.y = f.dir > 0 ? 0 : Math.PI; f.g.userData.tail.rotation.y = Math.sin(t * 8 + f.ph) * 0.5; }); })();
}
