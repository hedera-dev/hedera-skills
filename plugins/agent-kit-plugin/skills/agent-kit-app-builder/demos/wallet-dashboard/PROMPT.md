Using the Hedera Agent Kit app builder skill, build me a Wallet Dashboard app.

Create a Next.js app with TypeScript and Tailwind CSS where I can:
1. Enter any Hedera account ID in a search bar to look up their portfolio
2. See an account overview card with HBAR balance, account ID, and key type
3. View all fungible token holdings in a sortable table (token name, symbol, balance, token ID)
4. Browse NFTs owned by the account in a gallery grid
5. See recent transactions in a timeline view with status, type, and HashScan links

Requirements:
- Use the Hedera Mirror Node REST API for all data fetching (this is read-only, no private key needed for queries)
- shadcn/ui components, dark theme, responsive layout
- Auto-load my operator account on first visit (from env vars)
- Include a "Popular Accounts" section with a few pre-loaded testnet accounts
- Clicking any token should link to its page on HashScan
- Support both testnet and mainnet via a network toggle switch in the header

After building, use the Hedera MCP tools to query my operator account and verify the dashboard displays correct data.
