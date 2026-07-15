/**
 * CosmicGame chain-event bus (polling transport).
 *
 * Watches the CosmicGame contract for the gameplay events that should refresh
 * the UI the moment they land on-chain (`BidPlaced`, `FirstBidPlacedInRound`,
 * `MainPrizeClaimed`, `EthDonated`, `EthDonatedWithInfo`). The event → query
 * routing lives in hooks/useLiveGameDataRefresh.
 *
 * Transport: every ~3 seconds one JSON-RPC batch (`eth_blockNumber` plus a
 * single topic-filtered `eth_getLogs`) is POSTed to every configured RPC node
 * in parallel; the first successful answer wins and the losers are aborted.
 * If every direct request fails (CORS, network), the app's `/api/rpc` proxy
 * answers instead and direct access is retried after a cooldown — the same
 * strategy lib/rpcRace uses for the endgame reads.
 *
 * Cursor: `fromBlock` always starts one past the last processed block, so the
 * poller never re-delivers logs it has already emitted, even when consecutive
 * ticks are answered by different nodes at slightly different heads (a node
 * lagging behind the cursor simply returns an empty range). Reorg edge cases
 * are deliberately ignored: consumers only invalidate query caches, so a
 * duplicated or dropped log costs at most one extra refetch.
 */
import { toEventSelector, type AbiEvent } from 'viem';

import { cosmicGameAbi } from '@/contracts/abis';

import { rpcUrls } from '@/lib/serverRotation';
import { reportError, reportErrorThrottled } from '@/utils/errors';

/** CosmicGame events the UI reacts to in near real time. */
export const WATCHED_COSMIC_EVENTS = [
  'BidPlaced',
  'FirstBidPlacedInRound',
  'MainPrizeClaimed',
  'EthDonated',
  'EthDonatedWithInfo',
] as const;

export type WatchedCosmicEventName = (typeof WATCHED_COSMIC_EVENTS)[number];

/** One decoded log emitted to the poller's subscriber. */
export interface CosmicChainEvent {
  eventName: WatchedCosmicEventName;
  blockNumber: number;
  logIndex: number;
  transactionHash: string;
}

/** Poll cadence agreed for the event bus. */
export const CHAIN_EVENTS_POLL_INTERVAL_MS = 3_000;

const REQUEST_TIMEOUT_MS = 2_500;
const DIRECT_COOLDOWN_MS = 5 * 60_000;
const HEAD_ID = 1;
const LOGS_ID = 2;

/** Epoch ms until which direct node requests are skipped after total failure. */
let directDisabledUntilMs = 0;

interface JsonRpcResponseItem {
  id?: number;
  result?: unknown;
  error?: { code?: number; message?: string };
}

interface RawLog {
  blockNumber?: string;
  logIndex?: string;
  transactionHash?: string;
  topics?: string[];
}

/**
 * Maps `topic0` (keccak of the event signature) → event name for the watched
 * CosmicGame events, derived from the contract ABI.
 *
 * The merged V1+V2+V3 ABI carries multiple overloads for some events (e.g.
 * `BidPlaced` is 7-field on V1 and 9-field on V2/V3; `MainPrizeClaimed` gained
 * a field in V3), and each overload has a distinct `topic0`. Every overload is
 * mapped so the poller keeps working across contract upgrades without a
 * frontend release.
 */
export function buildEventTopicMap(): Map<string, WatchedCosmicEventName> {
  const map = new Map<string, WatchedCosmicEventName>();
  for (const name of WATCHED_COSMIC_EVENTS) {
    const overloads = cosmicGameAbi.filter(
      (entry): entry is AbiEvent => entry.type === 'event' && entry.name === name,
    );
    if (overloads.length === 0) throw new Error(`cosmicGameAbi is missing event ${name}`);
    for (const item of overloads) {
      map.set(toEventSelector(item).toLowerCase(), name);
    }
  }
  return map;
}

function buildPayload(contractAddress: string, topics: string[], fromBlock: number | null): string {
  const batch: unknown[] = [{ jsonrpc: '2.0', id: HEAD_ID, method: 'eth_blockNumber', params: [] }];
  if (fromBlock !== null) {
    batch.push({
      jsonrpc: '2.0',
      id: LOGS_ID,
      method: 'eth_getLogs',
      params: [
        {
          address: contractAddress,
          topics: [topics],
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: 'latest',
        },
      ],
    });
  }
  return JSON.stringify(batch);
}

