/* Exam 6 Revision Website: lessons 29-33 (Force and Mass, Friction and Sport, Pressure, Variation in Animals, Adaptations and Environmental Effects).
   Plain ES module on top of engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=1";
import { mountSafari } from "./bonus.js?v=3";
import { buildHero, buildSpring, buildFriction, buildPressure, buildSelection } from "./labs.js?v=5";
import { $, $$, T, shuffle, popIt, initLang, translateDom, observeDom, initProgress, makeSorter, makeMatch, makeAnswer, makeOrder, initHotspots, loadCredits, initQuiz, wireBooklet } from "../../../../../../engine/revision-kit.js?v=19";

await initLang();

/* ---------------------------------------------------------------- progress */
const LAB_NAMES = { spring: "Spring Lab", friction: "Friction Lab", pressure: "Pressure Lab", selection: "Natural Selection Lab" };
const LAB_HOW = {
  spring: "Record 5 points, try the Moon and stretch a spring past its elastic limit",
  friction: "Try 3 surfaces, reach a steady speed and then slow down",
  pressure: "Try all four footwear options and get one low and one very high pressure",
  selection: "Breed the fish to the 4th generation and watch the colours change"
};
const P = initProgress({
  store: "dl-ls2-exam6-revision-v1",
  badges: prog => [
    ...[29, 30, 31, 32, 33].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
    ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
    ["Photo hunter", () => prog.labs.photos, "Real photos: find every part on all four photos"],
    ["Calculator", () => prog.labs.calc, "Answer 5 calculation questions correctly in a row"],
    ["Camouflage Safari", () => prog.labs.bonus, "Finish a Camouflage Safari round"],
    ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award;

/* ---------------------------------------------------------------- Lesson 29 */
makeMatch($("#matchForce"), [
  ["Gravity", "An object falling to the ground"], ["Friction", "Brakes slowing down a bicycle"], ["Air resistance", "A skydiver slowing down with a parachute"], ["Magnetic force", "A magnet picking up paperclips"], ["Tension", "Holding a stretched spring"]
]);
makeSorter($("#sortContact"), [
  ["Friction between shoes and the floor", 0, "Surfaces touch: a contact force."], ["Gravity pulling an apple down", 1, "Gravity acts without touching."], ["A magnet attracting a pin", 1, "Magnetic forces act at a distance."],
  ["Air resistance on a parachute", 0, "Air touches the parachute."], ["Tension in a rope", 0, "The rope pulls at its ends."], ["Pushing a door open", 0, "Your hand touches the door."]
], ["Contact force", "Non-contact force"]);
makeSorter($("#sortMW"), [
  ["Measured in kilograms (kg)", 0, "Mass is in kg."], ["Measured in newtons (N)", 1, "Weight is a force in N."], ["The amount of matter in an object", 0, "That is mass."], ["The force of gravity on an object", 1, "That is weight."],
  ["Stays the same on the Moon", 0, "Mass does not change."], ["Changes when gravity changes", 1, "Weight depends on g."]
], ["Mass", "Weight"]);
makeMatch($("#matchSpring"), [
  ["Extension", "How much longer the spring is than at the start"], ["Elastic limit", "The point beyond which a spring is permanently changed"], ["Elastic behaviour", "The spring stretches and then returns to its shape"],
  ["Hooke's law", "Extension is directly proportional to the force"], ["Permanent change", "The spring will not return to its shape"]
]);
makeAnswer($("#ans1"), [
  ["Mass is the amount of matter in an object; weight is the force of gravity acting on it.", true],
  ["Mass is measured in kilograms (kg); weight is measured in newtons (N).", true],
  ["Mass stays the same everywhere; weight changes when gravity changes.", true],
  ["They are linked by weight = mass × gravity (on Earth g is about 10 N/kg).", true],
  ["For example, a 5 kg object weighs 50 N on Earth but much less on the Moon.", true],
  ["Mass and weight are exactly the same thing.", false],
  ["Weight is measured in kilograms.", false],
  ["Mass changes when you go to the Moon.", false]
], $("#ans1Check"), $("#ans1Reset"), $("#ans1Out"));

/* ---------------------------------------------------------------- Lesson 30 */
makeMatch($("#matchFric"), [
  ["Air resistance", "A parachute slowing a skydiver"], ["Water resistance", "Swimming through a pool"], ["Surface friction", "Skis on snow"], ["Useful friction", "Trainers gripping a football pitch"], ["Reduced friction", "Oil on a bicycle chain"]
]);
makeSorter($("#sortSport"), [
  ["Ice skating", 0, "Skates need to glide."], ["Skiing", 0, "Skis must slide over snow."], ["Swimming", 0, "Water resistance slows swimmers down."], ["Running", 1, "Shoes need grip."], ["Rock climbing", 1, "Climbers need grip."], ["Football", 1, "Studs grip the grass."]
], ["Want LOW friction", "Want HIGH friction"]);
makeSorter($("#sortBal"), [
  ["A car driving at a steady 50 km/h", 0, "Balanced forces: constant speed."], ["A ball slowing down on grass", 1, "Unbalanced: friction slows it."], ["A rocket launching", 1, "Unbalanced: thrust is bigger than weight."],
  ["A book resting on a table", 0, "Balanced forces: no change."], ["A cyclist speeding up downhill", 1, "Unbalanced: gravity along the slope wins."], ["A parachutist falling at a steady speed", 0, "Balanced: weight equals air resistance."]
], ["Balanced forces", "Unbalanced forces"]);
makeMatch($("#matchSpeed"), [
  ["Speed", "Distance travelled in a certain time"], ["Acceleration", "Speed going up"], ["Deceleration", "Speed going down"], ["Constant speed", "Speed staying the same"], ["Force", "A push or a pull"]
]);
makeSorter($("#sortGraph"), [
  ["A flat line above zero", 0, "Constant speed."], ["A line rising upwards", 1, "Speeding up: acceleration."], ["A line sloping downwards", 2, "Slowing down: deceleration."], ["A flat line at zero", 3, "Not moving."]
], ["Constant speed", "Acceleration", "Deceleration", "Stopped"]);
makeAnswer($("#ans2"), [
  ["Friction can be useful: trainers and climbing shoes grip so athletes can start, stop and turn.", true],
  ["Friction can be unwanted: water or air resistance slows swimmers, cyclists and skiers.", true],
  ["Athletes reduce unwanted friction with smooth, streamlined clothing, wax on skis or sweeping ice in curling.", true],
  ["Athletes increase useful friction with studs, rough soles, chalk or tyres with a good grip.", true],
  ["Friction also produces heat, for example when brakes slow a bicycle.", true],
  ["Friction is never useful in sport.", false],
  ["Swimmers want as much water resistance as possible.", false],
  ["Ice skaters want a very rough surface.", false]
], $("#ans2Check"), $("#ans2Reset"), $("#ans2Out"));

/* ---------------------------------------------------------------- calculation practice (weight, speed, pressure, Hooke) */
(function () {
  const host = $("#calcHost"); let streak = 0;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const gens = [
    () => { const m = pick([2, 3, 4, 5, 6, 8, 10, 12]); return { text: `${T("What is the weight of a")} ${m} kg ${T("object on Earth (g = 10 N/kg)?")}`, ans: m * 10, unit: " N", h: "W = m × g" }; },
    () => { const d = pick([2, 3, 4, 5, 6, 8]), t = pick([2, 3, 5, 10]); return { text: `${T("An object travels")} ${d * t} m ${T("in")} ${t} s. ${T("What is its speed?")}`, ans: d, unit: " m/s", h: "speed = distance ÷ time" }; },
    () => { const A = pick([0.1, 0.2, 0.5, 2]), P = pick([100, 200, 400, 600, 1000]); return { text: `${P * A} N ${T("acts on an area of")} ${A} m². ${T("What is the pressure?")}`, ans: P, unit: " Pa", h: "P = F ÷ A" }; },
    () => { const k = pick([20, 50, 100, 200]), e = pick([0.02, 0.05, 0.1, 0.2]); return { text: `${T("A spring with k =")} ${k} N/m ${T("is stretched by")} ${e} m. ${T("What force acts?")}`, ans: +(k * e).toFixed(2), unit: " N", h: "F = k × e" }; }
  ];
  const show = () => {
    const q = pick(gens)(); const set = new Set([q.ans]); while (set.size < 4) { const d = q.ans * pick([0.1, 0.5, 2, 10]) + pick([-5, 5, 0]); if (d > 0 && +d.toFixed(2) !== q.ans) set.add(+d.toFixed(2)); } const opts = shuffle([...set]);
    host.innerHTML = `<p class="ohm__q"><b>${q.text}</b></p><div class="ohm__o">${opts.map(o => `<button type="button" class="btn btn--ghost" data-v="${o}">${o}${q.unit}</button>`).join("")}</div><p class="ohm__s">${T("In a row")}: <b>${streak}</b> / 5</p><p class="ohm__f" aria-live="polite"></p>`;
    $$("button", host).forEach(btn => btn.addEventListener("click", () => { const ok = +btn.dataset.v === q.ans; popIt(btn); btn.classList.add(ok ? "ohm__ok" : "ohm__no"); $(".ohm__f", host).innerHTML = ok ? `<b>${T("Correct!")}</b> ${q.h}` : `<b>${T("Not quite.")}</b> ${T("The answer is")} ${q.ans}${q.unit}. ${q.h}`; streak = ok ? streak + 1 : 0; if (streak >= 5) { award("calc"); streak = 0; } $$("button", host).forEach(x => x.disabled = true); setTimeout(show, 1200); }));
  };
  show();
})();

/* ---------------------------------------------------------------- Lesson 31 */
makeMatch($("#matchPres"), [
  ["Pressure", "Force acting over an area"], ["Force", "A push or a pull, measured in newtons"], ["Area", "The surface the force acts on"], ["Pascal (Pa)", "The unit of pressure"], ["Newton (N)", "The unit of force"]
]);
makeSorter($("#sortPres"), [
  ["High heels", 0, "A small area gives high pressure."], ["Snowshoes", 1, "A large area gives low pressure."], ["A sharp knife", 0, "A tiny area gives high pressure."], ["A tractor's wide tyres", 1, "They spread the weight."],
  ["A drawing pin point", 0, "A very small area."], ["An elephant's wide feet", 1, "The weight is spread over a huge area."]
], ["High pressure", "Low pressure"]);
makeSorter($("#sortTyre"), [
  ["Under-inflated tyre", 0, "Too much tyre touches the road: more friction and wear."], ["Over-inflated tyre", 1, "Too little tyre touches the road: less grip."], ["Correct tyre pressure", 2, "Balanced grip and wear: safe driving."],
  ["The tyre looks flat and wears at the edges", 0, "Under-inflated."], ["The tyre bulges and slides easily", 1, "Over-inflated."]
], ["Too much contact", "Too little contact", "Just right"]);

/* ---------------------------------------------------------------- Lesson 32 */
makeMatch($("#matchVar"), [
  ["Eye colour", "Inherited"], ["A scar", "Environmental"], ["Height", "Both inherited and environmental"], ["Blood group", "Inherited"], ["An accent", "Environmental"]
]);
makeSorter($("#sortCont"), [
  ["Height", 0, "A range of values: continuous."], ["Body mass", 0, "A range of values: continuous."], ["Arm span", 0, "A range of values: continuous."], ["Foot length", 0, "A range of values: continuous."],
  ["Blood group", 1, "Set categories: discontinuous."], ["Tongue rolling", 1, "Either you can or you cannot."], ["Ear lobe attached or free", 1, "Two categories."], ["Fingerprint pattern type (arch, loop, whorl)", 1, "A few set categories."]
], ["Continuous variation", "Discontinuous variation"]);
makeSorter($("#sortSel"), [
  ["Camouflaged fish survive and breed more", 0, "Nature selects: natural selection."], ["People breed the fastest horses", 1, "People choose: artificial selection."], ["Dark moths survive better on dark trees", 0, "Natural selection."],
  ["Farmers breed cows that give the most milk", 1, "Artificial selection."], ["Polar bears with thicker fur survive cold winters", 0, "Natural selection."], ["Dog breeders choose puppies with the right coat", 1, "Artificial selection."]
], ["Natural selection", "Artificial selection"]);
makeSorter($("#sortTrait"), [
  ["A dog's fur colour", 0, "Inherited."], ["A dog's obedience training", 1, "Environmental."], ["A bird's beak shape", 0, "Inherited."], ["A bird's damaged feathers", 1, "Environmental."], ["A cat's tail length", 0, "Inherited."], ["A cat's missing whisker from an accident", 1, "Environmental."]
], ["Inherited trait", "Environmental trait"]);

/* ---------------------------------------------------------------- Lesson 33 */
makeMatch($("#matchAdapt"), [
  ["Streamlined body", "Reduces water resistance so the fish moves quickly"], ["Long pointed bill", "Catches fast, slippery prey"], ["Large eyes", "Improves vision in deep, dark water"], ["Counter-shading", "Hides the fish from above and below"], ["Powerful tail", "Helps swim at high speed"]
]);
makeMatch($("#matchCause"), [
  ["Building cities", "Frogs lose clean water to lay eggs in"], ["Oil spill in the sea", "Fish and birds are poisoned or clogged"], ["Climate warms", "Polar bears cannot find ice to hunt on"], ["Deforestation", "Birds lose nests and food"]
]);
makeSorter($("#sortEnv"), [
  ["A drought", 0, "A natural change."], ["Pollution", 1, "Caused by people."], ["A volcano erupting", 0, "A natural change."], ["Deforestation", 1, "People cut down trees."], ["A flood after heavy rain", 0, "A natural change."], ["Building a city", 1, "People change the habitat."]
], ["Natural change", "Human-made change"]);
makeAnswer($("#ans3"), [
  ["Individuals in a species vary: some have helpful traits for the new conditions.", true],
  ["When the environment changes, individuals with helpful traits are more likely to survive.", true],
  ["The survivors reproduce and pass the helpful traits on in their genes.", true],
  ["Over generations the helpful trait becomes more common in the species: this is natural selection.", true],
  ["For example, camouflaged fish survive better in clear water and have more young.", true],
  ["Animals decide to change their colour when the environment changes.", false],
  ["All animals survive equally so nothing changes.", false],
  ["Humans choose which animals survive in natural selection.", false]
], $("#ans3Check"), $("#ans3Reset"), $("#ans3Out"));

/* ---------------------------------------------------------------- real-photo tap-the-part */
initHotspots({
  springscale: { name: "Spring balance", img: "photos/springscale.jpg", alt: "A spring balance (newton meter) with a ring at the top, a scale and a hook", tasks: [
    ["Tap the ring at the top that you hold.", .52, .07, "Ring", "You hold the ring while the weight hangs from the hook."],
    ["Tap the scale that shows the reading.", .50, .38, "Scale", "A spring balance has a scale marked in newtons."],
    ["Tap the hook at the bottom.", .52, .91, "Hook", "The load hangs from the hook and stretches the spring inside."]] },
  swordfish: { name: "Swordfish", img: "photos/swordfish.jpg", alt: "A swordfish with a long bill, dark back, light belly and a strong tail", tasks: [
    ["Tap the long pointed bill.", .27, .24, "Bill", "The bill slashes at prey. It is an adaptation for catching fast food."],
    ["Tap the eye.", .51, .37, "Eye", "Swordfish have large eyes for seeing in deep, dark water."],
    ["Tap the powerful tail.", .945, .64, "Tail", "A strong tail and a streamlined body give high speed."]] },
  snowshoe: { name: "Snowshoes", img: "photos/snowshoe.jpg", alt: "Hikers wearing snowshoes and rucksacks on a snowy forest track", tasks: [
    ["Tap the snowshoes of the walker in the middle.", .58, .73, "Snowshoes", "Snowshoes spread the weight over a large area, so the pressure is low."],
    ["Tap the packed track in the snow.", .13, .77, "Track", "Walkers on the track sink less because the snow is packed."]] },
  curling: { name: "Curling", img: "photos/curling.jpg", alt: "Curling stones on a sheet of ice in an indoor rink", tasks: [
    ["Tap a curling stone in the foreground.", .15, .77, "Curling stone", "The stone slides because ice has very low friction."],
    ["Tap the ice sheet.", .60, .62, "Ice", "Players sweep the ice to reduce friction even more."]] }
}, "springscale", award);

/* ---------------------------------------------------------------- 3D hero and labs */
buildHero(); buildSpring(award); buildFriction(award); buildPressure(award); buildSelection(award);

/* ---------------------------------------------------------------- practice exam */
initQuiz({ BANK, labels: ["Force and mass", "Friction and sport", "Pressure", "Variation in animals", "Adaptations and environment"], first: 29, award, P });

/* register dynamic strings so the Spanish dictionary can be proven complete */
["What is the weight of a", "object on Earth (g = 10 N/kg)?", "An object travels", "in", "What is its speed?", "acts on an area of", "What is the pressure?", "A spring with k =", "is stretched by", "What force acts?", "In a row", "Correct!", "Not quite.", "The answer is",
 "Mass", "Weight", "Extension", "Past the elastic limit!", "The spring is permanently stretched. Press Replace spring.", "Force (N)", "Extension (cm)", "Speed (m/s)", "Time", "Balanced forces", "Unbalanced: speeding up", "Unbalanced: slowing down", "Balanced: not moving", "Push", "Friction",
 "Start pushing", "Stop pushing", "Add a parachute", "Remove the parachute", "Low pressure", "The force is spread over a large area, so you do not sink.", "High pressure", "The force acts on a small area, so you sink in deeply.", "Medium pressure", "You sink in a little.",
 "Generation", "Hunt over!", "Press Next generation. The survivors breed.", "You caught a", "fish", "Bright fish are easy to see in this water, so they are caught first.", "The most common colour now is", "The fish that were harder to see survived and had young. This is natural selection.",
 "3D view is not available on this device. Everything else on the page still works.", "Spring Lab", "Friction Lab", "Pressure Lab", "Natural Selection Lab", "Photo hunter", "Calculator", "Camouflage Safari", "Exam 80%",
 "Record 5 points, try the Moon and stretch a spring past its elastic limit", "Try 3 surfaces, reach a steady speed and then slow down", "Try all four footwear options and get one low and one very high pressure", "Breed the fish to the 4th generation and watch the colours change", "Real photos: find every part on all four photos", "Answer 5 calculation questions correctly in a row", "Finish a Camouflage Safari round", "Score 80% or more on a 20-question practice exam",
 "Lesson 29", "Lesson 30", "Lesson 31", "Lesson 32", "Lesson 33", "Press “Mark lesson complete” on Lesson 29", "Press “Mark lesson complete” on Lesson 30", "Press “Mark lesson complete” on Lesson 31", "Press “Mark lesson complete” on Lesson 32", "Press “Mark lesson complete” on Lesson 33"].forEach(T);

/* ---------------------------------------------------------------- bonus + credits + booklet + translation */
$("#bonusPlay").addEventListener("click", () => { mountSafari($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
loadCredits($("#credits"));
wireBooklet("Exam-6-Revision-Booklet");
P.render();
translateDom();
observeDom();
