import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  showToast,
  Toast,
  showHUD,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { getSentMessages, ParsedMessage } from "./utils/claudeMessages";

export default function LatestSentMessage() {
  const [latestMessage, setLatestMessage] = useState<ParsedMessage | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLatestMessage() {
      setIsLoading(true);
      try {
        const sentMessages = await getSentMessages();
        if (sentMessages.length > 0) {
          setLatestMessage(sentMessages[0]); // First message is the latest
        }
      } catch (error) {
        console.error({ error });
        showToast({
          style: Toast.Style.Failure,
          title: "Error loading message",
          message: String(error),
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadLatestMessage();
  }, []);

  async function copyContent() {
    if (!latestMessage) return;

    try {
      await Clipboard.copy(latestMessage.content);
      await showHUD("Latest sent message copied to clipboard");
    } catch (error) {
      console.error({ error });
      showToast({
        style: Toast.Style.Failure,
        title: "Copy failed",
        message: String(error),
      });
    }
  }

  if (isLoading) {
    return (
      <Detail isLoading={true} markdown="Loading latest sent message..." />
    );
  }

  if (!latestMessage) {
    return <Detail markdown="No sent messages found in your Claude history" />;
  }

  const markdown = `${latestMessage.content}

---

**${latestMessage.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}**`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Copy Message" onAction={copyContent} />
        </ActionPanel>
      }
    />
  );
}
