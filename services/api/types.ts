/**
 * API response types for Cosmic Signature frontend.
 * These interfaces type the return values of API methods.
 *
 * immutable: backend wire format — do not rename fields; relabel in UI.
 * Field names such as NumBidsCST, TotalRaffleEthDeposits, NumActiveStakers,
 * NumDonatedNFTs mirror the Go server's response keys. Renaming them breaks
 * deserialization. Translate banned vocabulary at render time via
 * messages/<locale> catalog lookups, not here.
 *
 * The entire file is wrapped in a single `lexicon-allow` block: the field
 * names inside these interfaces are a sealed contract with the backend and
 * cannot be renamed without coordinated server changes (see Phase 6 of the
 * lexicon plan for the optional adapter that would translate fully).
 */

// lexicon-allow-start: backend wire-format field names mirror the Go server response keys

// ---------------------------------------------------------------------------
// Base transaction info (from flattenTx helper)
// ---------------------------------------------------------------------------

export interface TxInfo {
  EvtLogId: number;
  BlockNum: number;
  TxId: number;
  TxHash: string;
  TimeStamp: number;
  DateTime: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Dashboard / Statistics
// ---------------------------------------------------------------------------

export interface AnchoringStatistics {
  NumActiveStakers: number;
  /** Omitted on RWalk: Go `CGStakeStatsRWalk` has no deposit / reward ETH fields. */
  NumDeposits?: number;
  TotalRewardEth?: number;
  /** Omitted on CST stake stats in the Go `CGStakeStatsCST` JSON. */
  TotalTokensMinted?: number;
  TotalTokensStaked: number;
  UnclaimedRewardEth?: number;
}

export interface MainStats {
  /** Same as dashboard root `TotalPrizeAwards` when MainStats embeds full server stats. */
  TotalPrizeAwards?: number;
  CgPrizeRowCount?: number;
  TotalPrizes?: number;
  NumCSTokenMints: number;
  TotalRaffleEthDeposits: number;
  TotalCSTConsumedEth: number;
  TotalMktRewardsEth: number;
  NumMktRewards: number;
  TotalRaffleEthWithdrawn: number;
  NumBidsCST: number;
  NumUniqueBidders: number;
  NumUniqueWinners: number;
  NumUniqueDonors: number;
  TotalNamedTokens: number;
  NumUniqueStakersCST: number;
  NumUniqueStakersRWalk: number;
  NumWinnersWithPendingRaffleWithdrawal?: number;
  NumCosmicGameDonations?: number;
  SumCosmicGameDonationsEth?: number;
  NumWithdrawals?: number;
  SumWithdrawals?: number;
  TotalEthDonatedAmountEth?: number;
  DonatedTokenDistribution?: DonatedTokenDistributionEntry[];
  StakeStatisticsCST: AnchoringStatistics;
  StakeStatisticsRWalk: AnchoringStatistics;
}

export interface DonatedTokenDistributionEntry {
  ContractAddr: string;
  NumDonatedTokens: number;
  [key: string]: unknown;
}

export interface ContractAddresses {
  CosmicGameAddr: string;
  CosmicTokenAddr: string;
  CosmicSignatureAddr: string;
  RandomWalkAddr: string;
  CosmicDaoAddr: string;
  CharityWalletAddr: string;
  ImplementationAddr?: string;
  MarketingWalletAddr: string;
  PrizesWalletAddr: string;
  StakingWalletCSTAddr: string;
  StakingWalletRWalkAddr: string;
  RaffleWalletAddr?: string;
  StakingWalletAddr?: string;
  BusinessLogicAddr?: string;
  [key: string]: string | undefined;
}

export interface DashboardInfo {
  CurNumBids: number;
  CurPrizeAmountEth: number;
  CurBidPriceEth?: number;
  CurRoundNum: number;
  PrizeClaimTs: number;
  TsRoundStart: number;
  LastBidderAddr: string;
  GestureCostEth: number;
  StakingAmountEth: number;
  CurRoundPrizeTime?: number;
  MainStats: MainStats;
  ContractAddrs?: ContractAddresses;
  PrizePercentage?: number;
  ChronoWarriorPercentage?: number;
  RafflePercentage?: number;
  StakingPercentage?: number;
  NumRaffleEthWinnersBidding?: number;
  NumRaffleNFTWinnersBidding: number;
  NumRaffleNFTWinnersStakingRWalk: number;
  CharityPercentage?: number;
  RoundStartCSTAuctionLength?: number;
  TimeoutClaimPrize?: number;
  /**
   * @deprecated Misnamed. The backend exposes this field carrying the raw on-chain
   * `initialDurationUntilMainPrizeDivisor` (a unitless divisor), NOT a number of seconds.
   * The actual initial duration in seconds is `mainPrizeTimeIncrementInMicroSeconds / divisor`,
   * available on-chain via `getInitialDurationUntilMainPrize()`. Read that getter directly
   * instead of treating this value as a duration. See `app/contracts/Contracts.tsx`.
   */
  InitialSecondsUntilPrize?: number;
  PrizeAmountEth?: number;
  RaffleAmountEth?: number;
  CosmicGameBalanceEth?: number;
  CurRoundStats?: RoundStats;
  /** Main allocation claims completed (roughly one per finished round). */
  TotalPrizes?: number;
  /** Sum of cg_winner.prizes_count (may be lower than cg_prize rows). */
  TotalPrizeAwards?: number;
  /** COUNT(*) FROM cg_prize — every unified allocation row (matches your SQL). */
  CgPrizeRowCount?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

export interface RoundStats {
  TotalBids: number;
  TotalDonatedAmountEth?: number;
  TotalDonatedNFTs?: number;
  TotalRaffleEthDepositsEth?: number;
  TotalRaffleNFTs?: number;
  /** CST consumed in gestures during this cycle (cg_round_stats.total_cst_in_bids). */
  TotalCstInBidsEth?: number;
  /** ETH wagered in gestures during this cycle (cg_round_stats.total_eth_in_bids). */
  TotalEthInBidsEth?: number;
  /** Unix seconds; contract `roundActivationTime` (dashboard). */
  ActivationTime?: number;
  DelayDurationBeforeRoundActivation?: number;
  [key: string]: unknown;
}

export interface StellarSelectionNFTRecipient {
  EvtLogId?: number;
  TxHash?: string;
  TimeStamp?: number;
  DateTime?: string;
  RoundNum?: number;
  WinnerAddr?: string;
  TokenId?: number;
  IsRWalk?: boolean;
  IsStaker?: boolean;
  [key: string]: unknown;
}

export interface StellarSelectionETHDeposit {
  EvtLogId?: number;
  TxHash?: string;
  TimeStamp?: number;
  DateTime?: string;
  RoundNum?: number;
  Amount?: number;
  WinnerAddr?: string;
  Claimed?: boolean;
  [key: string]: unknown;
}

export interface WinningHistoryEntry extends TxInfo {
  RoundNum: number;
  RecordType: number;
  WinnerAddr?: string;
  AmountEth?: number;
  TokenAddress?: string;
  TokenId?: number;
  WinnerIndex?: number;
  Claimed?: boolean;
  [key: string]: unknown;
}

export interface AllocationEntry {
  EvtLogId?: number;
  RoundNum?: number;
  RecordType?: number;
  WinnerAddr?: string;
  WinnerIndex?: number;
  TokenId?: number;
  TokenAddress?: string;
  Amount?: number | string;
  AmountEth?: number;
  Claimed?: boolean;
  TxHash?: string;
  TimeStamp?: number;
  DateTime?: string;
  [key: string]: unknown;
}

export interface RoundInfo {
  RoundNum: number;
  WinnerAddr: string;
  AmountEth: number;
  /** First (or only) main-prize Cosmic Signature NFT id. On V3 cycles, additional ids are sequential. */
  TokenId: number;
  /** Number of main-prize Cosmic Signature NFTs awarded to the winner (1 on V1/V2 cycles, 3 by default on V3). */
  NumCSNfts?: number;
  /** All main-prize NFT ids (TokenId .. TokenId+NumCSNfts-1); provided by the V3-aware backend. */
  NftTokenIds?: number[];
  TxHash: string;
  TimeStamp: number;
  DateTime: string;
  EvtLogId?: number;
  BlockNum?: number;
  TxId?: number;
  RoundStats: RoundStats;
  RaffleNFTWinners: StellarSelectionNFTRecipient[];
  StakingNFTWinners: StellarSelectionNFTRecipient[];
  RaffleETHDeposits: StellarSelectionETHDeposit[];
  AllPrizes: AllocationEntry[];
  CSTAmountEth: number;
  CharityAddress: string;
  CharityAmountETH: number;
  StakingDepositAmountEth: number;
  StakingPerTokenEth: number;
  StakingNumStakedTokens: number;
  EnduranceWinnerAddr: string;
  EnduranceERC721TokenId: number;
  EnduranceERC20AmountEth: number;
  LastCstBidderAddr: string;
  LastCstBidderERC721TokenId: number;
  LastCstBidderERC20AmountEth: number;
  ChronoWarriorAddr: string;
  ChronoWarriorAmountEth: number;
  ChronoWarriorCstAmountEth: number;
  ChronoWarriorNftTokenId: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Gestures
// ---------------------------------------------------------------------------

export interface GestureInfo extends TxInfo {
  GestureCost?: number;
  RoundNum: number;
  /** Position of this gesture within its cycle (per-round ordinal), surfaced as "Gesture Position". */
  BidPosition?: number;
  BidderAddr: string;
  Message?: string;
  GestureType: number;
  GestureCostEth: number;
  /** Canonical CST token amount paid for CST gestures. */
  CstCost?: number;
  /** Canonical Participation CST token amount imprinted by this gesture. */
  ParticipationCST?: number;
  /** Legacy CST cost alias preserved for existing table/page consumers. */
  NumCSTokensEth?: number;
  /** @deprecated Typo-compatible CST cost alias; prefer `CstCost` or `NumCSTokensEth`. */
  NumCSTTokensEth?: number;
  NFTDonationTokenId?: number;
  NFTTokenURI?: string;
  /** Legacy Participation CST alias from older UI/API wiring. */
  ERC20RewardAmountEth?: number;
  CSTRewardEth?: number;
  /**
   * V3 gesture CST reward split (90/10 by default). The outbid (previous last) gesture
   * participant receives `PreviousBidder*`; the participant placing this gesture receives
   * `ThisBidder*`. For V1/V2 gestures the backend reports the whole reward under
   * `ThisBidder*` and `PreviousBidder*` is 0, so one rendering path covers both eras.
   */
  PreviousBidderCstRewardAmount?: string;
  PreviousBidderCstRewardAmountEth?: number;
  ThisBidderCstRewardAmount?: string;
  ThisBidderCstRewardAmountEth?: number;
  EthPriceEth?: number;
  CstPriceEth?: number;
  RWalkNFTId?: number;
  NFTDonationTokenAddr?: string;
  DonatedERC20TokenAddr?: string;
  DonatedERC20TokenAmount?: string;
  DonatedERC20TokenAmountEth?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserInfo {
  NumBids: number;
  NumPrizes: number;
  MaxBidAmountEth?: number;
  MaxBidAmount?: number;
  MaxWinAmount?: number;
  CosmicSignatureNumTransfers?: number;
  TotalCSTokensWon?: number;
  [key: string]: unknown;
}

export interface UserBalance {
  ETH_Balance: string;
  CosmicTokenBalance: string;
  [key: string]: unknown;
}

/** User info response with flattened arrays (from get_user_info) */
export interface UserInfoWithLists {
  UserInfo?: UserInfo;
  Gestures: GestureInfo[];
  PrizeHistory: TxInfo[];
  CosmicSignatureTokensOwned: CSTTokenInfo[];
  CurrentlyStakedTokens: AnchoredTokenInfo[];
  DonatedNFTsClaimed: AttachedNFT[];
  DonatedTokensClaimed: unknown[];
  ERC20Transfers: TxInfo[];
  ERC721Transfers: TxInfo[];
  ETHDonationsMade: TxInfo[];
  MainPrizeClaims: TxInfo[];
  MarketingRewardsAwarded: TxInfo[];
  StakingActions: AnchorAction[];
  TokenDonationsMade: TxInfo[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Tokens (CST, CT)
// ---------------------------------------------------------------------------

export interface CSTTokenInfo extends TxInfo {
  TokenId: number;
  TokenName?: string;
  OwnerAddr?: string;
  CurOwnerAddr?: string;
  RoundNum?: number;
  Seed?: string | number;
  WasUnstaked?: boolean;
  MintTimeStamp?: number;
  WinnerAddr?: string;
  Staked?: boolean;
  RecordType?: number;
  [key: string]: unknown;
}

export interface TokenDistribution {
  OwnerAddr: string;
  OwnerAid: string | number;
  NumTokens: number;
}

export interface CTBalanceDistribution {
  OwnerAddr: string;
  OwnerAid: string | number;
  BalanceFloat: number;
}

/** Aggregated CST (ERC-20) statistics from GET /ct/statistics. */
export interface CTStatistics {
  TotalSupply: string;
  TotalSupplyEth: number;
  TotalHolders: number;
  EarnedFromBidding?: string;
  EarnedFromBiddingEth?: number;
  DistributedToMarketers?: string;
  DistributedToMarketersEth?: number;
  GivenAsMainPrizes?: string;
  GivenAsMainPrizesEth?: number;
  GivenAsRafflePrizes?: string;
  GivenAsRafflePrizesEth?: number;
  GivenAsChronoWarriorPrizes?: string;
  GivenAsChronoWarriorPrizesEth?: number;
  ConsumedInBids?: string;
  ConsumedInBidsEth?: number;
}

/** One calendar day's CST supply aggregates from total_supply_history_by_date. */
export interface CTTotalSupplyHistoryByDateRecord {
  Date: string;
  DateTime: string;
  TimeStamp: number;
  NumBids: number;
  MintAmount?: string;
  MintAmountEth: number;
  BurnAmount?: string;
  BurnAmountEth: number;
  Amount?: string;
  AmountEth: number;
  TotalSupply?: string;
  TotalSupplyEth: number;
}

/** One bid's running CST total supply from total_supply_history_by_bid. */
export interface CTTotalSupplyHistoryByBidRecord extends TxInfo {
  BidInfoId: number;
  BidType: number;
  BidderAddr?: string;
  MintAmount?: string;
  MintAmountEth: number;
  BurnAmount?: string;
  BurnAmountEth: number;
  Amount?: string;
  AmountEth: number;
  TotalSupply?: string;
  TotalSupplyEth: number;
}

export interface NameHistoryRecord extends TxInfo {
  TokenName: string;
  TokenId?: number;
  [key: string]: unknown;
}

export interface UsedRWLKNFT {
  RWalkTokenId: number;
  BidderAddr: string;
  RoundNum: number;
  [key: string]: unknown;
}

export interface CSTTransferRecord extends TxInfo {
  TokenId: number;
  FromAddr?: string;
  ToAddr?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Staking
// ---------------------------------------------------------------------------

export interface AnchorAction extends TxInfo {
  ActionId: number;
  ActionType: number;
  TokenAddr: string;
  TokenId: number;
  StakerAddr: string;
  NumStakedNFTs: number;
  IsRWLK?: boolean;
  [key: string]: unknown;
}

export interface AnchoredTokenInfo {
  StakeActionId: number;
  /**
   * Present only on RandomWalk rows. The CST endpoints nest the token under
   * `TokenInfo` instead, and the CST tables read `TokenInfo.TokenId` — see
   * `AnchoredTokenCSTSchema` / `AnchoredTokenRWalkSchema` in schemas.ts, which
   * model the two shapes separately.
   */
  StakedTokenId: number;
  TokenInfo?: {
    TokenId: number;
    Seed?: number;
    StakeActionId?: number;
  };
  StakeTimeStamp: number;
  IsRWLK?: boolean;
  UserAddr?: string;
  StakeEvtLogId?: number;
  [key: string]: unknown;
}

export interface CSTAnchorDistribution {
  EvtLogId: number;
  RoundNum: number;
  TokenId: number;
  AmountEth?: number;
  TxHash?: string;
  TimeStamp?: number;
  DepositRoundNum?: number;
  DepositId?: number;
  DepositAmountEth?: number;
  ClaimedAmountEth?: number;
  YourClaimableAmountEth?: number;
  StakerAddr?: string;
  StakerNumStakedNFTs?: number;
  StakerAmountEth?: number;
  FullyClaimed?: boolean;
  NumStakedNFTs?: number;
  NumTokensCollected?: number;
  YourTokensStaked?: number;
  TotalDepositAmountEth?: number;
  PendingToCollectEth?: number;
  DepositTimeStamp?: number;
  YourCollectedAmountEth?: number;
  NumUnclaimedTokens?: number;
  YourRewardAmountEth?: number;
  PendingToClaimEth?: number;
  [key: string]: unknown;
}

export interface CombinedAnchorRecordInfo {
  Stake: AnchorAction | null;
  Unstake: AnchorAction | null;
  [key: string]: unknown;
}

export interface RewardsByToken {
  TokenId: number;
  TotalRewardEth?: number;
  RewardToCollectEth?: number;
  [key: string]: unknown;
}

export interface AnchorDistributionImprint {
  EvtLogId: number;
  TxHash: string;
  TimeStamp: number;
  DateTime?: string;
  WinnerAddr: string;
  RoundNum: number;
  TokenId: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Donations
// ---------------------------------------------------------------------------

export interface AttachedNFT extends TxInfo {
  RecordId?: number | string;
  RoundNum: number;
  DonorAddr: string;
  TokenAddr: string;
  TokenId?: number | string;
  NFTTokenId?: number | string;
  NFTTokenURI?: string;
  TokenAddress?: string;
  Index?: number;
  [key: string]: unknown;
}

export interface ETHDonation extends TxInfo {
  RoundNum: number;
  DonorAddr: string;
  AmountEth: number;
  RecordType?: number;
  CGRecordId?: string | number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Special Winners
// ---------------------------------------------------------------------------

export interface CharityWithdrawal {
  EvtLogId: string | number;
  TxHash: string;
  TimeStamp: number;
  DestinationAddr: string;
  AmountEth: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Special Winners
// ---------------------------------------------------------------------------

export interface SpecialRecipients {
  EnduranceChampionAddress?: string;
  EnduranceChampionDuration?: number;
  EnduranceChampionStartTimeStamp?: number;
  PrevEnduranceChampionDuration?: number;
  ChronoWarriorAddress?: string;
  ChronoWarriorDuration?: number;
  ChronoWarriorIsLive?: boolean;
  LastBidderAddress?: string;
  LastBidderLastBidTime?: number;
  LastCstBidderAddress?: string;
  LastCstBidderLastBidTime?: number;
  LastCstBidEventLogId?: number;
  RoundNum?: number;
  SourceBlockNumber?: number;
  SourceBlockTimeStamp?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Banned Gestures
// ---------------------------------------------------------------------------

export interface BannedGesture {
  bid_id: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Price Info
// ---------------------------------------------------------------------------

export interface GestureEthCostInfo {
  AuctionDuration: string;
  ETHPrice: string;
  SecondsElapsed: string;
  [key: string]: unknown;
}

export interface CTPriceInfo {
  AuctionDuration: string;
  CSTPrice: string;
  SecondsElapsed: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Token Mint Info (GET /api/cosmicgame/randomwalk/tokens/info/:id or /api/randomwalk/tokens/info/:id)
// ---------------------------------------------------------------------------

export interface TokenImprintInfo {
  CurName?: string;
  CurOwnerAddr?: string;
  SeedHex?: string;
  TokenId?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Unique Address Statistics
// ---------------------------------------------------------------------------

export interface Participant {
  BidderAid: string;
  BidderAddr: string;
  NumBids: number;
  MaxBidAmountEth: number;
  [key: string]: unknown;
}

export interface Recipient {
  WinnerAid: string;
  WinnerAddr: string;
  AllocationsCount: number;
  MaxWinAmountEth: number;
  PrizesSum: number;
  [key: string]: unknown;
}

/** Sort modes accepted by the ROI leaderboard endpoint. */
export type RoiLeaderboardSort = 'net_pl' | 'roi' | 'winrate' | 'spent' | 'nfts' | 'bids';

/**
 * Per-player bidding profitability row (Tier-1, ETH-only ROI) from
 * `statistics/leaderboard/roi`. ETH/CST `*Eth` fields are human-readable; the
 * non-`Eth` strings are raw wei. `Roi` is a fraction (multiply by 100 for %).
 */
export interface RoiLeaderboardEntry {
  BidderAid: number;
  BidderAddr: string;
  NumBids: number;
  RoundsParticipated: number;
  RoundsWon: number;
  WinRate: number; // 0..1
  TotalEthSpent: string;
  TotalEthSpentEth: number;
  TotalCstSpent: string;
  TotalCstSpentEth: number;
  EthWon: string;
  EthWonEth: number;
  PrizesCount: number;
  CstPrizesCount: number;
  NftPrizesCount: number;
  NetPlEth: number;
  Roi: number; // fraction; 0 when no ETH was spent
  [key: string]: unknown;
}

/** A single not-yet-claimed claimable asset held in PrizesWallet (per-cycle drill-down). */
export interface ClaimUnclaimedItem {
  AssetType: 'ETH' | 'ERC721' | 'ERC20';
  RecipientAddr: string;
  AmountEth: number; // ETH allocation, or ERC-20 amount /1e18; 0 for ERC721
  TokenAddr: string; // contract address for ERC721 / ERC20; '' for ETH
  TokenId: number; // token id for ERC721; -1 otherwise
}

/**
 * Per-cycle summary of claimable assets awarded via PrizesWallet (secondary ETH
 * allocations, attached NFTs, attached ERC-20s) and their claim status. Directly-
 * paid assets (main ETH, minted CST/NFT) are excluded — they aren't claimed.
 */
export interface RoundClaimSummary {
  RoundNum: number;
  ClaimWindowTimeout: number; // unix ts after which unclaimed assets can be swept by anyone
  AwardedTs: number; // unix ts when the cycle finalized
  Expired: boolean;
  EthAwarded: number;
  EthUnclaimed: number;
  EthUnclaimedEth: number;
  NftAwarded: number;
  NftUnclaimed: number;
  Erc20Awarded: number;
  Erc20Unclaimed: number;
  TotalAwarded: number;
  TotalUnclaimed: number;
  AvgClaimPeriodSecs: number;
  UnclaimedItems: ClaimUnclaimedItem[];
  [key: string]: unknown;
}

/** A single claim transaction — a recipient withdrawing a claimable asset from PrizesWallet. */
export interface ClaimTxn {
  AssetType: 'ETH' | 'ERC721' | 'ERC20';
  RecipientAddr: string;
  BeneficiaryAddr: string; // who actually claimed (ETH: can differ from recipient after expiry)
  AmountEth: number;
  TokenAddr: string;
  TokenId: number;
  ClaimedAfterSecs: number; // time from cycle finalize to this claim
  ClaimTs: number; // unix ts of the claim
  TxHash: string;
}

/** A token attached (contributed) during a cycle, held for the recipient to claim. */
export interface AttachedToken {
  AssetType: 'ERC721' | 'ERC20';
  ContributorAddr: string;
  TokenAddr: string;
  TokenId: number;
  AmountEth: number;
  Ts: number;
  TxHash: string;
}

/** Per-cycle claim drill-down: claim transactions (with latency) + tokens attached that cycle. */
export interface RoundClaimDetail {
  RoundNum: number;
  ClaimTransactions: ClaimTxn[];
  AttachedTokens: AttachedToken[];
}

export interface UniqueAnchorHolderCST {
  StakerAid: string | number;
  StakerAddr: string;
  NumStakeActions: number;
  NumUnstakeActions: number;
  /** Absent in the live CST endpoint response (CST anchoring does not mint). */
  TotalTokensMinted?: number;
  TotalTokensStaked: number;
  TotalRewardEth: number;
  UnclaimedRewardEth: number;
  [key: string]: unknown;
}

export interface UniqueAnchorHolderRWLK {
  StakerAid: string | number;
  StakerAddr: string;
  NumStakeActions: number;
  NumUnstakeActions: number;
  TotalTokensStaked: number;
  TotalTokensMinted: number;
  [key: string]: unknown;
}

export interface UniqueEthDonor {
  DonorAid: string | number;
  DonorAddr: string;
  CountDonations: number;
  TotalDonatedEth: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Notify Red Box
// ---------------------------------------------------------------------------

export interface NotifyRedBoxResult {
  ETHRaffleToClaim: number;
  ETHRaffleToClaimWei: number;
  NumDonatedNFTToClaim: number;
  UnretrievedAnchorDistribution: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------------------

export interface MarketingReward {
  EvtLogId: number;
  TxHash: string;
  TimeStamp: number;
  MarketerAddr: string;
  AmountEth: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export interface SystemModeChangeEvent {
  RoundNum: number;
  EvtLogId: string | number;
  NextEvtLogId?: string | number;
  TimeStamp: number;
  [key: string]: unknown;
}

export interface AdminEventRow {
  EvtLogId: string | number;
  RecordType: number;
  TransferType: number;
  TimeStamp: number;
  TxHash: string;
  IntegerValue: number;
  AddressValue: string;
  StringValue: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Donated ERC20 Tokens
// ---------------------------------------------------------------------------

export interface DonatedERC20Token extends TxInfo {
  RoundNum: number;
  TokenAddr: string;
  Amount?: string | number;
  AmountDonated?: string;
  AmountDonatedEth: number;
  AmountClaimed?: string;
  AmountClaimedEth: number;
  AmountEth?: number;
  WinnerAddr: string;
  DonorAddr?: string;
  Claimed?: boolean;
  DonateClaimDiff?: string;
  DonateClaimDiffEth?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// NFT Donation Stats
// ---------------------------------------------------------------------------

export interface NFTDonationStatsEntry {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Staking Action IDs with Claim Info
// ---------------------------------------------------------------------------

export interface ActionIdWithClaimInfo {
  DepositId: number;
  StakeActionId: number;
  Claimed: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Bidding analytics
// ---------------------------------------------------------------------------

export interface BidFrequencyBucket {
  BucketTs: number;
  NumBids: number;
  UniqueBidders: number;
}

/**
 * Per-interval bid-type composition for the 100% stacked area chart. Counts are
 * the raw bids of each type within the window [BucketTs, BucketTs+interval); the
 * *Pct fields are those counts normalized to a windowed 100% of TotalBids. When
 * a window has no bids, TotalBids is 0 and all *Pct fields are 0.
 * Type mapping: ETH, RandomWalk (ETH-paid), CST.
 */
export interface BidTypeRatioBucket {
  BucketTs: number;
  EthBids: number;
  RwalkBids: number;
  CstBids: number;
  TotalBids: number;
  EthPct: number;
  RwalkPct: number;
  CstPct: number;
}

export interface BidSpike {
  Index: number;
  StartTs: number;
  EndTs: number;
  PeakTs: number;
  PeakNumBids: number;
  TotalBids: number;
  BucketCount: number;
}

export interface TopBidderInfo {
  BidderAid: number;
  BidderAddr: string;
  NumBids: number;
}

export interface BidderActivePeriod {
  BidderAid: number;
  BidderAddr: string;
  PeriodStart: number;
  PeriodEnd: number;
  NumBids: number;
  DurationSecs: number;
}

export interface BiddingActivityResponse {
  InitTs: number;
  FinTs: number;
  Interval: number;
  FrequencyHistory: BidFrequencyBucket[];
  Spikes: BidSpike[];
  RecentSpikeIndex: number;
  RecentWindowSecs: number;
}

export interface BidTimeBounds {
  MinTs: number;
  MaxTs: number;
}

export interface TopBidderActivePeriodsResponse {
  InitTs: number;
  FinTs: number;
  TopN: number;
  GapHours: number;
  MinBids: number;
  TopBidders: TopBidderInfo[];
  ActivePeriods: BidderActivePeriod[];
}

// lexicon-allow-end
