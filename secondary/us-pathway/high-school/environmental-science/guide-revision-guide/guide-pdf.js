/* ==========================================================================
   COURSE REVISION GUIDE — PDF export.

   This is a static reference page, not a graded activity, so it does not use
   engine/engine.js's evidence-export machinery (no student name, no rubric,
   no marking.json). It still follows the project's standing engineering
   decision — "PDF via jsPDF with a hand-written layout function, never
   window.print()" (CLAUDE.md §10) — using the same vendored library and the
   same hand-laid-page technique as buildPDF()/buildStudentPDF() in
   engine/engine.js, kept local to this guide's own folder per the
   content-vs-engine rule (content lives in its own folder; the shared engine
   is not touched for a content page).

   Content source: adapted from Diego's own master study-guide markdown
   (environmental_science_master_study_guide.md) — organised into the same
   three-level structure (Foundations / Applied Systems / Expert Analysis),
   with every ASCII-art diagram in that document redrawn here as a real
   vector diagram (rects/lines/circles via jsPDF primitives), not an image.
   ========================================================================== */

const VENDOR_URL = new URL("../../../../../engine/vendor/jspdf.umd.min.js", import.meta.url).href;

function loadJsPDF() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = VENDOR_URL;
    s.onload = () => (window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error("jsPDF missing")));
    s.onerror = () => reject(new Error("jsPDF failed to load"));
    document.head.appendChild(s);
  });
}

