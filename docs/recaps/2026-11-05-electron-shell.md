# GrokDesktop Electron shell

**Date:** 2026-11-05
**Type:** implementation
**Environment / Systems:** Fedora target. Built and smoke-launched on the cloud agent's Linux VM (Node 22, Electron 45.2.3, electron-builder 26.18.0, Vitest 5).

## TL;DR

GrokDesktop is now an unofficial Electron shell around https://grok.com: one persistent login, a basic tab strip, and a native window that restores its tabs and size. `npm test` passes (38 tests). `npm run dist` writes `release/grokdesktop-0.1.0.x86_64.rpm`. Login, mic, downloads, and installing that rpm still need a pass on the Fedora machine.

## Context & Goal

The repo was a stub: a one-line README, GPLv3 `LICENSE`, and the plan in `docs/artifacts/grokdesktop-electron-shell.md`. The goal was to implement that plan with test-driven development, then leave a recap and a user-facing handoff.

## Key Points Explored

- Shell behavior that does not need Electron lives in plain modules: tab model, link classifier, persist parser, permission decision, Wayland switches, shortcuts, and download paths. Vitest covers those. No test calls grok.com.
- The main process only boots session, permissions, downloads, and the window. Each grok.com tab is its own `WebContentsView` on the `persist:grokdesktop` partition. The tab strip is our page and is the only place with a preload. grok.com pages get no preload and no injected script.
- Link rules match the plan table. Electron reports both `NEW_POPUP` and `NEW_WINDOW` as disposition `new-window`, so that disposition is treated as a popup. A login popup is a child window on the same session and may navigate to non-grok hosts. A normal tab does not: non-grok main-frame navigations go to the system browser, and server redirects stay in the tab.
- The user agent is one constant, Chrome 157.0.8103.38 on Linux, and does not contain `Electron`.
- `linux.publish` is null so the rpm does not ship `app-update.yml`.
- A first smoke launch looked for the tab strip at `dist/window/renderer` and failed with `ERR_FILE_NOT_FOUND`. Asset paths now resolve to `dist/renderer`. A later headless launch stayed up, created `~/.config/GrokDesktop/Partitions/grokdesktop`, and saved `https://grok.com/`.

## Decisions & Outcomes

The plan's decisions were left as written. The shell is implemented on branch `cursor/electron-shell-4202` (commit `b783dd9`, plus the docs commit that adds this file). Pull request: https://github.com/IsaacSimms/GrokDesktop/pull/1

Verified here:

- `npm test` — 10 files, 38 tests.
- `npx tsc -p tsconfig.json` and `npx tsc -p tsconfig.renderer.json`.
- `npm run dist` produced `release/grokdesktop-0.1.0.x86_64.rpm` (about 87 MB). Desktop entry `Name=GrokDesktop`, `StartupWMClass=grokdesktop`. GPLv3 `LICENSE` is at `/opt/GrokDesktop/resources/LICENSE`. Electron and Chromium notices are in the package. No `app-update.yml`.

Not verified here: signing in, a second launch focusing the window, two independent tabs, an external link, a login popup, a download, mic or camera, and installing the rpm on Fedora. This VM has no desktop session; the process was started under Xvfb with `--disable-gpu`.

## Open Questions / Next Steps

Run the local runbook in `docs/handoffs/2026-11-05-electron-shell-runbook.md` on the Fedora machine. Do not publish a GitHub Release unless you decide to.

## Artifacts

- `docs/artifacts/grokdesktop-electron-shell.md` — plan; progress boxes marked done.
- `docs/handoffs/2026-11-05-electron-shell-runbook.md` — local runbook.
- `README.md` — unofficial notice, how to run, how to build the rpm, how to attach it by hand.
- `src/session/user-agent.ts` — the Chrome user-agent constant.
- `release/grokdesktop-0.1.0.x86_64.rpm` — built in this environment, gitignored, not published.
