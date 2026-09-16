/* ==========================================================================
   DISCOVERY LAB — SHARED ARCADE MODULE   (engine/arcade.js)

   "Every simulation needs a genuine bonus arcade round with real 3D dynamic
   effects" (agreed with Diego, 2026-09-16). This is the shared, reusable
   implementation so an activity plugs in its own items/lanes instead of
   hand-rolling a 3D game each time — same split as accessibility.js/i18n.js.

   Usage from an activity:

     import { mountArcadeRush } from "../../.../engine/arcade.js?v=1";
     const rush = mountArcadeRush(host, {
       threeUrl: "../../.../engine/vendor/three.min.js",
       lanes: [ { id, label, color, icon(svg string, optional) }, ... ],
       items: [ { id, label, laneId, img(optional) }, ... ],   // the pool
       rounds: 12,                                              // items played (cycles/reshuffles the pool)
       strings: { ... },                                        // see DEFAULT_STRINGS below — pass a translated copy
       onExit(stats) { ... }                                    // stats: {score, hits, total, accuracy, bestStreak}
     });
     // rush.dispose() when the activity re-renders this host.

   Design constraints that shaped this (do not "fix" away):
   - No fail state, no lives, no hard timer that blocks a student — a late or
     wrong answer just resets the streak and moves on. CLAUDE.md §6 requires
     no interaction that penalises a student for taking their time; a genuine
     arcade feel comes from the flight animation and scoring, not from
     punishing reaction speed.
   - The answer buttons are real <button> elements, never picked via 3D
     raycasting — this sidesteps the whole class of pointer-vs-drag bug this
     project already hit once (see CLAUDE.md §4's hotspot amendment).
   - Falls back to a WebGL-free DOM/CSS version automatically if Three.js or
     WebGL is unavailable, so the round is never a dead end.
   - Fully keyboard-operable: number keys 1-9 mirror the on-screen buttons.
   ========================================================================== */

