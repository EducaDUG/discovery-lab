/* ==========================================================================
   COURSE REVISION GUIDE — practice questions and interactive concept models.

   This is a static reference page, not a graded Discovery Lab simulation, so
   it deliberately does NOT use engine/engine.js's Orient->Apply->Knowledge
   Check pipeline, marking.json split, or evidence PDF (there is nothing here
   to submit or mark against a rubric — it's ungated self-practice a student
   can repeat as often as they like). It borrows only the visual language
   (auto-marked multiple choice with instant feedback) that students already
   know from real simulations, kept local to this guide's own folder per the
   content-vs-engine rule.
   ========================================================================== */

/* ------------------------------------------------------------------------
   Question bank — 3 per chapter, pooled into the Practice Bank below.
   ------------------------------------------------------------------------ */
const BANK = {
  1: [
    { q: "Which of these is the most useful way to describe an environmental impact?",
      opts: ["“Energy”", "Charging a phone overnight", "“Nature”", "“Pollution”"], correct: 1,
      explain: "A strong example names the exact action and impact, not a broad category." },
    { q: "What is the main modern concern about the planet's water supply?",
      opts: ["The total amount of water on Earth is shrinking", "Access to clean, safe water", "The oceans are disappearing", "There is too much water in the atmosphere"], correct: 1,
      explain: "Water stays in the water cycle — the real issue is whether it's clean, safe and available." },
    { q: "Environmental Science studies…",
      opts: ["Only wild ecosystems untouched by people", "Only pollution and disasters", "Air, water, soil, ecosystems, biodiversity, climate and how humans interact with them", "Only climate change"], correct: 2,
      explain: "It's a broad science covering every system and how humans interact with it." },
  ],
  2: [
    { q: "In a food web diagram, an arrow between two organisms points…",
      opts: ["From predator to prey", "From the organism eaten to the organism that eats it", "In whichever direction looks tidiest", "From producer to decomposer only"], correct: 1,
      explain: "The arrow shows the direction energy travels: eaten → eater." },
    { q: "Roughly what percentage of energy transfers from one trophic level to the next?",
      opts: ["90%", "50%", "10%", "1%"], correct: 2,
      explain: "The 10% rule — which is why top predators are always rare." },
    { q: "Which organisms recycle nutrients from dead material back into the soil?",
      opts: ["Producers", "Primary consumers", "Top predators", "Decomposers"], correct: 3,
      explain: "Fungi and bacteria break down dead material and return nutrients to the soil." },
  ],
  3: [
    { q: "Variation in DNA within a single species is called…",
      opts: ["Species diversity", "Genetic diversity", "Ecosystem diversity", "Ecoregion diversity"], correct: 1,
      explain: "Genetic diversity gives a population a better chance of surviving disease or change." },
    { q: "A biome is best described as…",
      opts: ["A single species' genetic makeup", "A specific region within a country", "A broad, major ecological zone such as desert or rainforest", "A single farm's crop rotation"], correct: 2,
      explain: "An ecoregion is the more specific slice within a biome." },
    { q: "Which of these is a cultural ecosystem service?",
      opts: ["Timber for construction", "Pollination of crops", "Recreation and inspiration from a natural landscape", "Nutrient cycling in soil"], correct: 2,
      explain: "Cultural services are non-material benefits — beauty, recreation, inspiration." },
  ],
  4: [
    { q: "What makes a species “invasive” rather than simply non-native?",
      opts: ["It was brought from another country", "It looks different from native species", "It spreads successfully and causes harm to the local ecosystem", "It is larger than native species"], correct: 2,
      explain: "Being non-native alone isn't enough — it must spread and cause damage." },
    { q: "Which IUCN Red List category represents the LOWEST extinction risk of these three?",
      opts: ["Critically Endangered", "Endangered", "Vulnerable", "They are all equal"], correct: 2,
      explain: "Order of increasing risk: Vulnerable → Endangered → Critically Endangered." },
    { q: "An Alliance for Zero Extinction (AZE) site is best described as…",
      opts: ["Any national park", "A site that may be the last refuge for one highly threatened species", "Any area with high rainfall", "A zoo breeding programme"], correct: 1,
      explain: "AZE sites sharpen conservation focus onto the most critical single sites." },
  ],
  5: [
    { q: "A population, in the ecological sense, must always be defined by…",
      opts: ["Just a species name", "A species AND a specific, named area", "A country's borders only", "A single individual"], correct: 1,
      explain: "“Kangaroos” means nothing without naming the area they're counted in." },
    { q: "Which growth pattern levels off as a population nears its environment's carrying capacity?",
      opts: ["Exponential growth", "Logistic growth", "Linear growth", "Negative growth"], correct: 1,
      explain: "Logistic growth forms an S-curve as density-dependent limits kick in." },
    { q: "A wildfire affecting a population regardless of how crowded it is, is an example of a…",
      opts: ["Density-dependent factor", "Density-independent factor", "Carrying capacity", "Genetic factor"], correct: 1,
      explain: "Density-independent factors (fire, flood) act regardless of population size." },
  ],
  6: [
    { q: "Which of these is NOT one of Earth's four systems?",
      opts: ["Geosphere", "Hydrosphere", "Technosphere", "Biosphere"], correct: 2,
      explain: "The four are geosphere, hydrosphere, atmosphere and biosphere." },
    { q: "A tsunami's DIRECT effect on ocean water is best classified under which system?",
      opts: ["Atmosphere", "Hydrosphere", "Biosphere", "Geosphere"], correct: 1,
      explain: "The hydrosphere is all of Earth's water — directly involved through mass water movement." },
    { q: "Why is it more accurate to treat Earth's four systems as one connected model?",
      opts: ["Because only the atmosphere really matters", "Because effects spread across systems as connected consequences", "Because they never interact", "Because scientists prefer simpler diagrams"], correct: 1,
      explain: "Environmental events rarely stay contained to just one system." },
  ],
  7: [
    { q: "Roughly what percentage of Earth's water is fresh water?",
      opts: ["50%", "25%", "3%", "75%"], correct: 2,
      explain: "About 97% is salt water; only ~3% is fresh, mostly stored underground." },
    { q: "Why can't a freshwater fish survive if moved directly into the sea?",
      opts: ["The sea is too cold", "Osmosis causes it to lose water and dehydrate", "There is no oxygen in seawater", "It cannot swim in salt water"], correct: 1,
      explain: "Water moves from higher to lower concentration across the fish's membranes." },
    { q: "Which soil layer is the nutrient-rich topsoil where most roots grow?",
      opts: ["Bedrock", "O horizon", "A horizon", "Subsoil"], correct: 2,
      explain: "The A horizon is fed by leaching and is where most plant roots grow." },
  ],
  8: [
    { q: "A system dominated by a single species, such as a pine plantation, is called a…",
      opts: ["Biome", "Monoculture", "Ecoregion", "Buffer zone"], correct: 1,
      explain: "Monocultures support far less biodiversity than a native multi-species forest." },
    { q: "Industrial agriculture is best described as farming that…",
      opts: ["Feeds only the farming family", "Is run mainly as a business selling most of its produce", "Uses no machinery", "Only grows one crop for personal use"], correct: 1,
      explain: "Subsistence agriculture is the one that mainly feeds the farming family." },
    { q: "What is a buffer zone designed to do?",
      opts: ["Increase crop yield", "Reduce pressure on a sensitive ecosystem from an adjacent human land use", "Replace the need for national parks", "Measure rainfall"], correct: 1,
      explain: "A buffer zone cuts noise, runoff, erosion and invasive spread at the edge." },
  ],
  9: [
    { q: "“Day Zero” refers to…",
      opts: ["The first day a reservoir is built", "The day a reservoir has no water left to supply anyone", "A public holiday", "The wettest day of the year"], correct: 1,
      explain: "The central risk reservoir management is designed to avoid." },
    { q: "Which human activity uses the largest share of the world's fresh water?",
      opts: ["Industry", "Domestic households", "Agriculture", "Power stations"], correct: 2,
      explain: "Agriculture is the single largest water user, and the largest driver of scarcity." },
    { q: "Which conservation measure works by collecting rain for later use?",
      opts: ["Drip irrigation", "Rainwater harvesting", "Wetland restoration", "Desalination"], correct: 1,
      explain: "Rainwater harvesting (e.g. roof tanks) reduces demand on the mains supply." },
  ],
  10: [
    { q: "Which of these is a renewable energy source?",
      opts: ["Coal", "Petroleum", "Solar", "Uranium"], correct: 2,
      explain: "Solar is naturally replenished on a human timescale; the others are not." },
    { q: "The real problem with the greenhouse effect is…",
      opts: ["That it exists at all", "Extra greenhouse gases from human activity trapping additional heat", "That plants absorb carbon dioxide", "That the sun is getting hotter"], correct: 1,
      explain: "The natural effect keeps Earth livable — it's the EXTRA gases that are the problem." },
    { q: "An environmental footprint is broader than a carbon footprint because it also includes…",
      opts: ["Only car emissions", "Land use, water, food, packaging and more", "Nothing extra, they are the same", "Only flight emissions"], correct: 1,
      explain: "Carbon footprint is mainly greenhouse gases; environmental footprint is much broader." },
  ],
  11: [
    { q: "Pollution coming from one identifiable location, like a single drilling platform, is called…",
      opts: ["Non-point source pollution", "Point source pollution", "Diffuse pollution", "Background pollution"], correct: 1,
      explain: "One traceable source — authorities can act directly on it." },
    { q: "Why is agricultural run-off into a reef usually harder to fix than a single oil spill?",
      opts: ["It is less harmful", "It comes from many farms across a whole region with no single source to target", "It only happens once", "It is illegal everywhere"], correct: 1,
      explain: "Non-point source pollution needs broad, coordinated regional action instead." },
    { q: "What actually caused the Montara oil spill?",
      opts: ["A cargo ship collision", "An offshore drilling platform blowout", "A pipeline leak in a city", "An oil tanker running aground"], correct: 1,
      explain: "The West Atlas rig blowout, Timor Sea, 2009 — not a cargo ship." },
  ],
  12: [
    { q: "What does the ozone layer actually filter out of sunlight?",
      opts: ["Infrared heat", "Ultraviolet (UV) light", "Visible light", "Radio waves"], correct: 1,
      explain: "It absorbs UV, especially UV-B — heat arrives separately as infrared." },
    { q: "Ozone depletion and global warming are best described as…",
      opts: ["Exactly the same problem", "Two separate problems with different causes", "Both caused only by CFCs", "Both caused only by carbon dioxide"], correct: 1,
      explain: "CFCs deplete ozone; greenhouse gases cause warming — different mechanisms." },
    { q: "The Montreal Protocol (1987) is significant because it…",
      opts: ["Increased CFC production", "Banned ozone-depleting chemicals internationally", "Ended all fossil fuel use", "Created the first weather satellite"], correct: 1,
      explain: "A genuine environmental success story — the ozone layer is now recovering." },
  ],
};