async function postBatch(
  url: string,
  payload: string,
  signal: AbortSignal,
): Promise<JsonRpcResponseItem[]> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal,
  });
  if (!res.ok) throw new Error(`RPC ${url} responded ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error(`RPC ${url} returned a non-batch response`);
  return data as JsonRpcResponseItem[];
}

/**
 * Races the payload across `urls`; the first successful response wins and the
 * remaining in-flight requests are aborted.
 */
async function raceBatch(urls: string[], payload: string): Promise<JsonRpcResponseItem[]> {
  const attempts = urls.map((url) => ({ url, controller: new AbortController() }));
  const abortAll = (): void => attempts.forEach(({ controller }) => controller.abort());
  const timer = setTimeout(abortAll, REQUEST_TIMEOUT_MS);
  try {
    const fastestResponse = await Promise.any(
      attempts.map(({ url, controller }) => postBatch(url, payload, controller.signal)),
    );
    abortAll();
    return fastestResponse;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBatch(payload: string): Promise<JsonRpcResponseItem[]> {
  const directUrls = Date.now() >= directDisabledUntilMs ? rpcUrls : [];
  if (directUrls.length > 0) {
    try {
      return await raceBatch(directUrls, payload);
    } catch {
      // Likely CORS or all nodes unreachable from this browser; use the proxy
      // for a while instead of paying failed round-trips every tick.
      directDisabledUntilMs = Date.now() + DIRECT_COOLDOWN_MS;
    }
  }
  const proxyUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/rpc` : '';
  if (!proxyUrl) throw new Error('no RPC endpoint available for chain events');
  return raceBatch([proxyUrl], payload);
}

function pick(items: JsonRpcResponseItem[], id: number): unknown {
  const item = items.find((it) => it.id === id);
  if (!item) throw new Error(`batch response missing id ${id}`);
  if (item.error) throw new Error(`RPC error ${item.error.code}: ${item.error.message}`);
  return item.result;
}

export interface CosmicEventPollingOptions {
  contractAddress: string;
  onEvents: (events: CosmicChainEvent[]) => void;
  intervalMs?: number;
}

/**
 * Starts polling both RPC nodes for the watched CosmicGame events and invokes
 * `onEvents` with every new decoded log. The first tick only records the
 * current head (no historical replay on page load). Ticks are skipped while
 * the tab is hidden; becoming visible again triggers an immediate catch-up
 * tick that covers the whole hidden gap. Returns a stop function.
 */
export function startCosmicEventPolling(options: CosmicEventPollingOptions): () => void {
  const { contractAddress, onEvents, intervalMs = CHAIN_EVENTS_POLL_INTERVAL_MS } = options;

  let topicMap: Map<string, WatchedCosmicEventName>;
  try {
    topicMap = buildEventTopicMap();
  } catch (error) {
    reportError(error, 'chain events topic map');
    return () => {};
  }
  const topics = [...topicMap.keys()];

  let cursor: number | null = null;
  let stopped = false;
  let inFlight = false;

  const tick = async (): Promise<void> => {
    if (stopped || inFlight) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    inFlight = true;
    try {
      const payload = buildPayload(contractAddress, topics, cursor === null ? null : cursor + 1);
      const items = await fetchBatch(payload);
      const head = Number(BigInt(pick(items, HEAD_ID) as string));

      if (cursor === null) {
        // Baseline tick: only record where "new" starts.
        cursor = head;
        return;
      }

      const logsItem = items.find((it) => it.id === LOGS_ID);
      if (!logsItem) throw new Error('batch response missing eth_getLogs result');
      if (logsItem.error) {
        // A node lagging behind the cursor rejects `fromBlock > head`; that is
        // expected during races and simply means "nothing new from this node".
        if (head <= cursor) return;
        throw new Error(`RPC error ${logsItem.error.code}: ${logsItem.error.message}`);
      }

      const rawLogs = (logsItem.result ?? []) as RawLog[];
      let maxSeenBlock = head;
      const events: CosmicChainEvent[] = [];
      for (const log of rawLogs) {
        const topic0 = log.topics?.[0]?.toLowerCase();
        const eventName = topic0 ? topicMap.get(topic0) : undefined;
        const blockNumber = log.blockNumber ? Number(BigInt(log.blockNumber)) : 0;
        if (blockNumber > maxSeenBlock) maxSeenBlock = blockNumber;
        if (!eventName) continue;
        events.push({
          eventName,
          blockNumber,
          logIndex: log.logIndex ? Number(BigInt(log.logIndex)) : 0,
          transactionHash: log.transactionHash ?? '',
        });
      }
      cursor = Math.max(cursor, maxSeenBlock);
      if (events.length > 0 && !stopped) onEvents(events);
    } catch (error) {
      reportErrorThrottled(error, 'chain events poll');
    } finally {
      inFlight = false;
    }
  };

  const timer = setInterval(() => void tick(), intervalMs);
  const onVisible = (): void => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') void tick();
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisible);
  }
  void tick();

  return () => {
    stopped = true;
    clearInterval(timer);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

/** Test helper: clears the direct-access cooldown. */
export function __resetChainEventsTransport(): void {
  directDisabledUntilMs = 0;
}
