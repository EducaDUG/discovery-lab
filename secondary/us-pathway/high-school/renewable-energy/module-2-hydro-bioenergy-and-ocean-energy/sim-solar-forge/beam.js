/* Solar Forge — bonus round "Beam Bender": steer one heliostat so the reflected sunbeam lands on the
   tower that shows the right answer. Real law of reflection (the mirror's normal bisects the two beams).
   Optional, unmarked, no fail state. Game state runs on setInterval; requestAnimationFrame only draws. */
import { L, T, C, clamp, lerp, rng, makeStage, mesh, std, steelTex, noiseTex, canvasTex, desert, liveSky, sunDisc, glowSprite, sfx, muteButton, burstAt, reduced, img, creditLine, esc, shuffled } from "./kit.js?v=3";

const ROUND = 120, AZ = [-28, 0, 28], COL = ["#ff9f43", "#54a0ff", "#5ad17a"], HEX = [0xff9f43, 0x54a0ff, 0x5ad17a], ABC = ["A", "B", "C"], DIST = 15, RECV_Y = 5.2, LOCK = .6;
const Q = () => [
  { img: "cell", q: L("In a solar cell, light energy is absorbed by...", "En una célula solar, la energía de la luz la absorbe..."), a: [L("silicon, a semiconductor", "el silicio, un semiconductor"), L("copper wire", "el cable de cobre"), L("the glass cover", "el vidrio protector")], hook: L("silicon soaks up photons", "el silicio absorbe los fotones") },
  { img: "cell", q: L("The tiny packets of light energy are called...", "Los pequeños paquetes de energía de la luz se llaman..."), a: [L("photons", "fotones"), L("electrons", "electrones"), L("protons", "protones")], hook: L("photo = light, so photons", "foto = luz, por eso fotones") },
  { img: "roof", q: L("The photovoltaic effect converts...", "El efecto fotovoltaico convierte..."), a: [L("radiant energy to electrical energy", "energía radiante en eléctrica"), L("thermal energy to electrical energy", "energía térmica en eléctrica"), L("electrical energy to light", "energía eléctrica en luz")], hook: L("photo (light) + voltaic (electric)", "foto (luz) + voltaico (eléctrico)") },
  { img: "roof", q: L("An inverter changes...", "Un inversor cambia..."), a: [L("DC into AC", "CC en CA"), L("AC into DC", "CA en CC"), L("light into heat", "luz en calor")], hook: L("panels make DC, homes use AC", "los paneles dan CC, las casas usan CA") },
  { img: "girl", q: L("On a cold but sunny day, a solar panel...", "En un día frío pero soleado, un panel solar..."), a: [L("works well: it needs light, not heat", "funciona bien: necesita luz, no calor"), L("stops working", "deja de funcionar"), L("only works with a battery", "solo funciona con batería")], hook: L("cold cells are more efficient", "las células frías son más eficientes") },
  { img: "girl", q: L("Very hot silicon cells are...", "Las células de silicio muy calientes son..."), a: [L("less efficient", "menos eficientes"), L("more efficient", "más eficientes"), L("exactly as efficient", "igual de eficientes")], hook: L("heat lowers PV efficiency", "el calor baja la eficiencia FV") },
  { img: "earthship", q: L("Passive solar design means the building...", "El diseño solar pasivo significa que el edificio..."), a: [L("captures and stores the Sun's heat itself", "capta y almacena por sí mismo el calor del Sol"), L("uses pumps and fans", "usa bombas y ventiladores"), L("makes electricity", "produce electricidad")], hook: L("passive = no pumps, no fans", "pasivo = sin bombas ni ventiladores") },
  { img: "earthship", q: L("Thermal mass is a material's ability to...", "La masa térmica es la capacidad de un material para..."), a: [L("absorb, store and release heat", "absorber, almacenar y ceder calor"), L("reflect all sunlight", "reflejar toda la luz solar"), L("conduct electricity", "conducir la electricidad")], hook: L("concrete: a heat battery", "hormigón: una batería de calor") },
  { img: "earthship", q: L("A roof overhang is useful because it...", "Un alero es útil porque..."), a: [L("blocks the high summer Sun", "bloquea el Sol alto del verano"), L("blocks the low winter Sun", "bloquea el Sol bajo del invierno"), L("stores heat at night", "almacena calor de noche")], hook: L("summer Sun is high, winter Sun is low", "Sol de verano alto, Sol de invierno bajo") },
  { img: "helio", q: L("Why does a power tower use so many mirrors?", "¿Por qué una torre solar usa tantos espejos?"), a: [L("to concentrate sunlight and get very hot", "para concentrar la luz y alcanzar mucha temperatura"), L("to cool the solar cells", "para enfriar las células solares"), L("to store electricity", "para almacenar electricidad")], hook: L("concentrate = more heat in one spot", "concentrar = más calor en un punto") },
  { img: "gemasolar", q: L("The energy chain in a CSP plant is...", "La cadena de energía en una central CSP es..."), a: [L("radiant, thermal, mechanical, electrical", "radiante, térmica, mecánica, eléctrica"), L("radiant, electrical, thermal", "radiante, eléctrica, térmica"), L("thermal, radiant, electrical", "térmica, radiante, eléctrica")], hook: L("light, heat, spin, electricity", "luz, calor, giro, electricidad") },
  { img: "gemasolar", q: L("Molten salt lets a CSP plant...", "Las sales fundidas permiten a una central CSP..."), a: [L("keep generating after sunset", "seguir generando tras la puesta de sol"), L("make the mirrors shinier", "dar más brillo a los espejos"), L("work without a turbine", "funcionar sin turbina")], hook: L("stored heat = electricity at night", "calor guardado = electricidad de noche") },
  { img: "turbine", q: L("First Law: energy that is not turned into electricity...", "Primera Ley: la energía que no se convierte en electricidad..."), a: [L("is transferred as other forms, mostly heat", "se transfiere en otras formas, sobre todo calor"), L("is destroyed", "se destruye"), L("turns into mass", "se convierte en masa")], hook: L("never created, never destroyed", "ni se crea ni se destruye") },
  { img: "turbine", q: L("Second Law: a heat engine...", "Segunda Ley: una máquina térmica..."), a: [L("can never turn all its heat into work", "nunca convierte todo su calor en trabajo"), L("is 100 % efficient without friction", "tiene un 100 % de eficiencia sin rozamiento"), L("creates energy", "crea energía")], hook: L("some heat must flow on to the cold side", "parte del calor debe pasar al lado frío") },
  { img: "ivan", q: L("Which technology uses a steam turbine?", "¿Qué tecnología usa una turbina de vapor?"), a: [L("concentrated solar power", "la energía solar de concentración"), L("photovoltaic panels", "los paneles fotovoltaicos"), L("passive solar design", "el diseño solar pasivo")], hook: L("CSP makes heat, heat makes steam", "CSP da calor, el calor da vapor") },
  { img: "ivan", q: L("Efficiency means...", "Eficiencia significa..."), a: [L("the share of input energy that becomes useful output", "la parte de la energía de entrada que se vuelve salida útil"), L("the total energy input", "la energía total de entrada"), L("how hot a machine gets", "cuánto se calienta una máquina")], hook: L("useful out ÷ total in", "salida útil ÷ entrada total") },
];

