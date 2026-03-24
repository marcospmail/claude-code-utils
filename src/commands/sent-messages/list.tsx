import { getSentMessages } from "../../utils/claude-message";
import MessageList from "../../components/message-list";

export default function SentMessages() {
  return (
    <MessageList
      role="user"
      fetchMessages={getSentMessages}
      searchPlaceholder="Browse sent messages..."
      emptyLabel="sent messages"
    />
  );
}
