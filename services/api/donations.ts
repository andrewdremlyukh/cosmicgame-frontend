// lexicon-allow-start: backend HTTP URL paths mirror the Go server routes and are a sealed contract

import {
  apiGet,
  getAPIUrl,
  apiCall,
  apiCallRequired,
  flattenTx,
  flattenTxArray,
  normalizeFieldNamesArray,
  pagedPath,
  type ApiListRequestOptions,
  type ApiRequestOptions,
} from './client';
import {
  AttachedNFTRecordSchema,
  CharityWithdrawalSchema,
  ETHDonationSchema,
  safeValidate,
  safeValidateListSample,
} from './schemas';
import type { CharityWithdrawal, ETHDonation, AttachedNFT, DonatedERC20Token } from './types';

function toFiniteNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Per-donation ERC20 rows from `by_round/all` expose `AmountEth` (and optional claim fields).
 * {@link AttachedERC20Table} expects summarized fields (`AmountDonatedEth`, etc.).
 */
function mapErc20DonationRowForTable(row: DonatedERC20Token): DonatedERC20Token {
  const rawDonated = row.AmountDonatedEth;
  const donated =
    typeof rawDonated === 'number' && Number.isFinite(rawDonated)
      ? rawDonated
      : toFiniteNumber(row.AmountEth);
  const claimed = toFiniteNumber(row.AmountClaimedEth);
  const winner =
    typeof row.WinnerAddr === 'string' && row.WinnerAddr.length > 0 ? row.WinnerAddr : '';
  const rawDiff =
    row.DonateClaimDiff != null && String(row.DonateClaimDiff) !== ''
      ? String(row.DonateClaimDiff)
      : row.Amount != null && String(row.Amount) !== ''
        ? String(row.Amount)
        : row.AmountDonated != null && String(row.AmountDonated) !== ''
          ? String(row.AmountDonated)
          : '0';

  return {
    ...row,
    AmountDonatedEth: donated,
    AmountClaimedEth: claimed,
    Claimed: Boolean(row.Claimed),
    WinnerAddr: winner,
    DonateClaimDiff: rawDiff,
    DonateClaimDiffEth:
      row.DonateClaimDiffEth != null && String(row.DonateClaimDiffEth) !== ''
        ? String(row.DonateClaimDiffEth)
        : String(donated - claimed),
  };
}

/** Fetches direct Cosmic Game ETH donations with extended donor/round info (optionally paged). */
export function get_donations_cg_with_info_list(
  opts?: ApiListRequestOptions,
): Promise<ETHDonation[]> {
  return apiCall(async () => {
    const { data } = await apiGet(
      getAPIUrl(`donations/eth/with_info/list/${pagedPath(opts)}`),
      opts,
    );
    return safeValidateListSample(
      ETHDonationSchema,
      flattenTxArray<ETHDonation>(data.DirectCGDonations),
      'donationsCGWithInfoList',
    ) as ETHDonation[];
  }, []);
}

/** Fetches direct Cosmic Game ETH donations with extended info for a specific round. */
export function get_donations_cg_with_info_by_round(
  round: number,
  opts?: ApiRequestOptions,
): Promise<ETHDonation[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/eth/with_info/by_round/${round}`), opts);
    return safeValidateListSample(
      ETHDonationSchema,
      flattenTxArray<ETHDonation>(data.DirectCGDonations),
      'donationsCGWithInfoByRound',
    ) as ETHDonation[];
  }, []);
}

/** Fetches a single ETH donation with extended info by its record ID. */
export function get_donations_with_info_by_id(
  id: number,
  opts?: ApiRequestOptions,
): Promise<ETHDonation | null> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/eth/with_info/info/${id}`), opts);
    const donation = flattenTx(data.ETHDonation) as ETHDonation | null;
    if (donation == null) return donation;
    return safeValidate(ETHDonationSchema, donation, 'donationWithInfo') as ETHDonation;
  }, null);
}

