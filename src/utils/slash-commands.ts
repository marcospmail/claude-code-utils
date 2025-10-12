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
  const files = await readdir(COMMANDS_DIR);
  const commandFiles = files.filter((file) => file.endsWith(".md"));

  const commands = await Promise.all(
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

  return commands.sort((a, b) => a.name.localeCompare(b.name));
}
