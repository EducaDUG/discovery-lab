/* Grid Commander - physics, economy and missions (no DOM, no Three.js).
   Ported from the supplied "Thermodynamics & Energy Grid Digital Twin" (React/TypeScript, AI Studio).
   Kept from the source: the six facility types and their numbers, the demand/solar/wind curves, the
   pumped-hydro and battery dispatch rules, grid frequency = 60 + (supply - demand)/280, the First-Law
   bookkeeping (primary input = electricity + heat losses) and the three scenario briefs.
   Changed so that it plays properly (documented in CLAUDE.md 12.13):
     - time is a float in sim-minutes (the source floored the minute and the clock stalled at 1x);
     - wear, water and money run on sim-hours, so a day really wears a turbine a little;
     - the battery has a real state of charge (it was bottomless in the source);
     - hydro gets a mode (auto / pump now / save water) so the evening peak is a decision;
     - gas costs money in proportion to the commodity price, plus a carbon tax, so the price shock bites;
     - missions are actually scored (the source only switched the gas price). */

export const FRAME = { dayMin: 1440 };

export const CATALOG = {
  pumped_hydro: { type: "pumped_hydro", name: "Pumped Hydro Powerhouse", short: "Pumped hydro", cat: "storage", energyType: "storage", form: "Gravitational potential (Ep = mgh)", cap: 65000, op: 45, mw: 120, eff: 0.82, wear: 0.015, elev: [0, 10], zone: "valley", color: 0x38bdf8, photo: "hydro", desc: "Stores energy as height: surplus electricity pumps water up to the alpine lake, and releasing it through turbines delivers power in seconds." },
  solar_pv: { type: "solar_pv", name: "Bifacial Solar PV Farm", short: "Solar farm", cat: "flow", energyType: "primary", form: "Radiant (photons)", cap: 35000, op: 18, mw: 80, eff: 0.23, wear: 0.008, elev: [3, 14], zone: "plateau", color: 0xfacc15, photo: "solar", desc: "Turns sunlight straight into electricity (photovoltaic effect). Free fuel, but it sleeps at night and fades under cloud." },
  wind_turbine: { type: "wind_turbine", name: "Wind Turbine Array", short: "Wind turbines", cat: "flow", energyType: "primary", form: "Kinetic (moving air)", cap: 45000, op: 25, mw: 90, eff: 0.45, wear: 0.02, elev: [8, 20], zone: "ridge", color: 0x5eead4, photo: "wind", desc: "Captures the kinetic energy of wind, P = 0.5 x density x area x v cubed, capped by the Betz limit (59.3%). Switches off above 25 m/s." },
  gas_peaker: { type: "gas_peaker", name: "Open-Cycle Gas Peaker", short: "Gas peaker", cat: "fossil", energyType: "primary", form: "Chemical (fuel)", cap: 30000, op: 90, mw: 110, eff: 0.38, wear: 0.035, elev: [0, 6], zone: "valley", color: 0xfb923c, photo: "gas", desc: "Burns a depletable fossil fuel: chemical to thermal to kinetic to electricity. Fast to start, but it pays fuel and carbon prices and pushes CO2 into the air." },
  battery_bess: { type: "battery_bess", name: "Lithium Battery Park (BESS)", short: "Battery park", cat: "storage", energyType: "storage", form: "Electrochemical", cap: 48000, op: 30, mw: 60, eff: 0.91, wear: 0.028, elev: [0, 12], zone: "plateau", color: 0xa78bfa, photo: "battery", desc: "Stores electricity chemically and answers in a fraction of a second, ideal for frequency control. It holds only a couple of hours of energy." },
  geothermal: { type: "geothermal", name: "Deep Geothermal Plant", short: "Geothermal", cat: "flow", energyType: "primary", form: "Thermal (Earth's heat)", cap: 70000, op: 38, mw: 75, eff: 0.31, wear: 0.012, elev: [0, 8], zone: "valley", color: 0xf87171, photo: "geo", desc: "Taps heat from deep underground to make steam for a turbine. Steady baseload, day and night, whatever the weather." },
};
export const TYPES = Object.keys(CATALOG);

