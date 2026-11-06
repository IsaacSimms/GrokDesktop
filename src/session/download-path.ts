import path from "path";

export function downloadFilePath(
  directory: string,
  filename: string,
  exists: (candidate: string) => boolean,
): string {
  const base = path.basename(filename).replace(/[\u0000-\u001f]/g, "").trim();
  const safe = !base || base === "." || base === ".." ? "download" : base;
  const extension = path.extname(safe);
  const stem = extension ? safe.slice(0, -extension.length) : safe;
  const names = [safe];
  for (let index = 1; index <= 999; index += 1) {
    names.push(`${stem} (${index})${extension}`);
  }
  for (const name of names) {
    const candidate = path.join(directory, name);
    if (!exists(candidate)) return candidate;
  }
  return path.join(directory, `${stem}-${Date.now()}${extension}`);
}
