import { Action, ActionPanel, Clipboard, Detail, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { PasteAction } from "./paste-action";
import { loadMessageContent, ParsedMessage } from "../utils/claude-message";
import CreateSnippet from "../commands/create-snippet/list";

interface MessageDetailProps {
  message: ParsedMessage;
  fullContent?: string;
  role: "user" | "assistant";
}

export default function MessageDetail({ message, fullContent: initialFullContent, role }: MessageDetailProps) {
  const title = message.preview;
  const [fullContent, setFullContent] = useState(initialFullContent);
  const [isLoading, setIsLoading] = useState(!initialFullContent);

  useEffect(() => {
    if (initialFullContent) return;
    loadMessageContent(message.fullPath, message.timestamp, role, message.content).then((content) => {
      if (content) {
        setFullContent(content);
      }
      setIsLoading(false);
    });
  }, []);

  const displayContent = fullContent ?? message.content;

  return (
    <Detail
      isLoading={isLoading}
      markdown={displayContent}
      navigationTitle={title}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Project" text={message.projectName} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Session ID" text={message.sessionId} />
          <Detail.Metadata.Label title="Date" text={message.timestamp.toLocaleString()} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <PasteAction content={displayContent} />
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={displayContent}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
          />
          <Action.Push
            title="Create Snippet"
            icon={Icon.Document}
            target={<CreateSnippet content={displayContent} />}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
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
  );
}