/* ---------- environment curves (from the source) ---------- */
export function demandAt(t) {
  const h = (t % 1440) / 60;
  const m = 65 * Math.exp(-Math.pow((h - 8.5) / 2.2, 2));
  const e = 110 * Math.exp(-Math.pow((h - 19.5) / 2.5, 2));
  const mid = 40 * Math.sin(Math.PI * Math.max(0, Math.min(1, (h - 6) / 12)));
  return Math.round(140 + m + e + mid + Math.sin(h * 14) * 4);
}
export function sunAt(t) {
  const h = (t % 1440) / 60;
  if (h < 5.8 || h > 19.2) return 0;
  const n = (h - 5.8) / 13.4;
  return Math.max(0, Math.min(100, Math.round(Math.sin(n * Math.PI) * 98 + Math.sin(h * 3) * 2)));
}
export function windAt(t, storm) {
  const x = t / 60;
  if (storm) return Math.max(9, Math.min(29, +(19 + 6 * Math.sin(x * 1.3) + 3.2 * Math.cos(x * 3.1)).toFixed(1)));
  return Math.max(1.5, Math.min(24, +(8.5 + 3.5 * Math.sin(x * 0.9) + 1.8 * Math.cos(x * 2.4)).toFixed(1)));
}
export function cloudAt(t, storm) { const d = t / 1440; return Math.max(0, Math.min(1, storm ? 0.7 + 0.25 * Math.sin(d * 31) : 0.18 + 0.2 * Math.sin(d * 11.3 + 1) + 0.12 * Math.sin(d * 37))); }

/* ---------- terrain (heights shared with the 3D scene) ---------- */
export function terrainHeight(x, z) {
  const md = Math.hypot(x + 12, z + 12); let mh = Math.max(0, 16 - md * 1.05);
  const ul = Math.hypot(x + 14, z + 8); if (ul < 4.5) mh = Math.max(7.4, mh - (4.5 - ul) * 1.8);
  const pd = Math.hypot(x - 12, z + 10); const ph = pd < 6 ? 4.6 : Math.max(0, 4.6 - (pd - 6) * 0.7);
  let vh = 1.2; if (pd >= 6) vh += Math.sin(x * 0.15) * 0.4;
  const ll = Math.hypot(x + 2, z - 8); if (ll < 5) vh = Math.max(0.1, vh - (5 - ll) * 0.3);
  return Math.max(0.4, mh + ph + vh);
}

export function newFacility(type, pos, id, name) {
  const c = CATALOG[type];
  return { id: id || `${type}-${Math.floor(Math.random() * 1e6)}`, type, name: name || c.name, pos: pos.slice(), rot: Math.random() * 6.28, status: "active", cap: c.mw, out: 0, eff: c.eff, wear: 0, hours: 0, heat: 0, health: 100 };
}

export function createState() {
  const S = createState0(); S.facs.forEach(f => { f.pos[1] = terrainHeight(f.pos[0], f.pos[2]); }); S.units.forEach(u => { u.home[1] = Math.max(u.home[1], terrainHeight(u.home[0], u.home[2]) + 1.2); u.pos = u.home.slice(); }); return S;
}
function createState0() {
  const f = (type, pos, rot, wear, id, name, cap) => { const x = newFacility(type, pos, id, name); if (cap) x.cap = cap; x.rot = rot; x.wear = wear; x.health = Math.round(100 - wear); return x; };
  return {
    t: 10.5 * 60, speed: 1, pump: false, hydroMode: "auto", throttle: 0.45, stormMode: false, shock: false,
    facs: [
      f("pumped_hydro", [-8, 2, 2], -0.6, 12, "hydro-alpha", "Eagle Peak Pumped Hydro"),
      f("solar_pv", [12, 5.8, -10], 0, 8, "solar-alpha", "Suncrest Solar Park"),
      f("wind_turbine", [-14, 11.2, -14], 0.5, 15, "wind-alpha", "Ridgecrest Wind Alpha", 45),
      f("wind_turbine", [-8, 12, -18], 0.2, 18, "wind-beta", "Ridgecrest Wind Beta", 45),
      f("gas_peaker", [14, 1.2, 8], -0.4, 22, "gas-alpha", "Valley Gas Peaker", 90),
      f("battery_bess", [4, 1.8, 4], 0, 10, "bess-alpha", "GridCore Battery Park"),
    ],
    units: [
      { id: "drone-01", kind: "drone", name: "AeroScout Drone", state: "docked", pos: [0, 2.5, 0], home: [0, 2.5, 0], target: null, fid: null, speed: 14, prog: 0 },
      { id: "van-01", kind: "van", name: "Utility Crew Van", state: "docked", pos: [2, 1.2, 1], home: [2, 1.2, 1], target: null, fid: null, speed: 7, prog: 0 },
    ],
    stored: 306, bess: 62, cash: 125000, gasPrice: 4.8, carbonTax: 35,
    tel: null, alerts: [], hist: [], co2: 0, repairs: 0, xp: 0, units_done: 0,
    mission: null, medals: {}, lastBand: 0, streak: 0, bestStreak: 0, events: [],
  };
}
export const HYDRO_CAP_MWH = 500, BESS_CAP_MWH = 120;

