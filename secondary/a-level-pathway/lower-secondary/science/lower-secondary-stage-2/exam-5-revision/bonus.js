/* Bonus game for the Exam 5 revision website: "Bone Builder" (build-and-assemble, local to this page).
   A ghost skeleton stands on a pedestal. Each question names a body part; answer correctly and the real 3D part flies into its slot
   until the whole body (bones, muscles and breathing organs) is built. Then power-up questions keep the round going.
   - Quiz-in-the-action: wrong answers never stop the game: they show the right answer and a hook, and the same part is asked again.
   - Game state runs on setInterval wall-clock time. requestAnimationFrame only draws.
   - Real <button>s and keys 1-3 answer; own mute button; reduced motion respected; button-only fallback without WebGL. */
import { ttsEnabled, setTTS } from "../../../../../../engine/accessibility.js?v=6";
import { T, reduced, shuffle } from "../../../../../../engine/revision-kit.js?v=17";

const TOTAL_MS = 120000;
/* id, name, [[question, correct, wrong, wrong, hook], ...] */
const PARTS = [
  ["skull", "Skull", [["Which bone protects the brain?", "Skull", "Spine", "Pelvis", "The skull is the helmet of the body."], ["The hard bones at the top of the skeleton shield which organ?", "The brain", "The lungs", "The stomach", "Skull = brain protector."]]],
  ["spine", "Spine", [["Which part of the skeleton supports the upper body and protects the spinal cord?", "Spine", "Skull", "Femur", "The spine is the backbone."], ["The vertebrae form a tube around which structure?", "The spinal cord", "The heart", "The lungs", "Vertebrae protect the spinal cord."]]],
  ["ribs", "Ribcage", [["Which bones protect the lungs and the heart?", "Ribcage", "Skull", "Pelvis", "Ribs make a cage around the chest."], ["How does the ribcage move when you breathe in?", "Up and out", "Down and in", "It does not move", "Ribs lift to make room for air."]]],
  ["pelvis", "Pelvis", [["Which part of the skeleton connects the legs to the body at the hips?", "Pelvis", "Skull", "Ribs", "The pelvis is the hip girdle."], ["Which bones carry body weight down to the legs?", "Pelvis and femurs", "Skull and ribs", "Spine only", "Weight passes through the hips."]]],
  ["humerusL", "Humerus", [["Which is the bone of the upper arm?", "Humerus", "Femur", "Radius", "Humerus = upper arm."], ["The biceps and triceps pull on which upper-arm bone?", "Humerus", "Skull", "Pelvis", "They sit on the humerus."]]],
  ["humerusR", "Humerus", [["Which bone sits between the shoulder and the elbow?", "Humerus", "Tibia", "Spine", "Upper arm bone."], ["Bones are connected to other bones by...", "Ligaments", "Tendons", "Skin", "Ligaments join bone to bone."]]],
  ["armL", "Radius and ulna", [["Which bones make up the forearm?", "Radius and ulna", "Femur and tibia", "Skull and spine", "Forearm = radius + ulna."], ["Muscles are joined to bones by...", "Tendons", "Ligaments", "Cartilage", "Tendons join muscle to bone."]]],
  ["armR", "Radius and ulna", [["Which bones move when the biceps contracts?", "The forearm bones", "The skull", "The ribs", "The biceps pulls the forearm up."], ["What do muscles do to cause movement?", "Contract and pull", "Push", "Grow longer", "Muscles only pull."]]],
  ["femurL", "Femur", [["Which is the longest bone in the body?", "Femur", "Humerus", "Rib", "The femur is the thigh bone."], ["Which bone is in the upper leg?", "Femur", "Tibia", "Radius", "Femur = thigh."]]],
  ["femurR", "Femur", [["Which bone fits into the hip joint?", "Femur", "Skull", "Rib", "The head of the femur sits in the pelvis."], ["How many bones are in an adult skeleton?", "206", "106", "306", "Adults have 206 bones."]]],
  ["tibiaL", "Tibia", [["Which bone is in the lower leg (shin)?", "Tibia", "Femur", "Humerus", "Tibia = shin bone."], ["What is the smallest bone in the body?", "Stapes (in the ear)", "Tibia", "Femur", "The stapes is the size of a grain of rice."]]],
  ["tibiaR", "Tibia", [["Which pair of bones is below the knee?", "Tibia and fibula", "Radius and ulna", "Skull and jaw", "Lower leg bones."], ["What does bone marrow make?", "Red blood cells", "Calcium", "Collagen", "Marrow = blood factory."]]],
  ["lungs", "Lungs", [["Which are the main organs of breathing?", "The lungs", "The kidneys", "The liver", "Lungs take in oxygen."], ["Which gas do you breathe in that your cells need for respiration?", "Oxygen", "Carbon dioxide", "Argon", "O₂ is needed for respiration."]]],
  ["diaphragm", "Diaphragm", [["Which muscle helps you breathe in when it contracts and flattens?", "The diaphragm", "The biceps", "The heart", "It sits under the lungs."], ["What happens when the diaphragm relaxes?", "Air is pushed out", "Air is drawn in", "The heart stops", "Relaxed = breathe out."]]],
  ["biceps", "Biceps", [["Which muscle bends the arm at the elbow?", "Biceps", "Triceps", "Quadriceps", "Biceps contracts to bend."], ["When the biceps contracts, what does the triceps do?", "Relaxes", "Contracts too", "Turns into bone", "Antagonistic pair."]]],
  ["quads", "Quadriceps", [["Which muscle straightens the knee?", "Quadriceps", "Hamstrings", "Deltoid", "Quads are at the front of the thigh."], ["Which muscle works at the back of the thigh?", "Hamstrings", "Quadriceps", "Triceps", "Hamstrings bend the knee."]]]
];
/* power-up questions from the other lessons */
const POWER = [
  ["Which gas makes up most of the air?", "Nitrogen", "Oxygen", "Argon", "78% nitrogen, 21% oxygen."],
  ["What is diffusion?", "Particles spreading from high to low concentration", "Particles being squashed", "A solid melting", "Think of perfume in a room."],
  ["Which state of matter can be compressed easily?", "Gas", "Solid", "Liquid", "Gas particles are far apart."],
  ["What is the change from solid to liquid called?", "Melting", "Freezing", "Condensation", "Melt = solid to liquid."],
  ["What does paracetamol do?", "Lowers fever and reduces pain", "Kills bacteria", "Kills viruses", "Not an antibiotic."],
  ["Why don't antibiotics work on colds?", "Colds are caused by viruses", "Colds are caused by bacteria", "They are too weak", "Antibiotics kill bacteria only."],
  ["What happens to particles when you heat a substance?", "They move faster", "They stop", "They shrink", "More energy = faster particles."],
  ["What causes air pressure?", "Air particles colliding with surfaces", "Gravity alone", "Still air", "Collisions make pressure."],
  ["Where does respiration happen in a cell?", "Mitochondria", "Nucleus", "Cell wall", "Mitochondria release energy."],
  ["Which change of state turns gas into liquid?", "Condensation", "Evaporation", "Melting", "Think of clouds."],
  ["In which state do particles only vibrate in place?", "Solid", "Liquid", "Gas", "Solids are fixed."],
  ["What is Brownian motion?", "Random movement of particles hit by other particles", "Particles resting", "Melting", "Seen in pollen grains."],
  ["What should you do before taking a medicine?", "Read the label and ask a trusted adult", "Take a double dose", "Share it", "Always check first."],
  ["What gas do plants use in photosynthesis?", "Carbon dioxide", "Oxygen", "Nitrogen", "CO₂ in, O₂ out."],
  ["What does an antihistamine do?", "Blocks histamine", "Kills bacteria", "Lowers fever", "Reduces sneezing."],
  ["Which muscle type never tires?", "Cardiac", "Skeletal", "Smooth", "Heart muscle."]
];
["Time", "Streak", "Score", "Built", "Sound on", "Sound off", "Sound on. Press to mute", "Sound off. Press to unmute", "Right! The part flies into place.", "Not quite.", "The answer was", "Power-up! Bonus points.", "Body complete!", "Where does it go?", "Build the missing part by answering.", "Answer with the buttons or keys 1 to 3. No lives: keep building.",
  "Round complete!", "score", "parts built", "best streak", "Revisit these:", "Every answer was right. Brilliant!", "Play again", "Close", "3D view is not available on this device. Use the answer buttons.", "Build:", "Power-up question"].forEach(T);
