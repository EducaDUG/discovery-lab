/* Station 1 — the Life-Signs Scanner (MRS C GREN).
   A specimen floats as a holo-photo inside a glass bell jar; eight instrument
   pods (M R S C G R E N) ring the pedestal. Each test fires a beam and the
   specimen visibly reacts: a REAL life process (green), a LOOK-ALIKE that
   isn't a true life process (amber), or nothing (grey). The student then
   rules: living organism, non-living, or virus.
   Evidence is logged the moment the student decides (never on an animation
   frame — CLAUDE.md §4's rAF rule). */
import { L, reduced, SPEC, SCAN, SCAN_ORDER, PROCESSES, PROCESS_DEF, VERDICTS, img, creditLine } from "./data.js?v=1";
import { hasWebGL, makeStage, dressVault, photoTexture, glowTexture, textSprite, burst3D, burstAt, shake, floatText, blip } from "./fx.js?v=1";

const STATE_COL = { yes: 0x35d07f, look: 0xffb547, no: 0x7d8a93 };
const STATE_CSS = { yes: "#2fbf71", look: "#e69b22", no: "#7d8a93" };
const STATE_WORD = { yes: () => L("Real life process", "Proceso vital real"), look: () => L("Look-alike — not a real life process", "Parecido, pero NO es un proceso vital real"), no: () => L("Not detected", "No detectado") };

