/* Greenhouse Business Tycoon - pure model (no DOM, no THREE). The scene and HUD only READ this state.
   One "year" = 120 days. Every plot is 100 m2. Money is in dollars.
   You start with an empty farm and a bare outdoor field. Grow outside, save up, then buy polytunnels,
   glasshouses, a farm shop, a supermarket contract and technology upgrades to build a small veggie empire.
   All plots grow the same crop on the same schedule (one "batch" = every plot, same days).
   Science kept honest: limiting factors (Blackman), enzyme temperature optimum, greenhouse effect,
   CO2 from burning fuel, transpiration (warmer = thirstier), minerals removed by harvest,
   fertiliser run-off -> eutrophication, pesticide resistance, biological control. */
export const YEAR_DAYS = 120;
export const AREA = 100;
export const SLOTS = 8;
export const WAGE = 6;
export const START_CASH = 400;
export const CROPS = {
  tomato:  { id: "tomato",  kg: 5.0, days: 20, lo: 21, hi: 27, price: 2.1,  col: 0xd63b2a },
  lettuce: { id: "lettuce", kg: 6.0, days: 15, lo: 14, hi: 20, price: 1.5, col: 0x7ad342 },
  pepper:  { id: "pepper",  kg: 4.0, days: 24, lo: 23, hi: 29, price: 2.9,  col: 0xf2a516 },
};
export const HOUSES = {
  poly:  { cost: 400,  rent: 2, gain0: 1, gainS: 3, trans: 0.82, loss: 1.7 },
  glass: { cost: 1400, rent: 5, gain0: 3, gainS: 6, trans: 0.92, loss: 1.0 },
};
export const PRICE = { lamp: 0.05, heat: 0.30, co2: 0.004, water: 0.25 };
export const SHOP_COST = [0, 500, 1000, 2000];
export const SHOP_CAP = [0, 300, 700, 1200];
export const UPG = { led: 900, insul: 900, drip: 600, super: 2000, field: 300 };
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
export function batchDays(method, crop) { return Math.round(CROPS[crop].days * (method === "organic" ? 1.3 : 1)); }

export function newGame(seed = 1, crop = "tomato") {
  return { seed, day: 0, cash: START_CASH, rep: 30, minerals: 70, crop, method: "inorganic",
    s: { lamp: 0, heat: 0, co2: 420, water: 3, fert: 1 }, slots: ["field"], shop: 0, up: { led: false, insul: false, drip: false, super: false },
    batch: null, gardeners: 0, pending: null, sprays: 0, ledger: [], river: 0, nb: 0, over: false };
}
export function count(st, type) { return st.slots.filter(x => x === type).length; }
export function units(st) { return st.slots.length; }
export function needGardeners(st) { return Math.ceil(units(st) / 2); }
export function careFactor(st) { const r = (st.gardeners || 0) / needGardeners(st); return r >= 1 ? 1 + 0.04 * Math.min(2, r - 1) : 0.75 + 0.25 * r; }

/* ---------- shopping ---------- */
export function price(st, what) {
  if (what === "poly" || what === "glass") return Math.round(HOUSES[what].cost * (1 + 0.12 * count(st, what)));
  if (what === "field") return Math.round(UPG.field * (1 + 0.12 * (count(st, "field") - 1)));
  if (what === "upgrade") return Math.round(HOUSES.glass.cost * 0.75);
  if (what === "shop") return st.shop >= 3 ? null : SHOP_COST[st.shop + 1];
  return UPG[what];
}
export function canBuy(st, what) {
  const p = price(st, what); if (p == null) return { ok: false, why: "max" };
  if (["poly", "glass", "field"].includes(what)) { if (st.slots.length >= SLOTS) return { ok: false, why: "full", cost: p }; if (what === "field" && count(st, "field") >= 3) return { ok: false, why: "max", cost: p }; if (st.batch) return { ok: false, why: "busy", cost: p }; }
  if (what === "upgrade") { if (!st.slots.includes("poly")) return { ok: false, why: "none", cost: p }; if (st.batch) return { ok: false, why: "busy", cost: p }; }
  if (["led", "insul", "drip", "super"].includes(what) && st.up[what]) return { ok: false, why: "owned", cost: p };
  if (what === "super" && st.shop < 1) return { ok: false, why: "needshop", cost: p };
  if (st.cash < p) return { ok: false, why: "cash", cost: p };
  return { ok: true, cost: p };
}
export function buy(st, what) {
  const c = canBuy(st, what); if (!c.ok) return c; st.cash -= c.cost; let slot = -1;
  if (["poly", "glass", "field"].includes(what)) { st.slots.push(what); slot = st.slots.length - 1; }
  else if (what === "upgrade") { slot = st.slots.indexOf("poly"); st.slots[slot] = "glass"; }
  else if (what === "shop") st.shop++;
  else st.up[what] = true;
  return { ok: true, cost: c.cost, slot };
}

