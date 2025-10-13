import {
  Action,
  ActionPanel,
  Application,
  Detail,
  getFrontmostApplication,
  Icon,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { ParsedMessage } from "../../utils/claude-messages";
import CreateSnippet from "../create-snippet/list";

interface MessageDetailProps {
  message: ParsedMessage;
}

export default function MessageDetail({ message }: MessageDetailProps) {
  const [frontmostApp, setFrontmostApp] = useState<Application>();

  useEffect(() => {
    getFrontmostApplication()
      .then((app) => {
        setFrontmostApp(app);
      })
      .catch(() => {
        // Silently fail - no paste action will be shown
      });
  }, []);

  // Extract first line or first 50 characters for title
  const title = message.preview || "Sent Message";

  return (
    <Detail
      markdown={message.content}
      navigationTitle={title}
      actions={
        <ActionPanel>
          <Action.Paste
            title={
              frontmostApp?.name
                ? `Paste to ${frontmostApp.name}`
                : "Paste to Active App"
            }
            content={message.content}
            {...(frontmostApp?.path && {
              icon: { fileIcon: frontmostApp.path },
            })}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={message.content}
            shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
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
