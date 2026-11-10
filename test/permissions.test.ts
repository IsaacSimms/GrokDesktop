import { describe, expect, it } from "vitest";
import { decidePermission } from "../src/permissions/decide";

describe("permissions", () => {
  it("grants media and sanitized clipboard writes, and denies other prompts", () => {
    expect(decidePermission("media")).toBe(true);
    expect(decidePermission("clipboard-sanitized-write")).toBe(true);
    expect(decidePermission("notifications")).toBe(false);
    expect(decidePermission("display-capture")).toBe(false);
    expect(decidePermission("geolocation")).toBe(false);
    expect(decidePermission("clipboard-read")).toBe(false);
    expect(decidePermission("clipboard-write")).toBe(false);
  });
});
