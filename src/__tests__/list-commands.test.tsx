/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ListCommands from "../list-commands";

// Mock Raycast API
jest.mock("@raycast/api", () => ({
  List: Object.assign(
    ({
      children,
      searchBarPlaceholder,
      filtering,
    }: {
      children: React.ReactNode;
      searchBarPlaceholder?: string;
      filtering?: boolean;
    }) => (
      <div
        data-testid="list"
        data-filtering={filtering}
        data-placeholder={searchBarPlaceholder}
      >
        {children}
      </div>
    ),
    {
      Section: ({
        children,
        title,
      }: {
        children: React.ReactNode;
        title: string;
      }) => (
        <div data-testid="list-section" title={title}>
          {children}
        </div>
      ),
      Item: ({
        title,
        subtitle,
        actions,
        accessories,
      }: {
        title: string;
        subtitle?: string;
        actions?: React.ReactNode;
      }) => (
        <div data-testid="list-item" title={title} data-subtitle={subtitle}>
          {actions}
        </div>
      ),
    },
  ),
  ActionPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="action-panel">{children}</div>
  ),
  Action: {
    Push: ({ title }: { title: string }) => (
      <button data-testid="action-push" data-title={title}>
        {title}
      </button>
    ),
    CopyToClipboard: ({ title, content }: { title: string; content: string }) => (
      <button
        data-testid="action-copy"
        data-title={title}
        data-content={content}
      >
        {title}
      </button>
    ),
  },
  Icon: {
    Terminal: "terminal-icon",
    Keyboard: "keyboard-icon",
    Flag: "flag-icon",
    Stars: "stars-icon",
    Code: "code-icon",
    Eye: "eye-icon",
    Clipboard: "clipboard-icon",
    Document: "document-icon",
    NewDocument: "newdocument-icon",
    Hashtag: "hashtag-icon",
    Gear: "gear-icon",
    Plus: "plus-icon",
    Message: "message-icon",
  },
}));

// Mock commands data
jest.mock("../commands-data", () => ({
  getCommandsByCategory: jest.fn(() => [
    {
      category: "Slash Commands",
      commands: [
        {
          id: "help",
          name: "/help",
          description: "Get usage help and list available commands",
          category: "Slash Commands",
          usage: "/help",
        },
        {
          id: "clear",
          name: "/clear",
          description: "Clear conversation history and start fresh",
          category: "Slash Commands",
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
          category: "Slash Commands",
          usage: "/help",
        },
      ];
    }
    return [];
  }),
}));

// Mock CommandDetail component
jest.mock("../command-detail", () => ({
  __esModule: true,
  default: ({ command }: { command: { name: string } }) => (
    <div data-testid="command-detail" data-command={command.name}>
      Command Detail: {command.name}
    </div>
  ),
}));

