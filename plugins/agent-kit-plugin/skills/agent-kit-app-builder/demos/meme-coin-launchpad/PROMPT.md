Using the Hedera Agent Kit app builder skill, build me a Meme Coin Launchpad app (Category A — "Built with Agent Kit").

Create a Next.js app with TypeScript and Tailwind CSS that launches a meme token in one click by chaining Memejob, core consensus, and account query plugins in a visible 6-step pipeline.

The app should have two panels:
1. **Left: Config Form** — Token name, symbol, description (used as token memo — cannot be empty), image URL, initial buy amount (HBAR)
2. **Right: Pipeline Visualizer** — Shows each of the 6 steps executing in real-time with tool names, status (pending/executing/success/error), parameters (collapsible), results with HashScan links, and elapsed time

The 6 pipeline steps (executed sequentially via SSE streaming):
1. Create meme token via `create_memejob_token_tool` (bonding curve) → returns tokenId
2. Buy creator's initial position via `buy_memejob_token_tool` → returns tokens acquired
3. Query token state via `get_token_info_query_tool` → confirms supply/metadata
4. Create community topic via `create_topic_tool` → returns topicId
5. Post launch announcement to HCS via `submit_topic_message_tool` with token/topic details → logged
6. Verify tokens in creator's wallet via `get_account_token_balances_query_tool` → confirms receipt

After the pipeline completes, show a "Launch Card" summary below with all created resources (token ID, topic ID, token balance) and HashScan links.

Requirements:
- Use shadcn/ui components for a polished, production-grade dark theme UI
- Use `@hashgraph/sdk` (NOT `@hiero-ledger/sdk` — see troubleshooting in skill references)
- Connect to Hedera testnet using env vars from .env.local (HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_NETWORK only — no LLM key needed)
- Server-side SSE endpoint at `/api/pipeline` that executes tools sequentially and streams events
- Use the pipeline execution engine pattern from the skill's references (toolkit.getTools() + sequential execution + SSE)
- Pipeline steps should resolve references from previous steps (e.g., step 2 uses tokenId from step 1)
- The `create_memejob_token_tool` requires params: `{ required: { name, symbol, memo }, optional?: { amount } }` — memo cannot be empty
- The `buy_memejob_token_tool` requires params: `{ required: { tokenId, amount } }` — amount in HBAR
- Service badges on each step card (HTS=green, HCS=blue, Query=cyan)
- All entity IDs in results should be clickable HashScan links
- Loading states, toast notifications (use sonner, not shadcn toast), network badge showing "Testnet"
- No LLM or AI agent — this is a regular app using the agent kit as a function library
- Use the lazy-init getter pattern for the Hedera client (see network-config.md) so `next build` works without env vars. Do NOT use `new Proxy({} as Client, ...)` — it breaks `instanceof Client` checks in third-party plugins like Memejob

TypeScript notes:
- Use `--no-react-compiler` when running `create-next-app` (it prompts interactively otherwise)
- After scaffolding, replace `next.config.ts` with `turbopack: { root: path.resolve(__dirname) }` to silence the lockfile warning
- Pipeline step `result` is typed as `unknown` — use `step.result != null && <JSX>` (not `step.result && <JSX>`) to avoid "Type 'unknown' is not assignable to type 'ReactNode'" errors
- `create_topic_tool` returns topicId as a nested Long object `{ shard, realm, num: { low: N } }` — parse from `humanMessage` instead: `parsed.humanMessage.match(/topic id (0\.0\.\d+)/i)`

After building the app, use the Hedera MCP server to verify the operator account has sufficient HBAR balance for the launch.
