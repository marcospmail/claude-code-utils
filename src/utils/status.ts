import { simulateNetworkDelay } from "./network-simulation";

const STATUS_API_BASE = "https://status.claude.com/api/v2";

export type ComponentStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "under_maintenance";
export type IncidentImpact = "none" | "minor" | "major" | "critical";
export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved" | "postmortem";

export interface StatusComponent {
  id: string;
  name: string;
  status: ComponentStatus;
  description: string | null;
  position: number;
  updated_at: string;
}

export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  body: string;
  created_at: string;
  display_at: string;
  affected_components: {
    code: string;
    name: string;
    old_status: ComponentStatus;
    new_status: ComponentStatus;
  }[];
}

export interface Incident {
  id: string;
  name: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  started_at: string;
  shortlink: string;
  incident_updates: IncidentUpdate[];
  components: StatusComponent[];
}

interface SummaryResponse {
  status: { indicator: string; description: string };
  components: StatusComponent[];
  incidents: Incident[];
  scheduled_maintenances: Incident[];
}

interface IncidentsResponse {
  incidents: Incident[];
}

export interface StatusSummary {
  overallStatus: string;
  components: StatusComponent[];
  activeIncidents: Incident[];
  scheduledMaintenances: Incident[];
}

export async function fetchStatusSummary(): Promise<StatusSummary> {
  return simulateNetworkDelay(async () => {
    const response = await fetch(`${STATUS_API_BASE}/summary.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch status: ${response.status}`);
    }

    const data = (await response.json()) as SummaryResponse;

    return {
      overallStatus: data.status.description,
      components: data.components.filter((c) => !c.description?.includes("group")),
      activeIncidents: data.incidents,
      scheduledMaintenances: data.scheduled_maintenances,
    };
  });
}

export async function fetchIncidents(): Promise<Incident[]> {
  return simulateNetworkDelay(async () => {
    const response = await fetch(`${STATUS_API_BASE}/incidents.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch incidents: ${response.status}`);
    }

    const data = (await response.json()) as IncidentsResponse;
    return data.incidents;
  });
}

export const COMPONENT_STATUS_LABELS: Record<ComponentStatus, string> = {
  operational: "Operational",
  degraded_performance: "Degraded Performance",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  under_maintenance: "Under Maintenance",
};

export const COMPONENT_STATUS_COLORS: Record<ComponentStatus, string> = {
  operational: "#22c55e",
  degraded_performance: "#eab308",
  partial_outage: "#f97316",
  major_outage: "#ef4444",
  under_maintenance: "#3b82f6",
};

export const INCIDENT_IMPACT_LABELS: Record<IncidentImpact, string> = {
  none: "None",
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
  postmortem: "Postmortem",
};

export function formatIncidentTimeline(incident: Incident): string {
  const updates = [...incident.incident_updates].reverse();

  const lines = updates.map((update) => {
    const date = new Date(update.created_at);
    const time = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `**${INCIDENT_STATUS_LABELS[update.status]}** — ${time}\n\n${update.body}`;
  });

  return lines.join("\n\n---\n\n");
}
