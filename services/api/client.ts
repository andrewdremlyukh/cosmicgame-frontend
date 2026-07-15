/**
 * Axios instance, URL builders, payload normalizers, and the read policies the
 * endpoint modules wrap every request in.
 *
 * Read policies — a failed read either surfaces or resolves to a fallback, and
 * which one it does is a per-endpoint decision made at the call site:
 *
 *   apiCallRequired     Nothing is swallowed. The reads a page is built around,
 *                       where a fallback would be a lie:
 *                         statistics/dashboard
 *                         rounds/list, rounds/info/{n}
 *                         bid/list/all, bid/list/by_round/…
 *                         bid/current_special_winners
 *                         user/info/{addr}
 *                         cst/list/all
 *                         prizes/history/global, prizes/history/by_user/…
 *                         staking/cst/staked_tokens/{all,by_user/…}
 *                         staking/randomwalk/staked_tokens/{all,by_user/…}
 *                       plus the unclaimed-asset reads, where an empty list
 *                       would wrongly tell a wallet it has nothing to collect:
 *                         staking/cst/rewards/to_claim/by_user/…
 *                         prizes/eth/unclaimed/by_user/…
 *                         donations/nft/unclaimed/by_user/…
 *
 *   apiCallEmptyOn404   404 means "nothing yet"; everything else rejects.
 *                       Analytics routes that ship ahead of the Go server:
 *                         statistics/leaderboard/roi
 *                         statistics/claims/by_round
 *                         statistics/claims/detail/{round}
 *                       and single-record lookups where 404 means the record
 *                       does not exist:
 *                         bid/info/{id}
 *
 *   apiCall             Lenient: 400/403/404 resolve to the fallback. The long
 *                       tail of secondary tables, badges, and admin-gated
 *                       routes (get_banned_bids answers 403 to ordinary
 *                       clients) where an empty result is a truthful answer.
 */
