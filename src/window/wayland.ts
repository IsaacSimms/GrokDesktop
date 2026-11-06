export type CommandSwitch = readonly [name: string, value: string];

export function waylandSwitches(env: { WAYLAND_DISPLAY?: string }): CommandSwitch[] {
  if (!env.WAYLAND_DISPLAY) return [];
  return [
    ["ozone-platform", "wayland"],
    ["enable-features", "WaylandWindowDecorations"],
    // Electron 45 hides the Wayland window-control overlay unless this
    // Chromium layering feature is off, which removes minimize, maximize, and close.
    ["disable-features", "NativeViewHostManagesLayers"],
  ];
}

export function applyWayland(
  env: { WAYLAND_DISPLAY?: string },
  appendSwitch: (name: string, value: string) => void,
): void {
  for (const [name, value] of waylandSwitches(env)) {
    appendSwitch(name, value);
  }
}
