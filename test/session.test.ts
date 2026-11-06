import { describe, expect, it } from "vitest";
import { CHROME_USER_AGENT } from "../src/session/user-agent";

describe("session user agent", () => {
  it("identifies as Chrome on Linux and does not mention Electron", () => {
    expect(CHROME_USER_AGENT).toContain("Chrome/157.0.8103.38");
    expect(CHROME_USER_AGENT).toContain("X11; Linux x86_64");
    expect(CHROME_USER_AGENT).not.toContain("Electron");
  });
});
