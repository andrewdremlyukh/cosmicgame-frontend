/**
 * V1 / V2 Cosmic Game contract compatibility helpers.
 *
 * Until mainnet upgrades to V2-only ABIs, the merged JSON ABI contains both
 * function signatures. Call sites try the legacy shape first and fall back to
 * V2 when the node reports an unrecognized selector.
 */

import type { Abi, AbiFunction } from 'viem';

import cosmicGameJson from '@/contracts/CosmicGame.json';

import { networkConfig } from '@/config/networks';

const cosmicGameAbiFull = cosmicGameJson as Abi;

/** Default min CST reward accepted on V2 gesture entrypoints (0 = accept contract value). */
export const GESTURE_CST_REWARD_AMOUNT_MIN_LIMIT_V2 = 0n;

export interface GestureArgsCompatOptions {
  cstRewardAmountMinLimit?: bigint;
  preferV2First?: boolean;
}

export type CosmicGameGestureFunctionName =
  | 'bidWithEth'
  | 'bidWithEthAndDonateNft'
  | 'bidWithEthAndDonateToken'
  | 'bidWithCst'
  | 'bidWithCstAndDonateNft'
  | 'bidWithCstAndDonateToken';

const UNRECOGNIZED_SELECTOR_MARKERS = [
  'function selector was not recognized',
  "there's no fallback function",
  'there is no fallback function',
  'method not found',
  'invalid opcode',
] as const;

