import { randomBytes } from "crypto";
import { ClipboardItem, clipboard, nativeImage } from "electron";
import { readFile } from "fs/promises";
import { sessionBus, Variant, type MessageBus, type ProxyObject } from "dbus-next";
import { onActivate, onShot, type CaptureState } from "./decide";
import {
  CAPTURE_DESCRIPTION,
  CAPTURE_SHORTCUT_ID,
  CAPTURE_TRIGGER,
  parseScreenshotResponse,
} from "./portal-messages";

const PORTAL_NAME = "org.freedesktop.portal.Desktop";
const PORTAL_PATH = "/org/freedesktop/portal/desktop";
// The host portal matches this to grokdesktop.desktop. It has to be registered
// before any other portal call on this connection.
const APP_ID = "grokdesktop";

const REQUEST_XML = `<node>
  <interface name="org.freedesktop.portal.Request">
    <method name="Close" />
    <signal name="Response">
      <arg type="u" name="response" />
      <arg type="a{sv}" name="results" />
    </signal>
  </interface>
</node>`;

const SESSION_XML = `<node>
  <interface name="org.freedesktop.portal.Session">
    <method name="Close" />
  </interface>
</node>`;

type VariantDict = Record<string, Variant>;

type RegistryApi = {
  Register(appId: string, options: VariantDict): Promise<void>;
};

type ShortcutsApi = {
  CreateSession(options: VariantDict): Promise<string>;
  BindShortcuts(
    sessionHandle: string,
    shortcuts: Array<[string, VariantDict]>,
    parentWindow: string,
    options: VariantDict,
  ): Promise<string>;
  on(
    event: "Activated",
    listener: (sessionHandle: string, shortcutId: string, timestamp: unknown, options: VariantDict) => void,
  ): void;
};

type ScreenshotApi = {
  Screenshot(parentWindow: string, options: VariantDict): Promise<string>;
};

type RequestApi = {
  on(event: "Response", listener: (response: number, results: VariantDict) => void): void;
};

type SessionApi = {
  Close(): Promise<void>;
};

type PortalResponse = {
  response: number;
  results: VariantDict;
};

export type CaptureHost = {
  pasteClipboard: () => void;
};

export function installCapture(host: CaptureHost): () => void {
  let closed = false;
  let release: (() => Promise<void>) | null = null;
  void connect(
    host,
    () => closed,
    (closer) => {
      release = closer;
      if (closed) void closer();
    },
  ).catch((error: unknown) => {
    if (!closed) console.error(`GrokDesktop capture: ${errorText(error)}`);
  });
  return () => {
    closed = true;
    void release?.();
  };
}

async function connect(
  host: CaptureHost,
  isClosed: () => boolean,
  onRelease: (release: () => Promise<void>) => void,
): Promise<void> {
  const bus = sessionBus();
  let sessionHandle: string | null = null;
  let released = false;
  const release = async (): Promise<void> => {
    if (released) return;
    released = true;
    if (sessionHandle) {
      try {
        const session = await bus.getProxyObject(PORTAL_NAME, sessionHandle, SESSION_XML);
        await api<SessionApi>(session, "org.freedesktop.portal.Session").Close();
      } catch {
        // The portal drops the session when the connection closes.
      }
    }
    bus.disconnect();
  };
  onRelease(release);
  if (isClosed()) {
    await release();
    return;
  }

  try {
    const desktop = await bus.getProxyObject(PORTAL_NAME, PORTAL_PATH);
    await api<RegistryApi>(desktop, "org.freedesktop.host.portal.Registry").Register(APP_ID, {});
    const shortcuts = api<ShortcutsApi>(desktop, "org.freedesktop.portal.GlobalShortcuts");
    const screenshot = api<ScreenshotApi>(desktop, "org.freedesktop.portal.Screenshot");
    const created = await portalRequest(bus, (handle) =>
      shortcuts.CreateSession({
        handle_token: new Variant("s", handle),
        session_handle_token: new Variant("s", objectToken()),
      }),
    );
    if (created.response !== 0) throw new Error(`shortcut session failed (${created.response})`);
    const handle = variantString(created.results.session_handle);
    if (!handle) throw new Error("shortcut session has no handle");
    sessionHandle = handle;
    const bound = await portalRequest(bus, (requestToken) =>
      shortcuts.BindShortcuts(
        handle,
        [
          [
            CAPTURE_SHORTCUT_ID,
            {
              description: new Variant("s", CAPTURE_DESCRIPTION),
              preferred_trigger: new Variant("s", CAPTURE_TRIGGER),
            },
          ],
        ],
        "",
        { handle_token: new Variant("s", requestToken) },
      ),
    );
    if (bound.response === 1) throw new Error("shortcut bind was cancelled");
    if (bound.response !== 0) throw new Error(`shortcut bind failed (${bound.response})`);

    let state: CaptureState = "idle";
    shortcuts.on("Activated", (activatedSession, shortcutId) => {
      if (isClosed() || activatedSession !== handle || shortcutId !== CAPTURE_SHORTCUT_ID) return;
      const decision = onActivate(state);
      state = decision.state;
      if (decision.action !== "start") return;
      void captureRegion(bus, screenshot, host, isClosed, (next) => {
        state = next;
      });
    });
  } catch (error) {
    await release();
    throw error;
  }
}

