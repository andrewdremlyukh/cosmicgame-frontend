/**
 * Zod schemas for Cosmic Signature backend wire format.
 *
 * Two validation styles, chosen explicitly at every call site — there is no
 * global mode flag:
 *
 *   validate / validateList        strict. A mismatch throws, so the calling
 *                                  read rejects and React Query reports
 *                                  `isError`. Used on the payloads the UI
 *                                  cannot render wrong: dashboard, cycles,
 *                                  gestures, user info, claim/allocation data,
 *                                  anchored-token lists.
 *
 *   safeValidate /                 warn-only. Reports the mismatch to Sentry
 *   safeValidateListSample         and passes the raw value through. Used for
 *                                  analytics/statistics payloads where one bad
 *                                  row should not blank a whole page, and for
 *                                  schemas that have not yet earned telemetry.
 *
 * Why Zod and not TypeScript alone: the Go API can ship a breaking payload
 * change (renamed field, type widening) that the UI silently destructures as
 * `undefined`, corrupting tables, totals, charts. Zod at the client boundary
 * surfaces those mismatches as structured errors — with field paths — before
 * the bad data reaches a component. The TypeScript types in types.ts remain
 * the ergonomic handle; these schemas are the runtime guardrail.
 *
 * IMPORTANT: field names mirror the Go server response keys and must not be
 * renamed here (same contract as services/api/types.ts). Schemas are `.loose()`
 * so new backend fields pass through untouched.
 */

// lexicon-allow-start: backend wire-format field names mirror the Go server

import { z } from 'zod';

import { reportError } from '@/utils/errors';

/* ------------------------------------------------------------------------- *
 *  Primitive building blocks
 * ------------------------------------------------------------------------- */

const AddressSchema = z.string();
/** Numeric wire field the Go server sometimes serializes as a decimal string. */
const NumberOrNumericString = z.union([z.number(), z.string()]);
const IdSchema = z.union([z.string(), z.number()]);

export const TxInfoSchema = z
  .object({
    EvtLogId: z.number(),
    BlockNum: z.number(),
    TxId: z.number(),
    TxHash: z.string(),
    TimeStamp: z.number(),
    DateTime: z.string().optional(),
  })
  .loose();
export type TxInfoParsed = z.infer<typeof TxInfoSchema>;

/* ------------------------------------------------------------------------- *
 *  Dashboard / Statistics
 * ------------------------------------------------------------------------- */

const AnchoringStatisticsSchema = z
  .object({
    NumActiveStakers: z.number(),
    /** Omitted on RWalk in Go `CGStakeStatsRWalk` (only `CGStakeStatsCST` has deposits / reward tallies). */
    NumDeposits: z.number().optional(),
    /** Omitted on RWalk in Go `CGStakeStatsRWalk`. */
    TotalRewardEth: z.number().optional(),
    /** Present on RandomWalk stats; omitted on CST in the Go `CGStakeStatsCST` struct. */
    TotalTokensMinted: z.number().optional(),
    TotalTokensStaked: z.number(),
    UnclaimedRewardEth: z.number().optional(),
  })
  .loose();

const MainStatsSchema = z
  .object({
    TotalPrizeAwards: z.number().optional(),
    CgPrizeRowCount: z.number().optional(),
    TotalPrizes: z.number().optional(),
    NumCSTokenMints: z.number(),
    TotalRaffleEthDeposits: z.number(),
    TotalCSTConsumedEth: z.number(),
    TotalMktRewardsEth: z.number(),
    NumMktRewards: z.number(),
    TotalRaffleEthWithdrawn: z.number(),
    NumBidsCST: z.number(),
    NumUniqueBidders: z.number(),
    NumUniqueWinners: z.number(),
    NumUniqueDonors: z.number(),
    TotalNamedTokens: z.number(),
    NumUniqueStakersCST: z.number(),
    NumUniqueStakersRWalk: z.number(),
    StakeStatisticsCST: AnchoringStatisticsSchema,
    StakeStatisticsRWalk: AnchoringStatisticsSchema,
  })
  .loose();

