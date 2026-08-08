import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "pitch-5min.html");
let html = fs.readFileSync(htmlPath, "utf8");

html = html.replace(
  /src="assets\/([^"]+\.svg)"/g,
  (_m, name) => {
    const svg = fs.readFileSync(path.join(root, "assets", name));
    const b64 = svg.toString("base64");
    console.log("inline", name, svg.length, "bytes");
    return `src="data:image/svg+xml;base64,${b64}"`;
  }
);

fs.writeFileSync(htmlPath, html);
console.log("updated", htmlPath);
