import { homedir } from "os";
import { join } from "path";
import { readdir, readFile } from "fs/promises";

export interface SlashCommand {
  id: string;
  name: string;
  content: string;
  filePath: string;
}

const COMMANDS_DIR = join(homedir(), ".claude", "commands");

/**
 * Get all command files from ~/.claude/commands
 */
export async function getSlashCommands(): Promise<SlashCommand[]> {
  try {
    const files = await readdir(COMMANDS_DIR);
    const commandFiles = files.filter((file) => file.endsWith(".md"));

    const commands = await Promise.all(
      commandFiles.map(async (file) => {
        const filePath = join(COMMANDS_DIR, file);
        const content = await readFile(filePath, "utf-8");
        const name = file.replace(".md", "");

        return {
          id: name,
          name: formatCommandName(name),
          content,
          filePath,
        };
      }),
    );

    return commands.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Format command filename to display name
 * e.g., "generate-commit-message" -> "Generate Commit Message"
 */
function formatCommandName(filename: string): string {
  return filename
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get a single command by ID
 */
export async function getSlashCommand(
  id: string,
): Promise<SlashCommand | null> {
  try {
    const filePath = join(COMMANDS_DIR, `${id}.md`);
    const content = await readFile(filePath, "utf-8");

    return {
      id,
      name: formatCommandName(id),
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
