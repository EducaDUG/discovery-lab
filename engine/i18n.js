/* ==========================================================================
   DISCOVERY LAB — LANGUAGE SWITCHER  (engine/i18n.js)

   English/Spanish only for now (see CLAUDE.md — more languages can follow the
   same pattern later). Two things live here:

     1. UI-chrome strings shared by nav.js and engine.js — t(key, vars).
     2. Per-node/per-activity content translation:
          - nav tree nodes carry an optional "<field>_es" sibling key
            (e.g. "blurb_es") — pl(node, "blurb") returns it when Spanish is
            selected, else the English field.
          - an activity's config.json carries an optional top-level "es" block
            shaped like the rest of the config — localizeConfig(config, lang)
            deep-overlays it onto the English config, matching array items by
            "id" where present, by index otherwise. Fields with no Spanish
            translation quietly fall back to English.

   Choosing a language reloads the page (simplest way to guarantee every
   already-rendered string — including ones built before this module ran —
   updates together). The choice is saved per device in localStorage, not
   sent anywhere.

   Importing this module also wires itself up: it drops a flag switcher into
   `.site-head__inner` if one is on the page, and shows/hides any element
   carrying `data-lang="en"` / `data-lang="es"` to match the current choice.
   That covers hand-written bilingual markup (the home hero, the About page)
   with no extra script tag beyond the one import.
   ========================================================================== */

const KEY = "dl-lang";
const SUPPORTED = ["en", "es"];

export function getLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {}
  return "en";
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  try { localStorage.setItem(KEY, lang); } catch {}
  location.reload();
}

