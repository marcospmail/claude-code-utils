# Claude Code Utils

A powerful Raycast extension for browsing, searching, and managing your Claude Code conversations. Access your message history, create reusable snippets, and quickly reference Claude Code commands.

## Features

### 📨 **Received Messages**

Browse all messages received from Claude Code. Supports normal keyword search and AI-powered semantic search (Raycast Pro required).

### ✉️ **Sent Messages**

Review and search through messages you sent to Claude Code. Supports normal keyword search and AI-powered semantic search (Raycast Pro required).

### ✂️ **Create Snippet**

Save frequently used code or text as reusable snippets for quick access.

### 📋 **Browse Snippets**

View, search, and manage all your saved code snippets.

### 📚 **Commands Cheat Sheet**

Quick reference for all Claude Code commands, keyboard shortcuts, CLI flags, and special keywords like `@file` and `@docs`.

### 🤖 **Browse Agents**

View and manage your Claude Code agents from `~/.claude/agents`.

### ⚡ **Browse Commands**

View and manage your Claude Code commands from `~/.claude/commands`.

## Installation

### From Raycast Store

1. Open Raycast
2. Search for "Claude Code Utils"
3. Click Install

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/marcospmail/claude-code-utils.git

# Navigate to the extension directory
cd claude-code-utils

# Install dependencies
npm install

# Build and install in Raycast
npm run build && npm run publish
```

## Usage

### Quick Start

1. Open Raycast (`⌘ + Space`)
2. Type "Claude" to see all available commands
3. Select the feature you want to use:
   - **Received Messages** - View received messages
   - **Sent Messages** - View sent messages
   - **Browse Snippets** - Manage your snippets
   - **Commands Cheat Sheet** - Reference guide
   - **Browse Agents** - View Claude Code agents
   - **Browse Commands** - View Claude Code commands

### Search Modes

Toggle between search modes using the dropdown:

- **Normal Search** - Fast keyword matching
- **AI Search** - Semantic understanding (requires Raycast Pro)

## Technical Details

### Performance Optimizations

- **Stream Processing** - Handles large conversation files efficiently using line-by-line reading
- **Debounced Search** - AI search queries are debounced by 500ms for optimal performance
- **Smart Scanning** - Only processes the 5 most recent projects and 5 most recent files per project

### Data Source

- Reads from `~/.claude/projects/` where Claude Code stores conversations
- Processes JSONL files containing timestamped messages
- Automatically finds the most recent conversations
- No data is sent to external servers (except for AI search with Raycast Pro)

### Limitations

- Scans 5 most recent projects with 5 most recent conversation files per project
- AI Search requires Raycast Pro subscription
- Large conversation files may take a moment to load initially

## Requirements

- **Raycast** 1.26.0 or higher
- **Node.js** 22.14 or higher
- **Claude Code** installed and configured
- **Raycast Pro** (optional, for AI search features)

## Troubleshooting

### No messages appearing

- Ensure Claude Code is installed and you have conversation history
- Check that `~/.claude/projects/` directory exists
- Try refreshing with `⌘ + R`

### Search not working

- For AI search, ensure you have Raycast Pro subscription
- Try switching to Normal search mode if AI search fails
- Clear search and try again

### Performance issues

- The extension scans the 5 most recent projects and 5 most recent files per project
- Large conversation files are processed efficiently using streaming
- Try closing and reopening if performance degrades

## Privacy & Security

- **Local Processing** - All data processing happens locally on your machine
- **No External Storage** - Your messages are never uploaded or stored externally
- **AI Search** - When using AI search, queries are processed by Raycast's AI service (Pro only)
- **Open Source** - Full source code available for review

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
