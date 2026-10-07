/* ==========================================================================
   Dew Point Chasers — BONUS ROUND: "Balloon Ascent"

   A steer-through-the-answer ascent (CLAUDE.md s4, Bonus Game Mechanic
   Library): a hot-air weather balloon climbs through the five layers of the
   atmosphere in a fixed two minutes of wall-clock time. The burner is lit
   while it climbs, and every right answer speeds the climb up (burner x1.2,
   x1.4 ...). A wrong answer snuffs the burner and the balloon sinks back down
   before the burner relights and it starts climbing again at normal speed. Every 12 seconds a
   question appears and three glowing portals rise toward the balloon, each
   labelled with one answer; the student steers the balloon into a lane (tap
   a lane button, press 1/2/3, or use the arrow keys) and whichever portal the
   balloon is in when the gate arrives is the answer. The question never
   stops the climb.

   - Bonus, never mandatory: always skippable, no lives, no fail state, nothing
     here is marked. A wrong gate names the right answer plus a one-line
     memory hook, in place, and the balloon keeps climbing.
   - Time-boxed on setInterval/wall-clock; requestAnimationFrame only draws.
   - The answers are real <button>s (keyboard-operable); the canvas only displays.
   - Vendored Three.js r128 (global THREE); a calm Canvas-2D version of the
     same round is used if WebGL is unavailable.
   - Nothing in this module makes sound, so there is nothing to mute.
   ========================================================================== */

const LANE_COLORS = ["#ff7a59", "#ffd23f", "#3fe0c5"];
const LANE_X = [-3.2, 0, 3.2];
const VS = 2.2;                       // world units climbed per second
const ROUND_MS = 120000, GATES = 10, GATE_EVERY = ROUND_MS / GATES, LEAD_MS = 9000;
const LAYER_START = [0, 12, 50, 85, 600], LAYER_END = [12, 50, 85, 600, 1000];
const SKY = [0x74c7ff, 0x2c6bd1, 0x13306d, 0x060c26, 0x000004];

function lerpHex(a, b, t) {
  const ar = a >> 16, ag = (a >> 8) & 255, ab = a & 255, br = b >> 16, bg = (b >> 8) & 255, bb = b & 255;
  return ((ar + (br - ar) * t) << 16) | ((ag + (bg - ag) * t) << 8) | (ab + (bb - ab) * t) | 0;
}
function altitudeAt(p) {            // p = 0..1 climb progress; each layer is a fifth of it
  p = Math.max(0, Math.min(1, p));
  const layer = Math.min(4, Math.floor(p * 5)), f = Math.min(1, p * 5 - layer);
  return { layer, f, km: LAYER_START[layer] + (LAYER_END[layer] - LAYER_START[layer]) * f };
}
const BASE_CLIMB = 1 / 180;        // progress per second at burner x1 (perfect play tops out at about 95 s)
const DROP_P = 0.12, DROP_RATE = 0.045;   // a wrong answer: sink 12% of the climb, over about 2.7 s
const multOf = streak => 1 + 0.2 * Math.min(streak, 10);
function seedRand(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

function glowTex() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.4, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function cloudTex() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 64;
  const g = c.getContext("2d");
  for (let i = 0; i < 9; i++) {
    const x = 24 + Math.random() * 80, y = 26 + Math.random() * 14, r = 14 + Math.random() * 14;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  }
  return new THREE.CanvasTexture(c);
}
function numberTex(n, color) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); g.fillStyle = color; g.beginPath(); g.arc(64, 64, 46, 0, 7); g.fill();
  g.fillStyle = "#101820"; g.font = "700 64px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 64, 68);
  return new THREE.CanvasTexture(c);
}
function balloonTex() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d"), cols = ["#ff5a5f", "#ffd23f", "#ffffff", "#3fa9f5"];
  for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % 4]; g.fillRect(i * 32, 0, 32, 128); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}