import axios, {
  isAxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { networkConfig } from '@/config/networks';
import {
  apiBaseUrls,
  getApiBase,
  getApiOrigin,
  markServerDown,
  rebaseUrl,
} from '@/lib/serverRotation';
import { reportError } from '@/utils/errors';

import type { RoundInfo } from './types';

/** True when the failed request was aimed at our Cosmic Game or main NFT API (not arbitrary third-party URLs). */
function isConfiguredBackendRequest(cfg: InternalAxiosRequestConfig | undefined): boolean {
  if (!cfg) return false;
  const target = requestFullUrl(cfg).toLowerCase();

  for (const base of apiBaseUrls) {
    if (target.startsWith(base.toLowerCase())) return true;
  }
  const cosmic = (networkConfig.apiUrl || '').replace(/\/$/, '').toLowerCase();
  if (cosmic && target.startsWith(cosmic)) return true;
  if (target.includes('/api/cosmicgame')) return true;

  const main = (networkConfig.nftApiUrl || '').replace(/\/$/, '').toLowerCase();
  if (main && target.startsWith(main)) return true;

  return false;
}

/** Reassembles the full request URL from an axios config (baseURL + url). */
function requestFullUrl(cfg: InternalAxiosRequestConfig): string {
  const built = (cfg.url ?? '').trim();
  const base = (cfg.baseURL ?? '').replace(/\/$/, '');
  return base ? `${base}/${built.replace(/^\//, '')}` : built;
}

/** Marker preventing more than one rotation retry per logical request. */
interface RotationRetryConfig extends InternalAxiosRequestConfig {
  __rotationRetried?: boolean;
}

/**
 * True when the request was canceled through its abort signal rather than
 * failing. The React Query hooks forward their abort signal, so unmounts and
 * superseded refetches cancel in-flight reads routinely (in dev, StrictMode's
 * double-mount cancels the entire first volley on every page load). axios
 * models cancellation as an AxiosError with no `response`, so any "is this a
 * failure?" check must ask this first.
 */
function isCancellation(error: unknown): boolean {
  // `__CANCEL__` is the marker axios stamps on CanceledError; this is exactly
  // what `axios.isCancel` checks, tested directly so the helper also works
  // under test doubles that stub the axios module.
  if ((error as { __CANCEL__?: boolean } | null | undefined)?.__CANCEL__) return true;
  return isAxiosError(error) && error.code === 'ERR_CANCELED';
}

/**
 * True for failures that indicate the *server* is unhealthy (unreachable, or
 * responding 5xx) rather than a request-level problem like a 404.
 *
 * Exported for tests.
 */
export function isServerFailure(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  // A canceled request says nothing about server health; treating it as one
  // marks healthy servers down for the whole failure cooldown.
  if (isCancellation(error)) return false;
  if (!error.response) return true; // network error / timeout / DNS
  return error.response.status >= 500;
}

axios.interceptors.response.use(
  (response) => {
    assertApiEnvelope(response);
    return response;
  },
  (error: unknown) => {
    if (
      process.env.NODE_ENV === 'development' &&
      isAxiosError(error) &&
      !error.response &&
      !isCancellation(error) &&
      isConfiguredBackendRequest(error.config)
    ) {
      const cfg = error.config;
      const fullUrl = cfg ? requestFullUrl(cfg) : '';
      console.error(
        '[Cosmic API] Network error (no response). Request URL:',
        fullUrl || '(unknown)',
      );
      console.error(
        'Check: (1) Go websrv is running, (2) NEXT_PUBLIC_API_URL ends with /api/cosmicgame — e.g. http://127.0.0.1:8099/api/cosmicgame',
      );
      console.error(
        'If the page is HTTPS and the API is HTTP, use same-origin proxy: set NEXT_PUBLIC_API_URL to this app origin + /api/cosmicgame and COSMICGAME_API_UPSTREAM in .env.local (see .env.example).',
      );
    }

    // Server rotation failover: when a configured API server is unreachable
    // (or 5xx), mark it down and replay the request once against the next
    // healthy server in the list. GETs dominate this API; the single retry is
    // also acceptable for the few POSTs since the failed server never
    // processed the request (no response / 5xx from a dead upstream).
    if (isAxiosError(error) && isServerFailure(error) && apiBaseUrls.length > 1) {
      const cfg = error.config as RotationRetryConfig | undefined;
      if (cfg && !cfg.__rotationRetried) {
        const fullUrl = requestFullUrl(cfg);
        const failedBase = apiBaseUrls.find(
          (base) => fullUrl === base || fullUrl.startsWith(`${base}/`),
        );
        if (failedBase) {
          const reason = error.response
            ? `HTTP ${error.response.status}`
            : (error.code ?? 'no response');
          markServerDown(failedBase, Date.now(), `${reason} on ${fullUrl}`);
          const retryUrl = rebaseUrl(fullUrl, apiBaseUrls);
          if (retryUrl) {
            cfg.__rotationRetried = true;
            cfg.baseURL = undefined;
            cfg.url = retryUrl;
            console.warn('[Cosmic API] retrying against next server:', retryUrl);
            return axios(cfg);
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

// Fail hung requests instead of leaving React Query pending indefinitely.
// Individual calls can still override via a per-request `timeout` config.
axios.defaults.timeout = 15_000;

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const configured =
    apiBaseUrls.length > 0 ? apiBaseUrls : [(process.env.NEXT_PUBLIC_API_URL || '').trim()];
  for (const b of configured) {
    if (b && !b.includes('cosmicgame')) {
      console.warn(
        '[Cosmic API] API URLs should include the path /api/cosmicgame (see .env.example). Got:',
        b,
      );
    }
  }
}

export { axios, isAxiosError };

/** Base URL for the main NFT/token API. */
export const baseUrl = networkConfig.nftApiUrl;
/**
 * Base URL for the Cosmic Game statistics API (first configured server, raw
 * env form). Prefer {@link getAPIUrl}, which follows the hourly server
 * rotation.
 */
export const cosmicGameBaseUrl = networkConfig.apiUrl;

/**
 * Builds a full URL to the Cosmic Game API against the currently selected
 * server (hourly round-robin with failover — see lib/serverRotation). Joins
 * base and `url` with exactly one `/` (so `.../api/cosmicgame` + `bid/...`
 * does not become `.../api/cosmicgamebid/...`).
 */
export const getAPIUrl = (url: string) => {
  if (url === '') {
    // Historical contract: empty path returns the primary base in raw env form.
    return cosmicGameBaseUrl;
  }
  const rotated = getApiBase();
  const base = (rotated || cosmicGameBaseUrl || '').replace(/\/+$/, '');
  const path = (url || '').replace(/^\/+/, '');
  if (!base) return `/${path}`;
  return `${base}/${path}`;
};

/** Pagination window for Go API list endpoints (`.../{offset}/{limit}` path segments). */
export interface ApiPageWindow {
  offset?: number;
  limit?: number;
}

/** Per-request options every read endpoint accepts. */
export interface ApiRequestOptions {
  /**
   * Abort signal for the request. The React Query hooks forward the signal
   * their `queryFn` receives, so navigating away (or a superseded refetch)
   * cancels the in-flight HTTP request instead of letting it settle unused.
   */
  signal?: AbortSignal;
}

/**
 * Options a paged list read accepts: the pagination window plus the abort
 * signal, in one object so callers never have to pass a positional
 * placeholder to reach the signal.
 */
export type ApiListRequestOptions = ApiPageWindow & ApiRequestOptions;

/**
 * Issues a GET against the shared axios instance, attaching the caller's abort
 * signal when there is one.
 *
 * The config argument is omitted entirely when there is nothing to send, so the
 * request shape stays `axios.get(url)` for callers that pass no options.
 */
export function apiGet(
  url: string,
  opts?: ApiRequestOptions,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse> {
  const merged: AxiosRequestConfig = { ...config };
  if (opts?.signal) merged.signal = opts.signal;
  return Object.keys(merged).length > 0 ? axios.get(url, merged) : axios.get(url);
}

/**
 * Historical default window: effectively "fetch everything". List endpoints
 * accept an explicit {@link ApiPageWindow} so callers can page server-side
 * as datasets grow, without changing default behavior.
 */
export const DEFAULT_API_PAGE_LIMIT = 1_000_000;

/** Builds the trailing `{offset}/{limit}` segment for paged Go API endpoints. */
export const pagedPath = (page?: ApiPageWindow): string => {
  const offset = Math.max(0, Math.trunc(page?.offset ?? 0));
  const limit = Math.max(1, Math.trunc(page?.limit ?? DEFAULT_API_PAGE_LIMIT));
  return `${offset}/${limit}`;
};

/**
 * Builds a direct URL targeting the main NFT/token API. Served by the same
 * rotated servers as the Cosmic Game API, so the current rotation pick is
 * preferred; `nftApiUrl` is only the no-rotation fallback.
 */
export const getMainAPIUrl = (url: string) => {
  if (url === '') {
    return baseUrl;
  }
  const base = (getApiOrigin() || baseUrl || '').replace(/\/+$/, '');
  const path = (url || '').replace(/^\/+/, '');
  if (!base) return `/${path}`;
  return `${base}/${path}`;
};

/** Hoists nested `Tx` fields (EvtLogId, BlockNum, TxHash, etc.) to the top level of a record. */
export const flattenTx = (item: unknown) => {
  if (!item || typeof item !== 'object') return item;
  const obj = item as Record<string, unknown>;
  if (obj.Tx && typeof obj.Tx === 'object') {
    const Tx = obj.Tx as Record<string, unknown>;
    const { Tx: _Tx, ...rest } = obj;
    return {
      ...rest,
      EvtLogId: Tx.EvtLogId,
      BlockNum: Tx.BlockNum,
      TxId: Tx.TxId,
      TxHash: Tx.TxHash,
      TimeStamp: Tx.TimeStamp,
      DateTime: Tx.DateTime,
    };
  }
  return item;
};

/** Applies {@link flattenTx} to every element of an array, returning `[]` for non-array input. */
export const flattenTxArray = <T>(items: unknown): T[] => {
  if (!Array.isArray(items)) return [] as T[];
  return items.map((item) => flattenTx(item)) as T[];
};

/**
 * Maps Go bid records (`BidType`, `EthPriceEth`, `CstPriceEth`) to frontend gesture fields.
 * Backend bid_type: 0 = ETH, 1 = RandomWalk, 2 = CST.
 */
export const normalizeGestureRecord = (item: unknown) => {
  const flat = flattenTx(item);
  if (!flat || typeof flat !== 'object') return flat;

  const rec = { ...(flat as Record<string, unknown>) };
  const backendGestureType = rec.BidType;
  if (rec.GestureType === undefined && typeof backendGestureType === 'number') {
    rec.GestureType = backendGestureType;
  }

  const gestureType = rec.GestureType;
  if (typeof gestureType === 'number') {
    const cstCost =
      typeof rec.CstCost === 'number'
        ? rec.CstCost
        : typeof rec.NumCSTokensEth === 'number'
          ? rec.NumCSTokensEth
          : typeof rec.NumCSTTokensEth === 'number'
            ? rec.NumCSTTokensEth
            : typeof rec.CstPriceEth === 'number' && rec.CstPriceEth >= 0
              ? rec.CstPriceEth
              : undefined;
    if (cstCost !== undefined) {
      rec.CstCost = cstCost;
      rec.NumCSTokensEth = cstCost;
      rec.NumCSTTokensEth = cstCost;
    }

    const participationCST =
      typeof rec.ParticipationCST === 'number'
        ? rec.ParticipationCST
        : typeof rec.CSTRewardEth === 'number'
          ? rec.CSTRewardEth
          : typeof rec.ERC20RewardAmountEth === 'number'
            ? rec.ERC20RewardAmountEth
            : undefined;
    if (participationCST !== undefined && participationCST >= 0) {
      rec.ParticipationCST = participationCST;
      if (rec.ERC20RewardAmountEth === undefined) rec.ERC20RewardAmountEth = participationCST;
    }

    if (
      rec.NumCSTokensEth === undefined &&
      typeof rec.CstPriceEth === 'number' &&
      rec.CstPriceEth >= 0
    ) {
      rec.NumCSTokensEth = rec.CstPriceEth;
    }
    if (
      rec.GestureCostEth === undefined &&
      typeof rec.EthPriceEth === 'number' &&
      rec.EthPriceEth >= 0
    ) {
      rec.GestureCostEth = rec.EthPriceEth;
    }
  }

  return rec;
};

/** Flattens and normalizes bid/gesture records from the Cosmic Game API. */
export const flattenGesture = <T>(item: unknown): T | null => {
  if (item == null) return null;
  return normalizeGestureRecord(item) as T;
};

/** Applies {@link normalizeGestureRecord} to every element of an array. */
export const flattenGestureArray = <T>(items: unknown): T[] => {
  if (!Array.isArray(items)) return [] as T[];
  return items.map((item) => normalizeGestureRecord(item)) as T[];
};

/** Flattens a raw round response into a single {@link RoundInfo} by extracting nested allocation, charity, anchoring, and tx fields. */
export const flattenRoundInfo = (roundInfo: unknown) => {
  if (!roundInfo || typeof roundInfo !== 'object') return null;
  const round = roundInfo as Record<string, unknown>;

  const {
    ClaimPrizeTx,
    MainPrize,
    CharityDeposit,
    StakingDeposit,
    EnduranceChampion,
    LastCstBidder,
    ChronoWarrior,
    RoundStats,
    RaffleNFTWinners,
    StakingNFTWinners,
    RaffleETHDeposits,
    AllPrizes,
    ...rest
  } = round;

  const claimTx =
    ClaimPrizeTx &&
    typeof ClaimPrizeTx === 'object' &&
    (ClaimPrizeTx as Record<string, unknown>).Tx &&
    typeof (ClaimPrizeTx as Record<string, unknown>).Tx === 'object'
      ? ((ClaimPrizeTx as Record<string, unknown>).Tx as Record<string, unknown>)
      : null;

  return {
    ...rest,
    RoundStats: RoundStats || {},
    RaffleNFTWinners: flattenTxArray(RaffleNFTWinners || []),
    StakingNFTWinners: flattenTxArray(StakingNFTWinners || []),
    /** Same nested `Tx` shape as other allocation endpoints; list/detail must match schema. */
    RaffleETHDeposits: flattenTxArray(RaffleETHDeposits || []),
    AllPrizes: flattenTxArray(AllPrizes || []),
    EvtLogId: claimTx?.EvtLogId,
    BlockNum: claimTx?.BlockNum,
    TxId: claimTx?.TxId,
    TxHash: claimTx?.TxHash,
    TimeStamp: claimTx?.TimeStamp,
    DateTime: claimTx?.DateTime,
    WinnerAddr: (MainPrize as Record<string, unknown>)?.WinnerAddr || '',
    AmountEth: (MainPrize as Record<string, unknown>)?.EthAmountEth || 0,
    TokenId: (MainPrize as Record<string, unknown>)?.NftTokenId ?? -1,
    /** V3 multi-NFT main prize; V2 cycles report 1 / a single-id list. */
    NumCSNfts: (MainPrize as Record<string, unknown>)?.NumCSNfts ?? 1,
    NftTokenIds: (MainPrize as Record<string, unknown>)?.NftTokenIds ?? [],
    CSTAmountEth: (MainPrize as Record<string, unknown>)?.CstAmountEth || 0,
    CharityAddress: (CharityDeposit as Record<string, unknown>)?.CharityAddress || '',
    CharityAmountETH: (CharityDeposit as Record<string, unknown>)?.CharityAmountETH || 0,
    StakingDepositAmountEth:
      (StakingDeposit as Record<string, unknown>)?.StakingDepositAmountEth || 0,
    StakingPerTokenEth: (StakingDeposit as Record<string, unknown>)?.StakingPerTokenEth || 0,
    StakingNumStakedTokens:
      (StakingDeposit as Record<string, unknown>)?.StakingNumStakedTokens || 0,
    EnduranceWinnerAddr: (EnduranceChampion as Record<string, unknown>)?.WinnerAddr || '',
    EnduranceERC721TokenId: (EnduranceChampion as Record<string, unknown>)?.NftTokenId ?? -1,
    EnduranceERC20AmountEth: (EnduranceChampion as Record<string, unknown>)?.CstAmountEth || 0,
    LastCstBidderAddr: (LastCstBidder as Record<string, unknown>)?.WinnerAddr || '',
    LastCstBidderERC721TokenId: (LastCstBidder as Record<string, unknown>)?.NftTokenId ?? -1,
    LastCstBidderERC20AmountEth: (LastCstBidder as Record<string, unknown>)?.CstAmountEth || 0,
    ChronoWarriorAddr: (ChronoWarrior as Record<string, unknown>)?.WinnerAddr || '',
    ChronoWarriorAmountEth: (ChronoWarrior as Record<string, unknown>)?.EthAmountEth || 0,
    ChronoWarriorCstAmountEth: (ChronoWarrior as Record<string, unknown>)?.CstAmountEth || 0,
    ChronoWarriorNftTokenId: (ChronoWarrior as Record<string, unknown>)?.NftTokenId ?? -1,
  } as RoundInfo;
};

/** Normalizes API field-name variants (e.g. `TokenAddress` → `TokenAddr`) for consistency. */
export const normalizeFieldNames = (item: unknown) => {
  if (!item || typeof item !== 'object') return item;
  const normalized = { ...(item as Record<string, unknown>) };

  if (normalized.TokenAddress !== undefined && normalized.TokenAddr === undefined) {
    normalized.TokenAddr = normalized.TokenAddress;
  }

  return normalized;
};

/** Applies {@link normalizeFieldNames} to every element of an array. */
export const normalizeFieldNamesArray = (items: unknown) => {
  if (!Array.isArray(items)) return items;
  return items.map((item) => normalizeFieldNames(item));
};

/**
 * Checks the backend response envelope for soft errors.
 * The Go API returns `{ status: 1, error: "" }` on success and
 * `{ status: 0, error: "..." }` on logical failure (still HTTP 200).
 * Throws with the backend message when the response signals failure.
 */
export function assertApiEnvelope(response: AxiosResponse): void {
  const body = response.data;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    if ('status' in body && body.status !== undefined && Number(body.status) !== 1) {
      const msg =
        typeof body.error === 'string' && body.error ? body.error : 'API returned an error';
      throw new Error(msg);
    }
    if ('error' in body && typeof body.error === 'string' && body.error) {
      throw new Error(body.error);
    }
  }
}

/**
 * Normalizes a failed read into the error React Query surfaces.
 *
 * Transport failures collapse to one message (the status is already on the
 * Sentry report); schema mismatches and backend envelope errors keep their own
 * message, which is the part that says *which field* broke.
 */
function toReadError(err: unknown): Error {
  if (!isAxiosError(err) && err instanceof Error) return err;
  return new Error('Network response was not OK');
}

/**
 * Optional read: 400/403/404 resolve to `fallback`; see the read-policy table
 * at the top of this file.
 */
export async function apiCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    // Cancellation is not a failure: rethrow untouched (React Query discards
    // aborted fetches) and never report it — reporting turns every navigation
    // into console noise and a Sentry event.
    if (isCancellation(err)) throw err;
    const status = isAxiosError(err) ? err.response?.status : undefined;
    if (status === 400 || status === 403 || status === 404) return fallback;
    reportError(err, 'apiCall');
    throw new Error('Network response was not OK');
  }
}

/**
 * Required read: nothing is swallowed. Every failure — including 400/403/404 —
 * rejects, so React Query reports `isError` and the page can show an error
 * state instead of rendering as though the data were empty.
 */
export async function apiCallRequired<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (isCancellation(err)) throw err;
    reportError(err, 'apiCallRequired');
    throw toReadError(err);
  }
}

/**
 * Read where a 404 genuinely means "nothing yet" — the route is absent on an
 * older server build, or the record does not exist. A 404 resolves to
 * `fallback`; 400, 403, 5xx, network, and schema failures all reject.
 */
export async function apiCallEmptyOn404<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (isCancellation(err)) throw err;
    if (isAxiosError(err) && err.response?.status === 404) return fallback;
    reportError(err, 'apiCallEmptyOn404');
    throw toReadError(err);
  }
}

/** Wraps a POST/write API call that should throw on any error. */
export async function apiPost<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (isCancellation(err)) throw err;
    reportError(err, 'apiPost');
    throw new Error('Network response was not OK');
  }
}
