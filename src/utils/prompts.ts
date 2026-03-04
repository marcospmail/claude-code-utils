import { LocalStorage } from "@raycast/api";
import { randomUUID } from "crypto";

export interface PromptVariable {
  name: string;
  description: string;
  type: "text" | "code" | "selection" | "path";
  default?: string;
  multiline?: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  variables: PromptVariable[];
  systemPrompt?: string;
  model?: string;
  icon?: string;
  isBuiltIn: boolean;
  usageCount: number;
}

const CUSTOM_PROMPTS_KEY = "custom-prompts";
const PROMPT_USAGE_KEY = "prompt-usage";

const BUILT_IN_PROMPTS: Omit<PromptTemplate, "usageCount">[] = [
  // Review
  {
    id: "builtin-code-review",
    name: "Code Review",
    category: "Review",
    description: "Review code for quality, bugs, and best practices",
    prompt:
      "Review the following code. Check for bugs, security issues, performance problems, and suggest improvements.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to review", type: "code" }],
    icon: "magnifying-glass",
    isBuiltIn: true,
  },
  {
    id: "builtin-security-review",
    name: "Security Review",
    category: "Review",
    description: "Audit code for security vulnerabilities",
    prompt:
      "Perform a security audit on the following code. Look for OWASP top 10 vulnerabilities, injection risks, auth issues, and data exposure.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to audit", type: "code" }],
    icon: "shield",
    isBuiltIn: true,
  },
  {
    id: "builtin-pr-review",
    name: "PR Review",
    category: "Review",
    description: "Review a pull request diff",
    prompt:
      "Review this pull request diff. Summarize changes, identify potential issues, and suggest improvements.\n\n```diff\n{{diff}}\n```",
    variables: [{ name: "diff", description: "PR diff content", type: "code" }],
    icon: "code",
    isBuiltIn: true,
  },
  // Refactoring
  {
    id: "builtin-extract-abstract",
    name: "Extract & Abstract",
    category: "Refactoring",
    description: "Extract reusable patterns and abstractions",
    prompt:
      "Analyze this code and suggest extractions: reusable functions, shared abstractions, or design patterns that would improve maintainability.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to refactor", type: "code" }],
    icon: "layers",
    isBuiltIn: true,
  },
  {
    id: "builtin-simplify",
    name: "Simplify Complexity",
    category: "Refactoring",
    description: "Reduce code complexity and improve readability",
    prompt:
      "Simplify this code. Reduce complexity, improve readability, and remove unnecessary abstractions while preserving behavior.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to simplify", type: "code" }],
    icon: "wand",
    isBuiltIn: true,
  },
  {
    id: "builtin-add-types",
    name: "Add Types",
    category: "Refactoring",
    description: "Add TypeScript type annotations",
    prompt:
      "Add comprehensive TypeScript type annotations to this code. Include interfaces, type guards, and generics where appropriate.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to type", type: "code" }],
    icon: "text",
    isBuiltIn: true,
  },
  // Debugging
  {
    id: "builtin-error-diagnosis",
    name: "Error Diagnosis",
    category: "Debugging",
    description: "Diagnose an error message or stack trace",
    prompt:
      "Diagnose this error. Explain what caused it, why it happened, and provide a fix.\n\nError:\n```\n{{error}}\n```\n\nRelevant code:\n```\n{{code}}\n```",
    variables: [
      { name: "error", description: "Error message or stack trace", type: "code" },
      { name: "code", description: "Related code (optional)", type: "code" },
    ],
    icon: "bug",
    isBuiltIn: true,
  },
  {
    id: "builtin-find-bugs",
    name: "Find Bugs",
    category: "Debugging",
    description: "Find potential bugs and edge cases",
    prompt:
      "Analyze this code for potential bugs, edge cases, race conditions, and error handling gaps.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to analyze", type: "code" }],
    icon: "bug",
    isBuiltIn: true,
  },
  // Docs
  {
    id: "builtin-explain-code",
    name: "Explain Code",
    category: "Docs",
    description: "Explain what code does step by step",
    prompt: "Explain what this code does step by step. Be concise but thorough.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to explain", type: "code" }],
    icon: "book",
    isBuiltIn: true,
  },
  {
    id: "builtin-add-comments",
    name: "Add Comments",
    category: "Docs",
    description: "Add inline comments explaining the code",
    prompt:
      "Add clear, concise inline comments to this code explaining what each section does. Don't over-comment obvious things.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to comment", type: "code" }],
    icon: "speech-bubble",
    isBuiltIn: true,
  },
  {
    id: "builtin-api-docs",
    name: "API Documentation",
    category: "Docs",
    description: "Generate API documentation",
    prompt:
      "Generate API documentation for this code. Include function signatures, parameter descriptions, return values, and usage examples.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to document", type: "code" }],
    icon: "document",
    isBuiltIn: true,
  },
  // Testing
  {
    id: "builtin-write-tests",
    name: "Write Tests",
    category: "Testing",
    description: "Generate unit tests for code",
    prompt:
      "Write comprehensive unit tests for this code. Cover happy paths, edge cases, and error scenarios. Use {{framework}} style.\n\n```\n{{code}}\n```",
    variables: [
      { name: "code", description: "Code to test", type: "code" },
      { name: "framework", description: "Test framework (e.g., jest, vitest, mocha)", type: "text", default: "jest" },
    ],
    icon: "check-circle",
    isBuiltIn: true,
  },
  {
    id: "builtin-test-coverage",
    name: "Test Coverage Audit",
    category: "Testing",
    description: "Identify untested code paths",
    prompt:
      "Analyze this code and identify untested code paths, missing edge cases, and areas that need test coverage.\n\n```\n{{code}}\n```",
    variables: [{ name: "code", description: "Code to audit", type: "code" }],
    icon: "bar-chart",
    isBuiltIn: true,
  },
  // Planning
  {
    id: "builtin-architecture-review",
    name: "Architecture Review",
    category: "Planning",
    description: "Review architecture and suggest improvements",
    prompt:
      "Review the architecture described below. Identify potential issues, suggest improvements, and evaluate scalability.\n\n{{description}}",
    variables: [
      { name: "description", description: "Architecture description or code structure", type: "code", multiline: true },
    ],
    icon: "building",
    isBuiltIn: true,
  },
];

