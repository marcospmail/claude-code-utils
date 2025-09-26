import { LocalStorage } from "@raycast/api";
import * as crypto from "crypto";
import {
  generateMessageId,
  getPinnedMessages,
  getPinnedMessageIds,
  isPinned,
  pinMessage,
  unpinMessage,
  getSnippets,
  createSnippet,
  deleteSnippet,
  formatMessageForDisplay,
  ParsedMessage,
  PinnedMessage,
  Snippet,
} from "../claudeMessages";

// Mock all external dependencies
jest.mock("@raycast/api");
jest.mock("fs");
jest.mock("fs/promises");
jest.mock("readline");
jest.mock("crypto");

describe("claudeMessages", () => {
  const mockLocalStorage = LocalStorage as jest.Mocked<typeof LocalStorage>;
  const mockCreateHash = crypto.createHash as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup crypto mock
    mockCreateHash.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue("mock-hash-id"),
    });
  });

  describe("generateMessageId", () => {
    it("should generate hash from message content and timestamp", () => {
      const message: ParsedMessage = {
        id: "1",
        content: "Test message",
        preview: "Test...",
        timestamp: new Date("2024-01-01"),
        role: "user",
        sessionId: "session-1",
      };

      const result = generateMessageId(message);

      expect(crypto.createHash).toHaveBeenCalledWith("md5");
      expect(result).toBe("mock-hash-id");
    });

    it("should handle invalid timestamp with fallback", () => {
      const message: ParsedMessage = {
        id: "1",
        content: "Test message",
        preview: "Test...",
        timestamp: "invalid" as unknown as number,
        role: "user",
        sessionId: "session-1",
      };

      const result = generateMessageId(message);

      expect(result).toBe("mock-hash-id");
    });
  });

  describe("formatMessageForDisplay", () => {
    it("should format message with date and content", () => {
      const message: ParsedMessage = {
        id: "1",
        content: "Test message content",
        preview: "Test...",
        timestamp: new Date("2024-01-01T12:00:00"),
        role: "user",
        sessionId: "session-1",
      };

      const result = formatMessageForDisplay(message);

      expect(result).toContain("Test message content");
      expect(result).toMatch(/\[.*\]\n\n/);
    });
  });

  describe("Pinning functionality", () => {
    describe("getPinnedMessages", () => {
      it("should return empty array when no pinned messages", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);

        const result = await getPinnedMessages();

        expect(result).toEqual([]);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
          "claude-messages-pinned",
        );
      });

      it("should return parsed pinned messages", async () => {
        const pinnedData: PinnedMessage[] = [
          {
            id: "1",
            content: "Pinned message",
            timestamp: "2024-01-01T12:00:00.000Z",
            role: "user",
            sessionId: "session-1",
            projectPath: "/path/to/project",
            pinnedAt: "2024-01-02T12:00:00.000Z",
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(pinnedData));

        const result = await getPinnedMessages();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: "1",
          content: "Pinned message",
          role: "user",
          isPinned: true,
          preview: "Pinned message",
        });
        expect(result[0].timestamp).toBeInstanceOf(Date);
      });

      it("should handle JSON parse errors", async () => {
        mockLocalStorage.getItem.mockResolvedValue("invalid json");

        const result = await getPinnedMessages();

        expect(result).toEqual([]);
      });
    });

    describe("getPinnedMessageIds", () => {
      it("should return empty Set when no pinned messages", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);

        const result = await getPinnedMessageIds();

        expect(result).toBeInstanceOf(Set);
        expect(result.size).toBe(0);
      });

      it("should return Set of pinned message IDs", async () => {
        const pinnedData: PinnedMessage[] = [
          {
            id: "1",
            content: "",
            timestamp: "",
            role: "user",
            sessionId: "",
            pinnedAt: "",
          },
          {
            id: "2",
            content: "",
            timestamp: "",
            role: "assistant",
            sessionId: "",
            pinnedAt: "",
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(pinnedData));

        const result = await getPinnedMessageIds();

        expect(result).toBeInstanceOf(Set);
        expect(result.has("1")).toBe(true);
        expect(result.has("2")).toBe(true);
        expect(result.size).toBe(2);
      });
    });

    describe("isPinned", () => {
      it("should return false for empty messageId", async () => {
        const result = await isPinned("");

        expect(result).toBe(false);
        expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
      });

      it("should return false when no pinned messages", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);

        const result = await isPinned("test-id");

        expect(result).toBe(false);
      });

      it("should return true when message is pinned", async () => {
        const pinnedData: PinnedMessage[] = [
          {
            id: "test-id",
            content: "",
            timestamp: "",
            role: "user",
            sessionId: "",
            pinnedAt: "",
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(pinnedData));

        const result = await isPinned("test-id");

        expect(result).toBe(true);
      });

      it("should return false when message is not pinned", async () => {
        const pinnedData: PinnedMessage[] = [
          {
            id: "other-id",
            content: "",
            timestamp: "",
            role: "user",
            sessionId: "",
            pinnedAt: "",
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(pinnedData));

        const result = await isPinned("test-id");

        expect(result).toBe(false);
      });
    });

    describe("pinMessage", () => {
      it("should add message to pinned messages", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);
        mockLocalStorage.setItem.mockResolvedValue(undefined);

        const message: ParsedMessage = {
          id: "1",
          content: "Test message",
          preview: "Test...",
          timestamp: new Date("2024-01-01"),
          role: "user",
          sessionId: "session-1",
          projectPath: "/path/to/project",
        };

        await pinMessage(message);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "claude-messages-pinned",
          expect.stringContaining("mock-hash-id"),
        );
      });

      it("should not duplicate already pinned message", async () => {
        const existingPinned: PinnedMessage[] = [
          {
            id: "mock-hash-id",
            content: "Test message",
            timestamp: "2024-01-01T00:00:00.000Z",
            role: "user",
            sessionId: "session-1",
            pinnedAt: "2024-01-02T00:00:00.000Z",
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(
          JSON.stringify(existingPinned),
        );
        mockLocalStorage.setItem.mockResolvedValue(undefined);

        const message: ParsedMessage = {
          id: "1",
          content: "Test message",
          preview: "Test...",
          timestamp: new Date("2024-01-01"),
          role: "user",
          sessionId: "session-1",
        };

        await pinMessage(message);

        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe("unpinMessage", () => {
      it("should remove message from pinned messages", async () => {
        const pinnedData: PinnedMessage[] = [
          {
            id: "id-1",
            content: "",
            timestamp: "",
            role: "user",
            sessionId: "",
            pinnedAt: "",
          },
          {
            id: "id-2",
            content: "",
            timestamp: "",
            role: "user",
            sessionId: "",
            pinnedAt: "",
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(pinnedData));
        mockLocalStorage.setItem.mockResolvedValue(undefined);

        await unpinMessage("id-1");

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "claude-messages-pinned",
          expect.stringContaining("id-2"),
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "claude-messages-pinned",
          expect.not.stringContaining("id-1"),
        );
      });

      it("should handle when no pinned messages exist", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);

        await unpinMessage("id-1");

        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });

  describe("Snippets functionality", () => {
    describe("getSnippets", () => {
      it("should return empty array when no snippets", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);

        const result = await getSnippets();

        expect(result).toEqual([]);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
          "claude-messages-snippets",
        );
      });

      it("should return parsed snippets with Date objects", async () => {
        const snippetsData: Snippet[] = [
          {
            id: "1",
            title: "Test Snippet",
            content: "Snippet content",
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-02"),
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(
          JSON.stringify(snippetsData),
        );

        const result = await getSnippets();

        expect(result).toHaveLength(1);
        expect(result[0].createdAt).toBeInstanceOf(Date);
        expect(result[0].updatedAt).toBeInstanceOf(Date);
      });

      it("should handle JSON parse errors", async () => {
        mockLocalStorage.getItem.mockResolvedValue("invalid json");

        const result = await getSnippets();

        expect(result).toEqual([]);
      });
    });

    describe("createSnippet", () => {
      it("should create and save new snippet", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);
        mockLocalStorage.setItem.mockResolvedValue(undefined);

        const result = await createSnippet("Test Title", "Test Content");

        expect(result).toMatchObject({
          id: "mock-hash-id",
          title: "Test Title",
          content: "Test Content",
        });
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "claude-messages-snippets",
          expect.any(String),
        );
      });

      it("should append to existing snippets", async () => {
        const existingSnippets: Snippet[] = [
          {
            id: "existing-1",
            title: "Existing",
            content: "Existing content",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(
          JSON.stringify(existingSnippets),
        );
        mockLocalStorage.setItem.mockResolvedValue(undefined);

        await createSnippet("New Title", "New Content");

        const setItemCall = mockLocalStorage.setItem.mock.calls[0];
        const savedData = JSON.parse(setItemCall[1] as string);
        expect(savedData).toHaveLength(2);
        expect(savedData[0].id).toBe("existing-1");
        expect(savedData[1].id).toBe("mock-hash-id");
      });
    });

    describe("deleteSnippet", () => {
      it("should remove snippet from storage", async () => {
        const snippetsData: Snippet[] = [
          {
            id: "id-1",
            title: "Snippet 1",
            content: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "id-2",
            title: "Snippet 2",
            content: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        mockLocalStorage.getItem.mockResolvedValue(
          JSON.stringify(snippetsData),
        );
        mockLocalStorage.setItem.mockResolvedValue(undefined);

        await deleteSnippet("id-1");

        const setItemCall = mockLocalStorage.setItem.mock.calls[0];
        const savedData = JSON.parse(setItemCall[1] as string);
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe("id-2");
      });

      it("should handle when no snippets exist", async () => {
        mockLocalStorage.getItem.mockResolvedValue(undefined);

        await deleteSnippet("id-1");

        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });
});
