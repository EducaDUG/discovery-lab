/* BONUS ROUND — "Kingdom Carnival": a 3D speech-bubble shooting gallery
   (CLAUDE.md §4 Bonus Game Mechanic Library; first use of this mechanic on
   the site). A clue bubble shows a real specimen photo + one feature; six
   kingdom targets glide along two rails; throw a glowing ball at the right
   one. Aim with mouse/touch (moving targets reward leading the shot), the
   arrow keys + Space, or the six real <button>s (keys 1-6, always on target).
   Bonus only: no lives, no fail state, ~2 minutes of wall-clock play, no
   marks. Wrong hits name the right answer plus a memory hook, in place. */
import { L, reduced, SPEC, GROUPS, GROUP_ORDER, img } from "./data.js?v=1";
import { hasWebGL, makeStage, glowTexture, photoTexture, burst3D, burstAt, shake, floatText, blip, sound, noiseTexture } from "./fx.js?v=1";
import { setTTS, ttsEnabled } from "../../../../../../../../engine/accessibility.js?v=6";

const DURATION = 120;
const REP = { virus: "influenza", bacteria: "lactobacillus", fungi: "mushroom", protoctist: "amoeba", plant: "maize", animal: "polar-bear" };
const HOOK = {
  plant: () => L("chloroplasts + cellulose walls + starch", "cloroplastos + paredes de celulosa + almidón"),
  animal: () => L("many cells, no cell wall, glycogen, nervous coordination", "muchas células, sin pared, glucógeno, coordinación nerviosa"),
  fungi: () => L("chitin walls, hyphae, feeds with enzymes outside its body", "paredes de quitina, hifas, digiere fuera de su cuerpo"),
  protoctist: () => L("mostly one cell WITH a nucleus — the 'dustbin' kingdom", "casi siempre una célula CON núcleo: el reino 'cajón de sastre'"),
  bacteria: () => L("no nucleus, peptidoglycan wall, plasmids", "sin núcleo, pared de peptidoglucano, plásmidos"),
  virus: () => L("not cells — DNA/RNA in a protein coat, reproduces only in a host", "no son células: ADN/ARN en una cubierta de proteína, solo se reproducen en un huésped"),
};

