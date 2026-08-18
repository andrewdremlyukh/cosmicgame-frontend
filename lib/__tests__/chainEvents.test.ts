import { reportError, reportErrorThrottled } from '@/utils/errors';

import {
  __resetChainEventsTransport,
  buildEventTopicMap,
  CHAIN_EVENTS_POLL_INTERVAL_MS,
  startCosmicEventPolling,
  WATCHED_COSMIC_EVENTS,
} from '../chainEvents';

jest.mock('@/lib/serverRotation', () => ({
  rpcUrls: ['http://node-a/rpc', 'http://node-b/rpc'],
}));

jest.mock('@/utils/errors', () => ({
  reportError: jest.fn(),
  reportErrorThrottled: jest.fn(),
}));

const mockReportErrorThrottled = reportErrorThrottled as jest.MockedFunction<
  typeof reportErrorThrottled
>;

type FetchCall = { url: string; batch: { id: number; method: string; params: unknown[] }[] };

const fetchCalls: FetchCall[] = [];
let respond: (call: FetchCall) => unknown;

function okJson(items: unknown) {
  return { ok: true, json: async () => items };
}

function callAt(index: number): FetchCall {
  const call = fetchCalls.at(index);
  if (!call) throw new Error(`no fetch call at index ${index}`);
  return call;
}

