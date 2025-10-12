/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BrowseCommands from "../browse-commands";
import * as slashCommandsUtils from "../utils/commands";

// Mock Raycast API
jest.mock("@raycast/api");

// Mock slash-command-detail component
jest.mock("../commands/browse-commands/detail", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="slash-command-detail">Slash Command Detail</div>
  ),
}));

// Mock slashCommands utils
jest.mock("../utils/commands");

const mockGetSlashCommands =
  slashCommandsUtils.getSlashCommands as jest.MockedFunction<
    typeof slashCommandsUtils.getSlashCommands
  >;

describe("BrowseCommands", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state initially", () => {
    mockGetSlashCommands.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<BrowseCommands />);

    const list = screen.getByTestId("list");
    expect(list).toHaveAttribute("data-loading", "true");
  });

  it("should render commands list", async () => {
    const mockCommands = [
      {
        id: "test-command",
        name: "Test Command",
        content: "# Test Command Content",
        filePath: "/path/to/test-command.md",
      },
      {
        id: "another-command",
        name: "Another Command",
        content: "# Another Command Content",
        filePath: "/path/to/another-command.md",
      },
    ];

    mockGetSlashCommands.mockResolvedValue(mockCommands);

    render(<BrowseCommands />);

    await waitFor(() => {
      const list = screen.getByTestId("list");
      expect(list).toHaveAttribute("data-loading", "false");
    });

    const items = screen.getAllByTestId("list-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("data-title", "Test Command");
    expect(items[1]).toHaveAttribute("data-title", "Another Command");
  });

  it("should show empty view when no commands found", async () => {
    mockGetSlashCommands.mockResolvedValue([]);

    render(<BrowseCommands />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-view")).toBeInTheDocument();
    });

    expect(screen.getByTestId("empty-title")).toHaveTextContent(
      "No Commands Found",
    );
    expect(screen.getByTestId("empty-description")).toHaveTextContent(
      "No command files found in ~/.claude/commands",
    );
  });

  it("should show error view on failure", async () => {
    mockGetSlashCommands.mockRejectedValue(
      new Error("Failed to read directory"),
    );

    render(<BrowseCommands />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-view")).toBeInTheDocument();
    });

    expect(screen.getByTestId("empty-title")).toHaveTextContent(
      "Error Loading Commands",
    );
    expect(screen.getByTestId("empty-description")).toHaveTextContent(
      "Failed to read directory",
    );
  });

  it("should render actions for each command", async () => {
    const mockCommands = [
      {
        id: "test-command",
        name: "Test Command",
        content: "# Test Command Content",
        filePath: "/path/to/test-command.md",
      },
    ];

    mockGetSlashCommands.mockResolvedValue(mockCommands);

    render(<BrowseCommands />);

    await waitFor(() => {
      expect(screen.getByTestId("action-panel")).toBeInTheDocument();
    });

    const pushAction = screen.getByTestId("action-push-view-command-details");
    expect(pushAction).toHaveAttribute("data-title", "View Command Details");

    const copyAction = screen.getByTestId("action-copy-command-content");
    expect(copyAction).toHaveAttribute("data-title", "Copy Command Content");

    expect(screen.getByTestId("action-show-finder")).toBeInTheDocument();
  });

  it("should display command filename as accessory", async () => {
    const mockCommands = [
      {
        id: "test-command",
        name: "Test Command",
        content: "# Test Command Content",
        filePath: "/path/to/test-command.md",
      },
    ];

    mockGetSlashCommands.mockResolvedValue(mockCommands);

    render(<BrowseCommands />);

    await waitFor(() => {
      const item = screen.getByTestId("list-item");
      const accessories = JSON.parse(
        item.getAttribute("data-accessories") || "[]",
      );
      expect(accessories).toEqual([{ text: "test-command.md" }]);
    });
  });
});
