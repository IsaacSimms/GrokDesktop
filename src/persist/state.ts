import { isGrokUrl } from "../links/classify";
import { HOME_URL } from "../tabs/model";

export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PersistedWindow = {
  bounds: WindowBounds | null;
  tabs: string[];
  activeIndex: number;
};

const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

export function serializeWindow(state: PersistedWindow): string {
  return JSON.stringify({
    bounds: state.bounds,
    tabs: state.tabs,
    activeIndex: state.activeIndex,
  });
}

function fallbackWindow(): PersistedWindow {
  return { bounds: null, tabs: [HOME_URL], activeIndex: 0 };
}

function parseBounds(value: unknown): WindowBounds | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const x = record.x;
  const y = record.y;
  const width = record.width;
  const height = record.height;
  if (typeof x !== "number" || typeof y !== "number" || typeof width !== "number" || typeof height !== "number") {
    return null;
  }
  if (![x, y, width, height].every((n) => Number.isFinite(n))) return null;
  if (width < MIN_WIDTH || height < MIN_HEIGHT) return null;
  return { x, y, width, height };
}

function parseTabs(value: unknown, activeIndex: unknown): { tabs: string[]; activeIndex: number } {
  if (!Array.isArray(value)) return { tabs: [HOME_URL], activeIndex: 0 };
  const requested = typeof activeIndex === "number" && Number.isInteger(activeIndex) ? activeIndex : 0;
  const kept: string[] = [];
  const origins: number[] = [];
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !isGrokUrl(entry)) return;
    kept.push(entry);
    origins.push(index);
  });
  if (kept.length === 0) return { tabs: [HOME_URL], activeIndex: 0 };
  const exact = origins.indexOf(requested);
  if (exact !== -1) return { tabs: kept, activeIndex: exact };
  const next = origins.findIndex((index) => index > requested);
  if (next !== -1) return { tabs: kept, activeIndex: next };
  return { tabs: kept, activeIndex: kept.length - 1 };
}

export function parseWindow(raw: string | null | undefined): PersistedWindow {
  if (typeof raw !== "string" || raw.trim() === "") return fallbackWindow();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return fallbackWindow();
  }
  if (!data || typeof data !== "object") return fallbackWindow();
  const record = data as Record<string, unknown>;
  const bounds = parseBounds(record.bounds);
  const tabs = parseTabs(record.tabs, record.activeIndex);
  return { bounds, tabs: tabs.tabs, activeIndex: tabs.activeIndex };
}
