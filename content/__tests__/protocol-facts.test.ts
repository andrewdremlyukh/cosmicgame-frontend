import { contractMechanicsVersion, cstRewardFacts, protocolFacts } from '@/content/protocol-facts';

/**
 * Deployed Solidity constants these facts are derived from
 * (contracts verified exact-match on Sourcify, chain 42161):
 * - INITIAL_MAIN_PRIZE_TIME_INCREMENT = 1 hours
 * - DEFAULT_BID_CST_REWARD_AMOUNT_MULTIPLIER =
 *     3 * (1 ether)^2 * INITIAL_MAIN_PRIZE_TIME_INCREMENT * MICROSECONDS_PER_SECOND
 * - DEFAULT_CST_DUTCH_AUCTION_DURATION_CHANGE_DIVISOR = 250
 * - DEFAULT_TIMEOUT_DURATION_TO_CLAIM_MAIN_PRIZE_V2 = 2 days
 * - DEFAULT_TIMEOUT_DURATION_TO_WITHDRAW_PRIZES = 5 weeks
 * - RANDOMWALK_NFT_BID_PRICE_DIVISOR = 2
 * - DEFAULT_MAIN_PRIZE_TIME_INCREMENT_INCREASE_DIVISOR = 100
 * - DEFAULT_ETH_BID_PRICE_INCREASE_DIVISOR = 100
 * - DEFAULT_ETH_DUTCH_AUCTION_ENDING_BID_PRICE_DIVISOR = 200
 * - DEFAULT_CST_DUTCH_AUCTION_BEGINNING_BID_PRICE_MIN_LIMIT = 200 ether
 * - DEFAULT_BID_MESSAGE_LENGTH_MAX_LIMIT = 280
 * - FIRST_ROUND_INITIAL_ETH_BID_PRICE = 0.0001 ether
 * - DAO: votingDelay = 2 days, votingPeriod = 2 weeks,
 *        proposalThreshold = 100 ether, quorum fraction = 3%
 */

const HOURS_PER_DAY = 24;
const SECONDS_PER_WEEK = 7 * 24 * 3600;

/** Integer square root over BigInt (same floor semantics as OZ Math.sqrt). */
function bigintSqrt(value: bigint): bigint {
  if (value < 0n) throw new Error('negative radicand');
  if (value < 2n) return value;
  let x0 = value / 2n;
  let x1 = (x0 + value / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) / 2n;
  }
  return x0;
}

