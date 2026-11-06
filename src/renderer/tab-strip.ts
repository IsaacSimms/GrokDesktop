type TabStripState = {
  tabs: string[];
  activeIndex: number;
};

type TabBridge = {
  getTabs: () => Promise<TabStripState>;
  onTabs: (callback: (state: TabStripState) => void) => void;
  openTab: () => void;
  closeTab: (index: number) => void;
  switchTab: (index: number) => void;
  stripReady: () => void;
};

declare const grokdesktop: TabBridge;

function labelFor(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname}${path}`;
  } catch {
    return "Grok";
  }
}

function render(state: TabStripState): void {
  const root = document.getElementById("tabs");
  if (!root) return;
  root.replaceChildren();
  state.tabs.forEach((url, index) => {
    const tab = document.createElement("div");
    tab.className = index === state.activeIndex ? "tab active" : "tab";
    const select = document.createElement("button");
    select.type = "button";
    select.className = "select";
    select.textContent = labelFor(url);
    select.title = url;
    select.addEventListener("click", () => grokdesktop.switchTab(index));
    const close = document.createElement("button");
    close.type = "button";
    close.className = "close";
    close.setAttribute("aria-label", `Close ${labelFor(url)}`);
    close.textContent = "×";
    close.addEventListener("click", () => grokdesktop.closeTab(index));
    tab.append(select, close);
    root.append(tab);
  });
}

const newTab = document.getElementById("new-tab");
if (newTab) {
  newTab.addEventListener("click", () => grokdesktop.openTab());
}

let sawUpdate = false;
grokdesktop.onTabs((state) => {
  sawUpdate = true;
  render(state);
});
void grokdesktop.getTabs().then((state) => {
  if (!sawUpdate) render(state);
  grokdesktop.stripReady();
}).catch(() => {
  grokdesktop.stripReady();
});
