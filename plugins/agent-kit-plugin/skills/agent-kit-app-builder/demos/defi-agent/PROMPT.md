Using the Hedera Agent Kit app builder skill, build me a Hedera DeFi Agent app (Category B — "Powered by Agent Kit").

Create a Next.js app with TypeScript and Tailwind CSS that embeds a LangGraph AI agent with hedera-agent-kit tools. Users interact through text and voice, and the agent reasons about which tools to call and executes Hedera operations autonomously.

The app should have three sections:
1. **Top: Input Bar** — Text input field + microphone button (Web Speech API for voice-to-text) + send button
2. **Center: Chat + Pipeline Visualizer** — Shows the conversation with the agent, and for each agent action, displays a pipeline step card with the tool name, input parameters, output result, HashScan links, and elapsed time
3. **Right: Account Dashboard** — Shows the operator's HBAR balance, token balances, and recent transactions. Auto-refreshes after each agent operation.

Architecture:
- `/api/agent` endpoint: Creates a LangGraph agent using `createReactAgent` from `@langchain/langgraph/prebuilt` with hedera-agent-kit tools (core plugins + Memejob for testnet). Auto-detects LLM provider from env vars (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY). Streams execution via SSE using `agent.stream()` with `streamMode: 'updates'` — emitting tool_start, tool_call, and result events.
- `/api/account/info` endpoint: Returns operator account info (balance, tokens, recent transactions) from Mirror Node API.
- Voice input via Web Speech API (SpeechRecognition) — no server-side processing needed.
- LLM model property name is `model` (not `modelName`): e.g., `new ChatGroq({ model: 'llama-3.3-70b-versatile' })`

IMPORTANT — LLM provider setup:
- Use `@langchain/langgraph` and `@langchain/core` (NOT `langchain` main package)
- Agent is created with: `import { createReactAgent } from '@langchain/langgraph/prebuilt'`
- NO `createToolCallingAgent` or `AgentExecutor` — those are removed from langchain v1.x
- Groq free tier has a 12k TPM limit. Loading all plugins (~38 tools, ~34k tokens) exceeds this. Load only needed plugins for Groq free tier (e.g., coreAccountQueryPlugin + coreTokenQueryPlugin + coreConsensusPlugin ≈ 9 tools). OpenAI/Anthropic handle the full tool set.

The agent should be able to handle requests like:
- "What's my HBAR balance?" → calls get_hbar_balance_query_tool
- "Create a token called GameCoin with 50000 supply" → calls create_fungible_token_tool
- "Launch a meme coin called PEPE" → calls create_memejob_token_tool
- "Create an HCS topic for my project" → calls create_topic_tool
- "Airdrop 100 tokens to these 5 accounts" → calls airdrop_fungible_token_tool

Include suggested action chips below the input bar: "Check my balance", "Create a token", "Create an HCS topic", "Launch a meme coin"

Requirements:
- Use shadcn/ui components for a polished, production-grade dark theme UI
- Use `@hashgraph/sdk` (NOT `@hiero-ledger/sdk` — see troubleshooting in skill references)
- Connect to Hedera testnet using env vars from .env.local
- Requires ONE LLM API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY) — auto-detect which is set
- Server-side SSE streaming from the agent endpoint using `agent.stream()`
- Pipeline visualizer cards show tool name, parameters (collapsible), result with HashScan links, elapsed time
- Service badges on each tool call (HTS=green, HCS=blue, Account=gray, Query=cyan)
- Account dashboard auto-refreshes after each agent operation completes
- Voice input with microphone button (Web Speech API) — graceful fallback if browser doesn't support it
- Loading states, toast notifications (use sonner, not shadcn toast), network badge, LLM provider indicator in header
- Use the lazy-init Proxy pattern for the Hedera client (see network-config.md) so `next build` works without env vars

After building the app, use the Hedera MCP server to verify the operator account exists and has HBAR balance.