const ContractAddressesSchema = z
  .object({
    CosmicGameAddr: AddressSchema,
    CosmicTokenAddr: AddressSchema,
    CosmicSignatureAddr: AddressSchema,
    RandomWalkAddr: AddressSchema,
    CosmicDaoAddr: AddressSchema,
    CharityWalletAddr: AddressSchema,
    ImplementationAddr: AddressSchema.optional(),
    MarketingWalletAddr: AddressSchema,
    PrizesWalletAddr: AddressSchema,
    StakingWalletCSTAddr: AddressSchema,
    StakingWalletRWalkAddr: AddressSchema,
  })
  .loose();

export const DashboardInfoSchema = z
  .object({
    CurNumBids: z.number(),
    CurPrizeAmountEth: z.number(),
    CurBidPriceEth: z.number().optional(),
    CurRoundNum: z.number(),
    PrizeClaimTs: z.number(),
    TsRoundStart: z.number(),
    LastBidderAddr: AddressSchema,
    GestureCostEth: z.number(),
    StakingAmountEth: z.number(),
    MainStats: MainStatsSchema,
    ContractAddrs: ContractAddressesSchema.optional(),
    NumRaffleNFTWinnersBidding: z.number(),
    NumRaffleNFTWinnersStakingRWalk: z.number(),
  })
  .loose();
export type DashboardInfoParsed = z.infer<typeof DashboardInfoSchema>;

/* ------------------------------------------------------------------------- *
 *  Rounds
 * ------------------------------------------------------------------------- */

const RoundStatsSchema = z
  .object({
    /**
     * Absent for a cycle the backend has no stats row for yet — `flattenRoundInfo`
     * substitutes `{}` in that case, so this cannot be required.
     */
    TotalBids: z.number().optional(),
    TotalDonatedAmountEth: z.number().optional(),
    TotalDonatedNFTs: z.number().optional(),
    TotalRaffleEthDepositsEth: z.number().optional(),
    TotalRaffleNFTs: z.number().optional(),
    ActivationTime: z.number().optional(),
    DelayDurationBeforeRoundActivation: z.number().optional(),
  })
  .loose();

export const StellarSelectionNFTRecipientSchema = z
  .object({
    EvtLogId: z.number().optional(),
    TxHash: z.string().optional(),
    TimeStamp: z.number().optional(),
    RoundNum: z.number().optional(),
    WinnerAddr: AddressSchema.optional(),
    TokenId: z.number().optional(),
    IsRWalk: z.boolean().optional(),
    IsStaker: z.boolean().optional(),
  })
  .loose();

/** Backend round detail sometimes omits tx fields or nests them under `Tx` (see flattenTxArray). */
export const StellarSelectionETHDepositSchema = z
  .object({
    EvtLogId: z.number().optional(),
    TxHash: z.string().optional(),
    TimeStamp: z.number().optional(),
    RoundNum: z.number().optional(),
    Amount: z.number().optional(),
    WinnerAddr: AddressSchema.optional(),
    Claimed: z.boolean().optional(),
  })
  .loose();

const AllocationEntrySchema = z
  .object({
    EvtLogId: z.number().optional(),
    RoundNum: z.number().optional(),
    WinnerAddr: AddressSchema.optional(),
    TokenId: z.number().optional(),
    /** Wei amounts arrive as decimal strings on some allocation records. */
    Amount: NumberOrNumericString.optional(),
  })
  .loose();

export const RoundInfoSchema = z
  .object({
    RoundNum: z.number(),
    WinnerAddr: AddressSchema,
    AmountEth: z.number(),
    TokenId: z.number(),
    /** V3 multi-NFT main prize (1 on V1/V2 cycles, default 3 on V3). */
    NumCSNfts: z.number().optional(),
    NftTokenIds: z.array(z.number()).optional(),
    /**
     * Claim-transaction fields, hoisted by `flattenRoundInfo` from
     * `ClaimPrizeTx.Tx`. A cycle that has not been finalized has no claim
     * transaction, so these are absent for the in-flight cycle that
     * `rounds/list` and `rounds/info/{n}` both return.
     */
    TxHash: z.string().optional(),
    TimeStamp: z.number().optional(),
    DateTime: z.string().optional(),
    RoundStats: RoundStatsSchema,
    RaffleNFTWinners: z.array(StellarSelectionNFTRecipientSchema),
    StakingNFTWinners: z.array(StellarSelectionNFTRecipientSchema),
    RaffleETHDeposits: z.array(StellarSelectionETHDepositSchema),
    AllPrizes: z.array(AllocationEntrySchema),
    CSTAmountEth: z.number(),
    CharityAddress: AddressSchema,
    CharityAmountETH: z.number(),
    StakingDepositAmountEth: z.number(),
    StakingPerTokenEth: z.number(),
    StakingNumStakedTokens: z.number(),
    EnduranceWinnerAddr: AddressSchema,
    LastCstBidderAddr: AddressSchema,
    ChronoWarriorAddr: AddressSchema,
  })
  .loose();
