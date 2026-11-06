import { app, BrowserWindow, ipcMain, type Session } from "electron";
import { IpcChannel } from "../ipc";
import { readWindowState } from "../persist/file";
import { secureWebPreferences } from "../session/preferences";
import { attachTabs } from "../tabs/host";
import { shellAssetPath } from "./assets";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, TITLE_BAR_OVERLAY } from "./constants";

let mainWindow: BrowserWindow | null = null;

export function focusMainWindow(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

export function openMainWindow(ses: Session): BrowserWindow {
  const saved = readWindowState(app.getPath("userData"));
  const win = new BrowserWindow({
    width: saved.bounds?.width ?? DEFAULT_WIDTH,
    height: saved.bounds?.height ?? DEFAULT_HEIGHT,
    ...(saved.bounds ? { x: saved.bounds.x, y: saved.bounds.y } : {}),
    show: false,
    frame: true,
    autoHideMenuBar: true,
    title: "GrokDesktop",
    titleBarStyle: "hidden",
    titleBarOverlay: { ...TITLE_BAR_OVERLAY },
    backgroundColor: "#181818",
    icon: shellAssetPath(__dirname, "icon.png"),
    webPreferences: secureWebPreferences(shellAssetPath(__dirname, "preload.js")),
  });
  mainWindow = win;
  win.setMenuBarVisibility(false);
  win.on("page-title-updated", (event) => {
    event.preventDefault();
  });
  win.setTitle("GrokDesktop");

  const tabs = attachTabs(win, ses, saved);
  const show = (): void => {
    ipcMain.removeListener(IpcChannel.stripReady, show);
    if (win.isDestroyed() || win.isVisible()) return;
    tabs.layout();
    win.show();
  };
  ipcMain.on(IpcChannel.stripReady, show);
  const showTimer = setTimeout(show, 5000);
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file:")) event.preventDefault();
  });
  void win.loadFile(shellAssetPath(__dirname, "index.html"));
  win.on("closed", () => {
    clearTimeout(showTimer);
    ipcMain.removeListener(IpcChannel.stripReady, show);
    if (mainWindow === win) mainWindow = null;
  });
  return win;
}
