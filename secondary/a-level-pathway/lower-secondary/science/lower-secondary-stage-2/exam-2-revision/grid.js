/* Bonus game for the Exam 2 revision website: "Keep the Lights On" (tycoon / resource loop, local to this page).
   The student runs a small country's power grid through one 24-hour day, compressed into 2 minutes.
   - Game state runs on setInterval wall-clock time, never requestAnimationFrame.
   - No lives and no fail state: a blackout hour just scores fewer points and names how to fix it.
   - Source cards are real <button>s with real photos (keys 1-7 mirror them). Has its own mute button. */
import { ttsEnabled, setTTS } from "../../../../../../engine/accessibility.js?v=6";
import { T } from "../../../../../../engine/revision-kit.js?v=12";

const HOUR_MS = 5000, HOURS = 24;
const DEMAND = [40, 36, 34, 34, 38, 50, 68, 82, 80, 74, 70, 70, 72, 70, 70, 72, 78, 92, 100, 96, 86, 74, 58, 46];
const SRC = [
  { id: "solar", n: "Solar", img: "solar", max: 60, co2: 0, ren: true, ctrl: false, note: "free, but only by day" },
  { id: "wind", n: "Wind", img: "wind", max: 55, co2: 0, ren: true, ctrl: false, note: "free, but only when it blows" },
  { id: "hydro", n: "Hydro", img: "hydro", max: 40, co2: 0, ren: true, ctrl: true, note: "reliable, clean" },
  { id: "geo", n: "Geothermal", img: "geo", max: 30, co2: 0, ren: true, ctrl: true, note: "steady day and night" },
  { id: "bio", n: "Biomass", img: "biomass", max: 30, co2: 25, ren: true, ctrl: true, note: "renewable, some CO₂" },
  { id: "gas", n: "Natural gas", img: "gas", max: 60, co2: 55, ren: false, ctrl: true, note: "dependable, dirty" },
  { id: "coal", n: "Coal", img: "station", max: 80, co2: 100, ren: false, ctrl: true, note: "dependable, dirtiest" }
];
const LEVELS = [0, 0.5, 1];
const LABEL = ["Off", "Half", "Full"];
let seedWind = null;
function windAt(h) { if (!seedWind) seedWind = Array.from({ length: 30 }, (_, i) => 0.15 + 0.85 * Math.abs(Math.sin(i * 0.85 + 1.3) * Math.cos(i * 0.41))); return seedWind[h % 30]; }
const sunAt = h => Math.max(0, Math.sin(Math.PI * (h - 6) / 12));
const cloudAt = h => (h >= 10 && h <= 13) ? 0.45 : 1;
function out(s, h, lvl) {
  if (s.id === "solar") return s.max * sunAt(h) * cloudAt(h) * lvl;
  if (s.id === "wind") return s.max * windAt(h) * lvl;
  return s.max * lvl;
}


