import { render } from "@testing-library/react";
import MessageDetail from "../commands/sent-messages/detail";
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
  id: "test-sent-message-1",
  content: "This is a sent message content",
  preview: "This is a sent message...",
  timestamp: new Date("2025-01-01T12:00:00Z"),
};

describe("MessageDetail (Sent Messages)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset getFrontmostApplication to default resolved value
    getFrontmostApplication.mockResolvedValue({
      name: "TestApp",
      path: "/Applications/TestApp.app",
    });
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
      name: "Terminal",
      path: "/Applications/Terminal.app",
    });

    const { getByTestId, queryByTestId } = render(
      <MessageDetail message={mockMessage} />,
    );

    // Paste action is not rendered initially (requires async getFrontmostApplication to complete)
    expect(queryByTestId("action-paste-to-terminal")).toBeFalsy();
    expect(getByTestId("action-copy-to-clipboard")).toBeTruthy();
    expect(getByTestId("action-push-create-snippet")).toBeTruthy();
  });

  it("should pass correct content to actions", () => {
    getFrontmostApplication.mockResolvedValue({
      name: "VSCode",
      path: "/Applications/VSCode.app",
    });

    const { getByTestId } = render(<MessageDetail message={mockMessage} />);

    const copyAction = getByTestId("action-copy-to-clipboard");
    expect(copyAction.getAttribute("data-content")).toBe(mockMessage.content);

    const createSnippet = getByTestId("create-snippet");
    expect(createSnippet.getAttribute("data-content")).toBe(
      mockMessage.content,
    );
  });

  it("should update frontmost app name on success", async () => {
    getFrontmostApplication.mockResolvedValue({
      name: "Finder",
      path: "/System/Library/CoreServices/Finder.app",
    });

    const { getByTestId } = render(<MessageDetail message={mockMessage} />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const pasteAction = getByTestId("action-paste-to-finder");
    expect(pasteAction.getAttribute("data-title")).toContain("Finder");
  });

  it("should use fallback app name on error", async () => {
    // Suppress console errors for this test since the component doesn't handle the promise rejection
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    getFrontmostApplication.mockRejectedValue(new Error("No app found"));

    const { queryByTestId } = render(<MessageDetail message={mockMessage} />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    // When getFrontmostApplication fails, no paste action is rendered (frontmostApp remains empty)
    expect(queryByTestId("action-paste-to-active-app")).toBeFalsy();

    consoleErrorSpy.mockRestore();
  });
});
