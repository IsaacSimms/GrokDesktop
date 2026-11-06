import { describe, expect, it } from "vitest";
import { waylandSwitches } from "../src/window/wayland";

describe("wayland", () => {
  it("requests a native Wayland window when WAYLAND_DISPLAY is set", () => {
    const switches = waylandSwitches({ WAYLAND_DISPLAY: "wayland-0" });
    expect(switches).toEqual([
      ["ozone-platform", "wayland"],
      ["enable-features", "WaylandWindowDecorations"],
      ["disable-features", "NativeViewHostManagesLayers"],
    ]);
    expect(switches.some(([, value]) => value.toLowerCase().includes("x11"))).toBe(false);
  });

  it("does not force a platform when the session is not Wayland", () => {
    expect(waylandSwitches({})).toEqual([]);
    expect(waylandSwitches({ WAYLAND_DISPLAY: "" })).toEqual([]);
  });
});
