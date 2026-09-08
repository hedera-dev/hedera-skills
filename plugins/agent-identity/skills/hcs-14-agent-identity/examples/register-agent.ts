/**
 * register-agent.ts — Full HCS-14 agent registration flow.
 *
 * Steps:
 * 1. Create an HCS-14 registry topic (HCS-2 registry)
 * 2. Generate a UAID (AID method — deterministic hash)
 * 3. Create an HCS-11 profile topic for the agent
 * 4. Submit the HCS-11 profile message to the profile topic
 * 5. Register the agent on the registry topic (HCS-2 register op)
 * 6. Verify the registration via the Mirror Node REST API
 *
 * Prerequisites:
 *   npm install @hiero-ledger/sdk bs58
 *   Environment: HEDERA_NETWORK, OPERATOR_ID, OPERATOR_KEY
 *
 * Usage:
 *   npx tsx examples/register-agent.ts
 */

import {
    Client,
    AccountId,
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicInfoQuery,
} from "@hiero-ledger/sdk";
import crypto from "node:crypto";
import bs58 from "bs58";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NETWORK = process.env.HEDERA_NETWORK ?? "testnet";
const OPERATOR_ID = process.env.OPERATOR_ID ?? "0.0.1001";
const OPERATOR_KEY = process.env.OPERATOR_KEY ?? "";

if (!OPERATOR_KEY) {
    console.error("Set OPERATOR_KEY env var (ECDSA private key)");
    process.exit(1);
}

const client = Client.forName(NETWORK).setOperator(
    AccountId.fromString(OPERATOR_ID),
    PrivateKey.fromStringECDSA(OPERATOR_KEY),
);

// ---------------------------------------------------------------------------
// UAID generation (AID method — deterministic)
// ---------------------------------------------------------------------------

interface CanonicalAgentData {
    registry: string;
    name: string;
    version: string;
    protocol: string;
    nativeId: string;
    skills: number[];
}

/** Canonicalize per HCS-14 rules: lowercase+trim registry/protocol, trim others, sort keys + skills. */
function canonicalizeAgentData(data: CanonicalAgentData): string {
    const normalized: Record<string, unknown> = {
        name: data.name.trim(),
        nativeId: data.nativeId.trim(),
        protocol: data.protocol.trim().toLowerCase(),
        registry: data.registry.trim().toLowerCase(),
        skills: [...data.skills].sort((a, b) => a - b),
        version: data.version.trim(),
    };
    return JSON.stringify(
        Object.fromEntries(
            Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b)),
        ),
    );
}

/** Generate a Base58-encoded SHA-384 hash from canonical agent data. */
function generateAidHash(data: CanonicalAgentData): string {
    const canonical = canonicalizeAgentData(data);
    const hash = crypto.createHash("sha384").update(canonical, "utf8").digest();
    return bs58.encode(hash);
}

/** Build a full UAID string with routing parameters. */
function buildUaid(
    target: "aid" | "did",
    id: string,
    params: {
        uid: string;
        registry?: string;
        proto?: string;
        nativeId?: string;
        domain?: string;
    },
): string {
    const parts: string[] = [`uid=${params.uid}`];
    if (params.registry) parts.push(`registry=${params.registry}`);
    if (params.proto) parts.push(`proto=${params.proto}`);
    if (params.nativeId) parts.push(`nativeId=${params.nativeId}`);
    if (params.domain) parts.push(`domain=${params.domain}`);
    return `uaid:${target}:${id};${parts.join(";")}`;
}

// ---------------------------------------------------------------------------
// Main registration flow
// ---------------------------------------------------------------------------

