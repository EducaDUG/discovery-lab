/* Greenhouse Business Tycoon - pure model (no DOM, no THREE). The scene and HUD only READ this state.
   One "year" = 120 days. A house is 100 m2. Money is in dollars.
   Science kept honest: limiting factors (Blackman), enzyme temperature optimum, greenhouse effect,
   CO2 from burning fuel, transpiration (warmer = thirstier), minerals removed by harvest,
   fertiliser run-off -> eutrophication, pesticide resistance, biological control. */
export const YEAR_DAYS = 120;
export const AREA = 100;
export const CROPS = {
  tomato:  { id: "tomato",  kg: 5.0, days: 20, lo: 21, hi: 27, price: 1.6, col: 0xd63b2a },
  lettuce: { id: "lettuce", kg: 6.0, days: 15, lo: 14, hi: 20, price: 1.15, col: 0x7ad342 },
  pepper:  { id: "pepper",  kg: 4.0, days: 24, lo: 23, hi: 29, price: 2.2, col: 0xf2a516 },
};
export const HOUSES = {
  poly:  { cost: 500,  rent: 2, gain0: 1, gainS: 3, trans: 0.82, loss: 1.7 },
  glass: { cost: 1800, rent: 5, gain0: 3, gainS: 6, trans: 0.92, loss: 1.0 },
};
export const PRICE = { lamp: 0.05, heat: 0.30, co2: 0.004, water: 0.25 };
export const START_CASH = 2500;
export const WAGE = 6;
const CARE = [0.75, 1, 1.05, 1.07];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function rng(seed) { let a = (seed >>> 0) + 0x6D2B79F5; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function weather(day, seed) {
  const a = rng(seed * 1009 + day * 7)(), b = rng(seed * 313 + day * 11)();
  const c = Math.cos(2 * Math.PI * day / YEAR_DAYS);
  return { tOut: 11 - 8 * c + (a - 0.5) * 4, sun: Math.max(0.08, (0.55 - 0.4 * c) * (0.75 + 0.25 * b)) };
}
export function tempFactor(t, C) {
  const cold = Math.max(0, C.lo - 17), hot = C.hi + 13;
  if (t <= cold) return 0; if (t < C.lo) return (t - cold) / (C.lo - cold);
  if (t <= C.hi) return 1; if (t >= hot) return 0; return (hot - t) / (hot - C.hi);
}
export function batchDays(method, crop) { return Math.round(CROPS[crop].days * (method === "organic" ? 1.4 : 1)); }

/* conditions for ONE day under the current settings */
export function dayState(s, w) {
  const H = HOUSES[s.house], C = CROPS[s.crop];
  const passive = w.tOut + H.gain0 + H.gainS * w.sun;
  const heat = s.heat || 0;
  const temp = Math.max(passive, heat), heated = Math.max(0, heat - passive);
  const L = w.sun * H.trans + (s.lamp / 100) * 0.6;
  const fL = Math.min(1, L / 0.8), fT = tempFactor(temp, C);
  const co2Free = Math.min(120, heated * 6), co2 = Math.max(s.co2, 420 + co2Free);
  const fC = 0.4 + 0.6 * Math.min(1, (co2 - 420) / 580);
  const need = clamp(2 + 0.2 * (temp - 10), 2, 6.5);
  const waterlogged = s.water > need * 1.5;
  const fW = Math.min(1, s.water / need) * (waterlogged ? 0.8 : 1);
  const f = { light: fL, temp: fT, co2: fC, water: fW };
  let lim = "light"; for (const k in f) if (f[k] < f[lim] - 1e-9) lim = k;
  const cost = { lamp: s.lamp * PRICE.lamp, heat: heated * H.loss * PRICE.heat, co2: Math.max(0, s.co2 - 420 - co2Free) * PRICE.co2, water: s.water * PRICE.water, rent: H.rent, wages: (s.gardeners || 0) * WAGE };
  cost.total = cost.lamp + cost.heat + cost.co2 + cost.water + cost.rent + cost.wages;
  return { passive, temp, heated, L, co2, co2Free, need, waterlogged, f, g: f[lim], lim, cost };
}

export function newGame(seed = 1, crop = "tomato") {
  return { seed, day: 0, cash: START_CASH, rep: 30, minerals: 70, house: null, crop, method: "inorganic",
    s: { lamp: 0, heat: 0, co2: 420, water: 3, fert: 1 }, batch: null, gardeners: 1, pending: null, sprays: 0, ledger: [], river: 0, news: [], over: false, nb: 0 };
}
export function build(st, house) { if (st.house) return false; st.house = house; st.cash -= HOUSES[house].cost; return true; }
export function cur(st) { const w = weather(st.day, st.seed); return { w, d: dayState({ ...st.s, house: st.house, crop: st.crop, gardeners: st.gardeners || 0 }, w) }; }
export function fertCost(st) { return st.s.fert * (st.method === "organic" ? 20 : 15); }

export function startBatch(st) {
  if (!st.house || st.batch || st.over) return null;
  const days = batchDays(st.method, st.crop); if (st.day + days > YEAR_DAYS) return null;
  const r = rng(st.seed * 97 + st.nb * 13), ev = [];
  const doses = st.s.fert, org = st.method === "organic";
  st.minerals = Math.min(100, st.minerals + doses * (org ? 12 : 20));
  st.cash -= fertCost(st);
  const fM = clamp(st.minerals / 70, 0.35, 1);
  if (!org && doses > 0 && r() < 0.08 * doses) { st.rep = Math.max(0, st.rep - 10); st.river = 1; ev.push({ t: "runoff" }); }
  st.batch = { d: 0, days, sumG: 0, fM, cost: { lamp: 0, heat: 0, co2: 0, water: 0, rent: 0, wages: 0 }, labour: 0, fert: fertCost(st),
    pestAt: (st.nb === 0 || r() < 0.8) ? Math.floor(days * 0.4) : -1, stormAt: (st.house === "poly" && r() < 0.4) ? Math.floor(days * 0.6) : -1,
    pest: null, loss: { pest: 0, frost: 0, storm: 0 }, lim: { light: 0, temp: 0, co2: 0, water: 0 } };
  st.nb++; return ev;
}
export function stepDay(st) {
  const b = st.batch, ev = []; if (!b) return ev;
  const { w, d } = cur(st);
  b.sumG += d.g; b.lim[d.lim]++; for (const k in b.cost) b.cost[k] += d.cost[k]; st.cash -= d.cost.total;
  if (d.temp < 3) b.loss.frost = Math.min(0.3, b.loss.frost + 0.04);
  if (b.pest) { const p = b.pest; if (p.wait > 0) { p.wait--; if (p.wait === 0) { p.rate = 0.02 * 0.15; ev.push({ t: "ladybirds-working" }); } } b.loss.pest = Math.min(0.35, b.loss.pest + p.rate); }
  if (b.d === b.pestAt) { b.pest = { rate: 0.02, wait: -1, done: false }; ev.push({ t: "pest" }); }
  if (b.d === b.stormAt) { b.loss.storm = 0.15; ev.push({ t: "storm" }); }
  if (b.pest && !b.pest.done && b.pest.delegated && st.gardeners > 0) { b.pest.idle = (b.pest.idle || 0) + 1; if (b.pest.idle >= 2) { const r = respondPest(st); if (r) ev.push({ t: "gardener-pest", r }); } }
  b.d++; st.day++; if (b.d >= b.days) ev.push(...harvest(st));
  return ev;
}
export function respondPest(st) {
  const b = st.batch; if (!b || !b.pest || b.pest.done) return null; b.pest.done = true;
  if (st.method === "organic") { b.pest.wait = 5; b.cost.rent += 0; st.cash -= 70; b.extra = (b.extra || 0) + 70; st.rep = Math.min(100, st.rep + 1); return { t: "bio", eff: 0.85 }; }
  const eff = Math.max(0.4, 1 - 0.15 * st.sprays); st.sprays++; b.pest.rate = 0.02 * (1 - eff); st.cash -= 30; b.extra = (b.extra || 0) + 30; st.rep = Math.max(0, st.rep - 2);
  return { t: "spray", eff };
}
export function market(st) {
  const C = CROPS[st.crop], org = st.method === "organic";
  return { price: org ? C.price * (1.5 + st.rep / 100) : C.price, demand: org ? 150 + st.rep * 4 : (400 + st.rep * 2) * (st.rep < 10 ? 0.75 : 1) };
}
function harvest(st) {
  const b = st.batch, C = CROPS[st.crop], org = st.method === "organic", ev = [];
  const avg = b.sumG / b.days;
  const kg = AREA * C.kg * avg * (1 - b.loss.pest) * (1 - b.loss.frost) * (1 - b.loss.storm) * b.fM * (org ? 0.8 : 1) * (CARE[Math.min(3, st.gardeners || 0)]) * ((org && !st.gardeners) ? 0.88 : 1);
  const m = market(st), sold = Math.min(kg, m.demand), spoil = kg - sold;
  const revenue = sold * m.price + spoil * 0.2 * C.price;
  const sf = org ? 0.5 : 0.25; st.pending = { shop: revenue * sf, van: revenue * (1 - sf) }; st.minerals = Math.max(0, st.minerals - 30);
  let dRep = org ? 4 : -2; st.rep = clamp(st.rep + dRep, 0, 100);
  if (org && st.rep >= 40 && rng(st.seed * 5 + st.nb)() < 0.25) { st.rep = Math.min(100, st.rep + 6); ev.push({ t: "viral" }); }
  const lim = Object.keys(b.lim).sort((a, c) => b.lim[c] - b.lim[a])[0];
  const costs = b.cost.lamp + b.cost.heat + b.cost.co2 + b.cost.water + b.cost.rent + b.cost.wages + b.labour + b.fert + (b.extra || 0);
  const row = { n: st.nb, method: st.method, crop: st.crop, kg, sold, spoil, price: m.price, revenue, costs, profit: revenue - costs, rep: st.rep, avg, lim, loss: { ...b.loss }, cost: { ...b.cost }, day: st.day };
  st.ledger.push(row); st.batch = null; ev.push({ t: "harvest", row }); return ev;
}
export function wait(st, n = 10) { const out = []; for (let i = 0; i < n && st.day < YEAR_DAYS && !st.batch; i++) { st.cash -= HOUSES[st.house].rent + (st.gardeners || 0) * WAGE; st.day++; } return out; }
export function flush(st, which = "all") { const p = st.pending; if (!p) return 0; let v = 0; if (which === "shop" || which === "all") { v += p.shop; p.shop = 0; } if (which === "van" || which === "all") { v += p.van; p.van = 0; } st.cash += v; if (p.shop + p.van < 0.01) st.pending = null; return v; }
export function canStart(st) { return !!st.house && !st.batch && st.day + batchDays(st.method, st.crop) <= YEAR_DAYS; }
export function yearTotals(st) { const p = st.ledger.reduce((a, r) => a + r.profit, 0); return { profit: p, batches: st.ledger.length, rep: st.rep, cash: st.cash }; }

/* five-year outlook: repeat the student's own average batch, letting reputation drift as it did */
export function project(st, years = 4) {
  if (!st.ledger.length) return [];
  const n = st.ledger.length, kg = st.ledger.reduce((a, r) => a + r.kg, 0) / n, cost = st.ledger.reduce((a, r) => a + r.costs - 0, 0) / n;
  const org = st.method === "organic", C = CROPS[st.crop]; let rep = st.rep; const out = [];
  for (let y = 2; y < 2 + years; y++) { let prof = 0;
    for (let i = 0; i < n; i++) { const demand = org ? 150 + rep * 4 : 400 + rep * 2, price = org ? C.price * (1.5 + rep / 100) : C.price;
      const dem = (!org && rep < 10) ? demand * 0.75 : demand, sold = Math.min(kg, dem);
      prof += sold * price + (kg - sold) * 0.2 * C.price - cost; rep = clamp(rep + (org ? 4 : -2), 0, 100); }
    out.push({ year: y, profit: prof, rep }); }
  return out;
}