/* ---------- missions ---------- */
export const MISSIONS = {
  duck: { id: "duck", name: "The Duck Curve Ramp", diff: "Standard", start: 6 * 60, dur: 15 * 60, reward: 45000,
    brief: "Midday solar floods the grid, then the sun sets just as everyone gets home. Bank the surplus as water up the mountain, then release it for the 18:00 to 21:00 peak.",
    tip: "Build extra solar (it pays back fast), turn the gas peaker down at midday so the surplus pumps water uphill, set hydro to Save water in the morning and early evening, then switch to Auto and raise the gas for the 18:00 peak.",
    targets: [
      { key: "store", label: "Store 150 MWh or more in the upper reservoir", test: m => m.maxStored >= 150, prog: m => `best ${m.maxStored.toFixed(0)} / 150 MWh` },
      { key: "peak", label: "Meet the evening peak (18:00 to 21:00) with under 30 minutes of shortfall", test: m => m.eveShort < 30, prog: m => `${m.eveShort.toFixed(0)} min short` },
      { key: "band", label: "Keep frequency between 59.8 and 60.2 Hz for 90% of the mission", test: m => m.total > 0 && m.band / m.total >= 0.9, prog: m => `${m.total ? (100 * m.band / m.total).toFixed(0) : 100}% in band` },
    ] },
  shock: { id: "shock", name: "Fossil Commodity Shock", diff: "Challenging", start: 8 * 60, dur: 10 * 60, reward: 60000,
    brief: "Gas jumps to $18.40 per MMBtu. Every MWh from the peaker now costs more to make than it sells for. Build clean supply and turn the peaker down without causing a brownout.",
    tip: "Geothermal runs 24/7 whatever the weather. Add some, then cut the gas throttle to a trickle and watch your cash flow turn green.",
    targets: [
      { key: "cash", label: "Earn an average operating profit of $5k or more per hour", test: m => m.hours > 0 && m.netSum / m.hours >= 5000, prog: m => `$${m.hours ? (m.netSum / m.hours / 1000).toFixed(1) : 0}k per hour` },
      { key: "gas", label: "Keep gas under 15% of the energy you supply", test: m => m.energy > 0 && m.gasE / m.energy < 0.15, prog: m => `gas ${m.energy ? (100 * m.gasE / m.energy).toFixed(0) : 0}%` },
      { key: "clean", label: "Reach 250 MW or more of clean power at one moment", test: m => m.peakClean >= 250, prog: m => `peak ${m.peakClean.toFixed(0)} / 250 MW` },
    ] },
  storm: { id: "storm", name: "100-Year Alpine Storm", diff: "Expert", start: 12 * 60, dur: 12 * 60, reward: 85000,
    brief: "Violent gusts shake the ridge: the turbines wear fast and switch themselves off above 25 m/s. Keep your machines alive and the city powered.",
    tip: "Watch the health rings. Send the drone (fast) and the crew van (slow) to the worst turbine before it drops under 30%.",
    targets: [
      { key: "health", label: "Never let any facility fall below 30% health", test: m => m.minHealth >= 30, prog: m => `lowest ${m.minHealth.toFixed(0)}%` },
      { key: "repairs", label: "Complete 3 or more repairs with the drone or crew van", test: m => m.repairs >= 3, prog: m => `${m.repairs} / 3 repairs` },
      { key: "dark", label: "Have no blackout minutes (frequency under 59.5 Hz)", test: m => m.dark === 0, prog: m => `${m.dark.toFixed(0)} min dark` },
    ] },
};
export const RANKS = [[0, "Trainee Operator"], [150, "Grid Operator"], [350, "Senior Dispatcher"], [600, "Grid Commander"]];
export const rankOf = xp => RANKS.reduce((r, x) => (xp >= x[0] ? x[1] : r), RANKS[0][1]);

