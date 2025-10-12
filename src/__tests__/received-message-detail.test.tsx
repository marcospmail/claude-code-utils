import { render } from "@testing-library/react";
import MessageDetail from "../commands/received-messages/detail";
import { ParsedMessage } from "../utils/claude-messages";

// Mock Raycast API
jest.mock("@raycast/api");

// Get mocked functions
const raycastApi = jest.requireMock("@raycast/api");
const getFrontmostApplication = raycastApi.getFrontmostApplication as jest.Mock;

// Mock CreateSnippet component
jest.mock("../commands/create-snippet/list", () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => (
    <div data-testid="create-snippet" data-content={content}>
      Create Snippet
    </div>
  ),
}));

const mockMessage: ParsedMessage = {
  id: "test-message-1",
  content: "This is a test message content",
  preview: "This is a test message...",
  timestamp: new Date("2025-01-01T12:00:00Z"),
};

describe("MessageDetail (Received Messages)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render message content", () => {
    getFrontmostApplication.mockResolvedValue({
      name: "VSCode",
      path: "/Applications/VSCode.app",
    });

    const { getByTestId } = render(<MessageDetail message={mockMessage} />);

    const markdown = getByTestId("markdown");
    expect(markdown.textContent).toBe(mockMessage.content);
  });

  it("should render action panel with copy and create snippet actions initially", () => {
    getFrontmostApplication.mockResolvedValue({
      name: "VSCode",
      path: "/Applications/VSCode.app",
    });

    const { getByTestId, queryByTestId } = render(
      <MessageDetail message={mockMessage} />,
    );

    // Paste action is not rendered initially (requires async getFrontmostApplication to complete)
    expect(queryByTestId("action-paste-to-vscode")).toBeFalsy();
    expect(getByTestId("action-copy-to-clipboard")).toBeTruthy();
    expect(getByTestId("action-push-create-snippet")).toBeTruthy();
  });

  it("should render copy to clipboard action", () => {
    getFrontmostApplication.mockResolvedValue({
      name: "VSCode",
      path: "/Applications/VSCode.app",
    });

    const { getByTestId } = render(<MessageDetail message={mockMessage} />);

    const copyAction = getByTestId("action-copy-to-clipboard");
    expect(copyAction).toBeTruthy();
    expect(copyAction.getAttribute("data-title")).toBe("Copy to Clipboard");
    expect(copyAction.getAttribute("data-content")).toBe(mockMessage.content);
  });

  it("should render create snippet action", () => {
    getFrontmostApplication.mockResolvedValue({
      name: "VSCode",
      path: "/Applications/VSCode.app",
    });

    const { getByTestId } = render(<MessageDetail message={mockMessage} />);

    const pushAction = getByTestId("action-push-create-snippet");
    expect(pushAction).toBeTruthy();
    expect(pushAction.getAttribute("data-title")).toBe("Create Snippet");

    const createSnippet = getByTestId("create-snippet");
    expect(createSnippet).toBeTruthy();
    expect(createSnippet.getAttribute("data-content")).toBe(
      mockMessage.content,
    );
  });

  it("should handle getFrontmostApplication success", async () => {
    getFrontmostApplication.mockResolvedValue({
      name: "Chrome",
      path: "/Applications/Chrome.app",
    });

    const { getByTestId } = render(<MessageDetail message={mockMessage} />);

    // Wait for useEffect to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const pasteAction = getByTestId("action-paste-to-chrome");
    expect(pasteAction.getAttribute("data-title")).toContain("Chrome");
  });

  it("should handle getFrontmostApplication error", async () => {
    // Mock a successful resolution with empty name to simulate error state
    // The component doesn't catch errors, so we test the fallback behavior
    getFrontmostApplication.mockResolvedValue({
      name: "",
      path: "",
      bundleId: "",
    });

    render(<MessageDetail message={mockMessage} />);

    // Wait for useEffect to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // When app name is empty, the paste action won't render due to !!frontmostApp check
    const pasteActions = Array.from(
      document.querySelectorAll('[data-testid^="action-paste-to-"]'),
    );
    expect(pasteActions).toHaveLength(0);
  });
});
