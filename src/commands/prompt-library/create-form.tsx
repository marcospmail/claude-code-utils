import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { saveCustomPrompt } from "../../utils/prompts";

const CATEGORIES = ["Review", "Refactoring", "Debugging", "Docs", "Testing", "Planning", "Custom"];

export default function CreatePromptForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: {
    name: string;
    category: string;
    description: string;
    prompt: string;
    model: string;
  }) {
    if (!values.name.trim() || !values.prompt.trim()) {
      showToast({ style: Toast.Style.Failure, title: "Name and prompt template are required" });
      return;
    }

    setIsLoading(true);
    try {
      await saveCustomPrompt({
        name: values.name.trim(),
        category: values.category,
        description: values.description.trim(),
        prompt: values.prompt.trim(),
        variables: extractVariables(values.prompt),
        model: values.model || undefined,
      });
      showToast({ style: Toast.Style.Success, title: "Prompt created", message: values.name });
      popToRoot();
    } catch (err) {
      showToast({ style: Toast.Style.Failure, title: "Failed to create prompt", message: String(err) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Create Custom Prompt"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Prompt" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" placeholder="My Custom Prompt" />
      <Form.Dropdown id="category" title="Category" defaultValue="Custom">
        {CATEGORIES.map((cat) => (
          <Form.Dropdown.Item key={cat} value={cat} title={cat} />
        ))}
      </Form.Dropdown>
      <Form.TextField id="description" title="Description" placeholder="What does this prompt do?" />
      <Form.TextArea id="prompt" title="Prompt Template" placeholder="Use {{variableName}} for variables..." />
      <Form.Dropdown id="model" title="Model (Optional)" defaultValue="">
        <Form.Dropdown.Item value="" title="Default" />
        <Form.Dropdown.Item value="sonnet" title="Sonnet" />
        <Form.Dropdown.Item value="opus" title="Opus" />
        <Form.Dropdown.Item value="haiku" title="Haiku" />
      </Form.Dropdown>
    </Form>
  );
}

function extractVariables(template: string): { name: string; description: string; type: "code" }[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const seen = new Set<string>();
  const variables: { name: string; description: string; type: "code" }[] = [];
  for (const match of matches) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      variables.push({ name, description: `Value for ${name}`, type: "code" });
    }
  }
  return variables;
}
