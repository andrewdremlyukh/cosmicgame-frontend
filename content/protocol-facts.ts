/**
 * Frontend-facing protocol facts verified against the deployed Arbitrum One
 * contract configuration and production Solidity defaults.
 *
 * Source of truth:
 * - Proxy: 0x6a714Ae7B5b6eA520F6BCA23d2E609C4Fd5863F2
 * - Implementation (CosmicSignatureGameV2): 0x50eB3d05d2C463949DE9238D419385594f7AdB97
 * - Sourcify match: "perfect" for chain 42161 (all contracts below are
 *   exact-match verified)
 * - Live values cross-checked with `scripts/audit-protocol-facts.ts`
 *
 * Typical per-cycle imprint totals:
 * - 24 Cosmic Signature NFTs = 4 role NFTs + 10 participant Stellar NFTs
 *   + 10 anchored-RWLK Stellar NFTs.
 * - 27,000 fixed CST = 24 NFT-paired 1,000 CST imprints + 3,000 CST outreach.
 *   Dynamic per-gesture CST imprints are additional and depend on gesture timing.
 *
 * Values named `...AtLaunch` or documented as "Solidity default" describe the
 * deployment-time configuration. The live values are stored on-chain and can
 * change (the time increment grows 1% per cycle automatically; several
 * parameters are owner-configurable between cycles). UI surfaces should
 * prefer live contract/API reads and use these facts as verified defaults.
 */
