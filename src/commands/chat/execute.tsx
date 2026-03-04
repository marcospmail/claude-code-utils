import { Action, ActionPanel, Clipboard, Detail, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { ClaudeResponse, executePrompt } from "../../utils/claude-cli";

interface ExecuteChatViewProps {
  message: string;
  model: string;
}

export default function ExecuteChatView({ message, model }: ExecuteChatViewProps) {
  const [response, setResponse] = useState<ClaudeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function runChat() {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await executePrompt(message, {
        model,
        systemPrompt: "You are a helpful assistant. Respond directly and concisely to the user's message.",
      });
      setResponse(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast({ style: Toast.Style.Failure, title: "Chat failed", message: msg });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    runChat();
  }, []);

  const markdown = isLoading ? "Thinking..." : error ? `## Error\n\n${error}` : (response?.result ?? "No output");

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={`Chat (${model})`}
      actions={
        <ActionPanel>
          {response?.result && (
            <>
              <Action.CopyToClipboard title="Copy Result" content={response.result} icon={Icon.Clipboard} />
              <Action
                title="Paste to Active App"
                icon={Icon.AppWindow}
                shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
                onAction={async () => {
                  await Clipboard.paste(response.result);
                }}
              />
            </>
          )}
          <Action
            title="Run Again"
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={runChat}
          />
        </ActionPanel>
      }
    />
  );
}
