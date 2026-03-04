# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Workflow
- `pnpm run dev` - Start Raycast development server with hot reload
- `pnpm run build` - Build extension for production
- `pnpm run fix-lint` - Auto-fix linting issues (always run after code changes)
- `pnpm run lint` - Check linting (must pass before committing)

### Publishing
- `pnpm run publish` - Publish to Raycast Store (not npm)

## Architecture Overview

### Extension Structure
This is a Raycast extension with 9 commands following the **List + Detail pattern**:
- Each command has an entry point in `src/<command-name>.tsx` that exports from `src/commands/<command-name>/list.tsx`
- List views (`list.tsx`) display searchable items
- Detail views (`detail.tsx`) show full content with actions
- Entry points exist for: `changelog`, `browse-agents`, `browse-commands`, `browse-snippets`, `create-snippet`, `sent-messages`, `received-messages`, `cheatsheet`, `search-sessions`

### Data Flow

**Claude Messages System** (`src/utils/claude-message.ts`):
- Reads from `~/.claude/projects/` directory where Claude Code stores conversations
- Uses **streaming parsers** to handle large JSONL files without loading entire files into memory
- Scans all projects and files with concurrent streaming (10 parallel workers)
- Resolves project names via 3-tier approach: sessions-index.json → JSONL cwd field → directory name fallback
- Processes timestamped JSONL format with line-by-line reading via `createReadStream` + `readline`
- Key functions: `getSentMessages()`, `getReceivedMessages()`, `getSnippets()`

**Session Search** (`src/utils/session-search.ts`):
- Deep content search across all Claude Code session files
- Lists all sessions on mount with fast metadata scan (first 50 lines)
- Full content search with AbortSignal support for cancellation
- Concurrent file processing with configurable worker pool

**Search Architecture** (`src/utils/ai-search.ts`):
- Keyword search functionality for filtering messages and snippets
- Functions: `normalSearch()` for messages, `normalSearchSnippets()` for snippets

**Agents & Commands** (`src/utils/agent.ts`, `src/utils/command.ts`):
- Read markdown files from `~/.claude/agents/` and `~/.claude/commands/`
- Parse YAML frontmatter for metadata
- Generate formatted names from kebab-case filenames

**Changelog Fetching** (`src/utils/changelog.ts`):
- Fetches from `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
- Parses markdown to extract versions and changes

### Component Patterns

**Common List Component Structure**:
```typescript
// State management
const [items, setItems] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [searchText, setSearchText] = useState("");

// Load data on mount
useEffect(() => {
  async function loadData() {
    const data = await fetchFunction();
    setItems(data);
    setIsLoading(false);
  }
  loadData();
}, []);

// List with search
<List
  isLoading={isLoading}
  searchBarPlaceholder="Search items..."
>
```

**Date Grouping** (`src/utils/date-grouping.ts`):
- Messages are grouped by date periods (Today, Yesterday, This Week, etc.)
- Uses `groupMessagesByDate()` function that returns sections with titles
- Applied in sent-messages and received-messages list views

## Special Features

### Network Simulation for Development
Use `.env` file or environment variables to simulate slow network:
```bash
# In .env
SIMULATE_SLOW_NETWORK=true
NETWORK_DELAY_MS=5000

# Or via command line
SIMULATE_SLOW_NETWORK=true pnpm run dev
```
- Only works in development mode (`environment.isDevelopment`)
- Uses `dotenv` package (loaded in `src/utils/network-simulation.ts`)
- Applied to changelog fetching; can be added to other async operations

## Important Conventions

### File Naming
- Commands: kebab-case (e.g., `browse-snippets.tsx`)
- Components: PascalCase exports (e.g., `export default BrowseSnippets`)
- Utilities: kebab-case (e.g., `claude-message.ts`, `date-grouping.ts`)

### Code Quality
- **Always run `pnpm run fix-lint` after changes** - this is critical for consistency
- Use TypeScript strict mode - all utilities and components are fully typed

### Post-Change Verification (REQUIRED)
After making any code changes, **ALWAYS verify the project is in a working state** by running:
1. `pnpm run fix-lint` - Auto-fix any linting issues
2. `pnpm run build` - Ensure compilation succeeds without errors

**Do NOT consider a task complete until both checks pass.** If any check fails, fix the issues before finishing.

### Data Sources
- Claude Code projects: `~/.claude/projects/`
- Claude Code agents: `~/.claude/agents/`
- Claude Code commands: `~/.claude/commands/`

### Performance Considerations
- Large JSONL files: Use streaming parsers (see `claude-message.ts`)
- Concurrent file processing with worker pool (10 parallel workers)
- Use `useMemo` for expensive computations in React components