export const protocolFacts = {
  contractAddresses: {
    proxy: '0x6a714Ae7B5b6eA520F6BCA23d2E609C4Fd5863F2',
    implementation: '0x50eB3d05d2C463949DE9238D419385594f7AdB97',
    cstToken: '0xAD91843e6A58Ba560F577E676986AFb1dba6FBA0',
    cosmicSignatureNft: '0xbb84Be3500A63581d3F2d5AC3bdF8685AAedad25',
    randomWalkNft: '0x895a6F444BE4ba9d124F61DF736605792B35D66b',
    cosmicCouncil: '0xF3D52E1c681949be7E624778dB13DaD7F8c729db',
    publicGoodsVault: '0x96bB0ADB414d5350f435E52f94946B6C7A0760a9',
    outreachReserve: '0xa3802c799f5e3D3D3562A9B513a41C6aAF92e25e',
    allocationsWallet: '0xE1b619e9B39ea4109D2F429Ea5eAA307759b0011',
    cosmicSignatureNftAnchoringWallet: '0x6308A405B4FF1eA890870Efe2a6D036750B81F7C',
    rwlkAnchoringWallet: '0x5EB3396092841E6c5b0b51141699F6711E830529',
  },
  mainEthPercentage: 25,
  chronoWarriorEthPercentage: 8,
  stellarSelectionEthPercentage: 4,
  anchorDistributionPercentage: 6,
  publicGoodsPercentage: 7,
  ethStellarSelectionRecipients: 3,
  nftStellarSelectionRecipients: 10,
  anchoredRwlkNftSelectionRecipients: 10,
  dynamicCstRewardFormula:
    'floor(sqrt(elapsedSinceLastGesture * bidCstRewardAmountMultiplier / mainPrizeTimeIncrementInMicroSeconds))',
  /**
   * Computed at the launch parameters (time increment = exactly 1 hour).
   * The increment grows 1% per cycle, so live amounts drift slightly lower
   * over time; the app preview and the contract are the source of truth.
   */
  dynamicCstRewardExamples: [
    { elapsed: '0 seconds', cst: '0' },
    { elapsed: '1 second', cst: '1.73' },
    { elapsed: '60 seconds', cst: '13.4' },
    { elapsed: '1 hour', cst: '104' },
    { elapsed: '1 day', cst: '509' },
  ],
  dynamicCstRewardExamplesAssumeIncrementHours: 1,
  initialCstCalibrationWindowHours: 12,
  cstCalibrationWindowChangeDivisor: 250,
  cstCalibrationWindowIncreasePercentPerCstGesture: 0.4,
  cstCalibrationWindowDecreasePercentPerEthGesture: 0.398,
  /** CST Calibration Window ceiling = 2x the last CST Gesture Cost paid. */
  cstCalibrationCeilingMultiplier: 2,
  /** The CST Calibration ceiling never starts below 200 CST (Solidity default). */
  cstCalibrationCeilingMinCst: 200,
  /** CST Gesture Cost descends linearly to zero when the window fully elapses. */
  cstCalibrationFloorCst: 0,
  /** ETH Calibration Window ceiling = 2x the previous cycle's opening ETH Gesture Cost. */
  ethCalibrationCeilingMultiplier: 2,
  /** ETH Calibration floor = ceiling / 200 (+1 wei); live divisor is on-chain. */
  ethCalibrationFloorDivisor: 200,
  /** Each ETH gesture raises the next ETH Gesture Cost by 1% (+1 wei). */
  ethGestureCostStepUpPercent: 1,
  specialAllocationCst: 1_000,
  outreachReserveCst: 3_000,
  roleNftsPerCycle: 4,
  stellarNftsPerCycle: 20,
  typicalNftsPerCycle: 24,
  typicalCstImprintsPerCycle: 27_000,
  finalGestureExclusivityHours: 48,
  secondaryRetrievalTimeoutWeeks: 5,
  randomWalkDiscountPercentage: 50,
  initialGestureCostEth: 0.0001,
  initialCycleTimeIncrementHours: 1,
  /**
   * The time increment grows by exactly 1% each cycle
   * (mainPrizeTimeIncrementIncreaseDivisor = 100, applied at finalization).
   */
  cycleTimeIncrementIncreasePercentPerCycle: 1,
  /** Initial Cycle Finalization Time at launch: increment x ~24 (about one day). */
  initialCycleFinalizationHoursAtLaunch: 24,
  /**
   * Solidity default only. The live delay before the next cycle activates is
   * stored on-chain (`delayDurationBeforeRoundActivation`) and is
   * owner-configurable at any time; it can differ substantially from this
   * default. Never present this value as the live delay.
   */
  defaultNextCycleDelayMinutes: 30,
  compoundingReservePercentage: 50,
  /** Every NFT (Cosmic Signature or RandomWalk) can be anchored only once, ever. */
  anchoringOncePerNft: true,
  gestureMessageMaxLength: 280,
  councilVotingDelayDays: 2,
  councilVotingPeriodWeeks: 2,
  councilProposalThresholdCst: 100,
  councilQuorumPercent: 3,
  /**
   * CosmicSignatureGameV3 — the upcoming proxy upgrade (not yet live on Arbitrum One).
   * Version-aware UI (e.g. the Protocol Configuration page, which detects V3 via its
   * new getters) should prefer these once the upgrade lands; the top-level facts above
   * keep describing the live V2 deployment until then.
   *
   * Verified against the v3-2026-06-23 branch Solidity defaults
   * (`CosmicSignatureConstants.sol`, `docs/v3-vs-v2-changes.md`).
   */
  v3: {
    /** Linear Participation CST (replaces the V2 sqrt formula). */
    dynamicCstRewardFormula:
      'elapsedSinceLastGesture * bidCstRewardAmountMultiplier / mainPrizeTimeIncrementInMicroSeconds',
    /** Initial accrual with launch parameters: ~1 CST per minute (declines ~1% per cycle). */
    dynamicCstRewardPerMinuteAtLaunch: 1,
    /** Share of each Participation CST imprint minted to the participant being outbid. */
    lastBidderCstRewardPercentDefault: 90,
    /** Signature Allocation recipient receives this many sequential Cosmic Signature NFTs. */
    mainPrizeNftsPerCycleDefault: 3,
    /** 24 V2-era NFTs + 2 extra Signature Allocation NFTs; CST imprint totals are unchanged. */
    typicalNftsPerCycle: 26,
    /** Late-gesture window before the Cycle Finalization Time (Solidity default: ~20 minutes). */
    lateGestureWindowMinutesAtLaunch: 20,
    /** Gesture cost at the end of the late window is about 5x the unadjusted cost. */
    lateGestureMaxCostMultiplier: 5,
  },
} as const;
