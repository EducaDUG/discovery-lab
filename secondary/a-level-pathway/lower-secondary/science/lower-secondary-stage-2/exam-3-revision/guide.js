/* Exam 3 Revision Website: lessons 12-16. Plain ES module on top of engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=1";
import { mountRunner } from "./runner.js?v=2";
import { $, $$, el, rnd, clamp, shuffle, shake, popIt, burstOn, T, L, isES, initLang, translateDom, initProgress, makeSorter, makeMatch, makeAnswer, makeOrder, rafLoop, rr, make3D, mat, glowTexture, labelSprite, initHotspots, loadCredits, initQuiz, wireBooklet, reduced } from "../../../../../../engine/revision-kit.js?v=2";

await initLang();

/* ---------------------------------------------------------------- progress */
const LAB_NAMES = { fert: "Fertilisation Quest", preg: "Pregnancy Explorer", cycle: "Cycle Lab", ph: "pH Lab" };
const LAB_HOW = {
  fert: "Steer the sperm to the egg and watch the embryo form",
  preg: "Look at all five parts of the 3D pregnancy model and reach month 9",
  cycle: "Visit days 1, 14 and 28 and try the fertilised egg option",
  ph: "Test 6 substances and use at least 2 different indicators"
};
const P = initProgress({
  store: "dl-ls2-exam3-revision-v1",
  badges: prog => [
    ...[12, 13, 14, 15, 16].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
    ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
    ["Photo hunter", () => prog.labs.photos, "Real photos: find every part on all four photos"],
    ["Hazard match", () => prog.labs.haz, "Match all the hazard symbols correctly"],
    ["pH runner", () => prog.labs.bonus, "Finish a pH Runner round"],
    ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award;

/* ---------------------------------------------------------------- Lesson 12 */
makeMatch($("#matchTerms"), [
  ["Sperm", "Male sex cell"], ["Egg", "Female sex cell"], ["Fertilisation", "Joining of sperm and egg"],
  ["Variation", "Differences between offspring"], ["Sexual reproduction", "Two parents are involved and the offspring are unique"]
]);
makeSorter($("#sortSexual"), [
  ["Two parents make offspring with a new mix of genes", 0, "That is sexual reproduction."],
  ["One parent makes an exact copy of itself", 1, "That is asexual reproduction: a clone."],
  ["A sperm joins an egg", 0, "Fertilisation is part of sexual reproduction."],
  ["Offspring are identical to the parent", 1, "Identical offspring are clones, not sexual reproduction."],
  ["Brothers and sisters look different from each other", 0, "Sexual reproduction mixes genes, so offspring vary."],
  ["Only one parent is needed", 1, "Sexual reproduction needs two parents."]
], ["Sexual reproduction", "Not sexual reproduction"]);
makeSorter($("#sortSpecies"), [
  ["Eggs are often eaten or destroyed by predators", 0, "Sea turtle eggs on beaches are easy for predators to find."],
  ["Females are fertile for only a few days each year", 1, "Giant pandas have a very short breeding window."],
  ["Needs safe forests to raise babies", 2, "Orangutans depend on forest."],
  ["A very long pregnancy of about 16 months", 3, "Rhinos have a very long pregnancy, so few young are born."],
  ["Poor genetic diversity in the wild", 4, "Cheetahs have little variety in their genes."]
], ["Sea turtle", "Panda", "Orangutan", "Rhino", "Cheetah"]);
makeSorter($("#sortBirth"), [
  ["A bird laying eggs in a nest", 0, "Animals that lay eggs are oviparous."],
  ["A dog giving birth to puppies", 1, "Live young: viviparous."],
  ["A shark whose eggs hatch inside her body", 2, "Ovoviviparous: the eggs hatch inside the mother."],
  ["A sea turtle burying her eggs in sand", 0, "She lays eggs: oviparous."],
  ["A human mother giving birth", 1, "Humans give birth to live young."]
], ["Oviparous", "Viviparous", "Ovoviviparous"]);

/* ---------------------------------------------------------------- Lesson 13 */
makeMatch($("#matchStages"), [
  ["Fertilisation", "Joining of sperm and egg"], ["Zygote", "A single fertilised cell"], ["Embryo", "A ball of cells attached to the uterus wall"],
  ["Foetus", "A baby with organs, bones and a heartbeat"]
]);
makeOrder($("#orderStages"), [
  ["Fertilisation", "A sperm joins an egg in the oviduct"], ["Zygote", "One fertilised cell"], ["Embryo", "Attached to the uterus wall"], ["Foetus", "Organs, bones and a heartbeat"], ["Baby", "Born after about 9 months"]
]);
makeMatch($("#matchPreg"), [
  ["Placenta", "Brings oxygen and nutrients, removes waste"], ["Umbilical cord", "Links the baby to the placenta"], ["Amniotic sac", "Fluid-filled bag that protects the baby"], ["Uterus", "Where the baby grows"]
]);
makeAnswer($("#ans1"), [
  ["The placenta connects the baby to the mother.", true],
  ["It brings oxygen and nutrients from the mother's blood to the baby.", true],
  ["It removes waste products such as carbon dioxide from the baby.", true],
  ["If it failed, the baby would not get enough oxygen or nutrients.", true],
  ["Waste could build up, so the foetus would grow poorly or be harmed.", true],
  ["The placenta protects the baby with fluid.", false],
  ["The placenta makes sperm.", false],
  ["If it failed, nothing would change for the baby.", false]
], $("#ans1Check"), $("#ans1Reset"), $("#ans1Out"));

/* ---------------------------------------------------------------- Lesson 14 */
makeSorter($("#sortDays"), [
  ["Days 1 to 5", 0, "The uterus lining breaks down and is lost: menstruation."],
  ["Day 14", 2, "An egg is released from the ovary: ovulation."],
  ["Days 6 to 13", 1, "A new lining builds and an egg matures."],
  ["Days 15 to 28", 3, "The lining stays thick, waiting for a fertilised egg."]
], ["Menstruation", "Lining builds, egg matures", "Ovulation", "Lining stays thick"]);
makeMatch($("#matchHormones"), [
  ["FSH", "Stimulates eggs to mature in the ovaries"], ["LH", "Triggers egg release from the ovary (ovulation)"],
  ["Oestrogen", "Repairs and builds the uterus lining"], ["Progesterone", "Maintains the thick uterus lining"]
]);
makeSorter($("#sortHormone"), [
  ["Which hormone triggers ovulation?", 1, "LH causes the egg to be released."],
  ["Which hormone keeps the lining thick after ovulation?", 3, "Progesterone maintains the lining."],
  ["Which hormone makes eggs mature?", 0, "FSH stimulates eggs to mature."],
  ["Which hormone rebuilds the lining after a period?", 2, "Oestrogen builds the lining."]
], ["FSH", "LH", "Oestrogen", "Progesterone"]);
makeAnswer($("#ans2"), [
  ["FSH makes an egg mature in the ovary.", true],
  ["Oestrogen builds and repairs the uterus lining.", true],
  ["LH triggers ovulation, the release of the egg, around day 14.", true],
  ["Progesterone keeps the lining thick so a fertilised egg can attach.", true],
  ["The hormones work together in a sequence, so the egg and the lining are ready at the same time.", true],
  ["If this timing is disrupted, no egg may be released or the lining may not be ready, so pregnancy cannot happen.", true],
  ["Hormones are only made by the uterus.", false],
  ["The cycle has no link to pregnancy.", false]
], $("#ans2Check"), $("#ans2Reset"), $("#ans2Out"));

/* ---------------------------------------------------------------- Lesson 15: hazard symbols */
const HAZ = [
  ["corr", "Corrosive", "Damages skin or eyes"], ["flame", "Flame", "Flammable: easily catches fire"], ["bomb", "Exploding bomb", "Explosive if heated"],
  ["excl", "Exclamation mark", "Harmful or irritant"], ["bio", "Biohazard", "Dangerous bacteria, virus or toxin"]
];
function hazSVG(k) {
  const g = {
    corr: '<path d="M30 28h10v12l-5 8-5-8zM46 22h10v14l-5 9-5-9z" fill="#111"/><path d="M26 56h40" stroke="#111" stroke-width="4"/><path d="M33 52c2 4 6 4 8 0M50 50c2 4 6 4 8 0" stroke="#111" stroke-width="3" fill="none"/>',
    flame: '<path d="M48 18c2 10 14 16 14 30a14 14 0 0 1-28 0c0-8 6-10 6-18 4 2 6 6 6 10 4-6 4-14 2-22z" fill="#111"/>',
    bomb: '<circle cx="44" cy="52" r="14" fill="#111"/><path d="M52 40l8-8M62 28l-3 4m3-4l4 2m-4-2l-1-4" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M20 28l8 6m-8 2l8-2m-2-12l6 8" stroke="#111" stroke-width="3" stroke-linecap="round"/>',
    excl: '<rect x="44" y="22" width="8" height="26" rx="3" fill="#111"/><circle cx="48" cy="58" r="5" fill="#111"/>',
    bio: '<g fill="none" stroke="#111" stroke-width="5"><circle cx="48" cy="46" r="7"/><path d="M48 39a14 14 0 0 1 12-12M41 50a14 14 0 0 1-12-8M54 52a14 14 0 0 1-2 14"/><circle cx="48" cy="46" r="17" stroke-width="3"/></g>'
  }[k];
  return `<svg viewBox="0 0 96 96" role="img" aria-hidden="true"><rect x="14" y="14" width="68" height="68" transform="rotate(45 48 48)" fill="${k === "bio" ? "#ffeb3b" : "#fff"}" stroke="${k === "bio" ? "#111" : "#d32f2f"}" stroke-width="7"/>${g}</svg>`;
}
$("#hazGrid").innerHTML = HAZ.map(h => `<div class="hz__c"><span class="hz__i">${hazSVG(h[0])}</span><b>${T(h[1])}</b><small>${T(h[2])}</small></div>`).join("");
makeMatch($("#matchHaz"), HAZ.map(h => [h[1], h[2]]), () => award("haz"));
makeSorter($("#sortAcid"), [
  ["Vinegar", 0, "A weak acid: safe in food, but sour."], ["Battery acid", 1, "A strong acid: dangerous and corrosive."],
  ["Bleach", 3, "A strong alkali: corrosive to skin."], ["Washing-up liquid", 2, "A weak alkali: a mild irritant."],
  ["Oven cleaner", 3, "A strong alkali that can cause burns."], ["Lemon juice", 0, "A weak acid."]
], ["Weak acid", "Strong acid", "Weak alkali", "Strong alkali"]);
makeSorter($("#sortHazard"), [
  ["Why are hazard symbols important on bottles?", 0, "They warn people of dangers and help prevent accidents."],
  ["A bottle shows a flame symbol. What should you do?", 1, "Keep it away from heat and sparks because it catches fire easily."],
  ["A bottle shows the corrosive symbol. What should you do?", 2, "Protect your skin and eyes: it can cause burns."]
], ["They warn people and help prevent accidents", "Keep it away from heat and sparks", "Wear eye protection and gloves"]);

/* ---------------------------------------------------------------- Lesson 16 */
const PHCOL = ["#e53935", "#e53935", "#e53935", "#ef6c00", "#fb8c00", "#fdd835", "#c0ca33", "#43a047", "#26a69a", "#1e88e5", "#3949ab", "#5e35b1", "#7b1fa2", "#8e24aa", "#6a1b9a"];
$("#phScale").innerHTML = PHCOL.map((c, i) => `<span style="background:${c}"><b>${i}</b></span>`).join("") + `<div class="phscale__lbl"><span>${T("Strong acid")}</span><span>${T("Neutral")}</span><span>${T("Strong alkali")}</span></div>`;
makeMatch($("#matchColours"), [
  ["pH 1", "Red"], ["pH 3", "Orange or yellow"], ["pH 7", "Green"], ["pH 10", "Blue"], ["pH 14", "Purple"]
]);
makeSorter($("#sortPH"), [
  ["Lemon juice, pH 2", 0, "Below 7: an acid."], ["Pure water, pH 7", 1, "Exactly 7: neutral."], ["Soap solution, pH 9", 2, "Above 7: an alkali."],
  ["Vinegar, pH 3", 0, "Below 7: an acid."], ["Bleach, pH 12", 2, "Above 7: a strong alkali."], ["A liquid at pH 7", 1, "pH 7 is neutral."]
], ["Acid", "Neutral", "Alkali"]);
makeSorter($("#sortIndicator"), [
  ["Turns red in an acid and blue in an alkali", 0, "That is litmus paper."],
  ["Shows a different colour for every pH value", 1, "That is universal indicator."],
  ["A natural indicator from a vegetable", 2, "Red cabbage changes colour in acids and alkalis."],
  ["Stays the same colour in a neutral solution", 0, "Litmus does not change in neutral."]
], ["Litmus paper", "Universal indicator", "Red cabbage"]);
makeAnswer($("#ans3"), [
  ["Wear safety glasses and be careful with strong acids and alkalis.", true],
  ["Use the same amount of each liquid and the same indicator every time.", true],
  ["Use a pH indicator such as universal indicator or a pH probe to find each pH.", true],
  ["Record each substance and its pH in a table.", true],
  ["Repeat the test to make the results more reliable.", true],
  ["Rinse the equipment between tests.", true],
  ["Taste each liquid to see if it is an acid.", false],
  ["Mix all five liquids together in one cup.", false],
  ["Use a different indicator for every liquid.", false]
], $("#ans3Check"), $("#ans3Reset"), $("#ans3Out"));

/* ---------------------------------------------------------------- real-photo tap-the-part */
initHotspots({
  cabbage: { name: "Red cabbage test", img: "photos/cabbage.jpg", alt: "Test tubes of red cabbage indicator in different colours, from pink to yellow-green", tasks: [
    ["Tap the pink tube on the left. Phosphoric acid turns the indicator pink.", .09, .27, "Acid", "Acids turn red cabbage indicator pink or red."],
    ["Tap the purple tube. It holds a neutral salt solution.", .42, .27, "Neutral", "A neutral solution keeps the cabbage purple."],
    ["Tap the yellow-green tube on the right. It holds a strong alkali.", .65, .27, "Alkali", "Alkalis turn red cabbage blue, green or yellow."]] },
  cleaner: { name: "Hazard label", img: "photos/cleaner.jpg", alt: "A cleaner bottle label showing the corrosive hazard symbol and the word Danger", tasks: [
    ["Tap the corrosive hazard symbol (a red diamond).", .44, .115, "Corrosive symbol", "The corrosive symbol warns that the contents can damage skin and eyes."],
    ["Tap the word Danger.", .29, .205, "Danger", "A signal word warns how serious the hazard is. This cleaner contains a strong alkali (sodium hydroxide)."]] },
  panda: { name: "Giant panda", img: "photos/panda.jpg", alt: "A giant panda cub looking at the camera", tasks: [
    ["Tap the panda's face.", .62, .38, "Giant panda", "Female pandas are fertile for only a few days each year, so they are hard to breed in captivity."],
    ["Tap the panda's black ear.", .70, .08, "Ear", "Look at the black and white pattern: this is a young panda, which was born alive (viviparous)."]] },
  turtle: { name: "Sea turtles", img: "photos/turtle.jpg", alt: "Two baby loggerhead sea turtles on a sandy beach", tasks: [
    ["Tap a baby turtle.", .30, .55, "Hatchling", "Sea turtles lay eggs (oviparous). The eggs and hatchlings are often eaten by predators."],
    ["Tap the sand where the nest was buried.", .60, .85, "Sand", "Conservationists protect nesting areas so more eggs survive."]] }
}, "cabbage", award);

/* ================================================================ 3D HERO: egg and sperm */
function makeSperm(THREE, color) {
  const g = new THREE.Group(); const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mat(THREE, color, { roughness: 0.35 })); head.scale.set(1, 0.75, 1.35); g.add(head);
  const tail = []; for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05 * (1 - i / 16), 8, 6), mat(THREE, color, { roughness: 0.35 })); s.position.z = -0.2 - i * 0.1; g.add(s); tail.push(s); }
  g.userData.tail = tail; return g;
}
function wag(sp, t, amp = 1) { sp.userData.tail.forEach((s, i) => { s.position.x = Math.sin(t * 12 - i * 0.75) * 0.045 * (1 + i * 0.18) * amp; }); }
function makeEgg(THREE, r = 1) {
  const g = new THREE.Group();
  const zona = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), new THREE.MeshStandardMaterial({ color: 0xffd6e0, transparent: true, opacity: 0.38, roughness: 0.2, metalness: 0, side: THREE.DoubleSide })); g.add(zona);
  const cyto = new THREE.Mesh(new THREE.SphereGeometry(r * 0.86, 32, 24), new THREE.MeshStandardMaterial({ color: 0xffb3c6, roughness: 0.5, emissive: 0x330a14 })); g.add(cyto);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(r * 0.28, 24, 18), new THREE.MeshStandardMaterial({ color: 0x8e5bd6, roughness: 0.4, emissive: 0x2a0a50 })); nuc.position.set(-r * 0.15, r * 0.1, r * 0.15); g.add(nuc);
  g.userData.nuc = nuc; g.userData.zona = zona; return g;
}
(function () {
  const S = make3D($("#heroStage"), { cam: [0, 1.6, 6.5], target: [0, 0, 0], auto: 0.18, bg: null, hint: "Drag sideways to turn it" });
  if (!S) return; const THREE = S.THREE;
  const egg = makeEgg(THREE, 1.1); S.scene.add(egg);
  const swarm = []; for (let i = 0; i < 16; i++) { const sp = makeSperm(THREE, i === 0 ? 0xf3d36b : 0xe8f4ee); const a = rnd(0, 6.28), e = rnd(-0.6, 0.6), d = rnd(2.4, 4.2); sp.userData.a = a; sp.userData.e = e; sp.userData.d = d; sp.userData.sp = rnd(0.3, 0.6); sp.userData.ph = rnd(0, 6.28); sp.scale.setScalar(1.1); swarm.push(sp); S.scene.add(sp); }
  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 140 }, () => new THREE.Vector3(rnd(-6, 6), rnd(-3, 3), rnd(-6, 6)))), new THREE.PointsMaterial({ size: 0.05, color: 0x9ff0cc, transparent: true, opacity: 0.6, map: glowTexture(THREE), depthWrite: false })); S.scene.add(dust);
  S.onFrameHook = (dt, t) => {};
  const prev = S; let t0 = 0;
  const loop = () => { requestAnimationFrame(loop); const t = performance.now() / 1000; egg.rotation.y = t * 0.12; egg.userData.zona.material.opacity = 0.34 + Math.sin(t * 1.5) * 0.05;
    swarm.forEach(sp => { const u = sp.userData; u.d = Math.max(1.5, u.d - u.sp * 0.004 * 60 * 0.016 * 3); if (u.d <= 1.5) u.d = rnd(3.6, 4.6); u.a += 0.004 * u.sp * 1.5; const r = u.d, a = u.a + Math.sin(t + u.ph) * 0.1; sp.position.set(Math.cos(a) * r * Math.cos(u.e), Math.sin(u.e) * r, Math.sin(a) * r * Math.cos(u.e)); const aim = new THREE.Vector3().copy(sp.position).multiplyScalar(0.5); sp.lookAt(aim); wag(sp, t + u.ph); }); };
  loop();
})();

