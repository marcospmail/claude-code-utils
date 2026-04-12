import { Action, ActionPanel, Detail, Icon, LaunchType, launchCommand, open } from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { UsageData, fetchUsageData, formatResetTime, utilizationPercent } from "../../utils/usage-api";
import {
  buildProgressBar,
  cache,
  CACHE_KEY,
  formatRelativeTime,
  getCachedData,
  setCachedData,
  REFRESH_INTERVAL_MS,
} from "../../utils/usage-cache";

function buildMarkdown(data: UsageData | null, error: string | null, isLoading: boolean): string {
  if (isLoading && !data) return "Loading usage data…";
  if (error) return `## Error\n\n${error}`;

  const five = data!.fiveHour;
  const seven = data!.sevenDay;
  const fivePercent = utilizationPercent(five.utilization);
  const sevenPercent = utilizationPercent(seven.utilization);

  let md = "";

  md += `## 5-Hour Window\n`;
  md += `**${fivePercent}%** \`${buildProgressBar(fivePercent, 20)}\`\n\n`;
  md += `Resets in **${formatResetTime(five.resetsAt)}**\n\n`;

  md += `---\n\n`;

  md += `## 7-Day Window\n`;
  md += `**${sevenPercent}%** \`${buildProgressBar(sevenPercent, 20)}\`\n\n`;
  md += `Resets in **${formatResetTime(seven.resetsAt)}**\n\n`;

  if (data!.sonnet) {
    const sonnetPercent = utilizationPercent(data!.sonnet.utilization);
    md += `---\n\n`;
    md += `## Sonnet (7-Day)\n`;
    md += `**${sonnetPercent}%** \`${buildProgressBar(sonnetPercent, 20)}\`\n\n`;
    md += `Resets in **${formatResetTime(data!.sonnet.resetsAt)}**\n\n`;
  }

  const extra = data!.extraUsage;
  if (extra.isEnabled && extra.usedCredits !== null && extra.monthlyLimit !== null) {
    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    md += `---\n\n`;
    md += `## Extra Usage\n`;
    md += `**$${fmt(extra.usedCredits)}** / $${fmt(extra.monthlyLimit)}\n\n`;
  }

  md += `---\n\n*Updated ${formatRelativeTime(data!.fetchedAt)}*`;

  return md;
}

export default function ClaudeUsageDetail() {
  const cached = getCachedData();
  const [data, setData] = useState<UsageData | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!cached || Date.now() - cached.fetchedAt.getTime() >= REFRESH_INTERVAL_MS);
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
    setError(null);
    if (force) {
      cache.remove(CACHE_KEY);
      await launchCommand({ name: "usage-monitor", type: LaunchType.Background });
    }
    try {
      const usage = await fetchUsageData();
      setData(usage);
      if (!force) setCachedData(usage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage");
    } finally {
      setIsLoading(false);
      refreshingRef.current = false;
    }
  }

  useEffect(() => {
    refresh(false);
  }, []);

  const fivePercent = data ? utilizationPercent(data.fiveHour.utilization) : 0;
  const sevenPercent = data ? utilizationPercent(data.sevenDay.utilization) : 0;
  const sonnetPercent = data?.sonnet ? utilizationPercent(data.sonnet.utilization) : 0;
  const fiveReset = data ? formatResetTime(data.fiveHour.resetsAt) : "";
  const sevenReset = data ? formatResetTime(data.sevenDay.resetsAt) : "";
  const sonnetReset = data?.sonnet ? formatResetTime(data.sonnet.resetsAt) : "";

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Detail
      isLoading={isLoading}
      markdown={buildMarkdown(data, error, isLoading)}
      navigationTitle="Claude Usage"
      actions={
        <ActionPanel>
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={() => refresh(true)}
          />
          <Action
            title="Open Claude Usage"
            icon={Icon.Globe}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
            onAction={() => open("https://claude.ai/settings/usage")}
          />
          {data && (
            <ActionPanel.Section title="Copy">
              <Action.CopyToClipboard
                title="Copy 5H Usage"
                content={`${fivePercent}% (resets ${fiveReset})`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "1" }}
              />
              <Action.CopyToClipboard
                title="Copy 7D Usage"
                content={`${sevenPercent}% (resets ${sevenReset})`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "2" }}
              />
              {data.sonnet && (
                <Action.CopyToClipboard
                  title="Copy Sonnet Usage"
                  content={`${sonnetPercent}% (resets ${sonnetReset})`}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "3" }}
                />
              )}
              {data.extraUsage.isEnabled &&
                data.extraUsage.usedCredits !== null &&
                data.extraUsage.monthlyLimit !== null && (
                  <Action.CopyToClipboard
                    title="Copy Extra Usage"
                    content={`$${fmt(data.extraUsage.usedCredits)} / $${fmt(data.extraUsage.monthlyLimit)}`}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "4" }}
                  />
                )}
            </ActionPanel.Section>
          )}
        </ActionPanel>
      }
    />
  );
}