export function buildScanner(root, sim, onDone, muteBtn) {
  sim.state.scan = sim.state.scan || {};
  const prog = sim.state.scan;
  let cur = SCAN_ORDER.find(id => !prog[id]?.verdict) || SCAN_ORDER[0];

  const card = document.createElement("section"); card.className = "card lv-station";
  card.innerHTML = `
    <div class="lv-station__head">
      <p class="eyebrow">${L("Station 1 · Life-Signs Scanner", "Estación 1 · Escáner de Señales de Vida")}</p>
      <span class="lv-head-tools"></span>
    </div>
    <h3 class="lv-station__title">${L("Is it alive? Run the eight MRS C GREN tests", "¿Está vivo? Haz las ocho pruebas MRS C GREN")}</h3>
    <p class="q__hint">${L("Pick a sample, fire the test pods and watch it react. A living organism must show <b>all eight</b> real life processes. Watch out for amber look-alikes. Drag the scene to look around.",
      "Elige una muestra, dispara las pruebas y mira cómo reacciona. Un organismo vivo debe mostrar los <b>ocho</b> procesos vitales reales. Cuidado con los parecidos en ámbar. Arrastra la escena para mirar alrededor.")}</p>
    <div class="lv-picker" role="group" aria-label="${L("Choose a sample", "Elige una muestra")}"></div>
    <div class="lv-stage lv-stage--scan"><span class="lv-hud"></span><div class="lv-stamp" hidden></div></div>
    <div class="lv-tests" role="group" aria-label="${L("Life-sign tests", "Pruebas de señales de vida")}"></div>
    <div class="lv-readout" aria-live="polite"></div>
    <div class="lv-verdict">
      <p class="lv-verdict__q">${L("Your ruling for this sample:", "Tu dictamen para esta muestra:")} <span class="lv-verdict__lock"></span></p>
      <div class="lv-verdict__btns"></div>
      <div class="lv-verdict__fb" aria-live="polite"></div>
    </div>
    <p class="lv-credit"></p>`;
  root.append(card);
  card.querySelector(".lv-head-tools").append(muteBtn());
  card.querySelector(".lv-credit").innerHTML = creditLine(SCAN_ORDER);

  const picker = card.querySelector(".lv-picker"), stageEl = card.querySelector(".lv-stage"), hud = card.querySelector(".lv-hud");
  const testsEl = card.querySelector(".lv-tests"), readout = card.querySelector(".lv-readout"), stamp = card.querySelector(".lv-stamp");
  const vBtns = card.querySelector(".lv-verdict__btns"), vFb = card.querySelector(".lv-verdict__fb"), vLock = card.querySelector(".lv-verdict__lock");

  /* ---------- 3D scene ---------- */
  let scene3 = null;
  if (hasWebGL) scene3 = build3D(stageEl);
  else {
    stageEl.classList.add("lv-stage--flat");
    stageEl.insertAdjacentHTML("beforeend", `<img class="lv-flat-photo" alt="">`);
  }

  /* ---------- picker ---------- */
  function paintPicker() {
    picker.innerHTML = "";
    SCAN_ORDER.forEach(id => {
      const b = document.createElement("button"); b.type = "button"; b.className = "lv-pick";
      const v = prog[id]?.verdict;
      b.innerHTML = `<img src="${img(id)}" alt=""><span>${SPEC[id].name()}</span>${v ? `<em class="lv-pick__done">${prog[id].correct ? "✓" : "↺"}</em>` : ""}`;
      b.setAttribute("aria-pressed", id === cur ? "true" : "false");
      b.addEventListener("click", () => { cur = id; load(); blip("tap"); });
      picker.append(b);
    });
  }

  /* ---------- tests ---------- */
  function paintTests() {
    testsEl.innerHTML = "";
    const p = prog[cur] || {};
    PROCESSES.forEach((pr, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "lv-test";
      const st = p.tests?.[pr.id];
      if (st) b.dataset.state = st;
      b.innerHTML = `<span class="lv-test__letter">${pr.letter}</span><span class="lv-test__name">${pr.name()}</span>
        <span class="lv-test__light" aria-hidden="true"></span>`;
      b.setAttribute("aria-label", `${pr.name()}${st ? " — " + STATE_WORD[st]() : ""}`);
      b.addEventListener("click", () => runTest(pr, i, b));
      testsEl.append(b);
    });
  }
  function runTest(pr, i, btn) {
    const reading = SCAN[cur].r[pr.id];
    prog[cur] = prog[cur] || { tests: {} };
    if (prog[cur].verdict == null) { prog[cur].tests[pr.id] = reading.s; sim.saveState(); }
    btn.dataset.state = reading.s;
    btn.setAttribute("aria-label", `${pr.name()} — ${STATE_WORD[reading.s]()}`);
    btn.classList.remove("lv-bumpit"); void btn.offsetWidth; btn.classList.add("lv-bumpit");
    if (reading.s === "yes") { burstAt(btn, STATE_CSS.yes, 10); blip("ok"); }
    else if (reading.s === "look") { burstAt(btn, STATE_CSS.look, 8); blip("tap"); }
    else { shake(btn); blip("bad"); }
    readout.innerHTML = `<span class="lv-readout__tag" style="background:${STATE_CSS[reading.s]}">${pr.name()} · ${STATE_WORD[reading.s]()}</span>
      <span class="lv-readout__txt">${reading.n()}</span>
      <span class="lv-readout__def"><b>${pr.name()}:</b> ${PROCESS_DEF[pr.id]()}</span>`;
    if (sim.ttsEnabled && sim.ttsEnabled()) sim.speak(reading.n());
    scene3?.react(i, pr.id, reading.s);
    if (!scene3) { const ph = stageEl.querySelector(".lv-flat-photo"); ph.dataset.react = reading.s; ph.classList.remove("lv-flat-react"); void ph.offsetWidth; ph.classList.add("lv-flat-react"); }
    paintHud(); paintVerdict();
  }
  function counts() {
    const t = prog[cur]?.tests || {}; const v = Object.values(t);
    return { run: v.length, yes: v.filter(s => s === "yes").length, look: v.filter(s => s === "look").length };
  }
  function paintHud() {
    const c = counts();
    hud.innerHTML = `${SPEC[cur].name()} · ${L("tests", "pruebas")} ${c.run}/8 · <b style="color:#7dffb4">${c.yes}</b> ${L("real", "reales")} · <b style="color:#ffcf7a">${c.look}</b> ${L("look-alike", "parecidos")}`;
  }

  /* ---------- verdict ---------- */
  function paintVerdict() {
    const p = prog[cur] || {}; const c = counts();
    vBtns.innerHTML = ""; vFb.innerHTML = "";
    const locked = c.run < 3 && p.verdict == null;
    vLock.textContent = locked ? L(`(run at least 3 tests first — ${c.run}/3)`, `(haz al menos 3 pruebas antes — ${c.run}/3)`) : "";
    ["living", "nonliving", "virus"].forEach(v => {
      const b = document.createElement("button"); b.type = "button"; b.className = "btn btn--ghost lv-vbtn"; b.dataset.v = v;
      b.textContent = VERDICTS[v]();
      if (p.verdict === v) b.classList.add(p.correct ? "is-right" : "is-wrong");
      if (p.verdict && v === SCAN[cur].verdict && !p.correct) b.classList.add("is-answer");
      b.addEventListener("click", () => {
        if (prog[cur]?.verdict != null) { shake(b); vLock.textContent = L("(ruling already logged — pick the next sample)", "(dictamen ya registrado: elige la siguiente muestra)"); return; }
        if (counts().run < 3) { shake(b); vLock.classList.remove("lv-pulse"); void vLock.offsetWidth; vLock.classList.add("lv-pulse"); blip("bad"); return; }
        decide(v, b);
      });
      vBtns.append(b);
    });
    if (p.verdict) showVerdictFb(p);
    stamp.hidden = !p.verdict;
    if (p.verdict) { stamp.textContent = VERDICTS[SCAN[cur].verdict]().toUpperCase(); stamp.dataset.kind = SCAN[cur].verdict; }
  }
  function decide(v, btn) {
    const p = prog[cur] = prog[cur] || { tests: {} };
    const right = v === SCAN[cur].verdict;
    p.verdict = v; p.correct = right; sim.saveState();
    {
      const c = counts();
      const looks = PROCESSES.filter(pr => p.tests[pr.id] === "look").map(pr => pr.name());
      const reals = PROCESSES.filter(pr => p.tests[pr.id] === "yes").map(pr => pr.name());
      sim.recordTrial({
        station: L("Life scanner", "Escáner"),
        sample: SPEC[cur].name(),
        evidence: L(`Tests run ${c.run}/8. Real life processes: ${c.yes}${reals.length && reals.length < 8 ? " (" + reals.join(", ") + ")" : ""}. Look-alikes: ${c.look}${looks.length ? " (" + looks.join(", ") + ")" : ""}.`,
          `Pruebas ${c.run}/8. Procesos vitales reales: ${c.yes}${reals.length && reals.length < 8 ? " (" + reals.join(", ") + ")" : ""}. Parecidos: ${c.look}${looks.length ? " (" + looks.join(", ") + ")" : ""}.`),
        verdict: VERDICTS[v](),
        check: right ? L("Correct", "Correcto") : L(`Wrong - it is: ${VERDICTS[SCAN[cur].verdict]()}`, `Incorrecto - es: ${VERDICTS[SCAN[cur].verdict]()}`),
      });
    }
    if (right) { burstAt(btn, "#2fbf71", 18); floatText(btn, "+10 XP"); blip("win"); scene3?.celebrate(true); }
    else { shake(btn); blip("bad"); scene3?.celebrate(false); }
    paintVerdict(); paintPicker();
    if (SCAN_ORDER.every(id => prog[id]?.verdict)) {
      if (!prog._done) { prog._done = true; sim.saveState(); sim.award("lv-scanner", L("Life-Signs Expert", "Experto en Señales de Vida")); }
      onDone();
    }
  }
  function showVerdictFb(p) {
    const kind = SCAN[cur].verdict;
    const why = {
      living: (counts().run < 8
        ? L(`It carries out all eight real life processes — you ran ${counts().run}/8 tests, so run the rest to see the full proof. `, `Realiza los ocho procesos vitales reales: hiciste ${counts().run}/8 pruebas; haz las demás para ver la prueba completa. `)
        : L("It showed all eight real life processes. ", "Mostró los ocho procesos vitales reales. "))
        + L("The MRS C GREN test is passed only when every one is present.", "La prueba MRS C GREN solo se supera si están todos."),
      nonliving: L("It shows some look-alikes, but no real life processes: no cells, no offspring, no response, no control. Some signs are not enough — a living thing does all eight.", "Muestra algunos parecidos, pero ningún proceso vital real: sin células, sin descendencia, sin respuesta, sin control. Algunas señales no bastan: un ser vivo hace las ocho."),
      virus: L("It only copies itself inside a host cell and does nothing else on its own — and it is not made of cells. That is why viruses sit outside the five kingdoms.", "Solo se copia dentro de una célula huésped y no hace nada más por sí mismo; además no está formado por células. Por eso los virus quedan fuera de los cinco reinos."),
    }[kind];
    vFb.innerHTML = `<p class="lv-fb ${p.correct ? "lv-fb--ok" : "lv-fb--bad"}"><b>${p.correct ? L("Correct ruling!", "¡Dictamen correcto!") : L("Not quite — the answer is: ", "Casi: la respuesta es: ") + VERDICTS[kind]()}</b> ${why}</p>
      ${nextUnscanned() ? `<button type="button" class="btn lv-next">${L("Next sample →", "Siguiente muestra →")}</button>` : `<p class="lv-fb lv-fb--ok">${L("All five samples ruled. Station 1 complete!", "Las cinco muestras dictaminadas. ¡Estación 1 completa!")}</p>`}`;
    vFb.querySelector(".lv-next")?.addEventListener("click", () => { cur = nextUnscanned(); load(); });
  }
  const nextUnscanned = () => SCAN_ORDER.find(id => !prog[id]?.verdict && id !== cur) || null;

  function load() {
    paintPicker(); paintTests(); paintHud(); paintVerdict();
    readout.innerHTML = `<span class="lv-readout__txt">${L("Tap a test pod below. Every test is logged.", "Toca una prueba abajo. Cada prueba queda registrada.")}</span>`;
    if (scene3) scene3.setSpecimen(cur, prog[cur]?.tests || {});
    else { const ph = stageEl.querySelector(".lv-flat-photo"); ph.src = img(cur); ph.alt = SPEC[cur].name(); }
  }
  load();
}

