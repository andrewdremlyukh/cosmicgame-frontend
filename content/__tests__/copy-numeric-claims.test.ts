import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import { faqContentEn, faqContentZh, getAllFaqItems } from '@/content/faq';
import { landingContentEn, landingContentZh } from '@/content/landing';
import { learnContentEn, learnContentZh } from '@/content/learn';
import { protocolFacts } from '@/content/protocol-facts';

/**
 * Cross-copy numeric drift guard.
 *
 * Extracts protocol-mechanics tokens (percentages, hour/week durations, CST
 * amounts) from every centralized copy source and asserts each one is
 * derivable from `protocolFacts` (or explicitly allowlisted as a
 * non-protocol number). If a percentage or duration is reworded or a new one
 * is introduced, this test forces it through the verified facts module
 * instead of hardcoded prose.
 */

interface CopySource {
  name: string;
  text: string;
}

const readPublicFile = (fileName: string) =>
  readFileSync(join(process.cwd(), 'public', fileName), 'utf8');

/** Concatenated message catalogs for a locale (messages/<locale>/*.json). */
const readMessageCatalogs = (locale: string) => {
  const dir = join(process.cwd(), 'messages', locale);
  return readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => readFileSync(join(dir, fileName), 'utf8'))
    .join('\n');
};

const sources: CopySource[] = [
  {
    name: 'faq-en',
    text: getAllFaqItems(faqContentEn)
      .map((item) => `${item.question} ${item.answer}`)
      .join('\n'),
  },
  {
    name: 'faq-zh',
    text: getAllFaqItems(faqContentZh)
      .map((item) => `${item.question} ${item.answer}`)
      .join('\n'),
  },
  { name: 'landing-en', text: JSON.stringify(landingContentEn) },
  { name: 'landing-zh', text: JSON.stringify(landingContentZh) },
  { name: 'learn-en', text: JSON.stringify(learnContentEn.articles) },
  { name: 'learn-zh', text: JSON.stringify(learnContentZh.articles) },
  { name: 'messages-en', text: readMessageCatalogs('en') },
  { name: 'messages-zh', text: readMessageCatalogs('zh') },
  { name: 'llms.txt', text: readPublicFile('llms.txt') },
  { name: 'llms-full.txt', text: readPublicFile('llms-full.txt') },
];

const allowedPercents = new Set<number>([
  // Chart prose uses the neutral zero boundary ("no activity shows 0%").
  0,
  protocolFacts.mainEthPercentage,
  protocolFacts.chronoWarriorEthPercentage,
  protocolFacts.stellarSelectionEthPercentage,
  protocolFacts.anchorDistributionPercentage,
  protocolFacts.publicGoodsPercentage,
  protocolFacts.compoundingReservePercentage,
  protocolFacts.randomWalkDiscountPercentage,
  protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture,
  protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture,
  protocolFacts.cycleTimeIncrementIncreasePercentPerCycle,
  protocolFacts.ethGestureCostStepUpPercent,
  protocolFacts.councilQuorumPercent,
]);

const allowedHourFigures = new Set<number>([
  protocolFacts.initialCstCalibrationWindowHours,
  protocolFacts.finalGestureExclusivityHours,
  protocolFacts.initialCycleFinalizationHoursAtLaunch,
  protocolFacts.initialCycleTimeIncrementHours,
]);

const allowedWeekFigures = new Set<number>([
  protocolFacts.secondaryRetrievalTimeoutWeeks,
  protocolFacts.councilVotingPeriodWeeks,
]);

const allowedDayFigures = new Set<number>([
  protocolFacts.councilVotingDelayDays,
  // "1 day" appears as a dynamic-CST elapsed-time example and as the
  // approximate initial Cycle Finalization Time at launch.
  1,
]);

const allowedCstAmounts = new Set<number>([
  protocolFacts.specialAllocationCst,
  protocolFacts.outreachReserveCst,
  protocolFacts.typicalCstImprintsPerCycle,
  // NFT-paired CST subtotal quoted in the llms docs (24 x 1,000).
  protocolFacts.typicalNftsPerCycle * protocolFacts.specialAllocationCst,
  protocolFacts.cstCalibrationCeilingMinCst,
  protocolFacts.cstCalibrationFloorCst,
  protocolFacts.councilProposalThresholdCst,
  // Worked examples of the dynamic Participation CST formula (V2 sqrt and V3 linear).
  ...protocolFacts.dynamicCstRewardExamples.map((example) => Number(example.cst)),
  ...protocolFacts.v3.dynamicCstRewardExamples.map((example) =>
    Number(example.cst.replace(/,/g, '')),
  ),
  // V3 linear accrual rate ("about 1 CST per minute at launch").
  protocolFacts.v3.dynamicCstRewardPerMinuteAtLaunch,
]);

function parseNumber(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

function collect(text: string, pattern: RegExp): Array<{ value: number; context: string }> {
  const hits: Array<{ value: number; context: string }> = [];
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    hits.push({
      value: parseNumber(match[1]!),
      context: text.slice(Math.max(0, index - 60), index + 60).replace(/\s+/g, ' '),
    });
  }
  return hits;
}

function assertAllowed(
  source: string,
  hits: Array<{ value: number; context: string }>,
  allowed: ReadonlySet<number>,
  kind: string,
): void {
  for (const hit of hits) {
    if (!allowed.has(hit.value)) {
      throw new Error(
        `${source}: ${kind} "${hit.value}" is not derived from protocolFacts.\n` +
          `Context: …${hit.context}…\n` +
          `Add the underlying fact to content/protocol-facts.ts (verified against ` +
          `the deployed contracts) instead of hardcoding the number in copy.`,
      );
    }
  }
}

describe('copy numeric claims stay pinned to protocolFacts', () => {
  it.each(sources)('$name: every percentage is in the verified allowlist', ({ name, text }) => {
    assertAllowed(name, collect(text, /(\d+(?:\.\d+)?)%/g), allowedPercents, 'percentage');
  });

  it.each(sources)('$name: every "N hours" figure is verified', ({ name, text }) => {
    assertAllowed(
      name,
      collect(text, /(\d+(?:\.\d+)?)[- ]hours?\b/gi),
      allowedHourFigures,
      'hour figure',
    );
  });

  it.each(sources)('$name: every "N weeks" figure is verified', ({ name, text }) => {
    assertAllowed(
      name,
      collect(text, /(\d+(?:\.\d+)?)[- ]weeks?\b/gi),
      allowedWeekFigures,
      'week figure',
    );
  });

  it.each(sources)('$name: every "N days" figure is verified', ({ name, text }) => {
    assertAllowed(
      name,
      collect(text, /(\d+(?:\.\d+)?)[- ]days?\b/gi),
      allowedDayFigures,
      'day figure',
    );
  });

  it.each(sources)('$name: every "N CST" amount is verified', ({ name, text }) => {
    assertAllowed(
      name,
      collect(text, /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s+CST\b/g),
      allowedCstAmounts,
      'CST amount',
    );
  });

  it('the key deployed percentages are actually present in the public docs', () => {
    // Guards against accidental deletion: llms.txt must keep quoting the
    // allocation split so crawlers see the verified numbers.
    const llms = readPublicFile('llms.txt');
    for (const percent of [
      protocolFacts.mainEthPercentage,
      protocolFacts.chronoWarriorEthPercentage,
      protocolFacts.stellarSelectionEthPercentage,
      protocolFacts.anchorDistributionPercentage,
      protocolFacts.publicGoodsPercentage,
    ]) {
      expect(llms).toContain(`${percent}%`);
    }
  });
});
