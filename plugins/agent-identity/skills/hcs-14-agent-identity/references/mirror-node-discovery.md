# Mirror Node REST API — Agent Discovery

The Hedera Mirror Node REST API is the primary read path for HCS-14 agent discovery. Registry topics are HCS topics; their messages are indexed by the mirror node and queryable via REST.

## Base URLs

| Network | Mirror Node REST API |
|---------|---------------------|
| Testnet | `https://testnet.mirrornode.hedera.com/api/v1` |
| Mainnet | `https://mainnet.mirrornode.hedera.com/api/v1` |

## Key Endpoints for Agent Discovery

### 1. Get Topic Messages (Registry Read)

```
GET /api/v1/topics/{topicId}/messages
```

Returns messages submitted to an HCS topic, ordered by sequence number. This is the primary endpoint for reading registry entries.

**Query parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | int | Max messages per page (default: 100, max: 100) |
| `order` | string | `asc` or `desc` (default: `desc`) |
| `timestamp` | string | Filter by consensus timestamp (e.g. `gt:1234567890.000000001`) |

**Response shape**:

```json
{
  "messages": [
    {
      "chunk_info": null,
      "consensus_timestamp": "1700000000.000000001",
      "message": "eyJwIjoiaGNzLTIiLCJvcCI6InJlZ2lzdGVyIiwi...",  // base64
      "payer_account_id": "0.0.123456",
      "running_hash": "kL3...==",
      "running_hash_version": 3,
      "sequence_number": 1,
      "signature": "abc...==",
      "topic_id": "0.0.555777"
    }
  ],
  "links": {
    "next": "/api/v1/topics/0.0.555777/messages?limit=100&order=asc&timestamp=gt:1700000000.000000001"
  }
}
```

**Critical**: The `message` field is **base64-encoded**. Always decode before parsing JSON.

### curl Example

```bash
# Get all registry messages in ascending order (oldest first)
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.555777/messages?limit=100&order=asc"
```

```bash
# Get messages after a specific timestamp
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.555777/messages?timestamp=gt:1700000000.000000001&limit=100&order=asc"
```

```bash
# Decode all messages and extract HCS-2 operations
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.555777/messages?limit=100&order=asc" \
  | jq -r '.messages[] | .message | @base64d | fromjson | "\(.op): \(.t_id) — \(.m)"'
```

### 2. Get Single Message by Sequence Number

```
GET /api/v1/topics/{topicId}/messages/{sequenceNumber}
```

Returns a single message by its sequence number. Useful for verifying a specific registration.

```bash
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.555777/messages/1"
```

### 3. Get Topic Info

```
GET /api/v1/topics/{topicId}
```

Returns topic metadata including memo, sequence number, and keys.

```bash
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.555777"
```

```json
{
  "auto_renew_account": null,
  "auto_renew_period": 7776000,
  "deleted": false,
  "memo": "HCS-14 Agent Registry — testnet",
  "sequence_number": 42,
  "submit_key": null,
  "admin_key": null,
  "topic_id": "0.0.555777"
}
```

## Full Discovery Flow in JavaScript

