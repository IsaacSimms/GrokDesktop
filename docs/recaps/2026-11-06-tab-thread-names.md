# Tab strip shows the thread name

**Date:** 2026-11-06
**Type:** feature

## TL;DR

GrokDesktop tabs were labeled with the grok.com path. They now show the page's thread name once Grok sets `document.title`, and keep the URL label until then. The full URL stays on hover. Titles are not saved.

## Context & Goal

With a Grok thread open, the title-bar tab showed a truncated URL such as `grok.com/c/c29cb267-d…`. The ask was how large a change it would be to show the thread name instead, then to implement it.

## Key Points Explored

- `labelFor` in `src/renderer/tab-strip.ts` built every label from the hostname and path. `src/tabs/host.ts` stored the URL from navigation and never read `webContents.getTitle()`.
- Grok puts the thread, project, or bot name in `document.title`. Electron already delivers that on `page-title-updated`, so the strip did not need a script injected into grok.com.
- `src/renderer/tab-strip.ts` stays free of imports so its ES2022 emit remains a classic script. The display rule lives in the strip. The cleanup rule lives in `src/tabs/title.ts` (`tabTitle`), which the host applies before sending the payload.
- `TabStripState` is declared three times (`src/ipc.ts`, `src/renderer/preload.ts`, `src/renderer/tab-strip.ts`) because the preload sandbox and the strip script cannot import the main-process module.

## Decisions & Outcomes

- The payload gained `titles: string[]`, aligned with `tabs`. An empty string means "no thread name yet."
- `tabTitle` trims the string, strips a leading or trailing `Grok` separator (`-`, `–`, `—`, or `|`), and returns `""` for a blank title, a bare `Grok`, or a title that is an `http(s)` URL.
- The strip prefers `titles[i]`. Otherwise it shows hostname plus path, as before. The button tooltip remains the full URL. The close control's `aria-label` uses the visible label.
- The host updates a title from `page-title-updated` and from `getTitle()` when a navigation finds the document title already changed. It does not blank the label on navigation while the old title is still current, so a title that arrives just before the URL change is kept. A title-only update sends `tabs-updated` and does not rewrite `window-state.json`.
- Verified with `npm test` (12 files, 60 tests) and `tsc -p tsconfig.json --noEmit` plus `tsc -p tsconfig.renderer.json --noEmit`. The desktop window was not launched.

## Open Questions / Next Steps

- Open a thread in the running app and confirm the path is replaced by the thread name. Same check for a project or bot tab, and for a brand-new tab, which should stay on the URL until Grok sets a title.

## Artifacts

- `src/tabs/title.ts` — new. `tabTitle`.
- `src/tabs/host.ts` — tracks raw and cleaned titles beside each view.
- `src/ipc.ts`, `src/renderer/preload.ts`, `src/renderer/tab-strip.ts` — `titles` on `TabStripState`.
- `test/tabs.test.ts` — `tabTitle` cases.
- `Context.md` — tab-label contract updated to match.
