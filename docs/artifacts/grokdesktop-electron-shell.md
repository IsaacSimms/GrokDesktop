---
title: GrokDesktop Electron shell
status: ready
updated: 2026-11-05
project: GrokDesktop
---

# GrokDesktop Electron shell

## TL;DR

Build a personal Fedora desktop app that wraps https://grok.com in Electron. The website stays the UI. The shell adds one persistent login, a basic tab strip, and a native window that remembers its tabs and size. v1 is bare bones and modular: later features are new modules in this repo, rebuilt into a new rpm. There is no in-app updater, no CI, no tray, no global hotkey, and no injection into the page.

## Problem Statement

The repo is a stub. `README.md` is one line (an Electron wrapper around grok.com for Linux). `LICENSE` is already GPLv3. `docs/` has empty leaves and no app code.

The user wants grok.com as a desktop app on their Fedora machine. Public Windows wrappers exist; this one is for this Linux box. A GitHub release exists so the repo is complete, not because the app is a supported product for other people.

## Requirements

Functional:

1. The app loads `https://grok.com` (the site root) in Electron. The site routes login and chat.
2. One login persists across restarts. There is no account switcher and no second profile.
3. A second launch while the app is running focuses the existing window and does not start another process.
4. Closing the window quits the app.
5. The window uses Fedora’s native titlebar. The tab strip sits under that titlebar.
6. The tab strip can open a tab, close a tab, and switch tabs by click. Keyboard shortcuts while the window is focused: Ctrl+T opens a tab, Ctrl+W closes the active tab.
7. Each tab is its own grok.com page. Every tab shares the one login. A new tab loads `https://grok.com`.
8. The strip always has at least one tab. Ctrl+W on the only tab leaves that tab open. Quitting is closing the window.
9. On startup, the app reopens the saved tab URLs and the active tab, and restores the last window size and position. A missing or invalid save starts with one `https://grok.com` tab and a default size.
10. Saved tab URLs that are not `https://grok.com` or `https://*.grok.com` are dropped on restore.
11. grok.com and its login flow stay in the app. Other links open in the system browser. The classifier rules are in **Link rules** below.
12. File attach uses the system file dialog. Downloads save into the user’s Downloads folder with no custom download UI.
13. When grok.com asks for the microphone or camera, the app allows it. There is no custom permission UI.
14. Notification permission is denied. The app does not implement desktop notifications.
15. The shell does not inject CSS or JavaScript into grok.com, and it does not read the page to build tabs.
16. The app identifies as Chrome. The user-agent string lives in one constant and does not contain `Electron`.
17. The Fedora app name is **GrokDesktop**. The icon is original artwork, not an xAI or Grok logo.
18. `README.md` states that GrokDesktop is unofficial and not affiliated with xAI, and it documents how to build the rpm on Fedora.
19. Our code stays GPLv3. `LICENSE` stays. Electron and Chromium keep their own licenses, and the rpm ships the usual third-party notices.
20. `npm run dist` (or the documented equivalent) produces a Fedora rpm on this machine.

Non-functional:

21. TypeScript. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
22. Shell behavior that does not need Electron (tab list, restore payload, link classification) lives in plain modules and has unit tests. No test hits the live grok.com site.
23. Feature code is grouped in internal modules (window, tabs, links, permissions, session, persist). The main entry file only boots them. There is no plugin loader.
24. On a Wayland session the window is a native Wayland window. Do not force XWayland.

### Link rules

Implement these as a pure function. Tests cover the table.

| Kind | URL | Result |
| --- | --- | --- |
| Main-frame navigation | `https://grok.com` or `https://*.grok.com` | Stay in the current tab |
| Main-frame navigation | Any other host | Cancel, open in the system browser |
| Server redirect (`will-redirect`) | Any host | Stay in the current tab (login redirect chain) |
| `window.open` / `_blank` | grok.com host | New tab |
| `window.open` with popup disposition or popup window features | Any host | Child window, same session (login popup) |
| `window.open` / `_blank` | Any other host, not a popup | System browser |

A child login window uses the same persistent session. When the site closes it, it stays closed. Do not turn non-grok popups into tabs.

## Constraints

- Fedora first. The only package target is an rpm. No AppImage, deb, Flatpak, Windows, or macOS build.
- The rpm is built locally and can be attached to a GitHub Release by hand. No GitHub Actions in v1. No in-app updater. A later feature means a code change rebuilt into a new rpm.
- Do not publish the GitHub Release unless the user explicitly asks. The build must produce the rpm and the README must say how to attach it.
- No system tray, no global hotkey, no desktop notification feature, no page injection, no conversation scraping, no custom frameless titlebar.
- No plugin host, no dependency-injection container, no ports-and-adapters framework.
- Do not present the app as an official xAI product. Do not ship xAI’s logo.
- Personal app. Do not add a support channel, auto-update, or multi-distro packaging to “finish” the repo.

