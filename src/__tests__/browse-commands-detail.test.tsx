/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import SlashCommandDetail from "../commands/browse-commands/detail";
import { SlashCommand } from "../utils/commands";

// Mock Raycast API
jest.mock("@raycast/api", () => ({
  Detail: ({
    markdown,
    navigationTitle,
    actions,
  }: {
    markdown: string;
    navigationTitle: string;
    actions: React.ReactNode;
  }) => (
    <div
      data-testid="detail"
      data-markdown={markdown}
      data-navigation-title={navigationTitle}
    >
      {actions}
    </div>
  ),
  ActionPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="action-panel">{children}</div>
  ),
  Action: {
    CopyToClipboard: ({ title }: { title: string }) => (
      <button data-testid="action-copy" data-title={title}>
        {title}
      </button>
    ),
    ShowInFinder: () => <button data-testid="action-show-finder" />,
    OpenWith: () => <button data-testid="action-open-with" />,
  },
  Icon: {
    Clipboard: "clipboard-icon",
  },
}));

describe("SlashCommandDetail", () => {
  const mockCommand: SlashCommand = {
    id: "test-command",
    name: "Test Command",
    content: "# Test Command\n\nThis is a test command.",
    filePath: "/path/to/test-command.md",
  };

  it("should render command detail", () => {
    render(<SlashCommandDetail command={mockCommand} />);

    const detail = screen.getByTestId("detail");
    expect(detail).toBeInTheDocument();
  });

  it("should display command name in navigation title", () => {
    render(<SlashCommandDetail command={mockCommand} />);

    const detail = screen.getByTestId("detail");
    expect(detail).toHaveAttribute("data-navigation-title", "Test Command");
  });

  it("should include command name and content in markdown", () => {
    render(<SlashCommandDetail command={mockCommand} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("# Test Command");
    expect(markdown).toContain("# Test Command\n\nThis is a test command.");
    expect(markdown).toContain("```markdown");
  });

  it("should render copy action", () => {
    render(<SlashCommandDetail command={mockCommand} />);

    const copyActions = screen.getAllByTestId("action-copy");
    expect(copyActions).toHaveLength(2);
    expect(copyActions[0]).toHaveAttribute("data-title", "Copy Command Name");
    expect(copyActions[1]).toHaveAttribute(
      "data-title",
      "Copy Command Content",
    );
  });

  it("should render show in finder action", () => {
    render(<SlashCommandDetail command={mockCommand} />);

    expect(screen.getByTestId("action-show-finder")).toBeInTheDocument();
  });

  it("should render open with action", () => {
    render(<SlashCommandDetail command={mockCommand} />);

    expect(screen.getByTestId("action-open-with")).toBeInTheDocument();
  });

  it("should handle special characters in command content", () => {
    const specialCommand: SlashCommand = {
      id: "special-command",
      name: "Special Command",
      content: "# Special\n\n`code` & <tags> $variables",
      filePath: "/path/to/special-command.md",
    };

    render(<SlashCommandDetail command={specialCommand} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("`code` & <tags> $variables");
  });
});
