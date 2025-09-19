import { createReadStream } from "fs";
import { readdir, stat } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { createInterface } from "readline";

// Type definitions for JSONL file content
interface ContentItem {
  type: string;
  text?: string;
}

interface JSONLMessage {
  role: "user" | "assistant" | "system";
  content: string | ContentItem[];
}

interface JSONLData {
  message?: JSONLMessage;
  timestamp?: string | number;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  sessionId: string;
  projectPath?: string;
}

export interface ParsedMessage extends Message {
  id: string;
  preview: string;
  isPinned?: boolean;
}

export interface PinnedMessage {
  id: string;
  content: string;
  timestamp: string;
  role: "user" | "assistant";
  sessionId: string;
  projectPath?: string;
  pinnedAt: string;
}

const CLAUDE_DIR = join(homedir(), ".claude", "projects");

/**
 * Memory-efficient streaming parser for user messages only
 * Reads JSONL files line-by-line instead of loading entire file into memory
 * This prevents out-of-memory crashes with large conversation files
 */
async function parseUserMessagesOnlyStreaming(
  filePath: string,
  sessionId: string,
  projectPath: string,
): Promise<Message[]> {
  return new Promise((resolve) => {
    const userMessages: Message[] = []; // Collect user messages as we find them
    let fileStream: ReturnType<typeof createReadStream> | null = null; // File stream handle
    let rl: ReturnType<typeof createInterface> | null = null; // Readline interface handle

    // Clean up resources to prevent memory leaks
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
      } catch (error) {
        console.error({ error });
        // Ignore cleanup errors - we're already handling an error condition
      }
    };

    try {
      // Create a file stream that reads the file in chunks (not all at once)
      fileStream = createReadStream(filePath);

      // Create readline interface to process file line by line
      rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity, // Handle different line endings properly
        terminal: false, // We're reading a file, not interactive terminal
      });

      // Process each line of the JSONL file
      rl.on("line", (line: string) => {
        try {
          // Skip empty lines
          if (!line.trim()) return;

          // Each line in JSONL file is a separate JSON object
          const data: JSONLData = JSON.parse(line);

          // We only want user messages (messages sent TO Claude), not assistant responses
          if (data.message && data.message.role === "user") {
            let content = "";

            // Extract text content from the message
            if (data.message.content) {
              if (typeof data.message.content === "string") {
                // Simple string content
                content = data.message.content;
              } else if (Array.isArray(data.message.content)) {
                // Complex content with multiple parts (text, images, etc.)
                // We only want the text parts
                content = data.message.content
                  .filter((item: ContentItem) => item.type === "text") // Only text content
                  .map((item: ContentItem) => item.text || "")
                  .join("\n");
              }
            }

            // Filter out system/command messages and interrupted requests
            // We only want real user messages that were successfully sent
            if (
              content &&
              content.trim() &&
              !content.includes("<command-message>") && // System command messages
              !content.includes("<command-name>") && // System command names
              !content.includes("[Request interrupted")
            ) {
              // Interrupted/cancelled messages

              // Convert Unix timestamp (seconds) to JavaScript timestamp (milliseconds)
              const timestamp = data.timestamp
                ? typeof data.timestamp === "number" &&
                  data.timestamp < 10000000000
                  ? new Date(data.timestamp * 1000)
                  : new Date(data.timestamp)
                : new Date();

              userMessages.push({
                role: "user",
                content,
                timestamp,
                sessionId, // Which conversation session this belongs to
                projectPath, // Which project/folder this conversation was in
              });
            }
          }
        } catch (error) {
          console.error({ error });
          // Skip lines that aren't valid JSON - don't crash on malformed data
        }
      });

      rl.on("close", () => {
        cleanup();
        // Sort by timestamp and take only the most recent messages
        const recentMessages = userMessages
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
        resolve(recentMessages);
      });

      rl.on("error", (error: Error) => {
        console.error({ error });
        cleanup();
        resolve([]); // Return empty array instead of rejecting
      });

      fileStream.on("error", (error: Error) => {
        console.error({ error });
        cleanup();
        resolve([]);
      });
    } catch (error) {
      console.error({ error });

      cleanup();
      resolve([]);
    }
  });
}

