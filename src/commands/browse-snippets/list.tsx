import {
  Action,
  ActionPanel,
  // AI,
  Clipboard,
  closeMainWindow,
  // Color,
  // environment,
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
} from "../../utils/claude-messages";
// COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
// import {
//   semanticSearchSnippets,
//   normalSearchSnippets,
// } from "../../utils/ai-search";
import { normalSearchSnippets } from "../../utils/ai-search";
import CreateSnippet from "../create-snippet/list";
import SnippetDetail from "./detail";

// Constants
// COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
// const AI_SEARCH_DEBOUNCE_MS = 500;

// Types
// COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
// type AISearchError = false | "failed" | "pro-required";

export default function BrowseSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // const [useAISearch, setUseAISearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // const [debouncedSearchText, setDebouncedSearchText] = useState("");
  // const [aiSearchFailed, setAiSearchFailed] = useState<AISearchError>(false);
  // const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [frontmostApp, setFrontmostApp] = useState<string>("");
  const [appIcon, setAppIcon] = useState<Icon | { fileIcon: string }>(
    Icon.Window,
  );

  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // Check if user has AI access
  // const hasAIAccess = environment.canAccess(AI);

  // Get frontmost application for list items
  useEffect(() => {
    getFrontmostApplication().then((app) => {
      setFrontmostApp(app.name);
      setAppIcon({ fileIcon: app.path });
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

  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // Handle search text changes with debouncing for AI search
  // useEffect(() => {
  //   if (debounceTimerRef.current) {
  //     clearTimeout(debounceTimerRef.current);
  //   }

  //   if (useAISearch) {
  //     // Debounce AI search
  //     debounceTimerRef.current = setTimeout(() => {
  //       setDebouncedSearchText(searchText);
  //     }, AI_SEARCH_DEBOUNCE_MS);
  //   } else {
  //     // No debounce for normal search
  //     setDebouncedSearchText(searchText);
  //   }

  //   return () => {
  //     if (debounceTimerRef.current) {
  //       clearTimeout(debounceTimerRef.current);
  //     }
  //   };
  // }, [searchText, useAISearch]);

  // Filter snippets immediately for normal search
  const displaySnippets = useMemo(() => {
    // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
    // if (!useAISearch && searchText.trim()) {
    if (searchText.trim()) {
      return normalSearchSnippets(snippets, searchText);
    }
    return filteredSnippets;
    // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
    // }, [snippets, searchText, useAISearch, filteredSnippets]);
  }, [snippets, searchText, filteredSnippets]);

  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // Perform AI search only on debounced text
  // useEffect(() => {
  //   async function performAISearch() {
  //     if (!debouncedSearchText.trim()) {
  //       setFilteredSnippets(snippets);
  //       return;
  //     }

  //     if (useAISearch) {
  //       setIsLoading(true);
  //       setAiSearchFailed(false);
  //       try {
  //         const results = await semanticSearchSnippets(
  //           snippets,
  //           debouncedSearchText,
  //         );
  //         setFilteredSnippets(results);
  //         setAiSearchFailed(false);
  //       } catch (error) {
  //         // Clear results and show error state
  //         setFilteredSnippets([]);

  //         // Check if it's a Pro subscription error (either by checking access or error message)
  //         const errorMessage =
  //           error instanceof Error ? error.message : String(error);
  //         if (!hasAIAccess || errorMessage.includes("Raycast Pro")) {
  //           setAiSearchFailed("pro-required");
  //         } else {
  //           setAiSearchFailed("failed");
  //         }

  //         // Show error toast
  //         showToast({
  //           style: Toast.Style.Failure,
  //           title: "AI search failed",
  //         });
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     } else {
  //       setFilteredSnippets(
  //         normalSearchSnippets(snippets, debouncedSearchText),
  //       );
  //       setAiSearchFailed(false);
  //     }
  //   }

  //   performAISearch();
  // }, [debouncedSearchText, useAISearch, snippets]);

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
      // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
      // searchBarAccessory={
      //   <List.Dropdown
      //     tooltip="Search Mode"
      //     value={useAISearch ? "ai" : "normal"}
      //     onChange={(value) => setUseAISearch(value === "ai")}
      //   >
      //     <List.Dropdown.Item
      //       title="Normal Search"
      //       value="normal"
      //       icon={Icon.MagnifyingGlass}
      //     />
      //     <List.Dropdown.Item
      //       title="AI Search (Semantic)"
      //       value="ai"
      //       icon={Icon.Stars}
      //     />
      //   </List.Dropdown>
      // }
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
      {/* COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED */}
      {/* {aiSearchFailed && displaySnippets.length === 0 && !isLoading && (
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
      )} */}
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
              {!!frontmostApp && (
                <Action.Paste
                  title={`Paste to ${frontmostApp}`}
                  content={snippet.content}
                  icon={appIcon}
                  shortcut={{ modifiers: ["cmd"], key: "enter" }}
                />
              )}
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
