/**
 * Mirror Node REST — account lookups over raw fetch (no dependencies).
 *
 * Run: node query-account.mjs 0.0.2 [testnet|mainnet|previewnet]
 * Requires Node 18+ (native global fetch).
 */

// The three public networks share one hostname pattern; local/self-hosted do not.
const HOSTS = {
  mainnet: "https://mainnet.mirrornode.hedera.com",
  testnet: "https://testnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
  local: "http://localhost:5551",
};

const accountId = process.argv[2] ?? "0.0.2";
const network = process.argv[3] ?? "testnet";
const BASE = `${HOSTS[network] ?? HOSTS.testnet}/api/v1`;

const TINYBAR_DECIMALS = 8; // 1 HBAR = 100,000,000 tinybars

/**
 * Parse mirror node JSON without losing precision on large integers.
 *
 * The API returns balances as JSON *numbers* (e.g. "balance":3389692518476689184).
 * Anything above Number.MAX_SAFE_INTEGER is corrupted by JSON.parse itself, so
 * calling BigInt() on the parsed value is already too late. Quote 16+ digit
 * integers first so they survive as strings, then convert with BigInt.
 */
function parseWithBigInts(text) {
  return JSON.parse(text.replace(/:\s*(-?\d{16,})(?=\s*[,}\]])/g, ': "$1"'));
}

/**
 * Format an integer amount in its smallest unit as an exact decimal string.
 */
function formatUnits(raw, decimals) {
  const value = BigInt(raw);
  if (decimals === 0) return value.toString();
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const frac = (value % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (res.status === 404) return null; // 404 is a valid "not found", not a crash
  if (!res.ok) throw new Error(`Mirror node ${res.status} for ${path}`);
  // Read as text, not res.json(), so big integers survive parsing.
  return parseWithBigInts(await res.text());
}

async function main() {
  // 1. Account info — freshest single-account balance lives here (.balance.balance).
  const account = await get(`/accounts/${accountId}`);
  if (!account) {
    console.error(`Account ${accountId} not found on ${network}`);
    process.exit(1);
  }
  console.log(`Account ${account.account}`);
  console.log(`  HBAR balance : ${formatUnits(account.balance.balance, TINYBAR_DECIMALS)} ℏ`);
  console.log(`  EVM address  : ${account.evm_address}`);
  console.log(`  Memo         : ${account.memo || "(none)"}`);

  // 2. Fungible token relationships.
  const tokens = await get(`/accounts/${accountId}/tokens?limit=10`);
  const rels = tokens?.tokens ?? [];
  console.log(`\nToken relationships (${rels.length}):`);
  for (const t of rels) {
    // Balance is in the token's smallest unit — scale by 10 ** decimals (BigInt).
    console.log(`  ${t.token_id}: ${formatUnits(t.balance, Number(t.decimals ?? 0))}`);
  }

  // 3. NFTs owned.
  const nfts = await get(`/accounts/${accountId}/nfts?limit=10`);
  const owned = nfts?.nfts ?? [];
  console.log(`\nNFTs owned (${owned.length}):`);
  for (const n of owned) {
    const meta = n.metadata ? Buffer.from(n.metadata, "base64").toString("utf8") : "";
    console.log(`  ${n.token_id} #${n.serial_number}${meta ? ` — ${meta}` : ""}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
