import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = fs.readFileSync(path.join(root, "assets", "hero-trust.svg"), "utf8");

const tests = {
  original: svg,
  noText: svg.replace(/<text[\s\S]*?<\/text>/g, ""),
  noGradStroke: svg
    .replace(/<text[\s\S]*?<\/text>/g, "")
    .replace('stroke="url(#sunG)"', 'stroke="#ff4d1a"'),
  noRole: svg
    .replace(/ role="[^"]*"/g, "")
    .replace(/ aria-label="[^"]*"/g, ""),
  asciiOnly: svg.replace(/[^\x00-\x7F]/g, "?"),
  noDefs: svg.replace(/<defs[\s\S]*?<\/defs>/g, "").replace(/url\(#[^)]+\)/g, "#ff4d1a"),
};

const browser = await chromium.launch();
const page = await browser.newPage();

for (const [name, content] of Object.entries(tests)) {
  const data = "data:image/svg+xml;base64," + Buffer.from(content, "utf8").toString("base64");
  await page.setContent(`<img id="i" src="${data}">`);
  await page.waitForTimeout(250);
  const d = await page.evaluate(() => {
    const i = document.getElementById("i");
    return { w: i.naturalWidth, h: i.naturalHeight };
  });
  console.log(name, d, "bytes", content.length);
}

await browser.close();