/** Fetches combined (direct + voluntary) Cosmic Game donations for a specific round. */
export function get_donations_both_by_round(
  round: number,
  opts?: ApiRequestOptions,
): Promise<ETHDonation[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/eth/both/by_round/${round}`), opts);
    return safeValidateListSample(
      ETHDonationSchema,
      flattenTxArray<ETHDonation>(data.CosmicGameDonations),
      'donationsBothByRound',
    ) as ETHDonation[];
  }, []);
}

/** Fetches all combined (direct + voluntary) Cosmic Game donations. */
export function get_donations_both(opts?: ApiRequestOptions): Promise<ETHDonation[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('donations/eth/both/all'), opts);
    return safeValidateListSample(
      ETHDonationSchema,
      flattenTxArray<ETHDonation>(data.CosmicGameDonations),
      'donationsBoth',
    ) as ETHDonation[];
  }, []);
}

/** Fetches Cosmic Game charity deposits (automatic per-round charity share). */
export function get_charity_cg_deposits(opts?: ApiRequestOptions): Promise<ETHDonation[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('donations/charity/cg_deposits'), opts);
    return safeValidateListSample(
      ETHDonationSchema,
      flattenTxArray<ETHDonation>(data.CharityDonations),
      'charityCGDeposits',
    ) as ETHDonation[];
  }, []);
}

/** Fetches voluntary charity donations made by users. */
export function get_charity_voluntary(opts?: ApiRequestOptions): Promise<ETHDonation[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('donations/charity/voluntary'), opts);
    return safeValidateListSample(
      ETHDonationSchema,
      flattenTxArray<ETHDonation>(data.CharityDonations),
      'charityVoluntary',
    ) as ETHDonation[];
  }, []);
}

/** Fetches charity withdrawal records (funds sent to the charity address). */
export function get_charity_withdrawals(opts?: ApiRequestOptions): Promise<CharityWithdrawal[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl('donations/charity/withdrawals'), opts);
    return safeValidateListSample(
      CharityWithdrawalSchema,
      flattenTxArray<CharityWithdrawal>(data.CharityWithdrawals),
      'charityWithdrawals',
    ) as CharityWithdrawal[];
  }, []);
}

/** Fetches donated NFTs with normalized field names (optionally paged). */
export function get_donations_nft_list(opts?: ApiListRequestOptions): Promise<AttachedNFT[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/nft/list/${pagedPath(opts)}`), opts);
    return safeValidateListSample(
      AttachedNFTRecordSchema,
      normalizeFieldNamesArray(flattenTxArray<AttachedNFT>(data.NFTDonations)),
      'donationsNFTList',
    ) as AttachedNFT[];
  }, []);
}

/** Fetches donated NFTs that have been claimed by a specific wallet address. */
export function get_claimed_donated_nft_by_user(
  address: string,
  opts?: ApiRequestOptions,
): Promise<AttachedNFT[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/nft/claims/by_user/${address}`), opts);
    return flattenTxArray<AttachedNFT>(data.DonatedNFTClaims);
  }, []);
}

/** Fetches donated NFTs for a specific round with normalized field names. */
export function get_donations_nft_by_round(
  round: number,
  opts?: ApiRequestOptions,
): Promise<AttachedNFT[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/nft/by_round/${round}`), opts);
    return normalizeFieldNamesArray(
      flattenTxArray<AttachedNFT>(data.NFTDonations),
    ) as AttachedNFT[];
  }, []);
}

/**
 * Fetches unclaimed donated NFTs available for a specific wallet address. Required read: an
 * empty list is how the UI says "nothing to collect", so a failed read must not look like one.
 */
export function get_unclaimed_donated_nft_by_user(
  address: string,
  opts?: ApiRequestOptions,
): Promise<AttachedNFT[]> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/nft/unclaimed/by_user/${address}`), opts);
    return normalizeFieldNamesArray(
      flattenTxArray<AttachedNFT>(data.UnclaimedDonatedNFTs),
    ) as AttachedNFT[];
  });
}

/** Fetches ERC-20 token donations for a round (includes rows before main-prize claim; optional winner when claim exists). */
export function get_donations_erc20_by_round(
  round: number,
  opts?: ApiRequestOptions,
): Promise<DonatedERC20Token[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/erc20/by_round/all/${round}`), opts);
    const rows = normalizeFieldNamesArray(
      flattenTxArray<DonatedERC20Token>(data.DonationsERC20ByRoundAll),
    ) as DonatedERC20Token[];
    return rows.map(mapErc20DonationRowForTable);
  }, []);
}

/** Fetches ERC-20 token donations won by a specific wallet address. */
export function get_donations_erc20_by_user(
  address: string,
  opts?: ApiRequestOptions,
): Promise<DonatedERC20Token[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`donations/erc20/by_user/${address}`), opts);
    const rows = normalizeFieldNamesArray(
      flattenTxArray<DonatedERC20Token>(data.DonatedPrizesERC20ByWinner),
    ) as DonatedERC20Token[];
    return rows.map(mapErc20DonationRowForTable);
  }, []);
}

// lexicon-allow-end
