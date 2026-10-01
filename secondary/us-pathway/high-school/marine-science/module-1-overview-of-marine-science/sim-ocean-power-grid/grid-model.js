/* ==========================================================================
   OCEAN POWER GRID — PURE MODEL   (no DOM; importable from Node for tuning)

   Real physics, simplified for a classroom:
   - Wind and marine-current turbines:  P = 1/2 * rho * A * v^3 * Cp
       (rho_air = 1.225 kg/m3, rho_seawater = 1025 kg/m3 - water is ~800x denser,
        so a slow current carries huge power. Cp ~0.42 is a realistic fraction of
        the Betz limit of 0.593.)  Power is capped at the turbine's rated power and
        is zero below cut-in speed and above cut-out speed (protective shutdown).
   - Waves: deep-water energy flux per metre of wave crest
       P = rho * g^2 * H^2 * T / (64*pi)  ~ 0.49 * H^2 * T   kW per metre
       (H = significant wave height in m, T = period in s). A device only captures
       a fraction of that over its effective width.
   - Tides: flow speed follows |sin| with the tidal period (12.42 h), so the output
       is large, predictable, and passes through zero at slack water.
   - Energy: kWh = kW x hours. A home uses ~30 kWh per day.
   Costs are game-scaled (real ratios between technologies, smaller absolute
   numbers) so a round of a few in-game days can pay a build back.
   ========================================================================== */

export const RHO_AIR = 1.225;
export const RHO_SEA = 1025;
export const HOME_KWH_DAY = 30;           // typical home, kWh per day
export const AFFORD_BILL = 150;           // what an average household can pay per month, $
export const BASE_PRICE = 0.15;           // $/kWh reference price
export const DIESEL_FUEL = 0.40;          // $ per kWh of emergency diesel
export const DIESEL_CO2 = 0.75;           // kg CO2 per kWh of diesel
export const DIESEL_CAP_MW = 3.5;
export const DAYS = 6;
export const START_CASH = 140;            // $ thousand
export const HOMES = 6000;
export const AVG_DEMAND_MW = HOMES * HOME_KWH_DAY / 24 / 1000;   // = 7.5 MW

/* ---------- pure power curves (used by the bench AND the game) ---------- */
export const WIND = { rated: 6, D: 130, cp: 0.42, cutIn: 3, cutOut: 25 };
export const TIDAL = { rated: 3, A: 380, cp: 0.42, cutIn: 0.8, vmax: 3.3 };
export const CURRENT = { rated: 3, A: 1900, cp: 0.42, cutIn: 0.5 };
export const WAVE = { rated: 1.5, width: 27, survival: 7, cutIn: 0.5 };

export function windPowerKW(v, cfg = WIND) {
  if (v < cfg.cutIn || v > cfg.cutOut) return 0;
  const A = Math.PI * (cfg.D / 2) ** 2;
  return Math.min(cfg.rated * 1000, 0.5 * RHO_AIR * A * v ** 3 * cfg.cp / 1000);
}
export function windRawKW(v, cfg = WIND) {
  const A = Math.PI * (cfg.D / 2) ** 2;
  return 0.5 * RHO_AIR * A * v ** 3 * cfg.cp / 1000;
}
export function marinePowerKW(v, cfg) {
  if (v < cfg.cutIn) return 0;
  return Math.min(cfg.rated * 1000, 0.5 * RHO_SEA * cfg.A * v ** 3 * cfg.cp / 1000);
}
export function marineRawKW(v, cfg) { return 0.5 * RHO_SEA * cfg.A * v ** 3 * cfg.cp / 1000; }
export function waveFluxKWperM(H, T) { return 0.49 * H * H * T; }
export function wavePowerKW(H, T, cfg = WAVE) {
  if (H < cfg.cutIn || H > cfg.survival) return 0;
  return Math.min(cfg.rated * 1000, waveFluxKWperM(H, T) * cfg.width);
}
export function wavePeriodFor(H) { return 4.5 + 1.1 * H; }

