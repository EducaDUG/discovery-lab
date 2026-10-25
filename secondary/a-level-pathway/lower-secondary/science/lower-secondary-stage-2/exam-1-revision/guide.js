/* Exam 1 Revision Website: all interactive behaviour. Plain ES module, no network, no CDN. */
import { BANK } from "./quiz-data.js?v=1";
import { mountBonus } from "./bonus.js?v=2";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduced = () => {
  const a = document.documentElement.getAttribute("data-reduced-motion");
  return a === "on" || (a !== "off" && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
};
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const shake = e => { e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); };
const popIt = e => { e.classList.remove("pop"); void e.offsetWidth; e.classList.add("pop"); };
function burstAt(host, x, y, color = "#3fd9a0") {
  if (reduced() || !host.animate) return;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  for (let i = 0; i < 10; i++) {
    const d = el("span"); const a = (i / 10) * Math.PI * 2, r = rnd(24, 48);
    d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:7px;height:7px;border-radius:50%;background:${color};pointer-events:none;z-index:5`;
    host.appendChild(d);
    d.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(.2)`, opacity: 0 }], { duration: 600, easing: "ease-out" }).onfinish = () => d.remove();
  }
}
function burstOn(node, color) { const r = node.getBoundingClientRect(), h = node.offsetParent || node.parentElement; const hr = h.getBoundingClientRect(); burstAt(h, r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, color); }
function toast(text) { const t = el("div", "dl-toast", text); t.setAttribute("role", "status"); document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

/* ---------------------------------------------------------------- progress */
const STORE = "dl-ls2-exam1-revision-v1";
let prog = { lessons: {}, labs: {}, quiz: false };
try { const s = JSON.parse(localStorage.getItem(STORE) || "null"); if (s) prog = Object.assign(prog, s); } catch (e) { /* storage may be blocked */ }
const LAB_NAMES = { dissolve: "Dissolve Lab", distil: "Distillation Lab", chroma: "Chromatography Lab", cell: "Cell Builder" };
const LAB_HOW = {
  dissolve: "Dissolve a solute, filter it, then evaporate the water to get the solute back",
  distil: "Collect at least 60% of the water by distillation AND let at least 60% escape by evaporation",
  chroma: "Run 3 different inks and solve at least 2 of the 3 forensic cases",
  cell: "Build a complete plant cell AND a complete animal cell"
};
const BADGES = [
  ...[1, 2, 3, 4, 5, 6].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
  ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
  ["Photo hunter", () => prog.labs.photos, "Real cells: find every part on all three microscope photos"],
  ["Bonus round", () => prog.labs.bonus, "Finish a Lab Bench Rush round"],
  ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
];
function saveProg() { try { localStorage.setItem(STORE, JSON.stringify(prog)); } catch (e) { /* ignore */ } }
function renderProgress() {
  const on = BADGES.filter(b => b[1]()).length;
  const pct = Math.round(on / BADGES.length * 100);
  $("#pPct").textContent = pct + "%"; $("#pBar").style.width = pct + "%";
  $("#pBadges").innerHTML = BADGES.map(b => `<span class="${b[1]() ? "on" : ""}">${b[0]}</span>`).join("");
  $("#pHow").innerHTML = BADGES.map(b => `<li class="${b[1]() ? "on" : ""}"><b>${b[0]}:</b> ${b[2]}</li>`).join("");
}
function award(lab) { if (!prog.labs[lab]) { prog.labs[lab] = true; saveProg(); renderProgress(); toast("Badge earned! Mastery is now " + $("#pPct").textContent); } }
$$(".gx-done").forEach(b => {
  const n = b.dataset.lesson;
  const sync = () => { b.setAttribute("aria-pressed", prog.lessons[n] ? "true" : "false"); b.textContent = prog.lessons[n] ? "Lesson complete" : "Mark lesson complete"; };
  sync();
  b.addEventListener("click", () => { prog.lessons[n] = !prog.lessons[n]; saveProg(); sync(); renderProgress(); if (prog.lessons[n]) { popIt(b); toast("Lesson " + n + " complete!"); } });
});

/* ---------------------------------------------------------------- Lesson 1 flip cards */
const MRS = [
  ["M", "Movement", "Animals move their whole bodies. Plants move parts of themselves, such as turning towards sunlight.", "#2f7dd1"],
  ["R", "Respiration", "Energy is released from food inside cells. It is not the same as breathing.", "#c9791b"],
  ["S", "Sensitivity", "Living things detect and respond to changes in their environment.", "#8a4fc0"],
  ["C", "Control", "Organisms regulate their internal conditions, such as body temperature.", "#12998a"],
  ["G", "Growth", "All living things increase in size.", "#2f9e4f"],
  ["R", "Reproduction", "Living things produce offspring.", "#c43a52"],
  ["E", "Excretion", "Waste products made by the body are removed.", "#7a5c1e"],
  ["N", "Nutrition", "Living things take in food or nutrients. Plants make their own by photosynthesis.", "#d6477f"]
];
$("#mrsGrid").innerHTML = MRS.map(m => `<button class="mcard" style="--c:${m[3]}" aria-pressed="false" aria-label="${m[1]}: tap to flip"><span class="mcard__in"><span class="mcard__f"><i>${m[0]}</i><span>${m[1]}</span></span><span class="mcard__b"><b>${m[1]}</b>${m[2]}</span></span></button>`).join("");
$$(".mcard").forEach(c => c.addEventListener("click", () => { const o = c.classList.toggle("is-open"); c.setAttribute("aria-pressed", o); }));

/* ---------------------------------------------------------------- generic activities */
function makeSorter(host, items, opts, perfect) {
  let order, i, score, answered;
  function start() { order = shuffle(items); i = 0; score = 0; render(); }
  function render() {
    host.innerHTML = "";
    if (i >= order.length) {
      host.append(el("div", "sorter__card", `Done! You scored ${score} / ${order.length}.`), el("div", "sorter__fb", score === order.length ? "Perfect round!" : "Have another go to lock it in."));
      const b = el("button", "btn", "Play again"); b.addEventListener("click", start); host.append(b);
      if (score === order.length && perfect) perfect();
      return;
    }
    answered = false;
    const it = order[i];
    host.append(el("div", "sorter__meta", `<span>Item ${i + 1} of ${order.length}</span><span>Score ${score}</span>`));
    const card = el("div", "sorter__card", it[0]); host.append(card);
    const row = el("div", "sorter__btns");
    opts.forEach((o, k) => {
      const b = el("button", "btn btn--ghost", o);
      b.addEventListener("click", () => {
        if (answered) return; answered = true;
        const ok = k === it[1];
        if (ok) { score++; popIt(card); burstOn(card, "#3fd9a0"); } else shake(card);
        $$("button", row).forEach((x, j) => { x.disabled = true; if (j === it[1]) x.classList.add("ok"); });
        fb.innerHTML = (ok ? "<b>Correct!</b> " : "<b>Not quite.</b> The answer is <b>" + opts[it[1]] + "</b>. ") + it[2];
        const nx = el("button", "btn", i + 1 >= order.length ? "See score" : "Next"); nx.addEventListener("click", () => { i++; render(); });
        fb.append(el("div")); fb.lastChild.append(nx); nx.focus();
      });
      row.append(b);
    });
    host.append(row);
    const fb = el("div", "sorter__fb"); fb.setAttribute("aria-live", "polite"); host.append(fb);
  }
  start();
}

function makeMatch(host, pairs, done) {
  const rights = shuffle(pairs.map((p, k) => [p[1], k]));
  let selL = null, matched = 0;
  const msg = el("p", "pmatch__msg"); msg.setAttribute("aria-live", "polite");
  const L = [], R = [];
  pairs.forEach((p, k) => {
    const l = el("button", "", p[0]); l.dataset.k = k; L.push(l);
    const r = el("button", "", rights[k][0]); r.dataset.k = rights[k][1]; R.push(r);
    host.append(l, r);
    l.addEventListener("click", () => { if (l.classList.contains("ok")) return; L.forEach(x => x.classList.remove("sel")); selL = l; l.classList.add("sel"); msg.textContent = "Now tap its match on the right."; });
    r.addEventListener("click", () => {
      if (r.classList.contains("ok")) return;
      if (!selL) { msg.textContent = "Tap an item on the left first."; shake(r); return; }
      if (selL.dataset.k === r.dataset.k) {
        selL.classList.remove("sel"); selL.classList.add("ok"); r.classList.add("ok"); popIt(r); burstOn(r, "#3fd9a0"); matched++; selL = null;
        msg.textContent = matched === pairs.length ? "All matched! Well done." : "Correct match!";
        if (matched === pairs.length && done) done();
      } else { shake(r); shake(selL); msg.textContent = "Not that one. Think about what each does and try again."; }
    });
  });
  host.append(msg);
}

function makeAnswer(host, statements, checkBtn, resetBtn, out) {
  const shuf = shuffle(statements);
  shuf.forEach(s => { const b = el("button", "", s[0]); b.setAttribute("aria-pressed", "false"); b._ok = s[1]; b.addEventListener("click", () => { if (b.dataset.locked) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); }); host.append(b); });
  checkBtn.addEventListener("click", () => {
    let good = 0, bad = 0, missed = 0; const total = statements.filter(s => s[1]).length;
    $$("button", host).forEach(b => {
      const on = b.getAttribute("aria-pressed") === "true"; b.classList.remove("ok", "no", "miss"); b.dataset.locked = "1";
      if (on && b._ok) { good++; b.classList.add("ok"); } else if (on) { bad++; b.classList.add("no"); } else if (b._ok) { missed++; b.classList.add("miss"); }
    });
    const mark = Math.max(0, good - bad);
    out.textContent = `You picked ${good} of ${total} key points and ${bad} that do not belong (green = correct, red = wrong, dashed = missed). Answer score: ${mark} / ${total}.`;
  });
  resetBtn.addEventListener("click", () => { $$("button", host).forEach(b => { delete b.dataset.locked; b.setAttribute("aria-pressed", "false"); b.classList.remove("ok", "no", "miss"); }); out.textContent = ""; });
}

