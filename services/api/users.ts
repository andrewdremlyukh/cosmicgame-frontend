// lexicon-allow-start: backend HTTP URL paths mirror the Go server routes and are a sealed contract

import {
  apiGet,
  getAPIUrl,
  apiCall,
  apiCallEmptyOn404,
  apiCallRequired,
  flattenGestureArray,
  flattenTxArray,
  type ApiListRequestOptions,
  type ApiRequestOptions,
} from './client';
import {
  ParticipantSchema,
  RecipientSchema,
  RoundClaimDetailSchema,
  RoundClaimSummarySchema,
  UniqueAnchorHolderCSTSchema,
  UniqueAnchorHolderRWLKSchema,
  UniqueEthDonorSchema,
  UserBalanceSchema,
  UserInfoSchema,
  safeValidate,
  safeValidateListSample,
  validate,
  validateList,
} from './schemas';
import type {
  UserInfoWithLists,
  UserBalance,
  NotifyRedBoxResult,
  Participant,
  Recipient,
  RoiLeaderboardEntry,
  RoiLeaderboardSort,
  RoundClaimSummary,
  RoundClaimDetail,
  UniqueEthDonor,
  UniqueAnchorHolderCST,
  UniqueAnchorHolderRWLK,
} from './types';

/**
 * Fetches comprehensive user profile including flattened gestures, allocations, tokens, anchoring,
 * and donation lists. Required read with strict validation of the `UserInfo` totals — a wallet
 * page that quietly renders zeros is worse than one that says the read failed.
 */
export function get_user_info(
  address: string,
  opts?: ApiRequestOptions,
): Promise<UserInfoWithLists | null> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl(`user/info/${address}`), opts);

    if (data) {
      if (data.UserInfo != null) validate(UserInfoSchema, data.UserInfo, 'UserInfo');
      return {
        ...data,
        Gestures: flattenGestureArray(data.Gestures ?? data.Bids ?? []),
        PrizeHistory: flattenTxArray(data.PrizeHistory || []),
        CosmicSignatureTokensOwned: flattenTxArray(data.CosmicSignatureTokensOwned || []),
        CurrentlyStakedTokens: flattenTxArray(data.CurrentlyStakedTokens || []),
        DonatedNFTsClaimed: flattenTxArray(data.DonatedNFTsClaimed || []),
        DonatedTokensClaimed: flattenTxArray(data.DonatedTokensClaimed || []),
        ERC20Transfers: flattenTxArray(data.ERC20Transfers || []),
        ERC721Transfers: flattenTxArray(data.ERC721Transfers || []),
        ETHDonationsMade: flattenTxArray(data.ETHDonationsMade || []),
        MainPrizeClaims: flattenTxArray(data.MainPrizeClaims || []),
        MarketingRewardsAwarded: flattenTxArray(data.MarketingRewardsAwarded || []),
        StakingActions: flattenTxArray(data.StakingActions || []),
        TokenDonationsMade: flattenTxArray(data.TokenDonationsMade || []),
      };
    }

    return data;
  });
}

/** Fetches ETH and token balances for a wallet address. */
export function get_user_balance(
  address: string,
  opts?: ApiRequestOptions,
): Promise<UserBalance | null> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`user/balances/${address}`), opts);
    if (data == null) return data;
    return safeValidate(UserBalanceSchema, data, 'UserBalance') as UserBalance;
  }, null);
}

/** Fetches red-box notification data (unclaimed winnings) for a wallet address. */
export function notify_red_box(
  address: string,
  opts?: ApiRequestOptions,
): Promise<NotifyRedBoxResult | null> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`user/notif_red_box/${address}`), opts);
    return data.Winnings as NotifyRedBoxResult;
  }, null);
}

/** Fetches the list of unique bidder addresses with bid counts and totals. */
export function get_unique_bidders(opts?: ApiRequestOptions): Promise<Participant[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/unique/bidders'), opts);
    return safeValidateListSample(
      ParticipantSchema,
      data.UniqueBidders,
      'uniqueBidders',
    ) as Participant[];
  }, []);
}

