#!/usr/bin/env python3
"""
Check every external simulation link in data/subjects.json.

External links rot. A dead link on a course page is worse than no link, so run
this occasionally - it takes seconds:

    python tools/check-links.py

Exits non-zero if anything is broken, so it can gate a commit if you ever want
it to. Reports redirects too: a moved link still works, but the URL in
subjects.json should be updated to the new one.
"""

import json
import pathlib
import ssl
import sys
import urllib.error
import urllib.request

REPO = pathlib.Path(__file__).resolve().parent.parent
DATA = REPO / "data" / "subjects.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DiscoveryLab link check)"}
TIMEOUT = 20


def collect(node, trail, out):
    where = trail + [node.get("name", node.get("id", "?"))]
    for r in node.get("resources", []):
        out.append((" / ".join(where), r))
    for child in node.get("children", []):
        collect(child, where, out)


def check(url):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers=UA, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as res:
            final = res.geturl()
            return res.status, (final if final.rstrip("/") != url.rstrip("/") else None), None
    except urllib.error.HTTPError as e:
        return e.code, None, None
    except Exception as e:
        return None, None, type(e).__name__


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    found = []
    for node in data["tree"]:
        collect(node, [], found)

    if not found:
        print("no external links in subjects.json yet")
        return 0

    print(f"checking {len(found)} external link(s)\n")
    bad = 0
    for where, r in found:
        status, redirect, err = check(r["url"])
        if err:
            print(f"  FAIL  {r['title']}  ({where})\n        {r['url']}\n        {err}")
            bad += 1
        elif status and 200 <= status < 300:
            note = f"\n        now redirects to {redirect}" if redirect else ""
            print(f"  ok    {r['title']}  [{status}]{note}")
        else:
            print(f"  DEAD  {r['title']}  ({where})  [{status}]\n        {r['url']}")
            bad += 1

    print()
    print(f"{len(found) - bad} ok, {bad} needing attention")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
