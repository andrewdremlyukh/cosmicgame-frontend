'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { formatEther } from 'viem';

import {
  charityWalletAbi as CHARITY_WALLET_ABI,
  cosmicGameAbi as COSMICGAME_ABI,
} from '@/contracts/abis';

import { networkConfig } from '@/config/networks';
import { useContractAddresses } from '@/contexts/ContractAddressesContext';
import { PageShell } from '@/components/ui/page-shell';
import { useDashboardInfo } from '@/hooks/useApiQuery';
import { reportError } from '@/utils/errors';
import {
  isMissingFunctionReadError,
  readCosmicGameWithFallback,
} from '@/utils/cosmicGameContractCompat';
import useContractNoSigner from '@/hooks/useContractNoSigner';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionDivider } from '@/components/ui/section-divider';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';

import { NetworkBadge } from './components/NetworkBadge';
import { FundDistribution } from './components/FundDistribution';
import { GameConfiguration } from './components/GameConfiguration';
import { ContractAddressGrid } from './components/ContractAddressGrid';
import { AuctionParameters } from './components/AuctionParameters';
import { buildContracts, CONTRACT_ENTRY_IDS, type ContractEntryCopy } from './contractAddressData';

const sectionFade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const CST_REWARD_PREVIEW_REFRESH_MS = 1_000;

interface LiveCstPreviewTestGlobals {
  expect?: unknown;
  __COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__?: boolean;
  __COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__?: number;
}

function shouldScheduleLiveCstPreviewTimer(): boolean {
  const testGlobals = globalThis as LiveCstPreviewTestGlobals;
  const isJest = typeof testGlobals.expect === 'function';
  return !isJest || testGlobals.__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ === true;
}

/**
 * Turns a contract divisor into the percentage the UI shows. A zero or
 * unreadable divisor would produce `Infinity`/`NaN` and render as
 * "Infinity%", so those return null and the caller keeps the previous value.
 */
function percentFromDivisor(divisor: unknown): number | null {
  const value = Number(divisor ?? 1);
  if (!Number.isFinite(value) || value === 0) return null;
  return 100 / value;
}

function getLiveCstPreviewRefreshMs(): number {
  const testInterval = (globalThis as LiveCstPreviewTestGlobals)
    .__COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__;
  if (typeof testInterval === 'number' && Number.isFinite(testInterval) && testInterval > 0) {
    return testInterval;
  }
  return CST_REWARD_PREVIEW_REFRESH_MS;
}

