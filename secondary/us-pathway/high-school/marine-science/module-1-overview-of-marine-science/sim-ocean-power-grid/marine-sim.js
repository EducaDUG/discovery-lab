/* ==========================================================================
   OCEANCURRENTS SIMULATOR — controller (state, loops, HUD, evidence logging)
   Port of App.tsx + ControlPanel.tsx. Game state advances on setInterval timers only
   (30-minute ticks; the service boat on a 50 ms timer). requestAnimationFrame is
   used solely by the 3D scene to paint.
   ========================================================================== */
import { L, MARINE_TECHNOLOGIES, techOf, TECH_IDS, ZONES, CATEGORY, WAVE_IDS, scenarios } from "./marine-data.js?v=8";
import { SIMULATION_TICK_HOURS, calculateOceanEnvironment, stepSimulation, calculateDeviceOutput, calculateCityDemand, newGrid, makeDevice, isEligible, zoneAt, householdBill, KTS_TO_MS, solarFactor } from "./marine-engine.js?v=8";
import { getUpcomingForecast, getWeatherForDay } from "./marine-weather.js?v=8";
import { createScene, xToWorld } from "./marine-scene.js?v=8";
import { soundManager } from "./marine-sound.js?v=8";
import { tip, wireTips } from "./marine-tips.js?v=8";
import { techVisual, fmt, usd, openBuildDrawer, openDeviceDialog, openCodex, openMissions, openComparison, openDialog } from "./marine-ui.js?v=8";

const WX = {
  breeze: () => L("Moderate Ocean Breeze", "Brisa oceánica moderada"), storm: () => L("Winter Swell Storm", "Tormenta con oleaje invernal"),
  gale: () => L("Strong Coastal Gale", "Fuerte temporal costero"), doldrums: () => L("Doldrums (Slack Wind)", "Calmas (viento flojo)"),
};
const STAGE = { high_stand: () => L("high stand", "pleamar"), ebb_flow: () => L("ebb flow", "reflujo"), low_stand: () => L("low stand", "bajamar"), flood_flow: () => L("flood flow", "flujo creciente") };
const TIDE = { spring: () => L("spring", "viva"), neap: () => L("neap", "muerta"), normal: () => L("normal", "normal") };
const DOCK = 0.11;
const HELI_PAD = { x: -320, z: 10 }, HELI_COST = 8000, HELI_SPEED = 46;   // world units per second; the helicopter flies from the city heliport tower

