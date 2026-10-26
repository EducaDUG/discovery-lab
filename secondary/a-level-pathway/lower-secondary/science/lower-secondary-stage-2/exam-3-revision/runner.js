/* Bonus game for the Exam 3 revision website: "pH Runner" (steer-through-the-answer 3D runner, local to this page).
   A glowing runner dashes down a 3D track. Each gate has three coloured doors (Acid, Neutral, Alkali) and a substance floats above it.
   - Quiz-in-the-action: the answer is the door you steer through. Nothing ever stops, and a wrong door just names the right one with a memory hook.
   - Game state runs on setInterval wall-clock time. requestAnimationFrame only draws the scene from performance.now().
   - Real <button>s (and arrow keys, and swipe) steer; has its own mute button; respects reduced motion; calm DOM fallback if WebGL is missing. */
import { ttsEnabled, setTTS } from "../../../../../../engine/accessibility.js?v=6";
import { T, L, reduced, shuffle, el } from "../../../../../../engine/revision-kit.js?v=8";

const TOTAL_MS = 120000, FIRST = 4500, GAP = 5500, SPEED = 6;
const LANES = [
  { id: 0, name: "Acid", color: "#e53935", x: -2.2 },
  { id: 1, name: "Neutral", color: "#43a047", x: 0 },
  { id: 2, name: "Alkali", color: "#8e24aa", x: 2.2 }
];
const ITEMS = [
  ["Lemon juice", 0, "Lemon juice is a weak acid, about pH 2."], ["Pure water", 1, "Pure water is neutral: pH 7."], ["Bleach", 2, "Bleach is a strong alkali, about pH 12."],
  ["Vinegar", 0, "Vinegar is a weak acid, about pH 3."], ["Soap solution", 2, "Soap is a weak alkali, about pH 9."], ["Battery acid", 0, "Battery acid is a strong acid and corrosive."],
  ["Oven cleaner", 2, "Oven cleaner is a strong alkali that can cause burns."], ["Distilled water", 1, "Distilled water is neutral: pH 7."], ["Hydrochloric acid", 0, "Hydrochloric acid is a strong acid."],
  ["Washing-up liquid", 2, "Washing-up liquid is a weak alkali and a mild irritant."], ["Sodium hydroxide", 2, "Sodium hydroxide is a strong alkali."], ["Sugar solution", 1, "Sugar water is neutral: it does not change an indicator."],
  ["Toothpaste", 2, "Toothpaste is a weak alkali."], ["Stomach acid", 0, "Stomach acid is a strong acid, about pH 2."], ["Salt water", 1, "Salt water is neutral, about pH 7."]
];