## Key Decisions

Grill-me settled every branch below. Do not re-open them.

> **Decision:** v1 is an Electron shell around https://grok.com: one window, one persistent login, and our own basic tab strip.
> **Rationale:** The website stays the UI. A custom client would break whenever xAI changes the site.
> **Alternatives considered:** Thin shell with no tabs. Custom desktop client with its own chrome and chat features.

> **Decision:** Notifications, a system tray, and a global show/hide hotkey are not in v1.
> **Rationale:** v1 stays bare bones. A global hotkey is a small Electron call and is unreliable on GNOME Wayland without a desktop portal.
> **Alternatives considered:** Full convenience set (tray, hotkey, notifications) in v1. Notifications without tray or hotkey.

> **Decision:** The audience is this Fedora machine. A GitHub release exists so the repo is complete, not as a supported app for other people.
> **Rationale:** The daily driver comes before a public product.
> **Alternatives considered:** Run from the repo with no installer. Published multi-distro Linux app. Cross-platform app.

> **Decision:** The release artifact is a Fedora rpm built on this machine. No CI. No in-app updater.
> **Rationale:** Native install here. Electron CI is a larger lift than attaching an rpm you built. Updates are a new rpm installed by hand.
> **Alternatives considered:** AppImage. Git tag with no installer. rpm plus an in-app updater. GitHub Actions builds the rpm. CI plus local builds.

> **Decision:** Runtime is Electron.
> **Rationale:** grok.com runs in Chromium, so the site behaves like a normal browser. electron-builder emits the rpm.
> **Alternatives considered:** Tauri (WebKitGTK can break the site). A dedicated Chromium `--app` window, which cannot be this shell.

> **Decision:** The entry URL is `https://grok.com`.
> **Rationale:** The site routes login and chat. A deep path breaks if xAI renames it.
> **Alternatives considered:** A specific grok.com path. Grok inside x.com.

> **Decision:** One session persists across launches. No account switcher.
> **Rationale:** The app is something you stay signed into. Profiles are a second product.
> **Alternatives considered:** Multiple account profiles. A fresh session every launch.

> **Decision:** Extensibility is internal feature modules in this repo. TypeScript, contextIsolation, unit tests for shell logic. No plugin loader.
> **Rationale:** v1 stays small. Later features are new modules, rebuilt into a new rpm. A plugin host or a clean-architecture framework would be the product.
> **Alternatives considered:** Plugin host. A flat main file, split later. Ports, adapters, and a DI container.

> **Decision:** Each tab is its own grok.com page on the shared login. A new tab opens `https://grok.com`. The shell does not scrape conversations out of the page.
> **Rationale:** Tabs that depend on grok.com’s markup break when the site changes.
> **Alternatives considered:** Tabs bound to specific chats. One OS window per page. No shell tabs, using only the site’s conversation list.

> **Decision:** The tab strip can create, close, and click-switch, plus Ctrl+T and Ctrl+W.
> **Rationale:** Drag-reorder, pinned tabs, and reopen-closed are extra UI. Ctrl+T and Ctrl+W only run while the window is focused.
> **Alternatives considered:** Full browser tab strip. Click-only, with no shortcuts.

> **Decision:** Fedora’s native titlebar, tab strip underneath.
> **Rationale:** Drag, snap, and maximize stay with the desktop. A custom frame makes those our bugs.
> **Alternatives considered:** Frameless Chrome-style titlebar with the tabs inside it.

> **Decision:** Restart restores tab URLs, the active tab, and the window bounds.
> **Rationale:** A strip that forgets its tabs on quit only helps for one run. Restoring URLs is small next to building the strip.
> **Alternatives considered:** Remember bounds only and always open one fresh tab. Fresh default window every launch.

> **Decision:** grok.com and its login flow stay in the app. Other links open in the system browser.
> **Rationale:** Sign-in has to return to the session. The shell is not a general browser. Sending login redirects outside can break sign-in.
> **Alternatives considered:** Every link stays in the app. Only exact grok.com stays, including kicking login redirects outside.

> **Decision:** One running instance. A second launch focuses the existing window.
> **Rationale:** Two processes on one login can fight over the same cookies.
> **Alternatives considered:** Multiple instances sharing one profile.

> **Decision:** Closing the window quits the app.
> **Rationale:** There is no tray to keep a background process alive.
> **Alternatives considered:** Close-to-tray. That requires the tray, which is deferred.

