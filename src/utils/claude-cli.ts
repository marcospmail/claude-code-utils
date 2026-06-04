import { getPreferenceValues } from "@raycast/api";
import { execFile, spawn } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { access, constants } from "fs/promises";
import { homedir, tmpdir, userInfo } from "os";
import { join } from "path";

export interface ClaudeResponse {
  result: string;
  sessionId?: string;
}

interface MessagesErrorBody {
  error?: { type?: string; message?: string };
}

interface MessagesSuccessBody {
  content?: Array<{ type?: string; text?: string }>;
}

// --- Shared ---

const DEFAULT_MODEL = "haiku";
const KEYCHAIN_TIMEOUT_MS = 5000;
const AUTH_ERROR_MESSAGE = "Claude authentication expired. Open Claude Code and run /login to refresh, then try again.";

// --- Direct API (haiku only — the OAuth token is permitted to call haiku on the bare API) ---

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const API_BETA = "oauth-2025-04-20";
const MAX_TOKENS = 16000;
const API_TIMEOUT_MS = 60000;
const HTTP_UNAUTHORIZED = 401;

// Short model aliases mapped to the current API model IDs. Unknown values pass through,
// so a full model ID can also be supplied directly.
const MODEL_IDS: Record<string, string> = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
};

// --- CLI (sonnet/opus and any non-haiku model — the sanctioned path for premium models) ---

const CLAUDE_PATHS = [
  join(homedir(), ".local", "bin", "claude"),
  "/opt/homebrew/bin/claude",
  "/usr/local/bin/claude",
  join(homedir(), ".npm-global", "bin", "claude"),
];
const CLI_TIMEOUT_MS = 120_000;

export async function getOAuthToken(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const account = userInfo().username;
    execFile(
      "security",
      ["find-generic-password", "-s", "Claude Code-credentials", "-a", account, "-w"],
      { timeout: KEYCHAIN_TIMEOUT_MS },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(undefined);
          return;
        }
        try {
          const creds = JSON.parse(stdout.trim());
          resolve(creds.claudeAiOauth?.accessToken);
        } catch {
          resolve(undefined);
        }
      },
    );
  });
}

async function findClaudeInPath(): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("which", ["claude"]);
    let stdout = "";
    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    proc.on("close", (code) => {
      const path = stdout.trim();
      if (code === 0 && path) {
        resolve(path);
      } else {
        reject(new Error("Claude CLI not found"));
      }
    });
    proc.on("error", () => reject(new Error("Claude CLI not found")));
  });
}

async function getClaudePath(): Promise<string> {
  const { claudeCliPath } = getPreferenceValues<{ claudeCliPath?: string }>();
  if (claudeCliPath) {
    await access(claudeCliPath, constants.X_OK);
    return claudeCliPath;
  }

  for (const p of CLAUDE_PATHS) {
    try {
      await access(p, constants.X_OK);
      return p;
    } catch {
      // try next
    }
  }
  return findClaudeInPath();
}

// Direct Anthropic Messages API call. No Claude Code identity / no claude-code beta — only the
// bare oauth-2025-04-20 token, which is permitted for haiku. ~0.9s vs ~5s for the CLI.
type ChatMessage = { role: "user" | "assistant"; content: string };

// Shared direct-API call for one or more messages (single-shot or full conversation).
async function requestApi(
  messages: ChatMessage[],
  options?: { model?: string; effort?: string; systemPrompt?: string },
): Promise<ClaudeResponse> {
  const token = await getOAuthToken();
  if (!token) {
    throw new Error(AUTH_ERROR_MESSAGE);
  }

  const modelKey = options?.model ?? DEFAULT_MODEL;
  const model = MODEL_IDS[modelKey] ?? modelKey;

  const body: Record<string, unknown> = {
    model,
    max_tokens: MAX_TOKENS,
    messages,
  };
  if (options?.systemPrompt) {
    body.system = options.systemPrompt;
  }
  // Only send effort when set — haiku rejects it and the API 400s on an empty value.
  if (options?.effort) {
    body.output_config = { effort: options.effort };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-beta": API_BETA,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === HTTP_UNAUTHORIZED) {
        throw new Error(AUTH_ERROR_MESSAGE);
      }
      let message = "";
      try {
        const errBody = (await res.json()) as MessagesErrorBody;
        message = errBody?.error?.message ?? "";
      } catch {
        // non-JSON error body
      }
      throw new Error(message || `HTTP ${res.status}`);
    }

    const data = (await res.json()) as MessagesSuccessBody;
    const blocks = Array.isArray(data.content) ? data.content : [];
    let text = "";
    for (const block of blocks) {
      if (block?.type === "text") {
        text += block.text ?? "";
      }
    }
    if (!text) {
      throw new Error("Claude API returned empty output");
    }
    return { result: text };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Single-shot direct API call (one user message).
