import { describe, expect, it } from "vitest";
import { decidePermission } from "../src/permissions/decide";

describe("permissions", () => {
  it("grants media and denies notifications, display capture, and other prompts", () => {
    expect(decidePermission("media")).toBe(true);
    expect(decidePermission("notifications")).toBe(false);
    expect(decidePermission("display-capture")).toBe(false);
    expect(decidePermission("geolocation")).toBe(false);
    expect(decidePermission("clipboard-read")).toBe(false);
  });
});
