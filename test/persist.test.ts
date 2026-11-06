import { describe, expect, it } from "vitest";
import { HOME_URL } from "../src/tabs/model";
import { parseWindow, serializeWindow } from "../src/persist/state";

describe("persist", () => {
  it("round-trips tabs, the active tab, and window bounds", () => {
    const state = {
      bounds: { x: 40, y: 50, width: 1100, height: 720 },
      tabs: [HOME_URL, "https://grok.com/chat"],
      activeIndex: 1,
    };
    expect(parseWindow(serializeWindow(state))).toEqual(state);
  });

  it("uses one grok.com tab and no bounds when the save is missing or corrupt", () => {
    const fallback = { bounds: null, tabs: [HOME_URL], activeIndex: 0 };
    expect(parseWindow(null)).toEqual(fallback);
    expect(parseWindow(undefined)).toEqual(fallback);
    expect(parseWindow("")).toEqual(fallback);
    expect(parseWindow("{")).toEqual(fallback);
    expect(parseWindow("null")).toEqual(fallback);
  });

  it("drops tab urls that are not https grok.com", () => {
    const raw = JSON.stringify({
      bounds: { x: 1, y: 2, width: 900, height: 600 },
      tabs: ["https://grok.com/a", "https://example.com", "http://grok.com", "https://news.grok.com/b"],
      activeIndex: 0,
    });
    expect(parseWindow(raw)).toEqual({
      bounds: { x: 1, y: 2, width: 900, height: 600 },
      tabs: ["https://grok.com/a", "https://news.grok.com/b"],
      activeIndex: 0,
    });
  });

  it("opens one grok.com tab when every saved url is outside grok.com", () => {
    const raw = JSON.stringify({
      bounds: { x: 8, y: 9, width: 800, height: 500 },
      tabs: ["https://example.com"],
      activeIndex: 0,
    });
    expect(parseWindow(raw)).toEqual({
      bounds: { x: 8, y: 9, width: 800, height: 500 },
      tabs: [HOME_URL],
      activeIndex: 0,
    });
  });

  it("selects the next remaining tab when the active url is dropped", () => {
    const raw = JSON.stringify({
      tabs: ["https://grok.com/a", "https://example.com", "https://grok.com/b"],
      activeIndex: 1,
      bounds: null,
    });
    expect(parseWindow(raw)).toEqual({
      bounds: null,
      tabs: ["https://grok.com/a", "https://grok.com/b"],
      activeIndex: 1,
    });
  });

  it("discards bounds that are not a usable window rectangle", () => {
    const raw = JSON.stringify({
      bounds: { x: 0, y: 0, width: 0, height: 10 },
      tabs: ["https://grok.com/a"],
      activeIndex: 0,
    });
    expect(parseWindow(raw).bounds).toBeNull();
    expect(parseWindow(raw).tabs).toEqual(["https://grok.com/a"]);
  });
});
