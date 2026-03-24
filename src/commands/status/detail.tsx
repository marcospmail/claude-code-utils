import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { PasteAction } from "../../components/paste-action";
import { formatIncidentTimeline, Incident, INCIDENT_IMPACT_LABELS, INCIDENT_STATUS_LABELS } from "../../utils/status";

interface StatusDetailProps {
  incident: Incident;
}

export default function StatusDetail({ incident }: StatusDetailProps) {
  const startedAt = new Date(incident.started_at).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const affectedComponents = incident.components.map((c) => c.name).join(", ");
  const timeline = formatIncidentTimeline(incident);

  const markdown = `
# ${incident.name}

| | |
|---|---|
| **Status** | ${INCIDENT_STATUS_LABELS[incident.status]} |
| **Impact** | ${INCIDENT_IMPACT_LABELS[incident.impact]} |
| **Started** | ${startedAt} |
${affectedComponents ? `| **Affected** | ${affectedComponents} |` : ""}

## Timeline

${timeline}
  `;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={incident.name}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="View on Status Page" url={incident.shortlink} icon={Icon.Globe} />
          <PasteAction content={timeline} />
          <Action.CopyToClipboard
            title="Copy Timeline"
            content={timeline}
            icon={Icon.Clipboard}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
        </ActionPanel>
      }
    />
  );
}
