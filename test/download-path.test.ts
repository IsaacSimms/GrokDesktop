import path from "path";
import { describe, expect, it } from "vitest";
import { downloadFilePath } from "../src/session/download-path";

describe("download paths", () => {
  it("saves a bare filename in the downloads directory", () => {
    const chosen = downloadFilePath("/home/me/Downloads", "notes.txt", () => false);
    expect(chosen).toBe(path.join("/home/me/Downloads", "notes.txt"));
  });

  it("drops directory parts from the suggested filename", () => {
    const chosen = downloadFilePath("/home/me/Downloads", "../../etc/passwd", () => false);
    expect(chosen).toBe(path.join("/home/me/Downloads", "passwd"));
  });

  it("adds a numeric suffix when the filename is already taken", () => {
    const chosen = downloadFilePath("/home/me/Downloads", "notes.txt", (candidate) =>
      candidate.endsWith(`${path.sep}notes.txt`),
    );
    expect(chosen).toBe(path.join("/home/me/Downloads", "notes (1).txt"));
  });
});
