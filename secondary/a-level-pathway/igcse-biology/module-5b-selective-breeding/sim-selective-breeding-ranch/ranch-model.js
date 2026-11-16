/* Selective Breeding Ranch - pure model (no DOM, no THREE). The 3D scene and HUD only READ this state.
   Quantitative traits 0-100. Offspring = mid-parent value + random variation, minus an inbreeding penalty.
   Selection works because the student chooses the parents: the herd average climbs generation by generation.
   Time: 1 day per tick, 120 days = 1 year. Money in dollars. */
export const YEAR_DAYS = 120;
export const START_CASH = 6000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const SP = {
  cow:   { prod: "milk", adult: 8, gest: 6, feed: 1.2, price: 700, cap: "barn",  base: { prod: 38, meat: 40, health: 55, looks: 42, growth: 40 } },
  sheep: { prod: "wool", adult: 5, gest: 4, feed: 0.6, price: 260, cap: "pen",   base: { prod: 38, meat: 40, health: 55, looks: 42, growth: 40 } },
};
export const TRAITS = { animal: ["prod", "meat", "health", "looks", "growth"], plant: ["yield", "flavour", "resist", "looks", "shelf"] };
export const CAP = { barn: [0, 6, 12, 20], pen: [0, 6, 12, 20], glass: [0, 6, 12, 20] };
export const BUILD = { barn: [0, 2200, 3800, 6000], pen: [0, 1200, 2400, 4000], glass: [0, 1600, 3000, 5000], parlour: [0, 1500, 3000], shed: [0, 1100, 2200], warehouse: [0, 2500, 5000], clinic: [0, 2000], lab: [0, 3000, 6000] };
export const WAGE = { hand: 10, vet: 22, agro: 16 };
export const BASE_PRICE = { milk: 1.3, wool: 7, tomato: 2.4 };
export const THRESH = { milk: 58, wool: 58, meat: 58, tomato: 60 };
export const STUD = [{ q: 1, cost: 150, avg: 62, lab: 1 }, { q: 2, cost: 350, avg: 74, lab: 1 }, { q: 3, cost: 700, avg: 86, lab: 2 }];
const NAMES_F = ["Daisy", "Bella", "Clover", "Luna", "Rosie", "Maple", "Poppy", "Hazel", "Ivy", "Willow", "Nell", "Pearl", "Sage", "Tilly", "Fern", "Olive", "Mabel", "Ruby"];
const NAMES_M = ["Duke", "Bruno", "Rex", "Oscar", "Hugo", "Max", "Finn", "Otto", "Jack", "Milo", "Ben", "Tank", "Ziggy", "Moss"];

/* seeded random in the state (so a saved game continues the same way) */
export function rnd(g) { g.rn = (Math.imul(g.rn || 1, 1664525) + 1013904223) >>> 0; return g.rn / 4294967296; }
export function gauss(g) { return (rnd(g) + rnd(g) + rnd(g) + rnd(g) - 2) * 1.7; }
const pick = (g, a) => a[Math.floor(rnd(g) * a.length)];

