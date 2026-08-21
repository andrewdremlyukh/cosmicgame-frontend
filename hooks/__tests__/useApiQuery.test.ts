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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOptions() {
  return mockUseQuery.mock.calls[0][0];
}

/**
 * Live cycle queries use an adaptive refetch interval (lib/pollingCadence):
 * a function that returns the base cadence when no prize time is cached.
 */
function resolveRefetchInterval(value: unknown): unknown {
  return typeof value === 'function' ? value() : value;
}

// ---------------------------------------------------------------------------
// Rounds & Bidding
// ---------------------------------------------------------------------------

describe('useApiQuery hooks', () => {
  describe('useDashboardInfo', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useDashboardInfo());

      expect(mockUseQuery).toHaveBeenCalledTimes(1);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['dashboardInfo'] }),
      );
    });

    it('configures refetchInterval for live polling', () => {
      renderHook(() => useDashboardInfo());

      const options = mockUseQuery.mock.calls[0][0];
      expect(resolveRefetchInterval(options.refetchInterval)).toBe(12_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.staleTime).toBe(5_000);
    });

    it('returns the shape from useQuery', () => {
      mockUseQuery.mockReturnValue({ data: { TotalRounds: 5 }, isLoading: false, error: null });

      const { result } = renderHook(() => useDashboardInfo());

      expect(result.current).toEqual({ data: { TotalRounds: 5 }, isLoading: false, error: null });
    });

    it('passes server-provided initial data through to useQuery', () => {
      const initial = { CurRoundNum: 3, CurNumBids: 12 };
      renderHook(() => useDashboardInfo(initial as never));

      expect(getOptions().initialData).toBe(initial);
    });

    it('leaves initialData undefined when no server data is provided', () => {
      renderHook(() => useDashboardInfo());

      expect(getOptions().initialData).toBeUndefined();
    });

    it('normalizes a failed (null) server fetch to undefined so the client still loads', () => {
      renderHook(() => useDashboardInfo(null));

      expect(getOptions().initialData).toBeUndefined();
    });

    it('disables polling and focus refetch when poll is false', () => {
      renderHook(() => useDashboardInfo(undefined, { poll: false }));

      const options = getOptions();
      expect(options.refetchInterval).toBe(false);
      expect(options.refetchOnWindowFocus).toBe(false);
      expect(options.staleTime).toBe(60_000);
    });

    it('keeps live polling by default', () => {
      renderHook(() => useDashboardInfo(undefined, {}));

      const options = getOptions();
      expect(resolveRefetchInterval(options.refetchInterval)).toBe(12_000);
      expect(options.refetchOnWindowFocus).toBe(true);
    });
  });

  describe('live freshness (refetchOnWindowFocus)', () => {
    const liveHookCases: Array<[string, () => unknown]> = [
      ['useDashboardInfo', () => useDashboardInfo()],
      ['useAllocationTime', () => useAllocationTime()],
      ['useGestureList', () => useGestureList()],
      ['useGestureListByCycle', () => useGestureListByCycle(1)],
      ['useCurrentSpecialRecipients', () => useCurrentSpecialRecipients()],
      ['useGestureEthCost', () => useGestureEthCost()],
      ['useCurrentTime', () => useCurrentTime()],
    ];

    it.each(liveHookCases)('%s refetches on window focus', (_name, hook) => {
      renderHook(hook);

      expect(getOptions().refetchOnWindowFocus).toBe(true);
    });

    it('does not force focus refetch for slow-moving queries', () => {
      renderHook(() => useRoundList());

      expect(getOptions().refetchOnWindowFocus).toBeUndefined();
    });
  });

  describe('useRoundList', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useRoundList());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['roundList'] }),
      );
    });

    it('configures staleTime and refetchInterval', () => {
      renderHook(() => useRoundList());

      const options = mockUseQuery.mock.calls[0][0];
      expect(options.staleTime).toBe(30_000);
      expect(options.refetchInterval).toBe(60_000);
    });
  });

  describe('useRoundInfo', () => {
    it('includes the round number in the query key', () => {
      renderHook(() => useRoundInfo(42));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['roundInfo', 42] }),
      );
    });

    it('is enabled for round 0 and non-finite values are disabled', () => {
      renderHook(() => useRoundInfo(0));
      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(true);

      jest.clearAllMocks();
      renderHook(() => useRoundInfo(Number.NaN));
      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);

      jest.clearAllMocks();
      renderHook(() => useRoundInfo(5));
      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(true);
    });
  });

  describe('useAllocationTime', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useAllocationTime());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['allocationTime'] }),
      );
    });

    it('polls frequently with short staleTime', () => {
      renderHook(() => useAllocationTime());

      const options = getOptions();
      expect(options.staleTime).toBe(5_000);
      expect(resolveRefetchInterval(options.refetchInterval)).toBe(10_000);
      expect(options.refetchIntervalInBackground).toBe(false);
    });
  });

  describe('useClaimHistory', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useClaimHistory());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['claimHistory'] }),
      );
    });
  });

  describe('useClaimHistoryByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useClaimHistoryByUser('0xabc'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['claimHistoryByUser', '0xabc'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useClaimHistoryByUser(null));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    });

    it('is disabled when address is undefined', () => {
      renderHook(() => useClaimHistoryByUser(undefined));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    });

    it('is enabled when address is a non-empty string', () => {
      renderHook(() => useClaimHistoryByUser('0xabc'));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(true);
    });
  });

  describe('useGestureList', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useGestureList());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['gestureList'] }),
      );
    });

    it('configures polling', () => {
      renderHook(() => useGestureList());

      const options = getOptions();
      expect(options.staleTime).toBe(10_000);
      expect(options.refetchInterval).toBe(15_000);
      expect(options.refetchIntervalInBackground).toBe(false);
    });
  });

  describe('useGestureInfo', () => {
    it('includes evtLogId in the query key', () => {
      renderHook(() => useGestureInfo(99));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['gestureInfo', 99] }),
      );
    });

    it('is disabled when evtLogId is 0', () => {
      renderHook(() => useGestureInfo(0));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    });

    it('is enabled when evtLogId > 0', () => {
      renderHook(() => useGestureInfo(1));

      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useGestureListByCycle', () => {
    it('includes round and sortDir in the query key', () => {
      renderHook(() => useGestureListByCycle(3, 'asc'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['bidListByRound', 3, 'asc'] }),
      );
    });

    it('defaults sortDir to desc', () => {
      renderHook(() => useGestureListByCycle(3));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['bidListByRound', 3, 'desc'] }),
      );
    });

    it('is enabled for round >= 0', () => {
      renderHook(() => useGestureListByCycle(0));
      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(true);
    });

    it('polls active-cycle gestures so passive viewers see new chat and ticker entries', () => {
      renderHook(() => useGestureListByCycle(0));

      const options = getOptions();
      expect(options.staleTime).toBe(15_000);
      expect(resolveRefetchInterval(options.refetchInterval)).toBe(10_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.refetchOnWindowFocus).toBe(true);
    });
  });

  describe('useCurrentSpecialRecipients', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCurrentSpecialRecipients());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['currentSpecialWinners'] }),
      );
    });

    it('configures polling', () => {
      renderHook(() => useCurrentSpecialRecipients());

      const options = getOptions();
      expect(options.staleTime).toBe(15_000);
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
    });
  });

  describe('useBannedGestures', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useBannedGestures());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['bannedBids'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useBannedGestures());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useGestureEthCost', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useGestureEthCost());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['bidEthPrice'] }),
      );
    });

    it('configures polling', () => {
      renderHook(() => useGestureEthCost());

      const options = getOptions();
      expect(options.staleTime).toBe(10_000);
      expect(options.refetchInterval).toBe(15_000);
      expect(options.refetchIntervalInBackground).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Tokens (CST / CT)
  // ---------------------------------------------------------------------------

  describe('useCSTList', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCSTList());

      expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['cstList'] }));
    });
  });

  describe('useCSTTokensByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useCSTTokensByUser('0xabc'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['cstTokensByUser', '0xabc'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useCSTTokensByUser(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled when address is a non-empty string', () => {
      renderHook(() => useCSTTokensByUser('0xabc'));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useCSTInfo', () => {
    it('includes tokenId in the query key', () => {
      renderHook(() => useCSTInfo(7));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['cstInfo', 7] }),
      );
    });

    it('is disabled when tokenId is null', () => {
      renderHook(() => useCSTInfo(null));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    });

    it('is enabled for tokenId = 0', () => {
      renderHook(() => useCSTInfo(0));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(true);
    });
  });

  describe('useNameHistory', () => {
    it('includes tokenId in the query key', () => {
      renderHook(() => useNameHistory(3));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['nameHistory', 3] }),
      );
    });

    it('is disabled when tokenId is null', () => {
      renderHook(() => useNameHistory(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled for tokenId = 0', () => {
      renderHook(() => useNameHistory(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useNamedNFTs', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useNamedNFTs());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['namedNFTs'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useNamedNFTs());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useCSTTransfers', () => {
    it('includes address in the query key', () => {
      renderHook(() => useCSTTransfers('0xfeed'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['cstTransfers', '0xfeed'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useCSTTransfers(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled when address is present', () => {
      renderHook(() => useCSTTransfers('0xabc'));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useCSTDistribution', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCSTDistribution());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['cstDistribution'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useCSTDistribution());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useCTBalancesDistribution', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCTBalancesDistribution());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['ctBalancesDistribution'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useCTBalancesDistribution());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useCTStatistics', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCTStatistics());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['ctStatistics'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useCTStatistics());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useCTTransfers', () => {
    it('includes address in the query key', () => {
      renderHook(() => useCTTransfers('0xaa'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['ctTransfers', '0xaa'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useCTTransfers(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled when address is present', () => {
      renderHook(() => useCTTransfers('0xbb'));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useCTOwnershipTransfers', () => {
    it('includes tokenId in the query key', () => {
      renderHook(() => useCTOwnershipTransfers(10));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['ctOwnershipTransfers', 10] }),
      );
    });

    it('is disabled when tokenId is null', () => {
      renderHook(() => useCTOwnershipTransfers(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled for tokenId = 0', () => {
      renderHook(() => useCTOwnershipTransfers(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useCTPrice', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCTPrice());

      expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['ctPrice'] }));
    });

    it('configures live fallback polling and focus refresh', () => {
      renderHook(() => useCTPrice());

      const options = getOptions();
      expect(options.staleTime).toBe(10_000);
      expect(options.refetchInterval).toBe(15_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.refetchOnWindowFocus).toBe(true);
    });
  });

  describe('useTokenInfo', () => {
    it('includes tokenId in the query key', () => {
      renderHook(() => useTokenInfo(42));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tokenInfo', 42] }),
      );
    });

    it('accepts string tokenId', () => {
      renderHook(() => useTokenInfo('abc'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tokenInfo', 'abc'] }),
      );
    });

    it('is disabled when tokenId is null', () => {
      renderHook(() => useTokenInfo(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled when tokenId is present', () => {
      renderHook(() => useTokenInfo(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useUsedRWLKNFTs', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useUsedRWLKNFTs());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['usedRWLKNFTs'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useUsedRWLKNFTs());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  // ---------------------------------------------------------------------------
  // Staking – CST
  // ---------------------------------------------------------------------------

  describe('useCSTAnchorDistributionsToRetrieveByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useCSTAnchorDistributionsToRetrieveByUser('0xaaa'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingCSTRewardsToClaim', '0xaaa'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useCSTAnchorDistributionsToRetrieveByUser(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('configures polling', () => {
      renderHook(() => useCSTAnchorDistributionsToRetrieveByUser('0xaaa'));

      const options = getOptions();
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.staleTime).toBe(15_000);
    });
  });

  describe('useCSTAnchorDistributionsRetrievedByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useCSTAnchorDistributionsRetrievedByUser('0xbbb'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingCSTRewardsCollected', '0xbbb'] }),
      );
    });

    it('is disabled when address is undefined', () => {
      renderHook(() => useCSTAnchorDistributionsRetrievedByUser(undefined));
      expect(getOptions().enabled).toBe(false);
    });
  });

  describe('useAnchoredCSTokensByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useAnchoredCSTokensByUser('0xdead'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakedCSTTokens', '0xdead'] }),
      );
    });

    it('is disabled for falsy address', () => {
      renderHook(() => useAnchoredCSTokensByUser(''));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    });

    it('configures polling', () => {
      renderHook(() => useAnchoredCSTokensByUser('0xdead'));

      const options = getOptions();
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.staleTime).toBe(15_000);
    });
  });

  describe('useCSTAnchorActionsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useCSTAnchorActionsByUser('0xddd'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingCSTActionsByUser', '0xddd'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useCSTAnchorActionsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  describe('useCSTAnchorActions', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCSTAnchorActions());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['cstAnchorActions'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useCSTAnchorActions());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useCSTAnchorActionInfo', () => {
    it('includes actionId in the query key', () => {
      renderHook(() => useCSTAnchorActionInfo(5));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingCSTActionsInfo', 5] }),
      );
    });

    it('is disabled when actionId is null', () => {
      renderHook(() => useCSTAnchorActionInfo(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled for actionId = 0', () => {
      renderHook(() => useCSTAnchorActionInfo(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useCSTAnchorDistributions', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCSTAnchorDistributions());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingCSTRewards'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useCSTAnchorDistributions());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useCSTAnchorDistributionsByCycle', () => {
    it('includes round in the query key', () => {
      renderHook(() => useCSTAnchorDistributionsByCycle(3));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingCSTRewardsByRound', 3] }),
      );
    });

    it('is disabled when round is null', () => {
      renderHook(() => useCSTAnchorDistributionsByCycle(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled for round = 0', () => {
      renderHook(() => useCSTAnchorDistributionsByCycle(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useGlobalAnchoredCSTokens', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useGlobalAnchoredCSTokens());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakedCSTTokensGlobal'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useGlobalAnchoredCSTokens());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useAnchorDistributionsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useAnchorDistributionsByUser('0xfff'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingRewardsByUser', '0xfff'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useAnchorDistributionsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  describe('useAnchorDistributionsByUserByTokenDetails', () => {
    it('includes address and tokenId in the query key', () => {
      renderHook(() => useAnchorDistributionsByUserByTokenDetails('0x111', 4));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingRewardsByUserByToken', '0x111', 4] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useAnchorDistributionsByUserByTokenDetails(null, 4));
      expect(getOptions().enabled).toBe(false);
    });

    it('is disabled when tokenId is null', () => {
      renderHook(() => useAnchorDistributionsByUserByTokenDetails('0x111', null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled when both params are valid', () => {
      renderHook(() => useAnchorDistributionsByUserByTokenDetails('0x111', 0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useCSTAnchorDistributionsByUserByDeposit', () => {
    it('includes address in the query key', () => {
      renderHook(() => useCSTAnchorDistributionsByUserByDeposit('0x222'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingCSTByUserByDeposit', '0x222'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useCSTAnchorDistributionsByUserByDeposit(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Staking – RWLK
  // ---------------------------------------------------------------------------

  describe('useRWLKAnchorActionInfo', () => {
    it('includes actionId in the query key', () => {
      renderHook(() => useRWLKAnchorActionInfo(8));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingRWLKActionsInfo', 8] }),
      );
    });

    it('is disabled when actionId is null', () => {
      renderHook(() => useRWLKAnchorActionInfo(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled for actionId = 0', () => {
      renderHook(() => useRWLKAnchorActionInfo(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useRWLKAnchorActions', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useRWLKAnchorActions());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['rwlkAnchorActions'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useRWLKAnchorActions());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useRWLKAnchorActionsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useRWLKAnchorActionsByUser('0x333'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingRWLKActionsByUser', '0x333'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useRWLKAnchorActionsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  describe('useGlobalRWLKAnchorImprints', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useGlobalRWLKAnchorImprints());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingRWLKMintsGlobal'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useGlobalRWLKAnchorImprints());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useRWLKAnchorImprintsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useRWLKAnchorImprintsByUser('0x444'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakingRWLKMintsByUser', '0x444'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useRWLKAnchorImprintsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  describe('useGlobalAnchoredRWLKTokens', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useGlobalAnchoredRWLKTokens());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['stakedRWLKTokensGlobal'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useGlobalAnchoredRWLKTokens());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useAnchoredRWLKTokensByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useAnchoredRWLKTokensByUser('0x555'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['anchoredRWLKTokens', '0x555'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useAnchoredRWLKTokensByUser(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('configures polling', () => {
      renderHook(() => useAnchoredRWLKTokensByUser('0x555'));

      const options = getOptions();
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.staleTime).toBe(15_000);
    });
  });

  // ---------------------------------------------------------------------------
  // Donations – ETH
  // ---------------------------------------------------------------------------

  describe('useDonationsCGWithInfoByRound', () => {
    it('includes round in the query key', () => {
      renderHook(() => useDonationsCGWithInfoByRound(4));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsCGWithInfoByRound', 4] }),
      );
    });

    it('is enabled for round >= 0', () => {
      renderHook(() => useDonationsCGWithInfoByRound(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useDonationsWithInfoById', () => {
    it('includes id in the query key', () => {
      renderHook(() => useDonationsWithInfoById(9));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsWithInfoById', 9] }),
      );
    });

    it('is disabled when id is null', () => {
      renderHook(() => useDonationsWithInfoById(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('is enabled for id = 0', () => {
      renderHook(() => useDonationsWithInfoById(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useDonationsBothByRound', () => {
    it('includes round in the query key', () => {
      renderHook(() => useDonationsBothByRound(1));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsBothByRound', 1] }),
      );
    });

    it('is enabled for round >= 0', () => {
      renderHook(() => useDonationsBothByRound(0));
      expect(getOptions().enabled).toBe(true);
    });
  });

  describe('useDonationsBoth', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useDonationsBoth());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsBoth'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useDonationsBoth());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  // ---------------------------------------------------------------------------
  // Donations – Charity
  // ---------------------------------------------------------------------------

  describe('useCharityCGDeposits', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCharityCGDeposits());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['charityCGDeposits'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useCharityCGDeposits());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useCharityVoluntary', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCharityVoluntary());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['charityVoluntary'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useCharityVoluntary());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useCharityWithdrawals', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCharityWithdrawals());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['charityWithdrawals'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useCharityWithdrawals());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  // ---------------------------------------------------------------------------
  // Donations – NFT
  // ---------------------------------------------------------------------------

  describe('useDonationsNFTList', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useDonationsNFTList());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsNFTList'] }),
      );
    });
  });

  describe('useClaimedDonatedNFTByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useClaimedDonatedNFTByUser('0x777'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['claimedDonatedNFTByUser', '0x777'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useClaimedDonatedNFTByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  describe('useDonationsNFTByRound', () => {
    it('includes round in the query key', () => {
      renderHook(() => useDonationsNFTByRound(6));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsNFTByRound', 6] }),
      );
    });

    it('is enabled for round >= 0', () => {
      renderHook(() => useDonationsNFTByRound(0));
      expect(getOptions().enabled).toBe(true);
    });

    it('refreshes attached NFT asset context on window focus', () => {
      renderHook(() => useDonationsNFTByRound(0));
      expect(getOptions().refetchOnWindowFocus).toBe(true);
    });
  });

  describe('useUnclaimedDonatedNFTByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useUnclaimedDonatedNFTByUser('0x888'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['unclaimedDonatedNFTByUser', '0x888'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useUnclaimedDonatedNFTByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Donations – ERC20
  // ---------------------------------------------------------------------------

  describe('useDonationsERC20ByRound', () => {
    it('includes round in the query key', () => {
      renderHook(() => useDonationsERC20ByRound(3));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsERC20ByRound', 3] }),
      );
    });

    it('is enabled for round >= 0', () => {
      renderHook(() => useDonationsERC20ByRound(0));
      expect(getOptions().enabled).toBe(true);
    });

    it('refreshes attached ERC20 asset context on window focus', () => {
      renderHook(() => useDonationsERC20ByRound(0));
      expect(getOptions().refetchOnWindowFocus).toBe(true);
    });
  });

  describe('useDonationsERC20ByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useDonationsERC20ByUser('0x999'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['donationsERC20ByUser', '0x999'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useDonationsERC20ByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Users & Statistics
  // ---------------------------------------------------------------------------

  describe('useUserInfo', () => {
    it('includes address in the query key', () => {
      renderHook(() => useUserInfo('0x1234'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['userInfo', '0x1234'] }),
      );
    });

    it('is disabled when address is falsy', () => {
      renderHook(() => useUserInfo(null));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    });

    it('configures live polling', () => {
      renderHook(() => useUserInfo('0x1234'));

      const options = mockUseQuery.mock.calls[0][0];
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
    });
  });

  describe('useUserBalance', () => {
    it('includes address in the query key', () => {
      renderHook(() => useUserBalance('0xbeef'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['userBalance', '0xbeef'] }),
      );
    });

    it('is disabled when address is undefined', () => {
      renderHook(() => useUserBalance(undefined));

      expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    });

    it('configures polling', () => {
      renderHook(() => useUserBalance('0xbeef'));

      const options = getOptions();
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.staleTime).toBe(15_000);
    });
  });

  describe('useNotifyRedBox', () => {
    it('includes address in the query key', () => {
      renderHook(() => useNotifyRedBox('0xaaa'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['notifyRedBox', '0xaaa'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useNotifyRedBox(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('configures polling', () => {
      renderHook(() => useNotifyRedBox('0xaaa'));

      const options = getOptions();
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.staleTime).toBe(15_000);
    });
  });

  describe('useUniqueParticipants', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useUniqueParticipants());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['uniqueParticipants'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useUniqueParticipants());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useUniqueRecipients', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useUniqueRecipients());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['uniqueRecipients'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useUniqueRecipients());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useUniqueDonors', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useUniqueDonors());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['uniqueDonors'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useUniqueDonors());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useUniqueCSTAnchorHolders', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useUniqueCSTAnchorHolders());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['uniqueCSTAnchorHolders'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useUniqueCSTAnchorHolders());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useUniqueRWLKAnchorHolders', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useUniqueRWLKAnchorHolders());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['uniqueRWLKAnchorHolders'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useUniqueRWLKAnchorHolders());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  // ---------------------------------------------------------------------------
  // Raffle
  // ---------------------------------------------------------------------------

  describe('useStellarSelectionDepositsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useStellarSelectionDepositsByUser('0xbbb'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['raffleDepositsByUser', '0xbbb'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useStellarSelectionDepositsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  describe('useUnretrievedStellarSelectionDepositsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useUnretrievedStellarSelectionDepositsByUser('0xddd'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['unclaimedRaffleDepositsByUser', '0xddd'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useUnretrievedStellarSelectionDepositsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });

    it('configures polling', () => {
      renderHook(() => useUnretrievedStellarSelectionDepositsByUser('0xddd'));

      const options = getOptions();
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.staleTime).toBe(15_000);
    });
  });

  describe('useStellarSelectionNFTAllocationsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useStellarSelectionNFTAllocationsByUser('0xeee'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['raffleNFTWinningsByUser', '0xeee'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useStellarSelectionNFTAllocationsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Marketing
  // ---------------------------------------------------------------------------

  describe('useMarketingRewards', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useMarketingRewards());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['marketingRewards'] }),
      );
    });

    it('has staleTime of 30s', () => {
      renderHook(() => useMarketingRewards());
      expect(getOptions().staleTime).toBe(30_000);
    });
  });

  describe('useMarketingRewardsByUser', () => {
    it('includes address in the query key', () => {
      renderHook(() => useMarketingRewardsByUser('0xfff'));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['marketingRewardsByUser', '0xfff'] }),
      );
    });

    it('is disabled when address is null', () => {
      renderHook(() => useMarketingRewardsByUser(null));
      expect(getOptions().enabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // System
  // ---------------------------------------------------------------------------

  describe('useCurrentTime', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useCurrentTime());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['currentTime'] }),
      );
    });

    it('polls frequently', () => {
      renderHook(() => useCurrentTime());

      const options = mockUseQuery.mock.calls[0][0];
      expect(options.staleTime).toBe(5_000);
      expect(resolveRefetchInterval(options.refetchInterval)).toBe(12_000);
    });
  });

  describe('useSystemModelist', () => {
    it('calls useQuery with the correct query key', () => {
      renderHook(() => useSystemModelist());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['systemModelist'] }),
      );
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useSystemModelist());
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  describe('useSystemEvents', () => {
    it('includes start and end in the query key', () => {
      renderHook(() => useSystemEvents(0, 100));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['systemEvents', 0, 100] }),
      );
    });

    it('is enabled when start >= 0 and end >= start', () => {
      renderHook(() => useSystemEvents(0, 0));
      expect(getOptions().enabled).toBe(true);

      jest.clearAllMocks();
      renderHook(() => useSystemEvents(5, 10));
      expect(getOptions().enabled).toBe(true);
    });

    it('is disabled when end < start', () => {
      renderHook(() => useSystemEvents(10, 5));
      expect(getOptions().enabled).toBe(false);
    });

    it('has staleTime of 60s', () => {
      renderHook(() => useSystemEvents(0, 100));
      expect(getOptions().staleTime).toBe(60_000);
    });
  });

  // ---------------------------------------------------------------------------
  // Cross-cutting
  // ---------------------------------------------------------------------------

  describe('queryFn integration', () => {
    it('provides a queryFn for each hook', () => {
      renderHook(() => useDashboardInfo());

      const options = mockUseQuery.mock.calls[0][0];
      expect(typeof options.queryFn).toBe('function');
    });
  });
});
