import { describe, expect, it } from "vitest";
import { shortcutFor } from "../src/window/shortcuts";

const down = {
  type: "keyDown",
  control: true,
  alt: false,
  meta: false,
  shift: false,
};

describe("window shortcuts", () => {
  it("opens a tab on ctrl+t and closes a tab on ctrl+w", () => {
    expect(shortcutFor({ ...down, key: "t" })).toBe("open-tab");
    expect(shortcutFor({ ...down, key: "W" })).toBe("close-tab");
  });

  it("moves between tabs on ctrl+left and ctrl+right", () => {
    expect(shortcutFor({ ...down, key: "ArrowLeft" })).toBe("previous-tab");
    expect(shortcutFor({ ...down, key: "ArrowRight" })).toBe("next-tab");
  });

  it("ignores keyup and shortcuts with extra modifiers", () => {
    expect(shortcutFor({ ...down, type: "keyUp", key: "t" })).toBeNull();
    expect(shortcutFor({ ...down, shift: true, key: "t" })).toBeNull();
    expect(shortcutFor({ ...down, control: false, key: "t" })).toBeNull();
    expect(shortcutFor({ ...down, alt: true, key: "w" })).toBeNull();
    expect(shortcutFor({ ...down, control: false, key: "ArrowLeft" })).toBeNull();
    expect(shortcutFor({ ...down, shift: true, key: "ArrowRight" })).toBeNull();
  });
});