["Through the right door!", "Not that door.", "belongs through", "Run complete!", "score", "accuracy", "best streak", "Revisit these:", "Every gate was correct. Brilliant!", "Play again", "Close", "Time", "Streak", "Score", "Move left", "Move right", "Left", "Right", "Choose a door", "Read the substance on the next gate, then steer through the matching door.", "Sound on", "Sound off", "Sound on. Press to mute", "Sound off. Press to unmute", "Left and right arrows, buttons, or swipe. No lives: keep running.", "3D view is not available on this device. Use the door buttons to answer each gate.", "Where does", "belong?", "Acid", "Neutral", "Alkali"].forEach(T);
ITEMS.forEach(i => { T(i[0]); T(i[2]); });
let styled = false;
function css() {
  if (styled) return; styled = true;
  const s = document.createElement("style");
  s.textContent = `
.rn{background:linear-gradient(180deg,#0e2a21,#0a1b15);color:#e1f0e9;border-radius:var(--radius-lg);padding:var(--sp-5);box-shadow:var(--shadow-3);}
.rn__hud{display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#7dffd0;margin-bottom:.6rem;}
.rn__hud b{color:#fff;margin-left:.4rem;font-size:1.05rem;}
.rn__timer{height:8px;border-radius:99px;background:#ffffff1f;overflow:hidden;margin-bottom:.8rem;}
.rn__timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3fd9a0,#f3d36b);}
.rn__stage{position:relative;aspect-ratio:16/9;min-height:240px;border-radius:14px;overflow:hidden;background:#0a1b24;touch-action:pan-y;}
.rn__stage canvas{display:block;width:100%;height:100%;}
.rn__q{position:absolute;left:0;right:0;top:.5rem;text-align:center;font-family:var(--font-display);font-size:clamp(1rem,3.5vw,1.5rem);color:#fff;text-shadow:0 2px 8px #000;pointer-events:none;}
.rn__ctl{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-top:.7rem;}
.rn__ctl button{font:inherit;font-weight:800;font-size:1rem;border-radius:14px;border:2px solid #ffffff55;background:#ffffff12;color:#fff;cursor:pointer;min-height:56px;}
.rn__ctl button:hover{background:#ffffff26;}
.rn__lanes{display:flex;justify-content:center;gap:.5rem;margin-top:.5rem;flex-wrap:wrap;}
.rn__lanes button{font:inherit;font-weight:700;font-size:.85rem;padding:.4rem .9rem;border-radius:99px;border:2px solid var(--c);background:transparent;color:#fff;cursor:pointer;min-height:44px;}
.rn__lanes button.on{background:var(--c);}
.rn__fb{min-height:3.4em;margin-top:.7rem;font-weight:600;font-size:.88rem;}
.rn__foot{display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;font-size:.75rem;color:#a9c9bc;gap:1rem;flex-wrap:wrap;}
.rn__mute{font:inherit;font-size:.75rem;padding:.35rem .8rem;border-radius:99px;border:1px solid #ffffff55;background:transparent;color:#d6efe5;cursor:pointer;min-height:44px;}
.rn__end{text-align:center;padding:var(--sp-4);}
.rn__end h3{font-family:var(--font-display);font-size:var(--step-3);color:#fff;margin:.2rem 0;}
.rn__stats{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin:1rem 0;}
.rn__stats b{display:block;font-size:2rem;color:#7dffd0;font-family:var(--font-display);}
.rn__end ul{text-align:left;max-width:36rem;margin:.6rem auto 1rem;font-size:.85rem;}`;
  document.head.append(s);
}

function labelTexture(THREE, text, color) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, color); g.addColorStop(1, "#000000"); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.globalAlpha = 0.25; x.fillStyle = "#fff"; x.fillRect(0, 0, 256, 18); x.globalAlpha = 1;
  x.fillStyle = "#fff"; x.font = "bold 44px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 128);
  const t = new THREE.CanvasTexture(c); return t;
}
function bannerTexture(THREE, text) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128; const x = c.getContext("2d");
  x.fillStyle = "rgba(0,0,0,.75)"; x.fillRect(0, 0, 512, 128); x.strokeStyle = "#7dffd0"; x.lineWidth = 6; x.strokeRect(3, 3, 506, 122);
  x.fillStyle = "#fff"; x.font = "bold 46px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 256, 66, 480);
  return new THREE.CanvasTexture(c);
}

