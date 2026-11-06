export const HOME_URL = "https://grok.com";

export type TabState = {
  readonly tabs: readonly string[];
  readonly activeIndex: number;
};

export function createTabState(): TabState {
  return { tabs: [HOME_URL], activeIndex: 0 };
}

export function openTab(state: TabState, url: string = HOME_URL): TabState {
  return {
    tabs: [...state.tabs, url],
    activeIndex: state.tabs.length,
  };
}

export function closeTab(state: TabState, index: number = state.activeIndex): TabState {
  if (state.tabs.length <= 1) return state;
  if (!Number.isInteger(index) || index < 0 || index >= state.tabs.length) {
    return state;
  }
  const tabs = [...state.tabs.slice(0, index), ...state.tabs.slice(index + 1)];
  let activeIndex = state.activeIndex;
  if (index < state.activeIndex) activeIndex -= 1;
  else if (index === state.activeIndex) activeIndex = Math.min(index, tabs.length - 1);
  return { tabs, activeIndex };
}

export function switchTab(state: TabState, index: number): TabState {
  if (!Number.isInteger(index) || index < 0 || index >= state.tabs.length) {
    return state;
  }
  if (index === state.activeIndex) return state;
  return { tabs: state.tabs, activeIndex: index };
}

export function setTabUrl(state: TabState, index: number, url: string): TabState {
  if (!Number.isInteger(index) || index < 0 || index >= state.tabs.length) {
    return state;
  }
  if (state.tabs[index] === url) return state;
  const tabs = state.tabs.map((tab, i) => (i === index ? url : tab));
  return { tabs, activeIndex: state.activeIndex };
}
