'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, Coins, MessageSquare, Timer, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cstRewardFacts } from '@/content/protocol-facts';
import { formatSeconds } from '@/utils';

import { formatCstAmount } from '@/utils/cstGesture';
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card';
import { SectionDivider } from '@/components/ui/section-divider';

interface GameConfigurationProps {
  priceIncrease: number;
  timeIncrease: number;
  timeIncrement: number;
  cstRewardPerBid: number | null;
  maxMessageLength: number;
  claimTimeout: number;
  initialIncrement: number;
  /** V3-only parameters; null on V2 deployments (cards hidden). */
  v3Config?: {
    mainPrizeNumNfts: number;
    lateBidDurationSeconds: number;
    cstBidPriceDeclinePerSecond: number;
  } | null;
  loading?: boolean;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function GameConfiguration({
  priceIncrease,
  timeIncrease,
  timeIncrement,
  cstRewardPerBid,
  maxMessageLength,
  claimTimeout,
  initialIncrement,
  v3Config = null,
  loading = false,
}: GameConfigurationProps) {
  const locale = useLocale();
  const t = useTranslations('contracts');
  if (loading) {
    return (
      <div>
        <SectionDivider title={t('configuration.title')} className="mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: t('configuration.cards.ethStep.label'),
      value: `${priceIncrease}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      tooltip: t('configuration.cards.ethStep.tooltip'),
      featured: true,
    },
    {
      label: t('configuration.cards.timeIncrement.label'),
      value: timeIncrement > 0 ? formatSeconds(timeIncrement, locale) : '--',
      icon: <Clock className="h-4 w-4" />,
      tooltip: t('configuration.cards.timeIncrement.tooltip', { percent: timeIncrease }),
      featured: true,
    },
    {
      label: t('configuration.cards.cstPreview.label'),
      value: `${formatCstAmount(cstRewardPerBid)} CST`,
      icon: <Coins className="h-4 w-4" />,
      tooltip: t('configuration.cards.cstPreview.tooltip', {
        formula: cstRewardFacts.formula,
      }),
    },
    {
      label: t('configuration.cards.finalization.label'),
      value: claimTimeout > 0 ? formatSeconds(claimTimeout, locale) : '--',
      icon: <Timer className="h-4 w-4" />,
      tooltip: t('configuration.cards.finalization.tooltip'),
    },
    {
      label: t('configuration.cards.initial.label'),
      value: initialIncrement > 0 ? formatSeconds(initialIncrement, locale) : '--',
      icon: <Zap className="h-4 w-4" />,
      tooltip: t('configuration.cards.initial.tooltip'),
    },
    {
      label: t('configuration.cards.message.label'),
      value: maxMessageLength > 0 ? maxMessageLength : '--',
      icon: <MessageSquare className="h-4 w-4" />,
      tooltip: t('configuration.cards.message.tooltip'),
    },
    // V3-only parameters — present once the protocol runs the V3 implementation.
    ...(v3Config
      ? [
          {
            label: t('configuration.cards.v3CstDecline.label'),
            value: t('configuration.cards.v3CstDecline.value', {
              amount: formatCstAmount(v3Config.cstBidPriceDeclinePerSecond * 60),
            }),
            icon: <Coins className="h-4 w-4" />,
            tooltip: t('configuration.cards.v3CstDecline.tooltip'),
          },
          {
            label: t('configuration.cards.v3SignatureNfts.label'),
            value: v3Config.mainPrizeNumNfts,
            icon: <Zap className="h-4 w-4" />,
            tooltip: t('configuration.cards.v3SignatureNfts.tooltip'),
          },
          {
            label: t('configuration.cards.v3LateWindow.label'),
            value:
              v3Config.lateBidDurationSeconds > 0
                ? formatSeconds(v3Config.lateBidDurationSeconds, locale)
                : '--',
            icon: <Timer className="h-4 w-4" />,
            tooltip: t('configuration.cards.v3LateWindow.tooltip'),
          },
        ]
      : []),
  ];

  return (
    <div>
      <SectionDivider title={t('configuration.title')} className="mb-4" />
      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card) => (
          <motion.div key={card.label} variants={fadeUp}>
            <StatCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              tooltip={card.tooltip}
              featured={card.featured}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
