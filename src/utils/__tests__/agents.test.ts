import { join } from "path";

// Mock must be set up before importing the module
jest.mock("fs/promises");
jest.mock("os", () => ({
  homedir: jest.fn(() => "/home/user"),
}));

import { getAgents, getAgent } from "../agents";
import { readdir, readFile } from "fs/promises";

const mockReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe("agents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAgents", () => {
    it("should return all agent files from ~/.claude/agents", async () => {
      mockReaddir.mockResolvedValue([
        "test-agent.md",
        "another-agent.md",
        "not-markdown.txt",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      mockReadFile
        .mockResolvedValueOnce("# Test Agent Content")
        .mockResolvedValueOnce("# Another Agent Content");

      const agents = await getAgents();

      expect(agents).toHaveLength(2);
      expect(agents[0]).toEqual({
        id: "another-agent",
        name: "Another Agent",
        content: "# Another Agent Content",
        filePath: join("/home/user", ".claude", "agents", "another-agent.md"),
      });
      expect(agents[1]).toEqual({
        id: "test-agent",
        name: "Test Agent",
        content: "# Test Agent Content",
        filePath: join("/home/user", ".claude", "agents", "test-agent.md"),
      });
    });

    it("should filter out non-markdown files", async () => {
      mockReaddir.mockResolvedValue([
        "agent.md",
        "file.txt",
        "another.pdf",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      mockReadFile.mockResolvedValueOnce("# Agent Content");

      const agents = await getAgents();

      expect(agents).toHaveLength(1);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when directory does not exist", async () => {
      const error = new Error("ENOENT");
      (error as NodeJS.ErrnoException).code = "ENOENT";
      mockReaddir.mockRejectedValue(error);

      const agents = await getAgents();

      expect(agents).toEqual([]);
    });

    it("should throw error for non-ENOENT errors", async () => {
      const error = new Error("Permission denied");
      mockReaddir.mockRejectedValue(error);

      await expect(getAgents()).rejects.toThrow("Permission denied");
    });

    it("should sort agents by name alphabetically", async () => {
      mockReaddir.mockResolvedValue([
        "zebra-agent.md",
        "apple-agent.md",
        "middle-agent.md",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      mockReadFile
        .mockResolvedValueOnce("# Zebra")
        .mockResolvedValueOnce("# Apple")
        .mockResolvedValueOnce("# Middle");

      const agents = await getAgents();

      expect(agents[0].name).toBe("Apple Agent");
      expect(agents[1].name).toBe("Middle Agent");
      expect(agents[2].name).toBe("Zebra Agent");
    });

    it("should format agent names correctly", async () => {
      mockReaddir.mockResolvedValue([
        "multi-word-agent-name.md",
        "single.md",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      mockReadFile
        .mockResolvedValueOnce("# Content 1")
        .mockResolvedValueOnce("# Content 2");

      const agents = await getAgents();

      expect(agents[0].name).toBe("Multi Word Agent Name");
      expect(agents[1].name).toBe("Single");
    });

    it("should handle empty directory", async () => {
      mockReaddir.mockResolvedValue(
        [] as unknown as Awaited<ReturnType<typeof readdir>>,
      );

      const agents = await getAgents();

      expect(agents).toEqual([]);
    });

    it("should include file paths in results", async () => {
      mockReaddir.mockResolvedValue(["test.md"] as unknown as Awaited<
        ReturnType<typeof readdir>
      >);
      mockReadFile.mockResolvedValueOnce("# Content");

      const agents = await getAgents();

      expect(agents[0].filePath).toBe(
        join("/home/user", ".claude", "agents", "test.md"),
      );
    });
  });

  describe("getAgent", () => {
    it("should return a single agent by id", async () => {
      mockReadFile.mockResolvedValueOnce("# Test Agent Content");

      const agent = await getAgent("test-agent");

      expect(agent).toEqual({
        id: "test-agent",
        name: "Test Agent",
        content: "# Test Agent Content",
        filePath: join("/home/user", ".claude", "agents", "test-agent.md"),
      });
      expect(mockReadFile).toHaveBeenCalledWith(
        join("/home/user", ".claude", "agents", "test-agent.md"),
        "utf-8",
      );
    });

    it("should return null when agent file does not exist", async () => {
      const error = new Error("ENOENT");
      (error as NodeJS.ErrnoException).code = "ENOENT";
      mockReadFile.mockRejectedValue(error);

      const agent = await getAgent("non-existent");

      expect(agent).toBeNull();
    });

    it("should throw error for non-ENOENT errors", async () => {
      const error = new Error("Permission denied");
      mockReadFile.mockRejectedValue(error);

      await expect(getAgent("test")).rejects.toThrow("Permission denied");
    });

    it("should format agent name from id", async () => {
      mockReadFile.mockResolvedValueOnce("# Content");

      const agent = await getAgent("my-custom-agent");

      expect(agent?.name).toBe("My Custom Agent");
    });

    it("should handle single word agent names", async () => {
      mockReadFile.mockResolvedValueOnce("# Content");

      const agent = await getAgent("agent");

      expect(agent?.name).toBe("Agent");
    });
  });
});
