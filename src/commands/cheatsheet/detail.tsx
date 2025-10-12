import { ActionPanel, Action, Detail, Icon } from "@raycast/api";
import { CommandItem } from "../../constants/commands-data";

interface CommandMarkdownOptions {
  name: string;
  description: string;
  usage?: string;
  examples?: string[];
}

/**
 * Generates formatted markdown for command detail pages
 */
function generateCommandMarkdown(options: CommandMarkdownOptions): string {
  const { name, description, usage, examples } = options;

  const sections: string[] = [];

  // Title
  sections.push(`# ${name}`);
  sections.push("");

  // Usage section (if provided)
  if (usage) {
    sections.push("**Usage:**");
    sections.push("```bash");
    sections.push(usage);
    sections.push("```");
    sections.push("");
    sections.push("---");
    sections.push("");
  }

  // Description
  sections.push(`**Description:** ${description}`);
  sections.push("");

  // Examples section (if provided)
  if (examples && examples.length > 0) {
    sections.push("**Examples:**");
    examples.forEach((example) => {
      sections.push("```bash");
      sections.push(example);
      sections.push("```");
      sections.push("");
    });
  }

  return sections.join("\n");
}

interface CommandDetailProps {
  command: CommandItem;
}

export default function CommandDetail({ command }: CommandDetailProps) {
  const markdown = generateCommandMarkdown({
    name: command.name,
    description: command.description,
    usage: command.usage,
    examples: command.examples,
  });

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Command"
            content={command.name}
            icon={Icon.Clipboard}
          />
          {command.usage && (
            <Action.CopyToClipboard
              title="Copy Usage"
              content={command.usage}
              icon={Icon.Code}
            />
          )}
          {command.examples && command.examples.length > 0 && (
            <Action.CopyToClipboard
              title="Copy First Example"
              content={command.examples[0]}
              icon={Icon.Document}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