/* ---------------------------------------------------------------- lesson activities */
makeSorter($("#sortLife"), [
  ["Photosynthesis", 1, "Photosynthesis is how plants make food (part of Nutrition). It is not one of the eight life processes."],
  ["Releasing energy from food in cells", 0, "That is Respiration, one of the eight life processes."],
  ["Growth", 0, "Growth is a life process: an increase in size."],
  ["Sensitivity", 0, "Sensitivity is a life process: responding to the environment."],
  ["Breathing air in and out", 1, "Breathing is not a life process. Respiration (in the cells) is."],
  ["Removing waste products", 0, "That is Excretion, a life process."]
], ["One of the 8 life processes", "NOT one of the 8"]);

makeMatch($("#matchOrgans"), [
  ["Brain", "Controls thoughts and body functions"], ["Stomach", "Digests food"], ["Liver", "Cleans toxins from the blood"],
  ["Lungs", "Absorb oxygen from the air"], ["Heart", "Pumps blood around the body"], ["Roots", "Absorb water from the soil"], ["Leaves", "Carry out photosynthesis"]
]);

makeSorter($("#sortTissue"), [
  ["Heart", 1, "The heart is an organ: it is made of several tissues."], ["Xylem", 0, "Xylem is a plant tissue."], ["Muscle", 0, "Muscle is an animal tissue."],
  ["Lungs", 1, "The lungs are an organ."], ["Phloem", 0, "Phloem is a plant tissue."], ["Stomach", 1, "The stomach is an organ."],
  ["Root hair", 0, "Root hair tissue is a plant tissue."], ["Skin", 1, "Skin is an organ."], ["Brain", 1, "The brain is an organ."], ["Leaf veins", 1, "As listed in the lesson, leaf veins are counted as an organ part made of xylem and phloem."]
], ["Tissue", "Organ"]);

makeMatch($("#matchTissues"), [
  ["Brain", "Nervous tissue"], ["Lungs", "Epithelial and connective tissue"], ["Stomach", "Muscle and epithelial tissue"], ["Heart", "Muscle, connective and nervous tissue"], ["Carrot (root organ)", "Xylem and root hair tissue"], ["Leaf (plant organ)", "Xylem and phloem tissue"]
]);

makeAnswer($("#ans1"), [
  ["Cells of the same type group together to form a tissue.", true],
  ["Different tissues work together to make an organ, for example the heart is made of muscle, connective and nervous tissue.", true],
  ["Several organs working together form an organ system, for example the heart and blood vessels make the circulatory system.", true],
  ["In plants, xylem and phloem tissue make up the leaf, an organ that carries out photosynthesis.", true],
  ["Root hair tissue and xylem make up the root, which absorbs water.", true],
  ["An organ is made of one single tissue only.", false],
  ["Tissues are made of organs.", false],
  ["Plants do not have tissues or organs.", false]
], $("#ans1Check"), $("#ans1Reset"), $("#ans1Out"));

/* cell chart */
const CELL = [["Nucleus", 1, 1], ["Cytoplasm", 1, 1], ["Cell membrane", 1, 1], ["Mitochondria", 1, 1], ["Cell wall", 1, 0], ["Chloroplasts", 1, 0], ["Vacuole (large)", 1, 0]];
$("#cellChart tbody").innerHTML = CELL.map((c, k) => `<tr class="cellrow" data-k="${k}"><th scope="row">${c[0]}</th><td><label><input type="checkbox" data-c="p" aria-label="${c[0]} in plant cell"> <span>in plant cell</span></label></td><td><label><input type="checkbox" data-c="a" aria-label="${c[0]} in animal cell"> <span>in animal cell</span></label></td></tr>`).join("");
$("#chartCheck").addEventListener("click", () => {
  let right = 0;
  $$(".cellrow").forEach(r => {
    const c = CELL[+r.dataset.k], p = $("[data-c=p]", r).checked, a = $("[data-c=a]", r).checked;
    const ok = p === !!c[1] && a === !!c[2]; right += ok ? 1 : 0; r.classList.toggle("ok", ok); r.classList.toggle("no", !ok);
  });
  $("#chartOut").textContent = right === CELL.length ? "Perfect! Every row is right." : `${right} of ${CELL.length} rows are right. Rows in red need another look.`;
});
$("#chartReset").addEventListener("click", () => { $$(".cellrow").forEach(r => { r.classList.remove("ok", "no"); $$("input", r).forEach(i => i.checked = false); }); $("#chartOut").textContent = ""; });

/* ordering ladder */
(function () {
  const host = $("#orderLadder");
  const STEPS = [["Cell", "e.g. a muscle cell or a root hair cell"], ["Tissue", "e.g. muscle tissue or xylem"], ["Organ", "e.g. the heart or a leaf"], ["Organ system", "e.g. the circulatory system"]];
  let next;
  function build() {
    host.innerHTML = ""; next = 0;
    const placed = el("div", "placed"); STEPS.forEach((s, k) => placed.append(el("div", "slot", `<b>${k + 1}</b>Smallest is first`)));
    host.append(placed);
    shuffle(STEPS.map((s, k) => k)).forEach(k => {
      const b = el("button", "", STEPS[k][0]);
      b.addEventListener("click", () => {
        if (k === next) { const slot = placed.children[next]; slot.className = "slot ok"; slot.innerHTML = `<b>${STEPS[k][0]}</b>${STEPS[k][1]}`; b.disabled = true; popIt(slot); next++; msg.textContent = next === 4 ? "Correct order: cell, tissue, organ, organ system." : "Good. What comes next?"; if (next === 4) { burstOn(slot, "#3fd9a0"); const r = el("button", "btn btn--ghost", "Shuffle again"); r.addEventListener("click", build); host.append(r); } }
        else { shake(b); msg.textContent = "Not yet. Start from the smallest unit of life."; }
      });
      host.append(b);
    });
    const msg = el("p", "order__msg", "Tap the four levels in order, smallest first."); msg.setAttribute("aria-live", "polite"); host.append(msg);
  }
  build();
})();

