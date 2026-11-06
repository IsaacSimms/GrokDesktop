import path from "path";

export function shellAssetPath(dirname: string, name: "index.html" | "preload.js" | "icon.png"): string {
  if (name === "icon.png") return path.join(dirname, "..", "build", name);
  return path.join(dirname, "..", "renderer", name);
}
