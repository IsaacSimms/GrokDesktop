const SITE_SUFFIX = /\s+[-–—|]\s+Grok$/i;
const SITE_PREFIX = /^Grok\s+[-–—|]\s+/i;

// Empty means the tab strip should keep showing the URL. "Grok" is the site
// default before a thread, project, or bot has its own document title.
export function tabTitle(title: string): string {
  const name = title.trim().replace(SITE_SUFFIX, "").replace(SITE_PREFIX, "").trim();
  if (name === "" || name.toLowerCase() === "grok") return "";
  if (/^https?:\/\//i.test(name)) return "";
  return name;
}
