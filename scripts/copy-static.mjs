import { copyFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "dist", "renderer");
mkdirSync(target, { recursive: true });
for (const name of ["index.html", "tab-strip.css"]) {
  copyFileSync(join(root, "src", "renderer", name), join(target, name));
}
