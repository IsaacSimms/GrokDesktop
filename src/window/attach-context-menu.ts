import {
  BrowserWindow,
  clipboard,
  Menu,
  shell,
  WebContentsView,
  type MenuItemConstructorOptions,
  type WebContents,
} from "electron";
import { openableExternalUrl } from "../links/classify";
import { contextMenuEntries, type ContextMenuEntry } from "./context-menu";

export type ContextMenuActions = {
  openTab?: (url: string) => void;
};

function runEntry(
  entry: ContextMenuEntry,
  contents: WebContents,
  point: { x: number; y: number },
  actions: ContextMenuActions,
): void {
  if (entry.kind === "separator" || contents.isDestroyed()) return;
  if (entry.kind === "suggestion") {
    contents.replaceMisspelling(entry.word);
    return;
  }
  switch (entry.command) {
    case "undo":
      contents.undo();
      return;
    case "redo":
      contents.redo();
      return;
    case "cut":
      contents.cut();
      return;
    case "copy":
      contents.copy();
      return;
    case "paste":
      contents.paste();
      return;
    case "paste-and-match-style":
      contents.pasteAndMatchStyle();
      return;
    case "delete":
      contents.delete();
      return;
    case "select-all":
      contents.selectAll();
      return;
    case "copy-link":
    case "copy-image-address":
      if (entry.text) clipboard.writeText(entry.text);
      return;
    case "open-link-tab":
      if (entry.text) actions.openTab?.(entry.text);
      return;
    case "open-link-external": {
      const safe = entry.text ? openableExternalUrl(entry.text) : null;
      if (safe) void shell.openExternal(safe).catch(() => undefined);
      return;
    }
    case "copy-image":
      contents.copyImageAt(point.x, point.y);
      return;
    case "add-to-dictionary":
      if (entry.text) contents.session.addWordToSpellCheckerDictionary(entry.text);
      return;
    default:
      return;
  }
}

function toTemplate(
  entry: ContextMenuEntry,
  contents: WebContents,
  point: { x: number; y: number },
  actions: ContextMenuActions,
): MenuItemConstructorOptions {
  if (entry.kind === "separator") return { type: "separator" };
  return {
    label: entry.label,
    enabled: entry.kind === "suggestion" ? true : entry.enabled,
    click: () => runEntry(entry, contents, point, actions),
  };
}

function windowPoint(
  win: BrowserWindow,
  contents: WebContents,
  point: { x: number; y: number },
): { x: number; y: number } {
  const view = win.contentView.children.find(
    (child): child is WebContentsView =>
      child instanceof WebContentsView && child.webContents === contents,
  );
  if (!view) return point;
  const bounds = view.getBounds();
  return { x: point.x + bounds.x, y: point.y + bounds.y };
}

export function attachContextMenu(contents: WebContents, actions: ContextMenuActions = {}): void {
  contents.on("context-menu", (_event, params) => {
    if (contents.isDestroyed()) return;
    const template = contextMenuEntries(params).map((entry) =>
      toTemplate(entry, contents, params, actions),
    );
    const menu = Menu.buildFromTemplate(template);
    const win = BrowserWindow.fromWebContents(contents);
    const frame = params.frame ?? undefined;
    if (win && !win.isDestroyed()) {
      const point = windowPoint(win, contents, params);
      menu.popup({
        window: win,
        frame,
        x: point.x,
        y: point.y,
        sourceType: params.menuSourceType,
      });
      return;
    }
    menu.popup({ frame, x: params.x, y: params.y, sourceType: params.menuSourceType });
  });
}
