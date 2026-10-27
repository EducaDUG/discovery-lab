/* Stage 1 Biology Exam 1 bonus game: PULSE CATCHER (timing / rhythm catch, a new mechanic for the revision sites).
   A heartbeat light sweeps along a track of three answer zones. Press Catch (button, space bar or tap) when it is over the answer you think is right.
   Time-boxed (120 s wall clock on setInterval; requestAnimationFrame only draws). No lives, no fail state. Silent, so no mute control is needed. */
import { $, el, shuffle, rnd, clamp, T, translateDom, reduced } from "../../../../../../../engine/revision-kit.js?v=22";

/* [question, correct, wrong, wrong, memory hook] */
const Q = [
["Which part of a flower makes pollen?", "Anther", "Stigma", "Ovary", "Anther = pollen factory."],
["Which part of a flower catches pollen?", "Stigma", "Anther", "Petal", "Sticky stigma = catcher."],
["Which gas does yeast give off?", "Carbon dioxide", "Oxygen", "Nitrogen", "Yeast burps carbon dioxide."],
["What do seeds NOT need to germinate?", "Sunlight", "Water", "Oxygen", "Seeds start in the dark soil."],
["What do we call a seed that waits for the right conditions?", "Dormant", "Fertilised", "Pollinated", "Dormant = sleeping."],
["Which microbe makes bread rise?", "Yeast", "Salmonella", "Influenza virus", "Yeast + sugar = gas = fluffy bread."],
["Which bacterium helps legumes get nitrogen?", "Rhizobium", "Salmonella", "Penicillium", "Rhizobium lives in root nodules."],
["Which mould led to penicillin?", "Penicillium", "Yeast", "Rhizobium", "Fleming noticed Penicillium killing bacteria."],
["Viruses can only reproduce...", "Inside a host cell", "In water", "In sunlight", "No host, no copies."],
["Bacteria are prokaryotes. What do they lack?", "A nucleus", "A cell membrane", "Cytoplasm", "Pro-karyote = before nucleus."],
["Which is a disease caused by a virus?", "Chickenpox", "Strep throat", "Food poisoning", "Pox, flu, COVID = viruses."],
["Which bacterium causes food poisoning?", "Salmonella", "Yeast", "Lactobacillus", "Sick from Salmonella chicken."],
["What is it called when germs pass from raw meat to other food?", "Cross-contamination", "Fermentation", "Germination", "Cross over = cross-contamination."],
["How long should you wash your hands with soap?", "20 seconds", "2 seconds", "5 minutes", "Twenty seconds, two Happy Birthdays."],
["Do refrigerators kill all bacteria?", "No, they only slow growth", "Yes, completely", "Only viruses die", "Cold = slow, not dead."],
["What do decomposers do?", "Break down dead matter and recycle nutrients", "Make food from sunlight", "Hunt animals", "Nature's recyclers."],
["Which are the main decomposers?", "Bacteria and fungi", "Worms and birds", "Trees and grass", "Bacteria and fungi finish the job."],
["What is the process that makes kimchi and sauerkraut?", "Fermentation", "Pollination", "Respiration", "Ferment = microbes eat sugars."],
["What is the transfer of pollen called?", "Pollination", "Fertilisation", "Germination", "Pollination = pollen on the move."],
["Which flower is wind-pollinated?", "Wheat", "Sunflower", "Rose", "Grasses and cereals use the wind."],
["What does the ovary usually become?", "A fruit", "A petal", "Pollen", "Ovary to fruit."],
["How do coconuts disperse?", "By water", "By wind", "By exploding", "Coconuts float."],
["Dandelion seeds travel by...", "Wind", "Water", "Exploding pods", "Dandelion parachutes."],
["Why do seeds disperse?", "To reduce competition and reach new areas", "To make more pollen", "To stay dormant", "Spread out to find space."],
["How many chambers does the heart have?", "Four", "Two", "Three", "Two atria + two ventricles."],
["Which chamber pumps blood round the whole body?", "Left ventricle", "Right atrium", "Left atrium", "Left ventricle = big muscle."],
["Which blood cells carry oxygen?", "Red blood cells", "White blood cells", "Platelets", "Red carries oxygen."],
["What is the liquid part of blood?", "Plasma", "Platelets", "Haemoglobin", "Plasma is the pale liquid."],
["Which vessels carry blood away from the heart?", "Arteries", "Veins", "Capillaries", "Arteries = away."],
["Which vessels have valves?", "Veins", "Arteries", "Capillaries", "Valves stop backflow in veins."],
["Which vessels are one cell thick?", "Capillaries", "Arteries", "Veins", "Capillary = tiny exchange."],
["What are the tiny air sacs in the lungs?", "Alveoli", "Bronchi", "Capillaries", "Alveoli = gas exchange."],
["What passes into the blood at the alveoli?", "Oxygen", "Carbon dioxide", "Plasma", "Oxygen in, carbon dioxide out."],
["Which circulation feeds the heart muscle itself?", "Coronary", "Pulmonary", "Systemic", "Coronary = crown of the heart."],
["What happens to pulse during exercise?", "It increases", "It decreases", "It stops", "Muscles need more oxygen."],
["A pulse of 20 beats in 15 seconds is how many per minute?", "80", "20", "35", "Multiply by 4."],
["Respiration happens in which part of the cell?", "Mitochondria", "Nucleus", "Cell wall", "Mitochondria = powerhouse."],
["Breathing is a...", "Physical process", "Chemical reaction in cells", "Type of blood", "Breathing moves air."],
["Which gas do cells release during respiration?", "Carbon dioxide", "Oxygen", "Nitrogen", "Respiration makes carbon dioxide."]
];
const COLS = ["#2f7dd1", "#16a06f", "#c9791b"];

