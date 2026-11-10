/* The four Experiment stations. Progress lives in sim.state (+ sim.saveState()) so a reload resumes
   exactly where the student was (CLAUDE.md §12.16). Every click path reacts in place (§4). */
import { L, PARTS, OBJ, OBJ_NAME, img, creditLine } from "./data.js?v=1";
import { burstAt, shake, floatText } from "./fx.js?v=1";
import { hasWebGL, buildScope3D } from "./scope3d.js?v=3";
import { makeView, blurFor, sharpPct, CRASH_AT, IDEAL } from "./view.js?v=2";

const $ = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const objCol = x => (OBJ.find(o => o.x === x) || {}).c || "#888";

/* little drawn lens barrels so "x40" is a real object, not just a number (CLAUDE.md §4 visual manipulatives) */
export function objSVG(x, h = 46) {
  const len = { 4: 22, 10: 30, 40: 38, 100: 44 }[x] || 30, c = objCol(x);
  return `<svg viewBox="0 0 40 60" width="${h * 0.66}" height="${h}" aria-hidden="true"><rect x="12" y="2" width="16" height="9" rx="2" fill="#8d97a2"/><rect x="${20 - 9}" y="11" width="18" height="${len}" rx="4" fill="#20262e"/><rect x="${20 - 9}" y="${11 + 8}" width="18" height="6" fill="${c}"/><rect x="${20 - 4.5}" y="${11 + len}" width="9" height="5" rx="1.5" fill="#bcd4e6"/></svg>`;
}
export function eyeSVG(h = 46) {
  return `<svg viewBox="0 0 40 60" width="${h * 0.66}" height="${h}" aria-hidden="true"><rect x="11" y="4" width="18" height="40" rx="4" fill="#cfd6dd"/><rect x="9" y="38" width="22" height="9" rx="2" fill="#20262e"/><rect x="13" y="1" width="14" height="5" rx="2" fill="#5aa0ff"/><rect x="11" y="14" width="18" height="4" fill="#b88a3a"/></svg>`;
}
function ok(sim, n) { sim.state.xp = (sim.state.xp || 0) + n; sim.saveState(); sim.hud && sim.hud(); }

/* =========================================================================================
   STATION 1 - NAME THAT PART: real-photo hotspots, clue-driven, no gating on the first guess
   ========================================================================================= */
export function buildParts(host, sim, onDone) {
  const S = (sim.state.parts = sim.state.parts || { order: shuffle(PARTS.map(p => p.id)), i: 0, found: {}, tries: 0 });
  const wrap = $(`<section class="mc-st mc-st--parts" aria-labelledby="mc-s1">
    <h3 class="mc-h" id="mc-s1">${L("Station 1 · Name That Part", "Estación 1 · Nombra la parte")}</h3>
    <p class="q__hint">${L("A clue appears. Tap the matching part on this REAL microscope. Nine parts to find.", "Aparece una pista. Toca la parte correspondiente en este microscopio REAL. Hay nueve partes.")}</p>
    <div class="mc-parts">
      <div class="mc-photo"><img src="${img("scope")}" alt="${L("A real compound light microscope on a bench, seen from the side", "Un microscopio óptico compuesto real sobre una mesa, visto de lado")}">
        <div class="mc-pins"></div></div>
      <div class="mc-clue" aria-live="polite"></div>
    </div>
    <p class="mc-credit"></p></section>`);
  host.append(wrap);
  wrap.querySelector(".mc-credit").innerHTML = creditLine(["scope"]);
  const pins = wrap.querySelector(".mc-pins"), clue = wrap.querySelector(".mc-clue"), photo = wrap.querySelector(".mc-photo");
  const byId = Object.fromEntries(PARTS.map(p => [p.id, p]));
  PARTS.forEach((p, n) => {
    const b = $(`<button type="button" class="mc-pin" style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${L("Part", "Parte")} ${n + 1}" data-id="${p.id}">${n + 1}</button>`);
    if (S.found[p.id]) { b.dataset.state = "ok"; }
    b.addEventListener("click", () => tap(p.id, b));
    pins.append(b);
  });
  function paint() {
    const id = S.order[S.i];
    if (!id) {
      clue.innerHTML = `<div class="mc-medal">🥉</div><p class="mc-big">${L("Bronze medal — all nine parts named!", "¡Medalla de bronce: las nueve partes!")}</p><p>${L("You can name the parts and state their functions.", "Sabes nombrar las partes y decir sus funciones.")}</p>`;
      onDone(); return;
    }
    clue.innerHTML = `<p class="mc-count">${L("Part", "Parte")} ${S.i + 1} / ${PARTS.length}</p>
      <p class="mc-big">“${byId[id].clue()}”</p>
      <p class="q__hint">${L("Tap the numbered pin on the photo.", "Toca el punto numerado en la foto.")}</p><div class="mc-reveal" role="status"></div>`;
  }
  function tap(id, btn) {
    const cur = S.order[S.i]; if (!cur) return;
    const rev = clue.querySelector(".mc-reveal");
    if (S.found[id]) { rev.innerHTML = `<b>${byId[id].name()}</b> — ${byId[id].fn()}`; return; }
    if (id === cur) {
      S.found[id] = 1; btn.dataset.state = "ok"; burstAt(btn, "#2fbf71", 18); floatText(btn, "+10");
      const first = S.tries === 0; ok(sim, first ? 10 : 6);
      sim.recordTrial({ station: L("1 Parts", "1 Partes"), step: byId[id].name(), result: first ? L("Correct first try", "Correcta al primer intento") : L(`Correct after ${S.tries + 1} tries`, `Correcta tras ${S.tries + 1} intentos`), detail: byId[id].fn() });
      S.tries = 0; S.i++; sim.saveState();
      rev.innerHTML = `<div class="mc-good"><b>${byId[id].name()}</b> — ${byId[id].fn()}</div>`;
      const next = $(`<button type="button" class="btn btn--signal">${S.i >= PARTS.length ? L("Finish ▶", "Terminar ▶") : L("Next part ▶", "Siguiente parte ▶")}</button>`);
      next.addEventListener("click", paint); rev.append(next); next.focus({ preventScroll: true });
    } else {
      S.tries++; sim.saveState(); btn.dataset.state = "bad"; shake(btn); burstAt(btn, "#d9475e", 6);
      setTimeout(() => { if (btn.dataset.state === "bad") btn.removeAttribute("data-state"); }, 700);
      rev.innerHTML = `<div class="mc-bad">${L(`That is the ${byId[id].name()}. Try another part.`, `Eso es: ${byId[id].name()}. Prueba con otra parte.`)}${S.tries >= 2 ? " " + L("Look at the clue again — which job does it describe?", "Vuelve a leer la pista: ¿qué función describe?") : ""}</div>`;
      shake(photo);
    }
  }
  paint();
}

/* =========================================================================================
   STATION 2 - FOCUS LIKE A PRO: 3D microscope + live eyepiece view + procedure checklist
   ========================================================================================= */
