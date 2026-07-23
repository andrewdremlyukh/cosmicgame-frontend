import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { privacyCopyEn } from '@/content/legal/PrivacyContent.en';
import { privacyCopyZh } from '@/content/legal/PrivacyContent.zh';
import type { PrivacyCopy } from '@/content/legal/PrivacyContent';
import { termsCopyEn } from '@/content/legal/TermsContent.en';
import { termsCopyZh } from '@/content/legal/TermsContent.zh';
import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

function termsStructure(copy: typeof termsCopyEn | typeof termsCopyZh) {
  return {
    sections: copy.sections.map((section) => ({
      id: section.id,
      items: section.content.map((item) => item.id),
    })),
    additional: copy.additional.map((item) => item.id),
  };
}

function privacyStructure(copy: typeof privacyCopyEn | typeof privacyCopyZh) {
  return {
    introduction: copy.introduction.length,
    sections: copy.sections.map((section) => ({
      id: section.id,
      items: section.content.map((item) => item.id),
    })),
    additional: copy.additional.map((item) => item.id),
  };
}

describe('localized legal content', () => {
  it('keeps Terms clause structure in exact parity', () => {
    expect(termsStructure(termsCopyZh)).toEqual(termsStructure(termsCopyEn));
    expect(termsCopyZh.title).toBe('服务条款');
  });

  it('keeps Privacy clause structure in exact parity', () => {
    expect(privacyStructure(privacyCopyZh)).toEqual(privacyStructure(privacyCopyEn));
    expect(privacyCopyZh.title).toBe('隐私政策');
  });

  it('preserves Terms protocol facts and legal dates', () => {
    const chineseTerms = JSON.stringify(termsCopyZh);
    if (isV3Mechanics) {
      // V3 Terms describe the 2x-restart calibration window instead of the drift percentages.
      expect(chineseTerms).toContain('两倍');
    } else {
      expect(chineseTerms).toContain(
        String(protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture),
      );
      expect(chineseTerms).toContain(
        String(protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture),
      );
    }
    expect(chineseTerms).toContain(String(protocolFacts.finalGestureExclusivityHours));
    expect(chineseTerms).toContain(String(protocolFacts.secondaryRetrievalTimeoutWeeks));
    expect(termsCopyZh.lastUpdated).toContain('2026年7月20日');
  });

  it('describes Arbitrum settlement and smart-contract custody accurately in both locales', () => {
    const copy: PrivacyCopy = privacyCopyEn;
    const chineseCopy: PrivacyCopy = privacyCopyZh;
    const englishSecurity = copy.sections
      .flatMap((section) => section.content)
      .find((item) => item.id === 'blockchain')?.text;
    const chineseSecurity = chineseCopy.sections
      .flatMap((section) => section.content)
      .find((item) => item.id === 'blockchain')?.text;

    expect(englishSecurity).toMatch(/Arbitrum.*Ethereum Layer 2/);
    expect(englishSecurity).toMatch(/Connecting a wallet.*non-custodial/);
    expect(englishSecurity).toMatch(/transfer assets.*lock them.*release or retrieval/);
    expect(englishSecurity).not.toContain('remain in your wallet at all times');

    expect(chineseSecurity).toMatch(/Arbitrum.*以太坊二层/);
    expect(chineseSecurity).toMatch(/仅连接钱包.*非托管/);
    expect(chineseSecurity).toMatch(/转入协议合约.*锁定.*释放或取回/);
  });

  it('aligns the Terms IP carve-out with the scoped root CC0 dedication', () => {
    const englishIp = termsCopyEn.additional.find(
      (item) => item.id === 'intellectual-property',
    )?.text;
    const chineseIp = termsCopyZh.additional.find(
      (item) => item.id === 'intellectual-property',
    )?.text;

    expect(englishIp).toMatch(/root LICENSE.*CC0 1\.0/);
    expect(englishIp).toMatch(/Third-party dependencies.*retain their own licenses/);
    expect(englishIp).toMatch(/stated open-source license/);
    expect(englishIp).toMatch(/trademark or patent rights/);
    expect(chineseIp).toMatch(/根目录 LICENSE.*CC0 1\.0/);
    expect(chineseIp).toMatch(/第三方依赖.*各自的许可证/);
    expect(chineseIp).toMatch(/开源许可证/);
  });

  it('ships official CC0 legal code and preserves third-party license notices', () => {
    const license = readFileSync(join(process.cwd(), 'LICENSE'), 'utf8');
    const notices = readFileSync(join(process.cwd(), 'THIRD_PARTY_NOTICES.md'), 'utf8');

    expect(license).toContain('CC0 1.0 Universal');
    expect(license).toContain('1. Copyright and Related Rights.');
    expect(license).toContain('2. Waiver.');
    expect(license).toContain('3. Public License Fallback.');
    expect(license).toContain('4. Limitations and Disclaimers.');
    expect(license).toMatch(/project-owned source code, artwork,\ndocumentation/);
    expect(license).toMatch(/does not apply to third-party dependencies, fonts, assets/);

    expect(notices).toContain('assets/fonts/NotoSansSC-700.subset.ttf');
    expect(notices).toContain(
      '[assets/fonts/OFL-NotoSansCJK.txt](assets/fonts/OFL-NotoSansCJK.txt)',
    );
    expect(notices).toContain('SIL Open Font License 1.1');
    expect(notices).toContain('public/images/brands/geckoterminal-symbol.svg');
    expect(notices).toContain('https://brand.coingecko.com/resources/brand-kit');
  });
});