export function mountOceanSim(host, opts) {
  const { threeUrl, photoBase, reduced, award, recordTrial, toast, setResult } = opts;
  host.innerHTML = "";
  const root = document.createElement("div"); root.className = "oc"; host.append(root);
  root.innerHTML = `
  <div class="oc-top"><div class="oc-brand"><span class="oc-logo">🌊</span><div><b>OceanCurrents</b> <span class="oc-chip">${L("Marine Science", "Ciencias marinas")}</span></div></div>
    <div class="oc-stats"><div class="oc-stat"><span>💲 ${L("Treasury", "Tesorería")} ${tip("treasury")}</span><b data-k="funds"></b></div><div class="oc-stat"><span>⚡ ${L("Rate", "Tarifa")} ${tip("rate")}</span><b class="cy" data-k="rate"></b></div><div class="oc-stat"><span>🛡 ${L("Approval", "Aprobación")} ${tip("approval")}</span><b data-k="happyTop"></b></div></div>
    <div class="oc-tools"><button type="button" class="oc-btn oc-btn--amber" data-a="tutorial">🚀 ${L("Tutorial", "Tutorial")}</button><button type="button" class="oc-btn oc-btn--soft" data-a="howto">❓ ${L("How to Play", "Cómo jugar")}</button><button type="button" class="oc-btn oc-btn--soft" data-a="missions">🏅 ${L("Missions", "Misiones")}</button><button type="button" class="oc-btn oc-btn--soft" data-a="compare">⚖ ${L("Simulators Lab", "Laboratorio")}</button><button type="button" class="oc-btn oc-btn--soft" data-a="guide">📖 ${L("Field Guide", "Guía de campo")}</button><button type="button" class="oc-btn oc-btn--ghost" data-a="hidetop" title="${L("Hide the top menu to enlarge the ocean", "Oculta el menú superior para agrandar el océano")}">▲ ${L("Hide top", "Ocultar arriba")}</button><button type="button" class="oc-btn oc-btn--ghost" data-a="reset" title="${L("Reset mission", "Reiniciar misión")}">↻</button><button type="button" class="oc-btn oc-btn--ghost" data-a="fullscreen" aria-pressed="false" title="${L("Full screen: the whole simulator on one screen", "Pantalla completa: todo el simulador en una sola pantalla")}" data-k="fs">⛶ ${L("Full screen", "Pantalla completa")}</button></div></div>
  <div class="oc-mission-bar"><div><span class="oc-badge" data-k="mbadge"></span> <b data-k="mtitle"></b>: <span class="oc-muted" data-k="mdesc"></span></div><button type="button" class="oc-link" data-a="missions">${L("Directives", "Directrices")} →</button></div>
  <div class="oc-stage"><div class="oc-scene" data-k="scene" role="application"></div>
    <div class="oc-camera" role="toolbar" aria-label="${L("Camera", "Cámara")}"><span class="oc-cam__t">🧭 3D ${L("Ocean", "Océano")} ${tip("cam3d")}</span>
      <button type="button" data-cam="orbit" class="is-on">🌐 3D ${L("Bay", "Bahía")}</button><button type="button" data-cam="profile">📐 ${L("Depth Cutaway", "Corte de profundidad")}</button><button type="button" data-cam="city">🏙 ${L("City", "Ciudad")}</button><button type="button" data-cam="deep">🌊 ${L("Deep Water", "Aguas profundas")}</button>
      <button type="button" data-a="track" class="oc-track">🚤 ${L("Track Workboat", "Seguir barco")}</button><button type="button" data-a="mute" aria-pressed="false" data-k="mute2" class="oc-cam-mute"></button><button type="button" data-a="clean" title="${L("Clean ocean view: hide overlay menus", "Vista limpia: oculta los menús")}">👁 ${L("Clean view", "Vista limpia")}</button><button type="button" data-a="expand" title="${L("Expand the ocean: hide the top and bottom menus", "Ampliar el océano: oculta los menús superior e inferior")}">⤢ ${L("Expand", "Ampliar")}</button><button type="button" data-cam="orbit" aria-label="${L("Reset camera", "Restablecer cámara")}">⟲</button></div>
    <div class="oc-hint">${tip("mouse")} 🖱 ${L("Drag: Orbit", "Arrastrar: orbitar")} • ${L("Right-Click: Pan", "Clic derecho: mover")} • ${L("Scroll: Zoom", "Rueda: zoom")} • ${L("Arrow keys & +/− when focused", "Flechas y +/− con el foco")}</div>
    <button type="button" class="oc-restore oc-restore--top" data-a="showtop" hidden>▼ ${L("Show Top Menu", "Mostrar menú superior")}</button><button type="button" class="oc-restore oc-restore--bottom" data-a="showbottom" hidden>▲ ${L("Show Bottom Menus & Telemetry", "Mostrar menús y telemetría")}</button>
    <div class="oc-dock"><button type="button" class="oc-btn oc-btn--big" data-a="build">⚡ ${L("+ Build Generators", "+ Construir generadores")}</button>${tip("build")}</div>
    <div class="oc-bubble oc-bubble--heli" data-k="hbubble" hidden><span>🚁</span><b data-k="hquote"></b></div>
    <div class="oc-bubble" data-k="bubble" hidden><span>🚤</span><b data-k="quote"></b></div>
    <button type="button" class="oc-showopts" data-a="clean" hidden>👁 ${L("Show options", "Mostrar opciones")}</button><div class="oc-mentor" data-k="mentor" aria-live="polite"></div><div class="oc-built" data-k="built" hidden></div><div class="oc-target" data-k="target" hidden></div><div class="oc-flash" data-k="flash" role="status" aria-live="polite"></div></div>
  <div class="oc-botbar"><span><i></i> 📊 ${L("Telemetry & Simulation Controls", "Telemetría y controles de la simulación")}</span><button type="button" class="oc-btn oc-btn--soft" data-a="hidebottom">▼ ${L("Hide Bottom Menus", "Ocultar menús inferiores")}</button></div>
  <section class="oc-panel">
    <div class="oc-bar"><div class="oc-bar__l"><button type="button" class="oc-btn oc-btn--amber" data-a="pause">⏸ ${L("Pause", "Pausa")}</button>
      ${tip("speed")}<div class="oc-seg" role="group" aria-label="${L("Speed", "Velocidad")}">${[0.5, 1, 2, 4].map(s => `<button type="button" data-sp="${s}" class="${s === 1 ? "is-on" : ""}">${s}x</button>`).join("")}</div>
      <span class="oc-clock">${tip("clock")}<b class="cy" data-k="day"></b> · <span data-k="time"></span></span></div>
      <div class="oc-weather"><button type="button" class="oc-wxpill" data-a="forecast" data-k="wxpill" aria-haspopup="dialog"></button>${tip("weather")}</div>
      <div class="oc-bar__r"><span class="oc-snap"><button type="button" class="oc-btn oc-btn--go" data-a="snap">📸 ${L("Log snapshot", "Registrar instantánea")}</button>${tip("snap")}<span class="oc-snap__s"><b data-k="snapn"></b> <small data-k="snapc"></small></span>${tip("lab")}</span><button type="button" class="oc-btn oc-btn--soft" data-a="thermo" aria-pressed="false">👁 ${L("Thermocline", "Termoclina")}</button><button type="button" class="oc-btn oc-btn--soft" data-a="reefs" aria-pressed="true">🐠 ${L("Reefs", "Arrecifes")}</button><button type="button" class="oc-btn oc-btn--soft" data-a="mute" aria-pressed="false" data-k="mute"></button></div></div>
    <div class="oc-envstrip" role="group" aria-label="${L("Ocean conditions (live)", "Condiciones oceánicas (en vivo)")}"><span class="oc-envstrip__t">🌡 ${L("Live", "En vivo")} ${tip("envwind")}<span class="oc-pill" data-k="wx" hidden></span></span>
      <div><span class="oc-k">💨 ${L("Wind", "Viento")}</span><b data-k="wind"></b><small data-k="windms"></small></div><div><span class="oc-k">🌊 Hs ${tip("envhs")}</span><b data-k="hs"></b><small data-k="te"></small></div><div><span class="oc-k">〰 ${L("Wave flux", "Flujo de ola")} ${tip("envflux")}</span><b data-k="flux"></b><small>0.49·Hs²·Te</small></div><div><span class="oc-k">🌙 ${L("Tide", "Marea")} ${tip("envtide")}</span><b data-k="tide"></b><small data-k="tstage"></small></div><div><span class="oc-k">🌡 ${L("Surface/deep", "Superficie/fondo")} ${tip("envtemp")}</span><b data-k="temp"></b><small data-k="dt"></small></div><div><span class="oc-k">☀️ ${L("Sunlight", "Luz solar")} ${tip("envsun")}</span><b data-k="sun"></b><small data-k="sunsub"></small></div></div>
    <div class="oc-dash">
      <div class="oc-pane"><div class="oc-row"><b>⚡ ${L("Pacifica Bay Electrical Grid", "Red eléctrica de Pacifica Bay")} ${tip("grid")}</b><span class="oc-pill" data-k="gridstat"></span></div>
        <div class="oc-grid2"><div class="oc-tile"><span class="oc-k">${L("City Demand (Needs)", "Demanda de la ciudad (necesita)")} ${tip("demand")}</span><b class="oc-big" data-k="demand"></b><small data-k="pop"></small></div><div class="oc-tile"><span class="oc-k">${L("Ocean Output (Making)", "Producción oceánica (genera)")} ${tip("output")}</span><b class="oc-big cy" data-k="output"></b><small data-k="balance"></small></div></div>
        <div class="oc-mix" data-k="mix"></div>
        <div class="oc-row oc-row--line"><span>🔋 ${L("Stored energy", "Energía almacenada")} ${tip("store")}</span><b data-k="store"></b></div><div class="oc-meter"><i class="vi" data-k="storeb"></i></div></div>
      <div class="oc-pane"><div class="oc-row"><b>💲 ${L("City Treasury & Power Prices", "Tesorería y precios de la energía")}</b><b class="gn" data-k="funds2"></b></div>
        <div class="oc-tariff"><div class="oc-row"><span><b>${L("Electricity Price Charged to Families", "Precio de la electricidad para las familias")}</b> ${tip("tariff")}</span><b class="oc-big cy" data-k="tariffv"></b></div>
          <input type="range" class="oc-range" min="0.06" max="0.30" step="0.005" value="0.15" data-k="tariff" aria-label="${L("Price per kWh", "Precio por kWh")}">
          <div class="oc-row oc-muted"><span>${L("Cheap ($0.06)", "Barata ($0,06)")}</span><span class="am" data-k="bill"></span>${tip("bill")}<span>${L("Expensive ($0.30)", "Cara ($0,30)")}</span></div></div>
        <div class="oc-grid2"><div class="oc-tile oc-tile--row"><span class="oc-k">${L("Daily Revenue", "Ingreso diario")} ${tip("rev")}</span><b class="gn" data-k="rev"></b></div><div class="oc-tile oc-tile--row"><span class="oc-k">${L("Daily Opex", "Opex diario")} ${tip("opex")}</span><b class="rs" data-k="opex"></b></div></div>
        <div class="oc-row oc-row--line"><span>${L("Fleet LCOE (est.) vs your price", "LCOE de la flota (est.) vs tu precio")} ${tip("lcoe")}</span><b data-k="lcoe"></b></div></div>
      <div class="oc-pane"><div class="oc-row"><span><b>${L("Citizen Approval", "Aprobación ciudadana")}</b> ${tip("happy")}</span><b data-k="happy"></b></div><div class="oc-meter"><i data-k="happyb"></i></div>
        <div class="oc-tradie"><div class="oc-row"><b>🔧 ${L("Fleet Maintenance Operations", "Operaciones de mantenimiento de la flota")} ${tip("tradie")}</b><span>🚤🚁</span></div><div data-k="tradie"></div></div>
        <div class="oc-eco"><div title="${L("Game-scaled: about 0.1 acre of land spared per MWh delivered by ocean power", "A escala de juego: unos 0,1 acres de tierra salvados por MWh entregado con energía oceánica")}"><span class="oc-k">🌳 ${L("Land spared", "Tierra salvada")} ${tip("land")}</span><b class="gn" data-k="land"></b></div><div><span class="oc-k">☁ CO₂ ${L("prevented", "evitado")}</span><b class="gn" data-k="co2"></b></div><div><span class="oc-k">🐟 ${L("Ecosystem health", "Salud del ecosistema")}</span><b class="cy" data-k="eco"></b></div><div><span class="oc-k">⏱ ${L("Blackout hours", "Horas de apagón")} ${tip("blackout")}</span><b data-k="blk"></b></div><div><span class="oc-k">⚡ ${L("Generated / delivered", "Generado / entregado")}</span><b data-k="kwhs"></b></div></div></div>
    </div>
  </section>`;
  wireTips(root);
  const $ = k => root.querySelector(`[data-k=${k}]`), $$ = s => root.querySelectorAll(s);

  /* ---------------- state ---------------- */
  const S = { scenario: scenarios()[0], day: 1, startDay: 1, hour: 8.0, speed: 1, paused: true, weatherId: "", pendingZ: 0.5, boat: { active: false, xRatio: DOCK, targetXRatio: DOCK, targetDeviceId: "", state: "docked", serviceType: "scrub", cost: 3500, timer: 0 },
    heli: { active: false, state: "landed", x: HELI_PAD.x, z: HELI_PAD.z, tx: 0, tz: 0, targetDeviceId: "", cable: 0, timer: 0 },
    env: null, grid: null, devices: [], unlocked: [], selectedId: null, pendingTech: null, pendingX: null, showThermocline: false, showReefs: true, blackout: false, snaps: [], debriefed: false, flags: {}, sceneRef: null, openDevice: null };
  const ENV = () => calculateOceanEnvironment(S.day, S.hour, false);
  function loadScenario(sc) {
    S.scenario = sc; S.startDay = sc.startDay || 1; S.day = S.startDay; S.hour = 8.0; S.weatherId = ""; S.grid = newGrid(sc.startingFunds); S.unlocked = sc.startingTech.slice(); S.devices = sc.startingDevices.map((i, idx) => makeDevice(i.techId, i.xRatio, S.day, 5, 0.2 + ((idx * 0.35) % 0.6)));
    S.selectedId = null; S.pendingTech = null; S.pendingX = null; S.debriefed = false; S.boat = { active: false, xRatio: DOCK, targetXRatio: DOCK, targetDeviceId: "", state: "docked", serviceType: "scrub", cost: 3500, timer: 0 }; S.heli = { active: false, state: "landed", x: HELI_PAD.x, z: HELI_PAD.z, tx: 0, tz: 0, targetDeviceId: "", cable: 0, timer: 0 }; soundManager.stopAll(); S.env = ENV(); S.blackout = false; previewOutputs();
    hideTarget(); refresh();
  }
  function previewOutputs() { S.env = ENV(); S.devices = S.devices.map(d => ({ ...d, currentOutputKW: calculateDeviceOutput(d, S.env) })); S.grid = { ...S.grid, currentDemandKW: calculateCityDemand(S.grid.population, S.hour) }; }
  const flash = (msg, kind = "info") => { const f = $("flash"); f.textContent = msg; f.className = "oc-flash is-on is-" + kind; clearTimeout(flash.t); flash.t = setTimeout(() => f.classList.remove("is-on"), 4200); };
  const notify = (m, k) => { flash(m, k === "warn" ? "warn" : "info"); };

  /* ---------------- HUD refresh ---------------- */
  function refresh() {
    const g = S.grid, env = S.env, t = k => techOf(k);
    const hh = String(Math.floor(S.hour)).padStart(2, "0"), mm = String(Math.floor((S.hour % 1) * 60)).padStart(2, "0");
    $("funds").textContent = usd(g.funds); $("funds").className = g.funds < 30000 ? "rs oc-pulse" : "gn"; $("funds2").textContent = usd(g.funds); $("rate").textContent = `$${g.tariffPerKWh.toFixed(3)}/kWh`;
    const hc = g.citizenApproval > 75 ? "gn" : g.citizenApproval > 45 ? "am" : "rs"; $("happyTop").textContent = g.citizenApproval.toFixed(1) + "%"; $("happyTop").className = hc; $("happy").textContent = g.citizenApproval.toFixed(1) + "%"; $("happy").className = hc; const hb = $("happyb"); hb.style.width = g.citizenApproval + "%"; hb.className = hc;
    $("mbadge").textContent = S.scenario.badge; $("mtitle").textContent = S.scenario.title; $("mdesc").textContent = S.scenario.description;
    $("day").textContent = `${L("DAY", "DÍA")} ${S.day}`; $("time").textContent = `${hh}:${mm}`;
    let wave = 0, base = 0, wind = 0, solar = 0, tidal = 0;
    S.devices.forEach(d => { const c = techOf(d.techId).category; if (c === "wave") wave += d.currentOutputKW; else if (c === "baseload" || d.techId === "tidal_kite") base += d.currentOutputKW; else if (c === "wind") wind += d.currentOutputKW; else if (c === "solar") solar += d.currentOutputKW; else if (c === "tidal") tidal += d.currentOutputKW; });
    const total = wave + base + wind + solar + tidal;
    $("demand").innerHTML = `${(g.currentDemandKW / 1000).toFixed(1)} <small>MW</small>`; $("pop").textContent = `${fmt(g.population)} ${L("Residents", "habitantes")}`;
    $("output").innerHTML = `${(total / 1000).toFixed(1)} <small>MW</small>`; $("balance").textContent = total >= g.currentDemandKW ? L("🟢 Surplus Power", "🟢 Excedente de potencia") : L("🔴 Deficit!", "🔴 ¡Déficit!");
    const gs = $("gridstat"); gs.className = "oc-pill " + (g.isBlackout ? "bad" : "ok"); gs.textContent = g.isBlackout ? L("⚠ BLACKOUT!", "⚠ ¡APAGÓN!") : L("100% Ocean Powered", "100% energía oceánica");
    const row = (ic, lab, v, c) => `<div class="oc-row"><span>${ic} ${lab}</span><b style="color:${c}">${(v / 1000).toFixed(1)} MW</b></div>`;
    $("mix").innerHTML = row("⚓", L("24/7 Constant Baseload (OTEC / Osmotic / Kites)", "Base constante 24/7 (OTEC / osmótica / cometas)"), base, "#a5b4fc") + row("🌙", L("Tidal Stream (Moon-driven)", "Corriente de marea (por la Luna)"), tidal, "#818cf8") + row("🌊", L("Wave Converters (Peaks in swell)", "Convertidores de olas (máx. con oleaje)"), wave, "#67e8f9") + row("💨", L("Offshore Wind (Day & Night)", "Eólica marina (día y noche)"), wind, "#7dd3fc") + row("☀️", L("Floating Solar (Sun Only)", "Solar flotante (solo con sol)"), solar, "#fcd34d");
    $("store").textContent = `${fmt(g.storedEnergyKWh)} / ${fmt(g.maxStorageCapacityKWh)} kWh`; $("storeb").style.width = (g.maxStorageCapacityKWh ? (g.storedEnergyKWh / g.maxStorageCapacityKWh) * 100 : 0) + "%";
    $("wx").textContent = `${env.weatherIcon} ${env.weatherName}`; const wp = $("wxpill"); wp.innerHTML = `<span class="oc-wxpill__i">${env.weatherIcon}</span><span class="oc-wxpill__t"><small>${L("Day", "Día")} ${S.day} ${L("Weather", "Clima")}</small><b>${env.weatherName}</b></span><span class="oc-wxpill__m">${env.significantWaveHeightM}m ${L("waves", "olas")} · ${L("Forecast", "Pronóstico")} ▸</span>`; $("wind").textContent = `${env.windSpeedKts.toFixed(1)} kts`; $("windms").textContent = `${(env.windSpeedKts * KTS_TO_MS).toFixed(1)} m/s`;
    $("hs").textContent = `${env.significantWaveHeightM.toFixed(2)} m`; $("te").textContent = `Te ${env.wavePeriodSec.toFixed(1)} s`; $("flux").textContent = `${env.waveEnergyFluxKWM.toFixed(1)} kW/m`;
    $("tide").textContent = `${env.tidalCurrentSpeedKts.toFixed(1)} kts`; $("tstage").textContent = `${STAGE[env.tideStage]()} · ${TIDE[env.tideType]()}`; $("temp").textContent = `${env.surfaceWaterTempC.toFixed(1)} / ${env.deepWaterTempC.toFixed(1)} °C`; $("dt").textContent = `ΔT ${(env.surfaceWaterTempC - env.deepWaterTempC).toFixed(1)} °C`;
    const bell = solarFactor(env.hourOfDay), sun = Math.round(bell * env.solarEfficiency * 100); $("sun").textContent = sun + "%"; $("sunsub").textContent = bell === 0 ? L("night", "noche") : env.solarEfficiency < 0.5 ? L("overcast", "cubierto") : env.solarEfficiency < 0.9 ? L("partly cloudy", "parcialmente nublado") : L("daylight", "luz diurna");
    $("tariffv").innerHTML = `$${g.tariffPerKWh.toFixed(3)} <small>/ kWh</small>`; const tr = $("tariff"); if (document.activeElement !== tr) tr.value = g.tariffPerKWh; $("bill").innerHTML = `${L("Average Family Bill", "Factura media familiar")}: <b>${usd(householdBill(g.tariffPerKWh))} / ${L("month", "mes")}</b>`;
    $("rev").textContent = `+${usd(g.dailyRevenue)}/${L("day", "día")}`; $("opex").textContent = `-${usd(g.dailyExpenses)}/${L("day", "día")}`;
    const rated = S.devices.filter(d => techOf(d.techId).category !== "storage"), rw = rated.reduce((a, d) => a + techOf(d.techId).ratedPowerKW, 0), lc = rw ? rated.reduce((a, d) => a + techOf(d.techId).lcoeEstimate * techOf(d.techId).ratedPowerKW, 0) / rw : 0;
    $("lcoe").innerHTML = `$${lc.toFixed(3)} vs $${g.tariffPerKWh.toFixed(3)} <span class="${g.tariffPerKWh >= lc ? "gn" : "rs"}">${g.tariffPerKWh >= lc ? "▲ " + L("margin", "margen") : "▼ " + L("below cost", "bajo coste")}</span>`;
    $("land").textContent = `${g.landSavedAcres.toFixed(1)} ${L("acres", "acres")}`; $("co2").textContent = `${fmt(g.co2PreventedTons, 1)} t`; $("eco").textContent = Math.round(g.marineEcosystemHealth) + "%"; $("blk").textContent = `${g.blackoutHours.toFixed(1)} h`; $("kwhs").textContent = `${fmt(g.totalKWhGenerated)} / ${fmt(g.totalKWhConsumed)} kWh`;
    const B = S.boat, H = S.heli, td = $("tradie"), canB = g.funds >= 3500 && S.devices.length > 0, canH = g.funds >= HELI_COST && S.devices.length > 0;
    const fkey = [B.active, B.state, H.active, H.state, canB, canH].join("|");
    if (td.dataset.key !== fkey) {
      td.dataset.key = fkey;
      const bstat = B.active ? `<div class="oc-boatstat">🚤 ${B.state === "sailing_to" ? L("Workboat cruising to facility!", "¡El barco navega hacia la instalación!") : B.state === "servicing" ? L("Scrubbing barnacles & tuning!", "¡Limpiando percebes y ajustando!") : L("Returning to port!", "¡Volviendo a puerto!")}</div>` : `<button type="button" class="oc-btn oc-btn--amber oc-wide" data-a="quick" ${canB && !H.active ? "" : "aria-disabled='true'"}>🚤 ${L("Send Workboat (Scrub) $3,500", "Enviar barco (limpieza) $3.500")}</button>`;
      const hstat = H.active ? `<div class="oc-boatstat">🚁 ${H.state === "flying_to" ? L("Helicopter rushing across the bay!", "¡El helicóptero cruza la bahía a toda velocidad!") : H.state === "dropping" ? L("Winching the floaty & air-dropping supplies!", "¡Bajando el salvavidas y soltando suministros!") : L("Airlift complete! Returning to the helipad.", "¡Rescate completado! Volviendo al helipuerto.")}</div>` : `<button type="button" class="oc-btn oc-btn--soft oc-wide oc-heli" data-a="heli" ${canH && !B.active ? "" : "aria-disabled='true'"}>🚁 ${L("Air-Drop Helicopter (Floaty Drop) $8,000", "Helicóptero con salvavidas $8.000")}</button>`;
      td.innerHTML = bstat + hstat + `<small class="oc-muted">${L("Workboat scrubs the most fouled generator; the helicopter flies from the city heliport, drops a floaty with a repair pack and restores 100% integrity.", "El barco limpia el generador más sucio; el helicóptero sale del helipuerto de la ciudad, baja un salvavidas con un kit de reparación y restaura el 100% de integridad.")}</small>`;
      const qb = td.querySelector("[data-a=quick]"); if (qb) qb.addEventListener("click", quickDispatch); const hb = td.querySelector("[data-a=heli]"); if (hb) hb.addEventListener("click", () => dispatchHeli());
    }
    const trk = root.querySelector(".oc-track"); if (trk) trk.innerHTML = H.active ? `🚁 ${L("Track Heli", "Seguir helicóptero")}` : `🚤 ${L("Track Boat", "Seguir barco")}`;
    const nd = new Set(S.snaps.map(s => s.cond)).size; $("snapn").textContent = `${S.snaps.length} ${L("snapshot(s) logged", "instantánea(s) registrada(s)")}`; $("snapc").textContent = `${L("Weather days logged", "Días de clima registrados")}: ${nd} ${S.snaps.length >= 3 && nd >= 2 ? "✅" : ""}`;
    for (const mt of [$("mute"), $("mute2")]) { mt.textContent = soundManager.getMuted() ? "🔇" : "🔊"; mt.setAttribute("aria-label", soundManager.getMuted() ? L("Sound off — click to unmute", "Sonido apagado — clic para activar") : L("Sound on — click to mute", "Sonido activado — clic para silenciar")); mt.setAttribute("aria-pressed", String(soundManager.getMuted())); }
    const pb = root.querySelector("[data-a=pause]"); pb.innerHTML = S.paused ? `▶ ${L("Resume", "Seguir")}` : `⏸ ${L("Pause", "Pausa")}`; pb.classList.toggle("is-paused", S.paused);
    if (S.openDevice) S.openDevice.tick();
  }

  /* ---------------- tick loop (setInterval) ---------------- */
  let tickTimer = 0;
  function startTick() { clearInterval(tickTimer); tickTimer = setInterval(tick, 850 / S.speed); }
  function tick() {
    if (S.paused || !root.isConnected) { if (!root.isConnected) destroy(); return; }
    const prevDay = S.day; let nh = S.hour + SIMULATION_TICK_HOURS, nd = S.day; if (nh >= 24) { nh %= 24; nd++; }
    S.day = nd; S.hour = Number(nh.toFixed(2)); const env = ENV(); const wasBlackout = S.grid.isBlackout;
    const r = stepSimulation(S.devices, S.grid, env, nd, S.hour); S.devices = r.updatedDevices; S.grid = r.updatedGrid; S.env = env; S.blackout = S.grid.isBlackout;
    if (S.grid.isBlackout && !wasBlackout) { soundManager.playWarningAlert(); flash(L("⚠ Blackout! Demand is higher than supply + storage.", "⚠ ¡Apagón! La demanda supera la oferta más el almacenamiento."), "warn"); }
    if (S.hour === 0 || S.day !== prevDay) announceWeather(env); checkAwards(); mentor(); refresh();
    if (S.day > S.startDay - 1 + S.scenario.targetDurationDays && !S.debriefed) debrief();
  }
  function announceWeather(env) {
    if (S.weatherId === env.weatherId + S.day) return; S.weatherId = env.weatherId + S.day;
    if (S.day === S.startDay) return; flash(`${env.weatherIcon} ${L("Day", "Día")} ${S.day}: ${env.weatherName} — ${env.weatherSummary}`, env.stormWarning ? "warn" : "info");
  }
  function openForecast() {
    const dlg = openDialog(root, { title: L("Pacifica Bay Weather Pattern", "Patrón del clima de Pacifica Bay"), sub: L("Real coastal weather changes every day in natural cycles", "El clima costero real cambia cada día en ciclos naturales") });
    const fc = getUpcomingForecast(S.day, 4);
    dlg.body.innerHTML = `<p class="oc-box oc-box--info">${L("Weather is not fixed. Storm fronts bring high waves and wind but block the sun. Calmer days have lots of sunlight but low wind. <b>Tides and deep ocean heat (OTEC) never stop!</b> A great grid balances all three. The pattern repeats every 10 days.", "El clima no es fijo. Los frentes de tormenta traen olas y viento fuertes pero tapan el sol. Los días tranquilos tienen mucho sol pero poco viento. <b>¡Las mareas y el calor del océano profundo (OTEC) nunca paran!</b> Una gran red equilibra las tres cosas. El patrón se repite cada 10 días.")}</p>
      <div class="oc-grid2">${fc.map((w, i) => `<div class="oc-tile oc-fc${i === 0 ? " is-today" : ""}"><span class="oc-k">${i === 0 ? `${L("Day", "Día")} ${w.day} (${L("Today", "Hoy")})` : `${L("Day", "Día")} ${w.day}`}</span><b>${w.icon} ${w.name}</b><small>${w.studentSummary}</small><small class="oc-fc__m">💨 ${w.windSpeedKts} kts · 🌊 ${w.waveHeightM} m · 🌙 ×${w.tidalMultiplier} · ☀️ ${Math.round(w.solarEfficiency * 100)}%</small></div>`).join("")}</div>
      <p class="oc-muted">${L("Each card shows the day's base wind, wave height, tidal strength and sunshine. Advances automatically each 24-hour day.", "Cada tarjeta muestra el viento base, la altura de ola, la fuerza de la marea y el sol del día. Avanza automáticamente cada día de 24 horas.")}</p>`;
    award("forecast", L("Weather watcher", "Observador del clima"));
  }
  function showBuilt(dev) {
    const t = techOf(dev.techId), box = $("built"), kw = t.ratedPowerKW >= 1000 ? (t.ratedPowerKW / 1000).toFixed(1) + " MW" : t.ratedPowerKW + " kW";
    box.hidden = false; box.innerHTML = `<div class="oc-built__img">${techVisual(t, photoBase)}<span class="oc-built__ok">✔ ${L("Installed in the bay", "Instalado en la bahía")}</span><b class="oc-built__kw">+${kw}</b></div><div class="oc-built__b"><b>${t.name}</b><p>${t.friendlyStudentSummary}</p><div class="oc-built__g"><span>${L("Location", "Ubicación")}<b>X ${Math.round(dev.xRatio * 100)}% · Z ${Math.round((dev.zRatio ?? 0.5) * 100)}%</b></span><span>${L("Daily upkeep", "Mantenimiento diario")}<b>${usd(t.dailyOpex)}/${L("day", "día")}</b></span></div><button type="button" class="oc-btn oc-btn--go" data-a="builtx">${L("Great!", "¡Genial!")}</button></div>`;
    box.querySelectorAll("img").forEach(i => { i.loading = "eager"; });
    clearTimeout(showBuilt.t); showBuilt.t = setTimeout(() => { box.hidden = true; }, 6000);
  }
  function checkAwards() {
    const cats = new Set(S.devices.map(d => techOf(d.techId).category)); if (cats.size >= 4) award("diverse", L("Diversified fleet", "Flota diversificada"));
    if (S.day >= 3 && S.grid.tariffPerKWh >= 0.12 && S.grid.tariffPerKWh <= 0.17 && S.grid.citizenApproval >= 75) award("fair", L("Fair-price keeper", "Guardián del precio justo"));
    if (S.grid.landSavedAcres >= 25) award("land", L("Land saver", "Salvador de la tierra"));
  }

  /* ---------------- boat (setInterval 50 ms — time based, not frame based) ---------------- */
  const boatStep = () => {
    const B = S.boat; if (!B.active || B.state === "docked") return; const dt = 0.05, sp = 0.07;
    if (B.state === "sailing_to") { const d = B.targetXRatio - B.xRatio; if (Math.abs(d) < 0.015) { B.state = "servicing"; B.timer = 2.7; soundManager.playRepairSound(); refresh(); } else B.xRatio += Math.sign(d) * Math.min(sp * dt, Math.abs(d)); }
    else if (B.state === "servicing") { B.timer -= dt; if (B.timer <= 0) {
      S.devices = S.devices.map(d => d.instanceId !== B.targetDeviceId ? d : { ...d, biofouling: B.serviceType === "scrub" ? 0 : Math.max(0, d.biofouling - 40), integrity: B.serviceType === "overhaul" ? 100 : Math.min(100, d.integrity + 20), lastMaintainedDay: S.day });
      B.state = "returning"; soundManager.playVictoryFanfare(); flash(L("✔ Service complete — the tradies head home.", "✔ Servicio terminado — los técnicos vuelven a casa."), "info"); award("svc", L("Maintenance crew chief", "Jefe de cuadrilla de mantenimiento")); previewOutputs(); refresh(); } }
    else if (B.state === "returning") { const d = DOCK - B.xRatio; if (Math.abs(d) < 0.015) { B.state = "docked"; B.active = false; B.xRatio = DOCK; soundManager.stopBoatLoop(); refresh(); } else B.xRatio += Math.sign(d) * Math.min(sp * dt, Math.abs(d)); }
  };
  /* air-drop helicopter: flies from the heliport tower, winches a floaty down, repairs, flies home (setInterval, never rAF) */
  function heliStep() {
    const H = S.heli; if (!H.active || H.state === "landed") return; const dt = 0.05;
    if (H.state === "flying_to") { const dx = H.tx - H.x, dz = H.tz - H.z, dist = Math.hypot(dx, dz); if (dist < 10) { H.state = "dropping"; H.timer = 3.2; H.cable = 0; soundManager.playRepairSound(); refresh(); } else { const st = Math.min(HELI_SPEED * dt, dist); H.x += (dx / dist) * st; H.z += (dz / dist) * st; } }
    else if (H.state === "dropping") { H.cable = Math.min(1, H.cable + 1.5 * dt); H.timer -= dt; if (H.timer <= 0) {
      S.devices = S.devices.map(d => d.instanceId !== H.targetDeviceId ? d : { ...d, biofouling: 0, integrity: 100, lastMaintainedDay: S.day });
      H.state = "returning"; soundManager.playVictoryFanfare(); flash(L("✔ Air-drop repair complete — the helicopter heads back to the heliport.", "✔ Reparación aérea completada — el helicóptero vuelve al helipuerto."), "info"); award("heli", L("Air-drop rescuer", "Rescate aéreo")); previewOutputs(); refresh(); } }
    else if (H.state === "returning") { if (H.cable > 0) H.cable = Math.max(0, H.cable - 1.8 * dt); const dx = HELI_PAD.x - H.x, dz = HELI_PAD.z - H.z, dist = Math.hypot(dx, dz);
      if (dist < 6 && H.cable <= 0.05) { H.active = false; H.state = "landed"; H.x = HELI_PAD.x; H.z = HELI_PAD.z; H.cable = 0; soundManager.stopHelicopterLoop(); refresh(); } else if (dist >= 6) { const st = Math.min(HELI_SPEED * dt, dist); H.x += (dx / dist) * st; H.z += (dz / dist) * st; } }
  }
  const boatTimer = setInterval(() => { boatStep(); heliStep(); }, 50);
  const QUOTES = [L("Ha ha ha! Ahoy mate! Electrician tradies to the rescue! ⚡🏴‍☠️", "¡Ja ja ja! ¡Ahoy, amigo! ¡Los electricistas al rescate! ⚡🏴‍☠️"), L("Hold on to your toolbelts, lads! Full tradie throttle! 🚤", "¡Agarrad los cinturones de herramientas! ¡A toda máquina! 🚤"), L("Who ordered the ocean plumbers? Pipe wrench ready! 🪠", "¿Quién pidió los fontaneros del océano? ¡Llave lista! 🪠"), L("Avast ye barnacles! Tradies incoming! 🦀", "¡Alerta, percebes! ¡Llegan los técnicos! 🦀")];
  let lastQuote = "";
  function heliScreen(x, y, visible) {
    const b = $("hbubble"), H = S.heli; b.hidden = !(visible && H.active); if (!visible || !H.active) return; b.style.left = x + "px"; b.style.top = y - 16 + "px";
    const q = H.state === "dropping" ? L("🛟 Floaty Dropped & Scrubbing! 🧼", "🛟 ¡Salvavidas bajado y limpiando! 🧼") : H.state === "returning" ? L("Returning to Helipad ⚓", "Volviendo al helipuerto ⚓") : L("Emergency Airlift En Route ⚡", "Rescate aéreo en camino ⚡");
    if ($("hquote").textContent !== q) $("hquote").textContent = q;
  }
  function boatScreen(x, y, visible, t) {
    const b = $("bubble"), B = S.boat; b.hidden = !(visible && B.active); if (!visible || !B.active) return; b.style.left = x + "px"; b.style.top = y - 12 + "px";
    const q = B.state === "servicing" ? L("Scrubbing Barnacles 🧼", "Limpiando percebes 🧼") : B.state === "returning" ? L("Heading to Port ⚓", "Rumbo a puerto ⚓") : L("En Route ⚡", "En camino ⚡");
    if (q !== lastQuote) { lastQuote = q; $("quote").textContent = q; }
  }

  /* ---------------- actions ---------------- */
  function dispatch(id, type) {
    const cost = type === "scrub" ? 3500 : 12000, target = S.devices.find(d => d.instanceId === id); if (!target) return false;
    if (S.boat.active) { flash(L("The workboat is already out on a job.", "El barco ya está en un trabajo."), "warn"); return false; }
    if (S.heli.active) { flash(L("The helicopter is already out on a job.", "El helicóptero ya está en un trabajo."), "warn"); return false; }
    if (S.grid.funds < cost) { soundManager.playWarningAlert(); mentorSay("budget-boat", "warn", L("City Treasury Budget Alert", "Alerta de presupuesto de la ciudad"), L(`The treasury cannot afford the ${usd(cost)} maintenance crew dispatch. Increase the tariff or let energy revenue build up first.`, `La tesorería no puede pagar los ${usd(cost)} del envío de la cuadrilla. Sube la tarifa o deja que los ingresos se acumulen primero.`), 0, true); return false; }
    S.grid = { ...S.grid, funds: S.grid.funds - cost }; S.boat = { active: true, xRatio: DOCK, targetXRatio: target.xRatio, targetDeviceId: id, state: "sailing_to", serviceType: type, cost, timer: 0 };
    soundManager.startBoatLoop(); flash(L(`Workboat dispatched (${usd(cost)}).`, `Barco enviado (${usd(cost)}).`), "info"); if (sceneApi) { sceneApi.setTracking(true); tracked = "boat"; root.querySelector(".oc-track").classList.add("is-on"); } refresh(); return true;
  }
  function dispatchHeli(id) {
    if (S.heli.active) return false; if (S.boat.active) { flash(L("The workboat is already out on a job.", "El barco ya está en un trabajo."), "warn"); return false; } if (!S.devices.length) return false;
    if (S.grid.funds < HELI_COST) { soundManager.playWarningAlert(); mentorSay("budget-heli", "warn", L("Helicopter Budget Alert", "Alerta de presupuesto del helicóptero"), L(`The treasury cannot afford the ${usd(HELI_COST)} air-drop helicopter. Adjust the tariff or wait for revenue to build reserves.`, `La tesorería no puede pagar los ${usd(HELI_COST)} del helicóptero. Ajusta la tarifa o espera a que los ingresos acumulen reservas.`), 0, true); return false; }
    const target = (id && S.devices.find(d => d.instanceId === id)) || [...S.devices].sort((a, b) => b.biofouling - a.biofouling)[0]; if (!target) return false;
    S.grid = { ...S.grid, funds: S.grid.funds - HELI_COST };
    S.heli = { active: true, state: "flying_to", x: HELI_PAD.x, z: HELI_PAD.z, tx: xToWorld(target.xRatio), tz: -200 + (target.zRatio ?? 0.5) * 400, targetDeviceId: target.instanceId, cable: 0, timer: 0 };
    soundManager.startHelicopterLoop(); flash(L(`Air-drop helicopter dispatched (${usd(HELI_COST)}).`, `Helicóptero enviado (${usd(HELI_COST)}).`), "info");
    if (sceneApi) { sceneApi.setTracking("heli"); tracked = "heli"; root.querySelector(".oc-track").classList.add("is-on"); } refresh(); return true;
  }
  function quickDispatch() { const worst = [...S.devices].sort((a, b) => b.biofouling - a.biofouling)[0]; if (worst) dispatch(worst.instanceId, "scrub"); }
  const ctx = {
    photoBase, funds: () => S.grid.funds, unlocked: () => S.unlocked, tariff: () => S.grid.tariffPerKWh, device: id => S.devices.find(d => d.instanceId === id), toast: notify, confetti: () => confetti(root), award,
    selectToPlace(id) { beginPlace(id); }, dispatchHeli: id => dispatchHeli(id), heliCost: HELI_COST, unlock(id, c) { S.grid = { ...S.grid, funds: S.grid.funds - c }; S.unlocked = [...S.unlocked, id]; refresh(); award("rnd", L("R&D pioneer", "Pionero de I+D")); },
    dispatch, decommission(id) { const d = S.devices.find(x => x.instanceId === id); if (!d) return; S.grid = { ...S.grid, funds: S.grid.funds + Math.round(techOf(d.techId).capex * 0.4) }; S.devices = S.devices.filter(x => x.instanceId !== id); S.selectedId = null; previewOutputs(); refresh(); },
    deselect() { S.selectedId = null; S.openDevice = null; }, status: () => ({ scenarioId: S.scenario.id, grid: S.grid, devices: S.devices, day: S.day }),
    startScenario(id) { loadScenario(scenarios().find(s => s.id === id)); S.paused = false; refresh(); }, noteCompare() { award("compare", L("Land vs Ocean analyst", "Analista tierra vs océano")); },
  };
  function beginPlace(id) {
    S.pendingTech = id; const t = techOf(id), z = t.depthZone[0], r = ZONES[z].range; S.pendingX = (r[0] + r[1]) / 2; S.pendingZ = 0.5; const box = $("target"); box.hidden = false;
    box.innerHTML = `<div class="oc-target__t">✨ <b>${L("Targeting Mode", "Modo de colocación")}:</b> ${L("click the ocean to construct", "haz clic en el océano para construir")} <b>${t.name}</b> <small>(${t.depthZone.map(z => ZONES[z].name() + " " + ZONES[z].depth).join(" · ")})</small></div>
      <div class="oc-target__c"><label>${L("or choose the position (keyboard-friendly)", "o elige la posición (apto para teclado)")}: <small>${L("shore", "costa")}</small> <input type="range" min="0.12" max="0.94" step="0.01" value="${S.pendingX}" data-k="px"> <small>${L("deep", "profundo")}</small></label><label>${L("across the bay", "a lo ancho de la bahía")}: <small>${L("left", "izq.")}</small> <input type="range" min="0.06" max="0.94" step="0.01" value="0.5" data-k="pz" aria-label="${L("Position across the bay", "Posición a lo ancho de la bahía")}"> <small>${L("right", "der.")}</small></label><span class="oc-pill" data-k="pv"></span><button type="button" class="oc-btn oc-btn--go" data-a="place">${L("Place here", "Colocar aquí")}</button><button type="button" class="oc-btn oc-btn--ghost" data-a="cancel">${L("Cancel", "Cancelar")}</button></div>`;
    const upd = () => { const ok = isEligible(id, S.pendingX), z = ZONES[zoneAt(S.pendingX)]; const p = box.querySelector("[data-k=pv]"); p.className = "oc-pill " + (ok ? "ok" : "bad"); p.textContent = `${ok ? "✔" : "✖"} ${z.name()}${ok ? "" : " — " + L("not suitable", "no apto")}`; };
    const px = box.querySelector("[data-k=px]"); px.addEventListener("input", e => { S.pendingX = +e.target.value; upd(); soundManager.playClick(); }); S.updTarget = () => { px.value = S.pendingX; pz.value = S.pendingZ; upd(); }; const pz = box.querySelector("[data-k=pz]"); pz.addEventListener("input", e => { S.pendingZ = +e.target.value; soundManager.playClick(); }); upd();
    box.querySelector("[data-a=place]").addEventListener("click", () => tryPlace(id, S.pendingX, S.pendingZ)); box.querySelector("[data-a=cancel]").addEventListener("click", cancelPlace);
    flash(L("Targeting mode: pick a spot in the right depth zone.", "Modo de colocación: elige un punto en la zona de profundidad correcta."), "info");
  }
  function hideTarget() { S.pendingTech = null; S.pendingX = null; const b = $("target"); b.hidden = true; b.innerHTML = ""; }
  function cancelPlace() { hideTarget(); soundManager.playClick(); }
  function tryPlace(id, xr, zr = 0.5) {
    const t = techOf(id);
    if (!isEligible(id, xr)) { soundManager.playWarningAlert(); flash(L(`${t.name} can only be built in: ${t.depthZone.map(z => ZONES[z].name()).join(" / ")}.`, `${t.name} solo se puede construir en: ${t.depthZone.map(z => ZONES[z].name()).join(" / ")}.`), "warn"); return; }
    if (S.grid.funds < t.capex) { soundManager.playWarningAlert(); flash(L(`Budget Warning: ${t.name} costs ${usd(t.capex)}. Your treasury has ${usd(S.grid.funds)}.`, `Aviso de presupuesto: ${t.name} cuesta ${usd(t.capex)}. Tu tesorería tiene ${usd(S.grid.funds)}.`), "warn"); return; }
    S.grid = { ...S.grid, funds: S.grid.funds - t.capex }; const nd = makeDevice(id, xr, S.day, 0, zr); S.devices = [...S.devices, nd]; hideTarget(); soundManager.playPlaceSound(); previewOutputs(); refresh(); showBuilt(nd); if (S.celebrated !== nd.instanceId) { S.celebrated = nd.instanceId; confetti(root); setTimeout(() => confetti(root), 500); setTimeout(() => confetti(root), 1000); }
    flash(L(`Built ${t.name} for ${usd(t.capex)}.`, `Construido: ${t.name} por ${usd(t.capex)}.`), "info"); award("builder", L("Offshore builder", "Constructor marino"));
  }
  function selectDevice(id) {
    S.selectedId = id; if (!id) { return; } soundManager.playClick();
    S.openDevice = openDeviceDialog(root, { ...ctx, deselect() { S.selectedId = null; S.openDevice = null; } }, id);
  }
  function logSnapshot(kind = "snapshot", extraCond = "") {
    const g = S.grid, e = S.env, hh = String(Math.floor(S.hour)).padStart(2, "0"), mm = String(Math.floor((S.hour % 1) * 60)).padStart(2, "0");
    const label = e.weatherName;
    const by = { wind: 0, wave: 0, tidal: 0, base: 0, solar: 0 }; S.devices.forEach(d => { const c = techOf(d.techId).category; if (c === "wind") by.wind += d.currentOutputKW; else if (c === "wave") by.wave += d.currentOutputKW; else if (c === "tidal" && d.techId !== "tidal_kite") by.tidal += d.currentOutputKW; else if (c === "baseload" || d.techId === "tidal_kite") by.base += d.currentOutputKW; else if (c === "solar") by.solar += d.currentOutputKW; });
    const gen = Object.values(by).reduce((a, b) => a + b, 0), m = v => (v / 1000).toFixed(1);
    const cond = (kind === "mission" ? extraCond : `${label} · ${L("Day", "Día")} ${S.day} ${hh}:${mm}`);
    const row = { cond, wind: +e.windSpeedKts.toFixed(1), hs: +e.significantWaveHeightM.toFixed(2), flux: +e.waveEnergyFluxKWM.toFixed(1), tide: +e.tidalCurrentSpeedKts.toFixed(1), gen: +(gen / 1000).toFixed(2), demand: +(g.currentDemandKW / 1000).toFixed(2),
      mix: `${L("wind", "eólica")} ${m(by.wind)} · ${L("wave", "olas")} ${m(by.wave)} · ${L("tidal", "marea")} ${m(by.tidal)} · ${L("base", "base")} ${m(by.base)} · ${L("solar", "solar")} ${m(by.solar)}`,
      tariff: +g.tariffPerKWh.toFixed(3), funds: Math.round(g.funds), approval: +g.citizenApproval.toFixed(1), blackout: +g.blackoutHours.toFixed(1) };
    recordTrial(row); if (kind === "snapshot") { S.snaps.push({ cond: e.weatherId }); soundManager.playPlaceSound(); flash(L(`Snapshot ${S.snaps.length} logged: ${label}, ${m(gen)} MW generated vs ${m(g.currentDemandKW)} MW demand.`, `Instantánea ${S.snaps.length} registrada: ${label}, ${m(gen)} MW generados vs ${m(g.currentDemandKW)} MW de demanda.`), "info");
      if (S.snaps.length === 1) award("first", L("First snapshot logged", "Primera instantánea registrada")); if (new Set(S.snaps.map(s => s.cond)).size >= 3) award("tester", L("Weather tester", "Probador de clima")); }
    refresh(); return row;
  }

  /* ---------------- mission debrief ---------------- */
  function debrief() {
    S.debriefed = true; S.paused = true; refresh();
    const sc = S.scenario, g = S.grid, res = sc.objectives.map(o => ({ text: o.text, ok: !!o.completed(g, S.devices, S.day) })), met = res.filter(r => r.ok).length;
    const dlg = openDialog(root, { title: L("Mission complete", "Misión completada") + ": " + sc.title, sub: `${met}/${res.length} ${L("directives achieved", "directrices logradas")}`, wide: true });
    dlg.body.innerHTML = `<div class="oc-box">${res.map(r => `<div class="oc-obj${r.ok ? " is-done" : ""}">${r.ok ? "✅" : "⭕"} <span>${r.text}</span></div>`).join("")}</div>
      <div class="oc-grid3"><div class="oc-tile"><span class="oc-k">${L("Treasury", "Tesorería")}</span><b class="oc-big gn">${usd(g.funds)}</b></div><div class="oc-tile"><span class="oc-k">${L("Citizen happiness", "Felicidad ciudadana")}</span><b class="oc-big">${g.citizenApproval.toFixed(1)}%</b></div><div class="oc-tile"><span class="oc-k">${L("Blackout hours", "Horas de apagón")}</span><b class="oc-big">${g.blackoutHours.toFixed(1)} h</b></div><div class="oc-tile"><span class="oc-k">${L("Energy generated", "Energía generada")}</span><b class="oc-big cy">${fmt(g.totalKWhGenerated)} kWh</b></div><div class="oc-tile"><span class="oc-k">${L("Land spared", "Tierra salvada")}</span><b class="oc-big gn">${g.landSavedAcres.toFixed(1)} ${L("acres", "acres")}</b></div><div class="oc-tile"><span class="oc-k">CO₂ ${L("prevented", "evitado")}</span><b class="oc-big gn">${fmt(g.co2PreventedTons, 1)} t</b></div></div>
      <p class="oc-box oc-box--info"><b>${L("Marine Science Focus", "Enfoque de ciencias marinas")}:</b> ${sc.learningPrompt}</p>
      <div class="oc-endbtn"><button type="button" class="oc-btn oc-btn--go" data-a="save">💾 ${L("Save mission result to my Investigation Record", "Guardar el resultado de la misión en mi Registro de investigación")}</button><button type="button" class="oc-btn oc-btn--soft" data-a="sand">${L("Keep playing (sandbox)", "Seguir jugando (modo libre)")}</button></div>`;
    if (met === res.length) { soundManager.playVictoryFanfare(); confetti(root); award("mission_" + sc.id, L("Mission accomplished", "Misión cumplida")); } else soundManager.playRepairSound();
    dlg.body.querySelector("[data-a=save]").addEventListener("click", e => { logSnapshot("mission", `${L("MISSION RESULT", "RESULTADO DE MISIÓN")}: ${sc.title.split(":")[0]} · ${met}/${res.length} ${L("directives", "directrices")} · ${L("Day", "Día")} ${S.day - 1}`); setResult("mission_" + sc.id, { objectives_met: met, objectives_total: res.length, funds: g.funds, approval: g.citizenApproval, blackout_hours: g.blackoutHours, kwh_generated: Math.round(g.totalKWhGenerated), land_saved_acres: g.landSavedAcres, co2_prevented_t: g.co2PreventedTons }); e.target.disabled = true; e.target.textContent = "✔ " + L("Saved to your record", "Guardado en tu registro"); });
    dlg.body.querySelector("[data-a=sand]").addEventListener("click", () => { dlg.close(); S.paused = false; refresh(); });
  }

  /* ---------------- wiring ---------------- */
  root.addEventListener("click", e => {
    const a = e.target.closest("[data-a]"); if (a && a.getAttribute("aria-disabled") !== "true") {
      const k = a.dataset.a;
      if (k === "pause") { S.paused = !S.paused; soundManager.playClick(); refresh(); }
      else if (k === "build") { soundManager.playClick(); openBuildDrawer(root, ctx); }
      else if (k === "fullscreen") { soundManager.playClick(); if (document.fullscreenElement) document.exitFullscreen(); else if (root.requestFullscreen) root.requestFullscreen().catch(() => root.classList.toggle("oc--full")); else root.classList.toggle("oc--full"); }
      else if (k === "forecast") { soundManager.playClick(); openForecast(); }
      else if (k === "builtx") { $("built").hidden = true; }
      else if (k === "clean") { const on = !root.classList.contains("oc--clean"); root.classList.toggle("oc--clean", on); root.querySelector(".oc-showopts").hidden = !on; soundManager.playClick(); }
      else if (k === "hidetop") setMenus("top", false);
      else if (k === "showtop") setMenus("top", true);
      else if (k === "hidebottom") setMenus("bottom", false);
      else if (k === "showbottom") setMenus("bottom", true);
      else if (k === "expand") { const both = root.classList.contains("oc--notop") && root.classList.contains("oc--nobottom"); setMenus("top", both); setMenus("bottom", both); }
      else if (k === "tutorial") { soundManager.playClick(); openTutorial(); }
      else if (k === "howto") { soundManager.playClick(); intro(); }
      else if (k === "guide") { soundManager.playClick(); openCodex(root, ctx); }
      else if (k === "missions") { soundManager.playClick(); openMissions(root, ctx); }
      else if (k === "compare") { soundManager.playClick(); openComparison(root, ctx); }
      else if (k === "reset") { if (window.confirm(L("Reset this mission to its starting position?", "¿Reiniciar esta misión a su posición inicial?"))) { loadScenario(S.scenario); soundManager.playClick(); } }
      else if (k === "snap") logSnapshot();
      else if (k === "thermo") { S.showThermocline = !S.showThermocline; a.setAttribute("aria-pressed", String(S.showThermocline)); a.classList.toggle("is-on", S.showThermocline); soundManager.playClick(); if (S.showThermocline) award("thermo", L("Thermocline explorer", "Explorador de la termoclina")); }
      else if (k === "reefs") { S.showReefs = !S.showReefs; a.setAttribute("aria-pressed", String(S.showReefs)); a.classList.toggle("is-on", S.showReefs); soundManager.playClick(); }
      else if (k === "mute") { soundManager.toggleMute(); soundManager.playClick(); refresh(); }
      else if (k === "track") { tracked = tracked ? false : (S.heli.active ? "heli" : "boat"); sceneApi && sceneApi.setTracking(tracked); a.classList.toggle("is-on", !!tracked); soundManager.playClick(); }
    }
    const c = e.target.closest("[data-cam]"); if (c && sceneApi) { sceneApi.preset(c.dataset.cam); tracked = false; root.querySelector(".oc-track").classList.remove("is-on"); $$("[data-cam]").forEach(b => b.classList.toggle("is-on", b === c && b.textContent.trim() !== "⟲")); soundManager.playClick(); }
    const sp = e.target.closest("[data-sp]"); if (sp) { S.speed = +sp.dataset.sp; $$("[data-sp]").forEach(b => b.classList.toggle("is-on", b === sp)); startTick(); soundManager.playClick(); }
  });
  $("tariff").addEventListener("input", e => { S.grid = { ...S.grid, tariffPerKWh: Number(Number(e.target.value).toFixed(3)) }; soundManager.playClick(); refresh(); });
  function setMenus(which, show) {
    root.classList.toggle(which === "top" ? "oc--notop" : "oc--nobottom", !show);
    root.querySelector(which === "top" ? ".oc-restore--top" : ".oc-restore--bottom").hidden = show; soundManager.playClick();
    setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
  }
  let tracked = false, sceneApi = null, destroyed = false;
  document.addEventListener("fullscreenchange", () => { const on = document.fullscreenElement === root; root.classList.toggle("oc--fs", on); const b = $("fs"); if (b) { b.setAttribute("aria-pressed", String(on)); b.innerHTML = on ? `✕ ${L("Exit full screen", "Salir de pantalla completa")}` : `⛶ ${L("Full screen", "Pantalla completa")}`; } setTimeout(() => window.dispatchEvent(new Event("resize")), 60); });
  root.addEventListener("keydown", e => { if ((e.key === "p" || e.key === "P") && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { S.paused = !S.paused; refresh(); } });

  loadScenario(S.scenario); S.paused = true; refresh();
  createScene($("scene"), {
    state: () => S, reduced: () => { const a = document.documentElement.getAttribute("data-reduced-motion"); return a === "on" || (a !== "off" && !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)); }, label: L("Pacifica Bay 3D ocean. Use the Build button, then the position slider, to build with the keyboard.", "Océano 3D de Pacifica Bay. Usa el botón Construir y luego el control de posición para construir con el teclado."), fallbackNote: L("2D view (WebGL unavailable)", "Vista 2D (WebGL no disponible)"),
    onSelect: id => { if (id) selectDevice(id); else S.selectedId = null; }, onPlace: (tid, xr, zw) => tryPlace(tid, xr, Math.max(0.06, Math.min(0.94, ((zw || 0) + 200) / 400))), onHoverX: (xr, zr) => { if (S.pendingTech) { S.pendingX = xr; if (zr !== undefined) S.pendingZ = zr; S.updTarget && S.updTarget(); } }, onBoatScreen: boatScreen, onHeliScreen: heliScreen, onBoatClick: () => { if (!S.boat.active && !S.heli.active) quickDispatch(); }, onHeliClick: () => { if (!S.heli.active) dispatchHeli(); soundManager.playClick(); }, onUserCamera: () => { if (tracked) { tracked = false; const t = root.querySelector(".oc-track"); t && t.classList.remove("is-on"); } },
  }, threeUrl).then(api => { if (destroyed) { api.destroy(); return; } sceneApi = api; $("scene").dataset.kind = api.kind; });

  /* ---------------- mentor alerts (toast + history + chimes) ---------------- */
  const mentorLog = [], mentorSeen = {};
  let lastDismiss = 0;
  function mentorSay(id, kind, title, body, cool = 30000, force = false) {
    const box = $("mentor"), nowMs = Date.now();
    if (!force) { if (box.children.length) return; if (nowMs - lastDismiss < 10000) return; if (mentorSeen[id] !== undefined && nowMs - mentorSeen[id] < cool) return; }   // never interrupt a visible alert; 10 s of peace between pop-ups
    mentorSeen[id] = nowMs;
    mentorLog.unshift({ kind, title, body, day: S.day }); if (mentorLog.length > 12) mentorLog.pop();
    kind === "good" ? soundManager.playPraiseChime() : soundManager.playAlertChime();
    const t = document.createElement("div"); t.className = "oc-mentor__t is-" + kind; t.setAttribute("role", "status");
    t.innerHTML = `<button type="button" aria-label="${L("Dismiss early", "Cerrar")}">✕</button><b>${kind === "good" ? "🌟" : "🧭"} ${title}</b><span class="oc-mentor__ctx">${L("Context", "Contexto")}:</span> ${body}`; if (force) box.innerHTML = ""; box.append(t);
    const rm = () => { if (t.isConnected) { t.remove(); lastDismiss = Date.now(); } }; t.querySelector("button").addEventListener("click", rm); setTimeout(rm, 5000);
  }
  function mentor() {
    const g = S.grid; if (S.day < 2 && S.hour < 12) return;
    if (g.funds < 30000) mentorSay("funds", "warn", L("Treasury running low", "Tesorería baja"), L("Raise the price a little or build only what you can afford; you still need money for maintenance.", "Sube un poco el precio o construye solo lo que puedas pagar; aún necesitas dinero para mantenimiento."));
    if (g.isBlackout) mentorSay("blk", "warn", L("Blackout!", "¡Apagón!"), L("Demand beat supply plus storage. Add baseload (OTEC, osmotic, kites) or storage for calm, dark hours.", "La demanda superó la oferta más el almacenamiento. Añade base constante (OTEC, osmótica, cometas) o almacenamiento para las horas calmas y oscuras."));
    if (g.maxStorageCapacityKWh > 0 && g.storedEnergyKWh / g.maxStorageCapacityKWh < 0.1 && S.devices.length) mentorSay("store", "warn", L("Storage nearly empty", "Almacenamiento casi vacío"), L("Batteries only help if they were charged by a surplus first.", "Las baterías solo ayudan si antes se cargaron con un excedente."));
    const worst = [...S.devices].sort((a, b) => b.biofouling - a.biofouling)[0];
    if (worst && worst.biofouling > 50) mentorSay("foul", "warn", L("Biofouling building up", "Bioincrustación creciente"), L("Barnacles cut output by up to 30%. Send the workboat or the helicopter to clean them.", "Los percebes reducen la producción hasta un 30%. Envía el barco o el helicóptero a limpiarlos."));
    if (S.devices.some(d => d.integrity < 30)) mentorSay("int", "warn", L("A generator is failing", "Un generador falla"), L("Integrity is under 30%. Order an overhaul before it breaks.", "La integridad es menor del 30%. Pide una revisión antes de que se averíe."));
    if (g.tariffPerKWh > 0.22) mentorSay("price", "warn", L("Prices are too high", "Precios demasiado altos"), L("Families are struggling to pay. Approval will fall fast above $0.22.", "Las familias tienen problemas para pagar. La aprobación cae rápido sobre $0,22."));
    if (g.citizenApproval < 45) mentorSay("appr", "warn", L("Citizens are unhappy", "Ciudadanos descontentos"), L("Check for blackouts and high bills.", "Revisa los apagones y las facturas altas."));
    if (S.devices.length >= 1 && mentorSeen.first === undefined) mentorSay("first", "good", L("Nice start", "Buen comienzo"), L("Your first generator is online. Open the weather forecast and watch what changes from day to day.", "Tu primer generador está en marcha. Abre el pronóstico y mira qué cambia de un día a otro."), 1e12);
    if (S.day >= 3 && g.citizenApproval >= 75 && g.tariffPerKWh >= 0.12 && g.tariffPerKWh <= 0.17) mentorSay("fair", "good", L("Fair price, happy city", "Precio justo, ciudad feliz"), L("Approval is above 75% at a fair price. Log a snapshot as evidence.", "La aprobación supera el 75% con un precio justo. Registra una instantánea como evidencia."), 120000);
  }
  function openMentorHistory() {
    const dlg = openDialog(root, { title: L("Mentor alert history", "Historial de alertas del mentor") });
    dlg.body.innerHTML = mentorLog.length ? mentorLog.map(m => `<div class="oc-obj"><span>${m.kind === "good" ? "🌟" : "🧭"} <b>${m.title}</b> (${L("Day", "Día")} ${m.day}) ${m.body}</span></div>`).join("") : `<p class="oc-muted">${L("No alerts yet.", "Aún no hay alertas.")}</p>`;
  }

  /* ---------------- Challenge Guide (4 tabs) ---------------- */
  function intro() {
    const tabs = [
      [L("Mission", "Misión"), `<p class="oc-box oc-box--info">${S.scenario.description}</p><p>${L("You run the ocean energy grid for Pacifica Bay (28,000 residents). Build offshore generators in the right depth zone, keep them clean and sound, and charge a fair price so the lights stay on, the treasury stays positive and citizens stay happy.", "Diriges la red de energía oceánica de Pacifica Bay (28.000 habitantes). Construye generadores marinos en la zona de profundidad correcta, mantenlos limpios y sanos, y cobra un precio justo para que no falte luz, la tesorería siga en positivo y los ciudadanos estén contentos.")}</p>`],
      [L("Controls", "Controles"), `<ol class="oc-list oc-list--n"><li>${L("<b>Explore in 3D:</b> drag to orbit, right-click to pan, scroll to zoom, and click any generator to inspect it.", "<b>Explora en 3D:</b> arrastra para orbitar, clic derecho para mover, rueda para acercar y haz clic en un generador para inspeccionarlo.")}</li><li>${L("<b>Build:</b> press Build Ocean Generators, pick a technology, then click the ocean (or use the position slider).", "<b>Construir:</b> pulsa Construir generadores, elige una tecnología y haz clic en el océano (o usa el control de posición).")}</li><li>${L("<b>Pause, speed and price</b> are in the control bar; the ❓ buttons explain every number.", "<b>Pausa, velocidad y precio</b> están en la barra de control; los botones ❓ explican cada número.")}</li></ol>`],
      [L("Fair test", "Prueba justa"), `<ol class="oc-list oc-list--n"><li>${L("Build a Floating Solar Island first, so you can see what a cloudy day or a storm does to it.", "Construye primero una isla solar flotante para ver qué le hace un día nublado o una tormenta.")}</li><li>${L("The weather changes by itself every day (a 10-day cycle). Speed time up, and compare each technology's megawatts on different weather days at the SAME hour of the day.", "El clima cambia solo cada día (ciclo de 10 días). Acelera el tiempo y compara los megavatios de cada tecnología en distintos días de clima a la MISMA hora del día.")}</li><li>${L("<b>Log snapshots</b> of the conditions, each technology's output, demand, price, treasury and approval. They become your evidence (at least 3 snapshots on 2 different weather days).", "<b>Registra instantáneas</b> de las condiciones, la producción de cada tecnología, la demanda, el precio, la tesorería y la aprobación. Serán tu evidencia (al menos 3 instantáneas en 2 días de clima distintos).")}</li></ol>`],
      [L("Pro tips", "Consejos"), `<ul class="oc-list"><li>${L("A mix of wind, wave, tidal and OTEC gives 24/7 power without weather blackouts.", "Una mezcla de eólica, olas, mareas y OTEC da energía 24/7 sin apagones por el clima.")}</li><li>${L("Aim for $0.14–$0.16/kWh and approval above 75%.", "Apunta a $0,14–$0,16/kWh y a más del 75% de aprobación.")}</li><li>${L("Scrub barnacles before they cost you output; overhaul before integrity drops under 30%.", "Limpia los percebes antes de que cuesten producción; haz una revisión antes de que la integridad baje del 30%.")}</li><li>${L("Open Missions for directives and the Field Guide for the formulas.", "Abre Misiones para ver las directrices y la Guía de campo para las fórmulas.")}</li></ul>`],
    ];
    const dlg = openDialog(root, { title: L("Challenge Guide", "Guía del reto") + ": " + L("Welcome to Pacifica Bay", "Bienvenido a Pacifica Bay"), sub: S.scenario.title, wide: true });
    let cur = 0;
    const paint = () => {
      dlg.body.innerHTML = `<div class="oc-tabbar" role="tablist">${tabs.map((t, i) => `<button type="button" role="tab" aria-selected="${i === cur}" data-t="${i}" class="${i === cur ? "is-on" : ""}">${t[0]}</button>`).join("")}</div>${tabs[cur][1]}<div class="oc-endbtn"><button type="button" class="oc-btn oc-btn--soft" data-a="hist">${L("Mentor alert history", "Historial del mentor")}</button><button type="button" class="oc-btn oc-btn--go" data-a="go">▶ ${cur < tabs.length - 1 ? L("Next", "Siguiente") : L("Start the simulation", "Iniciar la simulación")}</button></div>`;
      dlg.body.querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => { cur = +b.dataset.t; paint(); }));
      dlg.body.querySelector("[data-a=hist]").addEventListener("click", openMentorHistory);
      dlg.body.querySelector("[data-a=go]").addEventListener("click", () => { soundManager.playClick(); if (cur < tabs.length - 1) { cur++; paint(); } else { dlg.close(); S.paused = false; refresh(); } });
    };
    paint();
  }

  /* ---------------- 5-step tutorial ---------------- */
  function openTutorial() {
    const steps = [
      [L("1 · Read the dashboard", "1 · Lee el panel"), L("Treasury, price and approval sit at the top. Hover or tap any ❓ to learn what a number means.", "Tesorería, precio y aprobación están arriba. Pasa el ratón o toca un ❓ para saber qué significa cada número."), null],
      [L("2 · Build a generator", "2 · Construye un generador"), L("Open the catalog and choose a technology for the right depth zone.", "Abre el catálogo y elige una tecnología para la zona de profundidad correcta."), [L("Open catalog", "Abrir catálogo"), () => openBuildDrawer(root, ctx)]],
      [L("3 · Watch the weather", "3 · Vigila el clima"), L("Open the weather forecast, then compare how each technology reacts on different weather days at the same hour. That is a fair test.", "Abre el pronóstico y compara cómo reacciona cada tecnología en días de clima distintos a la misma hora. Eso es una prueba justa."), [L("Open forecast", "Abrir pronóstico"), () => openForecast()]],
      [L("4 · Keep it maintained", "4 · Mantenimiento"), L("Barnacles cut output. Send the workboat ($3,500) or the air-drop helicopter ($8,000) to restore your facilities.", "Los percebes reducen la producción. Envía el barco ($3.500) o el helicóptero ($8.000) para restaurar tus instalaciones."), [L("Send the workboat", "Enviar el barco"), () => quickDispatch()]],
      [L("5 · Log your evidence", "5 · Registra tu evidencia"), L("Log a snapshot on each weather day you compare. They fill your Investigation Record.", "Registra una instantánea en cada día de clima que compares. Llenan tu Registro de investigación."), [L("Log snapshot", "Registrar instantánea"), () => logSnapshot()]],
    ];
    const dlg = openDialog(root, { title: L("Tutorial (5 steps)", "Tutorial (5 pasos)") });
    let i = 0;
    const paint = () => {
      const st = steps[i];
      dlg.body.innerHTML = `<p class="oc-muted">${L("Step", "Paso")} ${i + 1}/5</p><h4>${st[0]}</h4><p>${st[1]}</p><div class="oc-endbtn">${st[2] ? `<button type="button" class="oc-btn oc-btn--amber" data-a="do">${st[2][0]}</button>` : ""}${i > 0 ? `<button type="button" class="oc-btn oc-btn--ghost" data-a="prev">${L("Back", "Atrás")}</button>` : ""}<button type="button" class="oc-btn oc-btn--go" data-a="nx">${i < 4 ? L("Next", "Siguiente") : L("Finish", "Terminar")}</button></div>`;
      const d = dlg.body.querySelector("[data-a=do]"); d && d.addEventListener("click", () => { dlg.close(); st[2][1](); });
      const pv = dlg.body.querySelector("[data-a=prev]"); pv && pv.addEventListener("click", () => { i--; paint(); });
      dlg.body.querySelector("[data-a=nx]").addEventListener("click", () => { if (i < 4) { i++; paint(); } else dlg.close(); });
    };
    paint();
  }
  intro(); startTick();
  function destroy() { if (destroyed) return; destroyed = true; soundManager.stopAll(); clearInterval(tickTimer); clearInterval(boatTimer); sceneApi && sceneApi.destroy(); }
  return { destroy, state: () => S, select: selectDevice };
}

/* tiny DOM confetti (no library): coloured squares burst from the top of the sim */
export function confetti(root) {
  if (document.documentElement.getAttribute("data-reduced-motion") === "on") return;
  const c = document.createElement("canvas"); c.className = "oc-confetti"; root.append(c); const r = root.getBoundingClientRect(); c.width = r.width; c.height = Math.min(r.height, 700); const x = c.getContext("2d");
  const ps = Array.from({ length: 90 }, () => ({ x: c.width / 2, y: 120, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4, s: 4 + Math.random() * 6, col: ["#38bdf8", "#facc15", "#34d399", "#f472b6", "#a78bfa"][Math.floor(Math.random() * 5)], r: Math.random() * 6 }));
  let t0 = performance.now(); (function f(n) { const dt = (n - t0) / 1000; if (dt > 2.6) { c.remove(); return; } x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += 0.1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.col; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); }); requestAnimationFrame(f); })(t0);
}
