---
title: Region capture into the active tab
status: done
updated: 2026-11-06
project: GrokDesktop
---

# Region capture into the active tab

## TL;DR

Add a GNOME portal shortcut, suggested as Ctrl+Alt+S, that grabs a screen region while GrokDesktop is in the background or minimized and pastes the PNG into the active tab. The shell does not press Send, does not inject into grok.com, and does not keep running after the window closes. If the site ignores the paste, stop and report.

## Problem Statement

Debugging a UI, an error, or a diagram means shooting some other window and getting that image into the open chat. Today the only attach path is the site's file dialog. Ctrl+T and Ctrl+W are `before-input-event` listeners in `src/tabs/host.ts`, so they fire only while the window is focused. A focused-only shortcut cannot shoot the window the user is looking at.

The v1 plan deferred global hotkeys because Electron `globalShortcut` does not reliably fire on this GNOME Wayland session. The Screenshot portal and the GlobalShortcuts portal are the desktop APIs that can show a region tool and deliver a key while this window is unfocused. Nothing in the repo calls them.

## Requirements

1. While the GrokDesktop window exists, including minimized, a portal shortcut opens GNOME's interactive region tool. The suggested chord is Ctrl+Alt+S. The user can confirm or change it in the portal dialog and later in GNOME Settings.
2. After a successful region shot, the shell writes the PNG to the clipboard as an image, raises the window (restore if minimized, then show and focus), and pastes into the active tab's `webContents`. It does not press Enter or otherwise send.
3. The clipboard still holds that PNG afterward, so a paste that missed the composer can be repeated by the user. The shell does not inspect the page to see where the paste landed.
4. Dismissing the region tool with no image leaves the window where it was and does not change the clipboard.
5. A second shortcut press while a region tool is already open is ignored.
6. If the portal is missing at startup, the app still opens, chat and tabs work, the shortcut is absent, and the failure is one `console.error` line.
7. If a shot fails, is denied, returns no image, or the clipboard write fails, the shell logs one `console.error` line and does not raise the window. The clipboard is left as it was.
8. Logs go to the main-process error stream only. There is no log file, notification, or in-app error UI.
9. Unit tests cover the pure decision and portal-message modules without launching Electron and without a D-Bus connection.

## Constraints

- Fedora GNOME Wayland is the target. Do not add an X11 path, a Flatpak, or a second package format.
- The grok.com page is not injected. No `executeJavaScript`, no CSS injection, no debugger protocol, no synthesized click on the composer or the attach button, no Enter key.
- `decidePermission` stays as it is. `display-capture` remains denied for the page. The shell calls the portal from the main process. That is not a page permission.
- Closing the window still quits. No tray, no hidden resident process, no shortcut after quit.
- One window, one process, the existing single-instance lock. Do not register the shortcut in a second process.
- Ctrl+T and Ctrl+W stay on `before-input-event`. Do not also bind Ctrl+Alt+S there.
- `dbus-next` is the only new runtime dependency. Do not shell out to `gdbus`. Do not use Electron `globalShortcut` or `desktopCapturer`.
- Vitest stays `environment: "node"`. Tests do not launch Electron or talk to the session bus.
- `docs/artifacts/grokdesktop-electron-shell.md` is the historical v1 plan. Do not edit it.
- A failed manual paste check ends the pass. Do not add a page-driving fallback in this work.

## Key Decisions

> **Decision:** Raise the window and paste into the active tab. Do not press send.
> **Rationale:** The user adds a caption and sends. The shell never has to find the send button.
> **Alternatives considered:** Paste and press Enter. Drive grok.com's attach control and send. Copy to the clipboard and make the user paste.

> **Decision:** The shortcut is the GNOME GlobalShortcuts portal, and it works while the window is in the background or minimized.
> **Rationale:** The shot is of some other window. A focused-only shortcut cannot see that window. Electron `globalShortcut` is already known to be unreliable on this session.
> **Alternatives considered:** `before-input-event` like Ctrl+T. Watch the folder where GNOME saves screenshots. Electron `globalShortcut`.

> **Decision:** The hotkey lives only as long as the window does, including while minimized. Quit-on-close stays. There is no tray.
> **Rationale:** A resident process is the deferred tray feature, not part of capture.
> **Alternatives considered:** Stay running after close. Disable the hotkey while minimized.

> **Decision:** On a miss, paste anyway, leave the PNG on the clipboard, and raise the window. Do not inspect the page and do not write a Downloads copy.
> **Rationale:** The shell cannot see the composer without reading grok.com. The clipboard is the retry. The previous clipboard contents are replaced and stay replaced until the user copies something else.
> **Alternatives considered:** Skip the paste and only fill the clipboard. Save to Downloads. Paste and also save to Downloads.

> **Decision:** If the portal is missing at startup, the app still launches, the shortcut is absent, and the failure is logged.
> **Rationale:** Chat, tabs, and login must work on a session where the portal is broken.
> **Alternatives considered:** Fall back to Electron `globalShortcut`. Refuse to start.

