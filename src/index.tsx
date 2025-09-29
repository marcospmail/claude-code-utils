import { ActionPanel, Action, List, Icon } from "@raycast/api";
import ReceivedMessages from "./received-messages";
import SentMessages from "./sent-messages";
import CreateSnippet from "./create-snippet";
import ListSnippets from "./list-snippets";
import ListCommands from "./list-commands";

interface Option {
  id: string;
  title: string;
  description: string;
  icon: Icon;
  component: React.ComponentType;
}

const conversationOptions: Option[] = [
  {
    id: "received-messages",
    title: "Claude Code Utils - Received Messages",
    description: "View messages you received from Claude",
    icon: Icon.Message,
    component: ReceivedMessages,
  },
  {
    id: "sent-messages",
    title: "Claude Code Utils - Sent Messages",
    description: "View messages you sent to Claude",
    icon: Icon.Message,
    component: SentMessages,
  },
];

const snippetsOptions: Option[] = [
  {
    id: "create-snippet",
    title: "Claude Code Utils - Create Snippets",
    description: "Create a new snippet",
    icon: Icon.Plus,
    component: CreateSnippet,
  },
  {
    id: "list-snippets",
    title: "Claude Code Utils - List Snippets",
    description: "View and manage your snippets",
    icon: Icon.Document,
    component: ListSnippets,
  },
];

const commandsOptions: Option[] = [
  {
    id: "list-commands",
    title: "Claude Code Utils - Commands Cheat Sheet",
    description: "Browse all Claude Code commands and shortcuts",
    icon: Icon.Terminal,
    component: ListCommands,
  },
];

export default function ClaudeCodeHelper() {
  return (
    <List searchBarPlaceholder="Search Claude Code helper options...">
      <List.Section title="Commands">
        {commandsOptions.map((option) => (
          <List.Item
            key={option.id}
            title={option.title}
            subtitle={option.description}
            icon={option.icon}
            actions={
              <ActionPanel>
                <Action.Push title="Open" target={<option.component />} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Section title="Snippets">
        {snippetsOptions.map((option) => (
          <List.Item
            key={option.id}
            title={option.title}
            subtitle={option.description}
            icon={option.icon}
            actions={
              <ActionPanel>
                <Action.Push title="Open" target={<option.component />} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Section title="Conversations">
        {conversationOptions.map((option) => (
          <List.Item
            key={option.id}
            title={option.title}
            subtitle={option.description}
            icon={option.icon}
            actions={
              <ActionPanel>
                <Action.Push title="Open" target={<option.component />} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