async function parseAssistantMessagesOnlyStreaming(
  filePath: string,
  sessionId: string,
  projectPath: string,
): Promise<Message[]> {
  return new Promise((resolve) => {
    const assistantMessages: Message[] = [];
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
      } catch (error) {
        console.error({ error });
        // Ignore cleanup errors
      }
    };

    try {
      fileStream = createReadStream(filePath);
      rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
        terminal: false,
      });

      rl.on("line", (line: string) => {
        try {
          if (!line.trim()) return;

          const data: JSONLData = JSON.parse(line);

          // Only process assistant messages to save memory
          if (data.message && data.message.role === "assistant") {
            let content = "";

            if (data.message.content) {
              if (typeof data.message.content === "string") {
                content = data.message.content;
              } else if (Array.isArray(data.message.content)) {
                // Extract only text content, not thinking
                content = data.message.content
                  .filter((item: ContentItem) => item.type === "text")
                  .map((item: ContentItem) => item.text || "")
                  .join("\n");
              }
            }

            if (content && content.trim()) {
              // Convert Unix timestamp (seconds) to JavaScript timestamp (milliseconds)
              const timestamp = data.timestamp
                ? typeof data.timestamp === "number" &&
                  data.timestamp < 10000000000
                  ? new Date(data.timestamp * 1000)
                  : new Date(data.timestamp)
                : new Date();

              assistantMessages.push({
                role: "assistant",
                content,
                timestamp,
                sessionId,
                projectPath,
              });
            }
          }
        } catch (error) {
          console.error({ error });
          // Skip invalid JSON lines
        }
      });

      rl.on("close", () => {
        cleanup();
        // Sort by timestamp (newest first) and limit to prevent memory issues
        const recentMessages = assistantMessages
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
        resolve(recentMessages);
      });

      rl.on("error", (error: Error) => {
        console.error({ error });
        cleanup();
        resolve([]); // Return empty array instead of rejecting
      });

      fileStream.on("error", (error: Error) => {
        console.error({ error });
        cleanup();
        resolve([]);
      });
    } catch (error) {
      console.error({ error });
      cleanup();
      resolve([]);
    }
  });
}

export async function getAllClaudeMessages(): Promise<Message[]> {
  try {
    const MAX_PROJECTS_TO_SCAN = 5; // Limit how many projects we scan
    const MAX_FILES_PER_PROJECT = 5; // Limit files per project

    // Get projects and sort by modification time (most recent first)
    const projects = await readdir(CLAUDE_DIR);
    const projectsWithStats = [];

    for (const project of projects) {
      try {
        const projectPath = join(CLAUDE_DIR, project);
        const projectStat = await stat(projectPath);
        if (projectStat.isDirectory()) {
          projectsWithStats.push({
            name: project,
            path: projectPath,
            mtime: projectStat.mtime,
          });
        }
      } catch (error) {
        console.error({ error });
        continue;
      }
    }

    // Sort by most recent first
    const sortedProjects = projectsWithStats
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, MAX_PROJECTS_TO_SCAN);

    const allMessages: Message[] = [];

    // Process projects sequentially
    for (const project of sortedProjects) {
      try {
        const files = await readdir(project.path);
        const jsonlFiles = files.filter((file) => file.endsWith(".jsonl"));

        // Get stats for ALL jsonl files to sort properly
        const filesWithStats = [];
        for (const file of jsonlFiles) {
          try {
            const filePath = join(project.path, file);
            const fileStat = await stat(filePath);
            filesWithStats.push({
              name: file,
              path: filePath,
              mtime: fileStat.mtime,
            });
          } catch (error) {
            console.error({ error });
            continue;
          }
        }

        // Sort by modification time and take only the most recent files
        const sortedFiles = filesWithStats
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
          .slice(0, MAX_FILES_PER_PROJECT);

        // Process files sequentially using streaming
        for (const file of sortedFiles) {
          try {
            const sessionId = file.name.replace(".jsonl", "");

            // Use streaming parser for memory efficiency
            const messages = await parseAssistantMessagesOnlyStreaming(
              file.path,
              sessionId,
              project.path,
            );
            allMessages.push(...messages);
          } catch (error) {
            console.error({ error });
            continue;
          }
        }

        // Don't break early - scan all 5 projects
      } catch (error) {
        console.error({ error });
        continue;
      }
    }

    // Sort by timestamp (newest first) and take only assistant messages
    const assistantMessages = allMessages
      .filter((msg) => msg.role === "assistant")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return assistantMessages;
  } catch (error) {
    console.error({ error });
    return [];
  }
}

