/* Bonus game for the Exam 1 revision website: "Lab Bench Rush" (sorting conveyor, local to this page).
   Real photos ride a belt; the student diverts each situation to the right separation method.
   - The 2-minute round is time-boxed on setInterval wall-clock time; requestAnimationFrame only draws the belt.
   - No lives and no fail state: a wrong or late answer resets the streak and names the right method plus a memory hook.
   - Bins are real <button>s (keys 1-6 mirror them). Reduced-motion aware. Has its own always-visible mute button. */
import { ttsEnabled, setTTS } from "../../../../../../engine/accessibility.js?v=6";
import { T } from "../../../../../../engine/revision-kit.js?v=12";

const BINS = [
  { id: "filt", label: "Filtration", color: "#2f7dd1" },
  { id: "evap", label: "Evaporation", color: "#c9791b" },
  { id: "dist", label: "Distillation", color: "#12998a" },
  { id: "sieve", label: "Sieving", color: "#8a4fc0" },
  { id: "mag", label: "Magnet", color: "#c43a52" },
  { id: "chrom", label: "Chromatography", color: "#d6477f" }
];
const NAME = Object.fromEntries(BINS.map(b => [b.id, b.label]));
const ITEMS = [
  ["mud", "Soil bits floating in muddy water", "filt", "Undissolved solid + liquid: the paper holds the solid back."],
  ["mud", "Clear the grit out of a pond sample", "filt", "Insoluble solid in a liquid means filtration."],
  ["salt", "Get the salt back from salt water", "evap", "Heat the water away and the solute is left behind."],
  ["salt", "Salt crystals appear as the sun dries the pond", "evap", "The solvent is lost as vapour and the solute stays."],
  ["distil", "Make pure water from sea water", "dist", "Heat, then cool the vapour: you collect the solvent."],
  ["distil", "Astronauts recycle urine into drinking water", "dist", "Distillation keeps the water as well as separating it."],
  ["distil", "You want to keep BOTH the water and the solute", "dist", "Only distillation recovers both parts."],
  ["sieve", "Lumpy flour: big pieces from small", "sieve", "A sieve lets small pieces through and holds large ones back."],
  ["sieve", "Large stones mixed with fine sand", "sieve", "Different sizes of solid: sieve them."],
  ["magnet", "Iron filings mixed into sand", "mag", "Iron is magnetic and sand is not."],
  ["magnet", "Steel pins mixed with sugar", "mag", "Magnetic material is pulled out by a magnet."],
  ["chroma", "Which dyes make up black ink?", "chrom", "Different dyes have different solubility, so they separate on paper."],
  ["chroma", "Forensic team compares two pen inks", "chrom", "A chromatogram shows which dyes are in each ink."],
  ["chroma", "Is there an illegal dye in this sweet?", "chrom", "Chromatography separates mixtures of coloured substances."]
].map(r => ({ img: "photos/" + r[0] + ".jpg", text: r[1], bin: r[2], hook: r[3] }));

