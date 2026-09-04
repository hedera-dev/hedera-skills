/**
 * Classify a live Hedera account by key type and address shape.
 *
 * Run: node classify-account.mjs 0.0.2 [mainnet|testnet|previewnet]
 * Node 18+ (native fetch). No SDK, no key, no fee.
 */

const HOSTS = {
  mainnet: "https://mainnet.mirrornode.hedera.com",
  testnet: "https://testnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
  local: "http://localhost:5551",
};

const accountId = process.argv[2] ?? "0.0.2";
const network = process.argv[3] ?? "mainnet";
const BASE = `${HOSTS[network] ?? HOSTS.mainnet}/api/v1`;

/** base32 (RFC 4648, unpadded) — the encoding the mirror node uses for `alias` */
function decodeBase32(s) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, val = 0;
  const out = [];
  for (const c of s.replace(/=+$/, "")) {
    const i = A.indexOf(c.toUpperCase());
    if (i < 0) continue;
    val = (val << 5) | i;
    bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

const res = await fetch(`${BASE}/accounts/${accountId}`);
if (res.status === 404) { console.error(`Account ${accountId} not found on ${network}`); process.exit(1); }
if (!res.ok) { console.error(`Mirror node ${res.status}`); process.exit(1); }
const a = await res.json();

const keyType = a.key?._type ?? null;
const evm = a.evm_address ?? "";
const isLongZero = /^0x0{24}/.test(evm);

console.log(`Account ${a.account} on ${network}`);
console.log(`  key type     : ${keyType ?? "none (hollow account — cannot sign yet)"}`);
console.log(`  evm_address  : ${evm} ${isLongZero ? "(long-zero: derived from the account num)" : "(derived from an ECDSA public key)"}`);
console.log(`  alias        : ${a.alias ?? "null"}`);

if (a.alias) {
  const bytes = decodeBase32(a.alias);
  console.log(`  alias decodes: 0x${bytes.toString("hex")}  → matches evm_address: ${"0x" + bytes.toString("hex") === evm}`);
}

let origin;
if (keyType === null) {
  origin = "hollow — value was sent to an EVM address before the account existed";
} else if (keyType === "ProtobufEncoded") {
  // A KeyList / threshold key: the mirror node does not expand it to a single curve.
  origin = "complex key (KeyList / threshold) — multiple keys, no single curve";
} else if (keyType === "ED25519") {
  origin = "native ED25519 account (no EVM identity is derivable)";
} else if (keyType === "ECDSA_SECP256K1") {
  origin = isLongZero
    ? "ECDSA, created via AccountCreateTransaction (long-zero address only)"
    : "ECDSA, auto-created from an alias (has a derived EVM address)";
} else {
  origin = `unrecognized key type: ${keyType}`;
}
console.log(`  origin       : ${origin}`);
