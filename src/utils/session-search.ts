import { createReadStream } from "fs";
import { readFile, readdir, stat } from "fs/promises";
import { homedir } from "os";
import { basename, join } from "path";
import { createInterface } from "readline";

const CLAUDE_DIR = join(homedir(), ".claude", "projects");
const CONCURRENCY_LIMIT = 10;
const HIGH_WATER_MARK = 16 * 1024;
const MIN_QUERY_LENGTH = 3;

type ContentItem = {
  type: string;
  text?: string;
};

type JSONLMessage = {
  role: "user" | "assistant" | "system";
  content: string | ContentItem[];
};

type JSONLEntry = {
  type?: string;
  summary?: string;
  message?: JSONLMessage;
  timestamp?: string | number;
};

export interface SessionSearchResult {
  id: string;
  filePath: string;
  projectPath: string;
  projectName: string;
  firstMessage: string;
  summary: string;
  lastModified: Date;
  turnCount: number;
}

interface SessionFileInfo {
  path: string;
  sessionId: string;
  projectPath: string;
  projectName: string;
  mtime: Date;
}

function sanitizeText(text: string): string {
  // Remove lone surrogates that cause JSON serialization failures in Raycast
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      // High surrogate — only keep if followed by a valid low surrogate
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += text[i] + text[i + 1];
        i++;
      }
      // else: lone high surrogate, drop it
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      // Lone low surrogate, drop it
    } else {
      result += text[i];
    }
  }
  return result;
}

function extractTextContent(content: string | ContentItem[]): string {
  if (typeof content === "string") return sanitizeText(content);
  if (Array.isArray(content)) {
    return sanitizeText(
      content
        .filter((item) => item.type === "text")
        .map((item) => item.text || "")
        .join("\n"),
    );
  }
  return "";
}

async function resolveProjectPath(projectDir: string, jsonlFiles: string[]): Promise<{ path: string; name: string }> {
  // 1. Try sessions-index.json (has originalPath at root level)
  const indexPath = join(CLAUDE_DIR, projectDir, "sessions-index.json");
  try {
    const content = await readFile(indexPath, "utf8");
    const index = JSON.parse(content);
    const realPath = index.originalPath || index.entries?.[0]?.projectPath;
    if (realPath) {
      const name = sanitizeText(basename(realPath));
      if (name) return { path: realPath, name };
    }
  } catch {
    // Try next source
  }

  // 2. Try cwd field from first JSONL file
  if (jsonlFiles.length > 0) {
    const cwd = await readCwdFromJsonl(join(CLAUDE_DIR, projectDir, jsonlFiles[0]));
    if (cwd) {
      const name = sanitizeText(basename(cwd));
      if (name) return { path: cwd, name };
    }
  }

  // 3. Fallback: use encoded directory name as-is
  return { path: projectDir, name: sanitizeText(projectDir) };
}

function readCwdFromJsonl(filePath: string): Promise<string | null> {
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
        if (data.cwd) {
          done(data.cwd);
        }
      } catch {
        // skip
      }
    });

    rl.on("close", () => done(null));
    rl.on("error", () => done(null));
    stream.on("error", () => done(null));
  });
}

async function collectSessionFiles(signal?: AbortSignal): Promise<SessionFileInfo[]> {
  const files: SessionFileInfo[] = [];

  let projects: string[];
  try {
    projects = await readdir(CLAUDE_DIR);
  } catch {
    return files;
  }

  for (const project of projects) {
    if (signal?.aborted) break;

    try {
      const dirPath = join(CLAUDE_DIR, project);
      const projectStat = await stat(dirPath);
      if (!projectStat.isDirectory()) continue;

      const entries = await readdir(dirPath);
      const jsonlFiles = entries.filter((f) => f.endsWith(".jsonl"));
      if (jsonlFiles.length === 0) continue;

      const resolved = await resolveProjectPath(project, jsonlFiles);
      if (!resolved.name || resolved.name === "-" || resolved.name.length <= 1) continue;

      for (const file of jsonlFiles) {
        const filePath = join(dirPath, file);
        const fileStat = await stat(filePath);
        files.push({
          path: filePath,
          sessionId: file.replace(".jsonl", ""),
          projectPath: resolved.path,
          projectName: resolved.name,
          mtime: fileStat.mtime,
        });
      }
    } catch {
      continue;
    }
  }

  files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return files;
}