/* --- UI chrome dictionary ------------------------------------------------ */
const STRINGS = {
  en: {
    "skip": "Skip to content",
    "breadcrumb": "Breadcrumb",
    "home": "Discovery Lab",
    "badge.live": "Live",
    "badge.soon": "Coming soon",
    "count.activity": "{n} activity",
    "count.activities": "{n} activities",
    "count.coming": "{n} coming",
    "count.question": "{n} question",
    "count.questions": "{n} questions",
    "count.min": "~{n} min",
    "count.prep": "{n} activities in preparation",
    "count.prep1": "1 activity in preparation",
    "coming": "coming",
    "learning-game": "learning game",
    "learning-video-game": "Learning video game",
    "recommended-practice": "Recommended practice",
    "in-preparation": "In preparation",
    "activities-being-built": "Activities for this course are still being built.",
    "site-index-error": "Could not load the site index (data/subjects.json).",
    "page-not-found": "That page is not in subjects.json.",
    "opens-new-tab": "(opens in a new tab on an external website)",
    "game-note": "Opens in a new tab · your progress stays in your browser · not marked work.",
    "game.badge": "Game",
    "game.cta": "Play the game",
    "also-recommended": "Also recommended",
    "more-practice": "More practice, elsewhere",
    "external-note": "Simulations by other people that Mr Guevara rates. They open in a new tab, and they do not produce learning evidence — they are for practice and curiosity.",
    "you-do": "You do",
    "you-learn": "You learn",
    "external": "External",

    "stage.orient": "Orient", "stage.predict": "Predict", "stage.investigate": "Investigate",
    "stage.record": "Record", "stage.explain": "Explain", "stage.apply": "Apply",
    "stage.check": "Check", "stage.evidence": "Evidence",
    "activity-progress": "Activity progress",
    "go-to-stage": "Go to {label} (step {i} of {n})",
    "activity-load-error": "Could not load this activity (config.json).",
    "sim-not-wired": "This activity has no simulation wired up yet.",
    "mark": "1 mark", "marks": "{n} marks",

    "mission": "Mission",
    "what-learning": "What you are learning",
    "course-link": "Course link",
    "by-the-end": "By the end you will be able to",
    "how-this-works": "How this works",
    "real-life": "Where you meet this in real life",

    "predict": "Predict",
    "before-touch": "Before you touch anything",
    "predict.lede": "Science starts with a good guess. Record what you think now — you will be able to change it after you have run some trials.",
    "predict.note": "A prediction is never marked right or wrong — good scientists change their minds when the evidence tells them to.",

    "investigate": "Investigate",
    "laboratory": "The Laboratory",

    "record": "Record",
    "investigation-record": "Investigation Record",
    "record.intro": "Every trial you run in the chamber is logged here automatically — no copying by hand.",
    "record.empty": "No trials yet. Go back to the chamber and run one.",

    "explain": "Explain", "explain.title": "Explain what you found",
    "apply": "Apply", "apply.title": "Use it somewhere new",
    "answer-placeholder": "Write your answer in full sentences…",
    "chars": "{n} characters", "chars.aim": "{n} characters (aim for {min}+)",

    "knowledge-check": "Knowledge Check",
    "show-what-know": "Show what you know",
    "check.lede": "A few quick questions. These are marked automatically.",
    "check-answers": "Check my answers",
    "answers-checked": "Answers checked ✓",
    "choose": "Choose…",
    "match-of": "{right} of {total} matched correctly. ",
    "kc.excellent": "  Excellent — strong understanding.",
    "kc.good": "  Good — read the notes on any you missed.",
    "kc.review": "  Review the diagram and try the trials again.",
    "correct": "Correct. ",
    "answer-was": "Answer: {answer}{unit}. ",

    "generate-evidence": "Generate Learning Evidence",
    "finish-hand-in": "Finish and hand it in",
    "evidence.lede": "Type your name, then download your evidence. Two files are made — a PDF to upload, and a data file that helps your teacher mark it quickly.",
    "how-marked": "How this is marked",
    "criterion": "Criterion", "what-good-shows": "What good work shows", "marks-col": "Marks",
    "total": "Total", "auto": "  (auto)",
    "grade-note": "Your grade is the marks you earn out of {total}, shown as a percentage. The auto-marked part is filled in for you; your teacher marks the written answers.",
    "your-name": "Your full name",
    "name-placeholder": "e.g. Alex Rivera",
    "upload-important": "Important: ",
    "upload-note": "upload the PDF to Learning Lab as evidence of your work. The data file goes to your teacher for fast marking.",
    "building-files": "Building your files…",
    "generate-again": "Generate again",
    "type-name-first": "Type your name first so your teacher knows whose work this is.",
    "check-first": "Go to the Check step and press “Check my answers” first.",
    "pdf-error": "Something went wrong building the PDF. Your work is safe — try again.",
    "clear-work": "Clear saved work on this device",
    "clear-confirm": "This erases your answers and trials saved in this browser. Do this only after you have downloaded and uploaded your evidence. Continue?",
    "done": "Done. ",
    "files-downloaded": "Two files downloaded: {base}.pdf and {base}.json. Upload the PDF to Learning Lab. Checksum {checksum}.",
    "discoveries": "Discoveries",
    "badge-unlocked": "Badge unlocked: {label}",

    "back": "← Back", "next": "Next →",
    "gate.predict": "Make a prediction first — you can always change it once you have run some trials.",
    "gate.investigate": "Run at least one trial in the chamber before moving on — the Investigation Record needs your data.",
    "match-aria": "Match: {left}",

    /* PDF */
    "pdf.masthead": "DISCOVERY LAB - LEARNING EVIDENCE",
    "pdf.student": "Student", "pdf.course": "Course", "pdf.completed": "Completed", "pdf.activityId": "Activity ID",
    "pdf.upload-banner": "Upload this PDF to Learning Lab as evidence of your work.",
    "pdf.open-live-yourself": "Open the live activity yourself:",
    "pdf.open-live": "Open the live activity ->",
    "pdf.about-activity": "About this activity",
    "pdf.skills-practised": "Skills practised",
    "pdf.result": "Result",
    "pdf.auto-summary": "Auto-marked Knowledge Check: {score}  ({pct}%).  Written answers below are marked by your teacher against the rubric.",
    "pdf.prediction": "Prediction",
    "pdf.your-prediction": "Your prediction: ",
    "pdf.recorded-before": "Recorded before testing: {a}      Revised after evidence: {b}",
    "pdf.yes": "yes", "pdf.no": "no",
    "pdf.scientific-method": "Scientific Method",
    "pdf.observation": "Observation", "pdf.question": "Scientific question", "pdf.hypothesis": "Hypothesis",
    "pdf.variables": "Variables", "pdf.results": "Results", "pdf.analysis": "Analysis",
    "pdf.conclusion": "Conclusion", "pdf.reflection": "Evaluation & reflection",
    "pdf.investigation-record": "Investigation Record",
    "pdf.no-trials": "No trials recorded.",
    "pdf.kc-auto": "Knowledge Check (auto-marked)",
    "pdf.your-answer": "Your answer: ",
    "pdf.correct-tag": "[correct]", "pdf.review-tag": "[review]",
    "pdf.written-answers": "Written Answers (teacher-marked)",
    "pdf.blank": "(left blank)",
    "pdf.teacher-marks": "Teacher: ____ / {max} marks",
    "pdf.rubric-title": "Marking Rubric (grade as a percentage)",
    "pdf.rubric-criterion": "Criterion", "pdf.rubric-marks": "Marks", "pdf.rubric-awarded": "Awarded",
    "pdf.rubric-total": "Total", "pdf.rubric-pct": "Percentage = total marks earned / {total} x 100.",
    "pdf.sim-link": "Simulation link:",
    "pdf.checksum": "Integrity checksum: {checksum}. {note}",
    "pdf.knowledge-accuracy": "Knowledge & understanding", "pdf.use-of-evidence": "Use of evidence",
    "pdf.reasoning": "Scientific reasoning", "pdf.communication": "Communication",
    "pdf.no-answer": "(no answer)",

    "a11y.settings": "Reading and accessibility settings",
    "a11y.close": "Close settings",
    "a11y.title": "Make it comfortable",
    "a11y.lede": "Set these once — this device remembers them for every activity.",
    "a11y.text-size": "Text size",
    "a11y.size.s": "Small", "a11y.size.m": "Medium", "a11y.size.l": "Large", "a11y.size.xl": "Largest",
    "a11y.background": "Background",
    "a11y.tint.paper": "Paper", "a11y.tint.warm": "Warm", "a11y.tint.cool": "Cool", "a11y.tint.dusk": "Dusk", "a11y.tint.dark": "Dark",
    "a11y.motion": "Motion",
    "a11y.motion.auto": "Match my device", "a11y.motion.off": "Full motion", "a11y.motion.on": "Reduce motion",
    "a11y.dyslexia": "Dyslexia-friendly font",
    "a11y.dyslexia-hint": "Switches to Atkinson Hyperlegible with looser spacing.",
    "a11y.read-aloud": "Read aloud",
    "a11y.tts-hint": "Adds a speaker button to instructions and questions.",
    "a11y.tts-unavailable": "Your browser does not offer speech — try Chrome or Edge.",
    "a11y.reset": "Reset to defaults",
    "a11y.speak": "Read aloud",
    "pdf.integrity-note": "Tamper-EVIDENT, not tamper-proof: the PDF and this file share this checksum. If either was edited after download, the two will no longer match. A determined student could still recompute it — treat as a low-stakes formative check.",
  },
  es: {
    "skip": "Ir al contenido",
    "breadcrumb": "Ruta de navegación",
    "home": "Discovery Lab",
    "badge.live": "Disponible",
    "badge.soon": "Próximamente",
    "count.activity": "{n} actividad",
    "count.activities": "{n} actividades",
    "count.coming": "{n} próximamente",
    "count.question": "{n} pregunta",
    "count.questions": "{n} preguntas",
    "count.min": "~{n} min",
    "count.prep": "{n} actividades en preparación",
    "count.prep1": "1 actividad en preparación",
    "coming": "próximamente",
    "learning-game": "juego educativo",
    "learning-video-game": "Videojuego educativo",
    "recommended-practice": "Práctica recomendada",
    "in-preparation": "En preparación",
    "activities-being-built": "Las actividades de este curso todavía se están creando.",
    "site-index-error": "No se pudo cargar el índice del sitio (data/subjects.json).",
    "page-not-found": "Esa página no está en subjects.json.",
    "opens-new-tab": "(se abre en una pestaña nueva en un sitio externo)",
    "game-note": "Se abre en una pestaña nueva · tu progreso se guarda en tu navegador · no es trabajo evaluado.",
    "game.badge": "Juego",
    "game.cta": "Jugar",
    "also-recommended": "También recomendado",
    "more-practice": "Más práctica, en otro lugar",
    "external-note": "Simulaciones de otras personas que el Sr. Guevara recomienda. Se abren en una pestaña nueva y no generan evidencia de aprendizaje — son para practicar y explorar.",
    "you-do": "Tú haces",
    "you-learn": "Tú aprendes",
    "external": "Externo",

    "stage.orient": "Orientación", "stage.predict": "Predicción", "stage.investigate": "Investigación",
    "stage.record": "Registro", "stage.explain": "Explicación", "stage.apply": "Aplicación",
    "stage.check": "Comprobación", "stage.evidence": "Evidencia",
    "activity-progress": "Progreso de la actividad",
    "go-to-stage": "Ir a {label} (paso {i} de {n})",
    "activity-load-error": "No se pudo cargar esta actividad (config.json).",
    "sim-not-wired": "Esta actividad todavía no tiene una simulación configurada.",
    "mark": "1 punto", "marks": "{n} puntos",

    "mission": "Misión",
    "what-learning": "Qué vas a aprender",
    "course-link": "Relación con el curso",
    "by-the-end": "Al final serás capaz de",
    "how-this-works": "Cómo funciona",
    "real-life": "Dónde encuentras esto en la vida real",

    "predict": "Predicción",
    "before-touch": "Antes de tocar nada",
    "predict.lede": "La ciencia empieza con una buena hipótesis. Anota ahora lo que piensas — podrás cambiarlo después de hacer algunas pruebas.",
    "predict.note": "Una predicción nunca se califica como correcta o incorrecta — los buenos científicos cambian de opinión cuando la evidencia lo indica.",

    "investigate": "Investigación",
    "laboratory": "El laboratorio",

    "record": "Registro",
    "investigation-record": "Registro de la investigación",
    "record.intro": "Cada prueba que haces en la cámara se registra aquí automáticamente — no necesitas copiarla a mano.",
    "record.empty": "Todavía no hay pruebas. Vuelve a la cámara y realiza una.",

    "explain": "Explicación", "explain.title": "Explica lo que descubriste",
    "apply": "Aplicación", "apply.title": "Aplícalo en un caso nuevo",
    "answer-placeholder": "Escribe tu respuesta con frases completas…",
    "chars": "{n} caracteres", "chars.aim": "{n} caracteres (objetivo: {min}+)",

    "knowledge-check": "Comprobación de conocimientos",
    "show-what-know": "Demuestra lo que sabes",
    "check.lede": "Unas preguntas rápidas. Se corrigen automáticamente.",
    "check-answers": "Comprobar mis respuestas",
    "answers-checked": "Respuestas comprobadas ✓",
    "choose": "Elige…",
    "match-of": "{right} de {total} emparejadas correctamente. ",
    "kc.excellent": "  Excelente — muy buena comprensión.",
    "kc.good": "  Bien — repasa las notas de las que fallaste.",
    "kc.review": "  Repasa el diagrama e inténtalo de nuevo.",
    "correct": "Correcto. ",
    "answer-was": "Respuesta: {answer}{unit}. ",

    "generate-evidence": "Generar evidencia de aprendizaje",
    "finish-hand-in": "Termina y entrégalo",
    "evidence.lede": "Escribe tu nombre y descarga tu evidencia. Se generan dos archivos: un PDF para subir, y un archivo de datos para que tu profesor lo corrija rápidamente.",
    "how-marked": "Cómo se califica",
    "criterion": "Criterio", "what-good-shows": "Qué muestra un buen trabajo", "marks-col": "Puntos",
    "total": "Total", "auto": "  (automático)",
    "grade-note": "Tu nota son los puntos obtenidos de {total}, como porcentaje. La parte automática ya está rellenada; tu profesor corrige las respuestas escritas.",
    "your-name": "Tu nombre completo",
    "name-placeholder": "p. ej. Alex Rivera",
    "upload-important": "Importante: ",
    "upload-note": "sube el PDF a Learning Lab como evidencia de tu trabajo. El archivo de datos va a tu profesor para una corrección rápida.",
    "building-files": "Preparando tus archivos…",
    "generate-again": "Generar de nuevo",
    "type-name-first": "Escribe tu nombre primero para que tu profesor sepa de quién es este trabajo.",
    "check-first": "Ve al paso de Comprobación y pulsa «Comprobar mis respuestas» primero.",
    "pdf-error": "Algo salió mal al generar el PDF. Tu trabajo está a salvo — inténtalo de nuevo.",
    "clear-work": "Borrar el trabajo guardado en este dispositivo",
    "clear-confirm": "Esto borra las respuestas y pruebas guardadas en este navegador. Hazlo solo después de haber descargado y subido tu evidencia. ¿Continuar?",
    "done": "Listo. ",
    "files-downloaded": "Se descargaron dos archivos: {base}.pdf y {base}.json. Sube el PDF a Learning Lab. Código de verificación {checksum}.",
    "discoveries": "Descubrimientos",
    "badge-unlocked": "Insignia desbloqueada: {label}",

    "back": "← Atrás", "next": "Siguiente →",
    "gate.predict": "Haz primero una predicción — siempre podrás cambiarla después de hacer algunas pruebas.",
    "gate.investigate": "Realiza al menos una prueba en la cámara antes de continuar — el Registro de la investigación necesita tus datos.",
    "match-aria": "Emparejar: {left}",

    /* PDF */
    "pdf.masthead": "DISCOVERY LAB - EVIDENCIA DE APRENDIZAJE",
    "pdf.student": "Estudiante", "pdf.course": "Curso", "pdf.completed": "Completado", "pdf.activityId": "ID de actividad",
    "pdf.upload-banner": "Sube este PDF a Learning Lab como evidencia de tu trabajo.",
    "pdf.open-live-yourself": "Abre tú mismo la actividad en línea:",
    "pdf.open-live": "Abrir la actividad en línea ->",
    "pdf.about-activity": "Sobre esta actividad",
    "pdf.skills-practised": "Destrezas practicadas",
    "pdf.result": "Resultado",
    "pdf.auto-summary": "Comprobación de conocimientos (automática): {score}  ({pct}%). Las respuestas escritas se corrigen a continuación según la rúbrica.",
    "pdf.prediction": "Predicción",
    "pdf.your-prediction": "Tu predicción: ",
    "pdf.recorded-before": "Registrada antes de la prueba: {a}      Revisada tras la evidencia: {b}",
    "pdf.yes": "sí", "pdf.no": "no",
    "pdf.scientific-method": "Método científico",
    "pdf.observation": "Observación", "pdf.question": "Pregunta científica", "pdf.hypothesis": "Hipótesis",
    "pdf.variables": "Variables", "pdf.results": "Resultados", "pdf.analysis": "Análisis",
    "pdf.conclusion": "Conclusión", "pdf.reflection": "Evaluación y reflexión",
    "pdf.investigation-record": "Registro de la investigación",
    "pdf.no-trials": "No se registraron pruebas.",
    "pdf.kc-auto": "Comprobación de conocimientos (automática)",
    "pdf.your-answer": "Tu respuesta: ",
    "pdf.correct-tag": "[correcto]", "pdf.review-tag": "[revisar]",
    "pdf.written-answers": "Respuestas escritas (corrección del profesor)",
    "pdf.blank": "(en blanco)",
    "pdf.teacher-marks": "Profesor: ____ / {max} puntos",
    "pdf.rubric-title": "Rúbrica de evaluación (nota en porcentaje)",
    "pdf.rubric-criterion": "Criterio", "pdf.rubric-marks": "Puntos", "pdf.rubric-awarded": "Obtenidos",
    "pdf.rubric-total": "Total", "pdf.rubric-pct": "Porcentaje = puntos obtenidos / {total} x 100.",
    "pdf.sim-link": "Enlace a la simulación:",
    "pdf.checksum": "Código de verificación: {checksum}. {note}",
    "pdf.knowledge-accuracy": "Conocimiento y comprensión", "pdf.use-of-evidence": "Uso de la evidencia",
    "pdf.reasoning": "Razonamiento científico", "pdf.communication": "Comunicación",
    "pdf.no-answer": "(sin respuesta)",
    "pdf.integrity-note": "Evidencia de manipulación, no a prueba de ella: el PDF y este archivo comparten este código. Si alguno se editó tras la descarga, dejarán de coincidir. Un estudiante decidido aún podría recalcularlo — trátalo como una comprobación formativa de bajo riesgo.",

    "a11y.settings": "Ajustes de lectura y accesibilidad",
    "a11y.close": "Cerrar ajustes",
    "a11y.title": "Ponlo cómodo para ti",
    "a11y.lede": "Configura esto una vez — este dispositivo lo recordará en cada actividad.",
    "a11y.text-size": "Tamaño del texto",
    "a11y.size.s": "Pequeño", "a11y.size.m": "Mediano", "a11y.size.l": "Grande", "a11y.size.xl": "Muy grande",
    "a11y.background": "Fondo",
    "a11y.tint.paper": "Papel", "a11y.tint.warm": "Cálido", "a11y.tint.cool": "Frío", "a11y.tint.dusk": "Atardecer", "a11y.tint.dark": "Oscuro",
    "a11y.motion": "Movimiento",
    "a11y.motion.auto": "Igual que mi dispositivo", "a11y.motion.off": "Movimiento completo", "a11y.motion.on": "Reducir movimiento",
    "a11y.dyslexia": "Fuente para dislexia",
    "a11y.dyslexia-hint": "Cambia a Atkinson Hyperlegible con más espaciado.",
    "a11y.read-aloud": "Leer en voz alta",
    "a11y.tts-hint": "Añade un botón de altavoz a las instrucciones y preguntas.",
    "a11y.tts-unavailable": "Tu navegador no ofrece voz — prueba con Chrome o Edge.",
    "a11y.reset": "Restablecer valores predeterminados",
    "a11y.speak": "Leer en voz alta",
  },
};

