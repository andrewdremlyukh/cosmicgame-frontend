'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocale, useTranslations } from 'next-intl';

import { getExplorerUrl } from '@/utils';

import { Link } from '@/i18n/navigation';
import { HydrationSafeDateTime } from '@/components/common/HydrationSafeDateTime';
import {
  DefinitionList,
  DetailRow,
  SectionCard,
  detailLinkClass,
  detailPanelClass,
} from '@/components/detail-page/DetailPageChrome';
import { PageHeader } from '@/components/layout/PageHeader';
import { LinkifiedText } from '@/components/ui/linkified-text';
import { PageShell } from '@/components/ui/page-shell';
import RandomWalkNFT from '@/components/nft/RandomWalkNFT';
import NFTImage from '@/components/nft/NFTImage';
import { useGestureInfo } from '@/hooks/useApiQuery';
import { cn } from '@/lib/utils';
import type { GestureInfo } from '@/services/api';
import { formatFixed } from '@/utils/format';

interface NFTTokenURI {
  image?: string;
  collection_name?: string;
  artist?: string;
  platform?: string;
  description?: string;
  [key: string]: unknown;
}

function firstNonNegativeNumber(...values: Array<number | undefined>): number | undefined {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

function formatAmount(
  amount: number | undefined,
  unit: string,
  decimals: { fractional: number; standard: number },
): string {
  if (amount === undefined) return '—';
  const precision = amount > 0 && amount < 1 ? decimals.fractional : decimals.standard;
  return `${formatFixed(amount, precision)} ${unit}`;
}

function getCstGestureCost(gestureInfo: GestureInfo): number | undefined {
  return firstNonNegativeNumber(
    gestureInfo.CstCost,
    gestureInfo.NumCSTokensEth,
    gestureInfo.NumCSTTokensEth,
    gestureInfo.CstPriceEth,
  );
}

function getEthGestureCost(gestureInfo: GestureInfo): number | undefined {
  return firstNonNegativeNumber(gestureInfo.GestureCostEth, gestureInfo.EthPriceEth);
}

function getParticipationCST(gestureInfo: GestureInfo): number | undefined {
  return firstNonNegativeNumber(
    gestureInfo.ParticipationCST,
    gestureInfo.CSTRewardEth,
    gestureInfo.ERC20RewardAmountEth,
  );
}

// Amount unit suffixes (ETH/CST) are glossary keep-in-English terms.
function formatGestureCost(gestureInfo: GestureInfo): string {
  if (gestureInfo.GestureType === 2) {
    return formatAmount(getCstGestureCost(gestureInfo), 'CST', { fractional: 7, standard: 4 });
  }

  return formatAmount(getEthGestureCost(gestureInfo), 'ETH', { fractional: 7, standard: 2 });
}

function formatParticipationCST(gestureInfo: GestureInfo): string {
  return formatAmount(getParticipationCST(gestureInfo), 'CST', { fractional: 7, standard: 2 });
}

/**
 * V3 Participation CST split: the outbid (previous) participant receives most of the
 * imprint (90% by default) and the participant placing the gesture receives the rest.
 * Returns undefined for V1/V2 gestures (no split recorded) so the rows can be hidden.
 */
function getCstRewardSplit(
  gestureInfo: GestureInfo,
): { previous: number; current: number } | undefined {
  const previous = gestureInfo.PreviousBidderCstRewardAmountEth;
  const current = gestureInfo.ThisBidderCstRewardAmountEth;
  if (typeof previous !== 'number' || typeof current !== 'number') return undefined;
  if (previous <= 0) return undefined; // V1/V2 gesture or opening gesture of a cycle: no split occurred.
  return { previous, current };
}

const GesturePage = ({ gestureId }: { gestureId: number }) => {
  const t = useTranslations('gesture');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { data: gestureInfo = null, isLoading: loading } = useGestureInfo(gestureId);

  const [tokenURI, setTokenURI] = useState<NFTTokenURI | null>(null);

  useEffect(() => {
    if (gestureInfo?.NFTTokenURI) {
      axios.get(gestureInfo.NFTTokenURI).then(({ data }) => setTokenURI(data));
    }
  }, [gestureInfo]);

  if (gestureId < 0) {
    return (
      <PageShell variant="form">
        <div className={cn(detailPanelClass, 'mx-auto max-w-lg p-8 text-center')}>
          <p className="font-display text-lg font-semibold text-foreground">{t('invalid.title')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('invalid.help')}</p>
        </div>
      </PageShell>
    );
  }

  const gesturePosition = gestureInfo?.BidPosition;
  const gesturePositionLabel =
    gesturePosition !== undefined && gesturePosition !== null
      ? t('header.positionLabel', { position: gesturePosition })
      : t('header.positionFallback');

  return (
    <PageShell variant="detail" backdrop="signature" className="max-sm:pb-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={t('header.title')}
          subtitle={loading ? t('header.loadingSubtitle') : gesturePositionLabel}
          breadcrumbs={[
            { label: tCommon('breadcrumbs.home'), href: '/' },
            { label: gesturePositionLabel },
          ]}
          className="mb-10 text-left sm:max-w-none [&_p]:mx-0 [&_p]:max-w-none"
          align="left"
        />

        {loading ? (
          <div className={cn(detailPanelClass, 'p-10 text-center')}>
            <p className="text-sm font-medium text-muted-foreground">
              {tCommon('status.loadingDots')}
            </p>
          </div>
        ) : !gestureInfo ? (
          <div className={cn(detailPanelClass, 'p-10 text-center')}>
            <p className="font-medium text-foreground">{t('empty.title')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('empty.help')}</p>
          </div>
        ) : (
          <>
            <SectionCard
              sectionId="bid-section-tx"
              title={t('sections.transaction.title')}
              description={t('sections.transaction.description')}
            >
              <DefinitionList>
                <DetailRow label={t('rows.datetime')}>
                  <a
                    href={getExplorerUrl('tx', gestureInfo.TxHash)}
                    className={detailLinkClass}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HydrationSafeDateTime timestamp={gestureInfo.TimeStamp} locale={locale} />
                  </a>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t('rows.datetimeHelp')}
                  </span>
                </DetailRow>
                <DetailRow label={t('rows.participantAddress')}>
                  <Link
                    href={`/user/${gestureInfo.BidderAddr}`}
                    className={cn(detailLinkClass, 'font-mono text-[13px] break-all')}
                  >
                    {gestureInfo.BidderAddr}
                  </Link>
                </DetailRow>
                <DetailRow label={t('rows.cycleNumber')}>
                  <Link href={`/allocation/${gestureInfo.RoundNum}`} className={detailLinkClass}>
                    {t('rows.cycleValue', { round: gestureInfo.RoundNum })}
                  </Link>
                </DetailRow>
              </DefinitionList>
            </SectionCard>

            <SectionCard
              sectionId="bid-section-amount"
              title={t('sections.cost.title')}
              description={t('sections.cost.description')}
            >
              <DefinitionList>
                <DetailRow label={t('rows.gestureCost')}>
                  <span className="font-mono tabular-nums text-foreground">
                    {formatGestureCost(gestureInfo)}
                  </span>
                </DetailRow>
                <DetailRow label={t('rows.participationCst')}>
                  <span className="font-mono tabular-nums">
                    {formatParticipationCST(gestureInfo)}
                  </span>
                </DetailRow>
                {(() => {
                  const split = getCstRewardSplit(gestureInfo);
                  if (!split) return null;
                  return (
                    <>
                      <DetailRow label={t('rows.cstToOutbid')}>
                        <span className="font-mono tabular-nums">
                          {formatAmount(split.previous, 'CST', { fractional: 7, standard: 2 })}
                        </span>
                      </DetailRow>
                      <DetailRow label={t('rows.cstToThis')}>
                        <span className="font-mono tabular-nums">
                          {formatAmount(split.current, 'CST', { fractional: 7, standard: 2 })}
                        </span>
                      </DetailRow>
                    </>
                  );
                })()}
              </DefinitionList>
            </SectionCard>

            <SectionCard
              sectionId="bid-section-type"
              title={t('sections.type.title')}
              description={t('sections.type.description')}
            >
              <DefinitionList>
                <DetailRow label={t('rows.attachedRandomWalk')}>
                  {(gestureInfo.RWalkNFTId ?? -1) < 0 ? t('values.no') : t('values.yes')}
                </DetailRow>
                <DetailRow label={t('rows.paidWithCst')}>
                  {gestureInfo.GestureType === 2 ? t('values.yes') : t('values.no')}
                </DetailRow>
                {(gestureInfo.RWalkNFTId ?? -1) >= 0 ? (
                  <DetailRow label={t('rows.randomWalkId')}>
                    <span className="font-mono tabular-nums">{gestureInfo.RWalkNFTId}</span>
                  </DetailRow>
                ) : null}
              </DefinitionList>
            </SectionCard>

            {gestureInfo.DonatedERC20TokenAddr ? (
              <SectionCard
                sectionId="bid-section-erc20"
                title={t('sections.erc20.title')}
                description={t('sections.erc20.description')}
              >
                <DefinitionList>
                  <DetailRow label={t('rows.erc20Address')}>
                    <span className="font-mono text-[13px] break-all">
                      {gestureInfo.DonatedERC20TokenAddr}
                    </span>
                  </DetailRow>
                  <DetailRow label={t('rows.erc20Amount')}>
                    <span className="font-mono tabular-nums">
                      {(gestureInfo.DonatedERC20TokenAmountEth ?? 0).toFixed(2)}
                    </span>
                  </DetailRow>
                </DefinitionList>
              </SectionCard>
            ) : null}

            {gestureInfo.NFTDonationTokenAddr !== '' && gestureInfo.NFTDonationTokenId !== -1 ? (
              <SectionCard
                sectionId="bid-section-nft"
                title={t('sections.nft.title')}
                description={t('sections.nft.description')}
              >
                <DefinitionList>
                  <DetailRow label={t('rows.nftAddress')}>
                    <span className="font-mono text-[13px] break-all">
                      {gestureInfo.NFTDonationTokenAddr}
                    </span>
                  </DetailRow>
                  <DetailRow label={t('rows.nftId')}>
                    <span className="font-mono tabular-nums">{gestureInfo.NFTDonationTokenId}</span>
                  </DetailRow>
                  <DetailRow label={t('rows.nftTokenUri')}>
                    <span className="break-all text-xs text-muted-foreground">
                      {gestureInfo.NFTTokenURI}
                    </span>
                  </DetailRow>
                </DefinitionList>
                <div className="border-t border-white/[0.06] px-4 py-5 sm:px-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('nftPreview.heading')}
                  </p>
                  <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                    <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
                      <NFTImage src={tokenURI?.image} className="bg-contain" />
                    </div>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {t('nftPreview.collectionName')}
                        </p>
                        <p className="mt-0.5 text-foreground">{tokenURI?.collection_name ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {t('nftPreview.artist')}
                        </p>
                        <p className="mt-0.5 text-foreground">{tokenURI?.artist ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {t('nftPreview.platform')}
                        </p>
                        <p className="mt-0.5 text-foreground">{tokenURI?.platform ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {t('nftPreview.description')}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap text-foreground/90">
                          {tokenURI?.description ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard
              sectionId="bid-section-message"
              title={t('sections.message.title')}
              description={t('sections.message.description')}
            >
              <div className="px-4 py-4 sm:px-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {gestureInfo.Message ? <LinkifiedText text={gestureInfo.Message} /> : '\u2014'}
                </p>
              </div>
            </SectionCard>

            {(gestureInfo.RWalkNFTId ?? -1) >= 0 ? (
              <section
                className={cn(detailPanelClass, 'p-5')}
                aria-label={t('randomWalk.previewAria')}
              >
                <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-foreground">
                  {t('randomWalk.heading')}
                </h2>
                <div className="mx-auto max-w-md sm:mx-0">
                  <RandomWalkNFT tokenId={gestureInfo.RWalkNFTId!} selectable={false} />
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </PageShell>
  );
};

export default GesturePage;
