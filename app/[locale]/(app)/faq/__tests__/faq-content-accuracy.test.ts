import { ethDistributionFacts, protocolFacts } from '@/content/protocol-facts';
import { faqContentEn, findFaqItemById, getAllFaqItems } from '@/content/faq';

const faqCategories = faqContentEn.categories;
const getAllItems = () => getAllFaqItems(faqContentEn);
const findItemById = (id: string) => findFaqItemById(faqContentEn, id);

/**
 * Contract-accuracy regression guard for FAQ copy.
 *
 * Every assertion here traces to behavior in the verified Arbitrum contracts
 * (CosmicSignatureGameV2 + periphery, exact-match verified on Sourcify).
 * The "banned claims" list captures misstatements that previously shipped and
 * were corrected during the 2026-07 contract audit; they must never return.
 */

function answerOf(id: string): string {
  const found = findItemById(id);
  expect(found).toBeDefined();
  return found!.item.answer;
}

describe('FAQ contract accuracy', () => {
  describe('banned inaccurate claims never reappear', () => {
    const bannedClaims: Array<[RegExp, string]> = [
      [
        /still belongs to the Final Gesture participant/i,
        'claimMainPrize pays whoever finalizes after the exclusivity timeout',
      ],
      [
        /does not transfer the Signature Allocation/i,
        'open finalization transfers the allocation to the finalizer',
      ],
      [
        /on behalf of the eligible/i,
        'PrizesWallet post-timeout retrieval pays the caller, not the original recipient',
      ],
      [/10% to 20%/, 'the increment grows exactly 1% per finalized cycle'],
      [
        /grows exponentially over time/i,
        'per-cycle growth is 1%; calendar-time growth decelerates',
      ],
      [/No more gestures/i, 'gestures stay open until finalization executes'],
      [
        /forward into the Cycle Reserve/i,
        'attached assets are escrowed in the Allocations Wallet, not the ETH reserve',
      ],
      [/16 wavelength bins/i, 'the render pipeline uses 64 wavelength bins'],
    ];

    it.each(bannedClaims)('no answer matches %s (%s)', (pattern) => {
      for (const item of getAllItems()) {
        expect(item.answer).not.toMatch(pattern);
      }
    });
  });

  describe('open finalization (claimMainPrize after the exclusivity timeout)', () => {
    it('states the exclusivity window length from protocol facts', () => {
      const answer = answerOf('what-is-open-finalization-window');
      expect(answer).toContain(String(protocolFacts.finalGestureExclusivityHours));
    });

    it('states that the finalizer receives the Signature Allocation', () => {
      const answer = answerOf('what-is-open-finalization-window');
      expect(answer).toMatch(/finalizer receives the full Signature Allocation/i);
    });

    it('retrieval answer covers both the 48h transfer and the 5-week escrow timeout', () => {
      const answer = answerOf('how-do-i-claim-my-allocation');
      expect(answer).toMatch(/whoever finalizes/i);
      expect(answer).toContain(String(protocolFacts.secondaryRetrievalTimeoutWeeks));
      expect(answer).toMatch(/retrieve an unretrieved allocation for themselves/i);
      expect(answer).toMatch(/Allocations Wallet/);
    });
  });

  describe('attached assets (PrizesWallet escrow)', () => {
    it('describes the Allocations Wallet escrow, not the Cycle Reserve', () => {
      expect(answerOf('what-happens-to-attached-assets')).toMatch(/Allocations Wallet/);
      expect(answerOf('donate-nfts-to-game')).toMatch(/Allocations Wallet escrow/); // lexicon-allow-line legacy FAQ id
    });
  });

  describe('time increment (mainPrizeTimeIncrementIncreaseDivisor = 100)', () => {
    it('states the exact per-cycle growth from protocol facts', () => {
      const growth = `${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%`;
      expect(answerOf('does-time-per-bid-stay-same')).toContain(growth); // lexicon-allow-line legacy FAQ id
      expect(answerOf('is-nft-supply-limited')).toContain(growth);
    });

    it('does not promise a hard supply cap', () => {
      expect(answerOf('is-nft-supply-limited')).toMatch(/no hard supply cap/i);
    });
  });

  describe('anchoring (StakingWalletNftBase.usedNfts + payout at unstake)', () => {
    it('states the once-only anchoring rule', () => {
      expect(answerOf('how-does-anchoring-work')).toMatch(/anchored only once/i);
    });

    it('states that accumulated ETH pays out at anchor release', () => {
      expect(answerOf('how-does-anchoring-work')).toMatch(/paid out when you release/i);
    });

    it('states the zero-anchor rollover behavior', () => {
      expect(answerOf('how-does-anchoring-work')).toMatch(/stays in the Cycle Reserve/i);
    });
  });

  describe('gesture rules (BiddingV2)', () => {
    it('states that the first gesture of a cycle must be ETH', () => {
      expect(answerOf('what-type-of-gestures-are-available')).toMatch(
        /first gesture of every cycle must be an ETH gesture/i,
      );
    });

    it('warns that plain transfers to the protocol address are processed as gestures', () => {
      expect(answerOf('donate-to-pot')).toMatch(/processed as an ETH gesture/i); // lexicon-allow-line legacy FAQ id
    });

    it('states that CST spent on gestures is burned', () => {
      expect(answerOf('what-can-i-do-with-cst')).toMatch(/burned/i);
    });

    it('describes the differing calibration floors (ETH ~1/200, CST to zero)', () => {
      const answer = answerOf('what-is-dutch-auction'); // lexicon-allow-line legacy FAQ id
      expect(answer).toContain(`1/${protocolFacts.ethCalibrationFloorDivisor}`);
      expect(answer).toMatch(/free CST gesture is possible/i);
    });
  });

  describe('Stellar Selection (draws with replacement)', () => {
    it('states that selections are drawn with replacement', () => {
      expect(answerOf('how-does-the-stellarSelection-work')).toMatch(/with replacement/i);
    });

    it('notes the skip conditions behind the "vast majority" NFT count', () => {
      expect(answerOf('how-many-nfts-minted')).toMatch(/skipped for that cycle/i); // lexicon-allow-line legacy FAQ id
    });
  });

  describe('owner powers (SystemManagementV2 + UUPS)', () => {
    it('locks parameters at cycle activation, not at the first gesture', () => {
      const answer = answerOf('team-controls');
      expect(answer).toMatch(/once the next cycle activates/i);
      expect(answer).not.toMatch(/Once a cycle begins \(at the first gesture\)/i);
    });

    it('discloses UUPS upgradeability between cycles', () => {
      expect(answerOf('team-controls')).toMatch(/UUPS/);
    });
  });

  describe('public goods beneficiary (CharityWallet owner-configured today)', () => {
    it('does not present Council beneficiary selection as a current fact', () => {
      const answer = answerOf('who-receives-10-percent');
      expect(answer).toMatch(/set by the protocol owner/i);
      expect(answer).toMatch(/Protocol Guild/);
    });

    it('CST/Council answer distinguishes designed vs current control', () => {
      const answer = answerOf('what-are-cst-and-dao');
      expect(answer).toMatch(/managed by the protocol owner/i);
      expect(answer).toMatch(/delegate/i);
    });
  });

  describe('ecosystem venues (Axiom Zero marketplace, Chaos Zero predictions)', () => {
    it('names Axiom Zero as the NFT trading venue', () => {
      expect(answerOf('how-to-trade-nfts-tokens')).toMatch(/Axiom Zero/);
      expect(answerOf('trade-on-arbitrum')).toMatch(/Axiom Zero/);
    });

    it('links the Axiom Zero collection page in the marketplace answer', () => {
      const answer = answerOf('where-to-buy-cosmic-signature-nfts');
      expect(answer).toContain('https://www.axiomzero.market/cosmic-signature');
      expect(answer).toMatch(/zero-fee/i);
      expect(answer).toMatch(/anchor status/i);
    });

    it('describes Chaos Zero as a prediction market resolved from gesture counts', () => {
      const answer = answerOf('cosmic-signature-prediction-market');
      expect(answer).toContain('https://chaoszero.com');
      expect(answer).toMatch(/prediction market/i);
      expect(answer).toMatch(/more gestures than the previous one/i);
      expect(answer).toMatch(/denominated in CST/i);
    });
  });

  describe('every percentage quoted in an answer derives from protocol facts', () => {
    const allowedPercents = new Set<number>([
      ethDistributionFacts.mainEthPercentage,
      ethDistributionFacts.chronoWarriorEthPercentage,
      ethDistributionFacts.stellarSelectionEthPercentage,
      ethDistributionFacts.anchorDistributionPercentage,
      ethDistributionFacts.publicGoodsPercentage,
      protocolFacts.compoundingReservePercentage,
      protocolFacts.randomWalkDiscountPercentage,
      protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture,
      protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture,
      protocolFacts.cycleTimeIncrementIncreasePercentPerCycle,
      protocolFacts.ethGestureCostStepUpPercent,
      protocolFacts.councilQuorumPercent,
    ]);

    it('finds no percentage outside the verified allowlist', () => {
      for (const category of faqCategories) {
        for (const item of category.items) {
          const matches = item.answer.matchAll(/(\d+(?:\.\d+)?)%/g);
          for (const match of matches) {
            const value = Number(match[1]);
            if (!allowedPercents.has(value)) {
              throw new Error(
                `FAQ "${item.id}" quotes ${value}% which is not derived from protocolFacts`,
              );
            }
          }
        }
      }
    });
  });
});
