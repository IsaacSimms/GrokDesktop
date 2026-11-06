import { app, Menu } from "electron";
import { installPermissions } from "./permissions/install";
import { configureSession } from "./session/configure";
import { installDownloads } from "./session/downloads";
import { focusMainWindow, openMainWindow } from "./window/open";
import { applyWayland } from "./window/wayland";

app.setName("GrokDesktop");
applyWayland(process.env, (name, value) => {
  app.commandLine.appendSwitch(name, value);
});

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    focusMainWindow();
  });
  app.on("window-all-closed", () => {
    app.quit();
  });
  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    const ses = configureSession();
    installPermissions(ses);
    installDownloads(ses);
    openMainWindow(ses);
  });
}