function searchSessionFile(
  file: SessionFileInfo,
  queryLower: string,
  signal?: AbortSignal,
): Promise<SessionSearchResult | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    let firstMessage = "";
    let summary = "";
    let turnCount = 0;
    let matched = false;
    let fileStream: ReturnType<typeof createReadStream> | null = null;
    let rl: ReturnType<typeof createInterface> | null = null;

    const cleanup = () => {
      try {
        if (rl) {
          rl.close();
          rl.removeAllListeners();
          rl = null;
        }
        if (fileStream) {
          fileStream.destroy();
          fileStream = null;
        }
      } catch {
        // Ignore cleanup errors
      }
    };

    const onAbort = () => {
      cleanup();
      resolve(null);
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    try {
      fileStream = createReadStream(file.path, { highWaterMark: HIGH_WATER_MARK });
      rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
        terminal: false,
      });

      rl.on("line", (line: string) => {
        if (signal?.aborted) {
          cleanup();
          return;
        }

        try {
          if (!line.trim()) return;
          const data: JSONLEntry = JSON.parse(line);

          if (data.type === "summary" && data.summary) {
            summary = sanitizeText(data.summary);
            if (!matched && summary.toLowerCase().includes(queryLower)) {
              matched = true;
            }
          }

          if (data.message) {
            turnCount++;
            const text = extractTextContent(data.message.content);

            if (!firstMessage && data.message.role === "user" && text.trim()) {
              firstMessage = text.trim();
            }

            if (!matched && text.toLowerCase().includes(queryLower)) {
              matched = true;
            }
          }
        } catch {
          // Skip invalid JSON lines
        }
      });

      rl.on("close", () => {
        cleanup();
        if (signal) signal.removeEventListener("abort", onAbort);

        if (matched) {
          resolve({
            id: file.sessionId,
            filePath: file.path,
            projectPath: file.projectPath,
            projectName: file.projectName,
            firstMessage: firstMessage || "[No user message]",
            summary,
            lastModified: file.mtime,
            turnCount,
          });
        } else {
          resolve(null);
        }
      });

      rl.on("error", () => {
        cleanup();
        if (signal) signal.removeEventListener("abort", onAbort);
        resolve(null);
      });

      fileStream.on("error", () => {
        cleanup();
        if (signal) signal.removeEventListener("abort", onAbort);
        resolve(null);
      });
    } catch {
      cleanup();
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve(null);
    }
  });
}

async function runWithConcurrency<T>(
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

function getSessionMetadataFast(file: SessionFileInfo, signal?: AbortSignal): Promise<SessionSearchResult | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    let firstMessage = "";
    let summary = "";
    let turnCount = 0;
    let lineCount = 0;
    let fileStream: ReturnType<typeof createReadStream> | null = null;
    let rl: ReturnType<typeof createInterface> | null = null;
    let resolved = false;

    const safeResolve = (value: SessionSearchResult | null) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    const cleanup = () => {
      try {
        if (rl) {
          rl.close();
          rl.removeAllListeners();
          rl = null;
        }
        if (fileStream) {
          fileStream.destroy();
          fileStream = null;
        }
      } catch {
        // Ignore cleanup errors
      }
    };

    try {
      fileStream = createReadStream(file.path, { highWaterMark: HIGH_WATER_MARK });
      rl = createInterface({ input: fileStream, crlfDelay: Infinity, terminal: false });

      rl.on("line", (line: string) => {
        if (resolved) return;
        lineCount++;

        try {
          if (!line.trim()) return;
          const data: JSONLEntry = JSON.parse(line);

          if (data.type === "summary" && data.summary) {
            summary = sanitizeText(data.summary);
          }

          if (data.message) {
            turnCount++;
            if (!firstMessage && data.message.role === "user") {
              const text = extractTextContent(data.message.content);
              if (text.trim()) firstMessage = text.trim();
            }
          }
        } catch {
          // Skip invalid JSON
        }

        if (lineCount >= 50) {
          cleanup();
          safeResolve({
            id: file.sessionId,
            filePath: file.path,
            projectPath: file.projectPath,
            projectName: file.projectName,
            firstMessage: firstMessage || "[No user message]",
            summary,
            lastModified: file.mtime,
            turnCount,
          });
        }
      });

      rl.on("close", () => {
        cleanup();
        safeResolve({
          id: file.sessionId,
          filePath: file.path,
          projectPath: file.projectPath,
          projectName: file.projectName,
          firstMessage: firstMessage || "[No user message]",
          summary,
          lastModified: file.mtime,
          turnCount,
        });
      });

      rl.on("error", () => {
        cleanup();
        safeResolve(null);
      });
      fileStream.on("error", () => {
        cleanup();
        safeResolve(null);
      });
    } catch {
      cleanup();
      safeResolve(null);
    }
  });
}

function sanitizeResult(result: SessionSearchResult): SessionSearchResult {
  return {
    ...result,
    projectName: sanitizeText(result.projectName),
    projectPath: sanitizeText(result.projectPath),
    firstMessage: sanitizeText(result.firstMessage),
    summary: sanitizeText(result.summary),
  };
}

export async function listAllSessions(signal?: AbortSignal): Promise<SessionSearchResult[]> {
  const files = await collectSessionFiles(signal);
  if (signal?.aborted) return [];

  const results: SessionSearchResult[] = [];
  const seenIds = new Set<string>();

  await runWithConcurrency(
    files,
    async (file) => {
      if (signal?.aborted) return;
      if (seenIds.has(file.sessionId)) return;

      const result = await getSessionMetadataFast(file, signal);
      if (result && !seenIds.has(result.id)) {
        seenIds.add(result.id);
        results.push(sanitizeResult(result));
      }
    },
    CONCURRENCY_LIMIT,
    signal,
  );

  return results.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function searchSessions(
  query: string,
  onMatch: (result: SessionSearchResult) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (query.length < MIN_QUERY_LENGTH) return;
  if (signal?.aborted) return;

  const queryLower = query.toLowerCase();
  const seenIds = new Set<string>();

  const files = await collectSessionFiles(signal);
  if (signal?.aborted) return;

  await runWithConcurrency(
    files,
    async (file) => {
      if (signal?.aborted) return;
      if (seenIds.has(file.sessionId)) return;

      const result = await searchSessionFile(file, queryLower, signal);
      if (result && !seenIds.has(result.id)) {
        seenIds.add(result.id);
        onMatch(sanitizeResult(result));
      }
    },
    CONCURRENCY_LIMIT,
    signal,
  );
}
