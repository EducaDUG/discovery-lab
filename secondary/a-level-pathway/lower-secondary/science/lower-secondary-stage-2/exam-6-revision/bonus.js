/* Bonus game for the Exam 6 revision website: "Camouflage Safari" (hidden-object / spot-the-adapted-animal hunt, local to this page).
   A 3D diorama shows three animals (or three answer cards) in a biome. Read the prompt and tap the right one: the best-camouflaged fox in the snow,
   the counter-shaded fish, the streamlined swimmer, or a card with the answer to a force, pressure or variation question.
   - Quiz-in-the-action: tap the animal in the scene. Wrong picks show the right answer and a hook; nothing ever ends the round.
   - Game state runs on setInterval wall-clock time. requestAnimationFrame only draws.
   - Real <button>s and keys 1-3 also answer; own mute button; reduced motion respected; button-only fallback without WebGL. */
import { ttsEnabled, setTTS } from "../../../../../../engine/accessibility.js?v=6";
import { T, reduced, shuffle } from "../../../../../../engine/revision-kit.js?v=19";

const TOTAL_MS = 120000;
const BIOME = { snow: [0xe9f1fa, 0xf5f9ff, "snow"], sand: [0xd9b873, 0xe7cc8d, "desert"], forest: [0x2f6b3a, 0x3d8a47, "forest"], clear: [0x5aa9de, 0xd8c9a0, "water"], deep: [0x0b2a52, 0x0a1d38, "deep sea"] };
/* scene questions: [prompt, biome, kind, [specA, specB, specC], answerIndex, hook] */
const FX = (c) => ({ m: "mammal", fur: c, thick: 0.4 }), FP = (c) => ({ m: "mammal", fur: c, thick: 1 }), LZ = (c) => ({ m: "lizard", fur: c }), FR = (c) => ({ m: "frog", fur: c });
const FI = (top, bel, o = {}) => Object.assign({ m: "fish", top, bel, long: 1.6, round: 0.8, bill: false, eye: 0.07 }, o);
const SCENES = [
  ["Which fox is best camouflaged in the snow?", "snow", [FX(0x3a2a20), FX(0xfdfdff), FX(0xa04a1c)], 1, "White fur blends with snow, so the predator misses it."],
  ["Which lizard is hardest to see on the desert sand?", "sand", [LZ(0x2f8f3a), LZ(0xd9b873), LZ(0xc0262d)], 1, "Sandy skin matches the sand: camouflage."],
  ["Which frog would a bird find hardest to spot among leaves?", "forest", [FR(0xff5a1a), FR(0x4f9f4a), FR(0xf0e06a)], 1, "Green skin matches the leaves."],
  ["Which fish is best hidden in dark deep water?", "deep", [FI(0xff7a1a, 0xffa860), FI(0x14253f, 0x1c3050), FI(0xf2f2f2, 0xffffff)], 1, "A dark colour blends with the dark water."],
  ["Which fish is counter-shaded (dark on top, light underneath)?", "clear", [FI(0x2d4a63, 0xe8eef2), FI(0xe8eef2, 0x2d4a63), FI(0xc0262d, 0xc0262d)], 0, "Dark top hides it from above, light belly hides it from below."],
  ["Which fish has the most streamlined body for fast swimming?", "clear", [FI(0x6a7f90, 0xdfe6ea, { long: 2.0, round: 0.55 }), FI(0x6a7f90, 0xdfe6ea, { long: 0.9, round: 0.9 }), FI(0x6a7f90, 0xdfe6ea, { long: 1.1, round: 1.0 })], 0, "A long, thin, pointed shape cuts through water."],
  ["Which fish can catch fast-moving prey with a long pointed bill?", "clear", [FI(0x6a7f90, 0xdfe6ea), FI(0x6a7f90, 0xdfe6ea, { bill: true }), FI(0x9a8f60, 0xe4dcb0)], 1, "The swordfish's bill slashes at prey."],
  ["Which fish has the biggest eyes for seeing in the dark deep sea?", "deep", [FI(0x1c3050, 0x2b4a74, { eye: 0.07 }), FI(0x1c3050, 0x2b4a74, { eye: 0.2 }), FI(0x1c3050, 0x2b4a74, { eye: 0.04 })], 1, "Large eyes collect more light."],
  ["Which animal is best adapted to a freezing Arctic winter?", "snow", [FP(0xf6f8fb), FX(0xb98f60), { m: "mammal", fur: 0xe0a7a0, thick: 0 }], 0, "Thick white fur keeps heat in and hides it."],
  ["The lake turns muddy brown. Which fish will most likely survive?", "deep", [FI(0xff7a1a, 0xffa860), FI(0x7a5a3a, 0x9a7a55), FI(0x2f6fd0, 0x6aa0f0)], 1, "The brown fish blends with brown water, so it is not caught: natural selection."],
  ["On the dark forest floor which moth is least likely to be eaten?", "forest", [FI(0xf2f2f2, 0xffffff, { long: 1, round: 0.7 }), FI(0x2a2a22, 0x3a3a30, { long: 1, round: 0.7 }), FI(0xff5a1a, 0xffa860, { long: 1, round: 0.7 })], 1, "Dark colours blend into the dark ground."]
];
/* card questions (forces, pressure, variation): [prompt, correct, wrong, wrong, hook] */
const CARDS = [
  ["Which unit measures force?", "Newton", "Kilogram", "Pascal", "Force is in newtons (N)."],
  ["What is the weight of a 5 kg object on Earth?", "50 N", "5 N", "15 N", "5 × 10 = 50 N."],
  ["On the Moon, what stays the same?", "Your mass", "Your weight", "The gravity", "Mass is the same everywhere."],
  ["What is Hooke's law?", "F = k × e", "F = m × g", "P = F ÷ A", "Force is proportional to extension."],
  ["Which graph shape shows Hooke's law?", "Straight line through the origin", "A wavy line", "A random scatter", "Force ∝ extension."],
  ["What does friction do to a moving object?", "Slows it down", "Speeds it up", "Makes it heavier", "Friction opposes motion."],
  ["Which sport wants LOW friction?", "Ice skating", "Rock climbing", "Running", "Skates need to glide."],
  ["100 m in 20 s. What is the speed?", "5 m/s", "2000 m/s", "0.2 m/s", "Distance ÷ time."],
  ["What does a flat line above zero on a speed-time graph show?", "Constant speed", "Speeding up", "Not moving", "Speed is not changing."],
  ["Forces are balanced. What happens to the motion?", "No change", "It speeds up", "It slows down", "Balanced forces cancel."],
  ["What is the formula for pressure?", "Force ÷ area", "Force × area", "Mass ÷ area", "Divide force by area."],
  ["600 N on 0.1 m². What is the pressure?", "6000 Pa", "60 Pa", "60 000 Pa", "600 ÷ 0.1 = 6000 Pa."],
  ["Why do snowshoes stop you sinking?", "They spread your weight over a larger area", "They make you lighter", "They melt the snow", "Bigger area = lower pressure."],
  ["Which of these is an inherited characteristic?", "Eye colour", "A scar", "A tattoo", "Genes control eye colour."],
  ["Which of these is continuous variation?", "Height", "Blood group", "Tongue rolling", "A range of values."],
  ["What is natural selection?", "Better-adapted individuals survive and reproduce more", "People choose which animals breed", "All animals survive equally", "Nature selects."],
  ["What is an adaptation?", "A feature that helps survival in a habitat", "A type of pollution", "A change in weather", "Adaptations help survival."],
  ["Which human activity reduces biodiversity?", "Destroying habitats", "Planting trees", "Making reserves", "Habitat loss removes species."]
];
["Time", "Streak", "Score", "Found", "Sound on", "Sound off", "Sound on. Press to mute", "Sound off. Press to unmute", "Well spotted!", "Not quite.", "The answer was", "Tap the right animal or card, or press 1, 2 or 3. No lives: keep hunting.", "Tap the right one.", "Round complete!", "score", "found", "accuracy", "best streak", "Revisit these:", "Every answer was right. Brilliant!", "Play again", "Close",
  "3D view is not available on this device. Use the answer buttons.", "Spot the animal", "Power-up card question", "Choose an answer", "snow", "desert", "forest", "water", "deep sea"].forEach(T);