export function mountBalloonBonus(host, { L, questions, onFinish }) {
  const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
  host.innerHTML = "";
  const card = document.createElement("div"); card.className = "card bl-card";
  host.append(card);

  /* ---------- launch card (always skippable) ---------- */
  function showLaunch() {
    card.innerHTML = `
      <div class="bl-launch">
        <div class="bl-launch__art" aria-hidden="true">
          <svg viewBox="0 0 120 150" width="96" height="120"><defs><linearGradient id="blg" x1="0" x2="1"><stop offset="0" stop-color="#ff5a5f"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#3fa9f5"/></linearGradient></defs>
          <ellipse cx="60" cy="52" rx="42" ry="50" fill="url(#blg)"/><path d="M60 2 C40 30 40 74 60 102 M60 2 C80 30 80 74 60 102" stroke="#fff" stroke-opacity=".6" fill="none"/>
          <path d="M34 92 L50 124 M86 92 L70 124" stroke="#35424d" stroke-width="2"/><rect x="46" y="124" width="28" height="18" rx="3" fill="#8a5a2b"/></svg>
        </div>
        <div>
          <p class="eyebrow">${L("Bonus round - optional", "Ronda extra - opcional")}</p>
          <h3 class="bl-launch__title">${L("Balloon Ascent", "Ascenso en Globo")}</h3>
          <p class="q__hint" style="margin:.2rem 0 .7rem">${L(
            "Ride a weather balloon up through all five layers of the atmosphere in two minutes. Steer into the portal with the right answer: every right answer fires the burner harder and speeds the climb, a wrong one snuffs the flame and the balloon sinks. Nothing here is marked.",
            "Sube en un globo meteorológico por las cinco capas de la atmósfera en dos minutos. Dirige el globo al portal con la respuesta correcta: cada acierto aviva el quemador y acelera la subida; un fallo apaga la llama y el globo desciende. Nada de esto se califica.")}</p>
          <div class="cluster">
            <button type="button" class="btn btn--signal" data-act="play">${L("Launch the balloon", "Lanzar el globo")}</button>
            <button type="button" class="btn btn--ghost" data-act="skip">${L("Skip", "Omitir")}</button>
          </div>
        </div>
      </div>`;
    card.querySelector('[data-act="play"]').addEventListener("click", play);
    card.querySelector('[data-act="skip"]').addEventListener("click", () => { card.innerHTML = `<p class="q__hint" style="margin:0">${L("Bonus round skipped - you can launch it any time by reopening this stage.", "Ronda extra omitida - puedes lanzarla cuando quieras volviendo a abrir esta etapa.")} <button type="button" class="btn btn--ghost" data-act="again" style="margin-left:.5rem">${L("Launch anyway", "Lanzar de todos modos")}</button></p>`; card.querySelector('[data-act="again"]').addEventListener("click", showLaunch); });
  }

  /* ---------- the round ---------- */
  function play() {
    const rnd = seedRand((Date.now() & 0xffff) + 7);
    // each gate: shuffled option order, remembering which lane is right
    const gates = [];
    const pool = questions.map((q, i) => ({ q, layer: Math.floor(i / 2), asked: 0 }));
    function makeGate(layer) {
      // a question about the layer the balloon is actually in; least-asked first
      const cand = pool.filter(x => x.layer === layer).sort((a, b) => a.asked - b.asked || rnd() - 0.5)[0];
      cand.asked++;
      const order = [0, 1, 2].sort(() => rnd() - 0.5);
      return { q: cand.q, order, correctLane: order.indexOf(0), selected: null, done: false, result: null };
    }

    card.innerHTML = `
      <div class="bl-stage" id="bl-stage">
        <div class="bl-hud">
          <div class="bl-hud__row">
            <span class="bl-pill" id="bl-layer"></span>
            <span class="bl-pill bl-pill--alt" id="bl-alt">0 km</span>
            <span class="bl-pill bl-pill--burn" id="bl-burn">Burner x1.0</span>
            <span class="bl-pill bl-pill--right" id="bl-time">2:00</span>
            <span class="bl-pill bl-pill--right" id="bl-score">0</span>
          </div>
          <div class="bl-q" id="bl-q" aria-live="polite"></div>
          <div class="bl-bar" aria-hidden="true"><i id="bl-bar"></i></div>
          <div class="bl-toast" id="bl-toast" aria-live="assertive"></div>
        </div>
      </div>
      <div class="bl-lanes" id="bl-lanes" role="group" aria-label="${L("Answer lanes", "Carriles de respuesta")}"></div>
      <p class="q__hint" style="margin:.5rem 0 0">${L("Tap a lane, press 1 / 2 / 3, or use the left and right arrows. You can change lanes until the portal reaches you.", "Toca un carril, pulsa 1 / 2 / 3, o usa las flechas izquierda y derecha. Puedes cambiar de carril hasta que el portal te alcance.")}</p>`;
    const stage = card.querySelector("#bl-stage"), lanesEl = card.querySelector("#bl-lanes");
    const $ = (id) => card.querySelector("#" + id);
    const laneBtns = [0, 1, 2].map(i => {
      const b = document.createElement("button"); b.type = "button"; b.className = "bl-lane"; b.style.setProperty("--lc", LANE_COLORS[i]);
      b.innerHTML = `<b>${i + 1}</b><span></span>`; b.disabled = true;
      b.addEventListener("click", () => choose(i));
      lanesEl.append(b); return b;
    });

    let start = performance.now(), cur = -1, score = 0, streak = 0, best = 0, finished = false, laneNow = 1, balloonX = 0;
    let p = 0, pv = 0, descend = 0, burner = true, peak = 0, drops = 0, lastTick = start;
    const log = [];
    let r3 = null; try { r3 = build3D(stage); } catch (e) { r3 = null; }
    const r2 = r3 ? null : build2D(stage);

    function choose(i) {
      const g = gates[cur]; if (!g || g.done || finished) return;
      g.selected = i; laneNow = i;
      laneBtns.forEach((b, j) => b.setAttribute("aria-pressed", j === i ? "true" : "false"));
    }
    function onKey(e) {
      if (!card.isConnected) { document.removeEventListener("keydown", onKey); return; }
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "1" || e.key === "2" || e.key === "3") { choose(Number(e.key) - 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { choose(Math.max(0, laneNow - 1)); e.preventDefault(); }
      else if (e.key === "ArrowRight") { choose(Math.min(2, laneNow + 1)); e.preventDefault(); }
    }
    document.addEventListener("keydown", onKey);

    function toast(html, good) {
      const t = $("bl-toast"); if (!t) return;
      t.innerHTML = html; t.dataset.kind = good ? "good" : "miss"; t.classList.remove("bl-toast--in"); void t.offsetWidth; t.classList.add("bl-toast--in");
    }
    function popup(text, good) {
      const p = document.createElement("div"); p.className = "bl-pop " + (good ? "bl-pop--good" : "bl-pop--miss"); p.textContent = text;
      stage.append(p); setTimeout(() => p.remove(), 1100);
    }
    function resolve(k) {
      const g = gates[k]; if (g.done) return; g.done = true;
      const right = g.selected === g.correctLane;
      g.result = right;
      if (right) { score += 10 + Math.min(streak, 5) * 2; streak++; best = Math.max(best, streak); }
      else { streak = 0; descend = Math.min(DROP_P, p); drops++; burner = false; }
      const rightText = L(g.q.opts[0].en, g.q.opts[0].es);
      toast(right
        ? `<b>${L("Through! Burner up - faster!", "¡Dentro! Quemador al máximo - ¡más rápido!")}</b> ${L(g.q.hook.en, g.q.hook.es)}`
        : `<b>${L("Burner out - sinking! Answer:", "Quemador apagado - ¡descendiendo! Respuesta:")}</b> ${rightText}. ${L(g.q.hook.en, g.q.hook.es)}`, right);
      popup(right ? "+" + (10 + Math.min(streak - 1, 5) * 2) : L("Burner out!", "¡Quemador apagado!"), right);
      if (r3) r3.burst(LANE_X[g.correctLane], right ? 0x7dff9a : 0xffc857); else if (r2) r2.flash(right);
      if (!right) log.push({ prompt: L(g.q.prompt.en, g.q.prompt.es), answer: rightText });
      $("bl-score").textContent = score + (streak > 1 ? "  x" + streak : "");
      laneBtns.forEach(b => { b.disabled = true; b.setAttribute("aria-pressed", "false"); });
      laneBtns[g.correctLane].classList.add("bl-lane--right");
      setTimeout(() => laneBtns.forEach(b => b.classList.remove("bl-lane--right")), 1500);
    }
    function showGate(k) {
      cur = k; const g = gates[k] = makeGate(altitudeAt(p).layer);
      $("bl-q").textContent = L(g.q.prompt.en, g.q.prompt.es);
      $("bl-q").classList.remove("bl-q--in"); void $("bl-q").offsetWidth; $("bl-q").classList.add("bl-q--in");
      g.order.forEach((optIdx, lane) => {
        laneBtns[lane].querySelector("span").textContent = L(g.q.opts[optIdx].en, g.q.opts[optIdx].es);
        laneBtns[lane].disabled = false; laneBtns[lane].setAttribute("aria-pressed", "false");
      });
      laneNow = 1; if (r3) r3.setGate(g, k);
    }

    // Game state on a wall-clock interval - never on requestAnimationFrame.
    const tick = setInterval(() => {
      if (!card.isConnected) { stopAll(); return; }
      const el = performance.now() - start;
      if (el >= ROUND_MS) { clearInterval(tick); finish(); return; }
      const k = Math.floor(el / GATE_EVERY);
      if (k !== cur && k < GATES) { if (cur >= 0 && !gates[cur].done) resolve(cur); showGate(k); }
      if (cur >= 0 && !gates[cur].done && el - cur * GATE_EVERY >= LEAD_MS) resolve(cur);
      const left = Math.max(0, Math.ceil((ROUND_MS - el) / 1000));
      $("bl-time").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
      // the climb itself: integrated from real elapsed time, sped up by the streak, reversed by a wrong answer
      const now2 = performance.now(), dt = Math.min(0.25, (now2 - lastTick) / 1000); lastTick = now2;
      const mult = multOf(streak);
      if (descend > 0) { const d = Math.min(descend, DROP_RATE * dt); p -= d; descend -= d; burner = false; }
      else { burner = true; p = Math.min(1, p + BASE_CLIMB * mult * dt); }
      p = Math.max(0, p); peak = Math.max(peak, p);
      const a = altitudeAt(p);
      const bp = $("bl-burn"); bp.textContent = burner ? L("Burner x", "Quemador x") + mult.toFixed(1) : L("Burner out!", "¡Quemador apagado!"); bp.dataset.off = burner ? "false" : "true";
      $("bl-layer").textContent = L(LAYERS[a.layer].en, LAYERS[a.layer].es);
      $("bl-alt").textContent = Math.round(a.km).toLocaleString() + " km";
      if (cur >= 0) { const f = Math.min(1, (el - cur * GATE_EVERY) / LEAD_MS); $("bl-bar").style.width = (100 - f * 100) + "%"; }
    }, 100);

    function render(now) {
      if (finished || !card.isConnected) return;
      requestAnimationFrame(render);
      const el = performance.now() - start;
      balloonX += (LANE_X[laneNow] - balloonX) * 0.12;
      pv += (p - pv) * 0.2;
      const mult = multOf(streak);
      if (r3) r3.frame(el / 1000, balloonX, cur, gates, el, pv, burner, mult, descend > 0); else r2.frame(el / 1000, balloonX, cur >= 0 && !gates[cur].done ? gates[cur] : null, el - Math.max(0, cur) * GATE_EVERY, pv);
    }
    requestAnimationFrame(render);

    function stopAll() { finished = true; clearInterval(tick); document.removeEventListener("keydown", onKey); if (r3) r3.dispose(); }
    function finish() {
      if (finished) return;
      if (cur >= 0 && !gates[cur].done) resolve(cur);
      stopAll();
      const right = gates.filter(g => g && g.result).length;
      const pk = altitudeAt(peak);
      onFinish && onFinish({ score, right, total: GATES, best, peakKm: Math.round(pk.km) });
      card.innerHTML = `
        <div class="bl-end">
          <p class="eyebrow">${L("Ascent complete", "Ascenso completado")}</p>
          <h3 class="bl-launch__title">${peak >= 0.999 ? L("You reached space - 1,000 km up!", "¡Llegaste al espacio - a 1.000 km de altura!") : L("Highest point: ", "Punto más alto: ") + Math.round(pk.km).toLocaleString() + " km - " + L(LAYERS[pk.layer].en, LAYERS[pk.layer].es)}</h3>
          <div class="bl-stats"><div><b>${right}/${GATES}</b><span>${L("portals correct", "portales correctos")}</span></div><div><b>${score}</b><span>${L("points", "puntos")}</span></div><div><b>${best}</b><span>${L("best streak", "mejor racha")}</span></div><div><b>${drops}</b><span>${L("burner-outs", "quemadores apagados")}</span></div></div>
          ${log.length ? `<p class="eyebrow" style="margin-top:.8rem">${L("Worth another look", "Vale la pena repasar")}</p><ul class="bl-miss">${log.map(m => `<li><b>${m.prompt}</b> ${L("Answer:", "Respuesta:")} ${m.answer}</li>`).join("")}</ul>` : `<p class="q__hint">${L("A perfect climb - every gate answered correctly.", "Un ascenso perfecto - todas las puertas respondidas correctamente.")}</p>`}
          <p class="q__hint">${L("Fun fact: a real weather balloon swells as it climbs because the air around it gets thinner - until it bursts around 30-35 km up.", "Dato curioso: un globo meteorológico real se hincha al subir porque el aire a su alrededor se vuelve más fino - hasta que revienta a unos 30-35 km de altura.")}</p>
          <div class="cluster"><button type="button" class="btn btn--signal" data-act="again">${L("Fly again", "Volar otra vez")}</button></div>
        </div>`;
      card.querySelector('[data-act="again"]').addEventListener("click", play);
    }
    showGate(0);
  }

  const LAYERS = [
    { en: "Troposphere", es: "Troposfera" }, { en: "Stratosphere", es: "Estratosfera" }, { en: "Mesosphere", es: "Mesosfera" },
    { en: "Thermosphere", es: "Termosfera" }, { en: "Exosphere", es: "Exosfera" }];

  /* ---------- 3D ---------- */
  function build3D(stage) {
    if (typeof THREE === "undefined") throw new Error("no three");
    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    stage.prepend(canvas);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(SKY[0]); scene.fog = new THREE.Fog(SKY[0], 40, 120);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 2000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6a88, 0.95));
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.0); sun.position.set(5, 10, 6); scene.add(sun);
    const glow = glowTex(), cloud = cloudTex();

    // balloon
    const bal = new THREE.Group(); scene.add(bal);
    const env = new THREE.Mesh(new THREE.SphereGeometry(1.25, 40, 28), new THREE.MeshPhysicalMaterial({ map: balloonTex(), roughness: 0.35, clearcoat: 0.6 }));
    env.scale.set(1, 1.2, 1); env.position.y = 2.1; bal.add(env);
    [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(([x, z]) => {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.6, 6), new THREE.MeshBasicMaterial({ color: 0x35424d }));
      rope.position.set(x * 0.45, 0.85, z * 0.4); rope.rotation.z = -x * 0.25; bal.add(rope);
    });
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 })); basket.position.y = 0.05; bal.add(basket);
    const sonde = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff })); sonde.position.y = 0.34; bal.add(sonde);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1, 14), flameMat); flame.position.set(0, 1.0, 0); bal.add(flame);
    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.7, 12), new THREE.MeshBasicMaterial({ color: 0xfff3a8, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); flameCore.position.set(0, 0.92, 0); bal.add(flameCore);
    const flameGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffa040, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); flameGlow.scale.set(2.4, 2.4, 1); flameGlow.position.set(0, 1.2, 0); bal.add(flameGlow);
    const flameLight = new THREE.PointLight(0xff9a40, 1.2, 9); flameLight.position.set(0, 0.8, 0); bal.add(flameLight);
    const SMK = 24, smkP = new Float32Array(SMK * 3), smkL = new Float32Array(SMK).fill(-1);
    const smkG = new THREE.BufferGeometry(); smkG.setAttribute("position", new THREE.BufferAttribute(smkP, 3));
    const smoke = new THREE.Points(smkG, new THREE.PointsMaterial({ size: 1.1, map: glow, color: 0x8a949c, transparent: true, opacity: 0.6, depthWrite: false })); smoke.frustumCulled = false; scene.add(smoke);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), new THREE.MeshBasicMaterial({ color: 0x222222 })); ant.position.set(0, 0.55, 0); bal.add(ant);

    // earth far below
    const earthTex = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d"); g.fillStyle = "#1c6fb8"; g.fillRect(0, 0, 256, 128);
      for (let i = 0; i < 60; i++) { g.fillStyle = Math.random() < .5 ? "#2f9a4f" : "#f4f9ff"; g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 128, 6 + Math.random() * 22, 3 + Math.random() * 10, Math.random() * 3, 0, 7); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
    const earth = new THREE.Mesh(new THREE.SphereGeometry(900, 64, 48), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.9 })); earth.position.set(0, -900, -120); scene.add(earth);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(925, 64, 48), new THREE.MeshBasicMaterial({ color: 0x6ac0ff, transparent: true, opacity: 0.16, side: THREE.BackSide })); halo.position.copy(earth.position); scene.add(halo);

    // stars
    const SN = 700, sp = new Float32Array(SN * 3), R0 = 260;
    for (let i = 0; i < SN; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 1.0 - 0.1); sp[i * 3] = R0 * Math.sin(ph) * Math.cos(th); sp[i * 3 + 1] = R0 * Math.cos(ph) + 20; sp[i * 3 + 2] = -Math.abs(R0 * Math.sin(ph) * Math.sin(th)) - 20; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, map: glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false })); scene.add(stars);

    // clouds (troposphere), ozone glow (stratosphere), meteors (mesosphere), aurora (thermosphere)
    const clouds = [];
    for (let i = 0; i < 46; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloud, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
      s.scale.set(9 + Math.random() * 12, 4.5 + Math.random() * 5, 1); s.position.set((Math.random() - 0.5) * 60, Math.random() * 24 * VS, -4 - Math.random() * 30); scene.add(s); clouds.push(s);
    }
    const ozone = [];
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 6), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.set(0, (30 + i * 5) * VS, -12); scene.add(m); ozone.push(m); }
    const meteors = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.07, 3.4, 6), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.rotation.z = 0.7; m.userData = { x: (Math.random() - 0.5) * 36, y: (50 + Math.random() * 22) * VS, ph: Math.random() * 6 }; scene.add(m); meteors.push(m);
    }
    const auroras = [];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.PlaneGeometry(50, 9, 40, 1);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff6fd8 : 0x5dffb0, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.position.set((i - 1.5) * 8, (75 + i * 4) * VS, -16 - i * 3); m.userData.base = geo.attributes.position.array.slice(); scene.add(m); auroras.push(m);
    }

    // gate portals (3 lanes)
    const gateGroup = new THREE.Group(); scene.add(gateGroup);
    const rings = LANE_COLORS.map((c, i) => {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.14, 16, 48), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7, roughness: 0.3 }));
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); gl.scale.set(5.2, 5.2, 1);
      const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberTex(i + 1, c), transparent: true, fog: false })); num.scale.set(1.3, 1.3, 1);
      g.add(ring, gl, num); g.position.x = LANE_X[i]; gateGroup.add(g); return { g, ring, gl };
    });
    gateGroup.visible = false;
    let gateK = -1, gateY = 0, shake = 0;

    // burst particles
    const BN = 60, bp = new Float32Array(BN * 3), bv = new Float32Array(BN * 3); let bLife = 0, bColor = 0xffffff;
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
    const bm = new THREE.PointsMaterial({ size: 0.45, map: glow, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(bg, bm));

    function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const ro = new ResizeObserver(resize); ro.observe(stage); resize();

    return {
      setGate(g, k) { gateK = k; gateY = (k * GATE_EVERY + LEAD_MS) / 1000 * VS; gateGroup.visible = true; rings.forEach(r => { r.g.scale.set(1, 1, 1); r.ring.material.emissiveIntensity = 0.7; }); },
      burst(x, color) {
        bLife = 1; bColor = color; bm.color.setHex(color);
        for (let i = 0; i < BN; i++) { bp[i * 3] = x; bp[i * 3 + 1] = gateGroup.position.y; bp[i * 3 + 2] = 0; const a = Math.random() * 6.28, s = 2 + Math.random() * 5; bv[i * 3] = Math.cos(a) * s; bv[i * 3 + 1] = Math.sin(a) * s; bv[i * 3 + 2] = (Math.random() - 0.5) * 3; }
        shake = reduced() ? 0 : 0.5;
      },
      frame(sec, bx, cur, gates, elMs, pv, burner, mult, sinking) {
        const y = pv * 264, a = altitudeAt(pv);
        // sky colour follows altitude
        const lf = a.f, c0 = SKY[a.layer], c1 = SKY[Math.min(4, a.layer + 1)];
        const col = lerpHex(c0, c1, a.layer < 4 ? lf : 0); scene.background.setHex(col); scene.fog.color.setHex(col);
        scene.fog.near = 40 + pv * 180; scene.fog.far = 120 + pv * 480;
        stars.material.opacity = Math.max(0, Math.min(1, (pv - 0.17) / 0.33)); stars.position.set(0, y * 0.9, 0);
        halo.material.opacity = 0.16 * Math.max(0, 1 - pv * 1.1);
        // balloon swells as air thins
        const sw = 1 + 0.8 * pv;
        bal.position.set(bx, y, 0); env.scale.set(sw, 1.2 * sw, sw); env.position.y = 1.0 + 1.25 * 1.2 * sw;
        if (!reduced()) { bal.rotation.z = Math.sin(sec * 1.6) * 0.04 - bx * 0.01; bal.position.y += Math.sin(sec * 2) * 0.08; }
        shake = Math.max(0, shake - 0.03);
        const sh = reduced() ? 0 : shake * (Math.random() - 0.5) * 0.5;
        const wantFov = 52 + (burner ? (mult - 1) * 4 : 0); if (Math.abs(camera.fov - wantFov) > 0.05) { camera.fov += (wantFov - camera.fov) * 0.1; camera.updateProjectionMatrix(); }
        camera.position.set(bx * 0.35 + sh, y + 3.4, 13); camera.lookAt(bx * 0.25, y + 5, 0);
        clouds.forEach((s, i) => { s.position.x += Math.sin(sec * 0.2 + i) * 0.004; });
        ozone.forEach((m, i) => { m.material.opacity = 0.1 + 0.07 * Math.sin(sec * 0.9 + i); });
        meteors.forEach((m) => { const u = (sec * 0.5 + m.userData.ph) % 3; m.position.set(m.userData.x + u * 5 - 8, m.userData.y - u * 5, -6); m.material.opacity = u < 1.6 ? 0.9 : 0; });
        auroras.forEach((m, i) => { const pos = m.geometry.attributes.position.array, base = m.userData.base; for (let v = 0; v < pos.length; v += 3) { pos[v + 1] = base[v + 1] + Math.sin(base[v] * 0.25 + sec * 1.1 + i) * 1.4; } m.geometry.attributes.position.needsUpdate = true; });
        // burner: lit and roaring while climbing (bigger at higher speed); snuffed with a puff of smoke while sinking
        flame.visible = flameCore.visible = flameGlow.visible = burner;
        if (burner) {
          const k = 0.8 + (mult - 1) * 0.35, fk = (reduced() ? 1 : 0.85 + Math.random() * 0.3) * k;
          flame.scale.set(fk * 1.6, fk * 1.3, fk * 1.6); flame.position.y = 0.55 + 0.65 * fk; flameCore.scale.set(fk * 1.5, fk * 1.2, fk * 1.5); flameCore.position.y = 0.55 + 0.35 * fk * 1.0; flameGlow.position.y = 0.95; flameGlow.scale.setScalar(2.2 + k * 1.2); flameLight.intensity = 1 + k;
        } else flameLight.intensity = 0;
        if (!burner && !reduced()) for (let i = 0; i < SMK; i++) if (smkL[i] < 0 && Math.random() < 0.3) { smkL[i] = 1; smkP[i * 3] = bal.position.x + (Math.random() - 0.5) * 0.3; smkP[i * 3 + 1] = bal.position.y + 1; smkP[i * 3 + 2] = 0; break; }
        for (let i = 0; i < SMK; i++) { if (smkL[i] < 0) { smkP[i * 3 + 1] = -9999; continue; } smkL[i] -= 0.02; smkP[i * 3 + 1] += 0.05; }
        smkG.attributes.position.needsUpdate = true;
        if (sinking && !reduced()) bal.rotation.z += Math.sin(sec * 9) * 0.02;
        // gate: a platform of three portals rising toward the balloon
        if (gateK >= 0) {
          const g = gates[gateK];
          const remaining = Math.max(0, LEAD_MS - (elMs - gateK * GATE_EVERY)) / 1000;
          if (g && g.done) { if (g.fy == null) g.fy = gateGroup.position.y; gateGroup.position.y = g.fy; }
          else gateGroup.position.y = y + 2.6 + remaining * 0.9;
          rings.forEach((r, i) => { r.g.rotation.z = sec * (i + 1) * 0.3; if (g && g.done) { const right = i === g.correctLane; r.g.scale.setScalar(right ? 1.25 + Math.sin(sec * 8) * 0.06 : 0.8); r.ring.material.emissiveIntensity = right ? 1.6 : 0.2; } else if (g && g.selected === i) { r.ring.material.emissiveIntensity = 1.3; } else r.ring.material.emissiveIntensity = 0.7; });
        }
        if (bLife > 0) { bLife -= 0.02; bm.opacity = Math.max(0, bLife); for (let i = 0; i < BN; i++) { bp[i * 3] += bv[i * 3] * 0.016; bp[i * 3 + 1] += bv[i * 3 + 1] * 0.016; bp[i * 3 + 2] += bv[i * 3 + 2] * 0.016; } bg.attributes.position.needsUpdate = true; }
        renderer.render(scene, camera);
      },
      dispose() { ro.disconnect(); renderer.dispose(); canvas.remove(); }
    };
  }

  /* ---------- Canvas-2D fallback (no WebGL) ---------- */
  function build2D(stage) {
    const canvas = document.createElement("canvas"); stage.prepend(canvas);
    const ctx = canvas.getContext("2d"); let flashT = 0, flashGood = true;
    return {
      flash(good) { flashT = 1; flashGood = good; },
      frame(sec, bx, g, sinceGate, pv) {
        const w = stage.clientWidth, h = stage.clientHeight; if (canvas.width !== w) { canvas.width = w; canvas.height = h; }
        const a = altitudeAt(pv), lf = a.f;
        const c = lerpHex(SKY[a.layer], SKY[Math.min(4, a.layer + 1)], a.layer < 4 ? lf : 0);
        ctx.fillStyle = "#" + c.toString(16).padStart(6, "0"); ctx.fillRect(0, 0, w, h);
        if (pv > 0.17) { ctx.fillStyle = "#fff"; for (let i = 0; i < 60; i++) ctx.fillRect((i * 97) % w, (i * 53) % (h * 0.8), 2, 2); }
        const lane = (i) => w * (0.25 + i * 0.25);
        if (g && !g.done) { const f = Math.min(1, sinceGate / LEAD_MS), gy = h * (0.05 + (1 - f) * 0.6); [0, 1, 2].forEach(i => { ctx.strokeStyle = LANE_COLORS[i]; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(lane(i), gy + 20, 34, 0, 7); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "700 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText(String(i + 1), lane(i), gy + 28); }); }
        const x = w * 0.5 + (bx / 3.2) * w * 0.25;
        ctx.fillStyle = "#ff5a5f"; ctx.beginPath(); ctx.ellipse(x, h * 0.72, 38, 46, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#8a5a2b"; ctx.fillRect(x - 12, h * 0.72 + 56, 24, 16);
        if (flashT > 0) { flashT -= 0.03; ctx.fillStyle = flashGood ? `rgba(125,255,154,${flashT * 0.35})` : `rgba(255,200,87,${flashT * 0.35})`; ctx.fillRect(0, 0, w, h); }
      }
    };
  }

  showLaunch();
}

/* The ten gates: two per layer, climbing in order. opts[0] is ALWAYS the right answer
   (the round shuffles which lane it lands in). */
export const BALLOON_QUESTIONS = [
  { prompt: { en: "You're in the layer closest to the ground, where clouds and weather happen. Name it.", es: "Estás en la capa más cercana al suelo, donde ocurren las nubes y el clima. ¿Cómo se llama?" },
    opts: [{ en: "Troposphere", es: "Troposfera" }, { en: "Stratosphere", es: "Estratosfera" }, { en: "Exosphere", es: "Exosfera" }],
    hook: { en: "Almost all weather lives here - the air is warm and full of water vapour.", es: "Casi todo el clima ocurre aquí - el aire es cálido y lleno de vapor de agua." } },
  { prompt: { en: "Which gas makes up about 78% of the air around your balloon?", es: "¿Qué gas forma cerca del 78% del aire que rodea tu globo?" },
    opts: [{ en: "Nitrogen", es: "Nitrógeno" }, { en: "Oxygen", es: "Oxígeno" }, { en: "Carbon dioxide", es: "Dióxido de carbono" }],
    hook: { en: "Remember 78 / 21 / 1: nitrogen, oxygen, then trace gases like argon.", es: "Recuerda 78 / 21 / 1: nitrógeno, oxígeno y gases traza como el argón." } },
  { prompt: { en: "The ozone layer sits in this layer. What does it absorb?", es: "La capa de ozono está en esta capa. ¿Qué absorbe?" },
    opts: [{ en: "Harmful UV radiation", es: "Radiación UV dañina" }, { en: "Sound waves", es: "Ondas sonoras" }, { en: "Water vapour", es: "Vapor de agua" }],
    hook: { en: "Ozone is Earth's sunscreen - and this is the stratosphere.", es: "El ozono es el protector solar de la Tierra - y esta es la estratosfera." } },
  { prompt: { en: "As you climb higher, the air gets thinner. What happens to air pressure?", es: "Al subir, el aire se vuelve más fino. ¿Qué pasa con la presión del aire?" },
    opts: [{ en: "It falls", es: "Disminuye" }, { en: "It rises", es: "Aumenta" }, { en: "It stays the same", es: "Se mantiene igual" }],
    hook: { en: "Less air above you means less weight pressing down.", es: "Menos aire encima significa menos peso presionando hacia abajo." } },
  { prompt: { en: "Meteors burn up in this layer. What is the layer called?", es: "Los meteoros se queman en esta capa. ¿Cómo se llama?" },
    opts: [{ en: "Mesosphere", es: "Mesosfera" }, { en: "Troposphere", es: "Troposfera" }, { en: "Thermosphere", es: "Termosfera" }],
    hook: { en: "Meso = middle. Friction with the air makes shooting stars glow here.", es: "Meso = en medio. La fricción con el aire hace brillar las estrellas fugaces aquí." } },
  { prompt: { en: "The top of the mesosphere is the coldest place in the atmosphere. About how cold?", es: "La parte alta de la mesosfera es el lugar más frío de la atmósfera. ¿Cuánto, aproximadamente?" },
    opts: [{ en: "About -90 degrees C", es: "Unos -90 grados C" }, { en: "About +20 degrees C", es: "Unos +20 grados C" }, { en: "About +500 degrees C", es: "Unos +500 grados C" }],
    hook: { en: "Colder than anywhere on Earth's surface - then it heats up again above.", es: "Más frío que cualquier lugar de la superficie terrestre - y luego vuelve a calentarse arriba." } },
  { prompt: { en: "This layer holds the ionosphere, where charged gas glows. What can you see here?", es: "Esta capa contiene la ionosfera, donde el gas cargado brilla. ¿Qué puedes ver aquí?" },
    opts: [{ en: "Auroras", es: "Auroras" }, { en: "Rainbows", es: "Arcoíris" }, { en: "Fog", es: "Niebla" }],
    hook: { en: "Thermosphere: charged particles from the Sun make the northern and southern lights.", es: "Termosfera: las partículas cargadas del Sol crean las auroras boreales y australes." } },
  { prompt: { en: "Up here temperatures reach over 1,000 degrees C - yet you would not feel hot. Why?", es: "Aquí arriba la temperatura supera los 1.000 grados C - y aun así no sentirías calor. ¿Por qué?" },
    opts: [{ en: "The air is so thin there are very few particles to touch you", es: "El aire es tan fino que casi no hay partículas que te toquen" }, { en: "Because it is really cold", es: "Porque en realidad hace mucho frío" }, { en: "Because clouds shade you", es: "Porque las nubes te dan sombra" }],
    hook: { en: "Temperature measures how fast particles move; heat transfer needs lots of them.", es: "La temperatura mide qué tan rápido se mueven las partículas; transferir calor necesita muchas." } },
  { prompt: { en: "In the outermost layer, the air gradually does what?", es: "En la capa más externa, ¿qué le ocurre gradualmente al aire?" },
    opts: [{ en: "Fades away into space", es: "Se desvanece en el espacio" }, { en: "Becomes liquid", es: "Se vuelve líquido" }, { en: "Gets denser and denser", es: "Se hace cada vez más denso" }],
    hook: { en: "The exosphere has no sharp edge - it just thins out into space.", es: "La exosfera no tiene un borde nítido - simplemente se va diluyendo en el espacio." } },
  { prompt: { en: "Which layer sits directly below the exosphere?", es: "¿Qué capa está justo debajo de la exosfera?" },
    opts: [{ en: "Thermosphere", es: "Termosfera" }, { en: "Stratosphere", es: "Estratosfera" }, { en: "Troposphere", es: "Troposfera" }],
    hook: { en: "Order from the ground: Tropo, Strato, Meso, Thermo, Exo.", es: "Orden desde el suelo: Tropo, Strato, Meso, Termo, Exo." } }
];

export const BALLOON_CSS = `
.bl-card{padding:0;overflow:hidden}
.bl-launch{display:flex;gap:1rem;align-items:center;padding:1rem 1.2rem;background:linear-gradient(120deg,#0b2a55,#1c5fb0 60%,#3fa9f5);color:#fff;border-radius:14px}
.bl-launch .eyebrow{color:#ffd9a0}.bl-launch .q__hint{color:#e7f2ff}
.bl-launch__title{margin:.1rem 0;font-size:1.5rem;color:#fff}
.bl-launch__art{flex:none}
.bl-stage{position:relative;aspect-ratio:16/10;min-height:300px;background:#74c7ff;overflow:hidden}
.bl-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.bl-hud{position:absolute;inset:0;pointer-events:none;padding:10px 12px;display:flex;flex-direction:column;gap:8px;font-family:var(--font-data)}
.bl-hud__row{display:flex;flex-wrap:wrap;gap:6px}
.bl-pill{background:#06142acc;border:1px solid #5aa9ff88;color:#eaf4ff;border-radius:999px;padding:.25rem .7rem;font-size:.78rem;letter-spacing:.03em;text-transform:uppercase}
.bl-pill--alt{background:#ffd23fee;color:#2a1c00;border-color:#ffd23f}
.bl-pill--burn{background:#ff7a2aee;color:#2a1000;border-color:#ff7a2a}.bl-pill--burn[data-off="true"]{background:#555e66ee;color:#fff;border-color:#9aa4ac}
.bl-pill--right{margin-left:auto}.bl-pill--right+.bl-pill--right{margin-left:0}
.bl-q{align-self:center;max-width:min(560px,92%);text-align:center;background:#06142ae0;border:1px solid #5aa9ff;color:#fff;border-radius:12px;padding:.55rem .9rem;font-size:.98rem;font-family:var(--font-body,inherit)}
.bl-q--in{animation:bl-in .35s ease}
.bl-bar{align-self:center;width:min(560px,92%);height:6px;border-radius:99px;background:#ffffff33;overflow:hidden}.bl-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3fe0c5,#ffd23f)}
.bl-toast{margin-top:auto;align-self:center;max-width:min(620px,94%);text-align:center;background:#06142aee;border:2px solid #fff;color:#fff;border-radius:12px;padding:.5rem .8rem;font-size:.9rem;opacity:0;font-family:var(--font-body,inherit)}
.bl-toast[data-kind="good"]{border-color:#7dff9a}.bl-toast[data-kind="miss"]{border-color:#ffc857}
.bl-toast--in{animation:bl-toast 3.4s ease forwards}
.bl-pop{position:absolute;left:50%;top:48%;transform:translateX(-50%);font:700 2rem var(--font-data);pointer-events:none;animation:bl-pop 1.1s ease forwards;text-shadow:0 2px 8px #000a}
.bl-pop--good{color:#7dff9a}.bl-pop--miss{color:#ffc857;font-size:1.3rem}
.bl-lanes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px 12px 0}
.bl-lane{border:2px solid var(--lc);background:color-mix(in srgb,var(--lc) 18%,var(--surface));color:var(--ink-1);border-radius:12px;padding:.5rem .6rem;text-align:left;font:inherit;cursor:pointer;display:flex;gap:.5rem;align-items:flex-start;min-height:3.4rem}
.bl-lane b{flex:none;background:var(--lc);color:#101820;width:1.7rem;height:1.7rem;border-radius:50%;display:grid;place-items:center}
.bl-lane span{font-size:.85rem;line-height:1.25}
.bl-lane[aria-pressed="true"]{background:var(--lc);color:#101820;box-shadow:0 0 0 3px #fff8,0 0 18px var(--lc)}
.bl-lane:disabled{opacity:.6;cursor:default}
.bl-lane:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.bl-lane--right{animation:bl-right .5s ease 3}
.bl-end{padding:1rem 1.2rem}
.bl-stats{display:flex;gap:.8rem;flex-wrap:wrap;margin:.6rem 0}
.bl-stats div{background:var(--accent-wash);border-radius:12px;padding:.5rem 1rem;text-align:center}.bl-stats b{display:block;font-size:1.6rem;color:var(--accent)}.bl-stats span{font-size:.78rem;color:var(--ink-2)}
.bl-miss{margin:.3rem 0 .6rem;padding-left:1.1rem;font-size:.88rem}
@keyframes bl-in{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}
@keyframes bl-toast{0%{opacity:0;transform:translateY(8px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
@keyframes bl-pop{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}25%{opacity:1;transform:translate(-50%,0) scale(1.15)}100%{opacity:0;transform:translate(-50%,-50px)}}
@keyframes bl-right{50%{transform:scale(1.04)}}
[data-reduced-motion="on"] .bl-q--in,[data-reduced-motion="on"] .bl-toast--in,[data-reduced-motion="on"] .bl-lane--right{animation:none}
[data-reduced-motion="on"] .bl-toast--in{opacity:1}
[data-reduced-motion="on"] .bl-pop{animation:none;opacity:1}
@media (max-width:640px){.bl-lanes{grid-template-columns:1fr}.bl-launch{flex-direction:column;text-align:center}}
`;
