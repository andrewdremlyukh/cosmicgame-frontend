'use client';

import { useMemo } from 'react';
import { Trophy, Gavel, Layers, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { ethDistributionFacts, protocolFacts } from '@/content/protocol-facts';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageShell } from '@/components/ui/page-shell';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card';
import { Surface } from '@/components/ui/surface';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { AllocationTable } from '@/components/tables/AllocationTable';
import { useRoundList } from '@/hooks/useApiQuery';

const AllocationRecipientsPage = () => {
  const t = useTranslations('allocation');
  const locale = useLocale();
  const { data: rawPrizeClaims = [], isLoading: loading } = useRoundList();

  const allocationTracks = [
    {
      id: 'signature',
      label: t('recipients.reserveSplit.tracks.signature.label'),
      value: `${ethDistributionFacts.mainEthPercentage}%`,
      width: `${ethDistributionFacts.mainEthPercentage}%`,
      color: 'bg-[rgb(var(--aurora-cyan-rgb))]',
      tooltip: t('recipients.reserveSplit.tracks.signature.tooltip'),
    },
    {
      id: 'chrono',
      label: t('recipients.reserveSplit.tracks.chrono.label'),
      value: `${ethDistributionFacts.chronoWarriorEthPercentage}%`,
      width: `${ethDistributionFacts.chronoWarriorEthPercentage}%`,
      color: 'bg-[rgb(var(--nebula-violet-rgb))]',
      tooltip: t('recipients.reserveSplit.tracks.chrono.tooltip'),
    },
    {
      id: 'stellar',
      label: t('recipients.reserveSplit.tracks.stellar.label'),
      value: `${ethDistributionFacts.stellarSelectionEthPercentage}%`,
      width: `${ethDistributionFacts.stellarSelectionEthPercentage}%`,
      color: 'bg-[rgb(var(--solar-gold-rgb))]',
      tooltip: t('recipients.reserveSplit.tracks.stellar.tooltip'),
    },
    {
      id: 'anchor',
      label: t('recipients.reserveSplit.tracks.anchor.label'),
      value: `${ethDistributionFacts.anchorDistributionPercentage}%`,
      width: `${ethDistributionFacts.anchorDistributionPercentage}%`,
      color: 'bg-[rgb(var(--impact-green-rgb))]',
      tooltip: t('recipients.reserveSplit.tracks.anchor.tooltip'),
    },
    {
      id: 'public-goods',
      label: t('recipients.reserveSplit.tracks.publicGoods.label'),
      value: `${ethDistributionFacts.publicGoodsPercentage}%`,
      width: `${ethDistributionFacts.publicGoodsPercentage}%`,
      color: 'bg-[rgb(var(--chrono-rose-rgb))]',
      tooltip: t('recipients.reserveSplit.tracks.publicGoods.tooltip'),
    },
    {
      id: 'next-cycle',
      label: t('recipients.reserveSplit.tracks.nextCycle.label'),
      value: `~${protocolFacts.compoundingReservePercentage}%`,
      width: `${protocolFacts.compoundingReservePercentage}%`,
      color: 'bg-white/40',
      tooltip: t('recipients.reserveSplit.tracks.nextCycle.tooltip'),
    },
  ] as const;

  const allocationFinalizations = useMemo(
    () => [...rawPrizeClaims].sort((a, b) => b.TimeStamp - a.TimeStamp),
    [rawPrizeClaims],
  );

  const summaryStats = useMemo(() => {
    if (allocationFinalizations.length === 0) return null;
    const totalRounds = allocationFinalizations.length;
    const totalEth = allocationFinalizations.reduce((sum, r) => sum + (r.AmountEth || 0), 0);
    const totalGestures = allocationFinalizations.reduce(
      (sum, r) => sum + (r.RoundStats?.TotalBids || 0),
      0,
    );
    const uniqueRecipients = new Set(
      allocationFinalizations.map((r) => r.WinnerAddr).filter(Boolean),
    ).size;
    return { totalRounds, totalEth, totalGestures, uniqueRecipients };
  }, [allocationFinalizations]);

  return (
    <PageShell variant="data" backdrop="signature">
      <PageHeader
        align="left"
        eyebrow={
          <SectionEyebrow tone="aurora" pulse>
            {t('recipients.header.eyebrow')}
          </SectionEyebrow>
        }
        title={t('recipients.header.title')}
        titleLevel={2}
        gradientTitle="signature"
        subtitle={t('recipients.header.subtitle')}
        meta={
          <span className="inline-flex items-center gap-1.5 type-body-sm text-muted-foreground">
            <span>{t('recipients.header.scope')}</span>
            <InfoTooltip
              content={t('recipients.header.scopeTooltip')}
              label={t('recipients.header.scope')}
            />
          </span>
        }
      />

      <Surface
        variant="solar"
        radius="xl"
        padding="lg"
        className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center"
      >
        <p className="type-body-md text-muted-foreground">
          {t('recipients.intro', { percentage: ethDistributionFacts.mainEthPercentage })}
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="type-eyebrow text-white/65">{t('recipients.reserveSplit.label')}</p>
            <InfoTooltip
              content={t('recipients.reserveSplit.tooltip')}
              label={t('recipients.reserveSplit.label')}
              iconClassName="h-3 w-3"
              className="text-white/45 hover:text-white/80"
            />
          </div>
          {allocationTracks.map(({ id, label, value, width, color, tooltip }) => (
            <div key={id} className="grid grid-cols-[112px_1fr_48px] items-center gap-3">
              <span className="flex items-center gap-1.5 type-mono-sm text-white/55">
                <span>{label}</span>
                <InfoTooltip
                  content={tooltip}
                  label={label}
                  iconClassName="h-3 w-3"
                  className="text-white/45 hover:text-white/80"
                />
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <span
                  className={`block h-full rounded-full ${color}`}
                  style={{ width }}
                  aria-hidden
                />
              </span>
              <span className="type-mono-sm text-white/70">{value}</span>
            </div>
          ))}
        </div>
      </Surface>

      {loading ? (
        <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : summaryStats ? (
        <div data-testid="summary-stats" className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            data-testid="summary-stat-total-cycles"
            label={t('recipients.stats.totalCycles.label')}
            value={summaryStats.totalRounds}
            icon={<Layers className="h-4 w-4" />}
            accent="aurora"
            tooltip={t('recipients.stats.totalCycles.tooltip')}
          />
          <StatCard
            data-testid="summary-stat-total-eth-distributed"
            label={t('recipients.stats.totalEth.label')}
            value={`${summaryStats.totalEth.toFixed(2)} ETH`}
            icon={<Trophy className="h-4 w-4" />}
            accent="solar"
            tooltip={t('recipients.stats.totalEth.tooltip')}
          />
          <StatCard
            data-testid="summary-stat-total-gestures"
            label={t('recipients.stats.totalGestures.label')}
            value={summaryStats.totalGestures.toLocaleString(locale)}
            icon={<Gavel className="h-4 w-4" />}
            accent="nebula"
            tooltip={t('recipients.stats.totalGestures.tooltip')}
          />
          <StatCard
            data-testid="summary-stat-unique-recipients"
            label={t('recipients.stats.uniqueRecipients.label')}
            value={summaryStats.uniqueRecipients}
            icon={<Users className="h-4 w-4" />}
            accent="impact"
            tooltip={t('recipients.stats.uniqueRecipients.tooltip')}
          />
        </div>
      ) : null}

      <AllocationTable list={allocationFinalizations} loading={loading} />
    </PageShell>
  );
};

export default AllocationRecipientsPage;