export function mountRunner(host, { onFinish }) {
  css();
  const THREE = window.THREE;
  let gl = null; try { const c = document.createElement("canvas"); gl = !!THREE && (c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { gl = null; }
  const order = shuffle(ITEMS); const gates = []; for (let k = 0; ; k++) { const t = FIRST + k * GAP; if (t > TOTAL_MS - 6000) break; gates.push({ t, item: order[k % order.length], done: false }); }
  let lane = 1, score = 0, streak = 0, best = 0, hits = 0, answered = 0, over = false; const missed = [];
  const t0 = performance.now(), nameOf = i => T(LANES[i].name);
  host.innerHTML = `<div class="rn"><div class="rn__hud"><span>${T("Time")}<b id="rnT">120</b></span><span>${T("Streak")}<b id="rnS">0</b></span><span>${T("Score")}<b id="rnP">0</b></span></div>
    <div class="rn__timer"><i id="rnBar"></i></div>
    <div class="rn__stage" id="rnStage"><div class="rn__q" id="rnQ" aria-live="polite"></div></div>
    <div class="rn__ctl"><button type="button" id="rnL" aria-label="${T("Move left")}">&larr; ${T("Left")}</button><button type="button" id="rnR" aria-label="${T("Move right")}">${T("Right")} &rarr;</button></div>
    <div class="rn__lanes" role="group" aria-label="${T("Choose a door")}">${LANES.map(l => `<button type="button" data-l="${l.id}" style="--c:${l.color}">${nameOf(l.id)}</button>`).join("")}</div>
    <div class="rn__fb" id="rnFb" aria-live="polite">${T("Read the substance on the next gate, then steer through the matching door.")}</div>
    <div class="rn__foot"><button type="button" class="rn__mute" id="rnMute"></button><span>${T("Left and right arrows, buttons, or swipe. No lives: keep running.")}</span></div></div>`;
  const $ = s => host.querySelector(s);
  const paintMute = () => { const on = ttsEnabled(); $("#rnMute").textContent = on ? T("Sound on") : T("Sound off"); $("#rnMute").setAttribute("aria-label", on ? T("Sound on. Press to mute") : T("Sound off. Press to unmute")); };
  paintMute(); $("#rnMute").addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  const setLane = n => { lane = Math.max(0, Math.min(2, n)); host.querySelectorAll(".rn__lanes button").forEach(b => b.classList.toggle("on", +b.dataset.l === lane)); };
  setLane(1);
  $("#rnL").addEventListener("click", () => setLane(lane - 1)); $("#rnR").addEventListener("click", () => setLane(lane + 1));
  host.querySelectorAll(".rn__lanes button").forEach(b => b.addEventListener("click", () => setLane(+b.dataset.l)));
  const onKey = e => { if (!host.contains($(".rn"))) return; if (e.key === "ArrowLeft" || e.key === "a") { setLane(lane - 1); e.preventDefault(); } else if (e.key === "ArrowRight" || e.key === "d") { setLane(lane + 1); e.preventDefault(); } else if (e.key >= "1" && e.key <= "3") setLane(+e.key - 1); };
  document.addEventListener("keydown", onKey);
  let sx = null; const stage = $("#rnStage");
  stage.addEventListener("pointerdown", e => { sx = e.clientX; });
  stage.addEventListener("pointerup", e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 28) setLane(lane + (dx > 0 ? 1 : -1)); else { const r = stage.getBoundingClientRect(); const f = (e.clientX - r.left) / r.width; setLane(f < 0.33 ? 0 : f > 0.66 ? 2 : 1); } });

  /* ------------------------------------------------------------ 3D scene */
  let renderer = null, scene, camera, runner, gateObjs = [], raf = null, trail = [];
  if (gl) {
    renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); stage.prepend(renderer.domElement);
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a1b24); scene.fog = new THREE.Fog(0x0a1b24, 14, 46);
    camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 80); camera.position.set(0, 3.1, 6.2); camera.lookAt(0, 0.9, -8);
    scene.add(new THREE.HemisphereLight(0xdff3ff, 0x1a2a1f, 1.0)); const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(3, 8, 4); scene.add(dl);
    const track = new THREE.Mesh(new THREE.PlaneGeometry(8, 90), new THREE.MeshStandardMaterial({ color: 0x1b2f3b, roughness: 0.8 })); track.rotation.x = -Math.PI / 2; track.position.z = -35; scene.add(track);
    const stripes = []; for (let i = 0; i < 24; i++) for (const x of [-1.1, 1.1]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.4), new THREE.MeshBasicMaterial({ color: 0x7dffd0, transparent: true, opacity: 0.55 })); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.01, -i * 3.2); scene.add(s); stripes.push(s); }
    for (const side of [-4.4, 4.4]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 90), new THREE.MeshStandardMaterial({ color: 0x24566a, emissive: 0x0a2230 })); wall.position.set(side, 0.6, -35); scene.add(wall); }
    runner = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), new THREE.MeshStandardMaterial({ color: 0xf3d36b, emissive: 0x6a4a00, roughness: 0.3 })); runner.position.set(0, 0.55, 0); scene.add(runner);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.03; runner.add(halo); runner.userData.halo = halo;
    gates.forEach(g => {
      const grp = new THREE.Group();
      LANES.forEach(l => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.4), new THREE.MeshBasicMaterial({ map: labelTexture(THREE, nameOf(l.id).toUpperCase(), l.color), transparent: true })); m.position.set(l.x, 1.3, 0); grp.add(m); const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: l.color })); base.position.set(l.x, 0.06, 0); grp.add(base); m.userData.lane = l.id; });
      const ban = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshBasicMaterial({ map: bannerTexture(THREE, T(g.item[0])), transparent: true })); ban.position.set(0, 3.7, 0); grp.add(ban);
      grp.visible = false; scene.add(grp); gateObjs.push(grp); g.obj = grp;
    });
    const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(size).observe(stage); size();
    let vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(stage);
    (function draw() {
      raf = requestAnimationFrame(draw); if (over || !vis) return;
      const now = performance.now() - t0;
      runner.position.x += (LANES[lane].x - runner.position.x) * 0.18; runner.position.y = 0.55 + (reduced() ? 0 : Math.abs(Math.sin(now / 160)) * 0.18); runner.rotation.x -= 0.15;
      if (!reduced()) camera.position.x = runner.position.x * 0.35;
      camera.lookAt(runner.position.x * 0.2, 0.9, -8);
      stripes.forEach((s, i) => { s.position.z = (((i >> 1) * 3.2 + now / 1000 * SPEED) % (24 * 3.2)) - 70 + 70 - 24 * 3.2 + 3.2; s.position.z = -((((i >> 1) * 3.2 - now / 1000 * SPEED) % (24 * 3.2) + 24 * 3.2) % (24 * 3.2)) + 4; });
      gates.forEach(g => { const dz = (g.t - now) / 1000 * SPEED; g.obj.position.z = -dz; g.obj.visible = dz < 38 && dz > -3 && !g.gone; });
      renderer.render(scene, camera);
    })();
  } else {
    stage.innerHTML = `<div class="rn__q" id="rnQ" aria-live="polite" style="position:static;padding:1rem">${T("3D view is not available on this device. Use the door buttons to answer each gate.")}</div>`;
  }

  /* ------------------------------------------------------------ game clock (wall-clock, never rAF) */
  function paint() { $("#rnS").textContent = streak; $("#rnP").textContent = score; }
  function upcoming(now) { return gates.find(g => !g.done && g.t - now < 6000 && g.t - now > -200); }
  const clock = setInterval(() => {
    const now = performance.now() - t0, left = Math.max(0, TOTAL_MS - now);
    $("#rnT").textContent = Math.ceil(left / 1000); $("#rnBar").style.width = (left / TOTAL_MS * 100) + "%";
    const up = upcoming(now); const q = host.querySelector("#rnQ"); if (q && up) q.textContent = `${T("Where does")} ${T(up.item[0])} ${T("belong?")}`.replace(/ \?$/, "?"); else if (q && !up && !over) q.textContent = "";
    gates.forEach(g => {
      if (g.done || now < g.t) return; g.done = true; answered++;
      const ok = lane === g.item[1];
      if (ok) { score += 10 + Math.min(streak, 10) * 2; streak++; best = Math.max(best, streak); hits++; $("#rnFb").innerHTML = `<b style="color:#7dffd0">${T("Through the right door!")}</b> ${T(g.item[2])}`; }
      else { streak = 0; missed.push(g.item); $("#rnFb").innerHTML = `<b style="color:#ff9d8d">${T("Not that door.")}</b> ${T(g.item[0])} ${T("belongs through")} <b>${nameOf(g.item[1])}</b>. ${T(g.item[2])}`; }
      if (g.obj) { g.gone = true; g.obj.visible = false; }
      paint();
    });
    if (left <= 0) end();
  }, 100);
  function end() {
    if (over) return; over = true; clearInterval(clock); cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey);
    if (renderer) renderer.dispose();
    const acc = answered ? Math.round(hits / answered * 100) : 0;
    host.innerHTML = `<div class="rn"><div class="rn__end"><h3>${T("Run complete!")}</h3><div class="rn__stats"><div><b>${score}</b>${T("score")}</div><div><b>${acc}%</b>${T("accuracy")}</div><div><b>${best}</b>${T("best streak")}</div></div>
      ${missed.length ? `<p><b>${T("Revisit these:")}</b></p><ul>${missed.map(m => `<li>${T(m[0])}: <b>${nameOf(m[1])}</b>. ${T(m[2])}</li>`).join("")}</ul>` : `<p>${T("Every gate was correct. Brilliant!")}</p>`}
      <button type="button" class="btn" id="rnAgain">${T("Play again")}</button> <button type="button" class="btn btn--ghost" id="rnDone">${T("Close")}</button></div></div>`;
    host.querySelector("#rnAgain").addEventListener("click", () => mountRunner(host, { onFinish }));
    host.querySelector("#rnDone").addEventListener("click", () => { host.innerHTML = ""; });
    if (onFinish) onFinish({ score, best });
  }
  paint();
}
