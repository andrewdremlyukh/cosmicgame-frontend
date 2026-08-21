// lexicon-allow-start: backend HTTP URL paths mirror the Go server routes and are a sealed contract

import { weiToEthNumber } from '@/utils/format';

import {
  apiGet,
  getAPIUrl,
  apiCall,
  apiCallEmptyOn404,
  apiCallRequired,
  apiPost,
  axios,
  flattenTxArray,
  flattenGesture,
  flattenGestureArray,
  flattenRoundInfo,
  pagedPath,
  type ApiListRequestOptions,
  type ApiRequestOptions,
} from './client';
import {
  DashboardInfoSchema,
  GestureInfoSchema,
  RoundInfoSchema,
  SpecialRecipientsSchema,
  WinningHistoryEntrySchema,
  validate,
  validateList,
} from './schemas';
import type {
  DashboardInfo,
  RoundInfo,
  GestureInfo,
  TxInfo,
  WinningHistoryEntry,
  SpecialRecipients,
  BannedGesture,
  GestureEthCostInfo,
} from './types';

/**
 * Maps the live Go `/statistics/dashboard` JSON into the field names the app schema expects.
 * Wire format uses `PrizeAmountEth`, `BidPriceEth`, `TokenReward` (wei string); lexicon/UI use
 * `CurPrizeAmountEth`, `CurBidPriceEth`, `GestureCostEth`.
 */
export function normalizeDashboardWire(raw: Record<string, unknown>): Record<string, unknown> {
  const data = { ...raw };

  if (data.CurPrizeAmountEth === undefined && typeof data.PrizeAmountEth === 'number') {
    data.CurPrizeAmountEth = data.PrizeAmountEth;
  }
  if (data.CurBidPriceEth === undefined && typeof data.BidPriceEth === 'number') {
    data.CurBidPriceEth = data.BidPriceEth;
  }
  if (data.GestureCostEth === undefined) {
    data.GestureCostEth = tokenRewardWeiStringToGestureCostEth(data.TokenReward);
  }

  return data;
}

function tokenRewardWeiStringToGestureCostEth(tokenReward: unknown): number {
  if (typeof tokenReward !== 'string' || tokenReward === '' || tokenReward === 'error') {
    return 0;
  }
  // Keep the value in wei through `formatUnits`: `Number(wei) / 1e18` rounds
  // the integer to a double first and loses precision past 2^53.
  try {
    return weiToEthNumber(BigInt(tokenReward));
  } catch {
    const n = Number(tokenReward);
    return Number.isFinite(n) ? n / 1e18 : 0;
  }
}

/**
 * Fetches the global dashboard statistics (current round, allocation pool, bid count, etc.).
 * Required read, strictly validated: every live surface derives cycle state from it, so a
 * missing or malformed payload must reach the UI as an error, not as an idle cycle.
 */
export function get_dashboard_info(opts?: ApiRequestOptions): Promise<DashboardInfo | null> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/dashboard'), opts);
    const normalized = normalizeDashboardWire(data as Record<string, unknown>);
    return validate(DashboardInfoSchema, normalized, 'DashboardInfo') as DashboardInfo;
  });
}

/** Fetches rounds with flattened allocation, charity, and anchoring fields (optionally paged). */
export function get_round_list(opts?: ApiListRequestOptions): Promise<RoundInfo[]> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl(`rounds/list/${pagedPath(opts)}`), opts);
    const rounds = (data.Rounds || [])
      .map(flattenRoundInfo)
      .filter((r: RoundInfo | null): r is RoundInfo => r !== null);
    // Checked for its throw, not its return value: the flattened rounds are
    // already the shape the UI consumes.
    validateList(RoundInfoSchema, rounds, 'RoundInfo[list]');
    return rounds;
  });
}

/** Fetches detailed info for a single round, clamping negative values to 0. */
export function get_round_info(
  roundNum: number,
  opts?: ApiRequestOptions,
): Promise<RoundInfo | null> {
  const id = roundNum < 0 ? 0 : roundNum;
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl(`rounds/info/${id}`), opts);
    const round = flattenRoundInfo(data.RoundInfo);
    if (round) validate(RoundInfoSchema, round, 'RoundInfo[detail]');
    return round;
  });
}

/**
 * Fetches the allocation-claim timestamp for the current round.
 *
 * Required read: a fallback of 0 would be epoch, which renders as a countdown
 * that has already elapsed rather than as a failed fetch.
 */
export function get_prize_time(opts?: ApiRequestOptions): Promise<number> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl('rounds/current/time'), opts);
    return data.CurRoundPrizeTime;
  });
}