function clues() {
  const out = [];
  Object.keys(SPEC).forEach(id => SPEC[id].hints().forEach(h => out.push({ id, group: SPEC[id].group, hint: h })));
  for (let i = out.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function mountCarnivalLaunch(host, sim) {
  host.innerHTML = `<div class="lv-launch">
    <div class="lv-launch__art" aria-hidden="true"></div>
    <div><p class="lv-launch__title">${L("Bonus round — Kingdom Carnival", "Ronda bonus — Feria de los Reinos")}</p>
    <p class="q__hint" style="margin:.2em 0 .6em">${L("Two minutes at the fairground stall. A clue pops up — throw at the kingdom target it belongs to. Lead the moving targets! No lives, no marks, just your best score.",
      "Dos minutos en la caseta de feria. Aparece una pista: lanza a la diana del reino al que pertenece. ¡Anticipa las dianas en movimiento! Sin vidas ni notas, solo tu mejor puntuación.")}</p>
    <div class="cluster"><button type="button" class="btn btn--signal lv-play">${L("Play ▶", "Jugar ▶")}</button>
    <button type="button" class="btn btn--ghost lv-skip">${L("Skip bonus round", "Saltar ronda bonus")}</button></div></div></div>`;
  host.querySelector(".lv-play").addEventListener("click", () => mountCarnival(host, sim));
  host.querySelector(".lv-skip").addEventListener("click", () => {
    host.innerHTML = `<p class="q__hint">${L("Bonus skipped — you can come back to it any time.", "Ronda saltada: puedes volver cuando quieras.")} <button type="button" class="btn btn--ghost lv-back">${L("Show it again", "Mostrarla otra vez")}</button></p>`;
    host.querySelector(".lv-back").addEventListener("click", () => mountCarnivalLaunch(host, sim));
  });
}

function mountCarnival(host, sim) {
  host.innerHTML = `<div class="lv-carn">
    <div class="lv-carn__hud"><span class="lv-carn__time">2:00</span><span class="lv-carn__score">0</span><span class="lv-carn__streak"></span>
      <button type="button" class="lv-mute lv-carn__mute"></button></div>
    <div class="lv-carn__stage" tabindex="0" aria-label="${L("Carnival stall. Arrow keys aim, Space throws, keys 1 to 6 throw straight at a target.", "Caseta de feria. Flechas para apuntar, Espacio para lanzar, teclas 1 a 6 para lanzar directo a una diana.")}">
      <div class="lv-bubble" aria-live="polite"></div>
      <div class="lv-cross" aria-hidden="true"></div>
      <div class="lv-carn__toast" aria-live="assertive"></div>
    </div>
    <div class="lv-carn__lanes" role="group" aria-label="${L("Throw at a target", "Lanza a una diana")}"></div>
  </div>`;
  const stageEl = host.querySelector(".lv-carn__stage"), bubble = host.querySelector(".lv-bubble"), cross = host.querySelector(".lv-cross"), toast = host.querySelector(".lv-carn__toast");
  const tEl = host.querySelector(".lv-carn__time"), sEl = host.querySelector(".lv-carn__score"), kEl = host.querySelector(".lv-carn__streak"), lanes = host.querySelector(".lv-carn__lanes");
  const muteBtn = host.querySelector(".lv-carn__mute");
  const paintMute = () => { const on = sound.on; muteBtn.textContent = on ? L("🔊 Sound on", "🔊 Sonido") : L("🔇 Muted", "🔇 Silencio"); muteBtn.setAttribute("aria-pressed", on ? "false" : "true"); };
  muteBtn.addEventListener("click", () => { sound.on = !sound.on; if (!sound.on) setTTS(false); paintMute(); });
  paintMute();

  const deck = clues();
  const g = { score: 0, streak: 0, best: 0, right: 0, wrong: 0, misses: 0, clue: 0, left: DURATION, over: false, flying: false, missed: [] };
  const clue = () => deck[g.clue % deck.length];

  function paintBubble() {
    const c = clue();
    bubble.innerHTML = `<img src="${img(c.id)}" alt="${SPEC[c.id].name()}"><div><b>${SPEC[c.id].name()}</b><span>${c.hint}</span><em>${L("Which group?", "¿Qué grupo?")}</em></div>`;
    bubble.classList.remove("lv-bubble--in"); void bubble.offsetWidth; bubble.classList.add("lv-bubble--in");
    if (ttsEnabled()) sim.speak(`${SPEC[c.id].name()}. ${c.hint}`);
  }
  function paintHud() {
    sEl.textContent = g.score; const m = Math.floor(g.left / 60), s = g.left % 60; tEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
    kEl.textContent = g.streak > 1 ? `🔥 x${Math.min(5, g.streak)}` : "";
  }

  // lane buttons (always hit their target)
  GROUP_ORDER.forEach((grp, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "lv-lane"; b.style.setProperty("--c", GROUPS[grp].color);
    b.innerHTML = `<kbd>${i + 1}</kbd> ${GROUPS[grp].name()}`;
    b.addEventListener("click", () => throwAtGroup(grp, b));
    lanes.append(b);
  });

  const s3 = hasWebGL ? build3D(stageEl) : null;
  if (!s3) stageEl.classList.add("lv-carn__stage--flat");

  // aiming
  const aim = { x: 0.5, y: 0.55 };
  function placeCross() { cross.style.left = aim.x * 100 + "%"; cross.style.top = aim.y * 100 + "%"; }
  placeCross();
  stageEl.addEventListener("pointermove", e => { const r = stageEl.getBoundingClientRect(); aim.x = (e.clientX - r.left) / r.width; aim.y = (e.clientY - r.top) / r.height; placeCross(); });
  stageEl.addEventListener("click", e => {
    if (e.target.closest(".lv-bubble")) return;
    const r = stageEl.getBoundingClientRect(); aim.x = (e.clientX - r.left) / r.width; aim.y = (e.clientY - r.top) / r.height; placeCross(); throwAtAim();
  });
  stageEl.addEventListener("keydown", e => {
    const step = 0.04;
    if (e.key === "ArrowLeft") aim.x = Math.max(0, aim.x - step); else if (e.key === "ArrowRight") aim.x = Math.min(1, aim.x + step);
    else if (e.key === "ArrowUp") aim.y = Math.max(0.15, aim.y - step); else if (e.key === "ArrowDown") aim.y = Math.min(0.95, aim.y + step);
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); throwAtAim(); return; }
    else if (/^[1-6]$/.test(e.key)) { const grp = GROUP_ORDER[+e.key - 1]; throwAtGroup(grp, lanes.children[+e.key - 1]); return; }
    else return;
    e.preventDefault(); placeCross();
  });

  function throwAtAim() {
    if (g.over || g.flying) return;
    if (!s3) { flash(L("Use the target buttons below.", "Usa los botones de diana de abajo."), "#ffcf7a"); return; }
    g.flying = true; blip("whoosh");
    const hit = s3.throwAt(aim.x, aim.y);
    setTimeout(() => { g.flying = false; resolve(hit()); }, reduced() ? 120 : 480);   // wall clock
  }
  function throwAtGroup(grp, btn) {
    if (g.over || g.flying) return;
    g.flying = true; blip("whoosh"); burstAt(btn, GROUPS[grp].color, 6);
    if (s3) s3.throwAtTarget(grp);
    setTimeout(() => { g.flying = false; resolve(grp, btn); }, reduced() || !s3 ? 120 : 480);
  }
  function resolve(grp, btn) {
    if (g.over) return;
    if (!grp) { g.misses++; flash(L("Missed! Aim where the target WILL be.", "¡Fallaste! Apunta a donde ESTARÁ la diana."), "#ffcf7a"); shake(cross); return; }
    const c = clue();
    if (grp === c.group) {
      g.streak++; g.best = Math.max(g.best, g.streak); g.right++;
      const pts = 100 * Math.min(5, g.streak); g.score += pts;
      flash(`+${pts} · ${GROUPS[grp].name()}!`, "#7dffb4"); blip("ok"); s3?.hitFx(grp, true);
      if (btn) burstAt(btn, "#2fbf71", 14);
    } else {
      g.streak = 0; g.wrong++; g.missed.push(c);
      flash(`${L("Answer", "Respuesta")}: ${GROUPS[c.group].name()} · ${HOOK[c.group]()}`, "#ff9a9a", 2600); blip("bad"); s3?.hitFx(grp, false);
      if (btn) shake(btn);
    }
    g.clue++; paintBubble(); paintHud();
  }
  let toastTimer = 0;
  function flash(text, color, ms = 1300) {
    toast.textContent = text; toast.style.color = color; toast.classList.remove("is-on"); void toast.offsetWidth; toast.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("is-on"), ms);
  }

  // the clock — wall-clock setInterval, never rAF (CLAUDE.md §4)
  const started = Date.now();
  const timer = setInterval(() => {
    if (!host.isConnected) { clearInterval(timer); return; }
    g.left = Math.max(0, DURATION - Math.floor((Date.now() - started) / 1000));
    s3?.setPace(1 - g.left / DURATION);
    paintHud();
    if (g.left <= 0) { clearInterval(timer); finish(); }
  }, 250);
  paintBubble(); paintHud();
  stageEl.focus({ preventScroll: true });

  function finish() {
    g.over = true;
    const total = g.right + g.wrong, acc = total ? Math.round(g.right / total * 100) : 0;
    const prevBest = sim.state.carnivalBest || 0;
    if (g.score > prevBest) { sim.state.carnivalBest = g.score; sim.saveState(); }
    if (g.right >= 10) sim.award("lv-carnival", L("Carnival Champion", "Campeón de la Feria"));
    blip("win");
    const revisit = [...new Map(g.missed.map(c => [c.hint, c])).values()].slice(0, 6);
    host.innerHTML = `<div class="lv-recap">
      <p class="lv-recap__title">${L("Time! Kingdom Carnival results", "¡Tiempo! Resultados de la Feria de los Reinos")}</p>
      <div class="lv-recap__stats">
        <span><b>${g.score}</b>${L("score", "puntos")}</span><span><b>${acc}%</b>${L("accuracy", "acierto")}</span>
        <span><b>${g.best}</b>${L("best streak", "mejor racha")}</span><span><b>${Math.max(prevBest, g.score)}</b>${L("personal best", "récord personal")}</span></div>
      ${revisit.length ? `<p class="eyebrow">${L("Clues to revisit", "Pistas para repasar")}</p><ul class="lv-recap__list">${revisit.map(c => `<li><img src="${img(c.id)}" alt=""> ${c.hint} → <b>${GROUPS[c.group].name()}</b></li>`).join("")}</ul>` : `<p class="q__hint">${L("Not a single wrong throw. Superb.", "Ningún lanzamiento equivocado. Excelente.")}</p>`}
      <div class="cluster" style="justify-content:center"><button type="button" class="btn btn--signal lv-again">${L("Play again ▶", "Jugar otra vez ▶")}</button></div></div>`;
    host.querySelector(".lv-again").addEventListener("click", () => mountCarnival(host, sim));
  }
}