makeMatch($("#matchSystems"), [
  ["Digestive", "Breaks down food into nutrients"], ["Respiratory", "Absorbs oxygen from the air"], ["Circulatory", "Carries substances around the body"],
  ["Excretory", "Removes urine and other waste"], ["Nervous", "Sends messages using nerves"]
]);

makeSorter($("#sortSolution"), [
  ["Salt stirred into water until it vanishes", 0, "The salt dissolves, so it is a solution."],
  ["Sand shaken in water", 1, "Sand does not dissolve, so the liquid stays cloudy and it is not a solution."],
  ["Sugar in tea", 0, "Sugar dissolves in tea: a solution."],
  ["Oil poured on water", 1, "Oil does not dissolve in water, so it is not a solution."],
  ["Lemonade powder in water", 0, "The powder dissolves into the water: a solution."],
  ["Marbles in water", 1, "Marbles cannot dissolve, so this is just a mixture."],
  ["Copper sulfate in water (a blue liquid)", 0, "It dissolves to make a blue solution."],
  ["Sand and gravel", 1, "Two solids, nothing dissolved."]
], ["A solution", "NOT a solution"]);

makeSorter($("#sortMethod"), [
  ["Sand mixed into water", 0, "The sand does not dissolve, so filtration holds it back."],
  ["Salt dissolved in water: get the salt back", 1, "Evaporating the water leaves the dissolved salt behind."],
  ["Iron filings mixed with sand", 3, "Iron is magnetic, so a magnet pulls it out."],
  ["Small stones mixed with large stones", 2, "A sieve lets the small pieces through."],
  ["Soil particles in muddy water", 0, "Filtration separates undissolved solids from liquids."],
  ["Paper clips mixed with sugar", 3, "Paper clips are magnetic, sugar is not."]
], ["Filtration", "Evaporation", "Sieving", "Magnetism"]);

makeSorter($("#sortEvap"), [
  ["Get salt from salt water, and you do not need the water", 0, "Evaporation recovers the solute. The water is lost as vapour."],
  ["Astronauts recycle urine into drinking water", 1, "Distillation collects the water as well as separating the solute."],
  ["Make pure drinking water from sea water", 1, "The vapour is condensed and collected."],
  ["The solvent escapes into the air and is lost", 0, "That is evaporation."],
  ["Vapour is cooled in a condenser into a separate container", 1, "That is the second step of distillation."],
  ["Both the solute and the solvent are kept", 1, "Only distillation keeps both."]
], ["Evaporation", "Distillation"]);

makeSorter($("#sortChroma"), [
  ["A dye that is very soluble in the solvent", 0, "More soluble dyes dissolve and travel further."],
  ["A dye that barely dissolves in the solvent", 1, "A less soluble dye stays close to the start line."],
  ["The yellow dye with the higher solubility (the other is lower)", 0, "Higher solubility means a longer trip up the paper."],
  ["A dye that sticks to the paper more than it dissolves", 1, "It is left near the start."]
], ["Travels further", "Stays near the start"]);

makeAnswer($("#ans2"), [
  ["Chromatography separates a mixture of coloured substances (dyes).", true],
  ["The paper is the stationary phase and the solvent is the mobile phase.", true],
  ["The solvent moves up the paper and carries the dyes with it.", true],
  ["Dyes that are more soluble travel further, so different dyes separate because they have different solubility.", true],
  ["Uses include forensics (comparing inks) and checking food dyes.", true],
  ["The dyes separate because the heaviest ones always go furthest.", false],
  ["The solvent is the stationary phase.", false],
  ["Chromatography is used to separate a solid from a liquid with a filter.", false]
], $("#ans2Check"), $("#ans2Reset"), $("#ans2Out"));

/* flowchart */
$("#flowchart").innerHTML = `
<div class="flow__lane" style="--c:#c9791b"><h4>Evaporation</h4>
 <div class="flow__step">Salt water is heated in a dish</div>
 <div class="flow__step">Water gains energy and becomes vapour<br><span class="flow__tag lose">Water: LOST to the air</span></div>
 <div class="flow__step">Salt crystals are left in the dish<br><span class="flow__tag keep">Salt (solute): KEPT</span></div></div>
<div class="flow__lane" style="--c:#12998a"><h4>Distillation</h4>
 <div class="flow__step">Salt water is heated in a flask</div>
 <div class="flow__step">Water evaporates, salt stays behind<br><span class="flow__tag keep">Salt: KEPT in the flask</span></div>
 <div class="flow__step">Vapour cools and condenses in the condenser</div>
 <div class="flow__step">Pure water drips into a separate container<br><span class="flow__tag keep">Water (solvent): KEPT</span></div></div>`;

