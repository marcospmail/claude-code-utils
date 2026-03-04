import { Action, ActionPanel, Form, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";
import ExecuteChatView from "./execute";

const MODELS = [
  { value: "haiku", title: "Haiku" },
  { value: "sonnet", title: "Sonnet" },
  { value: "opus", title: "Opus" },
];

export default function ChatForm() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSelectedText()
      .then((text) => {
        if (text) setMessage(text);
      })
      .catch(() => {});
  }, []);
  const [model, setModel] = useState("sonnet");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <ExecuteChatView message={message} model={model} />;
  }

  return (
    <Form
      navigationTitle="Chat with Claude"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send" onSubmit={() => setSubmitted(true)} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="message"
        title="Message"
        placeholder="Type your message..."
        value={message}
        onChange={setMessage}
      />
      <Form.Dropdown id="model" title="Model" value={model} onChange={setModel}>
        {MODELS.map((m) => (
          <Form.Dropdown.Item key={m.value} value={m.value} title={m.title} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
