/* Exam 4 Revision Website: lessons 17-20 (Acids and Bases, Electric Circuits, Series and Parallel, Changing the Current).
   Plain ES module on top of engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=1";
import { mountGallery } from "./bonus.js?v=3";
import { buildHero, buildNeutral, buildCircuit, buildCurrent } from "./labs.js?v=9";
import { $, $$, el, rnd, shuffle, popIt, T, initLang, translateDom, observeDom, initProgress, makeSorter, makeMatch, makeAnswer, makeOrder, initHotspots, loadCredits, initQuiz, wireBooklet } from "../../../../../../engine/revision-kit.js?v=16";

await initLang();

/* ---------------------------------------------------------------- progress */
const LAB_NAMES = { neutral: "Neutralisation Lab", circuit: "Circuit Workshop", current: "Current Lab" };
const LAB_HOW = {
  neutral: "Neutralise 3 different acid and base pairs, using at least 2 different acids",
  circuit: "Finish all six circuit tasks in the Circuit Workshop",
  current: "Hit 4 target currents in the Current Lab"
};
const P = initProgress({
  store: "dl-ls2-exam4-revision-v1",
  badges: prog => [
    ...[17, 18, 19, 20].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
    ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
    ["Photo hunter", () => prog.labs.photos, "Real photos: find every part on all four photos"],
    ["Symbol master", () => prog.labs.symbols, "Match all the circuit symbols correctly"],
    ["Ohm's law", () => prog.labs.ohm, "Answer 5 Ohm's law questions correctly in a row"],
    ["Reaction Range", () => prog.labs.bonus, "Finish a Reaction Range round"],
    ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award;

/* ---------------------------------------------------------------- Lesson 17: acids and bases */
makeMatch($("#matchAB"), [
  ["Acid", "pH less than 7"], ["Base", "pH greater than 7"], ["Alkali", "A base that dissolves in water"],
  ["Neutralisation", "An acid reacts with a base"], ["Salt", "A product of neutralisation, with water"]
]);
makeSorter($("#sortAB"), [
  ["Vinegar, pH 3", 0, "Below 7: an acid."], ["Soap solution, pH 9", 1, "Above 7: a base (an alkali)."], ["Stomach acid, pH 1", 0, "Strong acid, very low pH."],
  ["Sodium hydroxide, pH 14", 1, "Strong alkali, very high pH."], ["Lemon juice, pH 2", 0, "Below 7: an acid."], ["Baking soda solution, pH 9", 1, "Above 7: a weak alkali."],
  ["Toothpaste, pH 8", 1, "Above 7: a weak alkali."], ["Pure water, pH 7", 2, "Exactly 7: neutral."]
], ["Acid", "Base", "Neutral"]);
makeSorter($("#sortStrength"), [
  ["Hydrochloric acid", 0, "A strong acid."], ["Citric acid in lemons", 1, "A weak acid."], ["Sodium hydroxide", 2, "A strong alkali."], ["Baking soda", 3, "A weak alkali."],
  ["Sulfuric acid", 0, "A strong acid."], ["Ethanoic acid in vinegar", 1, "A weak acid."], ["Potassium hydroxide", 2, "A strong alkali."]
], ["Strong acid", "Weak acid", "Strong alkali", "Weak alkali"]);
makeOrder($("#orderNeutral"), [
  ["Start with an acid", "pH is low, below 7"], ["Add a base a little at a time", "Use a dropper or burette"], ["Watch the indicator", "The colour changes"], ["The pH reaches 7", "Neither acid nor alkali is left"], ["Salt and water are made", "That is neutralisation"]
]);
makeMatch($("#matchSalts"), [
  ["Hydrochloric acid + sodium hydroxide", "Sodium chloride"], ["Sulfuric acid + potassium hydroxide", "Potassium sulfate"],
  ["Nitric acid + calcium hydroxide", "Calcium nitrate"], ["Hydrochloric acid + magnesium oxide", "Magnesium chloride"]
]);
makeSorter($("#sortGas"), [
  ["Acid + magnesium metal", 0, "Acid + metal gives a salt and hydrogen."], ["Vinegar + baking soda", 1, "Acid + carbonate gives carbon dioxide."], ["Acid + chalk (calcium carbonate)", 1, "Carbonates give off carbon dioxide."],
  ["Acid + zinc", 0, "Reactive metals give hydrogen."], ["Burning splint pops", 0, "The squeaky pop test is for hydrogen."], ["Limewater goes cloudy", 1, "That is the test for carbon dioxide."]
], ["Hydrogen", "Carbon dioxide"]);
makeMatch($("#matchInd"), [
  ["Litmus in acid", "Red"], ["Litmus in alkali", "Blue"], ["Phenolphthalein in alkali", "Pink"], ["Methyl orange in acid", "Red"], ["Methyl orange in alkali", "Yellow"]
]);
makeSorter($("#sortUses"), [
  ["Antacid tablets treat heartburn", 0, "A base neutralises extra stomach acid."], ["Lime is spread on acidic soil", 1, "A base neutralises acidic soil so crops grow."], ["Baking soda paste eases an acidic bee sting", 3, "A base neutralises an acidic sting."],
  ["Factories neutralise acidic waste before release", 2, "This protects rivers and wildlife."], ["Toothpaste is a weak alkali", 3, "It neutralises acids made by bacteria on teeth."]
], ["Medicine", "Farming", "Industry", "Everyday life"]);
makeAnswer($("#ans1"), [
  ["Neutralisation makes acidic or alkaline substances safer.", true],
  ["In medicine, antacids are bases that neutralise extra stomach acid.", true],
  ["In agriculture, lime is added to acidic soil so crops can grow.", true],
  ["In industry, acidic waste water is neutralised so it does not harm rivers and wildlife.", true],
  ["The reaction makes a salt and water, which are much less harmful.", true],
  ["Neutralisation makes acids stronger.", false],
  ["Neutralisation is only needed in laboratories.", false],
  ["Industries never need neutralisation.", false]
], $("#ans1Check"), $("#ans1Reset"), $("#ans1Out"));

/* ---------------------------------------------------------------- Lesson 18: circuits */
function symSVG(k) {
  const st = 'fill="none" stroke="#e1f0e9" stroke-width="3" stroke-linecap="round"'; const tx = c => `<text x="40" y="38" text-anchor="middle" fill="#e1f0e9" font-size="22" font-weight="800">${c}</text>`;
  const g = {
    cell: `<path ${st} d="M4 30h24M52 30h24"/><path ${st} stroke-width="4" d="M28 12v36"/><path ${st} stroke-width="4" d="M42 20v20"/><text x="18" y="12" fill="#e1f0e9" font-size="12" font-weight="800">+</text>`,
    lamp: `<path ${st} d="M4 30h18M58 30h18"/><circle ${st} cx="40" cy="30" r="18"/><path ${st} d="M27 17l26 26M53 17L27 43"/>`,
    switch: `<path ${st} d="M4 40h22M54 40h22"/><circle cx="26" cy="40" r="3" fill="#e1f0e9"/><circle cx="54" cy="40" r="3" fill="#e1f0e9"/><path ${st} d="M26 40l24-20"/>`,
    resistor: `<path ${st} d="M4 30h14M62 30h14"/><rect ${st} x="18" y="20" width="44" height="20"/>`,
    ammeter: `<path ${st} d="M4 30h18M58 30h18"/><circle ${st} cx="40" cy="30" r="18"/>${tx("A")}`,
    voltmeter: `<path ${st} d="M4 30h18M58 30h18"/><circle ${st} cx="40" cy="30" r="18"/>${tx("V")}`
  }[k];
  return `<svg viewBox="0 0 80 60" aria-hidden="true">${g}</svg>`;
}
const SYMS = [["cell", "Cell", "Supplies energy to the circuit"], ["lamp", "Lamp", "Lights up when current flows"], ["switch", "Switch", "Opens or closes the circuit"], ["resistor", "Resistor", "Limits the current"], ["ammeter", "Ammeter", "Measures current (in series)"], ["voltmeter", "Voltmeter", "Measures voltage (in parallel)"]];
$("#symGrid").innerHTML = SYMS.map(s => `<div class="sym__c"><span class="sym__i">${symSVG(s[0])}</span><b>${T(s[1])}</b><small>${T(s[2])}</small></div>`).join("");
makeMatch($("#matchSym"), SYMS.map(s => [s[1], s[2]]), () => award("symbols"));
makeMatch($("#matchComp"), [
  ["Battery", "Powers the circuit"], ["Wire", "Allows current to flow"], ["Bulb", "Lights up when current flows"], ["Buzzer", "Makes sound when current flows"], ["Switch", "Opens or closes the circuit"]
]);
makeSorter($("#sortComplete"), [
  ["Battery, wires and a bulb in a closed loop", 0, "A complete loop with a power source and a component works."], ["Battery, wires and a buzzer with the switch closed", 0, "A closed loop: the buzzer sounds."],
  ["A bulb and a battery with a gap in the wire", 1, "A gap breaks the circuit, so no current flows."], ["A bulb and wires but no cell", 1, "There is no power source."], ["Battery, ruler and wire", 1, "A plastic ruler is an insulator: it cannot complete the circuit."],
  ["Battery, metal paperclip and bulb in a loop", 0, "Metals conduct, so the loop is complete."]
], ["Works", "Does not work"]);
makeSorter($("#sortCond"), [
  ["Copper wire", 0, "A metal: a good conductor."], ["Plastic coating on a wire", 1, "An insulator: it keeps the user safe."], ["Aluminium foil", 0, "A metal conductor."], ["Rubber glove", 1, "An insulator."],
  ["Iron nail", 0, "A metal conductor."], ["Dry wood", 1, "An insulator."], ["Glass", 1, "An insulator."]
], ["Conductor", "Insulator"]);
makeAnswer($("#ans2"), [
  ["Connect a cell, a switch and a lamp in one complete loop with wires.", true],
  ["The cell supplies the energy to push the current round the circuit.", true],
  ["The switch opens or closes the circuit, turning the lamp off or on.", true],
  ["The lamp lights when current flows through it.", true],
  ["Close the switch to test it: if the lamp stays off, check every connection.", true],
  ["Use metal wires because metals are good conductors.", true],
  ["Leave a gap in the wire so the lamp can breathe.", false],
  ["Use a plastic wire to carry the current.", false]
], $("#ans2Check"), $("#ans2Reset"), $("#ans2Out"));

/* ---------------------------------------------------------------- Lesson 19: series and parallel */
makeMatch($("#matchCirc"), [
  ["Series", "One single loop"], ["Parallel", "More than one path (branches)"], ["Bulb breaks, all go out", "Series circuit"], ["Current is shared", "Parallel circuit"]
]);
makeSorter($("#sortSP"), [
  ["One single loop", 0, "A series circuit has one loop."], ["Other bulbs stay on if one blows", 1, "Parallel branches work independently."], ["Current is the same everywhere", 0, "Only one path, so the same current."],
  ["Voltage is shared between bulbs", 0, "Each bulb gets part of the cell's voltage."], ["Each branch has the full cell voltage", 1, "Every branch is across the cell."], ["Used for household lights", 1, "So each light works on its own."],
  ["Adding bulbs makes them dimmer", 0, "More resistance means less current."], ["Adding bulbs does not dim the others", 1, "Each branch has its own path."]
], ["Series", "Parallel"]);
makeSorter($("#sortWhy"), [
  ["Why are household lights wired in parallel?", 0, "So each light works independently and at full brightness."], ["Why did old fairy lights all go out when one bulb blew?", 1, "They were wired in series."],
  ["Why do modern fairy lights keep shining if one blows?", 2, "Modern ones use parallel branches."]
], ["So each light works on its own", "They were wired in series", "They use parallel branches"]);
makeAnswer($("#ans3"), [
  ["Series has one loop; parallel has branches.", true],
  ["In series the current is the same everywhere; in parallel it is shared between branches.", true],
  ["In series the voltage is shared; in parallel every branch gets the full cell voltage.", true],
  ["Bulbs in series get dimmer as more are added; bulbs in parallel stay bright.", true],
  ["If one bulb blows, a series circuit goes off but a parallel circuit stays on.", true],
  ["Houses use parallel circuits so lights and appliances work independently; series is rarely used for lighting.", true],
  ["Series circuits are brighter than parallel ones.", false],
  ["Parallel circuits have no cell.", false]
], $("#ans3Check"), $("#ans3Reset"), $("#ans3Out"));

/* ---------------------------------------------------------------- Lesson 20: current */
makeMatch($("#matchDef"), [
  ["Current", "The flow of electric charge (electrons)"], ["Voltage", "The push that makes current flow"], ["Resistance", "Anything that slows down the current"], ["Ammeter", "Measures current in amps"], ["Volt", "The unit of voltage"]
]);
makeSorter($("#sortChange"), [
  ["Increase the voltage (same resistance)", 0, "More push gives more current."], ["Increase the resistance (same voltage)", 1, "More resistance gives less current."], ["Add a second cell in series", 0, "More voltage gives more current."],
  ["Add a second bulb in series", 1, "More resistance gives less current."], ["Add a second bulb in parallel (total from the cell)", 0, "A new path lets more current flow overall."], ["Turn a variable resistor up", 1, "More resistance, less current."], ["Use a thicker wire", 0, "Less resistance gives more current."], ["Use a longer wire", 1, "More resistance gives less current."]
], ["Current increases", "Current decreases"]);
/* Ohm's law practice: pick the right answer, five in a row */
(function () {
  const host = $("#ohmHost"); let streak = 0, q = null;
  const show = () => {
    const kind = ["I", "V", "R"][Math.floor(Math.random() * 3)]; let a, b, ans, text, unit, opts;
    if (kind === "I") { b = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)]; ans = [1, 2, 3, 4][Math.floor(Math.random() * 4)]; a = ans * b; text = `${a} V ${T("across")} ${b} Ω. ${T("What is the current?")}`; unit = " A"; }
    else if (kind === "V") { a = [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)]; b = [2, 3, 4, 5][Math.floor(Math.random() * 4)]; ans = a * b; text = `${a} A ${T("through")} ${b} Ω. ${T("What is the voltage?")}`; unit = " V"; }
    else { b = [1, 2, 3, 4][Math.floor(Math.random() * 4)]; ans = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)]; a = ans * b; text = `${a} V ${T("and")} ${b} A. ${T("What is the resistance?")}`; unit = " Ω"; }
    const set = new Set([ans]); while (set.size < 4) { const d = ans + [-3, -2, -1, 1, 2, 3, 6][Math.floor(Math.random() * 7)]; if (d > 0) set.add(d); } opts = shuffle([...set]);
    q = { ans, unit };
    host.innerHTML = `<p class="ohm__q"><b>${text}</b></p><div class="ohm__o">${opts.map(o => `<button type="button" class="btn btn--ghost" data-v="${o}">${o}${unit}</button>`).join("")}</div><p class="ohm__s">${T("In a row")}: <b>${streak}</b> / 5</p><p class="ohm__f" aria-live="polite"></p>`;
    $$("button", host).forEach(btn => btn.addEventListener("click", () => {
      const ok = +btn.dataset.v === q.ans; popIt(btn); btn.classList.add(ok ? "ohm__ok" : "ohm__no");
      $(".ohm__f", host).innerHTML = ok ? `<b>${T("Correct!")}</b> ${kind === "I" ? "I = V ÷ R" : kind === "V" ? "V = I × R" : "R = V ÷ I"}` : `<b>${T("Not quite.")}</b> ${T("The answer is")} ${q.ans}${q.unit}. ${kind === "I" ? "I = V ÷ R" : kind === "V" ? "V = I × R" : "R = V ÷ I"}`;
      streak = ok ? streak + 1 : 0; if (streak >= 5) { award("ohm"); streak = 0; } $$("button", host).forEach(x => x.disabled = true); setTimeout(show, 1100);
    }));
  };
  show();
})();
makeAnswer($("#ans4"), [
  ["Voltage is the push, resistance slows the current, and current is the flow of charge.", true],
  ["They are linked by V = I × R, so I = V ÷ R.", true],
  ["Increasing the voltage with fixed resistance increases the current.", true],
  ["Increasing the resistance with fixed voltage decreases the current.", true],
  ["A practical use: a dimmer switch (variable resistor) changes the resistance to control the current in a lamp.", true],
  ["Controlling the current can protect components or save energy, for example in a fuse or a speed control.", true],
  ["Voltage and resistance never affect the current.", false],
  ["A bigger resistance gives a bigger current.", false]
], $("#ans4Check"), $("#ans4Reset"), $("#ans4Out"));