/* ---------------------------------------------------------------- canvas helpers */
function rafLoop(cv, step) {
  const ctx = cv.getContext("2d"); let last = performance.now(), run = true;
  const vis = new IntersectionObserver(es => { run = es[0].isIntersecting; if (run) last = performance.now(); }); vis.observe(cv);
  (function tick(now) { requestAnimationFrame(tick); if (!run) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; step(ctx, dt); })(performance.now());
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* ================================================================ LAB 1: DISSOLVE */
(function () {
  const cv = $("#disCanvas");
  const SOL = {
    salt: { name: "salt", crystal: "#f5f5f0", dot: "#e8eef2", tint: null, cap: t => 16 + t * 0.35, dissolves: true },
    sugar: { name: "sugar", crystal: "#fff3d6", dot: "#f3e4bd", tint: null, cap: t => 14 + t * 0.4, dissolves: true },
    cusulfate: { name: "copper sulfate", crystal: "#2f78d6", dot: "#3b8cf0", tint: [60, 140, 240], cap: t => 10 + t * 0.3, dissolves: true },
    sand: { name: "sand", crystal: "#c8a46a", dot: "#c8a46a", tint: null, cap: () => 0, dissolves: false }
  };
  const BX = 170, BW = 300, BTOP = 110, BBOT = 420, FULL = 175; // water surface at FULL when level is 1
  let water, crystals, dissolved, vapour, stir, temp, solute, caught, flags, evapOn, msg;
  const ws = [];
  function reset() {
    water = 1; crystals = []; dissolved = []; vapour = []; stir = 0; caught = 0; evapOn = false; msg = "";
    flags = flags || { dis: false, filt: false, rec: false };
    ws.length = 0; for (let i = 0; i < 70; i++) ws.push({ x: rnd(BX + 10, BX + BW - 10), y: rnd(FULL + 10, BBOT - 10), a: rnd(0, 6.28) });
    setTip("Add some salt. Then try stirring and warming the water.");
  }
  function setTip(t) { $("#disTip").textContent = t; }
  const surface = () => FULL + (1 - water) * (BBOT - FULL - 12);
  $("#disTemp").addEventListener("input", e => { temp = +e.target.value; $("#disTLbl").innerHTML = temp + "&deg;C"; });
  $("#disSolute").addEventListener("change", () => { solute = $("#disSolute").value; });
  temp = 20; solute = "salt"; flags = null; reset();
  $("#disAdd").addEventListener("click", () => {
    if (water < 0.3) { setTip("There is hardly any water left. Press Reset to start again."); shake($("#disAdd")); return; }
    for (let i = 0; i < 6; i++) crystals.push({ x: rnd(BX + 70, BX + BW - 70), y: 60 - i * 12, vy: 0, rest: false, sol: solute });
    popIt($("#disAdd"));
    setTip(solute === "sand" ? "Sand is insoluble: it will sink and stay as a solid." : "Watch the crystals dissolve. Does stirring or heat help?");
  });
  $("#disStir").addEventListener("click", () => { stir = 3; popIt($("#disStir")); setTip("Stirring spreads the water around the solid, so it dissolves faster."); });
  $("#disEvap").addEventListener("click", () => {
    evapOn = !evapOn; $("#disEvap").textContent = evapOn ? "Stop heating" : "Evaporate it";
    setTip(evapOn ? "The water gains energy and escapes as vapour. What will be left?" : "Heating paused.");
  });
  $("#disFilter").addEventListener("click", () => {
    const und = crystals.filter(c => !c.gone); if (!und.length) { setTip("There is no undissolved solid to filter out. Dissolved solute passes straight through the filter paper."); shake($("#disFilter")); if (dissolved.length) setTip("Filter paper cannot catch dissolved solute: it is far too small, so it passes straight through with the water."); return; }
    caught += und.length; crystals = []; flags.filt = true;
    setTip("Filtered! The undissolved solid stays in the filter paper. Anything dissolved passes through with the water.");
    checkAward();
  });
  $("#disReset").addEventListener("click", () => { reset(); $("#disEvap").textContent = "Evaporate it"; });
  function checkAward() { if (flags.dis && flags.filt && flags.rec) award("dissolve"); }
  rafLoop(cv, (ctx, dt) => {
    const S = SOL[solute];
    if (stir > 0) stir -= dt;
    const mixing = stir > 0;
    // physics + dissolving
    const und = crystals.filter(c => !c.gone);
    und.forEach(c => {
      const bot = BBOT - 8 - (c.pile || 0);
      if (!c.rest) { c.vy += 420 * dt; c.y += c.vy * dt; if (c.y > surface()) c.vy *= 0.92; if (c.y >= bot) { c.y = bot; c.rest = true; c.pile = 0; } }
      if (mixing && c.rest) { c.x += Math.sin(performance.now() / 120 + c.y) * 1.2; c.y = bot - 10 - Math.abs(Math.sin(performance.now() / 200 + c.x)) * 40; }
      else if (c.rest) c.y = bot;
      const sdef = SOL[c.sol];
      if (c.rest && sdef.dissolves && water > 0.05) {
        const dcount = dissolved.length;
        if (dcount < sdef.cap(temp)) {
          const rate = 0.12 + temp / 90 * 0.5 + (mixing ? 0.9 : 0);
          if (Math.random() < rate * dt) { c.gone = true; dissolved.push({ x: c.x, y: c.y, a: rnd(0, 6.28), c: sdef.dot, sol: c.sol }); }
        }
      }
    });
    crystals = crystals.filter(c => !c.gone);
    // evaporation
    if (evapOn && water > 0) {
      water = Math.max(0, water - dt * (0.03 + temp / 90 * 0.07 + 0.02));
      if (Math.random() < dt * 25 && water > 0.02) vapour.push({ x: rnd(BX + 20, BX + BW - 20), y: surface(), a: 1 });
      if (water <= 0.02) {
        water = 0.02;
        if (dissolved.length) {
          dissolved.forEach(d => crystals.push({ x: clamp(d.x, BX + 20, BX + BW - 20), y: BBOT - 12, vy: 0, rest: true, sol: d.sol, pile: 0, rec: true }));
          dissolved = []; flags.rec = true; setTip("Water gone, solute back! Evaporation lets you recover the dissolved solid."); checkAward();
        } else if (!crystals.length) setTip("Nothing dissolved, so only a dry beaker is left.");
        evapOn = false; $("#disEvap").textContent = "Evaporate it";
      }
    }
    vapour.forEach(v => { v.y -= 60 * dt; v.x += Math.sin(v.y / 12) * 0.4; v.a -= dt * 0.35; });
    vapour = vapour.filter(v => v.a > 0);
    dissolved.forEach(d => { d.a += dt * (mixing ? 5 : 1.2); d.x += Math.cos(d.a) * (mixing ? 1.6 : 0.4); d.y += Math.sin(d.a * 1.3) * (mixing ? 1.6 : 0.4); d.x = clamp(d.x, BX + 12, BX + BW - 12); d.y = clamp(d.y, surface() + 8, BBOT - 10); });
    ws.forEach(w => { w.a += rnd(-0.4, 0.4); const sp = (mixing ? 2.4 : 0.6) + temp / 90 * 1.2; w.x += Math.cos(w.a) * sp; w.y += Math.sin(w.a) * sp; w.x = clamp(w.x, BX + 10, BX + BW - 10); w.y = clamp(w.y, surface() + 6, BBOT - 10); });
    // state
    const rest = crystals.filter(c => c.sol && !c.rec);
    if (dissolved.length && !rest.length && !flags.dis && solute !== "sand") { flags.dis = true; setTip("A solution forms: the solute is dissolved in the solvent (water). Now try Filter it, then Evaporate it."); checkAward(); }
    let hud = "Pure water";
    if (crystals.some(c => c.rec)) hud = "Solute recovered";
    else if (water < 0.1) hud = "Dry beaker";
    else if (rest.length && rest.some(c => c.sol === "sand")) hud = "Mixture: insoluble solid";
    else if (rest.length && dissolved.length) hud = dissolved.length >= S.cap(temp) - 0.5 ? "Saturated: no more can dissolve" : "Dissolving...";
    else if (rest.length) hud = "Mixture: solid not yet dissolved";
    else if (dissolved.length) hud = "Solution (solute dissolved)";
    $("#disHud").textContent = hud;
    $("#tDis").textContent = dissolved.length; $("#tUnd").textContent = rest.length;
    $("#mDis").style.width = clamp(dissolved.length / 25 * 100, 0, 100) + "%"; $("#mUnd").style.width = clamp(rest.length / 12 * 100, 0, 100) + "%";
    // draw
    ctx.clearRect(0, 0, 640, 480);
    const g = ctx.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, "#16384c"); g.addColorStop(1, "#0a1b24"); ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 480);
    const sy = surface();
    let tr = 120, tg = 190, tb = 235, ta = 0.5;
    const cuCount = dissolved.filter(d => d.sol === "cusulfate").length;
    if (cuCount) { const f = Math.min(1, cuCount / 12); tr = 120 - 60 * f; tg = 190 - 40 * f; tb = 235; ta = 0.5 + 0.25 * f; }
    const sandCloud = rest.some(c => c.sol === "sand") && mixing;
    ctx.fillStyle = sandCloud ? "rgba(190,160,110,.6)" : `rgba(${tr},${tg},${tb},${ta})`; ctx.fillRect(BX, sy, BW, BBOT - sy);
    // water particles
    ctx.fillStyle = "rgba(180,225,255,.55)"; ws.forEach(w => { ctx.beginPath(); ctx.arc(w.x, w.y, 3, 0, 6.28); ctx.fill(); });
    // dissolved solute particles
    dissolved.forEach(d => { ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x, d.y, 3.4, 0, 6.28); ctx.fill(); });
    // crystals
    crystals.forEach((c, k) => { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(((c.x * 7 + k) % 6) / 3); ctx.fillStyle = SOL[c.sol].crystal; ctx.fillRect(-6, -6, 12, 12); ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.strokeRect(-6, -6, 12, 12); ctx.restore(); });
    // vapour
    vapour.forEach(v => { ctx.fillStyle = `rgba(230,245,255,${v.a * 0.6})`; ctx.beginPath(); ctx.arc(v.x, v.y, 3, 0, 6.28); ctx.fill(); });
    // beaker
    ctx.strokeStyle = "rgba(230,245,255,.85)"; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(BX, BTOP); ctx.lineTo(BX, BBOT); ctx.lineTo(BX + BW, BBOT); ctx.lineTo(BX + BW, BTOP); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText("water = solvent", BX + 6, BBOT + 22);
    if (und.length || dissolved.length) ctx.fillText("solute: " + S.name, BX + 6, BBOT + 40);
    // stirrer
    if (mixing) { const sx = BX + BW / 2 + Math.sin(performance.now() / 90) * 40; ctx.strokeStyle = "#e6c37a"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx + 20, 40); ctx.lineTo(sx, BBOT - 30); ctx.stroke(); }
    // filter paper caught pile
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText("Filter paper catch: " + caught + " solid", 20, 40);
    if (caught) { for (let i = 0; i < Math.min(caught, 24); i++) { ctx.fillStyle = "#c8a46a"; ctx.fillRect(24 + (i % 8) * 11, 50 + Math.floor(i / 8) * 11, 9, 9); } }
    // thermometer
    ctx.fillStyle = "#222"; rr(ctx, 540, 120, 22, 250, 11); ctx.fill(); const th = (temp - 5) / 85; ctx.fillStyle = temp > 55 ? "#ff6d4c" : "#4ca3ff"; rr(ctx, 545, 365 - th * 230, 12, th * 230 + 6, 6); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(temp + "°C", 536, 395);
    // burner flame under beaker when heating
    if (evapOn || temp > 40) { for (let i = 0; i < 5; i++) { const fx = BX + 60 + i * 45, fh = 18 + Math.sin(performance.now() / 110 + i) * 6 + (evapOn ? 14 : 0); ctx.fillStyle = evapOn ? "rgba(255,150,40,.9)" : "rgba(80,150,255,.7)"; ctx.beginPath(); ctx.moveTo(fx - 8, 450); ctx.quadraticCurveTo(fx, 450 - fh * 1.6, fx + 8, 450); ctx.fill(); } }
  });
})();

