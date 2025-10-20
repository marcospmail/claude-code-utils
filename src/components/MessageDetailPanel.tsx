import { List } from "@raycast/api";
import { ParsedMessage } from "../utils/claude-message";

interface MessageDetailPanelProps {
  message: ParsedMessage;
  messageType: "sent" | "received";
}

export function MessageDetailPanel({ message, messageType }: MessageDetailPanelProps) {
  const timeLabel = messageType === "sent" ? "Sent At" : "Received At";

  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          {message.fileName && (
            <>
              <List.Item.Detail.Metadata.Label title="Conversation File" text={message.fileName} />
              <List.Item.Detail.Metadata.Separator />
            </>
          )}
          {message.projectDir && (
            <>
              <List.Item.Detail.Metadata.Label title="Project Path" text={message.projectDir} />
              <List.Item.Detail.Metadata.Separator />
            </>
          )}
          <List.Item.Detail.Metadata.Label
            title={timeLabel}
            text={message.timestamp.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          />
        </List.Item.Detail.Metadata>
      }
    />
  );
}