export function t(key, vars) {
  const lang = getLang();
  let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
}

/* Pick a translated field off a tree node / config object: es sibling field
   "<field>_es" when Spanish is selected and present, else the English field. */
export function pl(obj, field) {
  if (!obj) return undefined;
  const lang = getLang();
  if (lang !== "en") {
    const v = obj[`${field}_es`];
    if (v != null) return v;
  }
  return obj[field];
}

/* Deep-overlay an activity's config.es block onto its English config.
   Arrays of objects with "id" merge by id; other arrays merge by index. */
function deepLocalize(base, patch) {
  if (Array.isArray(base)) {
    if (!Array.isArray(patch)) return base;
    if (base.length && base.every(x => x && typeof x === "object" && "id" in x)) {
      return base.map(item => {
        const p = patch.find(x => x && x.id === item.id);
        return p ? deepLocalize(item, p) : item;
      });
    }
    return base.map((item, i) => (patch[i] !== undefined ? deepLocalize(item, patch[i]) : item));
  }
  if (base && typeof base === "object" && patch && typeof patch === "object") {
    const out = { ...base };
    for (const k in patch) out[k] = deepLocalize(base[k], patch[k]);
    return out;
  }
  return patch !== undefined ? patch : base;
}

export function localizeConfig(config, lang) {
  if (lang === "en" || !config || !config.es) return config;
  return deepLocalize(config, config.es);
}

