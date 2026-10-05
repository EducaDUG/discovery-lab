/* Pentagon Quest — the health model. Pure data + maths, no DOM, so it can be
   bot-tested in the browser console. The five parts of Pip's Pentagon are
   linked: caring for one lifts others, and a very low part makes the next
   one harder. Everything a student sees (tilt, pillars, ripples) is drawn
   from these numbers. */
import { getLang } from "../../../../../../engine/i18n.js?v=9";
export const L = (en, es) => (getLang() === "es" ? es : en);

export const PILLARS = [
  { id: "food",    color: "#3f9c4f", en: "Eating Well",    es: "Comer bien" },
  { id: "move",    color: "#f08a24", en: "Moving",         es: "Moverse" },
  { id: "sleep",   color: "#6a5ad6", en: "Sleep",          es: "Dormir" },
  { id: "calm",    color: "#25a6b8", en: "Calm Mind",      es: "Mente en calma" },
  { id: "friends", color: "#d9568c", en: "Friends",        es: "Amigos" },
];
export const IDS = PILLARS.map(p => p.id);
export const P = id => PILLARS.find(p => p.id === id);
export const pname = id => L(P(id).en, P(id).es);

/* Caring for one part ripples into others (amount is scaled by how well the quest went). */
export const LINKS = {
  food:    [{ to: "move",  amt: 6, en: "Food gives Pip energy to move", es: "La comida le da energía a Pip para moverse" }],
  move:    [{ to: "sleep", amt: 8, en: "A busy body sleeps better", es: "Un cuerpo activo duerme mejor" },
            { to: "calm",  amt: 5, en: "Moving shakes off worries", es: "Moverse quita las preocupaciones" }],
  sleep:   [{ to: "calm",  amt: 9, en: "A rested brain stays calm", es: "Un cerebro descansado se mantiene en calma" },
            { to: "move",  amt: 5, en: "Rest gives energy to play", es: "Descansar da energía para jugar" }],
  calm:    [{ to: "friends", amt: 9, en: "Calm kids find kind words", es: "Los niños en calma encuentran palabras amables" },
            { to: "sleep",   amt: 4, en: "A calm mind falls asleep easier", es: "Una mente tranquila se duerme más fácil" }],
  friends: [{ to: "calm",  amt: 8, en: "Feeling supported helps Pip feel calm", es: "Sentirse apoyado ayuda a Pip a estar en calma" },
            { to: "move",  amt: 4, en: "Friends make playing more fun", es: "Los amigos hacen el juego más divertido" }],
};
/* When one part is very low, the part it supports gets harder ("knock-on"). */
export const KNOCK = {
  calm:    { from: "sleep", mult: .7, en: "Pip is very tired, so staying calm is harder", es: "Pip está muy cansado, así que mantener la calma es más difícil" },
  friends: { from: "calm",  mult: .7, en: "Pip is upset, so being kind is harder", es: "Pip está molesto, así que ser amable es más difícil" },
  move:    { from: "food",  mult: .8, en: "Pip has no fuel, so moving is harder", es: "Pip no tiene combustible, así que moverse es más difícil" },
};
export const LOW = 47, START = 50;
const clamp = x => Math.max(0, Math.min(100, x));
const r1 = x => Math.round(x * 10) / 10;

export function newDay() { const v = {}; IDS.forEach(i => v[i] = START); return { v, visits: {}, moment: 0, log: [] }; }

/* One "moment" of Pip's day spent on `area`, with quest quality q (0..1).
   Returns what happened so the UI can show every ripple. */
export function applyMoment(day, area, q, shock) {
  const k = day.visits[area] || 0;
  const rep = Math.pow(.6, k);                       // doing only one thing helps less each time
  const kn = KNOCK[area];
  const knocked = !!(kn && day.v[kn.from] < LOW);
  const mult = knocked ? kn.mult : 1;
  const gain = (10 + 22 * q) * rep * mult;
  IDS.forEach(i => { if (i !== area) day.v[i] = clamp(day.v[i] - 4); });   // time passes: neglected parts fade
  day.v[area] = clamp(day.v[area] + gain);
  const links = (LINKS[area] || []).map(l => ({ ...l, amt: l.amt * q * rep * mult }));
  links.forEach(l => { day.v[l.to] = clamp(day.v[l.to] + l.amt); });
  const shocks = [];
  if (shock) Object.keys(shock).forEach(k2 => { day.v[k2] = clamp(day.v[k2] + shock[k2]); shocks.push({ to: k2, amt: shock[k2] }); });
  day.visits[area] = k + 1; day.moment++;
  const res = { area, q, gain, rep, links, knocked, knock: knocked ? kn : null, shocks };
  day.log.push({ area, q: r1(q), gain: r1(gain), knocked });
  return res;
}
export function balance(v) { const a = IDS.map(i => v[i]); return Math.round(100 - (Math.max(...a) - Math.min(...a))); }
export function weakest(v) { return IDS.slice().sort((a, b) => v[a] - v[b])[0]; }
export function strongest(v) { return IDS.slice().sort((a, b) => v[b] - v[a])[0]; }
export function mood(v) { const b = balance(v), m = Math.min(...IDS.map(i => v[i]));
  return b >= 80 && m >= 55 ? "happy" : (m < 30 || b < 45 ? "tired" : "okay"); }
export function planText(day) {
  const n = {}; day.log.forEach(l => n[l.area] = (n[l.area] || 0) + 1);
  return IDS.filter(i => n[i]).map(i => `${pname(i)} x${n[i]}`).join(", ");
}
