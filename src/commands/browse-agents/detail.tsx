import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { Agent } from "../../utils/agents";
import { generateFileContentMarkdown } from "../../utils/markdown-formatters";

interface AgentDetailProps {
  agent: Agent;
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  const markdown = generateFileContentMarkdown({
    name: agent.name,
    content: agent.content,
  });

  return (
    <Detail
      markdown={markdown}
      navigationTitle={agent.name}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Agent Content"
            content={agent.content}
            icon={Icon.Clipboard}
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