function batchItem(
  call: FetchCall,
  index: number,
): { id: number; method: string; params: unknown[] } {
  const item = call.batch[index];
  if (!item) throw new Error(`no batch item at index ${index}`);
  return item;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  __resetChainEventsTransport();
  fetchCalls.length = 0;
  respond = () => {
    throw new Error('no responder configured');
  };
  global.fetch = jest.fn(async (url: unknown, init?: { body?: unknown }) => {
    const call: FetchCall = {
      url: String(url),
      batch: JSON.parse(String(init?.body)) as FetchCall['batch'],
    };
    fetchCalls.push(call);
    return respond(call);
  }) as never;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('buildEventTopicMap', () => {
  it('derives a 32-byte selector for every overload of each watched event', () => {
    const map = buildEventTopicMap();
    // The merged V1+V2+V3 ABI has two overloads each for BidPlaced (7- and
    // 9-field) and MainPrizeClaimed (6- and 7-field), so the map is larger
    // than the watched-name list. Every watched name must be represented.
    expect(map.size).toBeGreaterThanOrEqual(WATCHED_COSMIC_EVENTS.length);
    expect(new Set(map.values())).toEqual(new Set(WATCHED_COSMIC_EVENTS));
    const gesturePlacedTopics = [...map.entries()].filter(([, name]) => name === 'BidPlaced');
    expect(gesturePlacedTopics).toHaveLength(2);
    const allocationClaimedTopics = [...map.entries()].filter(
      ([, name]) => name === 'MainPrizeClaimed',
    );
    expect(allocationClaimedTopics).toHaveLength(2);
    for (const topic of map.keys()) {
      expect(topic).toMatch(/^0x[0-9a-f]{64}$/);
    }
  });
});

describe('startCosmicEventPolling', () => {
  const address = '0x000000000000000000000000000000000000cafe';

  function selectorFor(eventName: string): string {
    for (const [topic, name] of buildEventTopicMap()) {
      if (name === eventName) return topic;
    }
    throw new Error(`no selector for ${eventName}`);
  }

  it('baselines on the first tick, then emits decoded logs past the cursor', async () => {
    const onEvents = jest.fn();
    let head = 0x64;
    let logs: unknown[] = [];
    respond = () =>
      okJson([
        { id: 1, result: `0x${head.toString(16)}` },
        { id: 2, result: logs },
      ]);

    const stop = startCosmicEventPolling({ contractAddress: address, onEvents });
    await jest.advanceTimersByTimeAsync(0);

    // Baseline tick: head only, no logs request, nothing emitted.
    expect(callAt(0).batch.map((item) => item.method)).toEqual(['eth_blockNumber']);
    expect(onEvents).not.toHaveBeenCalled();

    head = 0x66;
    logs = [
      {
        blockNumber: '0x66',
        logIndex: '0x1',
        transactionHash: '0xdead',
        topics: [selectorFor('BidPlaced')],
      },
      {
        blockNumber: '0x66',
        logIndex: '0x2',
        transactionHash: '0xdead',
        topics: ['0x'.padEnd(66, 'f')], // unwatched event, ignored
      },
    ];
    await jest.advanceTimersByTimeAsync(CHAIN_EVENTS_POLL_INTERVAL_MS);

    const secondBatch = fetchCalls.find((call) => call.batch.length === 2);
    expect(secondBatch).toBeDefined();
    const logsParams = batchItem(secondBatch!, 1).params[0] as {
      fromBlock: string;
      address: string;
    };
    expect(logsParams.fromBlock).toBe('0x65'); // cursor 0x64 + 1
    expect(logsParams.address).toBe(address);

    expect(onEvents).toHaveBeenCalledTimes(1);
    expect(onEvents).toHaveBeenCalledWith([
      { eventName: 'BidPlaced', blockNumber: 0x66, logIndex: 1, transactionHash: '0xdead' },
    ]);

    // Cursor advanced past the delivered log: next range starts at 0x67.
    logs = [];
    await jest.advanceTimersByTimeAsync(CHAIN_EVENTS_POLL_INTERVAL_MS);
    const thirdBatch = callAt(-1);
    expect((batchItem(thirdBatch, 1).params[0] as { fromBlock: string }).fromBlock).toBe('0x67');

    stop();
    const callsAfterStop = fetchCalls.length;
    await jest.advanceTimersByTimeAsync(CHAIN_EVENTS_POLL_INTERVAL_MS * 3);
    expect(fetchCalls.length).toBe(callsAfterStop);
  });

  it('treats a lagging node rejecting the range as an empty tick', async () => {
    const onEvents = jest.fn();
    let response: unknown = [{ id: 1, result: '0x64' }];
    respond = () => okJson(response);

    startCosmicEventPolling({ contractAddress: address, onEvents });
    await jest.advanceTimersByTimeAsync(0);

    // The answering node is behind the cursor and rejects fromBlock > head.
    response = [
      { id: 1, result: '0x63' },
      { id: 2, error: { code: -32000, message: 'invalid block range' } },
    ];
    await jest.advanceTimersByTimeAsync(CHAIN_EVENTS_POLL_INTERVAL_MS);

    expect(onEvents).not.toHaveBeenCalled();
    expect(mockReportErrorThrottled).not.toHaveBeenCalled();
  });

  it('falls back to the /api/rpc proxy when every direct node fails', async () => {
    const onEvents = jest.fn();
    respond = (call) => {
      if (call.url.startsWith('http://node-')) throw new Error('CORS');
      return okJson([{ id: 1, result: '0x64' }]);
    };

    startCosmicEventPolling({ contractAddress: address, onEvents });
    await jest.advanceTimersByTimeAsync(0);

    expect(fetchCalls.map((call) => call.url)).toEqual([
      'http://node-a/rpc',
      'http://node-b/rpc',
      `${window.location.origin}/api/rpc`,
    ]);

    // While the cooldown is active, later ticks go straight to the proxy.
    await jest.advanceTimersByTimeAsync(CHAIN_EVENTS_POLL_INTERVAL_MS);
    const lastCalls = fetchCalls.slice(3).map((call) => call.url);
    expect(lastCalls).toEqual([`${window.location.origin}/api/rpc`]);
  });

  it('reports poll failures without breaking the loop', async () => {
    const onEvents = jest.fn();
    respond = () => {
      throw new Error('network down');
    };

    startCosmicEventPolling({ contractAddress: address, onEvents });
    await jest.advanceTimersByTimeAsync(0);

    expect(mockReportErrorThrottled).toHaveBeenCalledWith(expect.anything(), 'chain events poll');
    expect(reportError).not.toHaveBeenCalled();

    // The next tick still runs.
    respond = () => okJson([{ id: 1, result: '0x64' }]);
    await jest.advanceTimersByTimeAsync(CHAIN_EVENTS_POLL_INTERVAL_MS);
    expect(onEvents).not.toHaveBeenCalled(); // baseline tick after recovery
    expect(fetchCalls.length).toBeGreaterThan(2);
  });
});