export function newGame(seed = 1) {
  const g = { seed, rn: seed * 7919 + 13, day: 0, cash: START_CASH, rep: 30, year: 1, nid: 1, animals: [], plants: [], seeds: [], stock: { milk: 0, wool: 0, tomato: 0 },
    b: { barn: 1, pen: 1, glass: 1, parlour: 0, shed: 0, warehouse: 0, clinic: 0, lab: 0 }, staff: { hand: 1, vet: 0, agro: 0 }, super: false,
    gen: { cow: 1, sheep: 1, tomato: 1 }, trend: { cow: [], sheep: [], tomato: [] }, pending: null, market: [], collectIn: 5, ledger: [], flow: { in: 0, out: 0, hist: [] },
    events: [], sick: null, pest: null, stats: { born: 0, bred: 0, pollinated: 0, sold: 0, superSales: 0, treated: 0, died: 0 }, log: [] };
  for (let i = 0; i < 5; i++) addAnimal(g, "cow", i >= 3 ? "M" : "F", null, [], 1, 20);
  for (let i = 0; i < 5; i++) addAnimal(g, "sheep", i >= 3 ? "M" : "F", null, [], 1, 20);
  for (let i = 0; i < 4; i++) addPlant(g, null, 1, 6);
  refreshMarket(g); record(g); return g;
}
export function addAnimal(g, sp, sex, t, anc, gen, age) {
  const base = SP[sp].base, tr = {}; for (const k of TRAITS.animal) tr[k] = Math.round(clamp(t ? t[k] : base[k] + gauss(g) * 7, 5, 98));
  const a = { id: g.nid++, sp, sex, age, adult: age >= SP[sp].adult, t: tr, preg: null, anc: anc || [], gen: gen || 1, name: pick(g, sex === "F" ? NAMES_F : NAMES_M), sick: null, wool: 0 };
  g.animals.push(a); return a;
}
export function addPlant(g, t, gen, age) {
  const tr = {}; for (const k of TRAITS.plant) tr[k] = Math.round(clamp(t ? t[k] : 40 + gauss(g) * 7, 5, 98));
  const p = { id: g.nid++, t: tr, gen: gen || 1, age: age ?? 0, ill: false }; g.plants.push(p); return p;
}
export const matureAge = a => Math.max(3, Math.round(SP[a.sp].adult * (1.35 - a.t.growth / 150)));
export const merit = a => a.sp === "cow" ? a.t.prod * .35 + a.t.meat * .15 + a.t.health * .25 + a.t.looks * .15 + a.t.growth * .10 : a.t.prod * .35 + a.t.meat * .15 + a.t.health * .25 + a.t.looks * .15 + a.t.growth * .10;
export const plantMerit = p => p.t.yield * .3 + p.t.flavour * .25 + p.t.resist * .2 + p.t.looks * .15 + p.t.shelf * .1;
export const cap = (g, k) => CAP[k][g.b[k]];
export const count = (g, sp) => g.animals.filter(a => a.sp === sp).length;
export const adults = (g, sp, sex) => g.animals.filter(a => a.sp === sp && a.adult && (!sex || a.sex === sex));
export const avgTrait = (list, k) => list.length ? list.reduce((s, x) => s + x.t[k], 0) / list.length : 0;

