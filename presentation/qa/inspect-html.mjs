import fs from "node:fs";
const p = new URL("../pitch-5min.html", import.meta.url);
const t = fs.readFileSync(p, "utf8");
console.log("bytes", t.length, "lines", t.split(/\n/).length);
console.log("comic-1", t.includes("comic-1"));
console.log("hero-trust", t.includes("hero-trust"));
console.log("slides", (t.match(/class="slide/g) || []).length);
console.log("tail", t.slice(-300));