export function buildFocus(host, sim, onDone) {
  const F = (sim.state.focus = sim.state.focus || { goals: [], coarse: 55, fine: 0, light: 0.4, obj: 4, slide: false, crashes: 0, q: null });
  const GOALS = [
    L("Lower the stage (coarse knob) before you start", "Baja la platina (tornillo macrométrico) antes de empezar"),
    L("Put the slide on the stage", "Coloca la preparación en la platina"),
    L("Choose the LOWEST power objective (×4)", "Elige el objetivo de MENOR aumento (×4)"),
    L("Set the light, then find the cells with the coarse knob", "Ajusta la luz y encuentra las células con el tornillo macrométrico"),
    L("Make ×4 perfectly sharp with the FINE knob", "Enfoca a la perfección en ×4 con el tornillo micrométrico"),
    L("Switch to ×10 and refocus with the FINE knob only", "Cambia a ×10 y reenfoca solo con el micrométrico"),
    L("Switch to ×40 and refocus with the FINE knob only", "Cambia a ×40 y reenfoca solo con el micrométrico"),
    L("Challenge: answer the question below", "Reto: responde a la pregunta de abajo"),
  ];
  const wrap = $(`<section class="mc-st mc-st--focus" aria-labelledby="mc-s2">
    <h3 class="mc-h" id="mc-s2">${L("Station 2 · Focus Like a Pro", "Estación 2 · Enfoca como un profesional")}</h3>
    <p class="q__hint">${L("Operate the microscope. Follow the checklist: each step ticks itself when you do it right. Drag to orbit the 3D microscope; tap a part to see its name.", "Maneja el microscopio. Sigue la lista: cada paso se marca solo cuando lo haces bien. Arrastra para girar el microscopio 3D; toca una parte para ver su nombre.")}</p>
    <div class="mc-focus">
      <div class="mc-3d mc-stage" tabindex="-1"></div>
      <div class="mc-bench">
        <div class="mc-eye"><canvas width="300" height="300" aria-label="${L("What you see through the eyepiece", "Lo que ves por el ocular")}" role="img"></canvas>
          <div class="mc-eye__hud"><span class="mc-tot"></span><span class="mc-sharp"></span></div></div>
        <div class="mc-ctl">
          <label class="mc-row"><span>${L("Light", "Luz")}</span><input type="range" class="mc-light" min="0" max="150" value="${F.light * 100}"><output class="mc-lo"></output></label>
          <label class="mc-row"><span>${L("Coarse focus (stage height)", "Macrométrico (altura de platina)")}</span><input type="range" class="mc-coarse" min="0" max="100" step="1" value="${F.coarse}"><output class="mc-co"></output></label>
          <label class="mc-row"><span>${L("Fine focus", "Micrométrico")}</span><input type="range" class="mc-fine" min="-20" max="20" step="0.1" value="${F.fine}"><output class="mc-fo"></output></label>
          <div class="mc-row mc-row--objs" role="group" aria-label="${L("Objective lens", "Lente objetivo")}"></div>
          <button type="button" class="btn btn--signal mc-slide">${L("Place the onion slide on the stage", "Colocar la preparación de cebolla en la platina")}</button>
        </div>
      </div>
    </div>
    <ol class="mc-goals"></ol>
    <div class="mc-msg" role="status" aria-live="polite"></div>
    <div class="mc-challenge"></div>
    <p class="mc-credit"></p></section>`);
  host.append(wrap);
  wrap.querySelector(".mc-credit").innerHTML = creditLine(["onion-low", "onion-nuc"]);
  const msg = wrap.querySelector(".mc-msg"), goalsEl = wrap.querySelector(".mc-goals");
  const q = s => wrap.querySelector(s);
  const light = q(".mc-light"), coarse = q(".mc-coarse"), fine = q(".mc-fine"), slideBtn = q(".mc-slide");
  const canvas = q(".mc-eye canvas"); const view = makeView(canvas, { slide: "onion", obj: F.obj, blur: 18, light: F.light }); view.resize(300);
  let scope = null;
  const stageEl = q(".mc-3d");
  if (hasWebGL) { scope = buildScope3D(stageEl, { onPart: id => { if (id) { const p = PARTS.find(x => x.id === id); msg.innerHTML = `<b>${p.name()}</b> — ${p.fn()}`; } } }); }
  else stageEl.innerHTML = `<p class="mc-nogl">${L("3D view unavailable on this device — use the controls and the eyepiece view.", "Vista 3D no disponible en este dispositivo: usa los controles y la vista del ocular.")}</p>`;
  const objRow = q(".mc-row--objs");
  OBJ.forEach(o => {
    const b = $(`<button type="button" class="mc-obj" data-x="${o.x}" aria-pressed="false">${objSVG(o.x, 40)}<span>×${o.x}</span></button>`);
    b.addEventListener("click", () => setObj(o.x, true)); objRow.append(b);
  });
  goalsEl.innerHTML = GOALS.map((g, i) => `<li data-i="${i}"><span class="mc-tick" aria-hidden="true"></span>${g}</li>`).join("");
  let coarseAtSwitch = F.coarse, fineAtSwitch = F.fine;

  const lightOK = () => F.light >= 0.75 && F.light <= 1.15;
  function sharpNow() { return sharpPct(blurFor(F.obj, F.coarse, F.fine)); }
  function paint() {
    const b = F.slide ? blurFor(F.obj, F.coarse, F.fine) : 18;
    view.set({ obj: F.obj, blur: b, light: F.light });
    scope && (scope.setCoarse(F.coarse), scope.setFine(F.fine), scope.setLight(F.light), scope.setObjective(OBJ.findIndex(o => o.x === F.obj)), scope.setSlide(F.slide));
    q(".mc-lo").textContent = Math.round(F.light * 100) + "%"; q(".mc-co").textContent = F.coarse; q(".mc-fo").textContent = F.fine.toFixed(1);
    q(".mc-tot").textContent = `${L("Total", "Total")}: ×10 × ×${F.obj} = ×${10 * F.obj}`;
    const sp = F.slide ? sharpPct(b) : 0; const sh = q(".mc-sharp");
    sh.textContent = F.slide ? `${L("Sharpness", "Nitidez")} ${sp}%` : L("No slide yet", "Sin preparación"); sh.dataset.v = sp >= 90 ? "hi" : sp >= 45 ? "mid" : "lo";
    objRow.querySelectorAll(".mc-obj").forEach(bb => { const on = +bb.dataset.x === F.obj; bb.setAttribute("aria-pressed", on); bb.classList.toggle("is-on", on); });
    slideBtn.textContent = F.slide ? L("Remove the slide", "Quitar la preparación") : L("Place the onion slide on the stage", "Colocar la preparación de cebolla en la platina");
    goalsEl.querySelectorAll("li").forEach((li, i) => li.classList.toggle("done", !!F.goals[i]));
  }
  function say(t, cls) { msg.className = "mc-msg" + (cls ? " " + cls : ""); msg.textContent = t; }
  function award(i, label) {
    if (F.goals[i]) return; F.goals[i] = true; ok(sim, 15);
    const li = goalsEl.children[i]; burstAt(li, "#2fbf71", 16); floatText(li, "+15"); scope && scope.celebrate();
    sim.recordTrial({ station: L("2 Focus", "2 Enfoque"), step: GOALS[i], objective: "×" + F.obj, magnification: "×" + 10 * F.obj, sharpness: sharpNow() + "%", light: Math.round(F.light * 100) + "%", result: label || L("Done", "Hecho") });
    sim.saveState(); paint();
    if (i === 6) showChallenge();
  }
  function check() {
    const g = F.goals;
    if (!g[0] && F.coarse <= 25) award(0);
    if (g[0] && !g[1] && F.slide) award(1);
    if (g[1] && !g[2] && F.slide && F.obj === 4) award(2);
    if (g[2] && !g[3] && F.obj === 4 && sharpNow() >= 45 && lightOK()) award(3);
    if (g[3] && !g[4] && F.obj === 4 && sharpNow() >= 92 && lightOK()) award(4);
    if (g[4] && !g[5] && F.obj === 10 && sharpNow() >= 90 && lightOK()) {
      if (Math.abs(F.coarse - coarseAtSwitch) < 0.5) award(5, L("Fine focus only ✔", "Solo micrométrico ✔")); else say(L("Sharp — but you moved the COARSE knob. At higher power use the fine knob only. Switch lens and try again.", "Nítido, pero moviste el macrométrico. Con más aumento usa solo el micrométrico. Cambia de lente y prueba otra vez."), "bad");
    }
    if (g[5] && !g[6] && F.obj === 40 && sharpNow() >= 88 && lightOK()) {
      if (Math.abs(F.coarse - coarseAtSwitch) < 0.5) award(6, L("Fine focus only ✔", "Solo micrométrico ✔")); else say(L("Sharp — but you moved the COARSE knob. Use the fine knob only at ×40.", "Nítido, pero moviste el macrométrico. Con ×40 usa solo el micrométrico."), "bad");
    }
  }
  function crashCheck() {
    if (F.slide && F.coarse >= CRASH_AT[F.obj]) {
      F.crashes++; scope && scope.crash(); shake(canvas.parentElement);
      sim.recordTrial({ station: L("2 Focus", "2 Enfoque"), step: L("Lens touched the slide", "La lente tocó la preparación"), objective: "×" + F.obj, magnification: "×" + 10 * F.obj, sharpness: "—", light: Math.round(F.light * 100) + "%", result: L("Crunch! Stage lowered again", "¡Crac! Platina bajada de nuevo") });
      F.coarse = 20; F.fine = 0; coarse.value = 20; fine.value = 0; coarseAtSwitch = 20; fineAtSwitch = 0;
      say(L("CRUNCH! The high-power lens is very close to the slide. Always focus by moving the stage AWAY from the lens, and never use the coarse knob at high power. The stage has been lowered — no harm done.", "¡CRAC! La lente de alto aumento está muy cerca de la preparación. Enfoca siempre alejando la platina de la lente y nunca uses el macrométrico con aumento alto. Se bajó la platina: no pasó nada."), "bad");
      sim.saveState(); return true;
    }
    return false;
  }
  function setObj(x, user) {
    if (F.obj === x) return;
    if (user && F.slide && !F.goals[2] && x !== 4) say(L("Careful — start with the LOWEST power (×4). A high-power lens has a tiny field of view, so the cells are very hard to find. (See the challenge at the bottom.)", "Cuidado: empieza con el MENOR aumento (×4). Con aumento alto el campo es diminuto y es muy difícil encontrar las células. (Mira el reto de abajo.)"), "bad");
    F.obj = x; coarseAtSwitch = F.coarse; fineAtSwitch = F.fine; scope && scope.st.punch(0.04); burstAt(objRow.querySelector(`[data-x="${x}"]`), objCol(x), 8);
    if (x === 100) say(L("×100 needs a drop of oil on the slide (oil immersion) and is not used for onion skin. Go back to ×4, ×10 or ×40.", "El ×100 necesita una gota de aceite (inmersión) y no se usa con la piel de cebolla. Vuelve a ×4, ×10 o ×40."));
    sim.saveState(); paint(); if (!crashCheck()) { paint(); check(); }
  }
  light.addEventListener("input", () => { F.light = light.value / 100; sim.saveState(); paint(); check(); });
  coarse.addEventListener("input", () => { F.coarse = +coarse.value; paint(); if (!crashCheck()) { sim.saveState(); paint(); check(); } });
  fine.addEventListener("input", () => { F.fine = +fine.value; sim.saveState(); paint(); check(); });
  slideBtn.addEventListener("click", () => {
    if (!F.slide && !F.goals[0] && F.coarse > 25) { say(L("First lower the stage with the coarse focus knob (below 25) so the slide can't hit the lens.", "Primero baja la platina con el macrométrico (por debajo de 25) para que la preparación no choque con la lente."), "bad"); shake(coarse); shake(slideBtn); return; }
    F.slide = !F.slide; burstAt(slideBtn, "#6fd6ff", 10); sim.saveState(); paint(); check();
  });
  function showChallenge() {
    const box = q(".mc-challenge"); const opts = shuffle([
      { id: "a", ok: true, t: L("A ×40 lens has a very small field of view and a thin focus range, so the sample is hard to find, and the lens sits so close that it could crack the slide.", "Una lente ×40 tiene un campo de visión muy pequeño y un rango de enfoque estrecho, así que la muestra es difícil de encontrar, y la lente queda tan cerca que podría romper la preparación.") },
      { id: "b", t: L("The ×40 lens uses up more electricity from the lamp.", "La lente ×40 gasta más electricidad de la lámpara.") },
      { id: "c", t: L("The ×40 lens cannot see cells at all, only the ×4 can.", "La lente ×40 no puede ver células, solo la ×4.") },
      { id: "d", t: L("The picture is always upside down at ×40.", "La imagen siempre está al revés con ×40.") }]);
    box.innerHTML = `<h4 class="mc-h2">${L("Challenge", "Reto")}</h4><p><b>${L("Why should you NOT start with the lens that has the biggest magnification?", "¿Por qué NO debes empezar con la lente de mayor aumento?")}</b></p><div class="mc-opts"></div><div class="mc-fb" role="status"></div>`;
    const wrapO = box.querySelector(".mc-opts");
    if (F.q) { box.querySelector(".mc-fb").innerHTML = `<div class="mc-good">${L("Answered ✔ — a high-power lens has a tiny field of view and thin focus range, and sits close to the slide.", "Respondido ✔: una lente de alto aumento tiene un campo diminuto y un enfoque estrecho, y queda cerca de la preparación.")}</div>`; return; }
    opts.forEach(o => {
      const b = $(`<button type="button" class="mc-opt">${o.t}</button>`);
      b.addEventListener("click", () => {
        if (o.ok) {
          F.q = "ok"; b.classList.add("good"); burstAt(b, "#2fbf71", 18); award(7, L("Correct", "Correcta")); sim.saveState();
          box.querySelector(".mc-fb").innerHTML = `<div class="mc-good">${L("Yes! Start low, find the cells, then step up — and use only the fine knob at high power.", "¡Sí! Empieza con bajo aumento, encuentra las células y sube; con aumento alto usa solo el micrométrico.")}</div>`;
          wrapO.querySelectorAll("button").forEach(x => x.disabled = true);
          q(".mc-goals").insertAdjacentHTML("afterend", `<p class="mc-medal-line">🥈 ${L("Silver medal — you can use a microscope to make observations.", "Medalla de plata: sabes usar un microscopio para hacer observaciones.")}</p>`);
          onDone();
        } else { b.classList.add("bad"); shake(b); box.querySelector(".mc-fb").innerHTML = `<div class="mc-bad">${L("Not quite. Think about the field of view and how close the lens gets to the slide.", "No exactamente. Piensa en el campo de visión y en lo cerca que queda la lente de la preparación.")}</div>`; }
      });
      wrapO.append(b);
    });
  }
  // restore
  coarse.value = F.coarse; fine.value = F.fine; light.value = F.light * 100;
  paint();
  if (F.goals[6]) showChallenge();
  if (F.goals[7]) { q(".mc-goals").insertAdjacentHTML("afterend", `<p class="mc-medal-line">🥈 ${L("Silver medal — you can use a microscope to make observations.", "Medalla de plata: sabes usar un microscopio para hacer observaciones.")}</p>`); onDone(); }
}

