Using the Hedera Agent Kit app builder skill, build me a Decentralized Message Board.

Create a Next.js app with TypeScript and Tailwind CSS that uses Hedera Consensus Service:
1. Create new discussion topics with a title/memo
2. View all topics in a sidebar
3. Select a topic to see its message history with timestamps and sequence numbers
4. Post new messages to any topic via a compose input
5. Messages auto-refresh every 5 seconds

Requirements:
- shadcn/ui components, dark theme, split-pane layout (topics sidebar + message feed)
- Server-side API routes for topic creation and message submission
- Use Mirror Node API for reading messages (polling)
- Each message should show: content (base64 decoded), sequence number, timestamp
- Toast notifications when a message is successfully posted
- Show topic ID in the header area for the active topic

After building, use the Hedera MCP server to create a topic with memo "General Discussion" and post 3 test messages: "Hello Hedera!", "HCS is amazing", "This runs on hashgraph consensus" — then verify they appear in the message feed.
