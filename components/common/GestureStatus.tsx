'use client';

import { useMemo, type ReactNode } from 'react';
import { zeroAddress } from 'viem';
import { Trophy, Coins, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import { formatSeconds } from '@/utils';
import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import { useHydrationSafeDateTime } from '@/components/common/HydrationSafeDateTime';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useActiveWeb3React } from '@/hooks/web3';
import type { DashboardInfo, GestureInfo } from '@/services/api';
import { useUserInfo } from '@/hooks/useApiQuery';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/utils';
import { formatFixed } from '@/utils/format';
import {
  formatCstAmount,
  formatCstProgressPercent,
  getCstAuctionProgress,
  type CstGestureData,
} from '@/utils/cstGesture';

import Counter from './Counter';
import { SmoothCountdown } from './SmoothCountdown';

/** Cosmic Signature NFTs in the Signature Allocation: V3 awards 3 sequential NFTs, V2 awards 1. */
const signatureNftCount = isV3Mechanics ? protocolFacts.v3.mainPrizeNftsPerCycleDefault : 1;

interface EthGestureInfo {
  ETHPrice: number;
  AuctionDuration?: number;
  SecondsElapsed?: number;
}

interface GestureStatusData extends DashboardInfo {
  PrizeAmountEth?: number;
  RaffleAmountEth?: number;
}

interface GestureStatusProps {
  data: GestureStatusData | null;
  loading: boolean;
  activationTime: number;
  curGestureList: GestureInfo[];
  ethGestureInfo: EthGestureInfo | null;
  cstGestureData: CstGestureData;
  allocationTime: number;
  suppressPrimaryTimer?: boolean;
  attachedNFTCount?: number;
  attachedERC20Count?: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

type GestureMetricTone = 'signature' | 'eth' | 'randomwalk' | 'cst';

const gestureMetricTone: Record<
  GestureMetricTone,
  { card: string; icon: string; glow: string; value: string }
> = {
  signature: {
    card: 'border-primary/25 bg-[linear-gradient(135deg,rgb(var(--aurora-cyan-rgb)/0.10),rgb(var(--nebula-violet-rgb)/0.055)_55%,rgb(var(--chrono-rose-rgb)/0.055))]',
    icon: 'bg-primary/15 text-primary',
    glow: 'after:bg-[rgb(var(--aurora-cyan-rgb)/0.45)]',
    value:
      'bg-gradient-to-r from-[#35C9FF] via-[#7DD3FC] to-[#AC56FF] bg-clip-text text-transparent',
  },
  eth: {
    card: 'border-[rgb(var(--solar-gold-rgb)/0.24)] bg-[linear-gradient(135deg,rgb(var(--solar-gold-rgb)/0.10),rgb(255_255_255/0.025)_60%,transparent)]',
    icon: 'bg-[rgb(var(--solar-gold-rgb)/0.15)] text-[rgb(var(--solar-gold-rgb))]',
    glow: 'after:bg-[rgb(var(--solar-gold-rgb)/0.42)]',
    value: 'text-[rgb(var(--solar-gold-rgb))]',
  },
  randomwalk: {
    card: 'border-[rgb(var(--nebula-violet-rgb)/0.24)] bg-[linear-gradient(135deg,rgb(var(--nebula-violet-rgb)/0.11),rgb(var(--aurora-cyan-rgb)/0.035)_65%,transparent)]',
    icon: 'bg-[rgb(var(--nebula-violet-rgb)/0.16)] text-[rgb(var(--nebula-violet-rgb))]',
    glow: 'after:bg-[rgb(var(--nebula-violet-rgb)/0.45)]',
    value: 'text-[rgb(var(--nebula-violet-rgb))]',
  },
  cst: {
    card: 'border-[rgb(var(--impact-green-rgb)/0.24)] bg-[linear-gradient(135deg,rgb(var(--impact-green-rgb)/0.10),rgb(var(--aurora-cyan-rgb)/0.035)_62%,transparent)]',
    icon: 'bg-[rgb(var(--impact-green-rgb)/0.14)] text-[rgb(var(--impact-green-rgb))]',
    glow: 'after:bg-[rgb(var(--impact-green-rgb)/0.42)]',
    value: 'text-[rgb(var(--impact-green-rgb))]',
  },
};

function GestureMetricCard({
  label,
  value,
  detail,
  icon,
  tooltip,
  tone,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tooltip?: string;
  tone: GestureMetricTone;
}) {
  const palette = gestureMetricTone[tone];

  return (
    <div
      className={cn(
        'group relative flex h-full min-h-[132px] flex-col justify-between overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.055]',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent',
        'after:pointer-events-none after:absolute after:-right-10 after:-top-12 after:h-28 after:w-28 after:rounded-full after:opacity-0 after:blur-2xl after:transition-opacity after:duration-300 after:content-[""] group-hover:after:opacity-100',
        palette.card,
        palette.glow,
      )}
    >
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="type-eyebrow text-muted-foreground print:!text-foreground/80">{label}</p>
          {tooltip ? <InfoTooltip content={tooltip} /> : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              palette.icon,
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          'relative z-[1] mt-4 text-xl font-bold tracking-tight tabular-nums',
          palette.value,
        )}
      >
        {value}
      </div>
      {detail ? <div className="relative z-[1] mt-3">{detail}</div> : null}
    </div>
  );
}

