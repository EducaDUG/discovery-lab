/* BONUS ROUND - "Focus Frenzy": a precision-instrument challenge (CLAUDE.md §4 Bonus Game Mechanic Library).
   A blurry REAL micrograph fills the eyepiece. Turn the fine-focus dial (drag, slider, or arrow keys) until it is
   sharp, lock it, then pick the overall magnification for that lens pair - quiz-in-the-action, answered in place.
   ~2 minutes of wall-clock play (setInterval, never rAF), no lives, no marks, silent (no audio so no mute needed),
   wrong answers name the right one with a memory hook. Rounds cycle through the real onion and cheek photos. */
import { L, reduced } from "./data.js?v=1";
import { makeView } from "./view.js?v=2";
import { burstAt, shake, floatText } from "./fx.js?v=1";

const DURATION = 120;
const HOOK = () => L("Overall = eyepiece × objective", "Total = ocular × objetivo");

export function mountFocusLaunch(host, sim) {
  host.innerHTML = `<div class="mc-launch"><div class="mc-launch__art" aria-hidden="true"></div><div>
    <p class="mc-launch__title">${L("Bonus round — Focus Frenzy", "Ronda bonus — Frenesí de enfoque")}</p>
    <p class="q__hint" style="margin:.2em 0 .6em">${L("Two minutes on the eyepiece. Turn the dial until the real micrograph is razor sharp, lock it, then name the magnification. No lives, no marks — just your best score. Silent game.", "Dos minutos ante el ocular. Gira el dial hasta que la microfotografía real quede nítida, bloquéala y di el aumento. Sin vidas ni notas: solo tu mejor puntuación. Juego sin sonido.")}</p>
    <div class="cluster"><button type="button" class="btn btn--signal mc-play">${L("Play ▶", "Jugar ▶")}</button>
    <button type="button" class="btn btn--ghost mc-skip">${L("Skip bonus round", "Saltar ronda bonus")}</button></div></div></div>`;
  host.querySelector(".mc-play").addEventListener("click", () => mount(host, sim));
  host.querySelector(".mc-skip").addEventListener("click", () => {
    host.innerHTML = `<p class="q__hint">${L("Bonus skipped — you can come back to it any time.", "Ronda saltada: puedes volver cuando quieras.")} <button type="button" class="btn btn--ghost mc-back">${L("Show it again", "Mostrarla otra vez")}</button></p>`;
    host.querySelector(".mc-back").addEventListener("click", () => mountFocusLaunch(host, sim));
  });
}