export const DEFAULT_STRINGS = {
  title: "Bonus round",
  instructions: "Tap the correct answer before each specimen reaches the ring.",
  score: "Score",
  streak: "Streak",
  best: "Best streak",
  progress: "Specimen",
  correct: "Correct!",
  wrong: "Not quite.",
  missed: "Missed it.",
  finishTitle: "Round complete!",
  accuracy: "Accuracy",
  playAgain: "Play again",
  continueLabel: "Continue",
  skip: "Skip bonus round",
  play: "Play bonus round",
};

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "dl-arcade-styles";
  s.textContent = `
.arcade{position:relative;border-radius:var(--radius-lg);overflow:hidden;background:#04120d;
  border:1px solid #0c1f18;box-shadow:var(--shadow-2);}
.arcade__stage{position:relative;width:100%;aspect-ratio:16/10;min-height:16rem;}
.arcade__stage canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;}
.arcade__hud{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;gap:var(--sp-2);
  padding:var(--sp-3);font-family:var(--font-data);color:#eafff2;font-size:.72rem;letter-spacing:.06em;
  text-transform:uppercase;pointer-events:none;z-index:4;}
.arcade__hud b{display:block;font-size:1.1rem;letter-spacing:0;font-family:var(--font-ui);}
.arcade__ring{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);width:5.5rem;height:5.5rem;
  border-radius:50%;border:3px dashed #7bffb0;opacity:.85;pointer-events:none;z-index:3;}
.arcade__fallback{position:absolute;inset:0;display:grid;place-items:center;padding:var(--sp-4);text-align:center;}
.arcade__card{padding:var(--sp-5) var(--sp-6);border-radius:var(--radius-lg);background:#0d241d;color:#eafff2;
  border:2px solid #2f6b4d;font-family:var(--font-display);font-size:var(--step-1);font-weight:800;min-width:10rem;
  box-shadow:0 0 40px rgba(123,255,176,.15);}
.arcade__card small{display:block;font-family:var(--font-data);font-size:.62rem;letter-spacing:.1em;
  text-transform:uppercase;color:#8fc9a8;margin-top:.5em;font-weight:600;}
.arcade__toast{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:5;pointer-events:none;
  font-family:var(--font-display);font-weight:800;font-size:var(--step-2);color:#fff;opacity:0;text-shadow:0 2px 12px rgba(0,0,0,.5);}
.arcade__toast.show{animation:arcadeToast .7s var(--ease-out-back);}
@keyframes arcadeToast{0%{opacity:0;transform:translate(-50%,-40%) scale(.6);}20%{opacity:1;transform:translate(-50%,-50%) scale(1.15);}100%{opacity:0;transform:translate(-50%,-55%) scale(1);}}
[data-reduced-motion=on] .arcade__toast.show{animation:none;opacity:1;transition:opacity .5s;}
.arcade.is-shake{animation:arcadeShake .3s ease;}
@keyframes arcadeShake{0%,100%{transform:translateX(0);}30%{transform:translateX(-5px);}60%{transform:translateX(5px);}}
[data-reduced-motion=on] .arcade.is-shake{animation:none;}
.arcade__lanes{display:flex;flex-wrap:wrap;gap:var(--sp-2);padding:var(--sp-3);background:#0a1f18;}
.arcade__lane{flex:1 1 6rem;min-width:6rem;display:flex;flex-direction:column;align-items:center;gap:.3em;
  padding:.7em .5em;border-radius:var(--radius);border:2px solid transparent;background:var(--lane-color,#333);
  color:#fff;font:inherit;font-weight:800;font-size:var(--step--1);cursor:pointer;touch-action:manipulation;
  transition:transform var(--dur-fast) var(--ease),box-shadow var(--dur-fast) var(--ease);position:relative;}
.arcade__lane:hover{transform:translateY(-2px);}
.arcade__lane:active{transform:translateY(0);}
.arcade__lane svg{width:1.5rem;height:1.5rem;}
.arcade__lane__key{position:absolute;top:3px;left:5px;font-family:var(--font-data);font-size:.6rem;opacity:.75;}
.arcade__lane.is-correct{box-shadow:0 0 0 3px #fff, 0 0 20px 4px rgba(255,255,255,.6);}
.arcade__lane.is-wrong{box-shadow:0 0 0 3px #fff;filter:brightness(.6);}
.arcade__foot{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);padding:var(--sp-3);
  background:#04120d;color:#8fc9a8;font-family:var(--font-data);font-size:.68rem;flex-wrap:wrap;}
.arcade__finish{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:rgba(4,18,13,.92);
  color:#eafff2;text-align:center;padding:var(--sp-4);}
.arcade__finish h3{font-family:var(--font-display);font-size:var(--step-2);margin-bottom:.3em;}
.arcade__finish .arcade__stats{display:flex;gap:var(--sp-5);justify-content:center;margin:var(--sp-4) 0;flex-wrap:wrap;}
.arcade__finish .arcade__stat b{display:block;font-size:var(--step-2);font-family:var(--font-display);color:#7bffb0;}
.arcade__finish .arcade__stat span{font-family:var(--font-data);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:#8fc9a8;}
.arcade__finish__actions{display:flex;gap:var(--sp-3);justify-content:center;flex-wrap:wrap;}
.arcade-launch{padding:var(--sp-5);border-radius:var(--radius-lg);border:2px dashed var(--line-strong);
  background:var(--surface);text-align:center;}
.arcade-launch p{margin-bottom:var(--sp-3);}
`;
  document.head.appendChild(s);
}

function reducedMotion() { return document.documentElement.getAttribute("data-reduced-motion") === "on"; }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function buildQueue(items, rounds) {
  const q = [];
  while (q.length < rounds) q.push(...shuffle(items));
  return q.slice(0, rounds);
}

let threePromise = null;
function loadThree(threeUrl) {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threePromise) return threePromise;
  threePromise = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = threeUrl;
    s.onload = () => window.THREE ? res(window.THREE) : rej(new Error("THREE missing"));
    s.onerror = () => rej(new Error("three.min.js failed to load"));
    document.head.appendChild(s);
  });
  return threePromise;
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) { return false; }
}

/* ==========================================================================
   The launch card — shown before the round starts. Never auto-plays; always
   skippable, so the bonus round can never block or gate core completion.
   ========================================================================== */
export function renderArcadeLaunch(host, { strings = {}, onPlay, onSkip }) {
  ensureStyles();
  const S = { ...DEFAULT_STRINGS, ...strings };
  host.innerHTML = "";
  const card = document.createElement("div"); card.className = "arcade-launch";
  card.innerHTML = `<p class="eyebrow">${S.title}</p><p>${S.instructions}</p>`;
  const row = document.createElement("div"); row.className = "cluster";
  row.style.justifyContent = "center";
  const playBtn = document.createElement("button"); playBtn.type = "button"; playBtn.className = "btn btn--signal";
  playBtn.textContent = "🎮 " + S.play;
  playBtn.addEventListener("click", onPlay);
  const skipBtn = document.createElement("button"); skipBtn.type = "button"; skipBtn.className = "btn btn--ghost";
  skipBtn.textContent = S.skip + " →";
  skipBtn.addEventListener("click", onSkip);
  row.append(playBtn, skipBtn);
  card.append(row);
  host.append(card);
}

