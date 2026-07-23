'use client';

import { type SyntheticEvent, type ComponentProps, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Wallet, Clock, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';
import { formatEthValue, formatSeconds, type EnduranceChampion } from '@/utils';

import Allocation from '@/components/common/Allocation';
import GestureHistory from '@/components/tables/GestureHistoryTable';
import StellarSelectionHolderTable from '@/components/tables/StellarSelectionHolderTable';
import ETHSpentTable from '@/components/tables/ETHSpentTable';
import EnduranceChampionsTable from '@/components/tables/EnduranceChampionsTable';
import EthDonationTable from '@/components/tables/EthDonationTable';
import { FundDistribution } from '@/components/tokens/FundDistribution';
import { DonatedTokensSection } from '@/components/home/DonatedTokensSection';
import { SectionDivider } from '@/components/ui/section-divider';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useNow } from '@/hooks/useNow';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import type { DashboardInfo, GestureInfo, AttachedNFT } from '@/services/api/types';

interface RoundInfoSectionProps {
  data: DashboardInfo | null;
  curGestureList: GestureInfo[];
  championList: EnduranceChampion[] | null;
  ethDonations: import('@/components/tables/EthDonationTable').EthDonation[];
  donatedNFTs: AttachedNFT[];
  donatedERC20Tokens: import('@/components/attachments/AttachedERC20Table').DonatedERC20Token[];
  donatedTokensTab: number;
  onTabChange: (_event: SyntheticEvent, newValue: number) => void;
  curPage: number;
  setCurPage: (page: number) => void;
  perPage: number;
}

const sectionFade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const },
  }),
};

