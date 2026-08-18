'use client';

import { useMemo } from 'react';
import { Coins, Users, Layers, TrendingUp, ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { ethDistributionFacts } from '@/content/protocol-facts';

import { Link } from '@/i18n/navigation';
import { GlobalAnchorDistributionsTable } from '@/components/anchoring/GlobalAnchorDistributionsTable';
import { RwalkAnchorDistributionImprintsTable } from '@/components/anchoring/RwalkAnchorDistributionImprintsTable';
import { AnchoringHeroStats } from '@/components/anchoring/AnchoringHeroStats';
import { HowAnchoringWorks } from '@/components/anchoring/HowAnchoringWorks';
import {
  useCSTAnchorDistributions,
  useGlobalRWLKAnchorImprints,
  useDashboardInfo,
  useUniqueCSTAnchorHolders,
} from '@/hooks/useApiQuery';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageShell } from '@/components/ui/page-shell';
import { SectionDivider } from '@/components/ui/section-divider';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { Surface } from '@/components/ui/surface';
import { formatEthValue } from '@/utils/format';
import { formatDistributionPerAnchoredNftEth } from '@/utils/anchoringStats';

const AnchoringPage = () => {
  const t = useTranslations('anchoring');
  const locale = useLocale();
  const {
    data: cosmicSignatureRewards,
    isLoading: isLoadingCST,
    error: cstError,
  } = useCSTAnchorDistributions();
  const {
    data: randomWalkRewards,
    isLoading: isLoadingRWLK,
    error: rwlkError,
  } = useGlobalRWLKAnchorImprints();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardInfo();
  const { data: uniqueStakers, isLoading: isLoadingStakers } = useUniqueCSTAnchorHolders();

  const loading = isLoadingCST || isLoadingRWLK;
  const statsLoading = isLoadingDashboard || isLoadingStakers;
  const hasError = Boolean(cstError || rwlkError);

  const distributionPerNft = useMemo(
    () =>
      formatDistributionPerAnchoredNftEth(
        dashboardData?.StakingAmountEth,
        dashboardData?.MainStats?.StakeStatisticsCST?.TotalTokensStaked,
        locale,
      ),
    [dashboardData, locale],
  );

  const heroStats = useMemo(
    () => [
      {
        label: t('overview.stats.pool.label'),
        value: formatEthValue(dashboardData?.StakingAmountEth ?? 0),
        tooltip: t('overview.stats.pool.tooltip'),
        icon: <Coins className="h-4 w-4" />,
        featured: true,
        gradient: true,
      },
      {
        label: t('overview.stats.cosmicSignatureAnchored.label'),
        value: (
          dashboardData?.MainStats?.StakeStatisticsCST?.TotalTokensStaked ?? 0
        ).toLocaleString(locale),
        tooltip: t('overview.stats.cosmicSignatureAnchored.tooltip'),
        icon: <Layers className="h-4 w-4" />,
      },
      {
        label: t('overview.stats.randomWalkAnchored.label'),
        value: (
          dashboardData?.MainStats?.StakeStatisticsRWalk?.TotalTokensStaked ?? 0
        ).toLocaleString(locale),
        tooltip: t('overview.stats.randomWalkAnchored.tooltip'),
        icon: <Layers className="h-4 w-4" />,
      },
      {
        label: t('overview.stats.distributionPerNft.label'),
        value: distributionPerNft.value,
        tooltip: distributionPerNft.tooltipSuffix
          ? t('overview.stats.distributionPerNft.tooltipUnavailable')
          : t('overview.stats.distributionPerNft.tooltip'),
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        label: t('overview.stats.uniqueHolders.label'),
        value: (uniqueStakers?.length ?? 0).toLocaleString(locale),
        tooltip: t('overview.stats.uniqueHolders.tooltip'),
        icon: <Users className="h-4 w-4" />,
      },
    ],
    [dashboardData, distributionPerNft, locale, t, uniqueStakers],
  );

  if (hasError) {
    return (
      <PageShell variant="data">
        <ErrorState title={t('overview.errorTitle')} message={t('overview.errorMessage')} />
      </PageShell>
    );
  }

  return (
    <PageShell variant="data" backdrop="signature">
      <PageHeader
        align="left"
        eyebrow={
          <SectionEyebrow tone="aurora" pulse>
            {t('overview.eyebrow')}
          </SectionEyebrow>
        }
        title={t('overview.title')}
        titleLevel={2}
        gradientTitle="signature"
        subtitle={t('overview.subtitle')}
      />

      <Surface
        variant="impact"
        radius="xl"
        padding="lg"
        className="mb-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center"
      >
        <p className="type-body-md text-muted-foreground">
          {t('overview.intro.description', {
            percentage: ethDistributionFacts.anchorDistributionPercentage,
          })}
        </p>
        <div className="relative min-h-[160px] overflow-hidden rounded-[var(--radius-surface)] border border-white/[0.08] bg-black/20">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--impact-green-rgb)/0.5)] shadow-[0_0_50px_rgb(var(--impact-green-rgb)/0.16)]"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--aurora-cyan-rgb)/0.25)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-[rgb(var(--impact-green-rgb)/0.14)] px-4 py-2 text-sm font-semibold text-[rgb(var(--impact-green-rgb))]">
              {t('overview.intro.flow', {
                percentage: ethDistributionFacts.anchorDistributionPercentage,
              })}
            </div>
          </div>
        </div>
      </Surface>

      <AnchoringHeroStats stats={heroStats} loading={statsLoading} className="mb-10" />

      <HowAnchoringWorks className="mb-10" />

      <Link
        href="/my-anchors"
        className="group mb-10 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.04] p-5 transition-all hover:border-primary/40 hover:bg-primary/[0.08] no-underline"
      >
        <div>
          <p className="text-base font-semibold text-foreground">{t('overview.cta.title')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('overview.cta.description')}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-primary opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
      </Link>

      <div>
        <SectionDivider title={t('overview.sections.cosmicSignature')} />
        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <GlobalAnchorDistributionsTable list={cosmicSignatureRewards ?? []} />
        )}
      </div>

      <div>
        <SectionDivider title={t('overview.sections.randomWalk')} />
        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <RwalkAnchorDistributionImprintsTable list={randomWalkRewards ?? []} />
        )}
      </div>
    </PageShell>
  );
};

export default AnchoringPage;
