export type CommandSwitch = readonly [name: string, value: string];

export function waylandSwitches(env: { WAYLAND_DISPLAY?: string }): CommandSwitch[] {
  if (!env.WAYLAND_DISPLAY) return [];
  return [
    ["ozone-platform", "wayland"],
    ["enable-features", "WaylandWindowDecorations"],
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
