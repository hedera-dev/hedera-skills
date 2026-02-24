# Frontend Patterns for Hedera Apps

Implementation patterns for building polished Hedera-powered frontends with React/Next.js.

## Recommended Tech Stack

- **Framework:** React 18+ or Next.js 14+ (App Router preferred)
- **Language:** TypeScript always
- **Styling:** Tailwind CSS + shadcn/ui for production-quality UI
- **Hedera (server-side):** `hedera-agent-kit` for multi-step operations, `@hiero-ledger/sdk` for direct SDK access
- **Hedera (read-heavy):** Mirror Node REST API for dashboard data
- **State/Data:** React Server Components + API routes (no client-side private keys)

## Project Scaffolding

When asked to build a Hedera app, follow this sequence:

```bash
# 1. Create Next.js project (pipe "no" to decline React Compiler prompt)
echo "no" | npx create-next-app@latest my-hedera-app --typescript --tailwind --app --src-dir --no-eslint --use-npm --import-alias "@/*"

# 2. Install Hedera dependencies
cd my-hedera-app
npm install hedera-agent-kit @hiero-ledger/sdk dotenv

# 3. Install UI components (use --yes for non-interactive, sonner replaces deprecated toast)
npx shadcn@latest init -d --force
npx shadcn@latest add button card input dialog label sonner table badge tabs separator --yes

# 4. Fix Turbopack lockfile warning (common when project is nested under a parent with its own lockfile)
# Add to next.config.ts:
#   import path from "path";
#   turbopack: { root: path.resolve(__dirname) }

# 5. Create .env.local
cp templates/env.example .env.local
# Fill in HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_NETWORK, NEXT_PUBLIC_HEDERA_NETWORK
```

> **Note:** `create-next-app` now prompts about React Compiler — pipe `echo "no"` for non-interactive use. The shadcn `toast` component is deprecated; use `sonner` instead (simpler API: just call `toast("message")`). Use `--yes` flag to skip shadcn confirmation prompts.

### Suggested File Structure

```
my-hedera-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with providers, network badge
│   │   ├── page.tsx             # Main page
│   │   └── api/                 # Server-side API routes
│   │       ├── account/
│   │       │   └── route.ts     # Account queries
│   │       └── tokens/
│   │           ├── create/
│   │           │   └── route.ts # Token creation
│   │           └── route.ts     # Token queries
│   ├── lib/
│   │   ├── hedera.ts            # Hedera client singleton
│   │   └── mirror.ts            # Mirror Node API helpers
│   └── components/
│       ├── account-card.tsx     # Account overview
│       ├── token-table.tsx      # Token portfolio
│       ├── transfer-dialog.tsx  # Transfer form
│       └── network-badge.tsx    # Testnet/mainnet indicator
├── .env.local                   # Hedera credentials (gitignored)
└── package.json
```

## Three Integration Patterns

### Pattern 1: Direct SDK (Simple Queries & Transactions)

Best for straightforward single operations like balance queries and simple transfers.

```typescript
// src/lib/hedera.ts — Shared client singleton (lazy-init for Next.js build compatibility)
import { Client, PrivateKey, AccountId } from '@hiero-ledger/sdk';

/** Auto-detect DER vs hex (ECDSA) private key format */
function parsePrivateKey(key: string): PrivateKey {
  const trimmed = key.trim().replace(/^0x/, '');
  if (trimmed.startsWith('302')) {
    return PrivateKey.fromStringDer(trimmed);
  }
  return PrivateKey.fromStringECDSA(trimmed);
}

const network = process.env.HEDERA_NETWORK || 'testnet';
const operatorId = process.env.HEDERA_OPERATOR_ID || '';

// Lazy-init: avoids build-time crash with placeholder env vars
let _client: Client | null = null;
function getClient(): Client {
  if (!_client) {
    const id = process.env.HEDERA_OPERATOR_ID;
    const key = process.env.HEDERA_OPERATOR_KEY;
    if (!id || !key) throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY');
    _client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
    _client.setOperator(AccountId.fromString(id), parsePrivateKey(key));
  }
  return _client;
}

const client = new Proxy({} as Client, {
  get(_, prop) {
    const c = getClient();
    const val = (c as any)[prop];
    return typeof val === 'function' ? (val as Function).bind(c) : val;
  },
});

export { client, network, operatorId };
```

```typescript
// src/app/api/balance/route.ts — Balance query API route
import { AccountBalanceQuery } from '@hiero-ledger/sdk';
import { client } from '@/lib/hedera';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return Response.json({ error: 'accountId is required' }, { status: 400 });
  }

  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);

  return Response.json({
    hbar: balance.hbars.toString(),
    tokens: Object.fromEntries(balance.tokens._map),
  });
}
```