> **Decision:** Cancelling the region tool does nothing.
> **Rationale:** A dismissed shot is not a request to switch back to GrokDesktop.
> **Alternatives considered:** Raise the window. Raise the window and clear the clipboard.

> **Decision:** A second press while a capture is in progress is ignored until that capture finishes or is cancelled.
> **Rationale:** Two region tools at once is not a useful outcome.
> **Alternatives considered:** Restart the selection. Queue another shot.

> **Decision:** GNOME holds the binding. The app suggests Ctrl+Alt+S and ships no shortcut settings UI.
> **Rationale:** Rebinding belongs to the portal dialog and GNOME Settings. Print is GNOME's own screenshot key. Super chords are often eaten by the shell.
> **Alternatives considered:** Suggest no chord. Suggest Super+Shift+S, Ctrl+Shift+G, or Print. Build an in-app picker.

> **Decision:** A failed shot is one main-process `console.error` line, prefixed `GrokDesktop capture:`. The window is not raised, and the clipboard is not changed.
> **Rationale:** This shell has no notification feature and no error UI. A dock-launched process still writes the main-process error stream.
> **Alternatives considered:** Raise with nothing pasted. Desktop notification. A log file under `~/.config/GrokDesktop`. Both a file and stderr.

> **Decision:** The portal client is `dbus-next` in the main process.
> **Rationale:** CreateSession, BindShortcuts, and Screenshot are request objects plus a Response signal. Electron does not expose those calls.
> **Alternatives considered:** Shell out to `gdbus`. Electron-only.

> **Decision:** If a manual check on a real chat shows that grok.com does not insert the pasted image, stop and report. Do not inject.
> **Rationale:** Injection was rejected for this pass. The clipboard still holds the PNG, which is the useful residue of a failed paste.
> **Alternatives considered:** Drive the attach control in the same pass. Drop the paste and ship clipboard-only instead.

> **Decision:** Write the clipboard before raising the window. A failed clipboard write is a failed shot.
> **Rationale:** Raising first would steal focus with no image. The paste path reads the clipboard, so the image has to be there first.
> **Alternatives considered:** Raise first. Paste a file path as text.

> **Decision:** The clipboard value is image bytes from the PNG, written with `clipboard.writeImage`. The Screenshot call is interactive, not modal, with an empty `parent_window`.
> **Rationale:** A path string does not attach. A modal parent would tie the region tool to this window. The user has to be able to drag a rectangle on any monitor GNOME offers, including over GrokDesktop.
> **Alternatives considered:** Modal to the GrokDesktop window. Capture only the monitor the window is on.

> **Decision:** The portal shortcut id is `capture-region`. The preferred trigger string is `<Control><Alt>s`. The user-visible description is `Capture a region and paste it into GrokDesktop`. Register when the main window is opened and drop the registration when it closes.
> **Rationale:** A stable id is what lets GNOME remember the binding. The description must not say send. Registration follows the window lifetime already chosen.
> **Alternatives considered:** A new id per launch. A local chord in addition to the portal.

> **Decision:** If GNOME asks for the binding on every launch, stop and report. Do not switch to Electron `globalShortcut`.
> **Rationale:** A dialog on every start means the portal is not keeping the host app's id. Falling back to the API this design rejected would hide that.
> **Alternatives considered:** Re-bind silently each launch. Fall back to `globalShortcut`.

## Deferred

- Pressing Enter or otherwise sending the message.
- Finding the composer, driving the attach button, or any other page injection.
- A tray or other resident process so the shortcut works after quit.
- An in-app shortcut editor.
- Electron `globalShortcut` and `desktopCapturer`.
- A desktop notification or a log file on failure.
- A Downloads copy of the PNG.
- Granting the page `display-capture`.

## Implementation Phases

### Phase 1 — Pure capture decisions

**Objective:** Shot outcomes are a pure module with no Electron and no D-Bus.

**Tasks:**

1. Add `src/capture/decide.ts`. State is `idle` or `selecting`. `onActivate` from `idle` moves to `selecting` and returns `start`. `onActivate` from `selecting` returns `ignore` and stays `selecting`. A cancel result returns `noop` and `idle`. An error or empty image returns `log` and `idle`. A non-empty PNG returns `paste` and `idle`.
2. Add `src/capture/portal-messages.ts`. Export the shortcut id `capture-region`, the description `Capture a region and paste it into GrokDesktop`, and the preferred trigger `<Control><Alt>s`. Build the BindShortcuts shortcut list from those. Parse a Screenshot Response: code 0 with a `file:` URI is success and a filesystem path; code 1 is cancel; anything else, a non-file URI, or a missing URI is an error string. Do not read the file in this module.
3. Add `test/capture.test.ts` for both modules.

**Acceptance criteria:**

- `npm test` passes.
- Neither new module imports `electron` or `dbus-next`.
- The tests cover start, ignore-while-selecting, cancel, error, empty image, paste, the three exported strings, and `file:` versus non-file URIs.

### Phase 2 — Portal registration

**Objective:** The running window owns one GlobalShortcuts binding and can open the region tool.

**Tasks:**