SCENES.forEach(s => { T(s[0]); T(s[4]); }); CARDS.forEach(c => c.forEach(T));
const ANS_NAMES = ["1", "2", "3"];

let styled = false;
function css() {
  if (styled) return; styled = true; const s = document.createElement("style");
  s.textContent = `
.cs{background:linear-gradient(180deg,#17261f,#0b130f);color:#e8f0ea;border-radius:var(--radius-lg);padding:var(--sp-5);box-shadow:var(--shadow-3);}
.cs__hud{display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#ffd166;margin-bottom:.6rem;}
.cs__hud b{color:#fff;margin-left:.4rem;font-size:1.05rem;}
.cs__timer{height:8px;border-radius:99px;background:#ffffff1f;overflow:hidden;margin-bottom:.8rem;}.cs__timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#7dffb0,#ffd166);}
.cs__stage{position:relative;aspect-ratio:16/10;min-height:280px;border-radius:14px;overflow:hidden;background:#0b1018;}.cs__stage canvas{display:block;width:100%;height:100%;cursor:pointer;}
.cs__q{position:absolute;left:.5rem;right:.5rem;top:.5rem;text-align:center;font-family:var(--font-display);font-size:clamp(.95rem,3.2vw,1.35rem);color:#fff;text-shadow:0 2px 8px #000;pointer-events:none;}
.cs__q small{display:block;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:#7dffb0;}
.cs__ans{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-top:.7rem;}
.cs__ans button{font:inherit;font-weight:800;border-radius:14px;border:2px solid #ffffff55;background:#ffffff14;color:#fff;cursor:pointer;min-height:56px;padding:.4rem .6rem;}.cs__ans button:hover{background:#ffffff2a;}
.cs__ans button.ok{background:#2f9e4f;border-color:#2f9e4f;}.cs__ans button.no{background:#c43a52;border-color:#c43a52;}
.cs__fb{min-height:3.4em;margin-top:.7rem;font-weight:600;font-size:.88rem;}
.cs__foot{display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;font-size:.75rem;color:#aab6c8;gap:1rem;flex-wrap:wrap;}
.cs__mute{font:inherit;font-size:.75rem;padding:.35rem .8rem;border-radius:99px;border:1px solid #ffffff55;background:transparent;color:#d6efe5;cursor:pointer;min-height:44px;}
.cs__end{text-align:center;padding:var(--sp-4);}.cs__end h3{font-family:var(--font-display);font-size:var(--step-3);color:#fff;margin:.2rem 0;}
.cs__stats{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin:1rem 0;}.cs__stats b{display:block;font-size:2rem;color:#7dffb0;font-family:var(--font-display);}
.cs__end ul{text-align:left;max-width:36rem;margin:.6rem auto 1rem;font-size:.85rem;}
@media (max-width:640px){.cs__ans{grid-template-columns:1fr}}`;
  document.head.append(s);
}