/* ---------- technologies ---------- */
export const TYPES = {
  wind:    { key: "wind",    rated: 6,   capex: 42, om: 0.9, decay: 0.05, ready: "mature",   sites: ["shelf"], color: "#e8f1f7", accent: "#5fb6e8" },
  solar:   { key: "solar",   rated: 3,   capex: 14, om: 0.25, decay: 0.03, ready: "mature",  sites: ["bay"],   color: "#ffd166", accent: "#ffb703" },
  wave:    { key: "wave",    rated: 1.5, capex: 24, om: 1.3, decay: 0.08, ready: "emerging", sites: ["coast"], color: "#ef476f", accent: "#ff6b81" },
  tidal:   { key: "tidal",   rated: 3,   capex: 40, om: 1.2, decay: 0.06, ready: "early",    sites: ["channel"], color: "#06d6a0", accent: "#2ee6b6" },
  current: { key: "current", rated: 3,   capex: 50, om: 1.4, decay: 0.06, ready: "prototype", sites: ["deep"], color: "#7b6cff", accent: "#a394ff" },
  otec:    { key: "otec",    rated: 4,   capex: 75, om: 2.0, decay: 0.05, ready: "demo",     sites: ["deep"], color: "#ff9f1c", accent: "#ffc14d" },
  battery: { key: "battery", rated: 2,   capex: 16, om: 0.15, decay: 0.02, ready: "mature",  sites: ["pier"], color: "#c77dff", accent: "#e0aaff", mwh: 6 },
};
export const BATT_EFF = 0.94;              // each way -> ~88% round trip
export const TYPE_ORDER = ["wind", "solar", "wave", "tidal", "current", "otec", "battery"];

/* Sites: x,y are fractions of the scene. The 'zone' decides which technologies fit
   (a real siting decision: you can't put a tidal turbine where there is no tidal flow). */
export const SITES = [
  { id: "bay1", zone: "bay", x: 0.27, y: 0.80 }, { id: "bay2", zone: "bay", x: 0.37, y: 0.90 },
  { id: "coast1", zone: "coast", x: 0.30, y: 0.64 }, { id: "coast2", zone: "coast", x: 0.41, y: 0.73 },
  { id: "shelf1", zone: "shelf", x: 0.52, y: 0.52 }, { id: "shelf2", zone: "shelf", x: 0.63, y: 0.58 },
  { id: "shelf3", zone: "shelf", x: 0.74, y: 0.51 }, { id: "shelf4", zone: "shelf", x: 0.84, y: 0.59 },
  { id: "chan1", zone: "channel", x: 0.52, y: 0.80 }, { id: "chan2", zone: "channel", x: 0.62, y: 0.88 },
  { id: "deep1", zone: "deep", x: 0.73, y: 0.74 }, { id: "deep2", zone: "deep", x: 0.85, y: 0.70 }, { id: "deep3", zone: "deep", x: 0.90, y: 0.86 },
  { id: "pier1", zone: "pier", x: 0.115, y: 0.80 }, { id: "pier2", zone: "pier", x: 0.175, y: 0.91 },
];
export const ZONE_NAMES = {
  bay: ["Sheltered bay", "Bahía protegida"], coast: ["Exposed coast", "Costa expuesta"], shelf: ["Windy shelf", "Plataforma ventosa"],
  channel: ["Tidal channel", "Canal de marea"], deep: ["Deep open ocean", "Océano profundo"], pier: ["Harbour pier", "Muelle del puerto"],
};
export function allowedTypes(zone) { return TYPE_ORDER.filter(k => TYPES[k].sites.includes(zone)); }