/** Fetches the list of unique allocation-recipient addresses with win counts. */
export function get_unique_winners(opts?: ApiRequestOptions): Promise<Recipient[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/unique/winners'), opts);
    return safeValidateListSample(
      RecipientSchema,
      data.UniqueWinners,
      'uniqueWinners',
    ) as Recipient[];
  }, []);
}

/**
 * Fetches the per-player ROI leaderboard (Tier-1, ETH-only). The backend sorts
 * server-side per `sort` and filters by `minBids`; we over-fetch and paginate
 * client-side. Returns `[]` when the endpoint isn't deployed yet (404); any
 * other failure propagates.
 */
export function get_roi_leaderboard(
  sort: RoiLeaderboardSort = 'net_pl',
  minBids = 5,
  opts?: ApiListRequestOptions,
): Promise<RoiLeaderboardEntry[]> {
  return apiCallEmptyOn404(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/leaderboard/roi'), opts, {
      params: {
        sort,
        min_bids: minBids,
        limit: opts?.limit ?? 200,
        offset: opts?.offset ?? 0,
      },
    });
    return (data.RoiLeaderboard ?? []) as RoiLeaderboardEntry[];
  }, []);
}

/**
 * Fetches the per-cycle claimable-asset summary (awarded vs unclaimed secondary
 * ETH allocations, attached NFTs, and attached ERC-20s held in PrizesWallet), with
 * claim-window expiry, average claim time, and the unclaimed items for drill-down.
 * Strictly validated. Returns `[]` when the endpoint isn't deployed yet (404).
 */
export function get_claims_by_round(opts?: ApiRequestOptions): Promise<RoundClaimSummary[]> {
  return apiCallEmptyOn404(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/claims/by_round'), opts);
    const claims = (data.ClaimsByRound ?? []) as RoundClaimSummary[];
    validateList(RoundClaimSummarySchema, claims, 'RoundClaimSummary[byRound]');
    return claims;
  }, []);
}

/**
 * Fetches the per-cycle claim drill-down: the claim transactions (each recipient's
 * withdrawal, with the time it took after the cycle finalized and the tx hash) and
 * the tokens attached during that cycle. Strictly validated; `null` on 404.
 */
export function get_claim_detail_by_round(
  round: number,
  opts?: ApiRequestOptions,
): Promise<RoundClaimDetail | null> {
  return apiCallEmptyOn404(async () => {
    const { data } = await apiGet(getAPIUrl(`statistics/claims/detail/${round}`), opts);
    const detail = {
      RoundNum: data.RoundNum ?? round,
      ClaimTransactions: data.ClaimTransactions ?? [],
      AttachedTokens: data.AttachedTokens ?? [],
    } as RoundClaimDetail;
    validate(RoundClaimDetailSchema, detail, 'RoundClaimDetail');
    return detail;
  }, null);
}

/** Fetches the list of unique ETH donor addresses with donation totals. */
export function get_unique_donors(opts?: ApiRequestOptions): Promise<UniqueEthDonor[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/unique/donors'), opts);
    return safeValidateListSample(
      UniqueEthDonorSchema,
      data.UniqueDonors,
      'uniqueDonors',
    ) as UniqueEthDonor[];
  }, []);
}

/** Fetches the list of unique CST anchorHolder addresses with anchoring stats. */
export function get_unique_cst_stakers(opts?: ApiRequestOptions): Promise<UniqueAnchorHolderCST[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/unique/stakers/cst'), opts);
    return safeValidateListSample(
      UniqueAnchorHolderCSTSchema,
      data.UniqueStakersCST,
      'uniqueStakersCST',
    ) as UniqueAnchorHolderCST[];
  }, []);
}

/** Fetches the list of unique RandomWalk anchorHolder addresses with anchoring stats. */
export function get_unique_rwalk_stakers(
  opts?: ApiRequestOptions,
): Promise<UniqueAnchorHolderRWLK[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('statistics/unique/stakers/randomwalk'), opts);
    return safeValidateListSample(
      UniqueAnchorHolderRWLKSchema,
      data.UniqueStakersRWalk,
      'uniqueStakersRWalk',
    ) as UniqueAnchorHolderRWLK[];
  }, []);
}

// lexicon-allow-end