export type RoundInfoParsed = z.infer<typeof RoundInfoSchema>;

/* ------------------------------------------------------------------------- *
 *  Gestures
 * ------------------------------------------------------------------------- */

export const GestureInfoSchema = z
  .object({
    EvtLogId: z.number(),
    BlockNum: z.number(),
    TxId: z.number(),
    TxHash: z.string(),
    TimeStamp: z.number(),
    DateTime: z.string().optional(),
    RoundNum: z.number(),
    BidderAddr: AddressSchema,
    GestureType: z.number(),
    /**
     * ETH cost of the gesture, mapped by `normalizeGestureRecord` from
     * `EthPriceEth`. A CST gesture reports a negative sentinel ETH price, so
     * the normalizer leaves this unset — absent means "not paid in ETH".
     */
    GestureCostEth: z.number().optional(),
    Message: z.string().optional(),
  })
  .loose();
export type GestureInfoParsed = z.infer<typeof GestureInfoSchema>;

/* ------------------------------------------------------------------------- *
 *  Users
 * ------------------------------------------------------------------------- */

export const UserInfoSchema = z
  .object({
    NumBids: z.number(),
    NumPrizes: z.number(),
    MaxBidAmountEth: z.number().optional(),
    MaxWinAmount: z.number().optional(),
  })
  .loose();

export const UserBalanceSchema = z
  .object({
    ETH_Balance: z.string(),
    CosmicTokenBalance: z.string(),
  })
  .loose();

/* ------------------------------------------------------------------------- *
 *  Special Winners
 * ------------------------------------------------------------------------- */

export const SpecialRecipientsSchema = z
  .object({
    EnduranceChampionAddress: AddressSchema.optional(),
    EnduranceChampionDuration: z.number().optional(),
    EnduranceChampionStartTimeStamp: z.number().optional(),
    PrevEnduranceChampionDuration: z.number().optional(),
    ChronoWarriorAddress: AddressSchema.optional(),
    ChronoWarriorDuration: z.number().optional(),
    ChronoWarriorIsLive: z.boolean().optional(),
    LastBidderAddress: AddressSchema.optional(),
    LastBidderLastBidTime: z.number().optional(),
    LastCstBidderAddress: AddressSchema.optional(),
    LastCstBidderLastBidTime: z.number().optional(),
    LastCstBidEventLogId: z.number().optional(),
    RoundNum: z.number().optional(),
    SourceBlockNumber: z.number().optional(),
    SourceBlockTimeStamp: z.number().optional(),
  })
  .loose();
export type SpecialRecipientsParsed = z.infer<typeof SpecialRecipientsSchema>;

/* ------------------------------------------------------------------------- *
 *  Claim / allocation data
 * ------------------------------------------------------------------------- */

const AssetTypeSchema = z.enum(['ETH', 'ERC721', 'ERC20']);

const ClaimUnclaimedItemSchema = z
  .object({
    AssetType: AssetTypeSchema,
    RecipientAddr: AddressSchema,
    AmountEth: z.number(),
    TokenAddr: AddressSchema,
    TokenId: z.number(),
  })
  .loose();

export const RoundClaimSummarySchema = z
  .object({
    RoundNum: z.number(),
    ClaimWindowTimeout: z.number(),
    AwardedTs: z.number(),
    Expired: z.boolean(),
    EthAwarded: z.number(),
    EthUnclaimed: z.number(),
    EthUnclaimedEth: z.number(),
    NftAwarded: z.number(),
    NftUnclaimed: z.number(),
    Erc20Awarded: z.number(),
    Erc20Unclaimed: z.number(),
    TotalAwarded: z.number(),
    TotalUnclaimed: z.number(),
    AvgClaimPeriodSecs: z.number(),
    /** Omitted (rather than empty) when a cycle has nothing left to claim. */
    UnclaimedItems: z.array(ClaimUnclaimedItemSchema).nullish(),
  })
  .loose();

