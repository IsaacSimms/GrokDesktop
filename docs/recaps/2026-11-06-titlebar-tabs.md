# Title bar tabs

**Date:** 2026-11-06
**Type:** fix
**Environment / Systems:** Fedora 44, GNOME, Wayland (`wayland-0`). Electron 45.2.3. Repo `GrokDesktop`.

## TL;DR

The **+** button did nothing because the sandboxed tab-strip preload crashed on `require("../ipc")`, so `grokdesktop` was never exposed. The preload now imports only `electron`, and the tabs sit in the title bar next to the native window buttons instead of in a second row.

## Context & Goal

The app launched, signed in, and loaded grok.com. The tab strip showed only the **+** button. Clicking it did not add a tab. The ask was to make **+** open another tab, and to put that strip in the top bar so it stops using a second row of vertical space.

## Key Points Explored

- `~/.config/GrokDesktop/window-state.json` still had a single `https://grok.com/` tab after use, so **+** was not reaching the main process.
- The shell page logged `Unable to load preload script` and `Error: module not found: ../ipc`. `src/renderer/preload.ts` imported `../ipc`. Electron's sandbox can `require("electron")` and cannot load that local module. `grokdesktop` stayed undefined, `getTabs()` never ran, and the **+** click threw `grokdesktop is not defined`. The grok.com page still worked because the main process creates that view on its own.
- With a preload that only requires `electron`, the same page rendered tab labels and a click sent `tabs-open`.
- `titleBarStyle: "hidden"` plus `titleBarOverlay` is the way to draw the strip in the title bar and keep minimize, maximize, and close. On this Wayland session, Electron 45 reports the overlay hidden unless `NativeViewHostManagesLayers` is disabled. With that switch, the overlay is visible and the strip is inset (controls on the left, about 113px). A real mouse event on **+** opened another tab. `WebContentsView` bounds stayed `{ y: 40 }` under the 40px bar.
- `npm test`: 11 files, 45 tests.

## Decisions & Outcomes

- `src/renderer/preload.ts` inlines the channel names and imports only `electron`. `test/preload.test.ts` locks that and checks the names against `IpcChannel`.
- The window uses `titleBarStyle: "hidden"` and `titleBarOverlay` (`src/window/open.ts`, colors and height in `src/window/constants.ts`). The strip is positioned with `titlebar-area-*` and is draggable; tabs and **+** are not (`src/renderer/tab-strip.css`).
- On Wayland, `src/window/wayland.ts` also disables `NativeViewHostManagesLayers` so the window buttons stay visible. `test/wayland.test.ts` expects that switch.
- Verified on a temporary `--user-data-dir`, not the real login: bridge present, one tab labeled `grok.com`, DOM click and a mouse event each added a tab, three `https://grok.com/` page targets existed, and switching the active tab updated the strip.

## Open Questions / Next Steps

The running app has to be quit and started again from this source. The copy in `~/.local/opt/GrokDesktop` and any future rpm stay on the old build until they are replaced. The system rpm is still unbuilt (`libxcrypt-compat` plus `sudo` for `dnf`).

## Artifacts

| Path | State |
| --- | --- |
| `src/renderer/preload.ts` | Sandbox-safe preload |
| `src/renderer/tab-strip.css` | Strip laid out in the title bar |
| `src/window/open.ts` | Hidden title bar with overlay |
| `src/window/wayland.ts` | Wayland switches, including the overlay workaround |
| `test/preload.test.ts` | Channel and import guard |
| `README.md` | Install, run, and uninstall instructions updated in this same thread |