export function startMission(S, id) {
  const M = MISSIONS[id]; if (!M) return;
  S.t = M.start; S.speed = 2;
  S.stormMode = id === "storm"; S.shock = id === "shock"; S.gasPrice = S.shock ? 18.4 : 4.8;
  if (id === "duck") { S.stored = 110; S.bess = 25; S.throttle = 0.45; S.hydroMode = "auto"; S.pump = false; }
  if (id === "shock") { S.stored = 200; S.bess = 60; S.throttle = 0.6; S.hydroMode = "auto"; S.pump = false; }
  if (id === "storm") { S.stored = 280; S.bess = 80; S.throttle = 0.3; S.hydroMode = "auto"; S.pump = false; S.facs.forEach(f => { if (f.type === "wind_turbine") { f.wear = Math.max(f.wear, 22); } }); }
  S.mission = { id, t0: M.start, elapsed: 0, done: false, stars: 0, m: { maxStored: S.stored, eveShort: 0, band: 0, total: 0, cash0: S.cash, cashNow: S.cash, netSum: 0, hours: 0, gasE: 0, energy: 0, peakClean: 0, minHealth: 100, repairs: 0, dark: 0 } };
  S.alerts.unshift({ id: "m-" + Date.now(), type: "info", title: "Mission started: " + M.name, msg: M.tip });
}
export function missionEval(S) {
  const M = MISSIONS[S.mission.id], m = S.mission.m;
  return M.targets.map(t => ({ key: t.key, label: t.label, ok: !!t.test(m), prog: t.prog(m) }));
}

