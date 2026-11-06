# Wayland app launcher

**Date:** 2026-11-06
**Type:** setup
**Environment / Systems:** Fedora 44 (GNOME, Wayland `wayland-0`). Node v22.23.1, npm 10.9.8, Electron 45.2.3, electron-builder 26.18.0. User `isaacsimms`. `grokdesktop` was not installed as an rpm.

## TL;DR

GrokDesktop can be opened from the GNOME app grid without `npm start`. A user-local copy lives at `~/.local/opt/GrokDesktop`, with a launcher at `~/.local/share/applications/grokdesktop.desktop`. The Fedora rpm was not installed: `npm run dist` died in fpm because Ruby could not load `libcrypt.so.1`, and `sudo` needs a password.

## Context & Goal

Using the app meant opening a terminal in the repo and running `npm start`. The goal was a normal application in the Wayland UI, launched from the app grid. The repo's intended path is `npm run dist` and `sudo dnf install ./release/grokdesktop-0.1.0.x86_64.rpm`.

## Key Points Explored

- `npm test` passed: 10 files, 43 tests.
- `npm run build` and electron-builder packaging succeeded. Output is `release/linux-unpacked/` (about 280M), including `grokdesktop` and `resources/app.asar`.
- The rpm step failed. electron-builder's bundled fpm (Ruby 3.4.3) exited 127: `ruby: error while loading shared libraries: libcrypt.so.1: cannot open shared object file`. `libxcrypt-compat` is not installed. `sudo -n` reported that a password is required, so that package and `dnf install` of the rpm could not be done from this session.
- User namespaces are available (`user.max_user_namespaces` is 2147483647), so the unpacked binary ran without a setuid `chrome-sandbox`.

## Decisions & Outcomes

Installed a per-user app instead of the system rpm:

- App tree: `~/.local/opt/GrokDesktop` (copy of `release/linux-unpacked`)
- Launcher: `~/.local/share/applications/grokdesktop.desktop` (`Name=GrokDesktop`, `StartupWMClass=grokdesktop`, `Categories=Network;`)
- Icon: `~/.local/share/icons/hicolor/512x512/apps/grokdesktop.png` (from `build/icon.png`). `gtk-update-icon-cache` wrote the hicolor cache.
- Path symlink: `~/.local/bin/grokdesktop`

`update-desktop-database` refreshed `~/.local/share/applications`. A smoke launch on this Wayland session stayed up, spawned zygote processes, and enabled `WaylandWindowDecorations`. The test process was then stopped. It uses the same `~/.config/GrokDesktop` data as `npm start`.

## Open Questions / Next Steps

The system rpm is still unbuilt and uninstalled. To replace this user install with the packaged app:

```bash
sudo dnf install libxcrypt-compat
npm run dist
sudo dnf install ./release/grokdesktop-0.1.0.x86_64.rpm
```

After that rpm is installed, remove `~/.local/share/applications/grokdesktop.desktop` so it does not shadow `/usr/share/applications/grokdesktop.desktop`.

## Artifacts

| Path | State |
| --- | --- |
| `docs/recaps/2026-11-06-wayland-app-launcher.md` | This recap |
| `~/.local/opt/GrokDesktop` | Installed app binary and resources |
| `~/.local/share/applications/grokdesktop.desktop` | GNOME launcher |
| `~/.local/share/icons/hicolor/512x512/apps/grokdesktop.png` | App icon |
| `~/.local/bin/grokdesktop` | Symlink to the binary |
| `release/linux-unpacked/` | electron-builder output; no rpm was written |
