import {
  Action,
  ActionPanel,
  Application,
  Detail,
  getFrontmostApplication,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { CommandItem } from "../../constants/commands-data";
import {
  formatCodeBlock,
  formatContentMarkdown,
} from "../../utils/markdown-formatters";

interface CommandDetailProps {
  command: CommandItem;
}

export default function CommandDetail({ command }: CommandDetailProps) {
  const [frontmostApp, setFrontmostApp] = useState<Application>();

  // Build sections dynamically using push
  const sections: string[] = [];

  // Usage section (optional)
  if (command.usage) {
    sections.push("**Usage:**");
    sections.push(formatCodeBlock(command.usage));
    sections.push("&nbsp;"); // Non-breaking space for extra spacing
  }

  // Description section (required)
  sections.push(`**Description:**`);
  sections.push(command.description);
  sections.push("&nbsp;"); // Non-breaking space for extra spacing

  // Examples section (optional)
  if (command.examples && command.examples.length > 0) {
    sections.push("**Examples:**");
    command.examples.forEach((example) => {
      sections.push(formatCodeBlock(example));
    });
  }

  // Combine all sections
  const content = sections.join("\n\n");

  // Format with title using the utility function
  const markdown = formatContentMarkdown(command.name, content);

  useEffect(() => {
    getFrontmostApplication().then((app) => {
      setFrontmostApp(app);
    });
  }, []);

  return (
    <Detail
      markdown={markdown}
      navigationTitle={command.name}
      actions={
        <ActionPanel>
          {frontmostApp && (
            <Action.Paste
              title={`Paste to ${frontmostApp?.name}`}
              content={command.name}
              icon={frontmostApp?.path}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