/* ================================================================ LAB 1: FERTILISATION QUEST (3D) */
(function () {
  const host = $("#fertStage"); const S = make3D(host, { cam: [2.4, 7.4, 6.6], target: [2.4, 0, 0], auto: 0, hint: null, onPick: rc => aimFromPick(rc) });
  const hud = $("#fertHud"), tip = $("#fertTip");
  const steps = $$("#fertSteps li");
  const setStep = n => steps.forEach((li, i) => { li.classList.toggle("on", i === n); li.classList.toggle("done", i < n); });
  if (!S) { tip.textContent = T("3D view is not available on this device. Everything else on the page still works."); return; }
  const THREE = S.THREE;
  S.spin = 0; S.polar = 0.3;
  /* tube: a long translucent cylinder lying along x */
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 14, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xff9db0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, roughness: 0.6 }));
  tube.rotation.z = Math.PI / 2; tube.position.x = 2; S.scene.add(tube);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.2), new THREE.MeshStandardMaterial({ color: 0x3a1a26, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.set(2, -1.2, 0); S.scene.add(floor);
  const egg = makeEgg(THREE, 1.3); egg.position.set(7.3, 0, 0); S.scene.add(egg);
  const player = makeSperm(THREE, 0xf3d36b); player.scale.setScalar(1.6); S.scene.add(player);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "243,211,107"), transparent: true, depthWrite: false })); glow.scale.set(1.4, 1.4, 1); player.add(glow);
  const rivals = []; for (let i = 0; i < 9; i++) { const sp = makeSperm(THREE, 0xe8f4ee); sp.scale.setScalar(1.4); sp.userData = Object.assign(sp.userData, { v: rnd(0.35, 0.8), ph: rnd(0, 6) }); rivals.push(sp); S.scene.add(sp); }
  const cells = []; const cellGroup = new THREE.Group(); S.scene.add(cellGroup);
  const lblEgg = labelSprite(THREE, T("Egg"), "#ffd6e0"); lblEgg.position.set(7.3, 2.1, 0); S.scene.add(lblEgg);
  const lblSp = labelSprite(THREE, T("Sperm"), "#f3d36b"); S.scene.add(lblSp);
  const aim = new THREE.Vector3(7, 0, 0); let phase = "swim", t = 0, fertT = 0, splits = 0, keys = {}, pos = new THREE.Vector3(-2.6, 0, 0.4), flash = null;
  function reset() { phase = "swim"; t = 0; splits = 0; fertT = 0; pos.set(-2.6, 0, 0.4); aim.set(7, 0, 0); cellGroup.clear(); cells.length = 0; player.visible = true; egg.userData.nuc.visible = true; egg.userData.zona.material.opacity = 0.38; rivals.forEach((r, i) => { r.visible = true; r.position.set(rnd(-4, 0), 0, rnd(-1.9, 1.9)); r.userData.keep = true; }); setStep(0); hud.textContent = T("Sperm cell"); tip.textContent = T("Tap or click in the tube to steer, or use the arrow keys. Swim towards the big egg on the right."); }
  function aimFromPick(rc) { const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const p = new THREE.Vector3(); if (rc.ray.intersectPlane(plane, p)) aim.set(clamp(p.x, -4, 7.3), 0, clamp(p.z, -2, 2)); }
  addEventListener("keydown", e => { if (!host.contains(document.activeElement) && document.activeElement !== host && !$("#lab-fert").contains(document.activeElement)) return; const m = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r", w: "u", s: "d", a: "l", d: "r" }[e.key]; if (m) { keys[m] = true; e.preventDefault(); } });
  addEventListener("keyup", e => { const m = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r", w: "u", s: "d", a: "l", d: "r" }[e.key]; if (m) keys[m] = false; });
  [["fUp", "u"], ["fDown", "d"], ["fLeft", "l"], ["fRight", "r"]].forEach(([id, k]) => { const b = $("#" + id); const on = e => { keys[k] = true; e.preventDefault(); }; const off = () => { keys[k] = false; }; b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { keys[k] = true; setTimeout(() => keys[k] = false, 250); e.preventDefault(); } }); });
  $("#fAgain").addEventListener("click", reset);
  /* z axis is "up" on the screen (camera looks from +z/up), so up = -z */
  let last = performance.now();
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (phase === "swim") {
      let vx = 0, vz = 0; if (keys.l) vx -= 1; if (keys.r) vx += 1; if (keys.u) vz -= 1; if (keys.d) vz += 1;
      if (vx || vz) { aim.set(pos.x + vx * 3, 0, pos.z + vz * 3); }
      const dir = new THREE.Vector3().subVectors(aim, pos); const dist = dir.length(); if (dist > 0.15) { dir.normalize(); pos.addScaledVector(dir, Math.min(dist, 2.1 * dt)); }
      pos.x -= 0.25 * dt; /* the current pushes back a little */ pos.x = clamp(pos.x, -4.2, 6.2); pos.z = clamp(pos.z, -2, 2);
      player.position.copy(pos); if (dist > 0.15) player.lookAt(pos.clone().add(dir)); wag(player, t, 1.3); lblSp.position.set(pos.x, 1.4, pos.z);
      rivals.forEach(r => { const u = r.userData; r.position.x += u.v * dt * 0.8; r.position.z += Math.sin(t * 1.3 + u.ph) * 0.6 * dt; r.position.z = clamp(r.position.z, -2, 2); if (r.position.x > 6) r.position.x = rnd(-4.5, -3); r.lookAt(r.position.x + 1, 0, r.position.z + Math.cos(t * 1.3 + u.ph) * 0.4); wag(r, t + u.ph); });
      if (pos.distanceTo(egg.position) < 1.9) { phase = "fert"; fertT = 0; setStep(1); hud.textContent = T("Fertilisation!"); tip.textContent = T("The sperm joins the egg. Only one sperm gets in, and the egg then blocks the others."); player.visible = false; egg.userData.nuc.scale.set(1.3, 1.3, 1.3); }
    } else if (phase === "fert") {
      fertT += dt; rivals.forEach(r => { r.position.x -= dt * 1.5; r.visible = r.position.x > -4.4 ? true : false; r.scale.setScalar(Math.max(0.2, 1.4 - fertT * 0.7)); }); egg.userData.zona.material.opacity = 0.38 + Math.sin(fertT * 10) * 0.2;
      if (fertT > 2.2) { phase = "zygote"; fertT = 0; setStep(2); hud.textContent = T("Zygote"); tip.textContent = T("One fertilised cell, a zygote, has formed. It starts to divide."); rivals.forEach(r => r.visible = false); egg.userData.zona.material.opacity = 0.3; const c = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), new THREE.MeshStandardMaterial({ color: 0xc58cf0, roughness: 0.4, emissive: 0x2a0a50 })); c.position.copy(egg.position); cellGroup.add(c); cells.push(c); egg.userData.nuc.visible = false; }
    } else if (phase === "zygote") {
      fertT += dt; if (fertT > 1.6 && splits < 4) { fertT = 0; splits++; const n = Math.pow(2, splits), rad = 0.5 / Math.pow(n, 0.28); cellGroup.clear(); cells.length = 0; for (let i = 0; i < n; i++) { const a = i / n * 6.28, ring = n === 2 ? 0.36 : 0.55 + (i % 2) * 0.1; const c = new THREE.Mesh(new THREE.SphereGeometry(rad, 20, 14), new THREE.MeshStandardMaterial({ color: 0xc58cf0, roughness: 0.4, emissive: 0x2a0a50 })); c.position.set(egg.position.x + Math.cos(a) * ring, Math.sin(a * 2) * 0.2, egg.position.z + Math.sin(a) * ring); cellGroup.add(c); cells.push(c); } hud.textContent = `${n} ${T("cells")}`; if (splits >= 2) { setStep(3); } if (splits === 4) { tip.textContent = T("A ball of 16 cells: an embryo. It travels to the uterus and attaches to the lining."); award("fert"); } }
      cellGroup.rotation.y += dt * 0.6;
    }
    egg.rotation.y += dt * 0.15; renderGuard();
  })();
  function renderGuard() { /* make3D renders each frame; this loop only moves the actors */ }
  reset();
})();

