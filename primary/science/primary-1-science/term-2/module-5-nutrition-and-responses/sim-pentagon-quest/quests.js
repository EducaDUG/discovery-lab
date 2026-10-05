/* Pentagon Quest — the five quests. Each one is a different kind of game
   and resolves with { q: 0..1, detail, shock? }. The hub turns q into
   changes on the Pentagon (see model.js applyMoment).
     Food    : Lunchbox Builder  (build a varied lunchbox from real food photos)
     Move    : Move Mix          (pick three kinds of movement, watch Pip do them)
     Sleep   : Bedtime Wind-Down (choose a routine, the room reacts)
     Calm    : Calm Cove         (notice > stop > step away > breathe > ask for help > return)
     Friends : Playground Moment (branching scenes with visible consequences)  */
import { L } from "./model.js?v=1";

const $ = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reducedMotion = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
const live = (host) => host.isConnected;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- characters (SVG) ---------- */
export function charSVG(color = "#ffb347", mood = "happy", size = 96, cls = "") {
  const dark = "#2b2140";
  const eyes = { tired: "half", calm: "closed" }[mood] || "open";
  const eye = (x) => eyes === "closed" ? `<path d="M${x - 7} 44 q7 6 14 0" stroke="${dark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${x}" cy="44" rx="5.5" ry="${eyes === "half" ? 3 : 7.5}" fill="${dark}"/>${eyes === "open" ? `<circle cx="${x + 2}" cy="41" r="2" fill="#fff"/>` : ""}`;
  const brows = mood === "angry" ? `<path d="M26 32 l16 6 M74 32 l-16 6" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`
    : mood === "upset" ? `<path d="M26 38 l16 -6 M74 38 l-16 -6" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`
    : mood === "worried" ? `<path d="M27 32 l15 4 M73 32 l-15 4" stroke="${dark}" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>` : "";
  const mouth = { happy: `<path d="M38 60 q12 12 24 0" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    calm: `<path d="M40 60 q10 8 20 0" stroke="${dark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    excited: `<ellipse cx="50" cy="63" rx="9" ry="8" fill="#7a2b3a"/>`,
    okay: `<path d="M41 62 h18" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`,
    tired: `<ellipse cx="50" cy="63" rx="5" ry="4" fill="none" stroke="${dark}" stroke-width="3"/>`,
    worried: `<path d="M40 66 q10 -6 20 0" stroke="${dark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    upset: `<path d="M38 68 q12 -12 24 0" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    angry: `<path d="M38 68 q12 -10 24 0" stroke="${dark}" stroke-width="4" fill="none" stroke-linecap="round"/>` }[mood] || "";
  const tint = mood === "angry" ? `<circle cx="50" cy="52" r="38" fill="#ff3b30" opacity=".18"/>` : "";
  const zz = mood === "tired" ? `<text x="76" y="24" font-size="16" font-weight="800" fill="#6a5ad6">z</text><text x="86" y="14" font-size="11" font-weight="800" fill="#6a5ad6">z</text>` : "";
  return `<svg class="pq-char ${cls}" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${mood}">
    <ellipse cx="50" cy="94" rx="26" ry="4.5" fill="rgba(0,0,0,.14)"/>
    <ellipse cx="38" cy="90" rx="9" ry="5" fill="${color}" style="filter:brightness(.9)"/><ellipse cx="62" cy="90" rx="9" ry="5" fill="${color}" style="filter:brightness(.9)"/>
    <circle cx="50" cy="52" r="38" fill="${color}"/><ellipse cx="50" cy="66" rx="22" ry="17" fill="#fff" opacity=".28"/>${tint}
    <circle cx="27" cy="58" r="6" fill="#ff7a9c" opacity=".4"/><circle cx="73" cy="58" r="6" fill="#ff7a9c" opacity=".4"/>
    ${eye(36)}${eye(64)}${brows}${mouth}${zz}</svg>`;
}
export const PIP = "#ffb347";

const optBtn = (emoji, label, extra = "") => $(`<button type="button" class="pq-opt ${extra}"><span class="pq-opt__ico" aria-hidden="true">${emoji}</span><span class="pq-opt__t">${label}</span></button>`);
function shake(el) { el.classList.remove("pq-shake"); void el.offsetWidth; el.classList.add("pq-shake"); }
function pop(el) { el.classList.remove("pq-pop"); void el.offsetWidth; el.classList.add("pq-pop"); }
function banner(host, text, kind = "info") { let b = host.querySelector(".pq-say"); if (!b) { b = $(`<p class="pq-say" role="status" aria-live="polite"></p>`); host.prepend(b); } b.className = "pq-say pq-say--" + kind; b.textContent = text; pop(b); }

/* ============================================================== FOOD */
const FOODS = [
  { id: "veg", en: "Vegetables", es: "Verduras", helper: ["Grow strong", "Crecer fuerte"], c: "#3f9c4f" },
  { id: "bread", en: "Bread", es: "Pan", helper: ["Energy", "Energía"], c: "#d9a02b" },
  { id: "beans", en: "Beans", es: "Frijoles", helper: ["Build & repair", "Construir y reparar"], c: "#8a4fc0" },
  { id: "avocado", en: "Avocado", es: "Aguacate", helper: ["Brain & heart", "Cerebro y corazón"], c: "#6b8e23" },
  { id: "orange", en: "Orange", es: "Naranja", helper: ["Fight germs", "Combatir gérmenes"], c: "#f08a24" },
  { id: "milk", en: "Milk", es: "Leche", helper: ["Strong bones", "Huesos fuertes"], c: "#4f8ac0" },
  { id: "water", en: "Water", es: "Agua", helper: ["Stay hydrated", "Hidratarse"], c: "#37b6e6" },
];
export const FOOD_PHOTOS = Object.fromEntries(FOODS.map(f => [f.id, `photos/food-${f.id}.jpg`]));

