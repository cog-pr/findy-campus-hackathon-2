import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "../pitch-5min.html");
const assetsDir = path.resolve(__dirname, "../assets");
const outDir = path.resolve(__dirname);

// OneDrive reparse / HTTP edge cases: rewrite asset imgs to data URIs in-page
const assetData = Object.fromEntries(
  fs.readdirSync(assetsDir)
    .filter((f) => f.endsWith(".svg"))
    .map((f) => {
      const buf = fs.readFileSync(path.join(assetsDir, f));
      return [f, `data:image/svg+xml;base64,${buf.toString("base64")}`];
    })
);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "domcontentloaded" });

await page.evaluate((map) => {
  for (const img of document.querySelectorAll('img[src^="assets/"]')) {
    const name = img.getAttribute("src").replace(/^assets\//, "");
    if (map[name]) img.src = map[name];
  }
}, assetData);

await page.waitForTimeout(400);

await page.addStyleTag({
  content: `
    .chrome, .note-panel { display: none !important; }
    .deck { padding: 0 !important; }
  `,
});

const dims = await page.evaluate(() =>
  [...document.images].slice(0, 3).map((img) => ({
    src: (img.getAttribute("src") || "").slice(0, 40),
    w: img.naturalWidth,
    h: img.naturalHeight,
  }))
);
console.log("sample dims", dims);

const count = await page.locator(".slide").count();
for (let i = 0; i < count; i++) {
  await page.evaluate((n) => {
    [...document.querySelectorAll(".slide")].forEach((s, idx) =>
      s.classList.toggle("active", idx === n)
    );
  }, i);
  await page.waitForTimeout(120);
  const file = path.join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
  const stage = page.locator(".stage").first();
  await stage.screenshot({ path: file });
  console.log("wrote", file);
}

await browser.close();
console.log("done", count);
