import {
  getHowItWorksContent,
  howItWorksContentEn,
  howItWorksContentZh,
} from '@/content/how-it-works';
import {
  cstRewardFacts,
  ethDistributionFacts,
  isV3Mechanics,
  protocolFacts,
} from '@/content/protocol-facts';

describe('how-it-works content', () => {
  it('selects the requested locale', () => {
    expect(getHowItWorksContent('en')).toBe(howItWorksContentEn);
    expect(getHowItWorksContent('zh-Hans')).toBe(howItWorksContentZh);
  });

  it('keeps routing destinations locale-invariant', () => {
    expect(howItWorksContentZh.metadata.path).toBe(howItWorksContentEn.metadata.path);
    expect(howItWorksContentZh.hero.primaryCta.href).toBe(howItWorksContentEn.hero.primaryCta.href);
    expect(howItWorksContentZh.hero.secondaryCta.href).toBe(
      howItWorksContentEn.hero.secondaryCta.href,
    );
    expect(howItWorksContentZh.faqCallout.cta.href).toBe(howItWorksContentEn.faqCallout.cta.href);
    expect(howItWorksContentZh.callToAction.primaryCta.href).toBe(
      howItWorksContentEn.callToAction.primaryCta.href,
    );
    expect(howItWorksContentZh.callToAction.discordCta.href).toBe(
      howItWorksContentEn.callToAction.discordCta.href,
    );
    expect(howItWorksContentZh.callToAction.twitterCta.href).toBe(
      howItWorksContentEn.callToAction.twitterCta.href,
    );
  });

  it('provides complete Chinese prose and metadata', () => {
    expect(howItWorksContentZh.metadata.title).toMatch(/[\u3400-\u9fff]/);
    expect(howItWorksContentZh.metadata.description).toMatch(/[\u3400-\u9fff]/);
    expect(howItWorksContentZh.hero.paragraph).toMatch(/[\u3400-\u9fff]/);
    expect(JSON.stringify(howItWorksContentZh)).toMatch(/[\u3400-\u9fff]/);
  });

  it('keeps section structure parity between locales', () => {
    expect(howItWorksContentZh.overview.cards).toHaveLength(
      howItWorksContentEn.overview.cards.length,
    );
    expect(howItWorksContentZh.rewardBreakdown.items).toHaveLength(
      howItWorksContentEn.rewardBreakdown.items.length,
    );
    expect(howItWorksContentZh.gameCycle.phases).toHaveLength(
      howItWorksContentEn.gameCycle.phases.length,
    );
    expect(howItWorksContentZh.stepByStep.steps).toHaveLength(
      howItWorksContentEn.stepByStep.steps.length,
    );
    expect(howItWorksContentZh.stepByStep.steps.map((step) => step.highlights.length)).toEqual(
      howItWorksContentEn.stepByStep.steps.map((step) => step.highlights.length),
    );
    expect(howItWorksContentZh.proTips.tips).toHaveLength(howItWorksContentEn.proTips.tips.length);
  });

  it('exposes the expected section sizes', () => {
    expect(howItWorksContentEn.overview.cards).toHaveLength(3);
    expect(howItWorksContentEn.rewardBreakdown.items).toHaveLength(4);
    expect(howItWorksContentEn.gameCycle.phases).toHaveLength(6);
    expect(howItWorksContentEn.stepByStep.steps).toHaveLength(3);
    expect(howItWorksContentEn.proTips.tips).toHaveLength(6);
  });
});

