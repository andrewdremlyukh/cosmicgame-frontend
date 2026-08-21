import { faqContentEn } from '@/content/faq/en';
import { faqContentZh } from '@/content/faq/zh';
import { howItWorksContentEn } from '@/content/how-it-works/en';
import { howItWorksContentZh } from '@/content/how-it-works/zh';
import { landingContentEn } from '@/content/landing/en';
import { landingContentZh } from '@/content/landing/zh';
import { termsCopyEn } from '@/content/legal/TermsContent.en';
import { termsCopyZh } from '@/content/legal/TermsContent.zh';
import { isV3Mechanics, nftAllocationFacts, protocolFacts } from '@/content/protocol-facts';

/**
 * The Signature Allocation mints `nftAllocationFacts.mainPrizeNfts` NFTs (1 in
 * V2, 3 in V3); every other track still mints exactly one. Static copy used to
 * spell "one Cosmic Signature NFT" for all of them, which silently became wrong
 * for the Signature Allocation under V3. These tests pin both halves.
 */
const EN_MODULES = {
  faq: faqContentEn,
  landing: landingContentEn,
  howItWorks: howItWorksContentEn,
  terms: termsCopyEn,
};
const ZH_MODULES = {
  faq: faqContentZh,
  landing: landingContentZh,
  howItWorks: howItWorksContentZh,
  terms: termsCopyZh,
};

/** Every leaf string in a content tree, so checks never bleed across fields. */
function leafStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => leafStrings(v, out));
  else if (value && typeof value === 'object')
    Object.values(value).forEach((v) => leafStrings(v, out));
  return out;
}

const describesSignatureAllocation = (s: string) =>
  /Final Gesture|Signature Allocation/.test(s) && /Cosmic Signature NFT/.test(s);

describe('Cosmic Signature NFT counts in static copy', () => {
  it('states the version-appropriate Signature Allocation phrase', () => {
    for (const [name, mod] of Object.entries(EN_MODULES)) {
      const hit = leafStrings(mod).some((s) =>
        s.includes(nftAllocationFacts.mainPrizeNftPhrase.en),
      );
      expect(`${name} uses the EN phrase: ${hit}`).toBe(`${name} uses the EN phrase: true`);
    }
    for (const [name, mod] of Object.entries(ZH_MODULES)) {
      const hit = leafStrings(mod).some((s) =>
        s.includes(nftAllocationFacts.mainPrizeNftPhrase.zh),
      );
      expect(`${name} uses the ZH phrase: ${hit}`).toBe(`${name} uses the ZH phrase: true`);
    }
  });

  // Only meaningful under V3: in V2 the correct phrase is literally "one Cosmic
  // Signature NFT", so a hardcoded string is indistinguishable from a generated
  // one. Under V3 any singular next to a Signature Allocation mention is a bug.
  const itUnderV3 = isV3Mechanics ? it : it.skip;
  itUnderV3('leaves no singular NFT claim in Signature Allocation copy', () => {
    const offenders: string[] = [];
    for (const [name, mod] of Object.entries(EN_MODULES)) {
      for (const s of leafStrings(mod)) {
        if (describesSignatureAllocation(s) && /\b(one|a) Cosmic Signature NFT\b/.test(s)) {
          offenders.push(`${name}: ${s.slice(0, 140)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the single-NFT tracks at one NFT in both versions', () => {
    const roles = [
      'Endurance Champion receives',
      'Chrono-Warrior receives',
      'last CST gesture of the cycle receives',
    ];
    const strings = leafStrings(faqContentEn).concat(leafStrings(termsCopyEn));

    for (const role of roles) {
      const sentence = strings.find((s) => s.includes(role));
      expect(`${role} -> ${sentence ? 'found' : 'MISSING'}`).toBe(`${role} -> found`);
      expect(sentence).toContain('one Cosmic Signature NFT');
    }
  });

  it('reports a per-cycle total that matches the per-track breakdown', () => {
    const total = nftAllocationFacts.typicalNftsPerCycle;
    expect(total).toBe(
      nftAllocationFacts.mainPrizeNfts +
        (protocolFacts.roleNftsPerCycle - protocolFacts.mainPrizeNftsPerCycle) +
        protocolFacts.stellarNftsPerCycle,
    );
    expect(total).toBe(isV3Mechanics ? 26 : 24);

    for (const mod of [termsCopyEn, faqContentEn]) {
      expect(leafStrings(mod).some((s) => s.includes(`${total} Cosmic Signature NFT`))).toBe(true);
    }
  });
});
