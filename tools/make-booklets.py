#!/usr/bin/env python3
"""Build the downloadable Discovery Lab revision booklets (CLAUDE.md section 17).
Each exam has English and Spanish content (tools/booklets/examN.py exports DATA = {"en": {...}, "es": {...}}).
The HTML is printed to PDF by headless Microsoft Edge, so the booklet keeps the Discovery Lab look (gradient cover,
coloured lesson pages, key-idea cards, check-yourself boxes, checklist, answer key).
Usage: python tools/make-booklets.py [1] [2] [3]      (default: all)"""
import importlib.util, os, subprocess, sys, html, tempfile, pathlib
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
SITE = ROOT / "secondary/a-level-pathway/lower-secondary/science/lower-secondary-stage-2"
SITE_S1BIO = ROOT / "secondary/a-level-pathway/lower-secondary/science/lower-secondary-stage-1/biology"

UI = {
    "en": dict(name="Name", cls="Class", date="Date", key="Key ideas", fact="Did you know?", check="Check yourself", task="Revision task", answers="Answer key",
               final="Final practice", challenge="Challenge", checklist="Revision checklist", done="Done?", cover_sub="Discovery Lab revision booklet",
               topics="What is inside", live="Try it live", live_note="Practise with 3D labs, games and a practice exam at", good="You are going to do great! Use this booklet to plan your study time, then bring it all together.",
               lesson="Lesson", page="Page", tick="Tick each box when you can answer without looking.", ans_note="Check your own answers against these. If one is hard, go back to the lesson."),
    "es": dict(name="Nombre", cls="Clase", date="Fecha", key="Ideas clave", fact="¿Sabías que…?", check="Compruébalo tú", task="Tarea de repaso", answers="Respuestas",
               final="Práctica final", challenge="Desafío", checklist="Lista de repaso", done="¿Hecho?", cover_sub="Cuadernillo de repaso de Discovery Lab",
               topics="Qué contiene", live="Pruébalo en vivo", live_note="Practica con laboratorios 3D, juegos y un examen de práctica en", good="¡Te va a ir genial! Usa este cuadernillo para organizar tu estudio y luego junta todo lo aprendido.",
               lesson="Lección", page="Página", tick="Marca cada casilla cuando sepas responder sin mirar.", ans_note="Compara tus respuestas con estas. Si alguna te cuesta, vuelve a la lección.")
}
COLORS = ["#16a06f", "#2f7dd1", "#c9791b", "#8a4fc0", "#c43a52", "#12998a"]

