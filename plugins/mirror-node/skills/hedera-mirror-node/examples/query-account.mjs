/**
 * Mirror Node REST — account lookups over raw fetch (no dependencies).
 *
 * Run: node query-account.mjs 0.0.2 [testnet|mainnet|previewnet]
 * Requires Node 18+ (native global fetch).
 */

const HOSTS = {
  mainnet: "https://mainnet-public.mirrornode.hedera.com", // canonical public mainnet host
  testnet: "https://testnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
  local: "http://localhost:5551",
};

const accountId = process.argv[2] ?? "0.0.2";
const network = process.argv[3] ?? "testnet";
const BASE = `${HOSTS[network] ?? HOSTS.testnet}/api/v1`;

const TINYBAR = 100_000_000; // 1 HBAR = 100,000,000 tinybars

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (res.status === 404) return null; // 404 is a valid "not found", not a crash
  if (!res.ok) throw new Error(`Mirror node ${res.status} for ${path}`);
  return res.json();
}

async function main() {
  // 1. Account info — freshest single-account balance lives here (.balance.balance).
  const account = await get(`/accounts/${accountId}`);
  if (!account) {
    console.error(`Account ${accountId} not found on ${network}`);
    process.exit(1);
  }
  console.log(`Account ${account.account}`);
  console.log(`  HBAR balance : ${account.balance.balance / TINYBAR} ℏ`);
  console.log(`  EVM address  : ${account.evm_address}`);
  console.log(`  Memo         : ${account.memo || "(none)"}`);

  // 2. Fungible token relationships.
  const tokens = await get(`/accounts/${accountId}/tokens?limit=10`);
  const rels = tokens?.tokens ?? [];
  console.log(`\nToken relationships (${rels.length}):`);
  for (const t of rels) {
    // Balance is in the token's smallest unit — divide by 10 ** decimals.
    const amount = Number(t.balance) / 10 ** Number(t.decimals ?? 0);
    console.log(`  ${t.token_id}: ${amount}`);
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