/* ---------- inbreeding: how closely related are the two parents? ---------- */
export function inbreeding(m, f) {
  if (!m || !f) return 0;
  if (f.anc.slice(0, 2).includes(m.id) || m.anc.slice(0, 2).includes(f.id)) return 0.25;
  const sh = m.anc.slice(0, 2).filter(x => f.anc.slice(0, 2).includes(x)).length;
  if (sh === 2) return 0.25; if (sh === 1) return 0.125;
  const A = new Set([m.id, ...m.anc]), B = new Set([f.id, ...f.anc]); if ([...A].some(x => B.has(x))) return 0.0625;
  return 0;
}
/* ---------- breeding animals ---------- */
export function canBreed(g, mum, dad, ai) {
  if (!mum || mum.sex !== "F" || !mum.adult) return { ok: false, why: "mum" };
  if (mum.preg) return { ok: false, why: "preg" };
  if (mum.sick) return { ok: false, why: "sick" };
  if (!ai) { if (!dad || dad.sex !== "M" || !dad.adult || dad.sp !== mum.sp) return { ok: false, why: "dad" }; }
  else { const st = STUD[ai - 1]; if (g.b.lab < st.lab) return { ok: false, why: "lab" }; if (g.cash < st.cost) return { ok: false, why: "cash" }; }
  const pend = g.animals.filter(a => a.sp === mum.sp).length + g.animals.filter(a => a.sp === mum.sp && a.preg).length;
  if (pend >= cap(g, SP[mum.sp].cap)) return { ok: false, why: "full" };
  return { ok: true };
}
export function predict(mum, dad, ai) {
  const out = {}; const sire = ai ? null : dad;
  for (const k of TRAITS.animal) { const m = mum.t[k], d = ai ? STUD[ai - 1].avg : dad.t[k], mid = (m + d) / 2, sd = 5 + Math.abs(m - d) * 0.12; out[k] = [Math.round(clamp(mid - sd, 0, 100)), Math.round(mid), Math.round(clamp(mid + sd, 0, 100))]; }
  return { traits: out, F: ai ? 0 : inbreeding(mum, sire) };
}
export function breed(g, mumId, dadId, ai) {
  const mum = g.animals.find(a => a.id === mumId), dad = dadId ? g.animals.find(a => a.id === dadId) : null, c = canBreed(g, mum, dad, ai); if (!c.ok) return c;
  let sire;
  if (ai) { const st = STUD[ai - 1]; g.cash -= st.cost; g.flow.out += st.cost; const t = {}; for (const k of TRAITS.animal) t[k] = Math.round(clamp(st.avg + gauss(g) * 6, 30, 98)); sire = { id: -(g.nid++), t, gen: 1, anc: [] }; }
  else sire = dad;
  mum.preg = { due: g.day + SP[mum.sp].gest, sire: { id: sire.id, t: { ...sire.t }, gen: sire.gen || 1, anc: sire.anc || [] }, ai: !!ai, F: ai ? 0 : inbreeding(mum, dad) };
  g.stats.bred++; return { ok: true, due: mum.preg.due };
}
function birth(g, mum) {
  const p = mum.preg, n = mum.sp === "sheep" && rnd(g) < 0.4 ? 2 : 1, kids = [];
  for (let i = 0; i < n; i++) { const t = {};
    for (const k of TRAITS.animal) { const m = mum.t[k], d = p.sire.t[k], sd = 5 + Math.abs(m - d) * 0.12; t[k] = (m + d) / 2 + gauss(g) * sd - (k === "health" ? p.F * 70 : p.F * 12); }
    const anc = [p.sire.id, mum.id, ...(p.sire.anc || []).slice(0, 2), ...mum.anc.slice(0, 2)];
    const kid = addAnimal(g, mum.sp, rnd(g) < 0.5 ? "F" : "M", t, anc, Math.max(mum.gen, p.sire.gen || 1) + 1, 0); kid.born = g.day; kids.push(kid); g.gen[mum.sp] = Math.max(g.gen[mum.sp], kid.gen); g.stats.born++; }
  mum.preg = null; return kids;
}

/* ---------- plants: cross-pollination ---------- */
export function canPollinate(g, a, b) {
  if (!a || !b || a.id === b.id) return { ok: false, why: "two" };
  if (a.age < 4 || b.age < 4) return { ok: false, why: "young" };
  if (g.plants.length + g.seeds.reduce((s, x) => s + x.n, 0) >= cap(g, "glass")) return { ok: false, why: "full" };
  return { ok: true };
}
export function pollinate(g, aId, bId) {
  const a = g.plants.find(p => p.id === aId), b = g.plants.find(p => p.id === bId), c = canPollinate(g, a, b); if (!c.ok) return c;
  const room = cap(g, "glass") - g.plants.length - g.seeds.reduce((s, x) => s + x.n, 0), n = Math.min(2, room);
  g.seeds.push({ due: g.day + 3, n, a: { ...a.t }, b: { ...b.t }, gen: Math.max(a.gen, b.gen) + 1, F: a.id === b.id ? 0 : 0 }); g.stats.pollinated++; return { ok: true, n };
}
function germinate(g, s) {
  const out = [];
  for (let i = 0; i < s.n; i++) { const t = {}; for (const k of TRAITS.plant) { const sd = 7 + Math.abs(s.a[k] - s.b[k]) * 0.15; t[k] = (s.a[k] + s.b[k]) / 2 + gauss(g) * sd; } const p = addPlant(g, t, s.gen, 0); out.push(p); g.gen.tomato = Math.max(g.gen.tomato, s.gen); }
  return out;
}

