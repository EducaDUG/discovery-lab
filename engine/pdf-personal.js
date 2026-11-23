/* Discovery Lab: personalised evidence PDFs.
   Shared by every PDF builder (lab report, submission receipt, external-practice evidence) so that every
   report, existing or new, names the student in a running page header and a few sentences in the text,
   the way a school report written for that child would. Strings here are local (en/es) on purpose:
   they never touch the shared i18n dictionary, so no cache-version bump is needed to change them.
   All text must already be safe for jsPDF's Latin-1 font: callers pass names through pdfSafe(). */

const isEs = () => { try { return (localStorage.getItem("dl-lang") || "en").slice(0, 2) === "es"; } catch { return false; } };
const first = name => String(name || "").trim().split(/\s+/)[0] || "";

/* Running header on every page: "<Student>  |  <Activity name>", with a hairline under it. */
export function stampHeader(doc, { W, M, name, title, mut = [110, 118, 112], line = [200, 205, 198] }) {
  const total = doc.internal.getNumberOfPages();
  const RIGHT = W - M;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(mut[0], mut[1], mut[2]);
    doc.text(name, M, 28);
    doc.setFont("helvetica", "normal");
    const room = RIGHT - M - doc.getTextWidth(name) - 24;
    let t = title;
    while (t.length > 4 && doc.getTextWidth(t) > room) t = t.slice(0, -2);
    if (t !== title) t = t.trim() + "...";
    doc.text(t, RIGHT, 28, { align: "right" });
    doc.setDrawColor(line[0], line[1], line[2]); doc.setLineWidth(0.5); doc.line(M, 34, RIGHT, 34);
  }
}

/* Opening sentences for the "About this activity" section. */
export function introText({ student, activity, differentiated }) {
  const n = first(student);
  if (!n) return "";
  const es = isEs();
  let s = es
    ? `Este informe se ha preparado especialmente para ${n}, a partir de lo que ${n} hizo y respondió en la actividad "${activity}".`
    : `This report was prepared for ${n}, based on what ${n} did and answered in the activity "${activity}".`;
  if (differentiated) s += es
    ? ` Esta actividad se ha diferenciado: las preguntas se han adaptado al nivel de ${n}.`
    : ` This activity has been differentiated: its questions were adapted to ${n}'s level.`;
  return s;
}

/* Short closing note that talks to the student. pct is the auto-marked percentage if known. */
export function closingText({ student, pct }) {
  const n = first(student);
  if (!n) return "";
  const es = isEs();
  const strong = typeof pct === "number" && pct >= 80;
  if (es) return strong
    ? `Buen trabajo, ${n}: tu comprensión se nota en estas respuestas. Sigue así y prueba el siguiente reto cuando quieras.`
    : `Gracias por tu esfuerzo, ${n}. Revisa las respuestas que te quedaron dudosas y vuelve a intentarlo cuando quieras: así es como se aprende.`;
  return strong
    ? `Well done, ${n}: your understanding shows in these answers. Keep going, and try the next challenge whenever you are ready.`
    : `Thank you for your effort, ${n}. Look again at any answers you were unsure about and have another go whenever you like: that is how learning works.`;
}

export default { stampHeader, introText, closingText };