const ClaimTxnSchema = z
  .object({
    AssetType: AssetTypeSchema,
    RecipientAddr: AddressSchema,
    BeneficiaryAddr: AddressSchema,
    AmountEth: z.number(),
    TokenAddr: AddressSchema,
    TokenId: z.number(),
    ClaimedAfterSecs: z.number(),
    ClaimTs: z.number(),
    TxHash: z.string(),
  })
  .loose();

const AttachedTokenSchema = z
  .object({
    AssetType: z.enum(['ERC721', 'ERC20']),
    ContributorAddr: AddressSchema,
    TokenAddr: AddressSchema,
    TokenId: z.number(),
    AmountEth: z.number(),
    Ts: z.number(),
    TxHash: z.string(),
  })
  .loose();

export const RoundClaimDetailSchema = z
  .object({
    RoundNum: z.number(),
    ClaimTransactions: z.array(ClaimTxnSchema),
    AttachedTokens: z.array(AttachedTokenSchema),
  })
  .loose();

/** One row of a wallet's allocation-claim history (`prizes/history/*`). */
export const WinningHistoryEntrySchema = z
  .object({
    EvtLogId: z.number(),
    TxHash: z.string(),
    TimeStamp: z.number(),
    RoundNum: z.number(),
    RecordType: z.number(),
    WinnerAddr: AddressSchema.optional(),
    AmountEth: z.number().optional(),
    TokenId: z.number().optional(),
    Claimed: z.boolean().optional(),
  })
  .loose();

/* ------------------------------------------------------------------------- *
 *  Statistics list endpoints
 * ------------------------------------------------------------------------- */

export const ParticipantSchema = z
  .object({
    BidderAid: IdSchema,
    BidderAddr: AddressSchema,
    NumBids: z.number(),
    MaxBidAmountEth: z.number(),
  })
  .loose();

export const RecipientSchema = z
  .object({
    WinnerAid: IdSchema,
    WinnerAddr: AddressSchema,
    AllocationsCount: z.number().optional(),
    MaxWinAmountEth: z.number(),
    PrizesSum: z.number(),
  })
  .loose();

export const UniqueEthDonorSchema = z
  .object({
    DonorAid: IdSchema,
    DonorAddr: AddressSchema,
    CountDonations: z.number(),
    TotalDonatedEth: z.number(),
  })
  .loose();

export const TokenDistributionSchema = z
  .object({
    OwnerAddr: AddressSchema,
    OwnerAid: IdSchema,
    NumTokens: z.number(),
  })
  .loose();

export const CTBalanceDistributionSchema = z
  .object({
    OwnerAddr: AddressSchema,
    OwnerAid: IdSchema,
    BalanceFloat: z.number(),
  })
  .loose();

export const CTStatisticsSchema = z
  .object({
    TotalSupply: z.string(),
    TotalSupplyEth: z.number(),
    TotalHolders: z.number(),
  })
  .loose();

export const AnchorActionSchema = z
  .object({
    ActionId: z.number(),
    ActionType: z.number(),
    TokenId: z.number(),
    StakerAddr: AddressSchema,
    NumStakedNFTs: z.number(),
    TimeStamp: z.number().optional(),
  })
  .loose();

/**
 * Anchored RandomWalk token row (`staking/randomwalk/staked_tokens/*`): the
 * token id and the anchoring action are flat on the row.
 */
export const AnchoredTokenRWalkSchema = z
  .object({
    StakeActionId: z.number(),
    StakedTokenId: z.number(),
    StakeTimeStamp: z.number(),
  })
  .loose();