/**
 * Gets the most recent user messages (messages sent TO Claude) across all projects
 * Uses memory-efficient streaming to avoid crashes with large conversation histories
 */
export async function getSentMessages(): Promise<ParsedMessage[]> {
  try {
    // Configuration: Control how many messages/projects/files we process
    const MAX_PROJECTS_TO_SCAN = 5; // Only scan the 15 most recently active projects
    const MAX_FILES_PER_PROJECT = 5; // Only process the 5 most recent conversation files per project

    // STEP 1: Find all Claude Code projects and get their modification times
    const projects = await readdir(CLAUDE_DIR); // Read ~/.claude/projects/ directory
    const projectsWithStats = [];

    // Get modification time for each project directory to find most recently used projects
    for (const project of projects) {
      try {
        const projectPath = join(CLAUDE_DIR, project);
        const projectStat = await stat(projectPath);
        if (projectStat.isDirectory()) {
          projectsWithStats.push({
            name: project,
            path: projectPath,
            mtime: projectStat.mtime, // When this project was last modified (last conversation)
          });
        }
      } catch (error) {
        // Skip projects we can't read (permissions, etc.)
        console.error({ error });
        continue;
      }
    }

    // STEP 2: Sort projects by most recent activity and take only the top 5
    const sortedProjects = projectsWithStats
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()) // Newest first
      .slice(0, MAX_PROJECTS_TO_SCAN); // Only process 5 most recent projects

    // Array to collect ALL user messages from ALL projects before final sorting
    const topUserMessages: Message[] = [];

    // STEP 3: Process each of the 5 selected projects to find conversation files
    for (const project of sortedProjects) {
      try {
        // Get all conversation files (.jsonl) in this project
        const files = await readdir(project.path);
        const jsonlFiles = files.filter((file) => file.endsWith(".jsonl")); // Each .jsonl = one conversation session

        // STEP 4: Find the most recent conversation files in this project
        // We need to sort by modification time to get the latest conversations
        const filesWithStats = [];

        // Get modification time for ALL files first (before limiting)
        // This was the bug fix - we were limiting BEFORE sorting, which chose wrong files
        for (const file of jsonlFiles) {
          try {
            const filePath = join(project.path, file);
            const fileStat = await stat(filePath);
            filesWithStats.push({
              name: file,
              path: filePath,
              mtime: fileStat.mtime, // When this conversation file was last modified
            });
          } catch (error) {
            // Skip files we can't read
            console.error({ error });
            continue;
          }
        }

        // Sort files by newest first, then take only the 2 most recent conversation files
        const sortedFiles = filesWithStats
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()) // Newest conversations first
          .slice(0, MAX_FILES_PER_PROJECT); // Only process 5 most recent conversation files per project

        // STEP 5: Process each conversation file using streaming
        for (const file of sortedFiles) {
          try {
            const sessionId = file.name.replace(".jsonl", ""); // Extract session ID from filename

            // Stream through the file line-by-line to extract user messages
            // This avoids loading huge files into memory all at once
            const userMessages = await parseUserMessagesOnlyStreaming(
              file.path,
              sessionId,
              project.path,
            );

            // Add all user messages from this file to our collection
            topUserMessages.push(...userMessages);
          } catch (error) {
            console.error({ error });
            continue; // Skip problematic files
          }
        }

        // Continue to next project (don't break early - we want to scan all 5 projects)
      } catch (error) {
        console.error({ error });
        continue; // Skip problematic projects
      }
    }

    // STEP 6: Final sorting across ALL projects
    // Now we have user messages from multiple projects/conversations
    // Sort them globally by timestamp to get the most recent messages overall
    const finalMessages = topUserMessages.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    ); // Newest messages first across ALL projects

    // STEP 7: Format messages for Raycast display
    return finalMessages.map((msg, index) => ({
      ...msg,
      id: `sent-${index}`, // Unique ID for Raycast
      preview:
        msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : ""), // Preview text for list
    }));
  } catch (error) {
    console.error({ error });
    return [];
  }
}

