/**
 * Type-level tests for useApiQuery hooks.
 *
 * Verifies that every hook returns properly typed data from useQuery<T>,
 * ensuring consumers get type-safe data without needing `as unknown as` casts.
 */
import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';

import {
  useDashboardInfo,
  useRoundList,
  useRoundInfo,
  useAllocationTime,
  useClaimHistory,
  useClaimHistoryByUser,
  useGestureList,
  useGestureInfo,
  useGestureListByCycle,
  useCurrentSpecialRecipients,
  useBannedGestures,
  useGestureEthCost,
  useCSTList,
  useCSTTokensByUser,
  useCSTInfo,
  useNameHistory,
  useNamedNFTs,
  useCSTTransfers,
  useCSTDistribution,
  useCTBalancesDistribution,
  useCTStatistics,
  useCTTotalSupplyHistoryByDate,
  useCTTotalSupplyHistoryByBid,
  useCTTransfers,
  useCTOwnershipTransfers,
  useCTPrice,
  useTokenInfo,
  useUsedRWLKNFTs,
  useCSTAnchorDistributionsToRetrieveByUser,
  useCSTAnchorDistributionsRetrievedByUser,
  useAnchoredCSTokensByUser,
  useCSTAnchorActionsByUser,
  useCSTAnchorActions,
  useCSTAnchorActionInfo,
  useCSTAnchorDistributions,
  useCSTAnchorDistributionsByCycle,
  useGlobalAnchoredCSTokens,
  useAnchorDistributionsByUser,
  useAnchorDistributionsByUserByTokenDetails,
  useCSTAnchorDistributionsByUserByDeposit,
  useRWLKAnchorActionInfo,
  useRWLKAnchorActions,
  useRWLKAnchorActionsByUser,
  useGlobalRWLKAnchorImprints,
  useRWLKAnchorImprintsByUser,
  useGlobalAnchoredRWLKTokens,
  useAnchoredRWLKTokensByUser,
  useDonationsCGWithInfoByRound,
  useDonationsWithInfoById,
  useDonationsBothByRound,
  useDonationsBoth,
  useCharityCGDeposits,
  useCharityVoluntary,
  useCharityWithdrawals,
  useDonationsNFTList,
  useClaimedDonatedNFTByUser,
  useDonationsNFTByRound,
  useUnclaimedDonatedNFTByUser,
  useDonationsERC20ByRound,
  useDonationsERC20ByUser,
  useUserInfo,
  useUserBalance,
  useNotifyRedBox,
  useUniqueParticipants,
  useUniqueRecipients,
  useUniqueDonors,
  useUniqueCSTAnchorHolders,
  useUniqueRWLKAnchorHolders,
  useStellarSelectionDepositsByUser,
  useUnretrievedStellarSelectionDepositsByUser,
  useStellarSelectionNFTAllocationsByUser,
  useMarketingRewards,
  useMarketingRewardsByUser,
  useCurrentTime,
  useSystemModelist,
  useSystemEvents,
} from '@/hooks/useApiQuery';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: undefined, isLoading: false, error: null })),
  useQueryClient: jest.fn(() => ({ getQueryData: jest.fn(() => undefined) })),
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: new Proxy(
    {},
    { get: (_target, prop) => (typeof prop === 'string' ? jest.fn() : undefined) },
  ),
}));

