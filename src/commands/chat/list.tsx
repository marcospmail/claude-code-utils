import { Action, ActionPanel, Form, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";
import ChatConversation from "./execute";

const MODELS = [
  { value: "haiku", title: "Haiku (fast)" },
  { value: "sonnet", title: "Sonnet (balanced)" },
  { value: "opus", title: "Opus (powerful)" },
];

const DEFAULT_MODEL = "sonnet";

export default function ChatForm() {
  const [seed, setSeed] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    getSelectedText()
      .then((text) => {
        if (text) setSeed(text);
      })
      .catch(() => {});
  }, []);

  if (started) {
    return <ChatConversation model={model} seedMessage={seed} />;
  }

  return (
    <Form
      navigationTitle="New Chat"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Start Chat" onSubmit={() => setStarted(true)} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="model" title="Model" value={model} onChange={setModel}>
        {MODELS.map((m) => (
          <Form.Dropdown.Item key={m.value} value={m.value} title={m.title} />
        ))}
      </Form.Dropdown>
      <Form.Description text="The model stays fixed for the whole conversation." />
    </Form>
  );
}