/* =========================================================================================
   STATION 3 - MAGNIFICATION MISSION: order queue (calculate, then work backwards)
   ========================================================================================= */
const ORDERS = [
  { k: "calc", e: 10, o: 4 }, { k: "calc", e: 10, o: 10 }, { k: "calc", e: 5, o: 40 }, { k: "calc", e: 15, o: 40 }, { k: "calc", e: 5, o: 100 },
  { k: "pick", e: 10, T: 400, o: 40 }, { k: "pick", e: 15, T: 150, o: 10 }, { k: "pick", e: 5, T: 20, o: 4 },
];
export function buildMagnify(host, sim, onDone) {
  const M = (sim.state.mag = sim.state.mag || { i: 0, right: 0, streak: 0, tries: 0 });
  const wrap = $(`<section class="mc-st mc-st--mag" aria-labelledby="mc-s3">
    <h3 class="mc-h" id="mc-s3">${L("Station 3 · Magnification Mission", "Estación 3 · Misión de aumento")}</h3>
    <div class="mc-formula" aria-label="${L("Overall magnification equals eyepiece magnification times objective magnification", "Aumento total igual a aumento del ocular por aumento del objetivo")}">
      <span>${L("Overall magnification", "Aumento total")}</span><b>=</b><span>${L("eyepiece", "ocular")}</span><b>×</b><span>${L("objective", "objetivo")}</span></div>
    <div class="mc-mag">
      <div class="mc-eye mc-eye--s"><canvas width="240" height="240" role="img" aria-label="${L("Onion cells at the chosen magnification", "Células de cebolla con el aumento elegido")}"></canvas><div class="mc-eye__hud"><span class="mc-mt"></span></div></div>
      <div class="mc-order" aria-live="polite"></div>
    </div><p class="mc-credit"></p></section>`);
  host.append(wrap); wrap.querySelector(".mc-credit").innerHTML = creditLine(["onion-low", "onion-nuc"]);
  const view = makeView(wrap.querySelector("canvas"), { slide: "onion", obj: 4, blur: 0, light: 1 }); view.resize(240);
  const box = wrap.querySelector(".mc-order"), mt = wrap.querySelector(".mc-mt");
  function render() {
    const od = ORDERS[M.i];
    if (!od) { box.innerHTML = `<div class="mc-medal">🥇</div><p class="mc-big">${L("Gold medal — you can calculate magnification!", "¡Medalla de oro: sabes calcular el aumento!")}</p><p>${L(`You answered ${M.right} of ${ORDERS.length} orders on the first go.`, `Acertaste ${M.right} de ${ORDERS.length} pedidos a la primera.`)}</p>`; mt.textContent = ""; onDone(); return; }
    view.set({ obj: od.o === 100 ? 100 : od.o });
    mt.textContent = od.k === "calc" ? `×${od.e} × ×${od.o}` : `${L("Total needed", "Total pedido")}: ×${od.T}`;
    const lens = `<div class="mc-lenses"><div class="mc-lens">${eyeSVG(54)}<span>${L("Eyepiece", "Ocular")}<b>×${od.e}</b></span></div>
      ${od.k === "calc" ? `<div class="mc-lens">${objSVG(od.o, 54)}<span>${L("Objective", "Objetivo")}<b>×${od.o}</b></span></div>` : `<div class="mc-lens mc-lens--q"><span>${L("Objective", "Objetivo")}<b>?</b></span></div>`}</div>`;
    if (od.k === "calc") {
      box.innerHTML = `<p class="mc-count">${L("Order", "Pedido")} ${M.i + 1} / ${ORDERS.length}</p>${lens}
        <p class="mc-big">${L("What is the overall magnification?", "¿Cuál es el aumento total?")}</p>
        <div class="mc-answer"><span>×</span><input class="input mc-num" type="number" inputmode="numeric" min="0" aria-label="${L("Overall magnification", "Aumento total")}"><button type="button" class="btn btn--signal mc-go">${L("Check", "Comprobar")}</button></div><div class="mc-fb" role="status"></div>`;
    } else {
      box.innerHTML = `<p class="mc-count">${L("Order", "Pedido")} ${M.i + 1} / ${ORDERS.length}</p>${lens}
        <p class="mc-big">${L(`The customer needs an overall magnification of ×${od.T}. Which objective lens do you load?`, `El cliente necesita un aumento total de ×${od.T}. ¿Qué lente objetivo colocas?`)}</p>
        <div class="mc-objs" role="group" aria-label="${L("Choose an objective", "Elige un objetivo")}">${OBJ.slice(0, 4).map(o => `<button type="button" class="mc-obj" data-x="${o.x}">${objSVG(o.x, 44)}<span>×${o.x}</span></button>`).join("")}</div><div class="mc-fb" role="status"></div>`;
    }
    const fb = box.querySelector(".mc-fb");
    const submit = val => {
      const right = od.k === "calc" ? val === od.e * od.o : val === od.o;
      const row = od.k === "calc" ? { eyepiece: "×" + od.e, objective: "×" + od.o, asked: L("overall magnification", "aumento total"), answer: "×" + val, correct: "×" + od.e * od.o }
        : { eyepiece: "×" + od.e, objective: L("? (to find)", "? (por hallar)"), asked: `${L("total", "total")} ×${od.T}`, answer: "×" + val, correct: "×" + od.o };
      if (right) {
        const first = M.tries === 0; if (first) M.right++; M.streak++; ok(sim, first ? 12 : 6);
        sim.recordTrial({ station: L("3 Magnify", "3 Aumento"), step: `${L("Order", "Pedido")} ${M.i + 1}: ${row.eyepiece} × ${row.objective} → ${row.answer}`, objective: row.objective, magnification: "×" + od.e * od.o, sharpness: "—",  result: first ? L("Correct first try", "Correcta a la primera") : L("Correct after a retry", "Correcta tras reintentar") });
        M.i++; M.tries = 0; sim.saveState();
        fb.innerHTML = `<div class="mc-good">${od.k === "calc" ? `×${od.e} × ×${od.o} = <b>×${od.e * od.o}</b>` : `×${od.e} × ×${od.o} = ×${od.e * od.o} ✔`} — ${L("the picture is that many times bigger than the real thing.", "la imagen se ve ese número de veces más grande que la real.")}</div>`;
        burstAt(fb, "#2fbf71", 20); floatText(fb, "+" + (first ? 12 : 6));
        const nx = $(`<button type="button" class="btn btn--signal">${M.i >= ORDERS.length ? L("Finish ▶", "Terminar ▶") : L("Next order ▶", "Siguiente pedido ▶")}</button>`); nx.addEventListener("click", render); fb.append(" ", nx); nx.focus({ preventScroll: true });
        box.querySelectorAll("button.mc-go,input,.mc-obj").forEach(x => x.disabled = true);
      } else {
        M.tries++; M.streak = 0; sim.saveState(); shake(box);
        sim.recordTrial({ station: L("3 Magnify", "3 Aumento"), step: `${L("Order", "Pedido")} ${M.i + 1}: ${row.eyepiece} × ${row.objective} → ${row.answer}`, objective: row.objective, magnification: "×" + od.e * od.o, sharpness: "—",  result: L("Not yet", "Aún no") });
        fb.innerHTML = `<div class="mc-bad">${M.tries >= 2 ? (od.k === "calc" ? L(`Work it out: ${od.e} × ${od.o}.`, `Calcúlalo: ${od.e} × ${od.o}.`) : L(`Divide the total by the eyepiece: ${od.T} ÷ ${od.e}.`, `Divide el total entre el ocular: ${od.T} ÷ ${od.e}.`)) : (od.k === "calc" ? L("Not yet. The two lenses MULTIPLY — they don't add.", "Aún no. Las dos lentes se MULTIPLICAN, no se suman.") : L("Not yet. Overall = eyepiece × objective, so work backwards.", "Aún no. Total = ocular × objetivo, así que trabaja al revés."))}</div>`;
      }
    };
    if (od.k === "calc") {
      const inp = box.querySelector(".mc-num"); inp.focus({ preventScroll: true });
      const go = () => { if (inp.value === "") { shake(inp); return; } submit(+inp.value); };
      box.querySelector(".mc-go").addEventListener("click", go); inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    } else box.querySelectorAll(".mc-obj").forEach(b => b.addEventListener("click", () => { view.set({ obj: +b.dataset.x }); mt.textContent = `×${od.e} × ×${b.dataset.x}`; submit(+b.dataset.x); }));
  }
  render();
}

