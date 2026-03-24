import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  Color,
  Icon,
  List,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalSearch } from "../utils/ai-search";
import { loadMessageContent, ParsedMessage } from "../utils/claude-message";
import { formatSectionTitle, groupMessagesByDate } from "../utils/date-grouping";
import CreateSnippet from "../commands/create-snippet/list";
import MessageDetail from "./message-detail";

interface MessageListProps {
  role: "user" | "assistant";
  fetchMessages: () => Promise<ParsedMessage[]>;
  searchPlaceholder: string;
  emptyLabel: string;
}

export default function MessageList({ role, fetchMessages, searchPlaceholder, emptyLabel }: MessageListProps) {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [fullContentMap, setFullContentMap] = useState<Record<string, string>>({});
  const loadingRef = useRef(false);
  const loadedIdsRef = useRef(new Set<string>());

  const loadMessages = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setFullContentMap({});
    loadedIdsRef.current.clear();
    try {
      const fetched = await fetchMessages();
      const sortedMessages = fetched.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

  const loadContent = useCallback(async (message: ParsedMessage) => {
    if (loadedIdsRef.current.has(message.id)) return;
    loadedIdsRef.current.add(message.id);
    const content = await loadMessageContent(message.fullPath, message.timestamp, role, message.content);
    if (content) {
      setFullContentMap((prev) => ({ ...prev, [message.id]: content }));
    }
  }, []);

  const displayMessages = useMemo(() => {
    if (searchText.trim()) {
      return normalSearch(messages, searchText);
    }
    return messages;
  }, [messages, searchText]);

  const messageGroups = useMemo(() => {
    return groupMessagesByDate(displayMessages);
  }, [displayMessages]);

  const messageMap = useMemo(() => {
    const map: Record<string, ParsedMessage> = {};
    for (const msg of displayMessages) {
      map[msg.id] = msg;
    }
    return map;
  }, [displayMessages]);

  async function copyContent(message: ParsedMessage, closeWindow: boolean) {
    try {
      let content: string | undefined = fullContentMap[message.id];
      if (content === undefined) {
        const loaded = await loadMessageContent(message.fullPath, message.timestamp, role, message.content);
        content = loaded ?? message.content;
      }
      await Clipboard.copy(content);
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
      isShowingDetail
      isLoading={isLoading}
      searchBarPlaceholder={searchPlaceholder}
      onSearchTextChange={setSearchText}
      onSelectionChange={(id) => {
        if (id && messageMap[id] && !fullContentMap[id]) {
          loadContent(messageMap[id]);
        }
      }}
      actions={
        <ActionPanel>
          <Action title="Refresh Messages" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={loadMessages} />
        </ActionPanel>
      }
    >
      {displayMessages.length === 0 && !isLoading && (
        <List.EmptyView
          title={searchText.trim() ? "No matching messages" : "No messages found"}
          description={
            searchText.trim()
              ? `No ${emptyLabel} matching "${searchText}"`
              : `No ${emptyLabel} found in your Claude history`
          }
          actions={
            <ActionPanel>
              <Action title="Refresh Messages" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={loadMessages} />
            </ActionPanel>
          }
        />
      )}
      {messageGroups.map((group) => (
        <List.Section key={group.category} title={formatSectionTitle(group.category, group.messages.length)}>
          {group.messages.map((message) => (
            <List.Item
              key={message.id}
              id={message.id}
              title={message.preview}
              accessories={[{ tag: { value: message.projectName, color: Color.Blue } }, { date: message.timestamp }]}
              detail={
                <List.Item.Detail
                  markdown={fullContentMap[message.id] ?? message.content}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="Project" text={message.projectName} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="Session ID" text={message.sessionId} />
                      <List.Item.Detail.Metadata.Label title="Date" text={message.timestamp.toLocaleString()} />
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action.Push
                    title="View Message"
                    icon={Icon.Eye}
                    target={<MessageDetail message={message} fullContent={fullContentMap[message.id]} role={role} />}
                  />
                  <Action
                    title="Copy to Clipboard"
                    icon={Icon.Clipboard}
                    shortcut={{ modifiers: ["cmd"], key: "enter" }}
                    onAction={() => copyContent(message, true)}
                  />
                  <Action.Push
                    title="Create Snippet from Message"
                    icon={Icon.Document}
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                    target={<CreateSnippet content={fullContentMap[message.id] ?? message.content} />}
                  />
                  <Action.CopyToClipboard
                    title="Copy Session ID"
                    content={message.sessionId}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
                  />
                  <Action
                    title="Copy Conversation File Path"
                    icon={Icon.CopyClipboard}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    onAction={async () => {
                      await Clipboard.copy(message.fullPath);
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Copied",
                        message: "File path copied to clipboard",
                      });
                    }}
                  />
                  <Action
                    title="Copy Project Path"
                    icon={Icon.Folder}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                    onAction={async () => {
                      await Clipboard.copy(message.projectDir);
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Copied",
                        message: "Project path copied to clipboard",
                      });
                    }}
                  />
                  <Action.OpenWith path={message.fullPath} shortcut={{ modifiers: ["cmd"], key: "o" }} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
