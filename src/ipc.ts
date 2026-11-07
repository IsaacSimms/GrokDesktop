export const IpcChannel = {
  getTabs: "tabs-get",
  tabsUpdated: "tabs-updated",
  openTab: "tabs-open",
  closeTab: "tabs-close",
  switchTab: "tabs-switch",
  stripReady: "strip-ready",
} as const;

export type TabStripState = {
  tabs: string[];
  titles: string[];
  activeIndex: number;
};
