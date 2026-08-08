import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".svg"))) {
  let c = fs.readFileSync(path.join(dir, f), "utf8").replace(/^\uFEFF/, "");
  const n = c.replace(/ role="[^"]*"/g, "").replace(/ aria-label="[^"]*"/g, "");
  fs.writeFileSync(path.join(dir, f), n, "utf8");
  console.log(f, /role=/.test(n) ? "STILL ROLE" : "clean", n.slice(0, 80));
}
