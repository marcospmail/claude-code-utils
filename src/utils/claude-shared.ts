import { createReadStream } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createInterface } from "readline";

export const CLAUDE_DIR = join(homedir(), ".claude", "projects");
export const CONCURRENCY_LIMIT = 10;
export const MESSAGE_CONCURRENCY = 3;
export const MESSAGE_FILE_LIMIT = 50;
export const MAX_LINE_LENGTH = 200 * 1024;
export const HIGH_WATER_MARK = 16 * 1024;

export type ContentItem = {
  type: string;
  text?: string;
};

export type JSONLMessage = {
  role: "user" | "assistant" | "system";
  content: string | ContentItem[] | null;
};

export type JSONLEntry = {
  type?: string;
  summary?: string;
  message?: JSONLMessage;
  timestamp?: string | number;
  cwd?: string;
};

export function readCwdFromJsonl(filePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    const stream = createReadStream(filePath, { highWaterMark: HIGH_WATER_MARK });
    const rl = createInterface({ input: stream, crlfDelay: Infinity, terminal: false });
    let resolved = false;

    const done = (value: string | null) => {
      if (resolved) return;
      resolved = true;
      rl.close();
      rl.removeAllListeners();
      stream.destroy();
      resolve(value);
    };

    rl.on("line", (line: string) => {
      if (resolved) return;
      try {
        if (!line.trim()) return;
        const data = JSON.parse(line);
        if (data.cwd) done(data.cwd);
      } catch {
        // skip
      }
    });

    rl.on("close", () => done(null));
    rl.on("error", () => done(null));
    stream.on("error", () => done(null));
  });
}

export async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<unknown>,
  limit: number,
  signal?: AbortSignal,
): Promise<void> {
  let index = 0;

  async function next(): Promise<void> {
    while (index < items.length) {
      if (signal?.aborted) return;
      const currentIndex = index++;
      await fn(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(workers);
}
