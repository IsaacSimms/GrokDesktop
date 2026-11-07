import { shell, type BrowserWindow, type Session, type WebContents } from "electron";
import { classifyLink, isPopupWindowOpen, openableExternalUrl } from "./classify";
import { secureWebPreferences } from "../session/preferences";
import { CHROME_USER_AGENT } from "../session/user-agent";
import { attachContextMenu } from "../window/attach-context-menu";

export type LinkHost = {
  openTab: (url: string) => void;
  parent: BrowserWindow;
  session: Session;
};

function openExternal(url: string): void {
  const safe = openableExternalUrl(url);
  if (!safe) return;
  void shell.openExternal(safe).catch(() => undefined);
}

export function attachLinkHandlers(
  contents: WebContents,
  host: LinkHost,
  mode: "tab" | "popup",
): void {
  contents.setWindowOpenHandler((details) => {
    const popup = isPopupWindowOpen({
      disposition: details.disposition,
      features: details.features,
    });
    const decision = classifyLink({ kind: "window-open", url: details.url, popup });
    if (decision === "new-tab") {
      host.openTab(details.url);
      return { action: "deny" };
    }
    if (decision === "child-window") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          parent: host.parent,
          autoHideMenuBar: true,
          title: "GrokDesktop",
          webPreferences: {
            ...secureWebPreferences(),
            session: host.session,
          },
        },
      };
    }
    openExternal(details.url);
    return { action: "deny" };
  });

  contents.on("will-navigate", (event, url) => {
    if (mode === "popup") return;
    const decision = classifyLink({ kind: "main-frame", url });
    if (decision === "external") {
      event.preventDefault();
      openExternal(url);
    }
  });

  contents.on("will-redirect", (event, url) => {
    const decision = classifyLink({ kind: "redirect", url });
    if (decision === "external") {
      event.preventDefault();
      openExternal(url);
    }
  });

  contents.on("did-create-window", (child) => {
    child.setMenuBarVisibility(false);
    child.webContents.setUserAgent(CHROME_USER_AGENT);
    attachLinkHandlers(child.webContents, host, "popup");
    attachContextMenu(child.webContents, { openTab: (url) => host.openTab(url) });
  });
}