/* ================================================================ LAB 2: PREGNANCY EXPLORER (3D) */
(function () {
  const host = $("#pregStage"); const S = make3D(host, { cam: [0, 1.4, 7.2], target: [0, 0.1, 0], auto: 0.15 });
  const info = $("#pregInfo"), slider = $("#pregMonth");
  const MS = { 1: "The fertilised egg implants in the uterus.", 2: "The embryo grows. Its heart starts to beat.", 3: "The baby has eyes, arms, legs and a heartbeat.", 4: "Bones harden and the baby grows quickly.", 5: "The baby's movements may be felt.", 6: "The baby can move and hear sounds.", 7: "The baby opens its eyes and keeps growing.", 8: "The baby gains weight and turns head down.", 9: "The baby is fully developed and ready to be born." };
  Object.values(MS).forEach(T); ["Uterus", "Amniotic sac", "Placenta", "Umbilical cord", "Foetus", "The muscular bag where the baby grows for about nine months.", "A fluid-filled sac that cushions and protects the baby.", "Brings oxygen and nutrients to the baby and takes waste away.", "Links the baby to the placenta.", "The developing baby."].forEach(T);
  if (!S) { info.innerHTML = `<b>${T("3D view is not available on this device. Everything else on the page still works.")}</b>`; return; }
  const THREE = S.THREE;
  const uterus = new THREE.Mesh(new THREE.SphereGeometry(2.7, 36, 28), new THREE.MeshStandardMaterial({ color: 0xff9aa8, transparent: true, opacity: 0.25, roughness: 0.5, side: THREE.DoubleSide })); uterus.scale.set(1, 1.2, 0.95); S.scene.add(uterus);
  const rim = new THREE.Mesh(new THREE.SphereGeometry(2.72, 36, 28), new THREE.MeshBasicMaterial({ color: 0xff6f8a, wireframe: true, transparent: true, opacity: 0.12 })); rim.scale.copy(uterus.scale); S.scene.add(rim);
  const sac = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.32, roughness: 0.1, side: THREE.DoubleSide })); S.scene.add(sac);
  const baby = new THREE.Group(); S.scene.add(baby);
  const skin = new THREE.MeshStandardMaterial({ color: 0xffc9a8, roughness: 0.6, emissive: 0x000000 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), skin); head.position.set(0, 0.75, 0); baby.add(head);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), skin); body.scale.set(0.9, 1.15, 0.9); body.position.set(0, 0, 0); baby.add(body);
  const limbs = []; [[-0.6, 0.2, 0.2, 0.9], [0.6, 0.2, -0.2, -0.9], [-0.25, -0.75, 0.1, 0.2], [0.25, -0.75, -0.1, -0.2]].forEach(l => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.7, 12), skin); m.position.set(l[0], l[1], 0); m.rotation.z = l[3]; baby.add(m); limbs.push(m); });
  const eyes = [-0.18, 0.18].map(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: 0x222222 })); e.position.set(x, 0.82, 0.46); baby.add(e); return e; });
  const placenta = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.28, 28), new THREE.MeshStandardMaterial({ color: 0xb3262e, roughness: 0.7 })); placenta.position.set(1.95, 1.2, 0); placenta.rotation.z = 0.5; S.scene.add(placenta);
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.1, 0.45), new THREE.Vector3(0.9, 0.2, 0.8), new THREE.Vector3(1.4, 0.9, 0.4), new THREE.Vector3(1.8, 1.15, 0.1)]), 30, 0.07, 8), new THREE.MeshStandardMaterial({ color: 0xe5a0a8, roughness: 0.5 })); S.scene.add(cord);
  const PARTS = { uterus: [uterus, "Uterus", "The muscular bag where the baby grows for about nine months."], sac: [sac, "Amniotic sac", "A fluid-filled sac that cushions and protects the baby."], placenta: [placenta, "Placenta", "Brings oxygen and nutrients to the baby and takes waste away."], cord: [cord, "Umbilical cord", "Links the baby to the placenta."], baby: [baby, "Foetus", "The developing baby."] };
  const seen = new Set(); let sel = null, month = 1, pulse = 0;
  const chips = $("#pregParts"); Object.keys(PARTS).forEach(k => { const b = el("button", "", T(PARTS[k][1])); b.addEventListener("click", () => pick(k)); chips.append(b); });
  function setEmissive(obj, v) { obj.traverse && obj.traverse(o => { if (o.material && o.material.emissive) o.material.emissive.setRGB(v * 0.5, v * 0.4, v * 0.1); }); }
  function pick(k) { sel = k; seen.add(k); pulse = 1; $$("button", chips).forEach((b, i) => b.classList.toggle("on", Object.keys(PARTS)[i] === k)); info.innerHTML = `<b>${T(PARTS[k][1])}</b><p>${T(PARTS[k][2])}</p>`; check(); }
  function check() { if (seen.size >= 5 && month >= 9) award("preg"); }
  function set(m) { month = m; slider.value = m; $("#pmLbl").textContent = m; const f = [0.1, 0.18, 0.3, 0.42, 0.55, 0.68, 0.8, 0.9, 1][m - 1]; baby.scale.setScalar(f * 1.0); sac.scale.setScalar(0.35 + f * 1.45); uterus.scale.set(0.6 + f * 0.4, 0.75 + f * 0.45, 0.6 + f * 0.35); rim.scale.copy(uterus.scale); limbs.forEach(l => l.visible = m >= 3); eyes.forEach(e => e.visible = m >= 3); placenta.scale.setScalar(0.4 + f * 0.6); $("#mPreg").style.width = (f * 100) + "%"; $("#tPreg").textContent = m + " / 9"; if (!sel) info.innerHTML = `<b>${T("Month")} ${m}</b><p>${T(MS[m])}</p>`; else info.innerHTML = `<b>${T("Month")} ${m}</b><p>${T(MS[m])}</p><p class="tip">${T(PARTS[sel][1])}: ${T(PARTS[sel][2])}</p>`; check(); }
  slider.addEventListener("input", e => set(+e.target.value));
  let timer = null; $("#pregPlay").addEventListener("click", () => { if (timer) { clearInterval(timer); timer = null; $("#pregPlay").textContent = T("Play the nine months"); return; } set(1); $("#pregPlay").textContent = T("Pause"); timer = setInterval(() => { if (month >= 9) { clearInterval(timer); timer = null; $("#pregPlay").textContent = T("Play the nine months"); return; } set(month + 1); }, 1400); });
  S.onFrame = null;
  let last = performance.now(); (function loop() { requestAnimationFrame(loop); const t = performance.now() / 1000, dt = Math.min(0.05, (performance.now() - last) / 1000); last = performance.now(); baby.position.y = Math.sin(t * 1.2) * 0.05 + (month >= 6 ? Math.sin(t * 5) * 0.03 : 0); baby.rotation.z = Math.sin(t * 0.8) * 0.08; pulse = Math.max(0, pulse - dt * 0.8); Object.keys(PARTS).forEach(k => setEmissive(PARTS[k][0], k === sel ? 0.4 + Math.sin(t * 6) * 0.3 * pulse : 0)); })();
  set(1);
})();

