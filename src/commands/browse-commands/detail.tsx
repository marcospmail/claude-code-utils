import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { SlashCommand } from "../../utils/commands";
import { generateFileContentMarkdown } from "../../utils/markdown-formatters";

interface SlashCommandDetailProps {
  command: SlashCommand;
}

export default function SlashCommandDetail({
  command,
}: SlashCommandDetailProps) {
  const markdown = generateFileContentMarkdown({
    name: command.name,
    content: command.content,
  });

  return (
    <Detail
      markdown={markdown}
      navigationTitle={command.name}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Command Content"
            content={command.content}
            icon={Icon.Clipboard}
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
  );
}
