import {
  Action,
  ActionPanel,
  Application,
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
  const [frontmostApp, setFrontmostApp] = useState<Application>();

  useEffect(() => {
    getFrontmostApplication().then((app) => {
      setFrontmostApp(app);
    });
  }, []);

  return (
    <Detail
      markdown={snippet.content}
      navigationTitle={snippet.title || "Untitled Snippet"}
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
            title={
              frontmostApp?.name
                ? `Paste to ${frontmostApp.name}`
                : "Paste to Active App"
            }
            content={snippet.content}
            {...(frontmostApp?.path && {
              icon: { fileIcon: frontmostApp.path },
            })}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={snippet.content}
            shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
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