/* ---------- one plot, one day ---------- */
export function unitState(st, type, w) {
  const C = CROPS[st.crop];
  if (type === "field") {
    const L = w.sun, fL = Math.min(1, L / 0.8), fT = tempFactor(w.tOut, C), fC = 0.55, fW = 0.75;
    const f = { light: fL, temp: fT, co2: fC, water: fW }; let lim = "light"; for (const k in f) if (f[k] < f[lim] - 1e-9) lim = k;
    return { passive: w.tOut, temp: w.tOut, heated: 0, L, co2: 420, co2Free: 0, need: 0, waterlogged: false, f, g: f[lim], lim, cost: { lamp: 0, heat: 0, co2: 0, water: 0, rent: 0 }, outdoor: true };
  }
  const s = st.s, H = HOUSES[type];
  const passive = w.tOut + H.gain0 + H.gainS * w.sun, heat = s.heat || 0;
  const temp = Math.max(passive, heat), heated = Math.max(0, heat - passive);
  const L = w.sun * H.trans + (s.lamp / 100) * 0.6;
  const fL = Math.min(1, L / 0.8), fT = tempFactor(temp, C);
  const co2Free = Math.min(120, heated * 6), co2 = Math.max(s.co2, 420 + co2Free);
  const fC = 0.55 + 0.45 * Math.min(1, (co2 - 420) / 580);
  const need = clamp(2 + 0.2 * (temp - 10), 2, 6.5), waterlogged = s.water > need * 1.5;
  const fW = Math.min(1, s.water / need) * (waterlogged ? 0.8 : 1);
  const f = { light: fL, temp: fT, co2: fC, water: fW }; let lim = "light"; for (const k in f) if (f[k] < f[lim] - 1e-9) lim = k;
  const cost = { lamp: s.lamp * PRICE.lamp * (st.up.led ? 0.65 : 1), heat: heated * H.loss * PRICE.heat * (st.up.insul ? 0.7 : 1),
    co2: Math.max(0, s.co2 - 420 - co2Free) * PRICE.co2, water: s.water * PRICE.water * (st.up.drip ? 0.6 : 1), rent: H.rent };
  return { passive, temp, heated, L, co2, co2Free, need, waterlogged, f, g: f[lim], lim, cost };
}
/* all plots, one day: per-type states, display state and total running cost (wages included) */
export function cur(st, view) {
  const w = weather(st.day, st.seed), states = {}, types = ["field", "poly", "glass"];
  let lamp = 0, heat = 0, co2 = 0, water = 0, rent = 0;
  for (const t of types) { const n = count(st, t); if (!n) continue; const d = unitState(st, t, w); states[t] = d; lamp += n * d.cost.lamp; heat += n * d.cost.heat; co2 += n * d.cost.co2; water += n * d.cost.water; rent += n * d.cost.rent; }
  const wages = (st.gardeners || 0) * WAGE;
  const pick = view && states[view] ? view : (states.glass ? "glass" : states.poly ? "poly" : "field");
  return { w, states, d: states[pick], type: pick, cost: { lamp, heat, co2, water, rent, wages, total: lamp + heat + co2 + water + rent + wages } };
}
export function fertCost(st) { return st.s.fert * (st.method === "organic" ? 20 : 15) * units(st); }
export const SEED_COST = 25;
export function pestCost(st) { return Math.round((st.method === "organic" ? 70 : 30) * Math.max(1, units(st) / 2)); }

