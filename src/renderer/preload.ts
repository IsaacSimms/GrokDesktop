import { contextBridge, ipcRenderer } from "electron";

type TabStripState = {
  tabs: string[];
  activeIndex: number;
};

// Channel names match IpcChannel in src/ipc.ts. This file must not import
// another local module: the sandboxed preload can require electron only.
contextBridge.exposeInMainWorld("grokdesktop", {
  getTabs: (): Promise<TabStripState> => ipcRenderer.invoke("tabs-get"),
  onTabs: (callback: (state: TabStripState) => void): void => {
    ipcRenderer.on("tabs-updated", (_event, state: TabStripState) => {
      callback(state);
    });
  },
  openTab: (): void => {
    ipcRenderer.send("tabs-open");
  },
  closeTab: (index: number): void => {
    ipcRenderer.send("tabs-close", index);
  },
  switchTab: (index: number): void => {
    ipcRenderer.send("tabs-switch", index);
  },
  stripReady: (): void => {
    ipcRenderer.send("strip-ready");
  },
});
