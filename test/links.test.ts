import { describe, expect, it } from "vitest";
import { classifyLink, isPopupWindowOpen, openableExternalUrl } from "../src/links/classify";

describe("link classifier", () => {
  it("keeps main-frame navigation on grok.com in the tab", () => {
    expect(classifyLink({ kind: "main-frame", url: "https://grok.com" })).toBe("stay");
    expect(classifyLink({ kind: "main-frame", url: "https://grok.com/chat" })).toBe("stay");
    expect(classifyLink({ kind: "main-frame", url: "https://assets.grok.com/x" })).toBe("stay");
  });

  it("keeps a sign-in page in the tab when the site navigates there", () => {
    expect(classifyLink({ kind: "main-frame", url: "https://accounts.google.com/signin" })).toBe("stay");
    expect(classifyLink({ kind: "main-frame", url: "https://appleid.apple.com/auth/authorize" })).toBe(
      "stay",
    );
    expect(classifyLink({ kind: "main-frame", url: "https://accounts.x.ai/sign-in" })).toBe("stay");
    expect(
      classifyLink({ kind: "main-frame", url: "https://accounts.youtube.com/accounts/CheckConnection" }),
    ).toBe("stay");
  });

  it("does not treat a lookalike or non-https sign-in host as sign-in", () => {
    for (const url of [
      "https://accounts.google.com.evil.com/o/oauth2/v2/auth",
      "https://notaccounts.google.com/signin",
      "http://accounts.google.com/signin",
      "https://evil.com/accounts.google.com",
    ]) {
      expect(classifyLink({ kind: "window-open", url, popup: false })).toBe("external");
      expect(classifyLink({ kind: "main-frame", url })).toBe("external");
    }
  });

  it("sends other main-frame hosts to the system browser", () => {
    for (const url of [
      "https://example.com",
      "https://grok.com.evil.com",
      "http://grok.com",
      "https://notgrok.com/grok.com",
    ]) {
      expect(classifyLink({ kind: "main-frame", url })).toBe("external");
    }
  });

  it("keeps server redirects in the current tab", () => {
    expect(classifyLink({ kind: "redirect", url: "https://accounts.x.ai/login" })).toBe("stay");
    expect(classifyLink({ kind: "redirect", url: "https://grok.com/callback" })).toBe("stay");
  });

  it("opens a grok.com window.open in a new tab", () => {
    expect(
      classifyLink({ kind: "window-open", url: "https://grok.com/chat", popup: false }),
    ).toBe("new-tab");
    expect(
      classifyLink({ kind: "window-open", url: "https://x.grok.com/i", popup: false }),
    ).toBe("new-tab");
  });

  it("opens a popup window in a child window for any host", () => {
    expect(
      classifyLink({ kind: "window-open", url: "https://accounts.x.ai/oauth", popup: true }),
    ).toBe("child-window");
    expect(
      classifyLink({ kind: "window-open", url: "https://grok.com/login", popup: true }),
    ).toBe("child-window");
  });

  it("sends a non-grok window.open to the system browser when it is not a popup", () => {
    expect(
      classifyLink({ kind: "window-open", url: "https://example.com/docs", popup: false }),
    ).toBe("external");
  });

  it("keeps a Google sign-in window in the app when it is not a popup", () => {
    expect(
      classifyLink({
        kind: "window-open",
        url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=x",
        popup: false,
      }),
    ).toBe("child-window");
  });

  it("keeps sign-in cookie handoffs in the app and leaves the rest of that host outside", () => {
    for (const url of [
      "https://accounts.youtube.com/accounts/CheckConnection?continue=https%3A%2F%2Faccounts.google.com",
      "https://accounts.youtube.com/accounts/SetSID",
      "https://auth.grok.com/set-cookie",
      "https://auth.grok.com/delete-cookie",
      "https://auth.grokusercontent.com/set-cookie",
      "https://auth.x.ai/delete-cookie",
    ]) {
      expect(classifyLink({ kind: "window-open", url, popup: false })).toBe("child-window");
    }
    expect(
      classifyLink({
        kind: "window-open",
        url: "https://accounts.youtube.com/watch",
        popup: false,
      }),
    ).toBe("external");
    expect(
      classifyLink({ kind: "window-open", url: "https://auth.grok.com/other", popup: false }),
    ).toBe("new-tab");
    expect(
      classifyLink({
        kind: "window-open",
        url: "https://auth.grokusercontent.com/other",
        popup: false,
      }),
    ).toBe("external");
  });

  it("keeps Apple and xAI sign-in windows in the app when they are not popups", () => {
    expect(
      classifyLink({
        kind: "window-open",
        url: "https://appleid.apple.com/auth/authorize",
        popup: false,
      }),
    ).toBe("child-window");
    expect(
      classifyLink({
        kind: "window-open",
        url: "https://accounts.x.ai/sign-in",
        popup: false,
      }),
    ).toBe("child-window");
  });

  it("treats Electron's new-window disposition as a popup", () => {
    expect(isPopupWindowOpen({ disposition: "new-window", features: "" })).toBe(true);
  });

  it("treats an unknown disposition as a popup", () => {
    expect(isPopupWindowOpen({ disposition: "other" })).toBe(true);
  });

  it("treats popup window features as a popup", () => {
    expect(isPopupWindowOpen({ disposition: "foreground-tab", features: "width=480,height=640" })).toBe(true);
    expect(isPopupWindowOpen({ disposition: "foreground-tab", features: "popup=yes" })).toBe(true);
    expect(isPopupWindowOpen({ disposition: "foreground-tab", features: "popup" })).toBe(true);
  });

  it("does not treat a plain new tab as a popup", () => {
    expect(isPopupWindowOpen({ disposition: "foreground-tab", features: "" })).toBe(false);
    expect(isPopupWindowOpen({ disposition: "foreground-tab", features: "noopener" })).toBe(false);
    expect(isPopupWindowOpen({ disposition: "background-tab" })).toBe(false);
    expect(isPopupWindowOpen({ disposition: "default" })).toBe(false);
  });

  it("only hands http and https urls to the system browser", () => {
    expect(openableExternalUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(openableExternalUrl("http://example.com")).toBe("http://example.com/");
    expect(openableExternalUrl("javascript:alert(1)")).toBeNull();
    expect(openableExternalUrl("file:///etc/passwd")).toBeNull();
    expect(openableExternalUrl("not a url")).toBeNull();
  });
});
