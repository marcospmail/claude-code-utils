/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ClaudeCodeHelper from "../index";

// Mock Raycast API
jest.mock("@raycast/api", () => ({
  List: Object.assign(
    ({
      children,
      searchBarPlaceholder,
    }: {
      children: React.ReactNode;
      searchBarPlaceholder: string;
    }) => (
      <div data-testid="list" data-placeholder={searchBarPlaceholder}>
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
        <div data-testid="list-section" data-title={title}>
          {children}
        </div>
      ),
      Item: ({
        title,
        subtitle,
        icon,
        actions,
        ...props
      }: {
        title: string;
        subtitle: string;
        icon: string;
        actions: React.ReactNode;
        [key: string]: unknown;
      }) => (
        <div
          data-testid="list-item"
          data-title={title}
          data-subtitle={subtitle}
          data-icon={icon}
          {...props}
        >
          {actions}
        </div>
      ),
    },
  ),
  ActionPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="action-panel">{children}</div>
  ),
  Action: {
    Push: ({
      title,
      target,
    }: {
      title: string;
      target: { type?: { displayName?: string; name?: string } };
    }) => (
      <button
        data-testid="action-push"
        data-title={title}
        data-target={target?.type?.displayName || target?.type?.name}
      >
        {title}
      </button>
    ),
  },
  Icon: {
    Message: "message-icon",
    Plus: "plus-icon",
    Document: "document-icon",
    Terminal: "terminal-icon",
  },
}));

// Mock imported components
jest.mock("../received-messages", () => {
  const MockReceivedMessages = () => (
    <div data-testid="received-messages">Received Messages Component</div>
  );
  MockReceivedMessages.displayName = "ReceivedMessages";
  return MockReceivedMessages;
});

jest.mock("../sent-messages", () => {
  const MockSentMessages = () => (
    <div data-testid="sent-messages">Sent Messages Component</div>
  );
  MockSentMessages.displayName = "SentMessages";
  return MockSentMessages;
});

jest.mock("../create-snippet", () => {
  const MockCreateSnippet = () => (
    <div data-testid="create-snippet">Create Snippet Component</div>
  );
  MockCreateSnippet.displayName = "CreateSnippet";
  return MockCreateSnippet;
});

jest.mock("../list-snippets", () => {
  const MockListSnippets = () => (
    <div data-testid="list-snippets">List Snippets Component</div>
  );
  MockListSnippets.displayName = "ListSnippets";
  return MockListSnippets;
});

jest.mock("../list-commands", () => {
  const MockListCommands = () => (
    <div data-testid="list-commands">List Commands Component</div>
  );
  MockListCommands.displayName = "ListCommands";
  return MockListCommands;
});

