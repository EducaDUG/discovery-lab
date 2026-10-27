/* Stage 1 Biology Exam 1 Revision Website: lessons 1-9 (Micro-organisms, Plant Life Cycles, Heart Lungs and Circulation).
   Plain ES module on top of engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=1";
import { mountCatcher } from "./bonus.js?v=1";
import { buildHero, buildYeast, buildGerm, buildPollen, buildHeart } from "./labs.js?v=4";
import { $, $$, T, initLang, translateDom, observeDom, initProgress, makeSorter, makeMatch, makeAnswer, makeOrder, initHotspots, loadCredits, initQuiz, wireBooklet } from "../../../../../../../engine/revision-kit.js?v=22";

await initLang();

/* ---------------------------------------------------------------- progress */
const LAB_NAMES = { yeast: "Yeast Balloon Lab", germ: "Germination Lab", pollen: "Pollination Lab", heart: "Heart Lab" };
const LAB_HOW = {
  yeast: "Run at least four tests, including no yeast and a very hot one",
  germ: "Grow seeds without water, oxygen and warmth, and one with the light off",
  pollen: "Watch both insect and wind pollination, then see the fruit form",
  heart: "Tap all six parts, exercise and count your pulse"
};
const P = initProgress({
  store: "dl-ls1bio-exam1-revision-v1",
  badges: prog => [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
    ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
    ["Photo hunter", () => prog.labs.photos, "Real photos: find every part on all five photos"],
    ["Pulse Catcher", () => prog.labs.bonus, "Finish a Pulse Catcher round"],
    ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award;

/* ---------------------------------------------------------------- Lesson 1 */
makeMatch($("#matchMicro"), [
  ["Bacteria", "Single-celled prokaryotes with no nucleus"], ["Virus", "Only reproduces inside a living host cell"], ["Yeast", "A microscopic fungus that makes bread rise"],
  ["Mould", "A microscopic fungus that grows in thread-like strands"], ["Microscope", "Needed to see most micro-organisms"]
]);
makeSorter($("#sortMicro"), [
  ["No nucleus in its cell", 0, "Bacteria are prokaryotes."], ["Not made of cells", 1, "Viruses are tiny particles, not cells."], ["Reproduces only inside host cells", 1, "A virus cannot reproduce on its own."],
  ["Used to make bread dough rise", 2, "Yeast is a fungus."], ["Salmonella", 0, "Salmonella is a bacterium."], ["Influenza", 1, "Influenza is caused by a virus."], ["Penicillium", 2, "Penicillium is a mould, a fungus."]
], ["Bacteria", "Virus", "Fungus"]);
makeOrder($("#orderRes"), [
  ["Antibiotic attacks", "It kills most of the bacteria"], ["A few survive", "They have a chance change that protects them"], ["Survivors multiply", "They pass the change on"], ["Most bacteria are resistant", "The antibiotic stops working"]
]);
makeAnswer($("#ans1"), [
  ["Viruses are not cells and cannot carry out life processes on their own.", true],
  ["A virus enters a host cell and uses the cell to make copies of itself.", true],
  ["When an antibiotic is taken, most bacteria die but a few survive because of a chance change.", true],
  ["The survivors multiply and pass on the change, so the population becomes resistant.", true],
  ["Not finishing a course of antibiotics or sharing them makes this more likely.", true],
  ["Viruses reproduce in water by dividing in two.", false],
  ["Antibiotics make bacteria stronger the moment they touch them.", false],
  ["Antibiotics work well against viruses.", false]
], $("#ans1Check"), $("#ans1Reset"), $("#ans1Out"));

/* ---------------------------------------------------------------- Lesson 2 */
makeMatch($("#matchUse"), [
  ["Yeast", "Makes bread dough rise by producing carbon dioxide"], ["Bacteria in milk", "Make yogurt and some cheeses"], ["Penicillium", "The mould that led to penicillin"],
  ["Gut bacteria", "Help to digest food"], ["Fermentation", "Microbes breaking down sugars, as in kimchi"]
]);
makeSorter($("#sortUse"), [
  ["Making yogurt", 0, "Bacteria turn milk into yogurt."], ["Food poisoning", 1, "Some bacteria make us ill."], ["Rising bread dough", 0, "Yeast makes carbon dioxide."],
  ["Making penicillin", 0, "A mould makes an antibiotic."], ["Mould on old bread", 1, "It spoils food."], ["Digesting food in the gut", 0, "Helpful gut bacteria."]
], ["Helpful", "Harmful"]);
makeOrder($("#orderYeast"), [
  ["Mix yeast, sugar and warm water", "Yeast now has food and the right temperature"], ["Yeast feeds on the sugar", "It breaks the sugar down (fermentation)"], ["Carbon dioxide gas is made", "Bubbles of gas form"], ["The balloon inflates", "The gas fills the balloon"]
]);

/* ---------------------------------------------------------------- Lesson 3 */
makeMatch($("#matchDis"), [
  ["Salmonella", "Food poisoning"], ["Staphylococcus", "Skin infections"], ["Influenza virus", "The flu"], ["Varicella virus", "Chickenpox"], ["Coronavirus", "COVID-19"]
]);
makeSorter($("#sortDis"), [
  ["Food poisoning from Salmonella", 0, "Bacteria."], ["Strep throat", 0, "Bacteria."], ["Chickenpox", 1, "Virus."], ["The flu", 1, "Virus."], ["COVID-19", 1, "Virus."], ["A skin infection from Staphylococcus", 0, "Bacteria."]
], ["Caused by bacteria", "Caused by viruses"]);
makeSorter($("#sortHyg"), [
  ["Washing hands with soap for 20 seconds", 0, "Reduces the spread of microbes."], ["Using one board for raw chicken and salad", 1, "Risk of cross-contamination."], ["Cooking meat all the way through", 0, "Kills harmful bacteria."],
  ["Leaving cooked food out overnight", 1, "Bacteria multiply quickly."], ["Storing raw meat below cooked food", 0, "Stops drips spreading bacteria."], ["Touching raw meat then making a sandwich without washing", 1, "Cross-contamination."]
], ["Safe", "Risky"]);
makeAnswer($("#ans3"), [
  ["Raw meat can carry harmful bacteria such as Salmonella.", true],
  ["Unwashed hands transfer bacteria to the sandwich: this is cross-contamination.", true],
  ["The sandwich is not cooked afterwards, so the bacteria are not killed and can cause food poisoning.", true],
  ["Wash hands with soap for at least 20 seconds after touching raw meat.", true],
  ["Use separate boards and knives for raw meat and ready-to-eat food.", true],
  ["Keep raw and cooked food apart and cook meat thoroughly.", true],
  ["Cold water on the hands is enough to kill the bacteria.", false],
  ["There is no risk because the sandwich looks clean.", false]
], $("#ans3Check"), $("#ans3Reset"), $("#ans3Out"));

/* ---------------------------------------------------------------- Lesson 4 */
makeMatch($("#matchEnv"), [
  ["Decomposers", "Break down dead plants and animals"], ["Rhizobium", "Fixes nitrogen for legume plants"], ["Compost", "Nutrient-rich material made from food scraps"],
  ["Water treatment bacteria", "Break down waste to help purify water"], ["Soil microbes", "Release nutrients that plants can absorb"]
]);
makeSorter($("#sortDec"), [
  ["Bacteria in a compost heap", 0, "They decompose waste."], ["A tree", 1, "It is a producer."], ["Fungi growing on a fallen log", 0, "They decompose wood."], ["A dog", 1, "It is a consumer."], ["A cloud", 1, "Not living."], ["Bacteria in the soil", 0, "They recycle nutrients."]
], ["Decomposer", "Not a decomposer"]);
makeOrder($("#orderCycle"), [
  ["A plant or animal dies", "It becomes dead organic matter"], ["Bacteria and fungi feed on it", "They break it down"], ["Nutrients are released into the soil", "The nutrients are recycled"], ["Plant roots absorb the nutrients", "New plants grow"]
]);
makeAnswer($("#ans4"), [
  ["Dead plants and animals would not be broken down, so waste would pile up.", true],
  ["Nutrients would stay locked in dead matter instead of being returned to the soil.", true],
  ["The soil would become less fertile because there would be fewer nutrients.", true],
  ["Plants would not get minerals such as nitrogen, so they would grow poorly or die.", true],
  ["Animals that eat plants would then have less food, so the food chain would suffer.", true],
  ["Plants would grow much faster without decomposers.", false],
  ["The soil would get richer because nothing would be broken down.", false]
], $("#ans4Check"), $("#ans4Reset"), $("#ans4Out"));

/* ---------------------------------------------------------------- Lesson 5 */
makeMatch($("#matchGerm"), [
  ["Water", "Softens the seed coat and activates the seed"], ["Warmth", "Speeds up the chemical reactions in the seed"], ["Oxygen", "Needed for respiration to release energy"], ["Dormancy", "A seed waits, inactive, for the right conditions"], ["Germination", "A seed starts to grow into a new plant"]
]);
makeSorter($("#sortGerm"), [
  ["Water", 0, "Needed."], ["Suitable warmth", 0, "Needed."], ["Oxygen", 0, "Needed."], ["Direct sunlight", 1, "Not needed to start germinating."], ["Fertiliser", 1, "Not needed: the seed has its own food store."], ["Moving air blowing on it", 1, "Not needed."]
], ["Needed to germinate", "Not needed"]);
makeOrder($("#orderLife"), [
  ["Germination", "The seed grows into a seedling"], ["Flowering", "The plant produces flowers"], ["Pollination", "Pollen reaches the stigma"], ["Fertilisation", "Seeds begin to form"], ["Seed dispersal", "Seeds are spread to new places"]
]);
makeAnswer($("#ans5"), [
  ["Change only one thing (the amount of water) and call it the independent variable.", true],
  ["Use several groups of seeds, for example dry, a little water and plenty of water.", true],
  ["Keep warmth, oxygen, type and number of seeds the same in every group.", true],
  ["Measure how many seeds germinate or how tall the shoots are after a set number of days.", true],
  ["Repeat the experiment, or use many seeds, and find a mean to make it reliable.", true],
  ["Give different seeds different amounts of water and different temperatures.", false],
  ["Do not measure anything; just look at the seeds once.", false]
], $("#ans5Check"), $("#ans5Reset"), $("#ans5Out"));

/* ---------------------------------------------------------------- Lesson 6 */
makeMatch($("#matchFlower"), [
  ["Anther", "Makes pollen"], ["Stigma", "Sticky part that catches pollen"], ["Petals", "Attract pollinators"], ["Ovary", "Holds ovules and becomes the fruit"], ["Nectar", "Sweet food that attracts insects"]
]);
makeSorter($("#sortPoll"), [
  ["Bright petals", 0, "Attract insects."], ["Huge amounts of light, smooth pollen", 1, "Carried by the wind."], ["Sweet smell and nectar", 0, "Attract insects."], ["Wheat", 1, "A wind-pollinated crop."], ["Sunflower", 0, "Bees visit sunflowers."], ["Feathery stigma outside the flower", 1, "Catches airborne pollen."]
], ["Insect-pollinated", "Wind-pollinated"]);
makeAnswer($("#ans6"), [
  ["Bees visit flowers to drink nectar.", true],
  ["While feeding, pollen from the anther sticks to the bee's body.", true],
  ["The bee carries the pollen to another flower.", true],
  ["Pollen rubs off onto the sticky stigma of that flower: this is pollination.", true],
  ["Pollination can then lead to fertilisation and seed formation.", true],
  ["Bees plant the seeds in the soil.", false],
  ["Nectar is the male cell that fertilises the flower.", false]
], $("#ans6Check"), $("#ans6Reset"), $("#ans6Out"));

/* ---------------------------------------------------------------- Lesson 7 */
makeMatch($("#matchDisp"), [
  ["Dandelion", "Parachute carried by the wind"], ["Coconut", "Floats on water"], ["Berry", "Eaten by an animal and dropped elsewhere"], ["Exploding pod", "Bursts open and flings the seeds"], ["Maple seed", "Spins like a helicopter as it falls"]
]);
makeSorter($("#sortDisp"), [
  ["A dandelion's parachute", 0, "Wind."], ["A coconut floating across the sea", 1, "Water."], ["A bird eating a berry", 2, "Animal."], ["A pod splitting open", 3, "Explosion."], ["A spinning maple seed", 0, "Wind."], ["Burrs clinging to fur", 2, "Animal."]
], ["Wind", "Water", "Animal", "Explosion"]);
makeOrder($("#orderFert"), [
  ["Pollination", "Pollen reaches the stigma"], ["Fertilisation", "Male and female cells join"], ["Seed forms", "The ovule becomes a seed"], ["Fruit forms", "The ovary becomes a fruit"], ["Seed dispersal", "Seeds travel to new places"]
]);
makeAnswer($("#ans7"), [
  ["Seeds that fall beneath the parent would compete with it for light, water and nutrients.", true],
  ["Dispersal spreads the seedlings out so there is less competition.", true],
  ["Seeds can reach new areas, so the species colonises new habitats.", true],
  ["If one area is damaged the species can still survive elsewhere.", true],
  ["Wind, water, animals and explosions are all ways plants disperse seeds.", true],
  ["Dispersal makes seeds germinate faster.", false],
  ["Plants disperse seeds so that they are never pollinated.", false]
], $("#ans7Check"), $("#ans7Reset"), $("#ans7Out"));

/* ---------------------------------------------------------------- Lesson 8 */
makeMatch($("#matchBlood"), [
  ["Red blood cells", "Carry oxygen"], ["White blood cells", "Fight infection"], ["Platelets", "Help blood to clot"], ["Plasma", "The liquid part of blood"], ["Heart", "The muscular pump"]
]);
makeSorter($("#sortVessel"), [
  ["Carries blood away from the heart", 0, "Arteries."], ["Has valves to stop backflow", 1, "Veins."], ["Walls are one cell thick", 2, "Capillaries."], ["Thick, strong walls", 0, "Arteries."], ["Carries blood towards the heart", 1, "Veins."], ["Where oxygen and nutrients pass into tissues", 2, "Capillaries."]
], ["Artery", "Vein", "Capillary"]);
makeMatch($("#matchCirc"), [
  ["Pulmonary circulation", "Heart to lungs and back to the heart"], ["Systemic circulation", "Heart to body and back to the heart"], ["Coronary circulation", "Supplies the heart muscle itself"], ["Left side of the heart", "Pumps oxygenated blood to the body"], ["Right side of the heart", "Pumps deoxygenated blood to the lungs"]
]);
makeOrder($("#orderBlood"), [
  ["Right side of the heart", "Pumps blue blood to the lungs"], ["Lungs", "Blood picks up oxygen"], ["Left side of the heart", "Pumps red blood out"], ["Body tissues", "Oxygen is delivered"], ["Back to the right side", "Blood returns to the heart"]
]);
makeAnswer($("#ans8"), [
  ["Arteries carry blood away from the heart under high pressure, so they have thick, strong walls.", true],
  ["Veins carry blood back to the heart; their walls are thinner and they have valves to stop backflow.", true],
  ["Capillaries are tiny vessels with walls one cell thick.", true],
  ["The thin wall allows quick exchange of oxygen, nutrients and waste with the tissues.", true],
  ["Capillaries connect arteries to veins.", true],
  ["Capillaries have thick walls and valves.", false],
  ["Veins carry blood away from the heart at high pressure.", false]
], $("#ans8Check"), $("#ans8Reset"), $("#ans8Out"));

/* ---------------------------------------------------------------- Lesson 9 */
makeMatch($("#matchLung"), [
  ["Alveoli", "Tiny air sacs where gas exchange happens"], ["Pulse", "The beat of the arteries as the heart pumps"], ["Respiration", "Chemical reaction releasing energy in cells"], ["Breathing", "Moving air in and out of the lungs"], ["Systemic circulation", "Carries oxygenated blood from the heart to the body"]
]);
makeSorter($("#sortLung"), [
  ["Moves air in and out of the lungs", 0, "Breathing."], ["Happens in the mitochondria of cells", 1, "Respiration."], ["Glucose + oxygen → carbon dioxide + water + energy", 1, "Respiration."], ["Brings in oxygen and removes carbon dioxide", 0, "Gas exchange when breathing."], ["A physical process", 0, "Breathing."], ["Releases energy from food", 1, "Respiration."]
], ["Breathing", "Respiration"]);
makeOrder($("#orderOxy"), [
  ["Air enters the lungs", "You breathe in"], ["Oxygen passes into the blood", "Across the alveoli walls"], ["The heart pumps the blood", "Oxygen-rich blood goes round the body"], ["Cells use the oxygen", "For respiration"], ["Carbon dioxide returns to the lungs", "It is breathed out"]
]);
makeAnswer($("#ans9"), [
  ["Change one variable: the type or amount of exercise.", true],
  ["Measure the pulse before exercise and after each activity, by counting beats for 15 seconds and multiplying by 4.", true],
  ["Control the variables: the same person, same time of day, same length of rest and same length of exercise.", true],
  ["Record the results in a table and compare them, for example in a bar chart.", true],
  ["Repeat the test and calculate the mean to make results more reliable.", true],
  ["Use different people for each activity and different resting times.", false],
  ["Take only one measurement and do not record it.", false]
], $("#ans9Check"), $("#ans9Reset"), $("#ans9Out"));
const pcN = $("#pcN"), pcOut = $("#pcOut"), pcS = $("#pcSlider");
const pcUpdate = () => { const n = +pcS.value; pcN.textContent = n; pcOut.innerHTML = `${n} × 4 = <b>${n * 4}</b> ${T("beats per minute")}`; };
pcS.addEventListener("input", pcUpdate); pcUpdate();

/* ---------------------------------------------------------------- real-photo tap-the-part */
initHotspots({
  flower: { name: "Hibiscus stamens", img: "photos/flower.jpg", alt: "A close-up of a hibiscus flower column covered in orange-tipped stamens", tasks: [
    ["Tap an orange anther (the tip that makes pollen).", .60, .455, "Anther", "The anther makes pollen. These orange tips are covered in pollen grains."],
    ["Tap a thin white filament that holds an anther up.", .42, .40, "Filament", "The filament is the stalk that holds the anther in a good position."],
    ["Tap the tall white column in the middle.", .505, .50, "Staminal column", "In a hibiscus the filaments join into one column around the style."],
    ["Tap a green leaf in the background.", .76, .30, "Leaf", "Leaves make food by photosynthesis; the stigma itself is higher up, out of this photo."]] },
  bee: { name: "Bee on flowers", img: "photos/bee.jpg", alt: "A honey bee with an orange pollen basket collecting from yellow flowers", tasks: [
    ["Tap a cluster of yellow flowers.", .30, .45, "Flowers", "Bright flowers with nectar and pollen attract insects."],
    ["Tap the orange pollen basket on the bee's back leg.", .545, .455, "Pollen basket", "The bee carries pollen here, and some rubs off on the next flower's stigma."],
    ["Tap the bee's wing.", .64, .485, "Wing", "Bees fly from flower to flower, moving pollen as they go."]] },
  dandelion: { name: "Dandelion seed", img: "photos/dandelion.jpg", alt: "A dandelion seed head with fluffy parachutes on a dark base", tasks: [
    ["Tap the fluffy parachutes.", .50, .37, "Parachutes", "Each seed hangs under a feathery parachute that lets the wind carry it far away."],
    ["Tap the dark base where the seeds were attached.", .49, .52, "Seed base", "The seeds grew on this base before being blown away."],
    ["Tap the thin stalk.", .43, .69, "Stalk", "The stalk holds the head up where the wind can reach it."]] },
  mould: { name: "Mould on fruit", img: "photos/mould.jpg", alt: "A mouldy citrus fruit with white and blue-green mould", tasks: [
    ["Tap the blue-green mould (Penicillium).", .52, .45, "Blue-green mould", "Penicillium is a microscopic fungus. It led to the antibiotic penicillin."],
    ["Tap the white fluffy mould.", .67, .30, "White mould", "Moulds are decomposers: they break down food and spoil it."],
    ["Tap a healthy part of another fruit.", .08, .70, "Healthy fruit", "Moulds spread by tiny spores, so a mouldy fruit can infect others."]] },
  nodules: { name: "Root nodules", img: "photos/nodules.jpg", alt: "Roots of a legume plant with small round nodules", tasks: [
    ["Tap a round root nodule.", .385, .51, "Root nodule", "Nodules are homes for Rhizobium bacteria that fix nitrogen for the plant."],
    ["Tap another nodule higher up the root.", .53, .375, "Root nodule", "Legumes such as peas and beans can grow with little fertiliser thanks to these bacteria."],
    ["Tap the green stem of the plant.", .84, .50, "Stem", "The plant above ground uses the nitrogen to make proteins."]] }
}, "flower", award);

/* ---------------------------------------------------------------- 3D hero and labs */
buildHero(); buildYeast(award); buildGerm(award); buildPollen(award); buildHeart(award);

/* ---------------------------------------------------------------- practice exam */
initQuiz({ BANK, labels: ["Meet the microbes", "Useful microbes", "Harmful microbes and food hygiene", "Decomposers and the environment", "Germination and the life cycle", "Flowers and pollination", "Fertilisation and seed dispersal", "The heart, blood and vessels", "Lungs, pulse and exercise"], first: 1, award, P });

/* register dynamic strings so the Spanish dictionary can be proven complete */
["Yeast: in", "Yeast: out", "Sugar: in", "Sugar: out", "Water: yes", "Water: no", "Oxygen: yes", "Oxygen: no", "Light: on", "Light: off", "Yes", "No", "flat", "small", "round", "big", "Dormant", "Germinating", "Seedling", "Seed did not germinate", "Seedling grew", "Insect flowers", "Wind flowers", "Send the bee", "Release the wind", "Start exercising", "Stop exercising", "Counting...", "Pollen on the stigma", "3D view is not available on this device. Everything else on the page still works.",
 "Yeast Balloon Lab", "Germination Lab", "Pollination Lab", "Heart Lab", "Photo hunter", "Pulse Catcher", "Exam 80%",
 "Run at least four tests, including no yeast and a very hot one", "Grow seeds without water, oxygen and warmth, and one with the light off", "Watch both insect and wind pollination, then see the fruit form", "Tap all six parts, exercise and count your pulse", "Real photos: find every part on all five photos", "Finish a Pulse Catcher round", "Score 80% or more on a 20-question practice exam",
 ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(n => ["Lesson " + n, "Press “Mark lesson complete” on Lesson " + n])].forEach(T);

/* ---------------------------------------------------------------- bonus + credits + booklet + translation */
$("#bonusPlay").addEventListener("click", () => { mountCatcher($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
loadCredits($("#credits"));
wireBooklet("Exam-1-Revision-Booklet");
P.render();
translateDom();
observeDom();
