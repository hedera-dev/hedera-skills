# Account identifiers reference

Verified against `@hiero-ledger/sdk` 2.87.0 and live mainnet mirror node data.

## The forms

| form | example | who has one |
|---|---|---|
| Account ID | `0.0.1234` | every account |
| Long-zero EVM address | `0x00000000000000000000000000000000000004d2` | every account |
| Derived EVM address | `0xa5530a419d01495cf2af0875106ccfd40c1734d6` | ECDSA accounts created from an alias |
| Alias (mirror node field) | `2IUEQY5UUFXGRO4UHAFKUGI3TUGI2C23` | same accounts; base32 of the 20 EVM bytes |

The long-zero form is just the account number, hex-encoded and left-padded to 20 bytes. The
derived form is computed from an ECDSA public key. They are both valid EVM addresses for the
account, but only the derived one can be recovered from the key.

## SDK calls

```js
AccountId.fromString("0.0.1234").toEvmAddress();
// "00000000000000000000000000000000000004d2"

ecdsaPublicKey.toEvmAddress();      // derived, ECDSA only
ed25519PublicKey.toEvmAddress();    // THROWS: unsupported operation on Ed25519PublicKey

AccountId.fromEvmAddress(0, 0, evmAddress);
// → AccountId in ALIAS form: 0.0.5fa99d7d1d277db46f88b435d28efd2e5e116885
```

`AccountId.fromEvmAddress()` does **not** return a numeric account ID. It returns an alias-form
ID. Resolve it via the mirror node or `populateAccountNum()` before treating it as `0.0.<num>`.

`toSolidityAddress()` was **removed** — it raises `TypeError` on 2.87.0. Use `toEvmAddress()`.

`toStringWithChecksum()` requires a client (`client cannot be null`), since checksums are
network-specific.

Other instance members: `getEvmAddress()`, `populateAccountEvmAddress()`, `populateAccountNum()`.
Statics: `fromString`, `fromBytes`, `fromEvmAddress`, `fromEvmPublicAddress`.

## The `alias` field

The mirror node's `alias` is the base32 (RFC 4648, unpadded) encoding of the same 20 bytes as
`evm_address`. Decoding one yields the other exactly — confirmed on live accounts.

## Account creation paths, and what each produces

| how the account was created | key type | evm_address | alias |
|---|---|---|---|
| `AccountCreateTransaction` with an ED25519 key | ED25519 | long-zero | `null` |
| `AccountCreateTransaction` with an ECDSA key | ECDSA | long-zero | `null` |
| Auto-created by transferring to an ECDSA alias | ECDSA | derived | set |
| Value sent to an EVM address with no account | *none* (hollow) | derived | set |

Distribution in a 100-account mainnet sample: 34 / 26 / 30 / 10 respectively.

**An ECDSA account created the normal way does not get a derived EVM address.** This trips up
code that assumes "ECDSA account ⇒ its EVM address is derived from its key". Check the shape
rather than assuming.

## Complex keys

An account secured by a `KeyList` or threshold key reports `key._type: "ProtobufEncoded"` on
the mirror node rather than `ED25519` or `ECDSA_SECP256K1`. Many system accounts (`0.0.2`,
`0.0.98`) look like this. It means the key is a structure of several keys, so no single curve
applies — classify it separately rather than falling through to a curve-based branch.

## Hollow accounts

A hollow account has `key: null` on the mirror node and exists because value was sent to an EVM
address before any account was created for it. It cannot sign anything yet. It is completed
("finalized") when a transaction signed by the matching ECDSA key is submitted, at which point
the key is set.

Treat `key === null` as "cannot sign yet", not as an error.