PARTS.forEach(p => { T(p[1]); p[2].forEach(q => q.forEach(T)); }); POWER.forEach(q => q.forEach(T));

let styled = false;
function css() {
  if (styled) return; styled = true;
  const s = document.createElement("style");
  s.textContent = `
.bb{background:linear-gradient(180deg,#171f31,#0b0f18);color:#e8eef7;border-radius:var(--radius-lg);padding:var(--sp-5);box-shadow:var(--shadow-3);}
.bb__hud{display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#8fe3ff;margin-bottom:.6rem;}
.bb__hud b{color:#fff;margin-left:.4rem;font-size:1.05rem;}
.bb__timer{height:8px;border-radius:99px;background:#ffffff1f;overflow:hidden;margin-bottom:.8rem;}
.bb__timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#8fe3ff,#f3d36b);}
.bb__stage{position:relative;aspect-ratio:16/10;min-height:280px;border-radius:14px;overflow:hidden;background:#0b1018;}
.bb__stage canvas{display:block;width:100%;height:100%;}
.bb__q{position:absolute;left:.5rem;right:.5rem;top:.5rem;text-align:center;font-family:var(--font-display);font-size:clamp(.95rem,3.2vw,1.35rem);color:#fff;text-shadow:0 2px 8px #000;pointer-events:none;}
.bb__q small{display:block;font-family:var(--font-body,inherit);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:#8fe3ff;}
.bb__ans{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-top:.7rem;}
.bb__ans button{font:inherit;font-weight:800;font-size:.95rem;border-radius:14px;border:2px solid #ffffff55;background:#ffffff14;color:#fff;cursor:pointer;min-height:60px;padding:.4rem .6rem;}
.bb__ans button:hover{background:#ffffff2a;}.bb__ans button kbd{display:inline-block;background:#ffffff26;border-radius:6px;padding:0 .4rem;margin-right:.4rem;font-size:.8rem;}
.bb__ans button.ok{background:#2f9e4f;border-color:#2f9e4f;}.bb__ans button.no{background:#c43a52;border-color:#c43a52;}
.bb__fb{min-height:3.4em;margin-top:.7rem;font-weight:600;font-size:.88rem;}
.bb__foot{display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;font-size:.75rem;color:#aab6c8;gap:1rem;flex-wrap:wrap;}
.bb__mute{font:inherit;font-size:.75rem;padding:.35rem .8rem;border-radius:99px;border:1px solid #ffffff55;background:transparent;color:#d6efe5;cursor:pointer;min-height:44px;}
.bb__end{text-align:center;padding:var(--sp-4);}.bb__end h3{font-family:var(--font-display);font-size:var(--step-3);color:#fff;margin:.2rem 0;}
.bb__stats{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin:1rem 0;}.bb__stats b{display:block;font-size:2rem;color:#8fe3ff;font-family:var(--font-display);}
.bb__end ul{text-align:left;max-width:36rem;margin:.6rem auto 1rem;font-size:.85rem;}
@media (max-width:640px){.bb__ans{grid-template-columns:1fr}}`;
  document.head.append(s);
}

