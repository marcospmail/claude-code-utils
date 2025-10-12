import React from "react";

// Mock functions
export const showToast = jest.fn();
export const showHUD = jest.fn();
export const closeMainWindow = jest.fn();
export const popToRoot = jest.fn();
export const confirmAlert = jest.fn();
export const getFrontmostApplication = jest.fn().mockResolvedValue({
  name: "TestApp",
  path: "/Applications/TestApp.app",
  bundleId: "com.test.app",
});

// Mock objects
export const Toast = {
  Style: {
    Success: "success",
    Failure: "failure",
    Animated: "animated",
  },
};

export const Icon = {
  Clipboard: "clipboard-icon",
  Eye: "eye-icon",
  Document: "document-icon",
  ArrowClockwise: "arrow-clockwise-icon",
  Trash: "trash-icon",
  Plus: "plus-icon",
  CopyClipboard: "copy-clipboard-icon",
  ExclamationMark: "exclamation-mark-icon",
  Lock: "lock-icon",
  MagnifyingGlass: "magnifying-glass-icon",
  Stars: "stars-icon",
  Window: "window-icon",
  Pin: "pin-icon",
  PinDisabled: "pin-disabled-icon",
  List: "list-icon",
  Code: "code-icon",
  Terminal: "terminal-icon",
  NewDocument: "new-document-icon",
};

export const Color = {
  Red: "red",
  Orange: "orange",
  Yellow: "yellow",
  Green: "green",
  Blue: "blue",
  Purple: "purple",
  Magenta: "magenta",
};

export const Alert = {
  ActionStyle: {
    Default: "default",
    Cancel: "cancel",
    Destructive: "destructive",
  },
};

export const Clipboard = {
  copy: jest.fn(),
  paste: jest.fn(),
  read: jest.fn(),
};

export const LocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

export const environment = {
  canAccess: jest.fn(() => true),
  isDevelopment: false,
  commandName: "test-command",
  launchType: "userInitiated",
};

export const AI = {
  ask: jest.fn(),
  Model: {
    Anthropic_Claude_Haiku: "anthropic-claude-haiku",
  },
};

// Mock React components
export const ActionPanel = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="action-panel">{children}</div>
);

// Helper to convert title to testid
const titleToTestId = (title: string, prefix: string = "action") => {
  return `${prefix}-${title.toLowerCase().replace(/\s+/g, "-")}`;
};

export const Action = Object.assign(
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
    <div
      data-testid={titleToTestId(title)}
      data-title={title}
      data-style={style}
      data-shortcut={JSON.stringify(shortcut)}
      onClick={onAction}
    >
      {title}
    </div>
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
      <div
        data-testid={titleToTestId(title, "action-push")}
        data-title={title}
        data-shortcut={JSON.stringify(shortcut)}
      >
        {title}
        <div data-testid="push-target">{target}</div>
      </div>
    ),
    CopyToClipboard: ({
      title,
      content,
      shortcut,
    }: {
      title: string;
      content: string;
      shortcut?: { modifiers: string[]; key: string };
    }) => (
      <div
        data-testid={titleToTestId(title)}
        data-title={title}
        data-content={content}
        data-shortcut={
          shortcut
            ? `${shortcut.modifiers.join("+")}-${shortcut.key}`
            : undefined
        }
        onClick={async () => {
          try {
            await Clipboard.copy(content);
            await closeMainWindow();
            await showHUD("Copied to Clipboard");
          } catch (error) {
            await showToast({
              title: "Copy failed",
              message: error instanceof Error ? error.message : String(error),
              style: Toast.Style.Failure,
            });
          }
        }}
      >
        {title}
      </div>
    ),
    Paste: ({
      title,
      content,
      shortcut,
    }: {
      title: string;
      content: string;
      shortcut?: { modifiers: string[]; key: string };
    }) => (
      <div
        data-testid={titleToTestId(title)}
        data-title={title}
        data-content={content}
        data-shortcut={
          shortcut
            ? `${shortcut.modifiers.join("+")}-${shortcut.key}`
            : undefined
        }
      >
        {title}
      </div>
    ),
    Open: ({
      title,
      target,
      shortcut,
    }: {
      title: string;
      target: string;
      shortcut?: { modifiers?: string[]; key: string };
    }) => (
      <div
        data-testid="action-open"
        data-title={title}
        data-target={target}
        data-shortcut={JSON.stringify(shortcut)}
      >
        {title}
      </div>
    ),
    OpenInBrowser: ({
      title,
      url,
      shortcut,
    }: {
      title: string;
      url: string;
      shortcut?: { modifiers?: string[]; key: string };
    }) => (
      <div
        data-testid="action-browser"
        data-title={title}
        data-url={url}
        data-shortcut={JSON.stringify(shortcut)}
      >
        {title}
      </div>
    ),
    SubmitForm: ({
      title,
      onSubmit,
      shortcut,
    }: {
      title: string;
      onSubmit?: () => void;
      shortcut?: { modifiers?: string[]; key: string };
    }) => (
      <div
        data-testid="action-submit-form"
        data-title={title}
        data-shortcut={JSON.stringify(shortcut)}
        onClick={onSubmit}
      >
        {title}
      </div>
    ),
    ShowInFinder: ({
      path,
      shortcut,
    }: {
      path: string;
      shortcut?: { modifiers?: string[]; key: string };
    }) => (
      <div
        data-testid="action-show-finder"
        data-path={path}
        data-shortcut={JSON.stringify(shortcut)}
      >
        Show in Finder
      </div>
    ),
    OpenWith: ({
      path,
      shortcut,
    }: {
      path: string;
      shortcut?: { modifiers?: string[]; key: string };
    }) => (
      <div
        data-testid="action-open-with"
        data-path={path}
        data-shortcut={JSON.stringify(shortcut)}
      >
        Open With
      </div>
    ),
    Style: {
      Destructive: "destructive",
      Regular: "regular",
    },
  },
);

