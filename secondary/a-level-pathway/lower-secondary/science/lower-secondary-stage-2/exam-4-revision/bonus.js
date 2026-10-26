/* Bonus game for the Exam 4 revision website: "Reaction Range" (launch-and-land shooting gallery, local to this page).
   A question hangs in the sky and three answer boards stand in a misty field. The student sets the aim (left/right) and the launch power,
   watches the dotted arc preview, and fires a glass flask of reagent at the right board. Real projectile maths, soft shadows, ACES tone mapping.
   - Quiz-in-the-action: the answer is where the flask lands. A wrong board (or a miss) never ends the round; it names the right answer with a hook.
   - Game state runs on setInterval wall-clock time and setTimeout. requestAnimationFrame only draws.
   - Real <button>s and the arrow keys aim, Space fires; always-visible mute button; reduced motion respected; button-only fallback without WebGL. */
import { ttsEnabled, setTTS } from "../../../../../../engine/accessibility.js?v=6";
import { T, reduced, shuffle } from "../../../../../../engine/revision-kit.js?v=16";

const TOTAL_MS = 120000, G = 9.8, ANG = Math.PI / 4, R_BOARD = 2.7;
/* [question, correct, wrong, wrong, hook] */
const Q = [
  ["Which one is the pH of an acid?", "pH 2", "pH 7", "pH 12", "Acids are below 7."],
  ["Which product forms with a salt in neutralisation?", "Water", "Hydrogen", "Oxygen", "Acid + base → salt + water."],
  ["Vinegar fizzes on baking soda. Which gas?", "Carbon dioxide", "Hydrogen", "Oxygen", "Acid + carbonate gives CO₂."],
  ["Acid + a reactive metal gives which gas?", "Hydrogen", "Carbon dioxide", "Chlorine", "Hydrogen pops with a lit splint."],
  ["HCl + NaOH makes which salt?", "Sodium chloride", "Sodium sulfate", "Potassium chloride", "Hydrochloric acid → chloride."],
  ["H₂SO₄ + KOH makes which salt?", "Potassium sulfate", "Potassium chloride", "Potassium nitrate", "Sulfuric acid → sulfate."],
  ["Which indicator is red in acid and blue in alkali?", "Litmus", "Phenolphthalein", "Methyl orange", "Litmus: red = acid, blue = alkali."],
  ["Phenolphthalein in an alkali turns...", "Pink", "Colourless", "Yellow", "Pink in alkali."],
  ["Which unit measures current?", "Ampere", "Volt", "Ohm", "Current is in amps (A)."],
  ["Which unit measures resistance?", "Ohm", "Volt", "Watt", "Resistance is in ohms (Ω)."],
  ["Which device measures voltage?", "Voltmeter", "Ammeter", "Thermometer", "Voltmeters go across a component."],
  ["What does a switch do?", "Opens or closes the circuit", "Makes electricity", "Measures current", "Open = off, closed = on."],
  ["Which type of circuit keeps other bulbs on if one blows?", "Parallel", "Series", "Open", "Branches work independently."],
  ["In a series circuit the current is...", "The same everywhere", "Shared between branches", "Zero", "One loop, one current."],
  ["In a parallel circuit the voltage across each branch is...", "The same as the cell", "Shared equally", "Zero", "Every branch sits across the cell."],
  ["Add more bulbs in series. The bulbs get...", "Dimmer", "Brighter", "Unchanged", "More resistance, less current."],
  ["What happens to current if resistance rises (same voltage)?", "It falls", "It rises", "It stays the same", "I = V ÷ R."],
  ["6 V across 3 Ω. What is the current?", "2 A", "18 A", "0.5 A", "I = V ÷ R = 2 A."],
  ["12 V and 4 A. What is the resistance?", "3 Ω", "48 Ω", "8 Ω", "R = V ÷ I = 3 Ω."],
  ["5 A through 2 Ω. What is the voltage?", "10 V", "2.5 V", "7 V", "V = I × R = 10 V."],
  ["Which equation links V, I and R?", "V = I × R", "V = I + R", "V = I ÷ R", "Ohm's law."],
  ["Why does a fuse protect a circuit?", "It melts if the current is too big", "It stores energy", "It makes the current bigger", "A thin wire that melts."],
  ["Which material is a good conductor?", "Copper", "Rubber", "Wood", "Free electrons carry the current."],
  ["Which material is an insulator?", "Plastic", "Iron", "Aluminium", "No free electrons to carry current."],
  ["What type of energy is stored in a battery?", "Chemical", "Thermal", "Sound", "Chemical turns into electrical."],
  ["Antacid tablets are...", "Bases", "Acids", "Salts only", "Bases neutralise stomach acid."],
  ["Lime is added to acidic soil because it is...", "A base", "An acid", "Neutral", "Bases neutralise soil acid."],
  ["Which direction does conventional current flow?", "Positive to negative", "Negative to positive", "Neither", "Conventional current runs + to −."]
];
["Time", "Streak", "Score", "Aim", "Power", "Fire!", "Left", "Right", "Less", "More", "Sound on", "Sound off", "Sound on. Press to mute", "Sound off. Press to unmute", "Bull's-eye!", "Right board!", "Wrong board.", "Missed.", "The answer was", "Aim again.",
  "Aim with the arrows, set the power, then press Fire (Space). No lives: keep shooting.", "Aim at the board with the right answer, then press Fire.", "Round complete!", "score", "accuracy", "best streak", "Revisit these:", "Every shot was right. Brilliant!", "Play again", "Close",
  "3D view is not available on this device. Use the answer buttons.", "Aim the launcher at the right board.", "Choose an answer"].forEach(T);
