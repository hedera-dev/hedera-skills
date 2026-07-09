/**
 * Get Account NFTs Tool — a read-only Hedera Agent Kit query tool backed by the
 * Mirror Node REST API.
 *
 * Demonstrates the query BaseTool pattern (coreAction returns data,
 * shouldSecondaryAction() === false) and the recommended mirror-node access
 * pattern:
 *   1. Prefer context.mirrornodeService (kit-configured, network-aware).
 *   2. Fall back to raw fetch with an EXPLICIT network→host map rather than
 *      templating the network name into the URL — the templated form lands on
 *      `mainnet.mirrornode.hedera.com` instead of the canonical public host
 *      `mainnet-public.mirrornode.hedera.com`.
 */

import { z } from 'zod';
import { Client } from '@hiero-ledger/sdk';
import { BaseTool, Context, untypedQueryOutputParser } from '@hashgraph/hedera-agent-kit';

export const GET_ACCOUNT_NFTS_TOOL = 'get_account_nfts_tool';

// Explicit host map. Use the canonical public mainnet host `mainnet-public`.
const MIRROR_HOSTS: Record<string, string> = {
  mainnet: 'https://mainnet-public.mirrornode.hedera.com',
  testnet: 'https://testnet.mirrornode.hedera.com',
  previewnet: 'https://previewnet.mirrornode.hedera.com',
};

interface MirrorNft {
  token_id: string;
  serial_number: number;
  metadata: string; // base64
  account_id: string;
}

const getAccountNftsPrompt = (_context: Context = {}) =>
  `This tool lists the NFTs currently owned by a Hedera account (read-only, via the mirror node).
Parameters:
- accountId (str, required): The account ID to query (e.g., 0.0.12345)
- limit (int, optional): Max NFTs to return (1-100, default 25)

Returns each NFT's token ID, serial number, and decoded metadata.`;

const getAccountNftsParameters = (_context: Context = {}) =>
  z.object({
    accountId: z.string().describe('The account ID to query (e.g., 0.0.12345)'),
    limit: z.number().int().min(1).max(100).optional().describe('Max NFTs to return (1-100, default 25)'),
  });

type GetAccountNftsParams = z.infer<ReturnType<typeof getAccountNftsParameters>>;

function decodeMeta(b64: string): string {
  if (!b64) return '';
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return b64;
  }
}

function postProcess(accountId: string, nfts: MirrorNft[]): string {
  if (nfts.length === 0) return `Account ${accountId} owns no NFTs.`;
  const lines = nfts.map((n) => {
    const meta = decodeMeta(n.metadata);
    return `- ${n.token_id} #${n.serial_number}${meta ? ` — ${meta}` : ''}`;
  });
  return `**Account ${accountId}** owns ${nfts.length} NFT(s):\n${lines.join('\n')}`;
}

export class GetAccountNftsTool extends BaseTool<GetAccountNftsParams, GetAccountNftsParams> {
  method = GET_ACCOUNT_NFTS_TOOL;
  name = 'Get Account NFTs';
  description: string;
  parameters: ReturnType<typeof getAccountNftsParameters>;
  outputParser = untypedQueryOutputParser;

  constructor(context: Context) {
    super();
    this.description = getAccountNftsPrompt(context);
    this.parameters = getAccountNftsParameters(context);
  }

  // Stage 2 — validate the account ID format up front.
  async normalizeParams(params: GetAccountNftsParams) {
    if (!/^\d+\.\d+\.\d+$/.test(params.accountId)) {
      throw new Error(`Invalid account ID: ${params.accountId}. Expected X.X.X (e.g., 0.0.12345)`);
    }
    return params;
  }

  // Stage 4 — read from the mirror node.
  async coreAction(params: GetAccountNftsParams, context: Context, client: Client) {
    const limit = params.limit ?? 25;

    // (1) Preferred: use the kit-configured mirrornode service when present.
    //     Method names vary by @hashgraph/hedera-agent-kit version — consult
    //     IHederaMirrornodeService in your installed version and call the
    //     appropriate account-NFTs method here, e.g.:
    //
    //     if (context.mirrornodeService) {
    //       const nfts = await context.mirrornodeService.getAccountNfts(params.accountId, limit);
    //       return { raw: { accountId: params.accountId, nfts }, humanMessage: postProcess(params.accountId, nfts) };
    //     }

    // (2) Fallback: raw REST with an explicit host map.
    const network = client.ledgerId?.toString() ?? 'testnet';
    const base = MIRROR_HOSTS[network] ?? MIRROR_HOSTS.testnet;
    const url = `${base}/api/v1/accounts/${params.accountId}/nfts?limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return {
          raw: { error: 'Account not found', accountId: params.accountId },
          humanMessage: `Account ${params.accountId} was not found on ${network}.`,
        };
      }
      throw new Error(`Mirror node returned ${response.status}`);
    }

    const body: { nfts?: MirrorNft[] } = await response.json();
    const nfts = body.nfts ?? [];
    return {
      raw: { accountId: params.accountId, nfts },
      humanMessage: postProcess(params.accountId, nfts),
    };
  }

  // Pure query — nothing to sign or submit, so skip stage 6.
  async shouldSecondaryAction() {
    return false;
  }

  async secondaryAction(result: any) {
    return result;
  }

  async handleError(error: unknown) {
    const message = 'Failed to get account NFTs' + (error instanceof Error ? `: ${error.message}` : '');
    console.error(`[${GET_ACCOUNT_NFTS_TOOL}]`, message);
    return { raw: { error: message }, humanMessage: message };
  }
}

const tool = (context: Context): BaseTool => new GetAccountNftsTool(context);

export default tool;
