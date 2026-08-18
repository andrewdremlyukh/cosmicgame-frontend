import type { Abi, AbiEvent, AbiFunction } from 'viem';

import * as abis from '../abis';

const allAbis: Array<[string, Abi]> = [
  ['charityWalletAbi', abis.charityWalletAbi],
  ['cosmicDaoAbi', abis.cosmicDaoAbi],
  ['cosmicGameAbi', abis.cosmicGameAbi],
  ['cosmicSignatureAbi', abis.cosmicSignatureAbi],
  ['cosmicTokenAbi', abis.cosmicTokenAbi],
  ['ethDonationsAbi', abis.ethDonationsAbi],
  ['prizesWalletAbi', abis.prizesWalletAbi],
  ['randomWalkNftAbi', abis.randomWalkNftAbi],
  ['stakingWalletCstAbi', abis.stakingWalletCstAbi],
  ['stakingWalletRwlkAbi', abis.stakingWalletRwlkAbi],
  ['systemManagementAbi', abis.systemManagementAbi],
];

function eventNames(abi: Abi): string[] {
  return abi.filter((item): item is AbiEvent => item.type === 'event').map((item) => item.name);
}

function functionNames(abi: Abi): string[] {
  return abi
    .filter((item): item is AbiFunction => item.type === 'function')
    .map((item) => item.name);
}

function functionSignatures(abi: Abi): string[] {
  return abi
    .filter((item): item is AbiFunction => item.type === 'function')
    .map((item) => `${item.name}(${(item.inputs ?? []).map((input) => input.type).join(',')})`);
}

describe('generated ABI barrel', () => {
  it.each(allAbis)('%s is a non-empty array of parsed ABI entries', (_name, abi) => {
    expect(Array.isArray(abi)).toBe(true);
    expect(abi.length).toBeGreaterThan(0);
    for (const entry of abi) {
      // Human-readable ABI strings would break viem encoding at runtime.
      expect(typeof entry).toBe('object');
      expect(typeof (entry as { type?: unknown }).type).toBe('string');
    }
  });

  it('exposes the BidPlaced event the live refresh watcher depends on', () => {
    expect(eventNames(abis.cosmicGameAbi)).toContain('BidPlaced');
  });

  it('exposes upgraded CST bid reward and dynamic duration selectors', () => {
    const signatures = functionSignatures(abis.cosmicGameAbi);
    expect(signatures).toContain('getBidCstRewardAmount()');
    expect(signatures).toContain('getBidCstRewardAmountAdvanced(int256)');
    expect(signatures).toContain('getCstDutchAuctionDurations()');
    expect(signatures).toContain('cstDutchAuctionDuration()');
    expect(signatures).toContain('cstDutchAuctionDurationChangeDivisor()');
    expect(signatures).toContain('bidWithCst(uint256,string,uint256)');
    expect(signatures).toContain('bidWithEth(int256,string,uint256)');
  });

  it('exposes V3 configuration getters (late-bid premium, CST price decline, multi-NFT prize)', () => {
    const signatures = functionSignatures(abis.cosmicGameAbi);
    expect(signatures).toContain('cstBidPriceDeclineMultiplier()');
    expect(signatures).toContain('cstBidPriceDeclineMultiplierChangeDivisor()');
    expect(signatures).toContain('bidRaffleCumulativeWeights(uint256,uint256)');
    expect(signatures).toContain('mainPrizeNumCosmicSignatureNfts()');
    expect(signatures).toContain('getRoundLateBidDuration()');
    expect(signatures).toContain('roundLateBidDurationDivisor()');
    expect(signatures).toContain('roundLateBidPricePremiumAmountBaseMultiplier()');
    expect(signatures).toContain('roundLateBidPricePremiumAmountExponent()');
    // Retired V3-prototype getter: 100% of the CST reward now goes to the outbid bidder.
    expect(signatures).not.toContain('lastBidderBidCstRewardAmountPercentage()');
  });

  it('exposes both BidPlaced overloads so the live refresh watcher matches V1 and V2/V3 topics', () => {
    const bidPlaced = abis.cosmicGameAbi.filter(
      (item): item is AbiEvent => item.type === 'event' && item.name === 'BidPlaced',
    );
    const inputCounts = bidPlaced.map((e) => (e.inputs ?? []).length).sort();
    expect(inputCounts).toEqual([7, 9]);
  });

  it('parses the human-readable CosmicDAO ABI into structured entries', () => {
    expect(functionNames(abis.cosmicDaoAbi).length).toBeGreaterThan(0);
    expect(eventNames(abis.cosmicDaoAbi)).toContain('ProposalCreated');
  });

  it('keeps the anchoring wallets distinct', () => {
    expect(abis.stakingWalletCstAbi).not.toBe(abis.stakingWalletRwlkAbi);
  });
});