/* builders return a group whose children sit in world coordinates (the finished body stands at the origin) */
function buildPart(THREE, id) {
  const g = new THREE.Group(); const bone = new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.6 }), rib = new THREE.MeshStandardMaterial({ color: 0xf0e6cf, roughness: 0.55 });
  const bar = (a, b, r, m = bone) => { const d = new THREE.Vector3().subVectors(b, a); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, d.length(), 14), m); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); c.castShadow = true; g.add(c); [a, b].forEach(p => { const s = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 14, 10), m); s.position.copy(p); s.castShadow = true; g.add(s); }); };
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z); const side = id.endsWith("R") ? 1 : -1;
  if (id === "skull") { const c = new THREE.Mesh(new THREE.SphereGeometry(0.85, 28, 20), bone); c.position.set(0, 8.1, 0); c.scale.set(1, 1.05, 1.1); c.castShadow = true; g.add(c); const j = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.7), bone); j.position.set(0, 7.45, 0.35); g.add(j); for (const x of [-0.3, 0.3]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); e.position.set(x, 8.15, 0.85); g.add(e); } }
  else if (id === "spine") { for (let i = 0; i < 14; i++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 14), bone); v.position.set(0, 3.8 + i * 0.27, -0.55 - Math.sin(i / 13 * 3.14) * 0.1); v.castShadow = true; g.add(v); } }
  else if (id === "ribs") { for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const y = 4.6 + i * 0.4, w = 1.0 + Math.sin((i + 1) / 9 * Math.PI) * 0.75; const pts = [V(s * 0.1, y, -0.5), V(s * w * 0.8, y - 0.05, -0.35), V(s * w, y - 0.2, 0.25), V(s * w * 0.7, y - 0.4, 0.8), V(s * 0.2, y - 0.5, 0.95)]; const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.055, 6), rib); t.castShadow = true; g.add(t); } const st = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 0.12), rib); st.position.set(0, 5.9, 0.95); g.add(st); }
  else if (id === "pelvis") { const t = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.2, 12, 28), bone); t.rotation.x = Math.PI / 2 * 0.9; t.scale.set(1.1, 0.8, 1); t.position.set(0, 3.5, 0); t.castShadow = true; g.add(t); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), bone); w.scale.set(0.8, 1.1, 0.5); w.position.set(s * 0.95, 3.8, -0.1); g.add(w); } }
  else if (id.startsWith("humerus")) bar(V(side * 1.6, 6.5), V(side * 1.9, 4.8), 0.12);
  else if (id.startsWith("arm")) { bar(V(side * 1.9, 4.8), V(side * 2.25, 3.2), 0.1); bar(V(side * 2.05, 4.8), V(side * 2.45, 3.2), 0.06); }
  else if (id.startsWith("femur")) bar(V(side * 0.6, 3.3), V(side * 0.75, 1.1), 0.17);
  else if (id.startsWith("tibia")) { bar(V(side * 0.75, 1.1), V(side * 0.8, -0.9), 0.13); bar(V(side * 0.95, 1.1), V(side * 0.95, -0.9), 0.06); }
  else if (id === "lungs") { const m = new THREE.MeshPhysicalMaterial({ color: 0xf08a98, roughness: 0.5, clearcoat: 0.5, transparent: true, opacity: 0.9, emissive: 0x3a0a14 }); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), m); l.scale.set(0.55, 1.1, 0.5); l.position.set(s * 0.72, 5.8, 0); l.castShadow = true; g.add(l); } }
  else if (id === "diaphragm") { const d = new THREE.Mesh(new THREE.SphereGeometry(1.35, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb4423e, roughness: 0.55, side: THREE.DoubleSide })); d.scale.set(1, 0.4, 0.6); d.position.set(0, 4.55, 0); g.add(d); }
  else if (id === "biceps") { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xc2403a, roughness: 0.45, clearcoat: 0.4 })); m.scale.set(0.2, 0.75, 0.2); m.position.set(-1.9, 5.7, 0.2); m.rotation.z = 0.15; m.castShadow = true; g.add(m); }
  else if (id === "quads") { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xc2403a, roughness: 0.45, clearcoat: 0.4 })); m.scale.set(0.3, 1.0, 0.28); m.position.set(0.7, 2.3, 0.25); m.castShadow = true; g.add(m); }
  return g;
}

