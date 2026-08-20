'use client';

import { useMemo } from 'react';
import {
  Trophy,
  Crown,
  Swords,
  Coins,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Gavel,
  Heart,
  Landmark,
  BarChart3,
  ImageIcon,
  Gift,
  Share2,
  Layers,
  Users,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

import { getExplorerUrl, formatEthValue, shortenHex, getEnduranceChampions } from '@/utils';
import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import { formatFixed } from '@/utils/format';
import { Link } from '@/i18n/navigation';
import { HydrationSafeDateTime } from '@/components/common/HydrationSafeDateTime';
import { cn } from '@/lib/utils';
import { TOUCH_TARGET_ICON_CLASS, TOUCH_TARGET_TEXT_LINK_CLASS } from '@/lib/touch-target';
import { PageShell } from '@/components/ui/page-shell';
import {
  useRoundInfo,
  useGestureListByCycle,
  useDonationsNFTByRound,
  useCSTAnchorDistributionsByCycle,
  useDonationsERC20ByRound,
  useRoundList,
} from '@/hooks/useApiQuery';
import { useClipboard } from '@/hooks/useClipboard';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionDivider } from '@/components/ui/section-divider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GestureHistoryTable from '@/components/tables/GestureHistoryTable';
import AnchoringRecipientTable from '@/components/tables/AnchoringRecipientTable';
import AttachedNFTTable from '@/components/attachments/AttachedNFTTable';
import EnduranceChampionsTable from '@/components/tables/EnduranceChampionsTable';
import AttachedERC20Table from '@/components/attachments/AttachedERC20Table';
import RecipientHistoryTable, {
  STELLAR_SELECTION_RECORD_TYPES,
  type WinningHistoryEntry,
} from '@/components/tables/RecipientHistoryTable';

const sectionFade = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardFade = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

function CopyableAddress({
  address,
  href,
  className,
}: {
  address: string;
  href?: string;
  className?: string;
}) {
  const t = useTranslations('allocation');
  const { copy } = useClipboard();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await copy(address);
    toast.success(t('details.copy.addressSuccess'));
  };

  const display = shortenHex(address, 6);

  return (
    <span className={cn('inline-flex items-center gap-1.5 group/addr', className)}>
      {href ? (
        <Link
          href={href}
          className={cn(
            'font-mono text-sm text-white hover:text-primary transition-colors truncate',
            TOUCH_TARGET_TEXT_LINK_CLASS,
          )}
        >
          {display}
        </Link>
      ) : (
        <span className="font-mono text-sm text-muted-foreground truncate">{display}</span>
      )}
      <button
        onClick={handleCopy}
        // Revealing this on hover leaves it permanently invisible — but still
        // hit-testable — on a touch device, so below `sm` it is always shown
        // and sized as a real target instead.
        className={cn(
          'shrink-0 p-0.5 rounded opacity-0 group-hover/addr:opacity-100 hover:text-primary transition-all max-sm:opacity-100',
          TOUCH_TARGET_ICON_CLASS,
        )}
        aria-label={t('details.copy.addressAria', { address })}
      >
        <Copy className="h-3 w-3" />
      </button>
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <PageShell variant="data" backdrop="signature">
      <div className="mb-12">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4 flex-1">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-12 w-80" />
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-5 w-40 mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-5 w-48 mb-5" />
      <Skeleton className="h-16 rounded-xl mb-12" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-2xl mb-4" />
      <Skeleton className="h-64 rounded-xl" />
    </PageShell>
  );
}

