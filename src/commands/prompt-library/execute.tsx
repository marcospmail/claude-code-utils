import { Action, ActionPanel, Clipboard, Detail, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { ClaudeResponse, executePrompt } from "../../utils/claude-cli";
import { incrementUsageCount } from "../../utils/prompts";

interface ExecutePromptViewProps {
  promptId: string;
  promptName: string;
  fullPrompt: string;
  model?: string;
}

export default function ExecutePromptView({ promptId, promptName, fullPrompt, model }: ExecutePromptViewProps) {
  const [response, setResponse] = useState<ClaudeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function runPrompt() {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await executePrompt(fullPrompt, { model });
      setResponse(result);
      await incrementUsageCount(promptId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast({ style: Toast.Style.Failure, title: "Prompt failed", message: msg });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    runPrompt();
  }, []);

  const markdown = isLoading ? "Running prompt..." : error ? `## Error\n\n${error}` : response?.result || "No output";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={promptName}
      metadata={
        response && !isLoading ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Prompt" text={promptName} />
          </Detail.Metadata>
        ) : undefined
      }
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
            onAction={runPrompt}
          />
        </ActionPanel>
      }
    />
  );
}