/* ---------- selling ---------- */
export function stockPrice(a, rep = 30) { const m = merit(a); return Math.round(SP[a.sp].price * (0.55 + Math.pow(m / 60, 1.6) * 0.7) * (0.9 + rep / 400)); }
export function meatPrice(a) { const kg = a.sp === "cow" ? 280 + a.t.meat * 2.5 : 22 + a.t.meat * 0.3; const grade = a.t.meat * .6 + a.t.looks * .4; return Math.round(kg * (3.2 + grade / 100 * 1.8) * (a.adult ? 1 : 0.6)); }
export function sellAnimal(g, id, mode) {
  const i = g.animals.findIndex(a => a.id === id); if (i < 0) return { ok: false }; const a = g.animals[i]; if (a.preg) return { ok: false, why: "preg" };
  const v = mode === "meat" ? meatPrice(a) : stockPrice(a, g.rep); g.cash += v; g.flow.in += v; g.animals.splice(i, 1); g.stats.sold++;
  if (mode === "stock") g.rep = clamp(g.rep + Math.max(0, (merit(a) - 55) / 12), 0, 100); return { ok: true, value: v, mode, a };
}
export function refreshMarket(g) {
  g.market = [];
  for (const sp of ["cow", "sheep", "cow", "sheep", "cow", "sheep"]) { const sex = rnd(g) < 0.5 ? "F" : "M", t = {}; const boost = rnd(g) * 14; for (const k of TRAITS.animal) t[k] = Math.round(clamp(SP[sp].base[k] + boost + gauss(g) * 7, 15, 90));
    const fake = { sp, t, adult: true, rep: 30 }; g.market.push({ id: g.nid++, sp, sex, t, age: SP[sp].adult + 2, price: Math.round(stockPrice(fake, 30) * 1.25) }); }
}
export function buyAnimal(g, lid) {
  const i = g.market.findIndex(m => m.id === lid); if (i < 0) return { ok: false }; const m = g.market[i];
  if (g.cash < m.price) return { ok: false, why: "cash" }; if (count(g, m.sp) + g.animals.filter(a => a.sp === m.sp && a.preg).length >= cap(g, SP[m.sp].cap)) return { ok: false, why: "full" };
  g.cash -= m.price; g.flow.out += m.price; const a = addAnimal(g, m.sp, m.sex, m.t, [], 1, m.age); g.market.splice(i, 1); return { ok: true, a, price: m.price };
}
export function shear(g, id) { const a = g.animals.find(x => x.id === id); if (!a || a.sp !== "sheep" || !a.adult || a.wool < 12) return { ok: false }; const kg = (1.2 + a.t.prod * 0.05) * (g.b.shed ? 1 + 0.2 * g.b.shed : 0.8); g.stock.wool += kg; a.wool = 0; return { ok: true, kg }; }

/* ---------- staff, vets, buildings ---------- */
export function upgrade(g, key) { const lv = g.b[key], costs = BUILD[key]; if (lv >= costs.length - 1) return { ok: false, why: "max" }; const c = costs[lv + 1]; if (g.cash < c) return { ok: false, why: "cash", cost: c }; g.cash -= c; g.flow.out += c; g.b[key]++; return { ok: true, cost: c }; }
export function hire(g, who, n) { if (who === "vet" && !g.b.clinic) return { ok: false, why: "clinic" }; const v = clamp((g.staff[who] || 0) + n, 0, who === "hand" ? 5 : 1); g.staff[who] = v; return { ok: true }; }
export function callVet(g) { if (g.cash < 300) return { ok: false, why: "cash" }; const sick = g.animals.filter(a => a.sick); if (!sick.length) return { ok: false, why: "none" }; g.cash -= 300; g.flow.out += 300; sick.forEach(a => { a.sick = null; }); g.stats.treated += sick.length; g.sick = null; return { ok: true, n: sick.length }; }
export function sprayPests(g) { if (!g.pest) return { ok: false, why: "none" }; if (g.cash < 80) return { ok: false, why: "cash" }; g.cash -= 80; g.flow.out += 80; g.plants.forEach(p => { p.ill = false; }); g.pest = null; g.stats.treated++; return { ok: true }; }
export function removePlant(g, id) { const i = g.plants.findIndex(p => p.id === id); if (i < 0) return { ok: false }; g.plants.splice(i, 1); return { ok: true }; }
export function toggleSuper(g, on) { if (on && !g.b.warehouse) return { ok: false, why: "warehouse" }; g.super = !!on; return { ok: true }; }