function errorText(err: unknown): string {
  if (!(err instanceof Error)) return String(err ?? '');
  const extended = err as Error & {
    shortMessage?: string;
    details?: string;
    metaMessages?: string[];
    reason?: string;
  };
  return [
    err.message,
    extended.shortMessage,
    extended.details,
    extended.reason,
    ...(extended.metaMessages ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

/** True when the chain/proxy has no matching function for the attempted selector. */
export function isUnrecognizedSelectorError(err: unknown): boolean {
  const text = errorText(err).toLowerCase();
  if (UNRECOGNIZED_SELECTOR_MARKERS.some((m) => text.includes(m))) return true;

  const walkable = err as Error & { cause?: unknown };
  if (walkable.cause) return isUnrecognizedSelectorError(walkable.cause);
  return false;
}

/**
 * Marker texts produced when a version-probe READ hits a contract that lacks the selector,
 * but the node cannot say so explicitly. Behind the UUPS proxy, Hardhat's
 * "function selector was not recognized" is lost — the delegatecall reverts with empty
 * data ("Transaction reverted without a reason string"); geth-style nodes return no data.
 * Kept separate from UNRECOGNIZED_SELECTOR_MARKERS: for WRITES a reasonless revert can be
 * a genuine failure, so only argless-getter probes may treat it as "selector absent".
 */
const MISSING_READ_FUNCTION_MARKERS = [
  'reverted without a reason string',
  'returned no data ("0x")',
] as const;

/**
 * True when a no-argument getter probe failed in a way consistent with the selector not
 * existing on the deployed implementation (e.g. probing a V3 getter on a V2 contract).
 * Such getters cannot legitimately revert on a version that implements them, so a
 * reasonless/empty revert means "older version" rather than an application error.
 */
export function isMissingFunctionReadError(err: unknown): boolean {
  if (isUnrecognizedSelectorError(err)) return true;
  const text = errorText(err).toLowerCase();
  if (MISSING_READ_FUNCTION_MARKERS.some((m) => text.includes(m))) return true;

  const walkable = err as Error & { cause?: unknown };
  if (walkable.cause) return isMissingFunctionReadError(walkable.cause);
  return false;
}

/**
 * Try readers in order; skip unrecognized-selector failures and rethrow other errors.
 */
export async function readCosmicGameWithFallback<T>(
  readers: Array<() => Promise<T | undefined>>,
): Promise<T | undefined> {
  let lastSelectorError: unknown;
  for (const read of readers) {
    try {
      return await read();
    } catch (err) {
      if (isUnrecognizedSelectorError(err)) {
        lastSelectorError = err;
        continue;
      }
      throw err;
    }
  }
  if (lastSelectorError) throw lastSelectorError;
  return undefined;
}

/** Deployed Arbitrum and local upgraded stacks are V2; try V2 args first to avoid simulating a doomed V1 call. */
export function preferV2GestureArgsFirst(): boolean {
  return [42161, 421614, 31337].includes(networkConfig.chainId);
}

/** Narrow ABI slice for a single bid overload (avoids duplicate-name encoding ambiguity).
 * Custom error definitions ride along so reverts (e.g. RoundIsInactive) decode into
 * readable messages instead of raw return data. */
export function pickGestureWriteAbi(
  functionName: CosmicGameGestureFunctionName,
  callArgs: readonly unknown[],
): Abi {
  const match = cosmicGameAbiFull.find(
    (item): item is AbiFunction =>
      item.type === 'function' &&
      item.name === functionName &&
      (item.inputs?.length ?? 0) === callArgs.length,
  );
  if (!match) return cosmicGameAbiFull;
  const errorItems = cosmicGameAbiFull.filter((item) => item.type === 'error');
  return [match, ...errorItems];
}

/** Coerce gesture args to viem-friendly shapes before encoding. */
export function normalizeV1GestureArgs(
  functionName: CosmicGameGestureFunctionName,
  v1Args: readonly unknown[],
): readonly unknown[] {
  switch (functionName) {
    case 'bidWithEth':
    case 'bidWithEthAndDonateNft':
    case 'bidWithEthAndDonateToken':
      return [BigInt(v1Args[0] as number | bigint), v1Args[1], ...v1Args.slice(2)];
    case 'bidWithCst':
    case 'bidWithCstAndDonateNft':
    case 'bidWithCstAndDonateToken':
      return v1Args;
    default: {
      const _exhaustive: never = functionName;
      return _exhaustive;
    }
  }
}

/** Insert V2 `bidCstRewardAmountMinLimit_` after the message argument. */
export function gestureArgsForV2(
  functionName: CosmicGameGestureFunctionName,
  v1Args: readonly unknown[],
  cstRewardAmountMinLimit: bigint = GESTURE_CST_REWARD_AMOUNT_MIN_LIMIT_V2,
): readonly unknown[] {
  const minLimit = cstRewardAmountMinLimit;
  switch (functionName) {
    case 'bidWithEth':
      return [v1Args[0], v1Args[1], minLimit];
    case 'bidWithEthAndDonateNft':
    case 'bidWithEthAndDonateToken':
    case 'bidWithCstAndDonateNft':
    case 'bidWithCstAndDonateToken':
      return [v1Args[0], v1Args[1], minLimit, v1Args[2], v1Args[3]];
    case 'bidWithCst':
      return [v1Args[0], v1Args[1], minLimit];
    default: {
      const _exhaustive: never = functionName;
      return _exhaustive;
    }
  }
}

/**
 * Run an async action with V1/V2 args, retrying the alternate shape on unrecognized selector.
 * On local Hardhat (chain 31337), V2 is tried first because populate-old-v2 upgrades the proxy.
 */
export async function withGestureArgsV1ThenV2<T>(
  functionName: CosmicGameGestureFunctionName,
  v1Args: readonly unknown[],
  run: (args: readonly unknown[]) => Promise<T>,
  options: GestureArgsCompatOptions = {},
): Promise<T> {
  const normalized = normalizeV1GestureArgs(functionName, v1Args);
  const v2Args = gestureArgsForV2(functionName, normalized, options.cstRewardAmountMinLimit);
  const shouldPreferV2 = options.preferV2First ?? preferV2GestureArgsFirst();
  const attempts = shouldPreferV2 ? [v2Args, normalized] : [normalized, v2Args];

  let lastSelectorError: unknown;
  for (const args of attempts) {
    try {
      return await run(args);
    } catch (err) {
      if (!isUnrecognizedSelectorError(err)) {
        throw err;
      }
      lastSelectorError = err;
    }
  }
  throw lastSelectorError;
}
