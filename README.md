# Claude Code Helper Extension

A Claude Code Helper Extension

## Features

// TBD

## Installation

1. Navigate to the extension directory:

   ```bash
   cd path/to/claude-code-helper-extension/
   ```

2. Install dependencies (if not already done):

   ```bash
   npm install
   ```

3. Start the extension in development mode:

   ```bash
   npm run dev
   ```

4. The extension will automatically appear in Raycast. You can find it by:
   - Opening Raycast (⌘ + Space)
   - Searching for "Claude Code Helper Extension"

5. The extension will remain available in Raycast even after stopping the dev server with `⌃ C`

## How to Use

1. Open Raycast (⌘ + Space)
2. Type "Claude" to find "Claude Code Helper Extension"
3. Select it to see two options:
   - **Claude's Responses** - View messages received from Claude
   - **My Sent Messages** - View messages sent to Claude
4. Each option shows up to 50 most recent messages with time stamps
5. Use the search bar to filter messages
6. Select any message to copy it (full message, content only, or preview)

## How It Works

The extension uses a streaming approach to handle large conversation histories:

1. **Smart Project Selection**: Only scans the 5 most recently modified projects
2. **File Limiting**: Processes only the 5 most recent conversation files per project
3. **Message Limiting**: Retrieves only the 10 most recent messages per file to prevent memory issues
4. **Streaming Parsing**: Uses Node.js streams to read JSONL files line-by-line instead of loading entire files into memory
5. **Role-Specific Filtering**: Separate streaming parsers for user vs assistant messages

### Data Source

- Reads from `~/.claude/projects/` where Claude Code stores conversation history
- Each project has JSONL files containing timestamped message exchanges
- Files are sorted by modification time to find the most recent conversations first

### Performance Optimizations

- Reads maximum 25 files (5 files × 5 projects) for optimal performance
- Limits to 10 messages per file (maximum 250 messages in memory before final filtering)
- Returns the 50 most recent messages globally
- Sequential processing prevents memory buildup
- Automatic cleanup of file handles and streams

## Requirements

- Raycast 1.26.0 or higher
- Node.js 22.14+
- Claude Code

## Notes

- Messages are stored locally on your machine by Claude Code
- The extension only reads existing messages, it doesn't modify anything
