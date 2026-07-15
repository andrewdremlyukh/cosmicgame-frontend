import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePublicClient } from 'wagmi';
import { zeroAddress } from 'viem';

import { useRouter } from '@/i18n/navigation';
import api from '@/services/api';
import { isAxiosError } from '@/services/api/client';
import useCosmicGameContract from '@/hooks/useCosmicGameContract';
import type { DashboardInfo } from '@/services/api/types';
import { isUserRejection, reportError } from '@/utils/errors';
import { getContractErrorDescriptor, isEmptyContractReadError } from '@/utils/contractErrors';
import { asWriteFn } from '@/utils/contractWrite';
import { assertSuccessfulTransactionReceipt } from '@/utils/transactions';
import { useNotify } from '@/hooks/useNotify';
import { useAllocationTime, useCurrentTime, useClaimHistory } from '@/hooks/useApiQuery';
import { getStableClientTargetTime } from '@/utils/time';
import { useUxScenarioSnapshot } from '@/lib/uxCycleScenarios';

const GAS_EXTRA = BigInt(1_000_000);
const GAS_FLOOR = BigInt(2_000_000);

interface UseAllocationFinalizeOptions {
  data: DashboardInfo | null;
  offset: number;
}

export function useAllocationFinalize({ data, offset }: UseAllocationFinalizeOptions) {
  const t = useTranslations('toasts');
  const router = useRouter();
  const publicClient = usePublicClient();
  const cosmicGameContract = useCosmicGameContract();
  const { notify, notifyErrorFromEthers } = useNotify();
  const uxScenario = useUxScenarioSnapshot();

  const { data: prizeTimeRaw } = useAllocationTime();
  const { data: currentTimeRaw, dataUpdatedAt: currentTimeUpdatedAt } = useCurrentTime();
  const { data: claimHistoryRaw } = useClaimHistory();

  const [allocationTime, setAllocationTime] = useState(() =>
    getStableClientTargetTime({
      targetServerTimeSec: prizeTimeRaw,
      currentServerTimeSec: currentTimeRaw,
      currentServerTimeUpdatedAtMs: currentTimeUpdatedAt,
    }),
  );

  useEffect(() => {
    const updateId = window.setTimeout(() => {
      setAllocationTime((previousTargetMs) =>
        getStableClientTargetTime({
          targetServerTimeSec: prizeTimeRaw,
          currentServerTimeSec: currentTimeRaw,
          currentServerTimeUpdatedAtMs: currentTimeUpdatedAt,
          previousTargetMs,
          correctionToleranceMs: 1500,
        }),
      );
    }, 0);
    return () => window.clearTimeout(updateId);
  }, [prizeTimeRaw, currentTimeRaw, currentTimeUpdatedAt]);

  const claimHistory =
    (claimHistoryRaw as
      | import('@/components/tables/RecipientHistoryTable').WinningHistoryEntry[]
      | null) ?? null;

  const [timeoutFinalize, setTimeoutClaimPrize] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activationTime, setActivationTime] = useState(0);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  /**
   * Claim the Signature Allocation for the current cycle.
   * Returns `true` on a successfully mined transaction so the caller can
   * trigger a post-tx refresh. Returns `false` on wallet-not-connected,
   * user rejection, tx failure, or concurrent double-submit attempt.
   */
  const onFinalize = async (): Promise<boolean> => {
    if (inFlightRef.current) return false;
    if (!cosmicGameContract) {
      notify('error', t('wallet.connectCorrectNetwork'));
      return false;
    }
    if (!publicClient) {
      notify('error', t('network.unavailable'));
      return false;
    }

    inFlightRef.current = true;
    setIsClaiming(true);
    try {
      const roundBefore = (await cosmicGameContract.read.roundNum?.()) as bigint;
      const finalCstGestureParticipant =
        ((await cosmicGameContract.read.lastCstBidderAddress?.()) as string | undefined) ??
        zeroAddress;
      const hasFinalCstGesture = finalCstGestureParticipant !== zeroAddress;

      let gasLimit = GAS_FLOOR;
      try {
        const estimate = await cosmicGameContract.estimateGas.claimMainPrize?.({});
        if (estimate) gasLimit = estimate + GAS_EXTRA;
      } catch (estimateErr) {
        reportError(estimateErr, 'finalize-cycle-gas-estimate');
      }

      const hash = await asWriteFn(cosmicGameContract.write.claimMainPrize)({ gas: gasLimit });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assertSuccessfulTransactionReceipt(receipt);

      const roundAfter = (await cosmicGameContract.read.roundNum?.()) as bigint;
      if (roundAfter <= roundBefore) {
        notify('warning', t('finalize.roundDidNotAdvance'));
        return true;
      }

      /** Completed cycle is the on-chain round before advance — matches `api.get_round_info`. */
      const claimedRound = Number(roundBefore);

      // V3 awards `mainPrizeNumCosmicSignatureNfts` Signature Allocation NFTs (default 3);
      // V1/V2 award exactly 1 (the getter does not exist there, so the read fails and we keep 1).
      let signatureAllocationNftCount = 1;
      try {
        const value = (await cosmicGameContract.read.mainPrizeNumCosmicSignatureNfts?.()) as
          | bigint
          | undefined;
        if (value !== undefined && value > 0n) signatureAllocationNftCount = Number(value);
      } catch {
        // V2 deployment — selector not recognized; keep the single-NFT count.
      }

      // Imprinted per finalize: Signature Allocation NFT(s) + Endurance Champion + Chrono-Warrior
      // + participant Stellar NFTs + (final CST gesturer, if any) + (RWLK anchor Stellar, if staked).
      let count =
        (data?.NumRaffleNFTWinnersBidding ?? 0) +
        2 +
        signatureAllocationNftCount +
        (hasFinalCstGesture ? 1 : 0);
      if ((data?.MainStats?.StakeStatisticsRWalk?.TotalTokensStaked ?? 0) > 0) {
        count += data?.NumRaffleNFTWinnersStakingRWalk ?? 0;
      }

      try {
        await api.create(Number(roundBefore), count);
      } catch (apiErr) {
        const missingIndexer = isAxiosError(apiErr) && apiErr.response?.status === 404;
        if (!missingIndexer) {
          reportError(apiErr, 'post-claim-api');
          notify('warning', t('finalize.metadataUpdating'));
        }
      }

      const params = new URLSearchParams();
      params.set('cycle', String(claimedRound));
      params.set('message', 'success');
      router.push(`/allocation-finalized?${params.toString()}`);

      return true;
    } catch (err: unknown) {
      if (isUserRejection(err)) {
        notify('info', t('walletTransactionCancelled'));
        return false;
      }
      reportError(err, 'finalize-cycle');
      const descriptor = getContractErrorDescriptor(err);
      if (descriptor) {
        notify('error', t(descriptor.key, descriptor.values));
      } else {
        notifyErrorFromEthers(err, t('finalize.failed'));
      }
      return false;
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setIsClaiming(false);
    }
  };

  const fetchActivationTime = useCallback(async () => {
    if (uxScenario) {
      if (mountedRef.current) setActivationTime(0);
      return;
    }
    if (!cosmicGameContract) return;
    try {
      const time = await cosmicGameContract.read.roundActivationTime?.();
      if (!mountedRef.current) return;
      setActivationTime(Number(time ?? 0) - offset / 1000);
    } catch (err) {
      if (!isEmptyContractReadError(err)) {
        reportError(err, 'fetchActivationTime');
      }
      if (mountedRef.current) setActivationTime(0);
    }
  }, [cosmicGameContract, offset, uxScenario]);

  useEffect(() => {
    if (uxScenario) {
      setTimeoutClaimPrize(300);
      setActivationTime(0);
      return;
    }
    const fetchTimeoutFinalize = async () => {
      if (!cosmicGameContract) return;
      try {
        const timeout = await cosmicGameContract.read.timeoutDurationToClaimMainPrize?.();
        if (!mountedRef.current) return;
        setTimeoutClaimPrize(Number(timeout ?? 0));
      } catch (err) {
        if (!isEmptyContractReadError(err)) {
          reportError(err, 'fetchTimeoutFinalize');
        }
        if (mountedRef.current) setTimeoutClaimPrize(0);
      }
    };

    if (cosmicGameContract) {
      void fetchTimeoutFinalize();
      // Setting activation time state from a one-shot async contract read.
      // Migrating to React Query would be cleaner long-term but is a larger
      // refactor (the gesture flow couples to fetchActivationTime via the
      // returned callback).
      void fetchActivationTime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cosmicGameContract, offset]);

  return {
    allocationTime,
    timeoutFinalize,
    isClaiming,
    claimHistory,
    activationTime,
    onFinalize,
    fetchActivationTime,
  } as const;
}
