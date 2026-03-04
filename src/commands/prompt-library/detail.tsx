import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { PromptTemplate } from "../../utils/prompts";

interface PromptDetailProps {
  prompt: PromptTemplate;
}

export default function PromptDetail({ prompt }: PromptDetailProps) {
  const markdown = `# ${prompt.name}\n\n${prompt.description}\n\n## Template\n\n\`\`\`\n${prompt.prompt}\n\`\`\``;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={prompt.name}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Category" text={prompt.category} />
          <Detail.Metadata.Label title="Usage Count" text={String(prompt.usageCount)} />
          {prompt.model && <Detail.Metadata.Label title="Model" text={prompt.model} />}
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Variables" text={String(prompt.variables.length)} />
          {prompt.variables.map((v) => (
            <Detail.Metadata.Label key={v.name} title={`  {{${v.name}}}`} text={v.description} />
          ))}
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Type" text={prompt.isBuiltIn ? "Built-in" : "Custom"} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Prompt Template" content={prompt.prompt} icon={Icon.Clipboard} />
        </ActionPanel>
      }
    />
  );
}
