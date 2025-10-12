import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface Agent {
  id: string;
  name: string;
  content: string;
  filePath: string;
}

const AGENTS_DIR = join(homedir(), ".claude", "agents");

/**
 * Convert kebab-case string to Title Case
 * Examples: "test-agent" → "Test Agent", "multi-word-name" → "Multi Word Name"
 */
function formatAgentName(kebabCase: string): string {
  return kebabCase
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get all agent files from ~/.claude/agents
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const files = await readdir(AGENTS_DIR);
    const agentFiles = files.filter((file) => file.endsWith(".md"));

    const agents = await Promise.all(
      agentFiles.map(async (file) => {
        const filePath = join(AGENTS_DIR, file);
        const content = await readFile(filePath, "utf-8");
        const name = file.replace(".md", "");

        return {
          id: name,
          name: formatAgentName(name),
          content,
          filePath,
        };
      }),
    );

    return agents.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