export async function getReceivedMessages(): Promise<ParsedMessage[]> {
  const allMessages = await getAllClaudeMessages();

  const assistantMessages = allMessages.filter(
    (msg) => msg.role === "assistant",
  );

  const parsedMessages = assistantMessages.map((msg, index) => {
    const preview = msg.content
      ? msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : "")
      : "[Empty message]";
    return {
      ...msg,
      id: `received-${index}`,
      preview: preview,
      timestamp:
        msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    };
  });

  return parsedMessages;
}

export function formatMessageForDisplay(message: ParsedMessage): string {
  const date = message.timestamp.toLocaleString();
  return `[${date}]\n\n${message.content}`;
}

// Pinning functionality
import { LocalStorage } from "@raycast/api";
import { createHash } from "crypto";

const PINNED_MESSAGES_KEY = "claude-messages-pinned";

/**
 * Generate a unique ID for a message based on content and timestamp
 */
export function generateMessageId(message: ParsedMessage): string {
  try {
    const timestamp =
      message.timestamp instanceof Date
        ? message.timestamp.getTime()
        : new Date(message.timestamp).getTime();
    const content = `${message.content}-${timestamp}-${message.sessionId}`;
    return createHash("md5").update(content).digest("hex");
  } catch (error) {
    console.error({ error });
    // Fallback if timestamp is invalid
    const fallbackContent = `${message.content}-${message.sessionId}-${message.id}`;
    return createHash("md5").update(fallbackContent).digest("hex");
  }
}

/**
 * Get all pinned messages from LocalStorage
 */
export async function getPinnedMessages(): Promise<ParsedMessage[]> {
  try {
    const pinnedData = await LocalStorage.getItem<string>(PINNED_MESSAGES_KEY);
    if (!pinnedData) return [];

    const pinnedMessages: PinnedMessage[] = JSON.parse(pinnedData);
    return pinnedMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      role: msg.role,
      sessionId: msg.sessionId,
      projectPath: msg.projectPath,
      preview:
        msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : ""),
      isPinned: true,
    }));
  } catch (error) {
    console.error({ error });
    return [];
  }
}

/**
 * Get all pinned message IDs as a Set for efficient lookup
 */
export async function getPinnedMessageIds(): Promise<Set<string>> {
  try {
    const pinnedData = await LocalStorage.getItem<string>(PINNED_MESSAGES_KEY);
    if (!pinnedData) return new Set();

    const pinnedMessages: PinnedMessage[] = JSON.parse(pinnedData);
    return new Set(pinnedMessages.map((msg) => msg.id));
  } catch (error) {
    console.error({ error });
    return new Set();
  }
}

/**
 * Check if a message is pinned
 */
