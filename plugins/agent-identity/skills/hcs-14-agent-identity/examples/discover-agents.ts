/**
 * discover-agents.ts — Discover agents registered to an HCS-14 registry topic.
 *
 * Reads all messages from the registry topic via the Mirror Node REST API,
 * parses HCS-2 operations, and resolves each agent's HCS-11 profile.
 *
 * Usage:
 *   npx tsx examples/discover-agents.ts <registryTopicId> [network]
 *   npx tsx examples/discover-agents.ts 0.0.555777 testnet
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const registryTopicId = process.argv[2] ?? "0.0.555777";
const network = process.argv[3] ?? "testnet";

const MIRROR_NODE_BASE =
    network === "mainnet"
        ? "https://mainnet.mirrornode.hedera.com"
        : "https://testnet.mirrornode.hedera.com";
const API_BASE = `${MIRROR_NODE_BASE}/api/v1`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MirrorMessage {
    consensus_timestamp: string;
    message: string; // base64-encoded
    payer_account_id: string;
    sequence_number: number;
    topic_id: string;
}

interface Hcs2Operation {
    p: string;
    op: string;
    t_id?: string;
    metadata?: string;
    m?: string;
    o_id?: string;
}

interface RegistryEntry {
    sequence: number;
    timestamp: string;
    payer: string;
    profileTopicId?: string;
    metadata?: string;
    memo?: string;
    uaid?: string;
}

interface AgentProfile {
    version?: string;
    type?: number;
    display_name?: string;
    uaid?: string;
    inboundTopicId?: string;
    outboundTopicId?: string;
    bio?: string;
    capabilities?: string[];
    skills?: number[];
    ai_model?: string;
    payment?: {
        x402?: boolean;
        asset?: string;
        network?: string;
        price_per_call?: string;
    };
    endpoints?: Record<string, string>;
    registrations?: Array<{ agentId: number; agentRegistry: string }>;
}

// ---------------------------------------------------------------------------
// Mirror Node REST API client
// ---------------------------------------------------------------------------

/** Read all messages from a registry topic, following pagination. */
async function readRegistryTopic(topicId: string): Promise<MirrorMessage[]> {
    const allMessages: MirrorMessage[] = [];
    let url: string | null =
        `${API_BASE}/topics/${topicId}/messages?limit=100&order=asc`;

    while (url) {
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 404) {
                console.error(`Topic ${topicId} not found on mirror node (sync delay?)`);
                return [];
            }
            throw new Error(`Mirror node returned ${res.status}: ${await res.text()}`);
        }

        const data = await res.json() as {
            messages: MirrorMessage[];
            links: { next: string | null };
        };

        allMessages.push(...(data.messages || []));

        // Follow pagination — links.next is a relative URL
        const nextLink = data.links?.next;
        url = nextLink ? `${MIRROR_NODE_BASE}${nextLink}` : null;
    }

    return allMessages;
}

