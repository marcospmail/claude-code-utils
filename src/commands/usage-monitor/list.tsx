import { Clipboard, MenuBarExtra, Cache, showHUD, open } from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { UsageData, fetchUsageData, formatResetTime, utilizationPercent } from "../../utils/usage-api";

const cache = new Cache();
const CACHE_KEY = "usage-data";
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

function getCachedData(): UsageData | null {
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

function setCachedData(data: UsageData) {
  cache.set(CACHE_KEY, JSON.stringify(data));
}

function buildProgressBar(percent: number, width: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}

// Module-level fetch that survives component remounts
let backgroundFetchInProgress = false;
let lastBackgroundError: string | null = null;
async function backgroundFetchAndCache() {
  if (backgroundFetchInProgress) return;
  backgroundFetchInProgress = true;
  try {
    const usage = await fetchUsageData();
    setCachedData(usage);
    lastBackgroundError = null;
  } catch (err) {
    lastBackgroundError = err instanceof Error ? err.message : "Failed to fetch usage";
  } finally {
    backgroundFetchInProgress = false;
  }
}

function copyValue(value: string) {
  return async () => {
    await Clipboard.copy(value);
    await showHUD("Copied to clipboard");
  };
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function UsageMonitor() {
  const cached = getCachedData();
  const [data, setData] = useState<UsageData | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!cached || Date.now() - cached.fetchedAt.getTime() >= REFRESH_INTERVAL_MS);
  const hasDataRef = useRef(!!cached);
  const refreshingRef = useRef(false);

  async function refresh(force: boolean) {
    if (refreshingRef.current) return;

    if (!force) {
      const cachedCheck = getCachedData();
      if (cachedCheck && Date.now() - cachedCheck.fetchedAt.getTime() < REFRESH_INTERVAL_MS) {
        setData(cachedCheck);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    refreshingRef.current = true;
    setIsLoading(true);
    const start = Date.now();
    try {
      const usage = await fetchUsageData();
      setData(usage);
      setCachedData(usage);
      setError(null);
      hasDataRef.current = true;
      const elapsed = Date.now() - start;
      if (elapsed < 1000) {
        await new Promise((r) => setTimeout(r, 1000 - elapsed));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch usage";
      if (!hasDataRef.current && !getCachedData()) {
        setError(message);
      }
    } finally {
      setIsLoading(false);
      refreshingRef.current = false;
    }
  }

  useEffect(() => {
    refresh(false);
    const interval = setInterval(() => backgroundFetchAndCache(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <MenuBarExtra title={error} isLoading={isLoading}>
        <MenuBarExtra.Item title="Claude Usage" onAction={() => open("https://claude.ai/settings/usage")} />
        <MenuBarExtra.Item title="Refresh" onAction={() => refresh(true)} />
      </MenuBarExtra>
    );
  }

  const fivePercent = data ? utilizationPercent(data.fiveHour.utilization) : 0;
  const sevenPercent = data ? utilizationPercent(data.sevenDay.utilization) : 0;
  const sonnetPercent = data?.sonnet ? utilizationPercent(data.sonnet.utilization) : 0;
  const sonnetReset = data?.sonnet ? formatResetTime(data.sonnet.resetsAt) : "";

  const fiveReset = data ? formatResetTime(data.fiveHour.resetsAt) : "5h";
  const sevenReset = data ? formatResetTime(data.sevenDay.resetsAt) : "7d";
  const title = isLoading ? "Refreshing..." : `${fiveReset}:${fivePercent}% | ${sevenReset}:${sevenPercent}%`;

  return (
    <MenuBarExtra title={title} isLoading={isLoading}>
      <MenuBarExtra.Item title="Claude Usage" onAction={() => open("https://claude.ai/settings/usage")} />
      <MenuBarExtra.Item title="Refresh" onAction={() => refresh(true)} />
      <MenuBarExtra.Separator />

      <MenuBarExtra.Section title="5-Hour Window">
        <MenuBarExtra.Item
          title={`${fivePercent}%  ${buildProgressBar(fivePercent, 15)}`}
          onAction={copyValue(`${fivePercent}%`)}
        />
        <MenuBarExtra.Item title={`Resets ${fiveReset}`} onAction={copyValue(`Resets ${fiveReset}`)} />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="7-Day Window">
        <MenuBarExtra.Item
          title={`${sevenPercent}%  ${buildProgressBar(sevenPercent, 15)}`}
          onAction={copyValue(`${sevenPercent}%`)}
        />
        <MenuBarExtra.Item title={`Resets ${sevenReset}`} onAction={copyValue(`Resets ${sevenReset}`)} />
      </MenuBarExtra.Section>

      {data?.sonnet && (
        <MenuBarExtra.Section title="Sonnet (7-Day)">
          <MenuBarExtra.Item
            title={`${sonnetPercent}%  ${buildProgressBar(sonnetPercent, 15)}`}
            onAction={copyValue(`${sonnetPercent}%`)}
          />
          <MenuBarExtra.Item title={`Resets ${sonnetReset}`} onAction={copyValue(`Resets ${sonnetReset}`)} />
        </MenuBarExtra.Section>
      )}

      {data?.extraUsage.isEnabled && data.extraUsage.usedCredits !== null && data.extraUsage.monthlyLimit !== null && (
        <MenuBarExtra.Section title="Extra Usage">
          <MenuBarExtra.Item
            title={`$${data.extraUsage.usedCredits.toFixed(2)} / $${data.extraUsage.monthlyLimit.toFixed(2)}`}
            onAction={copyValue(
              `$${data.extraUsage.usedCredits.toFixed(2)} / $${data.extraUsage.monthlyLimit.toFixed(2)}`,
            )}
          />
        </MenuBarExtra.Section>
      )}

      {data && (
        <MenuBarExtra.Item
          title={`Updated ${formatRelativeTime(data.fetchedAt)}${lastBackgroundError ? " (refresh failed)" : ""}`}
        />
      )}
    </MenuBarExtra>
  );
}
