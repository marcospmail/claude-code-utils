import { ActionPanel, Action, Detail, Icon } from "@raycast/api";
import { Agent } from "../../utils/agents";
import { formatContentMarkdown } from "../../utils/markdown-formatters";

interface AgentDetailProps {
  agent: Agent;
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  const markdown = formatContentMarkdown(agent.name, agent.content);

  return (
    <Detail
      markdown={markdown}
      navigationTitle={agent.name}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Agent Name"
            content={agent.id}
            icon={Icon.Clipboard}
          />
          <Action.CopyToClipboard
            title="Copy Agent Content"
            content={agent.content}
            icon={Icon.Clipboard}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
          <Action.ShowInFinder
            path={agent.filePath}
            shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
          />
          <Action.OpenWith
            path={agent.filePath}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
        </ActionPanel>
      }
    />
  );
}