1. Add `dbus-next` under `dependencies`, not `devDependencies`.
2. Extend `build.files` so the rpm contains `dbus-next` and its runtime dependencies. The current `files` list replaces electron-builder's default and does not pack `node_modules`. Confirm the unpacked `release/` tree contains the package. Do not publish a release.
3. Add `src/capture/portal.ts`, the only module that imports `dbus-next`. Connect to the session bus, `CreateSession`, then `BindShortcuts` for `capture-region`. Listen for `Activated` on that session. On activate, and only when `decide` returns `start`, call Screenshot with `interactive: true`, `modal: false`, and `parent_window: ""`. Feed the response to the parser and then to `decide`.
4. Call the installer from `openMainWindow` after `attachTabs`. On the window `closed` event, release the session and the bus connection. A portal failure at startup logs `GrokDesktop capture:` and does not throw out of startup.
5. Log prefix is `GrokDesktop capture:`. One line per failure. Do not log image bytes.

**Acceptance criteria:**

- `npm test` still passes, and the new tests still do not open a bus.
- With the portal present, the suggested chord opens the region tool while GrokDesktop is unfocused, and while it is minimized.
- Cancel leaves focus and the clipboard unchanged.
- A second press during the region tool does not open a second tool.
- With the portal unavailable, `npm start` still opens grok.com and logs one line.
- Quitting the app stops the shortcut.
- The binding is remembered across one restart. If the bind dialog appears on every launch, stop and report.

### Phase 3 — Paste into the active tab

**Objective:** A completed region becomes a clipboard image and a paste in the active tab.

**Tasks:**

1. Extend `TabHost` in `src/tabs/host.ts` with one method, `pasteClipboard`. It restores the window if minimized, shows it, focuses it, focuses the active view's `webContents`, and calls `webContents.paste()`. It does not send a key. It does not touch the clipboard.
2. In the portal adapter, on a `paste` decision: read the PNG from the parsed path, `clipboard.writeImage` with `nativeImage.createFromBuffer`. If the read or the write fails, log and do not call `pasteClipboard`. If the write succeeds, call `pasteClipboard`.
3. Update `README.md` so the window section documents Ctrl+Alt+S, that GNOME may ask to confirm it once, that the image is pasted and not sent, and that the shortcut exists only while the window does.
4. Update `Context.md` so the architecture description matches the code: portal shortcut, no page injection, `display-capture` still denied, quit-on-close unchanged. Do not edit `docs/artifacts/grokdesktop-electron-shell.md`.

**Acceptance criteria:**

- On this machine, with a grok.com chat open and the composer able to take a paste: another window is focused, the chord starts a region drag, GrokDesktop comes forward, the image is in the composer, and the message is not sent.
- A second manual paste from the clipboard inserts the same image.
- Cancel and a denied shot do not move the window and do not change the clipboard.
- If that chat does not insert the pasted image, stop. Leave the PNG on the clipboard. Do not start an injection change.
- `npm test` passes.

## Progress

- [x] Phase 1 — Pure capture decisions
- [x] Phase 2 — Portal registration
- [x] Phase 3 — Paste into the active tab

## Testing Strategy

Phase 1 is red-green on `test/capture.test.ts` before the adapter exists. The adapter is verified by the manual checks in Phases 2 and 3, on the GNOME Wayland session this app already targets. Do not add an Electron launch test or a live portal test.

The Phase 3 chat check is a stop condition, not a prompt to change approach. Record what the composer did and end the pass when the paste does not insert an image.

## Rollback / Risk Notes

- Host apps sometimes get a fresh GlobalShortcuts identity on every launch, which reopens the bind dialog. That is a stop-and-report, not a fallback.
- `webContents.paste()` inserts where the page's focus is. A home screen or an unfocused composer will not attach. The clipboard retry is the intended recovery. Do not read the DOM to detect it.
- The PNG replaces whatever the user had copied.
- `dbus-next` must be in the rpm. A `files` list that only names `dist/` will hide a green local run from the installed app.
- Portal temp files are the portal's. Do not copy them into Downloads or `userData`.

## Reference Files

- `src/main.ts` — startup. Capture must not be able to prevent the window from opening.
- `src/window/open.ts` — `openMainWindow`, `focusMainWindow`. Register and tear down here.
- `src/tabs/host.ts` — active `WebContentsView`, `before-input-event`, `TabHost`.
- `src/window/shortcuts.ts` — focused chords. Leave this mapping as Ctrl+T and Ctrl+W.
- `src/permissions/decide.ts` — `display-capture` stays denied.
- `package.json` — `build.files` and dependency vs devDependency.
- `Context.md` — living architecture notes to update in Phase 3.
- `README.md` — user-facing shortcut note in Phase 3.
- `docs/artifacts/grokdesktop-electron-shell.md` — historical. Do not edit.

## Cold-start

Read `docs/artifacts/grokdesktop-region-capture.md` and continue from the plan. Honor Constraints and Key Decisions; do not re-open them. Start at the first incomplete Progress item. Confirm only if Open Questions block progress. This file is not permission to implement until the user says to build.
