// Scroll-smoothness harness.
//
// Drives the page with real wheel input (CDP mouseWheel, so Lenis handles it the
// way it handles a trackpad) and records how evenly the browser actually
// presents frames while it happens. rAF gaps are the metric that matters here:
// a synchronous image decode on the main thread shows up as a long gap no matter
// what the GPU is doing, which is exactly the failure being chased.

const { chromium } = require("playwright");

const URL = process.argv[2] || "http://127.0.0.1/";
const HOST = process.argv[3] || "dietz.trayaam.com";
const LABEL = process.argv[4] || "run";

(async () => {
  const browser = await chromium.launch({
    executablePath: "/home/ubuntu/.cache/ms-playwright/chromium-1223/chrome-linux/chrome",
    args: [
      "--enable-gpu-rasterization",
      "--ignore-certificate-errors",
      // Host is a forbidden request header in Chromium, so the vhost is reached
      // by resolving its real name to loopback instead.
      `--host-resolver-rules=MAP ${process.argv[3] || "dietz.trayaam.com"} 127.0.0.1`,
    ],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: Number(process.env.DPR || 2), // retina, like the MacBook this is being judged on
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await page.goto(URL, { waitUntil: "load", timeout: 60000 });

  // Let the eager section settle before measuring, otherwise the first-load
  // network burst is what gets measured rather than the scrub itself.
  await page.waitForTimeout(6000);

  await page.evaluate(() => {
    window.__perf = { raf: [], long: [], decodes: 0 };
    let last = performance.now();
    const tick = (t) => {
      window.__perf.raf.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__perf.long.push(e.duration);
      }).observe({ entryTypes: ["longtask"] });
    } catch {}
  });

  // Scroll all the way down, then all the way back up. Scrolling up is where the
  // user reports it being worst, and it is also where an evicted decode cache
  // bites hardest, so both directions are measured separately.
  const wheel = async (dy, steps, pause) => {
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, dy);
      await page.waitForTimeout(pause);
    }
  };

  await page.evaluate(() => (window.__perf.raf.length = 0));
  await wheel(120, 220, 16); // down
  const down = await page.evaluate(() => {
    const r = window.__perf.raf.slice();
    window.__perf.raf.length = 0;
    return r;
  });

  await page.waitForTimeout(1200);
  await page.evaluate(() => (window.__perf.raf.length = 0));
  await wheel(-120, 220, 16); // up
  const up = await page.evaluate(() => window.__perf.raf.slice());

  const long = await page.evaluate(() => window.__perf.long.slice());
  const mem = await page.evaluate(() =>
    performance.memory
      ? Math.round(performance.memory.usedJSHeapSize / 1048576)
      : null,
  );

  const stat = (arr, name) => {
    const a = arr.filter((x) => x > 0).sort((x, y) => x - y);
    if (!a.length) return `${name}: no samples`;
    const q = (p) => a[Math.floor(a.length * p)].toFixed(1);
    const dropped = a.filter((x) => x > 33).length;
    const bad = a.filter((x) => x > 100).length;
    return [
      `${name}:`,
      `  frames=${a.length}  p50=${q(0.5)}ms  p95=${q(0.95)}ms  p99=${q(0.99)}ms  max=${a[a.length - 1].toFixed(0)}ms`,
      `  janky(>33ms)=${dropped} (${((dropped / a.length) * 100).toFixed(1)}%)   severe(>100ms)=${bad}`,
    ].join("\n");
  };

  console.log(`\n===== ${LABEL} =====`);
  console.log(stat(down, "SCROLL DOWN"));
  console.log(stat(up, "SCROLL UP"));
  console.log(
    `LONG TASKS: ${long.length}  total=${long.reduce((a, b) => a + b, 0).toFixed(0)}ms  max=${long.length ? Math.max(...long).toFixed(0) : 0}ms`,
  );
  if (mem) console.log(`JS heap: ${mem}MB`);
  if (consoleErrors.length)
    console.log(`PAGE ERRORS: ${consoleErrors.slice(0, 3).join(" | ")}`);

  await browser.close();
})();
