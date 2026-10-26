/* Exam 2 Revision Website: lessons 7-9. Plain ES module on top of engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=1";
import { mountGrid } from "./grid.js?v=3";
import { buildIsland } from "./island.js?v=1";
import { $, $$, el, rnd, clamp, shuffle, shake, popIt, burstOn, T, L, isES, initLang, translateDom, observeDom, initProgress, flipCards, makeSorter, makeMatch, makeAnswer, makeOrder, rafLoop, rr, initHotspots, loadCredits, initQuiz, wireBooklet, reduced } from "../../../../../../engine/revision-kit.js?v=12";

await initLang();

/* ---------------------------------------------------------------- progress */
const LAB_NAMES = { body: "Body Energy Lab", power: "Power Station Lab", site: "Site Planner", time: "Fossil Fuel Time Machine" };
const LAB_HOW = {
  body: "Eat at least 3 different foods and stay active for 15 seconds in total",
  power: "Look at all 7 energy sources in the Power Station Lab",
  site: "Choose the best source correctly for at least 4 places",
  time: "Take swamp plants AND sea creatures past 200 million years, then burn one"
};
const P = initProgress({
  store: "dl-ls2-exam2-revision-v1",
  badges: prog => [
    ...[7, 8, 9].map(n => ["Lesson " + n, () => prog.lessons[n], "Press “Mark lesson complete” on Lesson " + n]),
    ...Object.keys(LAB_NAMES).map(k => [LAB_NAMES[k], () => prog.labs[k], LAB_NAMES[k] + ": " + LAB_HOW[k]]),
    ["Energy island", () => prog.labs.island, "Move the Sun and wind sliders in the 3D energy island and compare all three sources"],
    ["Photo hunter", () => prog.labs.photos, "Real photos: find every part on all four photos"],
    ["Energy grid game", () => prog.labs.bonus, "Finish a Keep the Lights On day"],
    ["Exam 80%", () => prog.quiz, "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award;

/* ---------------------------------------------------------------- Lesson 7 */
const EN = [
  ["C", "Chemical", "Stored in food, fuels and batteries. Released when food is respired or a fuel burns.", "#c9791b"],
  ["K", "Kinetic", "The energy of moving things, such as your muscles when you run.", "#2f7dd1"],
  ["T", "Thermal", "Heat. It keeps your body warm and is lost whenever energy is transferred.", "#c43a52"],
  ["G", "Gravitational potential", "Stored because of height. The higher something is, the more it has.", "#8a4fc0"]
];
flipCards($("#enGrid"), EN, 4);

makeSorter($("#sortEnergy"), [
  ["A banana before it is eaten", 0, "Food stores chemical energy."], ["A sprinter running", 1, "Moving things have kinetic energy."],
  ["Your warm skin after exercise", 2, "Heat is thermal energy."], ["A skier at the top of a hill", 3, "Height gives gravitational potential energy."],
  ["A battery in a torch", 0, "Batteries store chemical energy."], ["A rolling football", 1, "Moving: kinetic energy."],
  ["A hot cup of tea", 2, "Thermal energy."], ["A book on a high shelf", 3, "Stored because of its height."],
  ["Bread in the cupboard", 0, "Chemical energy is stored in the carbohydrates."], ["A cyclist speeding downhill", 1, "Fast moving: kinetic energy."]
], ["Chemical", "Kinetic", "Thermal", "Gravitational potential"]);

makeMatch($("#matchFood"), [
  ["Banana", "Chemical energy for movement and warmth"], ["Bread", "Carbohydrates for brain and muscle energy"],
  ["Chocolate", "Quick-release energy (sugar and fat)"], ["Water", "Hydration, but no energy: not a fuel"]
]);

makeOrder($("#orderRun"), [
  ["Food", "Chemical energy is stored in the food"], ["Digestion", "Food is broken down and absorbed"], ["Respiration", "Chemical energy is released in the cells"],
  ["Muscles move", "Kinetic energy: you run"], ["Heat", "Some energy always leaves as thermal energy"]
]);

makeAnswer($("#ans1"), [
  ["Food stores chemical energy.", true],
  ["Digestion and respiration release the chemical energy so the body can use it.", true],
  ["Chemical energy is transformed into kinetic energy (movement) and thermal energy (heat).", true],
  ["Energy is conserved: it is transferred or stored, never created or destroyed.", true],
  ["The transfer is not 100% efficient, so some energy is always lost as heat.", true],
  ["Thermal energy keeps the body warm and helps regulate body temperature.", true],
  ["Kinetic energy powers daily activities such as walking, running, breathing and a beating heart.", true],
  ["Energy the body does not use is stored, for example as fat.", true],
  ["Bread and chocolate store chemical energy, but water is not an energy store.", true],
  ["Climbing stairs gives gravitational potential energy, which comes from the chemical energy in food.", true],
  ["Energy is created inside the muscles when we move.", false],
  ["All the chemical energy becomes movement and none is lost.", false],
  ["Water is the body's main chemical energy store.", false],
  ["Energy is destroyed when food is digested.", false]
], $("#ans1Check"), $("#ans1Reset"), $("#ans1Out"));

/* ---------------------------------------------------------------- Lesson 8 */
makeMatch($("#matchFuel"), [
  ["Coal", "Ancient land plants"], ["Oil", "Ancient sea creatures"], ["Natural gas", "Sea creatures under more pressure, deeper underground"], ["Biomass", "Plants and waste (a renewable fuel)"]
]);
makeSorter($("#sortFossil"), [
  ["Coal", 0, "Coal is a fossil fuel."], ["Wind", 1, "Wind is renewable."], ["Natural gas", 0, "A fossil fuel."], ["Wood from regrown trees", 1, "Wood is biomass: it can be regrown."],
  ["Oil", 0, "A fossil fuel."], ["Sunlight", 1, "Sunlight is renewable."], ["Petrol made from crude oil", 0, "It comes from oil, a fossil fuel."], ["Wood pellets", 1, "Biomass, not a fossil fuel."]
], ["Fossil fuel", "NOT a fossil fuel"]);
makeOrder($("#orderPower"), [
  ["Burn the fuel", "Combustion releases heat"], ["Water becomes steam", "The heat boils the water"], ["Steam turns the turbine", "Thermal energy becomes kinetic energy"],
  ["Turbine drives the generator", "The spinning turbine turns the generator"], ["Electricity is made", "Sent to homes and schools"]
]);
makeAnswer($("#ans2"), [
  ["Burning fossil fuels releases carbon dioxide.", true],
  ["Carbon dioxide traps heat in the atmosphere, which contributes to climate change.", true],
  ["Fossil fuels formed from ancient plants and sea creatures over millions of years.", true],
  ["Once used they cannot be replaced quickly, so they are non-renewable.", true],
  ["Fossil fuels are renewable because they are natural.", false],
  ["Carbon dioxide cools the planet.", false],
  ["Fossil fuels form again within a few years.", false]
], $("#ans2Check"), $("#ans2Reset"), $("#ans2Out"));

/* ---------------------------------------------------------------- Lesson 9 */
makeMatch($("#matchCons"), [
  ["Solar", "Does not work well on cloudy days or at night"], ["Wind", "Needs windy weather"], ["Hydroelectric", "Dams can flood habitats"],
  ["Biomass", "Still releases some CO₂"], ["Geothermal", "Only works in certain places"]
]);
makeSorter($("#sortPlace"), [
  ["A hot, cloudless desert", 0, "Strong, frequent sunshine suits solar."], ["A flat, windy coastal plain", 1, "Open, windy land suits wind power."],
  ["A rainy mountain valley with fast rivers", 2, "Plenty of flowing water suits hydroelectric."], ["A volcanic island with hot springs", 3, "Heat close to the surface suits geothermal."],
  ["A sunny region with very little wind", 0, "Sunshine is the best resource there."], ["A steep river gorge with water all year", 2, "A dam or hydro scheme can use the flow."],
  ["An open hilltop battered by wind", 1, "A good wind site."], ["A land with hot rocks near the surface", 3, "Geothermal: heat from inside the Earth."]
], ["Solar", "Wind", "Hydroelectric", "Geothermal"]);
makeSorter($("#sortWeather"), [
  ["Solar panels at midnight", 0, "No sunlight means no output."], ["Wind turbines on a calm day", 0, "No wind means no output."],
  ["A geothermal plant during a storm", 1, "Earth's heat is always there."], ["A biomass boiler with a full fuel store", 1, "It does not rely on the weather while it has fuel."],
  ["Solar panels on a cloudy day", 0, "Cloud cuts the output."], ["Geothermal at night", 1, "It works day and night."]
], ["Affected by weather", "Works in any weather"]);
makeSorter($("#sortVenn"), [
  ["Replaced naturally", 0, "That is what renewable means."], ["Will eventually run out", 1, "Non-renewable resources are used up."],
  ["Can generate electricity", 2, "Both kinds can drive generators."], ["Sun, wind and water", 0, "These are renewable."],
  ["Coal, oil and natural gas", 1, "Fossil fuels are non-renewable."], ["Takes millions of years to form", 1, "That is why fossil fuels are non-renewable."],
  ["Can be used for heating homes", 2, "Gas boilers, geothermal and biomass all heat buildings."]
], ["Renewable", "Non-renewable", "Both"]);
makeAnswer($("#ans3"), [
  ["Which resources each region really has: wind, sun, rivers, hot rocks, or crops and waste.", true],
  ["Weather and reliability: solar and wind vary, geothermal runs all the time.", true],
  ["The cost of building and installing the equipment.", true],
  ["Environmental effects, such as dams flooding habitats or biomass still releasing CO₂.", true],
  ["Backup and storage, such as batteries, for cloudy or still days.", true],
  ["Government investment and policy to support the change.", true],
  ["Different regions may need different sources, so no single source is perfect everywhere.", true],
  ["A windy plain suits wind, a sunny desert suits solar, and a river valley suits hydroelectric power.", true],
  ["Only the cheapest source should be chosen in every region.", false],
  ["All renewable sources work equally well everywhere.", false],
  ["Weather does not matter for renewables.", false],
  ["Renewables release more CO₂ than coal.", false]
], $("#ans3Check"), $("#ans3Reset"), $("#ans3Out"));

/* ================================================================ LAB 1: BODY ENERGY */
(function () {
  const cv = $("#bodyCanvas");
  const FOOD = { banana: [25, 4, "banana"], bread: [30, 8, "bread"], choc: [40, 2, "chocolate"], water: [0, 1, "water"] };
  const ACT = [{ n: "Resting", use: 0.7, k: 0 }, { n: "Walking", use: 3, k: 0.25 }, { n: "Running", use: 7, k: 0.25 }, { n: "Sprinting", use: 14, k: 0.25 }];
  let store, kin, heat, fat, eaten, queue, parts, phase, act, activeT, kinds, tip;
  function reset() { store = 0; kin = 0; heat = 0; fat = 0; eaten = 0; queue = []; parts = []; phase = 0; activeT = 0; kinds = kinds || new Set(); setTip("Eat chocolate and sprint: it releases energy fastest. Energy in always equals movement + heat + stored."); }
  function setTip(t) { $("#bodyTip").textContent = t; }
  act = 0; reset();
  $("#bodyAct").addEventListener("change", e => { act = +e.target.value; if (act === 0) setTip("At rest the body still uses a little energy, and all of it leaves as heat."); else setTip(`${T(ACT[act].n)}: ${T("about a quarter becomes movement and the rest leaves as heat, so the body is not 100% efficient.")}`); });
  $("#bodyEat").addEventListener("click", () => {
    const f = FOOD[$("#bodyFood").value]; kinds.add($("#bodyFood").value);
    if (f[0] === 0) { setTip("Water has no energy: it keeps you hydrated, but it is not a fuel."); shake($("#bodyEat")); return; }
    queue.push({ left: f[0], rate: f[0] / f[1] }); eaten += f[0]; popIt($("#bodyEat"));
    for (let i = 0; i < 8; i++) parts.push({ x: 90, y: 90, vx: rnd(10, 40), vy: rnd(10, 60), c: "#f3d36b", life: 1 });
    setTip(`${T("You ate")} ${T(f[2])}: ${T("its chemical energy is released over about")} ${f[1]} ${T("seconds.")} ${f[1] <= 2 ? T("That is quick-release energy.") : T("A steadier supply.")}`);
  });
  $("#bodyReset").addEventListener("click", reset);
  const bar = (id, tid, v, max, txt) => { $(id).style.width = clamp(v / max * 100, 0, 100) + "%"; $(tid).textContent = txt; };
  rafLoop(cv, (ctx, dt) => {
    // digestion -> store
    queue.forEach(q => { const take = Math.min(q.left, q.rate * dt); q.left -= take; store += take; });
    queue = queue.filter(q => q.left > 0.01);
    if (store > 100) { fat += store - 100; store = 100; }
    // use
    const A = ACT[act]; let used = Math.min(store, A.use * dt); store -= used;
    const k = A.k * used, h = used - k; kin += k; heat += h; if (act > 0 && used > 0) activeT += dt;
    if (act > 0 && used < A.use * dt - 1e-6) setTip("Your energy store is empty: eat something to keep moving!");
    phase += dt * (act === 0 ? 0 : 3 + act * 3.5) * (used > 0 || act === 0 ? 1 : 0.2);
    if (used > 0) { if (Math.random() < dt * 20 * A.use / 5) parts.push({ x: 330 + rnd(-15, 15), y: 200, vx: rnd(-20, 20), vy: rnd(-70, -30), c: "#ff8b4c", life: 1 }); if (k > 0 && Math.random() < dt * 20 * A.use / 8) parts.push({ x: 360, y: 260, vx: rnd(60, 120), vy: rnd(-10, 10), c: "#7dc6ff", life: 1 }); }
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.8; }); parts = parts.filter(p => p.life > 0);
    if (kinds.size >= 3 && activeT >= 15) award("body");
    const err = Math.abs(eaten - (store + kin + heat + fat + queue.reduce((a, q) => a + q.left, 0)));
    $("#bodyHud").textContent = `${T(A.n)}${err < 0.5 ? " · " + T("energy in = movement + heat + stored") : ""}`;
    bar("#mChem", "#tChem", store, 100, Math.round(store)); bar("#mKin", "#tKin", kin, 80, Math.round(kin)); bar("#mHeat", "#tHeat", heat, 300, Math.round(heat)); bar("#mFat", "#tFat", fat, 60, Math.round(fat));
    // draw
    ctx.clearRect(0, 0, 640, 480); const g = ctx.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, "#102a36"); g.addColorStop(1, "#08141a"); ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#1c3a2c"; ctx.fillRect(0, 380, 640, 100); ctx.strokeStyle = "#2f5a44"; ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const x = ((i * 70 - phase * 40) % 700 + 700) % 700 - 30; ctx.beginPath(); ctx.moveTo(x, 395); ctx.lineTo(x + 28, 395); ctx.stroke(); }
    // energy store (battery gauge)
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; rr(ctx, 30, 120, 70, 220, 10); ctx.stroke(); ctx.fillStyle = "#f3d36b"; const sh = store / 100 * 210; ctx.fillRect(34, 336 - sh, 62, sh);
    ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText(T("Chemical"), 30, 112); ctx.fillText(T("energy store"), 22, 360);
    // fat blob
    ctx.fillStyle = "#ffd9a8"; const fr = 8 + fat * 0.5; ctx.beginPath(); ctx.arc(555, 340, fr, 0, 6.28); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText(T("Stored as fat"), 500, 400 - 0);
    // arrow from store to body
    ctx.strokeStyle = act > 0 && store > 0 ? "#f3d36b" : "#ffffff44"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(105, 230); ctx.lineTo(250, 230); ctx.stroke(); ctx.beginPath(); ctx.moveTo(250, 215); ctx.lineTo(268, 230); ctx.lineTo(250, 245); ctx.stroke();
    // runner
    const sw = Math.sin(phase) * (act === 0 ? 0 : 0.9), bob = act === 0 ? 0 : Math.abs(Math.sin(phase)) * 6, cx = 340, top = 150 - bob;
    ctx.strokeStyle = "#e8f4ee"; ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, top, 20, 0, 6.28); ctx.fillStyle = "#e8f4ee"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, top + 22); ctx.lineTo(cx, top + 105); ctx.stroke();
    const limb = (x, y, a, l) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a) * l, y + Math.cos(a) * l); ctx.stroke(); };
    limb(cx, top + 40, sw, 60); limb(cx, top + 40, -sw, 60); limb(cx, top + 105, -sw, 75); limb(cx, top + 105, sw, 75);
    ctx.fillStyle = "#ff8b4c"; ctx.font = "13px sans-serif"; ctx.fillText(act > 0 ? T("heat") : "", cx + 30, top - 10);
    parts.forEach(p => { ctx.globalAlpha = clamp(p.life, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.28); ctx.fill(); }); ctx.globalAlpha = 1;
    ctx.fillStyle = "#7dc6ff"; ctx.fillText(act > 0 ? T("movement") : "", 470, 235);
  });
})();