["Off", "Half", "Full", "Solar", "Wind", "Hydro", "Geothermal", "Biomass", "Natural gas", "Coal", "free, but only by day", "free, but only when it blows", "reliable, clean", "steady day and night", "renewable, some CO₂", "dependable, dirty", "dependable, dirtiest", "Fossil fuels are dependable but release CO₂ and are non-renewable.", "Solar and wind are clean but depend on the weather.", "Geothermal runs day and night where the location allows it.", "Wasted power: turn off sources you do not need, especially fossil fuels.", "Solar gives nothing at night, so plan geothermal, hydro, wind, biomass or battery cover.", "Wind and solar change with the weather: keep a steady source such as geothermal or hydro on as backup.", "Lots of CO₂ this hour: could renewables or the battery cover more?", "Excellent: you kept the lights on with a low-carbon mix.", "The lights stayed on, but try to use more clean power and less coal and gas.", "Good effort. Try using more steady renewables and the battery next time.", "The grid struggled. Plan ahead using the forecast and keep a steady source on."].forEach(T);
let styled = false;
function css() {
  if (styled) return; styled = true;
  const s = document.createElement("style");
  s.textContent = `
.gg{background:linear-gradient(180deg,#0e2a21,#0a1b15);color:#e1f0e9;border-radius:var(--radius-lg);padding:var(--sp-5);box-shadow:var(--shadow-3);}
.gg__hud{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.8rem;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#7dffd0;margin-bottom:.6rem;}
.gg__hud b{color:#fff;margin-left:.4rem;font-size:1.05rem;}
.gg__timer{height:8px;border-radius:99px;background:#ffffff1f;overflow:hidden;margin-bottom:.8rem;}
.gg__timer i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3fd9a0,#f3d36b);}
.gg__chart{width:100%;aspect-ratio:640/220;border-radius:12px;background:#08140f;display:block;}
.gg__meters{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin:.7rem 0;font-size:.8rem;}
.gg__meters div{background:#ffffff0d;border-radius:10px;padding:.5rem .7rem;}
.gg__meters b{display:block;font-size:1.15rem;color:#fff;}
.gg__bar{height:8px;border-radius:99px;background:#ffffff1f;overflow:hidden;margin-top:.3rem;}
.gg__bar u{display:block;height:100%;width:0;background:#3fd9a0;text-decoration:none;}
.gg__cards{display:grid;grid-template-columns:repeat(7,1fr);gap:.5rem;}
.gg__card{font:inherit;border:2px solid #ffffff33;background:#ffffff0d;color:#fff;border-radius:12px;padding:0 0 .5rem;cursor:pointer;overflow:hidden;text-align:center;min-height:120px;}
.gg__card img{display:block;width:100%;height:58px;object-fit:cover;}
.gg__card b{display:block;font-size:.8rem;margin-top:.3rem;}
.gg__card small{display:block;font-size:.66rem;color:#a9c9bc;padding:0 .2rem;}
.gg__card kbd{background:#000b;color:#7dffd0;border-radius:6px;padding:0 .4rem;font-size:.7rem;position:absolute;margin:.2rem;}
.gg__card span{display:inline-block;margin-top:.25rem;padding:.1rem .6rem;border-radius:99px;font-size:.75rem;font-weight:800;background:#ffffff22;}
.gg__card[data-l="1"] span{background:#f3d36b;color:#2a2100;}.gg__card[data-l="2"] span{background:#3fd9a0;color:#06231a;}
.gg__card:hover{border-color:#7dffd0;}
.gg__fb{min-height:3.4em;margin-top:.7rem;font-weight:600;font-size:.88rem;}
.gg__fc{display:flex;gap:1rem;flex-wrap:wrap;font-size:.8rem;color:#f3d36b;margin:.2rem 0 .6rem;}
.gg__foot{display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;font-size:.75rem;color:#a9c9bc;gap:1rem;flex-wrap:wrap;}
.gg__mute{font:inherit;font-size:.75rem;padding:.35rem .8rem;border-radius:99px;border:1px solid #ffffff55;background:transparent;color:#d6efe5;cursor:pointer;min-height:36px;}
.gg__end{text-align:center;padding:var(--sp-4);}
.gg__end h3{font-family:var(--font-display);font-size:var(--step-3);color:#fff;margin:.2rem 0;}
.gg__stats{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin:1rem 0;}
.gg__stats b{display:block;font-size:2rem;color:#7dffd0;font-family:var(--font-display);}
.gg__end ul{text-align:left;max-width:36rem;margin:.6rem auto 1rem;font-size:.85rem;}
@media (max-width:800px){.gg__cards{grid-template-columns:repeat(4,1fr)}.gg__meters{grid-template-columns:1fr}}`;
  document.head.append(s);
}

