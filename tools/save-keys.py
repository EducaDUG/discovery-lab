#!/usr/bin/env python3
"""Tiny local helper for translating revision sites (CLAUDE.md section 17).
Run it, then in the browser console of a revision page run:
  fetch("http://localhost:8778/exam3", {method:"POST", body: JSON.stringify([...window.__dlKeys])})
It writes tools/es-src/<name>.keys.json so the English strings can be translated line by line."""
import http.server, json, os
OUT = os.path.join(os.path.dirname(__file__), "es-src")
class H(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204); self._c(); self.end_headers()
    def _c(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "*"); self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); body = self.rfile.read(n).decode("utf8")
        name = self.path.strip("/") or "keys"
        keys = [k for k in json.loads(body) if k and any(c.isalpha() for c in k)]
        with open(os.path.join(OUT, name + ".keys.json"), "w", encoding="utf8") as f: json.dump(keys, f, ensure_ascii=False, indent=0)
        self.send_response(200); self._c(); self.end_headers(); self.wfile.write(str(len(keys)).encode())
http.server.HTTPServer(("127.0.0.1", 8778), H).serve_forever()
