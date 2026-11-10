"""Write credits/index.html (every tile photo, its photographer, licence and source) and a contact sheet for review."""
import json, pathlib, html
REPO = pathlib.Path(__file__).resolve().parent.parent
cr = json.loads((REPO / "assets" / "tile-photos" / "credits.json").read_text(encoding="utf-8"))
data = json.loads((REPO / "data" / "subjects.json").read_text(encoding="utf-8"))
names = {}
def walk(ns, trail):
    for n in ns:
        p = trail + [n["id"]]; names["/".join(p)] = n.get("name", n["id"])
        if n.get("type") not in ("simulation", "guide"): walk(n.get("children", []), p)
walk(data["tree"], [])
rows = []
for k, v in cr.items():
    lic = html.escape(v["license"]); lu = v.get("license_url")
    lic_html = f'<a href="{html.escape(lu)}" rel="noopener">{lic}</a>' if lu else lic
    rows.append(f'<li><img src="../assets/tile-photos/{v["file"]}" alt="" width="120" height="80" loading="lazy">'
                f'<div><strong>{html.escape(names.get(k, k))}</strong><br>{html.escape(v["author"][:120])} &middot; {lic_html} &middot; '
                f'<a href="{html.escape(v["page"] or "")}" rel="noopener">Wikimedia Commons</a></div></li>')
page = f'''<!DOCTYPE html>
<html lang="en" data-theme="earth" data-age-band="secondary" data-tint="paper" data-text-size="m">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Photo credits | Discovery Lab</title>
<meta name="description" content="Photographers and licences for the real photographs on Discovery Lab, all from Wikimedia Commons under CC0, public domain, CC BY or CC BY-SA.">
<link rel="stylesheet" href="../engine/style.css?v=29">
<style>.cr{{list-style:none;padding:0;display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,26rem),1fr))}}
.cr li{{display:flex;gap:1rem;align-items:center;background:#fff;border:1px solid var(--line);border-radius:12px;padding:.8rem}}
.cr img{{border-radius:8px;object-fit:cover;flex:none}} .cr div{{font-size:.9rem}}</style></head>
<body><header class="site-head"><div class="shell site-head__inner"><a class="wordmark" href="../"><span class="wordmark__text">Discovery Lab</span></a></div></header>
<main id="main"><div class="shell" style="padding-block:3rem"><h1>Photo credits</h1>
<p>Every photograph on Discovery Lab is a real photograph (none are AI-generated) from Wikimedia Commons, used under CC0, public domain, CC BY or CC BY-SA. Thank you to the photographers.</p>
<ul class="cr">{"".join(rows)}</ul></div></main></body></html>'''
out = REPO / "credits"; out.mkdir(exist_ok=True); (out / "index.html").write_text(page, encoding="utf-8")
print("credits page:", len(rows), "photos")