> **Decision:** The shell never injects CSS or JavaScript into grok.com.
> **Rationale:** v1 has no feature that needs it. Injection breaks when the site changes. A later module can add it if a feature needs it.
> **Alternatives considered:** A content-script hook built now, unused. Inject in v1 to restyle the site.

> **Decision:** Chat, file attach, and downloads to the Downloads folder work. Mic and camera are granted when the site asks. No custom permission UI. Notification permission is denied.
> **Rationale:** Electron denies permission requests unless a handler grants them. Denying the mic leaves a dead button on the page. Notifications were dropped from v1.
> **Alternatives considered:** Chat and files, but deny mic and camera. Text chat only.

> **Decision:** The app is named GrokDesktop, uses an original icon, and the README says it is unofficial and not affiliated with xAI.
> **Rationale:** A public repo must not present itself as the official Grok app.
> **Alternatives considered:** The name Grok and a lookalike of xAI’s logo. A neutral name that does not say Grok.

> **Decision:** GPLv3 for our code. `LICENSE` stays. Electron and Chromium keep their own licenses.
> **Rationale:** The repo already chose GPL. The release does not relicense the runtime.
> **Alternatives considered:** Relicense our code to MIT. Remove the license.

> **Decision:** The session user agent is a Chrome user agent.
> **Rationale:** grok.com should treat the window like a normal browser, including at login.
> **Alternatives considered:** The default Electron user agent. Ship Electron’s UA and switch only if the site breaks.

Plan defaults for edges the grill did not ask. Treat them as locked unless the user reopens them.

> **Decision:** Ctrl+W on the last tab does not quit and does not remove that tab.
> **Rationale:** Window close is the quit path. A tab shortcut should not be a second quit.
> **Alternatives considered:** Ctrl+W on the last tab closes the window.

> **Decision:** Toolchain is npm, TypeScript, Electron, electron-builder, and Vitest.
> **Rationale:** One lockfile and a test runner that can load plain modules without launching Chromium. Shell logic stays out of Electron callbacks so the tests do not need a display.
> **Alternatives considered:** pnpm or yarn. Jest. End-to-end tests against live grok.com.

> **Decision:** Non-media permission requests other than what Electron already allows by default are denied. `media` is granted. `notifications` and `display-capture` are denied.
> **Rationale:** Matches “allow mic and camera, no notification feature” without turning the shell into a browser that grants every prompt.
> **Alternatives considered:** Grant every permission the site asks for.

## Deferred

- System tray.
- Global show/hide hotkey, including a GNOME Wayland global-shortcuts portal.
- Desktop notifications as a feature.
- Drag-reorder, middle-click close, pinned tabs, reopen-closed, Ctrl+Tab.
- Background tab discarding.
- Multi-account profiles.
- Plugin host or a content-script framework. Page injection only if a later feature needs it.
- GitHub Actions, in-app updater, AppImage, deb, Flatpak, Windows, macOS.
- Custom frameless titlebar.
- A handler that opens external `grok.com` links in this app.
- “Open in new window” from the tab strip.

## Implementation Phases

### Phase 1 — Secure window

**Objective:** A single native window loads grok.com, stays signed in, and refuses a second process.

**Tasks:**

1. Add an npm + TypeScript Electron app. Main entry only boots modules.
2. Create the session module: persistent partition, Chrome user agent constant, `contextIsolation`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
3. Create the window module: native frame, load `https://grok.com`, quit when the window closes, single-instance lock that focuses the existing window.
4. Use Electron’s native Wayland path when `WAYLAND_DISPLAY` is set. Do not add an X11-only flag.
5. Preload exposes nothing the page can use to reach Node. No injection.

**Acceptance criteria:**

- `npm start` opens one window on `https://grok.com` with the native titlebar.
- Starting the app again focuses that window.
- Closing the window exits the process.
- The user agent sent with the page does not contain `Electron`.
- A second run still has the same user-data directory (the login partition is persistent).

### Phase 2 — Tab strip

**Objective:** Multiple grok.com pages in one window, on one login.

**Tasks:**

1. Add a pure tab model: open (URL defaults to `https://grok.com`), close, switch by index, active index. Closing the last tab is a no-op.
2. Vitest covers that model, including the last-tab no-op.
3. Add a renderer that is only the tab strip, under the native titlebar. Clicks switch. Buttons open and close.
4. Each tab is its own web contents sharing the session from Phase 1. Ctrl+T and Ctrl+W call the model while the window is focused.
5. The strip does not drag-reorder, pin, or reopen closed tabs.

**Acceptance criteria:**

- Tab-model tests pass.
- Two tabs can show two grok.com pages. Navigating one does not navigate the other.
- Ctrl+T opens `https://grok.com`. Ctrl+W closes the active tab. Ctrl+W on the only tab leaves it.
- The page DOM is not read or modified by the shell.

