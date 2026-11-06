# GrokDesktop

GrokDesktop is an unofficial desktop shell for [grok.com](https://grok.com), built for Fedora. The website stays the UI. The shell adds one persistent login, tabs in the title bar, and a window that remembers its tabs and size.

**GrokDesktop is not affiliated with, endorsed by, or sponsored by xAI.** grok.com and the Grok name are used only to describe the site this shell loads.

Our code is [GPLv3](LICENSE). Electron and Chromium keep their own licenses. A built package includes those third-party notices under `third-party/` in the app resources.

Node.js 22 or newer is required (`node -v`). On Fedora, `sudo dnf install nodejs npm` is enough when that Node is 22 or newer. If the distro package is older, install a current Node before continuing.

## Run from source

From this repository:

```bash
npm install
npm test
npm start
```

`npm start` builds, then opens one window on https://grok.com. Sign in there. The next launch uses the same login. A second launch focuses the window that is already open. Closing the window quits the app.

`npm start` and an installed copy share `~/.config/GrokDesktop`. You do not sign in again when you switch between them.

## The window

Tabs live in the title bar, in the space next to the minimize, maximize, and close buttons. There is no second tab row.

- **+** or Ctrl+T opens https://grok.com.
- Click a tab to switch. Each tab is its own grok.com page on the same login.
- **×** or Ctrl+W closes the active tab. Ctrl+W on the only tab leaves it open.
- Drag the empty part of the title bar to move the window.

Links that stay on `https://grok.com` or `https://*.grok.com` stay in the app. Other links open in the system browser. Login redirects stay in the tab. A login popup stays in a child window on the same login. Sign-in with Google, Apple, or xAI stays in the app on that same login, including the cookie handoff those flows use.

Downloads go to your Downloads folder. The system file dialog is used for attachments. Microphone and camera requests are allowed. Notification and screen-capture requests are denied.

Window size, position, and tab URLs are saved in `~/.config/GrokDesktop`. Deleting that directory signs you out.

On a Wayland session the window uses the native Wayland path. The shell does not force XWayland. Do not set `ELECTRON_OZONE_PLATFORM_HINT=x11` or pass `--ozone-platform=x11`.

## Install for your user

This puts GrokDesktop in the app grid without root. It is also the path to use when `npm run dist` cannot build an rpm yet.

Electron still needs the usual Fedora libraries if the window fails to open:

```bash
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-core libuuid
```

Build an unpacked app and install it under your home directory:

```bash
npm install
npm test
npm run build
node scripts/copy-notices.mjs
npx electron-builder --linux dir --x64
rm -rf ~/.local/opt/GrokDesktop
mkdir -p ~/.local/opt ~/.local/bin ~/.local/share/applications ~/.local/share/icons/hicolor/512x512/apps
cp -a release/linux-unpacked/. ~/.local/opt/GrokDesktop
cp build/icon.png ~/.local/share/icons/hicolor/512x512/apps/grokdesktop.png
ln -sfn ~/.local/opt/GrokDesktop/grokdesktop ~/.local/bin/grokdesktop
```

Write the launcher:

```bash
cat > ~/.local/share/applications/grokdesktop.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=GrokDesktop
Comment=Unofficial desktop shell for grok.com
Exec=$HOME/.local/opt/GrokDesktop/grokdesktop %U
Icon=grokdesktop
Terminal=false
Categories=Network;
StartupWMClass=grokdesktop
StartupNotify=true
EOF
```

Then:

```bash
update-desktop-database ~/.local/share/applications
gtk-update-icon-cache -f ~/.local/share/icons/hicolor
```

Launch **GrokDesktop** from the app grid, or run `grokdesktop` if `~/.local/bin` is on your `PATH`. Re-run the copy after you change the source. This install does not pick up edits on its own.

## Install the rpm

The packaged app is a Fedora x64 rpm. electron-builder's packager needs `libcrypt.so.1`, which Fedora provides as `libxcrypt-compat`:

```bash
sudo dnf install libxcrypt-compat rpm-build
npm install
npm run dist
sudo dnf install ./release/grokdesktop-0.1.0.x86_64.rpm
```

The filename follows the version in `package.json` (`0.1.0` today). The command writes the rpm under `release/`. There is no in-app updater and no CI build. A later change is a new rpm installed by hand.

After the rpm is installed, remove a user-local launcher if you created one, so it does not shadow `/usr/share/applications/grokdesktop.desktop`:

```bash
rm -f ~/.local/share/applications/grokdesktop.desktop
update-desktop-database ~/.local/share/applications
```

## Uninstall

Quit GrokDesktop first.

Remove the rpm, if you installed it:

```bash
sudo dnf remove grokdesktop
```

Remove a user-local install, if you created one:

```bash
rm -rf ~/.local/opt/GrokDesktop
rm -f ~/.local/bin/grokdesktop
rm -f ~/.local/share/applications/grokdesktop.desktop
rm -f ~/.local/share/icons/hicolor/512x512/apps/grokdesktop.png
update-desktop-database ~/.local/share/applications
```

Either uninstall leaves your login, window size, and saved tabs in `~/.config/GrokDesktop`. To sign out and delete that data as well:

```bash
rm -rf ~/.config/GrokDesktop
```

If you only ran `npm start`, there is no install to remove. Deleting `~/.config/GrokDesktop` is the cleanup.

## Attach the rpm to a GitHub Release

Build the rpm locally, then create the release yourself. This repository does not publish releases for you.

```bash
gh release create v0.1.0 release/grokdesktop-0.1.0.x86_64.rpm \
  --title "v0.1.0" \
  --notes "Unofficial Fedora rpm. Not affiliated with xAI."
```

Use the version in `package.json` for the tag. Do not describe the release as an official xAI or Grok app.

## Development

```bash
npm test
npm run build
```

`npm test` runs Vitest. It does not launch Electron and it does not call grok.com.

The tab-strip preload, `src/renderer/preload.ts`, may import only `electron`. A local import crashes in the sandbox, `grokdesktop` never appears in the page, and **+** does nothing.

The Chrome user-agent string lives in `src/session/user-agent.ts`. Change that constant if grok.com treats the window as an outdated browser. Keep the string free of `Electron`.