/* ================================================================ LAB 2: DISTILLATION */
(function () {
  const cv = $("#disTCanvas"); let mode = "distil", heat = false, W, vap, drops, col, lost, power = 3, acc, ctx0;
  // distillation path for vapour: neck -> tube -> condenser end
  const PATH = [[150, 215], [150, 170], [230, 150], [420, 280], [470, 322]];
  const seg = []; let plen = 0; for (let i = 1; i < PATH.length; i++) { const l = Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]); seg.push(l); plen += l; }
  function at(d) { let i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; } const f = clamp(d / seg[i], 0, 1); return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * f, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * f, i]; }
  function reset() { W = 100; vap = []; drops = []; col = 0; lost = 0; acc = 0; heat = false; $("#dtHeat").textContent = "Light the burner"; setTip(mode === "distil" ? "Light the burner. In distillation the vapour is cooled in the condenser and collected." : "Light the burner. In evaporation the vapour just escapes into the air."); }
  function setTip(t) { $("#dtTip").textContent = t; }
  const done = { distil: false, evap: false };
  $("#dtHeat").addEventListener("click", () => { heat = !heat; $("#dtHeat").textContent = heat ? "Turn burner off" : "Light the burner"; });
  $("#dtReset").addEventListener("click", reset);
  $("#dtPower").addEventListener("input", e => { power = +e.target.value; $("#dtHLbl").textContent = power; });
  $$("#dtTabs button").forEach(b => b.addEventListener("click", () => { mode = b.dataset.m; $$("#dtTabs button").forEach(x => x.setAttribute("aria-selected", x === b)); $("#dtHud").textContent = "Method: " + (mode === "distil" ? "distillation" : "evaporation"); reset(); }));
  reset();
  rafLoop(cv, (ctx, dt) => {
    if (heat && W > 0) {
      const d = Math.min(W, power * 1.6 * dt); W -= d; acc += d;
      while (acc >= 1) { acc -= 1; vap.push({ d: 0, x: mode === "distil" ? 150 : rnd(250, 400), y: 360, a: 1 }); }
    }
    vap.forEach(v => {
      if (mode === "distil") { v.d += 130 * dt; if (v.d >= plen) { v.dead = true; drops.push({ x: 470 + rnd(-4, 4), y: 322, vy: 0 }); } else { const p = at(v.d); v.x = p[0]; v.y = p[1]; } }
      else { v.y -= 70 * dt; v.x += Math.sin(v.y / 10) * 0.8; v.a -= dt * 0.18; if (v.y < 40) { v.dead = true; lost++; } }
    });
    vap = vap.filter(v => !v.dead);
    drops.forEach(d => { d.vy += 500 * dt; d.y += d.vy * dt; if (d.y > 410 - col * 0.55) { d.dead = true; col++; } });
    drops = drops.filter(d => !d.dead);
    if (mode === "distil" && col >= 60 && !done.distil) { done.distil = true; setTip("Distillation collected the water in a separate container, and the salt stayed behind. Both are kept."); }
    if (mode === "evap" && lost >= 60 && !done.evap) { done.evap = true; setTip("Evaporation: the water escaped into the air and is lost. Only the salt is kept."); }
    if (done.distil && done.evap) award("distil");
    if (W <= 0 && heat) { heat = false; $("#dtHeat").textContent = "Light the burner"; setTip(mode === "distil" ? "All the water has been distilled. Pure water is in the beaker and dry salt is left in the flask." : "All the water has gone. Only salt crystals are left in the dish."); }
    $("#tCol").textContent = Math.round(col) + "%"; $("#tLost").textContent = Math.round(lost) + "%"; $("#tSalt").textContent = "100%";
    $("#mCol").style.width = clamp(col, 0, 100) + "%"; $("#mLost").style.width = clamp(lost, 0, 100) + "%"; $("#mSalt").style.width = "100%";
    // draw
    ctx.clearRect(0, 0, 640, 480);
    const g = ctx.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, "#1b2a36"); g.addColorStop(1, "#0c141b"); ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 480);
    // bench
    ctx.fillStyle = "#4a3722"; ctx.fillRect(0, 450, 640, 30);
    if (mode === "distil") {
      // condenser jacket
      ctx.save(); ctx.translate(0, 0); ctx.strokeStyle = "rgba(120,190,255,.5)"; ctx.lineWidth = 34; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(250, 160); ctx.lineTo(430, 282); ctx.stroke();
      ctx.strokeStyle = "rgba(230,245,255,.9)"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(PATH[1][0], PATH[1][1]); PATH.slice(2).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#cfe9ff"; ctx.font = "13px sans-serif"; ctx.fillText("condenser (cold water)", 300, 185);
      // receiving beaker
      ctx.strokeStyle = "rgba(230,245,255,.85)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(430, 340); ctx.lineTo(430, 440); ctx.lineTo(530, 440); ctx.lineTo(530, 340); ctx.stroke();
      const wh = col * 0.55; ctx.fillStyle = "rgba(100,190,255,.75)"; ctx.fillRect(432, 438 - wh, 96, wh);
      ctx.fillStyle = "#fff"; ctx.fillText("pure water collected", 425, 462 > 470 ? 470 : 466);
    }
    if (mode === "distil") {
      // flask
      const lvl = 395 - (W / 100) * 95;
      ctx.beginPath(); ctx.moveTo(130, 215); ctx.lineTo(130, 280); ctx.lineTo(70, 410); ctx.lineTo(230, 410); ctx.lineTo(170, 280); ctx.lineTo(170, 215); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.fillStyle = "rgba(100,170,230,.7)"; ctx.fillRect(60, lvl, 190, 420 - lvl);
      if (W > 0) { ctx.fillStyle = "rgba(255,255,255,.8)"; for (let i = 0; i < 10; i++) ctx.fillRect(90 + (i * 29) % 120, lvl + 18 + (i * 17) % 60, 4, 4); }
      else { ctx.fillStyle = "#f5f5f0"; for (let i = 0; i < 40; i++) ctx.fillRect(80 + (i * 37) % 140, 395 + (i % 4) * 3, 7, 7); }
      ctx.restore();
      ctx.strokeStyle = "rgba(230,245,255,.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(130, 215); ctx.lineTo(130, 280); ctx.lineTo(70, 410); ctx.lineTo(230, 410); ctx.lineTo(170, 280); ctx.lineTo(170, 215); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText("flask: salt water", 70, 435);
    } else {
      // open dish
      const dl = 420 - (W / 100) * 40;
      ctx.beginPath(); ctx.moveTo(200, 380); ctx.lineTo(450, 380); ctx.lineTo(430, 425); ctx.lineTo(220, 425); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.fillStyle = "rgba(100,170,230,.7)"; ctx.fillRect(190, dl - 5, 270, 60);
      if (W <= 0) { ctx.fillStyle = "#f5f5f0"; for (let i = 0; i < 60; i++) ctx.fillRect(225 + (i * 31) % 195, 405 + (i % 3) * 5, 7, 7); }
      ctx.restore();
      ctx.strokeStyle = "rgba(230,245,255,.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(200, 380); ctx.lineTo(220, 425); ctx.lineTo(430, 425); ctx.lineTo(450, 380); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText("open dish: salt water", 240, 445);
    }
    // flame
    if (heat) { const bx = mode === "distil" ? 150 : 325; for (let i = -1; i <= 1; i++) { const fh = 26 + Math.sin(performance.now() / 90 + i * 2) * 8; ctx.fillStyle = "rgba(255,160,40,.92)"; ctx.beginPath(); ctx.moveTo(bx + i * 18 - 9, 450); ctx.quadraticCurveTo(bx + i * 18, 450 - fh * 1.4, bx + i * 18 + 9, 450); ctx.fill(); } }
    ctx.fillStyle = "#666"; ctx.fillRect((mode === "distil" ? 150 : 325) - 28, 444, 56, 10);
    // vapour & drops
    vap.forEach(v => { ctx.fillStyle = `rgba(235,245,255,${clamp(v.a, 0, 1) * 0.85})`; ctx.beginPath(); ctx.arc(v.x, v.y, 3.5, 0, 6.28); ctx.fill(); });
    ctx.fillStyle = "rgba(120,200,255,.95)"; drops.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, 3.2, 0, 6.28); ctx.fill(); });
    if (mode === "evap") { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "13px sans-serif"; ctx.fillText("vapour escapes into the air", 240, 60); }
  });
})();

