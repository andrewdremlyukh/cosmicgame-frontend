// lexicon-allow-start: backend HTTP URL paths mirror the Go server routes and are a sealed contract

import {
  apiGet,
  getAPIUrl,
  apiCall,
  apiCallRequired,
  flattenTxArray,
  pagedPath,
  type ApiListRequestOptions,
  type ApiRequestOptions,
} from './client';
import {
  StellarSelectionETHDepositSchema,
  StellarSelectionNFTRecipientSchema,
  safeValidateListSample,
  validateList,
} from './schemas';
import type { StellarSelectionETHDeposit, StellarSelectionNFTRecipient } from './types';

/** Fetches stellarSelection ETH deposits made by a specific wallet address. */
export function get_raffle_deposits_by_user(
  address: string,
  opts?: ApiRequestOptions,
): Promise<StellarSelectionETHDeposit[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`prizes/eth/raffle/by_user/${address}`), opts);
    const d = data as Record<string, unknown>;
    /** Primary JSON API uses `RaffleDeposits`; older/alternate route uses `UserRaffleDeposits`. */
    const list = d.UserRaffleDeposits ?? d.RaffleDeposits;
    return safeValidateListSample(
      StellarSelectionETHDepositSchema,
      flattenTxArray<StellarSelectionETHDeposit>(list),
      'raffleDepositsByUser',
    ) as StellarSelectionETHDeposit[];
  }, []);
}

/**
 * Fetches unclaimed stellarSelection deposits available for withdrawal (optionally paged).
 * Required read, strictly validated: this is the list a wallet collects ETH from, so an
 * empty result must mean "nothing to collect" and nothing else.
 */
export function get_unclaimed_raffle_deposits_by_user(
  address: string,
  opts?: ApiListRequestOptions,
): Promise<StellarSelectionETHDeposit[]> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(
      getAPIUrl(`prizes/eth/unclaimed/by_user/${address}/${pagedPath(opts)}`),
      opts,
    );
    return validateList(
      StellarSelectionETHDepositSchema,
      flattenTxArray<StellarSelectionETHDeposit>(data.UnclaimedDeposits),
      'unclaimedRaffleDepositsByUser',
    ) as StellarSelectionETHDeposit[];
  });
}

/** Fetches stellarSelection NFT winnings for a specific wallet address. */
export function get_raffle_nft_winnings_by_user(
  address: string,
  opts?: ApiRequestOptions,
): Promise<StellarSelectionNFTRecipient[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`raffle/nft/by_user/${address}`), opts);
    return safeValidateListSample(
      StellarSelectionNFTRecipientSchema,
      flattenTxArray<StellarSelectionNFTRecipient>(data.UserRaffleNFTWinnings),
      'raffleNFTWinningsByUser',
    ) as StellarSelectionNFTRecipient[];
  }, []);
}

// lexicon-allow-end