BINS.forEach(b => T(b.label)); ITEMS.forEach(i => { T(i.text); T(i.hook); }); ["Time", "Streak", "Score", "Too slow", "Not quite", "The answer is"].forEach(T);
let styled = false;
function css() {
  if (styled) return; styled = true;
  const s = document.createElement("style");
  s.textContent = `
.bz{background:linear-gradient(180deg,#0e2a21,#0a1b15);color:#e1f0e9;border-radius:var(--radius-lg);padding:var(--sp-5);box-shadow:var(--shadow-3);}
.bz__hud{display:flex;justify-content:space-between;gap:1rem;font-weight:800;font-size:.85rem;text-transform:uppercase;letter-spacing:.06em;color:#7dffd0;margin-bottom:.6rem;}
.bz__hud b{color:#fff;margin-left:.4rem;font-size:1.1rem;}
.bz__timer{height:8px;border-radius:99px;background:#ffffff1f;overflow:hidden;margin-bottom:.8rem;}
.bz__timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3fd9a0,#f3d36b);}
.bz__belt{position:relative;height:190px;border-radius:14px;overflow:hidden;background:repeating-linear-gradient(90deg,#2a2f2c 0 28px,#242825 28px 56px);border:2px solid #3b423e;}
.bz__belt.is-moving{animation:bzbelt 1s linear infinite;}
@keyframes bzbelt{from{background-position:0 0}to{background-position:56px 0}}
.bz__gate{position:absolute;right:0;top:0;bottom:0;width:10px;background:repeating-linear-gradient(0deg,#f3d36b 0 12px,#222 12px 24px);}
.bz__card{position:absolute;top:10px;width:230px;display:flex;gap:.6rem;align-items:center;background:#f6f3e8;color:#10201a;border-radius:12px;padding:.5rem;box-shadow:0 6px 16px #0008;will-change:left;}
.bz__card img{width:84px;height:84px;object-fit:cover;border-radius:8px;flex:none;}
.bz__card span{font-weight:700;font-size:.82rem;line-height:1.25;}
.bz__card.ok,.bz__card.no{transition:transform .6s ease-in,opacity .6s ease-in;transform:translateY(70px) scale(.8);opacity:0;}.bz__card.ok{outline:4px solid #3fd9a0;}.bz__card.no{outline:4px solid #e0584a;transform:translateY(70px) rotate(-8deg) scale(.8);}
.bz__bins{display:grid;grid-template-columns:repeat(6,1fr);gap:.5rem;margin-top:.8rem;}
.bz__bin{font:inherit;font-weight:800;font-size:.78rem;border:2px solid var(--c);background:#ffffff0d;color:#fff;border-radius:12px;padding:.7rem .3rem;cursor:pointer;min-height:56px;display:flex;flex-direction:column;align-items:center;gap:.2rem;}
.bz__bin kbd{background:var(--c);color:#fff;border-radius:6px;padding:0 .45rem;font-size:.75rem;}
.bz__bin:hover:not(:disabled){background:var(--c);}
.bz__bin.is-correct{background:#3fd9a0;color:#06231a;}.bz__bin.is-wrong{background:#e0584a;}
.bz__fb{min-height:3.2em;margin-top:.7rem;font-weight:600;font-size:.88rem;}
.bz__foot{display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;font-size:.75rem;color:#a9c9bc;gap:1rem;flex-wrap:wrap;}
.bz__mute{font:inherit;font-size:.75rem;padding:.35rem .8rem;border-radius:99px;border:1px solid #ffffff55;background:transparent;color:#d6efe5;cursor:pointer;min-height:36px;}
.bz__end{text-align:center;padding:var(--sp-4);}
.bz__end h3{font-family:var(--font-display);font-size:var(--step-3);color:#fff;margin:.2rem 0;}
.bz__stats{display:flex;justify-content:center;gap:2rem;margin:1rem 0;}
.bz__stats b{display:block;font-size:2rem;color:#7dffd0;font-family:var(--font-display);}
.bz__end ul{text-align:left;max-width:34rem;margin:.6rem auto 1rem;font-size:.85rem;}
.bz__launch{text-align:center;}
@media (max-width:700px){.bz__bins{grid-template-columns:repeat(3,1fr)}.bz__card{width:200px}}
[data-reduced-motion="on"] .bz__belt.is-moving{animation:none;}`;
  document.head.append(s);
}
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const reduced = () => { const a = document.documentElement.getAttribute("data-reduced-motion"); return a === "on" || (a !== "off" && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };

export function mountBonus(host, { onFinish }) {
  css();
  const DURATION = 120000, SETTLE = 1300;
  let queue = shuffle(ITEMS), qi = 0;
  let score = 0, streak = 0, best = 0, hits = 0, seen = 0, cur = null, answered = false, travel = 7500, spawnAt = 0, over = false;
  const missed = [];
  const t0 = performance.now();
  host.innerHTML = `<div class="bz"><div class="bz__hud"><span>${T("Time")}<b id="bzT">120</b></span><span>${T("Streak")}<b id="bzS">0</b></span><span>${T("Score")}<b id="bzP">0</b></span></div>
    <div class="bz__timer"><i id="bzBar"></i></div>
    <div class="bz__belt${reduced() ? "" : " is-moving"}" id="bzBelt"><div class="bz__gate"></div></div>
    <div class="bz__bins" role="group" aria-label="${T("Separation methods")}">${BINS.map((b, i) => `<button type="button" class="bz__bin" data-id="${b.id}" style="--c:${b.color}"><kbd>${i + 1}</kbd>${T(b.label)}</button>`).join("")}</div>
    <div class="bz__fb" id="bzFb" aria-live="polite">${T("Pick the best separation method for each situation before it reaches the yellow gate.")}</div>
    <div class="bz__foot"><button type="button" class="bz__mute" id="bzMute"></button><span>${T("Keys 1 to 6 work too. No lives: take your time.")}</span></div></div>`;
  const $ = s => host.querySelector(s);
  const belt = $("#bzBelt"), fb = $("#bzFb");
  const paintMute = () => { const on = ttsEnabled(); $("#bzMute").textContent = on ? T("Sound on") : T("Sound off"); $("#bzMute").setAttribute("aria-label", on ? T("Sound on. Press to mute") : T("Sound off. Press to unmute")); };
  paintMute(); $("#bzMute").addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  let card = null, raf = null;
  const binBtn = id => host.querySelector(`.bz__bin[data-id="${id}"]`);
  const flash = (id, c) => { const b = binBtn(id); if (!b) return; b.classList.add(c); setTimeout(() => b.classList.remove(c), 450); };
  function paint() { $("#bzS").textContent = streak; $("#bzP").textContent = score; }
  function spawn() {
    if (over) return;
    cur = queue[qi % queue.length]; qi++; if (qi % queue.length === 0) queue = shuffle(ITEMS);
    answered = false; seen++; spawnAt = performance.now();
    travel = Math.max(4200, 7500 - (performance.now() - t0) / 1000 * 28);
    if (card) card.remove();
    card = document.createElement("div"); card.className = "bz__card"; card.innerHTML = `<img src="${cur.img}" alt=""><span>${T(cur.text)}</span>`; card.style.left = "-240px";
    belt.append(card);
  }
  function draw() {
    raf = requestAnimationFrame(draw); if (!card || over) return;
    const t = Math.min(1, (performance.now() - spawnAt) / travel);
    if (!answered) card.style.left = (-240 + t * (belt.clientWidth - 250 + 240)) + "px";
  }
  function resolve(binId, late) {
    if (answered || over || !cur) return; answered = true;
    const ok = !late && binId === cur.bin;
    if (ok) { score += 10 + Math.min(streak, 10) * 2; streak++; best = Math.max(best, streak); hits++; flash(binId, "is-correct"); card.classList.add("ok"); fb.innerHTML = `<b style="color:#7dffd0">${T("Sorted!")}</b> ${T(cur.hook)}`; }
    else { streak = 0; if (!missed.includes(cur)) missed.push(cur); if (binId) flash(binId, "is-wrong"); flash(cur.bin, "is-correct"); card.classList.add("no"); fb.innerHTML = `<b style="color:#ff9d8d">${late ? T("Too slow") : T("Not quite")}.</b> ${T("The answer is")} <b>${T(NAME[cur.bin])}</b>. ${T(cur.hook)}`; }
    paint(); setTimeout(spawn, SETTLE);
  }
  host.querySelectorAll(".bz__bin").forEach(b => b.addEventListener("click", () => resolve(b.dataset.id, false)));
  const onKey = e => { const n = Number(e.key); if (n >= 1 && n <= BINS.length && host.contains($(".bz"))) resolve(BINS[n - 1].id, false); };
  document.addEventListener("keydown", onKey);
  /* wall-clock game state: setInterval, never rAF */
  const clock = setInterval(() => {
    const el = performance.now() - t0, left = Math.max(0, DURATION - el);
    $("#bzT").textContent = Math.ceil(left / 1000); $("#bzBar").style.width = (left / DURATION * 100) + "%";
    if (!answered && cur && performance.now() - spawnAt >= travel) resolve(null, true);
    if (left <= 0) end();
  }, 150);
  function end() {
    if (over) return; over = true; clearInterval(clock); cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey);
    const acc = seen ? Math.round(hits / Math.max(1, seen - (answered ? 0 : 1)) * 100) : 0;
    host.innerHTML = `<div class="bz"><div class="bz__end"><h3>${T("Round complete!")}</h3><div class="bz__stats"><div><b>${score}</b>${T("score")}</div><div><b>${Math.min(100, acc)}%</b>${T("accuracy")}</div><div><b>${best}</b>${T("best streak")}</div></div>
      ${missed.length ? `<p><b>${T("Revisit these:")}</b></p><ul>${missed.map(m => `<li>${T(m.text)}: <b>${T(NAME[m.bin])}</b>. ${T(m.hook)}</li>`).join("")}</ul>` : `<p>${T("Every situation sorted correctly. Brilliant!")}</p>`}
      <button type="button" class="btn" id="bzAgain">${T("Play again")}</button> <button type="button" class="btn btn--ghost" id="bzDone">${T("Close")}</button></div></div>`;
    host.querySelector("#bzAgain").addEventListener("click", () => mountBonus(host, { onFinish }));
    host.querySelector("#bzDone").addEventListener("click", () => { host.innerHTML = ""; });
    if (onFinish) onFinish({ score, best });
  }
  paint(); spawn(); draw();
}
