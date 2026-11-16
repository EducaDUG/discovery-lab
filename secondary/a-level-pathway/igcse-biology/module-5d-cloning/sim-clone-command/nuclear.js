/* Clone Command — Station 2: Nuclear Transfer Suite (the Dolly procedure). */
import { L, T, C, clamp, lerp, rng, makeStage, mesh, std, glassMat, glowSprite, canvasTex, skyBackdrop, meadow, makeSheep, sfx, burstAt, shake, reduced, img, creditLine, esc } from "./kit.js?v=2";

const SHEEP = {
  A: { kind: "white", x: -2.1, col: 0xffc94d, css: "#ffc94d", name: () => L("Sheep A", "Oveja A"), look: () => L("a white face", "cara blanca"), breed: "Finn Dorset" },
  B: { kind: "black", x: 0, col: 0xb388ff, css: "#b388ff", name: () => L("Sheep B", "Oveja B"), look: () => L("a black face and horns", "cara negra y cuernos"), breed: "Scottish Blackface" },
  C: { kind: "brown", x: 2.1, col: 0x3fe0c5, css: "#3fe0c5", name: () => L("Sheep C", "Oveja C"), look: () => L("brown wool", "lana marrón"), breed: L("brown ewe", "oveja marrón") },
};
const SY = 60;                                   /* the microscope "room" sits high above the paddock */
const LABELS = [
  { id: "hold", x: .045, y: .64, name: () => L("Holding pipette", "Pipeta de sujeción"), fn: () => L("A blunt glass tube that holds the egg cell still by gentle suction.", "Tubo de vidrio romo que sujeta el óvulo con una succión suave.") },
  { id: "egg", x: .27, y: .5, name: () => L("Egg cell", "Óvulo"), fn: () => L("One huge cell, packed with the cytoplasm an embryo needs to start growing.", "Una célula enorme, llena del citoplasma que un embrión necesita para empezar a crecer.") },
  { id: "needle", x: .72, y: .585, name: () => L("Micro-needle", "Microaguja"), fn: () => L("A glass needle finer than a hair, used to remove or insert a nucleus.", "Aguja de vidrio más fina que un cabello, para extraer o introducir un núcleo.") },
];

