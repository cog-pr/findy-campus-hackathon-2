/**
 * Replace <img class="ill" src="assets/….svg"> with inline <svg class="ill">…
 * Chromium <img> rejects some of our SVGs (text/encoding edge cases);
 * inline SVG always paints. Source files in assets/ stay the edit surface —
 * re-run this after editing SVGs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "pitch-5min.html");
let html = fs.readFileSync(htmlPath, "utf8");

// If already inlined once, restore from a marker — we keep img tags as source of truth in git.
// For now: only replace remaining img tags.
html = html.replace(
  /<img class="ill" src="assets\/([^"]+\.svg)" alt=""\s*\/>/g,
  (_m, name) => {
    let svg = fs.readFileSync(path.join(root, "assets", name), "utf8").replace(/^\uFEFF/, "");
    svg = svg
      .replace(/ role="[^"]*"/g, "")
      .replace(/ aria-label="[^"]*"/g, "")
      .replace(/<svg\b/, '<svg class="ill" focusable="false"');
    console.log("inline", name);
    return svg;
  }
);

// CSS: inline svg.ill needs same sizing as img.ill
if (!html.includes("svg.ill")) {
  html = html.replace(
    "img.ill {",
    `img.ill,
    svg.ill {`
  );
}

fs.writeFileSync(htmlPath, html);
console.log("done");
