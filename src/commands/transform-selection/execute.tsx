import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  Detail,
  Icon,
  PopToRootType,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { ClaudeResponse, executePrompt } from "../../utils/claude-cli";
import { DEFAULT_MODEL, DEFAULT_OUTPUT, TransformOutput } from "../../utils/transform";

interface TransformExecuteProps {
  transformName: string;
  prompt: string;
  model?: string;
  effort?: string;
  output?: TransformOutput;
  copyToClipboard?: boolean;
}

export default function TransformExecute({
  transformName,
  prompt,
  model,
  effort,
  output = DEFAULT_OUTPUT,
  copyToClipboard = false,
}: TransformExecuteProps) {
  const [response, setResponse] = useState<ClaudeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Guard against React StrictMode double-invoking the mount effect in development.
  const didRun = useRef(false);

  // Auto-apply the result. copyToClipboard is independent and combines with either mode.
  // "replace": refocus the previous app FIRST (closeMainWindow), THEN paste so it lands in
  // the editor over the selection — not into Raycast. On failure the Detail stays open with
  // the manual "Replace Selection" action as a fallback.
  // Copy runs BEFORE closeMainWindow so it completes before the component unmounts.
  async function applyOutput(result: string) {
    if (copyToClipboard) {
      await Clipboard.copy(result);
    }
    if (output === "replace") {
      try {
        await closeMainWindow({ popToRootType: PopToRootType.Immediate });
        await Clipboard.paste(result);
      } catch {
        // Fall back to the manual action in the Detail.
      }
    } else if (copyToClipboard) {
      // "show" mode keeps the Detail open, so surface a toast confirming the copy.
      await showToast({ style: Toast.Style.Success, title: "Copied to clipboard" });
    }
  }

  async function runTransform() {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await executePrompt(prompt, { model: model ?? DEFAULT_MODEL, effort });
      setResponse(result);
      await applyOutput(result.result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast({ style: Toast.Style.Failure, title: "Transform failed", message: msg });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
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
          {response?.result &&
            (output === "replace" ? (
              <>
                <Action.Paste title="Replace Selection" content={response.result} icon={Icon.Wand} />
                <Action.CopyToClipboard title="Copy Result" content={response.result} icon={Icon.Clipboard} />
              </>
            ) : (
              <>
                <Action.CopyToClipboard title="Copy Result" content={response.result} icon={Icon.Clipboard} />
                <Action.Paste title="Replace Selection" content={response.result} icon={Icon.Wand} />
              </>
            ))}
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