/* ================================================================ LAB 3: CHROMATOGRAPHY */
(function () {
  const cv = $("#chCanvas");
  const DYE = { Y: ["Yellow dye", "#f2c230"], R: ["Red dye", "#e0446a"], B: ["Blue dye", "#3a6fd8"] };
  const INKS = {
    black: ["Black ink", [["Y", .82], ["R", .58], ["B", .33]]],
    green: ["Green ink", [["Y", .8], ["B", .38]]],
    brown: ["Brown ink", [["Y", .75], ["R", .5], ["B", .25]]],
    purple: ["Purple ink", [["R", .6], ["B", .3]]],
    yellow: ["Yellow ink (one dye)", [["Y", .8]]],
    penA: ["Pen A", [["Y", .8], ["R", .55]]],
    penB: ["Pen B", [["Y", .8], ["R", .55], ["B", .3]]],
    penC: ["Pen C", [["R", .6], ["B", .3]]]
  };
  $("#chInk").innerHTML = Object.keys(INKS).map(k => `<option value="${k}">${INKS[k][0]}</option>`).join("");
  const P = 270, START = 360;
  let ink = "black", front = 0, running = false, speed = 2, ran = new Set(), fo = null, foScore = 0, foRounds = 0, evid = null, finished = false;
  const SPD = [0, "Slow", "Normal", "Fast"];
  $("#chSpeed").addEventListener("input", e => { speed = +e.target.value; $("#chSLbl").textContent = SPD[speed]; });
  $("#chInk").addEventListener("change", () => { ink = $("#chInk").value; resetPaper(); });
  function resetPaper() { front = 0; running = false; finished = false; $("#chRun").textContent = "Start the solvent"; $("#chHud").textContent = INKS[ink][0] + ": ready"; $("#chInfo").innerHTML = "<b>Dyes found</b><p>Start the solvent to see which dyes are in the ink.</p>"; }
  $("#chReset").addEventListener("click", resetPaper);
  $("#chRun").addEventListener("click", () => {
    if (finished) { resetPaper(); }
    running = !running; $("#chRun").textContent = running ? "Pause" : "Start the solvent";
  });
  resetPaper();
  function report() {
    const dyes = [...INKS[ink][1]].sort((a, b) => b[1] - a[1]);
    $("#chInfo").innerHTML = `<b>${INKS[ink][0]}: ${dyes.length === 1 ? "one dye (a pure ink)" : dyes.length + " dyes (a mixture)"}</b><p>${dyes.map(d => `${DYE[d[0]][0]}: moved ${(d[1] * front / P * 9.5).toFixed(1)} cm`).join("<br>")}</p><p class="tip">The most soluble dye travelled furthest.</p>`;
  }
  function newCase() {
    const keys = ["penA", "penB", "penC"]; evid = keys[Math.floor(Math.random() * 3)];
    $("#foPrompt").textContent = `Case ${foRounds + 1} of 3: a threatening note was written with one of these pens. The note's chromatogram is shown on the right of the paper. Run each pen, then choose the match.`;
    const box = $("#foChoices"); box.innerHTML = "";
    keys.forEach(k => { const b = el("button", "btn btn--ghost", INKS[k][0] + " matches"); b.addEventListener("click", () => {
      if (!fo) return;
      if (k === evid) { foScore++; $("#foPrompt").textContent = "Correct! The dyes and how far each one travelled match the note."; } else $("#foPrompt").textContent = "Not a match. The answer was " + INKS[evid][0] + ": compare the number and height of the spots.";
      foRounds++; $("#foScore").textContent = `Cases solved ${foScore} / ${foRounds}`; fo = null; box.innerHTML = "";
      const nx = el("button", "btn", foRounds >= 3 ? "Finish" : "Next case"); nx.addEventListener("click", () => { if (foRounds >= 3) { $("#foPrompt").textContent = `Forensic report: ${foScore} of 3 cases solved.`; evid = null; fo = null; $("#foBtn").textContent = "Try again"; if (foScore >= 2) { solved = true; check(); } nx.remove(); } else { fo = true; newCase(); } });
      box.append(nx);
    }); box.append(b); });
  }
  let solved = false;
  function check() { if (ran.size >= 3 && solved) award("chroma"); }
  $("#foBtn").addEventListener("click", () => { foScore = 0; foRounds = 0; fo = true; $("#foScore").textContent = ""; $("#foBtn").textContent = "Restart cases"; newCase(); });
  function drawStrip(ctx, x, inkKey, frontPx, label, wet) {
    ctx.fillStyle = "#f4f1e6"; ctx.fillRect(x, 60, 130, 360);
    if (wet > 0) { const wy = START + 30 - wet; const gg = ctx.createLinearGradient(0, wy, 0, 420); gg.addColorStop(0, "rgba(130,170,210,.15)"); gg.addColorStop(1, "rgba(130,170,210,.45)"); ctx.fillStyle = gg; ctx.fillRect(x, wy, 130, 420 - wy); ctx.fillStyle = "rgba(60,110,170,.7)"; ctx.fillRect(x, wy, 130, 2); }
    ctx.strokeStyle = "#777"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x, START); ctx.lineTo(x + 130, START); ctx.stroke(); ctx.setLineDash([]);
    INKS[inkKey][1].forEach(d => {
      const dist = Math.min(d[1] * frontPx, P - 4); const y = START - dist; const h = 10 + dist * 0.02;
      ctx.fillStyle = DYE[d[0]][1]; ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.ellipse(x + 65, y, 24, h, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
    });
    if (frontPx < 1) { ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(x + 65, START, 8, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = "#cfe4dc"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.fillText(label, x + 65, 48); ctx.textAlign = "left";
  }
  rafLoop(cv, (ctx, dt) => {
    if (running) {
      front = Math.min(P, front + dt * (14 + speed * 22));
      if (front >= P) { running = false; finished = true; $("#chRun").textContent = "Run again"; $("#chHud").textContent = "Chromatogram complete"; ran.add(ink); report(); check(); }
      else $("#chHud").textContent = "Solvent rising...";
    }
    ctx.clearRect(0, 0, 640, 480);
    const g = ctx.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, "#14303b"); g.addColorStop(1, "#08141a"); ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 480);
    const sx = fo ? 120 : 255;
    // beaker + solvent
    ctx.strokeStyle = "rgba(230,245,255,.85)"; ctx.lineWidth = 4; const bx0 = sx - 70, bw = 270; ctx.beginPath(); ctx.moveTo(bx0, 380); ctx.lineTo(bx0, 440); ctx.lineTo(bx0 + bw, 440); ctx.lineTo(bx0 + bw, 380); ctx.stroke();
    ctx.fillStyle = "rgba(120,190,255,.5)"; ctx.fillRect(bx0 + 2, 392, bw - 4, 46);
    drawStrip(ctx, sx, ink, front, INKS[ink][0], front);
    ctx.fillStyle = "#e0e0e0"; ctx.font = "12px sans-serif"; ctx.fillText("pencil start line", sx + 134, START + 4); ctx.fillText("solvent (mobile phase)", bx0 + 4, 456); ctx.fillText("paper = stationary phase", sx + 134, 90);
    if (fo && evid) { drawStrip(ctx, 470, evid, P, "Evidence from the note", P); }
  });
})();

