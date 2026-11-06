import { app, ipcMain, WebContentsView, type BrowserWindow, type Session } from "electron";
import { IpcChannel, type TabStripState } from "../ipc";
import { attachLinkHandlers } from "../links/attach";
import { isGrokUrl } from "../links/classify";
import { writeWindowState } from "../persist/file";
import type { PersistedWindow } from "../persist/state";
import { secureWebPreferences } from "../session/preferences";
import { CHROME_USER_AGENT } from "../session/user-agent";
import { closeTab, openTab, setTabUrl, switchTab, type TabState } from "./model";
import { TAB_STRIP_HEIGHT } from "../window/constants";
import { shortcutFor } from "../window/shortcuts";

export type TabHost = {
  layout: () => void;
  saveNow: () => void;
};

export function attachTabs(win: BrowserWindow, ses: Session, saved: PersistedWindow): TabHost {
  let state: TabState = { tabs: [...saved.tabs], activeIndex: saved.activeIndex };
  const views: WebContentsView[] = [];

  const payload = (): TabStripState => ({
    tabs: [...state.tabs],
    activeIndex: state.activeIndex,
  });

  const saveNow = (): void => {
    if (win.isDestroyed()) return;
    writeWindowState(app.getPath("userData"), {
      bounds: win.getBounds(),
      tabs: [...state.tabs],
      activeIndex: state.activeIndex,
    });
  };

  const publish = (): void => {
    if (!win.webContents.isDestroyed()) {
      win.webContents.send(IpcChannel.tabsUpdated, payload());
    }
    saveNow();
  };

  const layout = (): void => {
    const [width, height] = win.getContentSize();
    const pageHeight = Math.max(0, height - TAB_STRIP_HEIGHT);
    views.forEach((view, index) => {
      const active = index === state.activeIndex;
      view.setVisible(active);
      if (active) {
        view.setBounds({ x: 0, y: TAB_STRIP_HEIGHT, width, height: pageHeight });
      }
    });
  };

  const onShortcut = (event: Electron.Event, input: Electron.Input): void => {
    const shortcut = shortcutFor(input);
    if (!shortcut) return;
    event.preventDefault();
    if (shortcut === "open-tab") open();
    else close(state.activeIndex);
  };

  const track = (view: WebContentsView): void => {
    const index = views.indexOf(view);
    if (index < 0 || view.webContents.isDestroyed()) return;
    const url = view.webContents.getURL();
    if (!isGrokUrl(url)) return;
    const next = setTabUrl(state, index, url);
    if (next === state) return;
    state = next;
    publish();
  };

  const linkHost = {
    openTab: (url: string) => open(url),
    parent: win,
    session: ses,
  };

  const createPageView = (): WebContentsView => {
    const view = new WebContentsView({
      webPreferences: {
        ...secureWebPreferences(),
        session: ses,
      },
    });
    view.webContents.setUserAgent(CHROME_USER_AGENT);
    win.contentView.addChildView(view);
    attachLinkHandlers(view.webContents, linkHost, "tab");
    view.webContents.on("before-input-event", onShortcut);
    view.webContents.on("did-navigate", () => track(view));
    view.webContents.on("did-navigate-in-page", () => track(view));
    return view;
  };

  const open = (url?: string): void => {
    state = openTab(state, url);
    const view = createPageView();
    views.push(view);
    void view.webContents.loadURL(state.tabs[state.activeIndex]);
    layout();
    publish();
  };

  const close = (index: number): void => {
    const next = closeTab(state, index);
    if (next === state) return;
    const [view] = views.splice(index, 1);
    if (view) {
      win.contentView.removeChildView(view);
      if (!view.webContents.isDestroyed()) view.webContents.close();
    }
    state = next;
    layout();
    publish();
  };

  const activate = (index: number): void => {
    const next = switchTab(state, index);
    if (next === state) return;
    state = next;
    layout();
    publish();
  };

  for (const url of state.tabs) {
    const view = createPageView();
    views.push(view);
    void view.webContents.loadURL(url);
  }
  layout();

  ipcMain.handle(IpcChannel.getTabs, () => payload());
  ipcMain.on(IpcChannel.openTab, () => open());
  ipcMain.on(IpcChannel.closeTab, (_event, index: unknown) => {
    if (typeof index === "number" && Number.isInteger(index)) close(index);
  });
  ipcMain.on(IpcChannel.switchTab, (_event, index: unknown) => {
    if (typeof index === "number" && Number.isInteger(index)) activate(index);
  });
  win.webContents.on("before-input-event", onShortcut);
  let boundsTimer: ReturnType<typeof setTimeout> | null = null;
  const saveBoundsSoon = (): void => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => saveNow(), 200);
  };
  win.on("resize", () => {
    layout();
    saveBoundsSoon();
  });
  win.on("move", () => saveBoundsSoon());
  win.on("close", () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    saveNow();
  });
  win.on("closed", () => {
    ipcMain.removeHandler(IpcChannel.getTabs);
    ipcMain.removeAllListeners(IpcChannel.openTab);
    ipcMain.removeAllListeners(IpcChannel.closeTab);
    ipcMain.removeAllListeners(IpcChannel.switchTab);
  });

  return { layout, saveNow };
}