/* ------------------------------------------------------------------------
   MCQ rendering — click an option, get instant feedback, correct answer
   always revealed. No login, no persistence: ungated self-practice.
   ------------------------------------------------------------------------ */
const LETTERS = ["A", "B", "C", "D", "E"];

function renderMCQ(item, onAnswered) {
  const card = document.createElement("div");
  card.className = "mcq";
  const q = document.createElement("p");
  q.className = "mcq__q";
  q.textContent = item.q;
  card.append(q);

  const opts = document.createElement("div");
  opts.className = "mcq__opts";
  const explain = document.createElement("p");
  explain.className = "mcq__explain";
  explain.hidden = true;
  explain.textContent = item.explain;

  let answered = false;
  item.opts.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mcq__opt";
    const letter = document.createElement("span");
    letter.className = "letter";
    letter.textContent = LETTERS[i];
    const label = document.createElement("span");
    label.textContent = text;
    btn.append(letter, label);
    btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const correct = i === item.correct;
      [...opts.children].forEach((b, j) => {
        b.disabled = true;
        if (j === item.correct) b.classList.add("is-correct");
        else if (j === i) b.classList.add("is-wrong");
        else b.classList.add("is-faded");
      });
      explain.hidden = false;
      if (onAnswered) onAnswered(correct);
    });
    opts.append(btn);
  });

  card.append(opts, explain);
  return card;
}

function checkIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>';
  return svg;
}

/* Per-chapter practice: the 3 questions for that chapter, always visible. */
document.querySelectorAll(".practice-mount[data-chapter]").forEach(mount => {
  const chapter = mount.dataset.chapter;
  const items = BANK[chapter];
  if (!items) return;
  const head = document.createElement("div");
  head.className = "practice-mount__head";
  head.append(checkIcon());
  const label = document.createElement("span");
  label.textContent = "Practice Questions";
  head.append(label);
  mount.append(head);
  items.forEach(item => mount.append(renderMCQ(item)));
});

/* Practice Bank: every question pooled, shuffled, with a running score and a
   "New set" button that reshuffles and resets the score. */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const bankMount = document.getElementById("practice-bank-mount");
if (bankMount) {
  const all = Object.values(BANK).flat();
  let correctCount = 0;
  let answeredCount = 0;

  const toolbar = document.createElement("div");
  toolbar.className = "practice-bank__toolbar";
  const scoreEl = document.createElement("span");
  scoreEl.className = "practice-bank__score";
  const newSetBtn = document.createElement("button");
  newSetBtn.type = "button";
  newSetBtn.className = "btn btn--ghost";
  newSetBtn.textContent = "New set";
  toolbar.append(scoreEl, newSetBtn);

  const list = document.createElement("div");

  function updateScore() {
    scoreEl.innerHTML = "";
    scoreEl.append(document.createTextNode("Score: "));
    const b = document.createElement("b");
    b.textContent = `${correctCount} / ${answeredCount}`;
    scoreEl.append(b);
    scoreEl.append(document.createTextNode(` answered (${all.length} in this set)`));
  }

  function buildSet() {
    list.innerHTML = "";
    correctCount = 0;
    answeredCount = 0;
    updateScore();
    shuffle(all).forEach(item => {
      list.append(renderMCQ(item, correct => {
        answeredCount++;
        if (correct) correctCount++;
        updateScore();
      }));
    });
  }

  newSetBtn.addEventListener("click", buildSet);
  bankMount.append(toolbar, list);
  buildSet();
}

