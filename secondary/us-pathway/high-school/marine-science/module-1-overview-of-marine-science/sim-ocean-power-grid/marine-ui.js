/* OceanCurrents UI components: tech illustrations, build drawer, device inspector, Field Guide + quiz,
   missions, land-vs-ocean lab. Plain DOM (no framework). Dialogs are real role="dialog" with Esc + focus return. */
import { L, MARINE_TECHNOLOGIES, techOf, TECH_IDS, CATEGORY, ZONES, codexTopics, quizQuestions, scenarios } from "./marine-data.js?v=2";
import { compareLandOcean } from "./marine-engine.js?v=2";
import { soundManager } from "./marine-sound.js?v=2";

export const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
export const usd = n => "$" + fmt(n);
export const mw = kw => (kw / 1000).toFixed(kw >= 1000 ? 1 : 2);
export const fmtPower = kw => (kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${kw} kW`);

/* ---------- drawn cutaway diagrams for technologies that have no licence-checked photo ---------- */
export function diagramSVG(kind) {
  const sea = `<rect width="200" height="110" fill="#0b2a4a"/><rect y="38" width="200" height="72" fill="#0369a1"/><path d="M0 38q12-6 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0" fill="none" stroke="#bae6fd" stroke-width="2"/><rect y="96" width="200" height="14" fill="#3a2f23"/>`;
  const wrap = body => `<svg viewBox="0 0 200 110" class="oc-diagram" role="img" aria-hidden="true">${sea}${body}</svg>`;
  if (kind === "owc") return wrap(`<rect x="70" y="14" width="64" height="62" fill="#94a3b8"/><rect x="78" y="40" width="48" height="36" fill="#0369a1"/><path d="M78 52q8-8 16 0t16 0 16 0" fill="none" stroke="#bae6fd" stroke-width="2"/><rect x="96" y="2" width="12" height="14" fill="#f8fafc"/><path d="M102 20v-14" stroke="#fde047" stroke-width="3" marker-end="url(#a)"/><circle cx="102" cy="8" r="7" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="6 5"/><path d="M92 30l10-12 10 12M92 30h20" fill="none" stroke="#fde047" stroke-width="2.4"/><text x="100" y="104" fill="#e2e8f0" font-size="9" text-anchor="middle" font-family="system-ui">${L("rising wave pushes air up → turbine spins", "la ola empuja el aire → gira la turbina")}</text>`);
  if (kind === "flap") return wrap(`<rect x="60" y="88" width="80" height="8" fill="#64748b"/><circle cx="100" cy="88" r="4" fill="#e2e8f0"/><g transform="rotate(-16 100 88)"><rect x="96" y="40" width="8" height="48" fill="#facc15"/></g><g transform="rotate(16 100 88)" opacity=".35"><rect x="96" y="40" width="8" height="48" fill="#facc15"/></g><path d="M30 62h26M44 56l12 6-12 6M170 62h-26M156 56l-12 6 12 6" fill="none" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/><text x="100" y="106" fill="#e2e8f0" font-size="9" text-anchor="middle" font-family="system-ui">${L("seabed hinge swings with the surge", "bisagra del fondo oscila con el vaivén")}</text>`);
  if (kind === "kite") return wrap(`<path d="M100 96V60" stroke="#94a3b8" stroke-width="2"/><path d="M60 62c20-30 60-30 80 0s-60 30-80 0" fill="none" stroke="#a78bfa" stroke-width="2" stroke-dasharray="4 4"/><g transform="translate(122 44) rotate(24)"><rect x="-16" y="-2" width="32" height="5" rx="2" fill="#7c3aed"/><rect x="-5" y="3" width="10" height="7" rx="3" fill="#f8fafc"/></g><path d="M30 78h26M44 72l12 6-12 6" fill="none" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/><text x="100" y="106" fill="#e2e8f0" font-size="9" text-anchor="middle" font-family="system-ui">${L("figure-8 flight multiplies water speed ~10×", "el vuelo en 8 multiplica la velocidad ~10×")}</text>`);
  return wrap(`<path d="M70 96c0-34 60-34 60 0z" fill="#5eead4" opacity=".6" stroke="#99f6e4" stroke-width="2"/><rect x="92" y="60" width="16" height="36" fill="#f8fafc"/><path d="M82 70c-6-6-2-14 4-8M118 70c6-6 2-14-4-8" fill="none" stroke="#fde047" stroke-width="2.4"/><text x="100" y="52" fill="#fff" font-size="13" text-anchor="middle" font-family="system-ui" font-weight="700">H₂</text><text x="100" y="106" fill="#e2e8f0" font-size="9" text-anchor="middle" font-family="system-ui">${L("sea pressure stores hydrogen for free", "la presión del mar almacena hidrógeno gratis")}</text>`);
}
export function techVisual(t, base) {
  return t.photo ? `<img src="${base}${t.photo}" alt="${t.name}" loading="lazy">` : diagramSVG(t.diagram);
}

/* ---------- generic dialog ---------- */
export function openDialog(root, { title, sub, body, wide, onClose, side }) {
  const prev = document.activeElement;
  const ov = document.createElement("div"); ov.className = "oc-ov" + (side ? " oc-ov--side" : "");
  ov.innerHTML = `<div class="oc-dlg${wide ? " oc-dlg--wide" : ""}${side ? " oc-dlg--side" : ""}" role="dialog" aria-modal="true" aria-label="${title}"><div class="oc-dlg__head"><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ""}</div><button type="button" class="oc-x" aria-label="${L("Close", "Cerrar")}">✕</button></div><div class="oc-dlg__body"></div></div>`;
  const bodyEl = ov.querySelector(".oc-dlg__body"); if (typeof body === "string") bodyEl.innerHTML = body; else if (body) bodyEl.append(body);
  root.append(ov);
  const close = () => { ov.remove(); document.removeEventListener("keydown", esc, true); prev && prev.focus && prev.focus(); onClose && onClose(); };
  const esc = e => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  document.addEventListener("keydown", esc, true);
  ov.addEventListener("click", e => { if (e.target === ov) close(); });
  ov.querySelector(".oc-x").addEventListener("click", close);
  setTimeout(() => ov.querySelector(".oc-x").focus(), 20);
  return { el: ov, body: bodyEl, close };
}

/* ---------- Build drawer ---------- */
export function openBuildDrawer(root, ctx) {
  let cat = "all";
  const dlg = openDialog(root, { title: L("Build Ocean Generators", "Construir generadores oceánicos"), sub: `${L("Treasury", "Tesorería")}: ${usd(ctx.funds())} · ${L("Choose a technology, then click the ocean to construct it", "Elige una tecnología y luego haz clic en el océano para construirla")}`, side: true, wide: true });
  const paint = () => {
    const tabs = ["all", "wind", "wave", "tidal", "baseload", "solar", "storage"];
    dlg.body.innerHTML = `<div class="oc-tabs" role="tablist">${tabs.map(t => `<button type="button" role="tab" data-c="${t}" aria-selected="${cat === t}" class="${cat === t ? "is-on" : ""}">${t === "all" ? L("All Technologies", "Todas") : CATEGORY[t].label()}</button>`).join("")}</div><div class="oc-cards"></div>`;
    dlg.body.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { cat = b.dataset.c; soundManager.playClick(); paint(); }));
    const list = dlg.body.querySelector(".oc-cards");
    TECH_IDS.map(techOf).filter(t => cat === "all" || t.category === cat).forEach(t => {
      const unlocked = ctx.unlocked().includes(t.id), can = ctx.funds() >= t.capex, canU = t.unlockCost ? ctx.funds() >= t.unlockCost : false;
      const el = document.createElement("article"); el.className = "oc-card" + (unlocked ? "" : " is-locked"); el.style.setProperty("--cc", CATEGORY[t.category].color);
      el.innerHTML = `<div class="oc-card__vis">${techVisual(t, ctx.photoBase)}</div><div class="oc-card__b">
        <div class="oc-card__top"><div><h4>${t.name}</h4><span class="oc-muted">${CATEGORY[t.category].label()} · ${t.depthZone.map(z => ZONES[z].name()).join(", ")}</span></div><div class="oc-rated"><b>${fmtPower(t.ratedPowerKW)}</b><span>${L("Rated peak", "Potencia nominal")}</span></div></div>
        <p>${t.shortDesc}</p>
        <dl class="oc-spec"><div><dt>${L("Capital (capex)", "Capital (capex)")}</dt><dd>${usd(t.capex)}</dd></div><div><dt>${L("Daily opex", "Opex diario")}</dt><dd class="bad">${usd(t.dailyOpex)}/${L("day", "día")}</dd></div><div><dt>LCOE</dt><dd class="good">$${t.lcoeEstimate.toFixed(3)}/kWh</dd></div><div><dt>${L("Lifespan", "Vida útil")}</dt><dd>${t.lifespanDays} ${L("days", "días")}</dd></div></dl>
        <div class="oc-formula">${t.physicsFormula}</div>
        <div class="oc-card__act"><button type="button" class="oc-link" data-i>${L("View Physics & Marine Case Study", "Ver física y caso de estudio marino")}</button>${unlocked
          ? `<button type="button" class="oc-btn oc-btn--go" ${can ? "" : "aria-disabled='true'"} data-b>${can ? L("Select to Construct", "Elegir para construir") : L("Insufficient Capital", "Capital insuficiente")}</button>`
          : `<button type="button" class="oc-btn oc-btn--lock" ${canU ? "" : "aria-disabled='true'"} data-u>🔒 ${L("R&D Unlock", "Desbloqueo I+D")} (${usd(t.unlockCost || 0)})</button>`}</div></div>`;
      el.querySelector("[data-i]").addEventListener("click", () => { soundManager.playClick(); inspectTech(root, t, ctx.photoBase); });
      const b = el.querySelector("[data-b]"); if (b) b.addEventListener("click", () => { if (!can) { soundManager.playWarningAlert(); ctx.toast(L(`${t.name} costs ${usd(t.capex)}; the treasury has ${usd(ctx.funds())}.`, `${t.name} cuesta ${usd(t.capex)}; la tesorería tiene ${usd(ctx.funds())}.`), "warn"); return; } soundManager.playClick(); dlg.close(); ctx.selectToPlace(t.id); });
      const u = el.querySelector("[data-u]"); if (u) u.addEventListener("click", () => { if (!canU) { soundManager.playWarningAlert(); ctx.toast(L(`R&D unlock needs ${usd(t.unlockCost)}.`, `El desbloqueo I+D requiere ${usd(t.unlockCost)}.`), "warn"); return; } ctx.unlock(t.id, t.unlockCost); soundManager.playVictoryFanfare(); paint(); });
      list.append(el);
    });
  };
  paint();
}
export function inspectTech(root, t, base) {
  openDialog(root, { title: t.name, sub: t.physicsFormula, wide: true, body: `<div class="oc-inspect"><div class="oc-card__vis oc-inspect__vis">${techVisual(t, base)}</div>
    <h4>${L("Fluid Physics & Working Mechanism", "Física de fluidos y mecanismo")}</h4><p class="oc-box">${t.physicsExplanation}</p>
    <h4>${L("Marine Environmental Benefit", "Beneficio ambiental marino")}</h4><p class="oc-box oc-box--good">${t.ecoBenefit}</p>
    <h4>${L("Marine Engineering Challenge", "Reto de ingeniería marina")}</h4><p class="oc-box oc-box--bad">${t.keyChallenge}</p>
    <h4>${L("Real-World Operational Project", "Proyecto real en operación")}</h4><p class="oc-box oc-box--info">${t.realWorldExample}</p></div>` });
}

/* ---------- Device inspector (live) ---------- */
export function openDeviceDialog(root, ctx, instanceId) {
  const dev0 = ctx.device(instanceId); if (!dev0) return null;
  const t = techOf(dev0.techId);
  const dlg = openDialog(root, { title: t.name, sub: `${L("Asset", "Activo")} ${instanceId.slice(0, 8)} · ${L("Deployed day", "Desplegado el día")} ${dev0.builtOnDay}`, onClose: () => ctx.deselect() });
  const scrub = 3500, over = 12000;
  dlg.body.innerHTML = `<div class="oc-grid2"><div class="oc-tile"><span class="oc-k">${L("Current Power Generation", "Generación de potencia actual")}</span><b class="oc-big cy" data-k="out"></b><small data-k="rated"></small></div>
    <div class="oc-tile"><span class="oc-k">${L("Cumulative Energy Produced", "Energía acumulada producida")}</span><b class="oc-big gn" data-k="kwh"></b><small data-k="rev"></small></div></div>
    <div class="oc-box oc-stack">
      <div><div class="oc-row"><span>🛡️ ${L("Structural Integrity & Corrosion", "Integridad estructural y corrosión")}</span><b data-k="intv"></b></div><div class="oc-meter"><i data-k="intb"></i></div></div>
      <div><div class="oc-row"><span>✨ ${L("Marine Biofouling (Barnacles / Kelp)", "Bioincrustación marina (percebes / algas)")}</span><b class="am" data-k="foulv"></b></div><div class="oc-meter"><i class="am" data-k="foulb"></i></div></div>
      <div class="oc-row oc-row--line"><span>${L("Overall Hydrodynamic Efficiency", "Eficiencia hidrodinámica global")}</span><b class="cy" data-k="eff"></b></div></div>
    <div class="oc-box oc-box--good"><b>🐟 ${L("Marine Science Observation", "Observación de ciencias marinas")}</b><p data-k="obs"></p></div>
    <div class="oc-badges">
      <span class="oc-pill ${t.worksInClouds ? "ok" : "no"}">${t.worksInClouds ? L("☁️ Works on Cloudy Days", "☁️ Funciona en días nublados") : L("☁️ Needs Direct Sun", "☁️ Necesita sol directo")}</span>
      <span class="oc-pill ${t.needsWaves ? "ok" : ""}">${t.needsWaves ? L("🌊 Peaks in Big Wave Swells", "🌊 Máximo con gran oleaje") : L("🌊 Wave Independent", "🌊 Independiente de las olas")}</span>
      ${t.isConstantBaseload ? `<span class="oc-pill base">${L("⚓ 24/7 Constant Baseload", "⚓ Base constante 24/7")}</span>` : ""}</div>
    <p class="oc-sum">${t.friendlyStudentSummary}</p>
    <div class="oc-svc"><div class="oc-row"><b>${L("Send Offshore Technician Boat", "Enviar barco técnico mar adentro")}</b><small>${L("Watch the boat sail out to fix it!", "¡Mira cómo el barco navega a repararlo!")}</small></div>
      <div class="oc-grid2"><button type="button" class="oc-svcbtn" data-s="scrub"><b>🚤 ${L("Dispatch Tradies: Scrub", "Enviar técnicos: limpieza")}</b><small>${L("Cheeky tradies sail out to clean barnacles & restore flow!", "¡Técnicos graciosos limpian percebes y restauran el flujo!")}</small><span class="gn">${usd(scrub)}</span></button>
      <button type="button" class="oc-svcbtn oc-svcbtn--b" data-s="overhaul"><b>🚤 ${L("Dispatch Tradies: Overhaul", "Enviar técnicos: revisión")}</b><small>${L("Tradies replace zinc anodes, bearings & wiring!", "¡Cambian ánodos de zinc, cojinetes y cableado!")}</small><span class="gn">${usd(over)}</span></button></div>
      <button type="button" class="oc-decom" data-d>🗑 ${L("Decommission Asset (Recover", "Desmantelar activo (recuperas")} ${usd(Math.round(t.capex * 0.4))})</button></div>`;
  const q = k => dlg.body.querySelector(`[data-k=${k}]`);
  dlg.body.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { if (ctx.dispatch(instanceId, b.dataset.s)) dlg.close(); }));
  dlg.body.querySelector("[data-d]").addEventListener("click", () => { if (window.confirm(L("Decommission and salvage this ocean generator for 40% scrap value?", "¿Desmantelar y recuperar este generador oceánico por el 40% de su valor de chatarra?"))) { ctx.decommission(instanceId); soundManager.playClick(); dlg.close(); } });
  const tick = () => {
    const d = ctx.device(instanceId); if (!d) return; const eff = Math.round((d.integrity / 100) * (1 - (d.biofouling / 100) * 0.30) * 100);
    q("out").innerHTML = `${(d.currentOutputKW / 1000).toFixed(2)} <small>MW</small>`; q("rated").textContent = `${L("Rated Peak", "Potencia nominal")}: ${(t.ratedPowerKW / 1000).toFixed(1)} MW`;
    q("kwh").innerHTML = `${fmt(d.totalKWhGenerated)} <small>kWh</small>`; q("rev").textContent = `${L("Est. Revenue at current price", "Ingreso est. al precio actual")}: ${usd(Math.round(d.totalKWhGenerated * ctx.tariff()))}`;
    const ic = d.integrity > 60 ? "gn" : d.integrity > 25 ? "am" : "rs"; q("intv").className = ic; q("intv").textContent = d.integrity.toFixed(0) + "%"; q("intb").className = ic; q("intb").style.width = d.integrity + "%";
    q("foulv").textContent = `${d.biofouling.toFixed(0)}% (${Math.round(d.biofouling * 0.30)}% ${L("Drag Loss", "pérdida por arrastre")})`; q("foulb").style.width = d.biofouling + "%"; q("eff").textContent = eff + "%";
    q("obs").textContent = d.biofouling > 30 ? L("Extensive colonisation by blue mussels and laminaria kelp. A school of young cod is utilizing the submerged foundation as a predator-free refuge.", "Extensa colonización de mejillones azules y algas laminarias. Un banco de bacalaos jóvenes usa la cimentación sumergida como refugio sin depredadores.") : L("Scour protection rocks on the seabed have created crevice habitats for crabs and benthic invertebrates, enhancing local species richness.", "Las rocas de protección contra la socavación han creado grietas-hábitat para cangrejos e invertebrados bentónicos, aumentando la riqueza de especies local.");
    dlg.body.querySelectorAll("[data-s]").forEach(b => b.setAttribute("aria-disabled", String(ctx.funds() < (b.dataset.s === "scrub" ? scrub : over))));
  };
  tick(); return { tick, close: dlg.close };
}

/* ---------- Field Guide (lessons + quiz) ---------- */
export function openCodex(root, ctx) {
  const topics = codexTopics(), qs = quizQuestions(); let tab = "codex", sel = topics[0].id, answers = {}, submitted = false;
  const dlg = openDialog(root, { title: L("Marine Science Field Guide", "Guía de campo de ciencias marinas"), sub: L("Simple, fun takeaways: water density, weather matching, kWh bills & technician boats", "Ideas sencillas: densidad del agua, qué funciona con cada clima, facturas en kWh y barcos técnicos"), wide: true });
  const paint = () => {
    const b = dlg.body;
    const tabs = `<div class="oc-tabs"><button type="button" class="${tab === "codex" ? "is-on" : ""}" data-t="codex">${L("Quick Lessons", "Lecciones rápidas")}</button><button type="button" class="${tab === "quiz" ? "is-on" : ""}" data-t="quiz">❓ ${L("Mini Quiz", "Mini cuestionario")}</button></div>`;
    if (tab === "codex") {
      const tp = topics.find(x => x.id === sel);
      b.innerHTML = `${tabs}<div class="oc-codex"><nav class="oc-codex__nav">${topics.map(x => `<button type="button" data-id="${x.id}" class="${x.id === sel ? "is-on" : ""}"><span>${x.emoji}</span><small>${L("Unit", "Unidad")} ${x.unitNumber}</small><b>${x.title}</b></button>`).join("")}</nav>
        <div class="oc-codex__main"><h4>${tp.emoji} ${tp.title}</h4><p class="oc-muted">${tp.tagline}</p><p class="oc-box oc-box--info"><b>${L("Big idea", "Idea clave")}:</b> ${tp.bigIdea}</p>
        <ul class="oc-list">${tp.quickTakeaways.map(x => `<li>${x}</li>`).join("")}</ul>
        <div class="oc-grid3"><div class="oc-tile"><span class="oc-k">☁️ ${L("Cloudy day", "Día nublado")}</span><small>${tp.weatherCheck.cloudyDay}</small></div><div class="oc-tile"><span class="oc-k">🌊 ${L("Big wave day", "Día de olas grandes")}</span><small>${tp.weatherCheck.bigWaveDay}</small></div><div class="oc-tile"><span class="oc-k">⚓ ${L("24/7 constant?", "¿Constante 24/7?")}</span><small>${tp.weatherCheck.constant24_7}</small></div></div>
        <p class="oc-box"><b>💡 ${L("Think of it like this", "Piénsalo así")}:</b> ${tp.highSchoolAnalogy}</p></div></div>`;
      b.querySelectorAll("[data-id]").forEach(x => x.addEventListener("click", () => { sel = x.dataset.id; soundManager.playClick(); paint(); }));
    } else {
      const score = qs.filter(q => answers[q.id] === q.correctIndex).length;
      b.innerHTML = `${tabs}<div class="oc-quiz">${qs.map((q, i) => `<fieldset class="oc-q"><legend><small>${q.unit} · ${q.standard}</small> ${i + 1}. ${q.question}</legend>${q.options.map((o, j) => { const st = submitted ? (j === q.correctIndex ? "is-right" : answers[q.id] === j ? "is-wrong" : "") : (answers[q.id] === j ? "is-pick" : ""); return `<button type="button" class="oc-opt ${st}" data-q="${q.id}" data-j="${j}" aria-pressed="${answers[q.id] === j}">${o}</button>`; }).join("")}${submitted ? `<p class="oc-box ${answers[q.id] === q.correctIndex ? "oc-box--good" : "oc-box--bad"}">${answers[q.id] === q.correctIndex ? "✔" : "✖"} ${q.explanation}</p>` : ""}</fieldset>`).join("")}
        <div class="oc-quizfoot">${submitted ? `<b class="oc-big cy">${score}/${qs.length}</b> <button type="button" class="oc-btn" data-r>${L("Try again", "Intentar de nuevo")}</button>` : `<button type="button" class="oc-btn oc-btn--go" data-sub ${Object.keys(answers).length === qs.length ? "" : "aria-disabled='true'"}>${L("Submit answers", "Enviar respuestas")}</button>`}<small class="oc-muted">${L("Practice only — this quiz is not part of your mark.", "Solo práctica — este cuestionario no cuenta para tu nota.")}</small></div></div>`;
      b.querySelectorAll("[data-q]").forEach(x => x.addEventListener("click", () => { if (submitted) return; answers[x.dataset.q] = +x.dataset.j; soundManager.playClick(); paint(); }));
      const s = b.querySelector("[data-sub]"); if (s) s.addEventListener("click", () => { if (Object.keys(answers).length < qs.length) { ctx.toast(L("Answer every question first.", "Responde primero todas las preguntas."), "info"); return; } submitted = true; const sc = qs.filter(q => answers[q.id] === q.correctIndex).length; if (sc >= 3) { soundManager.playVictoryFanfare(); ctx.confetti(); ctx.award("guide", L("Field Guide graduate", "Graduado de la Guía de campo")); } else soundManager.playRepairSound(); paint(); });
      const r = b.querySelector("[data-r]"); if (r) r.addEventListener("click", () => { answers = {}; submitted = false; soundManager.playClick(); paint(); });
    }
    b.querySelectorAll("[data-t]").forEach(x => x.addEventListener("click", () => { tab = x.dataset.t; soundManager.playClick(); paint(); }));
  };
  paint();
}

/* ---------- Missions ---------- */
export function openMissions(root, ctx) {
  const dlg = openDialog(root, { title: L("Marine Science Engineering Challenges", "Retos de ingeniería de ciencias marinas"), sub: L("Realistic coastal grid crisis scenarios and diploma field missions", "Escenarios realistas de crisis en redes costeras y misiones de campo"), wide: true });
  const st = ctx.status();
  dlg.body.innerHTML = scenarios().map(s => { const active = s.id === st.scenarioId; return `<article class="oc-mission${active ? " is-active" : ""}"><div class="oc-row"><div><span class="oc-badge">${s.badge}</span> <b>${s.title}</b><p>${s.description}</p></div>${active ? "" : `<button type="button" class="oc-btn oc-btn--go" data-s="${s.id}">▶ ${L("Start Mission", "Iniciar misión")}</button>`}</div>
    ${s.specialEventDescription ? `<p class="oc-box oc-box--bad">⚠ ${s.specialEventDescription}</p>` : ""}
    <div class="oc-box"><span class="oc-k">${L("Mission Directives", "Directrices de la misión")} · ${s.targetDurationDays} ${L("days", "días")} · ${L("start funds", "fondos iniciales")} ${usd(s.startingFunds)}</span>${s.objectives.map(o => { const done = active && o.completed(st.grid, st.devices, st.day); return `<div class="oc-obj${done ? " is-done" : ""}">${done ? "✅" : "⭕"} <span>${o.text}</span></div>`; }).join("")}</div>
    <p class="oc-box oc-box--info"><b>${L("Marine Science Focus", "Enfoque de ciencias marinas")}:</b> ${s.learningPrompt}</p></article>`; }).join("");
  dlg.body.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { ctx.startScenario(b.dataset.s); soundManager.playVictoryFanfare(); dlg.close(); }));
}

/* ---------- Land vs Ocean lab ---------- */
export function openComparison(root, ctx) {
  let pop = 50000;
  const dlg = openDialog(root, { title: L("Terrestrial vs Ocean Renewable Energy Comparison Lab", "Laboratorio: energía renovable terrestre vs oceánica"), sub: L("Explore why ocean energy preserves terrestrial biomes while evaluating marine engineering trade-offs", "Explora por qué la energía oceánica preserva los biomas terrestres y evalúa los compromisos de la ingeniería marina"), wide: true });
  dlg.body.innerHTML = `<div class="oc-box"><div class="oc-row"><b>${L("Target Coastal City Population", "Población de la ciudad costera objetivo")}</b><b class="oc-big cy" data-k="pop"></b></div><input type="range" min="10000" max="250000" step="5000" value="${pop}" class="oc-range" aria-label="${L("Population", "Población")}"><div class="oc-row oc-muted"><span data-k="annual"></span><span data-k="daily"></span></div></div>
    <div class="oc-grid3" data-k="cards"></div>
    <div class="oc-box oc-box--info"><b>🛡 ${L("Marine Science Diploma Critical Reflection", "Reflexión crítica del diploma de ciencias marinas")}</b><p>${L("Why move energy harvesting into the ocean? Over 71% of Earth's surface is ocean water, absorbing 93% of excess solar energy. By deploying offshore wind in deep water, wave and tidal devices, and OTEC, coastal cities can draw on a vast, steady resource without clearing forests or farmland — but they must manage biofouling, corrosion, storms and the effects of construction on marine life.", "¿Por qué llevar la captación de energía al océano? Más del 71% de la superficie terrestre es agua oceánica, que absorbe el 93% del exceso de energía solar. Con eólica marina en aguas profundas, dispositivos de olas y mareas y OTEC, las ciudades costeras aprovechan un recurso enorme y estable sin talar bosques ni tierras de cultivo — pero deben gestionar la bioincrustación, la corrosión, las tormentas y los efectos de la construcción sobre la vida marina.")}</p></div>`;
  const q = k => dlg.body.querySelector(`[data-k=${k}]`);
  const paint = () => {
    const c = compareLandOcean(pop); q("pop").textContent = fmt(pop) + " " + L("residents", "habitantes"); q("annual").innerHTML = `${L("Annual Clean Power Needed", "Energía limpia anual necesaria")}: <b>${fmt(c.annualMWh)} MWh</b> (${c.annualGWh} GWh/${L("year", "año")})`; q("daily").innerHTML = `${L("Average Daily Consumption", "Consumo diario medio")}: <b>${fmt(c.perDayMWh)} MWh/${L("day", "día")}</b>`;
    q("cards").innerHTML = `<div class="oc-tile oc-tile--r"><b>🔥 ${L("Terrestrial Fossil Fuels", "Combustibles fósiles terrestres")}</b><small>${L("Coal, Oil & Fracked Gas", "Carbón, petróleo y gas de fracking")}</small><span class="oc-k">CO₂</span><b class="rs">${fmt(c.fossilCO2)} ${L("tons/yr", "t/año")}</b><span class="oc-k">${L("Land Strip-Mined", "Tierra minada a cielo abierto")}</span><b>${fmt(c.coalLand)} ${L("acres", "acres")}</b><span class="oc-k">${L("Scarce Freshwater Consumed", "Agua dulce escasa consumida")}</span><b>${(c.fossilWater / 1e6).toFixed(1)} ${L("Million Gal", "millones de gal")}</b><small>${L("Causes habitat fragmentation, acid rain, groundwater contamination, and climate disruption.", "Causa fragmentación del hábitat, lluvia ácida, contaminación de aguas subterráneas y alteración del clima.")}</small></div>
      <div class="oc-tile oc-tile--a"><b>☀️ ${L("Terrestrial Solar & Wind", "Solar y eólica terrestres")}</b><small>${L("Onshore Farms & Clearings", "Parques y claros en tierra")}</small><span class="oc-k">${L("Land Footprint Required", "Superficie de terreno necesaria")}</span><b class="am">${fmt(c.solarLand)} ${L("acres", "acres")}</b><span class="oc-k">${L("Forest / Desert Cleared", "Bosque / desierto despejado")}</span><b>~${fmt(c.forest)} ${L("acres", "acres")}</b><span class="oc-k">${L("Zoning & Land Use Conflict", "Conflicto de uso del suelo")}</span><b>${L("High (Farms vs Power)", "Alto (granjas vs energía)")}</b><small>${L("Zero emissions, but extensive clearing displaces wildlife and competes with food agriculture.", "Cero emisiones, pero el despeje extenso desplaza fauna y compite con la agricultura.")}</small></div>
      <div class="oc-tile oc-tile--c"><b>🌊 ${L("Ocean Renewable Array", "Parque renovable oceánico")}</b><small>${L("Wind, Waves, Tides & OTEC", "Viento, olas, mareas y OTEC")}</small><span class="oc-k">${L("Terrestrial Land Cleared", "Tierra despejada")}</span><b class="gn">0.0 ${L("ACRES", "ACRES")}</b><span class="oc-k">${L("Artificial Reef Biomass", "Biomasa de arrecife artificial")}</span><b class="cy">+${fmt(c.reefKg)} kg</b><span class="oc-k">${L("Kinetic Energy Density", "Densidad de energía cinética")}</span><b>832× ${L("denser than air", "más densa que el aire")}</b><small>${L("Saves forests and farmland. Subsea structures create protected nurseries where trawling is prohibited.", "Salva bosques y tierras de cultivo. Las estructuras submarinas crean guarderías protegidas donde se prohíbe el arrastre.")}</small></div>`;
  };
  dlg.body.querySelector("input").addEventListener("input", e => { pop = +e.target.value; paint(); soundManager.playClick(); ctx.noteCompare(); }); paint();
}
