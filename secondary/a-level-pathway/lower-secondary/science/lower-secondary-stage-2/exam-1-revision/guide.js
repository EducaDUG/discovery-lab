/* Exam 1 Revision Website: lessons 1-6. Plain ES module on top of engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=1";
import { mountBonus } from "./bonus.js?v=3";
import { buildCell3D } from "./cell3d.js?v=1";
import { $, $$, el, rnd, clamp, shuffle, shake, popIt, burstOn, T, L, isES, initLang, translateDom, observeDom, initProgress, flipCards, makeSorter, makeMatch, makeAnswer, makeOrder, rafLoop, rr, initHotspots, loadCredits, initQuiz, wireBooklet, reduced } from "../../../../../../engine/revision-kit.js?v=12";

await initLang();

/* ---------------------------------------------------------------- progress */
const LAB_NAMES = { dissolve: "Dissolve Lab", distil: "Distillation Lab", chroma: "Chromatography Lab", cell: "Cell Builder" };
const LAB_HOW = {
  dissolve: "Dissolve a solute, filter it, then evaporate the water to get the solute back",
  distil: "Collect at least 60% of the water by distillation AND let at least 60% escape by evaporation",
  chroma: "Run 3 different inks and solve at least 2 of the 3 forensic cases",
  cell: "Build a complete plant cell AND a complete animal cell"
};
const P = initProgress({
  store: "dl-ls2-exam1-revision-v1",
  badges: prog => [
    ...[1, 2, 3, 4, 5, 6].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
    ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
    ["3D cell", () => prog.labs.cell3d, "Tap all seven parts of the 3D cell"],
    ["Photo hunter", () => prog.labs.photos, "Real cells: find every part on all three microscope photos"],
    ["Bonus round", () => prog.labs.bonus, "Finish a Lab Bench Rush round"],
    ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award;

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
flipCards($("#mrsGrid"), MRS, 4);

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
$("#cellChart tbody").innerHTML = CELL.map((c, k) => `<tr class="cellrow" data-k="${k}"><th scope="row">${T(c[0])}</th><td><label><input type="checkbox" data-c="p" aria-label="${T(c[0])} ${T("in plant cell")}"> <span>${T("in plant cell")}</span></label></td><td><label><input type="checkbox" data-c="a" aria-label="${T(c[0])} ${T("in animal cell")}"> <span>${T("in animal cell")}</span></label></td></tr>`).join("");
$("#chartCheck").addEventListener("click", () => {
  let right = 0;
  $$(".cellrow").forEach(r => {
    const c = CELL[+r.dataset.k], p = $("[data-c=p]", r).checked, a = $("[data-c=a]", r).checked;
    const ok = p === !!c[1] && a === !!c[2]; right += ok ? 1 : 0; r.classList.toggle("ok", ok); r.classList.toggle("no", !ok);
  });
  $("#chartOut").textContent = right === CELL.length ? T("Perfect! Every row is right.") : `${right} ${T("of")} ${CELL.length} ${T("rows are right. Rows in red need another look.")}`;
});
$("#chartReset").addEventListener("click", () => { $$(".cellrow").forEach(r => { r.classList.remove("ok", "no"); $$("input", r).forEach(i => i.checked = false); }); $("#chartOut").textContent = ""; });

/* ordering ladder */
makeOrder($("#orderLadder"), [["Cell", "e.g. a muscle cell or a root hair cell"], ["Tissue", "e.g. muscle tissue or xylem"], ["Organ", "e.g. the heart or a leaf"], ["Organ system", "e.g. the circulatory system"]]);
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
    ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText(T("water = solvent"), BX + 6, BBOT + 22);
    if (und.length || dissolved.length) ctx.fillText(T("solute:") + " " + T(S.name), BX + 6, BBOT + 40);
    // stirrer
    if (mixing) { const sx = BX + BW / 2 + Math.sin(performance.now() / 90) * 40; ctx.strokeStyle = "#e6c37a"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx + 20, 40); ctx.lineTo(sx, BBOT - 30); ctx.stroke(); }
    // filter paper caught pile
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(T("Filter paper catch:") + " " + caught + " " + T("solid"), 20, 40);
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
  $$("#dtTabs button").forEach(b => b.addEventListener("click", () => { mode = b.dataset.m; $$("#dtTabs button").forEach(x => x.setAttribute("aria-selected", x === b)); $("#dtHud").textContent = T("Method:") + " " + T(mode === "distil" ? "distillation" : "evaporation"); reset(); }));
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
      ctx.fillStyle = "#cfe9ff"; ctx.font = "13px sans-serif"; ctx.fillText(T("condenser (cold water)"), 300, 185);
      // receiving beaker
      ctx.strokeStyle = "rgba(230,245,255,.85)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(430, 340); ctx.lineTo(430, 440); ctx.lineTo(530, 440); ctx.lineTo(530, 340); ctx.stroke();
      const wh = col * 0.55; ctx.fillStyle = "rgba(100,190,255,.75)"; ctx.fillRect(432, 438 - wh, 96, wh);
      ctx.fillStyle = "#fff"; ctx.fillText(T("pure water collected"), 425, 462 > 470 ? 470 : 466);
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
      ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText(T("flask: salt water"), 70, 435);
    } else {
      // open dish
      const dl = 420 - (W / 100) * 40;
      ctx.beginPath(); ctx.moveTo(200, 380); ctx.lineTo(450, 380); ctx.lineTo(430, 425); ctx.lineTo(220, 425); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.fillStyle = "rgba(100,170,230,.7)"; ctx.fillRect(190, dl - 5, 270, 60);
      if (W <= 0) { ctx.fillStyle = "#f5f5f0"; for (let i = 0; i < 60; i++) ctx.fillRect(225 + (i * 31) % 195, 405 + (i % 3) * 5, 7, 7); }
      ctx.restore();
      ctx.strokeStyle = "rgba(230,245,255,.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(200, 380); ctx.lineTo(220, 425); ctx.lineTo(430, 425); ctx.lineTo(450, 380); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText(T("open dish: salt water"), 240, 445);
    }
    // flame
    if (heat) { const bx = mode === "distil" ? 150 : 325; for (let i = -1; i <= 1; i++) { const fh = 26 + Math.sin(performance.now() / 90 + i * 2) * 8; ctx.fillStyle = "rgba(255,160,40,.92)"; ctx.beginPath(); ctx.moveTo(bx + i * 18 - 9, 450); ctx.quadraticCurveTo(bx + i * 18, 450 - fh * 1.4, bx + i * 18 + 9, 450); ctx.fill(); } }
    ctx.fillStyle = "#666"; ctx.fillRect((mode === "distil" ? 150 : 325) - 28, 444, 56, 10);
    // vapour & drops
    vap.forEach(v => { ctx.fillStyle = `rgba(235,245,255,${clamp(v.a, 0, 1) * 0.85})`; ctx.beginPath(); ctx.arc(v.x, v.y, 3.5, 0, 6.28); ctx.fill(); });
    ctx.fillStyle = "rgba(120,200,255,.95)"; drops.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, 3.2, 0, 6.28); ctx.fill(); });
    if (mode === "evap") { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "13px sans-serif"; ctx.fillText(T("vapour escapes into the air"), 240, 60); }
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
  $("#chInk").innerHTML = Object.keys(INKS).map(k => `<option value="${k}">${T(INKS[k][0])}</option>`).join("");
  const P = 270, START = 360;
  let ink = "black", front = 0, running = false, speed = 2, ran = new Set(), fo = null, foScore = 0, foRounds = 0, evid = null, finished = false;
  const SPD = [0, "Slow", "Normal", "Fast"];
  $("#chSpeed").addEventListener("input", e => { speed = +e.target.value; $("#chSLbl").textContent = T(SPD[speed]); });
  $("#chInk").addEventListener("change", () => { ink = $("#chInk").value; resetPaper(); });
  function resetPaper() { front = 0; running = false; finished = false; $("#chRun").textContent = "Start the solvent"; $("#chHud").textContent = T(INKS[ink][0]) + ": " + T("ready"); $("#chInfo").innerHTML = "<b>Dyes found</b><p>Start the solvent to see which dyes are in the ink.</p>"; }
  $("#chReset").addEventListener("click", resetPaper);
  $("#chRun").addEventListener("click", () => {
    if (finished) { resetPaper(); }
    running = !running; $("#chRun").textContent = running ? "Pause" : "Start the solvent";
  });
  resetPaper();
  function report() {
    const dyes = [...INKS[ink][1]].sort((a, b) => b[1] - a[1]);
    $("#chInfo").innerHTML = `<b>${T(INKS[ink][0])}: ${dyes.length === 1 ? T("one dye (a pure ink)") : dyes.length + " " + T("dyes (a mixture)")}</b><p>${dyes.map(d => `${T(DYE[d[0]][0])}: ${T("moved")} ${(d[1] * front / P * 9.5).toFixed(1)} cm`).join("<br>")}</p><p class="tip">${T("The most soluble dye travelled furthest.")}</p>`;
  }
  function newCase() {
    const keys = ["penA", "penB", "penC"]; evid = keys[Math.floor(Math.random() * 3)];
    $("#foPrompt").textContent = `${T("Case")} ${foRounds + 1} ${T("of")} 3: ${T("a threatening note was written with one of these pens. The note's chromatogram is shown on the right of the paper. Run each pen, then choose the match.")}`;
    const box = $("#foChoices"); box.innerHTML = "";
    keys.forEach(k => { const b = el("button", "btn btn--ghost", INKS[k][0] + " matches"); b.addEventListener("click", () => {
      if (!fo) return;
      if (k === evid) { foScore++; $("#foPrompt").textContent = "Correct! The dyes and how far each one travelled match the note."; } else $("#foPrompt").textContent = T("Not a match. The answer was") + " " + T(INKS[evid][0]) + ": " + T("compare the number and height of the spots.");
      foRounds++; $("#foScore").textContent = `${T("Cases solved")} ${foScore} / ${foRounds}`; fo = null; box.innerHTML = "";
      const nx = el("button", "btn", foRounds >= 3 ? "Finish" : "Next case"); nx.addEventListener("click", () => { if (foRounds >= 3) { $("#foPrompt").textContent = `${T("Forensic report:")} ${foScore} ${T("of")} 3 ${T("cases solved.")}`; evid = null; fo = null; $("#foBtn").textContent = "Try again"; if (foScore >= 2) { solved = true; check(); } nx.remove(); } else { fo = true; newCase(); } });
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
    ctx.fillStyle = "#cfe4dc"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.fillText(T(label), x + 65, 48); ctx.textAlign = "left";
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
    ctx.fillStyle = "#e0e0e0"; ctx.font = "12px sans-serif"; ctx.fillText(T("pencil start line"), sx + 134, START + 4); ctx.fillText(T("solvent (mobile phase)"), bx0 + 4, 456); ctx.fillText(T("paper = stationary phase"), sx + 134, 90);
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
        if (!NEED[type].includes(k)) { shake(b); $("#cbInfo").innerHTML = `<b>${T("Not in this cell")}</b><p>${T(INFO[k][0])} ${T("is only found in plant cells. Animal cells do not have it.")}</p>`; $("#cbTip").textContent = "Wrong part: it bounced back out."; return; }
        have.add(k); shapes(); chips(); upd();
        $("#cbInfo").innerHTML = `<b>${T(INFO[k][0])}</b><p>${T(INFO[k][1])}</p>`;
        requestAnimationFrame(() => { const n = $(`[data-p="${k}"]`, svg); if (n) { n.classList.add("in"); } });
        if (NEED[type].every(x => have.has(x))) { built[type] = true; $("#cbTip").textContent = `${T("Complete!")} ${T(type === "plant" ? "That is a full plant cell." : "That is a full animal cell.")}`; burstOn($("#cbSvg").parentElement, "#3fd9a0"); if (built.plant && built.animal) award("cell"); }
        else $("#cbTip").textContent = "Good. Keep adding parts.";
      });
      box.append(b);
    });
  }
  function upd() { const need = NEED[type], n = need.filter(x => have.has(x)).length; $("#tCell").textContent = n + "/" + need.length; $("#mCell").style.width = n / need.length * 100 + "%"; }
  $$("#cbTabs button").forEach(b => b.addEventListener("click", () => { type = b.dataset.c; $$("#cbTabs button").forEach(x => x.setAttribute("aria-selected", x === b)); have.clear(); shapes(); chips(); upd(); $("#cbInfo").innerHTML = "<b>Pick a part</b><p>Tap a part to try adding it to the cell.</p>"; $("#cbTip").textContent = type === "plant" ? "A plant cell has seven parts." : "An animal cell has four parts. Careful: some parts do not belong."; }));
  shapes(); chips(); upd();
})();


/* ================================================================ 3D CELL */
buildCell3D({ award });

/* ================================================================ PRACTICE EXAM */
initQuiz({ BANK, labels: ["Life processes", "Tissues", "Cells & systems", "Mixtures", "Distillation", "Chromatography"], first: 1, award, P });

/* ================================================================ REAL-PHOTO LABELLING */
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
initHotspots(SETS, "onion", award);

/* ================================================================ BONUS GAME + PHOTO CREDITS + BOOKLET + TRANSLATION */
$("#bonusPlay").addEventListener("click", () => { mountBonus($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
loadCredits($("#credits"));
wireBooklet("Exam-1-Revision-Booklet");
P.render();
translateDom();
observeDom();
