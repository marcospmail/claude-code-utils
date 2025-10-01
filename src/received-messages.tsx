import {
  Action,
  ActionPanel,
  AI,
  Clipboard,
  closeMainWindow,
  Color,
  Detail,
  environment,
  getFrontmostApplication,
  Icon,
  List,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { getReceivedMessages, ParsedMessage } from "./utils/claudeMessages";
import { semanticSearch, normalSearch } from "./utils/aiSearch";
import CreateSnippet from "./create-snippet";

export default function ReceivedMessages() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ParsedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useAISearch, setUseAISearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [aiSearchFailed, setAiSearchFailed] = useState<
    false | true | "pro-required"
  >(false);
  const loadingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [frontmostApp, setFrontmostApp] = useState<string>("Active App");
  const [appIcon, setAppIcon] = useState<Icon>(Icon.Window);

  // Check if user has AI access
  const hasAIAccess = environment.canAccess(AI);

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

  // Filter messages immediately for normal search
  const displayMessages = useMemo(() => {
    if (!useAISearch && searchText.trim()) {
      return normalSearch(messages, searchText);
    }
    return filteredMessages;
  }, [messages, searchText, useAISearch, filteredMessages]);

  // Perform AI search only on debounced text
  useEffect(() => {
    async function performAISearch() {
      if (!debouncedSearchText.trim()) {
        setFilteredMessages(messages);
        return;
      }

      if (useAISearch) {
        setIsLoading(true);
        setAiSearchFailed(false);
        try {
          const results = await semanticSearch(messages, debouncedSearchText);
          setFilteredMessages(results);
          setAiSearchFailed(false);
        } catch (error) {
          // Clear results and show error state
          setFilteredMessages([]);

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
        setFilteredMessages(normalSearch(messages, debouncedSearchText));
        setAiSearchFailed(false);
      }
    }

    performAISearch();
  }, [debouncedSearchText, useAISearch, messages]);

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

  function MessageDetail({ message }: { message: ParsedMessage }) {
    const [frontmostApp, setFrontmostApp] = useState<string>("Active App");
    const [appIcon, setAppIcon] = useState<Icon>(Icon.Window);

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
        navigationTitle="Message Detail"
        metadata={
          <Detail.Metadata>
            <Detail.Metadata.Label
              title="Time"
              text={message.timestamp.toLocaleString()}
            />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label
              title="Session ID"
              text={message.sessionId}
            />
            <Detail.Metadata.Label
              title="Project"
              text={
                message.projectPath?.split("/").pop() ||
                message.projectPath ||
                "Unknown"
              }
            />
          </Detail.Metadata>
        }
        actions={
          <ActionPanel>
            <Action.Paste
              title={`Paste to ${frontmostApp}`}
              content={message.content}
              icon={appIcon}
            />
            <Action.CopyToClipboard
              title="Copy to Clipboard"
              content={message.content}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
            <Action.Push
              title="Create Snippet from Message"
              icon={Icon.Document}
              shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
              target={<CreateSnippet content={message.content} />}
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
        useAISearch
          ? "Search with AI (semantic)..."
          : "Search Claude's responses..."
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
      {aiSearchFailed && displayMessages.length === 0 && !isLoading && (
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
      {displayMessages.map((message) => (
        <List.Item
          key={message.id}
          title={message.preview}
          accessories={[
            {
              text: message.timestamp.toLocaleTimeString([], {
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
              <Action.Paste
                title={`Paste to ${frontmostApp}`}
                content={message.content}
                icon={appIcon}
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
              />
              <Action
                title="Copy Message"
                icon={Icon.Clipboard}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                onAction={() => copyContent(message, true)}
              />
              <Action.Push
                title="Create Snippet from Message"
                icon={Icon.Document}
                shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
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
    </List>
  );
}
