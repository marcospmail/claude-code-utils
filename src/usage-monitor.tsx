import { Clipboard, MenuBarExtra, environment, LaunchType, Cache, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";
import { UsageData, fetchUsageData, formatResetTime, formatUpdatedAgo, utilizationPercent } from "./utils/usage-api";

const cache = new Cache();
const CACHE_KEY = "usage-data";

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

function buildProgressBar(percent: number, width = 15): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}

function copyValue(value: string) {
  return async () => {
    await Clipboard.copy(value);
    await showHUD("Copied to clipboard");
  };
}

export default function UsageMonitor() {
  const [data, setData] = useState<UsageData | null>(getCachedData());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    try {
      const usage = await fetchUsageData();
      setData(usage);
      setCachedData(usage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (error && !data) {
    return (
      <MenuBarExtra icon={undefined} title="--" isLoading={isLoading}>
        <MenuBarExtra.Item title={error} onAction={refresh} />
        <MenuBarExtra.Separator />
        <MenuBarExtra.Item title="Refresh" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={refresh} />
      </MenuBarExtra>
    );
  }

  const fivePercent = data ? utilizationPercent(data.fiveHour.utilization) : 0;
  const sevenPercent = data ? utilizationPercent(data.sevenDay.utilization) : 0;

  const title =
    environment.launchType === LaunchType.Background
      ? `5h:${fivePercent}% | 7d:${sevenPercent}%`
      : `5h:${fivePercent}% | 7d:${sevenPercent}%`;

  return (
    <MenuBarExtra icon={undefined} title={title} isLoading={isLoading}>
      <MenuBarExtra.Item title="Claude Usage" onAction={refresh} />
      <MenuBarExtra.Separator />

      <MenuBarExtra.Section title="5-Hour Window">
        <MenuBarExtra.Item
          title={`${fivePercent}%  ${buildProgressBar(fivePercent)}`}
          onAction={copyValue(`${fivePercent}%`)}
        />
        <MenuBarExtra.Item
          title={`Resets ${data ? formatResetTime(data.fiveHour.resetsAt) : "..."}`}
          onAction={copyValue(`Resets ${data ? formatResetTime(data.fiveHour.resetsAt) : "..."}`)}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="7-Day Window">
        <MenuBarExtra.Item
          title={`${sevenPercent}%  ${buildProgressBar(sevenPercent)}`}
          onAction={copyValue(`${sevenPercent}%`)}
        />
        <MenuBarExtra.Item
          title={`Resets ${data ? formatResetTime(data.sevenDay.resetsAt) : "..."}`}
          onAction={copyValue(`Resets ${data ? formatResetTime(data.sevenDay.resetsAt) : "..."}`)}
        />
      </MenuBarExtra.Section>

      {data?.sonnet && (
        <MenuBarExtra.Section title="Sonnet (7-Day)">
          <MenuBarExtra.Item
            title={`${utilizationPercent(data.sonnet.utilization)}%  ${buildProgressBar(utilizationPercent(data.sonnet.utilization))}`}
            onAction={copyValue(`${utilizationPercent(data.sonnet.utilization)}%`)}
          />
          <MenuBarExtra.Item
            title={`Resets ${formatResetTime(data.sonnet.resetsAt)}`}
            onAction={copyValue(`Resets ${formatResetTime(data.sonnet.resetsAt)}`)}
          />
        </MenuBarExtra.Section>
      )}

      {data?.extraUsage.isEnabled && (
        <MenuBarExtra.Section title="Extra Usage">
          <MenuBarExtra.Item
            title={`$${(data.extraUsage.usedCredits ?? 0).toFixed(2)} / $${(data.extraUsage.monthlyLimit ?? 0).toFixed(2)}`}
            onAction={copyValue(
              `$${(data.extraUsage.usedCredits ?? 0).toFixed(2)} / $${(data.extraUsage.monthlyLimit ?? 0).toFixed(2)}`,
            )}
          />
        </MenuBarExtra.Section>
      )}

      <MenuBarExtra.Separator />
      <MenuBarExtra.Item title={`Updated ${data ? formatUpdatedAgo(data.fetchedAt) : "never"}`} onAction={refresh} />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item title="Refresh" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={refresh} />
    </MenuBarExtra>
  );
}
