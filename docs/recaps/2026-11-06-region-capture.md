# Region capture into the active tab

**Date:** 2026-11-06
**Type:** implementation
**Environment / Systems:** Fedora GNOME Wayland. Electron 45.2.3. Repo `GrokDesktop`.

## TL;DR

Ctrl+Alt+S now grabs a screen region while GrokDesktop is unfocused and pastes the PNG into the active tab without sending. The user confirmed a real shot landed in the grok.com composer. The shortcut exists only while the window does.

## Context & Goal

Debugging meant shooting some other window and getting that image into the open chat. The only attach path was the site's file dialog. Ctrl+T and Ctrl+W are focused `before-input-event` chords, so they cannot shoot the window the user is looking at. The plan in `docs/artifacts/grokdesktop-region-capture.md` was already settled. This thread implemented it.

## Key Points Explored

- Shot outcomes live in `src/capture/decide.ts` (`idle` / `selecting`). A second press while the region tool is open is ignored. Cancel does nothing. An error or an empty image is a log and a return to idle. A non-empty PNG is a paste.
- Portal strings and the Screenshot response parser live in `src/capture/portal-messages.ts`. Shortcut id `capture-region`, description `Capture a region and paste it into GrokDesktop`, preferred trigger `<Control><Alt>s`. Response code 0 with a `file:` URI is a filesystem path. Code 1 is cancel. Anything else is an error string. The module does not read the file.
- `src/capture/portal.ts` is the only module that imports `dbus-next`. It registers the host app id `grokdesktop` on `org.freedesktop.host.portal.Registry` before any other portal call, then `CreateSession` and `BindShortcuts`. Activate calls Screenshot with `interactive: true`, `modal: false`, and an empty `parent_window`.
- Electron 45 has no `clipboard.writeImage`. The PNG bytes go out through `clipboard.write` and a `ClipboardItem` of type `image/png`, after `nativeImage.createFromBuffer` rejects an empty image. The write happens before `pasteClipboard`. A failed read or write logs `GrokDesktop capture:` and does not raise the window.
- `TabHost.pasteClipboard` restores a minimized window, shows and focuses it, focuses the active view, and calls `webContents.paste()`. It does not send a key and does not touch the clipboard.
- A missing portal logs one line and the window still opens. Closing the window closes the portal session and the bus. Quit-on-close is unchanged. `display-capture` stays denied for the page.
- `build.files` names `dbus-next` and its runtime packages because that list replaces electron-builder's default and would otherwise omit `node_modules`. `release/linux-unpacked/resources/app.asar` contains those packages. No release was published.
- `npm test`: 12 files, 60 tests. The new tests do not launch Electron or open a bus.

## Decisions & Outcomes

- Implemented the plan as written. No page injection, no Enter, no tray, no `globalShortcut`, no `desktopCapturer`, no `gdbus`.
- The user confirmed the live path: the chord, the region tool, and a paste into the open grok.com composer. The message was not sent.
- `docs/artifacts/grokdesktop-region-capture.md` is marked done. `README.md` documents Ctrl+Alt+S.

## Open Questions / Next Steps

- The app-grid launcher still runs `~/.local/opt/GrokDesktop`, which does not have this code. The source process and `release/linux-unpacked` do. Replacing that install is a separate copy.
- One successful bind was confirmed. A dialog on every later launch is still the plan's stop-and-report, not a fallback.

## Artifacts

- `docs/artifacts/grokdesktop-region-capture.md` — plan, status done.
- `src/capture/decide.ts`, `src/capture/portal-messages.ts`, `src/capture/portal.ts` — new.
- `src/tabs/host.ts` — `pasteClipboard`. `src/window/open.ts` — register on open, release on close.
- `test/capture.test.ts` — pure modules only.
- `package.json` — `dbus-next` in `dependencies`, plus the `build.files` entries.
- `README.md`, `Context.md` — shortcut and architecture notes.
