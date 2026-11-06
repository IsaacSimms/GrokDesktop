export type LinkKind = "main-frame" | "redirect" | "window-open";

export type LinkDecision = "stay" | "external" | "new-tab" | "child-window";

export type ClassifyInput = {
  kind: LinkKind;
  url: string;
  popup?: boolean;
};

export function isGrokUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    return host === "grok.com" || host.endsWith(".grok.com");
  } catch {
    return false;
  }
}

const SIGN_IN_HOSTS = new Set(["accounts.google.com", "appleid.apple.com", "accounts.x.ai"]);

const COOKIE_HANDOFF_PATHS = new Map<string, ReadonlySet<string>>([
  ["accounts.youtube.com", new Set(["/accounts/SetSID", "/accounts/CheckConnection"])],
  ["auth.grok.com", new Set(["/set-cookie", "/delete-cookie"])],
  ["auth.grokusercontent.com", new Set(["/set-cookie", "/delete-cookie"])],
  ["auth.x.ai", new Set(["/set-cookie", "/delete-cookie"])],
]);

function isSignInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (SIGN_IN_HOSTS.has(host)) return true;
    return COOKIE_HANDOFF_PATHS.get(host)?.has(parsed.pathname) ?? false;
  } catch {
    return false;
  }
}

export function classifyLink(input: ClassifyInput): LinkDecision {
  if (input.kind === "redirect") return "stay";
  if (input.kind === "window-open") {
    if (input.popup || isSignInUrl(input.url)) return "child-window";
    return isGrokUrl(input.url) ? "new-tab" : "external";
  }
  return isGrokUrl(input.url) || isSignInUrl(input.url) ? "stay" : "external";
}

function hasPopupFeatures(features: string): boolean {
  return /(?:^|,)\s*(?:popup|width|height)\s*(?:=|,|$)/i.test(features);
}

export function openableExternalUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isPopupWindowOpen(input: { disposition: string; features?: string }): boolean {
  if (hasPopupFeatures(input.features ?? "")) return true;
  return input.disposition === "new-window" || input.disposition === "other";
}