/* ================================================================ LAB 3: CYCLE LAB */
(function () {
  const cv = $("#cycCanvas"), slider = $("#cyDay"), pregBox = $("#cyPreg"); let day = 1, play = false, acc = 0; const visited = new Set();
  const g = (d, c, w) => Math.exp(-Math.pow((d - c) / w, 2));
  const H = { FSH: ["#f3d36b", d => 0.25 + 0.4 * g(d, 4, 3) + 0.35 * g(d, 13, 1.6)], LH: ["#ff7b9c", d => 0.1 + 0.9 * g(d, 13.5, 1.1)], Oestrogen: ["#7dc6ff", d => 0.15 + 0.7 * g(d, 12.5, 2.6) + 0.3 * g(d, 21, 3.5)], Progesterone: ["#a56fd6", (d, p) => 0.05 + 0.85 * g(d, 21, 3.6) + (p && d > 21 ? 0.85 * (1 - g(d, 21, 3.6)) : 0)] };
  const pregnant = () => pregBox.checked;
  const lining = d => { if (pregnant() && d > 20) return 1; return d <= 5 ? 0.55 - d * 0.09 : d <= 13 ? 0.1 + (d - 5) * 0.09 : d <= 25 ? 0.85 + (d - 14) * 0.012 : 1 - (d - 25) * 0.18; };
  const STAGE = d => d <= 5 ? ["Menstruation", "The uterus lining breaks down and is lost."] : d <= 13 ? ["Lining builds, egg matures", "FSH makes an egg mature. Oestrogen builds a new lining."] : d === 14 ? ["Ovulation", "LH peaks and the egg is released from the ovary."] : ["Lining stays thick", pregnant() ? "The egg is fertilised: progesterone stays high and the lining stays thick for the baby." : "Progesterone keeps the lining thick, waiting for a fertilised egg. If none arrives, the lining breaks down."];
  const key = $("#cyKey"); key.innerHTML = Object.keys(H).map(k => `<span class="hk" style="--c:${H[k][0]}"><i></i>${T(k)}</span>`).join("");
  function setDay(d) { day = clamp(Math.round(d), 1, 28); slider.value = day; $("#cyDayLbl").textContent = day; const s = STAGE(day); $("#cyInfo").innerHTML = `<b>${T(s[0])}</b><p>${T(s[1])}</p>`; $("#cycHud").textContent = `${T("Day")} ${day}: ${T(s[0])}`; visited.add(day); if (visited.has(1) && visited.has(14) && visited.has(28) && pregBox.checked) award("cycle"); }
  slider.addEventListener("input", e => { play = false; $("#cyPlay").textContent = T("Play the cycle"); setDay(+e.target.value); });
  pregBox.addEventListener("change", () => setDay(day));
  $("#cyPlay").addEventListener("click", () => { play = !play; $("#cyPlay").textContent = play ? T("Pause") : T("Play the cycle"); if (play && day >= 28) setDay(1); });
  setDay(1);
  rafLoop(cv, (ctx, dt) => {
    if (play) { acc += dt; if (acc > 0.45) { acc = 0; if (day >= 28) { play = false; $("#cyPlay").textContent = T("Play the cycle"); } else setDay(day + 1); } }
    ctx.clearRect(0, 0, 640, 480); const bg = ctx.createLinearGradient(0, 0, 0, 480); bg.addColorStop(0, "#1b2230"); bg.addColorStop(1, "#0b0f18"); ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 480);
    // top: ovary, oviduct, uterus
    ctx.fillStyle = "#cfe4dc"; ctx.font = "bold 13px sans-serif"; ctx.fillText(T("Ovary"), 40, 28); ctx.fillText(T("Uterus"), 420, 28);
    ctx.fillStyle = "#e57f9b"; ctx.beginPath(); ctx.ellipse(90, 100, 55, 40, 0, 0, 6.28); ctx.fill();
    const fol = day < 14 ? 6 + Math.max(0, day - 5) * 1.6 : 6; ctx.fillStyle = "#fff2d6"; ctx.beginPath(); ctx.arc(80, 100, fol, 0, 6.28); ctx.fill(); ctx.fillStyle = "#f3d36b"; ctx.beginPath(); ctx.arc(80, 100, Math.min(fol, 9) * 0.5, 0, 6.28); ctx.fill();
    // oviduct path from ovary to uterus
    ctx.strokeStyle = "#e0889d"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(140, 80); ctx.quadraticCurveTo(250, 30, 380, 100); ctx.stroke();
    let ex = 80, ey = 100; if (day >= 14) { const f = clamp((day - 14) / 5, 0, 1); const u = f; ex = 140 + (380 - 140) * u; ey = 80 + (100 - 80) * u - Math.sin(u * 3.14) * 40; ctx.fillStyle = "#f3d36b"; ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 6.28); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "11px sans-serif"; ctx.fillText(T("egg"), ex - 8, ey - 14); if (day > 18 && pregnant()) { ctx.fillStyle = "#c58cf0"; ctx.beginPath(); ctx.arc(430, 150, 10, 0, 6.28); ctx.fill(); } }
    // uterus lining
    ctx.fillStyle = "#7a2f46"; rr(ctx, 380, 45, 220, 150, 40); ctx.fill(); const L = clamp(lining(day), 0.05, 1); ctx.fillStyle = "#e8648a"; rr(ctx, 392 + (1 - L) * 22, 57 + (1 - L) * 22, 196 - (1 - L) * 44, 126 - (1 - L) * 44, 30); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText(T("lining"), 468, 125);
    if (day <= 5) { for (let i = 0; i < 6; i++) { ctx.fillStyle = "rgba(200,30,60,.8)"; ctx.beginPath(); ctx.arc(480 + Math.sin(i + performance.now() / 300) * 14, 200 + ((performance.now() / 20 + i * 12) % 40), 4, 0, 6.28); ctx.fill(); } }
    // chart
    const X0 = 50, X1 = 620, Y0 = 440, Y1 = 250; ctx.strokeStyle = "#ffffff22"; ctx.lineWidth = 1; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(X0, Y1 + (Y0 - Y1) * i / 4); ctx.lineTo(X1, Y1 + (Y0 - Y1) * i / 4); ctx.stroke(); }
    ctx.fillStyle = "#a9c9bc"; ctx.font = "11px sans-serif"; [1, 5, 14, 28].forEach(d => ctx.fillText(String(d), X0 + (d - 1) / 27 * (X1 - X0) - 4, 458)); ctx.fillText(T("Day"), X1 - 22, 472);
    [[1, 5, "rgba(200,30,60,.15)"], [6, 13, "rgba(90,200,150,.1)"], [14, 14, "rgba(243,211,107,.35)"], [15, 28, "rgba(165,111,214,.12)"]].forEach(b => { const a = X0 + (b[0] - 1) / 27 * (X1 - X0), c = X0 + (b[1] - 1 + (b[0] === b[1] ? 1 : 0.5)) / 27 * (X1 - X0); ctx.fillStyle = b[2]; ctx.fillRect(a, Y1, Math.max(6, c - a), Y0 - Y1); });
    Object.keys(H).forEach(k => { ctx.strokeStyle = H[k][0]; ctx.lineWidth = 3; ctx.beginPath(); for (let d = 1; d <= 28; d += 0.25) { const v = H[k][1](d, pregnant()), x = X0 + (d - 1) / 27 * (X1 - X0), y = Y0 - clamp(v, 0, 1.05) * (Y0 - Y1 - 10); d === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); });
    const mx = X0 + (day - 1) / 27 * (X1 - X0); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, Y1 - 6); ctx.lineTo(mx, Y0); ctx.stroke();
  });
})();

