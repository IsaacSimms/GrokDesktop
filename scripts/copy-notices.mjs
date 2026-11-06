import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "build", "third-party");
mkdirSync(target, { recursive: true });

const notices = [
  ["node_modules/electron/LICENSE", "electron-LICENSE"],
  ["node_modules/electron/dist/LICENSES.chromium.html", "LICENSES.chromium.html"],
];

const copied = [];
for (const [from, name] of notices) {
  const source = join(root, from);
  if (!existsSync(source)) continue;
  copyFileSync(source, join(target, name));
  copied.push(name);
}

writeFileSync(
  join(target, "README.txt"),
  [
    "GrokDesktop is GPLv3. See the LICENSE file shipped with the application.",
    "Electron is MIT licensed. Chromium and other runtime components keep their own licenses.",
    copied.length
      ? `Included here: ${copied.join(", ")}.`
      : "Electron's license texts are included in the packaged Electron runtime.",
    "",
  ].join("\n"),
);