/* ==========================================================================
   mountArcadeRush — the game itself.
   ========================================================================== */
export function mountArcadeRush(host, opts) {
  ensureStyles();
  const S = { ...DEFAULT_STRINGS, ...(opts.strings || {}) };
  const lanes = opts.lanes;
  const rounds = opts.rounds || 12;
  const queue = buildQueue(opts.items, rounds);

  const state = { index: 0, score: 0, streak: 0, bestStreak: 0, hits: 0, answered: false, disposed: false, flightMs: 3200 };
  const MIN_FLIGHT = 1700, RAMP = 90;

  host.innerHTML = "";
  const wrap = document.createElement("div"); wrap.className = "arcade";
  const stage = document.createElement("div"); stage.className = "arcade__stage";
  const hud = document.createElement("div"); hud.className = "arcade__hud";
  hud.innerHTML = `<div>${S.progress}<b id="ar-progress">1 / ${rounds}</b></div>
    <div style="text-align:center">${S.streak}<b id="ar-streak">0</b></div>
    <div style="text-align:right">${S.score}<b id="ar-score">0</b></div>`;
  const ring = document.createElement("div"); ring.className = "arcade__ring";
  const toast = document.createElement("div"); toast.className = "arcade__toast";
  stage.append(hud, ring, toast);
  wrap.append(stage);

  const laneBar = document.createElement("div"); laneBar.className = "arcade__lanes"; laneBar.setAttribute("role", "group");
  laneBar.setAttribute("aria-label", S.title);
  const laneBtns = {};
  lanes.forEach((lane, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "arcade__lane";
    b.style.setProperty("--lane-color", lane.color);
    b.innerHTML = `<span class="arcade__lane__key">${i + 1}</span>${lane.icon ? `<svg viewBox="0 0 64 64" aria-hidden="true">${lane.icon}</svg>` : ""}<span>${lane.label}</span>`;
    b.addEventListener("click", () => answer(lane.id));
    laneBtns[lane.id] = b;
    laneBar.append(b);
  });
  wrap.append(laneBar);

  const foot = document.createElement("div"); foot.className = "arcade__foot";
  foot.innerHTML = `<span>${S.best}: <b id="ar-best">0</b></span><span>${S.instructions}</span>`;
  wrap.append(foot);
  host.append(wrap);

  function onKey(e) {
    const n = Number(e.key);
    if (n >= 1 && n <= lanes.length) answer(lanes[n - 1].id);
  }
  document.addEventListener("keydown", onKey);

  function flashLane(id, cls) {
    const b = laneBtns[id]; if (!b) return;
    b.classList.remove("is-correct", "is-wrong"); void b.offsetWidth; b.classList.add(cls);
    setTimeout(() => b.classList.remove(cls), 420);
  }
  function showToast(text, color) {
    toast.textContent = text; toast.style.color = color;
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show");
  }
  function shakeStage() {
    if (reducedMotion()) return;
    wrap.classList.remove("is-shake"); void wrap.offsetWidth; wrap.classList.add("is-shake");
  }

  let renderer3d = null; // set by the 3D or 2D backend, exposes spawnItem/settle/dispose

  function paintHud() {
    stage.querySelector("#ar-progress").textContent = `${Math.min(state.index + 1, rounds)} / ${rounds}`;
    stage.querySelector("#ar-streak").textContent = state.streak;
    stage.querySelector("#ar-score").textContent = state.score;
    wrap.querySelector("#ar-best").textContent = state.bestStreak;
  }
  paintHud();

  function answer(laneId) {
    if (state.disposed || state.answered || !state.current) return;
    state.answered = true;
    const item = state.current;
    const correct = laneId === item.laneId;
    if (correct) {
      state.score += 10 + state.streak * 2;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.hits += 1;
      flashLane(laneId, "is-correct");
      showToast(S.correct, "#7bffb0");
      if (renderer3d) renderer3d.settle(true);
    } else {
      state.streak = 0;
      flashLane(laneId, "is-wrong");
      flashLane(item.laneId, "is-correct");
      showToast(S.wrong, "#ff8a7a");
      shakeStage();
      if (renderer3d) renderer3d.settle(false);
    }
    paintHud();
    setTimeout(nextItem, 650);
  }

  function timeUp() {
    if (state.disposed || state.answered || !state.current) return;
    state.answered = true;
    state.streak = 0;
    flashLane(state.current.laneId, "is-correct");
    showToast(S.missed, "#ffd45c");
    if (renderer3d) renderer3d.settle(false);
    paintHud();
    setTimeout(nextItem, 550);
  }

  function nextItem() {
    if (state.disposed) return;
    state.index += 1;
    if (state.index >= rounds) return finish();
    state.current = queue[state.index];
    state.answered = false;
    state.flightMs = Math.max(MIN_FLIGHT, 3200 - state.index * RAMP);
    paintHud();
    if (renderer3d) renderer3d.spawnItem(state.current, state.flightMs, timeUp);
  }

  function finish() {
    const accuracy = Math.round((state.hits / rounds) * 100);
    const box = document.createElement("div"); box.className = "arcade__finish";
    box.innerHTML = `<div>
      <h3>${S.finishTitle}</h3>
      <div class="arcade__stats">
        <div class="arcade__stat"><b>${state.score}</b><span>${S.score}</span></div>
        <div class="arcade__stat"><b>${accuracy}%</b><span>${S.accuracy}</span></div>
        <div class="arcade__stat"><b>${state.bestStreak}</b><span>${S.best}</span></div>
      </div>
      <div class="arcade__finish__actions">
        <button type="button" class="btn btn--ghost" id="ar-again">↺ ${S.playAgain}</button>
        <button type="button" class="btn btn--signal" id="ar-continue">${S.continueLabel} →</button>
      </div>
    </div>`;
    stage.append(box);
    box.querySelector("#ar-again").addEventListener("click", () => {
      dispose(); const fresh = mountArcadeRush(host, opts);
      Object.assign(rush, fresh);
    });
    box.querySelector("#ar-continue").addEventListener("click", () => {
      if (opts.onExit) opts.onExit({ score: state.score, hits: state.hits, total: rounds, accuracy, bestStreak: state.bestStreak });
    });
  }

  function dispose() {
    state.disposed = true;
    document.removeEventListener("keydown", onKey);
    if (renderer3d) renderer3d.dispose();
  }

  const rush = { dispose };

  /* ---- backend: real 3D if possible, calm DOM fallback otherwise ---- */
  (async () => {
    let backend = null;
    if (opts.threeUrl && webglAvailable()) {
      try {
        const THREE = await loadThree(opts.threeUrl);
        if (!state.disposed) backend = build3DBackend(THREE, stage, lanes);
      } catch (e) { console.warn("Arcade: 3D unavailable, using fallback:", e); }
    }
    if (!backend && !state.disposed) backend = build2DBackend(stage);
    if (state.disposed) { if (backend) backend.dispose(); return; }
    renderer3d = backend;
    state.current = queue[0];
    renderer3d.spawnItem(state.current, state.flightMs, timeUp);
  })();

  return rush;
}