export async function isPinned(messageId: string): Promise<boolean> {
  try {
    if (!messageId) return false;

    const pinnedData = await LocalStorage.getItem<string>(PINNED_MESSAGES_KEY);

    if (!pinnedData) return false;

    const pinnedMessages: PinnedMessage[] = JSON.parse(pinnedData);
    return pinnedMessages.some((msg) => msg?.id === messageId);
  } catch (error) {
    console.error({ error });
    return false;
  }
}

/**
 * Pin a message
 */
export async function pinMessage(message: ParsedMessage): Promise<void> {
  try {
    const messageId = generateMessageId(message);
    const pinnedData = await LocalStorage.getItem<string>(PINNED_MESSAGES_KEY);
    const pinnedMessages: PinnedMessage[] = pinnedData
      ? JSON.parse(pinnedData)
      : [];

    // Check if already pinned
    if (pinnedMessages.some((msg) => msg.id === messageId)) {
      return;
    }

    // Add to pinned messages
    const pinnedMessage: PinnedMessage = {
      id: messageId,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      role: message.role as "user" | "assistant",
      sessionId: message.sessionId,
      projectPath: message.projectPath,
      pinnedAt: new Date().toISOString(),
    };

    pinnedMessages.push(pinnedMessage);
    await LocalStorage.setItem(
      PINNED_MESSAGES_KEY,
      JSON.stringify(pinnedMessages),
    );
  } catch (error) {
    console.error({ error });
    throw new Error("Failed to pin message");
  }
}

/**
 * Unpin a message
 */
export async function unpinMessage(messageId: string): Promise<void> {
  try {
    const pinnedData = await LocalStorage.getItem<string>(PINNED_MESSAGES_KEY);
    if (!pinnedData) return;

    let pinnedMessages: PinnedMessage[] = JSON.parse(pinnedData);
    pinnedMessages = pinnedMessages.filter((msg) => msg.id !== messageId);

    await LocalStorage.setItem(
      PINNED_MESSAGES_KEY,
      JSON.stringify(pinnedMessages),
    );
  } catch (error) {
    console.error("Error unpinning message:", error);
    throw new Error("Failed to unpin message");
  }
}

// Snippets functionality
const SNIPPETS_KEY = "claude-messages-snippets";

export interface Snippet {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all snippets from LocalStorage
 */
export async function getSnippets(): Promise<Snippet[]> {
  try {
    const snippetsData = await LocalStorage.getItem<string>(SNIPPETS_KEY);
    if (!snippetsData) return [];

    const snippets: Snippet[] = JSON.parse(snippetsData);
    return snippets.map((snippet) => ({
      ...snippet,
      createdAt: new Date(snippet.createdAt),
      updatedAt: new Date(snippet.updatedAt),
    }));
  } catch (error) {
    console.error({ error });
    return [];
  }
}

/**
 * Create a new snippet
 */
export async function createSnippet(
  title: string,
  content: string,
): Promise<Snippet> {
  try {
    const snippetsData = await LocalStorage.getItem<string>(SNIPPETS_KEY);
    const snippets: Snippet[] = snippetsData ? JSON.parse(snippetsData) : [];

    const newSnippet: Snippet = {
      id: createHash("md5")
        .update(`${title}-${content}-${Date.now()}`)
        .digest("hex"),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    snippets.push(newSnippet);
    await LocalStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));

    return newSnippet;
  } catch (error) {
    console.error({ error });
    throw new Error("Failed to create snippet");
  }
}

/**
 * Delete a snippet
 */
export async function deleteSnippet(id: string): Promise<void> {
  try {
    const snippetsData = await LocalStorage.getItem<string>(SNIPPETS_KEY);
    if (!snippetsData) return;

    let snippets: Snippet[] = JSON.parse(snippetsData);
    snippets = snippets.filter((s) => s.id !== id);

    await LocalStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
  } catch (error) {
    console.error({ error });
    throw new Error("Failed to delete snippet");
  }
}