async function main() {
    const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
    const operatorAccountId = AccountId.fromString(OPERATOR_ID);

    // -- Agent metadata ------------------------------------------------------
    const agentData: CanonicalAgentData = {
        registry: "hedera",
        name: "Trading Bot Alpha",
        version: "1.0.0",
        protocol: "hcs-10",
        nativeId: `hedera:${NETWORK}:${operatorAccountId.toString()}`,
        skills: [0, 17], // Text Generation + API Integration
    };

    // -- Step 1: Generate UAID ------------------------------------------------
    console.log("\n=== Step 1: Generate UAID (AID method) ===");
    const aidHash = generateAidHash(agentData);
    const uaid = buildUaid("aid", aidHash, {
        uid: "trading-bot-alpha",
        registry: "hedera",
        proto: "hcs-10",
        nativeId: agentData.nativeId,
    });
    console.log(`  UAID: ${uaid}`);

    // -- Step 2: Create the HCS-14 registry topic ----------------------------
    console.log("\n=== Step 2: Create HCS-14 Registry Topic ===");
    const registrySubmitKey = PrivateKey.generateECDSA();
    const { topicId: registryTopicId } = await (
        await new TopicCreateTransaction()
            .setTopicMemo("HCS-14 Agent Registry — testnet")
            .setAdminKey(operatorKey.publicKey)
            .setSubmitKey(registrySubmitKey.publicKey)
            .execute(client)
    ).getReceipt(client);
    console.log(`  Registry topic: ${registryTopicId.toString()}`);

    // -- Step 3: Create the agent's HCS-11 profile topic ---------------------
    console.log("\n=== Step 3: Create HCS-11 Profile Topic ===");
    const { topicId: profileTopicId } = await (
        await new TopicCreateTransaction()
            .setTopicMemo("HCS-11 Profile — Trading Bot Alpha")
            .setAdminKey(operatorKey.publicKey)
            .setSubmitKey(operatorKey.publicKey)
            .execute(client)
    ).getReceipt(client);
    console.log(`  Profile topic: ${profileTopicId.toString()}`);

    // -- Step 4: Submit the HCS-11 profile message ---------------------------
    console.log("\n=== Step 4: Submit HCS-11 Profile ===");
    const profile = {
        version: "1.0",
        type: 1, // AGENT
        display_name: agentData.name,
        uaid: uaid,
        inboundTopicId: profileTopicId.toString(),
        outboundTopicId: profileTopicId.toString(),
        bio: "Autonomous trading agent for HBAR/USDC pairs",
        capabilities: ["text-generation", "api-integration", "trade-execution"],
        ai_model: "gpt-4o",
        skills: agentData.skills,
        payment: {
            x402: true,
            asset: "0.0.0",
            network: `hedera:${NETWORK}`,
            price_per_call: "100000000", // 1 HBAR in tinybars
        },
    };

    const profileSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(profileTopicId)
        .setMessage(JSON.stringify(profile));

    // Profile topic uses operator key as submit key — SDK signs automatically
    // because it's the operator's key
    const profileResp = await profileSubmitTx.execute(client);
    const profileReceipt = await profileResp.getReceipt(client);
    console.log(`  Profile submitted — sequence: ${profileReceipt.topicSequenceNumber}`);

    // -- Step 5: Register the agent on the registry topic --------------------
    console.log("\n=== Step 5: Register Agent on Registry Topic ===");
    const registration = {
        p: "hcs-2",
        op: "register",
        t_id: profileTopicId.toString(),
        metadata: `hcs://1/${profileTopicId.toString()}`,
        m: `${agentData.name} v${agentData.version} — ${uaid}`,
    };

    // The registry topic has a separate submit key, so we must freeze + sign
    const regSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(registryTopicId)
        .setMessage(JSON.stringify(registration));

    await regSubmitTx.freezeWith(client);
    await regSubmitTx.sign(registrySubmitKey);

    const regResp = await regSubmitTx.execute(client);
    const regReceipt = await regResp.getReceipt(client);
    console.log(`  Agent registered — sequence: ${regReceipt.topicSequenceNumber}`);

    // -- Step 6: Verify via topic info query ---------------------------------
    console.log("\n=== Step 6: Verify Registration ===");
    const registryInfo = await new TopicInfoQuery()
        .setTopicId(registryTopicId)
        .execute(client);
    console.log(`  Registry topic memo: ${registryInfo.topicMemo}`);
    console.log(`  Registry topic sequence: ${registryInfo.sequenceNumber}`);

    const profileInfo = await new TopicInfoQuery()
        .setTopicId(profileTopicId)
        .execute(client);
    console.log(`  Profile topic memo: ${profileInfo.topicMemo}`);
    console.log(`  Profile topic sequence: ${profileInfo.sequenceNumber}`);

    // -- Summary -------------------------------------------------------------
    console.log("\n=== Registration Complete ===");
    console.log(`  Registry Topic : ${registryTopicId.toString()}`);
    console.log(`  Profile Topic  : ${profileTopicId.toString()}`);
    console.log(`  UAID           : ${uaid}`);
    console.log(`  Network        : ${NETWORK}`);
    console.log(`\nDiscover this agent with:`);
    console.log(`  curl -s "https://${NETWORK}.mirrornode.hedera.com/api/v1/topics/${registryTopicId}/messages?limit=100&order=asc"`);
    console.log(`\nOr run: npx tsx examples/discover-agents.ts ${registryTopicId}`);

    client.close();
}

main().catch((err) => {
    console.error("Registration failed:", err);
    process.exit(1);
});