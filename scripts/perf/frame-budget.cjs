/**
 * Measures the homepage's image-fetch behaviour: how many frame requests go
 * out, how many are ever in flight at once, and how long the certification
 * marks at the foot of the page take to arrive.
 *
 * Those three numbers are the ones that moved when the per-section fetch pools
 * were replaced by a single budgeted scheduler (see
 * src/components/scroll/frameFetchScheduler.ts). Before that change the page
 * queued all 824 frames across five sections at 8-wide each, so the 64KB of
 * cert marks landed dead last.
 *
 * Usage: node scripts/perf/frame-budget.cjs [url] [--scroll]
 *   default url http://localhost:3002/
 *   --scroll  drive a full top -> bottom -> top pass first
 */
const { chromium } = require("playwright");

const URL = process.argv[2]?.startsWith("http")
  ? process.argv[2]
  : "http://localhost:3002/";
const DO_SCROLL = process.argv.includes("--scroll");
// Contention only hurts when bandwidth is scarce. On localhost every request is
// effectively free, so the queueing cost this script exists to measure is
// invisible unless the link is throttled.
const THROTTLE = process.argv.includes("--throttle");
const SETTLE_MS = 3000;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  if (THROTTLE) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbit/s
      uploadThroughput: (1 * 1024 * 1024) / 8,
    });
  }

  const reqs = [];
  page.on("request", (r) => {
    reqs.push({ url: r.url(), start: Date.now(), end: null });
  });
  page.on("requestfinished", (r) => {
    const rec = reqs.find((x) => x.url === r.url() && x.end === null);
    if (rec) rec.end = Date.now();
  });
  page.on("requestfailed", (r) => {
    const rec = reqs.find((x) => x.url === r.url() && x.end === null);
    if (rec) rec.end = Date.now();
  });

  const t0 = Date.now();
  await page.goto(URL, { waitUntil: "load", timeout: 120000 });

  if (DO_SCROLL) {
    // Lenis intercepts wheel events and the five pinned sections make the page
    // very tall, so a fixed step count does not reliably reach the bottom.
    // Drive until the certification section — the thing the reader complained
    // about — has actually been on screen, then come back up.
    let guard = 0;
    while (guard++ < 400) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(45);
      const seen = await page.evaluate(() => {
        const el = document.querySelector("#certifications");
        if (!el) return false;
        return el.getBoundingClientRect().top < window.innerHeight;
      });
      if (seen) break;
    }
    await page.waitForTimeout(1200);
    for (let i = 0; i < guard; i += 1) {
      await page.mouse.wheel(0, -1200);
      await page.waitForTimeout(25);
    }
  }
  await page.waitForTimeout(SETTLE_MS);

  const frames = reqs.filter((r) => r.url.includes("/frames/"));
  const certs = reqs.filter((r) => r.url.includes("/images/certs/"));

  // Peak concurrency across frame requests: sweep the start/end event line.
  const events = [];
  for (const r of frames) {
    events.push([r.start, 1]);
    events.push([r.end ?? Date.now(), -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0;
  let peak = 0;
  for (const [, d] of events) {
    cur += d;
    if (cur > peak) peak = cur;
  }

  const certLatency = certs.length
    ? Math.max(...certs.map((c) => (c.end ?? Date.now()) - t0))
    : null;
  // The honest number: how long a cert mark took once the browser had actually
  // asked for it. Latency-from-page-load is mostly a measure of how fast the
  // scroll script drove, not of contention. These are 3-10KB files, so on an
  // uncontended link this should be one round trip.
  const certWait = certs.length
    ? Math.round(
        certs.reduce((a, c) => a + ((c.end ?? Date.now()) - c.start), 0) /
          certs.length,
      )
    : null;

  const heap = await page.evaluate(() =>
    performance.memory ? performance.memory.usedJSHeapSize : null,
  );

  console.log(`url                  ${URL}`);
  console.log(`scrolled             ${DO_SCROLL}`);
  console.log(`frame requests       ${frames.length}`);
  console.log(`peak concurrent      ${peak}`);
  console.log(`cert marks fetched   ${certs.length}`);
  console.log(
    `slowest cert (ms)    ${certLatency === null ? "n/a" : certLatency}`,
  );
  console.log(
    `mean cert wait (ms)  ${certWait === null ? "n/a" : certWait}   <- contention`,
  );
  console.log(
    `JS heap (MB)         ${heap === null ? "n/a" : (heap / 1048576).toFixed(1)}`,
  );

  await browser.close();
})();
