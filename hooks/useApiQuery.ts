/**
 * React Query hooks that wrap the API layer. Each hook maps to a backend endpoint
 * with appropriate stale times and refetch intervals for the Cosmic Signature app.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import api from '@/services/api';
import { getLiveDataPollIntervalMs, getRemainingMsToAllocationTime } from '@/lib/pollingCadence';
import { useUxScenarioSnapshot } from '@/lib/uxCycleScenarios';
import type {
  AdminEventRow,
  BannedGesture,
  GestureEthCostInfo,
  Participant,
  GestureInfo,
  CharityWithdrawal,
  CombinedAnchorRecordInfo,
  CSTTokenInfo,
  CSTTransferRecord,
  CTBalanceDistribution,
  CTStatistics,
  CTTotalSupplyHistoryByBidRecord,
  CTTotalSupplyHistoryByDateRecord,
  CTPriceInfo,
  DashboardInfo,
  BidFrequencyBucket,
  BidTypeRatioBucket,
  BiddingActivityResponse,
  BidTimeBounds,
  TopBidderActivePeriodsResponse,
  DonatedERC20Token,
  AttachedNFT,
  ETHDonation,
  MarketingReward,
  NameHistoryRecord,
  NotifyRedBoxResult,
  StellarSelectionETHDeposit,
  StellarSelectionNFTRecipient,
  RewardsByToken,
  RoundInfo,
  SpecialRecipients,
  AnchoredTokenInfo,
  AnchorAction,
  CSTAnchorDistribution,
  AnchorDistributionImprint,
  SystemModeChangeEvent,
  TokenDistribution,
  TokenImprintInfo,
  TxInfo,
  UniqueEthDonor,
  UniqueAnchorHolderCST,
  UniqueAnchorHolderRWLK,
  UsedRWLKNFT,
  UserBalance,
  UserInfoWithLists,
  Recipient,
  RoiLeaderboardEntry,
  RoiLeaderboardSort,
  RoundClaimSummary,
  RoundClaimDetail,
  WinningHistoryEntry,
} from '@/services/api';

// ---------------------------------------------------------------------------
// Rounds & Bidding
// ---------------------------------------------------------------------------

function withUxScenarioData<T>(
  query: UseQueryResult<T, Error>,
  data: T | undefined,
  dataUpdatedAt?: number,
): UseQueryResult<T, Error> {
  if (data === undefined) return query;
  return {
    ...query,
    data,
    dataUpdatedAt: dataUpdatedAt ?? Date.now(),
    error: null,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle',
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    status: 'success',
  } as UseQueryResult<T, Error>;
}

/**
 * Adaptive refetch interval for live cycle queries: the base cadence far from
 * the finalization deadline, ramping to ~2s inside the final window (see
 * lib/pollingCadence). Reads the cached prize time so every live query speeds
 * up together as the countdown approaches zero.
 */
function useLivePollInterval(baseMs: number): () => number {
  const queryClient = useQueryClient();
  return useCallback(
    () =>
      getLiveDataPollIntervalMs(
        getRemainingMsToAllocationTime(queryClient.getQueryData(['allocationTime'])),
        baseMs,
      ),
    [baseMs, queryClient],
  );
}

export interface DashboardInfoOptions {
  /**
   * Live pages (home, current cycle, statistics hub) poll every 12s. Pages
   * showing mostly historical data should pass `poll: false` to fetch once
   * and rely on the shared cache instead.
   */
  poll?: boolean;
}

export function useDashboardInfo(
  initialData?: DashboardInfo | null,
  { poll = true }: DashboardInfoOptions = {},
) {
  const scenario = useUxScenarioSnapshot();
  const liveInterval = useLivePollInterval(12_000);
  const query = useQuery<DashboardInfo | null>({
    queryKey: ['dashboardInfo'],
    queryFn: ({ signal }) => api.get_dashboard_info({ signal }),
    enabled: !scenario,
    refetchInterval: poll ? liveInterval : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: poll,
    staleTime: poll ? 5_000 : 60_000,
    // A failed server-side fetch arrives as `null`; normalize it to undefined
    // so the query still starts in a loading state and fetches immediately.
    initialData: initialData ?? undefined,
  });
  return withUxScenarioData(query, scenario?.dashboard ?? undefined, scenario?.createdAtMs);
}

