import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".svg"))) {
  const buf = fs.readFileSync(path.join(dir, f));
  const text = buf.toString("utf8");
  const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const replacement = (text.match(/\uFFFD/g) || []).length;
  const nonAscii = [...text].filter((ch) => ch.charCodeAt(0) > 127).slice(0, 20).join("");
  // round-trip check
  const round = Buffer.from(text, "utf8").equals(buf) || (hasBom && Buffer.from(text, "utf8").equals(buf.subarray(3)));
  console.log(f, { bytes: buf.length, hasBom, replacement, round, sample: nonAscii });
}
