/* Frequency Control Room - the bonus round (precision-instrument challenge, CLAUDE.md 4 mechanic library).
   Hold a needle inside the green band for two minutes while demand events hit. Three real power sources with
   different response speeds: battery (instant, but runs down), pumped hydro (seconds), gas (slow, dirty).
   Wall-clock setInterval only (no requestAnimationFrame for game state). Silent round, so nothing to mute.
   Bonus, never mandatory: no lives, no fail state, always ends in a recap. */
export function mountFreqGame(host, o) {
  const L = o.L, DUR = 120, K = 280, BAND = 0.1, reduced = !!o.reduced;
  const UNITS = [
    { id: "batt", photo: "battery", name: L("Battery park", "Parque de baterías"), speed: L("answers in a blink", "responde en un parpadeo"), tau: 0.25, min: -60, max: 60, key: ["q", "a"], col: "#a78bfa" },
    { id: "hydro", photo: "hydro", name: L("Pumped hydro", "Hidroeléctrica de bombeo"), speed: L("takes a few seconds", "tarda unos segundos"), tau: 1.8, min: -90, max: 90, key: ["w", "s"], col: "#38bdf8" },
    { id: "gas", photo: "gas", name: L("Gas peaker", "Central de gas"), speed: L("slow, and it emits CO₂", "lenta y emite CO₂"), tau: 4.5, min: 0, max: 90, key: ["e", "d"], col: "#fb923c" },
  ];
  const EVENTS = [
    [5, 9, 40, L("A factory shift starts", "Empieza un turno de fábrica"), L("Demand jumped 40 MW. Battery first (instant), then hand over to hydro so the battery is not drained.", "La demanda subió 40 MW. Primero la batería (instantánea), luego pasa a la hidro para no vaciarla.")],
    [13, 9, -30, L("A wind gust adds power", "Una ráfaga añade potencia"), L("Too much supply: frequency rises. Pull a source DOWN, or charge the battery with the extra.", "Sobra oferta: la frecuencia sube. Baja una fuente o carga la batería con el sobrante.")],
    [20, 10, 60, L("Evening: everyone cooks dinner", "Noche: todos cocinan"), L("A big, lasting rise. Slow sources (gas, hydro) must carry it; the battery only bridges the first seconds.", "Una subida grande y duradera. Las fuentes lentas (gas, hidro) deben sostenerla; la batería solo cubre los primeros segundos.")],
    [30, 8, 45, L("A cloud front shades the solar farm", "Un frente de nubes tapa el parque solar"), L("Solar output falls in seconds. Only the battery is fast enough to catch it.", "La producción solar cae en segundos. Solo la batería es lo bastante rápida.")],
    [38, 9, -40, L("A factory switches off", "Una fábrica se apaga"), L("Demand dropped: surplus. Pump water uphill to store it instead of wasting it.", "Cayó la demanda: sobra energía. Bombea agua hacia arriba para guardarla en vez de desperdiciarla.")],
    [47, 11, 70, L("Heat wave: air conditioners start", "Ola de calor: arrancan los aires acondicionados"), L("Heat waves raise demand for hours. Plan ahead: bring the slow gas peaker up early.", "Las olas de calor suben la demanda durante horas. Planifica: sube pronto la central de gas, que es lenta.")],
    [57, 8, -35, L("A transmission line reconnects", "Se reconecta una línea de transmisión"), L("Surplus again. Pull the gas peaker down first: it is the dirtiest and the slowest.", "Otra vez sobra energía. Baja primero la central de gas: es la más sucia y la más lenta.")],
    [66, 9, 55, L("A power plant trips offline", "Una central sale de servicio"), L("A sudden loss. The battery is your shock absorber: use it now, then rebalance.", "Una pérdida repentina. La batería es tu amortiguador: úsala ya y luego reequilibra.")],
    [75, 8, 35, L("Evening news ends, TVs go off, then on", "Termina el noticiero, los televisores se apagan y vuelven"), L("A small, quick bump. A small battery nudge is enough; do not over-correct.", "Un pequeño salto rápido. Basta un toque de batería; no corrijas de más.")],
    [84, 10, -55, L("A strong wind farm surge", "Un fuerte aumento del parque eólico"), L("Big surplus. Charge the battery AND pump water: that is energy saved for later.", "Gran excedente. Carga la batería Y bombea agua: es energía guardada para después.")],
    [95, 9, 65, L("Night shift plus electric-car charging", "Turno de noche y carga de coches eléctricos"), L("A strong rise at night, when there is no solar. Hydro and the battery are your clean options.", "Una subida fuerte de noche, sin sol. La hidro y la batería son tus opciones limpias.")],
    [106, 8, -30, L("Demand falls as the city sleeps", "La demanda cae mientras la ciudad duerme"), L("Last one: bring everything back toward zero and finish with a steady needle.", "La última: lleva todo hacia cero y termina con la aguja estable.")],
  ];
  const dist = t => EVENTS.reduce((s, e) => { const a = t - e[0], b = e[0] + e[1] - t, k = Math.max(0, Math.min(1, a / 1.5, b / 1.5)); return s + e[2] * k; }, 0);

  host.innerHTML = "";
  const box = document.createElement("div"); box.className = "fg"; host.append(box);
  box.innerHTML = `<div class="fg-launch"><div><p class="gc-eyebrow">${L("Bonus round · about 2 minutes · no marks", "Ronda extra · unos 2 minutos · sin puntos")}</p><h3>${L("Frequency Control Room", "Sala de control de frecuencia")}</h3><p>${L("You run the grid control desk. Events hit the grid and the needle drifts. Move the three real power sources to keep it inside the green band. Each reacts at a different speed. No lives, nothing to fail: just beat your own stability score.", "Diriges la mesa de control de la red. Los eventos golpean y la aguja se desvía. Mueve las tres fuentes reales para mantenerla en la banda verde. Cada una reacciona a distinta velocidad. Sin vidas ni fracasos: supera tu propio puntaje de estabilidad.")}</p></div><div class="fg-launch__b"><button type="button" class="gc-primary" id="fgPlay">${L("Play", "Jugar")}</button><button type="button" id="fgSkip">${L("Skip", "Omitir")}</button></div></div>`;
  box.querySelector("#fgSkip").addEventListener("click", () => { box.innerHTML = `<p class="gc-hint">${L("Bonus round skipped. You can play it any time.", "Ronda extra omitida. Puedes jugarla cuando quieras.")} <button type="button" id="fgAgain">${L("Play now", "Jugar ahora")}</button></p>`; box.querySelector("#fgAgain").addEventListener("click", () => mountFreqGame(host, o)); });
  box.querySelector("#fgPlay").addEventListener("click", start);

  function start() {
    box.innerHTML = `<div class="fg-hud"><span>${L("Time", "Tiempo")} <b id="fgT">120</b>s</span><span>${L("In band", "En banda")} <b id="fgS">100</b>%</span><span>${L("Streak", "Racha")} <b id="fgStr">0</b>s</span><span>CO₂ <b id="fgC">0</b> kg</span></div>
      <div class="fg-main"><div class="fg-dial"><canvas id="fgCv" width="520" height="300" aria-label="${L("Grid frequency dial and trace", "Dial y trazo de la frecuencia de la red")}"></canvas><div class="fg-hz"><b id="fgHz">60.00</b> Hz <span id="fgState"></span></div></div>
      <div class="fg-ctl" id="fgCtl"></div></div><div class="fg-tape" id="fgTape" aria-live="polite"></div>`;
    const lv = {}, set = {}; UNITS.forEach(u => { lv[u.id] = 0; set[u.id] = 0; });
    const ctl = box.querySelector("#fgCtl");
    UNITS.forEach(u => { const r = document.createElement("div"); r.className = "fg-u"; r.innerHTML = `<img src="${o.photoBase}${u.photo}.jpg" alt=""><div class="fg-u__b"><b>${u.name}</b><small>${u.speed}</small><div class="fg-bar"><i id="fgB_${u.id}"></i><s style="left:${(0 - u.min) / (u.max - u.min) * 100}%"></s></div><span id="fgV_${u.id}">0 MW</span></div><div class="fg-u__k"><button type="button" data-d="1" aria-label="${L("Raise", "Subir")} ${u.name}">+10<small>${u.key[0].toUpperCase()}</small></button><button type="button" data-d="-1" aria-label="${L("Lower", "Bajar")} ${u.name}">−10<small>${u.key[1].toUpperCase()}</small></button></div>`;
      r.querySelectorAll("button").forEach(b => b.addEventListener("click", () => nudge(u, +b.dataset.d))); ctl.append(r); });
    function nudge(u, d) { set[u.id] = Math.max(u.min, Math.min(u.max, set[u.id] + d * 10)); const b = box.querySelector("#fgB_" + u.id); if (b && !reduced) { b.parentElement.classList.remove("gc-pop"); void b.parentElement.offsetWidth; b.parentElement.classList.add("gc-pop"); } }
    const onKey = e => { if (e.target.closest && e.target.closest("input,textarea,select")) return; const k = e.key.toLowerCase(); UNITS.forEach(u => { if (k === u.key[0]) nudge(u, 1); else if (k === u.key[1]) nudge(u, -1); }); };
    document.addEventListener("keydown", onKey);
    const cv = box.querySelector("#fgCv"), g = cv.getContext("2d"), trace = []; let t = 0, band = 0, tot = 0, streak = 0, best = 0, co2 = 0, hz = 60, shown = -1, last = performance.now(), done = false, batt = 100;
    const tape = box.querySelector("#fgTape");
    function say(txt, hook, kind) { tape.className = "fg-tape " + (kind || ""); tape.innerHTML = `<b>${txt}</b> ${hook ? `<span>${hook}</span>` : ""}`; }
    say(L("Get ready: the first event is coming.", "Prepárate: viene el primer evento."), L("Tap +10 / −10 or press Q A W S E D to move the sources.", "Toca +10 / −10 o pulsa Q A W S E D para mover las fuentes."));
    function draw() { g.clearRect(0, 0, 520, 300); g.fillStyle = "#08111f"; g.fillRect(0, 0, 520, 300);
      const cx = 140, cy = 150, R = 105; g.lineWidth = 16; g.strokeStyle = "#1d2c44"; g.beginPath(); g.arc(cx, cy, R, Math.PI * 0.85, Math.PI * 2.15); g.stroke();
      const a = h => Math.PI * 0.85 + (Math.max(59.4, Math.min(60.6, h)) - 59.4) / 1.2 * Math.PI * 1.3; g.strokeStyle = "#34d399"; g.beginPath(); g.arc(cx, cy, R, a(60 - BAND), a(60 + BAND)); g.stroke(); g.strokeStyle = "#a3e635"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R + 14, a(59.8), a(60.2)); g.stroke();
      const na = a(hz); g.strokeStyle = "#f8fafc"; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(na) * (R - 12), cy + Math.sin(na) * (R - 12)); g.stroke(); g.fillStyle = "#f8fafc"; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill();
      g.fillStyle = "#7f93b0"; g.font = "11px system-ui"; g.fillText("59.4", cx - R - 8, cy + R * 0.78); g.fillText("60.6", cx + R - 22, cy + R * 0.78); g.fillText("60.0", cx - 12, cy - R - 22);
      const x0 = 285, w = 220, y0 = 40, hh = 220; g.strokeStyle = "#1d2c44"; g.lineWidth = 1; g.strokeRect(x0, y0, w, hh); g.fillStyle = "rgba(52,211,153,.16)"; const yb = h => y0 + hh * (1 - (h - 59.4) / 1.2); g.fillRect(x0, yb(60 + BAND), w, yb(60 - BAND) - yb(60 + BAND));
      g.strokeStyle = "#facc15"; g.lineWidth = 2; g.beginPath(); trace.forEach((p, i) => { const x = x0 + w * i / 200, y = yb(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.fillStyle = "#7f93b0"; g.fillText(L("last 10 seconds", "últimos 10 segundos"), x0, y0 - 8); g.lineCap = "butt"; }
    const iv = setInterval(() => {
      const now = performance.now(), dt = Math.min(0.2, (now - last) / 1000); last = now; if (done) return; t += dt;
      let resp = 0; UNITS.forEach(u => { lv[u.id] += (set[u.id] - lv[u.id]) * (1 - Math.exp(-dt / u.tau)); resp += lv[u.id]; });
      if (batt <= 0 && lv.batt > 0) { lv.batt *= 0.4; } batt = Math.max(0, Math.min(100, batt - (lv.batt / 60) * dt * 3.5)); co2 += lv.gas * 0.45 * dt * 0.6;
      const imb = dist(t) - resp; hz = 60 - imb / K; const inb = Math.abs(hz - 60) <= BAND; tot += dt; if (inb) { band += dt; streak += dt; best = Math.max(best, streak); } else streak = 0;
      trace.push(hz); if (trace.length > 200) trace.shift();
      const nx = EVENTS.findIndex(e => t >= e[0] && t < e[0] + 0.4); if (nx >= 0 && nx !== shown) { shown = nx; say(EVENTS[nx][3], EVENTS[nx][4], EVENTS[nx][2] > 0 ? "up" : "down"); }
      else { const up = EVENTS.find(e => e[0] > t); if (up && up[0] - t < 3 && shown !== "n" + up[0]) { /* heads-up */ } }
      box.querySelector("#fgT").textContent = Math.max(0, Math.ceil(DUR - t)); box.querySelector("#fgS").textContent = tot ? Math.round(100 * band / tot) : 100; box.querySelector("#fgStr").textContent = Math.floor(streak); box.querySelector("#fgC").textContent = Math.round(co2);
      const hzEl = box.querySelector("#fgHz"); hzEl.textContent = hz.toFixed(2); hzEl.style.color = inb ? "#34d399" : Math.abs(hz - 60) <= 0.2 ? "#a3e635" : "#f87171"; box.querySelector("#fgState").textContent = inb ? L("rock steady", "estable") : hz < 60 ? L("supply short", "falta oferta") : L("too much supply", "sobra oferta");
      UNITS.forEach(u => { const el = box.querySelector("#fgB_" + u.id), span = u.max - u.min, zero = (0 - u.min) / span; const v = lv[u.id]; el.style.left = (Math.min(zero, (v - u.min) / span) * 100) + "%"; el.style.width = (Math.abs(v / span) * 100) + "%"; el.style.background = v >= 0 ? u.col : "#38bdf8"; box.querySelector("#fgV_" + u.id).textContent = `${Math.round(v)} MW${u.id === "batt" ? ` · ${Math.round(batt)}%` : ""}`; });
      draw(); if (t >= DUR) finish(); }, 50);
    function finish() { done = true; clearInterval(iv); document.removeEventListener("keydown", onKey); const pct = Math.round(100 * band / tot); const grade = pct >= 85 ? L("Control-room ace", "As de la sala de control") : pct >= 65 ? L("Steady operator", "Operador constante") : pct >= 40 ? L("Learning the desk", "Aprendiendo la mesa") : L("Good first shift", "Buen primer turno");
      if (pct >= 70 && o.award) o.award("controlace", L("Control-room ace", "As de la sala de control")); o.onDone && o.onDone({ pct, best: Math.round(best), co2: Math.round(co2) });
      box.innerHTML = `<div class="fg-end"><p class="gc-eyebrow">${L("Shift over", "Turno terminado")}</p><h3>${grade}</h3><div class="fg-stats"><div><b>${pct}%</b><small>${L("time in the band", "tiempo en la banda")}</small></div><div><b>${Math.round(best)}s</b><small>${L("best steady streak", "mejor racha estable")}</small></div><div><b>${Math.round(co2)} kg</b><small>${L("CO₂ from gas", "CO₂ del gas")}</small></div></div><p class="gc-hint">${L("Big idea: fast sources (batteries) catch sudden changes, slower ones (hydro, then gas) take over for the long haul. Clean sources first keeps CO₂ low.", "Idea clave: las fuentes rápidas (baterías) atrapan los cambios bruscos y las lentas (hidro, luego gas) toman el relevo. Las limpias primero mantienen bajo el CO₂.")}</p><button type="button" class="gc-primary" id="fgAgain">${L("Play again", "Jugar otra vez")}</button></div>`; box.querySelector("#fgAgain").addEventListener("click", () => mountFreqGame(host, o)); }
    box._stop = () => { clearInterval(iv); document.removeEventListener("keydown", onKey); };
  }
  return { destroy() { box._stop && box._stop(); host.innerHTML = ""; } };
}
