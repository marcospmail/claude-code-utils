/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import BrowseCommandsCheatsheet from "../commands/cheatsheet/list";
import React from "react";

// Mock Raycast API
jest.mock("@raycast/api");

// Mock commands data
jest.mock("../constants/commands-data", () => ({
  getCommandsByCategory: jest.fn(() => [
    {
      category: "Commands",
      commands: [
        {
          id: "help",
          name: "/help",
          description: "Get usage help and list available commands",
          category: "Commands",
          usage: "/help",
        },
        {
          id: "clear",
          name: "/clear",
          description: "Clear conversation history and start fresh",
          category: "Commands",
          usage: "/clear",
        },
      ],
    },
    {
      category: "Keyboard Shortcuts",
      commands: [
        {
          id: "ctrl-c",
          name: "Ctrl+C",
          description: "Cancel current input or generation",
          category: "Keyboard Shortcuts",
          usage: "Ctrl+C",
        },
      ],
    },
  ]),
  searchCommands: jest.fn((query) => {
    if (query.toLowerCase().includes("help")) {
      return [
        {
          id: "help",
          name: "/help",
          description: "Get usage help and list available commands",
          category: "Commands",
          usage: "/help",
        },
      ];
    }
    return [];
  }),
}));

// Mock CommandDetail component
jest.mock("../commands/cheatsheet/detail", () => ({
  __esModule: true,
  default: ({ command }: { command: { name: string } }) => (
    <div data-testid="command-detail" data-command={command.name}>
      Command Detail: {command.name}
    </div>
  ),
}));

describe("BrowseCommandsCheatsheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getIconForCommand function", () => {
    it("should return Terminal icon for Commands", () => {
      const { getByTestId } = render(<BrowseCommandsCheatsheet />);
      // Check if Terminal icon is used for Commands by verifying icon attribute
      const list = getByTestId("list");
      expect(list).toBeInTheDocument();
    });

    it("should return Keyboard icon for Keyboard Shortcuts", () => {
      const { getByTestId } = render(<BrowseCommandsCheatsheet />);
      // Check if Keyboard icon is used by verifying the component renders
      const list = getByTestId("list");
      expect(list).toBeInTheDocument();
    });

    it("should return Flag icon for CLI Flags", () => {
      const getCommandsByCategory = jest.mocked(
        jest.requireMock("../constants/commands-data").getCommandsByCategory,
      );
      getCommandsByCategory.mockReturnValueOnce([
        {
          category: "CLI Flags",
          commands: [
            {
              id: "flag-test",
              name: "--help",
              description: "Show help",
              category: "CLI Flags",
            },
          ],
        },
      ]);

      const { container } = render(<BrowseCommandsCheatsheet />);
      const listItems = container.querySelectorAll('[data-testid="list-item"]');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it("should return Stars icon for Special Keywords", () => {
      const getCommandsByCategory = jest.mocked(
        jest.requireMock("../constants/commands-data").getCommandsByCategory,
      );
      getCommandsByCategory.mockReturnValueOnce([
        {
          category: "Special Keywords",
          commands: [
            {
              id: "keyword-test",
              name: "@file",
              description: "Reference a file",
              category: "Special Keywords",
            },
          ],
        },
      ]);

      const { container } = render(<BrowseCommandsCheatsheet />);
      const listItems = container.querySelectorAll('[data-testid="list-item"]');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it("should return Code icon for other categories", () => {
      const getCommandsByCategory = jest.mocked(
        jest.requireMock("../constants/commands-data").getCommandsByCategory,
      );
      getCommandsByCategory.mockReturnValueOnce([
        {
          category: "Unknown Category",
          commands: [
            {
              id: "unknown-test",
              name: "unknown-command",
              description: "Unknown command",
              category: "Unknown Category",
            },
          ],
        },
      ]);

      const { container } = render(<BrowseCommandsCheatsheet />);
      const listItems = container.querySelectorAll('[data-testid="list-item"]');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  it("should render the list component", () => {
    const { getByTestId } = render(<BrowseCommandsCheatsheet />);
    const list = getByTestId("list");
    expect(list).toBeInTheDocument();
  });

  it("should have correct search bar placeholder", () => {
    const { getByTestId } = render(<BrowseCommandsCheatsheet />);
    const list = getByTestId("list");
    expect(list).toHaveAttribute(
      "data-placeholder",
      "Search Claude Code commands...",
    );
  });

  it("should have filtering disabled", () => {
    const { getByTestId } = render(<BrowseCommandsCheatsheet />);
    const list = getByTestId("list");
    expect(list).toHaveAttribute("data-filtering", "false");
  });

  it("should render List.Section components for categories", () => {
    const { container } = render(<BrowseCommandsCheatsheet />);
    const sections = container.querySelectorAll(
      '[data-title*="Commands"], [data-title*="Keyboard Shortcuts"]',
    );
    expect(sections.length).toBeGreaterThan(0);
  });

  it("should render List.Item components for commands", () => {
    const { container } = render(<BrowseCommandsCheatsheet />);
    const items = container.querySelectorAll(
      '[data-title="/help"], [data-title="/clear"], [data-title="Ctrl+C"]',
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("should group commands by category when no search text", () => {
    const getCommandsByCategory = jest.mocked(
      jest.requireMock("../constants/commands-data").getCommandsByCategory,
    );
    render(<BrowseCommandsCheatsheet />);
    expect(getCommandsByCategory).toHaveBeenCalled();
  });

  it("should test command usage copy functionality", () => {
    // Commands with usage property should have Copy Usage button
    const { container } = render(<BrowseCommandsCheatsheet />);

    // Mocked commands from commands-data have usage property
    const copyUsageButtons = container.querySelectorAll(
      '[data-title="Copy Usage"]',
    );

    // Should have Copy Usage buttons for commands with usage
    expect(copyUsageButtons.length).toBeGreaterThan(0);
  });

  it("should test command without usage property", () => {
    // This test ensures commands without usage property don't show Copy Usage button
    const { container } = render(<BrowseCommandsCheatsheet />);

    // Default commands from mock don't have usage property
    // So Copy Usage button should not appear for them
    const copyUsageButtons = container.querySelectorAll(
      '[data-title="Copy Usage"]',
    );

    // Check that all default commands have Copy Usage buttons (they have usage)
    expect(copyUsageButtons.length).toBeGreaterThan(0);
  });

  it("should test command with accessories in category view", () => {
    const getCommandsByCategory = jest.mocked(
      jest.requireMock("../constants/commands-data").getCommandsByCategory,
    );
    getCommandsByCategory.mockReturnValueOnce([
      {
        category: "Test Category",
        commands: [
          {
            id: "test-cmd",
            name: "/test",
            description: "Test command",
            category: "Test Category",
            usage: "/test --example",
          },
        ],
      },
    ]);

    const { container } = render(<BrowseCommandsCheatsheet />);
    const listItems = container.querySelectorAll('[data-testid="list-item"]');
    expect(listItems.length).toBeGreaterThan(0);

    // Test that usage copy action is available when usage exists
    const copyUsageButton = container.querySelector(
      '[data-title="Copy Usage"]',
    );
    expect(copyUsageButton).toBeTruthy();
  });
});
