import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { onActivate, onShot } from "../src/capture/decide";
import {
  CAPTURE_DESCRIPTION,
  CAPTURE_SHORTCUT_ID,
  CAPTURE_TRIGGER,
  bindShortcutList,
  parseScreenshotResponse,
} from "../src/capture/portal-messages";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("capture decisions", () => {
  it("starts a region shot from idle", () => {
    expect(onActivate("idle")).toEqual({ state: "selecting", action: "start" });
  });

  it("ignores a second press while a region tool is open", () => {
    expect(onActivate("selecting")).toEqual({ state: "selecting", action: "ignore" });
  });

  it("does nothing when the region tool is cancelled", () => {
    expect(onShot({ kind: "cancel" })).toEqual({ state: "idle", action: "noop" });
  });

  it("logs an error and returns to idle", () => {
    expect(onShot({ kind: "error" })).toEqual({ state: "idle", action: "log" });
  });

  it("logs an empty image and returns to idle", () => {
    expect(onShot({ kind: "image", png: Buffer.alloc(0) })).toEqual({ state: "idle", action: "log" });
  });

  it("pastes a non-empty png and returns to idle", () => {
    expect(onShot({ kind: "image", png })).toEqual({ state: "idle", action: "paste" });
  });
});

describe("portal messages", () => {
  it("exports the shortcut id, description, and preferred trigger", () => {
    expect(CAPTURE_SHORTCUT_ID).toBe("capture-region");
    expect(CAPTURE_DESCRIPTION).toBe("Capture a region and paste it into GrokDesktop");
    expect(CAPTURE_TRIGGER).toBe("<Control><Alt>s");
  });

  it("builds the bind list from those strings", () => {
    expect(bindShortcutList()).toEqual([
      {
        id: "capture-region",
        description: "Capture a region and paste it into GrokDesktop",
        preferredTrigger: "<Control><Alt>s",
      },
    ]);
  });

  it("turns a file uri into a filesystem path", () => {
    const uri = "file:///tmp/grok%20shot.png";
    expect(parseScreenshotResponse(0, uri)).toEqual({
      kind: "success",
      path: fileURLToPath(uri),
    });
  });

  it("rejects a non-file uri, a missing uri, and any other response code", () => {
    expect(parseScreenshotResponse(0, "https://example.com/shot.png")).toEqual({
      kind: "error",
      message: "screenshot uri is not a file",
    });
    expect(parseScreenshotResponse(0, undefined)).toEqual({
      kind: "error",
      message: "screenshot response missing uri",
    });
    expect(parseScreenshotResponse(2, "file:///tmp/shot.png")).toEqual({
      kind: "error",
      message: "screenshot response 2",
    });
  });

  it("treats response code 1 as cancel", () => {
    expect(parseScreenshotResponse(1, undefined)).toEqual({ kind: "cancel" });
    expect(parseScreenshotResponse(1, "file:///tmp/shot.png")).toEqual({ kind: "cancel" });
  });
});

describe("capture module boundaries", () => {
  it("keeps the pure modules off electron and dbus", () => {
    for (const file of ["decide.ts", "portal-messages.ts"]) {
      const source = readFileSync(path.join(__dirname, "../src/capture", file), "utf8");
      expect(source).not.toMatch(/from\s+["']electron["']/);
      expect(source).not.toMatch(/from\s+["']dbus-next["']/);
      expect(source).not.toMatch(/require\s*\(\s*["']electron["']/);
      expect(source).not.toMatch(/require\s*\(\s*["']dbus-next["']/);
    }
  });
});
