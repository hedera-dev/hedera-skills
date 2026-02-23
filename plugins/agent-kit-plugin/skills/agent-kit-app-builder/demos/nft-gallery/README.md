# NFT Gallery & Minter Demo

## What It Builds

An NFT Gallery and Minter where you can create NFT collections, mint NFTs with metadata (name, description, image URL), and browse them in a visually rich gallery view.

## Hedera Services Used

- **HTS (Hedera Token Service)** — NFT collection creation, NFT minting
- **Mirror Node REST API** — NFT metadata and collection queries

## Prerequisites

- Node.js 18+
- Hedera testnet account (free at [portal.hedera.com](https://portal.hedera.com))
- `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` environment variables set

## Expected Result

A Next.js app with:
- Create NFT collection form (name, symbol, max supply or infinite)
- Mint NFT form with metadata fields (name, description, image URL)
- Masonry/grid gallery view of minted NFTs
- NFT detail modal with full metadata
- Collection sidebar with stats (total minted, max supply)
- HashScan links for all token IDs and transactions
- Dark theme, visually rich layout (shadcn/ui)

## How to Run

Copy the contents of `PROMPT.md` into your AI coding agent and let it build the app.
