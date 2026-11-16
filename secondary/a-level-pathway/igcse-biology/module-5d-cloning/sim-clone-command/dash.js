/* Clone Command — bonus round "Dolly Dash": a 3D steer-through-the-answer runner.
   Optional, unmarked, no fail state. All game state runs on setInterval (wall clock);
   requestAnimationFrame only draws. Wrong lane or a hay bale costs time, never health. */
import { L, T, C, clamp, lerp, rng, makeStage, mesh, std, skyBackdrop, meadow, makeSheep, dnaMarker, canvasTex, grassTex, sfx, muteButton, burstAt, reduced, img, creditLine, esc } from "./kit.js?v=2";

const LANES = [-1.5, 0, 1.5], COL = ["#ff9f43", "#54a0ff", "#5ad17a"], HEX = [0xff9f43, 0x54a0ff, 0x5ad17a], ABC = ["A", "B", "C"];
const ROUND = 120, SPEED = 9.5, GATE_Z = -86;
const Q = () => [
  { img: "dolly", q: L("A clone is...", "Un clon es..."), a: [L("genetically identical to its parent", "genéticamente idéntico a su progenitor"), L("a mix of two parents' genes", "una mezcla de genes de dos progenitores"), L("a new species", "una especie nueva")], hook: L("clone = copy of ONE parent's genes", "clon = copia de los genes de UN progenitor") },
  { img: "plantlets", q: L("Cloning is a type of...", "La clonación es un tipo de..."), a: [L("asexual reproduction", "reproducción asexual"), L("sexual reproduction", "reproducción sexual"), L("fertilisation", "fecundación")], hook: L("one parent, no gametes = asexual", "un progenitor, sin gametos = asexual") },
  { img: "hood", q: L("An explant is...", "Un explante es..."), a: [L("a small piece cut from the parent plant", "un trocito cortado de la planta madre"), L("a seed from the parent plant", "una semilla de la planta madre"), L("a plant grown outdoors", "una planta cultivada al aire libre")], hook: L("explant = EX-tracted piece of PLANT", "explante = trozo EX-traído de la PLANTA") },
  { img: "jars", q: L("'In vitro' means grown...", "'In vitro' significa cultivado..."), a: [L("in glass, outside a living organism", "en vidrio, fuera de un organismo vivo"), L("inside the parent plant", "dentro de la planta madre"), L("in a field", "en un campo")], hook: L("vitro = glass (think 'vitrine')", "vitro = vidrio") },
  { img: "hood", q: L("Why are explants sterilised?", "¿Por qué se esterilizan los explantes?"), a: [L("to kill microorganisms", "para matar microorganismos"), L("to make them grow roots", "para que echen raíces"), L("to change their genes", "para cambiar sus genes")], hook: L("mould loves nutrient agar too", "al moho también le encanta el agar nutritivo") },
  { img: "plantlets", q: L("The agar contains nutrients and...", "El agar contiene nutrientes y..."), a: [L("plant hormones", "hormonas vegetales"), L("bleach", "lejía"), L("pollen", "polen")], hook: L("hormones tell cells: make roots and shoots", "las hormonas ordenan: formad raíces y brotes") },
  { img: "rose", q: L("Cells in a clone are made by...", "Las células de un clon se forman por..."), a: [L("mitosis", "mitosis"), L("meiosis", "meiosis"), L("fertilisation", "fecundación")], hook: L("mitosis makes identical copies", "la mitosis hace copias idénticas") },
  { img: "jars", q: L("One problem with a field of clones:", "Un problema de un campo de clones:"), a: [L("one disease could kill them all", "una enfermedad podría matarlos a todos"), L("they all look different", "todos son distintos"), L("they cannot be sold", "no se pueden vender")], hook: L("identical genes = identical weakness", "genes idénticos = misma debilidad") },
  { img: "icsi", q: L("An enucleated egg cell has had its...", "A un óvulo enucleado se le ha quitado..."), a: [L("nucleus removed", "el núcleo"), L("cytoplasm removed", "el citoplasma"), L("membrane removed", "la membrana")], hook: L("e-NUCLE-ated = nucleus out", "e-NUCLE-ado = núcleo fuera") },
  { img: "dolly-face", q: L("Dolly was a clone of the sheep that gave the...", "Dolly era un clon de la oveja que dio..."), a: [L("body-cell nucleus", "el núcleo de la célula corporal"), L("egg cell", "el óvulo"), L("uterus (surrogate)", "el útero (madre sustituta)")], hook: L("the nucleus holds the genes", "el núcleo contiene los genes") },
  { img: "icsi", q: L("The nucleus put into the egg cell is...", "El núcleo que se introduce en el óvulo es..."), a: [L("diploid (full set of chromosomes)", "diploide (juego completo de cromosomas)"), L("haploid (half set)", "haploide (medio juego)"), L("empty", "vacío")], hook: L("body cell = diploid", "célula corporal = diploide") },
  { img: "icsi", q: L("What makes the new cell start dividing?", "¿Qué hace que la nueva célula empiece a dividirse?"), a: [L("an electric shock", "una descarga eléctrica"), L("a sperm cell", "un espermatozoide"), L("sunlight", "la luz solar")], hook: L("zap, then mitosis", "descarga y luego mitosis") },
  { img: "blackface", q: L("The embryo is placed into the uterus of a...", "El embrión se coloca en el útero de una..."), a: [L("surrogate mother", "madre sustituta"), L("nucleus donor only", "donante del núcleo solamente"), L("test tube until birth", "probeta hasta nacer")], hook: L("surrogate = carries, gives no genes", "sustituta = gesta, no da genes") },
  { img: "dolly", q: L("Why clone a transgenic sheep?", "¿Por qué clonar una oveja transgénica?"), a: [L("every clone makes the human protein", "cada clon produce la proteína humana"), L("to get more wool colours", "para tener más colores de lana"), L("clones live much longer", "los clones viven mucho más")], hook: L("same genes, same protein in the milk", "mismos genes, misma proteína en la leche") },
];

