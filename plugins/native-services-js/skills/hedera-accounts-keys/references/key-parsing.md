# Key parsing reference

Verified against `@hiero-ledger/sdk` 2.87.0.

## Why the wrong parser succeeds

A private key is **32 raw bytes on both curves**. Nothing in the raw encoding identifies the
algorithm, so a curve-specific parser has nothing to reject:

```js
PrivateKey.generateED25519().toStringRaw().length;  // 64 hex chars = 32 bytes
PrivateKey.generateECDSA().toStringRaw().length;    // 64 hex chars = 32 bytes
```

Passing the wrong one derives a valid-but-different keypair. No error, no warning (except for
`fromString` on raw input), and the failure surfaces later as `INVALID_SIGNATURE` or an
account that "does not exist".

## Full parse matrix

| call | ED25519 input | ECDSA input |
|---|---|---|
| `PrivateKey.fromStringDer(der)` | ✅ correct | ✅ correct |
| `PrivateKey.fromString(der)` | ✅ correct | ✅ correct |
| `PrivateKey.fromString(raw)` | ✅ correct | ❌ wrong — defaults to ED25519 (prints a warning) |
| `PrivateKey.fromStringECDSA(raw)` | ❌ accepted, wrong key | ✅ correct |
| `PrivateKey.fromStringED25519(raw)` | ✅ correct | ❌ accepted, wrong key |
| `PrivateKey.fromStringECDSA(der)` | ❌ accepted, wrong key — DER algorithm id ignored | ✅ correct |

The last row is the surprising one: DER carries an algorithm identifier, but the curve-specific
parsers do not consult it.

## Recommended storage and parsing

Store the **DER** form and parse with `fromStringDer()`:

```js
// .env  →  OPERATOR_KEY=302e020100300506032b657004220420...
const key = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
```

`fromStringDer()` reads the algorithm from the encoding and is correct for both curves, so the
same code path works whether the operator is ED25519 or ECDSA.

If you must accept a raw hex key, require the caller to state the curve explicitly and use the
matching parser — do not guess, and do not use `fromString()`.

## Identifying a key's curve

From a DER string, by prefix:

```
ED25519 : 302e020100300506032b657004220420…
ECDSA   : 3030020100300706052b8104000a0422…
```

From a parsed key:

```js
key.publicKey.type;   // "ED25519" | "secp256k1"
```

## Verifying a key matches an account

The only reliable check is comparing the derived public key against the account's key on the
mirror node:

```js
const key = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`);
const onChain = (await res.json()).key;       // { _type, key }
const matches = onChain?.key === key.publicKey.toStringRaw();
```

Do this once at startup. It converts a silent, deferred `INVALID_SIGNATURE` into an immediate,
explicit error.
