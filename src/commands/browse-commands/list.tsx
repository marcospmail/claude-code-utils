import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { getSlashCommands, SlashCommand } from "../../utils/commands";
import SlashCommandDetail from "./detail";

export default function BrowseCommands() {
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommands() {
      try {
        const loadedCommands = await getSlashCommands();
        setCommands(loadedCommands);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load commands",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadCommands();
  }, []);

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error Loading Commands"
          description={error}
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search commands...">
      {commands.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Commands Found"
          description="No command files found in ~/.claude/commands"
        />
      ) : (
        commands.map((command) => (
          <List.Item
            key={command.id}
            title={command.name}
            icon={Icon.Terminal}
            accessories={[{ text: `${command.id}.md` }]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Command Details"
                  icon={Icon.Eye}
                  target={<SlashCommandDetail command={command} />}
                />
                <Action.CopyToClipboard
                  title="Copy Command Content"
                  content={command.content}
                  icon={Icon.Clipboard}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                />
                <Action.ShowInFinder
                  path={command.filePath}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
                />
                <Action.OpenWith
                  path={command.filePath}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