export function mountDashLaunch(host, ctx) {
  host.innerHTML = `<div class="cc-launch"><img src="${img("dolly-face")}" alt="${L("Dolly the sheep", "La oveja Dolly")}"><div><p class="cc-launch__t">${L("Bonus round: Dolly Dash", "Ronda bonus: Dolly Dash")}</p>
    <p>${L("A 2-minute 3D run across the Scottish hills. Collect DNA, dodge hay bales and steer Dolly through the gate with the right answer. Optional and not marked.", "Una carrera 3D de 2 minutos por las colinas de Escocia. Recoge ADN, esquiva fardos de heno y guía a Dolly por la puerta con la respuesta correcta. Opcional y sin nota.")}</p>
    <div class="cc-row"><button type="button" class="cc-btn cc-btn--big cc-play">${L("Play", "Jugar")}</button><button type="button" class="cc-btn cc-btn--ghost cc-skipb">${L("Skip", "Saltar")}</button></div></div></div><div class="cc-dashhost"></div>`;
  const dh = host.querySelector(".cc-dashhost");
  host.querySelector(".cc-play").addEventListener("click", () => { host.querySelector(".cc-launch").hidden = true; mountDash(dh, ctx, () => { host.querySelector(".cc-launch").hidden = false; }); dh.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" }); });
  host.querySelector(".cc-skipb").addEventListener("click", e => { e.currentTarget.textContent = L("Skipped: you can play any time", "Saltada: puedes jugar cuando quieras"); });
}

function mountDash(host, ctx, onClose) {
  host.innerHTML = `<div class="cc-dash"><div class="cc-dash__stage" data-fallback="${esc(L("3D view unavailable: answer with the buttons below.", "Vista 3D no disponible: responde con los botones."))}">
      <div class="cc-dash__hud"><span class="d-time">2:00</span><span class="d-score">0</span><span class="d-streak"></span></div>
      <div class="cc-dash__q" hidden><img alt=""><b></b></div><div class="cc-dash__toast" role="status" aria-live="polite"></div></div>
    <div class="cc-dash__ans">${[0, 1, 2].map(i => `<button type="button" class="d-ans" data-lane="${i}" style="--c:${COL[i]}"><i>${ABC[i]}</i><span>${[L("Left lane", "Carril izquierdo"), L("Middle lane", "Carril central"), L("Right lane", "Carril derecho")][i]}</span></button>`).join("")}</div>
    <div class="cc-dash__foot"><span>${L("Steer: arrow keys, A/D, keys 1-3, or tap a lane.", "Dirige: flechas, A/D, teclas 1-3 o toca un carril.")}</span><span class="d-mute"></span><button type="button" class="cc-btn cc-btn--ghost d-quit">${L("End round", "Terminar ronda")}</button></div>
    <p class="cc-credit">${creditLine(["dolly", "dolly-face", "plantlets", "hood", "jars", "rose", "icsi", "blackface"])}</p></div>`;
  const $ = s => host.querySelector(s), stageEl = $(".cc-dash__stage"), ans = [...host.querySelectorAll(".d-ans")], qEl = $(".cc-dash__q"), toast = $(".cc-dash__toast");
  $(".d-mute").append(muteButton());
  const st = makeStage(stageEl, { orbit: false, cam: { theta: 0, phi: 1.2, dist: 7.2, target: [0, 1.1, -2.5] }, fov: 52, sunPos: [-6, 10, 4], shadowRange: 12, swayAmp: .03, fitAspect: 1.1 });
  const r = rng(Date.now() & 0xffff), qs = Q().map(q => Object.assign(q, { right: q.a[0] })).sort(() => r() - .5);
  const G = { lane: 1, score: 0, streak: 0, best: 0, right: 0, asked: 0, missed: [], t0: Date.now(), last: Date.now(), items: [], gate: null, nextGate: 6, nextItem: 1, slow: 0, dist: 0, qi: 0, over: false, stumble: 0 };

  /* --------------------------------------------------------------- scene */
  let player = null, orbs = [], bales = [], gateG = null, props = [], path = null, ground = null, letters = [];
  if (st) {
    skyBackdrop(st, "#69b3ee", "#d3e9f8", "#f7ecd0"); ground = meadow(st, 220); st.scene.fog.near = 30; st.scene.fog.far = 105;
    const ptex = canvasTex(128, 256, (g, w, h) => { g.fillStyle = "#b99a6b"; g.fillRect(0, 0, w, h); const q = rng(8); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${q() > .5 ? 255 : 60},${q() > .5 ? 235 : 50},${q() > .5 ? 200 : 30},${q() * .12})`; g.fillRect(q() * w, q() * h, 2 + q() * 4, 2 + q() * 4); } g.fillStyle = "rgba(255,255,255,.35)"; [w / 3, 2 * w / 3].forEach(x => { for (let y = 0; y < h; y += 64) g.fillRect(x - 2, y, 4, 34); }); }, [1, 30]);
    path = mesh(new T.PlaneGeometry(4.6, 240), std(0xffffff, .95, 0, { map: ptex }), 0, .012, -100, false); path.rotation.x = -Math.PI / 2; path.receiveShadow = true; st.scene.add(path);
    player = makeSheep("white", { seed: 9, scale: 1.25 }); player.rotation.y = Math.PI / 2; st.scene.add(player);
    for (let i = 0; i < 12; i++) { const o = dnaMarker(0x4de3ff); o.scale.setScalar(2.2); o.visible = false; st.scene.add(o); orbs.push(o); }
    const hay = std(0xd9b24c, 1, 0, { map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#d9b24c"; g.fillRect(0, 0, w, h); const q = rng(2); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${q() > .5 ? 120 : 255},${q() > .5 ? 90 : 240},40,.5)`; g.beginPath(); const x = q() * w, y = q() * h; g.moveTo(x, y); g.lineTo(x + 8, y + (q() - .5) * 3); g.stroke(); } }) });
    for (let i = 0; i < 8; i++) { const b = mesh(new T.CylinderGeometry(.5, .5, 1.1, 20), hay, 0, .5, 0); b.rotation.z = Math.PI / 2; b.visible = false; st.scene.add(b); bales.push(b); }
    gateG = new T.Group(); gateG.visible = false; st.scene.add(gateG);
    LANES.forEach((x, i) => {
      const m = new T.MeshStandardMaterial({ color: C(HEX[i]), emissive: C(HEX[i]), emissiveIntensity: .7, roughness: .4 });
      gateG.add(mesh(new T.BoxGeometry(.12, 2.4, .12), m, x - .68, 1.2, 0)); gateG.add(mesh(new T.BoxGeometry(.12, 2.4, .12), m, x + .68, 1.2, 0)); gateG.add(mesh(new T.BoxGeometry(1.48, .5, .12), m, x, 2.45, 0));
      const veil = mesh(new T.PlaneGeometry(1.24, 2.2), new T.MeshBasicMaterial({ color: HEX[i], transparent: true, opacity: .22, depthWrite: false, side: T.DoubleSide }), x, 1.1, 0, false); gateG.add(veil);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(128, 128, g => { g.fillStyle = "#fff"; g.font = "900 100px system-ui,sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 10; g.strokeStyle = "#14202a"; g.strokeText(ABC[i], 64, 70); g.fillText(ABC[i], 64, 70); }) })); sp.scale.set(1, 1, 1); sp.position.set(x, 3.2, 0); gateG.add(sp); letters.push(sp);
    });
    const pr = rng(77), tree = () => { const g = new T.Group(); g.add(mesh(new T.CylinderGeometry(.12, .18, 1.2, 8), std(0x6b4a2c, .9), 0, .6, 0)); const lm = std(0x2f6b3a, .9); [[0, 1.6, 1], [0, 2.3, .78], [0, 2.9, .5]].forEach(p => g.add(mesh(new T.ConeGeometry(p[2], 1.1, 10), lm, p[0], p[1], 0))); return g; };
    const rock = () => { const m = mesh(new T.DodecahedronGeometry(.5 + pr() * .5, 0), std(0x8b9096, .95), 0, .3, 0); m.scale.y = .6; return m; };
    for (let i = 0; i < 30; i++) { const o = pr() < .62 ? tree() : rock(), side = i % 2 ? 1 : -1; o.position.set(side * (3.6 + pr() * 9), 0, -pr() * 120 + 6); o.scale.multiplyScalar(.8 + pr() * .9); st.scene.add(o); props.push(o); }
    for (let i = 0; i < 6; i++) { const s = makeSheep(i % 2 ? "black" : "white", { seed: 100 + i, scale: 1.1 }); s.position.set((i % 2 ? 1 : -1) * (4.2 + pr() * 5), 0, -pr() * 120 + 6); s.rotation.y = pr() * 6; st.scene.add(s); props.push(s); }
    st.onFrame.push((dt, t) => {
      player.position.x = lerp(player.position.x, LANES[G.lane], 1 - Math.exp(-dt * 12)); player.rotation.z = (LANES[G.lane] - player.position.x) * -.18;
      if (!G.over) player.userData.run(t, G.slow > 0 ? 6 : 12); player.rotation.x = G.stumble > 0 ? Math.sin(t * 30) * .12 : 0;
      const off = G.dist; ground.material.map.offset.y = off / 4; path.material.map.offset.y = off / 8;
      props.forEach(p => { const z = ((p.userData.z0 ?? (p.userData.z0 = p.position.z)) + 120 + off) % 126; p.position.z = z - 120; });
      G.items.forEach(it => { if (!it.m) return; it.m.visible = !it.done; it.m.position.set(LANES[it.lane], it.kind === "orb" ? .9 + Math.sin(t * 3 + it.z) * .1 : .5, it.z); if (it.kind === "orb") it.m.rotation.y = t * 3; });
      if (G.gate) { gateG.visible = true; gateG.position.z = G.gate.z; } else gateG.visible = false;
    });
  }

  /* --------------------------------------------------------------- logic */
  const say = (html, cls) => { toast.className = "cc-dash__toast show " + (cls || ""); toast.innerHTML = html; clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("show"), 3600); };
  const paintLane = () => ans.forEach((b, i) => b.classList.toggle("is-on", i === G.lane));
  const setLane = i => { if (G.over) return; const n = clamp(i, 0, 2); if (n !== G.lane) { G.lane = n; sfx("tick"); paintLane(); } };
  const key = e => {
    if (G.over || !host.isConnected) return;
    const k = e.key.toLowerCase(); let used = true;
    if (k === "arrowleft" || k === "a") setLane(G.lane - 1); else if (k === "arrowright" || k === "d") setLane(G.lane + 1); else if (k >= "1" && k <= "3") setLane(+k - 1); else used = false;
    if (used) e.preventDefault();
  };
  document.addEventListener("keydown", key);
  ans.forEach((b, i) => b.addEventListener("click", () => setLane(i)));
  function spawnGate() {
    const q = qs[G.qi++ % qs.length], order = [0, 1, 2].sort(() => r() - .5), opts = order.map(i => q.a[i]);
    G.gate = { z: GATE_Z, q, opts, ok: order.indexOf(0) }; G.asked++;
    qEl.hidden = false; qEl.querySelector("img").src = img(q.img); qEl.querySelector("b").textContent = q.q;
    ans.forEach((b, i) => { b.querySelector("span").textContent = opts[i]; b.classList.remove("good", "bad"); });
  }
  function resolveGate() {
    const g = G.gate, ok = G.lane === g.ok; G.gate = null; qEl.hidden = true;
    ans.forEach((b, i) => { b.classList.toggle("good", i === g.ok); if (!ok && i === G.lane) b.classList.add("bad"); });
    if (ok) { G.right++; G.streak++; G.best = Math.max(G.best, G.streak); const pts = 50 + Math.min(5, G.streak - 1) * 10; G.score += pts; sfx("win"); say(`+${pts} · ${esc(g.q.right)}`, "good"); burstAt(ans[g.ok], COL[g.ok], 16); st && st.burst(new T.Vector3(LANES[g.ok], 1.4, 0), HEX[g.ok], 40, 3, .14); st && st.punch(.9); }
    else { G.streak = 0; G.slow = 1.2; G.missed.push(g.q); sfx("bad"); say(`${L("Answer", "Respuesta")}: <b>${esc(g.q.right)}</b> · ${esc(g.q.hook)}`, "bad"); }
    setTimeout(() => { if (!G.gate && !G.over) ans.forEach((b, i) => { b.classList.remove("good", "bad"); b.querySelector("span").textContent = [L("Left lane", "Carril izquierdo"), L("Middle lane", "Carril central"), L("Right lane", "Carril derecho")][i]; }); }, 2200);
    G.nextGate = 5.5;
  }
  const tick = setInterval(() => {
    if (!host.isConnected) { stop(); return; }
    const now = Date.now(), dt = clamp((now - G.last) / 1000, 0, .25); G.last = now; if (document.hidden) { G.t0 += dt * 1000; return; }
    const left = ROUND - (now - G.t0) / 1000; if (left <= 0) return finish();
    const sp = SPEED * (G.slow > 0 ? .45 : 1); G.slow -= dt; G.stumble -= dt; G.dist += sp * dt;
    G.items.forEach(it => { it.z += sp * dt; if (!it.done && it.z > -.5 && it.z < .8 && it.lane === G.lane) { it.done = true; if (it.kind === "orb") { G.score += 10; sfx("coin"); st && st.burst(new T.Vector3(LANES[it.lane], 1, 0), 0x4de3ff, 10, 1.6, .09); } else { G.slow = 1.1; G.stumble = .6; G.streak = 0; sfx("bad"); say(L("Hay bale! You lose a little time, nothing else.", "¡Fardo de heno! Pierdes un poco de tiempo, nada más."), "bad"); st && st.burst(new T.Vector3(LANES[it.lane], .7, 0), 0xd9b24c, 18, 2, .1); } } });
    G.items = G.items.filter(it => { if (it.z > 6) { if (it.m) it.m.visible = false, it.pool.push(it.m); return false; } return true; });
    if (G.gate) { G.gate.z += sp * dt; if (G.gate.z >= 0) resolveGate(); } else { G.nextGate -= dt; if (G.nextGate <= 0 && left > 10) spawnGate(); }
    G.nextItem -= dt;
    if (G.nextItem <= 0) { G.nextItem = .75 + r() * .5; const z = -78, nearGate = G.gate && Math.abs(G.gate.z - z) < 14; if (!nearGate) { const kind = r() < .72 ? "orb" : "bale", pool = kind === "orb" ? orbs : bales, m = pool.pop() || null; if (m || !st) G.items.push({ kind, lane: Math.floor(r() * 3), z, m, pool, done: false }); } }
    const s = Math.ceil(left); $(".d-time").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; $(".d-score").textContent = G.score; $(".d-streak").textContent = G.streak > 1 ? `${L("Streak", "Racha")} x${G.streak}` : "";
  }, 33);
  function stop() { clearInterval(tick); document.removeEventListener("keydown", key); }
  function finish() {
    if (G.over) return; G.over = true; stop(); sfx("win"); st && st.dispose();
    const acc = G.asked ? Math.round(G.right / Math.max(1, G.asked - (G.gate ? 1 : 0)) * 100) : 0, seen = [];
    const miss = G.missed.filter(q => !seen.includes(q.q) && seen.push(q.q));
    host.innerHTML = `<div class="cc-dashend"><p class="cc-launch__t">${L("Dolly Dash complete!", "¡Dolly Dash completado!")}</p><div class="cc-stats"><span><b>${G.score}</b>${L("score", "puntos")}</span><span><b>${G.right}/${G.asked - (G.gate ? 1 : 0)}</b>${L("gates right", "puertas correctas")}</span><span><b>${acc}%</b>${L("accuracy", "precisión")}</span><span><b>x${G.best}</b>${L("best streak", "mejor racha")}</span></div>
      ${miss.length ? `<p><b>${L("Worth another look:", "Para repasar:")}</b></p><ul class="cc-miss">${miss.map(q => `<li><img src="${img(q.img)}" alt=""><span>${esc(q.q)} <b>${esc(q.right)}</b> <small>${esc(q.hook)}</small></span></li>`).join("")}</ul>` : `<p>${L("Every gate correct. Outstanding.", "Todas las puertas correctas. Sobresaliente.")}</p>`}
      <div class="cc-row"><button type="button" class="cc-btn cc-btn--big d-again">${L("Play again", "Jugar otra vez")}</button><button type="button" class="cc-btn cc-btn--ghost d-close">${L("Close", "Cerrar")}</button></div></div>`;
    ctx.bonusDone(G.score, G.right);
    host.querySelector(".d-again").addEventListener("click", () => mountDash(host, ctx, onClose));
    host.querySelector(".d-close").addEventListener("click", () => { host.innerHTML = ""; onClose && onClose(); });
  }
  $(".d-quit").addEventListener("click", finish);
  paintLane(); say(L("Go! Collect the blue DNA and get ready for the first gate.", "¡Vamos! Recoge el ADN azul y prepárate para la primera puerta."), "good");
}