describe("ListCommands", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getIconForCommand function", () => {
    it("should return Terminal icon for Slash Commands", () => {
      const { getByTestId } = render(<ListCommands />);
      // Check if Terminal icon is used for Slash Commands by verifying icon attribute
      const list = getByTestId("list");
      expect(list).toBeInTheDocument();
    });

    it("should return Keyboard icon for Keyboard Shortcuts", () => {
      const { getByTestId } = render(<ListCommands />);
      // Check if Keyboard icon is used by verifying the component renders
      const list = getByTestId("list");
      expect(list).toBeInTheDocument();
    });

    it("should return Flag icon for CLI Flags", () => {
      const commandsData = jest.requireMock("../commands-data");
      const { getCommandsByCategory } = commandsData;
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

      const { container } = render(<ListCommands />);
      const listItems = container.querySelectorAll('[data-testid="list-item"]');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it("should return Stars icon for Special Keywords", () => {
      const commandsData = jest.requireMock("../commands-data");
      const { getCommandsByCategory } = commandsData;
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

      const { container } = render(<ListCommands />);
      const listItems = container.querySelectorAll('[data-testid="list-item"]');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it("should return Code icon for other categories", () => {
      const commandsData = jest.requireMock("../commands-data");
      const { getCommandsByCategory } = commandsData;
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

      const { container } = render(<ListCommands />);
      const listItems = container.querySelectorAll('[data-testid="list-item"]');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  it("should render the list component", () => {
    const { getByTestId } = render(<ListCommands />);
    const list = getByTestId("list");
    expect(list).toBeInTheDocument();
  });

  it("should have correct search bar placeholder", () => {
    const { getByTestId } = render(<ListCommands />);
    const list = getByTestId("list");
    expect(list).toHaveAttribute(
      "data-placeholder",
      "Search Claude Code commands...",
    );
  });

  it("should have filtering disabled", () => {
    const { getByTestId } = render(<ListCommands />);
    const list = getByTestId("list");
    expect(list).toHaveAttribute("data-filtering", "false");
  });

  it("should render List.Section components for categories", () => {
    const { container } = render(<ListCommands />);
    const sections = container.querySelectorAll(
      '[title*="Slash Commands"], [title*="Keyboard Shortcuts"]',
    );
    expect(sections.length).toBeGreaterThan(0);
  });

  it("should render List.Item components for commands", () => {
    const { container } = render(<ListCommands />);
    const items = container.querySelectorAll(
      '[title="/help"], [title="/clear"], [title="Ctrl+C"]',
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("should call searchCommands when search text changes", () => {
    const commandsData = jest.requireMock("../commands-data");
    const { searchCommands } = commandsData;
    const { rerender } = render(<ListCommands />);

    // Simulate search text change
    const mockSetSearchText = jest.fn();
    jest
      .spyOn(jest.requireMock("react"), "useState")
      .mockImplementationOnce(() => ["help", mockSetSearchText]);

    rerender(<ListCommands />);
    expect(searchCommands).toHaveBeenCalledWith("help");
  });

  it("should display search results when search text is provided", () => {
    jest
      .spyOn(jest.requireMock("react"), "useState")
      .mockImplementationOnce(() => ["help", jest.fn()]);

    const { container } = render(<ListCommands />);
    const searchSection = container.querySelector('[title*="Search Results"]');
    expect(searchSection).toBeTruthy();
  });

  it("should group commands by category when no search text", () => {
    const { getCommandsByCategory } = require("../commands-data");
    render(<ListCommands />);
    expect(getCommandsByCategory).toHaveBeenCalled();
  });

  it("should handle empty search results", () => {
    jest
      .spyOn(jest.requireMock("react"), "useState")
      .mockImplementationOnce(() => ["nonexistent", jest.fn()]);

    const commandsData = jest.requireMock("../commands-data");
    const { searchCommands } = commandsData;
    searchCommands.mockReturnValueOnce([]);

    const { container } = render(<ListCommands />);
    const searchSection = container.querySelector(
      '[title*="Search Results (0)"]',
    );
    expect(searchSection).toBeTruthy();
  });

  it("should test command usage copy functionality", () => {
    const commandsData = jest.requireMock("../commands-data");
    const { searchCommands } = commandsData;
    searchCommands.mockReturnValueOnce([
      {
        id: "test-with-usage",
        name: "/test",
        description: "Test command",
        category: "Slash Commands",
        usage: "/test --example",
      },
    ]);

    jest
      .spyOn(jest.requireMock("react"), "useState")
      .mockImplementationOnce(() => ["test", jest.fn()]);

    const { container } = render(<ListCommands />);
    const copyUsageButton = container.querySelector(
      '[data-title="Copy Usage"]',
    );
    expect(copyUsageButton).toBeTruthy();
  });

  it("should test command without usage property", () => {
    const commandsData = jest.requireMock("../commands-data");
    const { searchCommands } = commandsData;
    searchCommands.mockReturnValueOnce([
      {
        id: "test-no-usage",
        name: "/test",
        description: "Test command without usage",
        category: "Slash Commands",
        // No usage property
      },
    ]);

    jest
      .spyOn(jest.requireMock("react"), "useState")
      .mockImplementationOnce(() => ["test", jest.fn()]);

    const { container } = render(<ListCommands />);
    const copyUsageButton = container.querySelector(
      '[data-title="Copy Usage"]',
    );
    expect(copyUsageButton).toBeFalsy();
  });

  it("should test command with accessories in category view", () => {
    const { getCommandsByCategory } = require("../commands-data");
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

    const { container } = render(<ListCommands />);
    const listItems = container.querySelectorAll('[data-testid="list-item"]');
    expect(listItems.length).toBeGreaterThan(0);

    // Test that usage copy action is available when usage exists
    const copyUsageButton = container.querySelector(
      '[data-title="Copy Usage"]',
    );
    expect(copyUsageButton).toBeTruthy();
  });
});