describe("ClaudeCodeHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the main list component", () => {
    const { getByTestId } = render(<ClaudeCodeHelper />);
    const list = getByTestId("list");
    expect(list).toBeInTheDocument();
  });

  it("should have correct search bar placeholder", () => {
    const { getByTestId } = render(<ClaudeCodeHelper />);
    const list = getByTestId("list");
    expect(list).toHaveAttribute(
      "data-placeholder",
      "Search Claude Code helper options...",
    );
  });

  describe("Commands section", () => {
    it("should render Commands section", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const sections = getAllByTestId("list-section");
      const commandsSection = sections.find(
        (section) => section.getAttribute("data-title") === "Commands",
      );
      expect(commandsSection).toBeInTheDocument();
    });

    it("should render list-commands option", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      const listCommandsItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Commands Cheat Sheet",
      );
      expect(listCommandsItem).toBeInTheDocument();
      expect(listCommandsItem).toHaveAttribute(
        "data-subtitle",
        "Browse all Claude Code commands and shortcuts",
      );
      expect(listCommandsItem).toHaveAttribute("data-icon", "terminal-icon");
    });

    it("should have action panel for list-commands option", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      const listCommandsItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Commands Cheat Sheet",
      );
      const actionPanel = listCommandsItem?.querySelector(
        '[data-testid="action-panel"]',
      );
      expect(actionPanel).toBeInTheDocument();
    });

    it("should have Push action for list-commands option", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const pushActions = getAllByTestId("action-push");
      const listCommandsAction = pushActions.find(
        (action) => action.getAttribute("data-target") === "ListCommands",
      );
      expect(listCommandsAction).toBeInTheDocument();
      expect(listCommandsAction).toHaveAttribute("data-title", "Open");
    });
  });

  describe("Snippets section", () => {
    it("should render Snippets section", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const sections = getAllByTestId("list-section");
      const snippetsSection = sections.find(
        (section) => section.getAttribute("data-title") === "Snippets",
      );
      expect(snippetsSection).toBeInTheDocument();
    });

    it("should render create-snippet option", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      const createSnippetItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Create Snippets",
      );
      expect(createSnippetItem).toBeInTheDocument();
      expect(createSnippetItem).toHaveAttribute(
        "data-subtitle",
        "Create a new snippet",
      );
      expect(createSnippetItem).toHaveAttribute("data-icon", "plus-icon");
    });

    it("should render list-snippets option", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      const listSnippetsItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - List Snippets",
      );
      expect(listSnippetsItem).toBeInTheDocument();
      expect(listSnippetsItem).toHaveAttribute(
        "data-subtitle",
        "View and manage your snippets",
      );
      expect(listSnippetsItem).toHaveAttribute("data-icon", "document-icon");
    });

    it("should have action panels for snippet options", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");

      const createSnippetItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Create Snippets",
      );
      const listSnippetsItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - List Snippets",
      );

      expect(
        createSnippetItem?.querySelector('[data-testid="action-panel"]'),
      ).toBeInTheDocument();
      expect(
        listSnippetsItem?.querySelector('[data-testid="action-panel"]'),
      ).toBeInTheDocument();
    });

    it("should have Push actions for snippet options", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const pushActions = getAllByTestId("action-push");

      const createSnippetAction = pushActions.find(
        (action) => action.getAttribute("data-target") === "CreateSnippet",
      );
      const listSnippetsAction = pushActions.find(
        (action) => action.getAttribute("data-target") === "ListSnippets",
      );

      expect(createSnippetAction).toBeInTheDocument();
      expect(createSnippetAction).toHaveAttribute("data-title", "Open");
      expect(listSnippetsAction).toBeInTheDocument();
      expect(listSnippetsAction).toHaveAttribute("data-title", "Open");
    });
  });

  describe("Conversations section", () => {
    it("should render Conversations section", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const sections = getAllByTestId("list-section");
      const conversationsSection = sections.find(
        (section) => section.getAttribute("data-title") === "Conversations",
      );
      expect(conversationsSection).toBeInTheDocument();
    });

    it("should render received-messages option", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      const receivedMessagesItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Received Messages",
      );
      expect(receivedMessagesItem).toBeInTheDocument();
      expect(receivedMessagesItem).toHaveAttribute(
        "data-subtitle",
        "View messages you received from Claude",
      );
      expect(receivedMessagesItem).toHaveAttribute("data-icon", "message-icon");
    });

    it("should render sent-messages option", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      const sentMessagesItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Sent Messages",
      );
      expect(sentMessagesItem).toBeInTheDocument();
      expect(sentMessagesItem).toHaveAttribute(
        "data-subtitle",
        "View messages you sent to Claude",
      );
      expect(sentMessagesItem).toHaveAttribute("data-icon", "message-icon");
    });

    it("should have action panels for conversation options", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");

      const receivedMessagesItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Received Messages",
      );
      const sentMessagesItem = items.find(
        (item) =>
          item.getAttribute("data-title") ===
          "Claude Code Utils - Sent Messages",
      );

      expect(
        receivedMessagesItem?.querySelector('[data-testid="action-panel"]'),
      ).toBeInTheDocument();
      expect(
        sentMessagesItem?.querySelector('[data-testid="action-panel"]'),
      ).toBeInTheDocument();
    });

    it("should have Push actions for conversation options", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const pushActions = getAllByTestId("action-push");

      const receivedMessagesAction = pushActions.find(
        (action) => action.getAttribute("data-target") === "ReceivedMessages",
      );
      const sentMessagesAction = pushActions.find(
        (action) => action.getAttribute("data-target") === "SentMessages",
      );

      expect(receivedMessagesAction).toBeInTheDocument();
      expect(receivedMessagesAction).toHaveAttribute("data-title", "Open");
      expect(sentMessagesAction).toBeInTheDocument();
      expect(sentMessagesAction).toHaveAttribute("data-title", "Open");
    });
  });

  describe("Section ordering", () => {
    it("should render sections in correct order", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const sections = getAllByTestId("list-section");
      const sectionTitles = sections.map((section) =>
        section.getAttribute("data-title"),
      );

      expect(sectionTitles).toEqual(["Commands", "Snippets", "Conversations"]);
    });
  });

  describe("Options data structure", () => {
    it("should have all required properties for conversationOptions", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");

      const conversationItems = items.filter((item) => {
        const title = item.getAttribute("data-title");
        return (
          title?.includes("Received Messages") ||
          title?.includes("Sent Messages")
        );
      });

      expect(conversationItems).toHaveLength(2);

      conversationItems.forEach((item) => {
        expect(item.getAttribute("data-title")).toBeTruthy();
        expect(item.getAttribute("data-subtitle")).toBeTruthy();
        expect(item.getAttribute("data-icon")).toBeTruthy();
      });
    });

    it("should have all required properties for snippetsOptions", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");

      const snippetItems = items.filter((item) => {
        const title = item.getAttribute("data-title");
        return (
          title?.includes("Create Snippets") || title?.includes("List Snippets")
        );
      });

      expect(snippetItems).toHaveLength(2);

      snippetItems.forEach((item) => {
        expect(item.getAttribute("data-title")).toBeTruthy();
        expect(item.getAttribute("data-subtitle")).toBeTruthy();
        expect(item.getAttribute("data-icon")).toBeTruthy();
      });
    });

    it("should have all required properties for commandsOptions", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");

      const commandItems = items.filter((item) => {
        const title = item.getAttribute("data-title");
        return title?.includes("Commands Cheat Sheet");
      });

      expect(commandItems).toHaveLength(1);

      commandItems.forEach((item) => {
        expect(item.getAttribute("data-title")).toBeTruthy();
        expect(item.getAttribute("data-subtitle")).toBeTruthy();
        expect(item.getAttribute("data-icon")).toBeTruthy();
      });
    });
  });

  describe("Total item count", () => {
    it("should render exactly 5 list items total", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      expect(items).toHaveLength(5);
    });

    it("should render exactly 3 sections", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const sections = getAllByTestId("list-section");
      expect(sections).toHaveLength(3);
    });

    it("should render exactly 5 action panels", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const actionPanels = getAllByTestId("action-panel");
      expect(actionPanels).toHaveLength(5);
    });

    it("should render exactly 5 push actions", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const pushActions = getAllByTestId("action-push");
      expect(pushActions).toHaveLength(5);
    });
  });

  describe("Component integration", () => {
    it("should map options correctly to their respective components", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const pushActions = getAllByTestId("action-push");

      const componentTargets = pushActions.map((action) =>
        action.getAttribute("data-target"),
      );

      expect(componentTargets).toContain("ListCommands");
      expect(componentTargets).toContain("CreateSnippet");
      expect(componentTargets).toContain("ListSnippets");
      expect(componentTargets).toContain("ReceivedMessages");
      expect(componentTargets).toContain("SentMessages");
    });

    it("should use correct icons for each option type", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");

      const iconMapping = new Map();
      items.forEach((item) => {
        const title = item.getAttribute("data-title");
        const icon = item.getAttribute("data-icon");
        iconMapping.set(title, icon);
      });

      expect(iconMapping.get("Claude Code Utils - Commands Cheat Sheet")).toBe(
        "terminal-icon",
      );
      expect(iconMapping.get("Claude Code Utils - Create Snippets")).toBe(
        "plus-icon",
      );
      expect(iconMapping.get("Claude Code Utils - List Snippets")).toBe(
        "document-icon",
      );
      expect(iconMapping.get("Claude Code Utils - Received Messages")).toBe(
        "message-icon",
      );
      expect(iconMapping.get("Claude Code Utils - Sent Messages")).toBe(
        "message-icon",
      );
    });
  });

  describe("Accessibility and structure", () => {
    it("should have unique keys for all options", () => {
      const { getAllByTestId } = render(<ClaudeCodeHelper />);
      const items = getAllByTestId("list-item");
      const titles = items.map((item) => item.getAttribute("data-title"));
      const uniqueTitles = new Set(titles);

      expect(titles.length).toBe(uniqueTitles.size);
    });

    it("should render proper DOM structure", () => {
      const { container } = render(<ClaudeCodeHelper />);

      // Check for proper nesting: List > List.Section > List.Item > ActionPanel > Action.Push
      const list = container.querySelector('[data-testid="list"]');
      expect(list).toBeInTheDocument();

      const sections = list?.querySelectorAll('[data-testid="list-section"]');
      expect(sections?.length).toBe(3);

      sections?.forEach((section) => {
        const items = section.querySelectorAll('[data-testid="list-item"]');
        expect(items.length).toBeGreaterThan(0);

        items.forEach((item) => {
          const actionPanel = item.querySelector(
            '[data-testid="action-panel"]',
          );
          expect(actionPanel).toBeInTheDocument();

          const pushAction = actionPanel?.querySelector(
            '[data-testid="action-push"]',
          );
          expect(pushAction).toBeInTheDocument();
        });
      });
    });
  });
});