/** Fetches the global allocation-claim history with flattened transaction fields (optionally paged). */
export function get_claim_history(opts?: ApiListRequestOptions): Promise<TxInfo[]> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl(`prizes/history/global/${pagedPath(opts)}`), opts);
    return flattenTxArray<TxInfo>(data.GlobalPrizeHistory);
  });
}

/** Fetches allocation-claim history for a specific wallet address (optionally paged). */
export function get_claim_history_by_user(
  address: string,
  opts?: ApiListRequestOptions,
): Promise<WinningHistoryEntry[] | null> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(
      getAPIUrl(`prizes/history/by_user/${address}/${pagedPath(opts)}`),
      opts,
    );
    // Backend uses `USerPrizeHistory` (typo); accept the corrected key as well.
    const history = flattenTxArray<WinningHistoryEntry>(
      data.UserPrizeHistory ?? data.USerPrizeHistory,
    );
    validateList(WinningHistoryEntrySchema, history, 'WinningHistory[byUser]');
    return history;
  });
}

/** Fetches gestures across all rounds with flattened transaction fields (optionally paged). */
export function get_bid_list(opts?: ApiListRequestOptions): Promise<GestureInfo[]> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl(`bid/list/all/${pagedPath(opts)}`), opts);
    const gestures = flattenGestureArray<GestureInfo>(data.Gestures ?? data.Bids);
    validateList(GestureInfoSchema, gestures, 'GestureInfo[list]');
    return gestures;
  });
}

/** Fetches a single bid by its event-log ID; a 404 means no such gesture. */
export function get_bid_info(
  evtLogID: number,
  opts?: ApiRequestOptions,
): Promise<GestureInfo | null> {
  return apiCallEmptyOn404(async () => {
    const { data } = await apiGet(getAPIUrl(`bid/info/${evtLogID}`), opts);
    const gesture = flattenGesture<GestureInfo>(data.GestureInfo ?? data.BidInfo);
    if (gesture) validate(GestureInfoSchema, gesture, 'GestureInfo[detail]');
    return gesture;
  }, null);
}

/** Fetches gestures for a given round, sorted by the specified direction (`"asc"` or `"desc"`). */
export function get_bid_list_by_round(
  round: number,
  sortDir: string,
  opts?: ApiListRequestOptions,
): Promise<GestureInfo[]> {
  return apiCallRequired(async () => {
    const dir = sortDir === 'asc' ? 0 : 1;
    const { data } = await apiGet(
      getAPIUrl(`bid/list/by_round/${round}/${dir}/${pagedPath(opts)}`),
      opts,
    );
    const gestures = flattenGestureArray<GestureInfo>(data.BidsByRound);
    validateList(GestureInfoSchema, gestures, 'GestureInfo[byRound]');
    return gestures;
  });
}

/** Fetches the current round's special-allocation recipients (endurance champion, last CST bidder, chrono warrior). */
export function get_current_special_winners(
  opts?: ApiRequestOptions,
): Promise<SpecialRecipients | null> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl('bid/current_special_winners'), opts);
    return validate(
      SpecialRecipientsSchema,
      data,
      'SpecialRecipients[current]',
    ) as SpecialRecipients;
  });
}

/**
 * Fetches the list of administratively banned gestures (Cosmic Game / Go API).
 * Optional read: the route is admin-gated and answers 403 to ordinary clients.
 */
export function get_banned_bids(opts?: ApiRequestOptions): Promise<BannedGesture[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('get_banned_bids'), opts);
    return data as BannedGesture[];
  }, []);
}

/** Bans a bid by its ID and the bidder's address (admin action). Uses Cosmic Game / Go API. */
export function ban_bid(bid_id: number, user_addr: string) {
  return apiPost(async () => {
    const { data } = await axios.post(getAPIUrl('ban_bid'), {
      bid_id,
      user_addr,
    });
    return data;
  });
}

/** Unbans a previously banned bid (admin action). Uses Cosmic Game / Go API. */
export function unban_gesture(bid_id: number) {
  return apiPost(async () => {
    const { data } = await axios.post(getAPIUrl('unban_bid'), { bid_id });
    return data;
  });
}

/** Fetches the current bid price in ETH and related pricing info. */
export function get_bid_eth_price(opts?: ApiRequestOptions): Promise<GestureEthCostInfo | null> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`bid/eth_price`), opts);
    return data as GestureEthCostInfo;
  }, null);
}

// lexicon-allow-end