/* ---------------------------------------------------------------- real-photo tap-the-part */
initHotspots({
  multimeter: { name: "Multimeter", img: "photos/multimeter.jpg", alt: "A yellow digital multimeter on a wooden table with red and black test leads", tasks: [
    ["Tap the display where the reading appears.", .47, .145, "Display", "A multimeter shows the measured value of voltage, current or resistance on its display."],
    ["Tap the round dial that selects what to measure.", .48, .265, "Dial", "The dial chooses voltage, current or resistance and the range."],
    ["Tap the red test lead (probe).", .10, .30, "Red lead", "The red lead is connected to the positive side; the black lead goes to the negative side."]] },
  fizz: { name: "Fizzing reaction", img: "photos/fizz.jpg", alt: "A glass beaker full of white foam and bubbles made by baking soda and vinegar", tasks: [
    ["Tap the foam of bubbles at the top of the liquid.", .60, .52, "Bubbles of carbon dioxide", "The fizz is carbon dioxide gas from acid + carbonate."],
    ["Tap the volume scale printed on the beaker.", .52, .24, "Measuring scale", "Scientists read the volume from the scale printed on the glass."]] },
  bulb: { name: "Filament bulb", img: "photos/bulb.jpg", alt: "A glowing filament light bulb with a coiled wire", tasks: [
    ["Tap the glowing filament.", .45, .55, "Filament", "A thin coiled wire with high resistance: it gets so hot it glows."],
    ["Tap the glass bulb.", .58, .48, "Glass bulb", "The glass keeps air out so the filament does not burn away."]] },
  blue: { name: "Acid reaction", img: "photos/bluereact.jpg", alt: "A glass with blue liquid and foam while a spoon adds powder", tasks: [
    ["Tap the foam on top of the liquid.", .45, .50, "Foam", "Gas bubbles from the reaction make the foam."],
    ["Tap the spoon at the top.", .35, .06, "Spoon", "A reagent is added a little at a time so the reaction stays safe."]] }
}, "multimeter", award);

