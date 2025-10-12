import { ActionPanel, Action, Detail, Icon } from "@raycast/api";
import { SlashCommand } from "../../utils/slash-commands";
import { formatContentMarkdown } from "../../utils/markdown-formatters";

interface SlashCommandDetailProps {
  command: SlashCommand;
}

export default function SlashCommandDetail({
  command,
}: SlashCommandDetailProps) {
  const markdown = formatContentMarkdown(command.name, command.content);

  return (
    <Detail
      markdown={markdown}
      navigationTitle={command.name}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Command Name"
            content={command.id}
            icon={Icon.Clipboard}
          />
          <Action.CopyToClipboard
            title="Copy Command Content"
            content={command.content}
            icon={Icon.Clipboard}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
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
