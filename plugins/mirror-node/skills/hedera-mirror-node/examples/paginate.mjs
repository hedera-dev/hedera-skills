/**
 * Cursor pagination over the Mirror Node REST API.
 *
 * List endpoints cap `limit` at 100 and expose a cursor via `links.next`,
 * which is a RELATIVE path already carrying the next cursor params. Follow it
 * until it is null — never hand-roll offsets.
 *
 * Run: node paginate.mjs 0.0.2 [testnet|mainnet|previewnet]
 * Requires Node 18+ (native global fetch).
 */

const HOSTS = {
  mainnet: "https://mainnet-public.mirrornode.hedera.com",
  testnet: "https://testnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
  local: "http://localhost:5551",
};

const accountId = process.argv[2] ?? "0.0.2";
const network = process.argv[3] ?? "testnet";
const HOST = HOSTS[network] ?? HOSTS.testnet;

/**
 * Follow links.next until exhausted, collecting one named collection.
 * @param {string} host     e.g. "https://testnet.mirrornode.hedera.com"
 * @param {string} startPath e.g. "/api/v1/transactions?account.id=0.0.2&limit=100"
 * @param {string} key       collection field name, e.g. "transactions"
 * @param {number} maxPages  safety cap so a runaway query can't loop forever
 */
async function fetchAll(host, startPath, key, maxPages = 50) {
  const out = [];
  let next = startPath;
  let pages = 0;
  while (next && pages < maxPages) {
    const res = await fetch(host + next);
    if (!res.ok) throw new Error(`Mirror node ${res.status} for ${next}`);
    const page = await res.json();
    out.push(...(page[key] ?? []));
    next = page.links?.next ?? null; // already includes the cursor for the next page
    pages++;
  }
  if (next) console.warn(`Stopped at maxPages=${maxPages}; more results remain.`);
  return out;
}

async function main() {
  const txns = await fetchAll(
    HOST,
    `/api/v1/transactions?account.id=${accountId}&order=desc&limit=100`,
    "transactions",
  );
  console.log(`Fetched ${txns.length} transactions for ${accountId} on ${network}`);
  for (const t of txns.slice(0, 5)) {
    console.log(`  ${t.consensus_timestamp}  ${t.name.padEnd(22)}  ${t.result}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