export const List = Object.assign(
  ({
    children,
    searchBarPlaceholder,
    onSearchTextChange,
    isLoading,
    actions,
    searchBarAccessory,
    filtering,
  }: {
    children?: React.ReactNode;
    searchBarPlaceholder?: string;
    onSearchTextChange?: (text: string) => void;
    isLoading?: boolean;
    actions?: React.ReactNode;
    searchBarAccessory?: React.ReactNode;
    filtering?: boolean;
  }) => (
    <div
      data-testid="list"
      data-placeholder={searchBarPlaceholder}
      data-loading={isLoading}
      data-filtering={filtering !== undefined ? String(filtering) : undefined}
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
      icon,
    }: {
      title: string;
      subtitle?: string;
      accessories?: Array<{ text?: string; date?: Date; icon?: string }>;
      actions?: React.ReactNode;
      icon?: string | { source: string; tintColor?: string };
    }) => (
      <div
        data-testid="list-item"
        data-title={title}
        data-subtitle={subtitle}
        data-accessories={JSON.stringify(accessories)}
        data-icon={typeof icon === "string" ? icon : JSON.stringify(icon)}
      >
        <div data-testid="item-title">{title}</div>
        <div data-testid="item-subtitle">{subtitle}</div>
        <div data-testid="item-accessories">{JSON.stringify(accessories)}</div>
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
        <div data-testid="empty-title">{title}</div>
        {description && (
          <div data-testid="empty-description">{description}</div>
        )}
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
    Section: ({
      title,
      subtitle,
      children,
    }: {
      title?: string;
      subtitle?: string;
      children?: React.ReactNode;
    }) => (
      <div
        data-testid="list-section"
        data-title={title}
        data-subtitle={subtitle}
      >
        {children}
      </div>
    ),
  },
);

export const Detail = Object.assign(
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
      <div data-testid="markdown">{markdown}</div>
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
        Link: ({
          title,
          text,
          target,
        }: {
          title: string;
          text: string;
          target: string;
        }) => (
          <div
            data-testid="metadata-link"
            data-title={title}
            data-text={text}
            data-target={target}
          />
        ),
        TagList: ({
          title,
          children,
        }: {
          title: string;
          children?: React.ReactNode;
        }) => (
          <div data-testid="metadata-taglist" data-title={title}>
            {children}
          </div>
        ),
      },
    ),
  },
);

export const Form = Object.assign(
  ({
    children,
    actions,
    isLoading,
  }: {
    children?: React.ReactNode;
    actions?: React.ReactNode;
    isLoading?: boolean;
  }) => (
    <div data-testid="form" data-loading={isLoading}>
      <div data-testid="form-actions">{actions}</div>
      {children}
    </div>
  ),
  {
    TextField: ({
      id,
      title,
      value,
      placeholder,
      onChange,
      error,
    }: {
      id: string;
      title?: string;
      value?: string;
      placeholder?: string;
      onChange?: (value: string) => void;
      error?: string;
    }) => (
      <div data-testid={`form-textfield-${id}`} data-id={id} data-title={title}>
        <input
          data-testid={`textfield-${id}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange && onChange(e.target.value)}
        />
        {error && <div data-testid="field-error">{error}</div>}
      </div>
    ),
    TextArea: ({
      id,
      title,
      value,
      placeholder,
      onChange,
      error,
      enableMarkdown,
    }: {
      id: string;
      title?: string;
      value?: string;
      placeholder?: string;
      onChange?: (value: string) => void;
      error?: string;
      enableMarkdown?: boolean;
    }) => (
      <div
        data-testid={`form-textarea-${id}`}
        data-id={id}
        data-title={title}
        data-markdown={enableMarkdown}
      >
        <textarea
          data-testid={`textarea-${id}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange && onChange(e.target.value)}
        />
        {error && <div data-testid="field-error">{error}</div>}
      </div>
    ),
    Dropdown: Object.assign(
      ({
        id,
        title,
        value,
        onChange,
        children,
      }: {
        id: string;
        title?: string;
        value?: string;
        onChange?: (value: string) => void;
        children?: React.ReactNode;
      }) => (
        <div data-testid="form-dropdown" data-id={id} data-title={title}>
          <select
            data-testid={`dropdown-${id}`}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
          >
            {children}
          </select>
        </div>
      ),
      {
        Item: ({ title, value }: { title: string; value: string }) => (
          <option value={value}>{title}</option>
        ),
      },
    ),
  },
);

// Additional utilities
export const getPreferenceValues = jest.fn(() => ({}));
export const open = jest.fn();
export const openExtensionPreferences = jest.fn();
export const launchCommand = jest.fn();

export const LaunchType = {
  UserInitiated: "userInitiated",
  Background: "background",
};

export const LaunchProps = {};

export const Cache = jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
}));

export const useNavigation = jest.fn(() => ({
  push: jest.fn(),
  pop: jest.fn(),
}));