describe('how-it-works protocol-fact interpolation', () => {
  it('derives the calibration-window figures from protocolFacts', () => {
    expect(howItWorksContentEn.gameCycle.phases[0].description).toContain(
      `${protocolFacts.initialCstCalibrationWindowHours}-hour`,
    );
    if (isV3Mechanics) {
      // V3 retired the per-gesture drift: the window restarts at 2x the paid price.
      expect(howItWorksContentEn.gameCycle.phases[1].description).toContain(
        'restarts the CST Calibration Window at twice the price it paid',
      );
      expect(howItWorksContentEn.proTips.tips[5].tooltip).toContain(
        'restarts the CST Calibration Window at twice the price it paid',
      );
    } else {
      expect(howItWorksContentEn.gameCycle.phases[1].description).toContain(
        `about ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}% down or ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}% up`,
      );
      expect(howItWorksContentEn.proTips.tips[5].tooltip).toContain(
        `by about ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%`,
      );
    }
  });

  it('quotes the version-appropriate dynamic Participation CST formula', () => {
    // V2 copy quotes the sqrt formula; V3 copy quotes the linear one
    // (isV3Mechanics flips with contractMechanicsVersion on upgrade day).
    expect(howItWorksContentEn.rewardBreakdown.items[0].tooltip).toContain(
      isV3Mechanics ? 'linear formula' : 'square-root formula',
    );
  });

  it('derives the allocation percentages and CST amounts from protocolFacts', () => {
    expect(howItWorksContentEn.overview.cards[2].tooltip).toContain(
      `${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve`,
    );
    expect(howItWorksContentEn.rewardBreakdown.items[1].tooltip).toContain(
      `${ethDistributionFacts.stellarSelectionEthPercentage}% of the Cycle Reserve`,
    );
    expect(howItWorksContentEn.rewardBreakdown.items[3].description).toContain(
      `${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve in ETH, ${protocolFacts.specialAllocationCst.toLocaleString()} CST`,
    );
    expect(howItWorksContentEn.gameCycle.phases[4].description).toContain(
      `${protocolFacts.specialAllocationCst.toLocaleString()} CST`,
    );
  });

  it('derives the exclusivity window and Random Walk reduction from protocolFacts', () => {
    expect(howItWorksContentEn.gameCycle.phases[2].tooltip).toContain(
      `${protocolFacts.finalGestureExclusivityHours}-hour exclusive finalization window`,
    );
    expect(howItWorksContentEn.overview.cards[0].tooltip).toContain(
      `${protocolFacts.randomWalkDiscountPercentage}% ETH Gesture Cost reduction`,
    );
    expect(howItWorksContentEn.stepByStep.steps[2].highlights[0]).toContain(
      `${protocolFacts.randomWalkDiscountPercentage}% ETH Gesture Cost reduction`,
    );
    expect(howItWorksContentEn.proTips.tips[1].description).toContain(
      `${protocolFacts.randomWalkDiscountPercentage}% ETH Gesture Cost reduction`,
    );
  });

  it('quotes the dynamic Participation CST formula from protocolFacts', () => {
    expect(howItWorksContentEn.rewardBreakdown.items[0].tooltip).toContain(cstRewardFacts.formula);
  });

  it('interpolates the same protocolFacts into the Chinese copy', () => {
    expect(howItWorksContentZh.overview.cards[2].tooltip).toContain(
      `${ethDistributionFacts.mainEthPercentage}%`,
    );
    expect(howItWorksContentZh.gameCycle.phases[0].description).toContain(
      `${protocolFacts.initialCstCalibrationWindowHours} 小时`,
    );
    if (isV3Mechanics) {
      expect(howItWorksContentZh.gameCycle.phases[1].description).toContain('两倍');
    } else {
      expect(howItWorksContentZh.gameCycle.phases[1].description).toContain(
        `${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%`,
      );
    }
    expect(howItWorksContentZh.gameCycle.phases[2].tooltip).toContain(
      `${protocolFacts.finalGestureExclusivityHours} 小时`,
    );
    expect(howItWorksContentZh.rewardBreakdown.items[0].tooltip).toContain(cstRewardFacts.formula);
    expect(howItWorksContentZh.rewardBreakdown.items[3].description).toContain(
      `${protocolFacts.specialAllocationCst.toLocaleString()} CST`,
    );
    expect(howItWorksContentZh.stepByStep.steps[2].highlights[0]).toContain(
      `${protocolFacts.randomWalkDiscountPercentage}%`,
    );
  });
});