/* --- flag switcher + auto-wiring ----------------------------------------- */
/* Windows renders the flag emoji (🇬🇧/🇪🇸) as bare "GB"/"ES" letters on most
   browsers, since Segoe UI Emoji ships without the regional-indicator flag
   glyphs — so draw real flags as inline SVG instead, which renders
   identically everywhere. */
const FLAG_SVG = {
  en: `<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="dl-flag-en-clip"><rect width="60" height="30" rx="3"/></clipPath><g clip-path="url(#dl-flag-en-clip)"><rect width="60" height="30" fill="#00247d"/><path d="M0 0 60 30M60 0 0 30" stroke="#fff" stroke-width="6"/><path d="M0 0 60 30M60 0 0 30" stroke="#cf142b" stroke-width="2"/><path d="M30 0V30M0 15H60" stroke="#fff" stroke-width="10"/><path d="M30 0V30M0 15H60" stroke="#cf142b" stroke-width="6"/></g></svg>`,
  es: `<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="dl-flag-es-clip"><rect width="60" height="30" rx="3"/></clipPath><g clip-path="url(#dl-flag-es-clip)"><rect width="60" height="30" fill="#aa151b"/><rect y="7.5" width="60" height="15" fill="#f1bf00"/></g></svg>`,
};

export function flagSwitcher() {
  const wrap = document.createElement("div");
  wrap.className = "lang-switch";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Language / Idioma");
  const lang = getLang();
  [["en", "English"], ["es", "Español"]].forEach(([code, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lang-switch__btn";
    b.innerHTML = FLAG_SVG[code];
    b.title = label;
    b.setAttribute("aria-label", label);
    b.setAttribute("aria-pressed", String(code === lang));
    if (code === lang) b.classList.add("is-active");
    b.addEventListener("click", () => setLang(code));
    wrap.append(b);
  });
  return wrap;
}

function initHeader() {
  const inner = document.querySelector(".site-head__inner");
  if (inner && !inner.querySelector(".lang-switch")) inner.append(flagSwitcher());
}

function applyStaticLang() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-lang]").forEach(node => {
    node.hidden = node.getAttribute("data-lang") !== lang;
  });
}

function boot() { initHeader(); applyStaticLang(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