async function executeViaApi(
  prompt: string,
  options?: { model?: string; effort?: string; systemPrompt?: string },
): Promise<ClaudeResponse> {
  return requestApi([{ role: "user", content: prompt }], options);
}

// CLI spawn path — always isolated + stateless single-shot. Used by both executePrompt and the
// conversation CLI branch (which serializes full history into the prompt). Session resume is NOT
// used. Isolation requires a FRESH EMPTY working dir: --setting-sources "" alone does NOT suppress
// Claude Code's cwd-based auto-memory or CLAUDE.md auto-discovery (verified: running in /tmp leaked
// the user's project memory). An empty temp cwd has no project memory and nothing to discover.
async function runCli(
  prompt: string,
  options: { model?: string; systemPrompt?: string; effort?: string },
): Promise<ClaudeResponse> {
  const claudePath = await getClaudePath();
  const workDir = mkdtempSync(join(tmpdir(), "cc-chat-"));

  // Use --print + stdin for prompt delivery (more reliable than -p flag for multi-line prompts)
  // Disable all settings/plugins/skills so responses aren't contaminated by CLAUDE.md or plugins
  const args = [
    "--print",
    "--output-format",
    "json",
    "--setting-sources",
    "",
    "--disable-slash-commands",
    "--no-session-persistence",
  ];
  if (options.systemPrompt) {
    args.push("--system-prompt", options.systemPrompt);
  }
  if (options.model) {
    args.push("--model", options.model);
  }
  if (options.effort) {
    args.push("--effort", options.effort);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { CLAUDECODE, ...cleanEnv } = process.env;
  cleanEnv.HOME = homedir();

  const oauthToken = await getOAuthToken();
  if (oauthToken) {
    cleanEnv.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;
  }

  function cleanup() {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      // ignore — empty temp dir
    }
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(claudePath, args, {
      cwd: workDir,
      env: cleanEnv,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Send prompt via stdin and close (same approach as claude-code-worker)
    proc.stdin!.write(prompt);
    proc.stdin!.end();

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("Claude CLI timed out after 2 minutes"));
    }, CLI_TIMEOUT_MS);

    proc.stdout!.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    proc.stderr!.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      cleanup();

      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr.trim() || `Claude CLI exited with code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        // --output-format json returns a JSON array of messages
        const messages = Array.isArray(parsed) ? parsed : [parsed];

        let text = "";
        let sessionId: string | undefined;

        for (const msg of messages) {
          if (msg.type === "assistant" && msg.message?.content) {
            for (const block of msg.message.content) {
              if (block.type === "text") {
                text += block.text;
              }
            }
          } else if (msg.type === "result") {
            sessionId = msg.session_id;
            if (msg.is_error) {
              reject(new Error(msg.result || "Claude CLI returned an error"));
              return;
            }
            if (!text && msg.result) {
              text = msg.result;
            }
          }
        }

        if (!text) {
          reject(new Error("Claude CLI returned empty output"));
          return;
        }

        resolve({ result: text, sessionId });
      } catch {
        const text = stdout.trim();
        if (!text) {
          reject(new Error(stderr.trim() || "Claude CLI returned empty output"));
          return;
        }
        resolve({ result: text });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    });
  });
}

// Hybrid routing: haiku is allowed on the bare API (fast); sonnet/opus and any other model
// go through the sanctioned, isolated CLI path.
export async function executePrompt(
  prompt: string,
  options?: { model?: string; effort?: string; systemPrompt?: string },
): Promise<ClaudeResponse> {
  const model = options?.model ?? DEFAULT_MODEL;
  if (model === "haiku") {
    return executeViaApi(prompt, { ...options, model });
  }
  return runCli(prompt, { ...options, model });
}

// Serialize the full conversation into a single prompt the model continues. Used for the CLI
// path so each turn is an isolated, stateless single-shot carrying the whole history — no
// session resume (which leaks the user's global CLAUDE.md) and no fragile sessionId state.
function serializeConversation(messages: ChatMessage[]): string {
  const transcript = messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
  return (
    `<conversation>\n${transcript}\n</conversation>\n\n` +
    "Respond as the assistant to the latest User message, using the conversation above for context. " +
    "Reply with only your message, no role prefix."
  );
}

// Multi-turn conversation. Both paths send the FULL history every turn (stateless, isolated):
// haiku → the messages array via the API; sonnet/opus → a serialized transcript via the CLI.
export async function executeConversation(
  messages: ChatMessage[],
  options: { model?: string; systemPrompt?: string },
): Promise<ClaudeResponse> {
  const model = options.model ?? DEFAULT_MODEL;
  if (model === "haiku") {
    return requestApi(messages, { model, systemPrompt: options.systemPrompt });
  }
  return runCli(serializeConversation(messages), { model, systemPrompt: options.systemPrompt });
}