### Pattern 2: Agent Kit (Complex Multi-Step Operations)

Best for operations that involve multiple steps, plugins, or need the full toolkit capabilities.

```typescript
// src/lib/toolkit.ts — Agent Kit toolkit setup
import {
  HederaLangchainToolkit,
  coreTokenPlugin,
  coreTokenQueryPlugin,
  coreAccountQueryPlugin,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
  AgentMode,
} from 'hedera-agent-kit';
import { Client, PrivateKey } from '@hiero-ledger/sdk';

const operatorKey = process.env.HEDERA_OPERATOR_KEY!.trim().replace(/^0x/, '').startsWith('302')
  ? PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)
  : PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!.replace(/^0x/, ''));

const client = Client.forTestnet().setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  operatorKey
);

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    tools: [],
    context: { mode: AgentMode.AUTONOMOUS },
    plugins: [
      coreTokenPlugin,
      coreTokenQueryPlugin,
      coreAccountQueryPlugin,
      coreConsensusPlugin,
      coreConsensusQueryPlugin,
    ],
  },
});

export { toolkit };
```

```typescript
// src/app/api/tokens/create/route.ts — Token creation via Agent Kit
import { toolkit } from '@/lib/toolkit';

export async function POST(req: Request) {
  const { name, symbol, initialSupply, decimals } = await req.json();

  const tools = toolkit.getTools();
  const createTokenTool = tools.find(t => t.name.includes('create_fungible_token'));

  if (!createTokenTool) {
    return Response.json({ error: 'Token creation tool not available' }, { status: 500 });
  }

  const result = await createTokenTool.invoke({
    name,
    symbol,
    initialSupply,
    decimals,
  });

  return Response.json(result);
}
```

### Pattern 3: Mirror Node REST API (Read-Heavy Dashboards)

Best for read-only dashboard UIs. No private key needed — public API.

```typescript
// src/lib/mirror.ts — Mirror Node API helpers
const MIRROR_BASE = process.env.HEDERA_NETWORK === 'mainnet'
  ? 'https://mainnet.mirrornode.hedera.com/api/v1'
  : 'https://testnet.mirrornode.hedera.com/api/v1';

export async function getAccountInfo(accountId: string) {
  const res = await fetch(`${MIRROR_BASE}/accounts/${accountId}`);
  if (!res.ok) throw new Error(`Account not found: ${accountId}`);
  return res.json();
}

export async function getAccountTokens(accountId: string) {
  const res = await fetch(`${MIRROR_BASE}/accounts/${accountId}/tokens`);
  return res.json();
}

export async function getAccountNfts(accountId: string) {
  const res = await fetch(`${MIRROR_BASE}/accounts/${accountId}/nfts`);
  return res.json();
}

export async function getTopicMessages(topicId: string) {
  const res = await fetch(`${MIRROR_BASE}/topics/${topicId}/messages`);
  return res.json();
}

export async function getTransactions(accountId: string, limit = 20) {
  const res = await fetch(
    `${MIRROR_BASE}/transactions?account.id=${accountId}&limit=${limit}&order=desc`
  );
  return res.json();
}

export async function getTokenInfo(tokenId: string) {
  const res = await fetch(`${MIRROR_BASE}/tokens/${tokenId}`);
  return res.json();
}

export async function getNftInfo(tokenId: string, serialNumber: number) {
  const res = await fetch(`${MIRROR_BASE}/tokens/${tokenId}/nfts/${serialNumber}`);
  return res.json();
}
```

---

### Pattern 4: Pipeline Execution with SSE (Both Categories)

Server-side pipeline engine that chains toolkit tool calls sequentially, streaming progress to the client via Server-Sent Events. Shared by both Category A (fixed pipeline) and Category B (dynamic agent) demos.

**Server — Pipeline Engine:**