/* ---------------------------------------------------------------- 3D hero and labs */
buildHero();
buildNeutral(award);
buildCircuit(award);
buildCurrent(award);

/* ---------------------------------------------------------------- practice exam */
initQuiz({ BANK, labels: ["Acids and bases", "Electric circuits", "Series and parallel", "Changing the current"], first: 17, award, P });

/* register dynamic strings so the Spanish dictionary can be proven complete */
["Acid + base", "Complete circuit", "Neutralised!", "water", "carbon dioxide", "The pH is about 7: no acid or alkali is left over.", "Too much base!", "The mixture is now alkaline. Press Start again and add the base more slowly near pH 7.", "Still acidic", "Keep adding the base a little at a time and watch the indicator change colour.",
 "Hold to add the base", "Neutralised! Pick another acid or base and try again.", "Series circuit", "Parallel circuit", "Bulb", "blown", "lit", "off", "Open the switch", "Close the switch", "Target", "On target!",
 "The switch is open, so the circuit is broken and no current flows.", "A blown bulb breaks the only loop, so every bulb goes out.", "Series: the same current flows through every bulb, and the cell's voltage is shared between them, so the bulbs are dimmer.", "One bulb on one cell. This is the reference brightness.",
 "Parallel: every bulb gets the full cell voltage, so each is as bright as a single bulb. The cell supplies more current in total, and a blown bulb leaves the others on.",
 "Build a series circuit with 3 bulbs", "Build a parallel circuit with 3 bulbs", "Blow a bulb in a series circuit", "Blow a bulb in a parallel circuit", "Add a second cell", "Open the switch",
 "across", "through", "and", "What is the current?", "What is the voltage?", "What is the resistance?", "In a row", "Correct!", "Not quite.", "The answer is",
 "3D view is not available on this device. Everything else on the page still works.", "Neutralisation Lab", "Circuit Workshop", "Current Lab", "Photo hunter", "Symbol master", "Ohm's law", "Reaction Range", "Exam 80%",
 "Neutralise 3 different acid and base pairs, using at least 2 different acids", "Finish all six circuit tasks in the Circuit Workshop", "Hit 4 target currents in the Current Lab", "Real photos: find every part on all four photos", "Match all the circuit symbols correctly", "Answer 5 Ohm's law questions correctly in a row", "Finish a Reaction Range round", "Score 80% or more on a 20-question practice exam",
 "Lesson 17", "Lesson 18", "Lesson 19", "Lesson 20", "Press “Mark lesson complete” on Lesson 17", "Press “Mark lesson complete” on Lesson 18", "Press “Mark lesson complete” on Lesson 19", "Press “Mark lesson complete” on Lesson 20",
 "Cell", "Lamp", "Switch", "Resistor", "Ammeter", "Voltmeter", "Supplies energy to the circuit", "Lights up when current flows", "Opens or closes the circuit", "Limits the current", "Measures current (in series)", "Measures voltage (in parallel)"].forEach(T);

/* ---------------------------------------------------------------- bonus + credits + booklet + translation */
$("#bonusPlay").addEventListener("click", () => { mountGallery($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
loadCredits($("#credits"));
wireBooklet("Exam-4-Revision-Booklet");
P.render();
translateDom();
observeDom();
