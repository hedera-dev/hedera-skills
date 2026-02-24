Using the Hedera Agent Kit app builder skill, build me a Meme Coin Launchpad app (Category A — "Built with Agent Kit").

Create a Next.js app with TypeScript and Tailwind CSS that launches a meme token in one click by chaining 3 Agent Kit plugins (Memejob, core consensus, SaucerSwap) in a visible 6-step pipeline.

The app should have two panels:
1. **Left: Config Form** — Token name, symbol, description, image URL, initial buy amount (HBAR), and liquidity amount (HBAR)
2. **Right: Pipeline Visualizer** — Shows each of the 6 steps executing in real-time with tool names, status (pending/executing/success/error), parameters (collapsible), results with HashScan links, and elapsed time

The 6 pipeline steps (executed sequentially via SSE streaming):
1. Create meme token via `memejob_create` (bonding curve) → returns tokenId
2. Buy creator's initial position via `memejob_buy` → returns tokens acquired
3. Query token state via `get_token_info_query_tool` → confirms supply/metadata
4. Create community topic via `create_topic_tool` → returns topicId
5. Post launch announcement to HCS with token/topic details → logged
6. Seed SaucerSwap liquidity (token + HBAR pair) via `saucerswap_add_liquidity` → returns pool info

After the pipeline completes, show a "Launch Card" summary below with all created resources (token ID, topic ID, pool info) and HashScan links.

Requirements:
- Use shadcn/ui components for a polished, production-grade dark theme UI
- Connect to Hedera testnet using env vars from .env.local (HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_NETWORK only — no LLM key needed)
- Server-side SSE endpoint at `/api/pipeline` that executes tools sequentially and streams events
- Use the pipeline execution engine pattern from the skill's references (toolkit.getTools() + sequential execution + SSE)
- Pipeline steps should resolve references from previous steps (e.g., step 2 uses tokenId from step 1)
- Service badges on each step card (HTS=green, HCS=blue, DeFi=purple)
- All entity IDs in results should be clickable HashScan links
- Loading states, toast notifications, network badge showing "Testnet"
- No LLM or AI agent — this is a regular app using the agent kit as a function library

After building the app, use the Hedera MCP server to verify the operator account has sufficient HBAR balance for the launch.
