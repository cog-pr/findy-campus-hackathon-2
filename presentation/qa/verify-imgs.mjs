import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");
const browser = await chromium.launch();
const page = await browser.newPage();

for (const f of fs.readdirSync(assets).filter((x) => x.endsWith(".svg"))) {
  const data =
    "data:image/svg+xml;base64," +
    fs.readFileSync(path.join(assets, f)).toString("base64");
  await page.setContent(`<img id="i" src="${data}">`);
  await page.waitForTimeout(100);
  const d = await page.evaluate(() => {
    const i = document.getElementById("i");
    return { w: i.naturalWidth, h: i.naturalHeight };
  });
  console.log(d.w > 0 ? "OK" : "BAD", f, d);
}

await browser.close();