export function mountNuclear(host, ctx) {
  const sim = ctx.sim;
  const N = sim.state.nt = sim.state.nt || { phase: 0, lab: {}, run: {}, runs: 0, goals: {}, last: null };
  const save = () => sim.saveState();
  host.innerHTML = `<div class="cc-split"><div class="cc-view"><div class="cc-stage3d" data-fallback="${esc(L("3D view unavailable on this device. Use the aim gauge and buttons on the right.", "Vista 3D no disponible en este dispositivo. Usa el indicador y los botones."))}"></div>
    <div class="cc-cams"><button type="button" data-cam="pad">${L("Paddock", "Prado")}</button><button type="button" data-cam="scope">${L("Microscope", "Microscopio")}</button></div></div><div class="cc-panel" aria-live="polite"></div></div>`;
  const panel = host.querySelector(".cc-panel");
  const CAMS = { pad: { theta: 0, phi: 1.28, dist: 7.2, target: [0, .75, 0] }, scope: { theta: 0, phi: 1.5, dist: 5.4, target: [.3, SY, 0] } };
  const st = makeStage(host.querySelector(".cc-stage3d"), { cam: CAMS.pad, limits: { minDist: 3, maxDist: 12, minPhi: .7, maxPhi: 1.52 }, sunPos: [5, 9, 6], shadowRange: 7, swayAmp: .05 });
  host.querySelectorAll("[data-cam]").forEach(b => b.addEventListener("click", () => { st && st.flyTo(CAMS[b.dataset.cam]); sfx("tick"); }));

  /* aim state shared by the 3D scene and the DOM gauge (wall-clock driven) */
  const aim = { y: 0, needleX: 2.3, hold: null, mode: null };
  const nucY = () => N.phase === 3 ? Math.sin(Date.now() / 1000 * (reduced() ? .35 : .8)) * .42 : 0;
  let timer = 0; const clear = () => { clearInterval(timer); timer = 0; };

  /* ------------------------------------------------------------ 3D scene */
  const sheep = {}, tags = {}; let lamb = null, cell = null;
  if (st) {
    skyBackdrop(st); meadow(st);
    const wood = std(0x8a6a45, .9);
    for (let i = -5; i <= 5; i++) st.scene.add(mesh(new T.CylinderGeometry(.05, .06, 1, 8), wood, i * 1.2, .5, -2.2));
    [.45, .8].forEach(y => st.scene.add(mesh(new T.BoxGeometry(12.4, .07, .05), wood, 0, y, -2.2)));
    Object.keys(SHEEP).forEach((k, i) => {
      const s = makeSheep(SHEEP[k].kind, { seed: 9 + i * 5, scale: 1.25 }); s.position.set(SHEEP[k].x, 0, 0); s.rotation.y = -Math.PI / 2 + .55; st.scene.add(s); sheep[k] = s;
      const ring = mesh(new T.TorusGeometry(.75, .035, 8, 48), new T.MeshBasicMaterial({ color: SHEEP[k].col, transparent: true, opacity: 0 }), SHEEP[k].x, .03, 0, false); ring.rotation.x = Math.PI / 2; st.scene.add(ring); s.userData.ring = ring;
      const tag = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(128, 128, g => { g.fillStyle = SHEEP[k].css; g.beginPath(); g.arc(64, 64, 56, 0, 6.3); g.fill(); g.lineWidth = 8; g.strokeStyle = "#fff"; g.stroke(); g.fillStyle = "#14202a"; g.font = "900 78px system-ui,sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(k, 64, 70); }), depthTest: false })); tag.scale.set(.55, .55, 1); tag.position.set(SHEEP[k].x, 2.05, 0); st.scene.add(tag); tags[k] = tag;
      st.pickable(s, () => pickSheep(k));
    });
    /* microscope room */
    const room = new T.Mesh(new T.SphereGeometry(14, 32, 20), new T.MeshBasicMaterial({ side: T.BackSide, fog: false, map: canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, w * .7); gr.addColorStop(0, "#2f5a70"); gr.addColorStop(.55, "#123040"); gr.addColorStop(1, "#040b11"); g.fillStyle = gr; g.fillRect(0, 0, w, w); }) })); room.position.set(0, SY, 0); st.scene.add(room);
    const pl = new T.PointLight(C(0xffffff), 1.4, 20); pl.position.set(2, SY + 3, 5); st.scene.add(pl);
    cell = new T.Group(); cell.position.set(0, SY, 0); st.scene.add(cell);
    const zona = mesh(new T.SphereGeometry(1.06, 48, 32), glassMat(0xdff3ff, .2), 0, 0, 0, false); cell.add(zona);
    const cytoM = new T.MeshPhysicalMaterial({ color: C(0xc28a45), transparent: true, opacity: .55, roughness: .35, clearcoat: .6, depthWrite: false });
    const cyto = mesh(new T.SphereGeometry(.93, 40, 28), cytoM, 0, 0, 0, false); cell.add(cyto);
    const r = rng(4), gp = new Float32Array(260 * 3); for (let i = 0; i < 260; i++) { const a = r() * 6.283, b = Math.acos(2 * r() - 1), d = Math.cbrt(r()) * .85; gp[i * 3] = Math.sin(b) * Math.cos(a) * d; gp[i * 3 + 1] = Math.cos(b) * d; gp[i * 3 + 2] = Math.sin(b) * Math.sin(a) * d; }
    const gg = new T.BufferGeometry(); gg.setAttribute("position", new T.BufferAttribute(gp, 3)); const gran = new T.Points(gg, new T.PointsMaterial({ color: C(0x6e4a1c), size: .055, transparent: true, opacity: .9, depthWrite: false })); cell.add(gran);
    const mkNuc = () => { const g = new T.Group(), m = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .45, roughness: .3 }); g.add(mesh(new T.SphereGeometry(.21, 24, 18), m, 0, 0, 0, false)); const gl = glowSprite(0xffffff, .75); gl.material.opacity = .55; g.add(gl); g.userData.set = col => { m.color.copy(C(col)); m.emissive.copy(C(col)); gl.material.color.copy(C(col)); }; return g; };
    const own = mkNuc(), donor = mkNuc(); cell.add(own); st.scene.add(donor);
    const blasts = []; for (let i = 0; i < 8; i++) { const b = mesh(new T.SphereGeometry(1, 28, 20), new T.MeshPhysicalMaterial({ color: C(0xc28a45), transparent: true, opacity: .5, roughness: .3, clearcoat: .7, depthWrite: false }), 0, 0, 0, false); b.visible = false; cell.add(b); const n2 = mesh(new T.SphereGeometry(.22, 12, 10), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .5 }), 0, 0, 0, false); b.add(n2); b.userData.n = n2; blasts.push(b); }
    const glass = glassMat(0xffffff, .28);
    const holdP = mesh(new T.CylinderGeometry(.34, .34, 5, 24, 1, true), glass, -3.56, SY, 0, false); holdP.rotation.z = Math.PI / 2; st.scene.add(holdP);
    const needle = new T.Group(); const nb = mesh(new T.CylinderGeometry(.09, .09, 5, 16, 1, true), glass, 2.9, 0, 0, false); nb.rotation.z = Math.PI / 2; needle.add(nb); const tip = mesh(new T.ConeGeometry(.09, .5, 16, 1, true), glass, .25, 0, 0, false); tip.rotation.z = Math.PI / 2; needle.add(tip); st.scene.add(needle);
    const arc = glowSprite(0x9fdcff, 4.5); arc.position.set(0, SY, .5); arc.material.opacity = 0; st.scene.add(arc);

    st.onFrame.push((dt, t) => {
      Object.keys(sheep).forEach(k => { sheep[k].userData.idle(t); const rn = N.run, on = rn.nuc === k || rn.egg === k || rn.sur === k; sheep[k].userData.ring.material.opacity = lerp(sheep[k].userData.ring.material.opacity, on ? .9 : 0, .1); tags[k].position.y = 2.05 + (reduced() ? 0 : Math.sin(t * 1.5 + k.charCodeAt(0)) * .04); });
      if (lamb) { lamb.userData.idle(t); lamb.scale.setScalar(lamb.userData.sc.v); }
      const rn = N.run, ph = N.phase, now = Date.now();
      /* egg's own nucleus */
      own.visible = !!rn.egg && rn.enuc !== true && !rn.divAt; if (rn.egg) own.userData.set(SHEEP[rn.egg].col);
      if (aim.hold === "own") { own.position.set(aim.needleX - .15, aim.y, 0); own.visible = aim.needleX < 2.2; } else own.position.set(.25, nucY(), 0);
      /* donor nucleus */
      if (rn.nuc) donor.userData.set(SHEEP[rn.nuc].col);
      donor.visible = (ph === 4 && !rn.injected) || (!!rn.injected && !rn.divAt);
      if (rn.injected) donor.position.set(rn.enuc ? 0 : -.3, SY, 0); else donor.position.set(aim.needleX + .5, SY + aim.y, 0);
      needle.position.set(aim.needleX, SY + aim.y, 0);
      gran.rotation.y = t * .05; cell.rotation.z = reduced() ? 0 : Math.sin(t * .5) * .02;
      /* division after the pulse: 1 -> 2 -> 4 -> 8 */
      if (rn.divAt) {
        const k = clamp((now - rn.divAt) / 3600, 0, 1), s = k < .15 ? 0 : k < .45 ? 1 : k < .75 ? 2 : 3, rad = [.9, .62, .5, .42][s], off = [0, .45, .45, .43][s];
        cyto.visible = gran.visible = false;
        blasts.forEach((b, i) => { b.visible = true; const tx = s >= 1 ? (i & 1 ? off : -off) : 0, ty = s >= 2 ? (i & 2 ? off : -off) : 0, tz = s >= 3 ? (i & 4 ? off : -off) : 0; b.position.x = lerp(b.position.x, tx, .12); b.position.y = lerp(b.position.y, ty, .12); b.position.z = lerp(b.position.z, tz, .12); const sc = lerp(b.scale.x, rad, .12); b.scale.setScalar(sc); b.userData.n.material.color.copy(C(SHEEP[rn.nuc].col)); b.userData.n.material.emissive.copy(C(SHEEP[rn.nuc].col)); });
      } else { cyto.visible = gran.visible = true; blasts.forEach(b => { b.visible = false; b.position.set(0, 0, 0); b.scale.setScalar(.9); }); }
      arc.material.opacity = Math.max(0, arc.material.opacity - dt * 1.6);
    });
    st.zap = () => { arc.material.opacity = reduced() ? .4 : .95; };
    st.showLamb = (kind, at) => { if (lamb) st.scene.remove(lamb); lamb = null; if (!kind) return; lamb = makeSheep(kind, { seed: 31, scale: .01 }); lamb.position.set(SHEEP[at].x - .15, 0, 1.25); lamb.rotation.y = -Math.PI / 2 + .35; lamb.userData.sc = { v: .01 }; st.scene.add(lamb); st.tween(lamb.userData.sc, { v: .62 }, 1.1); st.burst(lamb.position.clone().setY(.8), 0xffe27a, 40, 2.6, .12); st.punch(.85); };
    if (N.phase === 7 && N.last && N.last.lamb) st.showLamb(SHEEP[N.last.lamb].kind, N.last.sur);
  }

  /* ----------------------------------------------------------------- UI */
  const nm = k => `<b style="color:${SHEEP[k].css}">${SHEEP[k].name()}</b>`;
  const fb = (cls, html) => { const d = panel.querySelector(".cc-fb"); if (d) { d.className = "cc-fb " + cls; d.innerHTML = html; } };
  function goal(k) { if (!N.goals[k]) { N.goals[k] = 1; save(); } ctx.star("nuclear", (N.goals.cloneA ? 1 : 0) + (N.goals.second ? 1 : 0) + (N.goals.curious ? 1 : 0), !!N.goals.cloneA); }
  const track = () => { const steps = [L("Body cell", "Célula corporal"), L("Egg cell", "Óvulo"), L("Enucleate", "Enuclear"), L("Insert nucleus", "Insertar núcleo"), L("Electric pulse", "Pulso eléctrico"), L("Surrogate", "Madre sustituta")]; return `<ol class="cc-track">${steps.map((s, i) => `<li class="${N.phase - 1 > i ? "done" : N.phase - 1 === i ? "now" : ""}">${s}</li>`).join("")}</ol>`; };
  const sheepBtns = () => `<div class="cc-cards cc-cards--sheep">${Object.keys(SHEEP).map(k => `<button type="button" class="cc-card" data-sheep="${k}" style="--c:${SHEEP[k].css}"><b>${SHEEP[k].name()}</b><span>${SHEEP[k].breed}</span><span>${SHEEP[k].look()}</span></button>`).join("")}</div>`;
  const gaugeHTML = () => `<div class="cc-aim"><div class="cc-gauge" aria-hidden="true"><i class="cc-g-nuc"></i><i class="cc-g-needle"></i></div><div class="cc-aimctl"><label>${L("Needle height", "Altura de la aguja")}<input type="range" class="cc-aimr" min="-60" max="60" value="0" aria-label="${L("Needle height", "Altura de la aguja")}"></label><p class="cc-hint">${L("Line the needle (white) up with the nucleus (colour), then advance. Arrow keys work too. No penalty for missing.", "Alinea la aguja (blanca) con el núcleo (color) y avanza. También sirven las flechas. Fallar no penaliza.")}</p></div></div>`;
  function startGauge() {
    clear(); const g = panel.querySelector(".cc-gauge"), rg = panel.querySelector(".cc-aimr"); if (!g) return;
    rg.addEventListener("input", () => { aim.y = rg.value / 100; });
    const nn = g.querySelector(".cc-g-nuc"); nn.style.background = N.phase === 3 ? SHEEP[N.run.egg].css : "transparent"; nn.style.borderColor = N.phase === 3 ? "#fff" : "rgba(255,255,255,.5)";
    timer = setInterval(() => { if (!panel.isConnected) return clear(); nn.style.top = (50 - nucY() * 70) + "%"; g.querySelector(".cc-g-needle").style.top = (50 - aim.y * 70) + "%"; }, 40);
  }
  function pickSheep(k) { const b = panel.querySelector(`[data-sheep="${k}"]`); if (b) b.click(); }

  function render() {
    clear(); const rn = N.run, ph = N.phase;
    if (ph === 0) return renderLabels();
    if (ph === 1 || ph === 2 || ph === 6) {
      st && st.flyTo(CAMS.pad);
      const txt = ph === 1 ? [L("Step 1: take a body cell", "Paso 1: toma una célula corporal"), L("ORDER: the farm wants an exact copy of its champion, <b>Sheep A</b>. A body cell (from the udder) has a full set of chromosomes: it is <b>diploid</b>. Which sheep do you take the body cell from? <small>You are free to try any sheep and see what is born.</small>", "PEDIDO: la granja quiere una copia exacta de su campeona, la <b>Oveja A</b>. Una célula corporal (de la ubre) tiene el juego completo de cromosomas: es <b>diploide</b>. ¿De qué oveja tomas la célula corporal? <small>Puedes probar con cualquiera y ver qué nace.</small>")]
        : ph === 2 ? [L("Step 2: take an egg cell", "Paso 2: toma un óvulo"), L(`The nucleus will come from ${nm(rn.nuc)}. Now you need an unfertilised egg cell to put it in. Which sheep donates the egg?`, `El núcleo vendrá de la ${nm(rn.nuc)}. Ahora necesitas un óvulo sin fecundar donde colocarlo. ¿Qué oveja dona el óvulo?`)]
          : [L("Step 6: implant the embryo", "Paso 6: implanta el embrión"), L("The embryo is a ball of cells. It needs a uterus to grow in. Which sheep will be the <b>surrogate mother</b>?", "El embrión es una bola de células. Necesita un útero donde crecer. ¿Qué oveja será la <b>madre sustituta</b>?")];
      panel.innerHTML = track() + `<h3 class="cc-h">${txt[0]}</h3><p class="cc-sub">${txt[1]}</p>${sheepBtns()}<div class="cc-fb">${L("Tap a sheep in the paddock or a card.", "Toca una oveja en el prado o una tarjeta.")}</div>`;
      panel.querySelectorAll("[data-sheep]").forEach(b => b.addEventListener("click", () => {
        const k = b.dataset.sheep; sfx("pop"); burstAt(b, SHEEP[k].css, 10); st && st.burst(sheep[k].position.clone().setY(1.2), SHEEP[k].col, 18);
        if (ph === 1) { N.run = { nuc: k }; N.phase = 2; } else if (ph === 2) { rn.egg = k; N.phase = 3; } else { rn.sur = k; return birth(); }
        save(); render();
      }));
    } else if (ph === 3) {
      st && st.flyTo(CAMS.scope); aim.needleX = 2.3; aim.hold = null; aim.y = 0;
      panel.innerHTML = track() + `<h3 class="cc-h">${L("Step 3: the egg cell's own nucleus", "Paso 3: el núcleo propio del óvulo")}</h3><p class="cc-sub">${L(`This egg cell came from ${nm(rn.egg)}. Its nucleus (glowing) carries ${SHEEP[rn.egg].name()}'s genetic information. Decide what to do with it.`, `Este óvulo viene de la ${nm(rn.egg)}. Su núcleo (brillante) lleva la información genética de la ${SHEEP[rn.egg].name()}. Decide qué hacer con él.`)}</p>${gaugeHTML()}
        <div class="cc-row"><button type="button" class="cc-btn cc-btn--big cc-adv">${L("Advance needle and remove the nucleus", "Avanzar la aguja y extraer el núcleo")}</button><button type="button" class="cc-btn cc-btn--ghost cc-skip">${L("Leave the nucleus in", "Dejar el núcleo dentro")}</button></div><div class="cc-fb"></div>`;
      startGauge();
      panel.querySelector(".cc-adv").addEventListener("click", e => {
        const ok = Math.abs(aim.y - nucY()) < .17, btn = e.currentTarget;
        if (!ok) { shake(btn); sfx("bad"); fb("bad", L("Missed: the needle slid past the nucleus. Re-aim and try again.", "Fallaste: la aguja pasó de largo. Apunta de nuevo.")); if (st) { st.tween(aim, { needleX: .9 }, .25, { done: () => st.tween(aim, { needleX: 2.3 }, .3) }); } return; }
        clear(); btn.disabled = true; sfx("ok"); burstAt(btn); ctx.gain(25, btn); rn.enuc = true; save();
        const fin = () => { N.phase = 4; save(); render(); fb("good", "✔ " + L("Enucleated: the egg cell now has no nucleus, so no genetic information of its own.", "Enucleado: el óvulo ya no tiene núcleo, así que no tiene información genética propia.")); };
        if (st && !reduced()) { rn.enuc = null; aim.y = nucY(); st.tween(aim, { needleX: .55 }, .35, { done: () => { aim.hold = "own"; st.burst(new T.Vector3(.4, SY + aim.y, 0), SHEEP[rn.egg].col, 16, 1.2, .08); st.tween(aim, { needleX: 2.6 }, .7, { done: () => { rn.enuc = true; aim.hold = null; } }); } }); setTimeout(() => { rn.enuc = true; aim.hold = null; fin(); }, 1300); } else fin();
      });
      panel.querySelector(".cc-skip").addEventListener("click", () => { rn.enuc = false; N.phase = 4; save(); sfx("tick"); render(); fb("", L("You left the egg's own nucleus in place. Carry on and see what happens.", "Dejaste el núcleo propio del óvulo. Sigue y observa qué pasa.")); });
    } else if (ph === 4) {
      st && st.flyTo(CAMS.scope); aim.needleX = 2.3; aim.hold = null;
      panel.innerHTML = track() + `<h3 class="cc-h">${L("Step 4: insert the donor nucleus", "Paso 4: inserta el núcleo donante")}</h3><p class="cc-sub">${L(`The needle now carries the <b>diploid nucleus</b> from ${nm(rn.nuc)}'s body cell. Aim for the middle of the egg cell and inject it.`, `La aguja lleva ahora el <b>núcleo diploide</b> de la célula corporal de la ${nm(rn.nuc)}. Apunta al centro del óvulo e inyéctalo.`)}</p>${gaugeHTML()}
        <div class="cc-row"><button type="button" class="cc-btn cc-btn--big cc-adv">${L("Inject the nucleus", "Inyectar el núcleo")}</button></div><div class="cc-fb"></div>`;
      startGauge();
      panel.querySelector(".cc-adv").addEventListener("click", e => {
        const btn = e.currentTarget;
        if (Math.abs(aim.y) > .3) { shake(btn); sfx("bad"); fb("bad", L("Too near the edge: the nucleus would not stay in. Aim closer to the centre line.", "Demasiado cerca del borde: el núcleo no se quedaría dentro. Apunta más al centro.")); return; }
        clear(); btn.disabled = true; sfx("ok"); burstAt(btn, SHEEP[rn.nuc].css); ctx.gain(25, btn);
        const fin = () => { rn.injected = true; aim.needleX = 2.3; N.phase = 5; save(); render(); };
        if (st && !reduced()) { st.tween(aim, { needleX: -.4, y: 0 }, .5, { done: () => { rn.injected = true; st.burst(new T.Vector3(0, SY, 0), SHEEP[rn.nuc].col, 20, 1.3, .08); st.tween(aim, { needleX: 2.6 }, .5); } }); setTimeout(fin, 1200); } else fin();
      });
    } else if (ph === 5) {
      st && st.flyTo(CAMS.scope);
      panel.innerHTML = track() + `<h3 class="cc-h">${L("Step 5: electric pulse", "Paso 5: pulso eléctrico")}</h3><p class="cc-sub">${L("The cell is just sitting there. A small electric shock is used to make it start dividing. Press <b>Pulse</b> while the charge is in the green band.", "La célula está quieta. Se usa una pequeña descarga eléctrica para que empiece a dividirse. Pulsa <b>Pulso</b> cuando la carga esté en la franja verde.")}</p>
        <div class="cc-meter" aria-hidden="true"><i class="cc-band"></i><i class="cc-mark"></i></div>
        <div class="cc-row"><button type="button" class="cc-btn cc-btn--big cc-pulse">${L("Pulse", "Pulso")}</button><button type="button" class="cc-btn cc-btn--ghost cc-skip">${L("Skip the shock", "Saltar la descarga")}</button></div><div class="cc-fb"></div>`;
      const mark = panel.querySelector(".cc-mark"), per = reduced() ? 5200 : 2600, pos = () => { const k = (Date.now() % per) / per; return k < .5 ? k * 2 : 2 - k * 2; };
      timer = setInterval(() => { if (!panel.isConnected) return clear(); mark.style.left = pos() * 100 + "%"; }, 30);
      panel.querySelector(".cc-pulse").addEventListener("click", e => {
        const p = pos(), btn = e.currentTarget;
        if (p < .36 || p > .64) { shake(btn); sfx("bad"); fb("bad", p < .36 ? L("Too weak: nothing happened. Try again in the green band.", "Demasiado débil: no pasó nada. Inténtalo en la franja verde.") : L("Too strong: wait for the green band and try again.", "Demasiado fuerte: espera la franja verde e inténtalo de nuevo.")); return; }
        clear(); btn.disabled = true; sfx("zap"); st && st.zap(); st && st.punch(.9); rn.shock = true; ctx.gain(25, btn); burstAt(btn, "#9fdcff", 20);
        if (rn.enuc) { rn.divAt = Date.now(); fb("good", "✔ " + L("The cell is dividing by <b>mitosis</b>: 1, 2, 4, 8 cells. Every cell gets an exact copy of the donor nucleus. It is now an embryo.", "La célula se divide por <b>mitosis</b>: 1, 2, 4, 8 células. Cada célula recibe una copia exacta del núcleo donante. Ya es un embrión.")); }
        else fb("bad", L("The cell twitches but does not divide properly: it holds two nuclei, so it has too much genetic information.", "La célula se agita pero no se divide bien: tiene dos núcleos, es decir, demasiada información genética."));
        save(); setTimeout(() => { N.phase = 6; save(); render(); }, rn.enuc ? 4200 : 2200);
      });
      panel.querySelector(".cc-skip").addEventListener("click", () => { rn.shock = false; N.phase = 6; save(); sfx("tick"); render(); });
    } else renderResult();
  }

  function birth() {
    const rn = N.run; N.runs++; const ok = rn.enuc && rn.shock;
    const setup = L(`Nucleus from ${rn.nuc} (${SHEEP[rn.nuc].look()}); egg from ${rn.egg}; own nucleus removed: ${rn.enuc ? "yes" : "no"}; electric pulse: ${rn.shock ? "yes" : "no"}; surrogate ${rn.sur}`, `Núcleo de ${rn.nuc} (${SHEEP[rn.nuc].look()}); óvulo de ${rn.egg}; núcleo propio extraído: ${rn.enuc ? "sí" : "no"}; pulso eléctrico: ${rn.shock ? "sí" : "no"}; madre sustituta ${rn.sur}`);
    const why = !rn.shock ? L("No embryo: without the pulse the cell never began to divide", "Sin embrión: sin el pulso la célula no empezó a dividirse") : !rn.enuc ? L("No lamb: the egg kept its own nucleus too, so the embryo failed", "Sin cordero: el óvulo conservó su núcleo y el embrión fracasó") : "";
    const outcome = ok ? L(`Lamb born with ${SHEEP[rn.nuc].look()}: genetically identical to ${rn.nuc}`, `Nació un cordero con ${SHEEP[rn.nuc].look()}: genéticamente idéntico a ${rn.nuc}`) : why;
    ctx.log({ lab: L("Animals", "Animales"), run: L(`Clone attempt ${N.runs}`, `Intento de clon ${N.runs}`), setup, outcome, count: ok ? L("1 lamb", "1 cordero") : L("0 lambs", "0 corderos") });
    N.last = { nuc: rn.nuc, egg: rn.egg, sur: rn.sur, lamb: ok ? rn.nuc : null, why, prev: N.goals.firstNuc || null };
    if (ok) { if (rn.nuc === "A" && rn.egg !== "A") goal("cloneA"); if (N.goals.firstNuc && N.goals.firstNuc !== rn.nuc) goal("second"); if (!N.goals.firstNuc) { N.goals.firstNuc = rn.nuc; } goal("any"); ctx.award("cc-dolly", L("Hello, Dolly", "Hola, Dolly")); }
    else { goal("curious"); ctx.award("cc-curious", L("Curious Scientist", "Ciencia Curiosa")); }
    N.phase = 7; save(); renderWait(ok);
  }
  function renderWait(ok) {
    clear(); st && st.flyTo(CAMS.pad); st && st.showLamb(null);
    panel.innerHTML = track() + `<h3 class="cc-h">${L("Embryo implanted", "Embrión implantado")}</h3><p class="cc-sub">${L("About 5 months of pregnancy pass...", "Pasan unos 5 meses de gestación...")}</p><div class="cc-prog"><i></i><span></span></div>`;
    const bar = panel.querySelector(".cc-prog i"), t0 = Date.now(), D = reduced() ? 700 : 2600;
    if (st && !reduced()) { st.tween(st.sun, { intensity: .25 }, 1.1, { done: () => st.tween(st.sun, { intensity: 2.2 }, 1.2) }); }
    timer = setInterval(() => { const k = clamp((Date.now() - t0) / D, 0, 1); bar.style.width = k * 100 + "%"; bar.nextElementSibling.textContent = L(`Month ${Math.min(5, Math.floor(k * 5) + 1)} of 5`, `Mes ${Math.min(5, Math.floor(k * 5) + 1)} de 5`); if (k >= 1) { clear(); if (st) st.sun.intensity = 2.2; if (ok && st) st.showLamb(SHEEP[N.last.lamb].kind, N.last.sur); sfx(ok ? "win" : "bad"); renderResult(true); } }, 60);
  }
  function renderResult(fresh) {
    clear(); st && st.flyTo(CAMS.pad); const l = N.last || {}, g = N.goals;
    const li = (k, t) => `<li class="${g[k] ? "done" : ""}">${t}</li>`;
    panel.innerHTML = `<h3 class="cc-h">${l.lamb ? L("A lamb is born!", "¡Ha nacido un cordero!") : L("No lamb this time", "Esta vez no hay cordero")}</h3>` +
      (l.lamb ? `<div class="cc-fb good"><b>${L(`The lamb has ${SHEEP[l.lamb].look()}, exactly like`, `El cordero tiene ${SHEEP[l.lamb].look()}, igual que la`)} ${nm(l.lamb)}.</b> ${L(`It is a clone of the sheep that gave the <b>nucleus</b>, because the nucleus holds the genetic information. The egg donor (${l.egg}) only supplied cytoplasm, and the surrogate (${l.sur}) only carried the pregnancy.`, `Es un clon de la oveja que dio el <b>núcleo</b>, porque el núcleo contiene la información genética. La donante del óvulo (${l.egg}) solo aportó citoplasma y la madre sustituta (${l.sur}) solo llevó la gestación.`)}</div>
        <figure class="cc-fig"><img src="${img("dolly-face")}" alt="${L("Dolly the sheep, a white-faced Finn Dorset", "La oveja Dolly, una Finn Dorset de cara blanca")}"><figcaption>${L("The real Dolly (1996): nucleus from a white-faced Finn Dorset, egg and surrogate both Scottish Blackface. It took 277 attempts to get one lamb.", "La Dolly real (1996): núcleo de una Finn Dorset de cara blanca; óvulo y madre sustituta, Scottish Blackface. Hicieron falta 277 intentos para un cordero.")}</figcaption></figure>`
        : `<div class="cc-fb bad"><b>${l.why}.</b> ${L("Every step of nuclear transfer is there for a reason. Run it again to compare.", "Cada paso de la transferencia nuclear tiene su razón. Repite para comparar.")}</div>`) +
      `<ul class="cc-goals">${li("cloneA", L("Fill the order: clone Sheep A using another sheep's egg", "Completa el pedido: clona la Oveja A con el óvulo de otra oveja"))}${li("second", L("Run again with a different nucleus donor and compare the lamb", "Repite con otra donante de núcleo y compara el cordero"))}${li("curious", L("Find out what happens if you skip a step", "Descubre qué pasa si te saltas un paso"))}</ul>
      <button type="button" class="cc-btn cc-btn--big cc-again">${L("Run another clone", "Hacer otro clon")}</button><p class="cc-credit">${creditLine(["dolly-face"])}</p>`;
    if (fresh) { ctx.gain(l.lamb ? 50 : 20, panel.querySelector(".cc-h")); burstAt(panel.querySelector(".cc-h"), l.lamb ? "#ffe27a" : "#9fdcff", 22); }
    panel.querySelector(".cc-again").addEventListener("click", () => { N.run = {}; N.phase = 1; save(); st && st.showLamb(null); render(); });
  }

  function renderLabels() {
    st && st.flyTo(CAMS.pad);
    const todo = LABELS.filter(p => !N.lab[p.id]), cur = todo[0];
    panel.innerHTML = `<h3 class="cc-h">${L("Scope training: a real micro-injection", "Práctica: una microinyección real")}</h3><p class="cc-sub">${L("This is a REAL microscope photo of an egg cell being injected in a fertility lab. Nuclear transfer uses the same equipment. Tap the part that matches the clue.", "Esta es una foto REAL al microscopio de un óvulo durante una inyección en un laboratorio de fertilidad. La transferencia nuclear usa el mismo equipo. Toca la parte que corresponde a la pista.")}</p>
      <div class="cc-clue">${cur ? `<small>${L("Find", "Busca")} ${LABELS.length - todo.length + 1}/3</small><b>${cur.name()}</b><span>${cur.fn()}</span>` : `<b>${L("All three found.", "Las tres encontradas.")}</b>`}</div>
      <div class="cc-photo"><img src="${img("icsi")}" alt="${L("Microscope photo: an egg cell held by a pipette on the left while a fine needle enters from the right", "Foto al microscopio: un óvulo sujeto por una pipeta a la izquierda mientras una aguja fina entra por la derecha")}">${LABELS.map((p, i) => `<button type="button" class="cc-pin${N.lab[p.id] ? " ok" : ""}" data-pin="${p.id}" style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${L("Spot", "Punto")} ${i + 1}">${N.lab[p.id] ? "✓" : i + 1}</button>`).join("")}</div>
      <div class="cc-fb"></div><button type="button" class="cc-btn cc-btn--big cc-next" ${cur ? "hidden" : ""}>${L("Start cloning", "Empezar a clonar")} →</button><p class="cc-credit">${creditLine(["icsi"])}</p>`;
    panel.querySelectorAll("[data-pin]").forEach(b => b.addEventListener("click", () => {
      if (!cur || N.lab[b.dataset.pin]) { shake(b); return; }
      if (b.dataset.pin === cur.id) { N.lab[cur.id] = 1; save(); sfx("ok"); ctx.gain(15, b); burstAt(b); renderLabels(); fb("good", "✔ " + cur.name() + ": " + cur.fn()); if (LABELS.every(p => N.lab[p.id])) ctx.log({ lab: L("Animals", "Animales"), run: L("Photo labelling", "Etiquetado de foto"), setup: L("Real micro-injection photo: holding pipette, egg cell, micro-needle", "Foto real de microinyección: pipeta de sujeción, óvulo, microaguja"), outcome: L("All 3 parts identified", "Las 3 partes identificadas"), count: "3/3" }); }
      else { b.classList.add("bad"); shake(b); sfx("bad"); fb("bad", L("Not that one. Read the clue again: what does this part do?", "Esa no. Lee la pista otra vez: ¿qué hace esta parte?")); setTimeout(() => b.classList.remove("bad"), 700); }
    }));
    panel.querySelector(".cc-next").addEventListener("click", () => { N.phase = 1; save(); render(); });
  }

  goal("_"); render();
  return { dispose() { clear(); st && st.dispose(); } };
}