/** Resolve an agent's HCS-11 profile from its profile topic (first message). */
async function resolveProfile(profileTopicId: string): Promise<AgentProfile | null> {
    const url = `${API_BASE}/topics/${profileTopicId}/messages?limit=1&order=asc`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as { messages: MirrorMessage[] };
    const messages = data.messages || [];
    if (messages.length === 0) return null;

    const decoded = Buffer.from(messages[0].message, "base64").toString("utf8");
    try {
        return JSON.parse(decoded) as AgentProfile;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// HCS-2 registry state parser
// ---------------------------------------------------------------------------

/** Extract a UAID string from a memo field. */
function extractUaid(memo?: string): string | undefined {
    if (!memo) return undefined;
    // Match uaid:aid:... or uaid:did:... including parameters
    const match = memo.match(/uaid:(aid|did):[^\s]+/);
    return match ? match[0] : undefined;
}

/** Parse raw mirror messages into structured registry state. */
function parseRegistryState(messages: MirrorMessage[]): {
    agents: RegistryEntry[];
    providers: RegistryEntry[];
    updates: RegistryEntry[];
    deletes: RegistryEntry[];
} {
    const agents: RegistryEntry[] = [];
    const providers: RegistryEntry[] = [];
    const updates: RegistryEntry[] = [];
    const deletes: RegistryEntry[] = [];

    for (const msg of messages) {
        const decoded = Buffer.from(msg.message, "base64").toString("utf8");
        let op: Hcs2Operation;
        try {
            op = JSON.parse(decoded);
        } catch {
            continue; // skip non-JSON messages
        }

        if (op.p !== "hcs-2") continue;

        const entry: RegistryEntry = {
            sequence: msg.sequence_number,
            timestamp: msg.consensus_timestamp,
            payer: msg.payer_account_id,
            profileTopicId: op.t_id,
            metadata: op.metadata,
            memo: op.m,
            uaid: extractUaid(op.m),
        };

        switch (op.op) {
            case "register":
                // Heuristic: providers have "PROVIDER:" prefix in memo
                if (op.m?.startsWith("PROVIDER:")) {
                    providers.push(entry);
                } else {
                    agents.push(entry);
                }
                break;
            case "update":
                updates.push(entry);
                break;
            case "delete":
                deletes.push(entry);
                break;
        }
    }

    return { agents, providers, updates, deletes };
}

// ---------------------------------------------------------------------------
// Main discovery flow
// ---------------------------------------------------------------------------

async function main() {
    console.log(`\n=== HCS-14 Agent Discovery ===`);
    console.log(`  Registry Topic : ${registryTopicId}`);
    console.log(`  Network        : ${network}`);
    console.log(`  Mirror Node    : ${API_BASE}`);

    // Step 1: Read all messages from the registry topic
    console.log(`\n--- Reading registry topic ---`);
    const messages = await readRegistryTopic(registryTopicId);
    console.log(`  Found ${messages.length} total messages`);

    if (messages.length === 0) {
        console.log("  No messages found. Is this a valid registry topic?");
        return;
    }

    // Step 2: Parse HCS-2 operations
    console.log(`\n--- Parsing HCS-2 operations ---`);
    const state = parseRegistryState(messages);
    console.log(`  Agents    : ${state.agents.length}`);
    console.log(`  Providers : ${state.providers.length}`);
    console.log(`  Updates   : ${state.updates.length}`);
    console.log(`  Deletes   : ${state.deletes.length}`);

    // Step 3: Display discovered agents
    console.log(`\n--- Discovered Agents ---`);
    for (const agent of state.agents) {
        console.log(`\n  #${agent.sequence} | ${agent.timestamp}`);
        console.log(`    UAID          : ${agent.uaid ?? "(not in memo)"}`);
        console.log(`    Profile Topic : ${agent.profileTopicId ?? "(missing)"}`);
        console.log(`    Payer         : ${agent.payer}`);
        console.log(`    Memo          : ${agent.memo ?? ""}`);

        // Step 4: Resolve the agent's HCS-11 profile
        if (agent.profileTopicId) {
            console.log(`    Resolving profile...`);
            const profile = await resolveProfile(agent.profileTopicId);
            if (profile) {
                console.log(`    Name          : ${profile.display_name ?? "(unnamed)"}`);
                console.log(`    Type          : ${profile.type === 1 ? "AGENT" : profile.type === 2 ? "PROVIDER" : profile.type}`);
                console.log(`    UAID          : ${profile.uaid ?? "(missing)"}`);
                console.log(`    Inbound Topic : ${profile.inboundTopicId ?? "(none)"}`);
                console.log(`    Skills        : ${JSON.stringify(profile.skills ?? [])}`);
                console.log(`    Capabilities  : ${JSON.stringify(profile.capabilities ?? [])}`);
                if (profile.payment?.x402) {
                    console.log(`    x402 Payment  : enabled (${profile.payment.price_per_call ?? "?"} tinybars)`);
                }
                if (profile.endpoints) {
                    console.log(`    Endpoints     : ${JSON.stringify(profile.endpoints)}`);
                }
                if (profile.registrations?.length) {
                    console.log(`    Cross-chain   : ${JSON.stringify(profile.registrations)}`);
                }
            } else {
                console.log(`    Profile       : (not yet indexed or topic empty)`);
            }
        }
    }

    // Step 4b: Display discovered providers
    if (state.providers.length > 0) {
        console.log(`\n--- Discovered Providers ---`);
        for (const provider of state.providers) {
            console.log(`\n  #${provider.sequence} | ${provider.timestamp}`);
            console.log(`    Memo          : ${provider.memo ?? ""}`);
            console.log(`    Profile Topic : ${provider.profileTopicId ?? "(missing)"}`);
            if (provider.profileTopicId) {
                const profile = await resolveProfile(provider.profileTopicId);
                if (profile) {
                    console.log(`    Name          : ${profile.display_name ?? "(unnamed)"}`);
                    console.log(`    UAID          : ${profile.uaid ?? "(missing)"}`);
                }
            }
        }
    }

    // Summary
    console.log(`\n=== Discovery Complete ===`);
    console.log(`  Total agents discovered : ${state.agents.length}`);
    console.log(`  Total providers         : ${state.providers.length}`);
}

main().catch((err) => {
    console.error("Discovery failed:", err);
    process.exit(1);
});