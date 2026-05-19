import fs from "fs";
const file = process.argv[2];
let s = fs.readFileSync(file, "utf8");
s = s.replaceAll("motion-card", "div");
fs.writeFileSync(file, s);
