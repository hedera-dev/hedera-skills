---
name: hedera-accounts-keys
description: "How Hedera accounts, keys, and addresses actually work with the Hiero JavaScript SDK (@hiero-ledger/sdk). Use this skill whenever the user is choosing between ED25519 and ECDSA keys, parsing a private key from an environment variable or string, seeing INVALID_SIGNATURE or 'account does not exist' errors that point at nothing, converting between an account ID and an EVM address, working with account aliases, hollow/auto-created accounts, or setting up multi-signature threshold keys. Also trigger when the user mentions PrivateKey.fromStringECDSA, fromStringED25519, fromStringDer, toEvmAddress, toSolidityAddress, long-zero addresses, account aliases, hollow accounts, or KeyList threshold keys on Hedera."
---

# Hedera accounts, keys, and addresses — Hiero JS SDK

Hedera supports **two key algorithms** and **three ways to name the same account**. Most of the pain in this area is silent: the wrong key parses successfully, and the wrong address format resolves to an account that does not exist.

Verified against `@hiero-ledger/sdk` **2.87.0**.

## The two key types

| | ED25519 | ECDSA secp256k1 |
|---|---|---|
| `PrivateKey.generateED25519()` | ✅ | — |
| `PrivateKey.generateECDSA()` | — | ✅ |
| `.publicKey.type` | `ED25519` | `secp256k1` |
| Has an EVM address | ❌ **no** | ✅ yes |
| Use for | native Hedera accounts | anything touching the EVM / JSON-RPC / MetaMask |

`publicKey.toEvmAddress()` **throws** on an ED25519 key:

```
unsupported operation on Ed25519PublicKey
```

If you need a **derived** EVM address, the account must hold an ECDSA key. Note that the derived address comes from the *alias*, which is fixed when the account is created from that alias — so an account that was not created that way will not gain a derived address just by holding an ECDSA key (see the account-creation table below).

## ⚠️ The parsing trap — the wrong key parses without error

**A raw private key is 32 bytes on both curves**, so neither parser can reject the wrong one. Passing an ED25519 key to the ECDSA parser succeeds and silently derives a **different public key**:

```js
const ed = PrivateKey.generateED25519();
PrivateKey.fromStringECDSA(ed.toStringRaw());   // ✅ no error thrown
// → derives a completely different public key than ed.publicKey
```

There is no exception and no stack trace. You get `INVALID_SIGNATURE`, or you address an account that was never created.

**DER does not save you either.** DER encodes an algorithm identifier, but the curve-specific parsers ignore it:

```js
PrivateKey.fromStringECDSA(ed.toStringDer());   // ✅ accepted, WRONG public key
```

Measured behaviour, all six combinations:

| parse call | ED25519 input | ECDSA input |
|---|---|---|
| `fromStringDer(der)` | ✅ correct | ✅ correct |
| `fromString(der)` | ✅ correct | ✅ correct |
| `fromString(raw)` | ✅ correct | ❌ **silently wrong** — defaults to ED25519 |
| `fromStringECDSA(raw)` | ❌ accepted, wrong key | ✅ correct |
| `fromStringED25519(raw)` | ✅ correct | ❌ accepted, wrong key |
| `fromStringECDSA(der)` | ❌ accepted, wrong key | ✅ correct |

### The rule

**Store keys in DER and parse with `fromStringDer()`.** It is the only call that reads the algorithm from the encoding and is correct for both curves.

```js
// ✅ safe for either curve
const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
```

Use `fromStringECDSA()` / `fromStringED25519()` **only** when you control the key and know its curve for certain. Never call `fromString()` on a raw hex string — for an ECDSA key it silently returns an ED25519 key (the SDK prints a warning, which is easy to miss in logs).

### Telling the curve from a DER string

```
ED25519 : 302e020100300506032b657004220420…
ECDSA   : 3030020100300706052b8104000a0422…
```

## Three ways to name one account