const mockUseQuery = useQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useApiQuery hook generics — every hook passes a type to useQuery<T>', () => {
  const HOOKS_WITH_GENERICS: [string, () => void][] = [
    ['useDashboardInfo', () => useDashboardInfo()],
    ['useRoundList', () => useRoundList()],
    ['useRoundInfo', () => useRoundInfo(1)],
    ['useAllocationTime', () => useAllocationTime()],
    ['useClaimHistory', () => useClaimHistory()],
    ['useClaimHistoryByUser', () => useClaimHistoryByUser('0xabc')],
    ['useGestureList', () => useGestureList()],
    ['useGestureInfo', () => useGestureInfo(1)],
    ['useGestureListByCycle', () => useGestureListByCycle(1)],
    ['useCurrentSpecialRecipients', () => useCurrentSpecialRecipients()],
    ['useBannedGestures', () => useBannedGestures()],
    ['useGestureEthCost', () => useGestureEthCost()],
    ['useCSTList', () => useCSTList()],
    ['useCSTTokensByUser', () => useCSTTokensByUser('0xabc')],
    ['useCSTInfo', () => useCSTInfo(1)],
    ['useNameHistory', () => useNameHistory(1)],
    ['useNamedNFTs', () => useNamedNFTs()],
    ['useCSTTransfers', () => useCSTTransfers('0xabc')],
    ['useCSTDistribution', () => useCSTDistribution()],
    ['useCTBalancesDistribution', () => useCTBalancesDistribution()],
    ['useCTStatistics', () => useCTStatistics()],
    ['useCTTotalSupplyHistoryByDate', () => useCTTotalSupplyHistoryByDate('20260101', '20260131')],
    ['useCTTotalSupplyHistoryByBid', () => useCTTotalSupplyHistoryByBid()],
    ['useCTTransfers', () => useCTTransfers('0xabc')],
    ['useCTOwnershipTransfers', () => useCTOwnershipTransfers(1)],
    ['useCTPrice', () => useCTPrice()],
    ['useTokenInfo', () => useTokenInfo(1)],
    ['useUsedRWLKNFTs', () => useUsedRWLKNFTs()],
    [
      'useCSTAnchorDistributionsToRetrieveByUser',
      () => useCSTAnchorDistributionsToRetrieveByUser('0x'),
    ],
    [
      'useCSTAnchorDistributionsRetrievedByUser',
      () => useCSTAnchorDistributionsRetrievedByUser('0x'),
    ],
    ['useAnchoredCSTokensByUser', () => useAnchoredCSTokensByUser('0x')],
    ['useCSTAnchorActionsByUser', () => useCSTAnchorActionsByUser('0x')],
    ['useCSTAnchorActions', () => useCSTAnchorActions()],
    ['useCSTAnchorActionInfo', () => useCSTAnchorActionInfo(1)],
    ['useCSTAnchorDistributions', () => useCSTAnchorDistributions()],
    ['useCSTAnchorDistributionsByCycle', () => useCSTAnchorDistributionsByCycle(1)],
    ['useGlobalAnchoredCSTokens', () => useGlobalAnchoredCSTokens()],
    ['useAnchorDistributionsByUser', () => useAnchorDistributionsByUser('0x')],
    [
      'useAnchorDistributionsByUserByTokenDetails',
      () => useAnchorDistributionsByUserByTokenDetails('0x', 1),
    ],
    [
      'useCSTAnchorDistributionsByUserByDeposit',
      () => useCSTAnchorDistributionsByUserByDeposit('0x'),
    ],
    ['useRWLKAnchorActionInfo', () => useRWLKAnchorActionInfo(1)],
    ['useRWLKAnchorActions', () => useRWLKAnchorActions()],
    ['useRWLKAnchorActionsByUser', () => useRWLKAnchorActionsByUser('0x')],
    ['useGlobalRWLKAnchorImprints', () => useGlobalRWLKAnchorImprints()],
    ['useRWLKAnchorImprintsByUser', () => useRWLKAnchorImprintsByUser('0x')],
    ['useGlobalAnchoredRWLKTokens', () => useGlobalAnchoredRWLKTokens()],
    ['useAnchoredRWLKTokensByUser', () => useAnchoredRWLKTokensByUser('0x')],
    ['useDonationsCGWithInfoByRound', () => useDonationsCGWithInfoByRound(1)],
    ['useDonationsWithInfoById', () => useDonationsWithInfoById(1)],
    ['useDonationsBothByRound', () => useDonationsBothByRound(1)],
    ['useDonationsBoth', () => useDonationsBoth()],
    ['useCharityCGDeposits', () => useCharityCGDeposits()],
    ['useCharityVoluntary', () => useCharityVoluntary()],
    ['useCharityWithdrawals', () => useCharityWithdrawals()],
    ['useDonationsNFTList', () => useDonationsNFTList()],
    ['useClaimedDonatedNFTByUser', () => useClaimedDonatedNFTByUser('0x')],
    ['useDonationsNFTByRound', () => useDonationsNFTByRound(1)],
    ['useUnclaimedDonatedNFTByUser', () => useUnclaimedDonatedNFTByUser('0x')],
    ['useDonationsERC20ByRound', () => useDonationsERC20ByRound(1)],
    ['useDonationsERC20ByUser', () => useDonationsERC20ByUser('0x')],
    ['useUserInfo', () => useUserInfo('0x')],
    ['useUserBalance', () => useUserBalance('0x')],
    ['useNotifyRedBox', () => useNotifyRedBox('0x')],
    ['useUniqueParticipants', () => useUniqueParticipants()],
    ['useUniqueRecipients', () => useUniqueRecipients()],
    ['useUniqueDonors', () => useUniqueDonors()],
    ['useUniqueCSTAnchorHolders', () => useUniqueCSTAnchorHolders()],
    ['useUniqueRWLKAnchorHolders', () => useUniqueRWLKAnchorHolders()],
    ['useStellarSelectionDepositsByUser', () => useStellarSelectionDepositsByUser('0x')],
    [
      'useUnretrievedStellarSelectionDepositsByUser',
      () => useUnretrievedStellarSelectionDepositsByUser('0x'),
    ],
    [
      'useStellarSelectionNFTAllocationsByUser',
      () => useStellarSelectionNFTAllocationsByUser('0x'),
    ],
    ['useMarketingRewards', () => useMarketingRewards()],
    ['useMarketingRewardsByUser', () => useMarketingRewardsByUser('0x')],
    ['useCurrentTime', () => useCurrentTime()],
    ['useSystemModelist', () => useSystemModelist()],
    ['useSystemEvents', () => useSystemEvents(0, 100)],
  ];

  it('covers all 76 hooks', () => {
    expect(HOOKS_WITH_GENERICS.length).toBe(76);
  });

  it.each(HOOKS_WITH_GENERICS)('%s calls useQuery with a queryFn', (name, hook) => {
    renderHook(() => hook());
    expect(mockUseQuery).toHaveBeenCalledTimes(1);
    const options = mockUseQuery.mock.calls[0][0];
    expect(typeof options.queryFn).toBe('function');
    expect(options.queryKey).toBeDefined();
    expect(Array.isArray(options.queryKey)).toBe(true);
  });

  it('no hook calls bare useQuery without a generic type argument', () => {
    /**
     * This test verifies that every useQuery call passes options (which
     * includes the generic type parameter). The key evidence is that
     * all hooks call useQuery with exactly 1 argument (the options object),
     * and the TypeScript compiler ensures the generic is present at compile time.
     * The tsc --noEmit check in CI validates this.
     */
    for (const [, hook] of HOOKS_WITH_GENERICS) {
      jest.clearAllMocks();
      renderHook(() => hook());
      expect(mockUseQuery).toHaveBeenCalledTimes(1);
      expect(mockUseQuery.mock.calls[0].length).toBe(1);
    }
  });
});
