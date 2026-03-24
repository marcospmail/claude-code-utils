import { Action, ActionPanel, Color, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import {
  COMPONENT_STATUS_COLORS,
  COMPONENT_STATUS_LABELS,
  ComponentStatus,
  fetchIncidents,
  fetchStatusSummary,
  Incident,
  INCIDENT_IMPACT_LABELS,
  INCIDENT_STATUS_LABELS,
  IncidentImpact,
  StatusSummary,
} from "../../utils/status";
import StatusDetail from "./detail";

function componentStatusIcon(status: ComponentStatus): { source: Icon; tintColor: string } {
  const color = COMPONENT_STATUS_COLORS[status];
  if (status === "operational") {
    return { source: Icon.CheckCircle, tintColor: color };
  }
  if (status === "under_maintenance") {
    return { source: Icon.Hammer, tintColor: color };
  }
  return { source: Icon.ExclamationMark, tintColor: color };
}

function componentStatusColor(status: ComponentStatus): Color {
  const map: Record<ComponentStatus, Color> = {
    operational: Color.Green,
    degraded_performance: Color.Yellow,
    partial_outage: Color.Orange,
    major_outage: Color.Red,
    under_maintenance: Color.Blue,
  };
  return map[status];
}

function incidentImpactColor(impact: IncidentImpact): Color {
  const map: Record<IncidentImpact, Color> = {
    none: Color.SecondaryText,
    minor: Color.Yellow,
    major: Color.Orange,
    critical: Color.Red,
  };
  return map[impact];
}

export default function Status() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<StatusSummary>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [summaryData, incidentsData] = await Promise.all([fetchStatusSummary(), fetchIncidents()]);
        setSummary(summaryData);
        setIncidents(incidentsData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch status";
        setError(errorMessage);
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load status",
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  if (error && !isLoading) {
    return (
      <List>
        <List.EmptyView icon={Icon.ExclamationMark} title="Failed to Load Status" description={error} />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search services and incidents...">
      {summary && (
        <List.Section title="Services" subtitle={summary.overallStatus}>
          {summary.components.map((component) => (
            <List.Item
              key={component.id}
              title={component.name}
              icon={componentStatusIcon(component.status)}
              accessories={[
                {
                  tag: {
                    value: COMPONENT_STATUS_LABELS[component.status],
                    color: componentStatusColor(component.status),
                  },
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser title="Open Status Page" url="https://status.claude.com" icon={Icon.Globe} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {summary?.activeIncidents && summary.activeIncidents.length > 0 && (
        <List.Section title="Active Incidents">
          {summary.activeIncidents.map((incident) => (
            <List.Item
              key={incident.id}
              title={incident.name}
              icon={{ source: Icon.ExclamationMark, tintColor: incidentImpactColor(incident.impact) }}
              accessories={[
                { tag: { value: INCIDENT_STATUS_LABELS[incident.status], color: Color.Orange } },
                {
                  tag: { value: INCIDENT_IMPACT_LABELS[incident.impact], color: incidentImpactColor(incident.impact) },
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push title="View Details" target={<StatusDetail incident={incident} />} icon={Icon.Eye} />
                  <Action.OpenInBrowser title="Open in Browser" url={incident.shortlink} icon={Icon.Globe} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {incidents.length > 0 && (
        <List.Section title="Recent Incidents" subtitle={`${incidents.length} incidents`}>
          {incidents.map((incident) => {
            const date = new Date(incident.started_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <List.Item
                key={incident.id}
                title={incident.name}
                icon={
                  incident.status === "resolved"
                    ? { source: Icon.CheckCircle, tintColor: Color.Green }
                    : { source: Icon.ExclamationMark, tintColor: incidentImpactColor(incident.impact) }
                }
                accessories={[
                  {
                    tag: {
                      value: INCIDENT_IMPACT_LABELS[incident.impact],
                      color: incidentImpactColor(incident.impact),
                    },
                  },
                  { text: date },
                ]}
                actions={
                  <ActionPanel>
                    <Action.Push title="View Details" target={<StatusDetail incident={incident} />} icon={Icon.Eye} />
                    <Action.OpenInBrowser title="Open in Browser" url={incident.shortlink} icon={Icon.Globe} />
                    <Action.CopyToClipboard
                      title="Copy Incident Link"
                      content={incident.shortlink}
                      icon={Icon.Clipboard}
                      shortcut={{ modifiers: ["cmd"], key: "enter" }}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      )}
    </List>
  );
}