/**
 * Anchored Cosmic Signature token row (`staking/cst/staked_tokens/*`).
 *
 * The CST payload nests the token under `TokenInfo` and carries no flat
 * `StakedTokenId` — which is why the shared schema used for both endpoints
 * reported `0.StakedTokenId: expected number, received undefined` on every
 * poll. The consumers already read `TokenInfo.TokenId` for CST rows
 * (GlobalAnchoredTokensTable, AnchoredTokensTable), so `TokenInfo` is the
 * required part here and the flat RandomWalk fields are optional.
 */
export const AnchoredTokenCSTSchema = z
  .object({
    StakeTimeStamp: z.number(),
    TokenInfo: z
      .object({
        TokenId: z.number(),
        Seed: NumberOrNumericString.optional(),
        StakeActionId: z.number().optional(),
      })
      .loose(),
    StakeActionId: z.number().optional(),
    StakedTokenId: z.number().optional(),
  })
  .loose();

export const SystemModeChangeEventSchema = z
  .object({
    RoundNum: z.number(),
    EvtLogId: IdSchema,
    TimeStamp: z.number(),
  })
  .loose();

export const UniqueAnchorHolderCSTSchema = z
  .object({
    StakerAid: IdSchema,
    StakerAddr: AddressSchema,
    NumStakeActions: z.number(),
    NumUnstakeActions: z.number(),
    // The live CST endpoint omits this field (CST anchoring pays ETH rewards,
    // it does not mint); the RWLK variant does return it. The table defaults
    // absent values to 0.
    TotalTokensMinted: z.number().optional(),
    TotalTokensStaked: z.number(),
    TotalRewardEth: z.number(),
    UnclaimedRewardEth: z.number(),
  })
  .loose();

export const UniqueAnchorHolderRWLKSchema = z
  .object({
    StakerAid: IdSchema,
    StakerAddr: AddressSchema,
    NumStakeActions: z.number(),
    NumUnstakeActions: z.number(),
    TotalTokensStaked: z.number(),
    TotalTokensMinted: z.number(),
  })
  .loose();

export const AttachedNFTRecordSchema = z
  .object({
    RoundNum: z.number(),
    DonorAddr: AddressSchema,
    TokenAddr: AddressSchema.optional(),
    TokenAddress: AddressSchema.optional(),
  })
  .loose();

/* ------------------------------------------------------------------------- *
 *  Donations — ETH / charity
 * ------------------------------------------------------------------------- */

/**
 * ETH contribution record (`donations/eth/*`, `donations/charity/*`). Tx fields
 * are hoisted by `flattenTx`; simple list rows omit `RoundNum` when the
 * contribution was not tied to a cycle.
 */
export const ETHDonationSchema = z
  .object({
    EvtLogId: z.number(),
    TxHash: z.string(),
    TimeStamp: z.number(),
    DateTime: z.string().optional(),
    RoundNum: z.number().optional(),
    DonorAddr: AddressSchema.optional(),
    AmountEth: z.number(),
    RecordType: z.number().optional(),
  })
  .loose();

/** Charity retrieval record (`donations/charity/withdrawals`). */
export const CharityWithdrawalSchema = z
  .object({
    EvtLogId: IdSchema,
    TxHash: z.string(),
    TimeStamp: z.number(),
    DestinationAddr: AddressSchema,
    AmountEth: z.number(),
  })
  .loose();

/* ------------------------------------------------------------------------- *
 *  Marketing
 * ------------------------------------------------------------------------- */

/** Marketing reward record (`marketing/rewards/*`), tx fields hoisted by `flattenTx`. */
export const MarketingRewardSchema = z
  .object({
    EvtLogId: z.number(),
    TxHash: z.string(),
    TimeStamp: z.number(),
    DateTime: z.string().optional(),
    MarketerAddr: AddressSchema,
    AmountEth: z.number(),
  })
  .loose();

/* ------------------------------------------------------------------------- *
 *  Gesture analytics (bidding-stats)
 * ------------------------------------------------------------------------- */

export const BidFrequencyBucketSchema = z
  .object({
    BucketTs: z.number(),
    NumBids: z.number(),
    UniqueBidders: z.number(),
  })
  .loose();

export const BidTypeRatioBucketSchema = z
  .object({
    BucketTs: z.number(),
    EthBids: z.number(),
    RwalkBids: z.number(),
    CstBids: z.number(),
    TotalBids: z.number(),
    EthPct: z.number(),
    RwalkPct: z.number(),
    CstPct: z.number(),
  })
  .loose();

