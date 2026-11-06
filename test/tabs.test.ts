import { describe, expect, it } from "vitest";
import { closeTab, createTabState, openTab, setTabUrl, switchTab, HOME_URL } from "../src/tabs/model";

describe("tab model", () => {
  it("starts with one grok.com tab", () => {
    expect(createTabState()).toEqual({
      tabs: [HOME_URL],
      activeIndex: 0,
    });
  });

  it("opens another grok.com tab and activates it", () => {
    const opened = openTab(createTabState());
    expect(opened).toEqual({
      tabs: [HOME_URL, HOME_URL],
      activeIndex: 1,
    });
  });

  it("opens a tab at the given url and activates it", () => {
    const opened = openTab(createTabState(), "https://grok.com/chat");
    expect(opened.tabs).toEqual([HOME_URL, "https://grok.com/chat"]);
    expect(opened.activeIndex).toBe(1);
  });

  it("switches the active tab by index", () => {
    const opened = openTab(createTabState(), "https://grok.com/imagine");
    expect(switchTab(opened, 0)).toEqual({ ...opened, activeIndex: 0 });
  });

  it("leaves the active tab unchanged when the index is out of range", () => {
    const opened = openTab(createTabState());
    expect(switchTab(opened, -1)).toEqual(opened);
    expect(switchTab(opened, 5)).toEqual(opened);
  });

  it("closes the active tab and selects the neighbor", () => {
    const three = openTab(openTab(createTabState(), "https://grok.com/a"), "https://grok.com/b");
    const closed = closeTab(three, 2);
    expect(closed).toEqual({
      tabs: [HOME_URL, "https://grok.com/a"],
      activeIndex: 1,
    });
  });

  it("keeps the active tab when an earlier tab is closed", () => {
    const switched = switchTab(
      openTab(openTab(createTabState(), "https://grok.com/a"), "https://grok.com/b"),
      2,
    );
    expect(closeTab(switched, 0)).toEqual({
      tabs: ["https://grok.com/a", "https://grok.com/b"],
      activeIndex: 1,
    });
  });

  it("leaves the only tab open", () => {
    const only = createTabState();
    expect(closeTab(only, 0)).toEqual(only);
    expect(closeTab(only)).toEqual(only);
  });

  it("updates one tab url without changing which tab is active", () => {
    const opened = openTab(createTabState(), "https://grok.com/a");
    expect(setTabUrl(opened, 1, "https://grok.com/a/project")).toEqual({
      tabs: [HOME_URL, "https://grok.com/a/project"],
      activeIndex: 1,
    });
  });
});

