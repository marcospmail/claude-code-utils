/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import CommandDetail from "../commands/cheatsheet/detail";
import { CommandItem } from "../commands-data";

// Mock Raycast API
jest.mock("@raycast/api", () => ({
  Detail: ({
    markdown,
    actions,
  }: {
    markdown: string;
    actions: React.ReactNode;
  }) => (
    <div data-testid="detail" data-markdown={markdown}>
      {actions}
    </div>
  ),
  ActionPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="action-panel">{children}</div>
  ),
  Action: {
    CopyToClipboard: ({
      title,
      content,
    }: {
      title: string;
      content: string;
    }) => (
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
    Clipboard: "clipboard-icon",
    Code: "code-icon",
    Document: "document-icon",
  },
}));

describe("CommandDetail", () => {
  const mockCommand: CommandItem = {
    id: "help",
    name: "/help",
    description: "Get usage help and list available commands",
    category: "Slash Commands",
    usage: "/help",
    examples: ["/help", "/help commands"],
  };

  const mockCommandWithoutOptional: CommandItem = {
    id: "clear",
    name: "/clear",
    description: "Clear conversation history",
    category: "Slash Commands",
  };

  it("should render the detail component", () => {
    const { getByTestId } = render(<CommandDetail command={mockCommand} />);
    const detail = getByTestId("detail");
    expect(detail).toBeInTheDocument();
  });

  it("should include command name in markdown", () => {
    const { getByTestId } = render(<CommandDetail command={mockCommand} />);
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).toContain("# /help");
  });

  it("should include description in markdown", () => {
    const { getByTestId } = render(<CommandDetail command={mockCommand} />);
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).toContain(
      "**Description:** Get usage help and list available commands",
    );
  });

  it("should show usage before description when both are present", () => {
    const { getByTestId } = render(<CommandDetail command={mockCommand} />);
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown") || "";

    const usageIndex = markdown.indexOf("**Usage:**");
    const descriptionIndex = markdown.indexOf("**Description:**");

    expect(usageIndex).toBeGreaterThan(-1);
    expect(descriptionIndex).toBeGreaterThan(-1);
    expect(usageIndex).toBeLessThan(descriptionIndex);
  });

  it("should include usage when provided", () => {
    const { getByTestId } = render(<CommandDetail command={mockCommand} />);
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).toContain("**Usage:**");
    expect(markdown).toContain("/help");
  });

  it("should include examples when provided", () => {
    const { getByTestId } = render(<CommandDetail command={mockCommand} />);
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).toContain("**Examples:**");
    expect(markdown).toContain("/help commands");
  });

  it("should not include usage section when not provided", () => {
    const { getByTestId } = render(
      <CommandDetail command={mockCommandWithoutOptional} />,
    );
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).not.toContain("**Usage:**");
  });

  it("should not include examples section when not provided", () => {
    const { getByTestId } = render(
      <CommandDetail command={mockCommandWithoutOptional} />,
    );
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).not.toContain("**Examples:**");
  });

  it("should render copy command action", () => {
    const { getAllByTestId } = render(<CommandDetail command={mockCommand} />);
    const copyActions = getAllByTestId("action-copy");
    const copyCommandAction = copyActions.find(
      (action) => action.getAttribute("data-title") === "Copy Command",
    );
    expect(copyCommandAction).toBeInTheDocument();
    expect(copyCommandAction).toHaveAttribute("data-content", "/help");
  });

  it("should render copy usage action when usage is provided", () => {
    const { getAllByTestId } = render(<CommandDetail command={mockCommand} />);
    const copyActions = getAllByTestId("action-copy");
    const copyUsageAction = copyActions.find(
      (action) => action.getAttribute("data-title") === "Copy Usage",
    );
    expect(copyUsageAction).toBeInTheDocument();
    expect(copyUsageAction).toHaveAttribute("data-content", "/help");
  });

  it("should render copy first example action when examples are provided", () => {
    const { getAllByTestId } = render(<CommandDetail command={mockCommand} />);
    const copyActions = getAllByTestId("action-copy");
    const copyExampleAction = copyActions.find(
      (action) => action.getAttribute("data-title") === "Copy First Example",
    );
    expect(copyExampleAction).toBeInTheDocument();
    expect(copyExampleAction).toHaveAttribute("data-content", "/help");
  });

  it("should not render copy usage action when usage is not provided", () => {
    const { queryByText } = render(
      <CommandDetail command={mockCommandWithoutOptional} />,
    );
    const copyUsageAction = queryByText("Copy Usage");
    expect(copyUsageAction).not.toBeInTheDocument();
  });

  it("should not render copy example action when examples are not provided", () => {
    const { queryByText } = render(
      <CommandDetail command={mockCommandWithoutOptional} />,
    );
    const copyExampleAction = queryByText("Copy First Example");
    expect(copyExampleAction).not.toBeInTheDocument();
  });

  it("should handle commands with special characters", () => {
    const specialCommand: CommandItem = {
      id: "ctrl-c",
      name: "Ctrl+C",
      description: "Cancel current input",
      category: "Keyboard Shortcuts",
      usage: "Ctrl+C",
    };

    const { getByTestId } = render(<CommandDetail command={specialCommand} />);
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).toContain("# Ctrl+C");
    expect(markdown).toContain("Ctrl+C");
  });

  it("should format markdown with code blocks for usage", () => {
    const { getByTestId } = render(<CommandDetail command={mockCommand} />);
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).toContain("```bash");
    expect(markdown).toContain("```");
  });

  it("should handle multiple examples", () => {
    const multiExampleCommand: CommandItem = {
      id: "test",
      name: "test-command",
      description: "Test command",
      category: "Test",
      examples: ["example1", "example2", "example3"],
    };

    const { getByTestId } = render(
      <CommandDetail command={multiExampleCommand} />,
    );
    const detail = getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");
    expect(markdown).toContain("example1");
    expect(markdown).toContain("example2");
    expect(markdown).toContain("example3");
  });
});
