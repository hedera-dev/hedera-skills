Using the Hedera Agent Kit app builder skill, build me a Token Launchpad app.

Create a Next.js app with TypeScript and Tailwind CSS where I can:
1. Create new Hedera fungible tokens — form with fields for name, symbol, initial supply, and decimals
2. See all tokens I've created in a card grid layout
3. Mint additional supply of any token via a dialog
4. Transfer tokens to another Hedera account
5. View my HBAR balance and all token balances in a sidebar panel

Requirements:
- Use shadcn/ui components for a polished, production-grade dark theme UI
- Connect to Hedera testnet using env vars from .env.local
- Server-side API routes for all Hedera operations (never expose private keys to client)
- Show transaction hashes as clickable links to HashScan testnet explorer
- Include loading spinners for all blockchain operations
- Toast notifications for successful/failed transactions
- Network badge showing "Testnet" in the header

After building the app, use the Hedera MCP server to create a test token called "DemoToken" (symbol: DMT, supply: 10000, decimals: 2) so the UI has data to display immediately.
