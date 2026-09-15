# Orderbook API — Authentication and Order Signing

## Wallet-challenge authentication

The challenge and verify endpoints are the only always-unauthenticated calls. Everything protected takes `Authorization: Bearer <jwt>`.

| Step | Endpoint               | Body / action                                            |
| ---- | ---------------------- | -------------------------------------------------------- |
| 1    | `POST /auth/challenge` | `{ "accountId": "0.0.123456" }` → `{ "message": "..." }` |
| 2    | client-side signing    | Sign the challenge message with the account key          |
| 3    | `POST /auth/verify`    | `{ "accountId": "0.0.123456", "signature": "0x..." }` → `{ "token": "<jwt>" }` |

### Supported accounts and challenge signing

| Account format | Key types                    | How to sign the challenge |
| -------------- | ---------------------------- | ------------------------- |
| `0.0.X`        | `ED25519`, `ECDSA_SECP256K1` | Sign with the Hedera signed-message prefix: `'\x19Hedera Signed Message:\n' + <message length> + <message>`. The key type is resolved through the Hedera Mirror Node. |
| `0x...`        | `ECDSA_SECP256K1`            | Standard `personal_sign` (EIP-191); treated as an EVM account. |

### JWT lifecycle

- Tokens are **short-lived** (the API does not publish an exact lifetime).
- Re-authenticate on any `401` and before every WebSocket reconnect.
- WebSocket JWTs are verified at handshake time; an open connection can outlive its token, but a reconnect needs a fresh one.
- Store JWTs server-side only; never log them (they appear in WS query strings).

## Order signing (EIP-712)

Orders are signed client-side — private keys never travel to the API. This mirrors Hedera Agent Kit's `RETURN_BYTES` mode: the server builds, the client signs.

1. Fetch and cache the domain: `GET /signature/domain` → `{ name, version, chainId, verifyingContract }`. `verifyingContract` is the reactor contract; `chainId` identifies the Hedera network.
2. Build orders via `POST /orders/build`; the server assigns nonces and returns the serialized order structs.
3. **Sign the returned order struct** — only the EIP-712 order fields, excluding API metadata.

### Signature wire format — one-byte mode prefix

| Prefix | Mode                 | Typical use |
| ------ | -------------------- | ----------- |
| `0x00` | EIP-712              | ECDSA bot clients, and ED25519 bot clients signing the EIP-712 hash |
| `0x01` | Hedera personal sign | Wallet flows returning a HIP-632 `SignatureMap` for a HIP-820 Hedera personal-sign payload |

**Do not strip the prefix** — the reactor and backend use it to select the verifier.

### ECDSA_SECP256K1 bot accounts

```typescript
// ethers v5
const sig = await wallet._signTypedData(domain, types, order)
const wireSignature = '0x00' + sig.slice(2)
```

### ED25519 Hedera accounts

```typescript
// 1. Build the same EIP-712 payload
// 2. Hash it:
const hash = ethers.utils._TypedDataEncoder.hash(domain, types, order)
// 3. Sign the raw hash bytes with the Hiero SDK private key (@hiero-ledger/sdk)
const sigBytes = ed25519PrivateKey.sign(ethers.utils.arrayify(hash))
// 4. Prefix with 0x00
```

### Recommended dependencies (official bot-client pattern)

```bash
npm install ethers@5 ws @hiero-ledger/sdk
```

`ethers@5` is pinned intentionally for CommonJS bot projects; adapt to v6 only if your service is ESM and you review the API changes.

## Key-handling rules

- Never put a primary wallet private key in a bot process — use a dedicated integration account.
- Never ask a user to paste a private key into chat or into a file the agent reads. Keys belong in server-side secret storage / environment variables loaded by the user's own process.
- Do not ship private-key signing code in a browser app.
- Reuse the same authenticated account for build, sign, save, and cancel.

Full worked flow: `https://docs.saucerswap.finance/v/developer/saucerswap-v3/orderbook-api/typescript-client.md`