CSS = """
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#17251f;font-size:11.2pt;line-height:1.45}
h1,h2,h3{font-family:Georgia,'Times New Roman',serif;margin:0}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;padding:11mm 14mm 14mm}
.cover{background:radial-gradient(120% 100% at 85% 8%,#14503b 0,#0b1f18 55%,#07130f 100%);color:#e8f4ee;padding:22mm 18mm}
.cover .brand{display:flex;align-items:center;gap:10px;font-family:Georgia,serif;font-size:16pt;color:#fff}
.cover .brand svg{width:34px;height:34px}
.cover h1{font-size:44pt;line-height:1.02;margin:46mm 0 6mm;color:#fff}
.cover h1 em{font-style:normal;background:linear-gradient(90deg,#7dffd0,#f3d36b);-webkit-background-clip:text;background-clip:text;color:transparent}
.cover .sub{font-size:15pt;color:#cfe6dc;max-width:130mm}
.cover .pill{display:inline-block;padding:3mm 5mm;border-radius:99px;background:#ffffff1c;color:#9ff0cc;font-weight:700;font-size:10.5pt;margin-bottom:6mm}
.cover .topics{position:absolute;left:18mm;right:18mm;bottom:50mm;display:flex;flex-wrap:wrap;gap:6px}
.cover .topics span{padding:2mm 4mm;border-radius:99px;border:1.5px solid var(--c);color:#fff;font-weight:700;font-size:10pt}
.cover .who{position:absolute;left:18mm;right:18mm;bottom:20mm;display:grid;grid-template-columns:1fr 1fr 0.7fr;gap:8mm;font-size:10pt;color:#9bbdb0}
.cover .who div{border-bottom:1.5px solid #ffffff55;padding-bottom:2mm}
.cover .orbit{position:absolute;right:-42mm;top:112mm;width:120mm;height:120mm;opacity:.9}
.band{display:flex;align-items:center;gap:5mm;padding:4.5mm 7mm;border-radius:6mm;color:#fff;background:linear-gradient(110deg,var(--c),#0b1f18 140%);margin-bottom:3mm}
.band .num{width:15mm;height:15mm;border-radius:4.5mm;background:#ffffff26;display:grid;place-items:center;font-family:Georgia,serif;font-size:20pt;font-weight:700}
.band small{display:block;font-size:9.5pt;letter-spacing:.08em;text-transform:uppercase;opacity:.85}
.band h2{font-size:19pt;line-height:1.05}
.band p{margin:1mm 0 0;opacity:.92;font-size:9.6pt}
h3.sec{font-size:12pt;color:var(--c);margin:3.2mm 0 1.8mm;display:flex;align-items:center;gap:2.5mm}
h3.sec i{display:inline-block;width:5mm;height:5mm;border-radius:2mm;background:var(--c)}
.ideas{display:grid;grid-template-columns:1fr 1fr;gap:2.2mm}
.idea{border:1.6px solid color-mix(in srgb,var(--c) 45%,#fff);background:color-mix(in srgb,var(--c) 7%,#fff);border-radius:4mm;padding:2.4mm 3.4mm;font-size:10.1pt;line-height:1.38;page-break-inside:avoid}
.idea b{color:var(--c)}
.fact{margin-top:3mm;padding:2.6mm 4mm;border-radius:4mm;background:#fff6dc;border-left:2.2mm solid #f0b429;font-size:10.1pt}
.fact b.t{display:block;text-transform:uppercase;letter-spacing:.07em;font-size:8.8pt;color:#a06a00;margin-bottom:1mm}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:9.9pt;border-radius:3.5mm;overflow:hidden;border:1.4px solid color-mix(in srgb,var(--c) 40%,#fff);margin-top:2.2mm}
th,td{padding:1.4mm 2.8mm;text-align:left;border-bottom:1px solid #e3ebe6;vertical-align:top}
thead th{background:var(--c);color:#fff;font-family:Georgia,serif}
tbody th{color:var(--c);background:color-mix(in srgb,var(--c) 7%,#fff)}
tr:last-child td,tr:last-child th{border-bottom:0}
.q{list-style:none;margin:0;padding:0;display:grid;gap:1.2mm}
.q li{display:flex;gap:2.6mm;align-items:flex-start;padding:1.7mm 3.2mm;border-radius:3mm;background:#f2f7f4;font-size:10.3pt}
.q li:before{content:"";flex:none;width:4.6mm;height:4.6mm;border:1.8px solid var(--c);border-radius:1.4mm;margin-top:.6mm;background:#fff}
.task{margin-top:3mm;padding:2.6mm 4mm;border-radius:4mm;border:2px dashed var(--c);background:#fff;font-size:10.1pt}
.task b.t{display:block;color:var(--c);text-transform:uppercase;letter-spacing:.07em;font-size:8.8pt;margin-bottom:1mm}
.draw{height:16mm;border:1.4px solid #cfdad4;border-radius:3mm;margin-top:3mm;background:repeating-linear-gradient(0deg,#fff 0 6mm,#eef4f0 6mm 6.4mm)}
.foot{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:8.5pt;color:#7a8b84}
.live{margin-top:3mm;padding:3mm 5mm;border-radius:4mm;background:#0b1f18;color:#cfe6dc;font-size:10pt}
.live b{color:#7dffd0}
.final{--c:#c43a52}
.check td{padding:2.4mm 4mm}
.box{display:inline-block;width:5mm;height:5mm;border:1.8px solid #16a06f;border-radius:1.4mm;vertical-align:middle}
.ans ol{margin:0;padding-left:5mm;display:grid;gap:.8mm;font-size:9.2pt}
.ans h4{margin:2mm 0 .8mm;font-family:Georgia,serif;color:var(--c);font-size:11.5pt}
.end{background:radial-gradient(120% 100% at 85% 8%,#14503b 0,#0b1f18 70%);color:#e8f4ee}
.end h2{color:#fff;font-size:26pt;margin-top:60mm}
.svgc{display:block;margin:3mm auto 0}
"""

