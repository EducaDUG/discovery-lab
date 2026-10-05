/* Pentagon Quest — bonus round: BALANCE RUSH (build-and-balance + resource loop).
   Two minutes of real time. The 3D Pentagon Park is live: little storms roll over
   one pillar at a time and its height sinks. Tap that part's photo button (or press
   1-5) to look after it, and care ripples into its linked parts. Keep the pentagon
   level to bank "balanced seconds". There is no fail state: Pip never falls off, a
   wobbly floor just means you didn't bank that second.
   Timer and game state run on setInterval (wall clock); the scene only draws. */
import { L, PILLARS, IDS, LINKS, pname, balance, mood } from "./model.js?v=1";

const DURATION = 120;                 // seconds of real play
const PHOTO = { food: "photos/food-veg.jpg", move: "photos/move-run.jpg", sleep: "photos/sleep.jpg", calm: "photos/calm.jpg", friends: "photos/friends.jpg" };
const NEED = {
  food:    ["Pip is hungry for lunch!", "¡Pip tiene hambre de almuerzo!"],
  move:    ["Pip needs to wiggle and move!", "¡Pip necesita moverse!"],
  sleep:   ["Pip is getting sleepy!", "¡Pip se está durmiendo!"],
  calm:    ["Pip feels a big feeling coming!", "¡Pip siente una emoción fuerte!"],
  friends: ["Pip feels lonely!", "¡Pip se siente solo!"],
};

export function renderLaunch(host, onPlay, onSkip) {
  host.innerHTML = "";
  const c = document.createElement("div"); c.className = "pq-card pq-bonuscard";
  c.innerHTML = `<p class="eyebrow">${L("Bonus round", "Ronda extra")}</p><h3>${L("Balance Rush!", "¡Carrera del equilibrio!")}</h3>
    <p>${L("Storms roll over the Pentagon. Quick! Look after the part that is sinking and keep Pip's floor level for 2 minutes. Keys 1-5 work too.", "Las tormentas pasan por el Pentágono. ¡Rápido! Cuida la parte que se hunde y mantén el piso de Pip nivelado durante 2 minutos. Las teclas 1-5 también funcionan.")}</p>
    <p class="pq-hint">${L("Optional. It does not change your marks. You can't lose!", "Opcional. No cambia tus notas. ¡No se puede perder!")}</p>
    <div class="pq-actions"><button type="button" class="btn btn--signal" data-a="play">${L("Play (2 min)", "Jugar (2 min)")}</button><button type="button" class="btn btn--ghost" data-a="skip">${L("Skip", "Saltar")}</button></div>`;
  c.querySelector("[data-a=play]").addEventListener("click", onPlay);
  c.querySelector("[data-a=skip]").addEventListener("click", onSkip);
  host.append(c);
}