Every account has an **account ID**. Every account also has a **long-zero EVM address** derived from that ID. Only some accounts have a **derived EVM address** from an ECDSA public key.

```js
AccountId.fromString("0.0.1234").toEvmAddress();
// → 00000000000000000000000000000000000004d2   (long-zero: the account num, hex-padded)

ecdsaPublicKey.toEvmAddress();
// → a5530a419d01495cf2af0875106ccfd40c1734d6   (keccak-derived, ECDSA only)
```

> **`toSolidityAddress()` no longer exists.** It was removed; on 2.87.0 it raises `TypeError: a.toSolidityAddress is not a function`. Older tutorials still reference it — use `toEvmAddress()`.

The mirror node's `alias` field is the **base32-encoded 20-byte EVM address** — the same bytes as `evm_address`, in a different encoding (verified against live mainnet accounts).

### What real accounts look like

A 100-account sample from mainnet, by key type and address shape:

| count | key type | EVM address | alias | meaning |
|---|---|---|---|---|
| 34 | ED25519 | long-zero | `null` | native account; no EVM identity |
| 30 | ECDSA | derived | set | created **via alias** (auto/lazy creation) |
| 26 | ECDSA | long-zero | `null` | created via `AccountCreateTransaction` |
| 10 | *none* | derived | set | **hollow account** — key not yet set |

A fifth shape exists that the sample above did not cover: an account whose key is a
`KeyList` or threshold key is reported by the mirror node as **`_type: "ProtobufEncoded"`**,
not as a curve. System accounts such as `0.0.2` look like this. Do not treat
`ProtobufEncoded` as "unknown curve" — it means *multiple keys*, and there is no single
curve to read.

Two things follow that surprise people:

- **An ECDSA account does not automatically get a derived EVM address.** If it was created with `AccountCreateTransaction`, it gets a long-zero address like any other account. The derived address only appears when the account was created *from* the alias.
- **A hollow account has no key** (`key: null` on the mirror node). It is created when value is sent to an EVM address that has no account yet. It becomes a full account once a transaction signed by the matching key is submitted.

## Multi-signature: `KeyList` and thresholds

```js
const list = new KeyList([k1, k2, k3], 2);  // any 2 of 3 must sign
list.threshold;                              // 2

const all = new KeyList([k1, k2, k3]);       // no threshold
all.threshold;                               // null  → ALL keys required
```

A `null` threshold means **every** key must sign, not "any one of them". `KeyList.of(...)` and `.setThreshold(n)` are also available.

## Gotchas

1. **The wrong key parses fine.** Use `fromStringDer()`. See the table above — this is the single most common cause of unexplained `INVALID_SIGNATURE`.
2. **ED25519 keys have no EVM address.** `toEvmAddress()` throws on them. Choose ECDSA up front if you need EVM interop.
3. **`toSolidityAddress()` was removed** — use `toEvmAddress()`.
4. **Long-zero ≠ derived.** Both are valid EVM addresses for the account, but only the derived one is recoverable from the public key. Do not assume an account's EVM address is derived from its key.
5. **`AccountId.fromEvmAddress(0,0,evm)` produces an alias-form ID**, e.g. `0.0.5fa99d7d…`, not a numeric `0.0.1234`. Resolve it against the mirror node (or `populateAccountNum()`) before assuming a num.
6. **`toStringWithChecksum()` needs a client** — it throws `client cannot be null` without one, because checksums are network-specific.
7. **A `null` KeyList threshold means all keys**, not one.
8. **Mirror node reads are rate-limited** — throttle when classifying many accounts. See the `hedera-mirror-node` skill.

## References & examples

- `references/key-parsing.md` — full parse matrix, DER prefixes, storage guidance
- `references/addresses.md` — account ID / long-zero / derived EVM / alias, and account creation paths
- `examples/parse-key-safely.mjs` — demonstrates the trap and the safe pattern (runnable, SDK only)
- `examples/classify-account.mjs` — classifies any live account by key type and address shape (runnable)