LOGO = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="#fff" stroke-width="1.5" opacity=".35"/><circle cx="32" cy="32" r="19" fill="none" stroke="#fff" stroke-width="1.5" opacity=".2"/><path d="M32 32 A27 27 0 0 1 53 21" fill="none" stroke="#3fd9a0" stroke-width="3" stroke-linecap="round"/><circle cx="45" cy="22" r="5" fill="#f3d36b"/><circle cx="32" cy="32" r="2.5" fill="#fff"/></svg>'
ORBIT = '<svg class="orbit" viewBox="0 0 200 200"><g fill="none" stroke="#7dffd0" opacity=".35"><circle cx="100" cy="100" r="90" stroke-width="1.5"/><circle cx="100" cy="100" r="62" stroke-width="1.5"/><circle cx="100" cy="100" r="34" stroke-width="1.5"/></g><circle cx="190" cy="100" r="9" fill="#f3d36b"/><circle cx="100" cy="38" r="7" fill="#3fd9a0"/><circle cx="76" cy="124" r="6" fill="#ff9d8d"/><circle cx="100" cy="100" r="11" fill="#fff"/></svg>'

def e(s): return s  # content is authored as safe HTML

def build(lang, d, exam_no, url):
    u = UI[lang]; n_pages = [0]
    def foot(): n_pages[0] += 1; return f'<div class="foot"><span>Discovery Lab · {d["short"]}</span><span>{u["page"]} {n_pages[0]}</span></div>'
    parts = []
    topics = "".join(f'<span style="--c:{COLORS[i % 6]}">{u["lesson"]} {L["num"]}: {L["title"]}</span>' for i, L in enumerate(d["lessons"]))
    parts.append(f'''<section class="page cover"><div class="brand">{LOGO}<span>Discovery&nbsp;Lab</span></div>{ORBIT}
<h1>{d["cover_title"]}</h1><div class="pill">{d["course"]}</div><p class="sub">{d["cover_sub"]}</p>
<div class="topics">{topics}</div>
<div class="who"><div>{u["name"]}:</div><div>{u["cls"]}:</div><div>{u["date"]}:</div></div></section>''')
    for i, L in enumerate(d["lessons"]):
        c = COLORS[i % 6]
        ideas = "".join(f'<div class="idea">{x}</div>' for x in L["ideas"])
        table = ""
        if L.get("table"):
            t = L["table"]
            table = '<table><thead><tr>' + "".join(f"<th>{h}</th>" for h in t["head"]) + '</tr></thead><tbody>' + "".join("<tr>" + f"<th>{r[0]}</th>" + "".join(f"<td>{x}</td>" for x in r[1:]) + "</tr>" for r in t["rows"]) + '</tbody></table>'
        extra = L.get("svg", "")
        qs = "".join(f"<li>{q}</li>" for q in L["questions"])
        parts.append(f'''<section class="page" style="--c:{c}"><div class="band"><div class="num">{L["num"]}</div><div><small>{u["lesson"]} {L["num"]}</small><h2>{L["title"]}</h2><p>{L["intro"]}</p></div></div>
<h3 class="sec"><i></i>{u["key"]}</h3><div class="ideas">{ideas}</div>{table}{extra}
<div class="fact"><b class="t">{u["fact"]}</b>{L["fact"]}</div>
<h3 class="sec"><i></i>{u["check"]}</h3><ul class="q">{qs}</ul>
<div class="task"><b class="t">{u["task"]}</b>{L["task"]}<div class="draw"></div></div>{foot()}</section>''')
    fin = d["final"]
    fq = "".join(f"<li>{q}</li>" for q in fin["questions"])
    cl = "".join(f'<tr><td>{x}</td><td style="width:18mm;text-align:center"><span class="box"></span></td></tr>' for x in d["checklist"])
    parts.append(f'''<section class="page final" style="--c:#c43a52"><div class="band"><div class="num">?</div><div><small>{u["final"]}</small><h2>{u["final"]}</h2><p>{u["tick"]}</p></div></div>
<h3 class="sec"><i></i>{u["final"]}</h3><ul class="q">{fq}</ul>
<div class="task"><b class="t">{u["challenge"]}</b>{fin["challenge"]}<div class="draw" style="height:30mm"></div></div>
<h3 class="sec"><i></i>{u["checklist"]}</h3><table class="check"><thead><tr><th>{u["task"]}</th><th>{u["done"]}</th></tr></thead><tbody>{cl}</tbody></table>
<div class="live"><b>{u["live"]}</b> · {u["live_note"]} <b>{url}</b></div>{foot()}</section>''')
    def ans_block(L): return f'<h4>{u["lesson"]} {L["num"]}: {L["title"]}</h4><ol>' + "".join(f"<li>{a}</li>" for a in L["answers"]) + "</ol>"
    ans2 = "<h4>" + u["final"] + "</h4><ol>" + "".join(f"<li>{a}</li>" for a in fin["answers"]) + "</ol>"
    chunks = [d["lessons"]] if len(d["lessons"]) <= 7 else [d["lessons"][:5], d["lessons"][5:]]
    for ci, ch in enumerate(chunks):
        body = "".join(ans_block(L) for L in ch) + (ans2 if ci == len(chunks) - 1 else "")
        parts.append(f'''<section class="page ans" style="--c:#12998a"><div class="band" style="--c:#12998a"><div class="num">✔</div><div><small>{u["answers"]}</small><h2>{u["answers"]}</h2><p>{u["ans_note"]}</p></div></div>{body}{foot()}</section>''')
    parts.append(f'''<section class="page end"><div class="brand cover" style="background:none;padding:0;display:flex;gap:10px;align-items:center;font-family:Georgia,serif;font-size:16pt;color:#fff">{LOGO.replace('<svg','<svg width="34" height="34"')}<span>Discovery&nbsp;Lab</span></div><h2>{u["good"]}</h2><p style="margin-top:8mm;color:#9bbdb0">Mr Guevara · {url}</p></section>''')
    return f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>{d["cover_title"]}</title><style>{CSS}</style></head><body>{"".join(parts)}</body></html>'

