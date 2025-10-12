import {
  Action,
  ActionPanel,
  // AI,
  Clipboard,
  closeMainWindow,
  // Color,
  // environment,
  getFrontmostApplication,
  Icon,
  List,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  getReceivedMessages,
  ParsedMessage,
} from "../../utils/claude-messages";
// COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
// import { semanticSearch, normalSearch } from "../../utils/ai-search";
import { normalSearch } from "../../utils/ai-search";
import {
  groupMessagesByDate,
  formatSectionTitle,
} from "../../utils/date-grouping";
import CreateSnippet from "../create-snippet/list";
import MessageDetail from "./detail";

// Constants
// COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
// const AI_SEARCH_DEBOUNCE_MS = 500;

// Types
// COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
// type AISearchError = false | "failed" | "pro-required";

export default function ReceivedMessages() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ParsedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // const [useAISearch, setUseAISearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // const [debouncedSearchText, setDebouncedSearchText] = useState("");
  // const [aiSearchFailed, setAiSearchFailed] = useState<AISearchError>(false);
  const loadingRef = useRef(false);
  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
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

  const loadMessages = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const receivedMessages = await getReceivedMessages();
      // Sort by timestamp (newest first)
      const sortedMessages = receivedMessages.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
      setMessages(sortedMessages);
      setFilteredMessages(sortedMessages);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error loading messages",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, []);

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

  // Filter messages immediately for normal search
  const displayMessages = useMemo(() => {
    // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
    // if (!useAISearch && searchText.trim()) {
    if (searchText.trim()) {
      return normalSearch(messages, searchText);
    }
    return filteredMessages;
    // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
    // }, [messages, searchText, useAISearch, filteredMessages]);
  }, [messages, searchText, filteredMessages]);

  // Group messages by date for section display
  const messageGroups = useMemo(() => {
    return groupMessagesByDate(displayMessages);
  }, [displayMessages]);

  // COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED
  // Perform AI search only on debounced text
  // useEffect(() => {
  //   async function performAISearch() {
  //     if (!debouncedSearchText.trim()) {
  //       setFilteredMessages(messages);
  //       return;
  //     }

  //     if (useAISearch) {
  //       setIsLoading(true);
  //       setAiSearchFailed(false);
  //       try {
  //         const results = await semanticSearch(messages, debouncedSearchText);
  //         setFilteredMessages(results);
  //         setAiSearchFailed(false);
  //       } catch (error) {
  //         // Clear results and show error state
  //         setFilteredMessages([]);

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
  //       setFilteredMessages(normalSearch(messages, debouncedSearchText));
  //       setAiSearchFailed(false);
  //     }
  //   }

  //   performAISearch();
  // }, [debouncedSearchText, useAISearch, messages]);

  async function copyContent(message: ParsedMessage, closeWindow = false) {
    try {
      await Clipboard.copy(message.content);
      if (closeWindow) {
        await closeMainWindow();
        await showHUD("Copied to Clipboard");
      } else {
        await showToast({
          style: Toast.Style.Success,
          title: "Content copied",
          message: "Message content copied to clipboard",
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

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search received messages..."
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
          <Action
            title="Refresh Messages"
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={loadMessages}
          />
        </ActionPanel>
      }
    >
      {messages.length === 0 && !isLoading && (
        <List.EmptyView
          title="No messages found"
          description="No received messages found in your Claude history"
          actions={
            <ActionPanel>
              <Action
                title="Refresh Messages"
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={loadMessages}
              />
            </ActionPanel>
          }
        />
      )}
      {/* COMMENTED OUT - AI SEARCH FEATURE TEMPORARILY DISABLED */}
      {/* {aiSearchFailed && displayMessages.length === 0 && !isLoading && (
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
      {messageGroups.map((group) => (
        <List.Section
          key={group.category}
          title={formatSectionTitle(group.category, group.messages.length)}
        >
          {group.messages.map((message) => (
            <List.Item
              key={message.id}
              title={message.preview}
              accessories={[
                {
                  text: message.timestamp.toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="View Message"
                    icon={Icon.Eye}
                    target={<MessageDetail message={message} />}
                  />
                  {!!frontmostApp && (
                    <Action.Paste
                      title={`Paste to ${frontmostApp}`}
                      content={message.content}
                      icon={appIcon}
                      shortcut={{ modifiers: ["cmd"], key: "enter" }}
                    />
                  )}
                  <Action
                    title="Copy to Clipboard"
                    icon={Icon.Clipboard}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    onAction={() => copyContent(message, true)}
                  />
                  <Action.Push
                    title="Create Snippet from Message"
                    icon={Icon.Document}
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                    target={<CreateSnippet content={message.content} />}
                  />
                  <Action
                    title="Refresh Messages"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={loadMessages}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
