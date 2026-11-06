import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { IpcChannel } from "../src/ipc";

const source = readFileSync(path.join(__dirname, "../src/renderer/preload.ts"), "utf8");

describe("sandboxed preload", () => {
  it("imports only electron so the sandbox can load it", () => {
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
    expect(imports).toEqual(["electron"]);
    expect(source).not.toMatch(/require\s*\(/);
  });

  it("uses the same channel names as the main process", () => {
    for (const channel of Object.values(IpcChannel)) {
      expect(source).toContain(`"${channel}"`);
    }
  });
});
