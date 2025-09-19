const { getSentMessages, getAllClaudeMessages } = require('./dist/utils/claudeMessages.js');

async function test() {
  try {
    console.log('Testing getSentMessages...');
    const sentMessages = await getSentMessages();
    console.log('Sent messages count:', sentMessages.length);

    console.log('\nTesting getAllClaudeMessages...');
    const allMessages = await getAllClaudeMessages();
    console.log('All messages count:', allMessages.length);

    if (sentMessages.length > 0) {
      console.log('\nFirst sent message preview:', sentMessages[0].preview);
    }

    if (allMessages.length > 0) {
      console.log('First all message content (truncated):', allMessages[0].content.substring(0, 50) + '...');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

test();