function cardTexture(THREE, text) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 384; const x = c.getContext("2d"); const g = x.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, "#fff6d6"); g.addColorStop(1, "#e8d8a0"); x.fillStyle = g; x.fillRect(0, 0, 512, 384); x.strokeStyle = "#8a6a1c"; x.lineWidth = 12; x.strokeRect(8, 8, 496, 368);
  x.fillStyle = "#2a2310"; x.textAlign = "center"; x.textBaseline = "middle"; const words = text.split(" "); const lines = []; let cur = ""; words.forEach(w => { const t = cur ? cur + " " + w : w; if (t.length > 15 && cur) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur); const fs = lines.length > 3 ? 40 : lines.length > 2 ? 48 : 58; x.font = "bold " + fs + "px sans-serif"; lines.forEach((l, i) => x.fillText(l, 256, 192 + (i - (lines.length - 1) / 2) * (fs + 8), 460));
  const t = new THREE.CanvasTexture(c); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t;
}
function groundTexture(THREE, base) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"); const col = "#" + base.toString(16).padStart(6, "0"); x.fillStyle = col; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${0.03 + Math.random() * 0.07})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 4); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t;
}
function makeCreature(THREE, s) {
  const g = new THREE.Group(); const M = (c, r = 0.55) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  if (s.m === "fish") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), M(s.top, 0.4)); body.scale.set(s.long, s.round * 0.8, 0.55); g.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(s.bel, 0.4)); belly.scale.set(s.long * 1.003, s.round * 0.8, 0.55 * 1.003); g.add(belly);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.35 * s.round, 0.7, 4), M(s.top, 0.4)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.5 * s.long - 0.25; g.add(tail);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.05, s.eye) * 1.3, 12, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })); eye.position.set(0.5 * s.long - 0.25, 0.12 * s.round, 0.27); g.add(eye); const eye2 = eye.clone(); eye2.position.z = -0.27; g.add(eye2);
    if (s.bill) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.06, 1.1, 8), M(0x3a4650)); b.rotation.z = -Math.PI / 2; b.position.x = 0.5 * s.long + 0.45; g.add(b); }
    g.scale.setScalar(1.6);
  } else if (s.m === "mammal") {
    const fur = M(s.fur, 0.9); const th = 0.85 + s.thick * 0.5; const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), fur); body.scale.set(1.5 * th, 0.9 * th, 0.8 * th); body.position.y = 0.7; g.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(0.34 * th, 16, 12), fur); head.position.set(0.95 * th, 0.9, 0); g.add(head);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 8), fur); snout.rotation.z = -Math.PI / 2; snout.position.set(1.3 * th, 0.85, 0); g.add(snout); [-0.5, 0.5].forEach(x => [-0.25, 0.25].forEach(z => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8), fur); l.position.set(x * th, 0.25, z); g.add(l); })); const tl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), fur); tl.position.set(-1.0 * th, 0.8, 0); tl.scale.set(1.6, 0.8, 0.8); g.add(tl); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); ey.position.set(1.12 * th, 1.0, 0.18); g.add(ey); g.scale.setScalar(1.4);
  } else if (s.m === "lizard") {
    const sk = M(s.fur, 0.7); const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), sk); body.scale.set(2, 0.45, 0.7); body.position.y = 0.2; g.add(body); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), sk); hd.position.set(0.95, 0.25, 0); hd.scale.set(1.2, 0.7, 0.9); g.add(hd); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.4, 8), sk); tail.rotation.z = Math.PI / 2; tail.position.set(-1.6, 0.15, 0); g.add(tail); [[0.5, 0.35], [0.5, -0.35], [-0.5, 0.35], [-0.5, -0.35]].forEach(p => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 6), sk); l.position.set(p[0], 0.1, p[1]); l.rotation.x = p[1] > 0 ? 0.8 : -0.8; g.add(l); }); g.scale.setScalar(1.3);
  } else if (s.m === "frog") {
    const sk = M(s.fur, 0.35); const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), sk); body.scale.set(1.2, 0.8, 1); body.position.y = 0.5; g.add(body); [-0.25, 0.25].forEach(z => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), sk); e.position.set(0.45, 1.0, z); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); p.position.set(0.58, 1.02, z); g.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), sk); l.scale.set(1.5, 0.5, 0.5); l.position.set(-0.4, 0.3, z * 2.2); g.add(l); }); g.scale.setScalar(1.3);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}

