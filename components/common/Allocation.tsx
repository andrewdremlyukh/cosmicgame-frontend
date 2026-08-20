'use client';

import { type FC } from 'react';
import {
  Trophy,
  Shuffle,
  ImageIcon,
  Layers,
  Swords,
  Crown,
  Coins,
  Users,
  Sprout,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';

/** Cosmic Signature NFTs in the Signature Allocation: V3 awards 3 sequential NFTs, V2 awards 1. */
const signatureNftCount = isV3Mechanics ? protocolFacts.v3.mainPrizeNftsPerCycleDefault : 1;

interface AllocationData {
  PrizeAmountEth?: number;
  RaffleAmountEth?: number;
  NumRaffleEthWinnersBidding?: number;
  NumRaffleNFTWinnersBidding?: number;
  NumRaffleNFTWinnersStakingRWalk?: number;
  StakingAmountEth?: number;
  CosmicGameBalanceEth?: number;
  ChronoWarriorPercentage?: number;
  CharityPercentage?: number;
  [key: string]: unknown;
}

interface AllocationProps {
  data: AllocationData | null;
}

interface AllocationCardData {
  icon: React.ReactNode;
  name: string;
  tooltip: string;
  amounts: string[];
  recipientCount?: number;
  recipientLabel?: string;
  faqLink?: string;
  featured?: boolean;
  impact?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const },
  }),
};