export function playFood(host) {
  return new Promise(done => {
    const slots = [null, null, null, null];
    host.innerHTML = "";
    const root = $(`<div class="pq-quest"><p class="pq-say"></p>
      <div class="pq-lunch"><div class="pq-slots"></div><div class="pq-helpers" aria-live="polite"></div></div>
      <div class="pq-grid pq-grid--photo"></div>
      <div class="pq-actions"><button type="button" class="btn btn--signal" disabled></button></div></div>`);
    host.append(root);
    const say = root.querySelector(".pq-say"), sl = root.querySelector(".pq-slots"), help = root.querySelector(".pq-helpers"), go = root.querySelector("button.btn");
    say.textContent = L("Fill Pip's lunchbox with 4 foods. Every food is a different helper!", "¡Llena la fiambrera de Pip con 4 alimentos! ¡Cada alimento es un ayudante distinto!");
    go.textContent = L("Pack the lunchbox", "Cerrar la fiambrera");
    const paint = () => {
      sl.innerHTML = "";
      slots.forEach((id, i) => {
        const f = FOODS.find(x => x.id === id);
        const b = $(`<button type="button" class="pq-slot ${f ? "is-full" : ""}" aria-label="${f ? L(f.en, f.es) + ". " + L("Tap to remove", "Toca para quitar") : L("Empty space", "Espacio vacío") + " " + (i + 1)}">${f ? `<img src="photos/food-${f.id}.jpg" alt="">` : `<span class="pq-slot__n">${i + 1}</span>`}</button>`);
        if (f) { b.style.borderColor = f.c; b.addEventListener("click", () => { slots[i] = null; paint(); }); pop(b); }
        sl.append(b);
      });
      const set = [...new Set(slots.filter(Boolean))];
      help.innerHTML = set.map(id => { const f = FOODS.find(x => x.id === id); return `<span class="pq-chip" style="background:${f.c}">${L(f.helper[0], f.helper[1])}</span>`; }).join("") || `<span class="pq-hint">${L("Helpers will appear here", "Aquí aparecerán los ayudantes")}</span>`;
      go.disabled = slots.some(s => !s);
    };
    const grid = root.querySelector(".pq-grid");
    FOODS.forEach(f => {
      const b = $(`<button type="button" class="pq-photo"><img src="photos/food-${f.id}.jpg" alt=""><span>${L(f.en, f.es)}</span></button>`);
      b.addEventListener("click", () => { const i = slots.indexOf(null); if (i < 0) { shake(b); say.textContent = L("The lunchbox is full! Tap a food inside to swap it.", "¡La fiambrera está llena! Toca un alimento de adentro para cambiarlo."); return; } slots[i] = f.id; paint(); });
      grid.append(b);
    });
    paint();
    go.addEventListener("click", () => {
      const distinct = new Set(slots).size;
      say.textContent = L(`${distinct} different helper${distinct > 1 ? "s" : ""} packed! A variety of foods gives your body different kinds of help.`, `¡${distinct} ayudante${distinct > 1 ? "s" : ""} distinto${distinct > 1 ? "s" : ""}! Una variedad de alimentos da a tu cuerpo distintos tipos de ayuda.`);
      go.disabled = true; setTimeout(() => done({ q: distinct / 4, detail: { foods: slots.slice(), distinct } }), reducedMotion() ? 300 : 1400);
    });
  });
}

/* ============================================================== MOVE */
const MOVES = [
  { id: "run", en: "Run", es: "Correr", kind: "heart", a: "run" },
  { id: "dance", en: "Dance", es: "Bailar", kind: "heart", a: "dance" },
  { id: "swim", en: "Swim", es: "Nadar", kind: "heart", a: "swim" },
  { id: "cycle", en: "Cycle", es: "Pedalear", kind: "heart", a: "run" },
  { id: "climb", en: "Climb", es: "Trepar", kind: "strength", a: "climb" },
  { id: "stretch", en: "Stretch", es: "Estirarse", kind: "bendy", a: "stretch" },
];
const KIND = { heart: ["Heart helper", "Ayudante del corazón", "#e0463d"], strength: ["Muscle helper", "Ayudante de los músculos", "#8a4fc0"], bendy: ["Bendy helper", "Ayudante de la flexibilidad", "#2fa88a"] };
export const MOVE_PHOTOS = Object.fromEntries(MOVES.map(m => [m.id, `photos/move-${m.id}.jpg`]));

