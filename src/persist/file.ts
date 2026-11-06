import fs from "fs";
import path from "path";
import { parseWindow, serializeWindow, type PersistedWindow } from "./state";

export function windowStatePath(userData: string): string {
  return path.join(userData, "window-state.json");
}

export function readWindowState(userData: string): PersistedWindow {
  try {
    return parseWindow(fs.readFileSync(windowStatePath(userData), "utf8"));
  } catch {
    return parseWindow(null);
  }
}

export function writeWindowState(userData: string, state: PersistedWindow): void {
  const file = windowStatePath(userData);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, serializeWindow(state));
}