const Contracts = () => {
  const t = useTranslations('contracts');
  const { data, isLoading: loading } = useDashboardInfo();
  const { charity, cosmicGame } = useContractAddresses();

  const [searchTerm, setSearchTerm] = useState('');
  const [charityAddress, setCharityAddress] = useState('');
  const [priceIncrease, setPriceIncrease] = useState(0);
  const [timeIncrease, setTimeIncrease] = useState(0);
  const [timeIncrement, setTimeIncrement] = useState(0);
  const [initialIncrement, setInitialIncrement] = useState(0);
  const [msgMaxLen, setMsgMaxLen] = useState(0);
  const [cstRewardAmountForBidding, setCstRewardAmountForBidding] = useState<number | null>(null);
  const [cstDutchAuctionDurations, setCstDutchAuctionDurations] = useState({
    AuctionDuration: 0,
    ElapsedDuration: 0,
  });
  const [ethDutchAuctionDurations, setEthDutchAuctionDurations] = useState({
    AuctionDuration: 0,
    ElapsedDuration: 0,
  });
  const [cstDutchAuctionBeginningBidPriceMinLimit, setCstDutchAuctionBeginningBidPriceMinLimit] =
    useState(0);
  /** V3-only parameters; stays null on V2 deployments (selectors absent), hiding the V3 cards. */
  const [v3Config, setV3Config] = useState<{
    mainPrizeNumNfts: number;
    lateBidDurationSeconds: number;
    cstBidPriceDeclinePerSecond: number;
  } | null>(null);

  const charityWalletContract = useContractNoSigner(charity, CHARITY_WALLET_ABI);
  const cosmicGameContract = useContractNoSigner(cosmicGame, COSMICGAME_ABI);

  useEffect(() => {
    if (!cosmicGameContract) return;

    const safeCall = async (fn: () => Promise<void>, name: string) => {
      try {
        await fn();
      } catch (e) {
        reportError(e, `contracts read ${name}`);
      }
    };

    safeCall(async () => {
      const v = await cosmicGameContract.read.bidMessageLengthMaxLimit?.();
      setMsgMaxLen(Number(v ?? 0));
    }, 'bidMessageLengthMaxLimit');

    safeCall(async () => {
      const v = await cosmicGameContract.read.ethBidPriceIncreaseDivisor?.();
      const percent = percentFromDivisor(v);
      if (percent !== null) setPriceIncrease(percent);
    }, 'ethBidPriceIncreaseDivisor');

    safeCall(async () => {
      const v = await cosmicGameContract.read.mainPrizeTimeIncrementIncreaseDivisor?.();
      const percent = percentFromDivisor(v);
      if (percent !== null) setTimeIncrease(percent);
    }, 'mainPrizeTimeIncrementIncreaseDivisor');

    safeCall(async () => {
      const v = await cosmicGameContract.read.mainPrizeTimeIncrementInMicroSeconds?.();
      setTimeIncrement(Number(v ?? 0) / 1_000_000);
    }, 'mainPrizeTimeIncrementInMicroSeconds');

    // Read the resolved initial duration (seconds) directly from the contract instead of the
    // legacy `InitialSecondsUntilPrize` API field, which actually carries the raw
    // `initialDurationUntilMainPrizeDivisor` and is not seconds.
    safeCall(async () => {
      const v = await cosmicGameContract.read.getInitialDurationUntilMainPrize?.();
      setInitialIncrement(Number(v ?? 0));
    }, 'getInitialDurationUntilMainPrize');

    safeCall(async () => {
      const v = (await cosmicGameContract.read.getCstDutchAuctionDurations?.()) as
        | bigint[]
        | undefined;
      setCstDutchAuctionDurations({
        AuctionDuration: Number(v?.[0] ?? 0n),
        ElapsedDuration: Number(v?.[1] ?? 0n),
      });
    }, 'getCstDutchAuctionDurations');

    safeCall(async () => {
      const v = (await cosmicGameContract.read.getEthDutchAuctionDurations?.()) as
        | bigint[]
        | undefined;
      setEthDutchAuctionDurations({
        AuctionDuration: Number(v?.[0] ?? 0n),
        ElapsedDuration: Number(v?.[1] ?? 0n),
      });
    }, 'getEthDutchAuctionDurations');

    safeCall(async () => {
      const v = await cosmicGameContract.read.cstDutchAuctionBeginningBidPriceMinLimit?.();
      setCstDutchAuctionBeginningBidPriceMinLimit(Number(formatEther((v ?? 0n) as bigint)));
    }, 'cstDutchAuctionBeginningBidPriceMinLimit');

    // V3-only getters: absent on V2, where the reads fail with unrecognized-selector
    // errors — expected, so they are swallowed rather than reported.
    void (async () => {
      try {
        const [declineMultiplier, numNfts, lateBidDuration] = await Promise.all([
          cosmicGameContract.read.cstBidPriceDeclineMultiplier?.() as Promise<bigint | undefined>,
          cosmicGameContract.read.mainPrizeNumCosmicSignatureNfts?.() as Promise<
            bigint | undefined
          >,
          cosmicGameContract.read.getRoundLateBidDuration?.() as Promise<bigint | undefined>,
        ]);
        if (declineMultiplier === undefined || numNfts === undefined) return;
        setV3Config({
          mainPrizeNumNfts: Number(numNfts),
          lateBidDurationSeconds: Number(lateBidDuration ?? 0n),
          cstBidPriceDeclinePerSecond: Number(formatEther(declineMultiplier)),
        });
      } catch (e) {
        // On V2 the selectors are absent; behind the proxy this surfaces as a reasonless revert.
        if (!isMissingFunctionReadError(e)) {
          reportError(e, 'contracts read v3 config');
        }
        setV3Config(null);
      }
    })();
  }, [cosmicGameContract]);

  useEffect(() => {
    if (!cosmicGameContract) {
      setCstRewardAmountForBidding(null);
      return;
    }

    let cancelled = false;
    let inFlight = false;
    let timeoutId: number | null = null;

    const refreshCstRewardPreview = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;

      try {
        const v = await readCosmicGameWithFallback<bigint>([
          () => cosmicGameContract.read.getBidCstRewardAmount?.() as Promise<bigint | undefined>,
          () =>
            cosmicGameContract.read.getBidCstRewardAmountAdvanced?.([0n]) as Promise<
              bigint | undefined
            >,
          () =>
            cosmicGameContract.read.cstRewardAmountForBidding?.() as Promise<bigint | undefined>,
        ]);
        const amount = Number(formatEther(v ?? 0n));
        if (!cancelled) {
          setCstRewardAmountForBidding(Number.isFinite(amount) ? amount : null);
        }
      } catch (e) {
        if (!cancelled) {
          setCstRewardAmountForBidding(null);
          reportError(e, 'contracts live cstRewardAmountForBidding');
        }
      } finally {
        inFlight = false;
      }
    };

    const scheduleNextRefresh = () => {
      if (cancelled) return;
      timeoutId = window.setTimeout(() => {
        void refreshCstRewardPreview().finally(scheduleNextRefresh);
      }, getLiveCstPreviewRefreshMs());
    };

    if (shouldScheduleLiveCstPreviewTimer()) {
      void refreshCstRewardPreview().finally(scheduleNextRefresh);
    } else {
      void refreshCstRewardPreview();
    }

    const handleGesturePlaced = () => {
      void refreshCstRewardPreview();
    };
    window.addEventListener('cosmic:gesture-placed', handleGesturePlaced);

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.removeEventListener('cosmic:gesture-placed', handleGesturePlaced);
    };
  }, [cosmicGameContract]);

  useEffect(() => {
    if (!charityWalletContract) return;
    const fetchData = async () => {
      try {
        const addr = (await charityWalletContract.read.charityAddress?.()) as string;
        setCharityAddress(addr);
      } catch (e) {
        reportError(e, 'fetch public goods beneficiary address');
      }
    };
    fetchData();
  }, [charityWalletContract]);

  const contractCopy = Object.fromEntries(
    CONTRACT_ENTRY_IDS.map((id) => [
      id,
      {
        name: t(`entries.${id}.name`),
        description: t(`entries.${id}.description`),
      },
    ]),
  ) as ContractEntryCopy;
  const contracts = buildContracts(data?.ContractAddrs, contractCopy);

  return (
    <PageShell variant="data" backdrop="signature">
      <PageHeader
        eyebrow={
          <SectionEyebrow tone="aurora" pulse>
            {t('page.eyebrow')}
          </SectionEyebrow>
        }
        title={t('page.title')}
        titleLevel={2}
        gradientTitle="aurora"
        subtitle={t('page.subtitle')}
      >
        <NetworkBadge chainName={networkConfig.chainName} chainId={networkConfig.chainId} />
      </PageHeader>

      <div className="space-y-10">
        <motion.section
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          aria-label={t('page.allocationAria')}
        >
          <FundDistribution
            prizePercentage={data?.PrizePercentage}
            chronoWarriorPercentage={data?.ChronoWarriorPercentage}
            stellarSelectionPercentage={data?.RafflePercentage}
            stakingPercentage={data?.StakingPercentage}
            charityPercentage={data?.CharityPercentage}
            loading={loading}
          />
        </motion.section>

        <motion.section
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          aria-label={t('page.configurationAria')}
        >
          <GameConfiguration
            priceIncrease={priceIncrease}
            timeIncrease={timeIncrease}
            timeIncrement={timeIncrement}
            cstRewardPerBid={cstRewardAmountForBidding}
            maxMessageLength={msgMaxLen}
            claimTimeout={data?.TimeoutClaimPrize ?? 0}
            initialIncrement={initialIncrement}
            v3Config={v3Config}
            loading={loading}
          />
        </motion.section>

        <motion.section
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          aria-label={t('page.addressesAria')}
        >
          <SectionDivider title={t('page.addressesTitle')} className="mb-4" />
          <ContractAddressGrid
            contracts={contracts}
            explorerUrl={networkConfig.explorerUrl}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </motion.section>

        <motion.section
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.45 }}
          aria-label={t('page.parametersAria')}
        >
          <AuctionParameters
            cstDurations={cstDutchAuctionDurations}
            ethDurations={ethDutchAuctionDurations}
            cstBeginningBidPrice={cstDutchAuctionBeginningBidPriceMinLimit}
            publicGoodsVaultAddress={charity}
            charityAddress={charityAddress}
            charityVaultBalanceEth={Number(data?.CharityBalanceEth ?? 0)}
            charityPercentage={data?.CharityPercentage}
            explorerUrl={networkConfig.explorerUrl}
            raffleEthWinners={data?.NumRaffleEthWinnersBidding}
            raffleNftWinnersBidding={data?.NumRaffleNFTWinnersBidding}
            raffleNftWinnersStaking={data?.NumRaffleNFTWinnersStakingRWalk}
            loading={loading}
          />
        </motion.section>
      </div>
    </PageShell>
  );
};

export default Contracts;