export function mountBuilder(host, { onFinish }) {
  css();
  const THREE = window.THREE; let gl = null; try { const c = document.createElement("canvas"); gl = !!THREE && (c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { gl = null; }
  const order = shuffle(PARTS.map((p, i) => i)); let oi = 0, built = 0, score = 0, streak = 0, best = 0, answered = 0, hits = 0, over = false, tries = 0, pq = 0, mode = "part", cur = null, locked = false; const missed = []; const spare = shuffle(POWER); let si = 0;
  const t0 = performance.now();
  host.innerHTML = `<div class="bb"><div class="bb__hud"><span>${T("Time")}<b id="bbT">120</b></span><span>${T("Built")}<b id="bbB">0/16</b></span><span>${T("Streak")}<b id="bbS">0</b></span><span>${T("Score")}<b id="bbP">0</b></span></div>
    <div class="bb__timer"><i id="bbBar"></i></div><div class="bb__stage" id="bbStage"><div class="bb__q" id="bbQ" aria-live="polite"></div></div>
    <div class="bb__ans" id="bbAns" role="group" aria-label="${T("Choose an answer")}"></div><div class="bb__fb" id="bbFb" aria-live="polite">${T("Build the missing part by answering.")}</div>
    <div class="bb__foot"><button type="button" class="bb__mute" id="bbMute"></button><span>${T("Answer with the buttons or keys 1 to 3. No lives: keep building.")}</span></div></div>`;
  const $ = s => host.querySelector(s); const stage = $("#bbStage");
  const paintMute = () => { const on = ttsEnabled(); $("#bbMute").textContent = on ? T("Sound on") : T("Sound off"); $("#bbMute").setAttribute("aria-label", on ? T("Sound on. Press to mute") : T("Sound off. Press to unmute")); };
  paintMute(); $("#bbMute").addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  const paint = () => { $("#bbB").textContent = built + "/" + PARTS.length; $("#bbS").textContent = streak; $("#bbP").textContent = score; };
  /* ------------------------------------------------------------ 3D scene */
  let renderer, scene, camera, raf = null, slots = {}, flying = [], bursts = [], az = 0, glow = 0, hiMat = null;
  if (gl) {
    renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; stage.prepend(renderer.domElement);
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e1522); scene.fog = new THREE.Fog(0x0e1522, 18, 40);
    camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 80); scene.add(new THREE.HemisphereLight(0xaac4ff, 0x20242b, 0.5)); const sun = new THREE.DirectionalLight(0xfff0d6, 1.1); sun.position.set(5, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 12; sc.bottom = -4; sc.near = 1; sc.far = 40; scene.add(sun);
    const rim = new THREE.PointLight(0x6fd3ff, 1.3, 30); rim.position.set(-6, 6, -6); scene.add(rim);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.4, 48), new THREE.MeshStandardMaterial({ color: 0x20293a, metalness: 0.6, roughness: 0.35 })); ped.position.y = -1.1; ped.receiveShadow = true; scene.add(ped);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.04, 8, 64), new THREE.MeshBasicMaterial({ color: 0x8fe3ff })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.88; scene.add(ring);
    hiMat = new THREE.MeshBasicMaterial({ color: 0xffd166, wireframe: true, transparent: true, opacity: 0.8 });
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x6fd3ff, wireframe: true, transparent: true, opacity: 0.35 });
    PARTS.forEach(p => { const gh = buildPart(THREE, p[0]); gh.traverse(o => { if (o.isMesh) { o.material = ghostMat; o.castShadow = false; } }); scene.add(gh); slots[p[0]] = { ghost: gh, real: null }; });
    const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(size).observe(stage); size(); let vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(stage);
    (function draw() {
      raf = requestAnimationFrame(draw); if (over || !vis) return; const now = performance.now(), t = now / 1000; if (!reduced()) az += 0.0035; const R = 17, y = 4.2; camera.position.set(Math.sin(az) * R * 0.55, y + 2.0, Math.cos(az) * R); camera.lookAt(0, 3.4, 0);
      glow = 0.25 + Math.abs(Math.sin(t * 2)) * 0.35; ghostMat.opacity = glow;
      Object.keys(slots).forEach(k => { const g = slots[k].ghost; if (g && cur && cur.part === k) g.traverse(o => { if (o.isMesh) o.material = hiMat; }); else if (g) g.traverse(o => { if (o.isMesh && o.material === hiMat) o.material = ghostMat; }); });
      hiMat.opacity = 0.6 + Math.sin(t * 6) * 0.3;
      flying = flying.filter(f => { const e = Math.min(1, (now - f.t) / 900); const k = 1 - Math.pow(1 - e, 3); f.g.position.set(f.from.x * (1 - k), f.from.y * (1 - k), f.from.z * (1 - k)); f.g.rotation.set(f.rot.x * (1 - k), f.rot.y * (1 - k), 0); if (e >= 1) { burst(f.at); return false; } return true; });
      bursts = bursts.filter(b => { b.life -= 0.02; b.pts.material.opacity = Math.max(0, b.life); const a = b.pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { a.array[i * 3] += b.vel[i * 3]; a.array[i * 3 + 1] += b.vel[i * 3 + 1]; a.array[i * 3 + 2] += b.vel[i * 3 + 2]; b.vel[i * 3 + 1] -= 0.003; } a.needsUpdate = true; if (b.life <= 0) { scene.remove(b.pts); return false; } return true; });
      renderer.render(scene, camera);
    })();
  } else stage.innerHTML = `<div class="bb__q" id="bbQ" style="position:static;padding:1rem">${T("3D view is not available on this device. Use the answer buttons.")}</div>`;
  function burst(p) { if (!gl) return; const n = 60, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; const a = Math.random() * 6.28, b = Math.random() * 3.14, s = 0.04 + Math.random() * 0.08; vel[i * 3] = Math.cos(a) * Math.sin(b) * s; vel[i * 3 + 1] = Math.cos(b) * s + 0.04; vel[i * 3 + 2] = Math.sin(a) * Math.sin(b) * s; } g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffd166, size: 0.2, transparent: true, depthWrite: false })); scene.add(pts); bursts.push({ pts, vel, life: 1 }); }
  function place(id) {
    if (!gl) return; const real = buildPart(THREE, id); real.traverse(o => { if (o.isMesh) o.receiveShadow = true; }); const ang = Math.random() * 6.28; const from = new THREE.Vector3(Math.cos(ang) * 7, 7 + Math.random() * 3, Math.sin(ang) * 7); real.position.copy(from); scene.add(real); const gh = slots[id].ghost; scene.remove(gh); slots[id].ghost = null; slots[id].real = real; flying.push({ g: real, from, rot: { x: Math.random() * 6, y: Math.random() * 6 }, t: performance.now(), at: new THREE.Vector3(0, 4, 0) });
  }
  /* ------------------------------------------------------------ questions */
  function nextQ() {
    if (over) return; locked = false; const done = built >= PARTS.length; if (!done && (pq === 3)) { pq = 0; mode = "power"; } else mode = done ? "power" : "part"; if (!done && mode === "part") pq++;
    let q; if (mode === "part") { const p = PARTS[order[oi % PARTS.length]]; const v = p[2][tries % p[2].length]; q = { part: p[0], name: p[1], q: v[0], a: v[1], w: [v[2], v[3]], hook: v[4] }; } else { const v = spare[si++ % spare.length]; q = { part: null, name: "", q: v[0], a: v[1], w: [v[2], v[3]], hook: v[4] }; }
    cur = q; q.opts = shuffle([[q.a, true], [q.w[0], false], [q.w[1], false]]);
    const label = mode === "part" ? `${T("Build:")} ${T(q.name)}` : T("Power-up question");
    $("#bbQ").innerHTML = `<small>${label}</small>${T(q.q)}`; $("#bbAns").innerHTML = q.opts.map((o, i) => `<button type="button" data-i="${i}"><kbd>${i + 1}</kbd>${T(o[0])}</button>`).join("");
    $("#bbAns").querySelectorAll("button").forEach(b => b.addEventListener("click", () => answer(+b.dataset.i)));
  }
  function answer(i) {
    if (over || locked || !cur) return; locked = true; answered++; const ok = cur.opts[i][1]; const btns = $("#bbAns").querySelectorAll("button"); btns[i].classList.add(ok ? "ok" : "no"); if (!ok) btns.forEach((b, k) => { if (cur.opts[k][1]) b.classList.add("ok"); });
    if (ok) { hits++; score += (mode === "power" ? 15 : 10) + Math.min(streak, 10) * 2; streak++; best = Math.max(best, streak); $("#bbFb").innerHTML = `<b style="color:#7dffb0">${T(mode === "power" ? "Power-up! Bonus points." : "Right! The part flies into place.")}</b> ${T(cur.hook)}`; if (mode === "part") { place(cur.part); built++; oi++; tries = 0; if (built >= PARTS.length) $("#bbFb").innerHTML += ` <b>${T("Body complete!")}</b>`; } }
    else { streak = 0; missed.push(cur); tries++; $("#bbFb").innerHTML = `<b style="color:#ff9d8d">${T("Not quite.")}</b> ${T("The answer was")} <b>${T(cur.a)}</b>. ${T(cur.hook)}`; if (mode === "part" && tries >= 2) { place(cur.part); built++; oi++; tries = 0; } }
    paint(); setTimeout(() => { if (!over) nextQ(); }, ok ? 1500 : 2100);
  }
  const onKey = e => { if (over) return; if (e.key >= "1" && e.key <= "3" && host.querySelector(".bb")) answer(+e.key - 1); };
  document.addEventListener("keydown", onKey);
  const clock = setInterval(() => { const left = Math.max(0, TOTAL_MS - (performance.now() - t0)); $("#bbT").textContent = Math.ceil(left / 1000); $("#bbBar").style.width = (left / TOTAL_MS * 100) + "%"; if (left <= 0) end(); }, 100);
  function end() {
    if (over) return; over = true; clearInterval(clock); cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); if (renderer) renderer.dispose();
    const acc = answered ? Math.round(hits / answered * 100) : 0; const seenM = new Set(); const uniq = missed.filter(m => !seenM.has(m.q) && seenM.add(m.q));
    host.innerHTML = `<div class="bb"><div class="bb__end"><h3>${T("Round complete!")}</h3><div class="bb__stats"><div><b>${score}</b>${T("score")}</div><div><b>${built}/${PARTS.length}</b>${T("parts built")}</div><div><b>${acc}%</b>${T("accuracy")}</div><div><b>${best}</b>${T("best streak")}</div></div>
      ${uniq.length ? `<p><b>${T("Revisit these:")}</b></p><ul>${uniq.map(m => `<li>${T(m.q)} <b>${T(m.a)}</b>. ${T(m.hook)}</li>`).join("")}</ul>` : `<p>${T("Every answer was right. Brilliant!")}</p>`}
      <button type="button" class="btn" id="bbAgain">${T("Play again")}</button> <button type="button" class="btn btn--ghost" id="bbDone">${T("Close")}</button></div></div>`;
    host.querySelector("#bbAgain").addEventListener("click", () => mountBuilder(host, { onFinish })); host.querySelector("#bbDone").addEventListener("click", () => { host.innerHTML = ""; });
    if (onFinish) onFinish({ score, best, built });
  }
  host.__bb = () => ({ cur, built });
  paint(); nextQ();
}
