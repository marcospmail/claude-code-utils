import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  Detail,
  Icon,
  List,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSentMessages, ParsedMessage } from "./utils/claudeMessages";
import CreateSnippet from "./create-snippet";

export default function SentMessages() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);

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
      console.error({ error });

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
      console.error({ error });

      showToast({
        style: Toast.Style.Failure,
        title: "Copy failed",
        message: String(error),
      });
    }
  }

  function MessageDetail({ message }: { message: ParsedMessage }) {
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
            <Action
              title="Copy Message"
              icon={Icon.Clipboard}
              onAction={() => copyContent(message, true)}
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
      searchBarPlaceholder="Search your messages to Claude..."
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
      {messages.map((message) => (
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
              <Action
                title="Copy Message"
                icon={Icon.Clipboard}
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
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
