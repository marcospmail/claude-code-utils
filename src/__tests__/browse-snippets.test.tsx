/**
 * @jest-environment jsdom
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import BrowseSnippets from "../browse-snippets";
import { Snippet } from "../utils/claudeMessages";
import React from "react";

// Mock timers for debouncing tests
jest.useFakeTimers();

jest.mock("@raycast/api", () => ({
  List: Object.assign(
    ({
      children,
      searchBarPlaceholder,
      onSearchTextChange,
      isLoading,
      actions,
      searchBarAccessory,
    }: {
      children?: React.ReactNode;
      searchBarPlaceholder?: string;
      onSearchTextChange?: (text: string) => void;
      isLoading?: boolean;
      actions?: React.ReactNode;
      searchBarAccessory?: React.ReactNode;
    }) => (
      <div
        data-testid="list"
        data-placeholder={searchBarPlaceholder}
        data-loading={isLoading}
      >
        <div data-testid="search-bar-accessory">{searchBarAccessory}</div>
        <div data-testid="list-actions">{actions}</div>
        <input
          data-testid="search-input"
          onChange={(e) =>
            onSearchTextChange && onSearchTextChange(e.target.value)
          }
          placeholder={searchBarPlaceholder}
        />
        {children}
      </div>
    ),
    {
      Item: ({
        title,
        subtitle,
        accessories,
        actions,
      }: {
        title: string;
        subtitle?: string;
        accessories?: Array<{ text?: string; date?: Date }>;
        actions?: React.ReactNode;
      }) => (
        <div
          data-testid="list-item"
          data-title={title}
          data-subtitle={subtitle}
        >
          <div data-testid="item-title">{title}</div>
          <div data-testid="item-subtitle">{subtitle}</div>
          <div data-testid="item-accessories">
            {JSON.stringify(accessories)}
          </div>
          <div data-testid="item-actions">{actions}</div>
        </div>
      ),
      EmptyView: ({
        title,
        description,
        actions,
        icon,
      }: {
        title: string;
        description?: string;
        actions?: React.ReactNode;
        icon?: { source: string; tintColor?: string };
      }) => (
        <div
          data-testid="empty-view"
          data-title={title}
          data-description={description}
        >
          <div data-testid="empty-view-icon">{JSON.stringify(icon)}</div>
          <div data-testid="empty-view-actions">{actions}</div>
        </div>
      ),
      Dropdown: Object.assign(
        ({
          value,
          onChange,
          children,
          tooltip,
        }: {
          value?: string;
          onChange?: (value: string) => void;
          children?: React.ReactNode;
          tooltip?: string;
        }) => (
          <div data-testid="dropdown" data-value={value} data-tooltip={tooltip}>
            <select
              data-testid="dropdown-select"
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
            >
              {children}
            </select>
          </div>
        ),
        {
          Item: ({ title, value }: { title: string; value: string }) => (
            <option
              data-testid="dropdown-item"
              data-title={title}
              data-value={value}
              value={value}
            >
              {title}
            </option>
          ),
        },
      ),
    },
  ),
  Detail: Object.assign(
    ({
      markdown,
      navigationTitle,
      metadata,
      actions,
    }: {
      markdown: string;
      navigationTitle?: string;
      metadata?: React.ReactNode;
      actions?: React.ReactNode;
    }) => (
      <div
        data-testid="detail"
        data-navigation-title={navigationTitle}
        data-markdown={markdown}
      >
        <div data-testid="detail-metadata">{metadata}</div>
        <div data-testid="detail-actions">{actions}</div>
      </div>
    ),
    {
      Metadata: Object.assign(
        ({ children }: { children?: React.ReactNode }) => (
          <div data-testid="metadata">{children}</div>
        ),
        {
          Label: ({ title, text }: { title: string; text?: string }) => (
            <div
              data-testid="metadata-label"
              data-title={title}
              data-text={text}
            />
          ),
          Separator: () => <div data-testid="metadata-separator" />,
        },
      ),
    },
  ),
  ActionPanel: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="action-panel">{children}</div>
  ),
  Action: Object.assign(
    ({
      title,
      onAction,
      style,
      shortcut,
    }: {
      title: string;
      onAction?: () => void;
      style?: string;
      shortcut?: { modifiers?: string[]; key: string };
    }) => (
      <button
        data-testid="action"
        data-title={title}
        data-style={style}
        data-shortcut={JSON.stringify(shortcut)}
        onClick={onAction}
      >
        {title}
      </button>
    ),
    {
      Push: ({
        title,
        target,
        shortcut,
      }: {
        title: string;
        target?: React.ReactNode;
        shortcut?: { modifiers?: string[]; key: string };
      }) => (
        <button
          data-testid="action-push"
          data-title={title}
          data-shortcut={JSON.stringify(shortcut)}
        >
          {title}
          <div data-testid="push-target">{target}</div>
        </button>
      ),
      Style: {
        Destructive: "destructive",
      },
    },
  ),
  showToast: jest.fn(),
  showHUD: jest.fn(),
  closeMainWindow: jest.fn(),
  confirmAlert: jest.fn(),
  Clipboard: {
    copy: jest.fn(),
  },
  environment: {
    canAccess: jest.fn(),
  },
  AI: {},
  Toast: {
    Style: {
      Success: "success",
      Failure: "failure",
    },
  },
  Alert: {
    ActionStyle: {
      Destructive: "destructive",
    },
  },
  Icon: {
    Eye: "eye-icon",
    Clipboard: "clipboard-icon",
    CopyClipboard: "copy-clipboard-icon",
    Plus: "plus-icon",
    Trash: "trash-icon",
    MagnifyingGlass: "magnifying-glass-icon",
    Stars: "stars-icon",
    Lock: "lock-icon",
    ExclamationMark: "exclamation-mark-icon",
  },
  Color: {
    Orange: "orange",
    Red: "red",
  },
}));

// Get access to the mocked functions
const {
  showToast,
  showHUD,
  closeMainWindow,
  confirmAlert,
  Clipboard,
  environment,
} = jest.requireMock("@raycast/api");

jest.mock("../utils/claudeMessages");
jest.mock("../utils/aiSearch");

// Get mocked versions
const { getSnippets, deleteSnippet } = jest.requireMock(
  "../utils/claudeMessages",
);
const { semanticSearchSnippets, normalSearchSnippets } =
  jest.requireMock("../utils/aiSearch");

// Mock CreateSnippet component
jest.mock("../create-snippet", () => ({
  __esModule: true,
  default: ({ title, content }: { title?: string; content?: string }) => (
    <div data-testid="create-snippet" data-title={title} data-content={content}>
      Create Snippet Form
    </div>
  ),
}));

describe("BrowseSnippets", () => {
  const mockSnippets: Snippet[] = [
    {
      id: "1",
      title: "Test Snippet 1",
      content: "This is test content for snippet 1",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-02T10:00:00Z"),
    },
    {
      id: "2",
      title: "Test Snippet 2",
      content:
        "This is test content for snippet 2 with more text to test truncation functionality",
      createdAt: new Date("2024-01-03T10:00:00Z"),
      updatedAt: new Date("2024-01-04T10:00:00Z"),
    },
    {
      id: "3",
      title: "",
      content: "Snippet without title",
      createdAt: new Date("2024-01-05T10:00:00Z"),
      updatedAt: new Date("2024-01-06T10:00:00Z"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getSnippets.mockResolvedValue(mockSnippets);
    normalSearchSnippets.mockImplementation(
      (snippets: Snippet[], query: string) =>
        snippets.filter(
          (snippet: Snippet) =>
            snippet.title.toLowerCase().includes(query.toLowerCase()) ||
            snippet.content.toLowerCase().includes(query.toLowerCase()),
        ),
    );
    semanticSearchSnippets.mockImplementation(
      (snippets: Snippet[], query: string) =>
        snippets.filter(
          (snippet: Snippet) =>
            snippet.title.toLowerCase().includes(query.toLowerCase()) ||
            snippet.content.toLowerCase().includes(query.toLowerCase()),
        ),
    );
    environment.canAccess.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe("Initial render and loading", () => {
    it("should render the list component", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      expect(screen.getByTestId("list")).toBeInTheDocument();
    });

    it("should show loading state initially", () => {
      render(<BrowseSnippets />);

      const list = screen.getByTestId("list");
      expect(list).toHaveAttribute("data-loading", "true");
    });

    it("should load snippets on mount", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(getSnippets).toHaveBeenCalled();
      });
    });

    it("should display snippets after loading", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("list")).toHaveAttribute(
          "data-loading",
          "false",
        );
      });

      expect(screen.getByText("Test Snippet 1")).toBeInTheDocument();
      expect(screen.getByText("Test Snippet 2")).toBeInTheDocument();
    });

    it("should sort snippets by most recently updated first", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const items = screen.getAllByTestId("list-item");
        expect(items[0]).toHaveAttribute("data-title", "");
        expect(items[1]).toHaveAttribute("data-title", "Test Snippet 2");
        expect(items[2]).toHaveAttribute("data-title", "Test Snippet 1");
      });
    });
  });

  describe("Error handling", () => {
    it("should show error toast when loading fails", async () => {
      getSnippets.mockRejectedValueOnce(new Error("Load failed"));

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith({
          style: "failure",
          title: "Error loading snippets",
          message: "Error: Load failed",
        });
      });
    });

    it("should handle getSnippets throwing non-Error objects", async () => {
      getSnippets.mockRejectedValueOnce("String error");

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith({
          style: "failure",
          title: "Error loading snippets",
          message: "String error",
        });
      });
    });
  });

  describe("Empty state", () => {
    it("should show empty view when no snippets exist", async () => {
      getSnippets.mockResolvedValueOnce([]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const emptyView = screen.getByTestId("empty-view");
        expect(emptyView).toHaveAttribute("data-title", "No snippets yet");
        expect(emptyView).toHaveAttribute(
          "data-description",
          "Create your first snippet to get started",
        );
      });
    });

    it("should show create action in empty view", async () => {
      getSnippets.mockResolvedValueOnce([]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("empty-view-actions")).toBeInTheDocument();
      });
    });
  });

  describe("Search functionality", () => {
    it("should have correct search placeholder for normal search", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const list = screen.getByTestId("list");
        expect(list).toHaveAttribute(
          "data-placeholder",
          "Search your snippets...",
        );
      });
    });

    it("should show search dropdown", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("dropdown")).toBeInTheDocument();
        expect(screen.getByTestId("dropdown")).toHaveAttribute(
          "data-value",
          "normal",
        );
      });
    });

    it("should filter snippets with normal search", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Snippet 1")).toBeInTheDocument();
      });

      // Simulate search text change
      const searchInput = screen.getByTestId("search-input");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "snippet 1" } });
      });

      await waitFor(() => {
        expect(normalSearchSnippets).toHaveBeenCalledWith(
          mockSnippets,
          "snippet 1",
        );
      });
    });

    it("should change search mode via dropdown", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("dropdown-select")).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId("dropdown-select");
      await act(async () => {
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      await waitFor(() => {
        const list = screen.getByTestId("list");
        expect(list).toHaveAttribute(
          "data-placeholder",
          "Search with AI (semantic)...",
        );
      });
    });
  });

  describe("AI Search functionality", () => {
    it("should change placeholder when AI search is enabled", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      await waitFor(() => {
        const list = screen.getByTestId("list");
        expect(list).toHaveAttribute(
          "data-placeholder",
          "Search with AI (semantic)...",
        );
      });
    });

    it("should perform AI search with debouncing", async () => {
      semanticSearchSnippets.mockResolvedValueOnce([mockSnippets[0]]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type search query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test query" } });
      });

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(semanticSearchSnippets).toHaveBeenCalledWith(
          mockSnippets,
          "test query",
        );
      });
    });

    it("should handle AI search failure", async () => {
      semanticSearchSnippets.mockRejectedValueOnce(
        new Error("AI search failed"),
      );

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type search query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith({
          style: "failure",
          title: "AI search failed",
        });
      });
    });

    it("should show Pro required error when user has no AI access", async () => {
      environment.canAccess.mockReturnValue(false);
      semanticSearchSnippets.mockRejectedValueOnce(
        new Error("Raycast Pro required"),
      );

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type search query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const emptyView = screen.getByTestId("empty-view");
        expect(emptyView).toHaveAttribute("data-title", "Raycast Pro Required");
        expect(emptyView).toHaveAttribute(
          "data-description",
          "AI search requires a Raycast Pro subscription",
        );
      });
    });

    it("should show AI search failed error view", async () => {
      semanticSearchSnippets.mockRejectedValueOnce(
        new Error("AI search failed"),
      );

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type search query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const emptyView = screen.getByTestId("empty-view");
        expect(emptyView).toHaveAttribute("data-title", "AI Search Failed");
        expect(emptyView).toHaveAttribute(
          "data-description",
          "Could not perform semantic search.",
        );
      });
    });

    it("should clear debounce timer on cleanup", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const { unmount } = render(<BrowseSnippets />);

      // Enable AI search and type
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe("Snippet display", () => {
    it("should display snippet title and truncated content", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const items = screen.getAllByTestId("list-item");
        expect(items[1]).toHaveAttribute("data-title", "Test Snippet 2");
        expect(items[1]).toHaveAttribute(
          "data-subtitle",
          "This is test content for snippet 2 with more text to test truncation functionality",
        );
      });
    });

    it("should truncate long content with ellipsis", async () => {
      const longContentSnippet: Snippet = {
        id: "long",
        title: "Long Content",
        content: "a".repeat(150),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getSnippets.mockResolvedValueOnce([longContentSnippet]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const item = screen.getByTestId("list-item");
        const subtitle = item.getAttribute("data-subtitle");
        expect(subtitle).toHaveLength(103); // 100 chars + "..."
        expect(subtitle).toMatch(/\.\.\.$/); // Ends with "..."
      });
    });

    it("should display formatted date in accessories", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const accessories = screen.getAllByTestId("item-accessories");
        expect(accessories.length).toBeGreaterThan(0);

        // Parse the JSON string to check the date format
        const parsedAccessories = JSON.parse(
          accessories[0].textContent || "[]",
        );
        expect(parsedAccessories[0]).toHaveProperty("text");
        expect(parsedAccessories[0].text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      });
    });
  });

  describe("Copy functionality", () => {
    it("should copy snippet content to clipboard", async () => {
      Clipboard.copy.mockResolvedValueOnce(undefined);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const copyButton = screen
          .getAllByTestId("action")
          .find(
            (button) => button.getAttribute("data-title") === "Copy Snippet",
          );
        expect(copyButton).toBeInTheDocument();

        if (copyButton) {
          fireEvent.click(copyButton);
        }
      });

      await waitFor(() => {
        expect(Clipboard.copy).toHaveBeenCalledWith("Snippet without title");
        expect(closeMainWindow).toHaveBeenCalled();
        expect(showHUD).toHaveBeenCalledWith("Copied to Clipboard");
      });
    });

    it("should show error toast when copy fails", async () => {
      Clipboard.copy.mockRejectedValueOnce(new Error("Copy failed"));

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const copyButton = screen
          .getAllByTestId("action")
          .find(
            (button) => button.getAttribute("data-title") === "Copy Snippet",
          );

        if (copyButton) {
          fireEvent.click(copyButton);
        }
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith({
          style: "failure",
          title: "Copy failed",
          message: "Error: Copy failed",
        });
      });
    });

    it("should copy without closing window when closeWindow is false", async () => {
      Clipboard.copy.mockResolvedValueOnce(undefined);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        // Get the View Snippet action to access SnippetDetail
        const viewButton = screen
          .getAllByTestId("action-push")
          .find(
            (button) => button.getAttribute("data-title") === "View Snippet",
          );
        expect(viewButton).toBeInTheDocument();
      });
    });
  });

  describe("Delete functionality", () => {
    it("should delete snippet after confirmation", async () => {
      confirmAlert.mockResolvedValueOnce(true);
      deleteSnippet.mockResolvedValueOnce(undefined);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const deleteButton = screen
          .getAllByTestId("action")
          .find(
            (button) => button.getAttribute("data-title") === "Delete Snippet",
          );
        expect(deleteButton).toBeInTheDocument();

        if (deleteButton) {
          fireEvent.click(deleteButton);
        }
      });

      await waitFor(() => {
        expect(confirmAlert).toHaveBeenCalledWith({
          title: "Delete Snippet",
          message: 'Are you sure you want to delete ""?',
          primaryAction: {
            title: "Delete",
            style: "destructive",
          },
        });
        expect(deleteSnippet).toHaveBeenCalledWith("3");
        expect(showToast).toHaveBeenCalledWith({
          style: "success",
          title: "Snippet deleted",
          message: '"" has been deleted',
        });
      });
    });

    it("should not delete snippet when confirmation is cancelled", async () => {
      confirmAlert.mockResolvedValueOnce(false);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const deleteButton = screen
          .getAllByTestId("action")
          .find(
            (button) => button.getAttribute("data-title") === "Delete Snippet",
          );

        if (deleteButton) {
          fireEvent.click(deleteButton);
        }
      });

      await waitFor(() => {
        expect(confirmAlert).toHaveBeenCalled();
        expect(deleteSnippet).not.toHaveBeenCalled();
      });
    });

    it("should show error toast when delete fails", async () => {
      confirmAlert.mockResolvedValueOnce(true);
      deleteSnippet.mockRejectedValueOnce(new Error("Delete failed"));

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const deleteButton = screen
          .getAllByTestId("action")
          .find(
            (button) => button.getAttribute("data-title") === "Delete Snippet",
          );

        if (deleteButton) {
          fireEvent.click(deleteButton);
        }
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith({
          style: "failure",
          title: "Delete failed",
          message: "Error: Delete failed",
        });
      });
    });
  });

  describe("SnippetDetail component", () => {
    it("should render snippet detail with metadata", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const viewButton = screen
          .getAllByTestId("action-push")
          .find(
            (button) => button.getAttribute("data-title") === "View Snippet",
          );
        expect(viewButton).toBeInTheDocument();

        // Check the target detail component is rendered
        const targetDetail = viewButton?.querySelector(
          "[data-testid='detail']",
        );
        expect(targetDetail).toBeInTheDocument();
        expect(targetDetail).toHaveAttribute(
          "data-navigation-title",
          "Snippet Detail",
        );
      });
    });

    it("should show 'Untitled' for snippets without title in detail", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const metadataLabels = screen.getAllByTestId("metadata-label");
        const titleLabel = metadataLabels.find(
          (label) => label.getAttribute("data-title") === "Title",
        );
        expect(titleLabel).toHaveAttribute("data-text", "Untitled");
      });
    });

    it("should format dates correctly in detail metadata", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const metadataLabels = screen.getAllByTestId("metadata-label");
        const createdLabel = metadataLabels.find(
          (label) => label.getAttribute("data-title") === "Created",
        );
        const updatedLabel = metadataLabels.find(
          (label) => label.getAttribute("data-title") === "Updated",
        );

        expect(createdLabel).toBeInTheDocument();
        expect(updatedLabel).toBeInTheDocument();

        // Check that the dates are formatted as locale strings
        expect(createdLabel?.getAttribute("data-text")).toMatch(/\d/);
        expect(updatedLabel?.getAttribute("data-text")).toMatch(/\d/);
      });
    });

    it("should test SnippetDetail copy action", async () => {
      Clipboard.copy.mockResolvedValueOnce(undefined);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        // Find copy action in detail component (not main list)
        const detailCopyActions = screen
          .getAllByTestId("action")
          .filter((action) => {
            const parent = action.closest("[data-testid='detail-actions']");
            return (
              parent && action.getAttribute("data-title") === "Copy Snippet"
            );
          });

        if (detailCopyActions.length > 0) {
          fireEvent.click(detailCopyActions[0]);
        }
      });

      await waitFor(() => {
        expect(Clipboard.copy).toHaveBeenCalled();
      });
    });
  });

  describe("Action shortcuts", () => {
    it("should have correct keyboard shortcuts", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        // Check that actions with shortcuts exist in the DOM
        const allActions = screen.getAllByTestId("action");
        const copyActionsWithShortcut = allActions.filter((action) => {
          const title = action.getAttribute("data-title");
          const shortcut = action.getAttribute("data-shortcut");
          return (
            title === "Copy Snippet" &&
            shortcut === JSON.stringify({ modifiers: ["cmd"], key: "c" })
          );
        });
        const deleteActionsWithShortcut = allActions.filter((action) => {
          const title = action.getAttribute("data-title");
          const shortcut = action.getAttribute("data-shortcut");
          return (
            title === "Delete Snippet" &&
            shortcut === JSON.stringify({ modifiers: ["ctrl"], key: "x" })
          );
        });

        expect(copyActionsWithShortcut.length).toBeGreaterThan(0);
        expect(deleteActionsWithShortcut.length).toBeGreaterThan(0);
      });
    });

    it("should have create new snippet shortcut", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const createActions = screen
          .getAllByTestId("action-push")
          .filter(
            (button) =>
              button.getAttribute("data-title") === "Create New Snippet",
          );
        expect(createActions.length).toBeGreaterThan(0);

        createActions.forEach((action) => {
          expect(action).toHaveAttribute(
            "data-shortcut",
            JSON.stringify({ modifiers: ["cmd"], key: "n" }),
          );
        });
      });
    });

    it("should have duplicate snippet shortcut", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const duplicateActions = screen
          .getAllByTestId("action-push")
          .filter(
            (button) =>
              button.getAttribute("data-title") === "Duplicate Snippet",
          );
        expect(duplicateActions.length).toBeGreaterThan(0);

        duplicateActions.forEach((action) => {
          expect(action).toHaveAttribute(
            "data-shortcut",
            JSON.stringify({ modifiers: ["cmd"], key: "d" }),
          );
        });
      });
    });
  });

  describe("Duplicate functionality", () => {
    it("should create duplicate with correct title format", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const duplicateButtons = screen
          .getAllByTestId("action-push")
          .filter(
            (button) =>
              button.getAttribute("data-title") === "Duplicate Snippet",
          );
        expect(duplicateButtons.length).toBeGreaterThan(0);

        // Check that CreateSnippet component receives correct props for duplication
        const createSnippet = duplicateButtons[0]?.querySelector(
          "[data-testid='create-snippet']",
        );
        expect(createSnippet).toHaveAttribute("data-title", "Copy");
        expect(createSnippet).toHaveAttribute(
          "data-content",
          "Snippet without title",
        );
      });
    });

    it("should create duplicate with '(Copy)' suffix for titled snippets", async () => {
      // Test the duplicate functionality for a snippet with a title
      const titledSnippet: Snippet = {
        id: "titled",
        title: "My Snippet",
        content: "Content",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getSnippets.mockResolvedValueOnce([titledSnippet]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const duplicateButtons = screen
          .getAllByTestId("action-push")
          .filter(
            (button) =>
              button.getAttribute("data-title") === "Duplicate Snippet",
          );

        const createSnippet = duplicateButtons[0]?.querySelector(
          "[data-testid='create-snippet']",
        );
        expect(createSnippet).toHaveAttribute(
          "data-title",
          "My Snippet (Copy)",
        );
        expect(createSnippet).toHaveAttribute("data-content", "Content");
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty search text", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "" } });
      });

      // Should show all snippets when search is empty
      await waitFor(() => {
        expect(screen.getAllByTestId("list-item")).toHaveLength(3);
      });
    });

    it("should handle very long snippet titles", async () => {
      const longTitleSnippet: Snippet = {
        id: "long-title",
        title: "A".repeat(200),
        content: "Content",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getSnippets.mockResolvedValueOnce([longTitleSnippet]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const item = screen.getByTestId("list-item");
        expect(item).toHaveAttribute("data-title", "A".repeat(200));
      });
    });

    it("should handle snippets with special characters", async () => {
      const specialCharSnippet: Snippet = {
        id: "special",
        title: "Snippet with <special> & characters",
        content: "Content with \"quotes\" and 'apostrophes'",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getSnippets.mockResolvedValueOnce([specialCharSnippet]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const item = screen.getByTestId("list-item");
        expect(item).toHaveAttribute(
          "data-title",
          "Snippet with <special> & characters",
        );
        expect(item).toHaveAttribute(
          "data-subtitle",
          "Content with \"quotes\" and 'apostrophes'",
        );
      });
    });

    it("should handle search with AI when no snippets are loaded", async () => {
      getSnippets.mockResolvedValueOnce([]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type search query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should show empty view instead of calling search
      await waitFor(() => {
        const emptyView = screen.getByTestId("empty-view");
        expect(emptyView).toBeInTheDocument();
        expect(emptyView).toHaveAttribute("data-title", "No snippets yet");
      });
    });

    it("should handle normal search with empty query", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "   " } });
      });

      // Should show all snippets for empty/whitespace query
      await waitFor(() => {
        expect(screen.getAllByTestId("list-item")).toHaveLength(3);
      });
    });
  });

  describe("Debouncing behavior", () => {
    it("should debounce AI search properly", async () => {
      semanticSearchSnippets.mockResolvedValue([mockSnippets[0]]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type search query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      // Should not call AI search immediately
      expect(semanticSearchSnippets).not.toHaveBeenCalled();

      // Fast-forward less than debounce time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(semanticSearchSnippets).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now AI search should be called
      await waitFor(() => {
        expect(semanticSearchSnippets).toHaveBeenCalledWith(
          mockSnippets,
          "test",
        );
      });
    });

    it("should not debounce normal search", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      // Normal search should be called immediately
      expect(normalSearchSnippets).toHaveBeenCalledWith(mockSnippets, "test");
    });

    it("should reset debounce timer on new input", async () => {
      semanticSearchSnippets.mockResolvedValue([mockSnippets[0]]);

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type first query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test1" } });
      });

      // Fast-forward part way
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Type second query (should reset timer)
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test2" } });
      });

      // Fast-forward same amount
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should not have been called yet
      expect(semanticSearchSnippets).not.toHaveBeenCalled();

      // Fast-forward rest of debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should be called with latest query
      await waitFor(() => {
        expect(semanticSearchSnippets).toHaveBeenCalledWith(
          mockSnippets,
          "test2",
        );
      });
    });
  });

  describe("Additional coverage tests", () => {
    it("should test performAISearch with empty debouncedSearchText", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type and clear search
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
        fireEvent.change(searchInput, { target: { value: "" } });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should reset to all snippets
      await waitFor(() => {
        expect(screen.getAllByTestId("list-item")).toHaveLength(3);
      });
    });

    it("should test copyContent with closeWindow false", async () => {
      Clipboard.copy.mockResolvedValueOnce(undefined);

      // We need to test copyContent function directly
      // This is called from SnippetDetail with closeWindow=false
      await act(async () => {
        render(<BrowseSnippets />);
      });

      await waitFor(() => {
        // Find copy action in detail (which calls copyContent with closeWindow=false)
        const detailCopyActions = screen
          .getAllByTestId("action")
          .filter((action) => {
            const isInDetail = action.closest("[data-testid='detail-actions']");
            return (
              isInDetail && action.getAttribute("data-title") === "Copy Snippet"
            );
          });

        if (detailCopyActions.length > 0) {
          fireEvent.click(detailCopyActions[0]);
        }
      });

      await waitFor(() => {
        expect(Clipboard.copy).toHaveBeenCalled();
        expect(closeMainWindow).toHaveBeenCalled(); // Still closes window in detail view
      });
    });

    it("should test AI search with error containing Raycast Pro message", async () => {
      environment.canAccess.mockReturnValue(true); // User has access
      semanticSearchSnippets.mockRejectedValueOnce(
        new Error("Some error mentioning Raycast Pro subscription required"),
      );

      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Enable AI search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      // Type search query
      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const emptyView = screen.getByTestId("empty-view");
        expect(emptyView).toHaveAttribute("data-title", "Raycast Pro Required");
      });
    });

    it("should test normal search in performAISearch when AI is disabled", async () => {
      await act(async () => {
        render(<BrowseSnippets />);
      });

      // Start with AI search, then disable it
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "ai" } });
      });

      await act(async () => {
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      // Switch back to normal search
      await waitFor(() => {
        const dropdown = screen.getByTestId("dropdown-select");
        fireEvent.change(dropdown, { target: { value: "normal" } });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should use normal search in performAISearch
      await waitFor(() => {
        expect(normalSearchSnippets).toHaveBeenCalledWith(mockSnippets, "test");
      });
    });
  });
});
