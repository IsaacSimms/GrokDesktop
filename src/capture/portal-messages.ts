import { fileURLToPath } from "url";

export const CAPTURE_SHORTCUT_ID = "capture-region";
export const CAPTURE_DESCRIPTION = "Capture a region and paste it into GrokDesktop";
export const CAPTURE_TRIGGER = "<Control><Alt>s";

export type ShortcutBinding = {
  id: string;
  description: string;
  preferredTrigger: string;
};

export function bindShortcutList(): ShortcutBinding[] {
  return [
    {
      id: CAPTURE_SHORTCUT_ID,
      description: CAPTURE_DESCRIPTION,
      preferredTrigger: CAPTURE_TRIGGER,
    },
  ];
}

export type ScreenshotParse =
  | { kind: "success"; path: string }
  | { kind: "cancel" }
  | { kind: "error"; message: string };

export function parseScreenshotResponse(code: number, uri: string | undefined): ScreenshotParse {
  if (code === 1) return { kind: "cancel" };
  if (code !== 0) return { kind: "error", message: `screenshot response ${code}` };
  if (!uri) return { kind: "error", message: "screenshot response missing uri" };
  let path: string;
  try {
    const url = new URL(uri);
    if (url.protocol !== "file:") return { kind: "error", message: "screenshot uri is not a file" };
    path = fileURLToPath(url);
  } catch {
    return { kind: "error", message: "screenshot uri is not a file" };
  }
  if (!path) return { kind: "error", message: "screenshot uri is not a file" };
  return { kind: "success", path };
}