/* ================================================================ LAB 4: CELL BUILDER */
(function () {
  const svg = $("#cbSvg");
  const INFO = {
    membrane: ["Cell membrane", "Controls what enters and exits the cell."],
    cytoplasm: ["Cytoplasm", "The jelly where the chemical reactions happen."],
    nucleus: ["Nucleus", "Controls the cell."],
    mito: ["Mitochondria", "Release energy by respiration."],
    wall: ["Cell wall", "Strengthens and supports the plant cell."],
    chloro: ["Chloroplasts", "Use sunlight for photosynthesis."],
    vacuole: ["Large vacuole", "Stores water and nutrients and helps keep the cell's shape."]
  };
  const NEED = { plant: ["wall", "cytoplasm", "membrane", "vacuole", "nucleus", "chloro", "mito"], animal: ["cytoplasm", "membrane", "nucleus", "mito"] };
  let type = "plant"; const have = new Set(), built = { plant: false, animal: false };
  function shapes() {
    const plant = type === "plant";
    const body = plant ? { wall: `<rect class="cbp" data-p="wall" x="30" y="25" width="340" height="250" rx="22" fill="none" stroke="#2f9e4f" stroke-width="14"/>`,
      cytoplasm: `<rect class="cbp" data-p="cytoplasm" x="42" y="37" width="316" height="226" rx="14" fill="#b6e3c6" opacity=".9"/>`,
      membrane: `<rect class="cbp" data-p="membrane" x="42" y="37" width="316" height="226" rx="14" fill="none" stroke="#e8c15a" stroke-width="3"/>`,
      vacuole: `<ellipse class="cbp" data-p="vacuole" cx="245" cy="150" rx="82" ry="78" fill="#a9d8ff" stroke="#6fb0e8" stroke-width="3"/>`,
      nucleus: `<g class="cbp" data-p="nucleus"><circle cx="100" cy="110" r="34" fill="#a56fd6"/><circle cx="94" cy="104" r="11" fill="#5b2f9a"/></g>`,
      chloro: [[90, 205], [150, 232], [315, 70], [330, 220]].map(p => `<ellipse class="cbp" data-p="chloro" cx="${p[0]}" cy="${p[1]}" rx="22" ry="12" fill="#2f9e4f" stroke="#17703a" stroke-width="2"/>`).join(""),
      mito: [[160, 70], [320, 150]].map(p => `<ellipse class="cbp" data-p="mito" cx="${p[0]}" cy="${p[1]}" rx="20" ry="11" fill="#f59e0b" stroke="#a96205" stroke-width="2" transform="rotate(-20 ${p[0]} ${p[1]})"/>`).join("") }
    : { cytoplasm: `<ellipse class="cbp" data-p="cytoplasm" cx="200" cy="150" rx="165" ry="125" fill="#ffd0d6" opacity=".92"/>`,
      membrane: `<ellipse class="cbp" data-p="membrane" cx="200" cy="150" rx="165" ry="125" fill="none" stroke="#e8c15a" stroke-width="5"/>`,
      nucleus: `<g class="cbp" data-p="nucleus"><circle cx="195" cy="145" r="46" fill="#a56fd6"/><circle cx="186" cy="136" r="14" fill="#5b2f9a"/></g>`,
      mito: [[110, 100], [290, 200], [285, 90]].map(p => `<ellipse class="cbp" data-p="mito" cx="${p[0]}" cy="${p[1]}" rx="24" ry="12" fill="#f59e0b" stroke="#a96205" stroke-width="2" transform="rotate(-25 ${p[0]} ${p[1]})"/>`).join("") };
    const order = plant ? ["wall", "cytoplasm", "membrane", "vacuole", "nucleus", "chloro", "mito"] : ["cytoplasm", "membrane", "nucleus", "mito"];
    svg.innerHTML = order.map(k => body[k]).join("");
    $$(".cbp", svg).forEach(n => { if (have.has(n.dataset.p)) n.classList.add("in"); });
  }
  function chips() {
    const box = $("#cbParts"); box.innerHTML = "";
    Object.keys(INFO).forEach(k => {
      const b = el("button", have.has(k) ? "on" : "", INFO[k][0]); b.setAttribute("aria-pressed", have.has(k));
      b.addEventListener("click", () => {
        if (have.has(k)) { have.delete(k); shapes(); chips(); upd(); return; }
        if (!NEED[type].includes(k)) { shake(b); $("#cbInfo").innerHTML = `<b>Not in this cell</b><p>${INFO[k][0]} is only found in plant cells. Animal cells do not have it.</p>`; $("#cbTip").textContent = "Wrong part: it bounced back out."; return; }
        have.add(k); shapes(); chips(); upd();
        $("#cbInfo").innerHTML = `<b>${INFO[k][0]}</b><p>${INFO[k][1]}</p>`;
        requestAnimationFrame(() => { const n = $(`[data-p="${k}"]`, svg); if (n) { n.classList.add("in"); } });
        if (NEED[type].every(x => have.has(x))) { built[type] = true; $("#cbTip").textContent = `Complete! That is a full ${type} cell.`; burstOn($("#cbSvg").parentElement, "#3fd9a0"); if (built.plant && built.animal) award("cell"); }
        else $("#cbTip").textContent = "Good. Keep adding parts.";
      });
      box.append(b);
    });
  }
  function upd() { const need = NEED[type], n = need.filter(x => have.has(x)).length; $("#tCell").textContent = n + "/" + need.length; $("#mCell").style.width = n / need.length * 100 + "%"; }
  $$("#cbTabs button").forEach(b => b.addEventListener("click", () => { type = b.dataset.c; $$("#cbTabs button").forEach(x => x.setAttribute("aria-selected", x === b)); have.clear(); shapes(); chips(); upd(); $("#cbInfo").innerHTML = "<b>Pick a part</b><p>Tap a part to try adding it to the cell.</p>"; $("#cbTip").textContent = type === "plant" ? "A plant cell has seven parts." : "An animal cell has four parts. Careful: some parts do not belong."; }));
  shapes(); chips(); upd();
})();

