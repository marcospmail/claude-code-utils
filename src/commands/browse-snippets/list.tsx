import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  getFrontmostApplication,
  List,
  showHUD,
  showToast,
  Toast,
  confirmAlert,
  Alert,
  Icon,
} from "@raycast/api";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  getSnippets,
  deleteSnippet,
  Snippet,
} from "../../utils/claudeMessages";
import { normalSearchSnippets } from "../../utils/ai-search";
import CreateSnippet from "../create-snippet/list";
import SnippetDetail from "./detail";

export default function BrowseSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [frontmostApp, setFrontmostApp] = useState<string>("Active App");
  const [appIcon, setAppIcon] = useState<Icon | { fileIcon: string }>(
    Icon.Window,
  );

  // Get frontmost application for list items
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

  // Filter snippets with normal search
  const displaySnippets = useMemo(() => {
    if (searchText.trim()) {
      return normalSearchSnippets(snippets, searchText);
    }
    return snippets;
  }, [snippets, searchText]);

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
        showToast({
          style: Toast.Style.Failure,
          title: "Delete failed",
          message: String(error),
        });
      }
    }
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search your snippets..."
      onSearchTextChange={setSearchText}
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
      {displaySnippets.map((snippet) => (
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
                target={
                  <SnippetDetail snippet={snippet} onDelete={handleDelete} />
                }
              />
              <Action.Paste
                title={`Paste to ${frontmostApp}`}
                content={snippet.content}
                icon={appIcon}
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
              />
              <Action
                title="Copy Snippet"
                icon={Icon.Clipboard}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
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
