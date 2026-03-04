import { Action, ActionPanel, Clipboard, Form, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { PromptTemplate, substituteVariables } from "../../utils/prompts";
import ExecutePromptView from "./execute";

interface VariableFormProps {
  prompt: PromptTemplate;
}

export default function VariableForm({ prompt }: VariableFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [clipboardText, setClipboardText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Clipboard.readText().then((text) => {
      if (text) setClipboardText(text);
    });
  }, []);

  // Pre-fill selection/code type variables with clipboard
  useEffect(() => {
    if (!clipboardText) return;
    const initial: Record<string, string> = {};
    for (const v of prompt.variables) {
      if (v.type === "selection" || v.type === "code") {
        initial[v.name] = clipboardText;
      } else if (v.default) {
        initial[v.name] = v.default;
      }
    }
    setValues(initial);
  }, [clipboardText]);

  function handleSubmit() {
    // Validate required fields
    for (const v of prompt.variables) {
      if (!values[v.name]?.trim()) {
        showToast({ style: Toast.Style.Failure, title: `${v.name} is required` });
        return;
      }
    }
    setSubmitted(true);
  }

  if (submitted) {
    const fullPrompt = substituteVariables(prompt.prompt, values);
    return (
      <ExecutePromptView promptId={prompt.id} promptName={prompt.name} fullPrompt={fullPrompt} model={prompt.model} />
    );
  }

  return (
    <Form
      navigationTitle={`${prompt.name} - Variables`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Run Prompt" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text={prompt.description} />
      {prompt.variables.map((v) =>
        v.type === "text" ? (
          <Form.TextField
            key={v.name}
            id={v.name}
            title={v.name}
            placeholder={v.description}
            value={values[v.name] ?? v.default ?? ""}
            onChange={(val) => setValues((prev) => ({ ...prev, [v.name]: val }))}
          />
        ) : v.type === "path" ? (
          <Form.FilePicker
            key={v.name}
            id={v.name}
            title={v.name}
            onChange={(files) => setValues((prev) => ({ ...prev, [v.name]: files[0] ?? "" }))}
          />
        ) : (
          <Form.TextArea
            key={v.name}
            id={v.name}
            title={v.name}
            placeholder={v.description}
            value={values[v.name] ?? ""}
            onChange={(val) => setValues((prev) => ({ ...prev, [v.name]: val }))}
          />
        ),
      )}
    </Form>
  );
}
