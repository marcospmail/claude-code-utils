import { ActionPanel, Action, Detail, Icon } from "@raycast/api";
import { SlashCommand } from "./utils/slashCommands";

interface SlashCommandDetailProps {
  command: SlashCommand;
}

export default function SlashCommandDetail({
  command,
}: SlashCommandDetailProps) {
  const markdown = `
# ${command.name}

\`\`\`markdown
${command.content}
\`\`\`
  `;

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