export function playMove(host) {
  return new Promise(done => {
    const picks = []; let friend = false;
    host.innerHTML = "";
    const root = $(`<div class="pq-quest"><p class="pq-say"></p>
      <div class="pq-stage pq-stage--move"><div class="pq-pipwrap">${charSVG(PIP, "excited", 110)}</div><div class="pq-friendwrap" hidden>${charSVG("#6fb7ff", "happy", 90)}</div></div>
      <div class="pq-slots pq-slots--3"></div>
      <div class="pq-grid pq-grid--photo"></div>
      <label class="pq-check"><input type="checkbox"> <span></span></label>
      <div class="pq-actions"><button type="button" class="btn btn--signal" disabled></button></div></div>`);
    host.append(root);
    const say = root.querySelector(".pq-say"), sl = root.querySelector(".pq-slots"), go = root.querySelector("button.btn"), pipw = root.querySelector(".pq-pipwrap"), fw = root.querySelector(".pq-friendwrap");
    const chk = root.querySelector("input"); root.querySelector(".pq-check span").textContent = L("Play with a friend", "Jugar con un amigo");
    chk.addEventListener("change", () => { friend = chk.checked; fw.hidden = !friend; });
    say.textContent = L("Pick 3 ways for Pip to move. Mix them up!", "Elige 3 formas de moverse para Pip. ¡Mézclalas!");
    go.textContent = L("Go, Pip!", "¡Vamos, Pip!");
    const paint = () => { sl.innerHTML = ""; for (let i = 0; i < 3; i++) { const m = MOVES.find(x => x.id === picks[i]); const b = $(`<button type="button" class="pq-slot ${m ? "is-full" : ""}" aria-label="${m ? L(m.en, m.es) : L("Empty", "Vacío")}">${m ? `<img src="photos/move-${m.id}.jpg" alt="">` : `<span class="pq-slot__n">${i + 1}</span>`}</button>`); if (m) { b.style.borderColor = KIND[m.kind][2]; b.addEventListener("click", () => { picks.splice(i, 1); paint(); }); pop(b); } sl.append(b); } go.disabled = picks.length < 3; };
    const grid = root.querySelector(".pq-grid");
    MOVES.forEach(m => {
      const b = $(`<button type="button" class="pq-photo"><img src="photos/move-${m.id}.jpg" alt=""><span>${L(m.en, m.es)}</span></button>`);
      b.addEventListener("click", () => { if (picks.length >= 3) { shake(b); return; } picks.push(m.id); paint(); pipw.className = "pq-pipwrap pq-a-" + m.a; setTimeout(() => pipw.className = "pq-pipwrap", 700); });
      grid.append(b);
    });
    paint();
    go.addEventListener("click", async () => {
      go.disabled = true; root.querySelectorAll(".pq-photo,.pq-check input").forEach(x => x.disabled = true);
      for (const id of picks) { const m = MOVES.find(x => x.id === id); say.textContent = L(`${m.en}! ${KIND[m.kind][0]}`, `¡${m.es}! ${KIND[m.kind][1]}`); pipw.className = "pq-pipwrap pq-a-" + m.a; await wait(reducedMotion() ? 250 : 1300); if (!live(host)) return; }
      pipw.className = "pq-pipwrap";
      const kinds = new Set(picks.map(id => MOVES.find(x => x.id === id).kind));
      pipw.innerHTML = charSVG(PIP, "calm", 110);
      say.textContent = L(`Rest break! Resting lets muscles recover. Pip used ${kinds.size} kind${kinds.size > 1 ? "s" : ""} of movement.`, `¡Descanso! Descansar deja que los músculos se recuperen. Pip usó ${kinds.size} tipo${kinds.size > 1 ? "s" : ""} de movimiento.`);
      await wait(reducedMotion() ? 300 : 1500);
      done({ q: kinds.size / 3, detail: { moves: picks.slice(), kinds: kinds.size, friend }, bonus: friend ? { friends: 6 } : null });
    });
  });
}

/* ============================================================== SLEEP */
const ROUTINE = [
  { id: "lamp", ico: "🛋️", en: "Dim the lights", es: "Bajar las luces", good: 1, say: ["Soft light tells the body it's nearly bedtime.", "La luz suave le dice al cuerpo que ya casi es hora de dormir."] },
  { id: "screen", ico: "📴", en: "Screen off", es: "Apagar la pantalla", good: 1, say: ["Switching screens off helps the brain wind down.", "Apagar las pantallas ayuda al cerebro a relajarse."] },
  { id: "teeth", ico: "🪥", en: "Brush teeth", es: "Cepillarse los dientes", good: 1, say: ["A steady routine says: sleep is coming.", "Una rutina constante dice: el sueño ya viene."] },
  { id: "book", ico: "📖", en: "Read a story", es: "Leer un cuento", good: 1, say: ["A quiet story helps thoughts slow down.", "Un cuento tranquilo hace que los pensamientos vayan más lento."] },
  { id: "bath", ico: "🛁", en: "Warm bath", es: "Baño tibio", good: 1, say: ["Warm water relaxes tight muscles.", "El agua tibia relaja los músculos tensos."] },
  { id: "video", ico: "📺", en: "One more video", es: "Un video más", good: 0, say: ["Bright screens keep Pip's brain awake. Pip stays wide-eyed.", "Las pantallas brillantes mantienen despierto el cerebro de Pip."] },
  { id: "bounce", ico: "🤸", en: "Loud bouncy game", es: "Juego ruidoso", good: 0, say: ["Big, bouncy play is great earlier in the day, but it wakes the body up.", "Jugar fuerte es genial más temprano, pero despierta al cuerpo."] },
  { id: "snack", ico: "🥤", en: "Fizzy drink", es: "Bebida con gas", good: 0, say: ["Fizzy drinks can keep a body buzzing at bedtime.", "Las bebidas con gas pueden mantener al cuerpo inquieto."] },
];
export function playSleep(host) {
  return new Promise(done => {
    const picks = [];
    host.innerHTML = "";
    const root = $(`<div class="pq-quest"><p class="pq-say"></p>
      <div class="pq-room"><div class="pq-room__dark"></div><svg viewBox="0 0 300 130" class="pq-room__svg" aria-hidden="true">
        <rect width="300" height="130" fill="#b9a4f0"/><circle cx="244" cy="30" r="14" fill="#fff6c9"/><circle cx="251" cy="26" r="12" fill="#b9a4f0"/>
        <rect x="150" y="62" width="120" height="48" rx="8" fill="#fff"/><rect x="150" y="62" width="120" height="14" rx="6" fill="#6a5ad6"/><rect x="144" y="56" width="10" height="64" rx="4" fill="#8a6a4a"/>
        <rect x="40" y="86" width="60" height="30" rx="4" fill="#d9b78a"/><path d="M58 86 v-22 h24 v22" fill="#ffe7a0"/><ellipse cx="70" cy="64" rx="18" ry="6" fill="#ffd34d"/></svg>
        <div class="pq-room__pip"></div><div class="pq-room__zz" aria-hidden="true"></div></div>
      <div class="pq-slots pq-slots--3"></div>
      <div class="pq-grid pq-grid--icons"></div></div>`);
    host.append(root);
    const say = root.querySelector(".pq-say"), dark = root.querySelector(".pq-room__dark"), pipEl = root.querySelector(".pq-room__pip"), zz = root.querySelector(".pq-room__zz"), sl = root.querySelector(".pq-slots"), room = root.querySelector(".pq-room");
    say.textContent = L("It's nearly bedtime. Choose 3 things for Pip's bedtime.", "Casi es hora de dormir. Elige 3 cosas para la hora de dormir de Pip.");
    pipEl.innerHTML = charSVG(PIP, "okay", 70);
    const paint = () => { sl.innerHTML = ""; for (let i = 0; i < 3; i++) { const r = ROUTINE.find(x => x.id === picks[i]); sl.append($(`<span class="pq-slot ${r ? "is-full" : ""}" style="font-size:1.6rem">${r ? r.ico : `<span class="pq-slot__n">${i + 1}</span>`}</span>`)); } };
    paint();
    const grid = root.querySelector(".pq-grid");
    ROUTINE.forEach(r => {
      const b = optBtn(r.ico, L(r.en, r.es)); grid.append(b);
      b.addEventListener("click", async () => {
        if (picks.length >= 3 || b.disabled) return; picks.push(r.id); b.disabled = true; paint();
        const good = picks.filter(id => ROUTINE.find(x => x.id === id).good).length;
        dark.style.opacity = String(Math.min(.8, good * .27)); say.textContent = L(r.say[0], r.say[1]);
        if (!r.good) { b.classList.add("is-miss"); room.classList.add("is-bright"); setTimeout(() => room.classList.remove("is-bright"), 1500); }
        else b.classList.add("is-hit");
        pipEl.innerHTML = charSVG(PIP, r.good ? "calm" : "excited", 70);
        if (picks.length === 3) {
          await wait(reducedMotion() ? 400 : 1500); if (!live(host)) return;
          const q = good / 3; pipEl.innerHTML = charSVG(PIP, q >= .66 ? "calm" : (q > 0 ? "okay" : "excited"), 70);
          zz.textContent = "💤".repeat(Math.max(1, good));
          say.textContent = q >= .66 ? L("Pip drifts off easily. A calm routine = good sleep!", "Pip se duerme fácilmente. ¡Una rutina tranquila = buen sueño!")
            : L("Pip takes a long time to fall asleep. A calmer routine would help tomorrow!", "A Pip le cuesta dormirse. ¡Una rutina más tranquila ayudaría mañana!");
          await wait(reducedMotion() ? 300 : 1500);
          done({ q, detail: { routine: picks.slice(), calming: good } });
        }
      });
    });
  });
}

