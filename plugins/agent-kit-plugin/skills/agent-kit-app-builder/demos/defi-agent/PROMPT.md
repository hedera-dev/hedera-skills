Using the Hedera Agent Kit app builder skill, build me a Hedera DeFi Agent app (Category B — "Powered by Agent Kit").

Create a Next.js app with TypeScript and Tailwind CSS that embeds a LangChain AI agent with ALL hedera-agent-kit tools. Users interact through text and voice, and the agent reasons about which tools to call and executes Hedera operations autonomously.

The app should have three sections:
1. **Top: Input Bar** — Text input field + microphone button (Web Speech API for voice-to-text) + send button
2. **Center: Chat + Pipeline Visualizer** — Shows the conversation with the agent, and for each agent action, displays a pipeline step card with the tool name, input parameters, output result, HashScan links, and elapsed time
3. **Right: Account Dashboard** — Shows the operator's HBAR balance, token balances, and recent transactions. Auto-refreshes after each agent operation.

Architecture:
- `/api/agent` endpoint: Initializes a LangChain agent (`createToolCallingAgent` + `AgentExecutor`) with ALL hedera-agent-kit tools (core plugins + SaucerSwap + Bonzo + Memejob). Auto-detects LLM provider from env vars (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY). Streams execution via SSE — status updates, tool calls with input/output, and final response.
- `/api/account/info` endpoint: Returns operator account info (balance, tokens, recent transactions) from Mirror Node API.
- Voice input via Web Speech API (SpeechRecognition) — no server-side processing needed.

The agent should be able to handle requests like:
- "What's my HBAR balance?" → calls get_hbar_balance_query_tool
- "Create a token called GameCoin with 50000 supply" → calls create_fungible_token_tool
- "Swap 100 HBAR for SAUCE on SaucerSwap" → calls saucerswap_get_quote → saucerswap_swap
- "Borrow 50 USDC on Bonzo" → chains bonzo_supply + bonzo_borrow
- "Launch a meme coin called PEPE" → calls memejob_create
- "Airdrop 100 tokens to these 5 accounts" → calls airdrop_fungible_token_tool

Include suggested action chips below the input bar: "Check my balance", "Create a token", "Swap tokens", "Launch a meme coin"

Requirements:
- Use shadcn/ui components for a polished, production-grade dark theme UI
- Connect to Hedera testnet using env vars from .env.local
- Requires ONE LLM API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY) — auto-detect which is set
- Server-side SSE streaming from the agent endpoint
- Pipeline visualizer cards show agent reasoning, tool name, parameters (collapsible), result with HashScan links, elapsed time
- Service badges on each tool call (HTS=green, HCS=blue, DeFi=purple, Account=gray, EVM=orange, Query=cyan)
- Account dashboard auto-refreshes after each agent operation completes
- Voice input with microphone button (Web Speech API) — graceful fallback if browser doesn't support it
- Loading states, toast notifications, network badge, LLM provider indicator in header

After building the app, use the Hedera MCP server to verify the operator account exists and has HBAR balance.
