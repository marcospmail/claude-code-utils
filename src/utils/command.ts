import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface SlashCommand {
  id: string;
  name: string;
  content: string;
  filePath: string;
}

// TEMPORARY: Using mock commands-raycast folder for screenshots
const COMMANDS_DIR = join(homedir(), ".claude", "commands");

/**
 * Get all command files from ~/.claude/commands
 */
export async function getSlashCommands(): Promise<SlashCommand[]> {
  let files: string[];
  try {
    files = await readdir(COMMANDS_DIR);
  } catch {
    return [];
  }
  const commandFiles = files.filter((file) => file.endsWith(".md"));

  const results = await Promise.allSettled(
    commandFiles.map(async (file) => {
      const filePath = join(COMMANDS_DIR, file);
      const content = await readFile(filePath, "utf-8");
      const id = file.replace(".md", "");

      return {
        id,
        name: id,
        content,
        filePath,
      };
    }),
  );

  const commands = results
    .filter((r): r is PromiseFulfilledResult<SlashCommand> => r.status === "fulfilled")
    .map((r) => r.value);

  return commands.sort((a, b) => a.name.localeCompare(b.name));
}
