#!/usr/bin/env python3
"""Re-encode extracted frames for delivery weight.

The extraction script optimises for per-frame fidelity (q88, native sensor
pixels, no downscale). That is the right call for mastering, but it ignores
that EVERY frame of a section is fetched over the network before the scrub can
run smoothly — the hero alone was 19MB, eagerly, on first paint. Network, not
decode, is what makes the scrub stutter.

So this pass trades quantisation headroom the viewer cannot see (the copy sits
over a scrim, and the canvas upscales anyway) for bytes that arrive sooner:
  * normalise every section to 1600px wide — hero/sustainability came from the
    drone clip at 1920 and were never cropped like the film sections were
  * q78 instead of q88

Run after 02-extract-section-frames.sh; update videoManifest.ts if counts move
(they don't here — this only re-encodes, never drops frames).
"""
import io, os, sys, glob
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

TARGET_W = 1600
QUALITY = 78

def one(path):
    before = os.path.getsize(path)
    im = Image.open(path).convert("RGB")
    if im.width != TARGET_W:
        im = im.resize((TARGET_W, round(im.height * TARGET_W / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=QUALITY, method=6)
    data = buf.getvalue()
    if len(data) < before:                 # never make a frame bigger
        with open(path, "wb") as fh:
            fh.write(data)
        return before, len(data)
    return before, before

if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "public/frames"
    files = sorted(glob.glob(f"{root}/*/*.webp"))
    print(f"re-encoding {len(files)} frames -> {TARGET_W}px wide, q{QUALITY}")
    tb = ta = 0
    with ProcessPoolExecutor() as ex:
        for i, (b, a) in enumerate(ex.map(one, files, chunksize=8), 1):
            tb += b; ta += a
            if i % 100 == 0:
                print(f"  {i}/{len(files)}  {tb/1e6:.0f}MB -> {ta/1e6:.0f}MB", flush=True)
    print(f"\ndone: {tb/1e6:.1f}MB -> {ta/1e6:.1f}MB  ({100*ta/tb:.0f}%, saved {(tb-ta)/1e6:.0f}MB)")
