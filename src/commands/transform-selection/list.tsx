import { Action, ActionPanel, Form, getSelectedText, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import TransformExecute from "./execute";

interface Transform {
  id: string;
  title: string;
  description: string;
  icon: Icon;
  prompt: string;
  requiresVariable?: { name: string; options: string[] };
}

const TRANSFORMS: Transform[] = [
  {
    id: "explain",
    title: "Explain Code",
    description: "Explain what this code does step by step",
    icon: Icon.Book,
    prompt:
      "Explain this code concisely:\n\n```\n{{code}}\n```\n\nCover what it does, how it works, and any notable patterns.",
  },
  {
    id: "find-bugs",
    title: "Find Bugs",
    description: "Find potential bugs and issues",
    icon: Icon.Bug,
    prompt:
      "Analyze this code for bugs and potential issues:\n\n```\n{{code}}\n```\n\nLook for logic errors, edge cases, null/undefined issues, and security vulnerabilities. Be specific about each problem found.",
  },
  {
    id: "convert-language",
    title: "Convert Language",
    description: "Convert to another programming language",
    icon: Icon.Switch,
    prompt:
      "Convert this code to {{language}}:\n\n```\n{{code}}\n```\n\nPreserve the logic and use idiomatic patterns for the target language. Return only the converted code.",
    requiresVariable: {
      name: "language",
      options: ["Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "C#", "Ruby", "Swift", "Kotlin"],
    },
  },
  {
    id: "add-types",
    title: "Add TypeScript Types",
    description: "Add TypeScript type annotations",
    icon: Icon.Text,
    prompt:
      "Add comprehensive TypeScript type annotations to this code:\n\n```\n{{code}}\n```\n\nInclude interfaces and type guards where appropriate. Return the typed code.",
  },
  {
    id: "optimize",
    title: "Optimize Code",
    description: "Suggest performance optimizations",
    icon: Icon.Gauge,
    prompt:
      "Suggest performance optimizations for this code:\n\n```\n{{code}}\n```\n\nShow the optimized version with explanations.",
  },
  {
    id: "add-comments",
    title: "Add Comments",
    description: "Add inline comments explaining the code",
    icon: Icon.SpeechBubble,
    prompt:
      "Add clear, concise inline comments to this code:\n\n```\n{{code}}\n```\n\nDon't over-comment obvious things. Return the commented code.",
  },
  {
    id: "simplify",
    title: "Simplify Code",
    description: "Simplify and improve readability",
    icon: Icon.Wand,
    prompt:
      "Simplify this code and improve readability while preserving behavior:\n\n```\n{{code}}\n```\n\nReturn the simplified code with brief explanation of changes.",
  },
  {
    id: "write-tests",
    title: "Write Tests",
    description: "Generate unit tests for this code",
    icon: Icon.CheckCircle,
    prompt:
      "Write comprehensive unit tests for this code:\n\n```\n{{code}}\n```\n\nCover happy paths, edge cases, and error scenarios.",
  },
  {
    id: "generate-types",
    title: "Generate Types from JSON",
    description: "Generate TypeScript types from JSON data",
    icon: Icon.CodeBlock,
    prompt:
      "Generate TypeScript interfaces/types from this JSON data:\n\n```\n{{code}}\n```\n\nHandle nested objects and arrays properly.",
  },
  {
    id: "markdown-table",
    title: "Convert to Markdown Table",
    description: "Convert data to a markdown table",
    icon: Icon.AppWindowGrid3x3,
    prompt:
      "Convert this data into a well-formatted markdown table:\n\n```\n{{code}}\n```\n\nReturn only the markdown table, no explanation.",
  },
  {
    id: "explain-regex",
    title: "Explain Regex",
    description: "Explain what this regex pattern does",
    icon: Icon.MagnifyingGlass,
    prompt:
      "Explain this regex pattern in detail:\n\n```\n{{code}}\n```\n\nBreak down each part and give examples of what it matches and doesn't match.",
  },
];

export default function TransformSelection() {
  const [selectedText, setSelectedText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [languageForm, setLanguageForm] = useState<Transform | null>(null);
  const [languageChoice, setLanguageChoice] = useState("");

  useEffect(() => {
    async function loadText() {
      try {
        const text = await getSelectedText();
        setSelectedText(text);
      } catch {
        // no text selected
      }
      setIsLoading(false);
    }
    loadText();
  }, []);

  if (languageForm && languageChoice) {
    const prompt = languageForm.prompt.replace("{{language}}", languageChoice).replace("{{code}}", selectedText);
    return <TransformExecute transformName={`${languageForm.title} → ${languageChoice}`} prompt={prompt} />;
  }

  if (languageForm) {
    return (
      <Form
        navigationTitle="Select Target Language"
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Convert"
              onSubmit={(values: { language: string }) => setLanguageChoice(values.language)}
            />
          </ActionPanel>
        }
      >
        <Form.Dropdown id="language" title="Target Language" defaultValue={languageForm.requiresVariable!.options[0]}>
          {languageForm.requiresVariable!.options.map((lang) => (
            <Form.Dropdown.Item key={lang} value={lang} title={lang} />
          ))}
        </Form.Dropdown>
      </Form>
    );
  }

  const textInfo = selectedText
    ? `${selectedText.length} chars, ${selectedText.split("\n").length} lines`
    : "No text selected";

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search transforms...">
      <List.Section title="Transforms" subtitle={selectedText ? textInfo : "No text selected"}>
        {TRANSFORMS.map((transform) => (
          <List.Item
            key={transform.id}
            title={transform.title}
            subtitle={transform.description}
            icon={transform.icon}
            actions={
              <ActionPanel>
                {selectedText ? (
                  transform.requiresVariable ? (
                    <Action
                      title="Run Transform"
                      icon={Icon.Play}
                      onAction={() => {
                        setLanguageForm(transform);
                      }}
                    />
                  ) : (
                    <Action.Push
                      title="Run Transform"
                      icon={Icon.Play}
                      target={
                        <TransformExecute
                          transformName={transform.title}
                          prompt={transform.prompt.replace("{{code}}", selectedText)}
                        />
                      }
                    />
                  )
                ) : (
                  <Action
                    title="No Text Selected"
                    icon={Icon.ExclamationMark}
                    onAction={() =>
                      showToast({
                        style: Toast.Style.Failure,
                        title: "No text selected",
                        message: "Select text or copy to clipboard first",
                      })
                    }
                  />
                )}
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
