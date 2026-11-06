import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel, type TabStripState } from "../ipc";

contextBridge.exposeInMainWorld("grokdesktop", {
  getTabs: (): Promise<TabStripState> => ipcRenderer.invoke(IpcChannel.getTabs),
  onTabs: (callback: (state: TabStripState) => void): void => {
    ipcRenderer.on(IpcChannel.tabsUpdated, (_event, state: TabStripState) => {
      callback(state);
    });
  },
  openTab: (): void => {
    ipcRenderer.send(IpcChannel.openTab);
  },
  closeTab: (index: number): void => {
    ipcRenderer.send(IpcChannel.closeTab, index);
  },
  switchTab: (index: number): void => {
    ipcRenderer.send(IpcChannel.switchTab, index);
  },
  stripReady: (): void => {
    ipcRenderer.send(IpcChannel.stripReady);
  },
});