/* =========================================================================================
   STATION 4 - MAKE & OBSERVE THE ONION SLIDE (the practical), then label and compare
   ========================================================================================= */
export function buildSlideLab(host, sim, onDone) {
  const P = (sim.state.prep = sim.state.prep || { step: 0, bubbles: 0, water: 0, obs: 0, labels: {}, mag: null, cell: null });
  const wrap = $(`<section class="mc-st mc-st--prep" aria-labelledby="mc-s4">
    <h3 class="mc-h" id="mc-s4">${L("Station 4 · Make & Observe the Onion Slide", "Estación 4 · Prepara y observa la cebolla")}</h3>
    <ol class="mc-steps6"></ol><div class="mc-prep"></div><p class="mc-credit"></p></section>`);
  host.append(wrap);
  wrap.querySelector(".mc-credit").innerHTML = creditLine(["onion-cut", "onion-nuc", "onion-high", "cheek"]);
  const stepsEl = wrap.querySelector(".mc-steps6"), area = wrap.querySelector(".mc-prep");
  const NAMES = [L("Cut", "Cortar"), L("Peel", "Pelar"), L("Water", "Agua"), L("Iodine", "Yodo"), L("Cover slip", "Cubreobjetos"), L("Observe", "Observar")];
  function stepsPaint() { stepsEl.innerHTML = NAMES.map((n, i) => `<li class="${i < P.step ? "done" : i === P.step ? "now" : ""}">${i + 1}. ${n}</li>`).join(""); }
  const next = () => { P.step++; sim.saveState(); render(); };
  const slideSVG = (o = {}) => `<svg viewBox="0 0 300 130" class="mc-slidesvg" role="img" aria-label="${L("Microscope slide", "Preparación de microscopio")}">
    <rect x="10" y="40" width="280" height="56" rx="6" fill="#dff2f7" stroke="#8fb9c7" stroke-width="2"/>
    ${o.water ? `<ellipse cx="150" cy="68" rx="${30 + o.water * 14}" ry="${16 + o.water * 4}" fill="#8fd4ee" opacity=".7"/>` : ""}
    ${o.peel ? `<path d="M118 64 Q130 52 160 56 Q184 62 178 78 Q160 90 130 84 Q112 78 118 64Z" fill="${o.iodine ? "#c9a24a" : "#e6c9dc"}" opacity=".9"/>` : ""}
    ${o.cover ? `<g transform="rotate(${-o.angle} 100 78)"><rect x="100" y="${o.angle > 1 ? 70 : 52}" width="100" height="${o.angle > 1 ? 8 : 52}" rx="2" fill="#bfe3f2" opacity=".55" stroke="#6aa" /></g>` : ""}
    ${Array.from({ length: o.bubbles || 0 }, (_, k) => `<circle cx="${128 + k * 18}" cy="${62 + (k % 2) * 14}" r="${5 + (k % 3)}" fill="#fff" stroke="#9cc" opacity=".95"/>`).join("")}</svg>`;

  function render() {
    stepsPaint();
    const s = P.step;
    if (s === 0) {
      area.innerHTML = `<p class="mc-big">${L("1 · Cut a small piece of onion.", "1 · Corta un trozo pequeño de cebolla.")}</p><p class="q__hint">${L("Drag the knife across the onion — or press the Cut button.", "Arrastra el cuchillo por la cebolla o pulsa el botón Cortar.")}</p>
        <div class="mc-onion"><img src="${img("onion-cut")}" alt="${L("A real red onion, cut in half", "Una cebolla roja real, cortada por la mitad")}"><div class="mc-knife" aria-hidden="true">🔪</div><div class="mc-cutline"></div></div>
        <button type="button" class="btn btn--signal mc-cut">${L("Cut ✂", "Cortar ✂")}</button>`;
      const on = area.querySelector(".mc-onion"), line = on.querySelector(".mc-cutline"), kn = on.querySelector(".mc-knife");
      let done = false;
      const cut = () => { if (done) return; done = true; line.classList.add("go"); burstAt(on, "#e0a0c8", 16); floatText(on, "+5"); ok(sim, 5); setTimeout(next, 900); };
      area.querySelector(".mc-cut").addEventListener("click", cut);
      let sx = null; on.addEventListener("pointerdown", e => { sx = e.clientX; on.setPointerCapture?.(e.pointerId); });
      on.addEventListener("pointermove", e => { if (sx == null) return; const r = on.getBoundingClientRect(); kn.style.left = (e.clientX - r.left) + "px"; if (Math.abs(e.clientX - sx) > r.width * 0.45) { sx = null; cut(); } });
      on.addEventListener("pointerup", () => { sx = null; });
    } else if (s === 1) {
      area.innerHTML = `<p class="mc-big">${L("2 · Use forceps to peel the thin inner skin (epidermis) off the onion.", "2 · Con las pinzas, pela la piel fina interior (epidermis) de la cebolla.")}</p><p class="q__hint">${L("HOLD the button and peel slowly and steadily. Let go too early and the skin tears — just try again.", "MANTÉN pulsado el botón y pela despacio y con pulso firme. Si sueltas antes de tiempo, la piel se rompe: vuelve a intentarlo.")}</p>
        <div class="mc-peel"><div class="mc-peelbar"><i></i></div><div class="mc-peelmsg" role="status"></div></div>
        <button type="button" class="btn btn--signal mc-hold">${L("Hold to peel 🤏", "Mantén para pelar 🤏")}</button> <button type="button" class="btn btn--ghost mc-auto">${L("Peel for me (no holding)", "Pelar por mí (sin mantener)")}</button>`;
      const bar = area.querySelector(".mc-peelbar i"), m = area.querySelector(".mc-peelmsg"), hold = area.querySelector(".mc-hold");
      let v = 0, tm = null, fin = false;
      const stop = () => { clearInterval(tm); tm = null; };
      const finish = () => { if (fin) return; fin = true; stop(); bar.style.width = "100%"; m.textContent = L("A clean, thin layer — one cell thick!", "¡Una capa limpia y fina, de una sola célula de grosor!"); burstAt(bar, "#2fbf71", 16); ok(sim, 8); setTimeout(next, 900); };
      const begin = () => { if (fin || tm) return; tm = setInterval(() => { v += 2.2; bar.style.width = Math.min(100, v) + "%"; if (v >= 100) finish(); }, 50); };
      const release = () => { if (fin || !tm) return; stop(); if (v < 100) { v = 0; bar.style.width = "0"; m.textContent = L("Torn! Peel slowly and keep holding. Try again.", "¡Se rompió! Pela despacio y sigue manteniendo. Inténtalo de nuevo."); shake(bar.parentElement); } };
      hold.addEventListener("pointerdown", e => { e.preventDefault(); hold.setPointerCapture?.(e.pointerId); begin(); });
      hold.addEventListener("pointerup", release); hold.addEventListener("pointercancel", release); hold.addEventListener("pointerleave", release);
      hold.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); begin(); } });
      hold.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") release(); });
      area.querySelector(".mc-auto").addEventListener("click", () => { v = 0; fin = false; stop(); let t = setInterval(() => { v += 5; bar.style.width = v + "%"; if (v >= 100) { clearInterval(t); finish(); } }, 40); });
    } else if (s === 2) {
      area.innerHTML = `<p class="mc-big">${L("3 · Put the peel on the slide and add TWO drops of water.", "3 · Pon la piel en el portaobjetos y añade DOS gotas de agua.")}</p><div class="mc-slidewrap">${slideSVG({ water: P.water, peel: P.water > 0 })}</div>
        <button type="button" class="btn btn--signal mc-drop">${L("Add a drop of water 💧", "Añadir una gota de agua 💧")}</button> <span class="mc-dropcount">${P.water} / 2</span><div class="mc-fb" role="status"></div>`;
      area.querySelector(".mc-drop").addEventListener("click", e => {
        const btn = e.currentTarget; P.water++; burstAt(btn, "#6fd6ff", 8);
        if (P.water === 2) { sim.saveState(); area.querySelector(".mc-slidewrap").innerHTML = slideSVG({ water: 2, peel: true }); area.querySelector(".mc-dropcount").textContent = "2 / 2"; area.querySelector(".mc-fb").innerHTML = `<div class="mc-good">${L("Two drops — just right.", "Dos gotas: justo lo necesario.")}</div>`; ok(sim, 5); const nx = $(`<button type="button" class="btn btn--signal">${L("Next ▶", "Siguiente ▶")}</button>`); nx.addEventListener("click", next); area.querySelector(".mc-fb").append(" ", nx); }
        else if (P.water > 2) { P.water = 0; sim.saveState(); area.querySelector(".mc-fb").innerHTML = `<div class="mc-bad">${L("Too much water — the cover slip would float away. Slide wiped; start the drops again.", "Demasiada agua: el cubreobjetos flotaría. Se limpió el portaobjetos; empieza de nuevo.")}</div>`; shake(area.querySelector(".mc-slidewrap")); area.querySelector(".mc-slidewrap").innerHTML = slideSVG({}); area.querySelector(".mc-dropcount").textContent = "0 / 2"; }
        else { area.querySelector(".mc-slidewrap").innerHTML = slideSVG({ water: P.water, peel: true }); area.querySelector(".mc-dropcount").textContent = P.water + " / 2"; }
      });
    } else if (s === 3) {
      area.innerHTML = `<p class="mc-big">${L("4 · Add one drop of iodine to stain the onion.", "4 · Añade una gota de yodo para teñir la cebolla.")}</p><div class="mc-slidewrap">${slideSVG({ water: 2, peel: true })}</div>
        <button type="button" class="btn btn--signal mc-iod">${L("Add one drop of iodine 🟤", "Añadir una gota de yodo 🟤")}</button><div class="mc-fb" role="status"></div>`;
      area.querySelector(".mc-iod").addEventListener("click", e => {
        area.querySelector(".mc-slidewrap").innerHTML = slideSVG({ water: 2, peel: true, iodine: true }); burstAt(e.currentTarget, "#c9a24a", 12); e.currentTarget.disabled = true; ok(sim, 5);
        area.querySelector(".mc-fb").innerHTML = `<div class="mc-good">${L("Iodine stains the cell parts so you can see them: it turns the nucleus and cytoplasm yellow-brown.", "El yodo tiñe las partes de la célula para que se vean: pone el núcleo y el citoplasma de color amarillo-marrón.")}</div>`; setTimeout(next, 1400);
      });
    } else if (s === 4) {
      area.innerHTML = `<p class="mc-big">${L("5 · Lower the cover slip slowly, at an angle, with a mounted needle.", "5 · Baja el cubreobjetos despacio, inclinado, con una aguja enmangada.")}</p><p class="q__hint">${L("Slide from 70° down to 0°. Go too fast and air bubbles get trapped (they look like dark rings and spoil the view).", "Mueve de 70° hasta 0°. Si vas muy rápido se atrapan burbujas de aire (parecen anillos oscuros y estropean la vista).")}</p>
        <div class="mc-slidewrap"></div><label class="mc-row"><span>${L("Cover slip angle", "Ángulo del cubreobjetos")}</span><input type="range" class="mc-ang" min="0" max="70" value="70"><output>70°</output></label><div class="mc-fb" role="status"></div>`;
      const sw = area.querySelector(".mc-slidewrap"), ang = area.querySelector(".mc-ang"), out = area.querySelector("output");
      let bub = 0, last = ang.value, lt = performance.now(), finished = false;
      const draw = () => { sw.innerHTML = slideSVG({ water: 2, peel: true, iodine: true, cover: true, angle: +ang.value, bubbles: bub }); out.textContent = ang.value + "°"; };
      draw();
      ang.addEventListener("input", () => {
        const now = performance.now(), dv = last - ang.value, dt = Math.max(16, now - lt); last = ang.value; lt = now;
        if (dv / dt * 1000 > 130 && !finished) { bub = Math.min(4, bub + 1); shake(sw); }
        draw();
        if (+ang.value === 0 && !finished) {
          finished = true; P.bubbles = bub; ang.disabled = true; sim.saveState(); ok(sim, bub === 0 ? 12 : 6);
          sim.recordTrial({ station: L("4 Slide", "4 Preparación"), step: L("Cover slip lowered", "Cubreobjetos colocado"), result: bub === 0 ? L("0 air bubbles — perfect", "0 burbujas: perfecto") : L(`${bub} air bubble(s) trapped`, `${bub} burbuja(s) de aire atrapada(s)`) });
          const fb = area.querySelector(".mc-fb"); burstAt(sw, "#2fbf71", 14);
          fb.innerHTML = bub === 0 ? `<div class="mc-good">${L("Perfect — no bubbles! Slow and angled is the secret.", "¡Perfecto, sin burbujas! El secreto es ir despacio e inclinado.")}</div>` : `<div class="mc-bad">${L(`${bub} bubble(s) got trapped. It still works — next time lower it more slowly.`, `Se atraparon ${bub} burbuja(s). Aún sirve; la próxima vez bájalo más despacio.`)}</div>`;
          const nx = $(`<button type="button" class="btn btn--signal">${L("Put it on the microscope ▶", "Ponerla en el microscopio ▶")}</button>`); nx.addEventListener("click", next); fb.append(" ", nx);
          const rd = $(`<button type="button" class="btn btn--ghost">${L("Redo this step", "Repetir este paso")}</button>`); rd.addEventListener("click", render); fb.append(" ", rd);
        }
      });
    } else if (s === 5) observe();
  }

  function observe() {
    area.innerHTML = `<p class="mc-big">${L("6 · Observe your slide, then label what you see.", "6 · Observa tu preparación y etiqueta lo que ves.")}</p>
      <div class="mc-obs"><div class="mc-eye"><canvas width="300" height="300" role="img" aria-label="${L("Onion cells through the eyepiece", "Células de cebolla por el ocular")}"></canvas><div class="mc-eye__hud"><span class="mc-tot"></span></div></div>
        <div><p class="q__hint">${L("Eyepiece ×10. Choose the objective (the slide is already focused for you):", "Ocular ×10. Elige el objetivo (la preparación ya está enfocada):")}</p><div class="mc-objs"></div><p class="mc-seen" role="status"></p></div></div>
      <div class="mc-label"></div>`;
    const cv = area.querySelector("canvas"), view = makeView(cv, { slide: "onion", obj: 4, blur: 0, light: 1 }); view.resize(300);
    const tot = area.querySelector(".mc-tot"), seen = area.querySelector(".mc-seen"), row = area.querySelector(".mc-objs");
    const view_ = x => { view.set({ obj: x }); tot.textContent = `×10 × ×${x} = ×${10 * x}`; };
    [4, 10, 40].forEach(x => { const b = $(`<button type="button" class="mc-obj" data-x="${x}">${objSVG(x, 44)}<span>×${x}</span></button>`);
      b.addEventListener("click", () => { view_(x); P.seenObj = P.seenObj || {}; if (!P.seenObj[x]) { P.seenObj[x] = 1; sim.saveState(); ok(sim, 3); sim.recordTrial({ station: L("4 Slide", "4 Preparación"), step: L("Looked at the onion", "Miró la cebolla"), objective: "×" + x, magnification: "×" + 10 * x, result: x === 4 ? L("Many small cells, edges hard to see", "Muchas células pequeñas") : x === 10 ? L("Cell walls and shape clear", "Paredes y forma claras") : L("Nucleus and cytoplasm clear", "Núcleo y citoplasma claros") }); }
        seen.textContent = x === 4 ? L("×4: lots of cells in view, but they look small.", "×4: se ven muchas células, pero pequeñas.") : x === 10 ? L("×10: you can now see the shape of each cell and its wall.", "×10: ya se ve la forma de cada célula y su pared.") : L("×40: fewer cells but much bigger — the round nucleus is easy to spot.", "×40: menos células pero mucho más grandes: el núcleo redondo se ve bien."); burstAt(b, objCol(x), 8); });
      row.append(b); });
    view_(4);
    labelTask();
  }

  function labelTask() {
    const box = area.querySelector(".mc-label");
    const PINS = [{ id: "wall", x: 0.30, y: 0.50, name: () => L("Cell wall", "Pared celular") }, { id: "nucleus", x: 0.20, y: 0.62, name: () => L("Nucleus", "Núcleo") }, { id: "cyto", x: 0.40, y: 0.30, name: () => L("Cytoplasm", "Citoplasma") }];
    // pins are placed on the real high-power photo; positions checked by overlay (see photos/credits)
    PINS[0].x = 0.395; PINS[0].y = 0.37; PINS[1].x = 0.20; PINS[1].y = 0.64; PINS[2].x = 0.47; PINS[2].y = 0.28;
    box.innerHTML = `<h4 class="mc-h2">${L("Draw & label — tap each pin and pick the right name", "Dibuja y etiqueta: toca cada punto y elige el nombre")}</h4>
      <div class="mc-photo mc-photo--w"><img src="${img("onion-nuc")}" alt="${L("Onion epidermis cells at high power: dark wall lines, a round nucleus and grainy cytoplasm", "Células de epidermis de cebolla a gran aumento: líneas oscuras de pared, un núcleo redondo y citoplasma granuloso")}"><div class="mc-pins"></div></div>
      <div class="mc-pop" hidden></div><div class="mc-fb" role="status"></div>`;
    const pins = box.querySelector(".mc-pins"), pop = box.querySelector(".mc-pop"), fb = box.querySelector(".mc-fb");
    const names = shuffle(PINS.map(p => ({ id: p.id, t: p.name() })));
    PINS.forEach((p, n) => {
      const b = $(`<button type="button" class="mc-pin" style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${L("Label", "Etiqueta")} ${n + 1}">${n + 1}</button>`);
      if (P.labels[p.id]) { b.dataset.state = "ok"; b.textContent = "✓"; }
      b.addEventListener("click", () => {
        if (P.labels[p.id]) return;
        pop.hidden = false; pop.innerHTML = `<p>${L("Pin", "Punto")} ${n + 1}: ${L("what is this part?", "¿qué parte es?")}</p><div class="mc-opts"></div>`;
        const o = pop.querySelector(".mc-opts");
        names.forEach(nm => { const c = $(`<button type="button" class="mc-opt">${nm.t}</button>`);
          c.addEventListener("click", () => {
            if (nm.id === p.id) { P.labels[p.id] = 1; b.dataset.state = "ok"; b.textContent = "✓"; burstAt(b, "#2fbf71", 16); floatText(b, "+8"); ok(sim, 8); pop.hidden = true; sim.saveState();
              sim.recordTrial({ station: L("4 Slide", "4 Preparación"), step: L("Label", "Etiqueta") + ": " + p.name(), result: L("Correct", "Correcta") });
              fb.innerHTML = `<div class="mc-good">${p.id === "wall" ? L("The cell wall: a strong outer layer of cellulose that supports the cell and gives a regular shape — only plant cells have one.", "La pared celular: una capa externa de celulosa que sostiene la célula y le da forma regular; solo las células vegetales la tienen.") : p.id === "nucleus" ? L("The nucleus controls the cell's activities and holds its DNA — the iodine stained it darker.", "El núcleo controla las actividades de la célula y guarda su ADN; el yodo lo tiñó más oscuro.") : L("The cytoplasm: the jelly-like fill where the cell's chemical reactions happen.", "El citoplasma: el relleno gelatinoso donde ocurren las reacciones químicas de la célula.")}</div>`;
              if (PINS.every(x => P.labels[x.id])) after();
            } else { c.classList.add("bad"); shake(c); shake(b); fb.innerHTML = `<div class="mc-bad">${L("Not that one — look at its shape and position again.", "Esa no: mira otra vez su forma y su posición.")}</div>`; }
          }); o.append(c); });
      });
      pins.append(b);
    });
    if (PINS.every(x => P.labels[x.id])) after();
  }

  function after() {
    const box = area.querySelector(".mc-label"); if (box.querySelector(".mc-after")) return;
    const sec = $(`<div class="mc-after"></div>`); box.append(sec);
    const magQ = () => {
      sec.innerHTML = `<h4 class="mc-h2">${L("Calculate the total magnification of your drawing", "Calcula el aumento total de tu dibujo")}</h4><p>${L("You used the ×10 eyepiece and the ×40 objective. Overall magnification = ?", "Usaste el ocular ×10 y el objetivo ×40. Aumento total = ?")}</p>
        <div class="mc-answer"><span>×</span><input class="input mc-num" type="number" aria-label="${L("Overall magnification", "Aumento total")}"><button type="button" class="btn btn--signal mc-go">${L("Check", "Comprobar")}</button></div><div class="mc-fb" role="status"></div>`;
      if (P.mag) { sec.querySelector(".mc-fb").innerHTML = `<div class="mc-good">×400 ✔</div>`; sec.querySelector(".mc-num").value = 400; sec.querySelector(".mc-num").disabled = true; return cellQ(); }
      sec.querySelector(".mc-go").addEventListener("click", () => {
        const v = +sec.querySelector(".mc-num").value, fb = sec.querySelector(".mc-fb");
        if (v === 400) { P.mag = 1; sim.saveState(); ok(sim, 10); burstAt(fb, "#2fbf71", 18); fb.innerHTML = `<div class="mc-good">${L("×10 × ×40 = ×400. Write this next to your drawing!", "×10 × ×40 = ×400. ¡Anótalo junto a tu dibujo!")}</div>`; sim.recordTrial({ station: L("4 Slide", "4 Preparación"), step: L("Drawing magnification", "Aumento del dibujo"), eyepiece: "×10", objective: "×40", answer: "×400", correct: "×400", result: L("Correct", "Correcta") }); cellQ(); }
        else { shake(fb); fb.innerHTML = `<div class="mc-bad">${L("Multiply the eyepiece by the objective.", "Multiplica el ocular por el objetivo.")}</div>`; sim.recordTrial({ station: L("4 Slide", "4 Preparación"), step: L("Drawing magnification", "Aumento del dibujo"), eyepiece: "×10", objective: "×40", answer: "×" + v, correct: "×400", result: L("Not yet", "Aún no") }); }
      });
    };
    const cellQ = () => {
      if (sec.querySelector(".mc-cell")) return;
      const c = $(`<div class="mc-cell"><h4 class="mc-h2">${L("Cell detective: which of these is the PLANT cell?", "Detective celular: ¿cuál es la célula VEGETAL?")}</h4>
        <div class="mc-two"><button type="button" class="mc-card" data-id="onion"><img src="${img("onion-high")}" alt="${L("Micrograph A: box-shaped cells with thick dark outlines", "Microfotografía A: células en forma de caja con contornos oscuros gruesos")}"><span>A</span></button>
        <button type="button" class="mc-card" data-id="cheek"><img src="${img("cheek")}" alt="${L("Micrograph B: blue, irregular cells with no thick outline", "Microfotografía B: células azules e irregulares sin contorno grueso")}"><span>B</span></button></div><div class="mc-fb" role="status"></div></div>`);
      sec.append(c); const fb = c.querySelector(".mc-fb");
      const doneC = () => { fb.innerHTML = `<div class="mc-good">${L("A is the onion (plant) — a fixed, regular shape with a thick cell wall. B is a human cheek cell (animal) — no cell wall, so it is irregular. Plant cells have a cell wall; animal cells don't.", "A es la cebolla (vegetal): forma fija y regular con pared celular gruesa. B es una célula de la mejilla (animal): sin pared celular, así que es irregular. Las células vegetales tienen pared; las animales no.")}</div>`; c.querySelectorAll(".mc-card").forEach(x => x.disabled = true); finish(); };
      if (P.cell) { doneC(); return; }
      c.querySelectorAll(".mc-card").forEach(b => b.addEventListener("click", () => {
        if (b.dataset.id === "onion") { P.cell = 1; sim.saveState(); ok(sim, 10); burstAt(b, "#2fbf71", 18); sim.recordTrial({ station: L("4 Slide", "4 Preparación"), step: L("Plant vs animal cell", "Célula vegetal o animal"), result: L("Correct: A (onion) has the cell wall", "Correcta: A (cebolla) tiene pared celular") }); doneC(); }
        else { shake(b); fb.innerHTML = `<div class="mc-bad">${L("Look for the thick, regular outline that a cell wall makes.", "Busca el contorno grueso y regular que forma una pared celular.")}</div>`; }
      }));
    };
    magQ();
    function finish() { if (!sim.state.prepDone) { sim.state.prepDone = true; sim.saveState(); } onDone(); }
  }
  render();
}
