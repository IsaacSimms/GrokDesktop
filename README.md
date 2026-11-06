# GrokDesktop

GrokDesktop is an unofficial desktop shell for [grok.com](https://grok.com), built for Fedora. The website stays the UI. The shell adds one persistent login, a basic tab strip, and a native window that remembers its tabs and size.

**GrokDesktop is not affiliated with, endorsed by, or sponsored by xAI.** grok.com and the Grok name are used only to describe the site this shell loads.

Our code is [GPLv3](LICENSE). Electron and Chromium keep their own licenses. A built rpm includes those third-party notices under `third-party/` in the app resources.

## Run from source

Install Node.js 22 or newer, then:

```bash
npm install
npm test
npm start
```

`npm start` opens one window on https://grok.com. Sign in there. The next launch uses the same login. A second launch focuses the window that is already open. Closing the window quits the app.

The tab strip can open a tab, close a tab, and switch tabs. Ctrl+T opens https://grok.com. Ctrl+W closes the active tab. Ctrl+W on the only tab leaves it open.

Links that stay on `https://grok.com` or `https://*.grok.com` stay in the app. Other links open in the system browser. Login redirects stay in the tab. A login popup stays in a child window on the same login.

Downloads go to your Downloads folder. The system file dialog is used for attachments. Microphone and camera requests are allowed. Notification and screen-capture requests are denied.

Window size, position, and tab URLs are saved in `~/.config/GrokDesktop`. Deleting that directory signs you out.

On a Wayland session the window uses the native Wayland path. The shell does not force XWayland.

## Build an rpm

On Fedora:

```bash
sudo dnf install nodejs npm
npm install
npm run dist
```

The rpm is written under `release/`. Install it with:

```bash
sudo dnf install ./release/*.rpm
```

GrokDesktop then shows up in the app grid under that name, with its own icon. Launching the installed app and `npm start` share `~/.config/GrokDesktop`.

There is no in-app updater and no CI build. A later change is a new rpm installed by hand.

## Attach the rpm to a GitHub Release

Build the rpm locally, then create the release yourself. This repository does not publish releases for you.

```bash
gh release create v0.1.0 release/*.rpm \
  --title "v0.1.0" \
  --notes "Unofficial Fedora rpm. Not affiliated with xAI."
```

Use the version in `package.json` for the tag. Do not describe the release as an official xAI or Grok app.

## Development

```bash
npm test
npm run build
```

`npm test` runs Vitest on the tab model, link rules, and saved-window parser. It does not launch Electron and it does not call grok.com.

The Chrome user-agent string lives in `src/session/user-agent.ts`.
