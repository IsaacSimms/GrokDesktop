"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waylandSwitches = waylandSwitches;
exports.applyWayland = applyWayland;
function waylandSwitches(env) {
    if (!env.WAYLAND_DISPLAY)
        return [];
    return [
        ["ozone-platform", "wayland"],
        ["enable-features", "WaylandWindowDecorations"],
        // Electron 45 hides the Wayland window-control overlay unless this
        // Chromium layering feature is off, which removes minimize, maximize, and close.
        ["disable-features", "NativeViewHostManagesLayers"],
    ];
}
function applyWayland(env, appendSwitch) {
    for (const [name, value] of waylandSwitches(env)) {
        appendSwitch(name, value);
    }
}
//# sourceMappingURL=wayland.js.map