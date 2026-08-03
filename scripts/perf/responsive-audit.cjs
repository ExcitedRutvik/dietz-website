/**
 * Responsive audit across the breakpoints the site actually uses.
 *
 * Checks the three things that genuinely break a layout, in order of how often
 * they do:
 *   1. Horizontal overflow — the page scrolls sideways, or an element is wider
 *      than the viewport. This is what "not responsive" almost always means.
 *   2. Tap targets under 44px — the accessibility floor for touch.
 *   3. Text smaller than 12px — unreadable on a phone.
 *
 * Reports per page per width. Exits non-zero if anything overflows, because
 * that one is never acceptable.
 *
 *   node scripts/perf/responsive-audit.cjs [baseUrl]
 */
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://localhost:3002";

// 360 is the narrowest phone worth supporting; 768/1024 are the layout's own
// breakpoints; 1280 is where the summary rail appears.
const WIDTHS = [360, 390, 768, 1024, 1280, 1600];

const PAGES = [
  "/",
  "/produkte/",
  "/branchen/",
  "/branchen/automotive/",
  "/unternehmen/",
  "/unternehmen/leistungen/qualitaet/",
  "/karriere/",
  "/wissen/",
  "/glossar/",
  "/downloads/",
  "/kontakt/",
  "/produkte/druckfedern/",
  "/en/",
  "/en/resources/",
  "/en/careers/",
];

(async () => {
  const browser = await chromium.launch();
  let overflowCount = 0;
  const rows = [];

  for (const path of PAGES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        isMobile: width < 768,
        hasTouch: width < 768,
      });
      try {
        await page.goto(BASE + path, { waitUntil: "load", timeout: 90000 });
        await page.waitForTimeout(400);

        const r = await page.evaluate((vw) => {
          const doc = document.documentElement;
          const scrollW = Math.max(doc.scrollWidth, document.body.scrollWidth);
          // Which elements actually stick out. Fixed/absolute decoration that
          // is deliberately off-canvas is excluded by checking computed
          // position, otherwise every gradient edge shows up as a false hit.
          const offenders = [];
          for (const el of document.querySelectorAll("body *")) {
            const cs = getComputedStyle(el);
            // visibility:hidden panels (the closed mega-menu) are laid out but
            // never painted and never scroll the page, so they are not overflow.
            if (cs.position === "fixed" || cs.display === "none") continue;
            if (cs.visibility === "hidden" || cs.opacity === "0") continue;
            if (cs.overflowX === "auto" || cs.overflowX === "scroll") continue;
            const b = el.getBoundingClientRect();
            if (b.width === 0 || b.height === 0) continue;
            if (b.right > vw + 1 || b.left < -1) {
              offenders.push(
                `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]} (${Math.round(b.left)}..${Math.round(b.right)})`,
              );
              if (offenders.length >= 3) break;
            }
          }

          let smallTap = 0;
          if (vw < 768) {
            for (const el of document.querySelectorAll("a, button, summary")) {
              const b = el.getBoundingClientRect();
              if (b.width === 0 || b.height === 0) continue;
              if (b.height < 44) smallTap += 1;
            }
          }

          const tiny = new Map();
          for (const el of document.querySelectorAll("p, li, span, a, h1, h2, h3")) {
            const t = (el.textContent || "").trim();
            if (!t) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none") continue;
            const fs = parseFloat(cs.fontSize);
            if (fs && fs < 12) {
              const key = `${fs}px ${el.tagName.toLowerCase()}.${(el.className||"").toString().split(" ").slice(0,2).join(".")}`;
              tiny.set(key, (tiny.get(key) || 0) + 1);
            }
          }
          const tinyText = [...tiny.values()].reduce((a, b) => a + b, 0);
          const tinySamples = [...tiny.keys()].slice(0, 3);

          return { scrollW, offenders, smallTap, tinyText, tinySamples };
        }, width);

        const overflow = r.scrollW > width + 1;
        if (overflow) overflowCount += 1;
        rows.push({ path, width, overflow, ...r });
      } catch (e) {
        rows.push({ path, width, error: String(e).slice(0, 60) });
      }
      await page.close();
    }
  }

  const bad = rows.filter((r) => r.overflow || r.error || r.tinyText > 0 || r.smallTap > 6);
  if (bad.length === 0) {
    console.log(`OK - ${rows.length} page/width combinations, no overflow, no tiny text`);
  } else {
    for (const r of bad) {
      if (r.error) {
        console.log(`  ERROR   ${r.path} @${r.width}  ${r.error}`);
        continue;
      }
      const flags = [
        r.overflow ? `OVERFLOW scrollW=${r.scrollW}` : "",
        r.tinyText ? `tinyText=${r.tinyText}` : "",
        r.smallTap > 6 ? `smallTaps=${r.smallTap}` : "",
      ]
        .filter(Boolean)
        .join("  ");
      console.log(`  ${r.path} @${r.width}  ${flags}`);
      for (const o of r.offenders || []) console.log(`        overflow: ${o}`);
      for (const o of r.tinySamples || []) console.log(`        tiny: ${o}`);
    }
  }
  console.log(`\n${overflowCount} horizontal-overflow failure(s) across ${rows.length} combinations`);
  await browser.close();
  process.exit(overflowCount === 0 ? 0 : 1);
})();