/* jsPDF's core Helvetica is Latin-1 (WinAnsi) only — same fix as engine/engine.js. */
function pdfSafe(s) {
  return String(s == null ? "" : s)
    .replace(/[→➔➤]/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[•·]/g, "-")
    .replace(/[✓✔]/g, "[ok]")
    .replace(/[×]/g, "x")
    .replace(/[°]/g, " deg ")
    .replace(/[₂₃]/g, m => ({ "₂": "2", "₃": "3" }[m]))
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

/* ==========================================================================
   Layout engine — same hand-written jsPDF technique as engine/engine.js,
   extended with a small library of real vector diagrams.
   ========================================================================== */
function buildGuidePDF(jsPDF) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54, RIGHT = W - M, CW = W - M * 2;
  let y = M;

  const INK = [23, 26, 22], MUT = [110, 118, 112], ACCENT = [64, 99, 76], SIGNAL = [181, 85, 31], LINE = [200, 205, 198];
  const PALETTE = {
    accentTint: [231, 240, 233], signalTint: [251, 233, 220], slate: [71, 85, 105], slateTint: [226, 232, 240],
    sky: [2, 132, 199], skyTint: [224, 242, 254], amber: [217, 119, 6], amberTint: [253, 235, 208],
    rose: [190, 40, 60], roseTint: [250, 222, 226], white: [255, 255, 255],
  };
  const setText = c => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = c => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = c => doc.setDrawColor(c[0], c[1], c[2]);

  function footer() {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); setText(MUT);
    doc.text("Discovery Lab - Course Revision Guide - Environmental Science", M, H - 30);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, RIGHT, H - 30, { align: "right" });
    setText(INK);
  }
  function newPage() { footer(); doc.addPage(); y = M; }
  function ensure(space) { if (y + space > H - M) newPage(); }
  function rule() { setDraw(LINE); doc.setLineWidth(0.75); doc.line(M, y, RIGHT, y); y += 12; }

  function h1(text) {
    ensure(30); doc.setFont("helvetica", "bold"); doc.setFontSize(16); setText(ACCENT);
    doc.text(pdfSafe(text), M, y); y += 22; setText(INK);
  }
  function levelBanner(label, title) {
    newPage();
    ensure(60);
    setFill(ACCENT); doc.roundedRect(M, y, CW, 46, 4, 4, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); setText(PALETTE.white);
    doc.text(pdfSafe(label), M + 16, y + 18);
    doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text(pdfSafe(title), M + 16, y + 36);
    y += 46 + 20; setText(INK);
  }
  function h2(text) {
    ensure(20); doc.setFont("helvetica", "bold"); doc.setFontSize(12.5); setText(SIGNAL);
    doc.text(pdfSafe(text).toUpperCase(), M, y); y += 16; setText(INK);
  }
  function h3(text) {
    ensure(16); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); setText(ACCENT);
    doc.text(pdfSafe(text), M, y); y += 14; setText(INK);
  }
  function para(text, { size = 10, style = "normal", color = INK, gap = 8, indent = 0 } = {}) {
    doc.setFont("helvetica", style); doc.setFontSize(size); setText(color);
    const lines = doc.splitTextToSize(pdfSafe(text), CW - indent);
    ensure(lines.length * (size + 3) + gap);
    doc.text(lines, M + indent, y);
    y += lines.length * (size + 3) + gap;
    setText(INK);
  }
  function bullets(items, { size = 9.6, gap = 5 } = {}) {
    items.forEach(t => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(size); setText(INK);
      const lines = doc.splitTextToSize(pdfSafe(t), CW - 14);
      ensure(lines.length * (size + 3) + gap);
      doc.text("-", M, y);
      doc.text(lines, M + 12, y);
      y += lines.length * (size + 3) + gap;
    });
  }
  function formulaBox(text, { size = 10 } = {}) {
    doc.setFont("courier", "bold"); doc.setFontSize(size);
    const lines = doc.splitTextToSize(pdfSafe(text), CW - 24);
    const boxH = lines.length * (size + 6) + 16;
    ensure(boxH + 8);
    setFill([23, 33, 25]); doc.roundedRect(M, y, CW, boxH, 4, 4, "F");
    setText([167, 243, 208]);
    doc.text(lines, M + 12, y + 18, { lineHeightFactor: 1.4 });
    y += boxH + 12; setText(INK); doc.setFont("helvetica", "normal");
  }
  function termBox(term, def) {
    ensure(16);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setText(ACCENT);
    doc.text(pdfSafe(term) + ":", M, y);
    const labelW = doc.getTextWidth(pdfSafe(term) + ": ");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setText(INK);
    const lines = doc.splitTextToSize(pdfSafe(def), CW - labelW);
    doc.text(lines[0] || "", M + labelW, y);
    y += 13;
    for (let i = 1; i < lines.length; i++) { ensure(13); doc.text(lines[i], M, y); y += 13; }
    y += 5;
  }
  function caseBox(title, text) {
    ensure(18);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setText(SIGNAL);
    doc.text("CASE FILE - " + pdfSafe(title), M, y); y += 13;
    para(text, { size: 9.2, color: [70, 76, 68], gap: 10 });
  }
  function table(headers, rows, colWidths) {
    const cw = colWidths || headers.map(() => CW / headers.length);
    const rowH = 16;
    ensure(rowH * (rows.length + 1) + 10);
    let cx = M;
    setFill(ACCENT);
    doc.rect(M, y, CW, rowH, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.3); setText(PALETTE.white);
    headers.forEach((htext, i) => { doc.text(pdfSafe(htext), cx + 5, y + 11); cx += cw[i]; });
    y += rowH;
    rows.forEach((row, ri) => {
      const cellLines = row.map((cell, i) => doc.splitTextToSize(pdfSafe(cell), cw[i] - 10));
      const lineCount = Math.max(...cellLines.map(l => l.length));
      const thisRowH = Math.max(rowH, lineCount * 10 + 6);
      ensure(thisRowH);
      if (ri % 2 === 1) { setFill([244, 246, 242]); doc.rect(M, y, CW, thisRowH, "F"); }
      cx = M;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.2); setText(INK);
      row.forEach((cell, i) => {
        doc.text(cellLines[i], cx + 5, y + 10);
        cx += cw[i];
      });
      setDraw(LINE); doc.setLineWidth(0.4); doc.line(M, y + thisRowH, RIGHT, y + thisRowH);
      y += thisRowH;
    });
    y += 12;
  }

  /* ------------------------------------------------------------------------
     Diagram primitives — hand-drawn vectors, not images.
     ------------------------------------------------------------------------ */
  function labelledBox(x, bx, bw, bh, title, sub, fill, textColor) {
    setFill(fill); doc.roundedRect(x, bx, bw, bh, 3, 3, "F");
    setDraw(LINE); doc.setLineWidth(0.6); doc.roundedRect(x, bx, bw, bh, 3, 3, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.6); setText(textColor || INK);
    doc.text(pdfSafe(title), x + bw / 2, bx + bh / 2 - (sub ? 4 : -2), { align: "center" });
    if (sub) { doc.setFont("helvetica", "normal"); doc.setFontSize(7.4); doc.text(pdfSafe(sub), x + bw / 2, bx + bh / 2 + 8, { align: "center" }); }
    setText(INK);
  }
  function arrow(x1, yy1, x2, yy2) {
    setDraw(MUT); doc.setLineWidth(1); doc.line(x1, yy1, x2, yy2);
    const ang = Math.atan2(yy2 - yy1, x2 - x1);
    const ah = 4;
    doc.line(x2, yy2, x2 - ah * Math.cos(ang - 0.4), yy2 - ah * Math.sin(ang - 0.4));
    doc.line(x2, yy2, x2 - ah * Math.cos(ang + 0.4), yy2 - ah * Math.sin(ang + 0.4));
  }
  function diagramCaption(text) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(8); setText(MUT);
    const lines = doc.splitTextToSize(pdfSafe(text), CW);
    doc.text(lines, M + CW / 2, y, { align: "center" });
    y += lines.length * 10 + 14; setText(INK);
  }

  // 1. Four spheres: title box, four arrows down to four boxes
  function diagramSpheres() {
    const dH = 108; ensure(dH + 26);
    const topW = 220, topX = M + CW / 2 - topW / 2;
    labelledBox(topX, y, topW, 22, "ENVIRONMENTAL SCIENCE", null, PALETTE.slateTint);
    const boxW = (CW - 30) / 4, gap = 10;
    const boxes = [
      ["Geosphere", "Rock, soil, minerals", PALETTE.amberTint],
      ["Hydrosphere", "Oceans, ice, groundwater", PALETTE.skyTint],
      ["Atmosphere", "N2, O2, GHGs", PALETTE.slateTint],
      ["Biosphere", "All living organisms", PALETTE.accentTint],
    ];
    boxes.forEach((b, i) => {
      const bx = M + i * (boxW + gap);
      arrow(topX + topW / 2, y + 22, bx + boxW / 2, y + 46);
      labelledBox(bx, y + 46, boxW, 46, b[0], b[1], b[2]);
    });
    y += dH;
    diagramCaption("EARTH'S FOUR SPHERES - a change in one triggers effects in the others.");
  }

  // 2. Trophic chain: 4 boxes with arrows
  function diagramTrophicChain() {
    const dH = 60; ensure(dH + 26);
    const boxW = (CW - 30) / 4, gap = 10;
    const items = [["Producer", "Algae"], ["Primary", "Tadpole"], ["Secondary", "Fish"], ["Apex", "Heron"]];
    items.forEach((it, i) => {
      const bx = M + i * (boxW + gap);
      labelledBox(bx, y, boxW, 40, it[0], it[1], PALETTE.accentTint);
      if (i < 3) arrow(bx + boxW + 1, y + 20, bx + boxW + gap - 1, y + 20);
    });
    y += dH;
    diagramCaption("ENERGY FLOW - each arrow points from the organism eaten to the organism eating it.");
  }

  // 3. Exponential (J) vs Logistic (S) growth curves
  function diagramGrowthCurves() {
    const dH = 150; ensure(dH + 26);
    const px = M + 34, py = y + 6, plotW = CW - 60, plotH = 100;
    setDraw(MUT); doc.setLineWidth(1);
    doc.line(px, py, px, py + plotH); doc.line(px, py + plotH, px + plotW, py + plotH);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); setText(MUT);
    doc.text("Population (N)", px - 30, py - 2);
    doc.text("Time", px + plotW / 2, py + plotH + 14, { align: "center" });
    // carrying capacity dashed line
    const kY = py + 18;
    setDraw(PALETTE.amber); doc.setLineWidth(1); doc.setLineDashPattern([3, 2], 0);
    doc.line(px, kY, px + plotW, kY);
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); setText(PALETTE.amber);
    doc.text("Carrying Capacity (K)", px + plotW - 90, kY - 4);
    // S-curve (logistic)
    setDraw(PALETTE.sky); doc.setLineWidth(1.6);
    let prevX = px, prevY = py + plotH;
    const N = 40;
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const logistic = 1 / (1 + Math.exp(-10 * (t - 0.45)));
      const lx = px + t * plotW, ly = py + plotH - logistic * (plotH - 18);
      doc.line(prevX, prevY, lx, ly);
      prevX = lx; prevY = ly;
    }
    // J-curve (exponential) - stop drawing once it would exceed the plot
    setDraw(ACCENT); doc.setLineWidth(1.6);
    prevX = px; prevY = py + plotH;
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const exponential = Math.exp(3.3 * t) / Math.exp(3.3);
      const ly = py + plotH - Math.min(exponential, 1.05) * (plotH - 4);
      const lx = px + t * plotW;
      if (ly < py - 4) break;
      doc.line(prevX, prevY, lx, ly);
      prevX = lx; prevY = ly;
    }
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); setText(PALETTE.sky);
    doc.text("Logistic (S-curve)", px + plotW - 90, py + plotH - 26);
    setText(ACCENT); doc.text("Exponential (J-curve)", px + 8, py + 14);
    y += dH; setText(INK);
    diagramCaption("EXPONENTIAL VS. LOGISTIC GROWTH - logistic growth slows as density-dependent resistance increases near K.");
  }

  // 4. Soil horizon stack (also reused for atmosphere layers with 2 bands)
  function diagramStack(rows, totalH) {
    const dH = totalH + 20; ensure(dH + 26);
    const rowH = totalH / rows.length;
    rows.forEach((r, i) => {
      const ry = y + i * rowH;
      setFill(r[2]); doc.rect(M, ry, CW, rowH - 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.6); setText(r[3] || INK);
      doc.text(pdfSafe(r[0]), M + 10, ry + rowH / 2 + 1);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.text(pdfSafe(r[1]), M + 140, ry + rowH / 2 + 1);
      setText(INK);
    });
    y += totalH + 6;
  }

  // 5. Two-column comparison boxes (monoculture/agroforestry, point/non-point)
  function diagramTwoColumn(leftTitle, leftLines, rightTitle, rightLines, colors) {
    const boxW = (CW - 16) / 2, boxH = 78; ensure(boxH + 26);
    [[M, leftTitle, leftLines, colors[0]], [M + boxW + 16, rightTitle, rightLines, colors[1]]].forEach(([bx, title, lines, fill]) => {
      setFill(fill); doc.roundedRect(bx, y, boxW, boxH, 4, 4, "F");
      setDraw(LINE); doc.setLineWidth(0.6); doc.roundedRect(bx, y, boxW, boxH, 4, 4, "S");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setText(INK);
      doc.text(pdfSafe(title), bx + 10, y + 16);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.8);
      const wrapped = doc.splitTextToSize(pdfSafe(lines), boxW - 20);
      doc.text(wrapped, bx + 10, y + 30);
    });
    y += boxH + 8;
  }

  // 6. Reservoir mass-balance flow (inflow box -> storage -> outflow box)
  function diagramReservoirFlow() {
    const dH = 130; ensure(dH + 26);
    labelledBox(M, y, CW, 26, "INFLOWS: rainfall, surface runoff, aquifer recharge", null, PALETTE.skyTint);
    arrow(M + CW / 2, y + 26, M + CW / 2, y + 50);
    labelledBox(M + CW / 2 - 110, y + 50, 220, 30, "RESERVOIR STORAGE", null, PALETTE.accentTint);
    arrow(M + CW / 2, y + 80, M + CW / 2, y + 104);
    labelledBox(M, y + 104, CW, 26, "OUTFLOWS: evaporation, agricultural + municipal extraction", null, PALETTE.roseTint);
    y += dH;
    diagramCaption("\"DAY ZERO\" occurs when outflows deplete storage to operational zero.");
  }

  // 7. Irrigation efficiency bars
  function diagramBars(items) {
    const rowH = 26, dH = items.length * rowH + 10; ensure(dH + 26);
    const maxW = CW - 140;
    items.forEach((it, i) => {
      const ry = y + i * rowH;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.4); setText(INK);
      doc.text(pdfSafe(it[0]), M, ry + 14);
      setFill(PALETTE.slateTint); doc.rect(M + 128, ry + 4, maxW, 14, "F");
      setFill(it[2]); doc.rect(M + 128, ry + 4, maxW * it[1], 14, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      doc.text(Math.round(it[1] * 100) + "%", M + 128 + maxW + 6, ry + 14);
    });
    y += dH;
  }

  // 8. Greenhouse effect radiation diagram
  function diagramGreenhouse() {
    const dH = 100; ensure(dH + 26);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); setText(PALETTE.amber);
    doc.text("SUN", M, y + 10);
    setText(PALETTE.sky); doc.text("SPACE", RIGHT - 30, y + 10);
    arrow(M + 28, y + 8, M + 90, y + 40);
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.4); setText(PALETTE.amber);
    doc.text("shortwave solar radiation", M + 30, y + 26);
    labelledBox(M + 40, y + 44, CW - 80, 16, "ATMOSPHERE (greenhouse gases)", null, PALETTE.slateTint);
    arrow(M + 90, y + 60, M + 90, y + 78);
    setFill(PALETTE.accentTint); doc.rect(M, y + 78, CW, 14, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); setText(INK);
    doc.text("EARTH'S SURFACE (heats up)", M + CW / 2, y + 88, { align: "center" });
    arrow(RIGHT - 90, y + 78, RIGHT - 40, y + 20);
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.4); setText(PALETTE.sky);
    doc.text("outgoing infrared - trapped by extra GHGs, re-radiated down", M + 100, y + 60);
    y += dH; setText(INK);
    diagramCaption("THE ENHANCED GREENHOUSE EFFECT - extra GHGs re-radiate outgoing heat back toward the surface.");
  }

  // 9. IUCN risk ladder
  function diagramLadder(items) {
    const boxH = 22, dH = items.length * (boxH + 4); ensure(dH + 26);
    items.forEach((it, i) => {
      const by = y + i * (boxH + 4);
      setFill(it[1]); doc.rect(M, by, CW, boxH, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.6); setText(it[2] || PALETTE.white);
      doc.text(pdfSafe(it[0]), M + 10, by + 14);
      setText(INK);
      if (i < items.length - 1) arrow(M + CW / 2, by + boxH, M + CW / 2, by + boxH + 3);
    });
    y += dH + 8;
  }

  // 10. 2x2 grid (ecosystem services)
  function diagramGrid4(items) {
    const boxW = (CW - 12) / 2, boxH = 50, dH = boxH * 2 + 12; ensure(dH + 26);
    items.forEach((it, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = M + col * (boxW + 12), by = y + row * (boxH + 12);
      setFill(it[2]); doc.roundedRect(bx, by, boxW, boxH, 3, 3, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); setText(INK);
      doc.text(pdfSafe(it[0]), bx + 8, by + 16);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.6);
      doc.text(doc.splitTextToSize(pdfSafe(it[1]), boxW - 16), bx + 8, by + 30);
    });
    y += dH;
  }

  // 11. Nested circles (biodiversity levels)
  function diagramNestedCircles() {
    const dH = 130; ensure(dH + 26);
    const cx = M + 70, cy = y + 62;
    setFill(PALETTE.accentTint); doc.circle(cx, cy, 60, "F");
    setDraw(ACCENT); doc.setLineWidth(0.8); doc.circle(cx, cy, 60, "S");
    setFill([120, 170, 135]); doc.circle(cx, cy, 38, "F");
    setFill(ACCENT); doc.circle(cx, cy, 18, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); setText(PALETTE.white);
    doc.text("Genetic", cx, cy + 2, { align: "center" }); setText(INK);
    const labels = [
      ["Genetic diversity", "variation in DNA within one species", cy - 50],
      ["Species diversity", "variety of species within an ecosystem", cy - 5],
      ["Ecosystem diversity", "variety of habitats across a region", cy + 40],
    ];
    labels.forEach(l => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.4);
      doc.text(pdfSafe(l[0]), cx + 90, l[2]);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.6); setText(MUT);
      doc.text(pdfSafe(l[1]), cx + 90, l[2] + 10);
      setText(INK);
    });
    y += dH;
  }

  /* ------------------------------------------------------------------------
     Cover page
     ------------------------------------------------------------------------ */
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); setText(SIGNAL);
  doc.text("DISCOVERY LAB - COURSE REVISION GUIDE", M, y); y += 26;
  doc.setFont("helvetica", "bold"); doc.setFontSize(24); setText(INK);
  doc.text("Environmental Science", M, y); y += 20;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); setText(MUT);
  doc.text("Master Study & Revision Guide - US Pathway, High School", M, y); y += 28;
  rule();
  para(
    "This print edition mirrors the three-level structure of the online guide: Level 1 (Foundations), " +
    "Level 2 (Applied Systems), and Level 3 (Expert Analysis) -- each level builds directly on the one before " +
    "it. Every diagram below is a real drawn figure, not a picture. The live version also has a 72+ question " +
    "auto-marked Practice Bank and an interactive concept model for every chapter -- open the course page to use them.",
    { size: 9.3, style: "italic", color: MUT, gap: 18 }
  );
  h1("Contents");
  [
    "LEVEL 1 - FOUNDATIONS", "  1. What Is Environmental Science?", "  2. Earth's Four Connected Systems",
    "  3. Ecosystems & Energy Flow", "  4. Biodiversity: Levels & Ecosystem Services",
    "LEVEL 2 - APPLIED SYSTEMS", "  5. Population Ecology & Environmental Resistance", "  6. Soil Stratigraphy & Hydrology",
    "  7. Land Use, Agriculture & Agroforestry", "  8. Threats to Biodiversity & Conservation Priorities",
    "LEVEL 3 - EXPERT ANALYSIS", "  9. Water Resource Management & Scarcity", "  10. Energy Systems & Climate Forcing",
    "  11. Pollution Ecotoxicology & Runoff", "  12. Stratospheric Ozone vs. Global Climate Change",
    "Exam Practice: Short Answer & Extended Response", "Glossary of Key Terms",
  ].forEach(t => para(t, { size: t.startsWith("  ") ? 9.5 : 10.5, style: t.startsWith("  ") ? "normal" : "bold", gap: 5, color: t.startsWith("  ") ? INK : ACCENT }));

  /* ========================================================================
     LEVEL 1 — FOUNDATIONS
     ======================================================================== */
  levelBanner("LEVEL 1 - FOUNDATIONS", "Core Principles & Definitions");

  h1("1. What Is Environmental Science?");
  para(
    "Environmental Science is an interdisciplinary, problem-solving science: it observes natural phenomena, " +
    "asks testable questions, gathers empirical evidence, and designs sustainable solutions. It integrates " +
    "biology, chemistry, physics, geology, hydrology and social science to explain how natural systems work " +
    "and how human society interacts with them."
  );
  h2("Environmental problem-solving, step by step");
  bullets([
    "Observe - identify environmental degradation (e.g. declining fish populations).",
    "Question - hypothesise possible causes (overfishing vs. ocean warming).",
    "Gather evidence - collect empirical field data (water chemistry, population counts).",
    "Design solutions - implement targeted policy or ecological intervention (e.g. marine protected areas).",
  ]);
  termBox("The Water Shortage Paradox", "Earth is not \"running out of water\" - it moves in a closed hydrological loop and total volume stays constant. The real crisis is the shortage of clean, safe, accessible fresh water fit for human use.");
  caseBox("Manila, Philippines", "Single-use plastic sachets used for daily household goods take minutes to consume but persist in urban waterways and ocean gyres for centuries.");

  h1("2. Earth's Four Connected Systems");
  para("Earth functions as one dynamic super-system. An event in one sphere triggers ripple effects across the other three.");
  diagramSpheres();
  table(
    ["Sphere", "Composition", "Core function"],
    [
      ["Geosphere", "Rocks, minerals, tectonic plates, soil", "Physical structure & nutrient storage"],
      ["Hydrosphere", "Oceans, ice caps, groundwater, vapour", "Regulates temperature & transports nutrients"],
      ["Atmosphere", "N2 78%, O2 21%, Argon, trace GHGs", "Filters solar radiation, supplies gases for life"],
      ["Biosphere", "All living organisms across biomes", "Converts solar energy into biomass"],
    ],
    [90, 220, 232]
  );
  caseBox("Sumatra, Indonesia", "An undersea earthquake (geosphere) generated a tsunami (hydrosphere) that devastated coastal mangroves (biosphere), indirectly reducing regional carbon sequestration (atmosphere) - one event, four systems.");

  h1("3. Ecosystems & Energy Flow");
  termBox("Biotic factor", "A living or once-living component of an ecosystem (mangrove trees, coral polyps, soil bacteria, top predators).");
  termBox("Abiotic factor", "A non-living physical or chemical element (solar irradiance, water temperature, soil pH, dissolved oxygen).");
  para("In food webs, an arrow always points from the organism being eaten to the organism consuming it - the direction energy travels.");
  diagramTrophicChain();
  h2("The 10% energy transfer rule");
  para("Roughly 90% of available metabolic energy is lost as heat, waste and movement at each trophic step. Only about 10% is converted into biomass and passed upward.");
  formulaBox("Energy at Level N  =  Energy at Level (N-1)  x  0.10");
  h3("Worked example: starting from 50,000 kJ of producer biomass");
  bullets([
    "Level 1 (Producers) = 50,000 kJ",
    "Level 2 (Primary consumers) = 50,000 x 0.10 = 5,000 kJ",
    "Level 3 (Secondary consumers) = 5,000 x 0.10 = 500 kJ",
    "Level 4 (Apex predators) = 500 x 0.10 = 50 kJ",
  ]);
  caseBox("Australian freshwater wetland", "Algae -> tadpole -> small native fish -> white-faced heron. Decomposers break down waste back into nutrient-rich mud, completing the loop.");

  h1("4. Biodiversity: Levels & Ecosystem Services");
  diagramNestedCircles();
  table(
    ["Level", "Definition", "Example"],
    [
      ["Genetic diversity", "DNA variation within one species", "Disease-resistant wild rice variants, Southeast Asia"],
      ["Species diversity", "Variety/abundance of species in an ecosystem", "Species richness of Amazon rainforest trees"],
      ["Ecosystem diversity", "Variety of habitats across a landscape", "Desert-to-alpine transition, Oceania"],
    ],
    [110, 240, 192]
  );
  h2("Biome vs. ecoregion");
  bullets([
    "Biome - a broad, global ecological zone defined by macro-climate (tropical rainforest, tundra, arid desert).",
    "Ecoregion - a smaller, geography-specific unit within a biome with its own climate, species and landforms.",
  ]);
  h2("The four categories of ecosystem services");
  diagramGrid4([
    ["Provisioning", "Material goods taken directly: timber, fresh water, wild food.", PALETTE.accentTint],
    ["Regulating", "Flood control (Mekong Delta), coastal carbon storage.", PALETTE.skyTint],
    ["Supporting", "Nutrient cycling by soil microbes, primary production.", PALETTE.amberTint],
    ["Cultural", "Eco-tourism (Maasai Mara), sacred groves (India).", PALETTE.roseTint],
  ]);
  caseBox("The Catskill Watershed, New York City", "NYC protects the Catskills' native forests and wetlands rather than building a multi-billion-dollar filtration plant - a regulating service saving money while protecting nature.");

  /* ========================================================================
     LEVEL 2 — APPLIED SYSTEMS
     ======================================================================== */
  levelBanner("LEVEL 2 - APPLIED SYSTEMS", "Processes, Dynamics & Applied Systems");

  h1("5. Population Ecology & Environmental Resistance");
  termBox("Population", "Individuals of the SAME species in a specific, NAMED area at the same time (e.g. African elephants in Chobe National Park, Botswana).");
  formulaBox("Delta N  =  (Births + Immigration)  -  (Deaths + Emigration)");
  diagramGrowthCurves();
  table(
    ["Growth model", "Mechanism"],
    [
      ["Exponential (J-curve)", "Ideal conditions, unlimited resources; growth rate accelerates: dN/dt = rN"],
      ["Logistic (S-curve)", "Growth levels off near carrying capacity K: dN/dt = rN x (K-N)/K"],
    ],
    [160, 342]
  );
  h2("Density-dependent vs. density-independent limiting factors");
  table(
    ["Type", "Mechanism", "Examples"],
    [
      ["Density-dependent", "Impact strengthens as density rises", "Food/water competition, disease, waste buildup"],
      ["Density-independent", "Impact occurs regardless of density", "Volcanic eruptions, floods, wildfires, tsunamis"],
    ],
    [120, 180, 242]
  );
  caseBox("Sclerophyll forests, Victoria, Australia", "Eucalyptus regenerates rapidly after a single wildfire from epicormic buds. If fire frequency increases, seed banks burn before reaching maturity and the ecosystem can collapse.");

  h1("6. Soil Stratigraphy & Hydrology");
  h2("Soil horizon profile (top to bottom)");
  diagramStack([
    ["O Horizon", "Organic layer: humus, leaf litter, decaying biomass", [92, 64, 38], PALETTE.white],
    ["A Horizon", "Topsoil: dark, nutrient-rich, high biological activity", [122, 84, 48], PALETTE.white],
    ["B Horizon", "Subsoil: accumulated minerals, iron, clay leachates", [153, 106, 60], PALETTE.white],
    ["C Horizon", "Weathered parent material: partially broken bedrock", [184, 138, 90], INK],
    ["R Horizon", "Bedrock: solid, unweathered rock", [110, 110, 110], PALETTE.white],
  ], 100);
  h2("Osmotic stress in aquatic species");
  para("Osmosis moves water across a semi-permeable membrane from lower to higher solute concentration.");
  table(
    ["Freshwater fish", "Saltwater fish"],
    [["Body fluids more concentrated than surroundings; water enters passively via gills; excretes large volumes of dilute urine.",
      "Environment is hypertonic to body fluids; water leaves passively via gills; drinks seawater and actively pumps out excess salt."]],
    [CW / 2, CW / 2]
  );
  caseBox("The water cycle in motion", "Evaporation -> transpiration (release from plant leaves) -> condensation -> precipitation -> runoff -> infiltration into aquifers (porous rock storing fresh groundwater).");

  h1("7. Land Use, Agriculture & Agroforestry");
  termBox("Primary forest", "Native forest with original ecological structure, not substantially disturbed by human activity.");
  termBox("Edge effect", "Microclimatic/biological changes where forest meets cleared land - more wind, less humidity, more invasive species and fire risk.");
  table(
    ["Model", "Characteristics", "Environmental impact"],
    [
      ["Monoculture", "Single crop, vast areas, chemical inputs, mechanised", "High yield, but soil depletion, biodiversity loss, high fossil-fuel demand"],
      ["Subsistence farming", "Small-scale, feeds the farmer's family, low input", "Lower yield, but keeps local crop variety and avoids mass runoff"],
      ["Agroforestry", "Trees and shrubs integrated with crops/livestock", "More stable topsoil, higher biodiversity, better water retention"],
    ],
    [90, 190, 262]
  );
  diagramTwoColumn(
    "Monoculture", "Uniform rows of a single crop species. Low structural diversity; minimal habitat variety.",
    "Agroforestry", "Native trees, shade crops and legumes intermixed. High root architecture and habitat diversity.",
    [PALETTE.roseTint, PALETTE.accentTint]
  );
  caseBox("Coffee Triangle, Colombia", "Native timber trees planted above coffee bushes anchor steep hillside topsoil, host pest-controlling migratory birds, and store far more carbon than open-sun monoculture.");

  h1("8. Threats to Biodiversity & Conservation Priorities");
  para("An organism is only classified as INVASIVE if it satisfies all three criteria: (1) non-native, (2) establishes and spreads rapidly, (3) causes quantifiable ecological, economic or health harm.");
  h2("IUCN Red List classification framework");
  diagramLadder([
    ["Least Concern", PALETTE.accentTint, INK],
    ["Near Threatened", [200, 214, 170], INK],
    ["Vulnerable", PALETTE.amberTint, INK],
    ["Endangered", [230, 150, 90], PALETTE.white],
    ["Critically Endangered", [196, 60, 60], PALETTE.white],
    ["Extinct in the Wild / Extinct", [40, 40, 44], PALETTE.white],
  ]);
  h2("Spatial prioritisation: KBAs and AZE sites");
  bullets([
    "Key Biodiversity Area (KBA) - a site contributing significantly to the global persistence of biodiversity.",
    "Alliance for Zero Extinction (AZE) site - a KBA holding the LAST remaining wild population of a Critically Endangered or Endangered species.",
  ]);
  h2("Ocean acidification chemistry");
  para("Extra atmospheric CO2 dissolves into seawater, forming carbonic acid, which releases hydrogen ions that bind available carbonate - making it harder for corals and molluscs to build calcium-carbonate skeletons.");
  formulaBox("CO2 + H2O <-> H2CO3 <-> H+ + HCO3-\nH+ + CO32- <-> HCO3-   (depletes CO3^2- needed for CaCO3 calcification)");
  caseBox("Scottsdale Reserve, New South Wales, Australia", "Six restoration principles applied: a clear reference ecosystem, methods matched to site conditions, measurable goals, full ecological recovery as the aim, integrated science, and local community involvement.");

  /* ========================================================================
     LEVEL 3 — EXPERT ANALYSIS
     ======================================================================== */
  levelBanner("LEVEL 3 - EXPERT ANALYSIS", "Global Systems, Resource Policy & Solutions");

  h1("9. Water Resource Management & Scarcity");
  formulaBox("Delta Storage = (Precipitation + Inflow + Aquifer Recharge)\n              - (Evaporation + Municipal Extraction + Agricultural Extraction)");
  diagramReservoirFlow();
  para("Agriculture accounts for roughly 70% of global freshwater withdrawals. Modernising irrigation is the fastest lever for reducing that demand:");
  diagramBars([
    ["Flood irrigation", 0.5, PALETTE.roseTint],
    ["Overhead sprinkler", 0.7, PALETTE.amberTint],
    ["Micro-drip irrigation", 0.9, PALETTE.accentTint],
  ]);
  caseBox("Cape Town, South Africa (2018)", "A multi-year drought brought the city within weeks of \"Day Zero\". Aggressive rationing, pressure reduction and agricultural diversions cut water use by over 50%, averting shutdown.");

  h1("10. Energy Systems & Climate Forcing");
  table(
    ["Category", "Sources", "Replenishment", "Trade-offs"],
    [
      ["Non-renewable", "Coal, petroleum, natural gas, uranium", "Millions of years", "High energy density; CO2/SOx/NOx and hazardous waste"],
      ["Renewable", "Solar, wind, geothermal, hydro, tidal", "Human timescale", "Variable output; needs storage infrastructure"],
    ],
    [95, 175, 100, 182]
  );
  h2("Carbon footprint vs. environmental footprint");
  bullets([
    "Carbon footprint - total greenhouse gas emissions (CO2 equivalents) from an individual, organisation or process.",
    "Environmental (ecological) footprint - total biologically productive land/water needed to supply resources and absorb waste (carbon footprint is one part of this larger total).",
  ]);
  diagramGreenhouse();
  para("The natural greenhouse effect keeps Earth's average surface temperature near +15C (rather than -18C) - essential for life. The problem is the ENHANCED greenhouse effect: extra CO2, CH4 and N2O from human activity trap additional outgoing heat.");
  caseBox("Sumatra & Borneo, Indonesia/Malaysia", "Clearing biodiverse peatland rainforest for palm oil destroys orangutan habitat and releases stored soil carbon - turning a carbon sink into a major emissions source.");

  h1("11. Pollution Ecotoxicology & Runoff");
  diagramTwoColumn(
    "Point source", "Single, identifiable outlet (factory pipe, drilling platform). Direct legal accountability.",
    "Non-point source", "Diffuse regional sources (farm runoff, urban stormwater). Requires landscape-wide policy.",
    [PALETTE.slateTint, PALETTE.skyTint]
  );
  caseBox("Montara oil spill (2009), Timor Sea", "A blowout at the West Atlas drilling platform, north of Darwin, Australia, spilled crude oil from one identifiable point over 75 days, affecting roughly 6,000 km2 of ocean. Because the source was clear, legal and financial liability fell on the operator.");
  caseBox("Great Barrier Reef agricultural runoff, Queensland", "Excess nitrogen and phosphorus from thousands of cattle ranches and sugarcane farms washes into river catchments during monsoons, triggering algal blooms and crown-of-thorns starfish outbreaks - a non-point problem needing region-wide policy, not one fine.");

  h1("12. Stratospheric Ozone vs. Global Climate Change");
  para("A common confusion: ozone depletion and global climate change are DISTINCT problems, driven by different chemistry in different atmospheric layers.");
  diagramStack([
    ["Stratosphere (15-35 km)", "Contains the ozone layer (O3); filters UV-B; depleted by CFCs", PALETTE.skyTint, INK],
    ["Troposphere (0-12 km)", "Contains human activity & GHGs; traps outgoing infrared heat", PALETTE.accentTint, INK],
  ], 60);
  table(
    ["Parameter", "Ozone depletion", "Global climate change"],
    [
      ["Location", "Stratosphere, 15-35 km", "Troposphere, 0-12 km"],
      ["Primary drivers", "CFCs, halons, carbon tetrachloride", "CO2, CH4, N2O"],
      ["Radiation type", "Ultraviolet (UV-B)", "Infrared (heat)"],
      ["Main hazard", "Skin cancer, cataracts, phytoplankton damage", "Thermal stress, sea-level rise, extreme weather"],
      ["Global treaty", "Montreal Protocol (1987)", "Paris Agreement (2015)"],
    ],
    [95, 200, 257]
  );
  para("Discovered in the 1980s: CFCs release chlorine radicals in the stratosphere that catalytically destroy ozone (O3 + Cl -> ClO + O2). The 1987 Montreal Protocol phased CFCs out globally - stratospheric ozone is now measurably recovering, a genuine environmental success story.");

  /* ========================================================================
     EXAM PRACTICE
     ======================================================================== */
  newPage();
  h1("Exam Practice");
  h2("Section A - Short-Answer Diagnostic Questions");
  const sectionA = [
    ["What is Environmental Science?", "An interdisciplinary problem-solving science studying the environment - air, water, soil, ecosystems, biodiversity, climate, pollution, natural resources - and how human activity interacts with these systems."],
    ["Name the three levels of biodiversity.", "Genetic diversity (DNA variation within a species), species diversity (variety within an ecosystem), ecosystem diversity (variety of habitats/biomes)."],
    ["Distinguish between biotic and abiotic factors.", "Biotic factors are living/once-living components (plants, animals, bacteria); abiotic factors are non-living physical/chemical elements (sunlight, water, temperature, soil pH)."],
    ["Define carrying capacity (K).", "The maximum population size a specific environment can sustainably support long-term without degrading its resources."],
    ["List Earth's four major interconnected spheres.", "Geosphere, hydrosphere, atmosphere, biosphere."],
    ["What is the main difference between point source and non-point source pollution?", "Point source comes from one identifiable location (a factory pipe); non-point source comes from many diffuse, unmapped areas across a region (agricultural runoff)."],
    ["What is an aquifer?", "An underground, permeable layer of rock, gravel or sand that stores and yields significant quantities of fresh groundwater."],
    ["How do renewable and non-renewable energy resources differ?", "Renewables (solar, wind, geothermal) replenish on human timescales; non-renewables (coal, oil, uranium) form over geological timescales and are consumed far faster than they regenerate."],
    ["What wavelength does the stratospheric ozone layer filter?", "High-energy ultraviolet radiation, particularly UV-B."],
    ["Why does a monoculture support lower biodiversity than a native forest?", "A single cultivated species offers uniform structure and limited food variety; a multi-species forest provides diverse food sources and structural niches for many organisms."],
  ];
  sectionA.forEach((qa, i) => {
    para(`${i + 1}. ${qa[0]}`, { size: 9.6, style: "bold", gap: 3 });
    para(`Answer: ${qa[1]}`, { size: 9.2, style: "italic", color: MUT, gap: 9, indent: 10 });
  });

  h2("Section B - Extended Analytical Response (full mark schemes)");
  const sectionB = [
    {
      q: "Explain the 10% energy transfer rule and why top predators are inherently rare. Calculate available energy at the 4th trophic level starting from 50,000 kJ of producer biomass. [4 marks]",
      marks: [
        "The 10% rule: only ~10% of energy stored as biomass at one trophic level transfers to the next; the other ~90% is lost as heat, respiration and waste.",
        "Calculation: L1 = 50,000 kJ; L2 = 5,000 kJ; L3 = 500 kJ; L4 = 50 kJ.",
        "Thermodynamic loss: because available energy drops exponentially, top levels receive a tiny fraction of the original solar energy fixed by producers.",
        "Ecological implication: apex predators need extensive foraging territory for their metabolic demands, which limits population size and keeps them naturally rare.",
      ],
    },
    {
      q: "Compare exponential (J-curve) and logistic (S-curve) growth models, and explain what causes a population to transition between them. [5 marks]",
      marks: [
        "Exponential growth: unbounded acceleration under ideal conditions with essentially unlimited resources.",
        "Logistic growth: growth accelerates, then decelerates, then levels off near carrying capacity (K).",
        "Transition mechanics: as density rises, individuals face environmental resistance - increasing competition for finite resources.",
        "Density-dependent feedback: factors like disease, food competition and waste buildup raise mortality and lower birth rates as density increases.",
        "Equilibrium: this feedback balances births and deaths, stabilising the population near K.",
      ],
    },
    {
      q: "Explain how the IUCN Red List, Key Biodiversity Areas (KBAs) and Alliance for Zero Extinction (AZE) sites work together as a tiered conservation-priority system. [6 marks]",
      marks: [
        "IUCN species level: evaluates individual species' extinction risk using quantitative population/range thresholds.",
        "KBA spatial level: shifts focus from species to geography, identifying sites critical to global biodiversity.",
        "AZE highest priority: the most urgent KBA subset - a site holding the single remaining refuge of a Threatened/Critically Endangered species.",
        "Data synergy: Red List assessments directly feed into KBA and AZE site identification.",
        "Resource allocation: this framework directs limited conservation funding toward the highest-risk areas.",
        "Extinction prevention: protecting an AZE site directly prevents immediate, irreversible species extinction in the wild.",
      ],
    },
    {
      q: "Explain why ozone depletion and global climate change are two distinct atmospheric phenomena, referencing location, causes, radiation dynamics and international agreements. [4 marks]",
      marks: [
        "Layer & gas distinction: ozone depletion occurs in the stratosphere (15-35 km), caused by CFCs; global warming occurs mainly in the troposphere (0-12 km), caused by CO2/CH4/N2O.",
        "Radiation mechanics: ozone filters incoming ultraviolet (UV-B); greenhouse gases trap outgoing infrared (heat) radiation.",
        "Impact: ozone depletion raises skin cancer/cataract risk and harms phytoplankton; climate change causes thermal stress, sea-level rise and shifting weather.",
        "Policy: ozone depletion is addressed by the Montreal Protocol (1987); climate change by agreements such as the Paris Agreement (2015).",
      ],
    },
  ];
  sectionB.forEach((item, i) => {
    ensure(20);
    para(`${i + 1}. ${item.q}`, { size: 9.8, style: "bold", gap: 6 });
    item.marks.forEach((m, mi) => para(`Mark ${mi + 1}: ${m}`, { size: 9, color: MUT, gap: 5, indent: 10 }));
    y += 4;
  });

  /* ------------------------------------------------------------------------
     Glossary
     ------------------------------------------------------------------------ */
  newPage();
  h1("Glossary of Key Terms");
  [
    ["Abiotic factor", "A non-living physical/chemical element of an ecosystem."],
    ["Agroforestry", "Integrating trees and shrubs with crops or livestock on the same land."],
    ["Aquifer", "An underground permeable layer of rock/sand/gravel storing fresh groundwater."],
    ["Biodiversity", "The variety of life at genetic, species and ecosystem levels."],
    ["Biome", "A broad global ecological zone defined by macro-climate (rainforest, tundra, desert)."],
    ["Biotic factor", "A living or once-living component of an ecosystem."],
    ["Carrying capacity (K)", "The maximum population an environment can sustainably support long-term."],
    ["Density-dependent factor", "A limiting factor whose impact strengthens as population density rises."],
    ["Density-independent factor", "A limiting factor whose impact occurs regardless of density."],
    ["Ecoregion", "A specific region within a biome, defined by its own climate, species and landforms."],
    ["Ecosystem services", "Provisioning, regulating, supporting and cultural benefits from nature."],
    ["Edge effect", "Microclimatic/biological change where forest meets cleared land."],
    ["Enhanced greenhouse effect", "Extra warming from human-added greenhouse gases, on top of the natural effect."],
    ["Invasive species", "Non-native, spreads rapidly, causes quantifiable harm - all three, not just one."],
    ["IUCN Red List", "A formal system classifying species by extinction risk."],
    ["Key Biodiversity Area (KBA)", "A site critical to the global persistence of biodiversity."],
    ["Monoculture", "Cultivation of a single crop species over a large area."],
    ["Non-point source pollution", "Pollution from many diffuse, unmapped sources."],
    ["Ocean acidification", "Seawater becoming more acidic as it absorbs excess atmospheric CO2."],
    ["Osmosis", "Water movement across a membrane from lower to higher solute concentration."],
    ["Ozone layer", "A stratospheric layer of O3 that absorbs most ultraviolet light."],
    ["Point source pollution", "Pollution from one identifiable location."],
    ["Population", "Individuals of one species in a specific, named area at the same time."],
    ["Trophic level", "A feeding position in a food chain (producer, primary consumer, etc.)."],
    ["The 10% rule", "Only ~10% of energy transfers from one trophic level to the next."],
  ].forEach(([t, d]) => termBox(t, d));

  footer();
  return doc.output("blob");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.append(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
}

async function handleClick(btn, label, statusEl) {
  const original = label.textContent;
  btn.disabled = true;
  label.textContent = "Building PDF...";
  if (statusEl) statusEl.textContent = "";
  try {
    const jsPDF = await loadJsPDF();
    const blob = buildGuidePDF(jsPDF);
    downloadBlob(blob, "Discovery_Lab_Environmental_Science_Revision_Guide.pdf");
    if (statusEl) statusEl.textContent = "Downloaded.";
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = "Something went wrong building the PDF - try again.";
  } finally {
    btn.disabled = false;
    label.textContent = original;
  }
}

const enBtn = document.getElementById("pdfBtn");
const enLabel = document.getElementById("pdfBtnLabel");
const status = document.getElementById("pdfStatus");
if (enBtn) enBtn.addEventListener("click", () => handleClick(enBtn, enLabel, status));

const esBtn = document.getElementById("pdfBtnEs");
if (esBtn) esBtn.addEventListener("click", () => handleClick(esBtn, esBtn.querySelector("span"), null));
