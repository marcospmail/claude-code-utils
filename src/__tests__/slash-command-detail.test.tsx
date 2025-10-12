/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SlashCommandDetail from "../commands/browse-commands/detail";
import { SlashCommand } from "../utils/slash-commands";

// Mock Raycast API
jest.mock("@raycast/api");

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

    const copyAction = screen.getByTestId("action-copy-command-content");
    expect(copyAction).toHaveAttribute("data-title", "Copy Command Content");
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
