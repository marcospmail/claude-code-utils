import {
  Action,
  ActionPanel,
  Detail,
  getFrontmostApplication,
  Icon,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { ParsedMessage } from "../../utils/claudeMessages";
import CreateSnippet from "../create-snippet/list";

interface MessageDetailProps {
  message: ParsedMessage;
}

export default function MessageDetail({ message }: MessageDetailProps) {
  const [frontmostApp, setFrontmostApp] = useState<string>("Active App");
  const [appIcon, setAppIcon] = useState<Icon | { fileIcon: string }>(
    Icon.Window,
  );

  useEffect(() => {
    getFrontmostApplication()
      .then((app) => {
        setFrontmostApp(app.name);
        setAppIcon({ fileIcon: app.path });
      })
      .catch(() => {
        setFrontmostApp("Active App");
        setAppIcon(Icon.Window);
      });
  }, []);

  return (
    <Detail
      markdown={message.content}
      actions={
        <ActionPanel>
          <Action.Paste
            title={`Paste to ${frontmostApp}`}
            content={message.content}
            icon={appIcon}
            shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
          />
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={message.content}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action.Push
            title="Create Snippet"
            icon={Icon.Document}
            target={<CreateSnippet content={message.content} />}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
          />
        </ActionPanel>
      }
    />
  );
}