export function mountBeamLaunch(host, ctx) {
  const best = ctx.sim.state.beam || 0;
  host.innerHTML = `<div class="sf-launch"><img src="${img("helio")}" alt=""><div><p class="sf-launch__t">${L("Bonus game: Beam Bender", "Juego bonus: Dobla el rayo")}</p>
    <p>${L("Two minutes. Turn a giant mirror so the sunbeam hits the tower with the right answer. Optional and unmarked: nothing here can lower your grade.", "Dos minutos. Gira un espejo gigante para que el rayo de sol dé en la torre con la respuesta correcta. Opcional y sin nota: aquí nada puede bajar tu calificación.")}${best ? ` <b>${L("Best score", "Mejor puntuación")}: ${best}</b>` : ""}</p>
    <div class="sf-row"><button type="button" class="sf-btn sf-btn--big b-play">${L("Play", "Jugar")}</button><button type="button" class="sf-btn sf-btn--ghost b-skip">${L("Skip", "Saltar")}</button></div><p class="sf-credit">${creditLine(["helio"])}</p></div></div><div class="sf-dash"></div>`;
  const zone = host.querySelector(".sf-dash"), card = host.querySelector(".sf-launch");
  host.querySelector(".b-play").addEventListener("click", () => { card.hidden = true; mountBeam(zone, ctx, () => { card.hidden = false; mountBeamLaunch(host, ctx); }); });
  host.querySelector(".b-skip").addEventListener("click", e => { e.currentTarget.textContent = L("Skipped. You can play any time.", "Saltado. Puedes jugar cuando quieras."); });
}