/* ---------- one simulation step ---------- */
export function tick(S, dtReal) {
  if (S.speed === 0) return [];
  const evs = [], dmin = dtReal * S.speed, dh = dmin / 60;
  S.t += dmin;
  const hour = Math.floor((S.t % 1440) / 60), minute = Math.floor(S.t % 60), day = Math.floor(S.t / 1440) + 1;
  const sun = Math.round(sunAt(S.t) * (1 - 0.7 * cloudAt(S.t, S.stormMode)));
  const wind = windAt(S.t, S.stormMode), temp = +(16 + 12 * Math.sin(((S.t % 1440) / 1440 - 0.25) * 2 * Math.PI)).toFixed(1);
  const demand = demandAt(S.t);
  S.gasPrice = S.shock ? 18.4 : +(4.5 + 0.8 * Math.sin(day + (S.t % 1440) / 360)).toFixed(2);

  let renewGen = 0, fossilGen = 0, heat = 0, primary = 0;
  S.facs.forEach(f => {
    const c = CATALOG[f.type];
    if (f.wear >= 98) f.status = "broken";
    if (f.status === "active" || f.status === "pumping" || f.status === "idle") {
      const k = f.type === "wind_turbine" && S.stormMode ? 25 : 1;
      f.wear = Math.min(100, f.wear + c.wear * 40 * dh * k); f.hours += dh;
    }
    f.health = Math.max(0, Math.round(100 - f.wear));
    const wf = Math.max(0.2, 1 - (f.wear / 100) * 0.4);
    let out = 0, pin = 0;
    if (f.status === "broken" || f.status === "maintenance") out = 0;
    else if (f.type === "solar_pv") { out = +(f.cap * (sun / 100) * wf).toFixed(1); }
    else if (f.type === "wind_turbine") {
      let w = 0; if (wind >= 3 && wind <= 12) w = Math.pow((wind - 3) / 9, 2.5); else if (wind > 12 && wind <= 25) w = 1;
      out = +(f.cap * w * wf).toFixed(1);
    } else if (f.type === "gas_peaker") out = +(f.cap * S.throttle * wf).toFixed(1);
    else if (f.type === "geothermal") out = +(f.cap * 0.95 * wf).toFixed(1);
    if (["solar_pv", "wind_turbine", "geothermal", "gas_peaker"].includes(f.type)) {
      pin = out > 0 ? out / c.eff : 0; heat += Math.max(0, pin - out);
      if (f.type === "gas_peaker") fossilGen += out; else renewGen += out;
    }
    primary += pin; f.out = out; f.heat = +Math.max(0, pin - out).toFixed(1); f.eff = +(c.eff * wf).toFixed(2);
    if (["solar_pv", "wind_turbine", "geothermal", "gas_peaker"].includes(f.type)) f.status = f.status === "broken" || f.status === "maintenance" ? f.status : (out > 0 ? "active" : "idle");
  });
  const base = renewGen + fossilGen, surplus0 = demand - base;

  /* pumped hydro */
  let hydro = 0, flow = 0; const h = S.facs.find(f => f.type === "pumped_hydro");
  if (h && h.status !== "broken" && h.status !== "maintenance") {
    const excess = surplus0 < -15;
    const pumpNow = S.pump || S.hydroMode === "pump" || (excess && S.stored < HYDRO_CAP_MWH - 10);
    if (pumpNow && S.stored < HYDRO_CAP_MWH - 2) {
      const p = S.pump || S.hydroMode === "pump" ? h.cap * 0.85 : Math.min(h.cap * 0.85, Math.max(1, -surplus0 - 12));
      hydro = -p; h.status = "pumping"; h.out = -p; flow = -Math.round(p * 0.45);
      S.stored = Math.min(HYDRO_CAP_MWH, S.stored + p * dh * h.eff); heat += p * (1 - h.eff); primary += p;
    } else if (surplus0 > 5 && S.stored > 5 && S.hydroMode !== "save") {
      const g = Math.min(h.cap, surplus0); hydro = +g.toFixed(1); h.status = "active"; h.out = hydro; flow = Math.round(g * 0.52);
      S.stored = Math.max(0, S.stored - (g / h.eff) * dh); heat += g / h.eff - g; primary += g / h.eff;
    } else { h.status = "idle"; h.out = 0; }
  }

  /* battery with a real state of charge */
  let batt = 0; const b = S.facs.find(f => f.type === "battery_bess");
  const rem = demand - (base + Math.max(0, hydro) + Math.min(0, hydro) * 0);
  const remDef = demand - (base + hydro);
  if (b && b.status !== "broken" && b.status !== "maintenance") {
    if (remDef > 5 && S.bess > 1) {
      const d = Math.min(b.cap, remDef, S.bess / Math.max(dh, 1e-6)); batt = +d.toFixed(1); b.out = batt; b.status = "active";
      S.bess = Math.max(0, S.bess - (d / b.eff) * dh); heat += d * (1 - b.eff); primary += d / b.eff;
    } else if (remDef < -10 && S.bess < BESS_CAP_MWH - 0.5) {
      const ch = Math.min(b.cap * 0.6, Math.abs(remDef), (BESS_CAP_MWH - S.bess) / Math.max(dh, 1e-6));
      batt = -ch; b.out = -ch; b.status = "pumping"; S.bess = Math.min(BESS_CAP_MWH, S.bess + ch * dh * b.eff); heat += ch * 0.08; primary += ch;
    } else { b.out = 0; b.status = "idle"; }
  }

  const gen = +(base + Math.max(0, hydro) + Math.max(0, batt)).toFixed(1);
  const charging = +(Math.max(0, -hydro) + Math.max(0, -batt)).toFixed(1);
  const delivered = gen - charging;
  const fd = (delivered - demand) / 280, hz = +(60 + fd).toFixed(2);
  const stab = +(100 - Math.min(100, Math.abs(fd) * 45)).toFixed(1);
  const outMW = gen, eff = primary > 0 ? +((outMW / primary) * 100).toFixed(1) : 0;
  let price;
  if (hz < 59.85) price = 180 + (59.85 - hz) * 600; else if (charging > 25 && renewGen > demand) price = 12; else price = +(38 + (demand / 300) * 35).toFixed(2);
  const basePrice = 38 + (demand / 300) * 35, sold = Math.max(0, Math.min(demand, delivered)), unserved = Math.max(0, demand - delivered);
  const gasF = S.facs.filter(f => f.type === "gas_peaker");
  const gasMW = gasF.reduce((s, f) => s + f.out, 0), tonnes = gasMW * 0.45;
  const fuelCost = gasMW * 6.0 * S.gasPrice + tonnes * S.carbonTax;
  const opCost = S.facs.reduce((s, f) => s + CATALOG[f.type].op * 4, 0) + fuelCost + unserved * 120;
  const rev = sold * basePrice, net = rev - opCost;
  S.cash = Math.round(S.cash + net * dh); S.co2 += tonnes * dh;
  const clean = renewGen + Math.max(0, hydro) + Math.max(0, batt);

  S.tel = { day, hour, minute, demand, gen, charging, hz, stab, primary: +primary.toFixed(1), heat: +heat.toFixed(1), eff, price: +price.toFixed(1), rev: Math.round(rev), op: Math.round(opCost), net: Math.round(net), sun, wind, temp, cloud: cloudAt(S.t, S.stormMode), flow, renew: renewGen, fossil: fossilGen, hydro, batt, clean, gasMW, co2rate: +tonnes.toFixed(1),
    mix: { hydro: Math.max(0, hydro), solar: S.facs.filter(f => f.type === "solar_pv").reduce((s, f) => s + f.out, 0), wind: S.facs.filter(f => f.type === "wind_turbine").reduce((s, f) => s + f.out, 0), gas: gasMW, batt: Math.max(0, batt), geo: S.facs.filter(f => f.type === "geothermal").reduce((s, f) => s + f.out, 0) } };

  /* stable-grid streak (gamification) */
  const inBand = Math.abs(hz - 60) <= 0.1;
  if (inBand) { S.streak += dmin; S.bestStreak = Math.max(S.bestStreak, S.streak); S.xpAcc = (S.xpAcc || 0) + dh * (1 + Math.min(4, Math.floor(S.streak / 60))) * 2; if (S.xpAcc >= 1) { const g = Math.floor(S.xpAcc); S.xp += g; S.xpAcc -= g; } }
  else S.streak = 0;

  /* units */
  S.units.forEach(u => {
    const move = (to, step) => { const dx = to[0] - u.pos[0], dy = to[1] - u.pos[1], dz = to[2] - u.pos[2], d = Math.hypot(dx, dy, dz); if (d <= step || d < 0.3) { u.pos = to.slice(); return true; } u.pos = [u.pos[0] + dx / d * step, u.pos[1] + dy / d * step, u.pos[2] + dz / d * step]; return false; };
    if (u.state === "transit" && u.target) { if (move(u.target, u.speed * dtReal * 0.75)) { u.state = "servicing"; u.prog = 0; } }
    else if (u.state === "servicing") {
      u.prog += dtReal * (u.kind === "drone" ? 9 : 6);
      if (u.prog >= 100) {
        const f = S.facs.find(x => x.id === u.fid);
        if (f) { f.wear = Math.max(0, f.wear - (u.kind === "van" ? 80 : 65)); f.health = Math.round(100 - f.wear); if (f.status === "broken") f.status = "active"; S.repairs++; if (S.mission && !S.mission.done) S.mission.m.repairs++; S.xp += 15; evs.push({ type: "repaired", fid: u.fid, unit: u.kind }); }
        u.state = "returning"; u.target = u.home.slice(); u.prog = 100;
      }
    } else if (u.state === "returning") { if (move(u.home, u.speed * dtReal * 0.75)) { u.state = "docked"; u.target = null; u.fid = null; u.prog = 0; } }
  });

  /* alerts */
  const stamp = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const has = k => S.alerts.some(a => a.key === k);
  if (hz < 59.8 && !has("freq")) S.alerts.unshift({ key: "freq", id: "f" + S.t, type: "critical", title: "Frequency drop", msg: `${hz} Hz at ${stamp}: demand is beating supply. Turn up the gas peaker or free some stored energy.`, action: "ramp" });
  if (hz > 60.25 && !has("over")) S.alerts.unshift({ key: "over", id: "o" + S.t, type: "warning", title: "Too much supply", msg: `${hz} Hz at ${stamp}: more supply than demand. Turn the peaker down or pump water uphill.`, action: "pump" });
  const worst = S.facs.filter(f => f.wear > 85 && f.status !== "broken").sort((a, c) => c.wear - a.wear)[0];
  if (worst && !has("w" + worst.id)) S.alerts.unshift({ key: "w" + worst.id, id: "w" + worst.id + S.t, type: "warning", title: "Wear warning", msg: `${worst.name} is at ${Math.round(worst.wear)}% wear. Send a repair unit before it trips.`, fid: worst.id, action: "repair" });
  const broke = S.facs.find(f => f.status === "broken");
  if (broke && !has("b" + broke.id)) { S.alerts.unshift({ key: "b" + broke.id, id: "b" + broke.id + S.t, type: "critical", title: "Facility tripped", msg: `${broke.name} has failed. It makes nothing until it is repaired.`, fid: broke.id, action: "repair" }); evs.push({ type: "tripped", fid: broke.id }); }
  S.alerts = S.alerts.filter(a => !(a.key && a.key.startsWith("w") && !S.facs.find(f => a.fid === f.id && f.wear > 80))).slice(0, 8);
  if (S.hist.length === 0 || S.t - S.hist[S.hist.length - 1].t >= 15) { S.hist.push({ t: S.t, d: demand, g: gen, c: clean }); if (S.hist.length > 96) S.hist.shift(); }

  /* mission bookkeeping */
  if (S.mission && !S.mission.done) {
    const M = MISSIONS[S.mission.id], m = S.mission.m; S.mission.elapsed += dmin;
    m.total += dmin; if (Math.abs(hz - 60) <= 0.2) m.band += dmin;
    m.netSum += net * dh; m.hours += dh; m.maxStored = Math.max(m.maxStored, S.stored); m.cashNow = S.cash; m.peakClean = Math.max(m.peakClean, clean);
    m.gasE += gasMW * dh; m.energy += Math.max(0, gen) * dh; m.minHealth = Math.min(m.minHealth, ...S.facs.map(f => f.health));
    const hh = (S.t % 1440) / 60; if (hh >= 18 && hh < 21 && delivered < demand - 5) m.eveShort += dmin;
    if (hz < 59.5) m.dark += dmin;
    if (S.mission.elapsed >= M.dur) {
      const res = missionEval(S), n = res.filter(r => r.ok).length; S.mission.done = true; S.mission.stars = n; S.mission.res = res;
      const gain = Math.round(M.reward * n / 3); S.cash += gain; const xp = n * 100 + (n === 3 ? 50 : 0); S.xp += xp; S.medals[M.id] = Math.max(S.medals[M.id] || 0, n);
      S.speed = 0; evs.push({ type: "missionDone", id: M.id, stars: n, res, gain, xp });
    }
  }
  return evs;
}

