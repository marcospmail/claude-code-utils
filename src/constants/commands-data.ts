export interface CommandItem {
  id: string;
  name: string;
  description: string;
  category: string;
  usage?: string;
  examples?: string[];
}

export const claudeCodeCommands: CommandItem[] = [
  // Commands
  {
    id: "add-dir",
    name: "/add-dir",
    description: "Add additional working directories to current session",
    category: "Commands",
    usage: "/add-dir",
    examples: ["/add-dir ../apps ../lib"],
  },
  {
    id: "agents",
    name: "/agents",
    description: "Manage custom AI subagents for specialized tasks",
    category: "Commands",
    usage: "/agents",
  },
  {
    id: "bashes",
    name: "/bashes",
    description: "Interactive menu for managing background bash shells",
    category: "Commands",
    usage: "/bashes",
  },
  {
    id: "bug",
    name: "/bug",
    description: "Report bugs and send conversation to Anthropic",
    category: "Commands",
    usage: "/bug",
  },
  {
    id: "clear",
    name: "/clear",
    description: "Clear conversation history and start fresh",
    category: "Commands",
    usage: "/clear",
  },
  {
    id: "compact",
    name: "/compact",
    description: "Compact conversation with optional focus instructions",
    category: "Commands",
    usage: "/compact [instructions]",
    examples: ["/compact", "/compact focus on the authentication system"],
  },
  {
    id: "config",
    name: "/config",
    description: "View or modify configuration settings",
    category: "Commands",
    usage: "/config",
  },
  {
    id: "context",
    name: "/context",
    description: "Get detailed token breakdown across tools and memory files",
    category: "Commands",
    usage: "/context",
  },
  {
    id: "cost",
    name: "/cost",
    description: "Show token usage statistics and costs",
    category: "Commands",
    usage: "/cost",
  },
  {
    id: "doctor",
    name: "/doctor",
    description: "Check health of Claude Code installation",
    category: "Commands",
    usage: "/doctor",
  },
  {
    id: "help",
    name: "/help",
    description: "Get usage help and list available commands",
    category: "Commands",
    usage: "/help",
  },
  {
    id: "hooks",
    name: "/hooks",
    description: "Configure hooks through interactive menu",
    category: "Commands",
    usage: "/hooks",
  },
  {
    id: "ide",
    name: "/ide",
    description: "Connect to IDE integrations",
    category: "Commands",
    usage: "/ide",
  },
  {
    id: "init",
    name: "/init",
    description: "Initialize project with CLAUDE.md configuration",
    category: "Commands",
    usage: "/init",
  },
  {
    id: "install-github-app",
    name: "/install-github-app",
    description: "Setup GitHub app for automatic PR reviews",
    category: "Commands",
    usage: "/install-github-app",
  },
  {
    id: "login",
    name: "/login",
    description: "Switch between Anthropic accounts",
    category: "Commands",
    usage: "/login",
  },
  {
    id: "logout",
    name: "/logout",
    description: "Sign out from your Anthropic account",
    category: "Commands",
    usage: "/logout",
  },
  {
    id: "mcp",
    name: "/mcp",
    description: "Manage MCP server connections and OAuth",
    category: "Commands",
    usage: "/mcp",
  },
  {
    id: "memory",
    name: "/memory",
    description: "Edit CLAUDE.md memory files directly",
    category: "Commands",
    usage: "/memory",
  },
  {
    id: "model",
    name: "/model",
    description: "Select or change the AI model",
    category: "Commands",
    usage: "/model",
  },
  {
    id: "permissions",
    name: "/permissions",
    description: "View or update file access permissions",
    category: "Commands",
    usage: "/permissions",
  },
  {
    id: "resume",
    name: "/resume",
    description: "Resume previous conversation with full context",
    category: "Commands",
    usage: "/resume",
  },
  {
    id: "review",
    name: "/review",
    description: "Request code review",
    category: "Commands",
    usage: "/review",
  },
  {
    id: "pr-comments",
    name: "/pr-comments",
    description: "View pull request comments",
    category: "Commands",
    usage: "/pr-comments",
  },
  {
    id: "status",
    name: "/status",
    description: "View account and system statuses",
    category: "Commands",
    usage: "/status",
  },
  {
    id: "terminal-setup",
    name: "/terminal-setup",
    description: "Install Shift+Enter key binding",
    category: "Commands",
    usage: "/terminal-setup",
  },
  {
    id: "vim",
    name: "/vim",
    description: "Enter vim mode for alternating insert/command modes",
    category: "Commands",
    usage: "/vim",
  },

  // Keyboard Shortcuts
  {
    id: "ctrl-c",
    name: "Ctrl+C",
    description: "Cancel current input or generation",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+C",
  },
  {
    id: "ctrl-d",
    name: "Ctrl+D",
    description: "Exit Claude Code session",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+D",
  },
  {
    id: "ctrl-v",
    name: "Ctrl+V",
    description: "Paste images from clipboard",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+V",
  },
  {
    id: "ctrl-z",
    name: "Ctrl+- (hyphen)",
    description: "Undo last action",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+-",
  },
  {
    id: "ctrl-r",
    name: "Ctrl+R",
    description: "Reverse search through command history",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+R",
  },
  {
    id: "ctrl-a",
    name: "Ctrl+A",
    description: "Move to start of line",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+A",
  },
  {
    id: "ctrl-e",
    name: "Ctrl+E",
    description: "Move to end of line",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+E",
  },
  {
    id: "ctrl-w",
    name: "Ctrl+W",
    description: "Delete previous word",
    category: "Keyboard Shortcuts",
    usage: "Ctrl+W",
  },
  {
    id: "esc",
    name: "Esc",
    description: "Stop Claude current prompt (not exit)",
    category: "Keyboard Shortcuts",
    usage: "Esc",
  },
  {
    id: "esc-esc",
    name: "Esc + Esc",
    description: "Edit previous message / Clear input",
    category: "Keyboard Shortcuts",
    usage: "Esc Esc",
  },
  {
    id: "shift-tab",
    name: "Shift+Tab",
    description: "Toggle permission modes",
    category: "Keyboard Shortcuts",
    usage: "Shift+Tab",
  },
  {
    id: "option-f-b",
    name: "Option+F/B",
    description: "Move forward/backward one word (macOS)",
    category: "Keyboard Shortcuts",
    usage: "Option+F / Option+B",
  },

  // Multiline Input
  {
    id: "backslash-enter",
    name: "\\ + Enter",
    description: "Add new line (works in all terminals)",
    category: "Multiline Input",
    usage: "\\ + Enter",
  },
  {
    id: "option-enter",
    name: "Option+Enter",
    description: "Add new line (macOS default)",
    category: "Multiline Input",
    usage: "Option+Enter",
  },
  {
    id: "shift-enter",
    name: "Shift+Enter",
    description: "Add new line (after terminal setup)",
    category: "Multiline Input",
    usage: "Shift+Enter",
  },
  {
    id: "ctrl-j",
    name: "Ctrl+J",
    description: "Add line feed character",
    category: "Multiline Input",
    usage: "Ctrl+J",
  },

  // Quick Prefixes
  {
    id: "hash-prefix",
    name: "# prefix",
    description: "Memory shortcut to edit CLAUDE.md",
    category: "Quick Prefixes",
    usage: "#",
    examples: ["# update the project description"],
  },
  {
    id: "slash-prefix",
    name: "/ prefix",
    description: "Execute command",
    category: "Quick Prefixes",
    usage: "/",
    examples: ["/help", "/clear", "/status"],
  },
  {
    id: "bang-prefix",
    name: "! prefix",
    description: "Bash mode for direct command execution",
    category: "Quick Prefixes",
    usage: "!",
    examples: ["!ls", "!git status", "!npm install"],
  },
  {
    id: "at-prefix",
    name: "@ prefix",
    description: "Reference files, agents, and resources",
    category: "Quick Prefixes",
    usage: "@",
    examples: ["@src/app.js", "@agent-frontend", "@README.md"],
  },

  // CLI Flags & Arguments
  {
    id: "add-dir-flag",
    name: "--add-dir",
    description: "Add additional working directories",
    category: "CLI Flags",
    usage: "claude --add-dir <paths>",
    examples: ["claude --add-dir ../apps ../lib"],
  },
  {
    id: "allowed-tools",
    name: "--allowedTools",
    description: "Specify allowed tools without permission",
    category: "CLI Flags",
    usage: "claude --allowedTools <tools>",
    examples: ['claude --allowedTools "Bash(git:*)" "Read"'],
  },
  {
    id: "disallowed-tools",
    name: "--disallowedTools",
    description: "Specify disallowed tools",
    category: "CLI Flags",
    usage: "claude --disallowedTools <tools>",
    examples: ['claude --disallowedTools "Bash(rm:*)"'],
  },
  {
    id: "print-flag",
    name: "--print / -p",
    description: "Print response without interactive mode",
    category: "CLI Flags",
    usage: "claude -p <prompt>",
    examples: ['claude -p "analyze this code"'],
  },
  {
    id: "append-system-prompt",
    name: "--append-system-prompt",
    description: "Append to system prompt",
    category: "CLI Flags",
    usage: "claude --append-system-prompt <text>",
  },
  {
    id: "output-format",
    name: "--output-format",
    description: "Specify output format (text/json/stream-json)",
    category: "CLI Flags",
    usage: "claude --output-format <format>",
    examples: ['claude -p "query" --output-format json'],
  },
  {
    id: "input-format",
    name: "--input-format",
    description: "Specify input format",
    category: "CLI Flags",
    usage: "claude --input-format <format>",
  },
  {
    id: "include-partial-messages",
    name: "--include-partial-messages",
    description: "Include partial streaming events",
    category: "CLI Flags",
    usage: "claude --include-partial-messages",
  },
  {
    id: "verbose-flag",
    name: "--verbose",
    description: "Enable verbose logging",
    category: "CLI Flags",
    usage: "claude --verbose",
  },
  {
    id: "max-turns",
    name: "--max-turns",
    description: "Limit number of agentic turns",
    category: "CLI Flags",
    usage: "claude --max-turns <number>",
    examples: ['claude -p --max-turns 3 "query"'],
  },
  {
    id: "model-flag",
    name: "--model",
    description: "Set model for current session",
    category: "CLI Flags",
    usage: "claude --model <model-name>",
  },
  {
    id: "skip-permissions",
    name: "--dangerously-skip-permissions",
    description: "Skip all permission prompts",
    category: "CLI Flags",
    usage: "claude --dangerously-skip-permissions",
  },
  {
    id: "mcp-debug",
    name: "--mcp-debug",
    description: "Debug MCP configuration issues",
    category: "CLI Flags",
    usage: "claude --mcp-debug",
  },
  {
    id: "resume-flag",
    name: "--resume",
    description: "Display list of past sessions to resume",
    category: "CLI Flags",
    usage: "claude --resume",
  },
  {
    id: "version-flag",
    name: "--version",
    description: "Check Claude Code version",
    category: "CLI Flags",
    usage: "claude --version",
  },

  // Special Keywords & Hidden Features
  {
    id: "think",
    name: "think",
    description: "Basic thinking mode - lowest level of extended thinking",
    category: "Special Keywords",
    usage: "think",
    examples: ["think about this problem carefully"],
  },
  {
    id: "think-hard",
    name: "think hard",
    description:
      "Increased thinking budget - second level of extended thinking",
    category: "Special Keywords",
    usage: "think hard",
    examples: ["think hard about this complex issue"],
  },
  {
    id: "think-harder",
    name: "think harder",
    description:
      "Further increased thinking budget - third level of extended thinking",
    category: "Special Keywords",
    usage: "think harder",
    examples: ["think harder about this architecture decision"],
  },
  {
    id: "ultrathink",
    name: "ultrathink",
    description: "Maximum thinking budget - highest level of extended thinking",
    category: "Special Keywords",
    usage: "ultrathink",
    examples: ["ultrathink about this complex system design"],
  },
  {
    id: "agent-output-style-setup",
    name: "@agent-output-style-setup",
    description: "Setup custom output styles",
    category: "Special Keywords",
    usage: "@agent-output-style-setup",
  },
  {
    id: "drag-drop-files",
    name: "Drag & drop files",
    description: "Add files to conversation by dragging into window",
    category: "Special Keywords",
    usage: "Drag file into Claude Code window",
  },

  // File Operations
  {
    id: "pipe-input",
    name: "Pipe data input",
    description: "Pipe command output into Claude",
    category: "File Operations",
    usage: 'command | claude -p "prompt"',
    examples: ['cat data.csv | claude -p "analyze this data"'],
  },
  {
    id: "multiple-dirs",
    name: "Multiple working directories",
    description: "Work across multiple project directories",
    category: "File Operations",
    usage: "Use --add-dir flag or /add-dir command",
  },
  {
    id: "claudeignore",
    name: ".claudeignore patterns",
    description: "Exclude files from context using patterns",
    category: "File Operations",
    usage: "Create .claudeignore file with patterns",
  },
];

export const getCommandsByCategory = () => {
  const categories = [
    ...new Set(claudeCodeCommands.map((cmd) => cmd.category)),
  ];
  return categories.map((category) => ({
    category,
    commands: claudeCodeCommands.filter((cmd) => cmd.category === category),
  }));
};

export const searchCommands = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return claudeCodeCommands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(lowercaseQuery) ||
      cmd.description.toLowerCase().includes(lowercaseQuery) ||
      cmd.category.toLowerCase().includes(lowercaseQuery),
  );
};