export function useRoundList() {
  return useQuery<RoundInfo[]>({
    queryKey: ['roundList'],
    queryFn: ({ signal }) => api.get_round_list({ signal }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useRoundInfo(roundNum: number) {
  return useQuery<RoundInfo | null>({
    queryKey: ['roundInfo', roundNum],
    queryFn: ({ signal }) => api.get_round_info(roundNum, { signal }),
    /** Backend serves `rounds/info/0`; the previous `> 0` guard broke first-cycle finalize UX. */
    enabled: Number.isFinite(roundNum) && roundNum >= 0,
    staleTime: 30_000,
  });
}

export function useAllocationTime() {
  const scenario = useUxScenarioSnapshot();
  const liveInterval = useLivePollInterval(10_000);
  const query = useQuery<number>({
    queryKey: ['allocationTime'],
    queryFn: ({ signal }) => api.get_prize_time({ signal }),
    enabled: !scenario,
    staleTime: 5_000,
    refetchInterval: liveInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.finalizationTimeSec, scenario?.createdAtMs);
}

export function useClaimHistory() {
  return useQuery<TxInfo[]>({
    queryKey: ['claimHistory'],
    queryFn: ({ signal }) => api.get_claim_history({ signal }),
    staleTime: 30_000,
  });
}

export function useClaimHistoryByUser(address: string | null | undefined) {
  return useQuery<WinningHistoryEntry[] | null>({
    queryKey: ['claimHistoryByUser', address],
    queryFn: ({ signal }) => api.get_claim_history_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useGestureList() {
  return useQuery<GestureInfo[]>({
    queryKey: ['gestureList'],
    queryFn: ({ signal }) => api.get_bid_list({ signal }),
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useGestureInfo(evtLogId: number) {
  return useQuery<GestureInfo | null>({
    queryKey: ['gestureInfo', evtLogId],
    queryFn: ({ signal }) => api.get_bid_info(evtLogId, { signal }),
    enabled: evtLogId > 0,
    staleTime: 60_000,
  });
}

export function useGestureListByCycle(round: number, sortDir: string = 'desc') {
  const scenario = useUxScenarioSnapshot();
  const liveInterval = useLivePollInterval(10_000);
  const query = useQuery<GestureInfo[]>({
    queryKey: ['bidListByRound', round, sortDir],
    queryFn: ({ signal }) => api.get_bid_list_by_round(round, sortDir, { signal }),
    enabled: !scenario && round >= 0,
    staleTime: 15_000,
    refetchInterval: liveInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.gestures, scenario?.createdAtMs);
}

export function useCurrentSpecialRecipients() {
  const scenario = useUxScenarioSnapshot();
  const query = useQuery<SpecialRecipients | null>({
    queryKey: ['currentSpecialWinners'],
    queryFn: ({ signal }) => api.get_current_special_winners({ signal }),
    enabled: !scenario,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.specialRecipients ?? undefined, scenario?.createdAtMs);
}

export function useBannedGestures() {
  return useQuery<BannedGesture[]>({
    queryKey: ['bannedBids'],
    queryFn: ({ signal }) => api.get_banned_bids({ signal }),
    staleTime: 30_000,
  });
}

export function useGestureEthCost() {
  const scenario = useUxScenarioSnapshot();
  const query = useQuery<GestureEthCostInfo | null>({
    queryKey: ['bidEthPrice'],
    queryFn: ({ signal }) => api.get_bid_eth_price({ signal }),
    enabled: !scenario,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.ethCost ?? undefined, scenario?.createdAtMs);
}

// ---------------------------------------------------------------------------
// Tokens (CST / CT)
// ---------------------------------------------------------------------------

export function useCSTList() {
  return useQuery<CSTTokenInfo[]>({
    queryKey: ['cstList'],
    queryFn: ({ signal }) => api.get_cst_list({ signal }),
    staleTime: 30_000,
  });
}

export function useCSTTokensByUser(address: string | null | undefined) {
  return useQuery<CSTTokenInfo[]>({
    queryKey: ['cstTokensByUser', address],
    queryFn: ({ signal }) => api.get_cst_tokens_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useCSTInfo(tokenId: number | null | undefined) {
  return useQuery<CSTTokenInfo | null>({
    queryKey: ['cstInfo', tokenId],
    queryFn: ({ signal }) => api.get_cst_info(tokenId!, { signal }),
    enabled: tokenId != null && tokenId >= 0,
    staleTime: 60_000,
  });
}

export function useNameHistory(tokenId: number | null | undefined) {
  return useQuery<NameHistoryRecord[]>({
    queryKey: ['nameHistory', tokenId],
    queryFn: ({ signal }) => api.get_name_history(tokenId!, { signal }),
    enabled: tokenId != null && tokenId >= 0,
    staleTime: 30_000,
  });
}

export function useNamedNFTs() {
  return useQuery<CSTTokenInfo[]>({
    queryKey: ['namedNFTs'],
    queryFn: ({ signal }) => api.get_named_nfts({ signal }),
    staleTime: 30_000,
  });
}

export function useCSTTransfers(address: string | null | undefined) {
  return useQuery<CSTTransferRecord[]>({
    queryKey: ['cstTransfers', address],
    queryFn: ({ signal }) => api.get_cst_transfers(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useCSTDistribution() {
  return useQuery<TokenDistribution[]>({
    queryKey: ['cstDistribution'],
    queryFn: ({ signal }) => api.get_cst_distribution({ signal }),
    staleTime: 60_000,
  });
}

export function useCTBalancesDistribution() {
  return useQuery<CTBalanceDistribution[]>({
    queryKey: ['ctBalancesDistribution'],
    queryFn: ({ signal }) => api.get_ct_balances_distribution({ signal }),
    staleTime: 60_000,
  });
}

export function useCTStatistics() {
  return useQuery<CTStatistics | null>({
    queryKey: ['ctStatistics'],
    queryFn: ({ signal }) => api.get_ct_statistics({ signal }),
    staleTime: 60_000,
  });
}

export function useCTTotalSupplyHistoryByDate(fromDate: string, toDate: string, enabled = true) {
  return useQuery<CTTotalSupplyHistoryByDateRecord[]>({
    queryKey: ['ctTotalSupplyHistoryByDate', fromDate, toDate],
    queryFn: ({ signal }) => api.get_ct_total_supply_history_by_date(fromDate, toDate, { signal }),
    enabled: enabled && Boolean(fromDate) && Boolean(toDate),
    staleTime: 60_000,
  });
}

// lexicon-allow-start: exported hook name mirrors existing API/chart contract
export function useCTTotalSupplyHistoryByBid(enabled = true) {
  return useQuery<CTTotalSupplyHistoryByBidRecord[]>({
    queryKey: ['ctTotalSupplyHistoryByBid'],
    queryFn: ({ signal }) => api.get_ct_total_supply_history_by_bid({ signal }),
    enabled,
    staleTime: 60_000,
  });
}
// lexicon-allow-end

// lexicon-allow-start: backend analytics query names and sealed wire fields
export function useBidTimeBounds(enabled = true) {
  return useQuery<BidTimeBounds>({
    queryKey: ['bidTimeBounds'],
    queryFn: ({ signal }) => api.get_bid_time_bounds({ signal }),
    enabled,
    staleTime: 300_000,
  });
}

export function useBiddingActivity(
  initTs: number,
  finTs: number,
  intervalSecs: number,
  enabled = true,
) {
  return useQuery<BiddingActivityResponse>({
    queryKey: ['biddingActivity', initTs, finTs, intervalSecs],
    queryFn: ({ signal }) => api.get_bidding_activity(initTs, finTs, intervalSecs, { signal }),
    enabled: enabled && initTs > 0 && finTs > initTs && intervalSecs > 0,
    staleTime: 60_000,
  });
}

export function useBidFrequency(
  initTs: number,
  finTs: number,
  intervalSecs: number,
  enabled = true,
) {
  return useQuery<BidFrequencyBucket[]>({
    queryKey: ['bidFrequency', initTs, finTs, intervalSecs],
    queryFn: ({ signal }) => api.get_bid_frequency(initTs, finTs, intervalSecs, { signal }),
    enabled: enabled && initTs > 0 && finTs > initTs && intervalSecs > 0,
    staleTime: 60_000,
  });
}

export function useBidTypeRatio(
  fromTs: number,
  toTs: number,
  intervalSecs: number,
  enabled = true,
) {
  return useQuery<BidTypeRatioBucket[]>({
    queryKey: ['bidTypeRatio', fromTs, toTs, intervalSecs],
    queryFn: ({ signal }) => api.get_bid_type_ratio(fromTs, toTs, intervalSecs, { signal }),
    enabled: enabled && fromTs > 0 && toTs > fromTs && intervalSecs > 0,
    staleTime: 60_000,
  });
}

export function useTopBidderActivePeriods(
  topN: number,
  initTs: number,
  finTs: number,
  enabled = true,
) {
  return useQuery<TopBidderActivePeriodsResponse>({
    queryKey: ['topBidderActivePeriods', topN, initTs, finTs],
    queryFn: ({ signal }) => api.get_top_bidder_active_periods(topN, initTs, finTs, { signal }),
    enabled: enabled && initTs > 0 && finTs > initTs && topN > 0,
    staleTime: 60_000,
  });
}
// lexicon-allow-end

export function useCTTransfers(address: string | null | undefined) {
  return useQuery<TxInfo[]>({
    queryKey: ['ctTransfers', address],
    queryFn: ({ signal }) => api.get_ct_transfers(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useCTOwnershipTransfers(tokenId: number | null | undefined) {
  return useQuery<CSTTransferRecord[]>({
    queryKey: ['ctOwnershipTransfers', tokenId],
    queryFn: ({ signal }) => api.get_ct_ownership_transfers(tokenId!, { signal }),
    enabled: tokenId != null && tokenId >= 0,
    staleTime: 30_000,
  });
}

export function useCTPrice() {
  const scenario = useUxScenarioSnapshot();
  const query = useQuery<CTPriceInfo | null>({
    queryKey: ['ctPrice'],
    queryFn: ({ signal }) => api.get_ct_price({ signal }),
    enabled: !scenario,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.cstPrice ?? undefined, scenario?.createdAtMs);
}

export function useTokenInfo(tokenId: number | string | null | undefined) {
  return useQuery<TokenImprintInfo | null>({
    queryKey: ['tokenInfo', tokenId],
    queryFn: ({ signal }) => api.get_info(tokenId!, { signal }),
    enabled: tokenId != null,
    staleTime: 60_000,
  });
}

export function useUsedRWLKNFTs() {
  return useQuery<UsedRWLKNFT[]>({
    queryKey: ['usedRWLKNFTs'],
    queryFn: ({ signal }) => api.get_used_rwlk_nfts({ signal }),
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Staking – CST
// ---------------------------------------------------------------------------

export function useCSTAnchorDistributionsToRetrieveByUser(address: string | null | undefined) {
  return useQuery<CSTAnchorDistribution[]>({
    queryKey: ['stakingCSTRewardsToClaim', address],
    queryFn: ({ signal }) => api.get_staking_cst_rewards_to_claim_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useCSTAnchorDistributionsRetrievedByUser(address: string | null | undefined) {
  return useQuery<CSTAnchorDistribution[]>({
    queryKey: ['stakingCSTRewardsCollected', address],
    queryFn: ({ signal }) => api.get_staking_cst_rewards_collected_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useAnchoredCSTokensByUser(address: string | null | undefined) {
  return useQuery<AnchoredTokenInfo[]>({
    queryKey: ['stakedCSTTokens', address],
    queryFn: ({ signal }) => api.get_staked_cst_tokens_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useCSTAnchorActionsByUser(address: string | null | undefined) {
  return useQuery<AnchorAction[]>({
    queryKey: ['stakingCSTActionsByUser', address],
    queryFn: ({ signal }) => api.get_staking_cst_actions_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useCSTAnchorActions() {
  return useQuery<AnchorAction[]>({
    queryKey: ['cstAnchorActions'],
    queryFn: ({ signal }) => api.get_staking_cst_actions({ signal }),
    staleTime: 30_000,
  });
}

export function useCSTAnchorActionInfo(actionId: number | null | undefined) {
  return useQuery<CombinedAnchorRecordInfo | null>({
    queryKey: ['stakingCSTActionsInfo', actionId],
    queryFn: ({ signal }) => api.get_staking_cst_actions_info(actionId!, { signal }),
    enabled: actionId != null && actionId >= 0,
    staleTime: 30_000,
  });
}

export function useCSTAnchorDistributions() {
  return useQuery<CSTAnchorDistribution[]>({
    queryKey: ['stakingCSTRewards'],
    queryFn: ({ signal }) => api.get_staking_cst_rewards({ signal }),
    staleTime: 30_000,
  });
}

export function useCSTAnchorDistributionsByCycle(round: number | null | undefined) {
  return useQuery<CSTAnchorDistribution[]>({
    queryKey: ['stakingCSTRewardsByRound', round],
    queryFn: ({ signal }) => api.get_staking_cst_rewards_by_round(round!, { signal }),
    enabled: round != null && round >= 0,
    staleTime: 30_000,
  });
}

export function useGlobalAnchoredCSTokens() {
  return useQuery<AnchoredTokenInfo[]>({
    queryKey: ['stakedCSTTokensGlobal'],
    queryFn: ({ signal }) => api.get_staked_cst_tokens({ signal }),
    staleTime: 30_000,
  });
}

export function useAnchorDistributionsByUser(address: string | null | undefined) {
  return useQuery<RewardsByToken[]>({
    queryKey: ['stakingRewardsByUser', address],
    queryFn: ({ signal }) => api.get_staking_rewards_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useAnchorDistributionsByUserByTokenDetails(
  address: string | null | undefined,
  tokenId: number | null | undefined,
) {
  return useQuery<Record<string, unknown> | null>({
    queryKey: ['stakingRewardsByUserByToken', address, tokenId],
    queryFn: ({ signal }) =>
      api.get_staking_rewards_by_user_by_token_details(address!, tokenId!, { signal }),
    enabled: !!address && tokenId != null,
    staleTime: 30_000,
  });
}

export function useCSTAnchorDistributionsByUserByDeposit(address: string | null | undefined) {
  return useQuery<CSTAnchorDistribution[]>({
    queryKey: ['stakingCSTByUserByDeposit', address],
    queryFn: ({ signal }) => api.get_staking_cst_by_user_by_deposit_rewards(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Staking – RWLK
// ---------------------------------------------------------------------------

export function useRWLKAnchorActionInfo(actionId: number | null | undefined) {
  return useQuery<CombinedAnchorRecordInfo | null>({
    queryKey: ['stakingRWLKActionsInfo', actionId],
    queryFn: ({ signal }) => api.get_staking_rwalk_actions_info(actionId!, { signal }),
    enabled: actionId != null && actionId >= 0,
    staleTime: 30_000,
  });
}

export function useRWLKAnchorActions() {
  return useQuery<AnchorAction[]>({
    queryKey: ['rwlkAnchorActions'],
    queryFn: ({ signal }) => api.get_staking_rwalk_actions({ signal }),
    staleTime: 30_000,
  });
}

export function useRWLKAnchorActionsByUser(address: string | null | undefined) {
  return useQuery<AnchorAction[]>({
    queryKey: ['stakingRWLKActionsByUser', address],
    queryFn: ({ signal }) => api.get_staking_rwalk_actions_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useGlobalRWLKAnchorImprints() {
  return useQuery<AnchorDistributionImprint[]>({
    queryKey: ['stakingRWLKMintsGlobal'],
    queryFn: ({ signal }) => api.get_staking_rwalk_mints_global({ signal }),
    staleTime: 30_000,
  });
}

export function useRWLKAnchorImprintsByUser(address: string | null | undefined) {
  return useQuery<AnchorDistributionImprint[]>({
    queryKey: ['stakingRWLKMintsByUser', address],
    queryFn: ({ signal }) => api.get_staking_rwalk_mints_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useGlobalAnchoredRWLKTokens() {
  return useQuery<AnchoredTokenInfo[]>({
    queryKey: ['stakedRWLKTokensGlobal'],
    queryFn: ({ signal }) => api.get_staked_rwalk_tokens({ signal }),
    staleTime: 30_000,
  });
}

export function useAnchoredRWLKTokensByUser(address: string | null | undefined) {
  return useQuery<AnchoredTokenInfo[]>({
    queryKey: ['anchoredRWLKTokens', address],
    queryFn: ({ signal }) => api.get_staked_rwalk_tokens_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

// ---------------------------------------------------------------------------
// Donations – ETH
// ---------------------------------------------------------------------------

export function useDonationsCGWithInfoByRound(round: number) {
  return useQuery<ETHDonation[]>({
    queryKey: ['donationsCGWithInfoByRound', round],
    queryFn: ({ signal }) => api.get_donations_cg_with_info_by_round(round, { signal }),
    enabled: round >= 0,
    staleTime: 30_000,
  });
}

export function useDonationsWithInfoById(id: number | null | undefined) {
  return useQuery<ETHDonation | null>({
    queryKey: ['donationsWithInfoById', id],
    queryFn: ({ signal }) => api.get_donations_with_info_by_id(id!, { signal }),
    enabled: id != null && id >= 0,
    staleTime: 60_000,
  });
}

export function useDonationsBothByRound(round: number) {
  return useQuery<ETHDonation[]>({
    queryKey: ['donationsBothByRound', round],
    queryFn: ({ signal }) => api.get_donations_both_by_round(round, { signal }),
    enabled: round >= 0,
    staleTime: 30_000,
  });
}

export function useDonationsBoth() {
  return useQuery<ETHDonation[]>({
    queryKey: ['donationsBoth'],
    queryFn: ({ signal }) => api.get_donations_both({ signal }),
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Donations – Charity
// ---------------------------------------------------------------------------

export function useCharityCGDeposits() {
  return useQuery<ETHDonation[]>({
    queryKey: ['charityCGDeposits'],
    queryFn: ({ signal }) => api.get_charity_cg_deposits({ signal }),
    staleTime: 60_000,
  });
}

export function useCharityVoluntary() {
  return useQuery<ETHDonation[]>({
    queryKey: ['charityVoluntary'],
    queryFn: ({ signal }) => api.get_charity_voluntary({ signal }),
    staleTime: 60_000,
  });
}

export function useCharityWithdrawals() {
  return useQuery<CharityWithdrawal[]>({
    queryKey: ['charityWithdrawals'],
    queryFn: ({ signal }) => api.get_charity_withdrawals({ signal }),
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Donations – NFT
// ---------------------------------------------------------------------------

export function useDonationsNFTList() {
  return useQuery<AttachedNFT[]>({
    queryKey: ['donationsNFTList'],
    queryFn: ({ signal }) => api.get_donations_nft_list({ signal }),
    staleTime: 30_000,
  });
}

export function useClaimedDonatedNFTByUser(address: string | null | undefined) {
  return useQuery<AttachedNFT[]>({
    queryKey: ['claimedDonatedNFTByUser', address],
    queryFn: ({ signal }) => api.get_claimed_donated_nft_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useDonationsNFTByRound(round: number) {
  const scenario = useUxScenarioSnapshot();
  const query = useQuery<AttachedNFT[]>({
    queryKey: ['donationsNFTByRound', round],
    queryFn: ({ signal }) => api.get_donations_nft_by_round(round, { signal }),
    enabled: !scenario && round >= 0,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.donationsNft, scenario?.createdAtMs);
}

export function useUnclaimedDonatedNFTByUser(address: string | null | undefined) {
  return useQuery<AttachedNFT[]>({
    queryKey: ['unclaimedDonatedNFTByUser', address],
    queryFn: ({ signal }) => api.get_unclaimed_donated_nft_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Donations – ERC20
// ---------------------------------------------------------------------------

export function useDonationsERC20ByRound(round: number) {
  const scenario = useUxScenarioSnapshot();
  const query = useQuery<DonatedERC20Token[]>({
    queryKey: ['donationsERC20ByRound', round],
    queryFn: ({ signal }) => api.get_donations_erc20_by_round(round, { signal }),
    enabled: !scenario && round >= 0,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.donationsErc20, scenario?.createdAtMs);
}

export function useDonationsERC20ByUser(address: string | null | undefined) {
  return useQuery<DonatedERC20Token[]>({
    queryKey: ['donationsERC20ByUser', address],
    queryFn: ({ signal }) => api.get_donations_erc20_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Users & Statistics
// ---------------------------------------------------------------------------

export function useUserInfo(address: string | null | undefined) {
  return useQuery<UserInfoWithLists | null>({
    queryKey: ['userInfo', address],
    queryFn: ({ signal }) => api.get_user_info(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useUserBalance(address: string | null | undefined) {
  return useQuery<UserBalance | null>({
    queryKey: ['userBalance', address],
    queryFn: ({ signal }) => api.get_user_balance(address!, { signal }),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useNotifyRedBox(address: string | null | undefined) {
  return useQuery<NotifyRedBoxResult | null>({
    queryKey: ['notifyRedBox', address],
    queryFn: ({ signal }) => api.notify_red_box(address!, { signal }),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useUniqueParticipants() {
  return useQuery<Participant[]>({
    queryKey: ['uniqueParticipants'],
    queryFn: ({ signal }) => api.get_unique_bidders({ signal }),
    staleTime: 60_000,
  });
}

export function useUniqueRecipients() {
  return useQuery<Recipient[]>({
    queryKey: ['uniqueRecipients'],
    queryFn: ({ signal }) => api.get_unique_winners({ signal }),
    staleTime: 60_000,
  });
}

export function useUniqueDonors() {
  return useQuery<UniqueEthDonor[]>({
    queryKey: ['uniqueDonors'],
    queryFn: ({ signal }) => api.get_unique_donors({ signal }),
    staleTime: 60_000,
  });
}

export function useRoiLeaderboard(sort: RoiLeaderboardSort = 'net_pl', minBids = 5) {
  return useQuery<RoiLeaderboardEntry[]>({
    queryKey: ['roiLeaderboard', sort, minBids],
    queryFn: ({ signal }) => api.get_roi_leaderboard(sort, minBids, { signal }),
    staleTime: 60_000,
  });
}

export function useClaimsByRound() {
  return useQuery<RoundClaimSummary[]>({
    queryKey: ['claimsByRound'],
    queryFn: ({ signal }) => api.get_claims_by_round({ signal }),
    staleTime: 60_000,
  });
}

export function useClaimDetailByRound(round: number | null) {
  return useQuery<RoundClaimDetail | null>({
    queryKey: ['claimDetailByRound', round],
    queryFn: ({ signal }) => api.get_claim_detail_by_round(round!, { signal }),
    enabled: round != null && round >= 0,
    staleTime: 60_000,
  });
}

export function useUniqueCSTAnchorHolders() {
  return useQuery<UniqueAnchorHolderCST[]>({
    queryKey: ['uniqueCSTAnchorHolders'],
    queryFn: ({ signal }) => api.get_unique_cst_stakers({ signal }),
    staleTime: 60_000,
  });
}

export function useUniqueRWLKAnchorHolders() {
  return useQuery<UniqueAnchorHolderRWLK[]>({
    queryKey: ['uniqueRWLKAnchorHolders'],
    queryFn: ({ signal }) => api.get_unique_rwalk_stakers({ signal }),
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Raffle
// ---------------------------------------------------------------------------

export function useStellarSelectionDepositsByUser(address: string | null | undefined) {
  return useQuery<StellarSelectionETHDeposit[]>({
    queryKey: ['raffleDepositsByUser', address],
    queryFn: ({ signal }) => api.get_raffle_deposits_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useUnretrievedStellarSelectionDepositsByUser(address: string | null | undefined) {
  return useQuery<StellarSelectionETHDeposit[]>({
    queryKey: ['unclaimedRaffleDepositsByUser', address],
    queryFn: ({ signal }) => api.get_unclaimed_raffle_deposits_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useStellarSelectionNFTAllocationsByUser(address: string | null | undefined) {
  return useQuery<StellarSelectionNFTRecipient[]>({
    queryKey: ['raffleNFTWinningsByUser', address],
    queryFn: ({ signal }) => api.get_raffle_nft_winnings_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------------------

export function useMarketingRewards() {
  return useQuery<MarketingReward[]>({
    queryKey: ['marketingRewards'],
    queryFn: ({ signal }) => api.get_marketing_rewards({ signal }),
    staleTime: 30_000,
  });
}

export function useMarketingRewardsByUser(address: string | null | undefined) {
  return useQuery<MarketingReward[]>({
    queryKey: ['marketingRewardsByUser', address],
    queryFn: ({ signal }) => api.get_marketing_rewards_by_user(address!, { signal }),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export function useCurrentTime() {
  const scenario = useUxScenarioSnapshot();
  const liveInterval = useLivePollInterval(12_000);
  const query = useQuery<number>({
    queryKey: ['currentTime'],
    queryFn: ({ signal }) => api.get_current_time({ signal }),
    enabled: !scenario,
    staleTime: 5_000,
    refetchInterval: liveInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  return withUxScenarioData(query, scenario?.currentTimeSec, scenario?.createdAtMs);
}

export function useSystemModelist() {
  return useQuery<SystemModeChangeEvent[]>({
    queryKey: ['systemModelist'],
    queryFn: ({ signal }) => api.get_system_modelist({ signal }),
    staleTime: 60_000,
  });
}

export function useSystemEvents(start: number, end: number) {
  return useQuery<AdminEventRow[]>({
    queryKey: ['systemEvents', start, end],
    queryFn: ({ signal }) => api.get_system_events(start, end, { signal }),
    enabled: start >= 0 && end >= start,
    staleTime: 60_000,
  });
}