/* ============================================================== CALM COVE */
const CALM_SCENES = [
  { id: "angry", ico: "🧱", en: "Sam knocked over Pip's tall tower on purpose!", es: "¡Sam derribó la torre de Pip a propósito!", mood: "angry",
    clues: [["Tight fists", "Puños apretados"], ["Hot, red face", "Cara roja y caliente"], ["Heart thumping fast", "Corazón latiendo rápido"]] },
  { id: "frustrated", ico: "🧩", en: "The puzzle piece won't fit... again and again.", es: "La pieza del rompecabezas no encaja... otra vez.", mood: "upset",
    clues: [["Tight jaw", "Mandíbula apretada"], ["Wanting to give up", "Ganas de rendirse"], ["Shoulders up by ears", "Hombros hasta las orejas"]] },
  { id: "worried", ico: "📖", en: "Pip has to read out loud in front of the whole class.", es: "Pip tiene que leer en voz alta frente a toda la clase.", mood: "worried",
    clues: [["Butterflies in the tummy", "Mariposas en la barriga"], ["Shaky hands", "Manos temblorosas"], ["Thoughts racing", "Pensamientos acelerados"]] },
  { id: "overwhelmed", ico: "🔊", en: "The room is SO loud and everything is happening at once.", es: "El salón está MUY ruidoso y todo pasa a la vez.", mood: "upset",
    clues: [["Hands over ears", "Manos en las orejas"], ["Can't think straight", "No puede pensar bien"], ["Wanting to hide", "Ganas de esconderse"]] },
  { id: "excited", ico: "🎉", en: "It's party time and Pip is SO excited, can't stay still!", es: "¡Es la fiesta y Pip está TAN emocionado que no se queda quieto!", mood: "excited",
    clues: [["Can't sit still", "No puede quedarse quieto"], ["Fast breathing", "Respiración rápida"], ["Voice getting LOUD", "La voz sube MUY fuerte"]] },
];
const EMO = { angry: ["Angry", "Enojado"], upset: ["Frustrated", "Frustrado"], frustrated: ["Frustrated", "Frustrado"], worried: ["Worried", "Preocupado"], overwhelmed: ["Overwhelmed", "Abrumado"], excited: ["Over-excited", "Muy emocionado"] };
const calmSeen = new Set();
export function playCalm(host) {
  return new Promise(done => {
    let pool = CALM_SCENES.filter(s => !calmSeen.has(s.id)); if (!pool.length) { calmSeen.clear(); pool = CALM_SCENES; }
    const sc = pool[Math.floor(Math.random() * pool.length)]; calmSeen.add(sc.id);
    const emoKey = sc.id === "frustrated" ? "frustrated" : sc.id;
    let wrong = 0, aggr = 0, meter = 35, timer = null, step = "clues", clueSet = new Set(), helpDone = new Set();
    const steps = ["clues", "stop", "away", "breathe", "help", "return"];
    host.innerHTML = "";
    const root = $(`<div class="pq-quest pq-cove"><div class="pq-stepbar"></div>
      <p class="pq-feel">${L("Feeling big feelings is OK. What matters is what Pip DOES next.", "Sentir emociones fuertes está bien. Lo importante es lo que Pip HACE después.")}</p>
      <div class="pq-covescene"><div class="pq-scn"><span class="pq-scn__ico" aria-hidden="true">${sc.ico}</span><p>${L(sc.en, sc.es)}</p></div>
        <div class="pq-covepip">${charSVG(PIP, sc.mood, 120)}</div>
        <div class="pq-meter" role="img" aria-label="${L("Feeling meter", "Medidor de sentimientos")}"><div class="pq-meter__fill"></div><span>${L("Feeling", "Siento")}</span></div></div>
      <p class="pq-say" role="status" aria-live="polite"></p><div class="pq-cove__body"></div></div>`);
    host.append(root);
    const bar = root.querySelector(".pq-stepbar"), fill = root.querySelector(".pq-meter__fill"), pipE = root.querySelector(".pq-covepip"), body = root.querySelector(".pq-cove__body"), say = root.querySelector(".pq-say"), scene = root.querySelector(".pq-covescene");
    const setMeter = v => { meter = Math.max(5, Math.min(95, v)); fill.style.height = meter + "%"; fill.style.background = meter > 65 ? "#e0463d" : meter > 40 ? "#f0a024" : "#3bb58a"; };
    const setPip = m => pipE.innerHTML = charSVG(PIP, m, 120);
    const names = { clues: ["Notice", "Notar"], stop: ["Stop", "Parar"], away: ["Step away", "Alejarse"], breathe: ["Breathe", "Respirar"], help: ["Get help", "Pedir ayuda"], return: ["Return", "Volver"] };
    const drawBar = () => { bar.innerHTML = steps.map((s, i) => `<span class="pq-stepbar__s ${i < steps.indexOf(step) ? "is-done" : ""} ${s === step ? "is-now" : ""}">${i + 1}. ${L(names[s][0], names[s][1])}</span>`).join(""); };
    const finish = () => { clearInterval(timer); const q = Math.max(.25, 1 - .15 * wrong); done({ q, detail: { scene: sc.id, wrong, aggression: aggr, steps: "notice>stop>step away>breathe>help>return" }, shock: aggr ? { friends: -8, calm: -4 } : null }); };
    const go = (s) => { step = s; drawBar(); body.innerHTML = ""; ({ clues, stop, away, breathe, help, ret })[s === "return" ? "ret" : s](); };
    setMeter(35); drawBar();
    timer = setInterval(() => { if (!live(host)) return clearInterval(timer); if (step === "clues" && meter < 78) setMeter(meter + 2); }, 450);

    function clues() {
      say.textContent = L("Notice! Tap Pip's body clues.", "¡Observa! Toca las pistas del cuerpo de Pip.");
      const row = $(`<div class="pq-grid pq-grid--clues"></div>`); body.append(row);
      sc.clues.forEach((c, i) => { const b = optBtn(["✊", "🥵", "💓"][i] || "❓", L(c[0], c[1])); row.append(b); b.addEventListener("click", () => { clueSet.add(i); b.classList.add("is-hit"); b.disabled = true; if (clueSet.size === 3) nameIt(); }); });
      const nameHost = $(`<div class="pq-namehost"></div>`); body.append(nameHost);
      function nameIt() {
        say.textContent = L("What is Pip feeling? Name it!", "¿Qué siente Pip? ¡Ponle nombre!");
        const opts = shuffle([emoKey, ...shuffle(["angry", "worried", "overwhelmed", "excited", "frustrated"].filter(e => e !== emoKey)).slice(0, 2)]);
        nameHost.innerHTML = ""; const r2 = $(`<div class="pq-grid pq-grid--names"></div>`); nameHost.append(r2);
        opts.forEach(e => { const b = optBtn("🏷️", L(...EMO[e])); r2.append(b); b.addEventListener("click", () => {
          if (e === emoKey) { b.classList.add("is-hit"); say.textContent = L(`Yes - ${EMO[e][0].toLowerCase()}! Naming a feeling helps us handle it.`, `¡Sí - ${EMO[e][1].toLowerCase()}! Ponerle nombre a un sentimiento nos ayuda a manejarlo.`); setTimeout(() => go("stop"), reducedMotion() ? 400 : 1300); }
          else { wrong++; shake(b); b.classList.add("is-miss"); say.textContent = L("Not quite - look at the body clues again.", "No exactamente - mira otra vez las pistas del cuerpo."); } }); });
      }
    }
    function stop() {
      say.textContent = L("The feeling is at its biggest! What does Pip do?", "¡El sentimiento está en su punto más alto! ¿Qué hace Pip?");
      const opts = shuffle([
        { ico: "👊", en: "Hit back", es: "Devolver el golpe", bad: 1, hit: 1, r: ["Ouch! Hitting hurts someone. It is never OK to hurt people, and it makes things worse.", "¡Ay! Pegar hace daño. Nunca está bien lastimar a otros y empeora todo."] },
        { ico: "🤬", en: "Yell and throw things", es: "Gritar y tirar cosas", bad: 1, hit: 1, r: ["Throwing things can hurt people and break things. Pip needs a different plan.", "Tirar cosas puede lastimar y romper. Pip necesita otro plan."] },
        { ico: "🛑", en: "STOP and freeze", es: "PARAR y quedarse quieto", bad: 0 },
        { ico: "🗯️", en: "Be mean back", es: "Ser malo también", bad: 1, r: ["Mean words hurt feelings too. Try again.", "Las palabras malas también duelen. Inténtalo otra vez."] }]);
      const g = $(`<div class="pq-grid pq-grid--stop"></div>`); body.append(g);
      opts.forEach(o => { const b = optBtn(o.ico, L(o.en, o.es), o.bad ? "" : "pq-opt--stop"); g.append(b); b.addEventListener("click", () => {
        if (o.bad) { wrong++; if (o.hit) aggr++; shake(b); b.classList.add("is-miss"); b.disabled = true; setMeter(meter + 6); setPip("angry"); say.textContent = L(o.r[0], o.r[1]); scene.classList.add("is-warn"); setTimeout(() => scene.classList.remove("is-warn"), 800); }
        else { b.classList.add("is-hit"); say.textContent = L("STOP. Pip freezes. The meter stops rising. Great start!", "PARAR. Pip se congela. El medidor deja de subir. ¡Buen comienzo!"); setTimeout(() => go("away"), reducedMotion() ? 400 : 1200); } }); });
    }
    function away() {
      say.textContent = L("Step away from the problem. Take Pip to the Calm Corner.", "Aléjate del problema. Lleva a Pip al Rincón de la Calma.");
      scene.classList.remove("is-warn");
      const b = optBtn("🪑", L("Walk to the Calm Corner", "Ir al Rincón de la Calma"), "pq-opt--wide"); body.append(b);
      b.addEventListener("click", () => { b.disabled = true; scene.classList.add("is-away"); setPip("okay"); setMeter(meter - 8); say.textContent = L("Pip is away from the trouble. Space helps!", "Pip está lejos del problema. ¡El espacio ayuda!"); setTimeout(() => go("breathe"), reducedMotion() ? 400 : 1400); });
    }
    function breathe() {
      let good = 0, held = 0, tick = null, busy = false, guided = false;
      say.textContent = L("Slow down. HOLD the button to breathe IN, let go to breathe OUT. Make 3 slow breaths.", "Ve más despacio. MANTÉN el botón para inspirar y suéltalo para espirar. Haz 3 respiraciones lentas.");
      const ring = $(`<div class="pq-breath"><div class="pq-breath__guide"></div><div class="pq-breath__ball"></div><span class="pq-breath__txt"></span></div>`);
      const btn = $(`<button type="button" class="btn btn--signal pq-breathbtn">${L("Hold to breathe IN", "Mantén para INSPIRAR")}</button>`);
      const auto = $(`<button type="button" class="btn btn--ghost">${L("Breathe with me (guided)", "Respira conmigo (guiado)")}</button>`);
      const dots = $(`<div class="pq-dots" aria-live="polite"></div>`); body.append(ring, btn, auto, dots);
      const ball = ring.querySelector(".pq-breath__ball"), txt = ring.querySelector(".pq-breath__txt");
      const paintDots = () => dots.textContent = "🌬️".repeat(good) + "·".repeat(3 - good);
      paintDots();
      const scale = s => ball.style.transform = `scale(${s})`; scale(1);
      const goodBreath = async () => { good++; setMeter(meter - 22); paintDots(); setPip(good >= 3 ? "calm" : "okay"); txt.textContent = L("Breathe OUT...", "Espira..."); scale(1); busy = true; btn.disabled = true; await wait(reducedMotion() ? 300 : 2200); if (!live(host)) return; busy = false; btn.disabled = false; txt.textContent = ""; if (good >= 3) { btn.disabled = true; auto.disabled = true; say.textContent = L("Pip's body is settling. 3 slow breaths!", "El cuerpo de Pip se está calmando. ¡3 respiraciones lentas!"); setTimeout(() => go("help"), reducedMotion() ? 400 : 1400); } };
      const start = e => { if (busy || good >= 3) return; e.preventDefault(); held = 0; txt.textContent = L("Breathe IN... slowly", "Inspira... despacio"); clearInterval(tick); tick = setInterval(() => { if (!live(host)) return clearInterval(tick); held += .05; scale(1 + Math.min(held, 3.5) / 3.5 * .9); }, 50); };
      const end = () => { if (!tick) return; clearInterval(tick); tick = null; if (busy || good >= 3) return; if (held >= 2) goodBreath(); else { scale(1); txt.textContent = L("Try a longer, slower breath in.", "Intenta una inspiración más larga y lenta."); } held = 0; };
      btn.addEventListener("pointerdown", start); btn.addEventListener("pointerup", end); btn.addEventListener("pointerleave", end); btn.addEventListener("pointercancel", end);
      btn.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); }); btn.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") end(); });
      auto.addEventListener("click", async () => { if (busy || guided) return; guided = true; auto.disabled = true; btn.disabled = true;
        while (good < 3 && live(host)) { txt.textContent = L("Breathe IN...", "Inspira..."); for (let s = 1; s <= 20; s++) { scale(1 + s / 20 * .9); await wait(reducedMotion() ? 10 : 150); } good++; setMeter(meter - 22); paintDots(); txt.textContent = L("Breathe OUT...", "Espira..."); scale(1); await wait(reducedMotion() ? 200 : 2000); }
        if (!live(host)) return; setPip("calm"); say.textContent = L("Pip's body is settling. 3 slow breaths!", "El cuerpo de Pip se está calmando. ¡3 respiraciones lentas!"); setTimeout(() => go("help"), 900); });
    }
    function help() {
      setMeter(Math.min(meter, 25)); setPip("okay");
      say.textContent = L("Pip is calmer. Now fix the problem safely. Pick TWO good ideas.", "Pip está más tranquilo. Ahora arregla el problema con seguridad. Elige DOS buenas ideas.");
      const opts = shuffle([
        { id: "words", ico: "💬", en: "Use words: \"I felt upset because...\"", es: "Usar palabras: \"Me sentí mal porque...\"", ok: 1 },
        { id: "adult", ico: "🧑‍🏫", en: "Ask a teacher or trusted adult for help", es: "Pedir ayuda a un maestro o adulto de confianza", ok: 1 },
        { id: "secret", ico: "🤐", en: "Keep it all inside", es: "Guardarlo todo adentro", ok: 0, r: ["Keeping big feelings inside can make them grow. Sharing helps.", "Guardar emociones fuertes puede hacerlas crecer. Compartir ayuda."] },
        { id: "revenge", ico: "😈", en: "Get them back later", es: "Vengarse después", ok: 0, r: ["Getting back at someone starts a bigger problem. Try again.", "Vengarse empieza un problema mayor. Inténtalo otra vez."] }]);
      const g = $(`<div class="pq-grid pq-grid--help"></div>`); body.append(g);
      opts.forEach(o => { const b = optBtn(o.ico, L(o.en, o.es)); g.append(b); b.addEventListener("click", () => {
        if (!o.ok) { wrong++; shake(b); b.classList.add("is-miss"); b.disabled = true; say.textContent = L(o.r[0], o.r[1]); return; }
        helpDone.add(o.id); b.classList.add("is-hit"); b.disabled = true;
        say.textContent = o.id === "adult" ? L("Getting an adult is a brave and smart choice!", "¡Pedir ayuda a un adulto es una decisión valiente e inteligente!") : L("Using words is a strong, safe way to be heard.", "Usar palabras es una forma fuerte y segura de ser escuchado.");
        if (helpDone.size === 2) setTimeout(() => go("return"), reducedMotion() ? 400 : 1300); }); });
    }
    function ret() {
      say.textContent = L("When everyone is safe and Pip is calm, Pip can go back.", "Cuando todos están seguros y Pip está en calma, Pip puede volver.");
      const b = optBtn("🤝", L("Rejoin the group", "Volver con el grupo"), "pq-opt--wide"); body.append(b);
      b.addEventListener("click", () => { b.disabled = true; setMeter(10); setPip("happy"); scene.classList.remove("is-away"); scene.classList.add("is-cheer"); say.textContent = L("Pip is back, calm, and everyone is cheering! Feelings are OK - Pip chose a safe plan.", "¡Pip vuelve en calma y todos celebran! Los sentimientos están bien - Pip eligió un plan seguro."); setTimeout(finish, reducedMotion() ? 500 : 2200); });
    }
    go("clues");
  });
}

