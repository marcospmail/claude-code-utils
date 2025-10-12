/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgentDetail from "../commands/browse-agents/detail";
import { Agent } from "../utils/agents";

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

describe("AgentDetail", () => {
  const mockAgent: Agent = {
    id: "test-agent",
    name: "Test Agent",
    content: "# Test Agent\n\nThis is a test agent.",
    filePath: "/path/to/test-agent.md",
  };

  it("should render agent detail", () => {
    render(<AgentDetail agent={mockAgent} />);

    const detail = screen.getByTestId("detail");
    expect(detail).toBeInTheDocument();
  });

  it("should display agent name in navigation title", () => {
    render(<AgentDetail agent={mockAgent} />);

    const detail = screen.getByTestId("detail");
    expect(detail).toHaveAttribute("data-navigation-title", "Test Agent");
  });

  it("should include agent name and content in markdown", () => {
    render(<AgentDetail agent={mockAgent} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("# Test Agent");
    expect(markdown).toContain("# Test Agent\n\nThis is a test agent.");
    expect(markdown).toContain("```markdown");
  });

  it("should render copy action", () => {
    render(<AgentDetail agent={mockAgent} />);

    const copyActions = screen.getAllByTestId("action-copy");
    expect(copyActions).toHaveLength(2);
    expect(copyActions[0]).toHaveAttribute("data-title", "Copy Agent Name");
    expect(copyActions[1]).toHaveAttribute("data-title", "Copy Agent Content");
  });

  it("should render show in finder action", () => {
    render(<AgentDetail agent={mockAgent} />);

    expect(screen.getByTestId("action-show-finder")).toBeInTheDocument();
  });

  it("should render open with action", () => {
    render(<AgentDetail agent={mockAgent} />);

    expect(screen.getByTestId("action-open-with")).toBeInTheDocument();
  });

  it("should handle special characters in agent content", () => {
    const specialAgent: Agent = {
      id: "special-agent",
      name: "Special Agent",
      content: "# Special\n\n`code` & <tags> $variables",
      filePath: "/path/to/special-agent.md",
    };

    render(<AgentDetail agent={specialAgent} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("`code` & <tags> $variables");
  });
});
