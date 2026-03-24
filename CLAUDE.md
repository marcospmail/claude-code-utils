# CLAUDE.md

## Development Commands

- `pnpm run dev` - Start Raycast development server with hot reload
- `pnpm run build` - Build extension for production
- `pnpm run fix-lint` - Auto-fix linting issues
- `pnpm run lint` - Check linting (must pass before committing)
- `pnpm run publish` - Publish to Raycast Store (not npm)

## Architecture Overview

### Extension Structure
This is a Raycast extension with 10 commands following the **List + Detail pattern**:
- Each command has an entry point in `src/<command-name>.tsx` that exports from `src/commands/<command-name>/list.tsx`
- List views (`list.tsx`) display searchable items
- Detail views (`detail.tsx`) show full content with actions
- Entry points exist for: `changelog`, `browse-agents`, `browse-commands`, `browse-snippets`, `create-snippet`, `sent-messages`, `received-messages`, `cheatsheet`, `search-sessions`, `browse-skills`, `chat`, `status`

### Shared Components (`src/components/`)
- `message-list.tsx` — Reusable list view for both sent and received messages (accepts `role`, `fetchMessages`, `searchPlaceholder`, `emptyLabel`). Handles loading, search, date grouping, lazy full-content loading on selection.
- `message-detail.tsx` — Reusable detail view for individual messages; lazily loads full content from JSONL on mount.

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

**Date Grouping** (`src/utils/date-grouping.ts`):
- Groups messages by date periods (Today, Yesterday, This Week, etc.) via `groupMessagesByDate()`
- Applied in the shared `MessageList` component (sent-messages and received-messages)

**Shared Claude Utilities** (`src/utils/claude-shared.ts`):
- Extracted shared constants, types, and helpers used by both `claude-message.ts` and `session-search.ts`
- Contains: `CLAUDE_DIR`, concurrency constants, `ContentItem`, `JSONLMessage`, `JSONLEntry` types, `readCwdFromJsonl()`, `runWithConcurrency()`

**Skills** (`src/utils/skill.ts`):
- Reads skill directories from `~/.claude/skills/`
- Each skill is a directory with a `SKILL.md` file containing YAML frontmatter (name, description, model, context, allowed-tools)
- Key function: `getSkills()`

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

### Post-Change Verification (REQUIRED)
After any code changes, **ALWAYS** run these before considering a task complete:
1. `pnpm run fix-lint` - Auto-fix linting issues
2. `pnpm run build` - Ensure compilation succeeds

Fix any failures before finishing.
