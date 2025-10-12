import { CLAUDE_CODE_CHANGELOG_RAW_URL } from "./constants";
import { simulateNetworkDelay } from "./network-simulation";

export interface ChangelogVersion {
  version: string;
  changes: string[];
}

function parseChangelog(markdown: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = [];
  const lines = markdown.split("\n");

  let currentVersion: string | null = null;
  let currentChanges: string[] = [];

  for (const line of lines) {
    // Match version headers like "## [1.2.3]" or "## 1.2.3"
    const versionMatch = line.match(/^##\s+\[?([^\]]+)\]?/);

    if (versionMatch) {
      // Save previous version if exists
      if (currentVersion) {
        versions.push({
          version: currentVersion,
          changes: currentChanges,
        });
      }

      // Start new version
      currentVersion = versionMatch[1];
      currentChanges = [];
    } else if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
      const change = line.trim().substring(2).trim();
      if (change) {
        currentChanges.push(change);
      }
    }
  }

  // Add last version
  if (currentVersion) {
    versions.push({
      version: currentVersion,
      changes: currentChanges,
    });
  }

  return versions;
}

export async function fetchChangelog(): Promise<ChangelogVersion[]> {
  return simulateNetworkDelay(async () => {
    const response = await fetch(CLAUDE_CODE_CHANGELOG_RAW_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch changelog: ${response.status}`);
    }

    const data = await response.text();
    return parseChangelog(data);
  });
}
