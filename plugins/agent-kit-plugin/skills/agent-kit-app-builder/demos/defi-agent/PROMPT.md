Using the Hedera Agent Kit app builder skill, build me a Hedera DeFi Agent app (Category B — "Powered by Agent Kit").

Create a Next.js app with TypeScript and Tailwind CSS that embeds a LangGraph AI agent with hedera-agent-kit tools. Users interact through text and voice, and the agent reasons about which tools to call and executes Hedera operations autonomously.

The app should have three sections:
1. **Top: Input Bar** — Text input field + microphone button (Web Speech API for voice-to-text) + send button
2. **Center: Chat + Pipeline Visualizer** — Shows the conversation with the agent, and for each agent action, displays a pipeline step card with the tool name, input parameters, output result, HashScan links, and elapsed time
3. **Right: Account Dashboard** — Shows the operator's HBAR balance, token balances, and recent transactions. Auto-refreshes after each agent operation.

Architecture:
- `/api/agent` endpoint: Creates a LangGraph agent using `createReactAgent` from `@langchain/langgraph/prebuilt` with hedera-agent-kit tools (core plugins + Memejob for testnet). Auto-detects LLM provider from env vars (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY). Streams execution via SSE using `agent.stream()` with `streamMode: 'updates'` — emitting thinking, tool_start, tool_end, message, and done events.
- **CRITICAL — System prompt:** The `/api/agent` route MUST inject a `SystemMessage` before the `HumanMessage` containing the operator account ID (`process.env.HEDERA_OPERATOR_ID`) and network. Without this, the agent hallucinates account IDs when the user says "check my balance". See `agent-kit-sdk-reference.md` > "System Prompt with Operator Context".
- **Agent reasoning:** When a LangGraph agent message has both `content` (reasoning) and `tool_calls`, emit the content as a `thinking` event (not `message`). Display this in the UI as a distinct thinking bubble above tool call cards. This showcases the agent's decision-making process. See `agent-kit-sdk-reference.md` > "Thinking Events".
- **Instant tool results:** In the `tool_end` handler, extract `humanMessage` from tool results as interim `assistantContent` so users see the answer immediately. After tool_end, the agent makes a SECOND LLM call to summarize — this can take 30-60s on Groq. The tool result already contains the answer (e.g., `"Account 0.0.7995234 has a balance of 944.45 HBAR"`). **CRITICAL: Mark interim content with an `isInterimContent` flag.** When the real `message` event arrives, **replace** the interim content instead of appending — otherwise the UI shows a garbled concat of raw tool output + agent summary. See `frontend-patterns.md` > Pattern 5 for the full hook implementation.
- **Done fallback:** When the stream completes and no `message` event was emitted but tool calls exist, synthesize a brief "Done — see tool results above." message to prevent the "Thinking..." label from persisting.
- **Conditional "Thinking..." display:** Only show the "Thinking..." fallback text when the assistant message has NO tool calls AND no thinking content. When tool calls exist, hide the empty content bubble entirely.
- **Conversation history (agent memory):** The client hook MUST send the full conversation history (`{ message, history }`) to the `/api/agent` endpoint. The API route reconstructs it as `[SystemMessage, ...HumanMessage/AIMessage pairs, new HumanMessage]` using `BaseMessage[]` typing. Without this, the agent has no memory — it can't reference tokens/topics created in earlier turns.
- **Markdown rendering + HashScan links:** Install `react-markdown`. Agent responses contain markdown (`**bold**`, lists). Auto-link Hedera entity IDs (`0.0.XXXXX`) and transaction IDs to HashScan using a pre-processing regex before passing to ReactMarkdown. Set `NEXT_PUBLIC_HEDERA_NETWORK` in `.env.local` for client-side HashScan URL construction.
- `/api/account/info` endpoint: Returns operator account info (balance, tokens, recent transactions) from Mirror Node API.
- Voice input via Web Speech API (SpeechRecognition) — no server-side processing needed.
- LLM model property name is `model` (not `modelName`): e.g., `new ChatGroq({ model: 'llama-3.3-70b-versatile', maxTokens: 1024 })`
- Add `maxTokens: 1024` to the LLM config to prevent runaway responses and improve speed (especially with Groq)

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

Include descriptive suggested action chips below the input bar: "Check my HBAR balance", "Create a fungible token called TEST", "Create an HCS topic for audit logs", "Launch a meme coin on Memejob"

The welcome screen (when no messages exist) should show capability categories instead of a generic message:
- Account — Check balances, view tokens
- Tokens — Create fungible tokens, mint NFTs, airdrop
- Consensus — Create topics, post messages
- Meme Coins — Launch meme tokens via Memejob

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
- Use the lazy-init getter pattern for the Hedera client (see network-config.md) so `next build` works without env vars. Do NOT use `new Proxy({} as Client, ...)` — it breaks `instanceof Client` checks in third-party plugins like Memejob

TypeScript notes:
- Use `--no-react-compiler` when running `create-next-app` (it prompts interactively otherwise)
- After scaffolding, replace `next.config.ts` with `turbopack: { root: path.resolve(__dirname) }` to silence the lockfile warning
- `createReactAgent({ llm, tools })` causes "Type instantiation is excessively deep" — cast: `createReactAgent({ llm, tools } as any)`
- LangGraph stream chunks: `chunk.agent.messages` and `chunk.tools.messages` are not directly iterable — cast chunk to `any` and use `Array.isArray()` before iterating
- `SpeechRecognition` and `SpeechRecognitionEvent` types don't exist in standard TS DOM typings — use `any` casts
- For dynamic LLM provider imports (auto-detect from env vars), use `require()` with eslint-disable `@typescript-eslint/no-require-imports`
- Pipeline tool call `result` is typed as `unknown` — use `result != null && <JSX>` (not `result && <JSX>`)

After building the app, use the Hedera MCP server to verify the operator account exists and has HBAR balance.
