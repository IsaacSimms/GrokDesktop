import path from "path";
import { describe, expect, it } from "vitest";
import { shellAssetPath } from "../src/window/assets";

describe("packaged asset paths", () => {
  it("loads the tab strip from dist/renderer when the window module is in dist/window", () => {
    const directory = path.join("/app", "dist", "window");
    expect(shellAssetPath(directory, "index.html")).toBe(path.join("/app", "dist", "renderer", "index.html"));
    expect(shellAssetPath(directory, "preload.js")).toBe(path.join("/app", "dist", "renderer", "preload.js"));
    expect(shellAssetPath(directory, "icon.png")).toBe(path.join("/app", "dist", "build", "icon.png"));
  });
});
