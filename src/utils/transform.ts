import { LocalStorage } from "@raycast/api";
import { createHash } from "crypto";

const LIST_KEY = "transform-list";
const SEEDED_KEY = "transform-seeded";

// Legacy placeholder replaced by {{selection}}; migrated on load for pre-existing stored data.
const LEGACY_SELECTION_PLACEHOLDER = "{{code}}";
const SELECTION_PLACEHOLDER = "{{selection}}";

export type TransformModel = "haiku" | "sonnet" | "opus";
export type TransformEffort = "low" | "medium" | "high" | "xhigh" | "max";
export type TransformOutput = "show" | "replace";

export const DEFAULT_MODEL: TransformModel = "haiku";
export const DEFAULT_OUTPUT: TransformOutput = "show";

export const EFFORT_LEVELS_BY_MODEL: Record<TransformModel, TransformEffort[]> = {
  haiku: [],
  sonnet: ["low", "medium", "high", "max"],
  opus: ["low", "medium", "high", "xhigh", "max"],
};

export interface Transform {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
  model: TransformModel;
  effort?: TransformEffort;
  output: TransformOutput;
  copyToClipboard: boolean;
  requiresVariable?: { name: string; options: string[] };
}

export function generateTransformId(title: string): string {
  return createHash("md5").update(`${title}-${Date.now()}`).digest("hex");
}

const BUILT_IN_TRANSFORMS: Transform[] = [
  {
    id: "explain",
    title: "Explain Code",
    description: "Explain what this code does step by step",
    icon: "Book",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Explain this code concisely:\n\n```\n{{selection}}\n```\n\nCover what it does, how it works, and any notable patterns.",
  },
  {
    id: "find-bugs",
    title: "Find Bugs",
    description: "Find potential bugs and issues",
    icon: "Bug",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Analyze this code for bugs and potential issues:\n\n```\n{{selection}}\n```\n\nLook for logic errors, edge cases, null/undefined issues, and security vulnerabilities. Be specific about each problem found.",
  },
  {
    id: "convert-language",
    title: "Convert Language",
    description: "Convert to another programming language",
    icon: "Switch",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Convert this code to {{language}}:\n\n```\n{{selection}}\n```\n\nPreserve the logic and use idiomatic patterns for the target language. Return only the converted code.",
    requiresVariable: {
      name: "language",
      options: ["Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "C#", "Ruby", "Swift", "Kotlin"],
    },
  },
  {
    id: "add-types",
    title: "Add TypeScript Types",
    description: "Add TypeScript type annotations",
    icon: "Text",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Add comprehensive TypeScript type annotations to this code:\n\n```\n{{selection}}\n```\n\nInclude interfaces and type guards where appropriate. Return the typed code.",
  },
  {
    id: "optimize",
    title: "Optimize Code",
    description: "Suggest performance optimizations",
    icon: "Gauge",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Suggest performance optimizations for this code:\n\n```\n{{selection}}\n```\n\nShow the optimized version with explanations.",
  },
  {
    id: "add-comments",
    title: "Add Comments",
    description: "Add inline comments explaining the code",
    icon: "SpeechBubble",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Add clear, concise inline comments to this code:\n\n```\n{{selection}}\n```\n\nDon't over-comment obvious things. Return the commented code.",
  },
  {
    id: "simplify",
    title: "Simplify Code",
    description: "Simplify and improve readability",
    icon: "Wand",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Simplify this code and improve readability while preserving behavior:\n\n```\n{{selection}}\n```\n\nReturn the simplified code with brief explanation of changes.",
  },
  {
    id: "write-tests",
    title: "Write Tests",
    description: "Generate unit tests for this code",
    icon: "CheckCircle",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Write comprehensive unit tests for this code:\n\n```\n{{selection}}\n```\n\nCover happy paths, edge cases, and error scenarios.",
  },
  {
    id: "generate-types",
    title: "Generate Types from JSON",
    description: "Generate TypeScript types from JSON data",
    icon: "CodeBlock",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Generate TypeScript interfaces/types from this JSON data:\n\n```\n{{selection}}\n```\n\nHandle nested objects and arrays properly.",
  },
  {
    id: "markdown-table",
    title: "Convert to Markdown Table",
    description: "Convert data to a markdown table",
    icon: "AppWindowGrid3x3",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Convert this data into a well-formatted markdown table:\n\n```\n{{selection}}\n```\n\nReturn only the markdown table, no explanation.",
  },
  {
    id: "explain-regex",
    title: "Explain Regex",
    description: "Explain what this regex pattern does",
    icon: "MagnifyingGlass",
    model: DEFAULT_MODEL,
    output: DEFAULT_OUTPUT,
    copyToClipboard: false,
    prompt:
      "Explain this regex pattern in detail:\n\n```\n{{selection}}\n```\n\nBreak down each part and give examples of what it matches and doesn't match.",
  },
];

export async function getTransforms(): Promise<Transform[]> {
  try {
    const seeded = await LocalStorage.getItem<string>(SEEDED_KEY);
    if (!seeded) {
      await LocalStorage.setItem(LIST_KEY, JSON.stringify(BUILT_IN_TRANSFORMS));
      await LocalStorage.setItem(SEEDED_KEY, "true");
      return BUILT_IN_TRANSFORMS;
    }
    const data = await LocalStorage.getItem<string>(LIST_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // One-time self-healing migration for data stored before:
    //  - the {{code}} → {{selection}} placeholder rename
    //  - the `output` field existing
    //  - "clipboard" output being split into the independent `copyToClipboard` flag
    // Idempotent: only writes back if something changed.
    let changed = false;
    const migrated = (parsed as Transform[]).map((t) => {
      const prompt = t.prompt.replaceAll(LEGACY_SELECTION_PLACEHOLDER, SELECTION_PLACEHOLDER);
      // Legacy output "clipboard" becomes output "show" + copyToClipboard true.
      const wasClipboard = (t.output as string) === "clipboard";
      const output: TransformOutput = wasClipboard ? "show" : (t.output ?? DEFAULT_OUTPUT);
      const copyToClipboard = wasClipboard ? true : (t.copyToClipboard ?? false);
      if (prompt !== t.prompt || output !== t.output || copyToClipboard !== t.copyToClipboard) {
        changed = true;
      }
      return { ...t, prompt, output, copyToClipboard };
    });
    if (changed) {
      await LocalStorage.setItem(LIST_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
}

export async function saveTransform(transform: Transform): Promise<void> {
  const transforms = await getTransforms();
  const idx = transforms.findIndex((t) => t.id === transform.id);
  if (idx >= 0) {
    transforms[idx] = transform;
  } else {
    transforms.push(transform);
  }
  await LocalStorage.setItem(LIST_KEY, JSON.stringify(transforms));
}

export async function deleteTransform(id: string): Promise<void> {
  const transforms = await getTransforms();
  await LocalStorage.setItem(LIST_KEY, JSON.stringify(transforms.filter((t) => t.id !== id)));
}
