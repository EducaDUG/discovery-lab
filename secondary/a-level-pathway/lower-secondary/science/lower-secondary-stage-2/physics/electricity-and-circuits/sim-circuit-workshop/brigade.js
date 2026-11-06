/* brigade.js — "Blackout Brigade" bonus round (speech-bubble shooting gallery, CLAUDE.md §4 mechanic library).
   A scenario photo + question appears in a speech bubble; three glowing bulb-targets glide across the gallery,
   each carrying one answer. Tap the right one (or press 1-3) to light it up. 120 s on a wall-clock setInterval
   (requestAnimationFrame is never used for game state). No lives, no fail state: a wrong or late answer only
   resets the streak and shows the right answer plus a one-line memory hook in place. Silent (no audio), so no mute
   button is needed. Contributes no marks. Real photos on every prompt (credits on the page). */

const DURATION = 120000, PATIENCE = 14000;

/* [photo, question[en,es], options(correct first)[[en,es]...], hook[en,es]] */
const BANK = [
  ["xmas", ["One old bulb blows and the WHOLE string of fairy lights goes dark. How are the bulbs wired?", "Se funde una bombilla vieja y TODA la tira de luces se apaga. ¿Cómo están conectadas?"],
    [["In series - one loop", "En serie - un solo camino"], ["In parallel - a loop each", "En paralelo - un camino cada una"], ["They are not joined", "No están unidas"]],
    ["One loop: break it anywhere and the current stops everywhere.", "Un solo camino: si se rompe en cualquier punto, la corriente se detiene en todas partes."]],
  ["room", ["One lamp in a house blows, but every other lamp stays on. How are the lamps wired?", "Se funde una lámpara de la casa, pero todas las demás siguen encendidas. ¿Cómo están conectadas?"],
    [["In parallel - a loop each", "En paralelo - un camino cada una"], ["In series - one loop", "En serie - un solo camino"], ["With no wires at all", "Sin ningún cable"]],
    ["Each lamp has its own loop back to the supply.", "Cada lámpara tiene su propio camino de vuelta a la fuente."]],
  ["switch", ["This wall switch is OFF. What has it done to the circuit?", "Este interruptor de pared está APAGADO. ¿Qué le ha hecho al circuito?"],
    [["Opened a gap in the loop", "Abrió un hueco en el camino"], ["Removed the cell", "Quitó la pila"], ["Broke the bulb", "Rompió la bombilla"]],
    ["OFF = gap = no complete loop = no current.", "APAGADO = hueco = sin camino completo = sin corriente."]],
  ["cell", ["What is the job of the cell in a circuit?", "¿Cuál es el trabajo de la pila en un circuito?"],
    [["Pushes the current round", "Empuja la corriente"], ["Makes light", "Produce luz"], ["Stops the current", "Detiene la corriente"]],
    ["The cell is the pusher; the bulb is where the energy is used.", "La pila es quien empuja; la bombilla es donde se usa la energía."]],
  ["torch", ["Press the torch button and the light comes on. Which part opens and closes the loop?", "Pulsas el botón de la linterna y se enciende. ¿Qué parte abre y cierra el camino?"],
    [["The switch", "El interruptor"], ["The lens", "La lente"], ["The grip", "El asa"]],
    ["A switch is a gate in the loop: closed lets current through, open stops it.", "Un interruptor es una puerta en el camino: cerrado deja pasar la corriente, abierto la detiene."]],
  ["coins", ["A metal coin is put in the gap and the bulb lights. What does that tell you about metals?", "Se pone una moneda de metal en el hueco y la bombilla se enciende. ¿Qué indica sobre los metales?"],
    [["They are conductors", "Son conductores"], ["They are insulators", "Son aislantes"], ["They are cells", "Son pilas"]],
    ["Metals are conductors - current flows through them.", "Los metales son conductores - la corriente pasa por ellos."]],
  ["eraser", ["A rubber eraser in the gap keeps the bulb dark. The eraser is a...", "Una goma de borrar en el hueco mantiene la bombilla apagada. La goma es un..."],
    [["Insulator", "Aislante"], ["Conductor", "Conductor"], ["Cell", "Pila"]],
    ["Rubber and plastic are insulators: they block current.", "La goma y el plástico son aislantes: bloquean la corriente."]],
  ["ruler", ["Why are electric wires covered in plastic?", "¿Por qué los cables eléctricos están cubiertos de plástico?"],
    [["Plastic is an insulator, so it keeps current in the wire and keeps us safe", "El plástico es aislante: mantiene la corriente en el cable y nos protege"], ["Plastic makes the current faster", "El plástico hace la corriente más rápida"], ["Plastic is a cell", "El plástico es una pila"]],
    ["Copper inside carries the current; plastic outside blocks it from us.", "El cobre dentro lleva la corriente; el plástico fuera la bloquea."]],
  ["spoon", ["A wooden spoon in the gap: the bulb stays dark. Wood is a...", "Una cuchara de madera en el hueco: la bombilla sigue apagada. La madera es un..."],
    [["Insulator", "Aislante"], ["Conductor", "Conductor"], ["Switch", "Interruptor"]],
    ["Wood, rubber, plastic: insulators. Metals: conductors.", "Madera, goma, plástico: aislantes. Metales: conductores."]],
  ["foil", ["Aluminium foil bridges the gap and the bulb lights. Foil is a...", "El papel de aluminio cierra el hueco y la bombilla se enciende. El papel de aluminio es un..."],
    [["Conductor", "Conductor"], ["Insulator", "Aislante"], ["Bulb", "Bombilla"]],
    ["Any metal can complete the loop.", "Cualquier metal puede completar el camino."]],
  ["clip", ["A paper clip in the gap lights the bulb. Why?", "Un clip en el hueco enciende la bombilla. ¿Por qué?"],
    [["It is metal, so it completes the loop", "Es de metal, así que completa el camino"], ["It is plastic, so it insulates", "Es de plástico, así que aísla"], ["It is a tiny cell", "Es una pila diminuta"]],
    ["Metal in the gap = complete loop = bulb on.", "Metal en el hueco = camino completo = bombilla encendida."]],
  ["breaker", ["A switchboard has many switches, one for each circuit. Why wire rooms as separate parallel circuits?", "Un cuadro eléctrico tiene muchos interruptores, uno por circuito. ¿Por qué cablear las habitaciones como circuitos paralelos separados?"],
    [["A fault in one room does not shut off the whole house", "Una avería en una habitación no apaga toda la casa"], ["It makes every bulb dimmer", "Hace que todas las bombillas brillen menos"], ["It uses no electricity", "No usa electricidad"]],
    ["Separate loops keep a fault local.", "Los caminos separados mantienen la avería localizada."]],
  ["xmas", ["Three identical bulbs are wired in SERIES on one cell. Compared with one bulb alone, each is...", "Tres bombillas idénticas conectadas en SERIE a una pila. Comparada con una sola bombilla, cada una brilla..."],
    [["Dimmer", "Menos"], ["Brighter", "Más"], ["The same", "Igual"]],
    ["In series the cell's push is shared, so each bulb gets less.", "En serie el empuje de la pila se reparte, así que cada bombilla recibe menos."]],
  ["room", ["Three identical lamps are wired in PARALLEL on one supply. Compared with one lamp alone, each is...", "Tres lámparas idénticas conectadas en PARALELO a una fuente. Comparada con una sola lámpara, cada una brilla..."],
    [["The same brightness", "Igual"], ["Dimmer", "Menos"], ["Brighter", "Más"]],
    ["In parallel each lamp has its own path, so each gets the full push.", "En paralelo cada lámpara tiene su propio camino, así que recibe el empuje completo."]],
  ["breaker", ["Which drains a cell faster: 3 bulbs in series, or 3 bulbs in parallel?", "¿Qué gasta una pila más rápido: 3 bombillas en serie o 3 en paralelo?"],
    [["3 in parallel - more current flows", "3 en paralelo - circula más corriente"], ["3 in series", "3 en serie"], ["They drain it equally", "La gastan igual"]],
    ["Parallel = three paths = three times the current from the cell.", "Paralelo = tres caminos = el triple de corriente de la pila."]],
  ["torch", ["A torch has fresh cells but will not light. Which fault could break the loop?", "Una linterna tiene pilas nuevas pero no se enciende. ¿Qué avería podría romper el camino?"],
    [["A loose contact or a broken filament", "Un contacto suelto o un filamento roto"], ["The torch is too bright", "La linterna brilla demasiado"], ["The switch is closed", "El interruptor está cerrado"]],
    ["Any break in the loop - loose contact, dead bulb, open switch - stops the current.", "Cualquier corte del camino - contacto suelto, bombilla fundida, interruptor abierto - detiene la corriente."]]
];

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";

