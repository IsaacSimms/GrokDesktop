import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { readWindowState, writeWindowState } from "../src/persist/file";
import { HOME_URL } from "../src/tabs/model";

describe("window state file", () => {
  it("returns one grok.com tab when no save file exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grokdesktop-"));
    expect(readWindowState(dir)).toEqual({
      bounds: null,
      tabs: [HOME_URL],
      activeIndex: 0,
    });
  });

  it("round-trips a save file and drops a non-grok url", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grokdesktop-"));
    writeWindowState(dir, {
      bounds: { x: 3, y: 4, width: 1000, height: 700 },
      tabs: [HOME_URL, "https://example.com"],
      activeIndex: 0,
    });
    expect(readWindowState(dir)).toEqual({
      bounds: { x: 3, y: 4, width: 1000, height: 700 },
      tabs: [HOME_URL],
      activeIndex: 0,
    });
  });
});