/* ================================================================ LAB 2: POWER STATION */
(function () {
  const cv = $("#psCanvas");
  const SRC = {
    coal: { n: "Coal power station", co2: 100, ren: false, steps: [["Coal burns", "Combustion releases the chemical energy in the coal as heat. It also releases CO₂ and smoke.", "#6b5b4a"], ["Water becomes steam", "The heat boils water into high-pressure steam.", "#ff8b4c"], ["Steam turns the turbine", "Thermal energy becomes kinetic energy as the steam spins the blades.", "#7dc6ff"], ["Generator", "The spinning turbine drives the generator.", "#9aa8b5"], ["Electricity", "Electrical energy travels along cables to homes.", "#f3d36b"]] },
    gas: { n: "Natural gas power station", co2: 55, ren: false, steps: [["Gas burns", "Natural gas is burned for heat and releases CO₂ (less than coal).", "#4c8ff0"], ["Water becomes steam", "The heat boils water into steam.", "#ff8b4c"], ["Steam turns the turbine", "Steam spins the turbine blades.", "#7dc6ff"], ["Generator", "The turbine drives the generator.", "#9aa8b5"], ["Electricity", "Electricity is sent through the grid.", "#f3d36b"]] },
    bio: { n: "Biomass power station", co2: 25, ren: true, steps: [["Biomass burns", "Plants, wood or waste are burned. It is renewable but still releases CO₂.", "#4c9a52"], ["Water becomes steam", "The heat boils water into steam.", "#ff8b4c"], ["Steam turns the turbine", "Steam spins the turbine.", "#7dc6ff"], ["Generator", "The turbine drives the generator.", "#9aa8b5"], ["Electricity", "Electricity is produced.", "#f3d36b"]] },
    geo: { n: "Geothermal power station", co2: 3, ren: true, steps: [["Hot rocks", "Heat from inside the Earth warms water underground.", "#c43a52"], ["Water becomes steam", "The hot rocks turn water into steam. Nothing is burned.", "#ff8b4c"], ["Steam turns the turbine", "Steam spins the turbine.", "#7dc6ff"], ["Generator", "The turbine drives the generator.", "#9aa8b5"], ["Electricity", "Works day and night in any weather.", "#f3d36b"]] },
    wind: { n: "Wind farm", co2: 0, ren: true, steps: [["Moving air", "Wind has kinetic energy.", "#bfe0ff"], ["Blades turn the turbine", "The wind pushes the blades round. No fuel is burned.", "#7dc6ff"], ["Generator", "The turbine drives the generator.", "#9aa8b5"], ["Electricity", "Only works when the wind blows.", "#f3d36b"]] },
    hydro: { n: "Hydroelectric dam", co2: 0, ren: true, steps: [["Water behind a dam", "Stored water has gravitational potential energy.", "#4c8ff0"], ["Water flows down", "The falling water gains kinetic energy.", "#7dc6ff"], ["Turbine spins", "Moving water turns the turbine.", "#7dc6ff"], ["Generator", "The turbine drives the generator.", "#9aa8b5"], ["Electricity", "Reliable, but the dam can flood habitats.", "#f3d36b"]] },
    solar: { n: "Solar power plant", co2: 0, ren: true, steps: [["Sunlight", "Light energy from the Sun.", "#f3d36b"], ["Solar panel", "Panels turn light energy straight into electricity. No turbine and no burning.", "#2f6fd0"], ["Electricity", "Free energy, but not at night or on cloudy days.", "#f3d36b"]] }
  };
  const sel = $("#psSrc"); sel.innerHTML = Object.keys(SRC).map(k => `<option value="${k}">${T(SRC[k].n)}</option>`).join("");
  let key = "coal", lvl = 60, wx = "sun", hot = -1, seen = new Set(["coal"]), flow = 0, puffs = [];
  function weather() { return key === "solar" ? (wx === "sun" ? 1 : 0.2) : key === "wind" ? (wx === "sun" ? 1 : 0.15) : 1; }
  function chips() {
    const box = $("#psSteps"); box.innerHTML = "";
    SRC[key].steps.forEach((s, i) => { const b = el("button", i === hot ? "on" : "", `${i + 1}. ${T(s[0])}`); b.addEventListener("click", () => { hot = i; $("#psInfo").innerHTML = `<b>${T(s[0])}</b><p>${T(s[1])}</p>`; chips(); }); box.append(b); });
    $("#psHud").textContent = T(SRC[key].n) + (SRC[key].ren ? " (" + T("renewable") + ")" : " (" + T("non-renewable") + ")");
  }
  sel.addEventListener("change", () => { key = sel.value; hot = -1; seen.add(key); chips(); $("#psInfo").innerHTML = `<b>${T(SRC[key].n)}</b><p>${SRC[key].ren ? T("A renewable source.") : T("A non-renewable fossil fuel.")} ${T("Tap a step to learn what happens.")}</p>`; if (seen.size >= 7) award("power"); });
  $("#psLvl").addEventListener("input", e => { lvl = +e.target.value; $("#psLvlLbl").textContent = lvl + "%"; });
  $("#psWx").addEventListener("change", e => { wx = e.target.value; });
  chips();
  rafLoop(cv, (ctx, dt) => {
    const S = SRC[key], out = lvl * weather(), co = S.co2 * lvl / 100;
    flow += dt * (0.4 + out / 80);
    $("#mEl").style.width = out + "%"; $("#tEl").textContent = Math.round(out) + " MW"; $("#mCo").style.width = clamp(co, 0, 100) + "%"; $("#tCo").textContent = Math.round(co);
    if (co > 0 && Math.random() < dt * (3 + co / 8)) puffs.push({ x: 90 + rnd(-10, 10), y: 150, life: 1, r: rnd(8, 16) });
    puffs.forEach(p => { p.y -= dt * 40; p.x += dt * 10; p.life -= dt * 0.35; p.r += dt * 6; }); puffs = puffs.filter(p => p.life > 0);
    ctx.clearRect(0, 0, 640, 480); const g = ctx.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, wx === "sun" || key !== "solar" && key !== "wind" ? "#2a5a86" : "#3a4048"); g.addColorStop(1, "#0b1a24"); ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 480);
    if (wx === "cloud") { ctx.fillStyle = "rgba(200,205,210,.5)"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(80 + i * 150, 50 + (i % 2) * 14, 36, 0, 6.28); ctx.fill(); } } else { ctx.fillStyle = "#f3d36b"; ctx.beginPath(); ctx.arc(560, 60, 30, 0, 6.28); ctx.fill(); }
    puffs.forEach(p => { ctx.fillStyle = `rgba(90,90,90,${p.life * 0.5})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); });
    const n = S.steps.length, bw = Math.min(110, 600 / n - 16), gap = (640 - n * bw) / (n + 1), y0 = 230;
    S.steps.forEach((s, i) => {
      const x = gap + i * (bw + gap);
      if (i > 0) { const px = gap + (i - 1) * (bw + gap) + bw; ctx.strokeStyle = "#ffffff55"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, y0 + 40); ctx.lineTo(x, y0 + 40); ctx.stroke(); for (let k = 0; k < 3; k++) { const t = ((flow * 0.8 + k / 3 + i * .1) % 1); ctx.fillStyle = s[2]; ctx.beginPath(); ctx.arc(px + (x - px) * t, y0 + 40, 5, 0, 6.28); ctx.fill(); } }
      ctx.fillStyle = s[2]; ctx.globalAlpha = i === hot ? 1 : 0.85; rr(ctx, x, y0, bw, 80, 12); ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = i === hot ? 4 : 2; ctx.strokeStyle = i === hot ? "#fff" : "#ffffff66"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; const words = T(s[0]).split(" "); const lines = []; let cur = ""; words.forEach(w => { if ((cur + " " + w).trim().length > 11) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }); lines.push(cur);
      lines.forEach((l, k) => ctx.fillText(l, x + bw / 2, y0 + 36 - (lines.length - 1) * 8 + k * 16)); ctx.textAlign = "left";
      ctx.fillStyle = "#9bbdb0"; ctx.font = "11px sans-serif"; ctx.fillText(String(i + 1), x + 4, y0 - 6);
    });
    // pylon and glow at the end
    const ex = gap + (n - 1) * (bw + gap) + bw / 2; ctx.strokeStyle = "#e8f4ee"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex, y0 + 85); ctx.lineTo(ex - 22, 420); ctx.moveTo(ex, y0 + 85); ctx.lineTo(ex + 22, 420); ctx.moveTo(ex - 18, 380); ctx.lineTo(ex + 18, 380); ctx.stroke();
    ctx.fillStyle = `rgba(243,211,107,${0.2 + out / 160})`; ctx.beginPath(); ctx.arc(ex, y0 + 40, 56 + out / 5, 0, 6.28); ctx.fill();
    ctx.fillStyle = S.ren ? "#3fd9a0" : "#ff9d8d"; ctx.font = "bold 14px sans-serif"; ctx.fillText(S.ren ? T("RENEWABLE") : T("NON-RENEWABLE"), 20, 440);
    ctx.fillStyle = "#cfe4dc"; ctx.font = "12px sans-serif"; ctx.fillText(S.co2 > 0 ? T("Releases CO₂ when running") : T("No CO₂ when running"), 20, 460);
  });
})();

/* ================================================================ LAB 3: SITE PLANNER */
(function () {
  const SRC = ["solar", "wind", "hydro", "geo", "bio"], SN = { solar: "Solar", wind: "Wind", hydro: "Hydroelectric", geo: "Geothermal", bio: "Biomass" };
  const LOC = [
    { n: "Windy flat plain", d: "Open farmland, strong steady winds, no big rivers.", s: { wind: 90, solar: 55, hydro: 15, geo: 10, bio: 40 }, why: "Open land and strong wind make wind turbines the best choice." },
    { n: "Sunny desert", d: "Hot, cloudless days, almost no rain or wind.", s: { solar: 95, wind: 40, hydro: 5, geo: 15, bio: 5 }, why: "Strong, frequent sunshine suits solar panels." },
    { n: "Rainy mountain valley", d: "Plenty of rain and fast-flowing rivers.", s: { hydro: 92, wind: 45, solar: 30, geo: 10, bio: 50 }, why: "Lots of flowing water makes hydroelectric the best choice." },
    { n: "Volcanic island", d: "Hot springs and hot rocks close to the surface.", s: { geo: 95, wind: 55, solar: 50, hydro: 25, bio: 30 }, why: "Heat near the surface means geothermal works all day and night." },
    { n: "Farmland with crop waste", d: "Lots of crops and agricultural waste, moderate wind.", s: { bio: 85, wind: 70, solar: 55, hydro: 20, geo: 10 }, why: "Plenty of plant waste to burn makes biomass a good fit, though it still releases CO₂." },
    { n: "Cloudy northern coast", d: "Cloudy, long dark winters, strong sea winds.", s: { wind: 85, hydro: 60, solar: 25, geo: 15, bio: 55 }, why: "Little sunshine but strong winds: wind power works best." }
  ];
  let li = -1, picked = null, right = 0, tries = 0, prog = 0, anim = null;
  const locs = $("#spLocs"), pick = $("#spPick"), bars = $("#spBars"), cv = $("#spChart");
  LOC.forEach((l, i) => { const b = el("button", "sp__loc", `<b>${T(l.n)}</b>${T(l.d)}`); b.addEventListener("click", () => choose(i)); locs.append(b); });
  SRC.forEach(s => { const b = el("button", "btn btn--ghost", T(SN[s])); b.dataset.s = s; b.addEventListener("click", () => answer(s, b)); pick.append(b); });
  function choose(i) {
    li = i; picked = null; prog = 0; $$(".sp__loc", locs).forEach((b, k) => b.classList.toggle("on", k === i)); bars.innerHTML = ""; $$("button", pick).forEach(b => b.disabled = false);
    $("#spInfo").innerHTML = `<b>${T(LOC[i].n)}</b><p>${T(LOC[i].d)} ${T("Which source would you build here?")}</p>`;
  }
  function answer(s, b) {
    if (li < 0) { $("#spInfo").innerHTML = `<b>${T("Pick a place first")}</b><p>${T("Tap a place on the left.")}</p>`; shake(b); return; }
    if (picked) return; picked = s; const L = LOC[li]; const best = SRC.reduce((a, k) => L.s[k] > L.s[a] ? k : a, SRC[0]);
    tries++; if (s === best) { right++; popIt(b); } else shake(b);
    $$("button", pick).forEach(x => x.disabled = true);
    bars.innerHTML = SRC.map(k => `<div class="sp__bar ${k === best ? "best" : ""}"><span>${T(SN[k])}</span><i><u data-v="${L.s[k]}"></u></i><b>${L.s[k]}</b></div>`).join("");
    requestAnimationFrame(() => $$(".sp__bar u", bars).forEach(u => u.style.width = u.dataset.v + "%"));
    $("#spInfo").innerHTML = `<b>${s === best ? T("Best choice!") : T("Not the best here.")}</b><p>${T(L.why)}</p>`;
    $("#spScore").textContent = `${T("Best choices found:")} ${right} ${T("of")} ${tries}`; if (right >= 4) award("site");
    prog = 0;
  }
  function out(src, h, L) {
    const base = L.s[src], hr = h % 24;
    if (src === "solar") return Math.max(0, Math.sin(Math.PI * (hr - 6) / 12)) * base * (L.n.startsWith("Cloudy") ? 0.8 : 1);
    if (src === "wind") return base * (0.65 + 0.35 * Math.sin(hr * 0.9 + L.n.length));
    return base;
  }
  rafLoop(cv, (ctx, dt) => {
    ctx.clearRect(0, 0, 640, 300); ctx.fillStyle = "#0a1b15"; ctx.fillRect(0, 0, 640, 300);
    ctx.strokeStyle = "#ffffff22"; ctx.lineWidth = 1; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(40, 30 + i * 55); ctx.lineTo(620, 30 + i * 55); ctx.stroke(); }
    ctx.fillStyle = "#a9c9bc"; ctx.font = "12px sans-serif"; [0, 6, 12, 18, 24].forEach(h => ctx.fillText(h + ":00", 40 + h / 24 * 560 - 12, 292)); ctx.fillText(T("Output over 24 hours"), 44, 20);
    if (li < 0 || !picked) { ctx.fillStyle = "#cfe4dc"; ctx.font = "14px sans-serif"; ctx.fillText(T("Choose a source to see its output over a day."), 150, 150); return; }
    prog = Math.min(1, prog + dt * 0.5); const L = LOC[li];
    ctx.strokeStyle = "#3fd9a0"; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 96 * prog; i++) { const h = i / 4, x = 40 + h / 24 * 580, y = 250 - out(picked, h, L) * 2.2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#f3d36b"; ctx.fillText(T(SN[picked]) + ": " + (picked === "solar" ? T("no output at night") : picked === "wind" ? T("changes with the wind") : T("steady all day")), 300, 20);
  });
})();

/* ================================================================ LAB 4: FOSSIL FUEL TIME MACHINE */
(function () {
  const cv = $("#ffCanvas"); let ffLast = "", kind = "plants", yr = 0, play = false, burnT = 0, co = 0, burned = false, best = { plants: 0, sea: 0 }, flame = [];
  const setY = v => { yr = clamp(v, 0, 300); $("#ffYr").value = yr; $("#ffYrLbl").textContent = Math.round(yr) + " " + T("million years"); best[kind] = Math.max(best[kind], yr); };
  $("#ffYr").addEventListener("input", e => { play = false; $("#ffPlay").textContent = "Fast forward"; setY(+e.target.value); });
  $$("#ffTabs button").forEach(b => b.addEventListener("click", () => { kind = b.dataset.k; $$("#ffTabs button").forEach(x => x.setAttribute("aria-selected", x === b)); co = 0; burned = false; setY(0); }));
  $("#ffPlay").addEventListener("click", () => { play = !play; $("#ffPlay").textContent = play ? "Pause" : "Fast forward"; });
  $("#ffReset").addEventListener("click", () => { play = false; co = 0; burned = false; setY(0); $("#ffPlay").textContent = "Fast forward"; });
  $("#ffBurn").addEventListener("click", () => {
    if (yr < 100) { $("#ffInfo").innerHTML = `<b>${T("Not a fuel yet")}</b><p>${T("It has only been buried for")} ${Math.round(yr)} ${T("million years. Fast forward to turn it into a fuel first.")}</p>`; shake($("#ffBurn")); return; }
    burnT = 3; burned = true; ffLast = ""; co += Math.round(yr / 3);
    $("#ffInfo").innerHTML = `<b>${T("Combustion!")}</b><p>${T("The stored chemical energy is released as heat and light, and")} ${Math.round(yr / 3)} ${T("units of carbon dioxide go into the air. It took about")} ${Math.round(yr)} ${T("million years to form but only minutes to burn: that is why it is non-renewable.")}</p>`;
    if (best.plants >= 200 && best.sea >= 200 && burned) award("time");
  });
  function stage() {
    if (kind === "plants") return yr < 40 ? ["Peat", "Dead swamp plants pile up and are covered by mud."] : yr < 120 ? ["Brown coal", "Pressure and heat squeeze the water out of the plants."] : yr < 200 ? ["Coal", "Millions of years of pressure make hard, black coal."] : ["Hard coal (rich in energy)", "Coal is mostly carbon and stores lots of chemical energy."];
    return yr < 40 ? ["Dead sea creatures", "Tiny sea creatures sink and are buried in mud on the sea floor."] : yr < 120 ? ["Organic mud", "Layers of sand and mud press down and warm them."] : yr < 220 ? ["Oil", "Heat and pressure turn the remains into liquid oil."] : ["Oil and natural gas", "Under more pressure, deeper down, gas forms above the oil."];
  }
  rafLoop(cv, (ctx, dt) => {
    if (play) { setY(yr + dt * 30); if (yr >= 300) { play = false; $("#ffPlay").textContent = "Fast forward"; } }
    const [nm, desc] = stage(); const press = yr / 3, energy = clamp((yr - 20) / 1.8, 0, 100);
    if (!burnT || burnT <= 0) { if (yr > 0 && ffLast !== nm) { ffLast = nm; $("#ffInfo").innerHTML = `<b>${T(nm)}</b><p>${T(desc)}</p>`; } }
    $("#ffHud").textContent = `${Math.round(yr)} ${T("million years")}: ${T(nm)}`; $("#mPress").style.width = press + "%"; $("#tPress").textContent = Math.round(press) + "%"; $("#mStore").style.width = energy + "%"; $("#tStore").textContent = Math.round(energy) + "%"; $("#mFCo").style.width = clamp(co / 1.0, 0, 100) + "%"; $("#tFCo").textContent = co;
    ctx.clearRect(0, 0, 640, 480);
    const sky = ctx.createLinearGradient(0, 0, 0, 120); sky.addColorStop(0, "#2a5a86"); sky.addColorStop(1, "#7fb4d6"); ctx.fillStyle = sky; ctx.fillRect(0, 0, 640, 120);
    // surface scene
    if (kind === "plants") { ctx.fillStyle = "#3b6b3a"; ctx.fillRect(0, 100, 640, 30); for (let i = 0; i < 14; i++) { const x = 20 + i * 46, h = 30 + (i * 17) % 30; ctx.strokeStyle = "#2f8f3a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 110); ctx.quadraticCurveTo(x - 10, 110 - h, x + 12, 110 - h - 8); ctx.stroke(); } }
    else { ctx.fillStyle = "#1c5f8a"; ctx.fillRect(0, 100, 640, 40); ctx.fillStyle = "#cfe9f5"; for (let i = 0; i < 8; i++) { const x = (i * 83 + performance.now() / 40) % 700 - 30; ctx.beginPath(); ctx.ellipse(x, 120 + (i % 3) * 8, 14, 5, 0, 0, 6.28); ctx.fill(); } }
    // sediment layers growing with time
    const layers = Math.floor(yr / 20), top = 135, base = 440, band = (base - top) / 15;
    const cols = ["#b99a6b", "#a58257", "#8d6b45", "#7a5c3a", "#6d5232"];
    for (let i = 0; i < Math.min(layers, 12); i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(0, top + i * band, 640, band + 1); }
    // remains layer
    const ry = top + Math.min(layers, 12) * band, rh = 30 + Math.min(40, yr / 6);
    let rc; if (kind === "plants") rc = yr < 40 ? "#5b7a2e" : yr < 120 ? "#6a4a2a" : yr < 200 ? "#2c2420" : "#111"; else rc = yr < 40 ? "#d98a8a" : yr < 120 ? "#5a3f46" : "#b7791f";
    ctx.fillStyle = rc; ctx.fillRect(0, ry, 640, rh);
    if (kind === "sea" && yr >= 220) { ctx.fillStyle = "rgba(220,240,255,.8)"; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(40 + i * 44, ry - 10 - (i % 3) * 8 + Math.sin(performance.now() / 400 + i) * 3, 6, 0, 6.28); ctx.fill(); } ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif"; ctx.fillText(T("natural gas"), 270, ry - 28); }
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText(T(nm), 16, Math.min(ry + rh / 2 + 5, 470));
    // pressure arrows
    ctx.strokeStyle = "#ffffffaa"; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { const x = 70 + i * 120, a = Math.min(1, press / 50) * 24; if (a > 4) { ctx.beginPath(); ctx.moveTo(x, ry - a - 18); ctx.lineTo(x, ry - 6); ctx.lineTo(x - 6, ry - 14); ctx.moveTo(x, ry - 6); ctx.lineTo(x + 6, ry - 14); ctx.stroke(); } }
    // burning
    if (burnT > 0) { burnT -= dt; for (let i = 0; i < 3; i++) flame.push({ x: 320 + rnd(-40, 40), y: 120, vx: rnd(-20, 20), vy: rnd(-80, -40), t: 1, c: Math.random() < 0.6 ? "#ff8b4c" : "#6b6b6b" }); }
    flame.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt * 0.6; ctx.globalAlpha = clamp(f.t, 0, 1); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.c === "#6b6b6b" ? 12 : 7, 0, 6.28); ctx.fill(); }); ctx.globalAlpha = 1; flame = flame.filter(f => f.t > 0);
    if (burnT > 0) { ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.fillText(T("CO₂ + heat + light"), 250, 70); }
  });
  setY(0);
})();


/* ================================================================ 3D ENERGY ISLAND */
buildIsland({ award, T });

/* ================================================================ PRACTICE EXAM */
initQuiz({ BANK, labels: ["Energy and you", "Fuels", "Renewable resources"], first: 7, award, P });

/* ================================================================ REAL-PHOTO LABELLING */
const SETS = {
    wind: { name: "Wind farm", img: "photos/wind.jpg", alt: "Wind turbines standing over green farmland", tasks: [
      ["Tap a wind turbine.", .525, .55, "Wind turbine", "Moving air spins the blades, which drive a generator. It releases no CO₂ while running."],
      ["Tap the crop field. Land under wind turbines can still be farmed.", .30, .90, "Farmland", "Wind farms can share land with crops, but they only work when the wind blows."]] },
    hydro: { name: "Hydroelectric dam", img: "photos/hydro.jpg", alt: "A huge hydroelectric dam holding back a river", tasks: [
      ["Tap the dam wall.", .617, .52, "Dam wall", "The dam holds back water, which stores gravitational potential energy."],
      ["Tap the reservoir (the water stored behind the dam).", .87, .27, "Reservoir", "Building a reservoir floods land, which can harm habitats."]] },
    solar: { name: "Solar farm", img: "photos/solar.jpg", alt: "A long row of solar panels in dry open land", tasks: [
      ["Tap a row of solar panels.", .45, .52, "Solar panels", "Solar panels turn sunlight directly into electricity, but not at night or in cloud."],
      ["Tap the bare ground. Solar farms need lots of flat, sunny land.", .20, .80, "Open land", "Sunny, open places such as deserts are good locations for solar farms."]] },
    geo: { name: "Geothermal plant", img: "photos/geo.jpg", alt: "A geothermal power plant with white steam rising across a volcanic landscape", tasks: [
      ["Tap the plume of steam.", .32, .40, "Steam", "Heat from inside the Earth makes steam that turns turbines, day and night."],
      ["Tap the power station buildings with red roofs.", .86, .58, "Power station", "Geothermal only works where hot rocks are close to the surface."]] }
  };
initHotspots(SETS, "wind", award);

/* ================================================================ BONUS GAME + PHOTO CREDITS + BOOKLET + TRANSLATION */
$("#bonusPlay").addEventListener("click", () => { mountGrid($("#bonusHost"), { onFinish: r => { if (r.score > 0) award("bonus"); } }); $("#bonusHost").scrollIntoView({ block: "center" }); });
loadCredits($("#credits"));
wireBooklet("Exam-2-Revision-Booklet");
P.render();
translateDom();
observeDom();
