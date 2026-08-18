import { zeroAddress } from 'viem';
import { Settings2, Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';
import { formatSeconds } from '@/utils';

import { formatCstAmount } from '@/utils/cstGesture';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { CustomTextField } from '@/components/styled';
import PaginationRWLKGrid from '@/components/nft/PaginationRWLKGrid';
import { UniswapTradeButton } from '@/components/common/UniswapTradeButton';
import type { DashboardInfo } from '@/services/api/types';
import type { CSTGestureData, EthGestureInfo } from '@/hooks/useGestureForm';
import { AuctionInfo } from '@/components/home/AuctionInfo';

interface GestureFormProps {
  data: DashboardInfo | null;
  gestureType: string;
  setBidType: (value: string) => void;
  contributionType: string;
  setContributionType: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  nftDonateAddress: string;
  setNftDonateAddress: (value: string) => void;
  nftId: string;
  setNftId: (value: string) => void;
  tokenDonateAddress: string;
  setTokenDonateAddress: (value: string) => void;
  tokenAmount: string;
  setTokenAmount: (value: string) => void;
  rwlkId: number;
  setRwlkId: (value: number) => void;
  gestureCostPlus: number;
  setBidPricePlus: (value: number) => void;
  advancedExpanded: boolean;
  setAdvancedExpanded: (value: boolean) => void;
  rwlknftIds: number[];
  cstGestureData: CSTGestureData;
  ethGestureInfo: EthGestureInfo | null;
  gestureCstRewardAmount?: number | null;
  gestureCstRewardAmountMin?: number | null;
  isCstRewardLoading?: boolean;
  /**
   * V3: the entire quoted Participation CST is minted to the OUTBID previous
   * participant (the gesturer earns the next gesture's CST when someone outbids
   * them). `false` on V2 contracts — whole reward to the gesturer.
   */
  cstRewardToOutbidBidder?: boolean;
  cstRewardTolerancePercent?: number;
  setCstRewardTolerancePercent?: (value: number) => void;
  acceptAnyCstReward?: boolean;
  setAcceptAnyCstReward?: (value: boolean) => void;
  previewMode?: boolean;
}

const gestureOptions = [
  { value: 'ETH', messageKey: 'eth' },
  { value: 'RandomWalk', messageKey: 'randomWalk' },
  { value: 'CST', messageKey: 'cst' },
] as const;

const MESSAGE_MAX_LENGTH = protocolFacts.gestureMessageMaxLength;
const MESSAGE_COUNTER_WARN_AT = MESSAGE_MAX_LENGTH - 20;

function formatCompactCstDelta(value: number): string {
  return formatCstAmount(value)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
}

/** Form for making ETH or CST gestures with optional NFT/token attachment fields and RandomWalk discount. */
export function GestureForm({
  data,
  gestureType,
  setBidType,
  contributionType,
  setContributionType,
  message,
  setMessage,
  nftDonateAddress,
  setNftDonateAddress,
  nftId,
  setNftId,
  tokenDonateAddress,
  setTokenDonateAddress,
  tokenAmount,
  setTokenAmount,
  rwlkId,
  setRwlkId,
  gestureCostPlus,
  setBidPricePlus,
  advancedExpanded,
  setAdvancedExpanded,
  rwlknftIds,
  cstGestureData,
  ethGestureInfo,
  gestureCstRewardAmount = null,
  gestureCstRewardAmountMin = null,
  isCstRewardLoading = false,
  cstRewardToOutbidBidder = false,
  cstRewardTolerancePercent = 1,
  setCstRewardTolerancePercent,
  acceptAnyCstReward = false,
  setAcceptAnyCstReward,
  previewMode = false,
}: GestureFormProps) {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const showAll = data?.LastBidderAddr !== zeroAddress;
  const visibleOptions = showAll ? gestureOptions : gestureOptions.filter((o) => o.value === 'ETH');
  const currentCstGestureCost = cstGestureData.isFree ? 0 : cstGestureData.CSTPrice;
  const hasCstReward = gestureCstRewardAmount != null && Number.isFinite(gestureCstRewardAmount);
  const hasCstCost = Number.isFinite(currentCstGestureCost) && currentCstGestureCost >= 0;
  const netCstAmount =
    hasCstReward && hasCstCost ? gestureCstRewardAmount - currentCstGestureCost : null;
  const netCstLabel =
    netCstAmount == null
      ? t('form.reward.cstAmount', { amount: '--' })
      : t('form.reward.cstAmount', {
          amount: `${netCstAmount > 0 ? '+' : netCstAmount < 0 ? '-' : ''}${formatCompactCstDelta(
            Math.abs(netCstAmount),
          )}`,
        });
  const rewardPreviewTitle =
    gestureType === 'CST' ? t('form.reward.economicsTitle') : t('form.reward.previewTitle');
  const rewardPreviewDescription =
    gestureType === 'CST'
      ? t('form.reward.economicsDescription')
      : cstRewardToOutbidBidder
        ? t('form.reward.previewDescriptionV3')
        : t('form.reward.previewDescription');
  const minAcceptedCstLabel = acceptAnyCstReward
    ? t('form.reward.minAcceptedAny')
    : t('form.reward.cstAmount', { amount: formatCstAmount(gestureCstRewardAmountMin) });
  const minAcceptedCstTooltip = acceptAnyCstReward
    ? t('form.reward.minAcceptedTooltipAny')
    : t('form.reward.minAcceptedTooltip');

  return (
    <div className="mt-8 space-y-5">
      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
          {t('form.methodLabel')}
        </Label>
        <div className="flex gap-2">
          {visibleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setRwlkId(-1);
                setBidType(opt.value);
              }}
              aria-pressed={gestureType === opt.value}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2.5 text-center transition-all',
                gestureType === opt.value
                  ? 'border-primary/50 bg-primary/10 text-white'
                  : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:text-white',
              )}
            >
              <span className="block text-sm font-medium">
                {t(`form.method.${opt.messageKey}.label`)}
              </span>
              <span className="block text-[10px] mt-0.5 opacity-60">
                {t(`form.method.${opt.messageKey}.desc`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {gestureType === 'ETH' && data?.LastBidderAddr === zeroAddress && (
        <AuctionInfo
          secondsElapsed={ethGestureInfo?.SecondsElapsed ?? 0}
          auctionDuration={ethGestureInfo?.AuctionDuration ?? 0}
          title={t('calibration.firstGestureTitle')}
          subtitle={t('calibration.firstGestureSubtitle')}
        />
      )}

      {gestureType === 'RandomWalk' && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <h6 className="text-sm font-semibold">{t('form.rwlk.title')}</h6>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={t('form.rwlk.tooltipAria')}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[240px]">{t('form.rwlk.tooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <PaginationRWLKGrid
            loading={false}
            data={rwlknftIds}
            selectedToken={rwlkId}
            setSelectedToken={setRwlkId}
          />
        </div>
      )}

      {gestureType === 'CST' && (
        <div className="space-y-3">
          <AuctionInfo
            secondsElapsed={cstGestureData.SecondsElapsed}
            auctionDuration={cstGestureData.AuctionDuration}
            title={t('calibration.cstTitle')}
            subtitle={t('calibration.cstSubtitle', {
              decreasePercent: String(
                protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture,
              ),
              increasePercent: String(
                protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture,
              ),
            })}
            endedMessage={t('calibration.cstEndedMessage')}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/[0.045] p-4">
            <p className="max-w-md text-sm text-muted-foreground">{t('form.cstTrade')}</p>
            <UniswapTradeButton variant="compact" />
          </div>
        </div>
      )}

      {showAll && (
        <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {rewardPreviewTitle}
              </p>
              <p className="mt-1 text-muted-foreground">{rewardPreviewDescription}</p>
            </div>
            <div className="text-right font-mono tabular-nums">
              {gestureType === 'CST' ? (
                <div className="grid min-w-[13rem] grid-cols-2 gap-2 text-left sm:min-w-[19rem] sm:grid-cols-3">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t('form.reward.rewardLabel')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">
                      {isCstRewardLoading
                        ? tCommon('status.loadingDots')
                        : t('form.reward.cstAmount', {
                            amount: formatCstAmount(gestureCstRewardAmount),
                          })}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t('form.reward.costLabel')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {t('form.reward.cstAmount', {
                        amount: formatCstAmount(currentCstGestureCost),
                      })}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 sm:col-span-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t('form.reward.netLabel')}
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-sm font-semibold',
                        netCstAmount != null && netCstAmount > 0
                          ? 'text-emerald-300'
                          : netCstAmount != null && netCstAmount < 0
                            ? 'text-amber-200'
                            : 'text-muted-foreground',
                      )}
                    >
                      {isCstRewardLoading ? tCommon('status.loadingDots') : netCstLabel}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-base font-semibold text-emerald-300">
                  {isCstRewardLoading
                    ? tCommon('status.loadingDots')
                    : t('form.reward.cstAmount', {
                        amount: formatCstAmount(gestureCstRewardAmount),
                      })}
                </p>
              )}
              {cstRewardToOutbidBidder && !isCstRewardLoading && hasCstReward && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('form.reward.goesToOutbid')}
                </p>
              )}
              <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <span>{t('form.reward.minAccepted', { value: minAcceptedCstLabel })}</span>
                <InfoTooltip
                  content={minAcceptedCstTooltip}
                  ariaLabel={t('form.reward.minAcceptedAria')}
                  maxWidth={320}
                  side="top"
                  className="text-muted-foreground/60"
                />
              </p>
              {gestureType === 'CST' && !isCstRewardLoading && netCstAmount != null && (
                <p
                  className={cn(
                    'mt-1 text-xs',
                    netCstAmount > 0 ? 'text-emerald-300' : 'text-muted-foreground',
                  )}
                >
                  {netCstAmount > 0 ? t('form.reward.netPositive') : t('form.reward.netNegative')}
                </p>
              )}
            </div>
          </div>
          {gestureType === 'CST' &&
            cstGestureData.source === 'contract' &&
            cstGestureData.apiAuctionDuration != null &&
            cstGestureData.apiAuctionDuration !== cstGestureData.AuctionDuration && (
              <p className="mt-3 text-xs text-amber-200/90">
                {t('form.reward.durationMismatch', {
                  contractDuration: formatSeconds(cstGestureData.AuctionDuration, locale),
                  apiDuration: formatSeconds(cstGestureData.apiAuctionDuration, locale),
                })}
              </p>
            )}
        </div>
      )}

      {previewMode && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-4 text-sm leading-relaxed text-muted-foreground">
          {t('form.preview')}
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        value={advancedExpanded ? 'advanced' : ''}
        onValueChange={(val) => !previewMode && setAdvancedExpanded(val === 'advanced')}
      >
        <AccordionItem value="advanced" className="border-white/[0.06]">
          <AccordionTrigger
            disabled={previewMode}
            className="text-sm text-muted-foreground hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              {t('form.advanced.title')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 max-w-xl">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('form.advanced.messageLabel')}{' '}
                    <span className="normal-case tracking-normal opacity-50">
                      {t('form.advanced.messageOptionalHint', {
                        maxLength: String(MESSAGE_MAX_LENGTH),
                      })}
                    </span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={t('form.advanced.messageTooltipAria')}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-muted-foreground transition-colors hover:border-primary/25 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[260px]">{t('form.advanced.messageTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <textarea
                  placeholder={t('form.advanced.messagePlaceholder')}
                  value={message}
                  maxLength={MESSAGE_MAX_LENGTH}
                  rows={3}
                  disabled={previewMode}
                  className="w-full flex min-h-[72px] rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="mt-1.5 flex justify-end">
                  <span
                    data-testid="gesture-message-char-count"
                    className={cn(
                      'text-xs tabular-nums',
                      message.length >= MESSAGE_COUNTER_WARN_AT
                        ? 'text-amber-300'
                        : 'text-muted-foreground/60',
                    )}
                  >
                    {message.length}/{MESSAGE_MAX_LENGTH}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('form.advanced.attachIntro')}</p>
              {showAll && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('form.advanced.minCstProtection.title')}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t(
                      isV3Mechanics
                        ? 'form.advanced.minCstProtection.bodyV3'
                        : 'form.advanced.minCstProtection.body',
                    )}
                  </p>
                  <label className="flex items-start gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                    <Checkbox
                      checked={acceptAnyCstReward}
                      disabled={previewMode || !setAcceptAnyCstReward}
                      onChange={(e) => setAcceptAnyCstReward?.(e.currentTarget.checked)}
                      aria-label={t('form.advanced.minCstProtection.acceptAnyAria')}
                    />
                    <span>
                      <span className="block font-medium text-foreground">
                        {t('form.advanced.minCstProtection.acceptAnyTitle')}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {t('form.advanced.minCstProtection.acceptAnyBody')}
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('form.advanced.minCstProtection.toleranceLabel')}
                      </span>
                      <div className="relative w-[4.75rem] shrink-0">
                        <CustomTextField
                          type="number"
                          placeholder="1"
                          value={cstRewardTolerancePercent}
                          min={0}
                          max={100}
                          step={0.1}
                          className="h-9 px-2.5 py-2 pr-7 text-sm tabular-nums"
                          disabled={
                            acceptAnyCstReward || previewMode || !setCstRewardTolerancePercent
                          }
                          onChange={(e) => setCstRewardTolerancePercent?.(Number(e.target.value))}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">
                          %
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground tabular-nums min-w-0">
                      {t('form.advanced.minCstProtection.minAmount', {
                        amount: formatCstAmount(gestureCstRewardAmountMin),
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('form.advanced.minCstProtection.revertNote')}
                  </p>
                </div>
              )}
              <RadioGroup
                value={contributionType}
                onValueChange={(value) => {
                  setRwlkId(-1);
                  setContributionType(value);
                }}
                className="flex flex-row flex-wrap gap-x-4 gap-y-2"
              >
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <RadioGroupItem value="NFT" />
                  <span className="text-sm">{t('form.advanced.attachNft')}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <RadioGroupItem value="Token" />
                  <span className="text-sm">{t('form.advanced.attachToken')}</span>
                </label>
              </RadioGroup>
              {contributionType === 'Token' && (
                <div className="space-y-3">
                  <div className="min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {t('form.advanced.tokenContractLabel')}
                    </Label>
                    <Input
                      placeholder="0x..."
                      value={tokenDonateAddress}
                      onChange={(e) => setTokenDonateAddress(e.target.value)}
                      disabled={previewMode}
                      className="w-full max-w-md font-mono text-sm"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                  <div className="w-full max-w-[11rem]">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {t('form.advanced.tokenAmountLabel')}
                    </Label>
                    <Input
                      placeholder="0.0"
                      type="number"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      disabled={previewMode}
                      className="font-mono text-sm tabular-nums"
                    />
                  </div>
                </div>
              )}
              {contributionType === 'NFT' && (
                <div className="space-y-3">
                  <div className="min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {t('form.advanced.nftContractLabel')}
                    </Label>
                    <Input
                      placeholder="0x..."
                      value={nftDonateAddress}
                      onChange={(e) => setNftDonateAddress(e.target.value)}
                      disabled={previewMode}
                      className="w-full max-w-md font-mono text-sm"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                  <div className="w-full max-w-[7.5rem]">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {t('form.advanced.nftIdLabel')}
                    </Label>
                    <Input
                      placeholder={t('form.advanced.nftIdPlaceholder')}
                      type="number"
                      min={0}
                      value={nftId}
                      onChange={(e) => setNftId(e.target.value)}
                      disabled={previewMode}
                      className="font-mono text-sm tabular-nums"
                    />
                  </div>
                </div>
              )}
              {gestureType !== 'CST' && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('form.advanced.collision.title')}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('form.advanced.collision.raiseBy')}
                      </span>
                      <div className="relative w-[4.25rem] shrink-0">
                        <CustomTextField
                          type="number"
                          placeholder="0"
                          value={gestureCostPlus}
                          min={0}
                          max={50}
                          className="h-9 px-2.5 py-2 pr-7 text-sm tabular-nums"
                          disabled={previewMode}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value <= 50) setBidPricePlus(value);
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">
                          %
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground tabular-nums min-w-0">
                      {t('form.advanced.collision.approxCost', {
                        amount: (
                          (ethGestureInfo?.ETHPrice ?? 0) *
                          (1 + gestureCostPlus / 100) *
                          (gestureType === 'RandomWalk' ? 0.5 : 1)
                        ).toFixed(6),
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('form.advanced.collision.note', { percent: String(gestureCostPlus) })}
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
