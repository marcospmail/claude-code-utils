/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BrowseAgents from "../commands/browse-agents/list";
import * as agentsUtils from "../utils/agents";

// Mock Raycast API
jest.mock("@raycast/api");

// Mock agent-detail component
jest.mock("../commands/browse-agents/detail", () => ({
  __esModule: true,
  default: () => <div data-testid="agent-detail">Agent Detail</div>,
}));

// Mock agents utils
jest.mock("../utils/agents");

const mockGetAgents = agentsUtils.getAgents as jest.MockedFunction<
  typeof agentsUtils.getAgents
>;

describe("BrowseAgents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state initially", () => {
    mockGetAgents.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<BrowseAgents />);

    const list = screen.getByTestId("list");
    expect(list).toHaveAttribute("data-loading", "true");
  });

  it("should render agents list", async () => {
    const mockAgents = [
      {
        id: "test-agent",
        name: "Test Agent",
        content: "# Test Agent Content",
        filePath: "/path/to/test-agent.md",
      },
      {
        id: "another-agent",
        name: "Another Agent",
        content: "# Another Agent Content",
        filePath: "/path/to/another-agent.md",
      },
    ];

    mockGetAgents.mockResolvedValue(mockAgents);

    render(<BrowseAgents />);

    await waitFor(() => {
      const list = screen.getByTestId("list");
      expect(list).toHaveAttribute("data-loading", "false");
    });

    const items = screen.getAllByTestId("list-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("data-title", "Test Agent");
    expect(items[1]).toHaveAttribute("data-title", "Another Agent");
  });

  it("should show empty view when no agents found", async () => {
    mockGetAgents.mockResolvedValue([]);

    render(<BrowseAgents />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-view")).toBeInTheDocument();
    });

    expect(screen.getByTestId("empty-title")).toHaveTextContent(
      "No Agents Found",
    );
    expect(screen.getByTestId("empty-description")).toHaveTextContent(
      "No agent files found in ~/.claude/agents",
    );
  });

  it("should show error view on failure", async () => {
    mockGetAgents.mockRejectedValue(new Error("Failed to read directory"));

    render(<BrowseAgents />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-view")).toBeInTheDocument();
    });

    expect(screen.getByTestId("empty-title")).toHaveTextContent(
      "Error Loading Agents",
    );
    expect(screen.getByTestId("empty-description")).toHaveTextContent(
      "Failed to load agents",
    );
  });

  it("should render actions for each agent", async () => {
    const mockAgents = [
      {
        id: "test-agent",
        name: "Test Agent",
        content: "# Test Agent Content",
        filePath: "/path/to/test-agent.md",
      },
    ];

    mockGetAgents.mockResolvedValue(mockAgents);

    render(<BrowseAgents />);

    await waitFor(() => {
      expect(screen.getByTestId("action-panel")).toBeInTheDocument();
    });

    const pushAction = screen.getByTestId("action-push-view-agent-details");
    expect(pushAction).toHaveAttribute("data-title", "View Agent Details");

    const copyAction = screen.getByTestId("action-copy-agent-content");
    expect(copyAction).toHaveAttribute("data-title", "Copy Agent Content");

    expect(screen.getByTestId("action-show-finder")).toBeInTheDocument();
  });

  it("should display agent filename as accessory", async () => {
    const mockAgents = [
      {
        id: "test-agent",
        name: "Test Agent",
        content: "# Test Agent Content",
        filePath: "/path/to/test-agent.md",
      },
    ];

    mockGetAgents.mockResolvedValue(mockAgents);

    render(<BrowseAgents />);

    await waitFor(() => {
      const item = screen.getByTestId("list-item");
      const accessories = JSON.parse(
        item.getAttribute("data-accessories") || "[]",
      );
      expect(accessories).toEqual([{ text: "test-agent.md" }]);
    });
  });
});
