import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");
const browser = await chromium.launch();
const page = await browser.newPage();

async function check(name, content) {
  const data = "data:image/svg+xml;base64," + Buffer.from(content, "utf8").toString("base64");
  await page.setContent(`<img id="i" src="${data}">`);
  await page.waitForTimeout(120);
  const d = await page.evaluate(() => {
    const i = document.getElementById("i");
    return i.naturalWidth;
  });
  console.log(name, d > 0 ? "OK" : "BAD", d);
  return d > 0;
}

const bad = ["comic-1-connect.svg", "loop-strip.svg", "tech-diagram.svg", "persona-setter.svg"];
for (const f of bad) {
  const svg = fs.readFileSync(path.join(dir, f), "utf8");
  console.log("\n==", f);
  await check("raw", svg);
  await check("noComment", svg.replace(/<!--[\s\S]*?-->/g, ""));
  await check("noText", svg.replace(/<text[\s\S]*?<\/text>/g, ""));
  await check("noStar", svg.replace(/★/g, "*").replace(/⚠/g, "!").replace(/→/g, "->").replace(/×/g, "x").replace(/✓/g, "OK"));
  // remove non-ascii entirely from attributes and text
  await check("ascii", svg.replace(/[^\x00-\x7F]/g, ""));
}

await browser.close();
