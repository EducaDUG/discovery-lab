/* Grid Commander - the Experiment: HUD, controls, missions, inspector, codex, tour, sound.
   Runs the engine on setInterval (never requestAnimationFrame - CLAUDE.md game-state rule) and drives the 3D scene. */
import { CATALOG, TYPES, MISSIONS, createState, tick, startMission, missionEval, rankOf, RANKS, newFacility, spotCheck, autoSpot, HYDRO_CAP_MWH, BESS_CAP_MWH } from "./grid-engine.js?v=11";
import { createScene, PRESETS } from "./grid-scene.js?v=12";

/* ---------- procedural sound (Web Audio, no files); always-visible mute in the control bar ---------- */
const Sound = (() => { let ctx = null, muted = false; try { muted = localStorage.getItem("gc_muted") === "1"; } catch (e) {}
  const init = () => { if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) try { ctx = new A(); } catch (e) {} } if (ctx && ctx.state === "suspended") ctx.resume(); return ctx; };
  const tone = (f, d, type = "sine", v = 0.08, when = 0, slide = 0) => { if (muted || !init()) return; const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d + 0.05); };
  return { init, isMuted: () => muted, toggle() { muted = !muted; try { localStorage.setItem("gc_muted", muted ? "1" : "0"); } catch (e) {} return muted; },
    click() { tone(520, 0.07, "triangle", 0.05); }, place() { tone(262, 0.18, "triangle", 0.08); tone(392, 0.2, "triangle", 0.07, 0.07); tone(523, 0.3, "triangle", 0.07, 0.14); }, bad() { tone(160, 0.2, "sawtooth", 0.05, 0, -60); },
    alert() { tone(740, 0.12, "square", 0.04); tone(560, 0.18, "square", 0.04, 0.13); }, dispatch() { tone(300, 0.35, "sawtooth", 0.04, 0, 500); }, win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, "triangle", 0.08, i * 0.11)); }, repair() { tone(880, 0.1, "sine", 0.06); tone(1175, 0.2, "sine", 0.06, 0.1); } }; })();

const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