Q.forEach(q => q.forEach(T));

let styled = false;
function css() {
  if (styled) return; styled = true;
  const s = document.createElement("style");
  s.textContent = `
.sg{background:linear-gradient(180deg,#1c2433,#0d121b);color:#e8eef7;border-radius:var(--radius-lg);padding:var(--sp-5);box-shadow:var(--shadow-3);}
.sg__hud{display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#ffd166;margin-bottom:.6rem;}
.sg__hud b{color:#fff;margin-left:.4rem;font-size:1.05rem;}
.sg__timer{height:8px;border-radius:99px;background:#ffffff1f;overflow:hidden;margin-bottom:.8rem;}
.sg__timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ffd166,#ef476f);}
.sg__stage{position:relative;aspect-ratio:16/9;min-height:260px;border-radius:14px;overflow:hidden;background:#0b1018;touch-action:pan-y;}
.sg__stage canvas{display:block;width:100%;height:100%;}
.sg__q{position:absolute;left:.5rem;right:.5rem;top:.5rem;text-align:center;font-family:var(--font-display);font-size:clamp(.95rem,3.2vw,1.4rem);color:#fff;text-shadow:0 2px 8px #000;pointer-events:none;}
.sg__ctl{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-top:.7rem;}
.sg__grp{display:flex;align-items:center;gap:.4rem;background:#ffffff0f;border:1px solid #ffffff33;border-radius:14px;padding:.4rem .6rem;}
.sg__grp span{flex:1;font-weight:800;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#ffd166;}
.sg__grp b{min-width:2.6rem;text-align:center;font-size:1.1rem;}
.sg button{font:inherit;font-weight:800;border-radius:12px;border:2px solid #ffffff55;background:#ffffff14;color:#fff;cursor:pointer;min-height:48px;min-width:48px;padding:0 .9rem;}
.sg button:hover{background:#ffffff2a;}
.sg__fire{grid-column:1/-1;background:linear-gradient(90deg,#ef476f,#ffd166)!important;color:#1b1030!important;border:0!important;font-size:1.1rem;}
.sg__fb{min-height:3.4em;margin-top:.7rem;font-weight:600;font-size:.88rem;}
.sg__foot{display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;font-size:.75rem;color:#aab6c8;gap:1rem;flex-wrap:wrap;}
.sg__mute{font-size:.75rem!important;padding:.35rem .8rem!important;}
.sg__ans{display:grid;gap:.5rem;margin-top:.6rem;}
.sg__end{text-align:center;padding:var(--sp-4);}
.sg__end h3{font-family:var(--font-display);font-size:var(--step-3);color:#fff;margin:.2rem 0;}
.sg__stats{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin:1rem 0;}
.sg__stats b{display:block;font-size:2rem;color:#ffd166;font-family:var(--font-display);}
.sg__end ul{text-align:left;max-width:36rem;margin:.6rem auto 1rem;font-size:.85rem;}`;
  document.head.append(s);
}

