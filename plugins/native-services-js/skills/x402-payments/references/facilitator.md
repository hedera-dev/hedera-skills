# Hedera x402 Facilitator

Self-hosted facilitator that verifies and settles native HBAR x402 payments. Re-check [x402 docs](https://docs.x402.org) and [`@x402/hedera`](https://www.npmjs.com/package/@x402/hedera) for protocol updates.

## Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/supported` | Supported payment kinds + fee-payer account clients must use |
| `POST` | `/verify` | Validate signed payment payload against requirements |
| `POST` | `/settle` | Co-sign as fee payer, submit to Hedera, await SUCCESS |
| `GET` | `/health` | Liveness |

Non-custodial: facilitator only adds the fee-payer signature to a transfer the buyer already authorized. It never holds protected resource bytes or the buyer’s funds.

## Environment

| Env var | Default | Description |
| ------- | ------- | ----------- |
| `PORT` | `4020` | HTTP port |
| `X402_NETWORK` | `hedera:testnet` | CAIP-2 network for settle |
| `FACILITATOR_ACCOUNT_ID` | _(required)_ | Funded ECDSA fee-payer account id |
| `FACILITATOR_PRIVATE_KEY` | _(required)_ | ECDSA key for co-sign + submit |
| `HEDERA_NODE_URL` | _(optional)_ | Custom consensus endpoint |

The resource server only needs `FACILITATOR_URL` — **not** the private key.

## Why ECDSA + fee payer

Hedera x402 uses native `TransferTransaction`s. Wallets partially sign (buyer → seller). Settle requires the facilitator to:

1. Match buyer signature to requirements (`payTo`, amount tinybars, asset `0.0.0`)
2. Co-sign as the fee payer advertised on `/supported`
3. Pay network fees and submit until receipt status SUCCESS

Use a dedicated funded ECDSA account — not the contract deployer or seller wallet.

## Packages

```text
@x402/core
@x402/hedera
```

Scheme entry points:

```text
@x402/hedera/exact/server      # resource server
@x402/hedera/exact/client      # browser / CLI client
@x402/hedera/exact/facilitator # self-hosted facilitator
```
