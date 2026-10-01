/* ==========================================================================
   HARBOUR ISLE GRID — the city-management game (Bonus Game Library: "tycoon /
   resource loop", with real-time supply-demand feedback).

   Keep 6,000 homes powered for six days using ocean energy. Build, maintain and
   price. Nothing here can end the run: running short costs you money and the
   city's trust, never a "game over" (CLAUDE.md §4 / §6 — cost time, never health).
   Game-state time runs on setInterval; requestAnimationFrame only paints.
   ========================================================================== */
import * as M from "./grid-model.js";
import * as A from "./scene-art.js";

const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
const money = k => (k < 0 ? "−$" : "$") + fmt(Math.abs(k), Math.abs(k) < 10 ? 1 : 0) + "k";
const PHOTOS = { wind: "wind-barrow.jpg", solar: "solar-floating.jpg", wave: "wave-pelamis.jpg", tidal: "tidal-seaflow.jpg", current: "tidal-seaflow.jpg", otec: "otec-hawaii.jpg", battery: "battery-bess.jpg" };
const ZONE_COLOR = { bay: "#ffd166", coast: "#ff6b81", shelf: "#bfe3ff", channel: "#2ee6b6", deep: "#a394ff", pier: "#e0aaff" };

export function mountGrid(host, { L, reduced, award, onFinish, photoBase = "photos/" }) {
  const es = L("en", "es") === "es";
  const ZN = z => es ? M.ZONE_NAMES[z][1] : M.ZONE_NAMES[z][0];
  const INFO = {
    wind: { name: L("Offshore wind turbine", "Turbina eólica marina"), ready: L("Mature · available now", "Madura · disponible hoy"), cf: "40–50%",
      fact: L("Spins faster in strong wind, but output follows the cube of speed — and it shuts down in a storm above 25 m/s.", "Gira más rápido con viento fuerte, pero la salida sigue el cubo de la velocidad — y se detiene en una tormenta sobre 25 m/s."),
      credit: L("Real photo: Barrow offshore wind farm", "Foto real: parque eólico marino de Barrow") },
    solar: { name: L("Floating solar raft", "Balsa solar flotante"), ready: L("Mature on lakes · being trialled at sea", "Madura en lagos · en pruebas en el mar"), cf: "15–25%",
      fact: L("Zero output at night and weak under cloud, but cheap and quiet. Sea-going rafts are still being trialled.", "Cero salida de noche y débil con nubes, pero barata y silenciosa. Las balsas marinas aún se están probando."),
      credit: L("Real photo: a floating PV array on a pond", "Foto real: un campo solar flotante en un estanque") },
    wave: { name: L("Wave energy device", "Dispositivo de energía undimotriz"), ready: L("Under development · prototypes", "En desarrollo · prototipos"), cf: "20–35%",
      fact: L("Energy per metre of wave rises with height squared. Great in swell, but storms can destroy it — so it must be serviced.", "La energía por metro de ola crece con la altura al cuadrado. Excelente con oleaje, pero las tormentas pueden destruirlo — así que hay que revisarlo."),
      credit: L("Real photo: Pelamis device, Orkney", "Foto real: dispositivo Pelamis, Orcadas") },
    tidal: { name: L("Tidal stream turbine", "Turbina de corriente de marea"), ready: L("Early commercial · arrays operating", "Comercial temprana · parques en operación"), cf: "35–45%",
      fact: L("Tides come from the Moon and Sun, so output is predictable years ahead — but it falls to zero at slack water twice a tide.", "Las mareas vienen de la Luna y el Sol, así que la salida es predecible con años de antelación — pero cae a cero en la pleamar y bajamar."),
      credit: L("Real photo: the Seaflow tidal turbine", "Foto real: la turbina de marea Seaflow") },
    current: { name: L("Ocean-current turbine", "Turbina de corriente oceánica"), ready: L("Prototype · tested at sea", "Prototipo · probado en el mar"), cf: "55–70%",
      fact: L("Currents like the Gulf Stream or Kuroshio flow steadily in one direction, day and night — big rotors, slow water, steady power.", "Corrientes como la del Golfo o Kuroshio fluyen de forma constante en una dirección, de día y de noche — rotores grandes, agua lenta, potencia constante."),
      credit: L("Real photo: a marine-current turbine of the same family", "Foto real: una turbina de corriente marina de la misma familia") },
    otec: { name: L("OTEC platform", "Plataforma OTEC"), ready: L("Demonstration · small pilot plants", "Demostración · plantas piloto pequeñas"), cf: "85–95%",
      fact: L("Uses the 20 °C+ gap between warm surface water and cold deep water. Steady 24/7, but expensive and still at pilot scale.", "Usa la diferencia de más de 20 °C entre el agua cálida de la superficie y la fría del fondo. Constante 24/7, pero cara y aún a escala piloto."),
      credit: L("Real photo: the OTEC pilot plant in Hawaii", "Foto real: la planta piloto OTEC de Hawái") },
    battery: { name: L("Battery storage", "Almacenamiento en baterías"), ready: L("Mature · stores, doesn't generate", "Madura · almacena, no genera"), cf: "—",
      fact: L("Soaks up surplus power and gives it back at the evening peak — about 88% comes back (the rest is lost as heat).", "Absorbe el excedente y lo devuelve en la hora punta de la tarde — vuelve cerca del 88% (el resto se pierde como calor)."),
      credit: L("Real photo: a grid battery farm", "Foto real: una granja de baterías de red") },
  };
  const DAYQ = [
    { q: L("A 3 MW unit runs at full power for 4 hours. How much energy does it deliver?", "Una unidad de 3 MW funciona a plena potencia 4 horas. ¿Cuánta energía entrega?"),
      o: [L("12 MWh", "12 MWh"), L("3 MWh", "3 MWh"), L("0.75 MWh", "0,75 MWh")], a: 0, hook: L("Energy = power × time. MW × hours = MWh — and your electricity bill is in kWh.", "Energía = potencia × tiempo. MW × horas = MWh — y tu factura de electricidad es en kWh.") },
    { q: L("Tomorrow is calm and cloudy. Which source ignores the weather the most?", "Mañana estará en calma y nublado. ¿Qué fuente ignora más el clima?"),
      o: [L("Ocean thermal (OTEC) or ocean current", "Térmica oceánica (OTEC) o corriente oceánica"), L("Floating solar", "Solar flotante"), L("Offshore wind", "Eólica marina")], a: 0, hook: L("Warm-over-cold water and ocean currents keep flowing in calm, cloudy weather; sun and wind don't.", "El agua cálida sobre fría y las corrientes oceánicas siguen en calma y con nubes; el sol y el viento no.") },
    { q: L("Why can engineers predict tidal power years ahead, but not wind power?", "¿Por qué los ingenieros pueden predecir la energía de las mareas con años de antelación, pero no la del viento?"),
      o: [L("Tides are driven by the Moon and Sun's gravity, which follow fixed cycles", "Las mareas las mueve la gravedad de la Luna y el Sol, que siguen ciclos fijos"), L("Tides are driven by the weather", "Las mareas las mueve el clima"), L("Tidal turbines never wear out", "Las turbinas de marea nunca se desgastan")], a: 0, hook: L("Orbits are predictable; weather isn't. That predictability makes tides valuable for planning a grid.", "Las órbitas son predecibles; el clima no. Esa previsibilidad hace valiosas las mareas para planificar una red.") },
    { q: L("A big storm is coming. Why will crews NOT be able to repair your turbines during it?", "Viene una gran tormenta. ¿Por qué las cuadrillas NO podrán reparar tus turbinas durante ella?"),
      o: [L("Waves above about 3.5 m make boat transfers unsafe", "Olas de más de unos 3,5 m hacen inseguro el traspaso desde barcos"), L("Turbines can't be repaired when windy", "Las turbinas no se pueden reparar con viento"), L("It costs nothing so nobody turns up", "No cuesta nada así que nadie va")], a: 0, hook: L("Offshore work needs a 'weather window'. Service BEFORE the storm — well-maintained kit survives far better.", "El trabajo en el mar necesita una 'ventana meteorológica'. Revisa ANTES de la tormenta — el equipo bien mantenido sobrevive mucho mejor.") },
    { q: L("Your price is far too LOW. What is the most likely problem?", "Tu precio es demasiado BAJO. ¿Cuál es el problema más probable?"),
      o: [L("Not enough income to maintain old units and build new ones", "No hay ingresos suficientes para mantener las unidades y construir nuevas"), L("Households will stop using electricity", "Los hogares dejarán de usar electricidad"), L("The turbines spin slower", "Las turbinas giran más despacio")], a: 0, hook: L("A fair price must cover upkeep AND future building — but too high and households can't pay.", "Un precio justo debe cubrir el mantenimiento Y la construcción futura — pero si es muy alto los hogares no pueden pagar.") },
    { q: L("What makes an ocean-current turbine different from a tidal turbine?", "¿Qué diferencia a una turbina de corriente oceánica de una de marea?"),
      o: [L("The current flows steadily one way, instead of rising, falling and reversing", "La corriente fluye constante en un sentido, en vez de subir, bajar e invertirse"), L("It works only at night", "Solo funciona de noche"), L("It needs no seabed or mooring", "No necesita fondo marino ni amarre")], a: 0, hook: L("Steady flow means steady kWh — but the strongest currents are far offshore and deep, which is why they're still prototypes.", "Un flujo constante significa kWh constantes — pero las corrientes más fuertes están lejos y profundas, por eso aún son prototipos.") },
  ];

  /* ---------------- DOM ---------------- */
  host.innerHTML = "";
  const root = document.createElement("div"); root.className = "og";
  root.innerHTML = `
    <div class="og__hud" role="group" aria-label="${L("City dashboard", "Panel de la ciudad")}">
      <div class="og__tile og__tile--clock"><span class="og__k">${L("Time", "Hora")}</span><b id="og-clock">${L("Day", "Día")} 1 · 00:00</b><span class="og__sub" id="og-weather"></span></div>
      <div class="og__tile"><span class="og__k">${L("Cash", "Efectivo")}</span><b id="og-cash">$140k</b><span class="og__sub" id="og-net"></span></div>
      <div class="og__tile"><span class="og__k">${L("Supply · Demand", "Oferta · Demanda")}</span><b id="og-sd">0 / 0 MW</b><span class="og__sub" id="og-mix"></span></div>
      <div class="og__tile"><span class="og__k">${L("Lights on (recent)", "Luces encendidas (reciente)")}</span><div class="og__bar"><i id="og-rel"></i></div><b id="og-relt">100%</b></div>
      <div class="og__tile og__tile--price"><label class="og__k" for="og-price">${L("Price per kWh", "Precio por kWh")}</label>
        <div class="og__prow"><input id="og-price" type="range" min="0.05" max="0.40" step="0.01" value="0.15"><b id="og-pv">$0.15</b></div>
        <span class="og__sub" id="og-bill"></span></div>
    </div>
    <div class="og__main">
      <div class="og__stagewrap"><canvas class="og__cv" id="og-cv" aria-label="${L("Harbour Isle and its ocean energy sites. Use the site list below to build with the keyboard.", "Harbour Isle y sus sitios de energía oceánica. Usa la lista de sitios de abajo para construir con el teclado.")}"></canvas>
        <div class="og__banner" id="og-banner" role="status" aria-live="polite"></div>
        <div class="og__ctrls">
          <button type="button" class="og__btn" id="og-pause">⏸ ${L("Pause", "Pausa")}</button>
          <label class="og__chk"><input type="checkbox" id="og-peak"><span>${L("Peak-hour pricing (+30%, 5–10 pm)", "Precio en hora punta (+30%, 17–22 h)")}</span></label>
          <label class="og__chk"><input type="checkbox" id="og-diesel" checked><span>${L("Emergency diesel (3.5 MW, $0.40/kWh)", "Diésel de emergencia (3,5 MW, $0,40/kWh)")}</span></label>
        </div></div>
      <aside class="og__side" id="og-side" aria-live="polite"></aside>
    </div>
    <div class="og__lower">
      <div class="og__chartwrap"><p class="og__k">${L("Today: power supplied vs. demand (MW)", "Hoy: potencia suministrada vs. demanda (MW)")}</p><canvas id="og-chart" class="og__chart" aria-hidden="true"></canvas>
        <div class="og__legend" id="og-legend"></div></div>
      <div class="og__log"><p class="og__k">${L("Control room log", "Registro de la sala de control")}</p><ol id="og-log" class="og__logl" aria-live="polite"></ol></div>
    </div>
    <details class="og__sites" open><summary>${L("Sites (keyboard-friendly list)", "Sitios (lista para teclado)")}</summary><div class="og__sitelist" id="og-sitelist"></div></details>
    <div class="og__modal" id="og-modal" hidden></div>`;
  host.append(root);
  const $ = id => root.querySelector("#" + id);
  const cv = $("og-cv"), ctx = cv.getContext("2d"), chart = $("og-chart"), cctx = chart.getContext("2d");
  let W = 960, H = 540, dpr = 1, CW = 400, CH = 150;
  function fit() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(320, Math.round(r.width)); H = Math.round(W * 0.56);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = chart.getBoundingClientRect(); CW = Math.max(240, Math.round(c.width)); CH = 150; chart.width = CW * dpr; chart.height = CH * dpr; chart.style.height = CH + "px"; cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit(); const ro = new ResizeObserver(fit); ro.observe(cv); ro.observe(chart);

  /* ---------------- state ---------------- */
  let g = M.newGame(), selected = null, paused = true, modalOpen = false, over = false, destroyed = false;
  let roll = 1, shake = 0, rain = [], coins = [], floaters = [], parts = [];
  let lastTick = performance.now(), simClock = 0;
  const seen = {}, tip = {};
  const wave = { ph: 0 };
  let storing = 0;
  function reset(seed) { g = M.newGame(seed); selected = null; roll = 1; over = false; Object.keys(seen).forEach(k => delete seen[k]); Object.keys(tip).forEach(k => delete tip[k]); $("og-log").innerHTML = ""; $("og-price").value = g.price; $("og-peak").checked = false; $("og-diesel").checked = true; coins = []; floaters = []; parts = []; paintSide(); paintSites(); openBriefing(); }

  const bringIntoView = () => { const r = root.getBoundingClientRect(); if (r.top < -4 || r.top > window.innerHeight * 0.5) window.scrollTo({ top: r.top + window.scrollY - 56, behavior: reduced ? "auto" : "smooth" }); };
  /* ---------------- helpers: log, banner, floaters ---------------- */
  function log(text, kind) {
    const li = document.createElement("li"); if (kind) li.className = "is-" + kind;
    const hod = Math.floor(g.t % 24); li.innerHTML = `<time>${L("Day", "Día")} ${Math.floor(g.t / 24) + 1} · ${String(hod).padStart(2, "0")}:00</time> ${text}`;
    const ol = $("og-log"); ol.prepend(li); while (ol.children.length > 40) ol.lastChild.remove();
  }
  let bannerT = 0;
  function banner(text, kind) { const b = $("og-banner"); b.textContent = text; b.className = "og__banner is-on" + (kind ? " is-" + kind : ""); bannerT = performance.now() + 5200; }
  function floatAt(txt, x, y, color) { floaters.push({ txt, x, y, life: 1.9, color }); }
  function burstAt(x, y, color, n = 22) { if (reduced) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 40 + Math.random() * 130; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.9, c: color, r: 1.6 + Math.random() * 2.4 }); } }
  const siteXY = s => ({ x: s.x * W, y: s.y * H });
  const scaleAt = y => (0.78 + 0.95 * A.util.clamp((y / H - 0.36) / 0.6, 0, 1)) * (W / 960) * 1.2;
  const unitAt = id => g.units.find(u => u.site === id);

  /* ---------------- side panel ---------------- */
  function typeCard(t, site) {
    const T = M.TYPES[t], I = INFO[t], can = g.cash >= T.capex;
    const mwh = t === "battery" ? ` · ${T.mwh} MWh` : "";
    return `<article class="og__card" style="--ac:${T.accent}">
      <img src="${photoBase}${PHOTOS[t]}" alt="${I.credit}" loading="lazy">
      <div class="og__cardb"><h4>${I.name}</h4><span class="og__ready">${I.ready}</span>
      <p class="og__fact">${I.fact}</p>
      <dl class="og__spec"><div><dt>${L("Rated", "Nominal")}</dt><dd>${T.rated} MW${mwh}</dd></div><div><dt>${L("Typical capacity factor", "Factor de capacidad típico")}</dt><dd>${I.cf}</dd></div><div><dt>${L("Build", "Construir")}</dt><dd>${money(T.capex)}</dd></div><div><dt>${L("Upkeep / day", "Mantenimiento / día")}</dt><dd>${money(T.om)}</dd></div></dl>
      <button type="button" class="og__build" data-t="${t}" ${can ? "" : "aria-disabled='true'"}>${can ? L("Build", "Construir") + " · " + money(T.capex) : L("Need", "Faltan") + " " + money(T.capex - g.cash)}</button></div></article>`;
  }
  let sideSigLast = "";
  function sideSig() {
    if (!selected) return "none";
    const u = unitAt(selected), w = M.weatherAt(g.W, g.t);
    if (!u) return "empty|" + selected + "|" + M.allowedTypes(M.SITES.find(s => s.id === selected).zone).map(t => g.cash >= M.TYPES[t].capex ? 1 : 0).join("");
    return ["unit", selected, u.type, u.busyUntil > g.t, u.cond < 0.2, u.cond > 0.97, w.Hs > M.CREW_MAX_HS].join("|");
  }
  function paintSide() {
    sideSigLast = sideSig();
    const side = $("og-side");
    if (!selected) {
      side.innerHTML = `<h3>${L("Your control desk", "Tu mesa de control")}</h3>
        <ol class="og__how"><li>${L("<b>Tap a glowing site</b> on the sea (or pick one from the list below) to build there.", "<b>Toca un sitio brillante</b> en el mar (o elige uno de la lista de abajo) para construir ahí.")}</li>
        <li>${L("Keep <b>supply ≥ demand</b>. Watch the chart: the white line is what the city wants.", "Mantén la <b>oferta ≥ demanda</b>. Mira el gráfico: la línea blanca es lo que quiere la ciudad.")}</li>
        <li>${L("Set a <b>fair price</b>: high enough to pay for upkeep and new builds, low enough that homes can pay.", "Fija un <b>precio justo</b>: lo bastante alto para pagar mantenimiento y obras nuevas, lo bastante bajo para que los hogares paguen.")}</li>
        <li>${L("<b>Service</b> worn units before storms.", "<b>Revisa</b> las unidades desgastadas antes de las tormentas.")}</li></ol>
        <p class="og__note">${L("Costs are scaled down for play, but the <i>ratios</i> between technologies follow real data. Money is in $ thousands.", "Los costes están reducidos para jugar, pero las <i>proporciones</i> entre tecnologías siguen datos reales. El dinero está en miles de $.")}</p>`;
      return;
    }
    const site = M.SITES.find(s => s.id === selected), u = unitAt(selected);
    let h = `<h3>${ZN(site.zone)}</h3><p class="og__zone" style="--zc:${ZONE_COLOR[site.zone]}">${L("Fits:", "Admite:")} ${M.allowedTypes(site.zone).map(t => INFO[t].name).join(" / ")}</p>`;
    if (!u) {
      h += M.allowedTypes(site.zone).map(t => typeCard(t, site)).join("");
    } else {
      const T = M.TYPES[u.type], I = INFO[u.type], busy = u.busyUntil > g.t, w = M.weatherAt(g.W, g.t), cost = M.serviceCost(u);
      const pct = Math.round(u.cond * 100), cls = u.cond < 0.2 ? "bad" : u.cond < 0.5 ? "warn" : "good";
      const st = u.type === "battery" ? `${fmt(g.battery, 1)} / ${fmt((g.last && g.last.battCap) || 0, 1)} MWh ${L("stored", "almacenado")}` : `${fmt(u.out || 0, 2)} MW ${L("now", "ahora")} (${fmt(((u.out || 0) / T.rated) * 100)}% ${L("of rated", "del nominal")})`;
      h += `<article class="og__card og__card--unit" style="--ac:${T.accent}"><img src="${photoBase}${PHOTOS[u.type]}" alt="${I.credit}"><div class="og__cardb"><h4>${I.name}</h4>
        <p class="og__live" id="og-live">${busy ? L("🔧 Crew at work — offline until finished.", "🔧 Cuadrilla trabajando — fuera de línea hasta terminar.") : u.cond < 0.2 ? L("⚠ Broken — needs service!", "⚠ Averiado — ¡necesita revisión!") : st}</p>
        <div class="og__cond ${cls}" id="og-cond"><i style="width:${pct}%"></i></div><p class="og__condt" id="og-condt">${L("Condition", "Estado")}: <b>${pct}%</b> · ${L("output multiplier", "multiplicador de salida")} ×${fmt(M.conditionFactor(u.cond), 2)}</p>
        <button type="button" class="og__build" id="og-svc" ${(u.cond > 0.97 || busy) ? "aria-disabled='true'" : ""}>${busy ? L("Servicing…", "Revisando…") : u.cond > 0.97 ? L("In perfect condition", "En perfecto estado") : L("Service", "Revisar") + " · " + money(cost)}</button>
        ${w.Hs > M.CREW_MAX_HS ? `<p class="og__warn">${L("Crew boats can't sail: waves are above 3.5 m.", "Las cuadrillas no pueden zarpar: olas sobre 3,5 m.")}</p>` : ""}
        <p class="og__fact">${I.fact}</p></div></article>`;
    }
    side.innerHTML = h;
    side.querySelectorAll(".og__build[data-t]").forEach(b => b.addEventListener("click", () => doBuild(b.dataset.t)));
    const sv = side.querySelector("#og-svc"); if (sv) sv.addEventListener("click", doService);
  }
  function siteLabel(s) { const u = unitAt(s.id); return u ? INFO[u.type].name + " · " + Math.round(u.cond * 100) + "%" : L("Empty — tap to build", "Vacío — toca para construir"); }
  function paintSites() {                       // builds the list once; afterwards only updates labels in place (keeps keyboard focus)
    const list = $("og-sitelist");
    if (!list.children.length) {
      list.innerHTML = M.SITES.map(s => `<button type="button" class="og__site" data-s="${s.id}" style="--zc:${ZONE_COLOR[s.zone]}"><span>${ZN(s.zone)}</span><b></b></button>`).join("");
      list.querySelectorAll("button").forEach(b => b.addEventListener("click", () => select(b.dataset.s)));
    }
    list.querySelectorAll("button").forEach(b => {
      const s = M.SITES.find(x => x.id === b.dataset.s), t = siteLabel(s), el = b.querySelector("b");
      if (el.textContent !== t) el.textContent = t;
      b.classList.toggle("is-on", selected === s.id);
    });
  }
  function select(id) { selected = id; paintSide(); paintSites(); }
  function doBuild(t) {
    if (!selected) return;
    const r = M.place(g, selected, t);
    const s = M.SITES.find(x => x.id === selected), p = siteXY(s);
    if (!r.ok) { shake = 0.6; banner(r.why === "cash" ? L(`Not enough cash — you need ${money(r.cost)}.`, `No hay efectivo suficiente — necesitas ${money(r.cost)}.`) : L("Can't build that here.", "No se puede construir eso aquí."), "warn"); return; }
    burstAt(p.x, p.y, M.TYPES[t].accent, 34); floatAt(L("Built!", "¡Construido!") + " −" + money(r.cost), p.x, p.y - 50, "#fff"); shake = 0.5;
    log(L(`Built ${INFO[t].name} for ${money(r.cost)}.`, `Construido: ${INFO[t].name} por ${money(r.cost)}.`), "good");
    if (!seen.firstBuild) { seen.firstBuild = 1; award("builder", L("Harbour builder", "Constructor del puerto")); }
    if (new Set(g.units.map(u => u.type)).size >= 4 && !seen.mixAward) { seen.mixAward = 1; award("mix", L("Diversified grid", "Red diversificada")); }
    paintSide(); paintSites();
  }
  function doService() {
    const u = unitAt(selected); if (!u) return;
    const r = M.service(g, u); const s = M.SITES.find(x => x.id === selected), p = siteXY(s);
    if (!r.ok) {
      const msg = { weather: L("Crew boats can't sail in waves above 3.5 m — wait for the weather window.", "Las cuadrillas no pueden zarpar con olas sobre 3,5 m — espera la ventana meteorológica."), cash: L(`Need ${money(r.cost || 0)} cash for the service.`, `Necesitas ${money(r.cost || 0)} de efectivo para la revisión.`), busy: L("A crew is already on it.", "Ya hay una cuadrilla en ello."), fine: L("It's already in great condition.", "Ya está en muy buen estado.") }[r.why];
      shake = 0.6; banner(msg, "warn"); return;
    }
    burstAt(p.x, p.y, "#7ee0a1", 24); floatAt(L("Crew dispatched", "Cuadrilla enviada") + " −" + money(r.cost), p.x, p.y - 50, "#bff0cf");
    log(L(`Service started on ${INFO[u.type].name} (${money(r.cost)}). Offline for ${M.SERVICE_HOURS} h.`, `Revisión iniciada en ${INFO[u.type].name} (${money(r.cost)}). Fuera de línea ${M.SERVICE_HOURS} h.`), "good");
    if (!seen.svcAward) { seen.svcAward = 1; award("svc", L("Maintenance crew chief", "Jefe de cuadrilla de mantenimiento")); }
    paintSide(); paintSites();
  }

  /* ---------------- controls ---------------- */
  $("og-price").addEventListener("input", e => {
    g.price = +e.target.value; updatePriceUI();
    const p = M.priceDemandMult(g.price); if (!paused && (g.price > 0.27 || g.price < 0.08) && !tip.price) { tip.price = 1; log(g.price > 0.27 ? L("Tip: at this price many households can't pay their bills — more of what you bill goes uncollected.", "Consejo: con este precio muchos hogares no pueden pagar — se cobra menos de lo facturado.") : L("Tip: a very low price won't cover upkeep and new builds.", "Consejo: un precio muy bajo no cubrirá mantenimiento ni obras nuevas."), "warn"); }
  });
  $("og-peak").addEventListener("change", e => { g.peakPricing = e.target.checked; log(g.peakPricing ? L("Peak-hour pricing ON: evening demand drops a little, bills rise 30% from 5–10 pm.", "Precio en hora punta ACTIVADO: baja un poco la demanda de la tarde, la tarifa sube 30% de 17 a 22 h.") : L("Peak-hour pricing off.", "Precio en hora punta desactivado.")); if (g.peakPricing && !seen.peakAward) { seen.peakAward = 1; award("peak", L("Demand manager", "Gestor de demanda")); } });
  $("og-diesel").addEventListener("change", e => { g.diesel = e.target.checked; log(g.diesel ? L("Emergency diesel armed.", "Diésel de emergencia armado.") : L("Diesel OFF — expect blackouts if supply falls short, but no fuel bill and no CO₂.", "Diésel APAGADO — habrá apagones si falta oferta, pero sin gasto de combustible ni CO₂."), g.diesel ? "" : "warn"); });
  $("og-pause").addEventListener("click", () => { if (modalOpen || over) return; paused = !paused; $("og-pause").textContent = paused ? "▶ " + L("Resume", "Seguir") : "⏸ " + L("Pause", "Pausa"); });
  root.addEventListener("keydown", e => { if ((e.key === "p" || e.key === "P") && !/INPUT|TEXTAREA/.test(e.target.tagName)) $("og-pause").click(); });
  function updatePriceUI() {
    $("og-pv").textContent = "$" + g.price.toFixed(2);
    const bill = M.billFor(g.price), col = M.collectionRate(g.price);
    $("og-bill").innerHTML = `${L("Avg home bill", "Factura media por hogar")}: <b class="${bill > M.AFFORD_BILL * 1.25 ? "bad" : bill > M.AFFORD_BILL ? "warn" : "good"}">$${fmt(bill)}/${L("mo", "mes")}</b> (${L("affordable ≤ $150", "asequible ≤ $150")}) · ${L("paid", "pagado")} ${fmt(col * 100)}%`;
  }
  cv.addEventListener("click", e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
    let best = null, bd = 1e9; M.SITES.forEach(s => { const p = siteXY(s), d = Math.hypot(p.x - x, (p.y - y) * 1.35); const rr = 46 * scaleAt(p.y); if (d < rr && d < bd) { bd = d; best = s; } });
    if (best) select(best.id); else { /* reaction even on empty sea: ripple */ if (!reduced) floaters.push({ ring: true, x, y, life: 0.7, color: "rgba(255,255,255,.8)" }); banner(L("Tap a glowing ring to choose a site.", "Toca un anillo brillante para elegir un sitio."), "info"); }
  });
  cv.addEventListener("mousemove", e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height); cv.style.cursor = M.SITES.some(s => { const p = siteXY(s); return Math.hypot(p.x - x, (p.y - y) * 1.35) < 46 * scaleAt(p.y); }) ? "pointer" : "default"; });

  /* ---------------- daily briefing (forecast + quick-check) ---------------- */
  function spark(arr, lo, hi, marks, color, label, unit) {
    const w = 190, h = 54, pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(h - (v - lo) / (hi - lo) * h).toFixed(1)}`).join(" ");
    const ml = (marks || []).map(m => { const y = h - (m.v - lo) / (hi - lo) * h; return y >= 0 && y <= h ? `<line x1="0" x2="${w}" y1="${y}" y2="${y}" stroke="${m.c}" stroke-dasharray="3 3" stroke-width="1"/><text x="${w - 2}" y="${y - 2}" text-anchor="end" font-size="8" fill="${m.c}">${m.t}</text>` : ""; }).join("");
    return `<figure class="og__spark"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><rect width="${w}" height="${h}" fill="rgba(255,255,255,.06)" rx="4"/>${ml}<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/></svg><figcaption>${label} <b>${unit}</b></figcaption></figure>`;
  }
  function openBriefing() {
    const day = Math.floor(g.t / 24), t0 = day * 24;
    const hrs = Array.from({ length: 25 }, (_, i) => t0 + i);
    const wd = hrs.map(h => M.weatherAt(g.W, h));
    const wmax = Math.max(...wd.map(w => w.wind)), hmax = Math.max(...wd.map(w => w.Hs)), cmean = wd.reduce((a, w) => a + w.cloud, 0) / wd.length;
    const stormDay = wmax > 22 || hmax > 6, calm = wmax < 7;
    const Q = DAYQ[day % DAYQ.length];
    const modal = $("og-modal"); modalOpen = true; paused = true; modal.hidden = false; bringIntoView();
    modal.innerHTML = `<div class="og__dlg" role="dialog" aria-modal="true" aria-labelledby="og-bt">
      <p class="og__k">${L("Daily briefing", "Informe diario")}</p><h3 id="og-bt">${L("Day", "Día")} ${day + 1} ${L("of", "de")} ${M.DAYS} ${stormDay ? "· ⚠ " + L("STORM", "TORMENTA") : calm ? "· " + L("calm & cloudy", "calma y nublado") : ""}</h3>
      ${stormDay ? `<p class="og__alert">${L("A major storm builds this morning. Turbines shut down above 25 m/s, waves will pass 3.5 m (no crew boats) and worn equipment gets damaged. Service units NOW.", "Una gran tormenta se forma esta mañana. Las turbinas se detienen sobre 25 m/s, las olas superarán 3,5 m (sin barcos de cuadrilla) y el equipo gastado se dañará. Revisa las unidades AHORA.")}</p>` : ""}
      ${day === 0 ? `<p class="og__intro">${L("You manage Harbour Isle's power: 6,000 homes, about 30 kWh each per day. Today diesel is covering the gap — expensive and dirty. Build ocean energy, keep it maintained and set a fair price.", "Diriges la energía de Harbour Isle: 6.000 hogares, unos 30 kWh cada uno al día. Hoy el diésel cubre la diferencia — caro y sucio. Construye energía oceánica, mantenla y fija un precio justo.")}</p>` : ""}
      <div class="og__sparks">${spark(wd.map(w => w.wind), 0, 30, [{ v: 25, c: "#ff8a8a", t: L("cut-out 25", "parada 25") }, { v: 3, c: "#9ad", t: L("cut-in 3", "arranque 3") }], "#bfe3ff", L("Wind", "Viento"), "m/s")}
        ${spark(wd.map(w => w.Hs), 0, 9.5, [{ v: 3.5, c: "#ffd166", t: L("no crews >3.5", "sin cuadrilla >3,5") }], "#ff6b81", L("Wave height", "Altura de ola"), "m")}
        ${spark(wd.map(w => w.tide), 0, 3.5, [], "#2ee6b6", L("Tidal flow", "Flujo de marea"), "m/s")}
        ${spark(wd.map(w => w.sun * (1 - 0.7 * w.cloud)), 0, 1, [], "#ffd166", L("Sunshine", "Sol"), "")}</div>
      <fieldset class="og__q"><legend>${L("Quick check", "Comprobación rápida")} <span>(+$3k ${L("grant if right", "de subvención si aciertas")})</span> — ${Q.q}</legend>
        ${Q.o.map((o, i) => `<button type="button" class="og__opt" data-i="${i}">${o}</button>`).join("")}<p class="og__qf" aria-live="polite"></p></fieldset>
      <button type="button" class="og__go" id="og-go">${L("Start day", "Empezar el día")} ${day + 1} →</button></div>`;
    let answered = false;
    modal.querySelectorAll(".og__opt").forEach(b => b.addEventListener("click", () => {
      if (answered) return; answered = true; const ok = +b.dataset.i === Q.a;
      modal.querySelectorAll(".og__opt").forEach(x => { x.disabled = true; if (+x.dataset.i === Q.a) x.classList.add("is-right"); });
      if (!ok) b.classList.add("is-wrong");
      modal.querySelector(".og__qf").innerHTML = (ok ? "✔ " + L("Correct — grant received.", "Correcto — subvención recibida.") : "✖ " + L("Not quite — the answer is highlighted.", "No exactamente — la respuesta está resaltada.")) + " " + Q.hook;
      if (ok) { g.cash += 3; g.st.bonus += 3; log(L("Quick-check grant: +$3k.", "Subvención por comprobación rápida: +$3k."), "good"); }
      g.quick = (g.quick || 0) + (ok ? 1 : 0);
    }));
    $("og-go").addEventListener("click", () => {
      modal.hidden = true; modalOpen = false; paused = false; $("og-pause").textContent = "⏸ " + L("Pause", "Pausa"); lastTick = performance.now();
      banner(stormDay ? L("Storm day — service units, watch the waves!", "Día de tormenta — ¡revisa unidades, vigila las olas!") : L(`Day ${day + 1} begins.`, `Comienza el día ${day + 1}.`), stormDay ? "warn" : "info");
      cv.focus && 0;
    });
    setTimeout(() => $("og-go") && $("og-go").focus(), 30);
  }

  /* ---------------- results ---------------- */
  function finish() {
    over = true; paused = true; modalOpen = true;
    const sc = M.score(g), st = g.st;
    const titles = [L("Apprentice operator", "Operador aprendiz"), L("Junior engineer", "Ingeniero junior"), L("Grid engineer", "Ingeniero de red"), L("Ocean energy lead", "Líder de energía oceánica"), L("Grid Master of the Ocean", "Maestro de la red oceánica")];
    const co2avoid = (st.delivered - st.dieselMWh) * M.DIESEL_CO2;
    const parts_ = [[L("Lights on", "Luces encendidas"), sc.ptsRel, 40], [L("Fair price", "Precio justo"), sc.ptsPrice, 20], [L("Finances", "Finanzas"), sc.ptsFin, 20], [L("Clean energy", "Energía limpia"), sc.ptsClean, 20]];
    const weakest = parts_.slice().sort((a, b) => a[1] / a[2] - b[1] / b[2])[0];
    const advice = { 0: L("Reliability was your weak spot: unmet demand happened most in the evening peak. Diversify sources and add batteries.", "La fiabilidad fue tu punto débil: la demanda no cubierta ocurrió sobre todo en la hora punta. Diversifica fuentes y añade baterías."), 1: L("Pricing was your weak spot: balance what homes can pay (≈$150/month) against what upkeep and new builds cost.", "El precio fue tu punto débil: equilibra lo que pueden pagar los hogares (≈$150/mes) con lo que cuestan mantenimiento y obras."), 2: L("Finances were your weak spot: diesel fuel and unserviced, broken units drain cash.", "Las finanzas fueron tu punto débil: el combustible diésel y las unidades averiadas sin revisar drenan efectivo."), 3: L("Clean share was your weak spot: diesel supplied too much. More ocean sources, plus storage, replace it.", "La proporción limpia fue tu punto débil: el diésel aportó demasiado. Más fuentes oceánicas y almacenamiento lo reemplazan.") }[parts_.indexOf(weakest)];
    const mixRows = Object.keys(M.TYPES).filter(k => st.byType[k]).map(k => `<li style="--ac:${M.TYPES[k].accent}"><span>${INFO[k].name}</span><b>${fmt(st.byType[k])} MWh</b></li>`).join("") + (st.dieselMWh ? `<li style="--ac:#8a8f98"><span>${L("Emergency diesel", "Diésel de emergencia")}</span><b>${fmt(st.dieselMWh)} MWh</b></li>` : "");
    const modal = $("og-modal"); modal.hidden = false; bringIntoView();
    modal.innerHTML = `<div class="og__dlg og__dlg--end" role="dialog" aria-modal="true" aria-labelledby="og-et">
      <p class="og__k">${L("Six days complete", "Seis días completados")}</p><h3 id="og-et">${titles[sc.stars - 1]}</h3>
      <div class="og__stars" aria-label="${sc.stars} / 5">${"★".repeat(sc.stars)}<span>${"★".repeat(5 - sc.stars)}</span></div>
      <p class="og__score"><b>${sc.total}</b>/100</p>
      <div class="og__parts">${parts_.map(p => `<div><span>${p[0]}</span><div class="og__pb"><i style="width:${p[1] / p[2] * 100}%"></i></div><b>${Math.round(p[1])}/${p[2]}</b></div>`).join("")}</div>
      <ul class="og__stats"><li>${L("Delivered", "Entregado")}<b>${fmt(st.delivered)} MWh</b> (${fmt(sc.reliability * 100)}%)</li><li>${L("Average price", "Precio medio")}<b>$${sc.avgPrice.toFixed(2)}/kWh</b></li><li>${L("Blackout hours", "Horas de apagón")}<b>${fmt(st.blackoutHours)} h</b></li><li>${L("Cash now", "Efectivo ahora")}<b>${money(g.cash)}</b></li><li>${L("CO₂ avoided vs all-diesel", "CO₂ evitado vs todo diésel")}<b>${fmt(co2avoid)} t</b></li><li>${L("Wasted (curtailed) surplus", "Excedente desperdiciado")}<b>${fmt(st.curtailed)} MWh</b></li></ul>
      <h4>${L("Where your energy came from", "De dónde vino tu energía")}</h4><ul class="og__mix">${mixRows || "<li>—</li>"}</ul>
      <p class="og__advice"><b>${L("Engineer's debrief:", "Informe del ingeniero:")}</b> ${advice}</p>
      <div class="og__endbtn"><button type="button" class="og__go" id="og-save">${L("Save result to my Investigation Record", "Guardar resultado en mi Registro de investigación")}</button><button type="button" class="og__btn" id="og-again">${L("Play again (new weather)", "Jugar de nuevo (otro clima)")}</button></div></div>`;
    $("og-save").addEventListener("click", () => { onFinish({ g, sc, st }); $("og-save").disabled = true; $("og-save").textContent = "✔ " + L("Saved to your record", "Guardado en tu registro"); });
    $("og-again").addEventListener("click", () => { modal.hidden = true; modalOpen = false; reset((Date.now() & 0xffff)); });
    if (sc.stars >= 4) award("grid4", L("Grid Master", "Maestro de la red"));
    if (st.blackoutHours < 1) award("lights", L("Lights never out", "Luces siempre encendidas"));
    setTimeout(() => $("og-save") && $("og-save").focus(), 30);
  }

  /* ---------------- the simulation tick (setInterval, NOT rAF) ---------------- */
  function tick() {
    if (destroyed) return;
    const now = performance.now(), real = Math.min(0.4, (now - lastTick) / 1000); lastTick = now;
    if (paused || modalOpen || over) return;
    let hours = real * 1.0; const dayBefore = Math.floor(g.t / 24);
    while (hours > 1e-6 && !g.over) { const d = Math.min(0.1, hours); M.advance(g, d); hours -= d; }
    simClock += real;
    // rolling reliability + events
    if (g.last) {
      const r = g.last.demand > 0 ? g.last.delivered / g.last.demand : 1; roll += (r - roll) * Math.min(1, real / 8);
      if (g.last.unmet > 0.05 * g.last.demand && !tip.blackout) { tip.blackout = 1; log(L("First blackout! Solar is zero at night and the evening peak is the city's biggest demand — you need wind, tides, currents or batteries to cover it.", "¡Primer apagón! El solar es cero de noche y la hora punta de la tarde es la mayor demanda — necesitas viento, mareas, corrientes o baterías."), "bad"); banner(L("Brownout! Demand is higher than supply.", "¡Apagón parcial! La demanda supera la oferta."), "bad"); shake = 0.7; }
      if (g.last.curtailed > 0.5 && !tip.curtail && !g.units.some(u => u.type === "battery")) { tip.curtail = 1; log(L("Tip: surplus power is being WASTED. A battery stores it for the evening peak.", "Consejo: se está DESPERDICIANDO el excedente. Una batería lo guarda para la hora punta."), "warn"); }
      if (g.cash < 10 && !tip.cash) { tip.cash = 1; log(L("Cash is low! Raise the price a little, switch off diesel when you can, or wait for revenue.", "¡Poco efectivo! Sube un poco el precio, apaga el diésel cuando puedas o espera ingresos."), "warn"); }
      if (g.cash >= 25) tip.cash = 0;
    }
    g.units.forEach(u => {
      if (u.cond < 0.4 && !u.warned) { u.warned = 1; log(L(`${INFO[u.type].name} is wearing out (${Math.round(u.cond * 100)}%). Service it before the next storm.`, `${INFO[u.type].name} se está desgastando (${Math.round(u.cond * 100)}%). Revísalo antes de la próxima tormenta.`), "warn"); }
      if (u.cond < 0.2 && !u.broken) { u.broken = 1; log(L(`${INFO[u.type].name} has broken down!`, `¡${INFO[u.type].name} se ha averiado!`), "bad"); }
      if (u.cond > 0.6) { u.warned = 0; u.broken = 0; }
    });
    const w = M.weatherAt(g.W, g.t);
    if (w.Hs > 6 && !seen.storm) { seen.storm = 1; log(L("The storm is here: waves over 6 m, wind past 25 m/s. Turbines are braking to protect themselves.", "La tormenta está aquí: olas de más de 6 m, viento sobre 25 m/s. Las turbinas frenan para protegerse."), "bad"); banner(L("STORM — turbines shutting down", "TORMENTA — las turbinas se detienen"), "bad"); shake = 1; }
    if (seen.storm && !seen.stormEnd && w.Hs < 3.5 && w.hod > 12 && Math.floor(g.t / 24) === 3) { seen.stormEnd = 1; const dam = g.units.filter(u => u.cond < 0.5).length; log(dam ? L(`Storm over. ${dam} unit(s) badly damaged — service them now.`, `Tormenta terminada. ${dam} unidad(es) muy dañada(s) — revísalas ahora.`) : L("Storm over. Your units came through well — maintenance paid off.", "Tormenta terminada. Tus unidades salieron bien — el mantenimiento valió la pena."), dam ? "warn" : "good"); if (!dam) award("storm", L("Storm-proof", "A prueba de tormentas")); }
    if (Math.floor(g.t / 24) !== dayBefore && !g.over) { log(L(`Day ${dayBefore + 1} report: delivered ${fmt(g.st.delivered)} MWh so far, cash ${money(g.cash)}.`, `Informe del día ${dayBefore + 1}: entregado ${fmt(g.st.delivered)} MWh hasta ahora, efectivo ${money(g.cash)}.`)); openBriefing(); }
    if (g.over) finish();
  }
  const tickId = setInterval(tick, 100);
  function updateLive() {                       // in-place numbers only: no DOM rebuild, so focus is never lost
    const u = selected && unitAt(selected); if (!u) return; const live = $("og-live"); if (!live) return;
    const T = M.TYPES[u.type], busy = u.busyUntil > g.t, pct = Math.round(u.cond * 100);
    if (!busy && u.cond >= 0.2) live.textContent = u.type === "battery" ? `${fmt(g.battery, 1)} / ${fmt((g.last && g.last.battCap) || 0, 1)} MWh ${L("stored", "almacenado")}` : `${fmt(u.out || 0, 2)} MW ${L("now", "ahora")} (${fmt(((u.out || 0) / T.rated) * 100)}% ${L("of rated", "del nominal")})`;
    const bar = $("og-cond"), ct = $("og-condt");
    if (bar) { bar.firstElementChild.style.width = pct + "%"; bar.className = "og__cond " + (u.cond < 0.2 ? "bad" : u.cond < 0.5 ? "warn" : "good"); }
    if (ct) ct.innerHTML = `${L("Condition", "Estado")}: <b>${pct}%</b> · ${L("output multiplier", "multiplicador de salida")} ×${fmt(M.conditionFactor(u.cond), 2)}`;
  }
  let sideRefresh = 0;

  /* ---------------- HUD update ---------------- */
  function hud() {
    const w = M.weatherAt(g.W, g.t), hod = Math.floor(w.hod), mm = Math.floor((w.hod - hod) * 60);
    $("og-clock").textContent = `${L("Day", "Día")} ${Math.min(M.DAYS, w.day + 1)} · ${String(hod).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    $("og-weather").textContent = `${fmt(w.wind, 0)} m/s · ${fmt(w.Hs, 1)} m ${L("waves", "olas")} · ${M.isPeakHour(w.hod) ? L("evening peak", "hora punta") : ""}`;
    $("og-cash").textContent = money(g.cash); $("og-cash").className = g.cash < 0 ? "bad" : "";
    const s = g.last || M.snapshot(g); const sup = g.last ? g.last.supply : s.ren, dem = s.demand;
    $("og-sd").textContent = `${fmt(sup, 1)} / ${fmt(dem, 1)} MW`; $("og-sd").className = (g.last && g.last.unmet > 0.05 * dem) ? "bad" : "";
    const clean = g.last ? Math.max(0, sup - g.last.dieselMW) : s.ren;
    $("og-mix").textContent = g.last && g.last.dieselMW > 0.05 ? L(`diesel ${fmt(g.last.dieselMW, 1)} MW`, `diésel ${fmt(g.last.dieselMW, 1)} MW`) : (g.last && g.last.discharged > 0.05 ? L("battery discharging", "baterías descargando") : (g.last && g.last.curtailed > 0.2 ? L(`surplus ${fmt(g.last.curtailed, 1)} MW`, `excedente ${fmt(g.last.curtailed, 1)} MW`) : ""));
    $("og-rel").style.width = Math.round(roll * 100) + "%"; $("og-rel").className = roll > 0.97 ? "good" : roll > 0.9 ? "warn" : "bad"; $("og-relt").textContent = Math.round(roll * 100) + "%";
    $("og-net").textContent = g.st.costs.fuel > 0 ? L(`fuel so far ${money(g.st.costs.fuel)}`, `combustible hasta ahora ${money(g.st.costs.fuel)}`) : "";
    updatePriceUI();
  }

  /* ---------------- rendering ---------------- */
  const SERIES = [["wind", "#8fd3ff"], ["solar", "#ffd166"], ["wave", "#ff6b81"], ["tidal", "#2ee6b6"], ["current", "#a394ff"], ["otec", "#ff9f1c"]];
  $("og-legend").innerHTML = SERIES.map(([k, c]) => `<span><i style="background:${c}"></i>${INFO[k].name}</span>`).join("") + `<span><i style="background:#c77dff"></i>${L("Battery", "Batería")}</span><span><i style="background:#8a8f98"></i>${L("Diesel", "Diésel")}</span><span><i class="ln"></i>${L("Demand", "Demanda")}</span>`;
  function drawChart() {
    const day = Math.min(M.DAYS - 1, Math.floor(g.t / 24)), t0 = day * 24, c = cctx; c.clearRect(0, 0, CW, CH);
    const padL = 28, padB = 18, w = CW - padL - 6, h = CH - padB - 6;
    c.fillStyle = "rgba(255,255,255,.05)"; c.fillRect(padL, 4, w, h);
    const rows0 = g.hist.filter(r => r.t > t0 && r.t <= t0 + 24.01);
    const peak = rows0.reduce((m, r) => Math.max(m, r.demand, Object.values(r.by).reduce((a, b) => a + b, 0) + r.batt + r.diesel), 0);
    const step = peak > 24 ? 8 : 4, ymax = Math.min(48, Math.max(16, Math.ceil(peak / step) * step));
    c.strokeStyle = "rgba(255,255,255,.14)"; c.fillStyle = "rgba(255,255,255,.7)"; c.font = "10px system-ui"; c.textAlign = "right";
    for (let v = 0; v <= ymax; v += step) { const y = 4 + h - v / ymax * h; c.beginPath(); c.moveTo(padL, y); c.lineTo(padL + w, y); c.stroke(); c.fillText(v, padL - 4, y + 3); }
    c.textAlign = "center"; for (let hh = 0; hh <= 24; hh += 6) c.fillText(String(hh).padStart(2, "0"), padL + hh / 24 * w, CH - 4);
    // peak band
    c.fillStyle = "rgba(255,160,70,.10)"; c.fillRect(padL + 17 / 24 * w, 4, 5 / 24 * w, h);
    const rows = rows0;
    if (rows.length < 2) return;
    const X = r => padL + (r.t - t0) / 24 * w, Y = v => 4 + h - Math.min(ymax, v) / ymax * h;
    const keys = [...SERIES.map(s => s[0]), "batt", "diesel"], colors = { ...Object.fromEntries(SERIES), batt: "#c77dff", diesel: "#8a8f98" };
    const val = (r, k) => k === "batt" ? r.batt : k === "diesel" ? r.diesel : (r.by[k] || 0);
    const base = rows.map(() => 0);
    keys.forEach(k => {
      c.fillStyle = colors[k]; c.globalAlpha = 0.88; c.beginPath();
      rows.forEach((r, i) => { const y = Y(base[i] + val(r, k)); i ? c.lineTo(X(r), y) : c.moveTo(X(r), y); });
      for (let i = rows.length - 1; i >= 0; i--) c.lineTo(X(rows[i]), Y(base[i]));
      c.closePath(); c.fill(); rows.forEach((r, i) => { base[i] += val(r, k); }); c.globalAlpha = 1;
    });
    c.strokeStyle = "#fff"; c.lineWidth = 2.2; c.beginPath(); rows.forEach((r, i) => { const y = Y(r.demand); i ? c.lineTo(X(r), y) : c.moveTo(X(r), y); }); c.stroke(); c.lineWidth = 1;
    const last = rows[rows.length - 1]; c.fillStyle = "#fff"; c.beginPath(); c.arc(X(last), Y(last.demand), 3.4, 0, 7); c.fill();
  }

  function drawStage(dt) {
    const w = M.weatherAt(g.W, g.t), hod = w.hod, hz = H * 0.36, m = reduced ? 0.3 : 1, time = simClock + performance.now() / 1000 * 0.0;
    const T = performance.now() / 1000;
    ctx.save();
    if (shake > 0 && !reduced) { ctx.translate((Math.random() - .5) * 6 * shake, (Math.random() - .5) * 6 * shake); shake = Math.max(0, shake - dt * 2.4); } else shake = 0;
    A.drawSky(ctx, W, hz, hod, w.cloud, T, reduced);
    A.drawSea(ctx, W, H, hz, hod, w.Hs, w.T, T, reduced, w.wind, 0.8);
    const supplyFrac = g.last ? Math.min(1, g.last.supply / Math.max(0.01, g.last.demand)) : 1;
    A.drawCity(ctx, W, H, hz, hod, over ? 1 : (g.last && g.last.demand > 0 ? supplyFrac : 1), T, reduced);
    const port = { x: W * 0.205, y: H * 0.80 };
    wave.ph += dt * (2 * Math.PI / Math.max(4, w.T)) * 1.4 * m;
    // cables first
    g.units.forEach(u => { const s = M.SITES.find(x => x.id === u.site), p = siteXY(s), T_ = M.TYPES[u.type]; A.drawCable(ctx, p.x, p.y, port.x, port.y, (u.out || 0) / 4, T, T_.accent, reduced); });
    // empty sites + units, back to front
    const order = M.SITES.slice().sort((a, b) => a.y - b.y);
    order.forEach(s => {
      const p = siteXY(s), sc = scaleAt(p.y), u = unitAt(s.id), dark = A.isDark(hod), zc = ZONE_COLOR[s.zone], sel = selected === s.id;
      const bob = A.waveYAt(p.x, p.y, hz, H, w.Hs, w.T, T) * 0.8;
      if (!u) {
        const pulse = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(T * 2.2 + s.x * 9);
        ctx.save(); ctx.translate(p.x, p.y + bob * 0.4); ctx.globalAlpha = sel ? 1 : 0.55 + 0.35 * pulse; ctx.strokeStyle = zc; ctx.lineWidth = sel ? 3 : 2; ctx.setLineDash(sel ? [] : [6, 5]);
        ctx.beginPath(); ctx.ellipse(0, 0, 28 * sc, 10.5 * sc, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = zc; ctx.globalAlpha = (sel ? 0.28 : 0.1 + 0.12 * pulse); ctx.fill(); ctx.globalAlpha = sel ? 1 : 0.9; ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(14 * sc)}px system-ui`; ctx.textAlign = "center"; ctx.fillText("+", 0, 5 * sc); ctx.restore();
        return;
      }
      const T_ = M.TYPES[u.type], f = (u.out || 0) / T_.rated, busy = u.busyUntil > g.t, broken = u.cond < 0.2;
      ctx.save(); if (broken || busy) ctx.globalAlpha = 0.6;
      const y = p.y + bob;
      const wsp = w.wind;
      if (u.type === "wind") { u.ang = (u.ang || 0) + (f > 0.005 ? Math.min(1.9, 0.3 + f * 1.7) : (w.wind > 3 && w.wind < 25 && !broken && !busy ? 0.15 : 0)) * dt * 2.4 * m; A.drawWind(ctx, p.x, y, sc * 0.82, u.ang, Math.min(1, f * 3), dark); }
      else if (u.type === "solar") A.drawSolar(ctx, p.x, y, sc * 0.95, w.sun * (1 - 0.7 * w.cloud), dark);
      else if (u.type === "wave") A.drawWaveDevice(ctx, p.x, y - 2 * sc, sc * 0.9, wave.ph + s.x * 6, Math.min(26, 4 + w.Hs * 3.6) * sc * 0.65, dark);
      else if (u.type === "tidal") { const dir = Math.sin(2 * Math.PI * (g.t + 2.5) / 12.42) >= 0 ? 1 : -1; u.ang = (u.ang || 0) + w.tide * 0.8 * dt * 2.6 * dir * m; A.drawTidal(ctx, p.x, y, sc * 0.78, u.ang, dir, dark); }
      else if (u.type === "current") { u.ang = (u.ang || 0) + w.current * 0.5 * dt * 2.4 * m; A.drawCurrentTurbine(ctx, p.x, y, sc * 0.82, u.ang, dark); }
      else if (u.type === "otec") A.drawOtec(ctx, p.x, y, sc * 0.82, T, dark);
      else if (u.type === "battery") A.drawBattery(ctx, p.x, p.y, sc * 1.05, g.last && g.last.battCap ? g.battery / g.last.battCap : 0, dark);
      ctx.restore();
      // overhead: condition pip + output
      const hy = p.y - (u.type === "wind" ? 100 : u.type === "tidal" ? 52 : u.type === "otec" ? 44 : u.type === "battery" ? 34 : 24) * sc * 0.82 - 6;
      const bw = 34 * sc, cx = p.x - bw / 2; ctx.fillStyle = "rgba(4,16,30,.7)"; A.roundRect(ctx, cx - 2, hy - 2, bw + 4, 7 * sc + 4, 3); ctx.fill();
      ctx.fillStyle = u.cond < 0.2 ? "#ff5d5d" : u.cond < 0.5 ? "#ffb347" : "#58e08d"; ctx.fillRect(cx, hy, bw * u.cond, 7 * sc);
      if (busy) { ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.round(10 * sc + 2)}px system-ui`; ctx.textAlign = "center"; ctx.fillText("🔧 " + L("service", "revisión"), p.x, hy - 4); }
      else if (broken) { ctx.fillStyle = "#ff8a8a"; ctx.font = `800 ${Math.round(10 * sc + 2)}px system-ui`; ctx.textAlign = "center"; ctx.fillText(L("OFFLINE", "FUERA DE LÍNEA"), p.x, hy - 4); }
      else if (u.type !== "battery" && w.wind > 25 && u.type === "wind") { ctx.fillStyle = "#ffd166"; ctx.font = `700 ${Math.round(10 * sc + 2)}px system-ui`; ctx.textAlign = "center"; ctx.fillText(L("braking", "frenando"), p.x, hy - 4); }
      if (sel) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 34 * sc, 12 * sc, 0, 0, 7); ctx.stroke(); }
      // coins flying to town when a unit is producing
      if (!reduced && u.out > 0.05 && Math.random() < dt * u.out * 0.9) coins.push({ x: p.x, y: p.y - 10, tx: port.x, ty: port.y - 20, t: 0, c: T_.accent });
    });
    // coins
    for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; c.t += dt * 0.7; if (c.t >= 1) { coins.splice(i, 1); continue; } const k = c.t, x = A.util.mix(c.x, c.tx, k), y = A.util.mix(c.y, c.ty, k) - Math.sin(k * Math.PI) * 38; ctx.fillStyle = c.c; ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    // rain in storms (steady streaks — never flashing)
    if (w.cloud > 0.7 && !reduced) { const n = Math.round((w.cloud - 0.6) * 160); ctx.strokeStyle = "rgba(200,220,255,.4)"; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < n; i++) { if (!rain[i]) rain[i] = { x: Math.random(), y: Math.random() }; const r = rain[i]; r.y += dt * 1.6; r.x -= dt * 0.35; if (r.y > 1) { r.y = 0; r.x = Math.random() * 1.3; } const x = r.x * W, y = r.y * H; ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 14); } ctx.stroke(); }
    // storm vignette
    if (w.Hs > 5) { const a = Math.min(0.35, (w.Hs - 5) / 10); const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); vg.addColorStop(0, "rgba(10,18,40,0)"); vg.addColorStop(1, `rgba(10,18,40,${a})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
    // hud text on stage
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = `700 ${Math.round(W * 0.016)}px system-ui`; ctx.textAlign = "left"; ctx.fillText("Harbour Isle", W * 0.014, H * 0.06);
    ctx.restore();
    // particles + floaters
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.vy += 170 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.min(1, p.life * 1.4); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.life -= dt; if (f.life <= 0) { floaters.splice(i, 1); continue; } if (f.ring) { const k = 1 - f.life / 0.7; ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + k * 40, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; } else { f.y -= 28 * dt; ctx.globalAlpha = Math.min(1, f.life); ctx.font = `800 ${Math.round(W * 0.017)}px system-ui`; ctx.textAlign = "center"; ctx.strokeStyle = "rgba(0,20,40,.7)"; ctx.lineWidth = 4; ctx.strokeText(f.txt, f.x, f.y); ctx.fillStyle = f.color; ctx.fillText(f.txt, f.x, f.y); ctx.globalAlpha = 1; } }
    if (paused && !modalOpen && !over) { ctx.fillStyle = "rgba(4,14,30,.45)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(W * 0.04)}px system-ui`; ctx.textAlign = "center"; ctx.fillText("⏸ " + L("Paused — plan your build", "En pausa — planifica tu obra"), W / 2, H / 2); }
  }

  let last = performance.now(), raf = 0, hudT = 0;
  function frame(now) {
    if (destroyed || !root.isConnected) { clearInterval(tickId); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    drawStage(dt); drawChart();
    hudT += dt; if (hudT > 0.12) { hudT = 0; hud(); }
    sideRefresh += dt; if (sideRefresh > 0.5) { sideRefresh = 0; paintSites(); if (sideSig() !== sideSigLast) paintSide(); else updateLive(); }
    const b = $("og-banner"); if (bannerT && performance.now() > bannerT) { b.classList.remove("is-on"); bannerT = 0; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  paintSide(); paintSites(); updatePriceUI(); openBriefing();
  return { destroy() { destroyed = true; clearInterval(tickId); cancelAnimationFrame(raf); ro.disconnect(); }, state: () => g };
}