/* ---------- seeded random ---------- */
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- weather: a fixed 6-day story (calm day 2, big storm day 4), with seeded variety ---------- */
export function makeWeather(seed) {
  const r = rng(seed);
  const baseWind = [9 + r() * 2, 4.2 + r() * 1.2, 10.5 + r() * 2, 16.5 + r(), 10 + r() * 2, 12 + r() * 2];
  const cloudBase = [0.15 + r() * .1, 0.6, 0.25, 0.85, 0.3, 0.2];
  const n = DAYS * 24 + 48;
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  const wind = [], cloud = [], Hs = [], T = [];
  let h0 = 1.6;
  for (let h = 0; h < n; h++) {
    const d = Math.min(DAYS - 1, Math.floor(h / 24)), f = (h % 24) / 24;
    const nextBase = baseWind[Math.min(DAYS - 1, d + 1)];
    let v = baseWind[d] * (1 - f * 0.5) + nextBase * f * 0.5 + 1.6 * Math.sin(h / 3.1 + ph[0]) + 1.1 * Math.sin(h / 1.3 + ph[1]);
    if (d === 3) v += 11 * Math.exp(-((h - (3 * 24 + 11)) ** 2) / 26);       // the storm peaks late morning of day 4
    v = Math.max(1.2, v);
    wind.push(v);
    const target = Math.min(9.2, Math.max(0.4, 0.0215 * v * v));
    h0 += (target - h0) * (1 - Math.exp(-1 / 5));                              // waves lag the wind
    Hs.push(h0); T.push(wavePeriodFor(h0));
    cloud.push(Math.min(0.97, Math.max(0, cloudBase[d] + 0.12 * Math.sin(h / 2.3 + ph[2]))));
  }
  return { wind, cloud, Hs, T, n, baseWind };
}
function lerpAt(arr, t) { const i = Math.max(0, Math.min(arr.length - 2, Math.floor(t))); const f = Math.min(1, Math.max(0, t - i)); return arr[i] * (1 - f) + arr[i + 1] * f; }
export function tidalSpeed(t) { return TIDAL.vmax * Math.abs(Math.sin(2 * Math.PI * (t + 2.5) / 12.42)) * (0.9 + 0.1 * Math.cos(2 * Math.PI * t / (24 * 14.77))); }
export function currentSpeed(t) { return 1.7 + 0.15 * Math.sin(t / 17) + 0.05 * Math.sin(t / 3.3); }
export function sunFactor(hourOfDay) { const x = (hourOfDay - 6) / 12; return x <= 0 || x >= 1 ? 0 : Math.pow(Math.sin(Math.PI * x), 1.2); }
export function weatherAt(W, t) {
  const hod = ((t % 24) + 24) % 24;
  return { wind: lerpAt(W.wind, t), Hs: lerpAt(W.Hs, t), T: lerpAt(W.T, t), cloud: lerpAt(W.cloud, t), tide: tidalSpeed(t), current: currentSpeed(t), sun: sunFactor(hod), hod, day: Math.min(DAYS - 1, Math.floor(t / 24)) };
}

/* ---------- demand ---------- */
const RAW_PROFILE = [0.62, 0.58, 0.55, 0.55, 0.58, 0.7, 0.95, 1.15, 1.1, 0.95, 0.9, 0.9, 0.92, 0.9, 0.9, 0.95, 1.1, 1.35, 1.5, 1.5, 1.4, 1.2, 0.95, 0.75];
const PROF_AVG = RAW_PROFILE.reduce((a, b) => a + b, 0) / 24;
export function demandProfile(hod) {
  const i = Math.floor(hod) % 24, j = (i + 1) % 24, f = hod - Math.floor(hod);
  return (RAW_PROFILE[i] * (1 - f) + RAW_PROFILE[j] * f) / PROF_AVG;
}
export function isPeakHour(hod) { return hod >= 17 && hod < 22; }
export function effectivePrice(price, peakPricing, hod) { return price * (peakPricing && isPeakHour(hod) ? 1.3 : 1); }
export function priceDemandMult(p) { return Math.pow(Math.max(0.03, p) / BASE_PRICE, -0.4); }
export function billFor(p) { return HOME_KWH_DAY * priceDemandMult(p) * 30 * p; }
export function collectionRate(p) { const b = billFor(p); return b <= AFFORD_BILL ? 1 : Math.pow(AFFORD_BILL / b, 2); }
export function dayDemandMult(day) { return [1, 1.06, 1, 1.1, 1, 1.03][day] || 1; }

/* ---------- a unit's instantaneous output, MW ---------- */
export function conditionFactor(c) { return c < 0.2 ? 0 : 0.3 + 0.7 * c; }
export function unitOutputMW(u, w) {
  if (u.busyUntil > u.now) return 0;
  const f = conditionFactor(u.cond); if (f === 0) return 0;
  const T = TYPES[u.type]; let mw = 0;
  switch (u.type) {
    case "wind": mw = windPowerKW(w.wind) / 1000; break;
    case "solar": mw = T.rated * w.sun * (1 - 0.7 * w.cloud); break;
    case "wave": mw = wavePowerKW(w.Hs, w.T) / 1000; break;
    case "tidal": mw = marinePowerKW(w.tide, TIDAL) / 1000; break;
    case "current": mw = marinePowerKW(w.current, CURRENT) / 1000; break;
    case "otec": mw = T.rated * (0.9 + 0.03 * Math.sin(w.hod / 3.8)); break;
    default: mw = 0;
  }
  return mw * f;
}
export function unitStress(type, w) {       // extra damage per hour from extreme conditions
  if (type === "wind") return w.wind > 18 ? 0.003 * (w.wind - 18) : 0;
  if (type === "wave") return w.Hs > 4 ? 0.012 * (w.Hs - 4) : 0;
  if (type === "solar") return w.wind > 17 ? 0.0025 * (w.wind - 17) : 0;
  if (type === "tidal" || type === "current") return w.Hs > 6 ? 0.002 * (w.Hs - 6) : 0;
  return 0;
}
export function serviceCost(u) { const T = TYPES[u.type]; return T.capex * 0.18 * (1 - u.cond) + 0.2; }
export const SERVICE_HOURS = 4;
export const CREW_MAX_HS = 3.5;