function RoundNavigation({ roundNum, maxRound }: { roundNum: number; maxRound: number }) {
  const t = useTranslations('allocation');
  const hasPrev = roundNum > 0;
  const hasNext = roundNum < maxRound;

  return (
    <div className="flex items-center gap-2" data-testid="round-navigation">
      {hasPrev ? (
        <Link
          href={`/allocation/${roundNum - 1}`}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground hover:text-white hover:border-white/[0.15] transition-all"
          aria-label={t('details.navigation.previousAria')}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('formats.cycle', { cycle: roundNum - 1 })}</span>
        </Link>
      ) : (
        <span />
      )}
      {hasNext ? (
        <Link
          href={`/allocation/${roundNum + 1}`}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground hover:text-white hover:border-white/[0.15] transition-all"
          aria-label={t('details.navigation.nextAria')}
        >
          <span className="hidden sm:inline">{t('formats.cycle', { cycle: roundNum + 1 })}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

function RecipientCard({
  icon,
  title,
  tooltip,
  address,
  rewards,
  tokenId,
  tokenIds,
  tokenLabel,
  testId,
  featured,
}: {
  icon: React.ReactNode;
  title: string;
  tooltip: string;
  address: string;
  rewards: { label: string; value: string }[];
  tokenId?: number;
  /** V3 multi-NFT allocations (e.g. Signature Allocation awards several sequential NFTs). Takes precedence over `tokenId`. */
  tokenIds?: number[];
  tokenLabel?: string;
  testId: string;
  featured?: boolean;
}) {
  const t = useTranslations('allocation');

  const tokenIdList = (tokenIds?.length ? tokenIds : [tokenId]).filter(
    (id): id is number => id !== undefined && id > 0,
  );
  return (
    <motion.div
      variants={cardFade}
      className={cn(
        'group relative rounded-xl p-5 transition-all duration-300',
        featured
          ? 'gradient-border-card gradient-border-card-accent bg-white/[0.04] hover:bg-white/[0.06]'
          : 'gradient-border-card bg-white/[0.02] hover:bg-white/[0.04]',
      )}
      data-testid={`recipient-card-${testId}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            featured
              ? 'bg-gradient-to-br from-primary/25 to-accent/25 text-primary'
              : 'bg-white/[0.06] text-muted-foreground',
          )}
        >
          {icon}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <h3
            className={cn(
              'text-sm font-semibold truncate',
              featured ? 'text-white' : 'text-white/90',
            )}
          >
            {title}
          </h3>
          <InfoTooltip content={tooltip} />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            {t('details.recipientCard.recipient')}
          </span>
          <div className="mt-0.5">
            {address ? (
              <CopyableAddress address={address} href={`/user/${address}`} />
            ) : (
              <span className="text-sm text-muted-foreground/50 italic">
                {t('details.recipientCard.none')}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          {rewards.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {r.label}
              </span>
              <span
                className={cn(
                  'text-sm font-medium tabular-nums',
                  featured
                    ? 'bg-gradient-to-r from-[#35C9FF] to-[#AC56FF] bg-clip-text text-transparent'
                    : 'text-white/80',
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {tokenIdList.length > 0 && (
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {tokenLabel ?? t('details.recipientCard.nftToken')}
              {tokenIdList.length > 1 ? ` (×${tokenIdList.length})` : ''}
            </span>
            {tokenIdList.map((id) => (
              <Link
                key={id}
                href={`/detail/${id}`}
                className={cn(
                  'mt-0.5 block text-sm text-primary hover:underline',
                  TOUCH_TARGET_TEXT_LINK_CLASS,
                )}
              >
                {t('formats.token', { token: id })}
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface DistributionSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  tooltip: string;
}

function AllocationDistributionBar({ segments }: { segments: DistributionSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  return (
    <div data-testid="allocation-distribution-bar">
      <motion.div
        className="flex h-3 rounded-full overflow-hidden bg-white/[0.04]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      >
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct < 0.5) return null;
          return (
            <Tooltip key={seg.label}>
              <TooltipTrigger asChild>
                <div
                  className={cn('relative transition-all duration-300', seg.color)}
                  style={{ width: `${pct}%` }}
                  data-testid={`distribution-segment-${seg.id}`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[280px] text-xs leading-relaxed">{seg.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </motion.div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
        {segments.map((seg) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={seg.label} className="flex items-center gap-2 text-xs">
              <span className={cn('h-2.5 w-2.5 rounded-full', seg.color)} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="text-white/80 font-medium tabular-nums">{pct}%</span>
              <InfoTooltip content={seg.tooltip} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/[0.08] px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

interface AllocationInfoPageProps {
  roundNum: number;
}

const AllocationInfoPage = ({ roundNum }: AllocationInfoPageProps) => {
  const t = useTranslations('allocation');
  const locale = useLocale();
  const {
    data: allocationInfo,
    isLoading: loadingRound,
    isError: roundFailed,
    refetch: refetchRound,
  } = useRoundInfo(roundNum);
  const { data: gestureHistory = [], isLoading: loadingGestures } = useGestureListByCycle(
    roundNum,
    'desc',
  );
  const { data: nftDonationsRaw = [], isLoading: loadingNFT } = useDonationsNFTByRound(roundNum);
  const { data: stakingRewardsRaw = [], isLoading: loadingStaking } =
    useCSTAnchorDistributionsByCycle(roundNum);
  const { data: donatedERC20Raw = [], isLoading: loadingERC20 } =
    useDonationsERC20ByRound(roundNum);
  const { data: roundList = [] } = useRoundList();
  const { copy } = useClipboard();

  const nftDonations =
    nftDonationsRaw as import('@/components/attachments/AttachedNFTTable').NFTRecord[];
  const anchorDistributions = stakingRewardsRaw;
  const donatedERC20Tokens =
    donatedERC20Raw as import('@/components/attachments/AttachedERC20Table').DonatedERC20Token[];
  const loading = loadingRound || loadingGestures || loadingNFT || loadingStaking || loadingERC20;

  const maxRound = useMemo(
    () => roundList.reduce((max, r) => Math.max(max, r.RoundNum ?? 0), 0),
    [roundList],
  );

  const championList = useMemo(() => {
    if (gestureHistory.length > 0 && allocationInfo) {
      const champions = getEnduranceChampions(gestureHistory, allocationInfo.TimeStamp);
      return champions.sort((a, b) => b.chronoWarrior - a.chronoWarrior);
    }
    return [];
  }, [gestureHistory, allocationInfo]);

  const cycleAllocationLedger = useMemo(
    () => (allocationInfo?.AllPrizes ?? []) as WinningHistoryEntry[],
    [allocationInfo?.AllPrizes],
  );

  const stellarSelectionLedger = useMemo(
    () =>
      cycleAllocationLedger.filter((entry) => STELLAR_SELECTION_RECORD_TYPES.has(entry.RecordType)),
    [cycleAllocationLedger],
  );

  const handleShareRound = async () => {
    if (!allocationInfo) return;
    const summary = t('details.share.summary', {
      cycle: roundNum,
      amount: formatFixed(allocationInfo.AmountEth, 4),
      recipient: shortenHex(allocationInfo.WinnerAddr, 6),
      gestures: allocationInfo.RoundStats.TotalBids,
      url: typeof window !== 'undefined' ? window.location.href : '',
    });
    await copy(summary);
    toast.success(t('details.share.success'));
  };

  if (roundNum < 0) {
    return (
      <PageShell variant="data" backdrop="signature">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">{t('details.invalid.title')}</h2>
          <p className="text-muted-foreground mb-6">{t('details.invalid.help')}</p>
          <Link
            href="/allocation"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('details.invalid.back')}
          </Link>
        </div>
      </PageShell>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  // A failed read is not the same as a cycle that has no data yet: keep the
  // "not found" copy for the latter and say so plainly for the former.
  if (roundFailed) {
    return (
      <PageShell variant="data" backdrop="signature">
        <ErrorState
          title={t('details.error.title')}
          message={t('details.error.message', { cycle: roundNum })}
          onRetry={() => void refetchRound()}
          surface
        />
      </PageShell>
    );
  }

  if (!allocationInfo) {
    return (
      <PageShell variant="data" backdrop="signature">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">{t('details.notFound.title')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('details.notFound.help', { cycle: roundNum })}
          </p>
          <Link
            href="/allocation"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('details.notFound.back')}
          </Link>
        </div>
      </PageShell>
    );
  }

  const distributionSegments: DistributionSegment[] = [
    {
      id: 'signature-allocation',
      label: t('details.distribution.segments.signature.label'),
      value: allocationInfo.AmountEth,
      color: 'bg-[#15BFFD]',
      tooltip: t('details.distribution.segments.signature.tooltip', {
        amount: formatFixed(allocationInfo.AmountEth, 4),
      }),
    },
    {
      id: 'public-goods',
      label: t('details.distribution.segments.publicGoods.label'),
      value: allocationInfo.CharityAmountETH,
      color: 'bg-emerald-500',
      tooltip: t('details.distribution.segments.publicGoods.tooltip', {
        amount: formatFixed(allocationInfo.CharityAmountETH, 4),
      }),
    },
    {
      id: 'anchor-distribution',
      label: t('details.distribution.segments.anchor.label'),
      value: allocationInfo.StakingDepositAmountEth,
      color: 'bg-[#9C37FD]',
      tooltip: t('details.distribution.segments.anchor.tooltip', {
        amount: formatFixed(allocationInfo.StakingDepositAmountEth, 4),
      }),
    },
    {
      id: 'stellar-selection',
      label: t('details.distribution.segments.stellar.label'),
      value: allocationInfo.RoundStats.TotalRaffleEthDepositsEth ?? 0,
      color: 'bg-[#5B8DEF]',
      tooltip: t('details.distribution.segments.stellar.tooltip', {
        amount: (allocationInfo.RoundStats.TotalRaffleEthDepositsEth ?? 0).toFixed(4),
      }),
    },
  ];

  const stats = [
    {
      icon: <Trophy className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.signatureEth.label'),
      value: `${formatFixed(allocationInfo.AmountEth, 4)} ETH`,
      tooltip: t('details.statistics.cards.signatureEth.tooltip'),
    },
    {
      icon: <Heart className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.publicGoods.label'),
      value: `${formatFixed(allocationInfo.CharityAmountETH, 4)} ETH`,
      tooltip: t('details.statistics.cards.publicGoods.tooltip'),
    },
    {
      icon: <Landmark className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.anchor.label'),
      value: `${formatFixed(allocationInfo.StakingDepositAmountEth, 4)} ETH`,
      tooltip: t('details.statistics.cards.anchor.tooltip'),
    },
    {
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.stellar.label'),
      value: `${(allocationInfo.RoundStats.TotalRaffleEthDepositsEth ?? 0).toFixed(4)} ETH`,
      tooltip: t('details.statistics.cards.stellar.tooltip'),
    },
    {
      icon: <Gavel className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.gestures.label'),
      value: allocationInfo.RoundStats.TotalBids,
      tooltip: t('details.statistics.cards.gestures.tooltip'),
    },
    {
      icon: <Gift className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.attachedNfts.label'),
      value: allocationInfo.RoundStats.TotalDonatedNFTs ?? 0,
      tooltip: t('details.statistics.cards.attachedNfts.tooltip'),
    },
    {
      icon: <Layers className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.anchoredTokens.label'),
      value: allocationInfo.StakingNumStakedTokens,
      tooltip: t('details.statistics.cards.anchoredTokens.tooltip'),
    },
    {
      icon: <Users className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.uniqueAnchorHolders.label'),
      value: anchorDistributions.length,
      tooltip: t('details.statistics.cards.uniqueAnchorHolders.tooltip'),
    },
    {
      icon: <Sparkles className="h-3.5 w-3.5" />,
      label: t('details.statistics.cards.totalContributed.label'),
      value: formatEthValue(allocationInfo.RoundStats.TotalDonatedAmountEth ?? 0),
      tooltip: t('details.statistics.cards.totalContributed.tooltip'),
    },
  ];

  const donationsCount = nftDonations.length + donatedERC20Tokens.length;

  return (
    <PageShell variant="data" backdrop="signature">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/allocation"
          className={cn('hover:text-primary transition-colors', TOUCH_TARGET_TEXT_LINK_CLASS)}
        >
          {t('details.breadcrumbs.recipients')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{t('formats.cycle', { cycle: roundNum })}</span>
      </nav>

      {/* Hero Banner */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionFade}
        className="mb-12"
        aria-label={t('details.hero.aria')}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-6 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-accent/[0.04] pointer-events-none" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-4 min-w-0 flex-1">
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
                  {t('formats.cycleHash', { cycle: roundNum })}
                </h1>

                <div className="flex items-baseline gap-2 flex-wrap">
                  <p
                    className="text-3xl md:text-5xl font-bold tabular-nums bg-gradient-to-r from-[#35C9FF] via-[#1D9BEF] to-[#AC56FF] bg-clip-text text-transparent"
                    style={{ textShadow: '0 0 40px rgba(21, 191, 253, 0.2)' }}
                    data-testid="hero-allocation-amount"
                  >
                    {formatFixed(allocationInfo.AmountEth, 4)} ETH
                  </p>
                  <InfoTooltip content={t('details.hero.amountTooltip')} iconClassName="h-4 w-4" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                      {t('details.hero.recipient')}
                    </span>
                    <CopyableAddress
                      address={allocationInfo.WinnerAddr}
                      href={`/user/${allocationInfo.WinnerAddr}`}
                    />
                  </div>

                  {allocationInfo.TokenId > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                        {(allocationInfo.NftTokenIds?.length ?? 0) > 1
                          ? t('details.hero.nfts')
                          : t('details.hero.nft')}
                      </span>
                      {(allocationInfo.NftTokenIds?.length
                        ? allocationInfo.NftTokenIds
                        : [allocationInfo.TokenId]
                      ).map((id) => (
                        <Link
                          key={id}
                          href={`/detail/${id}`}
                          className={cn(
                            'text-sm text-primary hover:underline',
                            TOUCH_TARGET_TEXT_LINK_CLASS,
                          )}
                        >
                          {t('formats.cosmicSignatureToken', { token: id })}
                        </Link>
                      ))}
                      <InfoTooltip content={t('details.hero.nftTooltip')} />
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      <HydrationSafeDateTime timestamp={allocationInfo.TimeStamp} locale={locale}>
                        {(dateTime) => t('details.hero.finalized', { dateTime })}
                      </HydrationSafeDateTime>
                    </span>
                    <span className="text-white/10">|</span>
                    <a
                      href={getExplorerUrl('tx', allocationInfo.TxHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {t('details.hero.viewTransaction')} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleShareRound}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground hover:text-white hover:border-white/[0.15] transition-all',
                    TOUCH_TARGET_ICON_CLASS,
                  )}
                  aria-label={t('details.hero.shareAria')}
                  data-testid="share-round-button"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('details.hero.share')}</span>
                </button>
                <RoundNavigation roundNum={roundNum} maxRound={maxRound} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Cycle Recipients */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionFade}
        className="mb-12"
        aria-label={t('details.recipientSection.aria')}
      >
        <div className="flex items-center gap-2 mb-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t('details.recipientSection.title')}
          </h2>
          <InfoTooltip content={t('details.recipientSection.tooltip')} />
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <RecipientCard
            icon={<Trophy className="h-5 w-5" />}
            title={t('details.recipientSection.cards.signature.title')}
            tooltip={t('details.recipientSection.cards.signature.tooltip', {
              cscNftCount: isV3Mechanics ? protocolFacts.v3.mainPrizeNftsPerCycleDefault : 1,
            })}
            address={allocationInfo.WinnerAddr}
            rewards={[
              {
                label: t('details.recipientSection.labels.ethAllocation'),
                value: `${formatFixed(allocationInfo.AmountEth, 4)} ETH`,
              },
              {
                label: t('details.recipientSection.labels.recognitionCst'),
                value: `${(allocationInfo.CSTAmountEth ?? 0).toFixed(4)} CST`,
              },
            ]}
            tokenId={allocationInfo.TokenId}
            tokenIds={allocationInfo.NftTokenIds}
            tokenLabel={t('details.recipientSection.labels.cosmicSignatureNft')}
            testId="signature-allocation"
            featured
          />
          <RecipientCard
            icon={<Swords className="h-5 w-5" />}
            title={t('details.recipientSection.cards.chrono.title')}
            tooltip={t('details.recipientSection.cards.chrono.tooltip')}
            address={allocationInfo.ChronoWarriorAddr}
            rewards={[
              {
                label: t('details.recipientSection.labels.ethAllocation'),
                value: `${formatFixed(allocationInfo.ChronoWarriorAmountEth, 4)} ETH`,
              },
              {
                label: t('details.recipientSection.labels.recognitionCst'),
                value: `${(allocationInfo.ChronoWarriorCstAmountEth ?? 0).toFixed(4)} CST`,
              },
            ]}
            tokenId={allocationInfo.ChronoWarriorNftTokenId}
            tokenLabel={t('details.recipientSection.labels.cosmicSignatureNft')}
            testId="chrono-warrior"
          />
          <RecipientCard
            icon={<Crown className="h-5 w-5" />}
            title={t('details.recipientSection.cards.endurance.title')}
            tooltip={t('details.recipientSection.cards.endurance.tooltip')}
            address={allocationInfo.EnduranceWinnerAddr}
            rewards={[
              {
                label: t('details.recipientSection.labels.recognitionCst'),
                value: `${(allocationInfo.EnduranceERC20AmountEth ?? 0).toFixed(4)} CST`,
              },
            ]}
            tokenId={allocationInfo.EnduranceERC721TokenId}
            tokenLabel={t('details.recipientSection.labels.cosmicSignatureNft')}
            testId="endurance-champion"
          />
          <RecipientCard
            icon={<Coins className="h-5 w-5" />}
            title={t('details.recipientSection.cards.finalCst.title')}
            tooltip={t('details.recipientSection.cards.finalCst.tooltip')}
            address={allocationInfo.LastCstBidderAddr}
            rewards={[
              {
                label: t('details.recipientSection.labels.recognitionCst'),
                value: `${(allocationInfo.LastCstBidderERC20AmountEth ?? 0).toFixed(4)} CST`,
              },
            ]}
            tokenId={allocationInfo.LastCstBidderERC721TokenId}
            tokenLabel={t('details.recipientSection.labels.cosmicSignatureNft')}
            testId="final-cst-gesture"
          />
        </motion.div>
      </motion.section>

      {/* Allocation Distribution */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionFade}
        className="mb-12"
        aria-label={t('details.distribution.aria')}
      >
        <div className="flex items-center gap-2 mb-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t('details.distribution.title')}
          </h2>
          <InfoTooltip content={t('details.distribution.tooltip')} />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <AllocationDistributionBar segments={distributionSegments} />
        </div>
      </motion.section>

      {/* Cycle Statistics */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionFade}
        className="mb-12"
        aria-label={t('details.statistics.aria')}
      >
        <div className="flex items-center gap-2 mb-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t('details.statistics.title')}
          </h2>
          <InfoTooltip content={t('details.statistics.tooltip')} />
        </div>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, i) => (
            <motion.div key={stat.label} variants={cardFade}>
              <StatCard
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                tooltip={stat.tooltip}
                featured={i === 0}
                gradient={i === 0}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* All allocation records for this cycle (mirrors backend round info prize ledger) */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionFade}
        className="mb-12"
        aria-label={t('details.ledger.aria')}
      >
        <div className="flex items-center gap-2 mb-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t('details.ledger.title')}
          </h2>
          <InfoTooltip content={t('details.ledger.tooltip')} />
          {cycleAllocationLedger.length > 0 ? (
            <span className="ml-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {cycleAllocationLedger.length}
            </span>
          ) : null}
        </div>
        {cycleAllocationLedger.length > 0 ? (
          <RecipientHistoryTable
            winningHistory={cycleAllocationLedger}
            showRoundColumn={false}
            perPage={10}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t('details.ledger.empty')}</p>
        )}
      </motion.section>

      {/* Section Divider */}
      <SectionDivider title={t('details.data.divider')} className="mb-10" />

      {/* Tabbed Data Sections */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionFade}
        aria-label={t('details.data.aria')}
      >
        <Tabs defaultValue="gestures" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-white/[0.03] p-1.5 rounded-xl">
            <TabsTrigger value="gestures" className="flex-1 min-w-[100px]">
              {t('details.data.tabs.gestures')}
              <TabBadge count={gestureHistory.length} />
            </TabsTrigger>
            <TabsTrigger value="endurance" className="flex-1 min-w-[100px]">
              {t('details.data.tabs.endurance')}
              <TabBadge count={championList.length} />
            </TabsTrigger>
            <TabsTrigger value="stellar-selection" className="flex-1 min-w-[100px]">
              {t('details.data.tabs.stellar')}
              <TabBadge count={stellarSelectionLedger.length} />
            </TabsTrigger>
            <TabsTrigger value="anchoring" className="flex-1 min-w-[100px]">
              {t('details.data.tabs.anchoring')}
              <TabBadge count={anchorDistributions.length} />
            </TabsTrigger>
            <TabsTrigger value="contributions" className="flex-1 min-w-[100px]">
              {t('details.data.tabs.contributions')}
              <TabBadge count={donationsCount} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gestures" className="mt-6">
            {gestureHistory.length > 0 ? (
              <GestureHistoryTable gestureHistory={gestureHistory} />
            ) : (
              <EmptyState title={t('details.data.empty.gestures')} />
            )}
          </TabsContent>

          <TabsContent value="endurance" className="mt-6">
            {championList.length > 0 ? (
              <EnduranceChampionsTable championList={championList} />
            ) : (
              <EmptyState title={t('details.data.empty.endurance')} />
            )}
          </TabsContent>

          <TabsContent value="stellar-selection" className="mt-6">
            {stellarSelectionLedger.length > 0 ? (
              <RecipientHistoryTable
                winningHistory={stellarSelectionLedger}
                showRoundColumn={false}
                perPage={10}
              />
            ) : (
              <EmptyState title={t('details.data.empty.stellar')} />
            )}
          </TabsContent>

          <TabsContent value="anchoring" className="mt-6">
            {anchorDistributions.length > 0 ? (
              <AnchoringRecipientTable list={anchorDistributions} />
            ) : (
              <EmptyState title={t('details.data.empty.anchoring')} />
            )}
          </TabsContent>

          <TabsContent value="contributions" className="mt-6">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{t('details.data.contributions.nfts')}</h3>
                  <InfoTooltip content={t('details.data.contributions.nftsTooltip')} />
                </div>
                {nftDonations.length > 0 ? (
                  <AttachedNFTTable
                    list={nftDonations}
                    handleClaim={undefined}
                    claimingTokens={[]}
                  />
                ) : (
                  <EmptyState title={t('details.data.empty.nfts')} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{t('details.data.contributions.erc20')}</h3>
                  <InfoTooltip content={t('details.data.contributions.erc20Tooltip')} />
                </div>
                {donatedERC20Tokens.length > 0 ? (
                  <AttachedERC20Table list={donatedERC20Tokens} handleClaim={null} />
                ) : (
                  <EmptyState title={t('details.data.empty.erc20')} />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.section>
    </PageShell>
  );
};

export default AllocationInfoPage;
