import {
  ActionPanel,
  Action,
  List,
  Icon,
  Clipboard,
  showHUD,
} from "@raycast/api";
import ReceivedMessages from "./received-messages";
import SentMessages from "./sent-messages";
import PinnedMessages from "./pinned-messages";
import LatestSentMessage from "./latest-sent-message";
import LatestReceivedMessage from "./latest-received-message";
import CreateSnippet from "./create-snippet";
import ListSnippets from "./list-snippets";
import { getSentMessages, getReceivedMessages } from "./utils/claudeMessages";

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
    title: "Claude's Responses",
    description: "View messages you received from Claude",
    icon: Icon.Message,
    component: ReceivedMessages,
  },
  {
    id: "sent-messages",
    title: "My Sent Messages",
    description: "View messages you sent to Claude",
    icon: Icon.Message,
    component: SentMessages,
  },
];

const pinnedOptions: Option[] = [
  {
    id: "pinned-messages",
    title: "Pinned Messages",
    description: "View your pinned Claude messages",
    icon: Icon.Pin,
    component: PinnedMessages,
  },
];

const snippetsOptions: Option[] = [
  {
    id: "create-snippet",
    title: "Create",
    description: "Create a new snippet",
    icon: Icon.Plus,
    component: CreateSnippet,
  },
  {
    id: "list-snippets",
    title: "List",
    description: "View and manage your snippets",
    icon: Icon.Document,
    component: ListSnippets,
  },
];

const latestOptions: Option[] = [
  {
    id: "latest-sent",
    title: "Latest Sent Message",
    description: "View your most recent message sent to Claude",
    icon: Icon.ArrowUp,
    component: LatestSentMessage,
  },
  {
    id: "latest-received",
    title: "Latest Claude Response",
    description: "View Claude's most recent response",
    icon: Icon.ArrowDown,
    component: LatestReceivedMessage,
  },
];

export default function ClaudeCodeHelper() {
  async function copyLatestSent() {
    try {
      const messages = await getSentMessages();
      if (messages.length > 0) {
        await Clipboard.copy(messages[0].content);
        await showHUD("Latest sent message copied to clipboard");
      } else {
        await showHUD("No sent messages found");
      }
    } catch {
      await showHUD("Failed to copy message");
    }
  }

  async function copyLatestReceived() {
    try {
      const messages = await getReceivedMessages();
      if (messages.length > 0) {
        await Clipboard.copy(messages[0].content);
        await showHUD("Latest Claude response copied to clipboard");
      } else {
        await showHUD("No received messages found");
      }
    } catch {
      await showHUD("Failed to copy message");
    }
  }

  return (
    <List searchBarPlaceholder="Search Claude Code helper options...">
      <List.Section title="Pinned">
        {pinnedOptions.map((option) => (
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
      <List.Section title="Latest">
        {latestOptions.map((option) => (
          <List.Item
            key={option.id}
            title={option.title}
            subtitle={option.description}
            icon={option.icon}
            actions={
              <ActionPanel>
                <Action.Push title="Open" target={<option.component />} />
                <Action
                  title="Copy Message"
                  onAction={
                    option.id === "latest-sent"
                      ? copyLatestSent
                      : copyLatestReceived
                  }
                  shortcut={{ modifiers: ["cmd"], key: "enter" }}
                />
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