/* ---------- game state ---------- */
export function newGame(seed = (Date.now() & 0xffff)) {
  const g = {
    seed, W: makeWeather(seed), t: 0, cash: START_CASH, price: BASE_PRICE, peakPricing: false, diesel: true,
    units: [], battery: 0, nextId: 1, over: false, startWorth: 0,
    st: { demand: 0, delivered: 0, unmet: 0, curtailed: 0, revenue: 0, costs: { om: 0, fuel: 0, build: 0, service: 0 }, co2: 0, blackoutHours: 0, byType: {}, dieselMWh: 0, batteryOutMWh: 0, hours: 0, priceSum: 0, collectSum: 0, bonus: 0, serviced: 0, storms: 0 },
    hist: [], events: [], lastHour: -1, flags: {},
  };
  place(g, "shelf1", "wind", true); place(g, "bay1", "solar", true);
  g.startWorth = netWorth(g);
  return g;
}
export function place(g, siteId, type, free = false) {
  const site = SITES.find(s => s.id === siteId); if (!site) return { ok: false, why: "nosite" };
  if (g.units.find(u => u.site === siteId)) return { ok: false, why: "taken" };
  if (!TYPES[type].sites.includes(site.zone)) return { ok: false, why: "zone" };
  const cost = free ? 0 : TYPES[type].capex;
  if (!free && g.cash < cost) return { ok: false, why: "cash", cost };
  g.cash -= cost; g.st.costs.build += cost;
  const u = { id: g.nextId++, site: siteId, type, cond: 1, busyUntil: 0, now: g.t, out: 0, builtAt: g.t };
  g.units.push(u); return { ok: true, unit: u, cost };
}
export function netWorth(g) { return g.cash + g.units.reduce((a, u) => a + TYPES[u.type].capex * 0.6 * (0.5 + 0.5 * u.cond), 0); }
export function service(g, unit) {
  const w = weatherAt(g.W, g.t);
  if (w.Hs > CREW_MAX_HS) return { ok: false, why: "weather" };
  if (unit.busyUntil > g.t) return { ok: false, why: "busy" };
  const cost = serviceCost(unit);
  if (unit.cond > 0.97) return { ok: false, why: "fine" };
  if (g.cash < cost) return { ok: false, why: "cash", cost };
  g.cash -= cost; g.st.costs.service += cost; g.st.serviced++;
  unit.busyUntil = g.t + SERVICE_HOURS; unit.serviceTo = 1;
  return { ok: true, cost };
}
export function snapshot(g) {
  const w = weatherAt(g.W, g.t);
  let ren = 0; const by = {};
  g.units.forEach(u => { u.now = g.t; if (u.type !== "battery") { const mw = unitOutputMW(u, w); u.out = mw; by[u.type] = (by[u.type] || 0) + mw; ren += mw; } });
  const hodPrice = effectivePrice(g.price, g.peakPricing, w.hod);
  const demand = AVG_DEMAND_MW * demandProfile(w.hod) * dayDemandMult(w.day) * priceDemandMult(hodPrice);
  return { w, ren, by, demand, hodPrice };
}

