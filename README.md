# Claude Code Utils

A powerful Raycast extension for browsing, searching, and managing your Claude Code conversations. Access your message history, create reusable snippets, and quickly reference Claude Code commands.

## Features

### 📨 **Message History**
- **Claude's Responses** - Browse all messages received from Claude
- **Your Messages** - Review messages you sent to Claude
- **AI-Powered Search** - Use semantic search to find relevant messages (Raycast Pro required)
- **Quick Copy** - Copy any message instantly to clipboard
- **Time-based Filtering** - Messages sorted by most recent first

### ✂️ **Snippet Management**
- **Create Snippets** - Save frequently used code or text as reusable snippets
- **Browse & Search** - Quickly find snippets with intelligent search
- **Organize** - Tag and categorize your snippets for easy access
- **Export** - Copy snippets to use in any application

### 📚 **Commands Cheat Sheet**
- **Slash Commands** - Quick reference for all `/` commands
- **Keyboard Shortcuts** - Master Claude Code keyboard navigation
- **CLI Flags** - Reference for command-line options
- **Special Keywords** - Learn about `@file`, `@docs` and other special features

### 🔍 **Smart Search Features**
- **Normal Search** - Fast keyword-based search across all content
- **AI Search** - Semantic search that understands context and meaning (Pro)
- **Real-time Filtering** - Results update as you type
- **Category Filters** - Filter by message type, command category, or snippet tags

## Installation

### From Raycast Store
1. Open Raycast
2. Search for "Claude Code Utils"
3. Click Install

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/marcospmail/claude-code-helper-extension.git

# Navigate to the extension directory
cd claude-code-helper-extension

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
   - **Claude Code Utils** - Main menu with all features
   - **Claude's Responses** - View received messages
   - **Your Messages** - View sent messages
   - **Browse Snippets** - Manage your snippets
   - **Commands Cheat Sheet** - Reference guide

### Keyboard Shortcuts
- `⌘ + C` - Copy selected message or snippet
- `⌘ + K` - Quick search
- `⌘ + ⇧ + S` - Create snippet from message
- `⌘ + R` - Refresh message list
- `⌘ + Enter` - View details

### Search Modes
Toggle between search modes using the dropdown:
- **Normal Search** - Fast keyword matching
- **AI Search** - Semantic understanding (requires Raycast Pro)

## Technical Details

### Performance Optimizations
- **Smart Caching** - Messages cached for instant access
- **Lazy Loading** - Only loads data when needed
- **Stream Processing** - Handles large conversation files efficiently
- **Debounced Search** - Optimized search performance

### Data Source
- Reads from `~/.claude/projects/` where Claude Code stores conversations
- Processes JSONL files containing timestamped messages
- Automatically finds the most recent conversations
- No data is sent to external servers (except for AI search with Raycast Pro)

### Limitations
- Maximum 50 most recent messages per view (for performance)
- AI Search requires Raycast Pro subscription
- Large conversation files may take a moment to load initially

## Requirements

- **Raycast** 1.26.0 or higher
- **Node.js** 20.0+
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
- The extension limits to 50 most recent messages
- Large conversation histories are automatically optimized
- Try closing and reopening if performance degrades

## Privacy & Security

- **Local Processing** - All data processing happens locally on your machine
- **No External Storage** - Your messages are never uploaded or stored externally
- **AI Search** - When using AI search, queries are processed by Raycast's AI service (Pro only)
- **Open Source** - Full source code available for review

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, feature requests, or questions:
- [GitHub Issues](https://github.com/yourusername/claude-code-utils/issues)
- [Raycast Community](https://raycast.com/community)

## License

MIT License - see LICENSE file for details

## Credits

Created with ❤️ for the Claude Code community