/* find a free, valid spot for a facility type (keyboard / tap-free route) */
export function autoSpot(S, type) {
  const c = CATALOG[type]; let best = null, bs = -1e9;
  for (let i = 0; i < 400; i++) {
    const x = -22 + Math.random() * 44, z = -22 + Math.random() * 44, y = terrainHeight(x, z);
    const v = spotCheck(S, type, x, z); if (!v.ok) continue;
    const sc = -Math.hypot(x, z) * 0.1 + Math.random(); if (sc > bs) { bs = sc; best = [x, y, z]; }
  }
  return best;
}
export function spotCheck(S, type, x, z) {
  const c = CATALOG[type], y = terrainHeight(x, z);
  if (Math.abs(x) > 24 || Math.abs(z) > 24) return { ok: false, y, why: "Outside the island" };
  if (y < c.elev[0] || y > c.elev[1]) return { ok: false, y, why: `${c.short} needs ground between ${c.elev[0]} and ${c.elev[1]} m high (here ${y.toFixed(1)} m)` };
  if (Math.hypot(x + 14, z + 8) < 5 || Math.hypot(x + 2, z - 8) < 5.2) return { ok: false, y, why: "That is a lake" };
  if (S.facs.some(f => Math.hypot(f.pos[0] - x, f.pos[2] - z) < 4)) return { ok: false, y, why: "Too close to another facility" };
  if (Math.hypot(x - 6, z - 17) < 7.5) return { ok: false, y, why: "That is the city" };
  return { ok: true, y };
}