export function mountSafari(host, { onFinish }) {
  css(); const THREE = window.THREE; let gl = null; try { const c = document.createElement("canvas"); gl = !!THREE && (c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { gl = null; }
  const queue = []; const sc = shuffle(SCENES.map((_, i) => i)), cd = shuffle(CARDS.map((_, i) => i)); let si = 0, ci = 0; for (let k = 0; k < 60; k++) { if (k % 3 === 2) queue.push(["card", cd[ci++ % cd.length]]); else queue.push(["scene", sc[si++ % sc.length]]); }
  let qi = 0, score = 0, streak = 0, best = 0, hits = 0, answered = 0, over = false, locked = false, cur = null; const missed = [];
  const t0 = performance.now();
  host.innerHTML = `<div class="cs"><div class="cs__hud"><span>${T("Time")}<b id="csT">120</b></span><span>${T("Found")}<b id="csF">0</b></span><span>${T("Streak")}<b id="csS">0</b></span><span>${T("Score")}<b id="csP">0</b></span></div>
    <div class="cs__timer"><i id="csBar"></i></div><div class="cs__stage" id="csStage"><div class="cs__q" id="csQ" aria-live="polite"></div></div>
    <div class="cs__ans" id="csAns" role="group" aria-label="${T("Choose an answer")}"></div><div class="cs__fb" id="csFb" aria-live="polite">${T("Tap the right one.")}</div>
    <div class="cs__foot"><button type="button" class="cs__mute" id="csMute"></button><span>${T("Tap the right animal or card, or press 1, 2 or 3. No lives: keep hunting.")}</span></div></div>`;
  const $ = s => host.querySelector(s); const stage = $("#csStage");
  const paintMute = () => { const on = ttsEnabled(); $("#csMute").textContent = on ? T("Sound on") : T("Sound off"); $("#csMute").setAttribute("aria-label", on ? T("Sound on. Press to mute") : T("Sound off. Press to unmute")); };
  paintMute(); $("#csMute").addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  const paint = () => { $("#csF").textContent = hits; $("#csS").textContent = streak; $("#csP").textContent = score; };
  let renderer, scene, camera, raf = null, ground, ghost = [], items = [], az = 0, sparks = [];
  if (gl) {
    renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; stage.prepend(renderer.domElement);
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fc9ee); camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 80); scene.add(new THREE.HemisphereLight(0xdde9ff, 0x405040, 0.7)); const sun = new THREE.DirectionalLight(0xfff0d6, 1.2); sun.position.set(5, 10, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const s2 = sun.shadow.camera; s2.left = -10; s2.right = 10; s2.top = 8; s2.bottom = -6; scene.add(sun);
    ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(size).observe(stage); size(); let vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(stage);
    renderer.domElement.addEventListener("click", e => { if (locked || over) return; const r = renderer.domElement.getBoundingClientRect(); const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera); const hit = rc.intersectObjects(items.flatMap(g => { const a = []; g.traverse(o => { if (o.isMesh) a.push(o); }); return a; }), false)[0]; if (hit) { let o = hit.object; while (o && o.userData.idx === undefined) o = o.parent; if (o) answer(o.userData.idx); } });
    (function draw() { raf = requestAnimationFrame(draw); if (over || !vis) return; const t = performance.now() / 1000; if (!reduced()) az = Math.sin(t * 0.25) * 0.12; camera.position.set(Math.sin(az) * 12, 5.2, Math.cos(az) * 12); camera.lookAt(0, 0.9, 0); items.forEach((g, i) => { if (!reduced()) g.position.y = Math.sin(t * 1.4 + i) * 0.05; });
      sparks = sparks.filter(b => { b.life -= 0.02; b.pts.material.opacity = Math.max(0, b.life); const a = b.pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { a.array[i * 3] += b.vel[i * 3]; a.array[i * 3 + 1] += b.vel[i * 3 + 1]; a.array[i * 3 + 2] += b.vel[i * 3 + 2]; b.vel[i * 3 + 1] -= 0.003; } a.needsUpdate = true; if (b.life <= 0) { scene.remove(b.pts); return false; } return true; });
      renderer.render(scene, camera); })();
  } else stage.innerHTML = `<div class="cs__q" id="csQ" style="position:static;padding:1rem">${T("3D view is not available on this device. Use the answer buttons.")}</div>`;
  function spark(p, col) { if (!gl) return; const n = 50, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + 1; pos[i * 3 + 2] = p.z; const a = Math.random() * 6.28, b = Math.random() * 3.14, s = 0.04 + Math.random() * 0.08; vel[i * 3] = Math.cos(a) * Math.sin(b) * s; vel[i * 3 + 1] = Math.cos(b) * s + 0.04; vel[i * 3 + 2] = Math.sin(a) * Math.sin(b) * s; } g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size: 0.22, transparent: true, depthWrite: false })); scene.add(pts); sparks.push({ pts, vel, life: 1 }); }
  function nextQ() {
    if (over) return; locked = false; const [kind, idx] = queue[qi++ % queue.length]; let q;
    if (kind === "scene") { const s = SCENES[idx]; q = { kind, prompt: s[0], biome: s[1], specs: s[2], ans: s[3], hook: s[4], names: s[2].map((_, i) => String(i + 1)) }; }
    else { const c = CARDS[idx]; const opts = shuffle([[c[1], true], [c[2], false], [c[3], false]]); q = { kind, prompt: c[0], texts: opts.map(o => o[0]), ans: opts.findIndex(o => o[1]), hook: c[4], correctText: c[1] }; }
    cur = q; const label = kind === "scene" ? T("Spot the animal") : T("Power-up card question"); $("#csQ").innerHTML = `<small>${label}</small>${T(q.prompt)}`;
    $("#csAns").innerHTML = (kind === "scene" ? [0, 1, 2].map(i => `<button type="button" data-i="${i}">${i + 1}</button>`) : q.texts.map((t, i) => `<button type="button" data-i="${i}">${i + 1}. ${T(t)}</button>`)).join("");
    $("#csAns").querySelectorAll("button").forEach(b => b.addEventListener("click", () => answer(+b.dataset.i)));
    if (gl) { items.forEach(g => scene.remove(g)); items = []; const bi = kind === "scene" ? BIOME[q.biome] : BIOME.forest; const nm = kind === "scene" ? q.biome : "card"; scene.background.setHex(kind === "scene" ? (q.biome === "snow" ? 0xcfe0f2 : q.biome === "sand" ? 0xf1dcae : q.biome === "forest" ? 0x6fa77a : q.biome === "deep" ? 0x071a33 : 0x7fc4ee) : 0x9fc9ee);
      ground.material.map = groundTexture(THREE, kind === "scene" ? bi[1] : 0x6fa76a); ground.material.needsUpdate = true; if (kind === "scene" && (q.biome === "deep" || q.biome === "clear")) ground.material.color.setHex(0xffffff);
      [-4.2, 0, 4.2].forEach((x, i) => { let g; if (kind === "scene") { g = makeCreature(THREE, q.specs[i]); g.rotation.y = q.specs[i].m === "fish" ? 0 : 0.5; g.position.set(x, q.specs[i].m === "fish" ? 1.6 : 0, i === 1 ? -0.4 : 0.2); } else { g = new THREE.Group(); const card = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.55), new THREE.MeshStandardMaterial({ map: cardTexture(THREE, T(q.texts[i])), roughness: 0.6 })); card.position.y = 1.9; card.castShadow = true; g.add(card); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x777f8c })); post.position.y = 0.7; g.add(post); g.position.set(x, 0, 0); }
        g.userData.idx = i; const lab = document.createElement("canvas"); lab.width = lab.height = 64; const lx = lab.getContext("2d"); lx.fillStyle = "rgba(0,0,0,.7)"; lx.beginPath(); lx.arc(32, 32, 28, 0, 6.28); lx.fill(); lx.fillStyle = "#fff"; lx.font = "bold 38px sans-serif"; lx.textAlign = "center"; lx.textBaseline = "middle"; lx.fillText(String(i + 1), 32, 34); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(lab), transparent: true, depthTest: false })); sp.scale.set(0.7, 0.7, 1); sp.position.set(0, kind === "scene" ? (q.specs[i].m === "fish" ? 1.3 : 3.0) : 3.6, 0); g.add(sp); scene.add(g); items.push(g); }); }
  }
  function answer(i) {
    if (over || locked || !cur || i < 0 || i > 2) return; locked = true; answered++; const ok = i === cur.ans; const btns = $("#csAns").querySelectorAll("button"); if (btns[i]) btns[i].classList.add(ok ? "ok" : "no"); if (!ok && btns[cur.ans]) btns[cur.ans].classList.add("ok");
    if (ok) { hits++; score += 10 + Math.min(streak, 10) * 2; streak++; best = Math.max(best, streak); $("#csFb").innerHTML = `<b style="color:#7dffb0">${T("Well spotted!")}</b> ${T(cur.hook)}`; if (items[i]) spark(items[i].position, 0x7dffb0); }
    else { streak = 0; missed.push(cur); $("#csFb").innerHTML = `<b style="color:#ff9d8d">${T("Not quite.")}</b> ${T("The answer was")} <b>${cur.kind === "scene" ? T("number") + " " + (cur.ans + 1) : T(cur.correctText)}</b>. ${T(cur.hook)}`; if (items[cur.ans]) spark(items[cur.ans].position, 0xffd166); }
    paint(); setTimeout(() => { if (!over) nextQ(); }, ok ? 1500 : 2300);
  }
  T("number");
  const onKey = e => { if (over) return; if (e.key >= "1" && e.key <= "3" && host.querySelector(".cs")) answer(+e.key - 1); };
  document.addEventListener("keydown", onKey);
  const clock = setInterval(() => { const left = Math.max(0, TOTAL_MS - (performance.now() - t0)); $("#csT").textContent = Math.ceil(left / 1000); $("#csBar").style.width = (left / TOTAL_MS * 100) + "%"; if (left <= 0) end(); }, 100);
  function end() {
    if (over) return; over = true; clearInterval(clock); cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); if (renderer) renderer.dispose(); const acc = answered ? Math.round(hits / answered * 100) : 0; const sm = new Set(); const uniq = missed.filter(m => !sm.has(m.prompt) && sm.add(m.prompt));
    host.innerHTML = `<div class="cs"><div class="cs__end"><h3>${T("Round complete!")}</h3><div class="cs__stats"><div><b>${score}</b>${T("score")}</div><div><b>${hits}</b>${T("found")}</div><div><b>${acc}%</b>${T("accuracy")}</div><div><b>${best}</b>${T("best streak")}</div></div>
      ${uniq.length ? `<p><b>${T("Revisit these:")}</b></p><ul>${uniq.map(m => `<li>${T(m.prompt)} ${m.kind === "card" ? "<b>" + T(m.correctText) + "</b>. " : ""}${T(m.hook)}</li>`).join("")}</ul>` : `<p>${T("Every answer was right. Brilliant!")}</p>`}
      <button type="button" class="btn" id="csAgain">${T("Play again")}</button> <button type="button" class="btn btn--ghost" id="csDone">${T("Close")}</button></div></div>`;
    host.querySelector("#csAgain").addEventListener("click", () => mountSafari(host, { onFinish })); host.querySelector("#csDone").addEventListener("click", () => { host.innerHTML = ""; }); if (onFinish) onFinish({ score, best });
  }
  host.__cs = () => ({ cur, hits }); paint(); nextQ();
}