```typescript
// src/lib/pipeline.ts — Shared pipeline execution engine
import { HederaLangchainToolkit } from 'hedera-agent-kit';

export interface PipelineStepDef {
  stepId: string;
  tool: string;           // Tool name to find in toolkit.getTools()
  service: string;        // Badge label: "HTS", "HCS", "DeFi", etc.
  params: Record<string, unknown>;
}

export interface PipelineEvent {
  stepId: string;
  tool: string;
  service: string;
  status: 'executing' | 'success' | 'error';
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  elapsed?: number;
}

export async function executePipeline(
  toolkit: HederaLangchainToolkit,
  steps: PipelineStepDef[],
  onEvent: (event: PipelineEvent) => void,
) {
  const tools = toolkit.getTools();
  const results: Record<string, unknown> = {};

  for (const step of steps) {
    onEvent({ stepId: step.stepId, tool: step.tool, service: step.service, status: 'executing', params: step.params });
    const start = Date.now();

    const tool = tools.find(t => t.name === step.tool);
    if (!tool) {
      onEvent({ stepId: step.stepId, tool: step.tool, service: step.service, status: 'error', error: `Tool not found: ${step.tool}` });
      return results;
    }

    try {
      // Resolve param references like "{{step1.tokenId}}" from previous results
      const resolvedParams = resolveParams(step.params, results);
      const result = await tool.invoke(resolvedParams);
      results[step.stepId] = typeof result === 'string' ? JSON.parse(result) : result;
      onEvent({
        stepId: step.stepId, tool: step.tool, service: step.service,
        status: 'success', result: results[step.stepId], elapsed: Date.now() - start,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      onEvent({ stepId: step.stepId, tool: step.tool, service: step.service, status: 'error', error: message, elapsed: Date.now() - start });
      return results;
    }
  }
  return results;
}

function resolveParams(params: Record<string, unknown>, results: Record<string, unknown>): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const path = value.slice(2, -2).split('.');
      let ref: unknown = results;
      for (const seg of path) ref = (ref as Record<string, unknown>)?.[seg];
      resolved[key] = ref;
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}
```

**Server — SSE API Route:**

```typescript
// src/app/api/pipeline/route.ts — SSE endpoint for pipeline execution
import { toolkit } from '@/lib/toolkit';
import { executePipeline, PipelineStepDef, PipelineEvent } from '@/lib/pipeline';

export async function POST(req: Request) {
  const { steps } = await req.json() as { steps: PipelineStepDef[] };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      await executePipeline(toolkit, steps, (ev: PipelineEvent) => {
        send('step', ev);
      });

      send('done', {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

**Client — SSE Consumer Hook:**

```typescript
// src/hooks/use-pipeline.ts — React hook for consuming pipeline SSE
import { useState, useCallback } from 'react';

interface PipelineStep {
  stepId: string;
  tool: string;
  service: string;
  status: 'pending' | 'executing' | 'success' | 'error';
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  elapsed?: number;
}

export function usePipeline() {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runPipeline = useCallback(async (pipelineSteps: PipelineStep[]) => {
    setSteps(pipelineSteps.map(s => ({ ...s, status: 'pending' })));
    setIsRunning(true);

    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: pipelineSteps }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          setSteps(prev => prev.map(s =>
            s.stepId === data.stepId ? { ...s, ...data } : s
          ));
        }
      }
    }

    setIsRunning(false);
  }, []);

  return { steps, isRunning, runPipeline };
}
```

### Pattern 5: LangChain Agent Integration (Category B Only)

For agentic apps where the LLM decides which tools to call at runtime. See `references/agent-kit-sdk-reference.md` for the full agent initialization code.

**Architecture:**

```
User (text or voice) → POST /api/agent { input }
  → Server creates LangChain AgentExecutor with all hedera-agent-kit tools
  → Agent reasons about which tools to call
  → Each tool call emitted as SSE event
  → Agent may chain multiple tool calls autonomously
  → Final response streamed back
```

**Key differences from Pattern 4:**
- Pipeline steps are **dynamic** — determined by the LLM at runtime, not predefined
- Agent provides **reasoning** text explaining why it chose each tool
- Multi-step operations are handled **autonomously** (e.g., "swap and then check balance")
- The `intermediateSteps` array from `AgentExecutor` provides the tool call sequence

**Client — Agent Hook:**

```typescript
// src/hooks/use-agent.ts — React hook for agent SSE
import { useState, useCallback } from 'react';

interface AgentStep {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
}

interface AgentState {
  steps: AgentStep[];
  status: string;
  output: string;
  isRunning: boolean;
}

export function useAgent() {
  const [state, setState] = useState<AgentState>({
    steps: [], status: '', output: '', isRunning: false,
  });

  const sendMessage = useCallback(async (input: string) => {
    setState({ steps: [], status: 'Agent is thinking...', output: '', isRunning: true });

    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));
        const eventType = line.includes('event: ') ? line.split('event: ')[1]?.split('\n')[0] : undefined;

        if (data.message) setState(prev => ({ ...prev, status: data.message }));
        if (data.tool) setState(prev => ({ ...prev, steps: [...prev.steps, data] }));
        if (data.output) setState(prev => ({ ...prev, output: data.output, isRunning: false }));
      }
    }
  }, []);

  return { ...state, sendMessage };
}
```

### Voice Input Pattern (Category B Only)

Use the Web Speech API (`SpeechRecognition`) for voice-to-text input in the browser. No server-side processing or API keys needed.

```typescript
// src/hooks/use-voice-input.ts
import { useState, useCallback, useRef } from 'react';

