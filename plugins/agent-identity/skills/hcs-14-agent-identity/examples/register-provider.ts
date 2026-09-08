/**
 * register-provider.ts — Register a provider/operator to an HCS-14 registry.
 *
 * A provider (operator) is an entity that runs one or more agents. Providers
 * register themselves so that agents can be attributed and trust can be
 * computed at the operator level.
 *
 * Steps:
 * 1. Create an HCS-11 profile topic for the provider (type: 2 = PROVIDER)
 * 2. Submit the provider's HCS-11 profile
 * 3. Register the provider on the registry topic (HCS-2 register op)
 * 4. Optionally register child agents under this provider
 *
 * Prerequisites:
 *   npm install @hiero-ledger/sdk bs58
 *   Environment: HEDERA_NETWORK, OPERATOR_ID, OPERATOR_KEY
 *
 * Usage:
 *   npx tsx examples/register-provider.ts
 */

import {
    Client,
    AccountId,
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";
import crypto from "node:crypto";
import bs58 from "bs58";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NETWORK = process.env.HEDERA_NETWORK ?? "testnet";
const OPERATOR_ID = process.env.OPERATOR_ID ?? "0.0.1001";
const OPERATOR_KEY = process.env.OPERATOR_KEY ?? "";

// Pass the registry topic ID as the first argument, or set REGISTRY_TOPIC_ID
const REGISTRY_TOPIC_ID = process.argv[2] ?? process.env.REGISTRY_TOPIC_ID ?? "";

if (!OPERATOR_KEY) {
    console.error("Set OPERATOR_KEY env var (ECDSA private key)");
    process.exit(1);
}
if (!REGISTRY_TOPIC_ID) {
    console.error("Pass the registry topic ID as the first argument:");
    console.error("  npx tsx examples/register-provider.ts 0.0.555777");
    process.exit(1);
}

const client = Client.forName(NETWORK).setOperator(
    AccountId.fromString(OPERATOR_ID),
    PrivateKey.fromStringECDSA(OPERATOR_KEY),
);

// ---------------------------------------------------------------------------
// UAID generation (AID method)
// ---------------------------------------------------------------------------

interface CanonicalAgentData {
    registry: string;
    name: string;
    version: string;
    protocol: string;
    nativeId: string;
    skills: number[];
}

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

function generateAidHash(data: CanonicalAgentData): string {
    const canonical = canonicalizeAgentData(data);
    const hash = crypto.createHash("sha384").update(canonical, "utf8").digest();
    return bs58.encode(hash);
}

function buildUaid(
    target: "aid" | "did",
    id: string,
    params: {
        uid: string;
        registry?: string;
        proto?: string;
        nativeId?: string;
    },
): string {
    const parts: string[] = [`uid=${params.uid}`];
    if (params.registry) parts.push(`registry=${params.registry}`);
    if (params.proto) parts.push(`proto=${params.proto}`);
    if (params.nativeId) parts.push(`nativeId=${params.nativeId}`);
    return `uaid:${target}:${id};${parts.join(";")}`;
}

// ---------------------------------------------------------------------------
// Main provider registration flow
// ---------------------------------------------------------------------------

async function main() {
    const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
    const operatorAccountId = AccountId.fromString(OPERATOR_ID);

    // -- Provider metadata ----------------------------------------------------
    const providerData: CanonicalAgentData = {
        registry: "hedera",
        name: "Acme AI Services",
        version: "1.0.0",
        protocol: "hcs-10",
        nativeId: `hedera:${NETWORK}:${operatorAccountId.toString()}`,
        skills: [16, 17, 18], // Multi-Agent Coordination + API Integration + Workflow Automation
    };

    // -- Step 1: Generate UAID ------------------------------------------------
    console.log("\n=== Step 1: Generate Provider UAID ===");
    const aidHash = generateAidHash(providerData);
    const uaid = buildUaid("aid", aidHash, {
        uid: "acme-ai",
        registry: "hedera",
        proto: "hcs-10",
        nativeId: providerData.nativeId,
    });
    console.log(`  Provider UAID: ${uaid}`);

    // -- Step 2: Create the provider's HCS-11 profile topic ------------------
    console.log("\n=== Step 2: Create Provider Profile Topic ===");
    const { topicId: profileTopicId } = await (
        await new TopicCreateTransaction()
            .setTopicMemo("HCS-11 Profile — Acme AI Services (PROVIDER)")
            .setAdminKey(operatorKey.publicKey)
            .setSubmitKey(operatorKey.publicKey)
            .execute(client)
    ).getReceipt(client);
    console.log(`  Provider profile topic: ${profileTopicId.toString()}`);

    // -- Step 3: Submit the provider's HCS-11 profile -------------------------
    console.log("\n=== Step 3: Submit Provider Profile (type: 2 = PROVIDER) ===");
    const profile = {
        version: "1.0",
        type: 2, // PROVIDER / SERVER
        display_name: providerData.name,
        uaid: uaid,
        inboundTopicId: profileTopicId.toString(),
        outboundTopicId: profileTopicId.toString(),
        bio: "Provider of autonomous trading and analysis agents on Hedera",
        skills: providerData.skills,
        capabilities: ["multi-agent-coordination", "api-integration", "workflow-automation"],
        managed_agents: [], // will be populated as child agents are registered
        payment: {
            x402: true,
            asset: "0.0.0",
            network: `hedera:${NETWORK}`,
        },
    };

    await (
        await new TopicMessageSubmitTransaction()
            .setTopicId(profileTopicId)
            .setMessage(JSON.stringify(profile))
            .execute(client)
    ).getReceipt(client);
    console.log(`  Provider profile submitted`);

    // -- Step 4: Register the provider on the registry topic ------------------
    console.log("\n=== Step 4: Register Provider on Registry Topic ===");
    const registration = {
        p: "hcs-2",
        op: "register",
        t_id: profileTopicId.toString(),
        metadata: `hcs://1/${profileTopicId.toString()}`,
        m: `PROVIDER: ${providerData.name} — operator ${operatorAccountId.toString()} — ${uaid}`,
    };

    const regSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(REGISTRY_TOPIC_ID)
        .setMessage(JSON.stringify(registration));

    // If the registry has a submit key, the operator must have it.
    // For open registries (no submit key), this executes directly.
    const regResp = await regSubmitTx.execute(client);
    const regReceipt = await regResp.getReceipt(client);
    console.log(`  Provider registered — sequence: ${regReceipt.topicSequenceNumber}`);

    // -- Step 5: Register a child agent under this provider -------------------
    console.log("\n=== Step 5: Register a Child Agent ===");

    const childAgentData: CanonicalAgentData = {
        registry: "hedera",
        name: "Analysis Bot Beta",
        version: "1.0.0",
        protocol: "hcs-10",
        nativeId: `hedera:${NETWORK}:${operatorAccountId.toString()}`,
        skills: [0, 7], // Text Generation + Knowledge Retrieval
    };

    const childAidHash = generateAidHash(childAgentData);
    const childUaid = buildUaid("aid", childAidHash, {
        uid: "analysis-bot-beta",
        registry: "hedera",
        proto: "hcs-10",
        nativeId: childAgentData.nativeId,
    });
    console.log(`  Child agent UAID: ${childUaid}`);

    // Create child agent profile topic
    const { topicId: childProfileTopicId } = await (
        await new TopicCreateTransaction()
            .setTopicMemo("HCS-11 Profile — Analysis Bot Beta")
            .setAdminKey(operatorKey.publicKey)
            .setSubmitKey(operatorKey.publicKey)
            .execute(client)
    ).getReceipt(client);
    console.log(`  Child profile topic: ${childProfileTopicId.toString()}`);

    // Submit child agent profile
    const childProfile = {
        version: "1.0",
        type: 1, // AGENT
        display_name: childAgentData.name,
        uaid: childUaid,
        inboundTopicId: childProfileTopicId.toString(),
        outboundTopicId: childProfileTopicId.toString(),
        bio: "Analysis agent for on-chain data insights",
        skills: childAgentData.skills,
        operator: operatorAccountId.toString(), // link to provider
        operator_uaid: uaid,
    };

    await (
        await new TopicMessageSubmitTransaction()
            .setTopicId(childProfileTopicId)
            .setMessage(JSON.stringify(childProfile))
            .execute(client)
    ).getReceipt(client);

    // Register child agent on registry topic
    const childRegistration = {
        p: "hcs-2",
        op: "register",
        t_id: childProfileTopicId.toString(),
        metadata: `hcs://1/${childProfileTopicId.toString()}`,
        m: `${childAgentData.name} v${childAgentData.version} — ${childUaid} — operator: ${operatorAccountId.toString()}`,
    };

    const childRegResp = await new TopicMessageSubmitTransaction()
        .setTopicId(REGISTRY_TOPIC_ID)
        .setMessage(JSON.stringify(childRegistration))
        .execute(client);
    const childRegReceipt = await childRegResp.getReceipt(client);
    console.log(`  Child agent registered — sequence: ${childRegReceipt.topicSequenceNumber}`);

    // -- Summary --------------------------------------------------------------
    console.log("\n=== Provider Registration Complete ===");
    console.log(`  Registry Topic      : ${REGISTRY_TOPIC_ID}`);
    console.log(`  Provider Profile    : ${profileTopicId.toString()}`);
    console.log(`  Provider UAID       : ${uaid}`);
    console.log(`  Child Agent Profile : ${childProfileTopicId.toString()}`);
    console.log(`  Child Agent UAID    : ${childUaid}`);
    console.log(`  Network             : ${NETWORK}`);

    client.close();
}

main().catch((err) => {
    console.error("Provider registration failed:", err);
    process.exit(1);
});