async function getUsageCounts(): Promise<Record<string, number>> {
  const data = await LocalStorage.getItem<string>(PROMPT_USAGE_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function getCustomPrompts(): Promise<PromptTemplate[]> {
  const data = await LocalStorage.getItem<string>(CUSTOM_PROMPTS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getAllPrompts(): Promise<PromptTemplate[]> {
  const [usageCounts, customPrompts] = await Promise.all([getUsageCounts(), getCustomPrompts()]);

  const builtIn: PromptTemplate[] = BUILT_IN_PROMPTS.map((p) => ({
    ...p,
    usageCount: usageCounts[p.id] ?? 0,
  }));

  const custom: PromptTemplate[] = customPrompts.map((p) => ({
    ...p,
    usageCount: usageCounts[p.id] ?? 0,
  }));

  return [...builtIn, ...custom];
}

export async function saveCustomPrompt(prompt: Omit<PromptTemplate, "id" | "isBuiltIn" | "usageCount">): Promise<void> {
  const customPrompts = await getCustomPrompts();
  const newPrompt: PromptTemplate = {
    ...prompt,
    id: randomUUID(),
    isBuiltIn: false,
    usageCount: 0,
  };
  customPrompts.push(newPrompt);
  await LocalStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(customPrompts));
}

export async function deleteCustomPrompt(id: string): Promise<void> {
  const customPrompts = await getCustomPrompts();
  const filtered = customPrompts.filter((p) => p.id !== id);
  await LocalStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(filtered));
}

export async function incrementUsageCount(id: string): Promise<void> {
  const counts = await getUsageCounts();
  counts[id] = (counts[id] ?? 0) + 1;
  await LocalStorage.setItem(PROMPT_USAGE_KEY, JSON.stringify(counts));
}

export function substituteVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    return variables[name] !== undefined ? variables[name] : match;
  });
}