export function startBatch(st) {
  if (!st.slots.length || st.batch || st.over) return null;
  const days = batchDays(st.method, st.crop); if (st.day + days > YEAR_DAYS) return null;
  const r = rng(st.seed * 97 + st.nb * 13), ev = [];
  const doses = st.s.fert, org = st.method === "organic", U = units(st);
  st.minerals = Math.min(100, st.minerals + doses * (org ? 12 : 20));
  const fc = fertCost(st), seeds = SEED_COST * U; st.cash -= fc + seeds;
  const fM = clamp(st.minerals / 70, 0.35, 1);
  if (!org && doses > 0 && r() < 0.08 * doses * Math.max(1, U / 2)) { st.rep = Math.max(0, st.rep - 10); st.river = 1; ev.push({ t: "runoff" }); }
  const per = {}; for (const t of ["field", "poly", "glass"]) if (count(st, t)) per[t] = { n: count(st, t), sumG: 0, frost: 0, storm: 0 };
  st.batch = { d: 0, days, fM, per, cost: { lamp: 0, heat: 0, co2: 0, water: 0, rent: 0, wages: 0 }, fert: fc, seeds,
    pestAt: (st.nb === 0 || r() < 0.8) ? Math.floor(days * 0.4) : -1, stormAt: (per.poly && r() < 0.4) ? Math.floor(days * 0.6) : -1,
    pest: null, loss: { pest: 0 }, lim: { light: 0, temp: 0, co2: 0, water: 0 } };
  st.nb++; return ev;
}
export function stepDay(st) {
  const b = st.batch, ev = []; if (!b) return ev;
  const c = cur(st); let disp = null;
  for (const t in b.per) { const d = c.states[t], p = b.per[t]; p.sumG += d.g; if (d.temp < 3) p.frost = Math.min(0.3, p.frost + 0.04); if (t === c.type) disp = d; }
  if (disp) b.lim[disp.lim]++;
  for (const k in b.cost) b.cost[k] += c.cost[k]; st.cash -= c.cost.total;
  if (b.pest) { const p = b.pest; if (p.wait > 0) { p.wait--; if (p.wait === 0) { p.rate = 0.02 * 0.15; ev.push({ t: "ladybirds-working" }); } } b.loss.pest = Math.min(0.35, b.loss.pest + p.rate); }
  if (b.d === b.pestAt) { b.pest = { rate: 0.02, wait: -1, done: false }; ev.push({ t: "pest" }); }
  if (b.d === b.stormAt && b.per.poly) { b.per.poly.storm = 0.15; ev.push({ t: "storm" }); }
  if (b.pest && !b.pest.done && b.pest.delegated && st.gardeners > 0) { b.pest.idle = (b.pest.idle || 0) + 1; if (b.pest.idle >= 2) { const r = respondPest(st); if (r) ev.push({ t: "gardener-pest", r }); } }
  b.d++; st.day++; if (b.d >= b.days) ev.push(...harvest(st));
  return ev;
}
export function respondPest(st) {
  const b = st.batch; if (!b || !b.pest || b.pest.done) return null; b.pest.done = true; const cost = pestCost(st);
  if (st.method === "organic") { b.pest.wait = 5; st.cash -= cost; b.extra = (b.extra || 0) + cost; st.rep = Math.min(100, st.rep + 1); return { t: "bio", eff: 0.85, cost }; }
  const eff = Math.max(0.4, 1 - 0.15 * st.sprays); st.sprays++; b.pest.rate = 0.02 * (1 - eff); st.cash -= cost; b.extra = (b.extra || 0) + cost; st.rep = Math.max(0, st.rep - 2);
  return { t: "spray", eff, cost };
}

/* ---------- selling: fill the best-paying outlets first ---------- */
export function outlets(st, repOver, shopOver, superOver) {
  const C = CROPS[st.crop], org = st.method === "organic", rep = repOver ?? st.rep, shop = shopOver ?? st.shop, sup = superOver ?? st.up.super;
  const repM = org ? 0.6 + rep / 100 : (rep < 10 ? 0.75 : 1) * (0.9 + rep / 500);
  const base = org ? C.price * (1.8 + rep / 80) : C.price * (0.8 + 0.2 * Math.min(1, rep / 50));
  const o = [{ id: "whole", cap: 400 * repM, price: base * 0.9 }];
  if (shop > 0) o.push({ id: "shop", cap: SHOP_CAP[shop] * repM, price: base * 1.25 });
  if (sup) o.push({ id: "super", cap: 2000 * repM, price: base * 0.85 });
  return o.sort((a, b) => b.price - a.price);
}
export function sell(st, kg, repOver, shopOver, superOver) {
  let left = kg; const rev = { shop: 0, super: 0, whole: 0, spoil: 0 }, sold = { shop: 0, super: 0, whole: 0 };
  for (const o of outlets(st, repOver, shopOver, superOver)) { const q = Math.min(left, o.cap); rev[o.id] = q * o.price; sold[o.id] = q; left -= q; }
  rev.spoil = left * 0.2 * CROPS[st.crop].price; return { rev, sold, spoil: left, total: rev.shop + rev.super + rev.whole + rev.spoil };
}
export function market(st) { const o = outlets(st); return { price: Math.max(...o.map(x => x.price)), demand: o.reduce((a, x) => a + x.cap, 0), outlets: o }; }

