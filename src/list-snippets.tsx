import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  Detail,
  List,
  showHUD,
  showToast,
  Toast,
  confirmAlert,
  Alert,
  Icon,
} from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { getSnippets, deleteSnippet, Snippet } from "./utils/claudeMessages";
import CreateSnippet from "./create-snippet";

export default function ListSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSnippets = useCallback(async () => {
    setIsLoading(true);
    try {
      const allSnippets = await getSnippets();
      // Sort by most recently updated first
      const sortedSnippets = allSnippets.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
      setSnippets(sortedSnippets);
    } catch (error) {
      console.error({ error });
      showToast({
        style: Toast.Style.Failure,
        title: "Error loading snippets",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  async function copyContent(snippet: Snippet, closeWindow = false) {
    try {
      await Clipboard.copy(snippet.content);
      if (closeWindow) {
        await closeMainWindow();
        await showHUD("Copied to Clipboard");
      } else {
        showToast({
          style: Toast.Style.Success,
          title: "Content copied",
          message: `"${snippet.title}" copied to clipboard`,
        });
      }
    } catch (error) {
      console.error({ error });
      showToast({
        style: Toast.Style.Failure,
        title: "Copy failed",
        message: String(error),
      });
    }
  }

  async function handleDelete(snippet: Snippet) {
    if (
      await confirmAlert({
        title: "Delete Snippet",
        message: `Are you sure you want to delete "${snippet.title}"?`,
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      })
    ) {
      try {
        await deleteSnippet(snippet.id);
        showToast({
          style: Toast.Style.Success,
          title: "Snippet deleted",
          message: `"${snippet.title}" has been deleted`,
        });
        loadSnippets();
      } catch (error) {
        console.error({ error });
        showToast({
          style: Toast.Style.Failure,
          title: "Delete failed",
          message: String(error),
        });
      }
    }
  }

  function SnippetDetail({ snippet }: { snippet: Snippet }) {
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
            <Action
              title="Copy Snippet"
              icon={Icon.Clipboard}
              onAction={() => copyContent(snippet, true)}
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
              onAction={() => handleDelete(snippet)}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search your snippets..."
      actions={
        <ActionPanel>
          <Action.Push
            title="Create New Snippet"
            target={<CreateSnippet />}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </ActionPanel>
      }
    >
      {snippets.length === 0 && !isLoading && (
        <List.EmptyView
          title="No snippets yet"
          description="Create your first snippet to get started"
          actions={
            <ActionPanel>
              <Action.Push
                title="Create New Snippet"
                target={<CreateSnippet />}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
              />
            </ActionPanel>
          }
        />
      )}
      {snippets.map((snippet) => (
        <List.Item
          key={snippet.id}
          title={snippet.title}
          subtitle={
            snippet.content.substring(0, 100) +
            (snippet.content.length > 100 ? "..." : "")
          }
          accessories={[
            {
              text: snippet.updatedAt.toLocaleDateString(),
            },
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Snippet"
                icon={Icon.Eye}
                target={<SnippetDetail snippet={snippet} />}
              />
              <Action
                title="Copy Snippet"
                icon={Icon.Clipboard}
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
                onAction={() => copyContent(snippet, true)}
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
              <Action.Push
                title="Create New Snippet"
                icon={Icon.Plus}
                target={<CreateSnippet />}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
              />
              <Action
                title="Delete Snippet"
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={() => handleDelete(snippet)}
                icon={Icon.Trash}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
