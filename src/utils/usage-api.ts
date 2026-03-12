import { getOAuthToken } from "./claude-cli";

const USAGE_API_URL = "https://api.anthropic.com/api/oauth/usage";
const CLAUDE_CODE_VERSION = "1.0.0";

export interface UsageWindow {
  utilization: number;
  resetsAt: Date | null;
}

export interface ExtraUsage {
  isEnabled: boolean;
  monthlyLimit: number | null;
  usedCredits: number | null;
}

export interface UsageData {
  fiveHour: UsageWindow;
  sevenDay: UsageWindow;
  sonnet: UsageWindow | null;
  extraUsage: ExtraUsage;
  fetchedAt: Date;
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function fetchUsageData(): Promise<UsageData> {
  const token = await getOAuthToken();
  if (!token) {
    throw new Error("Not logged in. Run `claude` in your terminal to authenticate.");
  }

  const response = await fetch(USAGE_API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": `claude-code/${CLAUDE_CODE_VERSION}`,
      Authorization: `Bearer ${token}`,
      "anthropic-beta": "oauth-2025-04-20",
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as Record<string, Record<string, unknown>>;

  const fiveHour = json.five_hour;
  const sevenDay = json.seven_day;
  const sonnetRaw = json.seven_day_sonnet ?? json.sonnet_only;
  const extraRaw = json.extra_usage;

  return {
    fiveHour: {
      utilization: (fiveHour?.utilization as number) ?? 0,
      resetsAt: parseDate(fiveHour?.resets_at as string),
    },
    sevenDay: {
      utilization: (sevenDay?.utilization as number) ?? 0,
      resetsAt: parseDate(sevenDay?.resets_at as string),
    },
    sonnet: sonnetRaw
      ? {
          utilization: (sonnetRaw.utilization as number) ?? 0,
          resetsAt: parseDate(sonnetRaw.resets_at as string),
        }
      : null,
    extraUsage: {
      isEnabled: (extraRaw?.is_enabled as boolean) ?? false,
      monthlyLimit: (extraRaw?.monthly_limit as number) ?? null,
      usedCredits: (extraRaw?.used_credits as number) ?? null,
    },
    fetchedAt: new Date(),
  };
}

export function formatResetTime(resetsAt: Date | null): string {
  if (!resetsAt) return "Unknown";
  const now = new Date();
  const diffMs = resetsAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Now";

  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;

  if (days > 0) return `${days}d${hours}h`;
  if (hours > 0) return `${hours}h${minutes}m`;
  return `${minutes}m`;
}

export function utilizationPercent(utilization: number): number {
  return Math.max(0, Math.round(utilization));
}

export function getStatusIcon(percent: number): string {
  if (percent < 50) return "status-green";
  if (percent < 70) return "status-yellow";
  if (percent < 90) return "status-orange";
  return "status-red";
}