function harvest(st) {
  const b = st.batch, C = CROPS[st.crop], org = st.method === "organic", ev = [];
  const care = careFactor(st) * ((org && !st.gardeners) ? 0.88 : 1);
  let kg = 0; const byType = {};
  for (const t in b.per) { const p = b.per[t]; const k = p.n * AREA * C.kg * (p.sumG / b.days) * (1 - b.loss.pest) * (1 - p.frost) * (1 - p.storm) * b.fM * (org ? 0.8 : 1) * care; byType[t] = k; kg += k; }
  const sl = sell(st, kg), revenue = sl.total;
  st.pending = { shop: sl.rev.shop, van: sl.rev.super + sl.rev.whole + sl.rev.spoil };
  st.minerals = Math.max(0, st.minerals - 30);
  st.rep = clamp(st.rep + (org ? 4 : -3), 0, 100);
  if (org && st.rep >= 40 && rng(st.seed * 5 + st.nb)() < 0.25) { st.rep = Math.min(100, st.rep + 6); ev.push({ t: "viral" }); }
  const lim = Object.keys(b.lim).sort((a, c) => b.lim[c] - b.lim[a])[0];
  const costs = b.cost.lamp + b.cost.heat + b.cost.co2 + b.cost.water + b.cost.rent + b.cost.wages + b.fert + b.seeds + (b.extra || 0);
  const avg = Object.values(b.per).reduce((a, p) => a + p.sumG / b.days, 0) / Object.keys(b.per).length;
  const row = { n: st.nb, method: st.method, crop: st.crop, kg, byType, units: units(st), sold: kg - sl.spoil, spoil: sl.spoil, soldBy: sl.sold, price: market(st).price, revenue, costs, profit: revenue - costs, rep: st.rep, avg, lim, loss: { pest: b.loss.pest }, cost: { ...b.cost }, day: st.day };
  st.ledger.push(row); st.batch = null; ev.push({ t: "harvest", row }); return ev;
}
export function wait(st, n = 10) {
  for (let i = 0; i < n && st.day < YEAR_DAYS && !st.batch; i++) { const rent = st.slots.reduce((a, t) => a + (HOUSES[t] ? HOUSES[t].rent : 0), 0); st.cash -= rent + (st.gardeners || 0) * WAGE; st.day++; }
  return [];
}
export function flush(st, which = "all") { const p = st.pending; if (!p) return 0; let v = 0; if (which === "shop" || which === "all") { v += p.shop; p.shop = 0; } if (which === "van" || which === "all") { v += p.van; p.van = 0; } st.cash += v; if (p.shop + p.van < 0.01) st.pending = null; return v; }
export function canStart(st) { return !!st.slots.length && !st.batch && st.day + batchDays(st.method, st.crop) <= YEAR_DAYS; }
export function yearTotals(st) { const p = st.ledger.reduce((a, r) => a + r.profit, 0); return { profit: p, batches: st.ledger.length, rep: st.rep, cash: st.cash }; }
export function newYear(st) { st.day = 0; st.ledger = []; st.seed++; st.river = 0; st.sprays = 0; }

/* outlook: repeat the average batch of this year with the same farm, letting reputation drift */
export function project(st, years = 4) {
  if (!st.ledger.length) return [];
  const n = st.ledger.length, kg = st.ledger.reduce((a, r) => a + r.kg, 0) / n, cost = st.ledger.reduce((a, r) => a + r.costs, 0) / n;
  const org = st.method === "organic"; let rep = st.rep; const out = [];
  for (let y = 2; y < 2 + years; y++) { let prof = 0;
    for (let i = 0; i < n; i++) { prof += sell(st, kg, rep).total - cost; rep = clamp(rep + (org ? 4 : -3), 0, 100); }
    out.push({ year: y, profit: prof, rep }); }
  return out;
}