function boardTexture(THREE, text, color) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 384; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, color); g.addColorStop(1, "#10151f"); x.fillStyle = g; x.fillRect(0, 0, 512, 384);
  x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 14; x.strokeRect(10, 10, 492, 364);
  for (let i = 0; i < 4; i++) { x.strokeStyle = "rgba(255,255,255," + (0.35 - i * 0.07) + ")"; x.lineWidth = 3; x.beginPath(); x.arc(256, 192, 170 - i * 36, 0, 6.28); x.stroke(); }
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = "rgba(0,0,0,.7)"; x.shadowBlur = 8;
  const words = text.split(" "); const lines = []; let cur = ""; words.forEach(w => { const t = cur ? cur + " " + w : w; if (t.length > 14 && cur) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur);
  const fs = lines.length > 2 ? 52 : 64; x.font = "bold " + fs + "px sans-serif"; lines.forEach((l, i) => x.fillText(l, 256, 192 + (i - (lines.length - 1) / 2) * (fs + 6), 440));
  const t = new THREE.CanvasTexture(c); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
function noiseTexture(THREE) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"); x.fillStyle = "#1f3a2a"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${20 + Math.random() * 40},${60 + Math.random() * 60},${30 + Math.random() * 30},.55)`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 20); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t;
}

export function mountGallery(host, { onFinish }) {
  css();
  const THREE = window.THREE;
  let gl = null; try { const c = document.createElement("canvas"); gl = !!THREE && (c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { gl = null; }
  const order = shuffle(Q);
  let qi = 0, yaw = 0, power = 16, score = 0, streak = 0, best = 0, hits = 0, shots = 0, over = false, flying = false; const missed = [];
  let cur = null;
  const t0 = performance.now();
  const COL = ["#ef476f", "#118ab2", "#06a77d"];
  host.innerHTML = `<div class="sg"><div class="sg__hud"><span>${T("Time")}<b id="sgT">120</b></span><span>${T("Streak")}<b id="sgS">0</b></span><span>${T("Score")}<b id="sgP">0</b></span></div>
    <div class="sg__timer"><i id="sgBar"></i></div>
    <div class="sg__stage" id="sgStage"><div class="sg__q" id="sgQ" aria-live="polite"></div></div>
    <div class="sg__ctl">
      <div class="sg__grp" role="group" aria-label="${T("Aim")}"><button type="button" id="sgL" aria-label="${T("Left")}">&larr;</button><span>${T("Aim")}</span><b id="sgYaw">0°</b><button type="button" id="sgR" aria-label="${T("Right")}">&rarr;</button></div>
      <div class="sg__grp" role="group" aria-label="${T("Power")}"><button type="button" id="sgLess" aria-label="${T("Less")}">&minus;</button><span>${T("Power")}</span><b id="sgPow">16</b><button type="button" id="sgMore" aria-label="${T("More")}">+</button></div>
      <button type="button" class="sg__fire" id="sgFire">${T("Fire!")}</button>
    </div>
    <div class="sg__ans" id="sgAns"></div>
    <div class="sg__fb" id="sgFb" aria-live="polite">${T("Aim at the board with the right answer, then press Fire.")}</div>
    <div class="sg__foot"><button type="button" class="sg__mute" id="sgMute"></button><span>${T("Aim with the arrows, set the power, then press Fire (Space). No lives: keep shooting.")}</span></div></div>`;
  const $ = s => host.querySelector(s);
  const paintMute = () => { const on = ttsEnabled(); $("#sgMute").textContent = on ? T("Sound on") : T("Sound off"); $("#sgMute").setAttribute("aria-label", on ? T("Sound on. Press to mute") : T("Sound off. Press to unmute")); };
  paintMute(); $("#sgMute").addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  const paint = () => { $("#sgS").textContent = streak; $("#sgP").textContent = score; $("#sgYaw").textContent = Math.round(yaw * 180 / Math.PI) + "°"; $("#sgPow").textContent = power; };
  const setYaw = d => { yaw = Math.max(-0.7, Math.min(0.7, yaw + d)); paint(); };
  const setPow = d => { power = Math.max(8, Math.min(26, power + d)); paint(); };
  $("#sgL").addEventListener("click", () => setYaw(-0.05)); $("#sgR").addEventListener("click", () => setYaw(0.05));
  $("#sgLess").addEventListener("click", () => setPow(-1)); $("#sgMore").addEventListener("click", () => setPow(1));
  $("#sgFire").addEventListener("click", () => fire());
  const onKey = e => { if (over || !host.querySelector(".sg")) return; const k = e.key; if (k === "ArrowLeft") { setYaw(-0.05); e.preventDefault(); } else if (k === "ArrowRight") { setYaw(0.05); e.preventDefault(); } else if (k === "ArrowUp") { setPow(1); e.preventDefault(); } else if (k === "ArrowDown") { setPow(-1); e.preventDefault(); } else if (k === " " && host.contains(document.activeElement) && document.activeElement.tagName !== "BUTTON") { fire(); e.preventDefault(); } };
  document.addEventListener("keydown", onKey);
  const stage = $("#sgStage");

  /* ---------------------------------------------------------- scene */
  let renderer, scene, camera, raf = null, boardObjs = [], flask = null, arcDots = [], bursts = [], shake = 0, fly = null;
  const landing = (v, a) => { const R = v * v / G; return { x: R * Math.sin(a), z: -R * Math.cos(a), R }; };
  if (gl) {
    renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stage.prepend(renderer.domElement);
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x182235); scene.fog = new THREE.Fog(0x182235, 30, 95);
    camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.1, 160); camera.position.set(0, 3.2, 7.5); camera.lookAt(0, 3, -28);
    scene.add(new THREE.HemisphereLight(0xaac4ff, 0x1c2a1f, 0.55));
    const sun = new THREE.DirectionalLight(0xffe2b8, 1.15); sun.position.set(-14, 22, 8); sun.target.position.set(0, 0, -25); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 90; sun.shadow.bias = -0.0005; scene.add(sun, sun.target);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ map: noiseTexture(THREE), roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    /* low hills and a few trees give depth */
    for (let i = 0; i < 14; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(8 + Math.random() * 10, 20, 12), new THREE.MeshStandardMaterial({ color: 0x1d3a35, roughness: 1 })); h.position.set(-90 + i * 14 + Math.random() * 6, -4, -85 - Math.random() * 25); h.scale.y = 0.55; scene.add(h); }
    for (let i = 0; i < 26; i++) { const tr = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 1 })); trunk.position.y = 0.9; const crown = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.4, 10), new THREE.MeshStandardMaterial({ color: 0x1f5a3a, roughness: 0.9 })); crown.position.y = 3; trunk.castShadow = crown.castShadow = true; tr.add(trunk, crown); const side = i % 2 ? 1 : -1; tr.position.set(side * (14 + Math.random() * 30), 0, -10 - Math.random() * 60); scene.add(tr); }
    /* launcher: a lab-stand cannon with a brass barrel */
    const L = new THREE.Group(); const brass = new THREE.MeshStandardMaterial({ color: 0xc89b3c, metalness: 0.9, roughness: 0.28 }); const steel = new THREE.MeshStandardMaterial({ color: 0x8892a0, metalness: 0.85, roughness: 0.35 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 28), steel); base.position.y = 0.25; base.castShadow = base.receiveShadow = true; L.add(base);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 2.6, 24), brass); barrel.rotation.x = Math.PI / 2 - ANG; barrel.position.set(0, 1.25, -0.9); barrel.castShadow = true; L.add(barrel); L.userData.barrel = barrel;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 12, 24), steel); ring.position.copy(barrel.position); ring.rotation.copy(barrel.rotation); L.add(ring);
    L.position.set(0, 0, 4); scene.add(L); L.userData.base = L; renderer.__launcher = L;
    /* the flask (glass with coloured liquid) */
    flask = new THREE.Group(); const glass = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.42, clearcoat: 1, clearcoatRoughness: 0.03 }));
    const liq = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14, 0, 6.3, 1.4, 1.7), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x6b4a00, roughness: 0.25 })); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 14), glass.material); neck.position.y = 0.4; flask.add(glass, liq, neck); flask.visible = false; flask.castShadow = true; scene.add(flask);
    const dotGeo = new THREE.SphereGeometry(0.1, 8, 6);
    for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.8 - i * 0.02 })); scene.add(d); arcDots.push(d); }
    const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(size).observe(stage); size();
    let vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(stage);
    (function draw() {
      raf = requestAnimationFrame(draw); if (over || !vis) return;
      const now = performance.now(), t = now / 1000;
      const Lh = renderer.__launcher; Lh.rotation.y = -yaw; Lh.userData.barrel.scale.y = 1;
      /* dotted arc preview (not while a flask is in the air) */
      const v = power; const vx = v * Math.cos(ANG), vy = v * Math.sin(ANG), T0 = 2 * vy / G;
      arcDots.forEach((d, i) => { const tt = (i + 1) / arcDots.length * T0; const dist = vx * tt; d.position.set(dist * Math.sin(yaw), 1.2 + vy * tt - 0.5 * G * tt * tt, 4 - dist * Math.cos(yaw) - 1.5 * Math.cos(yaw)); d.visible = !flying && !over; });
      boardObjs.forEach((b, i) => { b.mesh.position.y = b.baseY + (reduced() ? 0 : Math.sin(t * 1.4 + i) * 0.12); if (b.shake > 0) { b.shake -= 0.04; b.mesh.rotation.z = Math.sin(now / 30) * b.shake * 0.25; } else b.mesh.rotation.z = 0; });
      if (fly) { const e = (now - fly.t) / 1000; if (e <= fly.T) { const dist = fly.vx * e; flask.position.set(dist * Math.sin(fly.yaw), 1.2 + fly.vy * e - 0.5 * G * e * e, 4 - dist * Math.cos(fly.yaw) - 1.5 * Math.cos(fly.yaw)); flask.rotation.x += 0.2; flask.rotation.z += 0.13; } }
      bursts = bursts.filter(b => { b.life -= 0.02; b.pts.material.opacity = Math.max(0, b.life); const a = b.pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { a.array[i * 3] += b.vel[i * 3]; a.array[i * 3 + 1] += b.vel[i * 3 + 1]; a.array[i * 3 + 2] += b.vel[i * 3 + 2]; b.vel[i * 3 + 1] -= 0.004; } a.needsUpdate = true; if (b.life <= 0) { scene.remove(b.pts); return false; } return true; });
      if (shake > 0 && !reduced()) { camera.position.x = (Math.random() - 0.5) * shake; shake = Math.max(0, shake - 0.03); } else camera.position.x = 0;
      renderer.render(scene, camera);
    })();
  }

  function burst(x, y, z, color, n = 70) {
    if (!gl) return; const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; const a = Math.random() * 6.28, b = Math.random() * 3.14, s = 0.05 + Math.random() * 0.1; vel[i * 3] = Math.cos(a) * Math.sin(b) * s; vel[i * 3 + 1] = Math.cos(b) * s + 0.06; vel[i * 3 + 2] = Math.sin(a) * Math.sin(b) * s; }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.22, transparent: true, depthWrite: false })); scene.add(pts); bursts.push({ pts, vel, life: 1 });
  }

  /* ---------------------------------------------------------- rounds */
  function nextQ() {
    const q = order[qi++ % order.length]; const opts = shuffle([[q[1], true], [q[2], false], [q[3], false]]);
    /* three boards at different distances and bearings so power and aim both matter */
    const dists = shuffle([14 + Math.random() * 4, 24 + Math.random() * 4, 36 + Math.random() * 5]); const yaws = shuffle([-0.42, 0.02, 0.4]).map(y => y + (Math.random() - 0.5) * 0.12);
    cur = { q, boards: opts.map((o, i) => ({ text: o[0], ok: o[1], d: dists[i], yaw: yaws[i], x: dists[i] * Math.sin(yaws[i]), z: 4 - dists[i] * Math.cos(yaws[i]) - 1.5 })) };
    if (gl) {
      boardObjs.forEach(b => scene.remove(b.mesh)); boardObjs = [];
      cur.boards.forEach((b, i) => {
        const grp = new THREE.Group(); const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.9), new THREE.MeshStandardMaterial({ map: boardTexture(THREE, T(b.text), COL[i]), roughness: 0.5, emissive: 0x111111 })); sign.position.y = 3.4; sign.castShadow = true;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.4, 10), new THREE.MeshStandardMaterial({ color: 0x777f8c, metalness: 0.8, roughness: 0.4 })); post.position.y = 1.7; post.castShadow = true;
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(R_BOARD, R_BOARD, 0.06, 40), new THREE.MeshStandardMaterial({ color: new THREE.Color(COL[i]), transparent: true, opacity: 0.4, emissive: new THREE.Color(COL[i]), emissiveIntensity: 0.4 })); pad.position.y = 0.04;
        grp.add(sign, post, pad); grp.position.set(b.x, 0, b.z); grp.lookAt(0, 0, 4); scene.add(grp); boardObjs.push({ mesh: grp, baseY: 0, shake: 0 });
      });
    }
    $("#sgQ").textContent = T(q[0]);
    $("#sgAns").innerHTML = gl ? "" : cur.boards.map((b, i) => `<button type="button" data-i="${i}" style="border-color:${COL[i]}">${T(b.text)}</button>`).join("");
    if (!gl) $("#sgAns").querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => resolve(cur.boards[+btn.dataset.i], true)));
    if (!gl) $("#sgFire").hidden = true;
  }
  function fire() {
    if (over || flying || !gl || !cur) return; flying = true; shots++;
    const vx = power * Math.cos(ANG), vy = power * Math.sin(ANG), TT = 2 * vy / G; flask.visible = true; fly = { t: performance.now(), T: TT, vx, vy, yaw }; arcDots.forEach(d => d.visible = false);
    const L = landing(power, yaw); const lx = L.R * Math.sin(yaw), lz = 4 - L.R * Math.cos(yaw) - 1.5 * Math.cos(yaw) * 0 - 1.5;
    setTimeout(() => {
      if (over) return; flask.visible = false; fly = null; flying = false;
      const px = (power * Math.cos(ANG) * TT) * Math.sin(yaw), pz = 4 - (power * Math.cos(ANG) * TT) * Math.cos(yaw) - 1.5 * Math.cos(yaw);
      let hit = null; let bd = 1e9; cur.boards.forEach(b => { const d = Math.hypot(px - b.x, pz - b.z); if (d < R_BOARD && d < bd) { bd = d; hit = b; } });
      if (hit) { burst(px, 0.6, pz, hit.ok ? 0x7dffb0 : 0xff6b6b); resolve(hit, false, bd); } else { burst(px, 0.3, pz, 0xffffff, 40); shake = 0.2; $("#sgFb").innerHTML = `<b style="color:#ffd166">${T("Missed.")}</b> ${T("Aim again.")}`; }
    }, TT * 1000);
  }
  function resolve(b, direct, d = 99) {
    if (over) return; const q = cur.q; const ok = b.ok; const idx = cur.boards.indexOf(b); if (boardObjs[idx]) boardObjs[idx].shake = 1;
    if (ok) { score += 10 + Math.min(streak, 10) * 2 + (d < 1.1 ? 5 : 0); streak++; best = Math.max(best, streak); hits++; $("#sgFb").innerHTML = `<b style="color:#7dffb0">${T(d < 1.1 ? "Bull's-eye!" : "Right board!")}</b> ${T(q[4])}`; }
    else { streak = 0; missed.push(q); shake = 0.5; $("#sgFb").innerHTML = `<b style="color:#ff9d8d">${T("Wrong board.")}</b> ${T("The answer was")} <b>${T(q[1])}</b>. ${T(q[4])}`; }
    paint(); setTimeout(() => { if (!over) nextQ(); }, gl ? 1300 : 900);
  }

  /* ---------------------------------------------------------- game clock (wall-clock, never rAF) */
  const clock = setInterval(() => {
    const left = Math.max(0, TOTAL_MS - (performance.now() - t0));
    $("#sgT").textContent = Math.ceil(left / 1000); $("#sgBar").style.width = (left / TOTAL_MS * 100) + "%"; if (left <= 0) end();
  }, 100);
  function end() {
    if (over) return; over = true; clearInterval(clock); cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); if (renderer) renderer.dispose();
    const acc = shots || !gl ? Math.round(hits / Math.max(1, gl ? shots : hits + missed.length) * 100) : 0;
    host.innerHTML = `<div class="sg"><div class="sg__end"><h3>${T("Round complete!")}</h3><div class="sg__stats"><div><b>${score}</b>${T("score")}</div><div><b>${acc}%</b>${T("accuracy")}</div><div><b>${best}</b>${T("best streak")}</div></div>
      ${missed.length ? `<p><b>${T("Revisit these:")}</b></p><ul>${missed.map(m => `<li>${T(m[0])} <b>${T(m[1])}</b>. ${T(m[4])}</li>`).join("")}</ul>` : `<p>${T("Every shot was right. Brilliant!")}</p>`}
      <button type="button" class="btn" id="sgAgain">${T("Play again")}</button> <button type="button" class="btn btn--ghost" id="sgDone">${T("Close")}</button></div></div>`;
    host.querySelector("#sgAgain").addEventListener("click", () => mountGallery(host, { onFinish }));
    host.querySelector("#sgDone").addEventListener("click", () => { host.innerHTML = ""; });
    if (onFinish) onFinish({ score, best });
  }
  host.__sg = () => ({ boards: cur && cur.boards, yaw, power });
  paint(); nextQ();
  if (!gl) $("#sgQ").textContent = T(order[0][0]);
}