/* ==========================================================================
   3D backend — a glowing tunnel; the current specimen flies straight down
   the centre toward a ring at the camera. Rotation/bob/particle trail give
   the "real 3D dynamic effects" without needing 3D hit-picking (answers are
   the DOM lane buttons above, never the canvas itself).
   ========================================================================== */
function build3DBackend(THREE, stageEl, lanes) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stageEl.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x04120d, 4, 22);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(0, 1.1, 5);
  camera.lookAt(0, 0.6, -8);

  scene.add(new THREE.HemisphereLight(0xbfe6cf, 0x08120d, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(2, 5, 3); scene.add(key);
  const rim = new THREE.PointLight(0x7bffb0, 1.4, 20); rim.position.set(0, 2, -6); scene.add(rim);

  /* tunnel rails */
  const railMat = new THREE.LineBasicMaterial({ color: 0x2f6b4d });
  for (const x of [-1.6, 1.6]) {
    const pts = [new THREE.Vector3(x, 0, 6), new THREE.Vector3(x, 0, -18)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), railMat));
  }
  for (let z = 5; z > -18; z -= 2) {
    const pts = [new THREE.Vector3(-1.6, 0, z), new THREE.Vector3(1.6, 0, z)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x163a2c })));
  }

  const group = new THREE.Group(); scene.add(group);
  let current = null;
  const particles = [];

  function makeItemMesh(item) {
    const g = new THREE.Group();
    const geo = new THREE.PlaneGeometry(1.5, 1.1);
    let mat;
    if (item.img) {
      const tex = new THREE.TextureLoader().load(item.img);
      mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0x111111, side: THREE.DoubleSide });
    } else {
      mat = new THREE.MeshStandardMaterial({ color: 0x7bffb0, emissive: 0x1a5c3f, side: THREE.DoubleSide });
    }
    const plane = new THREE.Mesh(geo, mat);
    g.add(plane);
    const ringGeo = new THREE.RingGeometry(0.9, 1.0, 32);
    const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x7bffb0, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
    g.add(ringMesh);
    return g;
  }

  function spawnItem(item, flightMs, onTimeUp) {
    if (current) group.remove(current.mesh);
    const mesh = makeItemMesh(item);
    mesh.position.set(0, 0.9, -16);
    group.add(mesh);
    current = { mesh, item, start: performance.now(), flightMs, onTimeUp, fired: false, settled: null };
  }

  function burst(color) {
    if (reducedMotion()) return;
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color }));
      p.position.set(0, 0.9, 2.5);
      const v = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 2);
      scene.add(p);
      particles.push({ mesh: p, v, born: performance.now() });
    }
  }

  function settle(correct) {
    if (!current) return;
    current.settled = correct;
    burst(correct ? 0x7bffb0 : 0xff5a4a);
  }

  function resize() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const resizeObs = new ResizeObserver(resize); resizeObs.observe(stageEl); resize();

  let raf = null, last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const reduced = reducedMotion();

    if (current && !current.settled) {
      const t = Math.min(1, (now - current.start) / current.flightMs);
      const z = -16 + t * 18.5;
      current.mesh.position.z = z;
      current.mesh.position.x = reduced ? 0 : Math.sin(t * Math.PI * 3) * 0.5 * (1 - t * 0.6);
      current.mesh.position.y = 0.9 + (reduced ? 0 : Math.sin(now / 240) * 0.06);
      current.mesh.rotation.y += reduced ? 0 : dt * 1.6;
      const scale = 0.5 + t * 0.9;
      current.mesh.scale.setScalar(scale);
      if (t >= 1 && !current.fired) { current.fired = true; current.onTimeUp(); }
    } else if (current && current.settled !== null) {
      const dir = current.settled ? 1 : -1;
      current.mesh.position.y += dt * 2 * dir;
      current.mesh.position.z += dt * (current.settled ? 6 : -2);
      current.mesh.rotation.z += dt * 4 * dir;
      current.mesh.material && (current.mesh.children || []).forEach(() => {});
      current.mesh.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, (o.material.opacity ?? 1) - dt * 1.4); } });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = (now - p.born) / 1000;
      if (age > 0.6) { scene.remove(p.mesh); particles.splice(i, 1); continue; }
      p.mesh.position.addScaledVector(p.v, dt);
      p.v.y -= dt * 4;
      p.mesh.material.opacity = 1 - age / 0.6;
      p.mesh.material.transparent = true;
    }

    if (!reduced) camera.position.x = Math.sin(now / 3000) * 0.08;
    camera.lookAt(0, 0.6, -8);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    spawnItem, settle,
    dispose() { cancelAnimationFrame(raf); resizeObs.disconnect(); renderer.dispose(); renderer.domElement.remove(); }
  };
}