def load(n):
    spec = importlib.util.spec_from_file_location(f"exam{n}", HERE / "booklets" / (f"exam{n}.py" if str(n).isdigit() else f"{n}.py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m.DATA

def main():
    wanted = [int(a) if a.isdigit() else a for a in sys.argv[1:]] or [1, 2, 3]
    for n in wanted:
        data = load(n); folder = SITE / f"exam-{n}-revision"
        if not str(n).isdigit(): folder = SITE_S1BIO / "exam-1-revision"; n = 1  # "s1bio1" = Stage 1 Biology Exam 1
        for lang in ("en", "es"):
            h = build(lang, data[lang], n, "morehumaned.com/discovery-lab")
            tmp = pathlib.Path(tempfile.gettempdir()) / f"dl-booklet-{n}-{lang}.html"; tmp.write_text(h, encoding="utf8")
            out = folder / f"Exam-{n}-Revision-Booklet-{lang.upper()}.pdf"
            subprocess.run([EDGE, "--headless=new", f"--user-data-dir={tempfile.mkdtemp(prefix='dl-edge-')}", "--no-first-run", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={out}", tmp.as_uri()], check=True, capture_output=True, timeout=120)
            import time
            for _ in range(60):
                if out.exists() and out.stat().st_size > 1000: break
                time.sleep(0.5)
            print(out.name, out.stat().st_size // 1024, "KB")
if __name__ == "__main__": main()
