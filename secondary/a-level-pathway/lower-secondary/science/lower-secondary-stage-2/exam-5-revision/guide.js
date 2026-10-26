/* Exam 5 Revision Website: lessons 23-28 (Breathing and Respiration, Bodies and Bones, Moving Bones and Medicines, Summary of Properties,
   Measuring Movements, Air and Particles). Plain ES module on top of engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=1";
import { mountBuilder } from "./bonus.js?v=2";
import { buildHero, buildBreath, buildMuscle, buildParticles } from "./labs.js?v=5";
import { $, $$, T, initLang, translateDom, observeDom, initProgress, makeSorter, makeMatch, makeAnswer, makeOrder, initHotspots, loadCredits, initQuiz, wireBooklet } from "../../../../../../engine/revision-kit.js?v=17";

await initLang();

/* ---------------------------------------------------------------- progress */
const LAB_NAMES = { breath: "Breathing Lab", muscle: "Muscle Lab", particles: "Particle Lab" };
const LAB_HOW = {
  breath: "Tap all six parts, take 5 breaths and try exercising",
  muscle: "Bend and straighten both the arm and the leg",
  particles: "See all three states, squeeze the gas and watch diffusion at a high temperature"
};
const P = initProgress({
  store: "dl-ls2-exam5-revision-v1",
  badges: prog => [
    ...[23, 24, 25, 26, 27, 28].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
    ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
    ["Photo hunter", () => prog.labs.photos, "Real photos: find every part on all four photos"],
    ["Bone Builder", () => prog.labs.bonus, "Finish a Bone Builder round"],
    ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award;

/* ---------------------------------------------------------------- Lesson 23 */
makeMatch($("#matchBR"), [
  ["Breathing", "Moving air in and out of the lungs"], ["Respiration", "A chemical reaction in cells that releases energy"], ["Alveoli", "Tiny air sacs where gas exchange happens"],
  ["Diaphragm", "The muscle under the lungs that helps you breathe"], ["Mitochondria", "The part of the cell where respiration happens"]
]);
makeSorter($("#sortBR"), [
  ["Happens in the lungs", 0, "Breathing is the movement of air in the lungs."], ["Happens in the mitochondria of every cell", 1, "Respiration is a chemical reaction in cells."], ["A physical process", 0, "Moving air is physical."],
  ["Glucose + oxygen → carbon dioxide + water + energy", 1, "This is the equation for respiration."], ["Brings oxygen in and removes carbon dioxide", 0, "That is gas exchange during breathing."], ["Releases energy from food", 1, "Respiration releases energy."]
], ["Breathing", "Respiration"]);
makeOrder($("#orderAir"), [
  ["Nose or mouth", "Air enters the body"], ["Trachea", "The windpipe"], ["Bronchi", "One tube into each lung"], ["Lungs", "Air fills the lungs"], ["Alveoli", "Gas exchange with the blood"]
]);
makeAnswer($("#ans1"), [
  ["Breathing moves air in and out of the lungs; respiration is a chemical reaction in cells.", true],
  ["Breathing happens in the lungs; respiration happens in the mitochondria of all body cells.", true],
  ["Breathing brings in oxygen and removes carbon dioxide (gas exchange).", true],
  ["Respiration uses glucose and oxygen to release energy, making carbon dioxide and water.", true],
  ["They are connected because breathing supplies the oxygen that respiration needs.", true],
  ["Breathing is a chemical reaction and respiration is only movement of air.", false],
  ["Respiration happens only in the lungs.", false],
  ["Neither process is connected to energy.", false]
], $("#ans1Check"), $("#ans1Reset"), $("#ans1Out"));

/* ---------------------------------------------------------------- Lesson 24 */
makeMatch($("#matchBones"), [
  ["Skull", "Protects the brain"], ["Ribcage", "Protects the lungs and heart"], ["Spine", "Supports the upper body and protects the spinal cord"],
  ["Pelvis", "Connects the legs to the hips"], ["Femur", "The longest bone: supports the body and helps standing and bending"]
]);
makeSorter($("#sortConn"), [
  ["Joins bone to bone", 0, "Ligaments connect bone to bone."], ["Joins muscle to bone", 1, "Tendons connect muscle to bone."], ["Keeps a joint stable", 0, "Ligaments provide stability."],
  ["Lets a muscle pull on a bone", 1, "Tendons transfer the pull."], ["Cushions the ends of bones at a joint", 2, "Cartilage cushions joints."], ["Allows smooth joint movement", 2, "Cartilage is smooth and slippery."]
], ["Ligament", "Tendon", "Cartilage"]);
makeSorter($("#sortBoneQ"), [
  ["Why do babies have more bones than adults?", 0, "Some bones fuse together as they grow."], ["What is bone marrow for?", 1, "It makes red blood cells."],
  ["Why are bones hard but not brittle?", 2, "Calcium gives strength and collagen gives flexibility."], ["Which substance makes bones hard?", 2, "Calcium."], ["Which part of the skeleton protects the brain?", 3, "The skull."]
], ["Some bones fuse as they grow", "It makes red blood cells", "Calcium for strength, collagen for flexibility", "The skull"]);

/* ---------------------------------------------------------------- Lesson 25 */
makeMatch($("#matchMus"), [
  ["Biceps", "Pulls the arm up (bends the elbow)"], ["Triceps", "Pulls the arm straight"], ["Quadriceps", "Straightens the knee"], ["Hamstrings", "Works at the back of the thigh"], ["Deltoid", "Raises the arm at the shoulder"]
]);
makeSorter($("#sortMus"), [
  ["Attached to bones and used for movement", 0, "Skeletal muscle."], ["Found in the stomach and other internal organs", 1, "Smooth muscle works automatically."], ["Found only in the heart and never tires", 2, "Cardiac muscle."],
  ["The biceps", 0, "Skeletal muscle."], ["The wall of the gut", 1, "Smooth muscle."], ["You choose when to use it", 0, "Voluntary skeletal muscle."]
], ["Skeletal", "Smooth", "Cardiac"]);
makeMatch($("#matchMed"), [
  ["Antibiotic", "Kills bacteria"], ["Paracetamol", "Reduces fever and pain"], ["Decongestant", "Opens blocked airways"], ["Antihistamine", "Blocks histamine"], ["Antiviral", "Kills viruses"]
]);
makeSorter($("#sortSafe"), [
  ["Read the label and dosage instructions", 0, "Always read the label."], ["Take someone else's prescription", 1, "Prescriptions are for one person only."], ["Only take medicine from a trusted adult or doctor", 0, "Safe use."],
  ["Mix different medicines together", 1, "Never mix medicines."], ["Report side effects or an allergic reaction", 0, "Tell a trusted adult or doctor."], ["Take antibiotics for a cold", 1, "Colds are caused by viruses."]
], ["Safe", "Not safe"]);
makeAnswer($("#ans2"), [
  ["Muscles are attached to bones by tendons.", true],
  ["Muscles contract (get shorter) and pull on the bone to move it.", true],
  ["Muscles can only pull, so they work in antagonistic pairs: one contracts while the other relaxes.", true],
  ["For example, the biceps contracts to bend the arm while the triceps relaxes; they swap to straighten it.", true],
  ["Bones are joined by ligaments at joints, which gives stability while the bones move.", true],
  ["Bones can move by themselves without muscles.", false],
  ["Muscles push the bones.", false],
  ["Both muscles of a pair contract at the same time to bend the arm.", false]
], $("#ans2Check"), $("#ans2Reset"), $("#ans2Out"));

/* ---------------------------------------------------------------- Lesson 26 */
makeMatch($("#matchState"), [
  ["Stays the same shape and volume", "Solid"], ["Can change shape but not volume", "Liquid"], ["Fills its container completely", "Gas"], ["Can be compressed easily", "Gas"]
]);
makeSorter($("#sortState"), [
  ["Tightly packed and vibrating in place", 0, "A solid."], ["Close together and sliding over each other", 1, "A liquid."], ["Far apart and moving fast in all directions", 2, "A gas."],
  ["Cannot be compressed (particles touch)", 0, "A solid."], ["Can be compressed (large gaps)", 2, "A gas."], ["Takes the shape of its container but keeps its volume", 1, "A liquid."]
], ["Solid", "Liquid", "Gas"]);
makeSorter($("#sortChange"), [
  ["Ice turns into water", 0, "Melting: solid to liquid."], ["Water turns into ice", 1, "Freezing: liquid to solid."], ["Puddle dries in the sun", 2, "Evaporation: liquid to gas."],
  ["Steam on a cold mirror forms droplets", 3, "Condensation: gas to liquid."], ["Dry ice becomes gas without becoming liquid", 4, "Sublimation: solid to gas."], ["Clouds form from water vapour", 3, "Condensation."]
], ["Melting", "Freezing", "Evaporation", "Condensation", "Sublimation"]);
makeAnswer($("#ans3"), [
  ["Solids: particles are tightly packed in a fixed pattern and only vibrate in place; they have the least energy.", true],
  ["Liquids: particles are close together but can slide over each other; they have more energy than a solid.", true],
  ["Gases: particles are far apart and move quickly in all directions; they have the most energy.", true],
  ["Gas particles can be pushed closer so gases can be compressed; solids and liquids cannot.", true],
  ["Heating gives particles more energy, so they move faster and can change state.", true],
  ["In a solid the particles are far apart and move quickly.", false],
  ["Gas particles are tightly packed in a fixed pattern.", false],
  ["All three states have particles with exactly the same energy.", false]
], $("#ans3Check"), $("#ans3Reset"), $("#ans3Out"));

/* ---------------------------------------------------------------- Lesson 27 */
makeSorter($("#sortDiff"), [
  ["Perfume smell spreading across a room", 0, "Gas particles diffuse."], ["Ink spreading in a glass of water", 0, "Particles spread from high to low concentration."], ["Oxygen moving from the lungs into the blood", 0, "Diffusion in the alveoli."],
  ["A ball rolling downhill", 1, "A force moves the whole ball: not diffusion."], ["Sugar cube in a solid block of wax", 1, "Particles in a solid cannot spread out."], ["An ice cube melting in a drink", 1, "That is melting, a change of state."]
], ["Diffusion", "Not diffusion"]);
makeMatch($("#matchMove"), [
  ["Why particles move randomly", "They are hit by other particles"], ["Higher temperature", "Faster particle movement and faster diffusion"], ["Lower temperature", "Slower particle movement and slower diffusion"], ["Diffusion goes from", "High to low concentration"], ["Brownian motion was first seen in", "Pollen grains in water"]
]);

/* ---------------------------------------------------------------- Lesson 28 */
makeMatch($("#matchGas"), [
  ["Oxygen", "Needed for breathing and respiration"], ["Nitrogen", "Makes up most of the air"], ["Carbon dioxide", "Used by plants in photosynthesis"], ["Argon", "Inert gas used in balloons and lights"], ["Water vapour", "Helps control temperature and humidity"]
]);
makeSorter($("#sortAir"), [
  ["Air is a mixture of gases", 0, "It contains nitrogen, oxygen and more."], ["Air particles have mass and take up space", 0, "Air is matter."], ["Air pressure comes from particles colliding with surfaces", 0, "More collisions, more pressure."],
  ["Air particles are fixed in place", 1, "They move fast in all directions."], ["Air is mostly oxygen", 1, "It is about 78% nitrogen."], ["Air has no particles because we cannot see it", 1, "Air particles are just too small to see."]
], ["True", "False"]);

/* ---------------------------------------------------------------- real-photo tap-the-part */
initHotspots({
  skeleton: { name: "Skeletons", img: "photos/skeleton.jpg", alt: "Three human skeletons standing in a museum display case", tasks: [
    ["Tap the skull of the skeleton in the middle.", .62, .12, "Skull", "The skull protects the brain."],
    ["Tap the ribcage of the middle skeleton.", .60, .33, "Ribcage", "The ribcage protects the lungs and heart."],
    ["Tap the pelvis of the middle skeleton.", .57, .55, "Pelvis", "The pelvis connects the legs to the hips."],
    ["Tap the long thigh bone (femur) of the middle skeleton.", .57, .72, "Femur", "The femur is the longest bone in the body."]] },
  xray: { name: "Chest X-ray", img: "photos/xray.jpg", alt: "A chest X-ray with ribs, dark lungs, heart and spine", tasks: [
    ["Tap the dark area of the left lung (on the right of the picture).", .74, .45, "Lung", "Lungs look dark because they are full of air."],
    ["Tap a rib on the side of the chest.", .14, .50, "Rib", "Ribs protect the lungs and move as you breathe."],
    ["Tap the heart (the pale shape in the centre).", .55, .62, "Heart", "The heart sits between the lungs."],
    ["Tap the spine running down the middle.", .45, .35, "Spine", "The spine supports the body and protects the spinal cord."]] },
  can: { name: "Crushed can", img: "photos/can.jpg", alt: "A metal can before and after being crushed by air pressure", tasks: [
    ["Tap the crushed can on the right.", .76, .55, "Crushed can", "The air inside was removed, so the air outside pushed the can in."],
    ["Tap the can that is still undamaged on the left.", .09, .58, "Undamaged can", "While the air inside pushes out as hard as the air outside pushes in, the can keeps its shape."]] },
  ice: { name: "Ice cube", img: "photos/ice.jpg", alt: "A clear ice cube held between fingers with air bubbles trapped inside", tasks: [
    ["Tap the ice cube.", .50, .45, "Ice (a solid)", "Particles in a solid are tightly packed in a fixed pattern and only vibrate."],
    ["Tap a trapped air bubble inside the ice.", .60, .35, "Air bubble", "Gas particles are far apart and fill any space they are in."]] }
}, "skeleton", award);

/* ---------------------------------------------------------------- 3D hero and labs */
buildHero(); buildBreath(award); buildMuscle(award); buildParticles(award);

/* ---------------------------------------------------------------- practice exam */
initQuiz({ BANK, labels: ["Breathing and respiration", "Bodies and bones", "Moving bones and medicines", "Summary of properties", "Measuring movements", "Air and particles"], first: 23, award, P });

/* register dynamic strings so the Spanish dictionary can be proven complete */
["Start exercising", "Stop exercising", "Hold your breath", "Breathe again", "Solid", "Liquid", "Gas", "contracts", "relaxes", "The tendon pulls the bone.", "Move the slider or press Auto", "Muscles can only pull. Watch which muscle contracts and which relaxes.",
 "Bend the elbow", "Bend the knee", "Left-hand particles marked", "Acid", "3D view is not available on this device. Everything else on the page still works.", "Breathing Lab", "Muscle Lab", "Particle Lab", "Photo hunter", "Bone Builder", "Exam 80%",
 "Tap all six parts, take 5 breaths and try exercising", "Bend and straighten both the arm and the leg", "See all three states, squeeze the gas and watch diffusion at a high temperature", "Real photos: find every part on all four photos", "Finish a Bone Builder round", "Score 80% or more on a 20-question practice exam",
 "Lesson 23", "Lesson 24", "Lesson 25", "Lesson 26", "Lesson 27", "Lesson 28", "Press “Mark lesson complete” on Lesson 23", "Press “Mark lesson complete” on Lesson 24", "Press “Mark lesson complete” on Lesson 25", "Press “Mark lesson complete” on Lesson 26", "Press “Mark lesson complete” on Lesson 27", "Press “Mark lesson complete” on Lesson 28"].forEach(T);

/* ---------------------------------------------------------------- bonus + credits + booklet + translation */
$("#bonusPlay").addEventListener("click", () => { mountBuilder($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
loadCredits($("#credits"));
wireBooklet("Exam-5-Revision-Booklet");
P.render();
translateDom();
observeDom();
