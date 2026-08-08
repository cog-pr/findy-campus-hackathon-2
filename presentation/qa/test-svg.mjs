import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = http.createServer((req, res) => {
  const rel = (req.url || "/").replace(/^\/+/, "").split("?")[0] || "pitch-5min.html";
  const file = path.normalize(path.join(root, rel));
  fs.readFile(file, (e, d) => {
    if (e) {
      res.writeHead(404);
      res.end("no " + file);
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, {
      "Content-Type": ext === ".svg" ? "image/svg+xml" : "text/html; charset=utf-8",
    });
    res.end(d);
  });
});
await new Promise((r) => server.listen(8777, "127.0.0.1", r));

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => console.log("c", m.text()));
page.on("requestfailed", (r) => console.log("rf", r.url(), r.failure()?.errorText));
page.on("response", async (r) => {
  if (r.url().includes("hero")) {
    console.log("resp", r.status(), r.headers()["content-type"], "len", (await r.body()).length);
  }
});

await page.setContent(
  `<!doctype html><img id="i" src="http://127.0.0.1:8777/assets/hero-trust.svg" width="400" height="350">`
);
await page.waitForTimeout(1500);
console.log(
  await page.evaluate(() => {
    const i = document.getElementById("i");
    return { w: i.naturalWidth, h: i.naturalHeight, complete: i.complete };
  })
);
await page.screenshot({ path: path.join(root, "qa", "test-svg.png") });
await browser.close();
server.close();