type AttachedAssetVariant = 'base' | 'withNft' | 'withErc20' | 'withBoth';

/**
 * Selects the ICU message variant for copy that enumerates the attached
 * assets included in the Signature Allocation (none / NFTs / ERC20 / both).
 */
function getAttachedAssetVariant(nftCount: number, erc20Count: number): AttachedAssetVariant {
  if (nftCount > 0 && erc20Count > 0) return 'withBoth';
  if (nftCount > 0) return 'withNft';
  if (erc20Count > 0) return 'withErc20';
  return 'base';
}

function getAttachedAssetValues(
  variant: AttachedAssetVariant,
  nftCount: number,
  erc20Count: number,
): Record<string, number> {
  if (variant === 'withBoth') return { nftCount, erc20Count };
  if (variant === 'withNft') return { nftCount };
  if (variant === 'withErc20') return { erc20Count };
  return {};
}

export const GestureStatus = ({
  data,
  loading,
  activationTime,
  curGestureList,
  ethGestureInfo,
  cstGestureData,
  allocationTime,
  suppressPrimaryTimer = false,
  attachedNFTCount = 0,
  attachedERC20Count = 0,
}: GestureStatusProps) => {
  const t = useTranslations('home');
  const locale = useLocale();
  const activationDateTime = useHydrationSafeDateTime(activationTime, true, locale);
  const { account } = useActiveWeb3React();
  const { data: userInfoRaw } = useUserInfo(account);

  const now = useNow(1000);

  const selectionFrequency = useMemo(() => {
    if (!account || !data || !curGestureList.length) return null;
    const Gestures = (userInfoRaw?.Gestures as GestureInfo[] | undefined) || [];
    if (!Gestures.length) return null;
    const curCycleGestures = Gestures.filter((bid) => bid.RoundNum === data.CurRoundNum);
    const pSelect = (total: number, chosen: number, yours: number) =>
      1 - Math.pow((total - yours) / total, chosen);
    return {
      stellarEth:
        pSelect(
          curGestureList.length,
          data.NumRaffleEthWinnersBidding ?? 1,
          curCycleGestures.length,
        ) * 100,
      nft:
        pSelect(
          curGestureList.length,
          data.NumRaffleNFTWinnersBidding ?? 1,
          curCycleGestures.length,
        ) * 100,
    };
  }, [account, data, userInfoRaw, curGestureList]);

  const attachedAssetVariant = getAttachedAssetVariant(attachedNFTCount, attachedERC20Count);
  const attachedAssetValues = getAttachedAssetValues(
    attachedAssetVariant,
    attachedNFTCount,
    attachedERC20Count,
  );

  const cstAuctionProgress = getCstAuctionProgress(cstGestureData);
  const cstProgressValue = Number(cstAuctionProgress.percentComplete.toFixed(1));

  if (loading) return null;

  return (
    <div className="space-y-5">
      {/* Pre-activation countdown */}
      {activationTime > now / 1000 && data ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center',
            suppressPrimaryTimer && 'sr-only',
          )}
        >
          <p className="text-sm text-muted-foreground">
            {t('status.opensAt', {
              cycle: String(data.CurRoundNum),
              dateTime: activationDateTime,
            })}
          </p>
          <div className="mt-4">
            <SmoothCountdown date={activationTime * 1000} renderer={Counter} />
          </div>
        </motion.div>
      ) : data && data.TsRoundStart !== 0 ? (
        <>
          {/* Countdown / Exhausted */}
          {!suppressPrimaryTimer &&
            data.LastBidderAddr !== zeroAddress &&
            (allocationTime > now ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="gradient-border-card gradient-border-card-accent rounded-2xl bg-gradient-to-b from-primary/[0.06] to-transparent p-6 text-center"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                  {t('status.finalizesIn')}
                  <InfoTooltip content={t('status.finalizesInTooltip')} className="ml-1.5" />
                </p>
                <SmoothCountdown date={allocationTime} renderer={Counter} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="gradient-border-card rounded-2xl bg-primary/[0.06] p-6 text-center animate-pulse-glow"
              >
                <Zap className="mx-auto h-8 w-8 text-primary mb-2" />
                <h5 className="font-display text-xl font-bold text-primary">
                  {t('status.readyToFinalize')}
                </h5>
                <p className="mt-1 text-sm text-primary/80">{t('status.clockReachedZero')}</p>
              </motion.div>
            ))}

          {/* Allocation + bid prices row */}
          <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="h-full"
            >
              <GestureMetricCard
                label={t('status.metrics.signatureAllocation')}
                value={`${(data?.PrizeAmountEth ?? 0).toFixed(4)} ETH`}
                icon={<Trophy className="h-5 w-5" />}
                tone="signature"
                tooltip={t(`status.metrics.signatureTooltip.${attachedAssetVariant}`, {
                  cscNftCount: signatureNftCount,
                  ...attachedAssetValues,
                })}
              />
            </motion.div>

            {data.LastBidderAddr !== zeroAddress && (
              <>
                <motion.div
                  custom={1}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="h-full"
                >
                  <GestureMetricCard
                    label={t('status.metrics.ethGesture')}
                    value={`${(ethGestureInfo?.ETHPrice ?? 0).toFixed(5)} ETH`}
                    icon={<Coins className="h-4 w-4" />}
                    tone="eth"
                    tooltip={t('status.metrics.ethGestureTooltip')}
                  />
                </motion.div>
                <motion.div
                  custom={2}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="h-full"
                >
                  <GestureMetricCard
                    label={t('status.metrics.randomWalkGesture')}
                    value={`${((ethGestureInfo?.ETHPrice ?? 0) / 2).toFixed(5)} ETH`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    tone="randomwalk"
                    tooltip={t('status.metrics.randomWalkGestureTooltip')}
                  />
                </motion.div>
                <motion.div
                  custom={3}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="h-full"
                >
                  <GestureMetricCard
                    label={t('status.metrics.cstGesture')}
                    value={
                      cstGestureData.isFree
                        ? t('status.metrics.free')
                        : `${formatCstAmount(cstGestureData.CSTPrice)} CST`
                    }
                    detail={
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-muted-foreground">
                            {t('status.metrics.cstWindow')}
                          </span>
                          <span className="font-mono tabular-nums text-[rgb(var(--impact-green-rgb))]">
                            {formatCstProgressPercent(cstAuctionProgress.percentComplete)}
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={t('status.metrics.cstWindowProgressAria')}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={cstProgressValue}
                          className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--impact-green-rgb))] to-primary transition-all duration-500"
                            style={{ width: `${cstAuctionProgress.percentComplete}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {t('status.metrics.duration', {
                            duration: formatSeconds(cstAuctionProgress.auctionDuration, locale),
                          })}
                        </p>
                      </div>
                    }
                    icon={<Zap className="h-4 w-4" />}
                    tone="cst"
                    tooltip={t('status.metrics.cstGestureTooltip')}
                  />
                </motion.div>
              </>
            )}
          </div>

          {/* Selection frequency */}
          {curGestureList.length > 0 && selectionFrequency && data && (
            <motion.div
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3"
            >
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary/70" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('status.standing.title')}
                </p>
                <InfoTooltip content={t('status.standing.tooltip')} />
              </div>
              {data.LastBidderAddr === account ? (
                <p className="text-sm font-medium text-emerald-400">
                  {t(`status.standing.leader.${attachedAssetVariant}`, {
                    amount: (data.PrizeAmountEth ?? 0).toFixed(4),
                    cscNftCount: signatureNftCount,
                    ...attachedAssetValues,
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t('status.standing.notLeader')}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('status.standing.ethStellar')}</span>
                    <span className="font-medium text-primary">
                      {formatFixed(selectionFrequency.stellarEth, 1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(selectionFrequency.stellarEth, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('status.standing.nftStellar')}</span>
                    <span className="font-medium text-accent">
                      {formatFixed(selectionFrequency.nft, 1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(selectionFrequency.nft, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gradient-border-card rounded-2xl bg-primary/[0.04] p-8 text-center"
        >
          {data && data.CurRoundNum > 0 ? (
            <h4 className="font-display text-2xl font-bold">
              {t('status.openCycle.cycleNumber', { cycle: String(data.CurRoundNum) })}
            </h4>
          ) : (
            <h4 className="font-display text-2xl font-bold">{t('status.openCycle.title')}</h4>
          )}
          <p className="mt-2 text-sm text-muted-foreground">{t('status.openCycle.body')}</p>
        </motion.div>
      )}
    </div>
  );
};