export function mountGrid(host, { onFinish }) {
  css();
  const lv = {}; SRC.forEach(s => lv[s.id] = (s.id === "solar" || s.id === "wind") ? 2 : (s.id === "geo" ? 2 : 0));
  let hour = 0, battery = 20, score = 0, co2 = 0, metHours = 0, cleanSum = 0, over = false, tickCount = 0;
  const log = [], tips = new Set();
  const t0 = performance.now(), BATTERY_MAX = 60;
  host.innerHTML = `<div class="gg"><div class="gg__hud"><span>${T("Hour")}<b id="ggH">0:00</b></span><span>${T("Demand")}<b id="ggD">40</b> MW</span><span>${T("Supply")}<b id="ggS">0</b> MW</span><span>CO&#8322;<b id="ggC">0</b></span><span>${T("Score")}<b id="ggP">0</b></span></div>
    <div class="gg__timer"><i id="ggBar"></i></div>
    <canvas class="gg__chart" id="ggCv" width="640" height="220" role="img" aria-label="${T("Chart of electricity demand and your supply over the day")}"></canvas>
    <div class="gg__fc" id="ggFc" aria-live="polite"></div>
    <div class="gg__meters"><div>${T("Battery")}<b id="ggB">20 / 60</b><div class="gg__bar"><u id="ggBb"></u></div></div><div>${T("Hours fully powered")}<b id="ggM">0</b></div><div>${T("Clean share of power")}<b id="ggCl">0%</b></div></div>
    <div class="gg__cards" role="group" aria-label="${T("Power sources: press to change Off, Half, Full")}">${SRC.map((s, i) => `<button type="button" class="gg__card" data-id="${s.id}" data-l="${lv[s.id]}"><kbd>${i + 1}</kbd><img src="photos/${s.img}.jpg" alt=""><b>${T(s.n)}</b><small>${T(s.note)}</small><span>${T(LABEL[lv[s.id]])}</span></button>`).join("")}</div>
    <div class="gg__fb" id="ggFb" aria-live="polite">${T("Switch sources so supply matches demand. Solar and wind follow the weather. The battery stores spare power for later.")}</div>
    <div class="gg__foot"><button type="button" class="gg__mute" id="ggMute"></button><span>${T("Press a card (or keys 1 to 7) to cycle Off, Half, Full. No lives: take your time.")}</span></div></div>`;
  const $ = s => host.querySelector(s);
  const paintMute = () => { const on = ttsEnabled(); $("#ggMute").textContent = on ? T("Sound on") : T("Sound off"); $("#ggMute").setAttribute("aria-label", on ? T("Sound on. Press to mute") : T("Sound off. Press to unmute")); };
  paintMute(); $("#ggMute").addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  const cards = {}; host.querySelectorAll(".gg__card").forEach(c => { cards[c.dataset.id] = c; c.addEventListener("click", () => cycle(c.dataset.id)); });
  function cycle(id) {
    const s = SRC.find(x => x.id === id);
    if (!s.ctrl) lv[id] = lv[id] === 2 ? 0 : 2; else lv[id] = (lv[id] + 1) % 3;
    cards[id].dataset.l = lv[id]; cards[id].querySelector("span").textContent = T((!s.ctrl && lv[id] === 1) ? "Full" : LABEL[lv[id]]);
    refresh();
  }
  const onKey = e => { const n = Number(e.key); if (n >= 1 && n <= SRC.length && host.contains($(".gg"))) cycle(SRC[n - 1].id); };
  document.addEventListener("keydown", onKey);
  function supplyAt(h) { let sup = 0, co = 0, clean = 0; SRC.forEach(s => { const o = out(s, h, lv[s.id] === 1 && !s.ctrl ? 1 : LEVELS[lv[s.id]]); sup += o; co += o * s.co2 / 100; if (s.ren) clean += o; }); return { sup, co, clean }; }
  function refresh() {
    const h = hour % HOURS, S = supplyAt(h); $("#ggH").textContent = String(h).padStart(2, "0") + ":00"; $("#ggD").textContent = DEMAND[h]; $("#ggS").textContent = Math.round(S.sup); $("#ggC").textContent = Math.round(co2);
    $("#ggP").textContent = Math.round(score); $("#ggB").textContent = `${Math.round(battery)} / ${BATTERY_MAX}`; $("#ggBb").style.width = battery / BATTERY_MAX * 100 + "%"; $("#ggM").textContent = metHours; $("#ggCl").textContent = (tickCount ? Math.round(cleanSum / tickCount * 100) : 0) + "%";
    const fc = []; for (let k = 1; k <= 3; k++) { const hh = (h + k) % HOURS; fc.push(`${String(hh).padStart(2, "0")}:00 ${T("sun")} ${Math.round(sunAt(hh) * cloudAt(hh) * 100)}% ${T("wind")} ${Math.round(windAt(hh) * 100)}% ${T("demand")} ${DEMAND[hh]}`); }
    $("#ggFc").innerHTML = "<span>" + T("Forecast:") + "</span>" + fc.map(f => `<span>${f}</span>`).join("");
    draw();
  }
  function draw() {
    const cv = $("#ggCv"), ctx = cv.getContext("2d"); ctx.clearRect(0, 0, 640, 220); ctx.fillStyle = "#08140f"; ctx.fillRect(0, 0, 640, 220);
    ctx.strokeStyle = "#ffffff1a"; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(30, 20 + i * 45); ctx.lineTo(630, 20 + i * 45); ctx.stroke(); }
    ctx.fillStyle = "#a9c9bc"; ctx.font = "11px sans-serif"; [0, 6, 12, 18, 24].forEach(h => ctx.fillText(h + ":00", 30 + h / 24 * 590 - 10, 214));
    ctx.strokeStyle = "#f3d36b"; ctx.lineWidth = 3; ctx.beginPath(); DEMAND.forEach((d, i) => { const x = 30 + i / 24 * 590 + 12, y = 200 - d * 1.75; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#f3d36b"; ctx.fillText(T("Demand"), 36, 18);
    ctx.strokeStyle = "#3fd9a0"; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < Math.min(log.length, 24); i++) { const x = 30 + i / 24 * 590 + 12, y = 200 - log[i].sup * 1.75; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.fillStyle = "#3fd9a0"; ctx.fillText(T("Your supply"), 100, 18);
    const cx = 30 + (hour % 24) / 24 * 590 + 12; ctx.strokeStyle = "#ffffff88"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, 200); ctx.stroke();
  }
  function tick() {
    const h = hour % HOURS, S = supplyAt(h), D = DEMAND[h];
    let sup = S.sup, used = sup, note = "";
    if (sup >= D) { const spare = sup - D; const store = Math.min(spare, BATTERY_MAX - battery); battery += store; used = D; if (spare - store > 5) { note = ` ${Math.round(spare - store)} MW ${T("was wasted: switch something off or let the battery fill.")}`; tips.add(T("Wasted power: turn off sources you do not need, especially fossil fuels.")); } }
    else { const need = D - sup, draw = Math.min(need, battery); battery -= draw; used = sup + draw; if (draw > 0) note = ` ${T("The battery supplied")} ${Math.round(draw)} MW.`; }
    const met = used >= D - 2; if (met) metHours++;
    const cleanFrac = used > 0 ? Math.min(1, S.clean / Math.max(S.sup, 1)) : 0;
    const pts = Math.min(1, used / D) * 60 + (met ? cleanFrac * 40 : 0);
    score += pts; co2 += S.co; cleanSum += cleanFrac; tickCount++;
    log.push({ sup, D, met, h });
    let msg;
    if (met) msg = `<b style="color:#7dffd0">${String(h).padStart(2, "0")}:00 ${T("fully powered.")}</b> ${T("Demand")} ${D} MW, ${T("supply")} ${Math.round(sup)} MW.${note} ${S.co > 150 ? T("Lots of CO₂ this hour: could renewables or the battery cover more?") : ""}`;
    else { msg = `<b style="color:#ff9d8d">${String(h).padStart(2, "0")}:00 ${T("short by")} ${Math.round(D - used)} MW.</b> ${T("Demand")} ${D} MW, ${T("supply")} ${Math.round(sup)} MW.${note}`; if (sunAt(h) === 0) tips.add(T("Solar gives nothing at night, so plan geothermal, hydro, wind, biomass or battery cover.")); else tips.add(T("Wind and solar change with the weather: keep a steady source such as geothermal or hydro on as backup.")); }
    $("#ggFb").innerHTML = msg;
    hour++; refresh();
    if (hour >= HOURS) end();
  }
  const clock = setInterval(() => {
    const el = performance.now() - t0; $("#ggBar").style.width = Math.min(100, el / (HOUR_MS * HOURS) * 100) + "%";
    if (el >= (hour + 1) * HOUR_MS && !over) tick();
  }, 150);
  function end() {
    if (over) return; over = true; clearInterval(clock); document.removeEventListener("keydown", onKey);
    const pct = Math.round(score / (HOURS * 100) * 100), clean = tickCount ? Math.round(cleanSum / tickCount * 100) : 0;
    host.innerHTML = `<div class="gg"><div class="gg__end"><h3>${T("Day complete!")}</h3><div class="gg__stats"><div><b>${Math.round(score)}</b>${T("score (max 2400)")}</div><div><b>${metHours} / 24</b>${T("hours fully powered")}</div><div><b>${clean}%</b>${T("clean power")}</div><div><b>${Math.round(co2)}</b>CO&#8322; ${T("released")}</div></div>
      <p>${T(pct >= 80 && clean >= 60 ? "Excellent: you kept the lights on with a low-carbon mix." : pct >= 80 ? "The lights stayed on, but try to use more clean power and less coal and gas." : pct >= 55 ? "Good effort. Try using more steady renewables and the battery next time." : "The grid struggled. Plan ahead using the forecast and keep a steady source on.")}</p>
      ${tips.size ? `<p><b>${T("What to remember:")}</b></p><ul>${[...tips].map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
      <ul><li>${T("Fossil fuels are dependable but release CO₂ and are non-renewable.")}</li><li>${T("Solar and wind are clean but depend on the weather.")}</li><li>${T("Geothermal runs day and night where the location allows it.")}</li></ul>
      <button type="button" class="btn" id="ggAgain">${T("Play again")}</button> <button type="button" class="btn btn--ghost" id="ggDone">${T("Close")}</button></div></div>`;
    host.querySelector("#ggAgain").addEventListener("click", () => mountGrid(host, { onFinish }));
    host.querySelector("#ggDone").addEventListener("click", () => { host.innerHTML = ""; });
    if (onFinish) onFinish({ score, metHours });
  }
  refresh();
}