export const BidSpikeSchema = z
  .object({
    Index: z.number(),
    StartTs: z.number(),
    EndTs: z.number(),
    PeakTs: z.number(),
    PeakNumBids: z.number(),
    TotalBids: z.number(),
    BucketCount: z.number(),
  })
  .loose();

export const BidTimeBoundsSchema = z
  .object({
    MinTs: z.number(),
    MaxTs: z.number(),
  })
  .loose();

export const BiddingActivityResponseSchema = z
  .object({
    InitTs: z.number(),
    FinTs: z.number(),
    Interval: z.number(),
    FrequencyHistory: z.array(BidFrequencyBucketSchema),
    Spikes: z.array(BidSpikeSchema),
    RecentSpikeIndex: z.number(),
    RecentWindowSecs: z.number(),
  })
  .loose();

export const TopBidderInfoSchema = z
  .object({
    BidderAid: z.number(),
    BidderAddr: AddressSchema,
    NumBids: z.number(),
  })
  .loose();

export const BidderActivePeriodSchema = z
  .object({
    BidderAid: z.number(),
    BidderAddr: AddressSchema,
    PeriodStart: z.number(),
    PeriodEnd: z.number(),
    NumBids: z.number(),
    DurationSecs: z.number(),
  })
  .loose();

export const TopBidderActivePeriodsResponseSchema = z
  .object({
    InitTs: z.number(),
    FinTs: z.number(),
    TopN: z.number(),
    GapHours: z.number(),
    MinBids: z.number(),
    TopBidders: z.array(TopBidderInfoSchema),
    ActivePeriods: z.array(BidderActivePeriodSchema),
  })
  .loose();

/* ------------------------------------------------------------------------- *
 *  Validation helpers
 * ------------------------------------------------------------------------- */

/** Builds the `schemaMismatch:<name> — <path>: <message>` summary for a failed parse. */
function describeMismatch(error: z.ZodError, name: string): string {
  const issues = error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
  return `schemaMismatch:${name} — ${issues}`;
}

/**
 * Warn-only validation. Returns the parsed value on a match and the raw value
 * on a mismatch, after reporting `schemaMismatch:<name>` to Sentry.
 *
 * Use for non-critical payloads (statistics, analytics, history lists) and for
 * schemas that have not yet earned telemetry. Prefer {@link validate} anywhere
 * a wrong payload would corrupt what the user sees.
 */
export function safeValidate<T>(schema: z.ZodType<T>, value: unknown, name: string): unknown {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  reportError(new Error(describeMismatch(result.error, name)), `schema:${name}`);
  return value;
}

/**
 * Warn-only validation for a list payload: checks the first `sampleSize` rows
 * (a full scan of a 10k+ row analytics list is wasted work when nothing acts
 * on the result) and reports the first mismatch with the endpoint name.
 */
export function safeValidateListSample<T>(
  schema: z.ZodType<T>,
  rows: unknown,
  name: string,
  sampleSize = 5,
): unknown {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  safeValidate(z.array(schema), rows.slice(0, sampleSize), name);
  return rows;
}

/**
 * Strict validation: throws `schemaMismatch:<name> — <path>: <message>` when
 * the payload does not match, so the read rejects and React Query surfaces
 * `isError` instead of handing a half-empty object to the UI.
 */
export function validate<T>(schema: z.ZodType<T>, value: unknown, name: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new Error(describeMismatch(result.error, name));
}

/**
 * Strict validation for a critical list payload — every row is checked, not a
 * sample, so a corrupt row 500 fails the read the same way row 1 would.
 *
 * `null` / `undefined` count as an empty list: Go marshals a nil slice as
 * `null`, so a missing key legitimately means "no rows". Any other non-array
 * value is a contract break and throws.
 */
export function validateList<T>(schema: z.ZodType<T>, rows: unknown, name: string): T[] {
  if (rows == null) return [];
  if (!Array.isArray(rows)) {
    throw new Error(`schemaMismatch:${name} — <root>: expected array, received ${typeof rows}`);
  }
  return validate(z.array(schema), rows, name);
}
// lexicon-allow-end