/* ---------- products and quality ---------- */
export function grade(g, p) {
  if (p === "milk") { const c = adults(g, "cow", "F"); return c.length ? avgTrait(c, "prod") * .4 + avgTrait(c, "health") * .6 : 0; }
  if (p === "wool") { const s = adults(g, "sheep"); return s.length ? avgTrait(s, "prod") * .5 + avgTrait(s, "looks") * .5 : 0; }
  const pl = g.plants.filter(x => x.age >= 4); return pl.length ? avgTrait(pl, "flavour") * .5 + avgTrait(pl, "looks") * .3 + avgTrait(pl, "shelf") * .2 : 0;
}
export const handsNeeded = g => Math.max(1, Math.ceil((g.animals.length + g.plants.length / 2) / 9));
export function efficiency(g) { const need = handsNeeded(g); return g.staff.hand >= need ? 1 : 0.55 + 0.45 * g.staff.hand / need; }
export function dailyCosts(g) {
  const feed = g.animals.reduce((s, a) => s + SP[a.sp].feed * (a.adult ? 1 : 0.6), 0), care = g.plants.length * 0.5 + 5 * g.b.glass;
  const wages = g.staff.hand * WAGE.hand + g.staff.vet * WAGE.vet + g.staff.agro * WAGE.agro;
  return { feed, care, wages, total: feed + care + wages };
}
function record(g) {
  for (const sp of ["cow", "sheep"]) { const l = g.animals.filter(a => a.sp === sp); g.trend[sp].push(l.length ? Math.round(l.reduce((s, a) => s + merit(a), 0) / l.length) : 0); }
  g.trend.tomato.push(g.plants.length ? Math.round(g.plants.reduce((s, p) => s + plantMerit(p), 0) / g.plants.length) : 0);
}
export function herdMerit(g, sp) { const l = g.animals.filter(a => a.sp === sp); return l.length ? l.reduce((s, a) => s + merit(a), 0) / l.length : 0; }