/* ==========================================================================
   2D/DOM fallback backend — no WebGL required. Same pacing and scoring;
   the "flight" is a simple growing card + progress ring, calm under
   reduced-motion, and works everywhere.
   ========================================================================== */
function build2DBackend(stageEl) {
  const box = document.createElement("div"); box.className = "arcade__fallback";
  stageEl.prepend(box);
  const card = document.createElement("div"); card.className = "arcade__card";
  box.append(card);
  let raf = null, current = null;

  function spawnItem(item, flightMs, onTimeUp) {
    card.innerHTML = `${item.label}<small>${item.laneHintLabel || ""}</small>`;
    current = { item, start: performance.now(), flightMs, onTimeUp, fired: false };
    card.style.transform = "scale(.6)"; card.style.opacity = "0.5";
  }
  function settle(correct) {
    card.style.borderColor = correct ? "#7bffb0" : "#ff5a4a";
    setTimeout(() => { card.style.borderColor = "#2f6b4d"; }, 400);
  }
  function loop(now) {
    if (current && !current.fired) {
      const t = Math.min(1, (now - current.start) / current.flightMs);
      const reduced = reducedMotion();
      card.style.transform = `scale(${(0.6 + t * 0.55).toFixed(3)})`;
      card.style.opacity = String(0.5 + t * 0.5);
      if (!reduced) card.style.boxShadow = `0 0 ${20 + t * 40}px rgba(123,255,176,${0.15 + t * 0.25})`;
      if (t >= 1) { current.fired = true; current.onTimeUp(); }
    }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return { spawnItem, settle, dispose() { cancelAnimationFrame(raf); box.remove(); } };
}
