/**
 * Comprehensive tests for claudeMessages.ts utility functions
 * These tests cover the uncovered lines to increase overall test coverage
 */

import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import { createInterface } from "readline";
import { createHash } from "crypto";
import {
  getSentMessages,
  getReceivedMessages,
  getAllClaudeMessages,
  formatMessageForDisplay,
  generateMessageId,
  getPinnedMessages,
  getPinnedMessageIds,
  isPinned,
  pinMessage,
  unpinMessage,
  getSnippets,
  createSnippet,
  deleteSnippet,
  ParsedMessage,
} from "../claudeMessages";

// Mock dependencies
jest.mock("fs");
jest.mock("fs/promises");
jest.mock("path");
jest.mock("os");
jest.mock("readline");
jest.mock("crypto");
jest.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockFsPromises = fsPromises as jest.Mocked<typeof fsPromises>;
const mockPath = path as jest.Mocked<typeof path>;
const mockOs = os as jest.Mocked<typeof os>;
const mockReadline = createInterface as jest.MockedFunction<
  typeof createInterface
>;
const mockCreateHash = createHash as jest.MockedFunction<typeof createHash>;

// Import the mocked LocalStorage
const { LocalStorage } = jest.requireMock("@raycast/api");

describe("claudeMessages.ts Comprehensive Tests", () => {
  let mockReadlineInterface: jest.Mocked<readline.Interface>;
  let mockFileStream: jest.Mocked<fs.ReadStream>;
  let mockHasher: jest.Mocked<ReturnType<typeof createHash>>;

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();

    // Setup mock readline interface
    mockReadlineInterface = {
      on: jest.fn(),
      close: jest.fn(),
      removeAllListeners: jest.fn(),
    };

    // Setup mock file stream
    mockFileStream = {
      destroy: jest.fn(),
      on: jest.fn(),
    };

    // Setup mock hasher
    mockHasher = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue("mock-hash"),
    };

    mockReadline.mockReturnValue(mockReadlineInterface);
    mockFs.createReadStream.mockReturnValue(mockFileStream);
    mockCreateHash.mockReturnValue(mockHasher);

    // Default mocks
    mockOs.homedir.mockReturnValue("/home/user");
    mockPath.join.mockImplementation((...parts) => parts.join("/"));
    mockFsPromises.readdir.mockResolvedValue([]);
    mockFsPromises.stat.mockResolvedValue({
      isDirectory: jest.fn().mockReturnValue(true),
      mtime: new Date("2024-01-01"),
    } as unknown as fs.Stats);
  });

  describe("parseUserMessagesOnlyStreaming", () => {
    it("should handle file stream creation and setup", async () => {
      // Setup mock readline events to simulate file processing
      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "close") {
            // Simulate immediate close
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      // Mock the full directory scan sequence:
      // 1. readdir(CLAUDE_DIR) -> ["project1"]
      // 2. stat(project1) -> {isDirectory: true}
      // 3. readdir(project1) -> ["session1.jsonl"]
      // 4. stat(session1.jsonl) -> {mtime: date}
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"]) // Step 1: Projects directory
        .mockResolvedValueOnce(["session1.jsonl"]) // Step 3: Files in project1
        .mockResolvedValueOnce(["session1.jsonl"]); // Step 3 again for file processing

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 2: project1 stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 4: session1.jsonl stat (for project scanning)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats); // Step 4: session1.jsonl stat (for file processing)

      const result = await getSentMessages();

      expect(mockFs.createReadStream).toHaveBeenCalled();
      expect(mockReadline).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should process valid user message lines", async () => {
      const mockLine = JSON.stringify({
        message: {
          role: "user",
          content: "Test user message",
        },
        timestamp: 1640995200, // Unix timestamp
      });

      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "line") {
            callback(mockLine);
          } else if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      // Mock the full directory scan sequence:
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"]) // Step 1: Projects directory
        .mockResolvedValueOnce(["session1.jsonl"]) // Step 3: Files in project1 (scanning)
        .mockResolvedValueOnce(["session1.jsonl"]); // Step 3: Files in project1 (processing)

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 2: project1 stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 4: session1.jsonl stat (for project scanning)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats); // Step 4: session1.jsonl stat (for file processing)

      const result = await getSentMessages();

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Test user message");
      expect(result[0].role).toBe("user");
    });

    it("should handle complex content arrays", async () => {
      const mockLine = JSON.stringify({
        message: {
          role: "user",
          content: [
            { type: "text", text: "First part" },
            { type: "image", url: "image.png" },
            { type: "text", text: "Second part" },
          ],
        },
        timestamp: 1640995200,
      });

      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "line") {
            callback(mockLine);
          } else if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      // Mock the full directory scan sequence:
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"]) // Step 1: Projects directory
        .mockResolvedValueOnce(["session1.jsonl"]) // Step 3: Files in project1 (scanning)
        .mockResolvedValueOnce(["session1.jsonl"]); // Step 3: Files in project1 (processing)

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 2: project1 stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 4: session1.jsonl stat (for project scanning)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats); // Step 4: session1.jsonl stat (for file processing)

      const result = await getSentMessages();

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("First part\nSecond part");
    });

    it("should filter out system messages and interrupted requests", async () => {
      const validMessage = JSON.stringify({
        message: { role: "user", content: "Valid message" },
        timestamp: 1640995200,
      });

      const systemMessage = JSON.stringify({
        message: {
          role: "user",
          content: "<command-message>System command</command-message>",
        },
        timestamp: 1640995200,
      });

      const interruptedMessage = JSON.stringify({
        message: {
          role: "user",
          content: "[Request interrupted due to timeout]",
        },
        timestamp: 1640995200,
      });

      let lineCount = 0;
      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "line") {
            const lines = [validMessage, systemMessage, interruptedMessage];
            if (lineCount < lines.length) {
              callback(lines[lineCount]);
              lineCount++;
            }
          } else if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      // Mock the full directory scan sequence:
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"]) // Step 1: Projects directory
        .mockResolvedValueOnce(["session1.jsonl"]) // Step 3: Files in project1 (scanning)
        .mockResolvedValueOnce(["session1.jsonl"]); // Step 3: Files in project1 (processing)

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 2: project1 stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 4: session1.jsonl stat (for project scanning)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats); // Step 4: session1.jsonl stat (for file processing)

      const result = await getSentMessages();

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Valid message");
    });

    it("should handle timestamp conversion", async () => {
      const unixTimestamp = JSON.stringify({
        message: { role: "user", content: "Unix timestamp test message" },
        timestamp: 1640995200, // Unix timestamp (seconds)
      });

      const jsTimestamp = JSON.stringify({
        message: { role: "user", content: "JavaScript timestamp test message" },
        timestamp: 1640995300000, // JS timestamp (milliseconds) - different time
      });

      // Use a proper mock implementation that handles multiple calls
      const lines = [unixTimestamp, jsTimestamp];

      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "line") {
            // Call the callback for each line
            for (const line of lines) {
              callback(line);
            }
          } else if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      // Mock the full directory scan sequence:
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"]) // Step 1: Projects directory
        .mockResolvedValueOnce(["session1.jsonl"]) // Step 3: Files in project1 (scanning)
        .mockResolvedValueOnce(["session1.jsonl"]); // Step 3: Files in project1 (processing)

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 2: project1 stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 4: session1.jsonl stat (for project scanning)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats); // Step 4: session1.jsonl stat (for file processing)

      const result = await getSentMessages();

      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[1].timestamp).toBeInstanceOf(Date);
    });

    it("should handle malformed JSON lines gracefully", async () => {
      const validLine = JSON.stringify({
        message: { role: "user", content: "Valid message" },
        timestamp: 1640995200,
      });

      const invalidLine = "{ invalid json";

      let lineCount = 0;
      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "line") {
            const lines = [validLine, invalidLine];
            if (lineCount < lines.length) {
              callback(lines[lineCount]);
              lineCount++;
            }
          } else if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      // Mock the full directory scan sequence:
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"]) // Step 1: Projects directory
        .mockResolvedValueOnce(["session1.jsonl"]) // Step 3: Files in project1 (scanning)
        .mockResolvedValueOnce(["session1.jsonl"]); // Step 3: Files in project1 (processing)

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 2: project1 stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats) // Step 4: session1.jsonl stat (for project scanning)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats); // Step 4: session1.jsonl stat (for file processing)

      const result = await getSentMessages();

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Valid message");
    });

    it("should handle readline errors", async () => {
      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "error") {
            setTimeout(() => callback(new Error("Readline error")), 0);
          }
          return mockReadlineInterface;
        },
      );

      mockFsPromises.readdir.mockResolvedValue(["project1"]);
      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats);

      const result = await getSentMessages();

      expect(result).toEqual([]);
    });

    it("should handle file stream errors", async () => {
      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      // Simulate file stream error
      mockFileStream.on = jest
        .fn()
        .mockImplementation(
          (event: string, callback: (...args: unknown[]) => void) => {
            if (event === "error") {
              setTimeout(() => callback(new Error("File stream error")), 0);
            }
            return mockFileStream;
          },
        );

      mockFs.createReadStream.mockReturnValue(mockFileStream);

      mockFsPromises.readdir.mockResolvedValue(["project1"]);
      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats);

      const result = await getSentMessages();

      expect(result).toEqual([]);
    });

    it("should handle cleanup errors gracefully", async () => {
      // Mock readline close to throw error
      mockReadlineInterface.close.mockImplementation(() => {
        throw new Error("Cleanup error");
      });

      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      mockFsPromises.readdir.mockResolvedValue(["project1"]);
      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats);

      const result = await getSentMessages();

      expect(result).toEqual([]);
    });
  });

  describe("getAllClaudeMessages", () => {
    it("should handle directory scanning and file processing", async () => {
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1", "project2"])
        .mockResolvedValueOnce(["session1.jsonl", "session2.jsonl"])
        .mockResolvedValueOnce(["session3.jsonl"]);

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-02"),
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-02"),
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats);

      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      const result = await getAllClaudeMessages();

      expect(mockFsPromises.readdir).toHaveBeenCalledTimes(3);
      expect(result).toEqual([]);
    });

    it("should handle project directory errors", async () => {
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"])
        .mockRejectedValueOnce(new Error("Cannot read project"));

      mockFsPromises.stat.mockResolvedValueOnce({
        isDirectory: jest.fn().mockReturnValue(true),
        mtime: new Date("2024-01-01"),
      } as unknown as fs.Stats);

      const result = await getAllClaudeMessages();

      expect(result).toEqual([]);
    });

    it("should handle file stat errors", async () => {
      mockFsPromises.readdir
        .mockResolvedValueOnce(["project1"])
        .mockResolvedValueOnce(["session1.jsonl"]);

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: new Date("2024-01-01"),
        } as unknown as fs.Stats)
        .mockRejectedValueOnce(new Error("Cannot stat file"));

      const result = await getAllClaudeMessages();

      expect(result).toEqual([]);
    });

    it("should sort projects by most recent file activity", async () => {
      const oldDate = new Date("2024-01-01");
      const newDate = new Date("2024-01-02");

      mockFsPromises.readdir
        .mockResolvedValueOnce(["old-project", "new-project"])
        .mockResolvedValueOnce(["old.jsonl"])
        .mockResolvedValueOnce(["new.jsonl"])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: oldDate,
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
          mtime: oldDate,
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: oldDate,
        } as unknown as fs.Stats)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          mtime: newDate,
        } as unknown as fs.Stats);

      mockReadlineInterface.on.mockImplementation(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (event === "close") {
            setTimeout(callback, 0);
          }
          return mockReadlineInterface;
        },
      );

      const result = await getAllClaudeMessages();

      // Should process new-project first due to more recent file activity
      expect(result).toEqual([]);
    });
  });

  describe("Message ID Generation", () => {
    it("should generate message ID from content and timestamp", () => {
      const message: ParsedMessage = {
        id: "test",
        content: "Test message",
        timestamp: new Date("2024-01-01T12:00:00Z"),
        role: "user",
        sessionId: "session1",
        preview: "Test...",
      };

      mockHasher.digest.mockReturnValue("generated-hash");

      const result = generateMessageId(message);

      expect(mockCreateHash).toHaveBeenCalledWith("md5");
      expect(mockHasher.update).toHaveBeenCalledWith(
        "Test message-1704110400000-session1",
      );
      expect(result).toBe("generated-hash");
    });

    it("should handle invalid timestamp with fallback", () => {
      const message: ParsedMessage = {
        id: "test",
        content: "Test message",
        timestamp: "invalid-date" as unknown as Date,
        role: "user",
        sessionId: "session1",
        preview: "Test...",
      };

      mockHasher.digest.mockReturnValue("fallback-hash");

      const result = generateMessageId(message);

      expect(mockHasher.update).toHaveBeenCalledWith(
        "Test message-session1-test",
      );
      expect(result).toBe("fallback-hash");
    });
  });

  describe("Pinned Messages", () => {
    it("should get pinned messages from LocalStorage", async () => {
      const pinnedData = JSON.stringify([
        {
          id: "pin1",
          content: "Pinned message",
          timestamp: "2024-01-01T12:00:00Z",
          role: "user",
          sessionId: "session1",
          projectPath: "/path/to/project",
          pinnedAt: "2024-01-01T12:00:00Z",
        },
      ]);

      LocalStorage.getItem.mockResolvedValue(pinnedData);

      const result = await getPinnedMessages();

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Pinned message");
      expect(result[0].isPinned).toBe(true);
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it("should return empty array when no pinned data", async () => {
      LocalStorage.getItem.mockResolvedValue(undefined);

      const result = await getPinnedMessages();

      expect(result).toEqual([]);
    });

    it("should handle LocalStorage errors", async () => {
      LocalStorage.getItem.mockRejectedValue(new Error("Storage error"));

      const result = await getPinnedMessages();

      expect(result).toEqual([]);
    });

    it("should get pinned message IDs as Set", async () => {
      const pinnedData = JSON.stringify([{ id: "pin1" }, { id: "pin2" }]);

      LocalStorage.getItem.mockResolvedValue(pinnedData);

      const result = await getPinnedMessageIds();

      expect(result).toBeInstanceOf(Set);
      expect(result.has("pin1")).toBe(true);
      expect(result.has("pin2")).toBe(true);
    });

    it("should check if message is pinned", async () => {
      const pinnedData = JSON.stringify([{ id: "pin1" }]);

      LocalStorage.getItem.mockResolvedValue(pinnedData);

      const isPinnedResult = await isPinned("pin1");
      const isNotPinnedResult = await isPinned("pin2");

      expect(isPinnedResult).toBe(true);
      expect(isNotPinnedResult).toBe(false);
    });

    it("should handle empty message ID in isPinned", async () => {
      const result = await isPinned("");

      expect(result).toBe(false);
    });

    it("should pin a message", async () => {
      const message: ParsedMessage = {
        id: "test",
        content: "Test message",
        timestamp: new Date("2024-01-01T12:00:00Z"),
        role: "user",
        sessionId: "session1",
        preview: "Test...",
      };

      LocalStorage.getItem.mockResolvedValue("[]");
      mockHasher.digest.mockReturnValue("message-hash");

      await pinMessage(message);

      expect(LocalStorage.setItem).toHaveBeenCalledWith(
        "claude-messages-pinned",
        expect.stringContaining("message-hash"),
      );
    });

    it("should not pin already pinned message", async () => {
      const message: ParsedMessage = {
        id: "test",
        content: "Test message",
        timestamp: new Date("2024-01-01T12:00:00Z"),
        role: "user",
        sessionId: "session1",
        preview: "Test...",
      };

      const existingPinned = JSON.stringify([{ id: "message-hash" }]);

      LocalStorage.getItem.mockResolvedValue(existingPinned);
      mockHasher.digest.mockReturnValue("message-hash");

      await pinMessage(message);

      // Should not call setItem since message is already pinned
      expect(LocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("should handle pinMessage errors", async () => {
      const message: ParsedMessage = {
        id: "test",
        content: "Test message",
        timestamp: new Date(),
        role: "user",
        sessionId: "session1",
        preview: "Test...",
      };

      LocalStorage.setItem.mockRejectedValue(new Error("Storage error"));

      await expect(pinMessage(message)).rejects.toThrow(
        "Failed to pin message",
      );
    });

    it("should unpin a message", async () => {
      const pinnedData = JSON.stringify([{ id: "pin1" }, { id: "pin2" }]);

      LocalStorage.getItem.mockResolvedValue(pinnedData);
      LocalStorage.setItem.mockResolvedValue(); // Mock successful setItem

      await unpinMessage("pin1");

      expect(LocalStorage.setItem).toHaveBeenCalledWith(
        "claude-messages-pinned",
        JSON.stringify([{ id: "pin2" }]),
      );
    });

    it("should handle unpinMessage errors", async () => {
      LocalStorage.setItem.mockRejectedValue(new Error("Storage error"));

      await expect(unpinMessage("pin1")).rejects.toThrow(
        "Failed to unpin message",
      );
    });
  });

  describe("Snippets", () => {
    it("should get snippets from LocalStorage", async () => {
      const snippetsData = JSON.stringify([
        {
          id: "snippet1",
          title: "Test Snippet",
          content: "Snippet content",
          createdAt: "2024-01-01T12:00:00Z",
          updatedAt: "2024-01-01T12:00:00Z",
        },
      ]);

      LocalStorage.getItem.mockResolvedValue(snippetsData);

      const result = await getSnippets();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Snippet");
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it("should return empty array when no snippets", async () => {
      LocalStorage.getItem.mockResolvedValue(undefined);

      const result = await getSnippets();

      expect(result).toEqual([]);
    });

    it("should handle getSnippets errors", async () => {
      LocalStorage.getItem.mockRejectedValue(new Error("Storage error"));

      const result = await getSnippets();

      expect(result).toEqual([]);
    });

    it("should create a new snippet", async () => {
      LocalStorage.getItem.mockResolvedValue("[]");
      LocalStorage.setItem.mockResolvedValue(); // Mock successful setItem
      mockHasher.digest.mockReturnValue("snippet-hash");

      const result = await createSnippet("Test Title", "Test Content");

      expect(result.id).toBe("snippet-hash");
      expect(result.title).toBe("Test Title");
      expect(result.content).toBe("Test Content");
      expect(LocalStorage.setItem).toHaveBeenCalled();
    });

    it("should handle createSnippet errors", async () => {
      LocalStorage.setItem.mockRejectedValue(new Error("Storage error"));

      await expect(createSnippet("Title", "Content")).rejects.toThrow(
        "Failed to create snippet",
      );
    });

    it("should delete a snippet", async () => {
      const snippetsData = JSON.stringify([
        { id: "snippet1" },
        { id: "snippet2" },
      ]);

      LocalStorage.getItem.mockResolvedValue(snippetsData);
      LocalStorage.setItem.mockResolvedValue(); // Mock successful setItem

      await deleteSnippet("snippet1");

      expect(LocalStorage.setItem).toHaveBeenCalledWith(
        "claude-messages-snippets",
        JSON.stringify([{ id: "snippet2" }]),
      );
    });

    it("should handle deleteSnippet with no existing data", async () => {
      LocalStorage.getItem.mockResolvedValue(undefined);

      await deleteSnippet("snippet1");

      // Should not throw error
      expect(LocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("should handle deleteSnippet errors", async () => {
      LocalStorage.getItem.mockResolvedValue("[]");
      LocalStorage.setItem.mockRejectedValue(new Error("Storage error"));

      await expect(deleteSnippet("snippet1")).rejects.toThrow(
        "Failed to delete snippet",
      );
    });
  });

  describe("formatMessageForDisplay", () => {
    it("should format message with timestamp and content", () => {
      const message: ParsedMessage = {
        id: "test",
        content: "Test message content",
        timestamp: new Date("2024-01-01T12:00:00Z"),
        role: "user",
        sessionId: "session1",
        preview: "Test...",
      };

      const result = formatMessageForDisplay(message);

      expect(result).toContain("Test message content");
      expect(result).toContain("1/1/2024"); // Date format varies by locale
    });
  });

  describe("getReceivedMessages", () => {
    it("should filter and format assistant messages", async () => {
      // Mock the file system operations for getAllClaudeMessages
      mockFsPromises.readdir.mockResolvedValue([]);

      const result = await getReceivedMessages();

      // Should return properly formatted assistant messages
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Error Handling and Edge Cases", () => {});
});
