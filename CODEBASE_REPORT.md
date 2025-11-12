# Claude Code Utils - Comprehensive Documentation Report

> **Generated**: 2025-11-12
> **Purpose**: Complete documentation of all pages, shortcuts, and code comments in the codebase

## Table of Contents

1. [Pages and Their Functions](#pages-and-their-functions)
2. [Keyboard Shortcuts by Page](#keyboard-shortcuts-by-page)
3. [Code Comments Catalog](#code-comments-catalog)
4. [Architecture Summary](#architecture-summary)

---

## Pages and Their Functions

This Raycast extension has **8 commands** following the List + Detail pattern:

### 1. Browse Agents

**Entry Point**: `src/browse-agents.tsx`
**Exports From**: `src/commands/browse-agents/list.tsx`
**Data Source**: `~/.claude/agents/` directory

**Purpose**: Browse and manage Claude agents stored in your local agents directory.

**Functionality**:
- Lists all agents with searchable interface
- View agent details in a detail panel with full markdown rendering
- Copy agent content to clipboard
- Open in Finder to view the agent file location
- Open agent file with external text editor
- Error handling with graceful error messages

---

### 2. Browse Commands

**Entry Point**: `src/browse-commands.tsx`
**Exports From**: `src/commands/browse-commands/list.tsx`
**Data Source**: `~/.claude/commands/` directory

**Purpose**: Browse slash commands available in Claude Code.

**Functionality**:
- Lists all slash commands from `~/.claude/commands/`
- Searchable interface to quickly find commands
- View command details with markdown formatting
- Copy command content to clipboard
- Show in Finder to locate command files
- Open with external editor for editing
- Error handling for failed loads

---

### 3. Browse Snippets

**Entry Point**: `src/browse-snippets.tsx`
**Exports From**: `src/commands/browse-snippets/list.tsx`
**Data Source**: Extracted from `~/.claude/projects/` conversation files

**Purpose**: Manage saved code snippets created from messages.

**Functionality**:
- Search snippets using keyword search algorithm
- Sort by most recently updated first
- Copy snippet to clipboard (with HUD notification and window close)
- Duplicate existing snippets
- Create new snippets (opens create-snippet form)
- Delete snippets with confirmation dialog
- View snippet details with markdown rendering
- Create snippets from message content in other commands

---

### 4. Changelog

**Entry Point**: `src/changelog.tsx`
**Exports From**: `src/commands/changelog/list.tsx`
**Data Source**: `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` (remote fetch)

**Purpose**: View Claude Code release history and changes.

**Functionality**:
- Fetches changelog from GitHub
- Lists versions with change count
- View detailed changes for each version
- Copy changes to clipboard
- Link to GitHub changelog page
- Loading states with toast notifications
- Network simulation support for testing slow connections

---

### 5. Cheat Sheet

**Entry Point**: `src/cheatsheet.tsx`
**Exports From**: `src/commands/cheatsheet/list.tsx`
**Data Source**: Static data from `src/constants/commands-data.ts`

**Purpose**: Quick reference guide for Claude Code features.

**Functionality**:
- Organized by 8 categories:
  1. **Commands** - Slash commands and shortcuts
  2. **Keyboard Shortcuts** - Global and context shortcuts
  3. **Multiline Input** - Handling multi-line code
  4. **Quick Prefixes** - Fast command prefixes
  5. **CLI Flags & Arguments** - Command-line options
  6. **Special Keywords & Hidden Features** - Advanced features
  7. **Configuration Commands** - Settings and setup
  8. **File Operations** - File management commands
- Real-time search across all categories
- Category-specific icons (Terminal, Keyboard, Flag, Stars)
- View detailed information for each item
- Copy item details to clipboard
- Organized section display when not searching

---

### 6. Create Snippet

**Entry Point**: `src/create-snippet.tsx`
**Exports From**: `src/commands/create-snippet/list.tsx`
**Data Source**: Creates new entries in `~/.claude/projects/` conversation files

**Purpose**: Form-based interface to create new code snippets.

**Functionality**:
- Form with two fields:
  - **Title** (optional text field)
  - **Content** (required textarea)
- Pre-populate fields from launch context (when called from other commands)
- Save snippets to Claude messages system
- Navigate back to previous view after creation (`popToRoot()`)
- Error handling with toast notifications
- Success confirmation

---

### 7. Sent Messages

**Entry Point**: `src/sent-messages.tsx`
**Exports From**: `src/commands/sent-messages/list.tsx`
**Data Source**: `~/.claude/projects/` conversation JSONL files (filters for user messages)

**Purpose**: Browse your sent messages (user prompts) from Claude Code conversations.

**Functionality**:
- Loads messages from `~/.claude/projects/` directory
- Scans 5 most recent projects × 5 most recent files per project
- Uses streaming parser to handle large JSONL files efficiently
- Sort by timestamp (newest first)
- Search using keyword search algorithm
- Group messages by date periods:
  - Today
  - Yesterday
  - This Week
  - This Month
  - This Year
  - Older (by specific year)
- Copy message to clipboard (quick copy with window close)
- Create snippet from message content
- Refresh messages manually
- View full message in detail panel with markdown rendering

**Performance**:
- Streaming parser prevents out-of-memory crashes on large files
- Configurable scan limits (MAX_PROJECTS_TO_SCAN = 5, MAX_FILES_PER_PROJECT = 5)

---

### 8. Received Messages

**Entry Point**: `src/received-messages.tsx`
**Exports From**: `src/commands/received-messages/list.tsx`
**Data Source**: `~/.claude/projects/` conversation JSONL files (filters for assistant messages)

**Purpose**: Browse Claude's responses from conversation history.

**Functionality**:
- Loads messages from `~/.claude/projects/` directory
- Scans 5 most recent projects × 5 most recent files per project
- Uses streaming parser for memory efficiency
- Sort by timestamp (newest first)
- Search using keyword search algorithm
- Group messages by date periods (same as Sent Messages)
- Copy message to clipboard (quick copy with window close)
- Create snippet from message content
- Refresh messages manually
- View full message in detail panel with markdown rendering

**Performance**:
- Identical streaming architecture to Sent Messages
- Sequential processing to prevent memory issues

---

## Keyboard Shortcuts by Page

### 1. Browse Agents

#### List View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy agent content |
| `⌘ + ⇧ + F` | Show in Finder | Open agent file location |
| `⌘ + O` | Open With | Open in external editor |

#### Detail View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy agent content |
| `⌘ + ⇧ + F` | Show in Finder | Open agent file location |
| `⌘ + O` | Open With | Open in external editor |

---

### 2. Browse Commands

#### List View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy command content |
| `⌘ + ⇧ + F` | Show in Finder | Open command file location |
| `⌘ + O` | Open With | Open in external editor |

#### Detail View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy command content |

---

### 3. Browse Snippets

#### List View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Quick copy with HUD + window close |
| `⌘ + N` | Create New Snippet | Open create snippet form |
| `⌘ + D` | Duplicate Snippet | Create copy of snippet |
| `⌃ + X` | Delete Snippet | Delete with confirmation |

#### Detail View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy snippet content |
| `⌘ + D` | Duplicate Snippet | Create copy of snippet |
| `⌃ + X` | Delete Snippet | Delete with confirmation |

---

### 4. Changelog

#### List View
- **No shortcuts defined**

#### Detail View
- **No shortcuts defined**

---

### 5. Cheat Sheet

#### List View
- **No shortcuts defined** (search-focused interface)

#### Detail View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy cheat sheet item |

---

### 6. Create Snippet

#### Form View
- **No shortcuts defined** (form-based input interface)

---

### 7. Sent Messages

#### List View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Quick copy with HUD + window close |
| `⌘ + S` | Create Snippet | Save message as snippet |
| `⌘ + R` | Refresh Messages | Reload message list |

#### Detail View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy message content |
| `⌘ + S` | Create Snippet | Save message as snippet |

---

### 8. Received Messages

#### List View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Quick copy with HUD + window close |
| `⌘ + S` | Create Snippet | Save message as snippet |
| `⌘ + R` | Refresh Messages | Reload message list |

#### Detail View
| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + ↵` | Copy to Clipboard | Copy message content |
| `⌘ + S` | Create Snippet | Save message as snippet |

---

### Shortcut Statistics

**Total Actions with Shortcuts**: 22

**Most Common Shortcuts**:
| Shortcut | Usage Count | Commands |
|----------|-------------|----------|
| `⌘ + ↵` | 9 | Browse Agents, Browse Commands, Browse Snippets, Cheat Sheet, Sent Messages, Received Messages |
| `⌘ + S` | 4 | Sent Messages, Received Messages |
| `⌘ + R` | 2 | Sent Messages, Received Messages |
| `⌘ + D` | 2 | Browse Snippets |
| `⌘ + ⇧ + F` | 2 | Browse Agents, Browse Commands |
| `⌘ + O` | 2 | Browse Agents, Browse Commands |
| `⌘ + N` | 1 | Browse Snippets |
| `⌃ + X` | 2 | Browse Snippets |

---

## Code Comments Catalog

### Core Utility Files

#### `src/utils/claude-message.ts`
**Most Documented File** - Critical for understanding message handling

##### Type Definitions (Lines 10-24)
```typescript
// JSONLMessage and JSONLData types explain the structure of conversation files
// Each line is a JSON object with id, type (user/assistant), content, and timestamp
```

**Purpose**: Defines the structure of JSONL conversation files that Claude Code generates.

---

##### Configuration Constants (Lines 41-45)
```typescript
// MAX_PROJECTS_TO_SCAN = 5
// MAX_FILES_PER_PROJECT = 5
// Limits scanning to prevent performance issues with large conversation histories
```

**Purpose**: Configurable limits to control how many projects and files are scanned for messages.

---

##### Timestamp Parsing (Lines 47-56)
```typescript
// parseTimestamp() handles both seconds and milliseconds Unix timestamps
// Values below 10^12 are treated as seconds, above are milliseconds
// This handles inconsistency in Claude Code's timestamp format
```

**Purpose**: Normalizes timestamps that may be in seconds or milliseconds format.

**Key Logic**: Uses threshold of 10^12 to distinguish between formats.

---

##### Streaming Parser (Lines 63-67)
```typescript
// Memory-efficient streaming parser using readline and createReadStream
// Reads JSONL files line-by-line to prevent out-of-memory crashes
// Critical for handling large conversation files (some can be 100MB+)
```

**Purpose**: Prevents memory issues when reading large conversation files.

**Implementation**: Uses Node.js `readline` and `createReadStream` for line-by-line processing.

---

##### Resource Cleanup (Lines 78-92)
```typescript
// Explicit cleanup of readline interfaces and file streams
// Prevents memory leaks during async operations
// Uses .close() and .destroy() for proper resource management
```

**Purpose**: Ensures proper cleanup of file handles and streams.

**Best Practice**: Always cleanup resources in async operations to prevent leaks.

---

##### Invalid JSON Handling (Lines 143, 193, 248)
```typescript
// Skips invalid JSON lines during parsing
// Prevents entire file from failing due to corrupted lines
```

**Purpose**: Gracefully handles corrupted or invalid JSON in conversation files.

**Behavior**: Silently skips bad lines and continues processing.

---

##### Project Sorting Algorithm (Lines 278-314)
```typescript
// Projects sorted by most recent file activity (not directory mtime)
// Scans conversation files to find the most recent timestamp
// Ensures we process the most relevant conversations first
```

**Purpose**: Prioritizes recent conversations for better user experience.

**Implementation**: Examines actual file timestamps rather than directory modification times.

---

##### Sequential Processing (Lines 321-361)
```typescript
// Processes projects and files sequentially using streaming
// Prevents parallel file operations that could cause memory issues
// Uses await in loops intentionally for controlled processing
```

**Purpose**: Prevents memory spikes from parallel file operations.

**Design Decision**: Intentionally avoids Promise.all() in favor of sequential processing.

---

##### Message Retrieval Steps (Lines 378-495)
```typescript
// STEP 1: Find Claude Code projects and file activity times
// STEP 2: Sort projects by recent activity
// STEP 3: Process top N projects
// STEP 4: Process top M conversation files per project
// STEP 5: Parse messages using streaming
// STEP 6: Global sorting across all projects by timestamp
// STEP 7: Format messages for Raycast display
```

**Purpose**: Comprehensive documentation of the entire message retrieval algorithm.

**Key Steps**:
1. **Discovery**: Find all projects in `~/.claude/projects/`
2. **Prioritization**: Sort by most recent activity
3. **Limiting**: Process only top N projects and M files per project
4. **Parsing**: Stream parse JSONL files for memory efficiency
5. **Aggregation**: Combine messages from all sources
6. **Sorting**: Global sort by timestamp (newest first)
7. **Formatting**: Convert to Raycast-compatible format

---

##### Snippet Functions (Lines 525-580)
```typescript
// getSnippets() - Retrieves saved snippets from messages
// createSnippet() - Saves new snippet with timestamp
// deleteSnippet() - Removes snippet by ID
// Graceful JSON parse error handling with fallback to empty arrays
```

**Purpose**: CRUD operations for snippet management.

**Error Handling**: Falls back to empty array on JSON parse errors.

---

#### `src/utils/ai-search.ts`

##### Search Functions (Lines 3-21)
```typescript
// normalSearch() - Keyword search for messages
// Filters messages where content includes search term (case-insensitive)

// normalSearchSnippets() - Keyword search for snippets
// Searches both title and content fields
```

**Purpose**: Simple keyword-based search functionality.

**Implementation**: Case-insensitive substring matching using `.toLowerCase()` and `.includes()`.

---

#### `src/utils/agent.ts`

##### Agent Loading (Lines 12-17)
```typescript
// TEMPORARY: Comment about using mock agents-raycast folder for screenshots
// getAgents() - Retrieves all agent files from ~/.claude/agents
// Parses markdown with frontmatter for metadata
```

**Purpose**: Loads and parses agent files from the agents directory.

**Note**: Contains temporary code for screenshot generation.

---

#### `src/utils/command.ts`

##### Command Loading (Lines 13-18)
```typescript
// TEMPORARY: Comment about using mock commands-raycast folder for screenshots
// getSlashCommands() - Retrieves all command files from ~/.claude/commands
// Parses markdown with frontmatter for metadata
```

**Purpose**: Loads and parses command files from the commands directory.

**Note**: Contains temporary code for screenshot generation.

---

#### `src/utils/date-grouping.ts`

##### Type Definitions (Lines 3-15)
```typescript
// DateCategory type: "Today" | "Yesterday" | "This Week" | etc.
// MessageGroup interface with sortKey for proper ordering
// sortKey ensures sections appear in chronological order
```

**Purpose**: Defines types for date-based message grouping.

**Key Feature**: `sortKey` enables proper chronological section ordering.

---

##### Date Categorization (Lines 17-67)
```typescript
// getDateCategory() - Determines which date bucket a message belongs to
// Normalizes dates to midnight for accurate comparison
// Checks categories in order: Today → Yesterday → This Week → This Month → This Year → Older
```

**Purpose**: Categorizes messages into human-readable date periods.

**Algorithm**:
1. Normalize dates to midnight
2. Check categories in priority order
3. Return matching category

---

##### Section Sorting (Lines 70-90)
```typescript
// Section display order hardcoded for consistent UI
// getSectionSortKey() - Calculates sort key for each section
// Year-based sections convert to numbers for descending order
// Example: "2024" → -2024, "2023" → -2023 for newest first
```

**Purpose**: Ensures sections appear in correct order in UI.

**Clever Trick**: Converts years to negative numbers for descending sort.

---

##### Grouping Logic (Lines 93-130)
```typescript
// groupMessagesByDate() - Groups messages into sections
// Uses Map to collect messages by category
// Converts to array and sorts by section order
// formatSectionTitle() - Formats section headers (e.g., "This Week", "2024")
```

**Purpose**: Main function that groups and sorts messages by date.

**Implementation**: Uses Map for efficient grouping, then converts to sorted array.

---

#### `src/utils/changelog.ts`

##### Parsing Logic (Lines 18-42)
```typescript
// Matches version headers (## [X.X.X])
// Saves previous version when new version found
// Adds change items with leading character removal (-, *, +)
// Reminder comment: "Don't forget the last version!"
```

**Purpose**: Parses markdown changelog into structured data.

**Format**: Expects GitHub-style changelog with `## [version]` headers.

**Important**: Comment reminder to save the last version after loop ends.

---

#### `src/utils/network-simulation.ts`

##### Development Testing (Lines 4-7)
```typescript
// Loads .env file in development mode
// Enables SIMULATE_SLOW_NETWORK and NETWORK_DELAY_MS
// Used for testing loading states and error handling
```

**Purpose**: Simulates slow network conditions for testing.

**Environment Variables**:
- `SIMULATE_SLOW_NETWORK=true`
- `NETWORK_DELAY_MS=5000`

---

#### `src/utils/markdown-formatter.ts`

##### Formatting Functions (Lines 1-23)
```typescript
// File-level documentation: "Utilities for formatting markdown content"
// formatContentMarkdown() - Formats message content with metadata
// Parameters: content, timestamp, role (optional)
// formatCodeBlock() - Wraps content in markdown code blocks
// Parameters: content, language (optional)
```

**Purpose**: Utilities for formatting markdown content in detail views.

**Functions**:
- `formatContentMarkdown()` - Adds metadata header to content
- `formatCodeBlock()` - Wraps content in triple backticks

---

### Component Files

#### `src/components/paste-action.tsx`

##### Component Documentation (Lines 8-22)
```typescript
// PasteAction component pastes content to frontmost application
// Uses Action.Paste from Raycast API
// Silent failure with fallback title for clipboard errors
// Reusable across multiple commands
```

**Purpose**: Reusable component for pasting content to active application.

**Error Handling**: Gracefully handles clipboard errors with fallback.

---

#### `src/constants/commands-data.ts`

##### Section Markers
```typescript
// Line 11: "// Commands"
// Line 234: "// Keyboard Shortcuts"
// Line 341: "// Multiline Input"
// Line 371: "// Quick Prefixes"
// Line 405: "// CLI Flags & Arguments"
// Line 518: "// Special Keywords & Hidden Features"
// Line 573: "// Configuration Commands"
// Line 626: "// File Operations"
```

**Purpose**: Organizes 600+ lines of cheat sheet data into logical categories.

**Structure**: Each section marked with simple comment line for easy navigation.

---

### Command List Files

#### `src/commands/sent-messages/list.tsx`

##### List Logic (Lines 21-51)
```typescript
// Line 21-22: Sorts messages by timestamp (newest first)
// Line 40-45: Filters messages with normal search function
// Line 48-51: Groups messages by date for section display
```

**Purpose**: Documents the three-stage message processing pipeline.

**Pipeline**:
1. Sort by timestamp
2. Filter by search term
3. Group by date category

---

#### `src/commands/received-messages/list.tsx`

##### List Logic (Lines 21-51)
```typescript
// Line 21-22: Sorts messages by timestamp (newest first)
// Line 40-45: Filters messages with normal search function
// Line 48-51: Groups messages by date for section display
// Identical structure to sent-messages for consistency
```

**Purpose**: Same pipeline as sent-messages for consistency.

**Design**: Maintains identical structure across both message commands.

---

#### `src/commands/create-snippet/list.tsx`

##### Form Handling (Lines 11-39)
```typescript
// Line 11-13: Handles both LaunchProps and direct props
// Allows pre-populating from other commands
// Line 38-39: Navigation back to browse-snippets using popToRoot()
```

**Purpose**: Documents dual-mode form handling.

**Modes**:
1. Direct launch (empty form)
2. Launch from context (pre-populated)

---

#### `src/commands/browse-snippets/list.tsx`

##### Snippet Management (Lines 29-53)
```typescript
// Line 29-30: Sorts snippets by most recently updated
// Line 47-53: Filters snippets with normalSearchSnippets function
// Searches both title and content fields
```

**Purpose**: Documents snippet sorting and search behavior.

**Search**: Searches both title and content for better results.

---

### Test Setup Files

#### `src/__tests__/setup.ts`

##### Test Configuration (Lines 4-31)
```typescript
// Line 4: Testing library configuration for Raycast
// Line 7: Global test environment setup
// Line 10: Sets up proper act() environment for concurrent React features
// Line 31: Simple test to prevent Jest empty suite complaint
```

**Purpose**: Configures Jest testing environment.

**Setup**:
- Mocks Raycast API
- Configures React testing
- Prevents empty suite warnings

---

## Architecture Summary

### Design Patterns

#### List + Detail Pattern
All 8 commands follow this pattern:
- **Entry Point** (`src/<command>.tsx`) - Lightweight re-export
- **List View** (`src/commands/<command>/list.tsx`) - Searchable item list
- **Detail View** (`src/commands/<command>/detail.tsx`) - Full content display

#### Component Reusability
- `PasteAction` - Reusable paste component
- Action panels shared across list and detail views
- Consistent markdown rendering across commands

---

### Data Flow Architecture

#### Message System (`src/utils/claude-messages.ts`)
```
~/.claude/projects/
  └── [project-id]/
      └── conversations/
          └── [timestamp].jsonl
```

**Flow**:
1. Scan `~/.claude/projects/` directory
2. Find most recent projects by file activity
3. Stream parse JSONL files line-by-line
4. Filter by message type (user/assistant)
5. Global sort by timestamp
6. Format for Raycast display

**Key Feature**: Streaming parser prevents memory issues with large files.

---

#### Search Architecture (`src/utils/ai-search.ts`)
- **Simple keyword search** using case-insensitive substring matching
- **normalSearch()** for messages (searches content only)
- **normalSearchSnippets()** for snippets (searches title + content)

---

#### Date Grouping (`src/utils/date-grouping.ts`)
**Categories**:
- Today
- Yesterday
- This Week
- This Month
- This Year
- Older (grouped by year)

**Algorithm**:
1. Categorize each message by date
2. Group messages into sections
3. Sort sections chronologically
4. Format section titles

---

### Performance Optimizations

#### Streaming Parser
- **Problem**: Large JSONL files (100MB+) cause out-of-memory crashes
- **Solution**: Line-by-line reading with `readline` and `createReadStream`
- **Benefit**: Constant memory usage regardless of file size

#### Scan Limits
- **MAX_PROJECTS_TO_SCAN**: 5 projects
- **MAX_FILES_PER_PROJECT**: 5 files per project
- **Total**: Maximum 25 files scanned
- **Benefit**: Fast initial load, covers 99% of use cases

#### Sequential Processing
- **Pattern**: `await` in loops instead of `Promise.all()`
- **Reason**: Prevents memory spikes from parallel file operations
- **Trade-off**: Slightly slower but more stable

---

### Testing Infrastructure

#### Jest Configuration (`jest.config.js`)
- Uses `ts-jest` preset with `jsdom` environment
- Mocks `@raycast/api` via `src/__mocks__/raycast-api.ts`
- Setup file: `src/__tests__/setup.ts`

#### Test Patterns
- **Component tests**: Mock Raycast API components
- **Utility tests**: Mock Node.js modules (fs, readline)
- **Coverage goal**: 90%+ on new utilities
- **Always mock external dependencies**: fetch, filesystem, etc.

---

### Development Features

#### Network Simulation
```bash
# .env file
SIMULATE_SLOW_NETWORK=true
NETWORK_DELAY_MS=5000
```

**Purpose**: Test loading states and error handling with simulated slow network.

**Usage**: Only active in development mode (`environment.isDevelopment`).

---

#### React DevTools Integration
- **Shortcut**: `⌘ ⌥ D` during development
- **Purpose**: Inspect component props and state in real-time
- **Package**: `react-devtools` in devDependencies

---

### Code Quality Standards

#### File Naming Conventions
- **Commands**: kebab-case (e.g., `browse-snippets.tsx`)
- **Components**: PascalCase exports (e.g., `export default BrowseSnippets`)
- **Utilities**: kebab-case (e.g., `claude-messages.ts`)

#### Required Verification Steps
After any code changes:
1. `npm run fix-lint` - Auto-fix linting issues
2. `npm run build` - Ensure compilation succeeds
3. `npm test` - Verify all tests pass

**Enforcement**: Husky pre-commit hooks ensure linting passes before commits.

---

## Key Insights

### Most Critical Files

1. **`src/utils/claude-message.ts`** (583 lines)
   - Most complex and most documented
   - Streaming parser architecture
   - Message retrieval algorithm
   - Snippet CRUD operations

2. **`src/utils/date-grouping.ts`** (130 lines)
   - Date categorization logic
   - Section sorting algorithm
   - Essential for message organization

3. **`src/constants/commands-data.ts`** (800+ lines)
   - All cheat sheet content
   - Reference for Claude Code features
   - Must stay in sync with Claude Code updates

---

### Common Patterns

#### Error Handling
- Graceful degradation (skip invalid JSON, continue processing)
- Toast notifications for user-facing errors
- Silent failures with fallbacks (clipboard operations)

#### Resource Management
- Explicit cleanup of file streams and readline interfaces
- Try/finally blocks for guaranteed cleanup
- Prevents memory leaks in long-running operations

#### User Experience
- Loading states for async operations
- HUD notifications for quick actions
- Window auto-close on quick copy actions
- Confirmation dialogs for destructive actions (delete)

---

### Documentation Philosophy

The codebase follows a **documentation-first approach** for complex logic:

1. **Type comments** explain data structures
2. **Function comments** describe purpose and parameters
3. **Inline comments** explain algorithm steps
4. **Step-by-step comments** for complex operations
5. **Bug fix comments** explain why code exists

**Most Documented**: `claude-message.ts` has extensive step-by-step documentation because it handles the most complex logic (streaming parsing, multi-file aggregation, memory management).

---

## Quick Reference

### Commands at a Glance

| Command | Primary Shortcut | Data Source | Purpose |
|---------|-----------------|-------------|---------|
| Browse Agents | `⌘+↵` Copy | `~/.claude/agents/` | View agents |
| Browse Commands | `⌘+↵` Copy | `~/.claude/commands/` | View commands |
| Browse Snippets | `⌘+↵` Copy, `⌘+N` New, `⌘+D` Duplicate | `~/.claude/projects/` | Manage snippets |
| Changelog | None | GitHub | View releases |
| Cheat Sheet | `⌘+↵` Copy | Static data | Quick reference |
| Create Snippet | None | `~/.claude/projects/` | Create snippets |
| Sent Messages | `⌘+↵` Copy, `⌘+S` Snippet, `⌘+R` Refresh | `~/.claude/projects/` | View your prompts |
| Received Messages | `⌘+↵` Copy, `⌘+S` Snippet, `⌘+R` Refresh | `~/.claude/projects/` | View Claude responses |

---

### Development Commands

```bash
# Core workflow
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run fix-lint         # Auto-fix linting issues (REQUIRED after changes)
npm run lint             # Check linting

# Testing
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # Generate coverage report

# Publishing
npm run publish          # Publish to Raycast Store
```

---

## Conclusion

This codebase demonstrates **production-quality architecture** with:
- **Memory-efficient streaming** for large file handling
- **Comprehensive error handling** with graceful degradation
- **Consistent UI patterns** across all commands
- **Extensive documentation** for complex logic
- **Strong testing infrastructure** with high coverage goals
- **Performance optimizations** (scan limits, streaming, sequential processing)

The **most complex component** is the message system (`claude-message.ts`), which handles parsing potentially 100MB+ JSONL files without crashing, while maintaining good performance through streaming and smart limiting strategies.

---

**Report Generated**: 2025-11-12
**Total Pages**: 8
**Total Shortcuts**: 22
**Total Lines of Code**: ~5,000+ across src/
**Test Coverage**: 90%+ goal
