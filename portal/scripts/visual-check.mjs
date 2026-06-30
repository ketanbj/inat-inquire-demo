import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const portalUrl = process.env.PORTAL_VISUAL_URL || "http://127.0.0.1:5173/";
const outputDir = process.env.PORTAL_VISUAL_OUT || os.tmpdir();

const mockStatus = {
  mode: "visual-check",
  authenticated: true,
  pipeline_online: true,
  pipeline_url: "http://localhost:8088",
  metric_highlights: {
    collection_size: 128,
    p95_search_latency_ms: 143,
    ingested_success_total: 128,
    failed_items_recovered_from_dlq: 0
  },
  metric_source: "http://localhost:8088/metrics"
};

const mockBenchmark = {
  dataset: "visual-check",
  provider: "mock-provider",
  query_count: 6,
  metrics: {
    recall_at_5: 0.82
  },
  latency_ms: {
    p50: 74,
    p95: 143
  },
  narrative: "Synthetic benchmark payload for visual verification.",
  source: "visual-check"
};

const mockReadiness = {
  source: "visual-check",
  updated_at: new Date("2026-06-04T00:00:00.000Z").toISOString(),
  control_plane: {},
  collection_management: {},
  observability: {},
  quality_loop: {},
  resilience_scale: {},
  runtime_runs: [
    {
      batch: 1,
      collection: "inat-demo-live",
      points_after: 64,
      added_vectors: 64,
      verify_query: "nudibranch",
      first_result_key: "hf-inat/batch-1/visual.jpg"
    },
    {
      batch: 2,
      collection: "inat-demo-live",
      points_after: 128,
      added_vectors: 64,
      verify_query: "nudibranch",
      first_result_key: "hf-inat/batch-2/visual.jpg"
    }
  ],
  quality_gate_results: [
    {
      metric: "recall_at_5",
      threshold: 0.75,
      direction: "gte",
      current: 0.82,
      passed: true,
      source: "visual-check"
    }
  ]
};

const mockSearch = {
  query: "nudibranch",
  mode: "visual-check",
  provider: "mock-provider",
  model: "mock-model",
  collection: "inat-demo-live",
  latency_ms: 93,
  total: 1,
  results: [
    {
      id: "visual-result-1",
      rank: 1,
      score: 0.91,
      title: "Visual check nudibranch",
      image_url: "",
      s3_key: "visual/nudibranch.jpg",
      s3_uri: "s3://visual/nudibranch.jpg",
      width: 1200,
      height: 900,
      source: "visual-check",
      source_url: "https://www.inaturalist.org/",
      license: "CC BY-NC",
      explanation: "Synthetic result for scene verification."
    }
  ]
};

async function installApiMocks(page) {
  const routes = {
    "**/demo/status": mockStatus,
    "**/demo/benchmark": mockBenchmark,
    "**/demo/production-readiness": mockReadiness,
    "**/demo/search": mockSearch
  };

  await Promise.all(
    Object.entries(routes).map(([routePattern, payload]) =>
      page.route(routePattern, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(payload)
        })
      )
    )
  );
}

async function readCanvasStats(page, selector) {
  return page.$eval(selector, (canvas) => {
    const rect = canvas.getBoundingClientRect();
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      return { error: "missing-webgl" };
    }

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let coloredSamples = 0;
    let alphaSamples = 0;
    let totalSamples = 0;
    const stride = 64;
    for (let index = 0; index < pixels.length; index += stride * 4) {
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];
      if (a > 0) {
        alphaSamples += 1;
      }
      if (r + g + b > 32) {
        coloredSamples += 1;
      }
      totalSamples += 1;
    }

    return {
      cssWidth: Math.round(rect.width),
      cssHeight: Math.round(rect.height),
      bufferWidth: width,
      bufferHeight: height,
      coloredSamples,
      alphaSamples,
      totalSamples
    };
  });
}

async function checkMainViewport(browser, name, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await installApiMocks(page);
  await page.addInitScript(() => {
    sessionStorage.setItem("inat-demo-token", "visual-check-token");
  });
  await page.goto(portalUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".scene-mount canvas", { timeout: 10_000 });
  await page.waitForSelector(".hotspot-button", { timeout: 10_000 });
  await page.waitForTimeout(1_200);

  const screenshot = path.join(outputDir, `inat-inquire-${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  const sceneVisible = await page.$eval(".scene-mount canvas", (canvas) => {
    const rect = canvas.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  const stats = await readCanvasStats(page, ".scene-mount canvas");
  const selectedBefore = await page.locator(".node-popover-title strong").first().innerText();
  await page.locator('.hotspot-button[aria-label="Research Search Experience"]').click({ force: true });
  await page.waitForTimeout(250);
  const selectedAfter = await page.locator(".node-popover-title strong").first().innerText();

  await context.close();
  return { name, viewport, sceneVisible, stats, selectedBefore, selectedAfter, screenshot };
}

async function checkAuthViewport(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(portalUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".auth-panel .scene-mount canvas", { timeout: 10_000 });
  await page.waitForTimeout(1_000);
  const stats = await readCanvasStats(page, ".auth-panel .scene-mount canvas");
  const screenshot = path.join(outputDir, "inat-inquire-auth.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.close();
  return { name: "auth", stats, screenshot };
}

function assertMainResult(result) {
  const { name, sceneVisible, stats, selectedBefore, selectedAfter } = result;
  if (!sceneVisible) {
    throw new Error(`${name}: scene is not visible in the first viewport`);
  }
  if (stats.error) {
    throw new Error(`${name}: ${stats.error}`);
  }
  if (stats.cssWidth < 280 || stats.cssHeight < 320) {
    throw new Error(`${name}: canvas too small ${stats.cssWidth}x${stats.cssHeight}`);
  }
  if (stats.coloredSamples < Math.max(100, stats.totalSamples * 0.02)) {
    throw new Error(`${name}: canvas appears blank`);
  }
  if (selectedAfter === selectedBefore) {
    throw new Error(`${name}: scene node interaction did not update the popover`);
  }
}

function assertAuthResult(result) {
  const { stats } = result;
  if (stats.error) {
    throw new Error(`auth: ${stats.error}`);
  }
  if (stats.coloredSamples < 100) {
    throw new Error("auth: scene appears blank");
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await checkMainViewport(browser, "desktop", { width: 1440, height: 1000 }),
    await checkMainViewport(browser, "mobile", { width: 390, height: 844 }),
    await checkAuthViewport(browser)
  ];
  results.slice(0, 2).forEach(assertMainResult);
  assertAuthResult(results[2]);
  results.forEach((result) => {
    console.log(JSON.stringify(result));
  });
} finally {
  await browser.close();
}