/* ======================= the 3D bell-jar scanner ======================= */
function build3D(wrap) {
  const st = makeStage(wrap, { dist: 7.4, target: [0, 1.75, 0], autoSpin: 0.08, minPhi: 0.9, maxPhi: 1.45 });
  st.orbit.phi = 1.22;
  const { THREE, scene } = st;
  dressVault(st, { floorColor: [7, 28, 34] });

  // pedestal
  const metal = new THREE.MeshStandardMaterial({ color: 0x9fb3bd, metalness: 0.85, roughness: 0.28 });
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.85, 0.5, 48), metal); ped.position.y = 0.25; ped.castShadow = ped.receiveShadow = true; scene.add(ped);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x5ee6c8 });
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(1.63, 0.045, 12, 80), ringMat); glowRing.rotation.x = Math.PI / 2; glowRing.position.y = 0.52; scene.add(glowRing);
  // glass dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.55, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  dome.scale.set(1, 1.9, 1); dome.position.y = 0.5; scene.add(dome);
  const domeCap = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.05, 10, 64), metal); domeCap.rotation.x = Math.PI / 2; domeCap.position.y = 0.52; scene.add(domeCap);

  // specimen holo-card (double-sided photo with a glowing frame)
  const holder = new THREE.Group(); holder.position.y = 2.0; scene.add(holder);
  const cardMat = new THREE.MeshBasicMaterial({ map: photoTexture("photos/jellyfish.jpg"), side: THREE.DoubleSide, toneMapped: false });
  const cardMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cardMat); holder.add(cardMesh);
  const frame = new THREE.Mesh(new THREE.RingGeometry(1.42, 1.5, 4, 1, Math.PI / 4), new THREE.MeshBasicMaterial({ color: 0x5ee6c8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
  holder.add(frame);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(94,230,200,1)"), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(4.2, 4.2, 1); halo.position.z = -0.05; holder.add(halo);
  const thermo = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.035, 10, 64), new THREE.MeshBasicMaterial({ color: 0x5ee6c8, transparent: true, opacity: 0 }));
  thermo.rotation.x = Math.PI / 2; holder.add(thermo);

  // eight instrument pods
  const pods = [];
  const LET = ["M", "R", "S", "C", "G", "R", "E", "N"];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    const g = new THREE.Group(); g.position.set(Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4); scene.add(g);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.7, 20), metal); base.position.y = 0.35; base.castShadow = true; g.add(base);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0x2b4954, emissive: 0x5ee6c8, emissiveIntensity: 0.25, roughness: 0.2 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), bulbMat); bulb.position.y = 0.92; g.add(bulb);
    const lab = textSprite(LET[i], { size: 56, padX: 20 }); lab.position.y = 1.55; lab.scale.multiplyScalar(0.9); g.add(lab);
    pods.push({ g, bulb, bulbMat, a });
  }

  // beam
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x7dffb4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(beam);

  // effect particles pool (sprites)
  const fxMat = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const fxParts = [];
  function spawn(n, fn) {
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(fxMat.clone()); s.scale.setScalar(0.16);
      s.userData = { life: 0, max: 1.6 + Math.random() * 0.6 }; fn(s, i); scene.add(s); fxParts.push(s);
    }
  }

  const anim = { t: 99, kind: "", s: "no", pod: 0, grow: 1, growT: 1, offset: new THREE.Vector3(), clones: [], faceAng: 0 };
  let celebrateT = 99, celebrateOk = true;

  st.tick((dt, now) => {
    const slow = reduced();
    anim.t += dt;
    // idle motion
    holder.rotation.y += dt * (slow ? 0 : 0.35);
    const bob = slow ? 0 : Math.sin(now / 900) * 0.06;
    // reactions (cosmetic)
    const k = anim.kind, s = anim.s, tt = anim.t, amp = s === "yes" ? 1 : s === "look" ? 0.5 : 0;
    let ox = 0, oy = 0;
    if (k === "movement" && tt < 2.2 && amp) { ox = Math.sin(tt * 6) * 0.35 * amp * (1 - tt / 2.2); oy = Math.abs(Math.sin(tt * 6)) * 0.25 * amp; }
    if (k === "sensitivity" && tt < 2 && amp) holder.rotation.y += Math.sin(tt * 9) * 0.06 * amp;
    anim.grow += (anim.growT - anim.grow) * Math.min(1, dt * 3);
    holder.position.set(ox, 2.0 + bob + oy, 0);
    holder.scale.setScalar(anim.grow);
    // thermometer/control ring
    thermo.material.opacity = (k === "control" && tt < 2.4) ? (amp ? 0.9 * (1 - tt / 2.4) : 0.25) : 0;
    thermo.material.color.setHex(amp ? 0x7dffb4 : 0xff6b6b);
    // beam
    const p = pods[anim.pod];
    if (tt < 0.8) {
      const from = new THREE.Vector3(p.g.position.x, 0.95, p.g.position.z), to = holder.position.clone();
      const mid = from.clone().add(to).multiplyScalar(0.5), len = from.distanceTo(to);
      beam.position.copy(mid); beam.scale.set(1, len, 1); beam.lookAt(to); beam.rotateX(Math.PI / 2);
      beam.material.opacity = (s === "no" ? 0.35 : 0.85) * (1 - tt / 0.8);
      beam.material.color.setHex(STATE_COL[s]);
    } else beam.material.opacity = 0;
    pods.forEach((q, i) => { q.bulbMat.emissiveIntensity += ((i === anim.pod && tt < 1.4 ? 2.2 : 0.25) - q.bulbMat.emissiveIntensity) * Math.min(1, dt * 5); });
    // clones (reproduction)
    anim.clones.forEach(c => {
      c.userData.t += dt; const u = Math.min(1, c.userData.t / 1.8);
      c.position.set(holder.position.x + c.userData.dir * u * 1.6, holder.position.y + u * 0.6, 0.2);
      c.scale.setScalar(0.25 + u * 0.45); c.material.opacity = u < 0.75 ? 1 : (1 - u) * 4;
      if (u >= 1) { scene.remove(c); c.userData.dead = true; }
    });
    anim.clones = anim.clones.filter(c => !c.userData.dead);
    // fx particles
    for (let i = fxParts.length - 1; i >= 0; i--) {
      const s2 = fxParts[i]; s2.userData.life += dt;
      const u = s2.userData.life / s2.userData.max;
      if (u >= 1) { scene.remove(s2); fxParts.splice(i, 1); continue; }
      s2.userData.step?.(s2, dt, u); s2.material.opacity = u < 0.8 ? 1 : (1 - u) * 5;
    }
    // stamp celebration ring
    celebrateT += dt;
    glowRing.material.color.setHex(celebrateT < 2 ? (celebrateOk ? 0x7dffb4 : 0xff6b6b) : 0x5ee6c8);
    frame.material.color.setHex(celebrateT < 2 ? (celebrateOk ? 0x7dffb4 : 0xff6b6b) : 0x5ee6c8);
  });

  function react(i, kind, s) {
    anim.t = 0; anim.kind = kind; anim.s = s; anim.pod = i;
    const hp = holder.position;
    const col = STATE_COL[s];
    if (s === "no") { burst3D(st, new THREE.Vector3(hp.x, hp.y, hp.z), 0xff6b6b, 8, 1); return; }
    st.punch(0.06);
    const amp = s === "yes" ? 1 : 0.45;
    if (kind === "growth") anim.growT = Math.min(1.35, anim.growT + 0.12 * amp + 0.04);
    if (kind === "reproduction") {
      [-1, 1].forEach(dir => {
        const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cardMat.map, transparent: true, depthWrite: false }));
        c.userData = { t: 0, dir }; scene.add(c); anim.clones.push(c);
      });
    }
    if (kind === "respiration") spawn(Math.round(22 * amp), (p) => { p.material.color.setHex(0xbfe9ff); p.position.set(hp.x + (Math.random() - 0.5), hp.y - 0.3, (Math.random() - 0.5) * 0.6); p.userData.step = (q, dt) => { q.position.y += dt * 1.1; q.position.x += Math.sin(q.userData.life * 6) * dt * 0.2; }; });
    if (kind === "excretion") spawn(Math.round(18 * amp), (p) => { p.material.color.setHex(0xc8a06b); p.position.copy(hp); const a = Math.random() * Math.PI * 2; p.userData.v = new THREE.Vector3(Math.cos(a), -0.3, Math.sin(a)); p.userData.step = (q, dt) => q.position.addScaledVector(q.userData.v, dt * 0.9); });
    if (kind === "nutrition") spawn(Math.round(20 * amp), (p) => { p.material.color.setHex(0xffd24d); const a = Math.random() * Math.PI * 2; p.userData.from = new THREE.Vector3(hp.x + Math.cos(a) * 2.4, hp.y + (Math.random() - 0.5) * 1.5, Math.sin(a) * 2.4); p.position.copy(p.userData.from); p.userData.step = (q, dt, u) => q.position.lerpVectors(q.userData.from, holder.position, Math.min(1, u * 1.4)); });
    if (kind === "sensitivity") spawn(Math.round(10 * amp), (p) => { p.material.color.setHex(0xffffff); const a = Math.random() * 0.4; p.userData.from = new THREE.Vector3(hp.x + 2.6, hp.y + 1.4 + a, 0.6); p.position.copy(p.userData.from); p.userData.step = (q, dt, u) => q.position.lerpVectors(q.userData.from, holder.position, Math.min(1, u * 1.6)); });
    if (kind === "movement" || kind === "control") burst3D(st, hp.clone(), col, Math.round(14 * amp), 1.4);
    burst3D(st, hp.clone(), col, Math.round(10 * amp), 1.8);
  }

  function setSpecimen(id, tests) {
    cardMat.map = photoTexture(`photos/${id}.jpg`); cardMat.needsUpdate = true;
    anim.growT = anim.grow = 1 + (tests.growth === "yes" ? 0.12 : tests.growth === "look" ? 0.06 : 0);
    anim.t = 99; burst3D(st, holder.position.clone(), 0x5ee6c8, 16, 2);
  }
  function celebrate(ok) { celebrateT = 0; celebrateOk = ok; burst3D(st, holder.position.clone(), ok ? 0x7dffb4 : 0xff6b6b, ok ? 40 : 12, ok ? 3 : 1.2); st.punch(ok ? 0.12 : 0.04); }
  return { react, setSpecimen, celebrate };
}
