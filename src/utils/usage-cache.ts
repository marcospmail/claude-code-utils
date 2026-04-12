import { Cache } from "@raycast/api";
import { UsageData } from "./usage-api";

export const cache = new Cache();
export const CACHE_KEY = "usage-data";
export const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function getCachedData(): UsageData | null {
  const raw = cache.get(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      fiveHour: { ...parsed.fiveHour, resetsAt: parsed.fiveHour.resetsAt ? new Date(parsed.fiveHour.resetsAt) : null },
      sevenDay: { ...parsed.sevenDay, resetsAt: parsed.sevenDay.resetsAt ? new Date(parsed.sevenDay.resetsAt) : null },
      sonnet: parsed.sonnet
        ? { ...parsed.sonnet, resetsAt: parsed.sonnet.resetsAt ? new Date(parsed.sonnet.resetsAt) : null }
        : null,
      fetchedAt: new Date(parsed.fetchedAt),
    };
  } catch {
    return null;
  }
}

export function setCachedData(data: UsageData) {
  cache.set(CACHE_KEY, JSON.stringify(data));
}

export function buildProgressBar(percent: number, width: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