/* ------------------------------------------------------------------------
   Try It — Population Growth Explorer (Chapter 5).
   Redraws a live logistic curve (and an exponential comparison) as the
   student drags the growth-rate and carrying-capacity sliders.
   ------------------------------------------------------------------------ */
const growthMount = document.getElementById("sim-growth");
if (growthMount) {
  growthMount.innerHTML = "";
  const W = 560, H = 260, PAD_L = 50, PAD_B = 40, PAD_T = 20, PAD_R = 20;
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const P0 = 4, T_MAX = 20;

  const card = document.createElement("div");
  card.className = "sim-card";
  card.innerHTML = `
    <p class="sim-card__title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14c3-8 7-8 10 -2"/></svg>
      Try It &mdash; Population Growth Explorer
    </p>
    <div class="sim-row">
      <div class="sim-controls">
        <label>Growth rate (r): <span class="val" id="growth-r-val">0.4</span>
          <input type="range" id="growth-r" min="0.1" max="1" step="0.05" value="0.4">
        </label>
        <label>Carrying capacity (K): <span class="val" id="growth-k-val">70</span>
          <input type="range" id="growth-k" min="20" max="100" step="5" value="70">
        </label>
        <p class="sim-readout" id="growth-readout"></p>
      </div>
      <svg id="growth-svg" viewBox="0 0 560 260" role="img" aria-label="A live-updating graph of logistic and exponential population growth curves that redraw as the growth rate and carrying capacity sliders change.">
        <line x1="50" y1="20" x2="50" y2="220" stroke="currentColor" stroke-width="1.3"/>
        <line x1="50" y1="220" x2="530" y2="220" stroke="currentColor" stroke-width="1.3"/>
        <text x="20" y="120" text-anchor="middle" font-size="11" fill="var(--ink-2)" transform="rotate(-90 20 120)">Population size</text>
        <text x="290" y="245" text-anchor="middle" font-size="11" fill="var(--ink-2)">Time</text>
        <line id="growth-k-line" x1="50" x2="530" stroke="var(--accent)" stroke-width="1" stroke-dasharray="5 4"/>
        <text id="growth-k-label" font-size="11" fill="var(--accent)"></text>
        <path id="growth-exp-path" fill="none" stroke="var(--signal)" stroke-width="2" stroke-dasharray="4 3" opacity="0.75"/>
        <path id="growth-log-path" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
      </svg>
    </div>
  `;
  growthMount.append(card);

  const rInput = card.querySelector("#growth-r");
  const kInput = card.querySelector("#growth-k");
  const rVal = card.querySelector("#growth-r-val");
  const kVal = card.querySelector("#growth-k-val");
  const readout = card.querySelector("#growth-readout");
  const logPath = card.querySelector("#growth-log-path");
  const expPath = card.querySelector("#growth-exp-path");
  const kLine = card.querySelector("#growth-k-line");
  const kLabel = card.querySelector("#growth-k-label");

  function yFor(pop, kMax) {
    const clamped = Math.min(pop, kMax * 1.6);
    return PAD_T + plotH - (clamped / (kMax * 1.6)) * plotH;
  }
  function xFor(t) { return PAD_L + (t / T_MAX) * plotW; }

  function redraw() {
    const r = parseFloat(rInput.value);
    const K = parseFloat(kInput.value);
    rVal.textContent = r.toFixed(2);
    kVal.textContent = String(K);

    const yMax = K * 1.6;
    const kY = yFor(K, K);
    kLine.setAttribute("y1", kY); kLine.setAttribute("y2", kY);
    kLabel.setAttribute("x", 534); kLabel.setAttribute("y", kY + 4);
    kLabel.textContent = "K";

    const N = 60;
    let logD = "", expD = "";
    for (let i = 0; i <= N; i++) {
      const t = (T_MAX * i) / N;
      const logistic = K / (1 + ((K - P0) / P0) * Math.exp(-r * t));
      const exponential = P0 * Math.exp(r * t * 0.6);
      const lx = xFor(t), ly = yFor(logistic, K);
      const ex = xFor(t), ey = yFor(exponential, K);
      logD += (i === 0 ? "M" : "L") + lx.toFixed(1) + "," + ly.toFixed(1) + " ";
      if (exponential <= yMax) expD += (expD === "" ? "M" : "L") + ex.toFixed(1) + "," + ey.toFixed(1) + " ";
    }
    logPath.setAttribute("d", logD.trim());
    expPath.setAttribute("d", expD.trim());

    const finalPop = Math.round(K / (1 + ((K - P0) / P0) * Math.exp(-r * T_MAX)));
    readout.innerHTML = `With <strong>r = ${r.toFixed(2)}</strong> and <strong>K = ${K}</strong>, the logistic
      population (solid line) settles at roughly <strong>${finalPop}</strong> by year ${T_MAX} — while
      unchecked exponential growth (dashed) keeps climbing far past what the environment could really support.`;
  }

  rInput.addEventListener("input", redraw);
  kInput.addEventListener("input", redraw);
  redraw();
}