/** Displays full cycle details: allocation breakdown, fund distribution, leaderboards, gesture history, contributions, and rules. */
export function RoundInfoSection({
  data,
  curGestureList,
  championList,
  ethDonations,
  donatedNFTs,
  donatedERC20Tokens,
  donatedTokensTab,
  onTabChange,
  curPage,
  setCurPage,
  perPage,
}: RoundInfoSectionProps) {
  const t = useTranslations('currentCycle');
  const locale = useLocale();

  const uniqueParticipants = useMemo(() => {
    const addrs = new Set(curGestureList.map((b) => b.BidderAddr));
    return addrs.size;
  }, [curGestureList]);

  const nowMs = useNow(1000);

  const roundDuration = useMemo(() => {
    if (!data?.TsRoundStart) return '';
    const elapsed = Math.floor(nowMs / 1000) - data.TsRoundStart;
    return elapsed > 0 ? formatSeconds(elapsed, locale) : '';
  }, [data, nowMs, locale]);

  return (
    <div className="space-y-16">
      {/* 1. Allocation Breakdown */}
      <motion.div custom={0} variants={sectionFade} initial="hidden" animate="visible">
        {data && <Allocation data={data} />}
      </motion.div>

      {/* 2. Fund Distribution */}
      <motion.div custom={1} variants={sectionFade} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-6">
          <SectionDivider title={t('sections.allocationTracks.title')} className="flex-1" />
          <InfoTooltip content={t('sections.allocationTracks.tooltip')} />
        </div>
        <FundDistribution data={data ?? undefined} />
      </motion.div>

      {/* 3. Stellar Selection Entries */}
      <motion.div custom={2} variants={sectionFade} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-6">
          <SectionDivider title={t('sections.stellarSelectionEntries.title')} className="flex-1" />
          <InfoTooltip content={t('sections.stellarSelectionEntries.tooltip')} />
        </div>
        <StellarSelectionHolderTable
          list={curGestureList}
          numRaffleEthWinner={data?.NumRaffleEthWinnersBidding}
          numRaffleNFTWinner={data?.NumRaffleNFTWinnersBidding}
        />
      </motion.div>

      {/* 4. Top ETH Spenders */}
      <motion.div custom={3} variants={sectionFade} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-6">
          <SectionDivider title={t('sections.topEthSpenders.title')} className="flex-1" />
          <InfoTooltip content={t('sections.topEthSpenders.tooltip')} />
        </div>
        <ETHSpentTable list={curGestureList as ComponentProps<typeof ETHSpentTable>['list']} />
      </motion.div>

      {/* 5. Endurance Champions */}
      <motion.div custom={4} variants={sectionFade} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-6">
          <SectionDivider title={t('sections.enduranceChampions.title')} className="flex-1" />
          <InfoTooltip content={t('sections.enduranceChampions.tooltip')} />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden border-l-2 border-l-[hsl(45,93%,52%)]/40">
          <EnduranceChampionsTable
            championList={championList}
            lastBidderAddress={data?.LastBidderAddr ?? null}
          />
        </div>
      </motion.div>

      {/* 6. Gesture History */}
      <motion.div custom={5} variants={sectionFade} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-6">
          <SectionDivider
            title={t('sections.gestureHistory.title', { n: data?.CurRoundNum ?? '' })}
            className="flex-1"
          />
          <InfoTooltip content={t('sections.gestureHistory.tooltip')} />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden border-l-2 border-l-[hsl(196,98%,54%)]/40">
          <GestureHistory gestureHistory={curGestureList} showRound={false} />
        </div>
      </motion.div>

      {/* 7. ETH Contributions (conditional) */}
      {ethDonations.length > 0 && (
        <motion.div custom={6} variants={sectionFade} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-6">
            <SectionDivider title={t('sections.ethContributions.title')} className="flex-1" />
            <InfoTooltip content={t('sections.ethContributions.tooltip')} />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden border-l-2 border-l-[hsl(205,100%,71%)]/40">
            <EthDonationTable list={ethDonations} showType={false} />
          </div>
        </motion.div>
      )}

      {/* 8. Attached Tokens */}
      <motion.div custom={7} variants={sectionFade} initial="hidden" animate="visible">
        <DonatedTokensSection
          donatedNFTs={donatedNFTs}
          donatedERC20Tokens={donatedERC20Tokens}
          donatedTokensTab={donatedTokensTab}
          onTabChange={onTabChange}
          curPage={curPage}
          setCurPage={setCurPage}
          perPage={perPage}
        />
      </motion.div>

      {/* 9. Cycle Rules (collapsible) */}
      <motion.div custom={8} variants={sectionFade} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-4">
          <SectionDivider title={t('sections.cycleRules.title')} className="flex-1" />
          <InfoTooltip content={t('sections.cycleRules.tooltip')} />
        </div>
        <div className="gradient-border-card rounded-xl bg-white/[0.02]">
          <Accordion type="single" collapsible>
            <AccordionItem value="rules" className="border-b-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary/60" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('rules.howItWorks')}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>
                    {t.rich(isV3Mechanics ? 'rules.participationV3' : 'rules.participation', {
                      em: (chunks) => <span className="text-white font-medium">{chunks}</span>,
                    })}
                  </p>
                  <p>
                    {t('rules.calibration', {
                      decreasePercent:
                        protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture,
                      increasePercent:
                        protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture,
                    })}
                  </p>
                  <p>
                    {t('rules.stellarSelection', {
                      ethEntries: data?.NumRaffleEthWinnersBidding ?? '',
                      rafflePercent: data?.RafflePercentage ?? '',
                      nftEntries: data?.NumRaffleNFTWinnersBidding ?? '',
                      anchorHolders: data?.NumRaffleNFTWinnersStakingRWalk ?? '',
                    })}
                  </p>
                  <p>
                    {t('rules.publicGoods', {
                      percent: data?.CharityPercentage ?? 0,
                      amount: (
                        (Number(data?.CosmicGameBalanceEth) || 0) *
                        ((data?.CharityPercentage ?? 0) / 100)
                      ).toFixed(4),
                    })}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </motion.div>

      {/* 10. Round Summary Footer */}
      <motion.div custom={9} variants={sectionFade} initial="hidden" animate="visible">
        <div
          data-testid="round-summary-footer"
          className="gradient-border-card rounded-2xl bg-gradient-to-r from-primary/[0.04] via-accent/[0.04] to-primary/[0.04] p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t('footer.contractBalance')}
                </p>
                <p className="text-sm font-bold text-white">
                  {formatEthValue(Number(data?.CosmicGameBalanceEth) || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                <Clock className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t('footer.cycleDuration')}
                </p>
                <p className="text-sm font-bold text-white">
                  {roundDuration || t('status.notStarted')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t('footer.uniqueParticipants')}
                </p>
                <p className="text-sm font-bold text-white">{uniqueParticipants}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