const Allocation: FC<AllocationProps> = ({ data }) => {
  const t = useTranslations('home');

  const allocations: AllocationCardData[] = [
    {
      icon: <Trophy className="h-5 w-5" />,
      name: t('allocation.cards.signature.name'),
      tooltip: t('allocation.cards.signature.tooltip', { cscNftCount: signatureNftCount }),
      amounts: [
        t('allocation.amounts.eth', { amount: (data?.PrizeAmountEth ?? 0).toFixed(4) }),
        t('allocation.amounts.fixedCst'),
        t('allocation.amounts.signatureNft', { count: signatureNftCount }),
        t('allocation.amounts.attachedTokens'),
      ],
      recipientCount: 1,
      // lexicon-allow-start — FAQ hash anchor preserves legacy URL fragment
      faqLink: '/faq#main-allocation',
      // lexicon-allow-end
      featured: true,
    },
    {
      icon: <Sprout className="h-5 w-5" />,
      name: t('allocation.cards.publicGoods.name'),
      tooltip: t('allocation.cards.publicGoods.tooltip', {
        percent: String(data?.CharityPercentage ?? 0),
      }),
      amounts: [
        t('allocation.amounts.eth', {
          amount: (
            ((data?.CosmicGameBalanceEth ?? 0) * (data?.CharityPercentage ?? 0)) /
            100
          ).toFixed(4),
        }),
      ],
      recipientLabel: t('allocation.cards.publicGoods.recipientLabel'),
      faqLink: '/faq',
      impact: true,
    },
    {
      icon: <Shuffle className="h-5 w-5" />,
      name: t('allocation.cards.ethStellar.name'),
      tooltip: t('allocation.cards.ethStellar.tooltip'),
      amounts: [
        t('allocation.amounts.ethEach', {
          amount: ((data?.RaffleAmountEth ?? 0) / (data?.NumRaffleEthWinnersBidding ?? 1)).toFixed(
            4,
          ),
        }),
      ],
      recipientCount: data?.NumRaffleEthWinnersBidding ?? 0,
    },
    {
      icon: <ImageIcon className="h-5 w-5" />,
      name: t('allocation.cards.nftStellar.name'),
      tooltip: t('allocation.cards.nftStellar.tooltip'),
      amounts: [t('allocation.amounts.fixedCstEach'), t('allocation.amounts.nftEach')],
      recipientCount: data?.NumRaffleNFTWinnersBidding ?? 0,
    },
    {
      icon: <Layers className="h-5 w-5" />,
      name: t('allocation.cards.randomWalkAnchor.name'),
      tooltip: t('allocation.cards.randomWalkAnchor.tooltip'),
      amounts: [t('allocation.amounts.fixedCstEach'), t('allocation.amounts.nftEach')],
      recipientCount: data?.NumRaffleNFTWinnersStakingRWalk ?? 0,
    },
    {
      icon: <Users className="h-5 w-5" />,
      name: t('allocation.cards.cosmicAnchor.name'),
      tooltip: t('allocation.cards.cosmicAnchor.tooltip'),
      amounts: [t('allocation.amounts.eth', { amount: (data?.StakingAmountEth ?? 0).toFixed(4) })],
      recipientLabel: t('allocation.cards.cosmicAnchor.recipientLabel'),
    },
    {
      icon: <Swords className="h-5 w-5" />,
      name: t('allocation.cards.chronoWarrior.name'),
      tooltip: t('allocation.cards.chronoWarrior.tooltip'),
      amounts: [
        t('allocation.amounts.eth', {
          amount: (
            ((data?.CosmicGameBalanceEth ?? 0) * (data?.ChronoWarriorPercentage ?? 0)) /
            100
          ).toFixed(4),
        }),
        t('allocation.amounts.fixedCst'),
        t('allocation.amounts.nft'),
      ],
      recipientCount: 1,
      faqLink: '/faq#chrono-warrior',
    },
    {
      icon: <Crown className="h-5 w-5" />,
      name: t('allocation.cards.endurance.name'),
      tooltip: t('allocation.cards.endurance.tooltip'),
      amounts: [t('allocation.amounts.fixedCst'), t('allocation.amounts.nft')],
      recipientCount: 1,
      faqLink: '/faq#endurance-champion',
    },
    {
      icon: <Coins className="h-5 w-5" />,
      name: t('allocation.cards.finalCst.name'),
      tooltip: t('allocation.cards.finalCst.tooltip'),
      amounts: [t('allocation.amounts.fixedCst'), t('allocation.amounts.nft')],
      recipientCount: 1,
    },
  ];

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {t('allocation.title')}
        </h3>
        <InfoTooltip content={t('allocation.titleTooltip')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {allocations.map((allocation, i) => (
          <motion.div
            key={allocation.name}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              'group relative rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.04]',
              allocation.impact
                ? 'border-[oklch(77.1%_0.163_161)]/30 bg-[rgb(var(--impact-green-rgb)/0.04)] glow-impact'
                : allocation.featured
                  ? 'gradient-border-card gradient-border-card-accent bg-white/[0.03] sm:col-span-2 lg:col-span-2'
                  : 'border-white/[0.06] bg-white/[0.02]',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                  allocation.impact
                    ? 'bg-[rgb(var(--impact-green-rgb)/0.12)] text-[rgb(var(--impact-green-rgb))]'
                    : allocation.featured
                      ? 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'
                      : 'bg-white/[0.06] text-muted-foreground group-hover:text-primary',
                )}
              >
                {allocation.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      allocation.featured || allocation.impact ? 'text-white' : 'text-white/90',
                    )}
                  >
                    {allocation.faqLink ? (
                      <Link
                        href={allocation.faqLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {allocation.name}
                      </Link>
                    ) : (
                      allocation.name
                    )}
                  </span>
                  <InfoTooltip content={allocation.tooltip} />
                </div>
                <div className="mt-2 space-y-0.5">
                  {allocation.amounts.map((amount) => (
                    <p
                      key={amount}
                      className={cn(
                        'text-sm',
                        allocation.impact
                          ? 'font-medium text-[rgb(var(--impact-green-rgb))]'
                          : allocation.featured
                            ? 'font-medium bg-gradient-to-r from-[#35C9FF] to-[#AC56FF] bg-clip-text text-transparent'
                            : 'text-muted-foreground',
                      )}
                    >
                      {amount}
                    </p>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {allocation.recipientLabel ??
                      t('allocation.recipientCount', { count: allocation.recipientCount ?? 0 })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Allocation;