/* ------------------------------------------------------------------------
   Try It — Reservoir Manager, simplified (Chapter 9).
   A single-screen model: set extraction and rainfall, advance a year at a
   time, and watch the reservoir level respond. Not a Discovery Lab
   simulation (no mission/rubric/evidence) — a quick concept check.
   ------------------------------------------------------------------------ */
const reservoirMount = document.getElementById("sim-reservoir");
if (reservoirMount) {
  reservoirMount.innerHTML = "";
  const card = document.createElement("div");
  card.className = "sim-card";
  card.innerHTML = `
    <p class="sim-card__title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h16v6H4z"/><path d="M7 14V6l5-3 5 3v8"/></svg>
      Try It &mdash; Reservoir Manager
    </p>
    <div class="sim-row">
      <div class="sim-controls">
        <label>Extraction level: <span class="val" id="res-ex-val">50</span>%
          <input type="range" id="res-extraction" min="0" max="100" step="5" value="50">
        </label>
        <label>Rainfall this year (% of normal): <span class="val" id="res-rain-val">100</span>%
          <input type="range" id="res-rainfall" min="0" max="150" step="5" value="100">
        </label>
        <div class="cluster" style="margin-top:var(--sp-4)">
          <button type="button" class="btn" id="res-advance">Advance one year &rarr;</button>
          <button type="button" class="btn btn--ghost" id="res-reset">Reset</button>
        </div>
        <p class="sim-readout" id="res-readout"></p>
      </div>
      <svg id="res-svg" viewBox="0 0 260 260" role="img" aria-label="A reservoir tank that fills or drains as the student advances each year, based on the extraction and rainfall sliders, with a Day Zero warning if it runs dry.">
        <rect x="60" y="20" width="140" height="200" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect id="res-water" x="62" y="120" width="136" height="98" fill="var(--accent)" opacity="0.75"/>
        <line x1="60" y1="20" x2="200" y2="20" stroke="var(--negative)" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="205" y="24" font-size="10" fill="var(--negative)">full</text>
        <line x1="60" y1="220" x2="200" y2="220" stroke="var(--ink-3)" stroke-width="1"/>
        <text id="res-pct" x="130" y="170" text-anchor="middle" font-size="20" font-weight="700" fill="currentColor"></text>
        <text id="res-year" x="130" y="245" text-anchor="middle" font-family="var(--font-data)" font-size="12" fill="var(--ink-2)"></text>
      </svg>
    </div>
  `;
  reservoirMount.append(card);

  const exInput = card.querySelector("#res-extraction");
  const rainInput = card.querySelector("#res-rainfall");
  const exVal = card.querySelector("#res-ex-val");
  const rainVal = card.querySelector("#res-rain-val");
  const advanceBtn = card.querySelector("#res-advance");
  const resetBtn = card.querySelector("#res-reset");
  const readout = card.querySelector("#res-readout");
  const waterRect = card.querySelector("#res-water");
  const pctText = card.querySelector("#res-pct");
  const yearText = card.querySelector("#res-year");

  let level = 60, year = 0;
  const TANK_TOP = 20, TANK_H = 200;

  function paint() {
    const h = (level / 100) * TANK_H;
    waterRect.setAttribute("y", TANK_TOP + TANK_H - h);
    waterRect.setAttribute("height", h);
    waterRect.setAttribute("fill", level <= 0 ? "var(--negative)" : "var(--accent)");
    pctText.textContent = Math.round(level) + "%";
    yearText.textContent = "Year " + year;
    if (level <= 0) {
      readout.innerHTML = "<strong style=\"color:var(--negative)\">DAY ZERO — the reservoir is empty.</strong> Lower extraction or wait for more rainfall, then reset to try a better strategy.";
      readout.classList.add("is-alert");
      advanceBtn.disabled = true;
    } else {
      readout.classList.remove("is-alert");
      advanceBtn.disabled = false;
      const net = (parseFloat(rainInput.value) - 100) / 100 * 12 - (parseFloat(exInput.value) / 100) * 18;
      readout.innerHTML = `At these settings, next year's net change would be roughly
        <strong>${net >= 0 ? "+" : ""}${net.toFixed(0)}%</strong>.`;
    }
  }

  exInput.addEventListener("input", () => { exVal.textContent = exInput.value; paint(); });
  rainInput.addEventListener("input", () => { rainVal.textContent = rainInput.value; paint(); });
  advanceBtn.addEventListener("click", () => {
    const rain = parseFloat(rainInput.value), extraction = parseFloat(exInput.value);
    const net = (rain - 100) / 100 * 12 - (extraction / 100) * 18;
    level = Math.max(0, Math.min(100, level + net));
    year++;
    paint();
  });
  resetBtn.addEventListener("click", () => { level = 60; year = 0; paint(); });
  paint();
}
