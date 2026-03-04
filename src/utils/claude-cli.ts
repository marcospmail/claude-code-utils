import { getPreferenceValues } from "@raycast/api";
import { execFile, spawn } from "child_process";
import { access, constants } from "fs/promises";
import { homedir, userInfo } from "os";
import { join } from "path";

export interface ClaudeResponse {
  result: string;
  sessionId?: string;
}

const CLAUDE_PATHS = [
  join(homedir(), ".local", "bin", "claude"),
  "/opt/homebrew/bin/claude",
  "/usr/local/bin/claude",
  join(homedir(), ".npm-global", "bin", "claude"),
];
const TIMEOUT_MS = 120_000;

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

async function getOAuthToken(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const account = userInfo().username;
    execFile(
      "security",
      ["find-generic-password", "-s", "Claude Code-credentials", "-a", account, "-w"],
      { timeout: 5000 },
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

export async function getClaudePath(): Promise<string> {
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

export async function isClaudeInstalled(): Promise<boolean> {
  try {
    await getClaudePath();
    return true;
  } catch {
    return false;
  }
}

export async function executePrompt(prompt: string, options?: { model?: string }): Promise<ClaudeResponse> {
  const claudePath = await getClaudePath();

  // Use --print + stdin for prompt delivery (more reliable than -p flag for multi-line prompts)
  const args = ["--print", "--output-format", "json"];
  if (options?.model) {
    args.push("--model", options.model);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { CLAUDECODE, ...cleanEnv } = process.env;
  cleanEnv.HOME = homedir();

  const oauthToken = await getOAuthToken();
  if (oauthToken) {
    cleanEnv.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(claudePath, args, {
      cwd: homedir(),
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
    }, TIMEOUT_MS);

    proc.stdout!.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    proc.stderr!.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);

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
      reject(err);
    });
  });
}