/* advance the simulation by dt hours */
export function advance(g, dt) {
  if (g.over) return;
  const end = DAYS * 24;
  if (g.t + dt >= end) { dt = end - g.t; }
  const w = weatherAt(g.W, g.t);
  const s = snapshot(g);
  // finish servicing
  g.units.forEach(u => { if (u.serviceTo && u.busyUntil <= g.t + dt) { u.cond = 1; u.serviceTo = 0; } });
  // storage + diesel dispatch
  let battCap = 0, battP = 0; g.units.forEach(u => { if (u.type === "battery" && !(u.busyUntil > g.t) && u.cond >= 0.2) { battCap += TYPES.battery.mwh * conditionFactor(u.cond); battP += TYPES.battery.rated * conditionFactor(u.cond); } });
  if (g.battery > battCap) g.battery = battCap;
  let supply = s.ren, surplus = s.ren - s.demand, charged = 0, discharged = 0, dieselMW = 0, curtailed = 0;
  if (surplus > 0) {
    charged = Math.min(surplus, battP, (battCap - g.battery) / dt / BATT_EFF);
    if (charged < 0) charged = 0;
    g.battery += charged * dt * BATT_EFF;
    curtailed = surplus - charged;
  } else {
    let need = -surplus;
    discharged = Math.min(need, battP, g.battery / dt * BATT_EFF);
    if (discharged < 0) discharged = 0;
    g.battery -= discharged * dt / BATT_EFF; if (g.battery < 0) g.battery = 0;
    supply += discharged; need -= discharged;
    if (need > 0 && g.diesel) { dieselMW = Math.min(need, DIESEL_CAP_MW); supply += dieselMW; }
  }
  const delivered = Math.min(s.demand, supply), unmet = Math.max(0, s.demand - supply);
  const collect = collectionRate(s.hodPrice);
  const rev = delivered * dt * s.hodPrice * collect;
  let om = 0; g.units.forEach(u => { om += TYPES[u.type].om / 24 * dt; });
  const fuel = dieselMW * dt * DIESEL_FUEL;
  g.cash += rev - om - fuel;
  if (g.cash < 0) g.cash -= (-g.cash) * 0.0015 * dt;        // overdraft interest, never a hard fail
  // wear
  g.units.forEach(u => { const T = TYPES[u.type]; const stress = unitStress(u.type, w); u.cond = Math.max(0, u.cond - (T.decay * 1.6 / 24 + stress * 1.6 * (1.6 - u.cond)) * dt); });
  // stats
  const st = g.st;
  st.demand += s.demand * dt; st.delivered += delivered * dt; st.unmet += unmet * dt; st.curtailed += curtailed * dt;
  st.revenue += rev; st.costs.om += om; st.costs.fuel += fuel; st.co2 += dieselMW * dt * DIESEL_CO2; st.dieselMWh += dieselMW * dt; st.batteryOutMWh += discharged * dt;
  Object.keys(s.by).forEach(k => { st.byType[k] = (st.byType[k] || 0) + s.by[k] * dt; });
  if (unmet > 0.05 * s.demand) st.blackoutHours += dt;
  st.hours += dt; st.priceSum += s.hodPrice * dt; st.collectSum += collect * dt;
  if (w.Hs > 6 && !g.flags.storm) { g.flags.storm = true; st.storms++; }
  g.last = { ...s, delivered, unmet, curtailed, dieselMW, charged, discharged, collect, supply, battCap, battP };
  g.t += dt;
  if (g.t >= end - 1e-6) g.over = true;
  const hi = Math.floor(g.t * 4);
  if (hi !== g.lastHour) { g.lastHour = hi; g.hist.push({ t: g.t, demand: s.demand, by: { ...s.by }, batt: discharged, diesel: dieselMW, charge: charged }); }
}

/* ---------- scoring (out of 100) ---------- */
export function score(g) {
  const st = g.st;
  const reliability = st.demand > 0 ? st.delivered / st.demand : 1;
  const avgPrice = st.hours ? st.priceSum / st.hours : g.price;
  const collect = st.hours ? st.collectSum / st.hours : 1;
  const oceanMWh = Object.keys(st.byType).reduce((a, k) => a + st.byType[k], 0);
  const cleanShare = Math.min(1, Math.max(0, (st.delivered - st.dieselMWh) / Math.max(1e-6, st.delivered)));
  const worth = netWorth(g);
  const ptsRel = 40 * Math.min(1, Math.max(0, (reliability - 0.7) / 0.29));
  const ptsPrice = 20 * Math.min(1, Math.max(0, (0.35 - avgPrice) / 0.17)) * collect;
  const ptsFin = 20 * Math.min(1, Math.max(0, (worth - 0.6 * g.startWorth) / (0.9 * g.startWorth)));
  const ptsClean = 20 * Math.min(1, cleanShare / 0.7);
  const total = Math.round(ptsRel + ptsPrice + ptsFin + ptsClean);
  return { reliability, avgPrice, collect, cleanShare, oceanMWh, worth, ptsRel, ptsPrice, ptsFin, ptsClean, total, stars: total >= 85 ? 5 : total >= 70 ? 4 : total >= 55 ? 3 : total >= 40 ? 2 : 1 };
}
