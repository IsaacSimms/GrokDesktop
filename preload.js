"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Channel names match IpcChannel in src/ipc.ts. This file must not import
// another local module: the sandboxed preload can require electron only.
electron_1.contextBridge.exposeInMainWorld("grokdesktop", {
    getTabs: () => electron_1.ipcRenderer.invoke("tabs-get"),
    onTabs: (callback) => {
        electron_1.ipcRenderer.on("tabs-updated", (_event, state) => {
            callback(state);
        });
    },
    openTab: () => {
        electron_1.ipcRenderer.send("tabs-open");
    },
    closeTab: (index) => {
        electron_1.ipcRenderer.send("tabs-close", index);
    },
    switchTab: (index) => {
        electron_1.ipcRenderer.send("tabs-switch", index);
    },
    stripReady: () => {
        electron_1.ipcRenderer.send("strip-ready");
    },
});
//# sourceMappingURL=preload.js.map