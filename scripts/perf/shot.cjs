/**
 * Screenshot helper for visual checks during development.
 *
 * Usage: node scripts/perf/shot.cjs <path> <outfile> [width] [--full]
 *   node scripts/perf/shot.cjs /branchen/ /tmp/branchen.png 1440 --full
 */
const { chromium } = require("playwright");

const path = process.argv[2] || "/";
const out = process.argv[3] || "/tmp/shot.png";
const width = Number(process.argv[4]) || 1440;
const full = process.argv.includes("--full");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`http://localhost:3002${path}`, {
    waitUntil: "load",
    timeout: 120000,
  });
  // Card thumbs are lazy, so a full-page shot of an unscrolled page catches
  // them mid-flight. Walk the page once to trigger them, then come back.
  if (full) {
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out, fullPage: full });
  await browser.close();
  console.log(`${path} -> ${out} @${width}`);
})();
