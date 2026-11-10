// clipboard-sanitized-write is the permission behind navigator.clipboard.writeText
// and clipboard.write of text. grok.com's code-block Copy button uses that API.
// A custom check handler replaces Chrome's default, so denying it makes the
// click succeed and the write reject with NotAllowedError. clipboard-read stays
// denied: the page still cannot read the clipboard.
export function decidePermission(permission: string): boolean {
  return permission === "media" || permission === "clipboard-sanitized-write";
}
