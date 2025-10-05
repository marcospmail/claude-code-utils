import { ActionPanel, Action, Detail, Icon } from "@raycast/api";
import { CommandItem } from "../../constants/commands-data";

interface CommandDetailProps {
  command: CommandItem;
}

export default function CommandDetail({ command }: CommandDetailProps) {
  const markdown = `
# ${command.name}

${
  command.usage
    ? `**Usage:**
\`\`\`bash
${command.usage}
\`\`\`

---

`
    : ""
}**Description:** ${command.description}

${
  command.examples && command.examples.length > 0
    ? `**Examples:**
${command.examples
  .map(
    (example) => `\`\`\`bash
${example}
\`\`\``,
  )
  .join("\n\n")}
`
    : ""
}

  `;

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
