import { Dirent } from "fs";
import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
  filePath: string;
  model?: string;
  context?: string;
  allowedTools?: string;
}

const SKILLS_DIR = join(homedir(), ".claude", "skills");

function parseFrontmatter(content: string): { metadata: Record<string, string | undefined>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };

  const metadata: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      metadata[key] = value;
    }
  }
  return { metadata, body: match[2] };
}

export async function getSkills(): Promise<Skill[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const skillDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const results = await Promise.allSettled(
    skillDirs.map(async (dir) => {
      const filePath = join(SKILLS_DIR, dir, "SKILL.md");
      const content = await readFile(filePath, "utf-8");
      const { metadata } = parseFrontmatter(content);

      const name = metadata.name;
      const description = metadata.description;
      const skill: Skill = {
        id: dir,
        name: name ? name : dir,
        description: description ? description : "",
        content,
        filePath,
        model: metadata.model,
        context: metadata.context,
        allowedTools: metadata["allowed-tools"],
      };
      return skill;
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Skill> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => a.name.localeCompare(b.name));
}