/* ================================================================ LAB 4: pH LAB */
(function () {
  const cv = $("#phCanvas");
  const SUB = [["Battery acid", 1, "corr", "Strong acid"], ["Lemon juice", 2, "", "Weak acid"], ["Vinegar", 3, "", "Weak acid"], ["Pure water", 7, "", "Neutral"], ["Washing-up liquid", 8, "excl", "Weak alkali"], ["Soap solution", 9, "", "Weak alkali"], ["Bleach", 12, "corr", "Strong alkali"], ["Oven cleaner", 13, "corr", "Strong alkali"]];
  $("#phSub").innerHTML = SUB.map((s, i) => `<option value="${i}">${T(s[0])}</option>`).join("");
  const IND = { ui: pH => PHCOL[clamp(Math.round(pH), 0, 14)], lit: pH => pH < 7 ? "#e53935" : pH > 7 ? "#1e88e5" : "#c8a8d8", cab: pH => ["#d81b60", "#d81b60", "#d81b60", "#ec407a", "#ec407a", "#ab47bc", "#ab47bc", "#7e57c2", "#5c6bc0", "#42a5f5", "#42a5f5", "#26a69a", "#26a69a", "#9ccc65", "#fdd835"][clamp(Math.round(pH), 0, 14)] };
  const INDN = { ui: "Universal indicator", lit: "Litmus paper", cab: "Red cabbage" };
  let cur = SUB[0], liquid = "#d8ecff", target = "#d8ecff", drops = [], shown = false, tested = new Set(), inds = new Set(), rec = [];
  const pick = () => { cur = SUB[+$("#phSub").value]; liquid = "#d8ecff"; target = "#d8ecff"; shown = false; drops = []; $("#phHud").textContent = T(cur[0]); $("#phInfo").innerHTML = `<b>${T(cur[0])}</b><p>${T("Add the indicator to see the colour.")}</p>`; };
  $("#phSub").addEventListener("change", pick); $("#phInd").addEventListener("change", pick); pick();
  $("#phClear").addEventListener("click", pick);
  $("#phDrop").addEventListener("click", () => {
    const k = $("#phInd").value; for (let i = 0; i < 6; i++) drops.push({ x: 320 + rnd(-6, 6), y: 40 - i * 26, c: IND[k](cur[1]) }); popIt($("#phDrop")); shown = true; target = IND[k](cur[1]);
    const type = cur[1] < 7 ? "Acid" : cur[1] > 7 ? "Alkali" : "Neutral"; const col = { ui: ["red", "orange", "yellow", "green", "blue", "purple"], lit: ["red", "blue", "unchanged"], cab: [] };
    $("#phInfo").innerHTML = `<b>${T(cur[0])}: pH ${cur[1]}</b><p>${T(INDN[k])}: ${T(k === "lit" ? (cur[1] < 7 ? "turns red" : cur[1] > 7 ? "turns blue" : "stays the same") : "shows the colour in the tube")}. ${T(cur[3])}. ${cur[2] ? T("Hazard symbol shown on the bottle.") : T("No serious hazard symbol.")}</p>`;
    const key = cur[0] + "|" + k; if (!tested.has(key)) { tested.add(key); inds.add(k); rec.push([cur[0], INDN[k], cur[1], cur[3]]); $("#phRec").innerHTML = rec.map(r => `<tr><td>${T(r[0])}</td><td>${T(r[1])}</td><td>${r[2]}</td><td>${T(r[3])}</td></tr>`).join(""); }
    if (new Set([...tested].map(x => x.split("|")[0])).size >= 6 && inds.size >= 2) award("ph");
  });
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  let lc = hexRGB("#d8ecff");
  rafLoop(cv, (ctx, dt) => {
    const tc = hexRGB(target); lc = lc.map((v, i) => v + (tc[i] - v) * Math.min(1, dt * 2.2)); liquid = `rgb(${lc.map(Math.round).join(",")})`;
    drops.forEach(d => { d.y += 260 * dt; }); drops = drops.filter(d => d.y < 190);
    ctx.clearRect(0, 0, 640, 480); const bg = ctx.createLinearGradient(0, 0, 0, 480); bg.addColorStop(0, "#14303b"); bg.addColorStop(1, "#08141a"); ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 480);
    // dropper
    ctx.fillStyle = "#e8f4ee"; rr(ctx, 305, 6, 30, 80, 10); ctx.fill(); ctx.fillStyle = "#c43a52"; rr(ctx, 298, 0, 44, 24, 10); ctx.fill();
    // tube
    ctx.save(); ctx.beginPath(); ctx.moveTo(260, 140); ctx.lineTo(260, 370); ctx.arc(320, 370, 60, Math.PI, 0, true); ctx.lineTo(380, 140); ctx.closePath(); ctx.clip();
    ctx.fillStyle = liquid; ctx.fillRect(250, 210, 140, 280); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(268, 150, 16, 300); ctx.restore();
    ctx.strokeStyle = "rgba(230,245,255,.9)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(260, 140); ctx.lineTo(260, 370); ctx.arc(320, 370, 60, Math.PI, 0, true); ctx.lineTo(380, 140); ctx.stroke();
    drops.forEach(d => { ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, 6.28); ctx.fill(); });
    // litmus strip
    if (shown && $("#phInd").value === "lit") { ctx.fillStyle = liquid; ctx.fillRect(420, 170, 36, 180); ctx.strokeStyle = "#fff"; ctx.strokeRect(420, 170, 36, 180); ctx.fillStyle = "#cfe4dc"; ctx.font = "12px sans-serif"; ctx.fillText(T("litmus paper"), 400, 366); }
    // pH scale
    const sx = 40, sw = 560; for (let i = 0; i <= 14; i++) { ctx.fillStyle = PHCOL[i]; ctx.fillRect(sx + i * sw / 15, 420, sw / 15 - 2, 28); ctx.fillStyle = "#000b"; ctx.font = "bold 11px sans-serif"; ctx.fillText(String(i), sx + i * sw / 15 + 4, 438); }
    const mx = sx + cur[1] * sw / 15 + sw / 30 - 1; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(mx, 414); ctx.lineTo(mx - 8, 398); ctx.lineTo(mx + 8, 398); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif"; ctx.fillText(`pH ${cur[1]}`, mx - 16, 392);
    // hazard
    if (cur[2]) { ctx.save(); ctx.translate(100, 190); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#fff"; ctx.strokeStyle = "#d32f2f"; ctx.lineWidth = 8; ctx.fillRect(-36, -36, 72, 72); ctx.strokeRect(-36, -36, 72, 72); ctx.restore(); ctx.fillStyle = "#111"; ctx.font = "bold 40px sans-serif"; ctx.textAlign = "center"; ctx.fillText(cur[2] === "excl" ? "!" : "☢", 100, 204); ctx.textAlign = "left"; ctx.font = "12px sans-serif"; ctx.fillStyle = "#ffd0d0"; ctx.fillText(T(cur[2] === "excl" ? "Irritant" : "Corrosive"), 70, 250); }
  });
})();

