import { Action, ActionPanel, Clipboard, Detail, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { ClaudeResponse, executePrompt } from "../../utils/claude-cli";

interface TransformExecuteProps {
  transformName: string;
  prompt: string;
}

export default function TransformExecute({ transformName, prompt }: TransformExecuteProps) {
  const [response, setResponse] = useState<ClaudeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function runTransform() {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await executePrompt(prompt, { model: "haiku" });
      setResponse(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast({ style: Toast.Style.Failure, title: "Transform failed", message: msg });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    runTransform();
  }, []);

  const markdown = isLoading ? "Transforming..." : error ? `## Error\n\n${error}` : response?.result || "No output";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={transformName}
      metadata={
        response && !isLoading ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Transform" text={transformName} />
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
            onAction={runTransform}
          />
        </ActionPanel>
      }
    />
  );
}
