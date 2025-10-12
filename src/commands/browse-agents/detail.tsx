import {
  ActionPanel,
  Action,
  Application,
  Detail,
  Icon,
  getFrontmostApplication,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { Agent } from "../../utils/agents";
import { formatContentMarkdown } from "../../utils/markdown-formatters";

interface AgentDetailProps {
  agent: Agent;
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  const markdown = formatContentMarkdown(agent.name, agent.content);
  const [frontmostApp, setFrontmostApp] = useState<Application>();

  useEffect(() => {
    getFrontmostApplication().then((app) => {
      setFrontmostApp(app);
    });
  }, []);

  return (
    <Detail
      markdown={markdown}
      navigationTitle={agent.name}
      actions={
        <ActionPanel>
          {frontmostApp && (
            <Action.Paste
              title={`Paste to ${frontmostApp.name}`}
              content={agent.content}
              icon={frontmostApp.path}
            />
          )}
          <Action.CopyToClipboard
            title="Copy to Clipboard"
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