```js
const MIRROR_NODE = "https://testnet.mirrornode.hedera.com/api/v1";

/**
 * Read all messages from a registry topic, following pagination.
 * @param {string} registryTopicId - e.g. "0.0.555777"
 * @returns {Promise<Array>} all messages with decoded content
 */
async function readRegistryTopic(registryTopicId) {
    const allMessages = [];
    let url = `${MIRROR_NODE}/topics/${registryTopicId}/messages?limit=100&order=asc`;

    while (url) {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Mirror node returned ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        const messages = data.messages || [];

        for (const msg of messages) {
            const decoded = Buffer.from(msg.message, "base64").toString("utf8");
            let content;
            try {
                content = JSON.parse(decoded);
            } catch {
                content = { raw: decoded };
            }
            allMessages.push({
                sequence: msg.sequence_number,
                timestamp: msg.consensus_timestamp,
                payer: msg.payer_account_id,
                content,
            });
        }

        // Follow pagination — links.next is a relative URL
        url = data.links?.next
            ? `${MIRROR_NODE.replace("/api/v1", "")}${data.links.next}`
            : null;
    }

    return allMessages;
}

/**
 * Parse HCS-2 operations from raw messages and extract agent registrations.
 * @param {Array} messages - output of readRegistryTopic()
 * @returns {Object} { agents: [], providers: [], updates: [], deletes: [] }
 */
function parseRegistryState(messages) {
    const state = {
        agents: [],
        providers: [],
        updates: [],
        deletes: [],
        migrations: [],
    };

    for (const msg of messages) {
        const c = msg.content;
        if (c.p !== "hcs-2") continue;

        switch (c.op) {
            case "register": {
                const entry = {
                    sequence: msg.sequence,
                    timestamp: msg.timestamp,
                    payer: msg.payer,
                    profileTopicId: c.t_id,
                    metadata: c.metadata,
                    memo: c.m,
                    uaid: extractUaid(c.m),
                };
                // Heuristic: providers often have "PROVIDER:" prefix in memo
                if (c.m && c.m.startsWith("PROVIDER:")) {
                    state.providers.push(entry);
                } else {
                    state.agents.push(entry);
                }
                break;
            }
            case "update":
                state.updates.push({
                    sequence: msg.sequence,
                    timestamp: msg.timestamp,
                    originalSeq: c.o_id,
                    newTopicId: c.t_id,
                    memo: c.m,
                });
                break;
            case "delete":
                state.deletes.push({
                    sequence: msg.sequence,
                    timestamp: msg.timestamp,
                    originalSeq: c.o_id,
                });
                break;
            case "migrate":
                state.migrations.push({
                    sequence: msg.sequence,
                    timestamp: msg.timestamp,
                    target: c.t_id,
                    memo: c.m,
                });
                break;
        }
    }

    return state;
}

function extractUaid(memo) {
    if (!memo) return null;
    const match = memo.match(/uaid:(aid|did):[^\s;]+(;[^]*)?/);
    return match ? match[0] : null;
}

/**
 * Resolve an agent's HCS-11 profile from its profile topic.
 * @param {string} profileTopicId
 * @returns {Promise<Object|null>} parsed profile or null
 */
async function resolveProfile(profileTopicId) {
    // The profile is typically the first message on the profile topic
    const url = `${MIRROR_NODE}/topics/${profileTopicId}/messages?limit=1&order=asc`;
    const res = await fetch(url);
    const data = await res.json();
    const messages = data.messages || [];
    if (messages.length === 0) return null;

    const profile = JSON.parse(
        Buffer.from(messages[0].message, "base64").toString("utf8")
    );
    return profile;
}

// --- Full discovery ---
const messages = await readRegistryTopic("0.0.555777");
const registry = parseRegistryState(messages);
console.log(`Found ${registry.agents.length} agents and ${registry.providers.length} providers`);

for (const agent of registry.agents) {
    console.log(`  #${agent.sequence} ${agent.uaid || "(no uaid)"} → topic ${agent.profileTopicId}`);
    const profile = await resolveProfile(agent.profileTopicId);
    if (profile) {
        console.log(`    name: ${profile.display_name}`);
        console.log(`    skills: ${JSON.stringify(profile.skills)}`);
        console.log(`    inbound: ${profile.inboundTopicId}`);
    }
}
```

## Pagination Details

- Default page size: 100 messages
- `links.next` in the response is a **relative URL** (starts with `/api/v1/...`)
- Build the full URL by prepending the mirror node base (without `/api/v1` suffix duplication)
- Use `timestamp=gt:{lastTimestamp}` to resume from a specific point

## Filtering by Timestamp

For incremental discovery (only new registrations since last poll):

```bash
# Get only messages after timestamp 1700000000.000000001
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.555777/messages?timestamp=gt:1700000000.000000001&limit=100&order=asc"
```

```js
const lastPolledTimestamp = "1700000000.000000001";
const url = `${MIRROR_NODE}/topics/${topicId}/messages?timestamp=gt:${lastPolledTimestamp}&limit=100&order=asc`;
```

## Real-time Subscription (gRPC)

For real-time discovery (instead of polling REST), use the SDK's `TopicMessageQuery` which subscribes via the mirror node gRPC endpoint:

```js
import { TopicMessageQuery } from "@hiero-ledger/sdk";

const handle = new TopicMessageQuery()
    .setTopicId(registryTopicId)
    .setStartTime(0)
    .subscribe(
        client,
        (message, error) => console.error("Error:", error),
        (message) => {
            const content = JSON.parse(
                Buffer.from(message.contents).toString("utf8")
            );
            if (content.p === "hcs-2" && content.op === "register") {
                console.log(`New agent registered: ${content.m}`);
            }
        },
    );
```

**Note**: After creating a topic, wait 3–5 seconds before subscribing — the mirror node needs time to sync.

## Error Handling

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 404 | Topic not found or not yet indexed | Wait and retry (mirror node sync delay) |
| 400 | Invalid topic ID format | Verify `shard.realm.num` format |
| 429 | Rate limited | Back off and retry |
| 503 | Mirror node temporarily unavailable | Retry with exponential backoff |

## Checklist

- [ ] Always base64-decode the `message` field before JSON parsing
- [ ] Follow `links.next` for pagination — don't assume one page has everything
- [ ] Use `order=asc` for chronological processing (oldest registrations first)
- [ ] Wait 3–5 seconds after topic creation before querying
- [ ] Filter by `p: "hcs-2"` to skip non-registry messages
- [ ] Handle `update` and `delete` ops to maintain current registry state
- [ ] Use `timestamp=gt:{lastTimestamp}` for incremental polling