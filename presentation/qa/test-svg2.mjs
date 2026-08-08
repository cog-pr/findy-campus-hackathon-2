import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hero = fs.readFileSync(path.join(root, "assets", "hero-trust.svg"));
const b64 = hero.toString("base64");
const minimal =
  "data:image/svg+xml;base64," +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#ff4d1a"/></svg>'
  ).toString("base64");
const heroData = "data:image/svg+xml;base64," + b64;

// Also try utf8 data uri with encodeURIComponent
const heroUtf = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(hero.toString("utf8"));

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => console.log("c", m.type(), m.text()));
page.on("pageerror", (e) => console.log("pe", e.message));

await page.setContent(`<!doctype html>
<img id="a" src="${minimal}">
<img id="b" src="${heroData}">
<img id="c" src="${heroUtf}">
`);
await page.waitForTimeout(800);
console.log(
  await page.evaluate(() =>
    ["a", "b", "c"].map((id) => {
      const i = document.getElementById(id);
      return { id, w: i.naturalWidth, h: i.naturalHeight, complete: i.complete };
    })
  )
);

// Try inline SVG
await page.setContent(`<!doctype html><div id="box">${hero.toString("utf8")}</div>`);
await page.waitForTimeout(200);
console.log(
  "inline svg bbox",
  await page.evaluate(() => {
    const s = document.querySelector("svg");
    const r = s.getBoundingClientRect();
    return { w: r.width, h: r.height, children: s.children.length };
  })
);
await page.screenshot({ path: path.join(root, "qa", "test-inline.png") });
await browser.close();
