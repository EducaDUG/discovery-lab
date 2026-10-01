/* ==========================================================================
   OCEAN ENERGY BENCH — three hands-on stations (the Experiment's core)
   1. Wind    : speed -> turbine power. Cube law, cut-in, rated power, storm shutdown.
   2. Waves   : height & period -> energy per metre of crest -> device power. Square law.
   3. Tide &  : peak flow -> power over a whole 12.4 h tide. kW x hours = kWh, live.
      Current   Tides are predictable but pass through zero; ocean currents are steady.
   Every station uses the SAME physics as the Harbour Isle Grid game (grid-model.js),
   logs real rows to the Investigation Record, and reacts to every single input.
   ========================================================================== */
import * as M from "./grid-model.js";
import * as A from "./scene-art.js";

const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

export function mountBench(host, api, { L, reduced, award, onLogged }) {
  host.innerHTML = "";
  const root = document.createElement("div"); root.className = "bench";
  root.innerHTML = `
    <div class="bench__tabs" role="tablist" aria-label="${L("Energy stations", "Estaciones de energía")}">
      <button type="button" role="tab" class="bench__tab is-on" data-st="wind" aria-selected="true"><span class="bench__n">1</span>${L("Wind", "Viento")}</button>
      <button type="button" role="tab" class="bench__tab" data-st="wave" aria-selected="false"><span class="bench__n">2</span>${L("Waves", "Olas")}</button>
      <button type="button" role="tab" class="bench__tab" data-st="tide" aria-selected="false"><span class="bench__n">3</span>${L("Tide & current", "Marea y corriente")}</button>
    </div>
    <div class="bench__grid">
      <div class="bench__stage"><canvas class="bench__cv" aria-label="${L("Live simulation of the selected energy device", "Simulación en vivo del dispositivo seleccionado")}"></canvas>
        <div class="bench__chip" aria-live="polite"></div></div>
      <div class="bench__panel"></div>
    </div>`;
  host.append(root);
  const cv = root.querySelector("canvas"), ctx = cv.getContext("2d"), chip = root.querySelector(".bench__chip"), panel = root.querySelector(".bench__panel");
  let W = 960, H = 540, dpr = 1;
  function fit() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(320, Math.round(r.width)); H = Math.round(W * 9 / 16); cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  fit(); new ResizeObserver(fit).observe(cv);

  /* ---- particles & juice ---- */
  const parts = [], floaters = [];
  function burst(x, y, color, n = 26) { if (reduced) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 40 + Math.random() * 150; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0.8 + Math.random() * 0.5, max: 1.3, c: color, r: 1.6 + Math.random() * 2.6 }); } }
  function floatText(txt, x, y, color) { floaters.push({ txt, x, y, life: 1.8, color }); }
  function ring(x, y, color) { if (!reduced) floaters.push({ ring: true, x, y, life: 0.9, color }); }
  let punch = 0;

  const S = {
    st: "wind", t: 0,
    wind: { v: 5, shown: 5, ang: 0, last: null, spill: 0 },
    wave: { H: 1.5, T: 7.5, shown: 1.5, ph: 0, last: null },
    tide: { mode: "tidal", peak: 2.5, running: false, clock: 0, kwh: 0, trace: [], done: null, ang: 0 },
    badges: {},
  };
  const game = () => api.state.bench || (api.state.bench = { wind: 0, wave: 0, tide: 0 });

  /* ============ panels ============ */
  function tabTo(id) {
    S.st = id; root.querySelectorAll(".bench__tab").forEach(b => { const on = b.dataset.st === id; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
    chip.textContent = ""; chip.classList.remove("is-on");
    if (id === "wind") buildWind(); else if (id === "wave") buildWave(); else buildTide();
  }
  root.querySelectorAll(".bench__tab").forEach(b => b.addEventListener("click", () => tabTo(b.dataset.st)));
  root.querySelector(".bench__tabs").addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const ids = ["wind", "wave", "tide"], i = ids.indexOf(S.st), n = ids[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3]; tabTo(n); root.querySelector(`[data-st=${n}]`).focus();
  });
  function showChip(html, kind) { chip.innerHTML = html; chip.className = "bench__chip is-on" + (kind ? " is-" + kind : ""); if (!reduced) { chip.classList.remove("pop"); void chip.offsetWidth; chip.classList.add("pop"); } }
  function ctl(label, id, min, max, step, val, unit) {
    return `<div class="ctl"><label class="field__label" for="${id}">${label}</label><div class="ctl__row"><input id="${id}" class="ctl__range" type="range" min="${min}" max="${max}" step="${step}" value="${val}"><output class="ctl__out" for="${id}"><b id="${id}-o">${val}</b> ${unit}</output></div></div>`;
  }
  const bigRead = (id1, lab1, id2, lab2, id3, lab3) => `<div class="reads">
    <div class="read read--main"><span class="read__n" id="${id1}">0</span><span class="read__l">${lab1}</span></div>
    <div class="read"><span class="read__n" id="${id2}">0</span><span class="read__l">${lab2}</span></div>
    <div class="read"><span class="read__n" id="${id3}">0</span><span class="read__l">${lab3}</span></div></div>`;
  const $ = id => panel.querySelector("#" + id);

  /* ---------- WIND ---------- */
  function buildWind() {
    panel.innerHTML = `<p class="eyebrow">${L("Station 1 · Offshore wind", "Estación 1 · Eólica marina")}</p>
      <p class="bench__lede">${L("A 6 MW offshore turbine. Drag the wind speed, then double it and watch what the power does.", "Una turbina marina de 6 MW. Cambia la velocidad del viento y luego duplícala y mira qué hace la potencia.")}</p>
      ${ctl(L("Wind speed", "Velocidad del viento"), "w-v", 0, 30, 0.5, S.wind.v, "m/s")}
      <div class="cluster"><button type="button" class="btn btn--ghost" id="w-gust">${L("Gust!", "¡Ráfaga!")}</button>
      <button type="button" class="btn btn--ghost" id="w-dbl">${L("Double it ×2", "Duplicar ×2")}</button>
      <button type="button" class="btn btn--ghost" id="w-storm">${L("Storm", "Tormenta")}</button></div>
      ${bigRead("w-kw", L("kW now", "kW ahora"), "w-pct", L("% of rated 6,000 kW", "% de los 6.000 kW nominales"), "w-kwh", L("kWh if held 24 h", "kWh si dura 24 h"))}
      <p class="formula" id="w-f"></p><p class="bench__status" id="w-s" aria-live="polite"></p>
      <button type="button" class="btn btn--signal" id="w-log">${L("Log this reading →", "Registrar esta lectura →")}</button>`;
    const sl = $("w-v");
    sl.addEventListener("input", () => { S.wind.v = +sl.value; wUpdate(); });
    $("w-gust").addEventListener("click", () => { const b = S.wind.v; S.wind.v = Math.min(30, b + 3 + Math.random() * 5); sl.value = S.wind.v; wUpdate(); punch = 0.5; burst(W * 0.5, H * 0.35, "#bfe3ff", 18); floatText(L("Gust!", "¡Ráfaga!"), W * 0.3, H * 0.3, "#fff"); });
    $("w-storm").addEventListener("click", () => { S.wind.v = 27; sl.value = 27; wUpdate(); punch = 0.8; burst(W * 0.5, H * 0.4, "#ff9f9f", 22); });
    $("w-dbl").addEventListener("click", () => {
      const before = S.wind.v, pBefore = M.windPowerKW(before); const after = Math.min(30, before * 2); S.wind.v = after; sl.value = after; wUpdate();
      const pAfter = M.windPowerKW(after), capped = M.windRawKW(after) > 6000, rawR = M.windRawKW(after) / Math.max(1e-6, M.windRawKW(before));
      punch = 1; ring(W * 0.5, H * 0.34, "#ffd166"); burst(W * 0.5, H * 0.34, "#ffd166", 34);
      if (before >= 3 && before * 2 <= 25) { floatText("×" + fmt(rawR, 1), W * 0.62, H * 0.28, "#ffd166"); }
      showChip(L(`Speed ×2 → raw power ×${fmt(rawR, 1)}: ${fmt(pBefore)} → ${fmt(pAfter)} kW${capped ? " (capped at the turbine's 6,000 kW rating)" : after > 25 ? " (storm shutdown!)" : ""}`,
        `Velocidad ×2 → potencia ×${fmt(rawR, 1)}: ${fmt(pBefore)} → ${fmt(pAfter)} kW${capped ? " (limitada a la potencia nominal de 6.000 kW)" : after > 25 ? " (¡parada por tormenta!)" : ""}`), "good");
      if (!capped && before >= 3 && after <= 25 && !S.badges.cube) { S.badges.cube = 1; award("cube", L("Cube-law discoverer", "Descubridor de la ley del cubo")); }
    });
    $("w-log").addEventListener("click", () => {
      const v = S.wind.v, kw = M.windPowerKW(v);
      api.recordTrial({ source: L("Offshore wind", "Eólica marina"), setting: L(`Wind ${fmt(v, 1)} m/s`, `Viento ${fmt(v, 1)} m/s`), power: Math.round(kw), hours: 24, kwh: Math.round(kw * 24), util: Math.round(kw / 60) });
      game().wind++; burst(W * 0.82, H * 0.3, "#5fb6e8", 26); floatText("+1 " + L("reading", "lectura"), W * 0.74, H * 0.22, "#fff"); toastLogged(); api.saveState();
    });
    wUpdate();
  }
  function wUpdate() {
    const v = S.wind.v, kw = M.windPowerKW(v), raw = M.windRawKW(v);
    $("w-v-o").textContent = fmt(v, 1); $("w-kw").textContent = fmt(kw); $("w-pct").textContent = fmt(kw / 60, 0) + "%"; $("w-kwh").textContent = fmt(kw * 24);
    const A_ = Math.PI * 65 * 65;
    $("w-f").innerHTML = `P = ½ × ρ × A × v³ × Cp<br>= ½ × 1.225 × ${fmt(A_)} × ${fmt(v, 1)}³ × 0.42 = <b>${fmt(Math.min(raw, 6000))} kW</b>`;
    const s = $("w-s");
    s.textContent = v < 3 ? L("Below cut-in speed (3 m/s): the blades barely turn.", "Por debajo de la velocidad de arranque (3 m/s): las palas casi no giran.")
      : v > 25 ? L("Storm shutdown above 25 m/s: the turbine brakes to protect itself — output is zero.", "Parada por tormenta sobre 25 m/s: la turbina frena para protegerse — salida cero.")
      : raw > 6000 ? L("Rated power reached: the blades 'pitch' to spill extra wind, so power stays at 6,000 kW.", "Potencia nominal alcanzada: las palas se inclinan para descargar viento extra y la potencia se queda en 6.000 kW.")
      : L("Power rises with the CUBE of wind speed — small speed changes make big power changes.", "La potencia crece con el CUBO de la velocidad del viento: pequeños cambios de velocidad hacen grandes cambios de potencia.");
    s.className = "bench__status" + (v > 25 ? " is-bad" : raw > 6000 ? " is-warn" : "");
  }

  /* ---------- WAVES ---------- */
  function buildWave() {
    panel.innerHTML = `<p class="eyebrow">${L("Station 2 · Wave energy", "Estación 2 · Energía de las olas")}</p>
      <p class="bench__lede">${L("A floating wave device like the real Pelamis. Change the wave height and period and see how much energy each metre of wave carries.", "Un dispositivo flotante como el Pelamis real. Cambia la altura y el periodo de la ola y mira cuánta energía lleva cada metro de ola.")}</p>
      ${ctl(L("Wave height", "Altura de ola"), "v-h", 0.3, 8, 0.1, S.wave.H, "m")}
      ${ctl(L("Wave period", "Periodo de ola"), "v-t", 4, 14, 0.5, S.wave.T, "s")}
      <div class="cluster"><button type="button" class="btn btn--ghost" id="v-dbl">${L("Double the height ×2", "Duplicar la altura ×2")}</button>
      <button type="button" class="btn btn--ghost" id="v-storm">${L("Storm surge", "Marejada")}</button></div>
      ${bigRead("v-kw", L("kW from the device", "kW del dispositivo"), "v-flux", L("kW per metre of wave", "kW por metro de ola"), "v-kwh", L("kWh if held 24 h", "kWh si dura 24 h"))}
      <p class="formula" id="v-f"></p><p class="bench__status" id="v-s" aria-live="polite"></p>
      <button type="button" class="btn btn--signal" id="v-log">${L("Log this reading →", "Registrar esta lectura →")}</button>`;
    $("v-h").addEventListener("input", () => { S.wave.H = +$("v-h").value; vUpdate(); });
    $("v-t").addEventListener("input", () => { S.wave.T = +$("v-t").value; vUpdate(); });
    $("v-dbl").addEventListener("click", () => {
      const b = S.wave.H, pb = M.wavePowerKW(b, S.wave.T), fb = M.waveFluxKWperM(b, S.wave.T); S.wave.H = Math.min(8, b * 2); $("v-h").value = S.wave.H; vUpdate();
      const fa = M.waveFluxKWperM(S.wave.H, S.wave.T), pa = M.wavePowerKW(S.wave.H, S.wave.T);
      punch = 1; ring(W * 0.5, H * 0.58, "#ffd166"); burst(W * 0.5, H * 0.58, "#ffd166", 30); floatText("×" + fmt(fa / fb, 1), W * 0.6, H * 0.45, "#ffd166");
      showChip(L(`Height ×2 → energy per metre ×${fmt(fa / fb, 1)} (${fmt(fb, 1)} → ${fmt(fa, 1)} kW/m). Device output ${fmt(pb)} → ${fmt(pa)} kW${S.wave.H > 7 ? " (survival mode!)" : ""}`,
        `Altura ×2 → energía por metro ×${fmt(fa / fb, 1)} (${fmt(fb, 1)} → ${fmt(fa, 1)} kW/m). Salida ${fmt(pb)} → ${fmt(pa)} kW${S.wave.H > 7 ? " (¡modo supervivencia!)" : ""}`), "good");
      if (b >= 0.8 && b * 2 <= 7 && !S.badges.sq) { S.badges.sq = 1; award("sq", L("Wave-power physicist", "Físico de la energía de las olas")); }
    });
    $("v-storm").addEventListener("click", () => { S.wave.H = 7.8; S.wave.T = 12; $("v-h").value = 7.8; $("v-t").value = 12; vUpdate(); punch = 0.9; burst(W * 0.5, H * 0.55, "#ffb3c1", 26); });
    $("v-log").addEventListener("click", () => {
      const kw = M.wavePowerKW(S.wave.H, S.wave.T);
      api.recordTrial({ source: L("Wave device", "Dispositivo undimotriz"), setting: L(`Height ${fmt(S.wave.H, 1)} m, period ${fmt(S.wave.T, 1)} s`, `Altura ${fmt(S.wave.H, 1)} m, periodo ${fmt(S.wave.T, 1)} s`), power: Math.round(kw), hours: 24, kwh: Math.round(kw * 24), util: Math.round(kw / 15) });
      game().wave++; burst(W * 0.8, H * 0.3, "#ef476f", 26); floatText("+1 " + L("reading", "lectura"), W * 0.72, H * 0.22, "#fff"); toastLogged(); api.saveState();
    });
    vUpdate();
  }
  function vUpdate() {
    const { H: h, T: t } = S.wave, kw = M.wavePowerKW(h, t), fl = M.waveFluxKWperM(h, t);
    $("v-h-o").textContent = fmt(h, 1); $("v-t-o").textContent = fmt(t, 1); $("v-kw").textContent = fmt(kw); $("v-flux").textContent = fmt(fl, 1); $("v-kwh").textContent = fmt(kw * 24);
    $("v-f").innerHTML = `${L("Energy flux", "Flujo de energía")} = 0.49 × H² × T = 0.49 × ${fmt(h, 1)}² × ${fmt(t, 1)} = <b>${fmt(fl, 1)} kW/m</b><br>${L("Device captures about 27 m of wave front", "El dispositivo capta unos 27 m de frente de ola")} → <b>${fmt(kw)} kW</b>`;
    const s = $("v-s");
    s.textContent = h > 7 ? L("Survival mode above 7 m: the device is locked down to avoid destruction — output zero.", "Modo supervivencia sobre 7 m: el dispositivo se bloquea para no destruirse — salida cero.")
      : h < 0.5 ? L("Waves too small to move the device.", "Olas demasiado pequeñas para mover el dispositivo.")
      : fl * 27 > 1500 ? L("Rated power reached: output is limited to 1,500 kW.", "Potencia nominal alcanzada: la salida se limita a 1.500 kW.")
      : L("Power rises with the SQUARE of wave height — and also with the period.", "La potencia crece con el CUADRADO de la altura de ola — y también con el periodo.");
    s.className = "bench__status" + (h > 7 ? " is-bad" : fl * 27 > 1500 ? " is-warn" : "");
  }

  /* ---------- TIDE & CURRENT ---------- */
  const TIDE_PERIOD = 12.42, RUN_SECS = 11;
  function buildTide() {
    panel.innerHTML = `<p class="eyebrow">${L("Station 3 · Tide & ocean current", "Estación 3 · Marea y corriente oceánica")}</p>
      <p class="bench__lede">${L("A seabed-mounted turbine like the real Seaflow. Press Run to speed through one whole tide and watch kilowatts turn into kilowatt-hours.", "Una turbina anclada al fondo como el Seaflow real. Pulsa Ejecutar para recorrer una marea completa y ver cómo los kilovatios se convierten en kilovatios-hora.")}</p>
      <fieldset class="seg"><legend class="field__label">${L("Water movement", "Movimiento del agua")}</legend>
        <label class="seg__o"><input type="radio" name="tm" value="tidal" ${S.tide.mode === "tidal" ? "checked" : ""}><span>${L("Tidal stream (reverses)", "Corriente de marea (invierte)")}</span></label>
        <label class="seg__o"><input type="radio" name="tm" value="current" ${S.tide.mode === "current" ? "checked" : ""}><span>${L("Ocean current (steady)", "Corriente oceánica (constante)")}</span></label></fieldset>
      ${ctl(L("Peak flow speed", "Velocidad máxima del flujo"), "t-v", 0.5, 3.5, 0.1, S.tide.peak, "m/s")}
      <div class="cluster"><button type="button" class="btn btn--signal" id="t-run">▶ ${L("Run one tide (12.4 h)", "Ejecutar una marea (12,4 h)")}</button></div>
      ${bigRead("t-kw", L("kW now", "kW ahora"), "t-kwh", L("kWh so far", "kWh hasta ahora"), "t-clock", L("hours elapsed", "horas transcurridas"))}
      <p class="formula" id="t-f"></p><p class="bench__status" id="t-s" aria-live="polite">${L("Press Run. Then log the result.", "Pulsa Ejecutar. Luego registra el resultado.")}</p>
      <button type="button" class="btn btn--signal" id="t-log" disabled>${L("Log this run →", "Registrar esta ejecución →")}</button>`;
    panel.querySelectorAll("[name=tm]").forEach(r => r.addEventListener("change", () => { S.tide.mode = r.value; resetTide(); tUpdate(); }));
    $("t-v").addEventListener("input", () => { S.tide.peak = +$("t-v").value; if (!S.tide.running) { resetTide(); } tUpdate(); });
    $("t-run").addEventListener("click", () => { if (S.tide.running) return; resetTide(); S.tide.running = true; S.tide.startedAt = performance.now(); $("t-run").disabled = true; $("t-log").disabled = true; ring(W * 0.5, H * 0.55, "#2ee6b6"); burst(W * 0.5, H * 0.55, "#2ee6b6", 16); });
    $("t-log").addEventListener("click", () => {
      const d = S.tide.done; if (!d) return;
      api.recordTrial({ source: S.tide.mode === "tidal" ? L("Tidal stream turbine", "Turbina de marea") : L("Ocean-current turbine", "Turbina de corriente oceánica"), setting: L(`Peak flow ${fmt(S.tide.peak, 1)} m/s`, `Flujo máximo ${fmt(S.tide.peak, 1)} m/s`), power: Math.round(d.peakKW), hours: +TIDE_PERIOD.toFixed(1), kwh: Math.round(d.kwh), util: Math.round(d.cf) });
      game().tide++; $("t-log").disabled = true; burst(W * 0.8, H * 0.3, "#06d6a0", 28); floatText("+1 " + L("run", "ejecución"), W * 0.72, H * 0.22, "#fff"); toastLogged(); api.saveState();
    });
    tUpdate(); if (S.tide.done) finishTideUI(); else if (S.tide.running) $("t-run").disabled = true;
  }
  function tideFlow(clock) { return S.tide.mode === "tidal" ? S.tide.peak * Math.abs(Math.sin(2 * Math.PI * clock / TIDE_PERIOD)) : S.tide.peak; }
  function tideCfg() { return S.tide.mode === "tidal" ? M.TIDAL : M.CURRENT; }
  function resetTide() { S.tide.running = false; S.tide.clock = 0; S.tide.kwh = 0; S.tide.trace = []; S.tide.done = null; if ($("t-run")) { $("t-run").disabled = false; $("t-log").disabled = true; } }
  function tUpdate() {
    if (!$("t-v")) return;
    const v = tideFlow(S.tide.clock), kw = M.marinePowerKW(v, tideCfg());
    $("t-v-o").textContent = fmt(S.tide.peak, 1); $("t-kw").textContent = fmt(kw); $("t-kwh").textContent = fmt(S.tide.kwh); $("t-clock").textContent = fmt(S.tide.clock, 1);
    const cfg = tideCfg(), peakKW = M.marinePowerKW(S.tide.peak, cfg);
    $("t-f").innerHTML = `${L("Water is 800× denser than air", "El agua es 800 veces más densa que el aire")}: P = ½ × 1,025 × A × v³ × Cp<br>${L("At the peak flow", "Con el flujo máximo")} ${fmt(S.tide.peak, 1)} m/s → <b>${fmt(peakKW)} kW</b> &nbsp;·&nbsp; kWh = kW × h`;
  }
  function finishTideUI() {
    const d = S.tide.done; if (!d || !$("t-s")) return;
    $("t-s").innerHTML = L(`One tide: peak ${fmt(d.peakKW)} kW, average ${fmt(d.avgKW)} kW, energy <b>${fmt(d.kwh)} kWh</b> — capacity factor ${fmt(d.cf)}%.`, `Una marea: pico ${fmt(d.peakKW)} kW, promedio ${fmt(d.avgKW)} kW, energía <b>${fmt(d.kwh)} kWh</b> — factor de capacidad ${fmt(d.cf)}%.`);
    $("t-s").className = "bench__status is-good"; $("t-log").disabled = false; $("t-run").disabled = false;
  }

  /* ---------- logging toast / badges ---------- */
  function toastLogged() {
    const n = api.trials.length;
    api.toast(L(`Reading logged (${n} so far).` + (n >= 3 ? " Harbour Isle Grid is unlocked below!" : ` Log ${3 - n} more to unlock Harbour Isle Grid.`), `Lectura registrada (${n}).` + (n >= 3 ? " ¡Harbour Isle Grid se ha desbloqueado abajo!" : ` Registra ${3 - n} más para desbloquear Harbour Isle Grid.`)), "correct");
    if (n === 1) award("first", L("First reading logged", "Primera lectura registrada"));
    if (onLogged) onLogged(n);
  }

  /* ---- tide clock: setInterval + sub-stepped integration (never rAF — a throttled tab must still give the right kWh) ---- */
  const tideTimer = setInterval(() => {
    if (!host.isConnected) { clearInterval(tideTimer); return; }
    if (!S.tide.running) return;
    const el = (performance.now() - S.tide.startedAt) / 1000, target = Math.min(TIDE_PERIOD, el / RUN_SECS * TIDE_PERIOD);
    while (S.tide.clock < target - 1e-9) {
      const step = Math.min(0.05, target - S.tide.clock); S.tide.clock += step;
      const kw = M.marinePowerKW(tideFlow(S.tide.clock), tideCfg()); S.tide.kwh += kw * step; S.tide.trace.push([S.tide.clock, kw]);
    }
    if (S.tide.clock >= TIDE_PERIOD - 1e-9) {
      S.tide.running = false; const pk = Math.max(...S.tide.trace.map(p => p[1])); const rated = tideCfg().rated * 1000;
      S.tide.done = { kwh: S.tide.kwh, peakKW: pk, avgKW: S.tide.kwh / TIDE_PERIOD, cf: S.tide.kwh / TIDE_PERIOD / rated * 100 };
      burst(W * 0.5, H * 0.5, "#06d6a0", 40); ring(W * 0.5, H * 0.5, "#06d6a0"); punch = 0.8; finishTideUI();
      if (!S.badges.kwh) { S.badges.kwh = 1; award("kwh", L("Kilowatt-hour counter", "Contador de kilovatios-hora")); }
      showChip(L(`Energy this tide = ${fmt(S.tide.kwh)} kWh. That would run about ${fmt(S.tide.kwh / 30)} homes for a day.`, `Energía de esta marea = ${fmt(S.tide.kwh)} kWh. Alcanza para unas ${fmt(S.tide.kwh / 30)} casas durante un día.`), "good");
    }
    tUpdate();
  }, 50);

  /* ============ render loop (cosmetic only; the tide clock uses wall time) ============ */
  let last = performance.now(), raf = 0;
  function frame(now) {
    if (!host.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt;
    draw(dt); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const mo = new MutationObserver(() => { if (!host.isConnected) { cancelAnimationFrame(raf); clearInterval(tideTimer); mo.disconnect(); } }); mo.observe(document.body, { childList: true, subtree: true });

  /* ---- gauge ---- */
  function gauge(x, y, r, val, max, label, color, ratedFrac) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = r * 0.16; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(10,25,45,.55)"; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.85, Math.PI * 2.15); ctx.stroke();
    const f = Math.max(0, Math.min(1, val / max)); ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.85, Math.PI * (0.85 + 1.3 * f)); ctx.stroke();
    if (ratedFrac) { const a = Math.PI * (0.85 + 1.3 * ratedFrac); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - r * 0.2), Math.sin(a) * (r - r * 0.2)); ctx.lineTo(Math.cos(a) * (r + r * 0.2), Math.sin(a) * (r + r * 0.2)); ctx.stroke(); }
    const na = Math.PI * (0.85 + 1.3 * f); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(na) * r * 0.82, Math.sin(na) * r * 0.82); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `700 ${Math.round(r * 0.34)}px "JetBrains Mono", ui-monospace, monospace`; ctx.fillText(fmt(val), 0, r * 0.62);
    ctx.font = `600 ${Math.round(r * 0.2)}px system-ui, sans-serif`; ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillText(label, 0, r * 0.62 + r * 0.26);
    ctx.restore();
  }
  const streaks = Array.from({ length: 46 }, (_, i) => ({ x: Math.random(), y: Math.random(), l: 0.5 + Math.random() }));
  const bubbles = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 2 }));

  function draw(dt) {
    const m = reduced ? 0.25 : 1; ctx.clearRect(0, 0, W, H);
    punch = Math.max(0, punch - dt * 2.2);
    ctx.save(); if (punch > 0 && !reduced) { const z = 1 + 0.035 * punch; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); }
    if (S.st === "wind") drawWindScene(dt, m); else if (S.st === "wave") drawWaveScene(dt, m); else drawTideScene(dt, m);
    ctx.restore();
    // particles + floaters (screen space)
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.vy += 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.min(1, p.life / p.max * 1.4); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i]; f.life -= dt; if (f.life <= 0) { floaters.splice(i, 1); continue; }
      if (f.ring) { const k = 1 - f.life / 0.9; ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + k * 120, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      else { f.y -= 30 * dt; ctx.globalAlpha = Math.min(1, f.life); ctx.fillStyle = f.color; ctx.font = `800 ${Math.round(W * 0.034)}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.strokeStyle = "rgba(0,20,40,.55)"; ctx.lineWidth = 4; ctx.strokeText(f.txt, f.x, f.y); ctx.fillText(f.txt, f.x, f.y); ctx.globalAlpha = 1; }
    }
  }
  function drawWindScene(dt, m) {
    const w = S.wind, hz = H * 0.42, v = w.v;
    w.shown += (v - w.shown) * Math.min(1, dt * 5);
    const kw = M.windPowerKW(w.shown), omega = (v < 3 || v > 25 ? 0 : Math.min(v, 12) * 0.2) * m;
    w.ang += omega * dt * 4;
    A.drawSky(ctx, W, hz, 12, 0.12 + Math.min(0.7, v / 40), S.t, reduced);
    A.drawSea(ctx, W, H, hz, 12, 0.4 + v * 0.07, 6, S.t, reduced, v, 1);
    A.drawWind(ctx, W * 0.46, H * 0.8, H / 255, w.ang, Math.min(1, omega / 1.5), false);
    // wind streaks
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.6;
    streaks.forEach(s => { s.x += dt * (v * 0.035 + 0.01) * m; if (s.x > 1.1) { s.x = -0.1; s.y = Math.random(); } const x = s.x * W, y = hz * 0.15 + s.y * hz * 1.5, len = 10 + v * 2.4 * s.l; ctx.globalAlpha = Math.min(0.7, 0.2 + v / 40); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); });
    ctx.globalAlpha = 1;
    gauge(W * 0.84, H * 0.3, W * 0.085, kw, 6000, "kW", v > 25 ? "#ff6b6b" : "#ffd166", 1);
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.font = `700 ${Math.round(W * 0.026)}px system-ui, sans-serif`; ctx.textAlign = "left"; ctx.fillText(`${fmt(v, 1)} m/s`, W * 0.03, H * 0.1);
  }
  function drawWaveScene(dt, m) {
    const w = S.wave, hz = H * 0.34; w.shown += (w.H - w.shown) * Math.min(1, dt * 5);
    const hh = w.shown, kw = M.wavePowerKW(hh, w.T), amp = Math.min(34, hh * 4.6);
    w.ph += dt * (2 * Math.PI / w.T) * 1.6 * m;
    A.drawSky(ctx, W, hz, 12, 0.15 + Math.min(0.75, hh / 11), S.t, reduced);
    A.drawSea(ctx, W, H, hz, 12, hh, w.T, S.t, reduced, 8, 4.4);
    // device rides a wave
    const x = W * 0.5, y = H * 0.66 + Math.sin(w.ph) * amp * 0.5;
    A.drawWaveDevice(ctx, x, y, W / 250, w.ph, amp, false);
    // measuring stick: wave height
    const sx = W * 0.14; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2; const top = H * 0.66 - amp * 1.1, bot = H * 0.66 + amp * 1.1;
    ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx, bot); ctx.moveTo(sx - 8, top); ctx.lineTo(sx + 8, top); ctx.moveTo(sx - 8, bot); ctx.lineTo(sx + 8, bot); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.round(W * 0.026)}px system-ui, sans-serif`; ctx.textAlign = "left"; ctx.fillText(`H = ${fmt(hh, 1)} m`, sx + 12, H * 0.66 + 4);
    gauge(W * 0.84, H * 0.3, W * 0.085, kw, 1500, "kW", hh > 7 ? "#ff6b6b" : "#ff6b81", 1);
    if (hh > 7) { ctx.fillStyle = "rgba(255,80,80,.9)"; ctx.font = `800 ${Math.round(W * 0.03)}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.fillText(L("SURVIVAL MODE", "MODO SUPERVIVENCIA"), W * 0.5, H * 0.52); }
  }
  function drawTideScene(dt, m) {
    const t = S.tide, hz = H * 0.3, v = tideFlow(t.clock), cfg = tideCfg(), kw = M.marinePowerKW(v, cfg);
    const dir = t.mode === "tidal" ? (Math.sin(2 * Math.PI * t.clock / TIDE_PERIOD) >= 0 ? 1 : -1) : 1;
    t.ang += Math.min(v, 3.5) * 0.9 * dt * dir * m * 2;
    const idleV = t.running || t.done ? v : t.peak * 0.5;
    A.drawSky(ctx, W, hz, 12, 0.2, S.t, reduced); A.drawSea(ctx, W, H * 0.48, hz, 12, 0.7, 7, S.t, reduced, 6, 1);
    // underwater cutaway
    const g = ctx.createLinearGradient(0, H * 0.46, 0, H); g.addColorStop(0, "#0d6f9c"); g.addColorStop(1, "#052a44"); ctx.fillStyle = g; ctx.fillRect(0, H * 0.46, W, H * 0.54);
    ctx.fillStyle = "#3a2f23"; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.9); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H * 0.9 + Math.sin(x * 0.02) * 6); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = "#26303c"; ctx.fillRect(W * 0.5 - 8, H * 0.2, 16, H * 0.72);       // the pile
    bubbles.forEach(b => { b.x += dt * idleV * 0.06 * dir * m; if (b.x > 1.05) b.x -= 1.1; if (b.x < -0.05) b.x += 1.1; ctx.globalAlpha = 0.3 + 0.3 * b.r / 2.5; ctx.fillStyle = "#d8f3ff"; ctx.beginPath(); ctx.arc(b.x * W, H * 0.5 + b.y * H * 0.38, b.r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const y = H * (0.54 + i * 0.065), L_ = 14 + idleV * 12; for (let k = 0; k < 4; k++) { const x = ((S.t * idleV * 30 * dir * m + k * W / 4 + i * 37) % W + W) % W; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dir * L_, y); ctx.stroke(); } }
    // turbine, rotor in the cutaway
    const s = W / 330, tx = W * 0.5, ty = H * 0.35;
    ctx.save(); ctx.translate(tx, H * 0.7); ctx.fillStyle = "#cf4a46"; ctx.beginPath(); ctx.ellipse(0, 0, 14, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#e8eef2"; const cw = Math.abs(Math.cos(t.ang));
    ctx.fillRect(-4, -s * 22 * cw - 2, 8, s * 44 * cw + 4); ctx.restore();
    ctx.fillStyle = "#e5484d"; A.roundRect(ctx, tx - 26, ty - 30, 52, 34, 4); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.fillRect(tx - 22, ty - 25, 44, 5);
    ctx.fillStyle = "#26303c"; ctx.fillRect(tx - 2, ty - 62, 4, 34);
    gauge(W * 0.84, H * 0.22, W * 0.075, kw, cfg.rated * 1000, "kW", "#2ee6b6", 1);
    // live power trace + the kWh area
    const bx = W * 0.04, by = H * 0.8, bw = W * 0.32, bh = H * 0.16;
    ctx.fillStyle = "rgba(4,20,38,.62)"; A.roundRect(ctx, bx - 8, by - bh - 20, bw + 16, bh + 38, 8); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by - bh); ctx.lineTo(bx, by); ctx.lineTo(bx + bw, by); ctx.stroke();
    if (t.trace.length > 1) {
      ctx.fillStyle = "rgba(46,230,182,.45)"; ctx.beginPath(); ctx.moveTo(bx, by);
      t.trace.forEach(p => ctx.lineTo(bx + p[0] / TIDE_PERIOD * bw, by - p[1] / (cfg.rated * 1000) * bh)); ctx.lineTo(bx + t.clock / TIDE_PERIOD * bw, by); ctx.fill();
      ctx.strokeStyle = "#2ee6b6"; ctx.lineWidth = 2; ctx.beginPath(); t.trace.forEach((p, i) => { const X = bx + p[0] / TIDE_PERIOD * bw, Y = by - p[1] / (cfg.rated * 1000) * bh; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = `600 ${Math.round(W * 0.02)}px system-ui, sans-serif`; ctx.textAlign = "left";
    ctx.fillText(L("Power over the tide (area = kWh)", "Potencia durante la marea (área = kWh)"), bx, by - bh - 6); ctx.textAlign = "right"; ctx.fillText("0 h", bx + 12, by + 14); ctx.fillText("12.4 h", bx + bw, by + 14);
    ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.round(W * 0.024)}px system-ui, sans-serif`; ctx.textAlign = "left"; ctx.fillText(`${fmt(v, 2)} m/s ${dir > 0 ? "→" : "←"}`, W * 0.03, H * 0.1);
  }

  tabTo("wind");
  return { destroy() { cancelAnimationFrame(raf); clearInterval(tideTimer); mo.disconnect(); } };
}
