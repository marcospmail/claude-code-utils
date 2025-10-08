import { ActionPanel, Action, Detail, Icon } from "@raycast/api";
import { ChangelogVersion } from "../../utils/changelog";

interface ChangelogDetailProps {
  version: ChangelogVersion;
}

export default function ChangelogDetail({ version }: ChangelogDetailProps) {
  const markdown = `
# Version ${version.version}

## Changes

${version.changes.map((change) => `- ${change}`).join("\n")}
  `;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={`Version ${version.version}`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Version Number"
            content={version.version}
            icon={Icon.Clipboard}
          />
          <Action.CopyToClipboard
            title="Copy All Changes"
            content={version.changes.join("\n")}
            icon={Icon.Document}
          />
          <Action.OpenInBrowser
            title="View on GitHub"
            url="https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md"
            icon={Icon.Globe}
          />
        </ActionPanel>
      }
    />
  );
}
