import { jest } from "@jest/globals";

// Mock all the modules before importing the target module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
}));

jest.mock("readline", () => ({
  createInterface: jest.fn(),
}));

jest.mock("path", () => ({
  join: jest.fn(),
}));

jest.mock("os", () => ({
  homedir: jest.fn(),
}));

jest.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

// Import the mocked modules
import { existsSync, readdir } from "fs";
import { join } from "path";
import { homedir } from "os";
import { LocalStorage } from "@raycast/api";

// Type the mocked modules
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockedJoin = join as jest.MockedFunction<typeof join>;
const mockedHomedir = homedir as jest.MockedFunction<typeof homedir>;
const mockedLocalStorage = LocalStorage as jest.Mocked<typeof LocalStorage>;

// Import the functions to test
import {
  getSentMessages,
  getAllClaudeMessages,
  formatMessageForDisplay,
  generateMessageId,
  isPinned,
  pinMessage,
  unpinMessage,
  getSnippets,
  createSnippet,
  deleteSnippet,
} from "../claudeMessages";

describe("claudeMessages - Focused Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockedHomedir.mockReturnValue("/test/home");
    mockedJoin.mockImplementation((...paths) => paths.join("/"));
  });

  describe("Directory Operations", () => {
    it("should handle missing Claude directory gracefully", async () => {
      mockedExistsSync.mockReturnValue(false);

      const result = await getSentMessages();

      expect(result).toEqual([]);
      // The function should still complete and return empty array
    });
  });

  describe("Message Formatting and Utilities", () => {
    it("should format message with timestamp and content", () => {
      const message = {
        id: "test-id",
        content: "Test message content",
        timestamp: new Date("2023-01-01T12:00:00Z"),
        role: "user" as const,
      };

      const result = formatMessageForDisplay(message);

      expect(result).toContain("Test message content");
      expect(result).toContain("1/1/2023"); // The actual format used
    });

    it("should generate consistent ID for same message", () => {
      const message = {
        content: "Test message",
        timestamp: new Date("2023-01-01T12:00:00Z"),
        role: "user" as const,
      };

      const id1 = generateMessageId(message);
      const id2 = generateMessageId(message);

      expect(id1).toBe(id2);
      expect(id1).toBeTruthy();
    });

    it("should handle invalid timestamps with fallback", () => {
      const message = {
        content: "Test message",
        timestamp: new Date("invalid-date"),
        role: "user" as const,
      };

      const id = generateMessageId(message);

      expect(id).toBeTruthy();
      // The function should still generate an ID even with invalid timestamp
    });
  });

  describe("Pinning Functionality", () => {
    it("should return false for non-existent pinned message", async () => {
      mockedLocalStorage.getItem.mockResolvedValue(null);

      const result = await isPinned("test-id");

      expect(result).toBe(false);
    });

    it("should return true for pinned message", async () => {
      // The actual format uses 'claude-messages-pinned' key and stores message objects, not just IDs
      const pinnedData = JSON.stringify([
        { id: "test-id", content: "Test", timestamp: new Date(), role: "user" },
      ]);
      mockedLocalStorage.getItem.mockResolvedValue(pinnedData);

      const result = await isPinned("test-id");

      expect(result).toBe(true);
    });

    it("should pin a new message", async () => {
      mockedLocalStorage.getItem.mockResolvedValue(null);
      mockedLocalStorage.setItem.mockResolvedValue();

      const message = {
        id: "test-id",
        content: "Test message",
        timestamp: new Date(),
        role: "user" as const,
      };

      await pinMessage(message);

      expect(mockedLocalStorage.setItem).toHaveBeenCalledWith(
        "claude-messages-pinned",
        expect.any(String),
      );
    });

    it("should unpin existing message", async () => {
      const pinnedData = JSON.stringify([
        { id: "test-id", content: "Test", timestamp: new Date(), role: "user" },
        {
          id: "other-id",
          content: "Other",
          timestamp: new Date(),
          role: "user",
        },
      ]);

      mockedLocalStorage.getItem.mockResolvedValue(pinnedData);
      mockedLocalStorage.setItem.mockResolvedValue();

      await unpinMessage("test-id");

      expect(mockedLocalStorage.setItem).toHaveBeenCalledWith(
        "claude-messages-pinned",
        expect.any(String),
      );
    });
  });

  describe("Snippets Functionality", () => {
    it("should return empty array when no snippets exist", async () => {
      mockedLocalStorage.getItem.mockResolvedValue(null);

      const result = await getSnippets();

      expect(result).toEqual([]);
    });

    it("should create and save new snippet", async () => {
      mockedLocalStorage.getItem.mockResolvedValue(null);
      mockedLocalStorage.setItem.mockResolvedValue();

      await createSnippet("Test Title", "Test content");

      expect(mockedLocalStorage.setItem).toHaveBeenCalledWith(
        "claude-messages-snippets",
        expect.any(String),
      );
    });

    it("should delete existing snippet", async () => {
      const snippetsData = JSON.stringify([
        {
          id: "snippet-1",
          title: "Snippet 1",
          content: "Content 1",
          createdAt: new Date(),
        },
        {
          id: "snippet-2",
          title: "Snippet 2",
          content: "Content 2",
          createdAt: new Date(),
        },
      ]);

      mockedLocalStorage.getItem.mockResolvedValue(snippetsData);
      mockedLocalStorage.setItem.mockResolvedValue();

      await deleteSnippet("snippet-1");

      expect(mockedLocalStorage.setItem).toHaveBeenCalledWith(
        "claude-messages-snippets",
        expect.any(String),
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle JSON parse errors gracefully", async () => {
      mockedLocalStorage.getItem.mockResolvedValue("invalid-json");

      const result = await getSnippets();

      expect(result).toEqual([]);
    });

    it("should handle storage errors gracefully", async () => {
      mockedLocalStorage.getItem.mockRejectedValue(new Error("Storage error"));

      const result = await isPinned("test-id");

      expect(result).toBe(false);
    });

    it("should handle empty messageId in isPinned", async () => {
      const result = await isPinned("");

      expect(result).toBe(false);
    });
  });

  describe("Simple File Operations", () => {
    it("should return empty array when projects directory does not exist", async () => {
      mockedExistsSync.mockReturnValue(false);

      const result = await getAllClaudeMessages();

      expect(result).toEqual([]);
    });

    it("should handle readdir errors gracefully", async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReaddir.mockImplementation((path, callback) => {
        callback(new Error("Permission denied"), null);
      });

      const result = await getSentMessages();

      expect(result).toEqual([]);
    });
  });
});
