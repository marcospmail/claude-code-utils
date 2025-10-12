import {
  Action,
  ActionPanel,
  Detail,
  getFrontmostApplication,
  Icon,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { Snippet } from "../../utils/claude-messages";
import CreateSnippet from "../create-snippet/list";

interface SnippetDetailProps {
  snippet: Snippet;
  onDelete: (snippet: Snippet) => void;
}

export default function SnippetDetail({
  snippet,
  onDelete,
}: SnippetDetailProps) {
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
      markdown={snippet.content}
      navigationTitle="Snippet Detail"
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Title"
            text={snippet.title || "Untitled"}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Created"
            text={snippet.createdAt.toLocaleString()}
          />
          <Detail.Metadata.Label
            title="Updated"
            text={snippet.updatedAt.toLocaleString()}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.Paste
            title={`Paste to ${frontmostApp}`}
            content={snippet.content}
            icon={appIcon}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={snippet.content}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action.Push
            title="Duplicate Snippet"
            icon={Icon.CopyClipboard}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            target={
              <CreateSnippet
                title={snippet.title ? `${snippet.title} (Copy)` : "Copy"}
                content={snippet.content}
              />
            }
          />
          <Action
            title="Delete Snippet"
            style={Action.Style.Destructive}
            icon={Icon.Trash}
            shortcut={{ modifiers: ["ctrl"], key: "x" }}
            onAction={() => onDelete(snippet)}
          />
        </ActionPanel>
      }
    />
  );
}