export function useVoiceInput(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}
```

**Usage in a component:**

```tsx
const { isListening, startListening, stopListening } = useVoiceInput((transcript) => {
  setInput(transcript);
  sendMessage(transcript);
});

// Microphone button
<Button
  variant={isListening ? "destructive" : "outline"}
  size="icon"
  onClick={isListening ? stopListening : startListening}
>
  {isListening ? <MicOff /> : <Mic />}
</Button>
```

> **Browser support:** Web Speech API works in Chrome, Edge, and Safari. Firefox has limited support. Always provide the text input as a fallback.

---

## UI Component Patterns

### Pipeline Visualizer (Shared by Both Demo Categories)

The pipeline visualizer renders a vertical list of step cards showing tool execution progress. Used by both Category A (fixed pipeline) and Category B (dynamic agent) demos.

```typescript
interface PipelineStep {
  stepId: string;
  tool: string;            // e.g., "memejob_create", "saucerswap_add_liquidity"
  service: 'HTS' | 'HCS' | 'DeFi' | 'Account' | 'EVM' | 'Query';
  status: 'pending' | 'executing' | 'success' | 'error';
  params?: Record<string, unknown>;    // Collapsible input parameters
  result?: Record<string, unknown>;    // Output with HashScan links
  elapsed?: number;                     // Milliseconds
  reasoning?: string;                   // Agent's reasoning (Category B only)
}

interface PipelineVisualizerProps {
  steps: PipelineStep[];
  isRunning: boolean;
}
```

**Step card rendering:**
- Tool name in monospace font (e.g., `memejob_create`)
- Service badge (colored: HTS=green, HCS=blue, DeFi=purple, Account=gray)
- Status indicator: spinner (executing), checkmark (success), X (error)
- Collapsible params/result sections
- HashScan links on all entity IDs in results (tokenId, topicId, transactionId)
- Elapsed time in milliseconds

### Account Dashboard Panel (Category B)

Shows the operator's account state, auto-refreshes after each agent operation.

```typescript
interface AccountDashboardProps {
  accountId: string;
  hbarBalance: string;           // e.g., "125.5 ℏ"
  tokens: TokenBalance[];        // Fungible token balances
  recentTransactions: Transaction[];
}

interface TokenBalance {
  tokenId: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  hashScanUrl: string;
}

interface Transaction {
  transactionId: string;
  type: string;
  status: string;
  timestamp: string;
  hashScanUrl: string;
}
```

### Launch Card (Category A)

After a pipeline completes, shows a summary card with all created resources.

```typescript
interface LaunchCardProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  topicId: string;
  poolInfo?: { lpTokenId: string; poolUrl: string };
  hashScanLinks: { label: string; url: string }[];
}
```

---

## Design Guidelines

### Theme & Colors
- **Dark theme by default** — web3 convention. Use shadcn/ui dark mode.
- Accent color: Hedera green (`#00E08E`) for success states and branding touches.

### Hedera-Specific Formatting
- **HBAR amounts:** Display with `ℏ` symbol (e.g., `125.50 ℏ`)
- **Account IDs:** Always `0.0.XXXXX` format, monospace font
- **Token IDs:** Always `0.0.XXXXX` format, clickable link to HashScan
- **Transaction hashes:** Truncated with copy button, clickable link to HashScan

### HashScan Explorer Links

```typescript
const hashScanBase = network === 'mainnet'
  ? 'https://hashscan.io/mainnet'
  : 'https://hashscan.io/testnet';

// Transaction link
`${hashScanBase}/transaction/${transactionId}`

// Token link
`${hashScanBase}/token/${tokenId}`

// Account link
`${hashScanBase}/account/${accountId}`
```

### UX Patterns
- **Loading states** for ALL blockchain operations (they take 3-7 seconds)
- **Success/error toast notifications** for every transaction (use `sonner` — `toast("message")` or `toast.error("message")`)
- **Network badge** in header/navbar showing "Testnet" or "Mainnet"
- **Responsive layout** — mobile-friendly, but desktop-primary
- **Confirmation dialogs** for destructive or costly operations (transfers, mainnet transactions)
- **Copy-to-clipboard** on all IDs and hashes

### API Route Pattern

All Hedera operations should go through server-side API routes. Never expose private keys to the client.

```
User Action → React Component → fetch('/api/...') → API Route → SDK/Agent Kit → Hedera Network → Response → UI Update
```