/* ================================================================ PRACTICE EXAM */
(function () {
  const LABELS = ["Life processes", "Tissues", "Cells & systems", "Mixtures", "Distillation", "Chromatography"];
  const sel = new Set([1, 2, 3, 4, 5, 6]);
  const pickHost = $("#quizPick");
  pickHost.className = "gx-row qpick";
  LABELS.forEach((l, k) => { const b = el("button", "", `L${k + 1} ${l}`); b.setAttribute("aria-pressed", "true"); b.addEventListener("click", () => { const on = !sel.has(k + 1); if (!on && sel.size === 1) return; on ? sel.add(k + 1) : sel.delete(k + 1); b.setAttribute("aria-pressed", on); }); pickHost.append(b); });
  let qs = [], idx = 0, score = 0, streak = 0, done = 0, quizEl = $("#quiz"), tpl = quizEl.innerHTML;
  const N = 20;
  function build() {
    quizEl.innerHTML = tpl;
    const pool = BANK.filter(b => sel.has(b[0]));
    qs = shuffle(pool).slice(0, N).map(r => ({ lesson: r[0], q: r[1], opts: shuffle([{ t: r[2], ok: true }, { t: r[3] }, { t: r[4] }, { t: r[5] }]), ex: r[6], picked: -1 }));
    idx = 0; score = 0; streak = 0; done = 0;
    $("#qTot").textContent = qs.length; $("#examSub").textContent = `${qs.length} questions drawn at random from a bank of ${BANK.length}. Answer orders reshuffle every time.`;
    wire(); show();
  }
  function wire() {
    $("#qPrev").addEventListener("click", () => { if (idx > 0) { idx--; show(); } });
    $("#qNext").addEventListener("click", () => { if (idx < qs.length - 1) { idx++; show(); } else if (done === qs.length) finish(); else { $("#qFb").hidden = false; $("#qFb").className = "quiz__fb no"; $("#qFb").textContent = "Answer every question first, then you can see your results."; } });
  }
  function show() {
    const q = qs[idx]; if (!q) return;
    $("#qNum").textContent = idx + 1; $("#qScore").textContent = score; $("#qDone").textContent = done; $("#qStreak").textContent = streak >= 3 ? "Streak " + streak : "";
    $("#qProg").style.width = (done / qs.length * 100) + "%"; $("#qText").textContent = q.q;
    const box = $("#qOpts"); box.innerHTML = ""; const fb = $("#qFb"); fb.hidden = true;
    q.opts.forEach((o, k) => {
      const b = el("button", "", o.t);
      b.addEventListener("click", () => {
        if (q.picked >= 0) return; q.picked = k; done++; if (o.ok) { score++; streak++; } else streak = 0; paint(); $("#qScore").textContent = score; $("#qDone").textContent = done; $("#qStreak").textContent = streak >= 3 ? "Streak " + streak : ""; $("#qProg").style.width = (done / qs.length * 100) + "%";
        if (o.ok) { popIt(b); burstOn(b, "#3fd9a0"); } else shake(b);
      });
      box.append(b);
    });
    function paint() { $$("button", box).forEach((b, k) => { b.disabled = true; if (q.opts[k].ok) b.classList.add("ok"); else if (k === q.picked) b.classList.add("no"); }); const ok = q.opts[q.picked].ok; fb.hidden = false; fb.className = "quiz__fb " + (ok ? "ok" : "no"); fb.innerHTML = (ok ? "<b>Correct.</b> " : "<b>Not quite.</b> The right answer is highlighted. ") + q.ex; }
    if (q.picked >= 0) { $$("button", box).forEach(b => b.disabled = true); paint(); }
    $("#qPrev").disabled = idx === 0; $("#qNext").textContent = idx === qs.length - 1 ? "See my results" : "Next";
  }
  function finish() {
    const pct = Math.round(score / qs.length * 100);
    const by = {}; qs.forEach(q => { by[q.lesson] = by[q.lesson] || [0, 0]; by[q.lesson][1]++; if (q.opts[q.picked].ok) by[q.lesson][0]++; });
    const weak = Object.keys(by).filter(k => by[k][0] / by[k][1] < 0.7).map(k => `<li>Lesson ${k}, ${LABELS[k - 1]}: ${by[k][0]} / ${by[k][1]}. <a href="#l${k}">Revise it</a></li>`);
    if (pct >= 80 && !prog.quiz) { prog.quiz = true; saveProg(); renderProgress(); toast("Badge earned! Exam 80%"); }
    quizEl.innerHTML = `<div class="qend"><h3>${pct}%</h3><p>${score} out of ${qs.length} correct. ${pct >= 80 ? "Excellent work, you are exam ready on this set!" : pct >= 60 ? "Good progress. Review the lessons below and try again." : "Keep going. Use the lessons and labs, then take a new exam."}</p>${weak.length ? `<p><b>Revisit these:</b></p><ul>${weak.join("")}</ul>` : "<p>No weak spots on this set.</p>"}<button class="btn" id="qAgain">Take a new exam</button></div>`;
    $("#qAgain").addEventListener("click", build);
  }
  $("#quizNew").addEventListener("click", build);
  build();
})();

/* ================================================================ REAL-PHOTO LABELLING */
(function () {
  const SETS = {
    onion: { name: "Onion cells", img: "photos/onion.jpg", alt: "Onion skin cells under a microscope, with thick dark cell walls", tasks: [
      ["Tap a cell wall (the thick dark outline of a cell).", .425, .14, "Cell wall", "Only plant cells have a cell wall. It strengthens and supports the cell."],
      ["Tap the inside of one cell (where the cytoplasm is).", .61, .45, "Cytoplasm", "Cytoplasm is where the chemical reactions happen."]] },
    elodea: { name: "Pondweed (Elodea)", img: "photos/elodea.jpg", alt: "Pondweed leaf cells full of green chloroplasts", tasks: [
      ["Tap a cluster of green chloroplasts.", .55, .30, "Chloroplasts", "Chloroplasts use sunlight for photosynthesis, so only plant cells have them."],
      ["Tap a clear area inside a cell (the large vacuole).", .25, .49, "Large vacuole", "The large vacuole stores water and nutrients and helps the cell keep its shape."]] },
    cheek: { name: "Cheek cell", img: "photos/cheek.jpg", alt: "A human cheek cell stained blue under a microscope", tasks: [
      ["Tap the nucleus (the small dark dot in the middle of the cell).", .505, .44, "Nucleus", "The nucleus controls the cell. Animal cells have one too."],
      ["Tap the cytoplasm (inside the cell, away from the nucleus).", .585, .50, "Cytoplasm", "Notice there is no cell wall: this is an animal cell."]] }
  };
  const done = {}; let cur = "onion", ti = 0, found = [];
  const tabs = $("#hsTabs"), img = $("#hsImg"), marks = $("#hsMarks"), q = $("#hsQ"), fb = $("#hsFb");
  Object.keys(SETS).forEach(k => { const b = el("button", "", SETS[k].name); b.setAttribute("role", "tab"); b.dataset.k = k; b.addEventListener("click", () => load(k)); tabs.append(b); });
  function load(k) {
    cur = k; ti = 0; found = []; marks.innerHTML = ""; fb.textContent = "";
    $$("button", tabs).forEach(b => b.setAttribute("aria-selected", b.dataset.k === k));
    img.src = SETS[k].img; img.alt = SETS[k].alt; prompt();
  }
  function prompt() { const set = SETS[cur]; q.textContent = ti < set.tasks.length ? `${ti + 1} of ${set.tasks.length}: ${set.tasks[ti][0]}` : "All found on this photo! Try another photo."; }
  img.addEventListener("click", e => {
    const set = SETS[cur]; if (ti >= set.tasks.length) return;
    const r = img.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, t = set.tasks[ti];
    const hit = Math.hypot(x - t[1], (y - t[2]) * r.height / r.width) < 0.075;
    if (hit) {
      const m = el("div", "hs__mark", `<b>${t[3]}</b>`); m.style.left = t[1] * 100 + "%"; m.style.top = t[2] * 100 + "%"; marks.append(m);
      fb.innerHTML = `<b>${t[3]}.</b> ${t[4]}`; ti++; prompt();
      if (ti >= set.tasks.length) { done[cur] = true; if (Object.keys(SETS).every(k => done[k])) award("photos"); }
    } else {
      const ring = el("div", "hs__ring"); ring.style.left = x * 100 + "%"; ring.style.top = y * 100 + "%"; marks.append(ring); setTimeout(() => ring.remove(), 800);
      fb.textContent = "Not there. Look again: " + t[0].toLowerCase(); shake(q);
    }
  });
  load("onion");
})();

/* ================================================================ BONUS GAME + PHOTO CREDITS */
$("#bonusPlay").addEventListener("click", () => { mountBonus($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
fetch("photos/credits.json").then(r => r.json()).then(c => {
  $("#credits").innerHTML = "Photo credits (all from Wikimedia Commons): " + Object.keys(c).map(k => `<a href="${c[k].page}" target="_blank" rel="noopener noreferrer">${c[k].file.replace(/\.[a-z]+$/i, "")}</a> by ${c[k].author}, <a href="${c[k].licenseUrl}" target="_blank" rel="noopener noreferrer">${c[k].license}</a>`).join("; ") + ".";
}).catch(() => { /* credits are a progressive enhancement */ });

renderProgress();