/* ============================ 3D stall ============================ */
function build3D(wrap) {
  const st = makeStage(wrap, { dist: 8.2, target: [0, 2.5, 0], fov: 50, minPhi: 1.3, maxPhi: 1.5, autoSpin: 0, fog: 0x120a1e });
  st.orbit.theta = 0; st.orbit.phi = 1.47;
  const el = st.renderer.domElement; el.style.pointerEvents = "none";   // the stage div handles aiming
  const { THREE, scene, camera } = st;
  scene.fog.density = 0.03;
  scene.add(new THREE.HemisphereLight(0xffe6c7, 0x1a0f2a, 0.8));
  const key = new THREE.SpotLight(0xfff1d6, 1.6, 30, 0.7, 0.5); key.position.set(0, 9, 7); key.castShadow = true; scene.add(key); scene.add(key.target); key.target.position.set(0, 2, 0);

  // back wall: striped awning texture
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const gx = c.getContext("2d");
  for (let i = 0; i < 16; i++) { gx.fillStyle = i % 2 ? "#5b1f3c" : "#2b1a4a"; gx.fillRect(i * 32, 0, 32, 256); }
  const wallTex = new THREE.CanvasTexture(c); wallTex.encoding = THREE.sRGBEncoding;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 })); wall.position.set(0, 3, -1.6); wall.receiveShadow = true; scene.add(wall);
  // awning scallops
  for (let i = -8; i < 8; i++) {
    const sc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20, 0, Math.PI), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xe8475c : 0xfff1e0, side: THREE.DoubleSide }));
    sc.rotation.z = Math.PI; sc.position.set(i + 0.5, 6.05, -1.2); scene.add(sc);
  }
  // counter
  const wood = noiseTexture([120, 70, 40], 50); wood.repeat.set(6, 1);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 1.2), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7 })); counter.position.set(0, -0.05, 2.6); counter.castShadow = true; scene.add(counter);
  // rails
  const railMat = new THREE.MeshStandardMaterial({ color: 0xc9a75b, metalness: 0.9, roughness: 0.25 });
  [1.55, 3.45].forEach(y => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 15, 12), railMat); r.rotation.z = Math.PI / 2; r.position.set(0, y - 0.95, -0.9); scene.add(r); });
  // string lights (gentle twinkle, never strobing)
  const bulbs = [];
  for (let i = 0; i < 26; i++) {
    const x = -7.5 + i * 0.6, y = 6.6 - Math.sin(i / 25 * Math.PI) * 0.6;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: [0xffd27a, 0xff8fb0, 0x8fe3ff, 0xb6ff9e][i % 4], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(x, y, -1); s.scale.setScalar(0.55); scene.add(s); bulbs.push(s);
  }

  // targets
  const targets = [];
  GROUP_ORDER.forEach((grp, i) => {
    const row = i < 3 ? 0 : 1;
    const t = new THREE.Group();
    const face = document.createElement("canvas"); face.width = face.height = 256; const f = face.getContext("2d");
    const tex = new THREE.CanvasTexture(face); tex.encoding = THREE.sRGBEncoding; tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2;
    const draw = (im) => {
      f.clearRect(0, 0, 256, 256);
      f.fillStyle = "#fff"; f.beginPath(); f.arc(128, 128, 126, 0, Math.PI * 2); f.fill();
      f.fillStyle = GROUPS[grp].color; f.beginPath(); f.arc(128, 128, 116, 0, Math.PI * 2); f.fill();
      f.fillStyle = "#fff"; f.beginPath(); f.arc(128, 128, 92, 0, Math.PI * 2); f.fill();
      if (im) { f.save(); f.beginPath(); f.arc(128, 116, 66, 0, Math.PI * 2); f.clip(); const s = Math.min(im.width, im.height); f.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 62, 50, 132, 132); f.restore(); }
      f.fillStyle = GROUPS[grp].color; f.fillRect(30, 178, 196, 44); f.fillStyle = "#fff"; f.font = "700 28px system-ui,sans-serif"; f.textAlign = "center"; f.textBaseline = "middle";
      f.fillText(`${i + 1} · ${GROUPS[grp].name().split(" (")[0]}`, 128, 201, 188);
      tex.needsUpdate = true;
    };
    draw(null); const im = new Image(); im.onload = () => draw(im); im.src = `photos/${REP[grp]}.jpg`;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.12, 48), [new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 0.4 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: 0x444 })]);
    disc.rotation.x = Math.PI / 2; disc.castShadow = true; t.add(disc);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), railMat); pole.position.y = -0.9; t.add(pole);
    t.position.set(-6 + i * 4, row ? 3.45 : 1.55, -0.9);
    scene.add(t);
    targets.push({ grp, t, row, x: -6 + (i % 3) * 4 + (row ? 2 : 0), flip: 99, ok: true });
  });

  let pace = 0;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffb84d, emissiveIntensity: 0.8 }));
  ball.visible = false; scene.add(ball);
  const trail = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); trail.scale.setScalar(0.9); ball.add(trail);
  let fly = null;

  st.tick((dt, now) => {
    const sp = (reduced() ? 0.5 : 0.8) + pace * (reduced() ? 0.3 : 1.0);
    targets.forEach(T => {
      T.x += (T.row ? -1 : 1) * sp * dt;
      if (T.x > 7.2) T.x -= 14.4; if (T.x < -7.2) T.x += 14.4;
      T.t.position.x = T.x;
      T.flip += dt;
      T.t.rotation.y = T.flip < 0.9 ? (T.ok ? T.flip / 0.9 * Math.PI * 2 : Math.sin(T.flip * 30) * 0.3 * (1 - T.flip / 0.9)) : 0;
      if (!reduced()) T.t.position.y = (T.row ? 3.45 : 1.55) + Math.sin(now / 500 + T.x) * 0.04;
    });
    bulbs.forEach((b, i) => { b.material.opacity = reduced() ? 0.85 : 0.65 + Math.sin(now / 900 + i * 1.3) * 0.25; });
    if (fly) {
      fly.u = Math.min(1, fly.u + dt / 0.45);
      const p = fly.a.clone().lerp(fly.b, fly.u); p.y += Math.sin(fly.u * Math.PI) * 1.4;
      ball.position.copy(p); ball.visible = true;
      if (fly.u >= 1) { ball.visible = false; fly = null; }
    }
  });

  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.9);
  function worldAt(nx, ny) {
    ray.setFromCamera(new THREE.Vector2(nx * 2 - 1, -(ny * 2 - 1)), camera);
    const p = new THREE.Vector3(); ray.ray.intersectPlane(plane, p); return p;
  }
  function launch(to) { fly = { a: new THREE.Vector3(0, 0.6, 5.2), b: to, u: reduced() ? 1 : 0 }; }
  function throwAt(nx, ny) {
    const P = worldAt(nx, ny); launch(P);
    return () => {           // evaluated at arrival (wall-clock), against where targets ARE then
      let best = null, bd = 1.3;
      targets.forEach(T => { const d = Math.hypot(T.t.position.x - P.x, T.t.position.y - P.y); if (d < bd) { bd = d; best = T; } });
      if (!best) { burst3D(st, P, 0xffd27a, 8, 1); }
      return best ? best.grp : null;
    };
  }
  function throwAtTarget(grp) {
    const T = targets.find(x => x.grp === grp); const sp = (reduced() ? 0.5 : 0.8) + pace * (reduced() ? 0.3 : 1.0);
    launch(new THREE.Vector3(T.t.position.x + (T.row ? -1 : 1) * sp * 0.45, T.t.position.y, -0.9));
  }
  function hitFx(grp, ok) {
    const T = targets.find(x => x.grp === grp); T.flip = 0; T.ok = ok;
    burst3D(st, T.t.position.clone(), ok ? GROUPS[grp].hex : 0xff4d4d, ok ? 40 : 12, ok ? 3 : 1.2);
    st.punch(ok ? 0.08 : 0.03);
  }
  return { throwAt, throwAtTarget, hitFx, setPace: p => { pace = p; } };
}
