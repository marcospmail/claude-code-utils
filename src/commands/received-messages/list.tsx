import { getReceivedMessages } from "../../utils/claude-message";
import MessageList from "../../components/message-list";

export default function ReceivedMessages() {
  return (
    <MessageList
      role="assistant"
      fetchMessages={getReceivedMessages}
      searchPlaceholder="Browse received messages..."
      emptyLabel="received messages"
    />
  );
}
