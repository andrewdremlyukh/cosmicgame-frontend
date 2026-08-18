import {
  faqContentEn,
  faqContentZh,
  findFaqItemById,
  getAllFaqItems,
  getFaqContent,
  type FAQContent,
} from '@/content/faq';
import { ethDistributionFacts, protocolFacts } from '@/content/protocol-facts';

import { faqPageJsonLd } from '@/utils/jsonLd';

// lexicon-allow-start: immutable legacy FAQ URL fragments.
const CYCLE_MECHANICS_ID = 'how-does-the-bidding-game-work';
const CALIBRATION_WINDOW_ID = 'what-is-dutch-auction';
const FORK_SITE_ID = 'can-create-competing-site';
// lexicon-allow-end

function itemShape(content: FAQContent) {
  return content.categories.map((category) => ({
    id: category.id,
    icon: category.icon,
    items: category.items.map(({ id, hashAnchor }) => ({ id, hashAnchor })),
  }));
}

function urls(value: string): string[] {
  return [...value.matchAll(/https?:\/\/[A-Za-z0-9./?=_-]+/g)].map(([url]) => url);
}

describe('localized FAQ content', () => {
  it('selects complete locale content without article fallback', () => {
    expect(getFaqContent('en-US')).toBe(faqContentEn);
    expect(getFaqContent('zh-Hans')).toBe(faqContentZh);
  });

  it('preserves category, item, icon, hash-anchor, and popular-ID structure', () => {
    expect(itemShape(faqContentZh)).toEqual(itemShape(faqContentEn));
    expect(faqContentZh.popularQuestionIds).toEqual(faqContentEn.popularQuestionIds);
    expect(faqContentEn.categories).toHaveLength(6);
    expect(getAllFaqItems(faqContentEn)).toHaveLength(67);
    expect(getAllFaqItems(faqContentZh)).toHaveLength(67);
  });

  it('ships Chinese for every question and answer', () => {
    for (const item of getAllFaqItems(faqContentZh)) {
      expect(item.question).toMatch(/[\u3400-\u9fff]/);
      expect(item.answer).toMatch(/[\u3400-\u9fff]/);
    }
  });

  it('preserves every explicit URL item-by-item', () => {
    const english = new Map(getAllFaqItems(faqContentEn).map((item) => [item.id, item]));
    for (const item of getAllFaqItems(faqContentZh)) {
      expect(urls(item.answer)).toEqual(urls(english.get(item.id)!.answer));
    }
  });

  it('preserves contract-critical numeric facts in Chinese answers', () => {
    const answer = (id: string) => findFaqItemById(faqContentZh, id)!.item.answer;

    expect(answer(CYCLE_MECHANICS_ID)).toContain(
      `${protocolFacts.cycleTimeIncrementIncreasePercentPerCycle}%`,
    );
    expect(answer(CYCLE_MECHANICS_ID)).toContain(
      String(protocolFacts.finalGestureExclusivityHours),
    );
    expect(answer('how-do-i-claim-my-allocation')).toContain(
      String(protocolFacts.secondaryRetrievalTimeoutWeeks),
    );
    expect(answer('how-does-anchoring-work')).toContain(
      `${ethDistributionFacts.anchorDistributionPercentage}%`,
    );
    expect(answer(CALIBRATION_WINDOW_ID)).toContain(
      `1/${protocolFacts.ethCalibrationFloorDivisor}`,
    );
    expect(answer('how-are-nft-images-created')).toMatch(/380.*700.*64/);
  });

  it('scopes CC0 reuse claims to project-owned materials in both locales', () => {
    const english = findFaqItemById(faqContentEn, FORK_SITE_ID)!.item.answer;
    const chinese = findFaqItemById(faqContentZh, FORK_SITE_ID)!.item.answer;

    expect(english).toMatch(/Project-owned.*CC0 1\.0/);
    expect(english).toMatch(/Third-party.*retain their own licenses/);
    expect(english).not.toMatch(/Every contract|entire repository|everything/i);
    expect(chinese).toMatch(/项目自有.*CC0 1\.0/);
    expect(chinese).toMatch(/第三方.*各自的许可证/);
    expect(chinese).not.toMatch(/整个代码仓库|所有合约/);
  });

  it('builds Chinese FAQ structured data with zh-Hans language', () => {
    const items = getAllFaqItems(faqContentZh);
    const jsonLd = faqPageJsonLd(items, 'zh-Hans');
    expect(jsonLd.inLanguage).toBe('zh-Hans');
    expect(jsonLd.mainEntity).toHaveLength(67);
    expect(jsonLd.mainEntity[0]?.name).toBe(items[0]?.question);
    expect(jsonLd.mainEntity[0]?.acceptedAnswer.text).toBe(items[0]?.answer);
  });
});
