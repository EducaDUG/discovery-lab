#!/usr/bin/env python3
"""
Thumbnail capture server for Discovery Lab activities.

A simulation's tile shows a short, seamlessly-looping GIF of the activity's best
moment (e.g. the rotating germination chamber). We can't render Three.js from
Python, so the browser does the rendering and this server does the encoding:

  1. Start this server:            python tools/make-thumbnail.py
  2. Open the capture harness in a browser (the in-app browser is fine):
         http://localhost:8777/tools/capture/germinator.html
     It builds the 3D scene, orbits the camera a FULL 360 degrees (so the last
     frame meets the first with no seam), composites each frame onto the
     chamber's dark background, and POSTs the frames here.
  3. The harness then calls /assemble, and Pillow writes the looping GIF to the
     activity folder named in the harness's ?out= parameter.

Frames land in a scratch dir; only the finished GIF is committed. Reusable for
any future activity: point a new harness at the same endpoints with its own
?out= path.
"""

import io
import pathlib
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from PIL import Image

REPO = pathlib.Path(__file__).resolve().parent.parent
FRAMES = REPO / "tools" / "capture" / "_frames"
PORT = 8777


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(REPO), **kw)

    def log_message(self, fmt, *args):
        pass  # quiet

    def _ok(self, body=b"ok", ctype="text/plain"):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/frame/"):
            idx = int(parsed.path.rsplit("/", 1)[1])
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            FRAMES.mkdir(parents=True, exist_ok=True)
            (FRAMES / f"frame_{idx:04d}.png").write_bytes(data)
            self._ok()
            return
        if parsed.path == "/pdf":  # test-capture channel for the evidence PDF
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            FRAMES.mkdir(parents=True, exist_ok=True)
            (FRAMES / "evidence-test.pdf").write_bytes(data)
            self._ok()
            return
        self.send_error(404)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/reset":
            if FRAMES.exists():
                for f in FRAMES.glob("frame_*.png"):
                    f.unlink()
            self._ok()
            return
        if parsed.path == "/assemble":
            q = urllib.parse.parse_qs(parsed.query)
            out = q.get("out", [""])[0]
            duration = int(q.get("duration", ["90"])[0])
            colors = int(q.get("colors", ["96"])[0])
            msg = assemble(out, duration, colors)
            self._ok(msg.encode("utf-8"))
            return
        super().do_GET()


def assemble(out_rel, duration, colors):
    if not out_rel:
        return "ERROR: no ?out= path given"
    out_path = (REPO / out_rel).resolve()
    if REPO not in out_path.parents:
        return f"ERROR: refusing to write outside repo: {out_path}"

    files = sorted(FRAMES.glob("frame_*.png"))
    if not files:
        return "ERROR: no frames received"

    frames = [Image.open(f).convert("RGB") for f in files]
    # One shared palette (built from a mid-rotation frame) so colours don't
    # shimmer between frames — the scene's materials are constant, only the
    # camera moves, so a single frame's palette covers the whole loop.
    pal_src = frames[len(frames) // 3]
    palette = pal_src.quantize(colors=colors, method=Image.FASTOCTREE)
    quant = [f.quantize(palette=palette, dither=Image.FLOYDSTEINBERG) for f in frames]

    out_path.parent.mkdir(parents=True, exist_ok=True)
    quant[0].save(
        out_path,
        save_all=True,
        append_images=quant[1:],
        loop=0,
        duration=duration,
        disposal=2,
        optimize=True,
    )
    kb = out_path.stat().st_size / 1024
    return f"OK wrote {out_rel} ({len(files)} frames, {kb:.0f} KB)"


if __name__ == "__main__":
    if len(sys.argv) > 1:
        PORT = int(sys.argv[1])
    print(f"thumbnail server on http://localhost:{PORT}  (serving {REPO})")
    print(f"frames -> {FRAMES}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
