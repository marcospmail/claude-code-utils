import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  getFrontmostApplication,
  Icon,
  List,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalSearch } from "../../utils/ai-search";
import { getSentMessages, ParsedMessage } from "../../utils/claude-messages";
import {
  formatSectionTitle,
  groupMessagesByDate,
} from "../../utils/date-grouping";
import CreateSnippet from "../create-snippet/list";
import MessageDetail from "./detail";

export default function SentMessages() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const loadingRef = useRef(false);
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

  const loadMessages = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const sentMessages = await getSentMessages();
      // Sort by timestamp (newest first)
      const sortedMessages = sentMessages.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
      setMessages(sortedMessages);
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

  // Filter messages with normal search
  const displayMessages = useMemo(() => {
    if (searchText.trim()) {
      return normalSearch(messages, searchText);
    }
    return messages;
  }, [messages, searchText]);

  // Group messages by date for section display
  const messageGroups = useMemo(() => {
    return groupMessagesByDate(displayMessages);
  }, [displayMessages]);

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
      searchBarPlaceholder="Browse sent messages..."
      onSearchTextChange={setSearchText}
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
          description="No sent messages found in your Claude history"
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
                  <Action.Paste
                    title={`Paste to ${frontmostApp}`}
                    content={message.content}
                    icon={appIcon}
                    shortcut={{ modifiers: ["cmd"], key: "enter" }}
                  />
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
