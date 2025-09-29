import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { getAgents, Agent } from "./utils/agents";
import AgentDetail from "./agent-detail";

export default function BrowseAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        const loadedAgents = await getAgents();
        setAgents(loadedAgents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agents");
      } finally {
        setIsLoading(false);
      }
    }

    loadAgents();
  }, []);

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error Loading Agents"
          description={error}
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search agents...">
      {agents.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Agents Found"
          description="No agent files found in ~/.claude/agents"
        />
      ) : (
        agents.map((agent) => (
          <List.Item
            key={agent.id}
            title={agent.name}
            icon={Icon.CodeBlock}
            accessories={[{ text: `${agent.id}.md` }]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Agent Details"
                  icon={Icon.Eye}
                  target={<AgentDetail agent={agent} />}
                />
                <Action.CopyToClipboard
                  title="Copy Agent Content"
                  content={agent.content}
                  icon={Icon.Clipboard}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action.ShowInFinder
                  path={agent.filePath}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