/* ================================================================ PRACTICE EXAM */
initQuiz({ BANK, labels: ["Reproduction", "Pregnancy", "The menstrual cycle", "Acids and hazards", "The pH test"], first: 12, award, P });


/* register dynamic strings so the Spanish dictionary can be proven complete (revision-kit T() collects them) */
["Fertilisation!", "Zygote", "cells", "The sperm joins the egg. Only one sperm gets in, and the egg then blocks the others.", "One fertilised cell, a zygote, has formed. It starts to divide.", "A ball of 16 cells: an embryo. It travels to the uterus and attaches to the lining.", "Egg", "Sperm",
 "Month", "Play the nine months", "Pause", "Play the cycle", "Day", "Ovary", "Uterus", "egg", "lining", "Irritant", "Corrosive", "litmus paper", "turns red", "turns blue", "stays the same", "shows the colour in the tube",
 "Hazard symbol shown on the bottle.", "No serious hazard symbol.", "Acid", "Alkali", "Neutral", "Weak acid", "Strong acid", "Weak alkali", "Strong alkali", "Menstruation", "Lining builds, egg matures", "Ovulation", "Lining stays thick",
 "The uterus lining breaks down and is lost.", "FSH makes an egg mature. Oestrogen builds a new lining.", "LH peaks and the egg is released from the ovary.", "The egg is fertilised: progesterone stays high and the lining stays thick for the baby.", "Progesterone keeps the lining thick, waiting for a fertilised egg. If none arrives, the lining breaks down.",
 "Where does", "belong?", "Add the indicator to see the colour.", "3D view is not available on this device. Everything else on the page still works.", "Fertilisation Quest", "Pregnancy Explorer", "Cycle Lab", "pH Lab", "Photo hunter", "Hazard match", "pH runner", "Exam 80%",
 "Steer the sperm to the egg and watch the embryo form", "Look at all five parts of the 3D pregnancy model and reach month 9", "Visit days 1, 14 and 28 and try the fertilised egg option", "Test 6 substances and use at least 2 different indicators",
 "Real photos: find every part on all four photos", "Match all the hazard symbols correctly", "Finish a pH Runner round", "Score 80% or more on a 20-question practice exam",
 "Lesson 12", "Lesson 13", "Lesson 14", "Lesson 15", "Lesson 16", "Press “Mark lesson complete” on Lesson 12", "Press “Mark lesson complete” on Lesson 13", "Press “Mark lesson complete” on Lesson 14", "Press “Mark lesson complete” on Lesson 15", "Press “Mark lesson complete” on Lesson 16"
].forEach(T);

/* ================================================================ BONUS + CREDITS + BOOKLET + TRANSLATION */
$("#bonusPlay").addEventListener("click", () => { mountRunner($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
loadCredits($("#credits"));
wireBooklet("Exam-3-Revision-Booklet");
P.render();
translateDom();
