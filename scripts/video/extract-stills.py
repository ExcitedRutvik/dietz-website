#!/usr/bin/env python3
"""Extract the stills listed in still-list.json from the company film.

Deliberately driven by a checked-in list rather than by arguments: the choice of
frame is the part that needs a human eye, and recording it — with a note saying
what the shot actually shows — is what stops a still being attached to a page it
does not depict.

To add one:
  1. Contact sheet, and look at it:
       ffmpeg -i <film> -vf "fps=1/10,scale=240:-1,tile=8x12" -frames:v 1 sheet.jpg
     Frame n on the sheet is n*10 seconds in.
  2. Add an entry to still-list.json with a `depicts` note.
  3. Re-run this. Existing files are left alone.

The film lives outside the repository (380 MB); this script is a no-op without
it, which is fine — the extracted stills are committed, the source is not.
"""
import json
import os
import subprocess
import sys

LIST = "scripts/video/still-list.json"


def main():
    spec = json.load(open(LIST))
    src = spec["source"]
    if not os.path.exists(src):
        print(f"source film not present at {src} - nothing to do")
        print("(the extracted stills are committed; the film is not)")
        return 0

    out_dir = spec["outputDir"]
    os.makedirs(out_dir, exist_ok=True)
    made = 0

    for s in spec["stills"]:
        dest = os.path.join(out_dir, f"{s['name']}.jpg")
        if os.path.exists(dest):
            continue
        cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-ss", str(s["t"]), "-i", src,
            "-vf", f"crop={spec['crop']}",
            "-frames:v", "1", "-q:v", "3", dest, "-y",
        ]
        subprocess.run(cmd, check=True)
        made += 1
        print(f"  {dest}  ({s['t']}s) - {s['depicts'][:60]}...")

    print(f"extracted {made} still(s); {len(spec['stills'])} listed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