export function mountBrigade(host, L, onEnd) {
  host.innerHTML = "";
  const wrap = document.createElement("section"); wrap.className = "sp-bonus"; host.append(wrap);
  wrap.innerHTML = `<p class="sp-bonus__eyebrow">${L("BONUS ROUND · OPTIONAL · NO MARKS", "RONDA EXTRA · OPCIONAL · SIN NOTA")}</p>
    <h3 class="sp-bonus__h">${L("Blackout Brigade", "Brigada Antiapagón")}</h3>
    <p class="sp-bonus__p">${L("The town has lost power! Read each emergency on the bubble and tap the glowing bulb with the right answer (or press 1, 2 or 3). Two minutes. Nothing here can hurt you - a miss only costs you your streak.", "¡El pueblo se ha quedado sin luz! Lee cada emergencia en el globo y toca la bombilla brillante con la respuesta correcta (o pulsa 1, 2 o 3). Dos minutos. Aquí nada puede hacerte daño - un fallo solo te cuesta la racha.")}</p>
    <div class="sp-bonus__row"><button type="button" class="sp-btn sp-bonus__play">${L("Play (2 min)", "Jugar (2 min)")}</button><button type="button" class="sp-btn sp-btn--ghost sp-bonus__skip">${L("Skip the bonus", "Saltar el extra")}</button></div>
    <p class="sp-credit sp-credit--dark">${L("Silent game - nothing here makes sound.", "Juego silencioso - aquí nada hace sonido.")}</p>`;
  wrap.querySelector(".sp-bonus__skip").addEventListener("click", () => { wrap.querySelector(".sp-bonus__p").textContent = L("No problem - the bonus round is always optional.", "Sin problema - la ronda extra siempre es opcional."); wrap.querySelector(".sp-bonus__row").remove(); onEnd && onEnd(null); });
  wrap.querySelector(".sp-bonus__play").addEventListener("click", play);

  function play() {
    wrap.innerHTML = `<div class="sp-g__hud"><span>${L("Time", "Tiempo")} <b id="spg-t">2:00</b></span><span>${L("Score", "Puntos")} <b id="spg-s">0</b></span><span>${L("Streak", "Racha")} <b id="spg-k">0</b></span></div>
      <div class="sp-g__bubble"><img id="spg-img" alt=""><div><p class="sp-g__q" id="spg-q"></p><p class="sp-g__hook" id="spg-hook" aria-live="polite"></p></div></div>
      <div class="sp-g__track" id="spg-track"></div>
      <div class="sp-g__bar"><i id="spg-bar"></i></div>`;
    const el = id => wrap.querySelector("#" + id);
    const order = shuffle(BANK.map((_, i) => i));
    let ptr = 0, score = 0, streak = 0, best = 0, correct = 0, asked = 0, locked = false, cur = null, shownAt = 0, nextTimer = 0, over = false;
    const t0 = Date.now(), missed = [];
    function popup(txt, ok) { const p = document.createElement("span"); p.className = "sp-g__pop" + (ok ? "" : " sp-g__pop--no"); p.textContent = txt; el("spg-track").append(p); setTimeout(() => p.remove(), 1100); }
    function spawn() {
      if (over) return;
      const b = BANK[order[ptr++ % order.length]]; locked = false; shownAt = Date.now();
      const opts = shuffle(b[2].map((o, i) => ({ t: L(o[0], o[1]), ok: i === 0 })));
      cur = { b, opts };
      el("spg-img").src = "photos/" + b[0] + ".jpg"; el("spg-q").textContent = L(b[1][0], b[1][1]); el("spg-hook").textContent = "";
      const tr = el("spg-track"); tr.innerHTML = "";
      opts.forEach((o, i) => {
        const btn = document.createElement("button"); btn.type = "button"; btn.className = "sp-g__tgt"; btn.dataset.i = i;
        const dur = 6 + i * 1.7 + Math.random() * 2, dir = i % 2 ? "alternate-reverse" : "alternate";
        if (!reduced()) btn.style.animation = `sp-glide ${dur}s ease-in-out ${-Math.random() * 3}s infinite ${dir}`;
        btn.style.left = (6 + i * 31) + "%";
        btn.innerHTML = `<span class="sp-g__glass" aria-hidden="true"></span><span class="sp-g__key">${i + 1}</span><span class="sp-g__lab">${o.t}</span>`;
        btn.setAttribute("aria-label", (i + 1) + ". " + o.t);
        btn.addEventListener("click", () => answer(i, btn)); tr.append(btn);
      });
    }
    function answer(i, btn, late) {
      if (locked || over) return; locked = true; asked++;
      const ok = !late && cur.opts[i].ok, tgts = wrap.querySelectorAll(".sp-g__tgt");
      tgts.forEach((t, k) => { t.disabled = true; if (cur.opts[k].ok) t.classList.add("is-right"); else t.classList.add("is-dim"); });
      const hook = L(cur.b[3][0], cur.b[3][1]);
      if (ok) {
        correct++; streak++; best = Math.max(best, streak); const gain = 10 + Math.min(10, (streak - 1) * 2); score += gain;
        btn.classList.add("is-hit"); popup("+" + gain, true); el("spg-hook").textContent = L("Lit! ", "¡Encendida! ") + hook;
      } else {
        streak = 0; missed.push({ q: L(cur.b[1][0], cur.b[1][1]), a: cur.opts.find(o => o.ok).t, h: hook });
        popup(late ? L("Time!", "¡Tiempo!") : L("Not quite", "Casi"), false);
        el("spg-hook").textContent = L("Answer: ", "Respuesta: ") + cur.opts.find(o => o.ok).t + " · " + hook;
      }
      el("spg-s").textContent = score; el("spg-k").textContent = streak;
      clearTimeout(nextTimer); nextTimer = setTimeout(spawn, ok ? 1500 : 3300);
    }
    document.addEventListener("keydown", onKey);
    function onKey(e) { if (over || locked || !/^[1-3]$/.test(e.key)) return; const i = +e.key - 1, btn = wrap.querySelector('.sp-g__tgt[data-i="' + i + '"]'); if (btn) answer(i, btn); }
    const clock = setInterval(() => {
      const left = Math.max(0, DURATION - (Date.now() - t0)); const s = Math.ceil(left / 1000);
      const tt = el("spg-t"); if (tt) tt.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      const bar = el("spg-bar"); if (bar) bar.style.width = (locked ? 0 : Math.max(0, 100 - (Date.now() - shownAt) / PATIENCE * 100)) + "%";
      if (!locked && cur && Date.now() - shownAt > PATIENCE) answer(0, null, true);
      if (left <= 0) finish();
    }, 200);
    function finish() {
      if (over) return; over = true; clearInterval(clock); clearTimeout(nextTimer); document.removeEventListener("keydown", onKey);
      const acc = asked ? Math.round(correct / asked * 100) : 0;
      wrap.innerHTML = `<p class="sp-bonus__eyebrow">${L("ROUND COMPLETE", "RONDA COMPLETA")}</p><h3 class="sp-bonus__h">${L("The lights are back on!", "¡Las luces han vuelto!")}</h3>
        <div class="sp-g__stats"><div><b>${score}</b><span>${L("score", "puntos")}</span></div><div><b>${acc}%</b><span>${L("right", "correctas")}</span></div><div><b>${best}</b><span>${L("best streak", "mejor racha")}</span></div></div>
        ${missed.length ? `<p class="sp-bonus__p"><b>${L("Worth another look:", "Merece otra mirada:")}</b></p><ul class="sp-g__miss">${missed.slice(0, 5).map(m => `<li>${m.q}<br><b>${m.a}</b> - ${m.h}</li>`).join("")}</ul>` : `<p class="sp-bonus__p">${L("A perfect round - nothing to revisit!", "¡Ronda perfecta - nada que repasar!")}</p>`}
        <div class="sp-bonus__row"><button type="button" class="sp-btn sp-bonus__again">${L("Play again", "Jugar otra vez")}</button></div>`;
      wrap.querySelector(".sp-bonus__again").addEventListener("click", play);
      onEnd && onEnd({ score, accuracy: acc, best });
    }
    spawn();
  }
  return wrap;
}