/* ============================================================== PLAYGROUND */
const KIDS = { alex: "#6fb7ff", mia: "#c58cf0", tom: "#7bd88f", sam: "#ff7a6e", lena: "#ffd34d" };
const S = (en, es) => [en, es];
const PLAY = [
  { id: "alone", kid: ["alex", "worried"], intro: S("Alex is sitting all alone at lunch.", "Alex está sentado solo en el almuerzo."), steps: [{ prompt: S("What does Pip do?", "¿Qué hace Pip?"), opts: [
    { ico: "🙋", t: S("Invite Alex to sit together", "Invitar a Alex a sentarse juntos"), good: 1, r: S("Alex smiles! Including someone makes them feel they belong.", "¡Alex sonríe! Incluir a alguien le hace sentir que pertenece."), mood: "happy" },
    { ico: "👋", t: S("Smile and wave", "Sonreír y saludar"), good: .7, r: S("A friendly wave helps. Asking Alex to join would help even more!", "Un saludo amable ayuda. ¡Pedirle que se una ayudaría aún más!"), mood: "okay" },
    { ico: "🚶", t: S("Walk past", "Pasar de largo"), good: 0, r: S("Alex still feels lonely. Try again!", "Alex sigue sintiéndose solo. ¡Inténtalo otra vez!"), mood: "upset" }] }] },
  { id: "cry", kid: ["mia", "upset"], intro: S("Mia is crying because she lost her game.", "Mia llora porque perdió su juego."), steps: [{ prompt: S("What does Pip do?", "¿Qué hace Pip?"), opts: [
    { ico: "👂", t: S("Sit with Mia and listen", "Sentarse con Mia y escuchar"), good: 1, r: S("Mia feels heard. Listening is a kind way to help.", "Mia se siente escuchada. Escuchar es una forma amable de ayudar."), mood: "happy" },
    { ico: "🧑‍🏫", t: S("Fetch a teacher to help", "Buscar a un maestro"), good: .8, r: S("Getting a grown-up to help is a caring choice.", "Buscar un adulto que ayude es una decisión cariñosa."), mood: "okay" },
    { ico: "😂", t: S("Laugh at her", "Reírse de ella"), good: 0, r: S("Laughing makes Mia feel worse. Try again!", "Reírse hace que Mia se sienta peor. ¡Inténtalo otra vez!"), mood: "upset" },
    { ico: "🙄", t: S("Say \"stop crying\"", "Decir \"deja de llorar\""), good: 0, r: S("Telling someone to stop doesn't help them feel better. Try again!", "Decirle a alguien que pare no le ayuda. ¡Inténtalo otra vez!"), mood: "upset" }] }] },
  { id: "swing", kid: ["tom", "angry"], intro: S("Tom and Lena both want the one swing!", "¡Tom y Lena quieren el único columpio!"), steps: [{ prompt: S("What does Pip suggest?", "¿Qué sugiere Pip?"), opts: [
    { ico: "🔢", t: S("Take turns, count to 10 each", "Turnarse, contar hasta 10 cada uno"), good: 1, r: S("Taking turns is fair. Both friends get a go!", "Turnarse es justo. ¡Los dos amigos tienen su turno!"), mood: "happy" },
    { ico: "🤝", t: S("Push each other on the swing", "Empujarse uno al otro en el columpio"), good: .9, r: S("Sharing and working together makes it fun for both!", "¡Compartir y colaborar lo hace divertido para los dos!"), mood: "happy" },
    { ico: "🫳", t: S("Grab the swing for yourself", "Agarrar el columpio para uno mismo"), good: 0, r: S("Grabbing makes others upset. Try again!", "Agarrar molesta a los demás. ¡Inténtalo otra vez!"), mood: "angry" }] }] },
  { id: "team", kid: ["lena", "worried"], intro: S("The class is building a tall tower. Lena wants to help but her hands are full.", "La clase construye una torre alta. Lena quiere ayudar pero tiene las manos ocupadas."), steps: [{ prompt: S("What does Pip do?", "¿Qué hace Pip?"), opts: [
    { ico: "🏗️", t: S("Hold the base steady so Lena can add her block", "Sostener la base para que Lena ponga su bloque"), good: 1, r: S("Working together: the tower gets taller than anyone could build alone!", "Trabajando juntos, ¡la torre queda más alta de lo que cualquiera lograría solo!"), mood: "happy" },
    { ico: "🙅", t: S("Tell Lena to go away", "Decirle a Lena que se vaya"), good: 0, r: S("Lena feels left out. Try again!", "Lena se siente excluida. ¡Inténtalo otra vez!"), mood: "upset" },
    { ico: "🧍", t: S("Build alone", "Construir solo"), good: .3, r: S("It is slower and wobbly alone. Teamwork is better!", "Solo es más lento e inestable. ¡Trabajar en equipo es mejor!"), mood: "okay" }] }] },
  { id: "push", kid: ["sam", "angry"], conflict: true, intro: S("In the line, Sam pushed Pip!", "¡En la fila, Sam empujó a Pip!"), steps: [
    { prompt: S("Right now, Pip...", "Ahora mismo, Pip..."), opts: [
      { ico: "🛑", t: S("Stops and steps away", "Se detiene y se aleja"), good: 1, r: S("Stopping and moving away keeps everyone safe.", "Detenerse y alejarse mantiene a todos seguros."), mood: "calm" },
      { ico: "👊", t: S("Pushes back", "Empuja de vuelta"), good: 0, hit: 1, r: S("Ouch! Pushing back hurts and makes the problem bigger. Hurting people is never OK.", "¡Ay! Empujar de vuelta duele y agranda el problema. Lastimar nunca está bien."), mood: "angry" },
      { ico: "🤬", t: S("Shouts really loudly", "Grita muy fuerte"), good: 0, r: S("Shouting makes everyone more upset. Try again!", "Gritar molesta más a todos. ¡Inténtalo otra vez!"), mood: "angry" }] },
    { prompt: S("Pip uses words...", "Pip usa palabras..."), opts: [
      { ico: "💬", t: S("\"Please don't push me. I didn't like it.\"", "\"Por favor no me empujes. No me gustó.\""), good: 1, r: S("Calm, clear words let Sam know what's wrong.", "Palabras claras y tranquilas le dicen a Sam qué pasó."), mood: "calm" },
      { ico: "🗯️", t: S("Call Sam a mean name", "Ponerle un apodo malo a Sam"), good: 0, r: S("Mean names hurt too. Try again!", "Los apodos malos también duelen. ¡Inténtalo otra vez!"), mood: "angry" },
      { ico: "🤐", t: S("Say nothing and stew", "No decir nada y rumiarlo"), good: 0, r: S("Staying silent keeps the feeling stuck. Try again!", "Quedarse callado deja el sentimiento atascado. ¡Inténtalo otra vez!"), mood: "upset" }] },
    { prompt: S("Then Pip...", "Luego Pip..."), opts: [
      { ico: "🧑‍🏫", t: S("Tells a teacher what happened", "Le cuenta a un maestro lo que pasó"), good: 1, r: S("Telling an adult is brave and sensible. They can help everyone be safe.", "Contarle a un adulto es valiente y sensato. Puede ayudar a que todos estén seguros."), mood: "happy" },
      { ico: "🙊", t: S("Keeps it a secret", "Lo guarda en secreto"), good: 0, r: S("Secrets about being hurt are best shared with an adult. Try again!", "Los secretos sobre ser lastimado se cuentan a un adulto. ¡Inténtalo otra vez!"), mood: "upset" },
      { ico: "😈", t: S("Plans to get Sam back later", "Planea vengarse de Sam"), good: 0, r: S("Getting even never solves it. Try again!", "Vengarse nunca lo resuelve. ¡Inténtalo otra vez!"), mood: "angry" }] }] },
];
const playSeen = new Set();
export function playFriends(host) {
  return new Promise(done => {
    let pool = PLAY.filter(s => !playSeen.has(s.id)); if (!pool.length) { playSeen.clear(); pool = PLAY; }
    const sc = pool[Math.floor(Math.random() * pool.length)]; playSeen.add(sc.id);
    let stepI = 0, wrong = 0, hits = 0, kindGood = 0; const choices = [];
    host.innerHTML = "";
    const root = $(`<div class="pq-quest"><div class="pq-stage pq-stage--play"><div class="pq-pg-pip"></div><div class="pq-pg-kid"></div><div class="pq-hearts" aria-hidden="true"></div></div>
      <p class="pq-say"></p><div class="pq-grid pq-grid--play"></div></div>`);
    host.append(root);
    const pg = root.querySelector(".pq-pg-pip"), kid = root.querySelector(".pq-pg-kid"), hearts = root.querySelector(".pq-hearts"), say = root.querySelector(".pq-say"), g = root.querySelector(".pq-grid");
    const paint = (pm, km) => { pg.innerHTML = charSVG(PIP, pm, 100); kid.innerHTML = charSVG(KIDS[sc.kid[0]], km, 100); };
    paint("okay", sc.kid[1]);
    const show = () => {
      const st = sc.steps[stepI]; say.textContent = (stepI === 0 ? L(...sc.intro) + " " : "") + L(...st.prompt); g.innerHTML = "";
      shuffle(st.opts).forEach(o => { const b = optBtn(o.ico, L(...o.t)); g.append(b); b.addEventListener("click", () => {
        choices.push(L(...o.t));
        if (o.good < .25) { wrong++; shake(b); b.classList.add("is-miss"); b.disabled = true; say.textContent = L(...o.r); paint(o.hit ? "upset" : "okay", o.mood); if (o.hit) { hits++; kid.classList.add("pq-shake"); } return; }
        b.classList.add("is-hit"); g.querySelectorAll("button").forEach(x => x.disabled = true); hits += 0; kindGood += o.good;
        say.textContent = L(...o.r); paint(o.mood === "happy" ? "happy" : (o.mood === "calm" ? "calm" : "okay"), o.mood === "calm" ? "okay" : "happy");
        hearts.textContent = "💖 💖 💖"; pop(hearts);
        setTimeout(() => { hearts.textContent = ""; stepI++; if (stepI >= sc.steps.length) done({ q: Math.max(.25, Math.min(1, kindGood / sc.steps.length - .2 * wrong)), detail: { scene: sc.id, wrong, aggression: hits, choices }, shock: hits ? { friends: -10, calm: -5 } : null }); else { paint("okay", "okay"); show(); } }, reducedMotion() ? 600 : 2300);
      }); });
    };
    show();
  });
}

export const QUESTS = { food: playFood, move: playMove, sleep: playSleep, calm: playCalm, friends: playFriends };
