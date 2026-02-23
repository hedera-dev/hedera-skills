# HCS Message Board Demo

## What It Builds

A decentralized message board using Hedera Consensus Service (HCS) — create discussion topics, post messages, and view message history with consensus timestamps and sequence numbers.

## Hedera Services Used

- **HCS (Hedera Consensus Service)** — topic creation, message submission
- **Mirror Node REST API** — message polling and retrieval

## Prerequisites

- Node.js 18+
- Hedera testnet account (free at [portal.hedera.com](https://portal.hedera.com))
- `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` environment variables set

## Expected Result

A Next.js app with:
- Split-pane layout: topic list sidebar + message feed
- Create topic form (with memo/title)
- Message feed with content, sequence numbers, and timestamps
- Compose message input
- Auto-refresh every 5 seconds
- Toast notifications for posted messages
- Dark theme, production-quality UI (shadcn/ui)

## How to Run

Copy the contents of `PROMPT.md` into your AI coding agent and let it build the app.