export function playBalanceRush(host, scene) {
  return new Promise(done => {
    const v = {}; IDS.forEach(i => v[i] = 72);
    let t = 0, balancedSec = 0, streak = 0, best = 0, careCount = 0, savedStorms = 0, storm = null, stormAge = 0, nextStorm = 3, lastStorm = null, cd = {}, ended = false;
    host.innerHTML = "";
    const root = document.createElement("div"); root.className = "pq-rush";
    root.innerHTML = `<div class="pq-rush__hud"><div class="pq-rush__time"><span class="pq-rush__bar"></span></div>
        <p class="pq-rush__stat" aria-live="off"></p></div>
      <p class="pq-say pq-rush__msg" role="status" aria-live="polite"></p>
      <div class="pq-rush__btns"></div>`;
    host.append(root);
    const bar = root.querySelector(".pq-rush__bar"), stat = root.querySelector(".pq-rush__stat"), msg = root.querySelector(".pq-rush__msg"), btns = root.querySelector(".pq-rush__btns");
    const buttons = {};
    PILLARS.forEach((p, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pq-rushbtn"; b.style.setProperty("--c", p.color);
      b.innerHTML = `<img src="${PHOTO[p.id]}" alt=""><span class="pq-rushbtn__k">${i + 1}</span><span class="pq-rushbtn__l">${pname(p.id)}</span>`;
      b.addEventListener("click", () => care(p.id)); btns.append(b); buttons[p.id] = b;
    });
    const keyH = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 5 && !e.ctrlKey && !e.metaKey && !e.altKey) { const tg = e.target; if (tg && /INPUT|TEXTAREA|SELECT/.test(tg.tagName)) return; care(IDS[n - 1]); } };
    document.addEventListener("keydown", keyH);
    msg.textContent = L("Go! Watch for storms.", "¡Ya! Atento a las tormentas.");
    scene.setValues(v, true); scene.setMood("happy");

    function care(id) {
      if (ended) return; const now = performance.now(); if (cd[id] && now - cd[id] < 450) return; cd[id] = now;
      v[id] = Math.min(100, v[id] + 18); careCount++;
      (LINKS[id] || []).forEach(l => { v[l.to] = Math.min(100, v[l.to] + l.amt * .6); scene.ripple(id, l.to); });
      scene.pulse(id); buttons[id].classList.remove("is-tap"); void buttons[id].offsetWidth; buttons[id].classList.add("is-tap");
      if (storm === id) { storm = null; savedStorms++; scene.setStorm(null); msg.textContent = L(`Saved ${pname(id)}! The storm moves on.`, `¡${pname(id)} a salvo! La tormenta se va.`); Object.values(buttons).forEach(b => b.classList.remove("is-need")); nextStorm = t + Math.max(2.2, 5 - t / 30); }
    }
    const t0 = performance.now(); let lastTick = t0;
    const timer = setInterval(() => {
      if (!host.isConnected) return finish(true);
      const now = performance.now(); const dt = Math.min(.3, (now - lastTick) / 1000); lastTick = now; t = (now - t0) / 1000;   /* wall clock, not tick count */
      IDS.forEach(id => { v[id] = Math.max(8, v[id] - dt * (1.0 + t / 120 * .8)); });
      if (!storm && t >= nextStorm) { const pool = IDS.filter(i => i !== lastStorm); storm = pool[Math.floor(Math.random() * pool.length)]; lastStorm = storm; stormAge = 0; scene.setStorm(storm); msg.textContent = L(...NEED[storm]); buttons[storm].classList.add("is-need"); }
      if (storm) { stormAge += dt; v[storm] = Math.max(8, v[storm] - dt * 9); if (stormAge > 5) { Object.values(buttons).forEach(b => b.classList.remove("is-need")); storm = null; scene.setStorm(null); nextStorm = t + 3; msg.textContent = L("The storm blew over. Keep going!", "La tormenta pasó. ¡Sigue!"); } }
      const bal = balance(v);
      if (bal >= 75) { balancedSec += dt; streak += dt; best = Math.max(best, streak); } else streak = 0;
      scene.setValues(v); scene.setMood(bal >= 80 ? "happy" : (Math.min(...IDS.map(i => v[i])) < 30 ? "tired" : "okay"));
      bar.style.width = Math.min(100, t / DURATION * 100) + "%";
      stat.textContent = L(`Level floor: ${bal}%   ·   Balanced: ${Math.round(balancedSec)}s   ·   ${Math.max(0, Math.ceil(DURATION - t))}s left`, `Piso nivelado: ${bal}%   ·   Equilibrado: ${Math.round(balancedSec)}s   ·   ${Math.max(0, Math.ceil(DURATION - t))}s restantes`);
      if (t >= DURATION) finish(false);
    }, 100);

    function finish(aborted) {
      if (ended) return; ended = true; clearInterval(timer); document.removeEventListener("keydown", keyH); scene.setStorm(null);
      const res = { balancedSeconds: Math.round(balancedSec), bestStreak: Math.round(best), careTaps: careCount, stormsSaved: savedStorms, seconds: Math.round(t) };
      if (aborted) return done(res);
      host.innerHTML = "";
      const c = document.createElement("div"); c.className = "pq-card pq-bonuscard";
      const pct = Math.round(balancedSec / DURATION * 100);
      c.innerHTML = `<p class="eyebrow">${L("Round complete!", "¡Ronda completa!")}</p><h3>${L(`Pip's floor stayed level for ${res.balancedSeconds} seconds`, `El piso de Pip estuvo nivelado ${res.balancedSeconds} segundos`)}</h3>
        <p>${L(`Best level streak: ${res.bestStreak}s · Storms saved: ${res.stormsSaved} · Care taps: ${res.careTaps}`, `Mejor racha: ${res.bestStreak}s · Tormentas superadas: ${res.stormsSaved} · Toques de cuidado: ${res.careTaps}`)}</p>
        <p class="pq-hint">${pct >= 60 ? L("Amazing balancing! You looked after the whole Pentagon.", "¡Equilibrio increíble! Cuidaste todo el Pentágono.") : L("Looking after ONE part at a time is hard. Try again and spread your care around!", "Cuidar UNA sola parte es difícil. ¡Inténtalo otra vez y reparte tu cuidado!")}</p>
        <div class="pq-actions"><button type="button" class="btn btn--signal">${L("Back to the park", "Volver al parque")}</button></div>`;
      host.append(c); c.querySelector("button").addEventListener("click", () => done(res));
    }
  });
}