/* ---------- one day ---------- */
export function stepDay(g) {
  const ev = []; g.day++; const eff = efficiency(g), parlour = 1 + 0.15 * g.b.parlour, cost = dailyCosts(g);
  g.cash -= cost.total; g.flow.out += cost.total;
  for (const a of g.animals) {
    a.age++; if (!a.adult && a.age >= matureAge(a)) { a.adult = true; ev.push({ t: "grown", a }); }
    if (a.adult && a.sex === "F" && a.sp === "cow" && !a.sick && !a.preg) g.stock.milk += (6 + a.t.prod * 0.22) * eff * parlour;
    else if (a.adult && a.sex === "F" && a.sp === "cow" && !a.sick) g.stock.milk += (6 + a.t.prod * 0.22) * eff * parlour * 0.5;
    if (a.sp === "sheep" && a.adult && !a.sick) { a.wool += 1; if (g.b.shed && g.staff.hand && a.wool >= 20) { const r = shear(g, a.id); if (r.ok) ev.push({ t: "sheared", a, kg: r.kg }); } }
    if (a.preg && g.day >= a.preg.due) { const kids = birth(g, a); ev.push({ t: "born", mum: a, kids }); }
  }
  for (const s of g.seeds.filter(x => g.day >= x.due)) { const pl = germinate(g, s); ev.push({ t: "germinated", plants: pl }); }
  g.seeds = g.seeds.filter(x => g.day < x.due);
  for (const p of g.plants) { p.age++; if (p.age >= 10) { const kg = (3 + p.t.yield * 0.13) * (p.ill ? 0.55 : 1) * eff; g.stock.tomato += kg; p.age = 3; p.ripe = true; } }
  /* disease outbreak (animals) */
  if (!g.sick && g.animals.length && rnd(g) < 0.035) { g.sick = { day: g.day }; let n = 0; for (const a of g.animals) { const p = (1 - a.t.health / 100) * 0.95 * (g.staff.vet ? 0.25 : 1); if (rnd(g) < p) { a.sick = { until: g.day + 4 }; n++; } } if (n) ev.push({ t: "outbreak", n }); else g.sick = null; }
  for (const a of g.animals) if (a.sick && g.day >= a.sick.until) { if (g.staff.vet) { a.sick = null; g.stats.treated++; } else if (a.t.health < 50 && rnd(g) < 0.7) { a.dead = true; } else { a.sick = null; a.t.health = Math.max(5, a.t.health - 6); } }
  const dead = g.animals.filter(a => a.dead); if (dead.length) { g.animals = g.animals.filter(a => !a.dead); g.stats.died += dead.length; g.rep = clamp(g.rep - dead.length * 2, 0, 100); ev.push({ t: "died", list: dead }); }
  if (g.sick && !g.animals.some(a => a.sick)) g.sick = null;
  /* pests and weeds (plants) */
  if (!g.pest && g.plants.length && rnd(g) < 0.04) { g.pest = { day: g.day }; g.plants.forEach(p => { if (rnd(g) < (1 - p.t.resist / 100)) p.ill = true; }); if (g.staff.agro) { g.plants.forEach(p => { p.ill = false; }); g.pest = null; g.stats.treated++; } else if (g.plants.some(p => p.ill)) ev.push({ t: "pest" }); else g.pest = null; }
  /* stock spoils */
  const shelfSave = 1 - 0.35 * g.b.warehouse; g.stock.milk *= 1 - 0.06 * shelfSave; const tShelf = avgTrait(g.plants, "shelf"); g.stock.tomato *= 1 - Math.max(0.02, (0.13 - tShelf * 0.001)) * shelfSave;
  /* collection day: the truck takes the stock to supermarkets and markets */
  g.collectIn--; if (g.collectIn <= 0) { g.collectIn = 5; const r = collect(g); if (r) ev.push({ t: "collect", r }); }
  if (g.day % 10 === 0) { record(g); g.flow.hist.push({ d: g.day, in: Math.round(g.flow.in), out: Math.round(g.flow.out) }); if (g.flow.hist.length > 12) g.flow.hist.shift(); g.flow.in = 0; g.flow.out = 0; }
  if (g.day % 12 === 0) { refreshMarket(g); ev.push({ t: "market" }); }
  if (g.day >= g.year * YEAR_DAYS) ev.push({ t: "year" });
  return ev;
}
export function collect(g) {
  const rows = []; let total = 0, shopRev = 0;
  for (const p of ["milk", "wool", "tomato"]) {
    const q = g.stock[p]; if (q < 1) continue; const gr = grade(g, p), okSuper = g.super && g.b.warehouse && gr >= THRESH[p];
    const mk = BASE_PRICE[p] * (0.75 + g.rep / 200) * (q > 220 ? 0.82 : 1); let sup = 0, market = q;
    if (okSuper) { sup = Math.min(q, 140 * g.b.warehouse); market = q - sup; }
    const rev = sup * BASE_PRICE[p] * 1.4 * (0.85 + g.rep / 300) + market * mk; total += rev; if (sup > 0) { shopRev += sup * BASE_PRICE[p] * 1.4; g.stats.superSales++; g.rep = clamp(g.rep + 0.8, 0, 100); }
    rows.push({ p, q: Math.round(q), grade: Math.round(gr), sup: Math.round(sup), market: Math.round(market), rev: Math.round(rev), rejected: g.super && g.b.warehouse && !okSuper }); g.stock[p] = 0;
  }
  if (!rows.length) return null; g.pending = { v: (g.pending ? g.pending.v : 0) + total }; g.flow.in += total; return { rows, total: Math.round(total) };
}
export function flush(g) { const v = g.pending ? g.pending.v : 0; g.cash += v; g.pending = null; return v; }
export function summary(g) { return { cash: g.cash, rep: g.rep, cows: count(g, "cow"), sheep: count(g, "sheep"), plants: g.plants.length, cowMerit: herdMerit(g, "cow"), sheepMerit: herdMerit(g, "sheep"), tom: g.plants.length ? g.plants.reduce((s, p) => s + plantMerit(p), 0) / g.plants.length : 0 }; }