describe('protocolFacts', () => {
  it('matches deployed per-cycle NFT and CST imprint totals', () => {
    expect(protocolFacts.typicalNftsPerCycle).toBe(
      protocolFacts.roleNftsPerCycle + protocolFacts.stellarNftsPerCycle,
    );
    expect(protocolFacts.stellarNftsPerCycle).toBe(
      protocolFacts.nftStellarSelectionRecipients +
        protocolFacts.anchoredRwlkNftSelectionRecipients,
    );
    expect(protocolFacts.typicalCstImprintsPerCycle).toBe(
      protocolFacts.typicalNftsPerCycle * protocolFacts.specialAllocationCst +
        protocolFacts.outreachReserveCst,
    );
  });

  it('allocation percentages plus the compounding reserve account for the whole Cycle Reserve', () => {
    const distributed =
      protocolFacts.mainEthPercentage +
      protocolFacts.chronoWarriorEthPercentage +
      protocolFacts.stellarSelectionEthPercentage +
      protocolFacts.anchorDistributionPercentage +
      protocolFacts.publicGoodsPercentage;
    expect(distributed + protocolFacts.compoundingReservePercentage).toBe(100);
  });

  it('CST Calibration Window change percentages derive from the on-chain divisor', () => {
    const divisor = protocolFacts.cstCalibrationWindowChangeDivisor;
    // Lengthen per CST gesture: duration += duration / divisor  ->  +100/divisor %.
    expect(protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture).toBe(100 / divisor);
    // Shorten per ETH gesture: duration = (duration + 1) * divisor / (divisor + 1)
    //   ->  about -100/(divisor + 1) %, quoted to 3 decimals.
    const expectedDecrease = Number((100 / (divisor + 1)).toFixed(3));
    expect(protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture).toBe(expectedDecrease);
  });

  it('dynamic CST examples match the contract formula at the stated launch parameters', () => {
    // radicand = elapsedSeconds * bidCstRewardAmountMultiplier / mainPrizeTimeIncrementInMicroSeconds
    // At launch, multiplier = 3 * (1e18)^2 * incrementMicroseconds, so the
    // increment cancels and radicand = elapsedSeconds * 3 * 1e36 exactly.
    expect(protocolFacts.dynamicCstRewardExamplesAssumeIncrementHours).toBe(
      protocolFacts.initialCycleTimeIncrementHours,
    );

    const WEI_PER_CST = 10n ** 18n;
    const THREE_E36 = 3n * 10n ** 36n;
    const elapsedSeconds: Record<string, bigint> = {
      '0 seconds': 0n,
      '1 second': 1n,
      '60 seconds': 60n,
      '1 hour': 3600n,
      '1 day': 86400n,
    };

    for (const example of protocolFacts.dynamicCstRewardExamples) {
      const elapsed = elapsedSeconds[example.elapsed];
      expect(elapsed).toBeDefined();
      const rewardWei = bigintSqrt(elapsed! * THREE_E36);
      const rewardCst = Number(rewardWei) / Number(WEI_PER_CST);
      const quoted = Number(example.cst);
      if (quoted === 0) {
        expect(rewardCst).toBe(0);
      } else {
        // Quoted examples are rounded for prose; allow 1% relative tolerance.
        expect(Math.abs(rewardCst - quoted) / quoted).toBeLessThan(0.01);
      }
    }
  });

  it('V3 dynamic CST examples match the linear accrual at the stated launch parameters', () => {
    // V3 accrues linearly: INITIAL_BID_CST_REWARD_AMOUNT_PER_MINUTE = 1 ether
    // (exactly 1 CST per minute at launch; CosmicSignatureConstants.sol).
    const elapsedSeconds: Record<string, number> = {
      '0 seconds': 0,
      '1 second': 1,
      '60 seconds': 60,
      '1 hour': 3600,
      '1 day': 86400,
    };
    const cstPerSecond = protocolFacts.v3.dynamicCstRewardPerMinuteAtLaunch / 60;

    for (const example of protocolFacts.v3.dynamicCstRewardExamples) {
      const elapsed = elapsedSeconds[example.elapsed];
      expect(elapsed).toBeDefined();
      const rewardCst = elapsed! * cstPerSecond;
      const quoted = Number(example.cst.replace(/,/g, ''));
      expect(Number.isNaN(quoted)).toBe(false);
      if (quoted === 0) {
        expect(rewardCst).toBe(0);
      } else {
        // Quoted examples are rounded for prose; allow 2% relative tolerance.
        expect(Math.abs(rewardCst - quoted) / quoted).toBeLessThan(0.02);
      }
    }
  });

  it('cstRewardFacts follows the configured contract mechanics version', () => {
    // Production copy describes V2 until the proxy upgrade lands
    // (flip contractMechanicsVersion / NEXT_PUBLIC_CONTRACT_MECHANICS_VERSION on upgrade day).
    if (contractMechanicsVersion === 3) {
      expect(cstRewardFacts.curve).toBe('linear');
      expect(cstRewardFacts.formula).toBe(protocolFacts.v3.dynamicCstRewardFormula);
      expect(cstRewardFacts.examples).toBe(protocolFacts.v3.dynamicCstRewardExamples);
    } else {
      expect(contractMechanicsVersion).toBe(2);
      expect(cstRewardFacts.curve).toBe('sqrt');
      expect(cstRewardFacts.formula).toBe(protocolFacts.dynamicCstRewardFormula);
      expect(cstRewardFacts.examples).toBe(protocolFacts.dynamicCstRewardExamples);
    }
  });

  it('timeouts match the deployed V2 configuration', () => {
    // timeoutDurationToClaimMainPrize (V2) = 2 days = 48 hours.
    expect(protocolFacts.finalGestureExclusivityHours).toBe(2 * HOURS_PER_DAY);
    // PrizesWallet.timeoutDurationToWithdrawPrizes = 5 weeks = 3,024,000 seconds.
    expect(protocolFacts.secondaryRetrievalTimeoutWeeks * SECONDS_PER_WEEK).toBe(3_024_000);
  });

  it('cost mechanics match the deployed divisors', () => {
    // RANDOMWALK_NFT_BID_PRICE_DIVISOR = 2  ->  50% reduction.
    expect(protocolFacts.randomWalkDiscountPercentage).toBe(100 / 2);
    // Increase divisors of 100  ->  1% steps.
    expect(protocolFacts.ethGestureCostStepUpPercent).toBe(100 / 100);
    expect(protocolFacts.cycleTimeIncrementIncreasePercentPerCycle).toBe(100 / 100);
    // ETH Calibration floor divisor (100 * beginning-bid multiplier 2).
    expect(protocolFacts.ethCalibrationFloorDivisor).toBe(200);
    expect(protocolFacts.ethCalibrationCeilingMultiplier).toBe(2);
    expect(protocolFacts.cstCalibrationCeilingMultiplier).toBe(2);
    expect(protocolFacts.cstCalibrationCeilingMinCst).toBe(200);
    expect(protocolFacts.cstCalibrationFloorCst).toBe(0);
    expect(protocolFacts.initialGestureCostEth).toBe(0.0001);
    expect(protocolFacts.gestureMessageMaxLength).toBe(280);
  });

  it('Cosmic Council parameters match the deployed CosmicSignatureDao', () => {
    expect(protocolFacts.councilVotingDelayDays).toBe(2);
    expect(protocolFacts.councilVotingPeriodWeeks).toBe(2);
    expect(protocolFacts.councilProposalThresholdCst).toBe(100);
    expect(protocolFacts.councilQuorumPercent).toBe(3);
  });

  it('anchoring is documented as once-per-NFT', () => {
    expect(protocolFacts.anchoringOncePerNft).toBe(true);
  });

  it('contract addresses are well-formed, checksummed-shaped, and unique', () => {
    const addresses = Object.values(protocolFacts.contractAddresses);
    expect(addresses.length).toBeGreaterThanOrEqual(11);
    for (const address of addresses) {
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
    expect(new Set(addresses.map((a) => a.toLowerCase())).size).toBe(addresses.length);
  });

  it('keeps the documented next-cycle delay labeled as a default, not a live value', () => {
    // The live delayDurationBeforeRoundActivation is on-chain and owner-set;
    // this fact only records the Solidity default (30 minutes).
    expect(protocolFacts.defaultNextCycleDelayMinutes).toBe(30);
    expect('nextCycleDelayMinutes' in protocolFacts).toBe(false);
  });
});
