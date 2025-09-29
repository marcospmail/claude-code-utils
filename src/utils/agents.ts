import { homedir } from "os";
import { join } from "path";
import { readdir, readFile } from "fs/promises";

export interface Agent {
  id: string;
  name: string;
  content: string;
  filePath: string;
}

const AGENTS_DIR = join(homedir(), ".claude", "agents");

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

/**
 * Format agent filename to display name
 * e.g., "anthropic-docs-expert" -> "Anthropic Docs Expert"
 */
function formatAgentName(filename: string): string {
  return filename
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get a single agent by ID
 */
export async function getAgent(id: string): Promise<Agent | null> {
  try {
    const filePath = join(AGENTS_DIR, `${id}.md`);
    const content = await readFile(filePath, "utf-8");

    return {
      id,
      name: formatAgentName(id),
      content,
      filePath,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
