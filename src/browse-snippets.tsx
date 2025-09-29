import {
  Action,
  ActionPanel,
  AI,
  Clipboard,
  closeMainWindow,
  Color,
  Detail,
  environment,
  List,
  showHUD,
  showToast,
  Toast,
  confirmAlert,
  Alert,
  Icon,
} from "@raycast/api";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { getSnippets, deleteSnippet, Snippet } from "./utils/claudeMessages";
import { semanticSearchSnippets, normalSearchSnippets } from "./utils/aiSearch";
import CreateSnippet from "./create-snippet";

export default function BrowseSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useAISearch, setUseAISearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [aiSearchFailed, setAiSearchFailed] = useState<
    false | true | "pro-required"
  >(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Check if user has AI access
  const hasAIAccess = environment.canAccess(AI);

  const loadSnippets = useCallback(async () => {
    setIsLoading(true);
    try {
      const allSnippets = await getSnippets();
      // Sort by most recently updated first
      const sortedSnippets = allSnippets.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
      setSnippets(sortedSnippets);
      setFilteredSnippets(sortedSnippets);
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

  // Handle search text changes with debouncing for AI search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (useAISearch) {
      // Debounce AI search by 500ms
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchText(searchText);
      }, 500);
    } else {
      // No debounce for normal search
      setDebouncedSearchText(searchText);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText, useAISearch]);

  // Filter snippets immediately for normal search
  const displaySnippets = useMemo(() => {
    if (!useAISearch && searchText.trim()) {
      return normalSearchSnippets(snippets, searchText);
    }
    return filteredSnippets;
  }, [snippets, searchText, useAISearch, filteredSnippets]);

  // Perform AI search only on debounced text
  useEffect(() => {
    async function performAISearch() {
      if (!debouncedSearchText.trim()) {
        setFilteredSnippets(snippets);
        return;
      }

      if (useAISearch) {
        setIsLoading(true);
        setAiSearchFailed(false);
        try {
          const results = await semanticSearchSnippets(
            snippets,
            debouncedSearchText,
          );
          setFilteredSnippets(results);
          setAiSearchFailed(false);
        } catch (error) {
          // Clear results and show error state
          setFilteredSnippets([]);

          // Check if it's a Pro subscription error (either by checking access or error message)
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (!hasAIAccess || errorMessage.includes("Raycast Pro")) {
            setAiSearchFailed("pro-required");
          } else {
            setAiSearchFailed(true);
          }

          // Show error toast
          showToast({
            style: Toast.Style.Failure,
            title: "AI search failed",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setFilteredSnippets(
          normalSearchSnippets(snippets, debouncedSearchText),
        );
        setAiSearchFailed(false);
      }
    }

    performAISearch();
  }, [debouncedSearchText, useAISearch, snippets]);

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
      searchBarPlaceholder={
        useAISearch ? "Search with AI (semantic)..." : "Search your snippets..."
      }
      onSearchTextChange={setSearchText}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Search Mode"
          value={useAISearch ? "ai" : "normal"}
          onChange={(value) => setUseAISearch(value === "ai")}
        >
          <List.Dropdown.Item
            title="Normal Search"
            value="normal"
            icon={Icon.MagnifyingGlass}
          />
          <List.Dropdown.Item
            title="AI Search (Semantic)"
            value="ai"
            icon={Icon.Stars}
          />
        </List.Dropdown>
      }
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
      {aiSearchFailed && displaySnippets.length === 0 && !isLoading && (
        <List.EmptyView
          icon={{
            source:
              aiSearchFailed === "pro-required"
                ? Icon.Lock
                : Icon.ExclamationMark,
            tintColor:
              aiSearchFailed === "pro-required" ? Color.Orange : Color.Red,
          }}
          title={
            aiSearchFailed === "pro-required"
              ? "Raycast Pro Required"
              : "AI Search Failed"
          }
          description={
            aiSearchFailed === "pro-required"
              ? "AI search requires a Raycast Pro subscription"
              : "Could not perform semantic search."
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
                target={<SnippetDetail snippet={snippet} />}
              />
              <Action
                title="Copy Snippet"
                icon={Icon.Clipboard}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
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