async function captureRegion(
  bus: MessageBus,
  screenshot: ScreenshotApi,
  host: CaptureHost,
  isClosed: () => boolean,
  setState: (state: CaptureState) => void,
): Promise<void> {
  const fail = (error: unknown): void => {
    setState(onShot({ kind: "error" }).state);
    if (!isClosed()) console.error(`GrokDesktop capture: ${errorText(error)}`);
  };
  try {
    const result = await portalRequest(bus, (handle) =>
      screenshot.Screenshot("", {
        handle_token: new Variant("s", handle),
        interactive: new Variant("b", true),
        modal: new Variant("b", false),
      }),
    );
    if (isClosed()) {
      setState("idle");
      return;
    }
    const parsed = parseScreenshotResponse(result.response, variantString(result.results.uri));
    if (parsed.kind === "cancel") {
      setState(onShot({ kind: "cancel" }).state);
      return;
    }
    if (parsed.kind === "error") {
      fail(new Error(parsed.message));
      return;
    }
    let png: Buffer;
    try {
      png = await readFile(parsed.path);
    } catch (error) {
      fail(error);
      return;
    }
    const shot = onShot({ kind: "image", png });
    setState(shot.state);
    if (shot.action === "log") {
      if (!isClosed()) console.error("GrokDesktop capture: screenshot file was empty");
      return;
    }
    if (shot.action !== "paste" || isClosed()) return;
    try {
      const image = nativeImage.createFromBuffer(png);
      if (image.isEmpty()) throw new Error("clipboard image was empty");
      const bytes = Uint8Array.from(png);
      await clipboard.write([
        new ClipboardItem({
          "image/png": new Blob([bytes], { type: "image/png" }),
        }),
      ]);
    } catch (error) {
      console.error(`GrokDesktop capture: ${errorText(error)}`);
      return;
    }
    if (!isClosed()) host.pasteClipboard();
  } catch (error) {
    fail(error);
  }
}

async function portalRequest(
  bus: MessageBus,
  call: (handleToken: string) => Promise<string>,
): Promise<PortalResponse> {
  const handle = objectToken();
  const path = requestPath(uniqueName(bus), handle);
  const request = await bus.getProxyObject(PORTAL_NAME, path, REQUEST_XML);
  const pending = new Promise<PortalResponse>((resolve) => {
    api<RequestApi>(request, "org.freedesktop.portal.Request").on("Response", (response, results) => {
      resolve({ response, results });
    });
  });
  const returned = await call(handle);
  if (returned === path) return pending;
  const actual = await bus.getProxyObject(PORTAL_NAME, returned, REQUEST_XML);
  return new Promise((resolve) => {
    api<RequestApi>(actual, "org.freedesktop.portal.Request").on("Response", (response, results) => {
      resolve({ response, results });
    });
  });
}

function api<T>(proxy: ProxyObject, name: string): T {
  return proxy.getInterface(name) as T;
}

function uniqueName(bus: MessageBus): string {
  const name = (bus as MessageBus & { name: string | null }).name;
  if (!name) throw new Error("session bus has no unique name");
  return name;
}

function requestPath(unique: string, handleToken: string): string {
  const sender = unique.slice(1).replaceAll(".", "_");
  return `/org/freedesktop/portal/desktop/request/${sender}/${handleToken}`;
}

function objectToken(): string {
  return `grokdesktop_${randomBytes(8).toString("hex")}`;
}

function variantString(value: Variant | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value.value === "string" ? value.value : undefined;
}

function errorText(error: unknown): string {
  const text = error instanceof Error ? error.message : "portal request failed";
  return text.replace(/\s+/g, " ").trim() || "portal request failed";
}