export async function mountGridSim(host, o) {
  const L = o.L, reduced = !!o.reduced, photo = k => `${o.photoBase}${k}.jpg`;
  const S = createState(); window.__gcState = S;
  const nm = t => ({ pumped_hydro: L("Pumped hydro", "Hidroeléctrica de bombeo"), solar_pv: L("Solar farm", "Parque solar"), wind_turbine: L("Wind turbines", "Aerogeneradores"), gas_peaker: L("Gas peaker", "Central de gas"), battery_bess: L("Battery park", "Parque de baterías"), geothermal: L("Geothermal", "Geotérmica") })[t];
  const formName = t => ({ pumped_hydro: L("Gravitational potential (Ep = mgh)", "Potencial gravitatorio (Ep = mgh)"), solar_pv: L("Radiant (photons)", "Radiante (fotones)"), wind_turbine: L("Kinetic (moving air)", "Cinética (aire en movimiento)"), gas_peaker: L("Chemical (fuel)", "Química (combustible)"), battery_bess: L("Electrochemical", "Electroquímica"), geothermal: L("Thermal (Earth's heat)", "Térmica (calor de la Tierra)") })[t];
  const descOf = t => ({
    pumped_hydro: L("Stores energy as height: surplus electricity pumps water up the mountain, and letting it fall through turbines gives back power in seconds.", "Almacena energía como altura: la electricidad sobrante bombea agua montaña arriba y al dejarla caer por turbinas devuelve potencia en segundos."),
    solar_pv: L("Turns sunlight straight into electricity (the photovoltaic effect). Free fuel, but it sleeps at night and fades under cloud.", "Convierte la luz solar directamente en electricidad (efecto fotovoltaico). Combustible gratis, pero duerme de noche y baja con las nubes."),
    wind_turbine: L("Captures the kinetic energy of wind: power rises with the CUBE of wind speed. It switches off above 25 m/s to protect itself.", "Capta la energía cinética del viento: la potencia sube con el CUBO de su velocidad. Se apaga sobre 25 m/s para protegerse."),
    gas_peaker: L("Burns a depletable fossil fuel: chemical to thermal to kinetic to electricity. Fast to start, but it pays fuel and carbon prices and adds CO₂.", "Quema un combustible fósil agotable: química a térmica a cinética a electricidad. Arranca rápido, pero paga combustible y carbono y añade CO₂."),
    battery_bess: L("Stores electricity chemically and answers in a fraction of a second. It holds only a couple of hours of energy.", "Almacena electricidad químicamente y responde en una fracción de segundo. Solo guarda un par de horas de energía."),
    geothermal: L("Taps heat from deep underground to make steam for a turbine. Steady baseload, day and night, whatever the weather.", "Aprovecha el calor del subsuelo para hacer vapor para una turbina. Carga base constante, de día y de noche, haga el tiempo que haga."),
  })[t];

  host.innerHTML = "";
  const root = el("div", "gc"); host.append(root);
  root.innerHTML = `
  <div class="gc-bar" id="gcBar">
    <div class="gc-clock"><span class="gc-clock__ico" id="gcSkyIco"></span><div><b id="gcClock">Day 1 · 10:30</b><small id="gcTemp"></small></div></div>
    <div class="gc-speed" role="group" aria-label="${L("Simulation speed", "Velocidad de la simulación")}">
      <button type="button" data-sp="0" aria-label="${L("Pause", "Pausa")}">❚❚</button><button type="button" data-sp="1" class="is-on">1×</button><button type="button" data-sp="2">2×</button><button type="button" data-sp="5">5×</button><button type="button" data-sp="10">10×</button></div>
    <div class="gc-cams" role="group" aria-label="${L("Camera", "Cámara")}"></div>
    <div class="gc-tools">
      <button type="button" id="gcGuide">${L("Tour", "Recorrido")}</button><button type="button" id="gcCodex">${L("Codex", "Códice")}</button>
      <button type="button" id="gcMute" aria-pressed="false">${L("Sound on", "Sonido sí")}</button><button type="button" id="gcFull">${L("Full screen", "Pantalla completa")}</button>
      <button type="button" id="gcHideTop">${L("Hide menus", "Ocultar menús")}</button></div>
  </div>
  <div class="gc-stage" id="gcStage">
    <div class="gc-canvas" id="gcCanvas"></div>
    <div class="gc-markers" id="gcMarkers"></div>
    <div class="gc-hudL">
      <div class="gc-gauge"><svg viewBox="0 0 200 118" aria-hidden="true"><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#243247" stroke-width="14" stroke-linecap="round"/><path id="gcBand" d="" fill="none" stroke="#34d399" stroke-width="14"/><g id="gcNeedle" style="transform-origin:100px 100px"><path d="M100 100L100 28" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#f8fafc"/></g><text x="22" y="116" fill="#8ea3bd" font-size="9">59.4</text><text x="100" y="22" fill="#8ea3bd" font-size="9" text-anchor="middle">60.0</text><text x="178" y="116" fill="#8ea3bd" font-size="9" text-anchor="end">60.6</text></svg>
        <div class="gc-gauge__n"><b id="gcHz">60.00</b> Hz</div><div class="gc-gauge__s" id="gcHzState"></div></div>
      <div class="gc-chips"><span class="gc-chip"><small>${L("Rank", "Rango")}</small><b id="gcRank"></b></span><span class="gc-chip"><small>XP</small><b id="gcXp">0</b></span><span class="gc-chip"><small>${L("Stable streak", "Racha estable")}</small><b id="gcStreak">0h</b></span></div>
    </div>
    <div class="gc-hudR" id="gcMission"></div>
    <div class="gc-alerts" id="gcAlerts" aria-live="polite"></div>
    <div class="gc-banner" id="gcBanner" hidden></div>
    <div class="gc-insp" id="gcInsp" hidden></div>
    <div class="gc-dock" id="gcDock"></div>
    <div class="gc-pills"><button type="button" id="gcShowTop" hidden>${L("Show menus", "Mostrar menús")}</button><button type="button" id="gcShowPanels" hidden>${L("Show panels", "Mostrar paneles")}</button></div>
    <div class="gc-modal" id="gcModal" hidden></div>
    <div class="gc-fallback" id="gcFallback" hidden></div>
  </div>
  <div class="gc-panels" id="gcPanels">
    <section class="gc-card gc-ctl"><h4>${L("Control room", "Sala de control")}</h4>
      <label class="gc-sl">${L("Gas peaker throttle", "Acelerador de la central de gas")}: <output id="gcThrO">45%</output><input id="gcThr" type="range" min="0" max="100" value="45" aria-label="${L("Gas peaker throttle", "Acelerador de la central de gas")}"></label>
      <div class="gc-seg" role="group" aria-label="${L("Pumped hydro mode", "Modo de la hidroeléctrica de bombeo")}"><span>${L("Pumped hydro", "Hidroeléctrica")}</span>
        <button type="button" data-hm="auto" class="is-on">${L("Auto", "Auto")}</button><button type="button" data-hm="pump">${L("Pump now", "Bombear ya")}</button><button type="button" data-hm="save">${L("Save water", "Guardar agua")}</button></div>
      <div class="gc-units"><button type="button" id="gcDrone">${L("Send drone", "Enviar dron")}<small id="gcDroneS"></small></button><button type="button" id="gcVan">${L("Send crew van", "Enviar cuadrilla")}<small id="gcVanS"></small></button></div>
      <div class="gc-res"><div><small>${L("Upper reservoir", "Embalse superior")}</small><div class="gc-bar2"><i id="gcResBar"></i></div><b id="gcResTxt"></b></div><div><small>${L("Battery charge", "Carga de la batería")}</small><div class="gc-bar2 bat"><i id="gcBatBar"></i></div><b id="gcBatTxt"></b></div></div>
      <button type="button" class="gc-snap" id="gcSnap">${L("📸 Log snapshot to my Record", "📸 Guardar instantánea en mi Registro")}</button>
    </section>
    <section class="gc-card"><h4>${L("Supply vs demand", "Oferta y demanda")}</h4><canvas id="gcChart" width="520" height="200" aria-label="${L("Chart of demand and supply over the last day", "Gráfico de demanda y oferta del último día")}"></canvas>
      <div class="gc-legend"><span><i style="background:#f87171"></i>${L("Demand", "Demanda")}</span><span><i style="background:#facc15"></i>${L("Supply", "Oferta")}</span><span><i style="background:#34d399"></i>${L("Clean part", "Parte limpia")}</span></div>
      <div class="gc-mix" id="gcMix"></div></section>
    <section class="gc-card"><h4>${L("First Law: energy in = energy out", "Primera Ley: energía que entra = energía que sale")}</h4>
      <div class="gc-law"><div class="gc-law__row"><span>${L("Primary energy in", "Energía primaria que entra")}</span><b id="gcPin">0</b> MW</div><div class="gc-law__bar"><i class="e" id="gcLawE"></i><i class="h" id="gcLawH"></i></div>
        <div class="gc-law__row"><span class="e">${L("Electricity out", "Electricidad que sale")}</span><b id="gcPout">0</b> MW<span class="h">${L("Heat lost", "Calor perdido")}</span><b id="gcPheat">0</b> MW</div>
        <div class="gc-law__eff">${L("System efficiency", "Eficiencia del sistema")}: <b id="gcEff">0</b>%</div></div>
      <div class="gc-eco"><div><small>${L("Cash", "Caja")}</small><b id="gcCash"></b></div><div><small>${L("Net per hour", "Neto por hora")}</small><b id="gcNet"></b></div><div><small>${L("Price", "Precio")}</small><b id="gcPrice"></b></div><div><small>${L("Gas fuel", "Gas")}</small><b id="gcGas"></b></div><div><small>${L("CO₂ emitted", "CO₂ emitido")}</small><b id="gcCo2"></b></div><div><small>${L("Wind · Sun", "Viento · Sol")}</small><b id="gcWx"></b></div></div></section>
  </div>`;
  const $ = id => root.querySelector("#" + id), $$ = (s) => [...root.querySelectorAll(s)];

  /* ---------- scene (with a calm fallback if WebGL is missing) ---------- */
  let sc = null, markers = new Map();
  const markersEl = $("gcMarkers");
  const hooks = {
    reduced, checkSpot: (type, x, z) => spotCheck(S, type, x, z),
    onSelect: id => select(id), onPlace: (type, pos) => place(type, pos),
    onBadSpot: (v, p) => { Sound.bad(); toast(L("Can't build there: ", "No se puede construir ahí: ") + v.why, "warn"); shakeBanner(); sc && sc.burst([p.x, p.y + 0.5, p.z], 0xf87171, 24); },
    onGhost: v => { const b = $("gcBanner"); if (b && !b.hidden) b.dataset.ok = v.ok ? "1" : "0"; if (b && !b.hidden && !v.ok) b.querySelector("span").textContent = v.why; else if (b && !b.hidden) b.querySelector("span").textContent = L("Tap to build here", "Toca para construir aquí"); },
    autoOrbit: () => !S.sel && !placing, onUserCamera: () => {},
    onFrame: (project, reg) => {
      markers.forEach((m, id) => { const base = id === "city" ? sc.cityPos() : sc.facilityPos(id); if (!base) { m.el.hidden = true; return; } const p = project(base); const vis = p.z < 1 && p.x > -40 && p.y > -40; m.el.hidden = !vis || hideLabels; if (vis) m.el.style.transform = `translate(${p.x.toFixed(0)}px,${p.y.toFixed(0)}px) translate(-50%,-100%)`; });
    },
  };
  try { sc = await createScene($("gcCanvas"), hooks, o.threeUrl); }
  catch (e) { console.warn(e); $("gcFallback").hidden = false; $("gcFallback").innerHTML = `<p>${L("The 3D view needs WebGL, which this device does not offer. Everything else still works: use the build cards, sliders and charts.", "La vista 3D necesita WebGL, que este dispositivo no ofrece. Todo lo demás funciona: usa las tarjetas, controles y gráficos.")}</p><div class="gc-fb-grid" id="gcFbGrid"></div>`; $("gcCanvas").style.background = "linear-gradient(#0b2a44,#0e1a38)"; }
  if (sc) sc.sync(S);

  /* ---------- markers ---------- */
  let hideLabels = false;
  function mkMarker(id, label, color) {
    if (markers.has(id)) return; const b = el("button", "gc-mk"); b.type = "button"; b.style.setProperty("--c", color); b.innerHTML = `<span class="gc-mk__n"></span><span class="gc-mk__mw"></span><i class="gc-mk__hp"><i></i></i>`; b.setAttribute("aria-label", label);
    b.addEventListener("click", ev => { ev.stopPropagation(); if (id === "city") { sc && sc.flyTo([22, 13, 38], [6, 2, 15]); } else { if (placing) return; select(id); sc && sc.focus(id); } });
    markersEl.append(b); markers.set(id, { el: b, n: b.querySelector(".gc-mk__n"), mw: b.querySelector(".gc-mk__mw"), hp: b.querySelector(".gc-mk__hp i"), cache: "" }); }
  const hexCss = h => "#" + h.toString(16).padStart(6, "0");
  function syncMarkers() { S.facs.forEach(f => mkMarker(f.id, f.name, hexCss(CATALOG[f.type].color))); mkMarker("city", L("City", "Ciudad"), "#f87171"); [...markers.keys()].forEach(id => { if (id !== "city" && !S.facs.find(f => f.id === id)) { markers.get(id).el.remove(); markers.delete(id); } }); }
  function paintMarkers() {
    markers.forEach((m, id) => { if (id === "city") { const s = `${L("City", "Ciudad")}|${S.tel.demand} MW`; if (m.cache !== s) { m.cache = s; m.n.textContent = L("City", "Ciudad"); m.mw.textContent = S.tel.demand + " MW"; } return; }
      const f = S.facs.find(x => x.id === id); if (!f) return; const out = f.status === "broken" ? L("TRIPPED", "AVERIADA") : `${f.out > 0 ? "+" : ""}${Math.round(f.out)} MW`; const s = `${f.name}|${out}|${f.health}|${S.sel === id}`; if (m.cache === s) return; m.cache = s;
      m.n.textContent = nm(f.type); m.mw.textContent = out; m.hp.style.width = f.health + "%"; m.hp.style.background = f.health < 30 ? "#f87171" : f.health < 60 ? "#facc15" : "#34d399"; m.el.classList.toggle("is-sel", S.sel === id); m.el.classList.toggle("is-bad", f.status === "broken"); });
    if (!sc) { const g = $("gcFbGrid"); if (g) g.innerHTML = S.facs.map(f => `<div class="gc-fb"><img src="${photo(CATALOG[f.type].photo)}" alt=""><b>${nm(f.type)}</b><span>${Math.round(f.out)} MW · ${f.health}%</span></div>`).join(""); } }

  /* ---------- toast / banner ---------- */
  function toast(msg, kind) { o.toast && o.toast(msg, kind); }
  function shakeBanner() { const b = $("gcBanner"); b.classList.remove("gc-shake"); void b.offsetWidth; if (!reduced) b.classList.add("gc-shake"); }
  function pulse(node) { if (!node || reduced) return; node.classList.remove("gc-pop"); void node.offsetWidth; node.classList.add("gc-pop"); }

  /* ---------- camera presets ---------- */
  const camNames = { overview: L("Overview", "Vista general"), profile: L("Mountain", "Montaña"), plateau: L("Solar", "Solar"), city: L("City", "Ciudad"), topdown: L("Top", "Cenital") };
  const camsEl = root.querySelector(".gc-cams");
  Object.keys(PRESETS).forEach((k, i) => { const b = el("button", i === 0 ? "is-on" : "", camNames[k]); b.type = "button"; b.addEventListener("click", () => { Sound.click(); $$(".gc-cams button").forEach(x => x.classList.remove("is-on")); b.classList.add("is-on"); sc && sc.preset(k); }); camsEl.append(b); });

  /* ---------- build dock ---------- */
  let placing = null;
  const dock = $("gcDock");
  TYPES.forEach(t => { const c = CATALOG[t]; const card = el("div", "gc-bc"); card.dataset.t = t; card.innerHTML = `<button type="button" class="gc-bc__main" aria-label="${L("Build", "Construir")} ${nm(t)}"><img src="${photo(c.photo)}" alt="" loading="lazy"><span class="gc-bc__b"><b>${nm(t)}</b><small>$${fmt(c.cap / 1000)}k · ${c.mw} MW · ${Math.round(c.eff * 100)}%</small></span></button><button type="button" class="gc-bc__auto" title="${L("Place automatically (no mouse needed)", "Colocar automáticamente (sin ratón)")}" aria-label="${L("Auto-place", "Colocar automático")} ${nm(t)}">⚡</button>`;
    card.querySelector(".gc-bc__main").addEventListener("click", () => startPlacing(t)); card.querySelector(".gc-bc__auto").addEventListener("click", () => { const pos = autoSpot(S, t); if (!pos) { toast(L("No free spot found.", "No hay sitio libre."), "warn"); return; } place(t, pos); });
    dock.append(card); });
  function startPlacing(t) { Sound.init(); Sound.click(); if (placing === t) { stopPlacing(); return; } if (S.cash < CATALOG[t].cap) { Sound.bad(); toast(L("Not enough cash for that yet. Earn more or sell something.", "Todavía no tienes caja suficiente. Gana más o vende algo."), "warn"); const c = dock.querySelector(`[data-t="${t}"]`); c && !reduced && (c.classList.remove("gc-shake"), void c.offsetWidth, c.classList.add("gc-shake")); return; }
    placing = t; sc && sc.setGhost(t); select(null); $$(".gc-bc").forEach(c => c.classList.toggle("is-on", c.dataset.t === t)); const b = $("gcBanner"); b.hidden = false; b.dataset.ok = "1"; b.innerHTML = `<b>${L("Building", "Construyendo")}: ${nm(t)}</b> <span>${L("Move over the island and tap to build", "Mueve sobre la isla y toca para construir")}</span> <button type="button" id="gcCancelPlace">${L("Cancel (Esc)", "Cancelar (Esc)")}</button>`; b.querySelector("#gcCancelPlace").addEventListener("click", stopPlacing);
    toast(L(`${nm(t)}: best on ${CATALOG[t].zone === "ridge" ? "high ridges" : CATALOG[t].zone === "plateau" ? "the flat plateau" : "low valley ground"} (height ${CATALOG[t].elev[0]} to ${CATALOG[t].elev[1]} m).`, `${nm(t)}: mejor en ${CATALOG[t].zone === "ridge" ? "crestas altas" : CATALOG[t].zone === "plateau" ? "la meseta plana" : "el valle bajo"} (altura ${CATALOG[t].elev[0]} a ${CATALOG[t].elev[1]} m).`), "info"); }
  function stopPlacing() { placing = null; sc && sc.setGhost(null); $("gcBanner").hidden = true; $$(".gc-bc").forEach(c => c.classList.remove("is-on")); }
  function place(type, pos) {
    const c = CATALOG[type]; if (S.cash < c.cap) { Sound.bad(); return; } const f = newFacility(type, pos); f.name = nm(type) + " #" + Math.floor(10 + Math.random() * 89);
    S.cash -= c.cap; S.facs.push(f); S.xp += 10; sc && sc.commission(f); syncMarkers(); Sound.place(); stopPlacing(); toast(L(`${f.name} connected to the grid.`, `${f.name} conectada a la red.`), "ok");
    o.award && o.award("builder", L("Grid builder", "Constructor de red")); o.onBuilt && o.onBuilt(type); pulse($("gcCash")); paint(); }

  /* ---------- inspector ---------- */
  function select(id) { S.sel = id; sc && sc.setSelected(id); const p = $("gcInsp"); if (!id) { p.hidden = true; paintMarkers(); return; } Sound.click(); p.hidden = false; renderInsp(); paintMarkers(); }
  function renderInsp() { const f = S.facs.find(x => x.id === S.sel); const p = $("gcInsp"); if (!f) { p.hidden = true; return; } const c = CATALOG[f.type]; const key = `${f.id}${Math.round(f.out)}${f.health}${f.status}${Math.round(f.heat)}`; if (p.dataset.k === key) return; p.dataset.k = key;
    const stat = { active: L("Generating", "Generando"), pumping: f.type === "battery_bess" ? L("Charging", "Cargando") : L("Pumping uphill", "Bombeando cuesta arriba"), idle: L("Idle", "En reposo"), broken: L("TRIPPED", "AVERIADA"), maintenance: "…" }[f.status];
    p.innerHTML = `<button type="button" class="gc-x" aria-label="${L("Close", "Cerrar")}">×</button><img src="${photo(c.photo)}" alt=""><h4>${f.name}</h4><p class="gc-insp__s ${f.status}">${stat}</p>
      <p class="gc-insp__d">${descOf(f.type)}</p>
      <dl><dt>${L("Energy form", "Forma de energía")}</dt><dd>${formName(f.type)}</dd><dt>${L("Output", "Salida")}</dt><dd>${fmt(f.out, 1)} / ${f.cap} MW</dd><dt>${L("Efficiency", "Eficiencia")}</dt><dd>${Math.round(f.eff * 100)}%</dd><dt>${L("Heat lost", "Calor perdido")}</dt><dd>${fmt(f.heat, 0)} MW</dd><dt>${L("Health", "Salud")}</dt><dd>${f.health}%</dd></dl>
      <div class="gc-bar2 hp"><i style="width:${f.health}%;background:${f.health < 30 ? "#f87171" : f.health < 60 ? "#facc15" : "#34d399"}"></i></div>
      <div class="gc-insp__btns"><button type="button" data-a="drone">${L("Send drone", "Enviar dron")}</button><button type="button" data-a="van">${L("Send crew", "Enviar cuadrilla")}</button><button type="button" data-a="sell" class="gc-warn">${L("Sell", "Vender")} +$${fmt(c.cap / 2000)}k</button></div>`;
    p.querySelector(".gc-x").addEventListener("click", () => select(null)); p.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => { const a = b.dataset.a; if (a === "sell") { if (S.facs.length <= 2) { toast(L("Keep at least two facilities.", "Conserva al menos dos instalaciones."), "warn"); return; } S.cash += Math.round(c.cap / 2); S.facs = S.facs.filter(x => x.id !== f.id); sc && sc.sync(S); syncMarkers(); select(null); Sound.click(); toast(L("Sold for half its price.", "Vendida por la mitad de su precio."), "info"); } else dispatch(a, f.id); })); }

  /* ---------- dispatch ---------- */
  function dispatch(kind, fid) { Sound.init(); const u = S.units.find(x => x.kind === kind); if (!u) return; if (u.state !== "docked") { toast(L("That unit is already out on a job.", "Esa unidad ya está en un trabajo."), "info"); return; }
    let f = fid ? S.facs.find(x => x.id === fid) : [...S.facs].sort((a, b) => b.wear - a.wear)[0]; if (!f) return; u.state = "transit"; u.fid = f.id; u.prog = 0; u.target = kind === "drone" ? [f.pos[0], f.pos[1] + 3.2, f.pos[2]] : [f.pos[0] + 1.5, f.pos[1] + 0.4, f.pos[2] + 2]; Sound.dispatch();
    toast(L(`${u.name} is on its way to ${f.name}.`, `${u.name} va hacia ${f.name}.`), "info"); o.award && o.award("dispatch", L("First responder", "Primer respondedor")); }
  $("gcDrone").addEventListener("click", () => dispatch("drone", S.sel)); $("gcVan").addEventListener("click", () => dispatch("van", S.sel));

  /* ---------- controls ---------- */
  $$(".gc-speed button").forEach(b => b.addEventListener("click", () => { Sound.init(); Sound.click(); S.speed = +b.dataset.sp; $$(".gc-speed button").forEach(x => x.classList.toggle("is-on", x === b)); }));
  const thr = $("gcThr"); thr.addEventListener("input", () => { S.throttle = thr.value / 100; $("gcThrO").textContent = thr.value + "%"; });
  $$(".gc-seg [data-hm]").forEach(b => b.addEventListener("click", () => { Sound.click(); S.hydroMode = b.dataset.hm; $$(".gc-seg [data-hm]").forEach(x => x.classList.toggle("is-on", x === b)); if (b.dataset.hm === "pump") toast(L("Pumping water uphill, even if the grid has to give up power to do it.", "Bombeando agua hacia arriba, aunque la red tenga que ceder potencia."), "info"); if (b.dataset.hm === "save") toast(L("Saving water: the turbines stay off so the reservoir keeps its stored energy.", "Guardando agua: las turbinas no generan, así el embalse conserva su energía."), "info"); }));
  const muteBtn = $("gcMute"); const paintMute = () => { muteBtn.textContent = Sound.isMuted() ? L("Sound off", "Sonido no") : L("Sound on", "Sonido sí"); muteBtn.setAttribute("aria-pressed", Sound.isMuted()); }; paintMute(); muteBtn.addEventListener("click", () => { Sound.toggle(); paintMute(); Sound.click(); });
  $("gcFull").addEventListener("click", () => { const st = $("gcStage"); if (document.fullscreenElement) document.exitFullscreen(); else (st.requestFullscreen || st.webkitRequestFullscreen || (() => {})).call(st); });
  $("gcHideTop").addEventListener("click", () => setHidden(true)); $("gcShowTop").addEventListener("click", () => setHidden(false)); $("gcShowPanels").addEventListener("click", () => { $("gcPanels").hidden = false; $("gcShowPanels").hidden = true; });
  function setHidden(h) { $("gcBar").hidden = h; $("gcShowTop").hidden = !h; $("gcPanels").hidden = h; $("gcShowPanels").hidden = true; root.classList.toggle("is-clean", h); hideLabels = false; }
  $("gcSnap").addEventListener("click", () => { snapshot(L("Free play", "Juego libre")); toast(L("Snapshot saved to your Investigation Record.", "Instantánea guardada en tu Registro."), "ok"); pulse($("gcSnap")); });
  function snapshot(label) { const T = S.tel; o.recordTrial({ mission: label, time: `D${T.day} ${String(T.hour).padStart(2, "0")}:${String(T.minute).padStart(2, "0")}`, demand: T.demand, supply: Math.round(T.gen), clean: T.gen > 0 ? Math.round(100 * T.clean / T.gen) : 0, hz: T.hz, effic: T.eff, cash: Math.round(S.cash / 1000) }); snaps++; if (snaps >= 3) o.award && o.award("logger", L("Data logger", "Registrador de datos")); }
  let snaps = o.existingSnaps || 0;

  /* keyboard shortcuts on the stage */
  const onKey = e => { if (e.key === "Escape") { if (placing) stopPlacing(); else if (!$("gcModal").hidden) closeModal(); else select(null); } else if (e.target.closest && e.target.closest("input,textarea,select")) return; else if (e.key === "p" || e.key === "P") { S.speed = S.speed === 0 ? 1 : 0; $$(".gc-speed button").forEach(x => x.classList.toggle("is-on", +x.dataset.sp === S.speed)); } else if (e.key === "h" || e.key === "H") hideLabels = !hideLabels; };
  document.addEventListener("keydown", onKey);

  /* ---------- modals: codex, tour, mission result ---------- */
  function openModal(html) { const m = $("gcModal"); m.hidden = false; m.innerHTML = `<div class="gc-modal__box" role="dialog" aria-modal="true">${html}</div>`; const x = m.querySelector(".gc-modal__x"); x && x.addEventListener("click", closeModal); m.addEventListener("click", ev => { if (ev.target === m) closeModal(); }, { once: true }); const f = m.querySelector("button"); f && f.focus(); return m; }
  function closeModal() { $("gcModal").hidden = true; $("gcModal").innerHTML = ""; }
  function codex() { Sound.click(); const tabs = [
      [L("Primary vs secondary", "Primaria vs secundaria"), `<p><b>${L("Primary energy", "Energía primaria")}</b> ${L("is captured straight from raw nature before any conversion: sunlight, wind, falling water, coal, crude oil, Earth's heat.", "se capta directamente de la naturaleza antes de cualquier conversión: luz solar, viento, agua que cae, carbón, petróleo crudo, calor de la Tierra.")}</p><p><b>${L("Secondary energy", "Energía secundaria")}</b> ${L("is a carrier made by converting a primary source: grid electricity, gasoline, hydrogen.", "es un portador producido al convertir una fuente primaria: electricidad de la red, gasolina, hidrógeno.")}</p><p class="gc-trap">${L("Exam trap: grid electricity is never a primary source. Crude oil is primary but NON-renewable; wind is primary and renewable.", "Trampa de examen: la electricidad de la red nunca es una fuente primaria. El petróleo crudo es primario pero NO renovable; el viento es primario y renovable.")}</p>`],
      [L("Forms & the First Law", "Formas y Primera Ley"), `<p>${L("Energy is the ability to do work. It is stored as <b>potential</b> energy (height, chemical bonds) or moves as <b>kinetic</b> energy (moving air, water, light, heat).", "La energía es la capacidad de hacer trabajo. Se almacena como energía <b>potencial</b> (altura, enlaces químicos) o se mueve como energía <b>cinética</b> (aire, agua, luz, calor en movimiento).")}</p><p>${L("<b>First Law of Thermodynamics:</b> energy is never created or destroyed, only converted. So primary energy in = electricity out + heat lost. Look at the First Law panel under the 3D view: the red slice is not destroyed energy, it is heat spread into the air.", "<b>Primera Ley de la Termodinámica:</b> la energía no se crea ni se destruye, solo se convierte. Entonces energía primaria que entra = electricidad que sale + calor perdido. Mira el panel de la Primera Ley bajo la vista 3D: la parte roja no es energía destruida, es calor disperso en el aire.")}</p><p>${L("Efficiency = useful energy out ÷ energy in × 100. Solar panels are about 23%, gas turbines about 38%, batteries about 91%.", "Eficiencia = energía útil que sale ÷ energía que entra × 100. Los paneles solares rondan el 23 %, las turbinas de gas el 38 % y las baterías el 91 %.")}</p>`],
      [L("Storing energy", "Almacenar energía"), `<p>${L("Wind and sun do not follow demand, so grids store energy. Pumped hydro stores <b>gravitational potential energy</b>: Ep = m × g × h. A bigger mass of water or a higher drop stores more.", "El viento y el sol no siguen a la demanda, por eso las redes almacenan energía. La hidroeléctrica de bombeo almacena <b>energía potencial gravitatoria</b>: Ep = m × g × h. Más agua o más altura almacena más.")}</p><p>${L("Pumping loses about 18% as heat, so you only get about 82% back. Batteries respond in a fraction of a second but hold only about two hours, so the two are partners.", "Bombear pierde cerca del 18 % como calor, así que solo recuperas el 82 %. Las baterías responden en una fracción de segundo pero guardan unas dos horas, así que son socias.")}</p>`],
      [L("Grid frequency & money", "Frecuencia y dinero"), `<p>${L("A grid must make exactly as much power as people use, every instant. If supply falls short the frequency sags below 60 Hz; too much and it rises. Keep it inside 59.8 to 60.2 Hz.", "Una red debe producir exactamente la potencia que se usa, en todo instante. Si falta oferta la frecuencia baja de 60 Hz; si sobra, sube. Mantenla entre 59,8 y 60,2 Hz.")}</p><p>${L("Renewables have no fuel bill. A gas peaker pays for fuel (which can spike) and a carbon tax. When gas gets expensive, clean power wins on money as well as on CO₂.", "Las renovables no tienen factura de combustible. Una central de gas paga combustible (que puede dispararse) e impuesto al carbono. Cuando el gas se encarece, la energía limpia gana en dinero y también en CO₂.")}</p>`]];
    const m = openModal(`<button type="button" class="gc-modal__x" aria-label="${L("Close", "Cerrar")}">×</button><h3>${L("Energy Codex", "Códice de la Energía")}</h3><div class="gc-tabs">${tabs.map((t, i) => `<button type="button" data-i="${i}" class="${i ? "" : "is-on"}">${t[0]}</button>`).join("")}</div><div class="gc-tabbody">${tabs[0][1]}</div>`);
    m.querySelectorAll(".gc-tabs button").forEach(b => b.addEventListener("click", () => { m.querySelectorAll(".gc-tabs button").forEach(x => x.classList.toggle("is-on", x === b)); m.querySelector(".gc-tabbody").innerHTML = tabs[+b.dataset.i][1]; Sound.click(); })); }
  $("gcCodex").addEventListener("click", codex);

  const TOUR = [
    { t: L("Welcome, Commander", "Bienvenido, Comandante"), x: L("This is a living digital twin of a small energy island. Everything you see is powered by the same physics you will be tested on. Drag to orbit, scroll to zoom.", "Este es un gemelo digital vivo de una pequeña isla de energía. Todo lo que ves usa la misma física de tu evaluación. Arrastra para orbitar y usa la rueda para acercar."), cam: "overview" },
    { t: L("The mountain battery", "La batería de la montaña"), x: L("The lake up high and the powerhouse below form pumped hydro. Surplus power pumps water uphill (stored energy Ep = mgh). Releasing it makes electricity in seconds.", "El lago alto y la central de abajo forman la hidroeléctrica de bombeo. La energía sobrante bombea agua hacia arriba (energía almacenada Ep = mgh). Soltarla genera electricidad en segundos."), cam: "profile" },
    { t: L("Sun and wind", "Sol y viento"), x: L("Solar panels follow the sun; turbines spin with the wind. Both are free fuel, but neither obeys the clock. Watch them as day turns to night.", "Los paneles siguen al sol; las turbinas giran con el viento. Ambos son combustible gratis, pero ninguno obedece al reloj. Obsérvalos al pasar el día a la noche."), cam: "plateau" },
    { t: L("The city never sleeps", "La ciudad nunca duerme"), x: L("The city's demand (red) rises at breakfast and peaks at dinner time. Your job: make exactly that much power. The gauge top-left shows how well you are doing.", "La demanda de la ciudad (roja) sube en el desayuno y alcanza su pico en la cena. Tu tarea: producir exactamente esa potencia. El indicador de arriba a la izquierda muestra cómo vas."), cam: "city" },
    { t: L("Your controls", "Tus controles"), x: L("Bottom: build cards (photo = the real thing). Below the scene: the gas throttle, the pumped-hydro mode, and your drone and crew van. Tap any facility to inspect it.", "Abajo: tarjetas para construir (la foto es la cosa real). Bajo la escena: el acelerador del gas, el modo de la hidroeléctrica y tu dron y cuadrilla. Toca cualquier instalación para inspeccionarla."), cam: "overview" },
    { t: L("Take a mission", "Acepta una misión"), x: L("Top-right: three missions with stars, cash rewards and XP. Or play free. Press P to pause, H to hide labels. Good luck!", "Arriba a la derecha: tres misiones con estrellas, premios en dinero y XP. O juega libre. Pulsa P para pausar, H para ocultar etiquetas. ¡Suerte!"), cam: "overview" },
  ];
  let tourI = 0; function tour(i) { tourI = i; const s = TOUR[i]; sc && sc.preset(s.cam); const last = i === TOUR.length - 1; openModal(`<button type="button" class="gc-modal__x" aria-label="${L("Close", "Cerrar")}">×</button><p class="gc-eyebrow">${L("Guided tour", "Recorrido guiado")} ${i + 1}/${TOUR.length}</p><h3>${s.t}</h3><p>${s.x}</p><div class="gc-modal__nav"><button type="button" id="gcTBack" ${i ? "" : "disabled"}>${L("Back", "Atrás")}</button><button type="button" id="gcTNext" class="gc-primary">${last ? L("Start", "Empezar") : L("Next", "Siguiente")}</button></div>`);
    $("gcTNext").addEventListener("click", () => { Sound.click(); if (last) { closeModal(); try { localStorage.setItem("gc_tour", "1"); } catch (e) {} } else tour(i + 1); }); $("gcTBack").addEventListener("click", () => { Sound.click(); tour(i - 1); }); }
  $("gcGuide").addEventListener("click", () => { Sound.init(); tour(0); });

  /* ---------- mission HUD ---------- */
  const mEl = $("gcMission"); let mKey = ""; if (innerWidth < 700) mEl.classList.add("is-min");
  function stars(n, big) { return `<span class="gc-stars${big ? " big" : ""}">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}">★</i>`).join("")}</span>`; }
  function paintMission() {
    const m = S.mission; let html;
    if (!m) { html = `<h4>${L("Missions", "Misiones")}</h4>` + Object.values(MISSIONS).map(M => `<button type="button" class="gc-ms" data-m="${M.id}"><span class="gc-ms__t"><b>${L(...mNames[M.id])}</b><small>${L(M.diff === "Standard" ? "Standard" : M.diff === "Challenging" ? "Challenging" : "Expert", M.diff === "Standard" ? "Estándar" : M.diff === "Challenging" ? "Desafiante" : "Experto")} · $${M.reward / 1000}k</small></span>${stars(S.medals[M.id] || 0)}</button>`).join("") + `<p class="gc-hint">${L("Or just play: build, balance and explore. Log snapshots for your Record.", "O simplemente juega: construye, equilibra y explora. Guarda instantáneas para tu Registro.")}</p>`; }
    else { const M = MISSIONS[m.id], ev = missionEval(S), pct = clamp(m.elapsed / M.dur, 0, 1) * 100;
      html = `<h4>${L(...mNames[m.id])}</h4><p class="gc-brief">${L(...mBriefs[m.id])}</p><div class="gc-bar2 mp"><i style="width:${pct}%"></i></div><ul class="gc-tg">${ev.map((e, i) => `<li class="${e.ok ? "ok" : ""}"><span>${e.ok ? "✓" : "○"}</span><span>${L(...mTargets[m.id][i])}<small>${e.prog}</small></span></li>`).join("")}</ul><button type="button" class="gc-ms__x" id="gcAbort">${L("Leave mission", "Salir de la misión")}</button>`; }
    const k = html.replace(/style="width:[\d.]+%"/, "") + (m ? Math.round(m.elapsed / 30) : ""); const targetsKey = m ? missionEval(S).map(e => e.ok + e.prog).join("|") + Math.round(m.elapsed / 15) : Object.values(S.medals).join(",");
    if (mKey === targetsKey + (m ? m.id : "x")) return; mKey = targetsKey + (m ? m.id : "x"); mEl.innerHTML = html.replace("</h4>", `<button type="button" class="gc-min" aria-label="${L("Collapse or expand missions", "Contraer o expandir misiones")}">${mEl.classList.contains("is-min") ? "+" : "–"}</button></h4>`); mEl.querySelector(".gc-min").addEventListener("click", () => { mEl.classList.toggle("is-min"); mKey = ""; paintMission(); });
    mEl.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { Sound.init(); Sound.alert(); startMission(S, b.dataset.m); $$(".gc-speed button").forEach(x => x.classList.toggle("is-on", +x.dataset.sp === S.speed)); thr.value = Math.round(S.throttle * 100); $("gcThrO").textContent = thr.value + "%"; $$(".gc-seg [data-hm]").forEach(x => x.classList.toggle("is-on", x.dataset.hm === "auto")); mKey = ""; paintMission(); toast(L(...mTips[b.dataset.m]), "info"); o.onMissionStart && o.onMissionStart(b.dataset.m); }));
    const ab = mEl.querySelector("#gcAbort"); ab && ab.addEventListener("click", () => { S.mission = null; S.stormMode = false; S.shock = false; mKey = ""; paintMission(); });
  }
  const mNames = { duck: ["The Duck Curve Ramp", "La rampa de la curva del pato"], shock: ["Fossil Commodity Shock", "Choque del precio de los combustibles"], storm: ["100-Year Alpine Storm", "Tormenta alpina del siglo"] };
  const mBriefs = { duck: ["Bank midday surplus as water, then release it for the 6 pm peak.", "Guarda el excedente del mediodía como agua y suéltalo para el pico de las 18:00."], shock: ["Gas costs $18.40. Build clean supply and starve the peaker.", "El gas cuesta 18,40 $. Construye energía limpia y deja sin trabajo a la central de gas."], storm: ["Gusts wear the turbines fast. Keep every machine alive and the city lit.", "Las ráfagas desgastan rápido las turbinas. Mantén vivas las máquinas y la ciudad encendida."] };
  const mTips = { duck: [MISSIONS.duck.tip, "Construye más solar (se paga rápido), baja el gas al mediodía para que el excedente bombee agua hacia arriba, pon la hidroeléctrica en Guardar agua por la mañana y al inicio de la tarde, luego pasa a Auto y sube el gas para el pico de las 18:00."], shock: [MISSIONS.shock.tip, "La geotérmica funciona 24/7 haga el tiempo que haga. Añade una y baja el gas a casi nada: tu flujo de caja se pondrá en verde."], storm: [MISSIONS.storm.tip, "Vigila los anillos de salud. Envía el dron (rápido) y la cuadrilla (lenta) a la turbina peor antes de que baje del 30 %."] };
  const mTargets = { duck: [["Store 150 MWh or more in the upper reservoir", "Almacena 150 MWh o más en el embalse superior"], ["Meet the evening peak (18:00 to 21:00) with under 30 minutes of shortfall", "Cubre el pico de la tarde (18:00 a 21:00) con menos de 30 minutos de déficit"], ["Keep frequency between 59.8 and 60.2 Hz for 90% of the mission", "Mantén la frecuencia entre 59,8 y 60,2 Hz el 90 % de la misión"]],
    shock: [["Earn an average operating profit of $5k or more per hour", "Gana un beneficio operativo medio de 5 mil $ o más por hora"], ["Keep gas under 15% of the energy you supply", "Mantén el gas por debajo del 15 % de la energía que suministras"], ["Reach 250 MW or more of clean power at one moment", "Alcanza 250 MW o más de energía limpia en un momento"]],
    storm: [["Never let any facility fall below 30% health", "No dejes que ninguna instalación baje del 30 % de salud"], ["Complete 3 or more repairs with the drone or crew van", "Completa 3 o más reparaciones con el dron o la cuadrilla"], ["Have no blackout minutes (frequency under 59.5 Hz)", "No tengas minutos de apagón (frecuencia bajo 59,5 Hz)"]] };

  function missionDone(ev) { Sound.win(); sc && sc.punch(); const M = MISSIONS[ev.id]; snapshot(L(...mNames[ev.id]) + " ★" + ev.stars); o.setResult && o.setResult("mission_" + ev.id + "_stars", ev.stars); o.award && o.award("mission_" + ev.id, L(...mNames[ev.id])); if (ev.stars === 3) o.award && o.award("threestar", L("Three-star commander", "Comandante de tres estrellas")); o.onMissionDone && o.onMissionDone(ev);
    const next = Object.keys(MISSIONS)[(Object.keys(MISSIONS).indexOf(ev.id) + 1) % 3];
    openModal(`<button type="button" class="gc-modal__x" aria-label="${L("Close", "Cerrar")}">×</button><p class="gc-eyebrow">${L("Mission complete", "Misión completada")}</p><h3>${L(...mNames[ev.id])}</h3>${stars(ev.stars, true)}<ul class="gc-tg">${ev.res.map((e, i) => `<li class="${e.ok ? "ok" : ""}"><span>${e.ok ? "✓" : "✗"}</span><span>${L(...mTargets[ev.id][i])}<small>${e.prog}</small></span></li>`).join("")}</ul><p class="gc-reward">+$${fmt(ev.gain)} · +${ev.xp} XP</p><p class="gc-hint">${ev.stars === 3 ? L("Perfect run!", "¡Ejecución perfecta!") : L("Retry with a new plan to earn all three stars.", "Reintenta con un plan nuevo para ganar las tres estrellas.")}</p><div class="gc-modal__nav"><button type="button" id="gcRetry">${L("Retry", "Reintentar")}</button><button type="button" id="gcNext" class="gc-primary">${L("Next mission", "Siguiente misión")}</button><button type="button" id="gcFree">${L("Free play", "Juego libre")}</button></div>`);
    $("gcRetry").addEventListener("click", () => { closeModal(); startMission(S, ev.id); mKey = ""; }); $("gcNext").addEventListener("click", () => { closeModal(); startMission(S, next); mKey = ""; }); $("gcFree").addEventListener("click", () => { closeModal(); S.mission = null; S.stormMode = false; S.shock = false; S.speed = 1; $$(".gc-speed button").forEach(x => x.classList.toggle("is-on", +x.dataset.sp === 1)); mKey = ""; }); }

  /* ---------- painters ---------- */
  const arc = (a0, a1, r = 80) => { const p = a => [100 + r * Math.cos(Math.PI - a * Math.PI), 100 - r * Math.sin(Math.PI - a * Math.PI)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  $("gcBand").setAttribute("d", arc((59.8 - 59.4) / 1.2, (60.2 - 59.4) / 1.2));
  const chart = $("gcChart"), cx = chart.getContext("2d");
  function drawChart() { const w = chart.width, h = chart.height, pad = 26, H = S.hist; cx.clearRect(0, 0, w, h); cx.fillStyle = "#0b1626"; cx.fillRect(0, 0, w, h); cx.strokeStyle = "#1d2c44"; cx.fillStyle = "#7f93b0"; cx.font = "11px system-ui"; for (let g = 0; g <= 4; g++) { const y = pad + (h - 2 * pad) * g / 4; cx.beginPath(); cx.moveTo(pad + 10, y); cx.lineTo(w - 8, y); cx.stroke(); cx.fillText(Math.round(400 - 100 * g) + "", 2, y + 4); }
    if (H.length < 2) { cx.fillText(L("Running… the chart fills as the day goes by.", "En marcha… el gráfico se llena con el día."), 40, h / 2); return; }
    const X = i => pad + 12 + (w - pad - 20) * i / Math.max(1, H.length - 1), Y = v => pad + (h - 2 * pad) * (1 - v / 400);
    const area = (key, col) => { cx.beginPath(); cx.moveTo(X(0), Y(0)); H.forEach((p, i) => cx.lineTo(X(i), Y(p[key]))); cx.lineTo(X(H.length - 1), Y(0)); cx.closePath(); cx.fillStyle = col; cx.fill(); };
    area("g", "rgba(250,204,21,.28)"); area("c", "rgba(52,211,153,.4)"); const line = (key, col) => { cx.beginPath(); H.forEach((p, i) => i ? cx.lineTo(X(i), Y(p[key])) : cx.moveTo(X(i), Y(p[key]))); cx.strokeStyle = col; cx.lineWidth = 2.2; cx.stroke(); }; line("g", "#facc15"); line("d", "#f87171"); cx.lineWidth = 1; }
  const MIXC = { solar: ["#facc15", L("Solar", "Solar")], wind: ["#5eead4", L("Wind", "Viento")], geo: ["#f87171", L("Geothermal", "Geotérmica")], hydro: ["#38bdf8", L("Hydro", "Hidro")], batt: ["#a78bfa", L("Battery", "Batería")], gas: ["#fb923c", L("Gas", "Gas")] };
  function paintMix() { const T = S.tel, tot = Math.max(1, T.gen); $("gcMix").innerHTML = `<div class="gc-mixbar">${Object.keys(MIXC).map(k => T.mix[k] > 0.5 ? `<i style="width:${100 * T.mix[k] / tot}%;background:${MIXC[k][0]}" title="${MIXC[k][1]} ${Math.round(T.mix[k])} MW"></i>` : "").join("")}</div><div class="gc-mixleg">${Object.keys(MIXC).map(k => `<span><i style="background:${MIXC[k][0]}"></i>${MIXC[k][1]} ${Math.round(T.mix[k])}</span>`).join("")}</div>`; }
  let lastChart = 0, lastHist = 0;
  function paint() {
    const T = S.tel; if (!T) return;
    $("gcClock").textContent = `${L("Day", "Día")} ${T.day} · ${String(T.hour).padStart(2, "0")}:${String(T.minute).padStart(2, "0")}`; $("gcTemp").textContent = `${T.temp}°C`;
    $("gcSkyIco").textContent = T.sun > 20 ? (T.cloud > 0.6 ? "⛅" : "☀") : "☾";
    const hz = T.hz, dev = clamp((hz - 59.4) / 1.2, 0, 1); $("gcNeedle").style.transform = `rotate(${(dev - 0.5) * 160}deg)`; $("gcHz").textContent = hz.toFixed(2); const st = Math.abs(hz - 60) <= 0.1 ? [L("Rock steady", "Estable como roca"), "#34d399"] : Math.abs(hz - 60) <= 0.2 ? [L("In the safe band", "En la banda segura"), "#a3e635"] : hz < 60 ? [L("Supply short!", "¡Falta oferta!"), "#f87171"] : [L("Too much supply", "Sobra oferta"), "#fb923c"]; $("gcHzState").textContent = st[0]; $("gcHzState").style.color = st[1]; $("gcHz").style.color = st[1];
    $("gcRank").textContent = L(...rankNames[rankOf(S.xp)] || [rankOf(S.xp), rankOf(S.xp)]); $("gcXp").textContent = Math.floor(S.xp); $("gcStreak").textContent = (S.streak / 60).toFixed(1) + "h";
    $("gcCash").textContent = "$" + fmt(S.cash); $("gcNet").textContent = (T.net >= 0 ? "+$" : "-$") + fmt(Math.abs(T.net)) + "/h"; $("gcNet").style.color = T.net >= 0 ? "#34d399" : "#f87171"; $("gcPrice").textContent = "$" + fmt(T.price) + "/MWh"; $("gcGas").textContent = "$" + S.gasPrice.toFixed(2) + (S.shock ? " ⚠" : ""); $("gcCo2").textContent = fmt(S.co2) + " t"; $("gcWx").textContent = `${T.wind} m/s · ${T.sun}%`;
    $("gcPin").textContent = fmt(T.primary); $("gcPout").textContent = fmt(T.gen); $("gcPheat").textContent = fmt(T.heat); $("gcEff").textContent = fmt(T.eff, 1); const tot = Math.max(1, T.gen + T.heat); $("gcLawE").style.width = (100 * T.gen / tot) + "%"; $("gcLawH").style.width = (100 * T.heat / tot) + "%";
    $("gcResBar").style.width = (100 * S.stored / HYDRO_CAP_MWH) + "%"; $("gcResTxt").textContent = `${fmt(S.stored)} / ${HYDRO_CAP_MWH} MWh`; $("gcBatBar").style.width = (100 * S.bess / BESS_CAP_MWH) + "%"; $("gcBatTxt").textContent = `${fmt(S.bess)} / ${BESS_CAP_MWH} MWh`;
    const dr = S.units[0], vn = S.units[1]; const us = u => ({ docked: L("ready", "listo"), transit: L("flying/driving…", "en camino…"), servicing: `${L("repairing", "reparando")} ${Math.round(u.prog)}%`, returning: L("returning", "regresando") })[u.state]; $("gcDroneS").textContent = us(dr); $("gcVanS").textContent = us(vn);
    paintMix(); paintMarkers(); paintMission(); renderInsp(); paintAlerts(); $$(".gc-bc").forEach(c => c.classList.toggle("is-poor", S.cash < CATALOG[c.dataset.t].cap));
    if (performance.now() - lastChart > 600) { lastChart = performance.now(); drawChart(); } }
  const rankNames = { "Trainee Operator": ["Trainee Operator", "Operador en prácticas"], "Grid Operator": ["Grid Operator", "Operador de red"], "Senior Dispatcher": ["Senior Dispatcher", "Despachador sénior"], "Grid Commander": ["Grid Commander", "Comandante de red"] };

  /* alerts */
  const aEl = $("gcAlerts"); let aKey = "";
  function paintAlerts() { if (S.tel) { S.alerts = S.alerts.filter(a => !(a.key === "freq" && S.tel.hz >= 59.85) && !(a.key === "over" && S.tel.hz <= 60.2)); }
    const list = S.alerts.filter(a => !a.hidden && a.type !== "info").slice(0, 3); const k = list.map(a => a.id).join("|"); if (k === aKey) return; aKey = k; if (list.length && list.some(a => !a.seen)) { list.forEach(a => { if (!a.seen) { a.seen = true; Sound.alert(); } }); }
    aEl.innerHTML = list.map(a => `<div class="gc-al ${a.type}" data-id="${a.id}"><b>${a.title}</b><p>${a.msg}</p><div>${a.action ? `<button type="button" data-do="${a.action}">${a.action === "repair" ? L("Dispatch repair", "Enviar reparación") : a.action === "ramp" ? L("Ramp the peaker", "Subir la central de gas") : L("Pump water uphill", "Bombear agua hacia arriba")}</button>` : ""}<button type="button" data-x="1">${L("Dismiss", "Descartar")}</button></div></div>`).join("");
    aEl.querySelectorAll(".gc-al").forEach(n => { const a = S.alerts.find(x => x.id === n.dataset.id); n.querySelector("[data-x]").addEventListener("click", () => { a.hidden = true; aKey = ""; paintAlerts(); }); const d = n.querySelector("[data-do]"); d && d.addEventListener("click", () => { if (a.action === "repair") dispatch("drone", a.fid); else if (a.action === "ramp") { S.throttle = 0.95; thr.value = 95; $("gcThrO").textContent = "95%"; } else { S.hydroMode = "pump"; $$(".gc-seg [data-hm]").forEach(x => x.classList.toggle("is-on", x.dataset.hm === "pump")); } a.hidden = true; aKey = ""; paintAlerts(); }); }); }

  /* ---------- run loop on setInterval ---------- */
  syncMarkers();
  tick(S, 0.01); paint();
  let evHandled = 0;
  const loop = setInterval(() => {
    const evs = tick(S, 0.25);
    evs.forEach(e => { if (e.type === "repaired") { Sound.repair(); const p = sc && sc.facilityPos(e.fid); p && sc.burst([p.x, p.y, p.z], 0x4ade80, 50); toast(L("Repair complete.", "Reparación completa."), "ok"); } else if (e.type === "tripped") { Sound.alert(); sc && sc.punch(); } else if (e.type === "missionDone") missionDone(e); });
    paint(); }, 250);
  /* when the page is hidden browsers throttle timers; the sim simply advances less (no catch-up burst) */
  let tourShown = false; try { tourShown = localStorage.getItem("gc_tour") === "1"; } catch (e) {}
  if (!tourShown && sc) setTimeout(() => tour(0), 500);
  const stageEl = $("gcStage"); const fsHandler = () => { stageEl.classList.toggle("is-fs", !!document.fullscreenElement); }; document.addEventListener("fullscreenchange", fsHandler);

  return {
    state: S, scene: sc,
    destroy() { clearInterval(loop); document.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", fsHandler); sc && sc.destroy(); host.innerHTML = ""; },
    api: { startMission: id => { startMission(S, id); mKey = ""; }, dispatch, place, snapshot, setSpeed: v => { S.speed = v; } },
  };
}
