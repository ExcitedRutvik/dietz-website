#!/usr/bin/env python3
"""Right-size the static images in public/images to how they are actually used.

`next.config.ts` sets `images: { unoptimized: true }` (required for static
export), so whatever is on disk is exactly what ships — nothing resizes these
at build or request time. Several were shipping at print resolution for a slot
a few dozen pixels tall: the EMAS certificate was a 1308x2258 / 2.4MB JPEG
rendered into a 48px-high badge.

Budgets below are the rendered CSS size, doubled for retina, then rounded up.
Aspect ratio is always preserved; nothing is upscaled and no file is replaced
if the re-encode came out larger.
"""
import io, os, sys, glob
from PIL import Image

# dir -> (max long edge px, quality).  Rendered sizes:
#   certs/badges  h-12 / h-9  -> <=48px tall
#   posters       full-bleed establishing images on the non-cinematic branch
#   products/services  GlassCard, 22-24rem wide (~384px)
#   teasers/career/industries/company/sustainability  cards & inline blocks
BUDGET = {
    "live":          (1280, 80),
    "certs":          (256, 82),
    "badges":         (256, 82),
    "posters":       (1600, 80),
    "products":      (1024, 80),
    "services":      (1024, 80),
    "teasers":       (1280, 80),
    "career":        (1280, 80),
    "industries":    (1280, 80),
    "company":       (1280, 80),
    "sustainability": (512, 82),
    # Film stills (scripts/video/extract-stills.py) come out at the source's
    # 1920x824. They are used as full-column lead images, which tops out around
    # 820 CSS px, so 1280 still leaves headroom on a 2x display.
    "stills":        (1280, 80),
}

def main(root="public/images"):
    tb = ta = 0
    changed = 0
    for path in sorted(glob.glob(f"{root}/**/*.*", recursive=True)):
        ext = os.path.splitext(path)[1].lower()
        if ext not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        cat = os.path.relpath(path, root).split(os.sep)[0]
        if cat not in BUDGET:
            continue
        cap, q = BUDGET[cat]
        before = os.path.getsize(path)
        tb += before
        try:
            im = Image.open(path)
        except Exception:
            ta += before; continue
        has_alpha = im.mode in ("RGBA", "LA", "P")
        im2 = im.convert("RGBA" if has_alpha else "RGB")
        long_edge = max(im2.size)
        if long_edge > cap:
            scale = cap / long_edge
            im2 = im2.resize((max(1, round(im2.width*scale)), max(1, round(im2.height*scale))), Image.LANCZOS)
        buf = io.BytesIO()
        if ext == ".png" and has_alpha:
            im2.save(buf, "PNG", optimize=True)
        elif ext == ".png":
            im2.convert("RGB").save(buf, "PNG", optimize=True)
        else:
            im2.convert("RGB").save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        data = buf.getvalue()
        if len(data) < before:
            open(path, "wb").write(data)
            ta += len(data); changed += 1
        else:
            ta += before
    print(f"images: {tb/1e6:.1f}MB -> {ta/1e6:.1f}MB ({100*ta/tb:.0f}%), {changed} files rewritten")

if __name__ == "__main__":
    main(*sys.argv[1:])