function wrap(ctx, text, maxW) { const w = text.split(" "), lines = []; let cur = ""; w.forEach(x => { const t = cur ? cur + " " + x : x; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = x; } else cur = t; }); if (cur) lines.push(cur); return lines; }

export function mountCatcher(host, { onFinish }) {
  Q.forEach(r => r.forEach(T)); ["Time", "Score", "Combo", "Get ready"].forEach(T);
  host.className = ""; host.innerHTML = "";
  const box = el("div", "pc"); host.append(box);
  const cv = el("canvas"); cv.width = 760; cv.height = 400; cv.style.cssText = "width:100%;height:auto;display:block;border-radius:12px;touch-action:manipulation"; cv.setAttribute("role", "img"); cv.setAttribute("aria-label", T("Pulse Catcher game board. Press the Catch button or the space bar to stop the heartbeat light on an answer."));
  const row = el("div", "gx-row", `<button class="btn btn--signal btn--lg" id="pcCatch">${T("Catch!")}</button><label style="display:inline-flex;gap:.4rem;align-items:center"><input type="checkbox" id="pcSlow"> ${T("Slow mode")}</label>`); row.style.cssText = "justify-content:center;margin-top:.7rem";
  const live = el("p", "gx-out", ""); live.setAttribute("aria-live", "polite"); live.style.cssText = "text-align:center;min-height:1.6em;margin:.4rem 0 0;color:#eaf6ff";
  box.append(cv, row, live); translateDom(box);
  const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const G = { left: 120, score: 0, combo: 0, best: 0, right: 0, asked: 0, state: "ready", q: null, zones: [], t0: 0, phase: 0, flash: 0, flashCol: "#3fd9a0", pops: [], trail: [], missed: [], dotX: 0, pause: 0, deadline: 0, ready: 3, over: false };
  const slow = () => $("#pcSlow", box).checked;
  let order = shuffle(Q.map((_, i) => i)), oi = 0;
  function nextQ() {
    if (oi >= order.length) { order = shuffle(order); oi = 0; }
    const r = Q[order[oi++]]; const opts = shuffle([{ t: r[1], ok: true }, { t: r[2] }, { t: r[3] }]);
    const widths = shuffle([0.28, 0.34, 0.38]); let x = 0; G.zones = opts.map((o, i) => { const z = { x0: x, x1: x + widths[i], t: T(o.t), ok: !!o.ok, c: COLS[i] }; x += widths[i]; return z; });
    G.q = { text: T(r[0]), right: T(r[1]), hook: T(r[4]) }; G.state = "play"; G.phase = rnd(0, 1); G.t0 = performance.now();
  }
  function period() { return (2.6 - Math.min(G.combo, 8) * 0.1) * (slow() ? 1.6 : 1); }
  function dotAt(now) { const p = ((now - G.t0) / 1000 / period() + G.phase) % 1; return (p < 0.5 ? p * 2 : 2 - p * 2); }
  function catchIt() {
    if (G.over) return;
    if (G.state === "ready") return;
    if (G.state !== "play") return;
    const u = G.dotX, z = G.zones.find(z => u >= z.x0 && u <= z.x1) || G.zones[G.zones.length - 1]; G.asked++;
    if (z.ok) { G.combo++; G.best = Math.max(G.best, G.combo); G.right++; const pts = 10 + Math.min(G.combo - 1, 5) * 2; G.score += pts; G.flash = 1; G.flashCol = "#3fd9a0"; G.pops.push({ x: u * (W - 60) + 30, y: 270, t: 0, txt: "+" + pts, c: "#7dffd0" }); live.textContent = T("Correct!") + " " + G.q.hook; }
    else { G.combo = 0; G.flash = 1; G.flashCol = "#ff7a7a"; G.missed.push({ q: G.q.text, a: G.q.right, h: G.q.hook }); G.pops.push({ x: u * (W - 60) + 30, y: 270, t: 0, txt: T("Answer:") + " " + G.q.right, c: "#ffd1d1" }); live.textContent = T("Answer:") + " " + G.q.right + " · " + G.q.hook; }
    G.state = "pause"; G.pause = performance.now() + 1500;
  }
  $("#pcCatch", box).addEventListener("click", catchIt); cv.addEventListener("pointerdown", catchIt);
  const key = e => { if (e.code === "Space" && document.body.contains(cv)) { e.preventDefault(); catchIt(); } }; addEventListener("keydown", key);
  /* wall-clock game state: setInterval handles the clock, the ready countdown and the end of the round */
  const start = performance.now(); G.deadline = start + 3000 + 120000;
  const clock = setInterval(() => {
    const now = performance.now();
    if (G.state === "ready" && now - start >= 3000) nextQ();
    if (G.state === "pause" && now >= G.pause) nextQ();
    if (now >= G.deadline) finish();
  }, 100);
  function finish() {
    if (G.over) return; G.over = true; clearInterval(clock); removeEventListener("keydown", key);
    const acc = G.asked ? Math.round(G.right / G.asked * 100) : 0;
    const seen = new Set(), list = G.missed.filter(m => !seen.has(m.q) && seen.add(m.q)).slice(0, 5).map(m => `<li><b>${m.q}</b> ${m.a}. <i>${m.h}</i></li>`).join("");
    box.innerHTML = `<div class="qend" style="color:#eaf6ff"><h3>${G.score} ${T("points")}</h3><p>${G.right} ${T("out of")} ${G.asked} ${T("caught")} (${acc}%). ${T("Best combo")}: ${G.best}.</p>${list ? `<p><b>${T("Revisit these:")}</b></p><ul style="text-align:left;max-width:560px;margin:auto">${list}</ul>` : `<p>${T("No missed answers. Brilliant!")}</p>`}<button class="btn btn--signal" id="pcAgain">${T("Play again")}</button> <a class="btn btn--ghost" href="#exam">${T("Skip to the practice exam")}</a></div>`;
    $("#pcAgain", box).addEventListener("click", () => mountCatcher(host, { onFinish }));
    onFinish && onFinish({ score: G.score, right: G.right, asked: G.asked, best: G.best });
  }
  function drawBg(now) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0d1c33"); g.addColorStop(1, "#08111f"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(125,255,208,.09)"; ctx.lineWidth = 1; for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (G.flash > 0) { ctx.fillStyle = G.flashCol; ctx.globalAlpha = G.flash * 0.22; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
  function hud(now) {
    const left = Math.max(0, Math.ceil((G.deadline - now) / 1000)), shown = G.state === "ready" ? 120 : Math.min(120, left);
    ctx.fillStyle = "#9fe7ff"; ctx.font = "700 18px sans-serif"; ctx.textAlign = "left"; ctx.fillText(T("Time") + " " + shown, 16, 28); ctx.textAlign = "center"; ctx.fillText(T("Score") + " " + G.score, W / 2, 28); ctx.textAlign = "right"; ctx.fillStyle = G.combo >= 3 ? "#ffd479" : "#9fe7ff"; ctx.fillText(T("Combo") + " " + G.combo, W - 16, 28);
    ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(16, 38, W - 32, 5); ctx.fillStyle = "#3fd9a0"; ctx.fillRect(16, 38, (W - 32) * (shown / 120), 5);
  }
  function frame() {
    if (G.over || !document.body.contains(cv)) return; requestAnimationFrame(frame);
    const now = performance.now(); G.flash = Math.max(0, G.flash - 0.03); drawBg(now); hud(now);
    if (G.state === "ready") { ctx.fillStyle = "#fff"; ctx.font = "800 34px sans-serif"; ctx.textAlign = "center"; ctx.fillText(T("Get ready") + " " + Math.max(1, Math.ceil(3 - (now - start) / 1000)), W / 2, H / 2); return; }
    ctx.fillStyle = "#fff"; ctx.font = "700 24px sans-serif"; ctx.textAlign = "center"; wrap(ctx, G.q.text, W - 60).forEach((l, i) => ctx.fillText(l, W / 2, 80 + i * 30));
    const tx = 30, tw = W - 60, ty = 140, th = 130;
    G.zones.forEach(z => { const x = tx + z.x0 * tw, w = (z.x1 - z.x0) * tw; const show = G.state === "pause" && z.ok; ctx.fillStyle = show ? "#1f9d6a" : z.c + "cc"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x + 3, ty, w - 6, th, 14) : ctx.rect(x + 3, ty, w - 6, th); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "700 17px sans-serif"; ctx.textAlign = "center"; const ls = wrap(ctx, z.t, w - 24); ls.forEach((l, i) => ctx.fillText(l, x + w / 2, ty + th / 2 - (ls.length - 1) * 11 + i * 22 + 6)); });
    G.dotX = G.state === "play" ? dotAt(now) : G.dotX; const dx = tx + G.dotX * tw, ly = 330;
    ctx.strokeStyle = "rgba(125,255,208,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ly); ctx.lineTo(tx + tw, ly); ctx.stroke();
    if (G.state === "play") { G.trail.push({ x: dx, t: now }); } G.trail = G.trail.filter(p => now - p.t < 500);
    ctx.lineWidth = 3; ctx.beginPath(); G.trail.forEach((p, i) => { const a = 1 - (now - p.t) / 500; const bump = Math.sin((p.x - tx) / 22) * 18 * a; i ? ctx.lineTo(p.x, ly + bump) : ctx.moveTo(p.x, ly + bump); }); ctx.strokeStyle = "rgba(125,255,208,.8)"; ctx.stroke();
    const beat = 1 + 0.25 * Math.max(0, Math.sin((now - G.t0) / 1000 * 8)); const gr = ctx.createRadialGradient(dx, ly, 2, dx, ly, 26 * beat); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.4, "#7dffd0"); gr.addColorStop(1, "rgba(125,255,208,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(dx, ly, 26 * beat, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(dx, ty + th); ctx.lineTo(dx, ly - 18); ctx.stroke(); ctx.setLineDash([]);
    G.pops = G.pops.filter(p => p.t < 1); G.pops.forEach(p => { p.t += 0.02; ctx.globalAlpha = 1 - p.t; ctx.fillStyle = p.c; ctx.font = "800 20px sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.txt, clamp(p.x, 120, W - 120), p.y - p.t * 40); ctx.globalAlpha = 1; });
  }
  requestAnimationFrame(frame);
  return { stop: finish };
}