### Phase 3 — Links, downloads, permissions

**Objective:** Login stays in the app. Ordinary outbound links do not. Mic and camera work. Downloads land in Downloads.

**Tasks:**

1. Add a pure link classifier that implements the **Link rules** table. Vitest covers every row.
2. Wire `will-navigate`, `will-redirect`, and `setWindowOpenHandler` through that classifier. External results use the system browser.
3. On `will-download`, save into `app.getPath('downloads')` without a custom UI.
4. Permission handler: grant `media`; deny `notifications` and `display-capture`. Do not add a permission window.
5. Do not intercept `<input type="file">`.

**Acceptance criteria:**

- Classifier tests pass, one assertion set per table row.
- A non-grok link click leaves the tab on grok.com and opens the system browser.
- A grok.com `_blank` opens a new tab.
- A popup window opens as a child window on the same session, not as a browser tab and not in Firefox/Chrome.
- A file download appears in the Downloads folder.
- A mic or camera request from the page is granted. A notification request is denied.

### Phase 4 — Restore

**Objective:** Quit and relaunch returns the same tabs and the same window geometry.

**Tasks:**

1. Add a pure persist module: serialize and parse `{ bounds, tabs: string[], activeIndex }`. Drop non-grok tab URLs. Empty or corrupt input becomes one `https://grok.com` tab and null bounds.
2. Vitest covers round-trip, corrupt payload, and a non-grok URL in the list.
3. Save on tab changes, on bounds changes, and on quit. Restore before the first paint of the strip.
4. If bounds are missing, use a default size and let the window manager place the window.

**Acceptance criteria:**

- Persist tests pass.
- With two grok.com tabs open, quit and relaunch shows both URLs and the previous active tab, at the previous size and position.
- A saved file whose only URL is not grok.com opens one `https://grok.com` tab.

### Phase 5 — Fedora rpm and repo surface

**Objective:** This machine can install an rpm named GrokDesktop, and the repo tells the truth about what it is.

**Tasks:**

1. electron-builder target: Linux rpm, x64. Product name `GrokDesktop`. Desktop entry name `GrokDesktop`.
2. Add an original icon under the build config. Do not copy xAI or Grok artwork.
3. Rewrite `README.md`: what the app is, that it is unofficial and not affiliated with xAI, how to run it, how to build the rpm, and how to attach that rpm to a GitHub Release by hand. Keep the GPLv3 `LICENSE`. Ship Electron’s third-party notices with the rpm.
4. Do not add GitHub Actions, an updater URL, or a second package format.

**Acceptance criteria:**

- The documented build command produces an `.rpm` on this Fedora machine.
- Installing that rpm shows **GrokDesktop** in the app grid with the original icon, and launching it opens the shell.
- README contains the unofficial / not-affiliated statement and the local rpm steps.
- `LICENSE` is still GPLv3. No CI workflow files were added.

## Progress

- [x] Phase 1 — Secure window
- [x] Phase 2 — Tab strip
- [x] Phase 3 — Links, downloads, permissions
- [x] Phase 4 — Restore
- [x] Phase 5 — Fedora rpm and repo surface

## Testing Strategy

Unit-test the pure modules with Vitest: tab model, link classifier, persist parser. Run those tests without launching Electron and without a network call to grok.com.

Manual checks, once per phase, against the real site: login survives restart, two tabs are independent, an external link opens the system browser, a login popup stays in the app, a download lands in Downloads, mic permission is granted, the rpm installs and launches. Do not automate those against live grok.com.

## Rollback / Risk Notes

- Uninstalling the rpm removes the app. User data stays in Electron’s user-data directory (`~/.config/GrokDesktop` unless the product name changes it). Deleting that directory signs the user out.
- The likely breaks are site-side, not shell-side: login host behavior, and a Chrome user agent that goes stale. The user agent is one constant so it can be updated without a redesign.
- Each extra tab is a full Chromium page. v1 does not discard background tabs. That is accepted.

## Reference Files

- `README.md` — current one-line stub; Phase 5 replaces it.
- `LICENSE` — GPLv3; do not relicense.
- `docs/artifacts/grokdesktop-electron-shell.md` — this plan.

## Cold-start

Read `docs/artifacts/grokdesktop-electron-shell.md` and continue from the plan. Honor Constraints and Key Decisions; do not re-open them. Start at the first incomplete Progress item. Confirm only if Open Questions block progress. This file is not permission to implement until the user asks to build.

## Open Questions

None. Auth hosts are handled by the link rules (redirects and popups stay in the app), not by a guessed allowlist.
