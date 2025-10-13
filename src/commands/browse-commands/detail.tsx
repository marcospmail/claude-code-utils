import {
  Action,
  ActionPanel,
  Application,
  Detail,
  Icon,
  getFrontmostApplication,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { SlashCommand } from "../../utils/commands";
import { formatContentMarkdown } from "../../utils/markdown-formatters";

interface SlashCommandDetailProps {
  command: SlashCommand;
}

export default function SlashCommandDetail({
  command,
}: SlashCommandDetailProps) {
  const markdown = formatContentMarkdown(command.name, command.content);
  const [frontmostApp, setFrontmostApp] = useState<Application>();

  useEffect(() => {
    getFrontmostApplication().then((app) => {
      setFrontmostApp(app);
    });
  }, []);

  return (
    <Detail
      markdown={markdown}
      navigationTitle={command.name}
      actions={
        <ActionPanel>
          <Action.Paste
            title={
              frontmostApp?.name
                ? `Paste to ${frontmostApp.name}`
                : "Paste to Active App"
            }
            content={command.content}
            {...(frontmostApp?.path && {
              icon: { fileIcon: frontmostApp.path },
            })}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={command.content}
            icon={Icon.Clipboard}
            shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
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
