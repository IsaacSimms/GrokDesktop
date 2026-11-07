# Ctrl+Left and Ctrl+Right switch tabs

**Date:** 2026-11-06
**Type:** feature

## TL;DR

Ctrl+Left and Ctrl+Right now move to the previous and next tab while the GrokDesktop window is focused, and they stop at the ends. The chords reuse the existing `shortcutFor` / `before-input-event` path. All 46 tests passed.

## Context & Goal

The title-bar tabs could be switched by click, opened with Ctrl+T, and closed with Ctrl+W. The ask was arrow-key movement between them, then specifically Ctrl+Left and Ctrl+Right, because bare arrows would be swallowed inside the grok.com page.

## Key Points Explored

- Tab switching already existed. `activate` in `src/tabs/host.ts` calls `switchTab`, and an out-of-range index returns the same state.
- Focused shortcuts already run on `before-input-event` for the shell `webContents` and every tab view. A match calls `preventDefault`.
- The mapping in `src/window/shortcuts.ts` requires `keyDown`, Control, and no Alt, Meta, or Shift. Keys are lowercased.
- Unmodified Left and Right would also move the caret in the chat box, because that listener sits on the page. Ctrl+Left and Ctrl+Right fit the existing modifier rule. Ctrl+Tab was the other chord that would leave the composer alone. The user chose Ctrl+Left and Ctrl+Right.

## Decisions & Outcomes

- `shortcutFor` maps `ArrowLeft` to `previous-tab` and `ArrowRight` to `next-tab`.
- `onShortcut` activates `activeIndex - 1` or `activeIndex + 1`. The ends stop.
- Plain arrows, and arrows with Shift, still reach the page.
- `test/shortcuts.test.ts` covers the new chords and the rejected modifiers. `npm test`: 11 files, 46 tests, all passed.
- README window section and `Context.md` describe the new chords. An already-open app needs a restart to pick this up.

## Artifacts

- `src/window/shortcuts.ts` — `previous-tab` and `next-tab` added.
- `src/tabs/host.ts` — those shortcuts call `activate`.
- `test/shortcuts.test.ts` — mapping tests.
- `README.md` — user-facing shortcut line.
- `Context.md` — shortcut mapping updated to match the code.
