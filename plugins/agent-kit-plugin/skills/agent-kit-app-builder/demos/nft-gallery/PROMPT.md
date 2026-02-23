Using the Hedera Agent Kit app builder skill, build me an NFT Gallery & Minter.

Create a Next.js app with TypeScript and Tailwind CSS where I can:
1. Create new NFT collections (name, symbol, max supply or infinite)
2. Mint NFTs to a collection with metadata fields (name, description, image URL)
3. Browse all NFTs in a collection in a masonry/grid gallery view
4. Click any NFT to see its full metadata in a detail modal
5. View all my NFT collections in a sidebar

Requirements:
- shadcn/ui components, dark theme, visually rich gallery layout
- Support image URLs in metadata for NFT thumbnails (use placeholder images if none provided)
- Server-side API routes for all token operations
- Show collection stats: total minted, max supply, collection token ID
- Each NFT card shows: serial number, name from metadata, thumbnail
- HashScan links for all token IDs and transaction hashes

After building, use the Hedera MCP server to create an NFT collection called "AI Art Collection" (symbol: AIART, infinite supply), then mint 2 NFTs with sample metadata including name, description, and a placeholder image URL. Verify they appear in the gallery.