function mountBeam(host, ctx, onClose) {
  host.innerHTML = `<div class="sf-dash__stage" data-fallback="${esc(L("3D view unavailable. Use the A, B, C buttons to answer.", "Vista 3D no disponible. Usa los botones A, B, C para responder."))}">
      <div class="sf-dash__hud"><span class="d-time">2:00</span><span class="d-score">0</span><span class="d-streak"></span></div>
      <div class="sf-dash__q" hidden><img alt=""><b></b></div><div class="sf-dash__toast" role="status" aria-live="polite"></div></div>
    <div class="sf-dash__ans">${ABC.map((l, i) => `<button type="button" class="d-ans" data-i="${i}" style="--c:${COL[i]}"><i>${l}</i><span></span><u></u></button>`).join("")}</div>
    <label class="sf-range b-aim">${L("Mirror aim (or use the left and right arrow keys)", "Orientación del espejo (o usa las flechas izquierda y derecha)")}<input type="range" min="-42" max="42" step="1" value="0"></label>
    <div class="sf-dash__foot"><span>${L("Hold the beam on a tower to lock in your answer. Keys: ← → to turn, 1 2 3 or A B C to swing straight to a tower.", "Mantén el rayo sobre una torre para fijar tu respuesta. Teclas: ← → para girar, 1 2 3 o A B C para ir directo a una torre.")}</span><span class="b-tools"><button type="button" class="sf-btn sf-btn--ghost d-quit">${L("End round", "Terminar")}</button></span></div>`;
  host.querySelector(".b-tools").prepend(muteButton());
  host.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
  const $ = s => host.querySelector(s), stageEl = $(".sf-dash__stage"), ansB = [...host.querySelectorAll(".d-ans")], slider = $(".b-aim input"), toast = $(".sf-dash__toast");
  const r = rng(Date.now() & 0xffff), deck = shuffled(Q(), Date.now() & 0xfffff);
  const G = { t0: Date.now(), az: 14, goal: null, key: 0, score: 0, streak: 0, best: 0, right: 0, asked: 0, q: null, dwell: 0, on: -1, pause: 0, missed: [], over: false, qStart: 0, flash: [0, 0, 0] };
  const say = (t, cls) => { toast.textContent = t; toast.className = "sf-dash__toast show " + (cls || ""); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("show"), 2600); };

  /* ------------------------------------------------------------ 3D scene */
  const st = makeStage(stageEl, { orbit: false, cam: { theta: 0, phi: 1.15, dist: 15.5, target: [0, 3.5, -6] }, sway: false, fov: 46, shadowRange: 22, sunPos: [3, 12, 12], fitAspect: 1.5 });
  const S = new T.Vector3(.12, .62, 1).normalize(), M = new T.Vector3(0, 1.9, 0);
  let towers = [];
  if (st) {
    const sky = liveSky(st, { fog: 0xf0cfa8, fogNear: 40, fogFar: 200 }); sky(.72); desert(st);
    const steel = new T.MeshStandardMaterial({ map: steelTex(), color: C(0xd8dee3), roughness: .3, metalness: .9 }), conc = std(0xcfc8bb, .9, 0, { map: noiseTex("#cfc8bb", .08, 900, [2, 3], 256, 9) });
    /* the player's heliostat */
    st.scene.add(mesh(new T.CylinderGeometry(.14, .2, 1.9, 12), steel, 0, .95, 0));
    const mir = new T.Group(); mir.position.copy(M); mir.up.set(0, 0, 1);
    mir.add(mesh(new T.BoxGeometry(3.2, 2.1, .06), new T.MeshStandardMaterial({ color: C(0xa8cdf4), roughness: .03, metalness: 1, envMapIntensity: 1.9 }), 0, 0, .05), mesh(new T.BoxGeometry(3.3, 2.2, .08), std(0x4d5760, .6, .4), 0, 0, -.02));
    const normal = mesh(new T.CylinderGeometry(.015, .015, 2.2, 6).rotateX(Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 }), 0, 0, 1.2, false); mir.add(normal); st.scene.add(mir);
    /* beams: incoming sunlight and the reflected beam (unit-length cylinders along +Z, scaled) */
    const beamM = c => new T.MeshBasicMaterial({ color: C(c), transparent: true, opacity: .5, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    const mk = (rad, c, op) => { const m = mesh(new T.CylinderGeometry(rad, rad, 1, 12, 1, true).rotateX(Math.PI / 2).translate(0, 0, .5), beamM(c), M.x, M.y, M.z, false); m.material.opacity = op; m.frustumCulled = false; st.scene.add(m); return m; };
    const inB = mk(.5, 0xffe9a0, .16), outB = mk(.3, 0xffd166, .34), core = mk(.09, 0xffffff, .8);
    inB.lookAt(M.clone().add(S)); inB.scale.z = 40;
    const spot = glowSprite(0xffe2a0, 3); spot.material.fog = false; st.scene.add(spot);
    const sunS = sunDisc(st, 18); sunS.position.copy(S).multiplyScalar(120).add(M);
    /* three answer towers */
    towers = AZ.map((az, i) => {
      const a = az * Math.PI / 180, x = Math.sin(a) * DIST, z = -Math.cos(a) * DIST, g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = -a;
      g.add(mesh(new T.CylinderGeometry(.5, .85, 4.4, 16), conc, 0, 2.2, 0));
      const rm = new T.MeshStandardMaterial({ color: C(0x22252b), roughness: .5, emissive: C(HEX[i]), emissiveIntensity: .25 }), rec = mesh(new T.CylinderGeometry(.8, .8, 1.5, 20), rm, 0, RECV_Y, 0); g.add(rec);
      const board = mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshBasicMaterial({ map: canvasTex(128, 128, (c, w) => { c.fillStyle = COL[i]; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, 6.283); c.fill(); c.fillStyle = "#08202c"; c.font = "900 84px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ABC[i], w / 2, w / 2 + 6); }), transparent: true, fog: false }), 0, 2.7, .9, false); g.add(board);
      const ring = mesh(new T.TorusGeometry(1.15, .07, 8, 40), new T.MeshBasicMaterial({ color: C(HEX[i]), transparent: true, opacity: .0 }), 0, RECV_Y, 0, false); ring.rotation.x = Math.PI / 2; g.add(ring);
      const glow = glowSprite(HEX[i], 1); glow.position.set(0, RECV_Y, 0); glow.material.fog = false; g.add(glow); st.scene.add(g);
      return { p: new T.Vector3(x, RECV_Y, z), rm, ring, glow };
    });
    /* decorative field of small heliostats, glinting */
    const q = rng(5), small = new T.MeshStandardMaterial({ color: C(0x9cc4f0), roughness: .05, metalness: 1 });
    for (let i = 0; i < 46; i++) { const x = (q() - .5) * 44, z = -3 - q() * 20; if (Math.abs(x) < 3.5 && z > -6) continue; if (AZ.some(a => Math.hypot(x - Math.sin(a * Math.PI / 180) * DIST, z + Math.cos(a * Math.PI / 180) * DIST) < 2)) continue; st.scene.add(mesh(new T.CylinderGeometry(.04, .05, .7, 6), steel, x, .35, z)); const m = mesh(new T.BoxGeometry(.9, .6, .03), small, x, .75, z); m.rotation.set(-1 + q() * .3, (q() - .5) * .8, 0); st.scene.add(m); }
    const dust = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: C(0xffe9b8), size: .08, transparent: true, opacity: .6, depthWrite: false })); const dp = []; for (let i = 0; i < 160; i++) dp.push((q() - .5) * 30, q() * 8, -q() * 22); dust.geometry.setAttribute("position", new T.Float32BufferAttribute(dp, 3)); st.scene.add(dust);
    const D = new T.Vector3(), n = new T.Vector3(), m4 = new T.Matrix4(), tq = new T.Quaternion(), O = new T.Vector3();
    st.onFrame.push((dt, t) => {
      const a = G.az * Math.PI / 180; D.set(Math.sin(a) * DIST, RECV_Y - M.y, -Math.cos(a) * DIST).normalize(); n.copy(D).add(S).normalize();
      m4.lookAt(n, O, mir.up); tq.setFromRotationMatrix(m4); mir.quaternion.copy(tq);
      const len = G.on >= 0 ? M.distanceTo(towers[G.on].p) : 60; [outB, core].forEach(b => { b.lookAt(M.clone().add(D)); b.scale.z = len; });
      spot.visible = G.on >= 0; if (G.on >= 0) { spot.position.copy(towers[G.on].p); spot.scale.setScalar(3 + G.dwell / LOCK * 4 + (reduced() ? 0 : Math.sin(t * 20) * .3)); }
      towers.forEach((tw, i) => { const k = G.on === i ? G.dwell / LOCK : 0; G.flash[i] = Math.max(0, G.flash[i] - dt * 1.2); tw.rm.emissiveIntensity = .25 + k * 2.5 + G.flash[i] * 3; tw.ring.material.opacity = k; tw.ring.scale.setScalar(1.6 - k * .6); tw.glow.scale.setScalar(.1 + (k + G.flash[i]) * 6); });
      if (!reduced()) dust.rotation.y = Math.sin(t * .05) * .1;
    });
  }

  /* ------------------------------------------------------------ game */
  function nextQ() {
    const base = deck[G.asked % deck.length], order = shuffled([0, 1, 2], Math.floor(r() * 1e6));
    G.q = { base, order, right: order.indexOf(0) }; G.asked++; G.dwell = 0; G.qStart = Date.now();
    const box = $(".sf-dash__q"); box.hidden = false; box.querySelector("img").src = img(base.img); box.querySelector("b").textContent = base.q;
    ansB.forEach((b, i) => { b.className = "d-ans"; b.querySelector("span").textContent = base.a[order[i]]; b.querySelector("u").style.width = "0"; });
  }
  function resolve(i) {
    const q = G.q, ok = i === q.right; G.q = null; G.pause = 1.6; G.park = (G.asked % 2 ? -1 : 1) * 14; G.goal = null; G.flash[i] = 1;
    ansB[i].classList.add(ok ? "good" : "bad"); ansB[q.right].classList.add("good");
    if (ok) { G.streak++; G.best = Math.max(G.best, G.streak); G.right++; const sp = Math.max(0, 50 - Math.floor((Date.now() - G.qStart) / 160)), pts = 100 + (G.streak - 1) * 20 + sp; G.score += pts; sfx(G.streak > 2 ? "win" : "ok"); say(`+${pts}  ${q.base.hook}`, "good"); st && st.burst(towers[i].p, HEX[i], 46, 4, .22); st && st.punch(.94); burstAt(ansB[i], COL[i], 16); }
    else { G.streak = 0; G.missed.push({ q: q.base.q, right: q.base.a[0], hook: q.base.hook, img: q.base.img }); sfx("bad"); say(`${L("Answer", "Respuesta")}: ${q.base.a[0]} · ${q.base.hook}`, "bad"); st && st.burst(towers[i].p, 0x9aa3ab, 20, 2, .16); }
  }
  const key = e => {
    if (G.over) return; const k = e.key.toLowerCase(), i = "123".indexOf(k) >= 0 ? "123".indexOf(k) : "abc".indexOf(k);
    if (e.type === "keyup") { if (e.key === "ArrowLeft" && G.key < 0 || e.key === "ArrowRight" && G.key > 0) G.key = 0; return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); G.key = -1; G.goal = null; } else if (e.key === "ArrowRight") { e.preventDefault(); G.key = 1; G.goal = null; }
    else if (i >= 0 && !e.ctrlKey && !e.metaKey && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); G.goal = AZ[i]; }
  };
  document.addEventListener("keydown", key); document.addEventListener("keyup", key);
  ansB.forEach((b, i) => b.addEventListener("click", () => { G.goal = AZ[i]; sfx("tick"); }));
  slider.addEventListener("input", () => { G.goal = null; G.az = +slider.value; });
  let last = Date.now();
  const tick = setInterval(() => {
    if (!host.isConnected) return stop(); const now = Date.now(), dt = Math.min(.1, (now - last) / 1000); last = now;
    if (document.hidden) { G.t0 += dt * 1000; return; }
    const left = ROUND - (now - G.t0) / 1000; if (left <= 0) return finish();
    if (G.goal != null) { const d = G.goal - G.az, s = 85 * dt; if (Math.abs(d) <= s) { G.az = G.goal; } else G.az += Math.sign(d) * s; }
    else if (G.key) G.az = clamp(G.az + G.key * 46 * dt, -42, 42);
    if (document.activeElement !== slider) slider.value = Math.round(G.az);
    G.on = AZ.findIndex(a => Math.abs(a - G.az) < 5);
    if (G.pause > 0) { G.pause -= dt; if (G.pause < .9 && G.park != null) { G.goal = G.park; G.park = null; } if (G.pause <= 0 && left > 4) nextQ(); }
    else if (G.q) { if (G.on >= 0) { G.dwell += dt; if (G.dwell >= LOCK) resolve(G.on); } else G.dwell = Math.max(0, G.dwell - dt * 2); }
    else if (left > 4) nextQ();
    ansB.forEach((b, i) => { b.classList.toggle("is-on", G.on === i); b.querySelector("u").style.width = (G.on === i && G.q ? G.dwell / LOCK * 100 : 0) + "%"; });
    const s = Math.ceil(left); $(".d-time").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; $(".d-score").textContent = G.score; $(".d-streak").textContent = G.streak > 1 ? `${L("Streak", "Racha")} x${G.streak}` : "";
  }, 33);
  function stop() { clearInterval(tick); document.removeEventListener("keydown", key); document.removeEventListener("keyup", key); }
  function finish() {
    if (G.over) return; G.over = true; stop(); sfx("win"); st && st.dispose();
    const done = G.asked - (G.q ? 1 : 0), acc = done ? Math.round(G.right / done * 100) : 0, seen = [], miss = G.missed.filter(m => !seen.includes(m.q) && seen.push(m.q));
    host.innerHTML = `<div class="sf-dashend"><p class="sf-launch__t">${L("Beam Bender complete!", "¡Dobla el rayo completado!")}</p><div class="sf-stats"><span><b>${G.score}</b>${L("score", "puntos")}</span><span><b>${G.right}/${done}</b>${L("towers right", "torres correctas")}</span><span><b>${acc}%</b>${L("accuracy", "precisión")}</span><span><b>x${G.best}</b>${L("best streak", "mejor racha")}</span></div>
      ${miss.length ? `<p><b>${L("Worth another look:", "Para repasar:")}</b></p><ul class="sf-miss">${miss.map(m => `<li><img src="${img(m.img)}" alt=""><span>${esc(m.q)} <b>${esc(m.right)}</b> <small>${esc(m.hook)}</small></span></li>`).join("")}</ul>` : `<p>${L("Every tower correct. Outstanding.", "Todas las torres correctas. Sobresaliente.")}</p>`}
      <div class="sf-row"><button type="button" class="sf-btn sf-btn--big d-again">${L("Play again", "Jugar otra vez")}</button><button type="button" class="sf-btn sf-btn--ghost d-close">${L("Close", "Cerrar")}</button></div>
      <p class="sf-credit">${creditLine([...new Set(Q().map(x => x.img))])}</p></div>`;
    ctx.bonusDone(G.score, G.right);
    host.querySelector(".d-again").addEventListener("click", () => mountBeam(host, ctx, onClose));
    host.querySelector(".d-close").addEventListener("click", () => { host.innerHTML = ""; onClose && onClose(); });
  }
  $(".d-quit").addEventListener("click", finish);
  say(L("Turn the mirror. The white line is its normal: it always sits halfway between the two beams.", "Gira el espejo. La línea blanca es su normal: siempre queda a mitad de camino entre los dos rayos."), "good");
}