function mount(host, sim) {
  host.innerHTML = `<div class="mc-ff"><div class="mc-ff__hud"><span class="mc-ff__time">2:00</span><span class="mc-ff__score">0</span><span class="mc-ff__streak"></span></div>
    <div class="mc-ff__body"><div class="mc-eye mc-eye--ff"><canvas width="320" height="320" role="img" aria-label="${L("Blurry micrograph in the eyepiece", "Microfotografía borrosa en el ocular")}"></canvas><div class="mc-eye__hud"><span class="mc-ff__lens"></span><span class="mc-ff__sharp"></span></div></div>
      <div class="mc-ff__ctl"><p class="mc-ff__prompt" aria-live="polite"></p>
        <label class="mc-row"><span>${L("Fine focus dial", "Dial micrométrico")}</span><input type="range" class="mc-ff__dial" min="-100" max="100" value="0" aria-describedby="mc-ff-help"></label>
        <p id="mc-ff-help" class="q__hint">${L("Drag the dial, or use ← → keys. Press Space or Lock when it looks sharp.", "Arrastra el dial o usa las teclas ← →. Pulsa Espacio o Bloquear cuando se vea nítida.")}</p>
        <button type="button" class="btn btn--signal mc-ff__lock">${L("Lock focus 🔒", "Bloquear enfoque 🔒")}</button>
        <div class="mc-ff__ans" hidden></div><div class="mc-ff__fb" role="status" aria-live="assertive"></div></div></div></div>`;
  const q = s => host.querySelector(s);
  const cv = q("canvas"), view = makeView(cv, { slide: "onion", obj: 4, blur: 14, light: 1 }); view.resize(320);
  const dial = q(".mc-ff__dial"), lock = q(".mc-ff__lock"), ans = q(".mc-ff__ans"), fb = q(".mc-ff__fb");
  let score = 0, streak = 0, best = 0, right = 0, rounds = 0, target = 0, cur = null, phase = "focus", t0 = performance.now(), roundT = performance.now(), end = false;
  const ES = [5, 10, 15], OS = [4, 10, 40];

  const blurOf = () => Math.abs(+dial.value - target) / 6;
  function paint() {
    const b = blurOf(); view.set({ blur: Math.min(16, b) });
    const sp = Math.round(Math.max(0, 1 - b / 9) * 100); const el = q(".mc-ff__sharp"); el.textContent = `${L("Sharpness", "Nitidez")} ${sp}%`; el.dataset.v = sp >= 92 ? "hi" : sp >= 50 ? "mid" : "lo";
  }
  function newRound() {
    rounds++; phase = "focus"; roundT = performance.now();
    cur = { e: ES[(Math.random() * 3) | 0], o: OS[(Math.random() * 3) | 0], slide: Math.random() < 0.7 ? "onion" : "cheek" };
    target = (Math.random() * 120 - 60) | 0; dial.value = Math.random() < 0.5 ? -90 : 90; dial.disabled = false;
    if (Math.abs(+dial.value - target) < 40) dial.value = target > 0 ? -90 : 90;
    view.set({ slide: cur.slide, obj: cur.o });
    q(".mc-ff__lens").textContent = `×${cur.e} ${L("eyepiece", "ocular")} · ×${cur.o} ${L("objective", "objetivo")}`;
    q(".mc-ff__prompt").textContent = L("Sharpen the picture, then lock it.", "Enfoca la imagen y luego bloquéala.");
    ans.hidden = true; ans.innerHTML = ""; lock.hidden = false; fb.innerHTML = ""; paint();
  }
  function tryLock() {
    if (end || phase !== "focus") return;
    const b = blurOf();
    if (b > 1.1) { shake(cv.parentElement); fb.innerHTML = `<span class="mc-bad">${L("Still blurry — keep turning the dial.", "Aún borroso: sigue girando el dial.")}</span>`; return; }
    phase = "ask"; dial.disabled = true; lock.hidden = true;
    const secs = (performance.now() - roundT) / 1000, sharp = Math.max(0, 1 - b / 1.1), pts = Math.round(40 + sharp * 40 + Math.max(0, 20 - secs));
    score += pts; floatText(cv, "+" + pts, "#7dffb4"); burstAt(cv.parentElement, "#7dffb4", 16);
    const T = cur.e * cur.o; const wrong = new Set(); [cur.e + cur.o, T * 2, Math.round(T / 2), T + cur.e * 2, T * 10].forEach(x => { if (x !== T && x > 0) wrong.add(x); });
    const opts = [T, ...[...wrong].sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5);
    q(".mc-ff__prompt").textContent = L("Sharp! What is the overall magnification?", "¡Nítido! ¿Cuál es el aumento total?");
    ans.hidden = false; ans.innerHTML = opts.map((v, i) => `<button type="button" class="btn mc-ff__opt" data-v="${v}">${i + 1} · ×${v}</button>`).join("");
    ans.querySelectorAll("button").forEach(bn => bn.addEventListener("click", () => answer(+bn.dataset.v, bn)));
    ans.querySelector("button").focus({ preventScroll: true });
    paintHud();
  }
  function answer(v, bn) {
    if (phase !== "ask") return; phase = "done"; const T = cur.e * cur.o;
    if (v === T) { streak++; best = Math.max(best, streak); right++; const bonus = Math.min(streak, 5) * 10; score += 50 + bonus; floatText(bn, "+" + (50 + bonus), "#7dffb4"); burstAt(bn, "#2fbf71", 18); bn.classList.add("good"); fb.innerHTML = `<span class="mc-good">${L(`Correct! ×${cur.e} × ×${cur.o} = ×${T}`, `¡Correcto! ×${cur.e} × ×${cur.o} = ×${T}`)}</span>`; }
    else { streak = 0; bn.classList.add("bad"); shake(bn); fb.innerHTML = `<span class="mc-bad">${L(`The answer is ×${T}: ${cur.e} × ${cur.o}. Memory hook: ${HOOK()}.`, `La respuesta es ×${T}: ${cur.e} × ${cur.o}. Truco: ${HOOK()}.`)}</span>`; }
    ans.querySelectorAll("button").forEach(x => x.disabled = true); paintHud();
    setTimeout(() => { if (!end) newRound(); }, 1300);
  }
  function paintHud() { q(".mc-ff__score").textContent = score; q(".mc-ff__streak").textContent = streak > 1 ? `🔥 ×${streak}` : ""; }
  dial.addEventListener("input", paint);
  lock.addEventListener("click", tryLock);
  host.addEventListener("keydown", e => {
    if (end) return;
    if (e.key === " " && phase === "focus" && e.target !== lock) { e.preventDefault(); tryLock(); }
    if (phase === "ask" && /^[1-3]$/.test(e.key)) { const b = ans.querySelectorAll("button")[+e.key - 1]; b && b.click(); }
  });
  const clock = setInterval(() => {
    if (!host.isConnected) { clearInterval(clock); return; }
    const left = Math.max(0, DURATION - (performance.now() - t0) / 1000); const m = Math.floor(left / 60), s = Math.floor(left % 60);
    q(".mc-ff__time").textContent = `${m}:${String(s).padStart(2, "0")}`;
    // gentle hint after a few seconds of struggling, never a penalty
    if (phase === "focus" && (performance.now() - roundT) / 1000 > 7) { const d = target - +dial.value; fb.innerHTML = `<span class="q__hint">${d > 0 ? L("Hint: turn the dial → (right)", "Pista: gira el dial → (derecha)") : L("Hint: turn the dial ← (left)", "Pista: gira el dial ← (izquierda)")}</span>`; }
    if (left <= 0) finish();
  }, 250);
  function finish() {
    if (end) return; end = true; clearInterval(clock);
    const acc = rounds ? Math.round((right / Math.max(1, right + (rounds - right))) * 100) : 0;
    host.innerHTML = `<div class="mc-ff mc-ff--end"><p class="mc-launch__title">${L("Time! Well focused.", "¡Tiempo! Buen enfoque.")}</p>
      <div class="mc-done__stats"><span>${L("Score", "Puntos")}: <b>${score}</b></span><span>${L("Magnifications right", "Aumentos acertados")}: <b>${right}</b></span><span>${L("Best streak", "Mejor racha")}: <b>${best}</b></span></div>
      <p class="q__hint">${L("Remember: overall magnification = eyepiece × objective, and at high power only the FINE knob.", "Recuerda: aumento total = ocular × objetivo, y con aumento alto solo el micrométrico.")}</p>
      <div class="cluster"><button type="button" class="btn btn--signal mc-again">${L("Play again", "Jugar otra vez")}</button></div></div>`;
    host.querySelector(".mc-again").addEventListener("click", () => mountFocusLaunch(host, sim));
  }
  newRound();
}
