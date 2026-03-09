import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { SessionSearchResult } from "../../utils/session-search";

interface SessionDetailProps {
  session: SessionSearchResult;
}

type ContentItem = {
  type: string;
  text?: string;
};

type JSONLEntry = {
  message?: {
    role: "user" | "assistant";
    content: string | ContentItem[];
  };
};

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function sanitizeText(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += text[i] + text[i + 1];
        i++;
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      // drop lone low surrogate
    } else {
      result += text[i];
    }
  }
  return result;
}

function extractText(content: string | ContentItem[]): string {
  if (typeof content === "string") return sanitizeText(content);
  if (Array.isArray(content)) {
    return sanitizeText(
      content
        .filter((item) => item.type === "text")
        .map((item) => item.text || "")
        .join("\n"),
    );
  }
  return "";
}

export default function SessionDetail({ session }: SessionDetailProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const collected: MessageItem[] = [];
    let fileStream: ReturnType<typeof createReadStream> | null = null;
    let rl: ReturnType<typeof createInterface> | null = null;
    let index = 0;

    const cleanup = () => {
      try {
        if (rl) {
          rl.close();
          rl.removeAllListeners();
          rl = null;
        }
        if (fileStream) {
          fileStream.destroy();
          fileStream = null;
        }
      } catch {
        // Ignore cleanup errors
      }
    };

    fileStream = createReadStream(session.filePath);
    rl = createInterface({ input: fileStream, crlfDelay: Infinity, terminal: false });

    rl.on("line", (line: string) => {
      try {
        if (!line.trim()) return;
        const data: JSONLEntry = JSON.parse(line);
        if (data.message && (data.message.role === "user" || data.message.role === "assistant")) {
          const text = extractText(data.message.content);
          if (text.trim()) {
            collected.push({ id: `msg-${index++}`, role: data.message.role, text: text.trim() });
          }
        }
      } catch {
        // Skip invalid JSON
      }
    });

    rl.on("close", () => {
      cleanup();
      setMessages(collected);
      setIsLoading(false);
    });

    rl.on("error", () => {
      cleanup();
      setIsLoading(false);
    });

    return cleanup;
  }, [session.filePath]);

  return (
    <List isLoading={isLoading} isShowingDetail navigationTitle={session.firstMessage.slice(0, 60)}>
      {messages.map((msg) => (
        <List.Item
          key={msg.id}
          title={msg.text.length > 60 ? msg.text.slice(0, 60) + "..." : msg.text}
          icon={msg.role === "user" ? Icon.Person : Icon.Stars}
          accessories={[{ tag: { value: msg.role, color: msg.role === "user" ? Color.Blue : Color.Green } }]}
          detail={
            <List.Item.Detail
              markdown={msg.text}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Session ID" text={session.id} />
                  <List.Item.Detail.Metadata.Label title="Project" text={session.projectName} />
                  <List.Item.Detail.Metadata.Label title="Project Path" text={session.projectPath} />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label title="Turns" text={String(session.turnCount)} />
                  <List.Item.Detail.Metadata.Label title="Last Modified" text={session.lastModified.toLocaleString()} />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy Message" content={msg.text} />
              <Action.CopyToClipboard
                title="Copy Session ID"
                content={session.id}
                shortcut={{ modifiers: ["cmd"], key: "." }}
              />
              {session.projectPath.startsWith("/") && (
                <Action.ShowInFinder
                  path={session.projectPath}
                  title="Open Project in Finder"
                  icon={Icon.Folder}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
