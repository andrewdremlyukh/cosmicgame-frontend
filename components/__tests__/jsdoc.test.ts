import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const COMPONENTS_DIR = resolve(__dirname, '..');

const COMPONENT_FILES = [
  'home/AuctionInfo.tsx',
  'home/GestureForm.tsx',
  'home/DonatedTokensSection.tsx',
  'home/RoundInfoSection.tsx',
  'common/VideoPlayerDialog.tsx',
  'UserStatisticsView.tsx',
  'nft/NFTTrait.tsx',
] as const;

type FileEntry = {
  name: string;
  content: string;
  exports: string[];
};

const JSDOC_PATTERN = /\/\*\*[\s\S]*?\*\//;

function getExportedNames(source: string): string[] {
  const names: string[] = [];

  const fnDecl = /export\s+(?:async\s+)?function\s+(\w+)/g;
  const constDecl = /export\s+const\s+(\w+)\s*=/g;
  const interfaceDecl = /export\s+interface\s+(\w+)/g;

  let match: RegExpExecArray | null;
  while ((match = fnDecl.exec(source)) !== null) names.push(match[1]!);
  while ((match = constDecl.exec(source)) !== null) names.push(match[1]!);
  while ((match = interfaceDecl.exec(source)) !== null) names.push(match[1]!);

  const defaultExport = /export\s+default\s+(\w+)\s*;/.exec(source);
  if (defaultExport) {
    const defaultName = defaultExport[1]!;
    if (!names.includes(defaultName)) names.push(defaultName);
  }

  return names;
}

function hasJSDocBefore(source: string, name: string): boolean {
  const patterns = [
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`),
    new RegExp(`export\\s+const\\s+${name}\\s*=`),
    new RegExp(`export\\s+interface\\s+${name}\\b`),
    new RegExp(`(?:^|\\n)const\\s+${name}\\s*=`),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (!match) continue;

    const before = source.slice(0, match.index);
    const trimmed = before.trimEnd();
    return trimmed.endsWith('*/') && JSDOC_PATTERN.test(trimmed.slice(-500));
  }
  return false;
}

const files: FileEntry[] = COMPONENT_FILES.map((name) => {
  const content = readFileSync(resolve(COMPONENTS_DIR, name), 'utf-8');
  return { name, content, exports: getExportedNames(content) };
});

const EXPECTED_COUNTS: Record<string, number> = {
  'home/AuctionInfo.tsx': 1,
  'home/GestureForm.tsx': 1,
  'home/DonatedTokensSection.tsx': 1,
  'home/RoundInfoSection.tsx': 1,
  'common/VideoPlayerDialog.tsx': 1,
  'UserStatisticsView.tsx': 1,
  'nft/NFTTrait.tsx': 1,
};

describe('Component JSDoc coverage', () => {
  describe('every exported component/interface has a JSDoc comment', () => {
    for (const file of files) {
      describe(file.name, () => {
        for (const name of file.exports) {
          it(`${name} has JSDoc`, () => {
            expect(hasJSDocBefore(file.content, name)).toBe(true);
          });
        }
      });
    }
  });

  describe('exported counts match expectations', () => {
    it.each(COMPONENT_FILES)('%s has the expected number of exports', (name) => {
      const file = files.find((f) => f.name === name)!;
      expect(file.exports).toHaveLength(EXPECTED_COUNTS[name]!);
    });
  });

  describe('no export is missing from the inventory', () => {
    it('total exported symbols across all component files is 7', () => {
      const total = files.reduce((sum, f) => sum + f.exports.length, 0);
      expect(total).toBe(7);
    });
  });

  describe('JSDoc quality', () => {
    for (const file of files) {
      for (const name of file.exports) {
        it(`${file.name}:${name} JSDoc is not empty`, () => {
          const patterns = [
            new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`),
            new RegExp(`export\\s+const\\s+${name}\\s*=`),
            new RegExp(`export\\s+interface\\s+${name}\\b`),
            new RegExp(`(?:^|\\n)const\\s+${name}\\s*=`),
          ];
          for (const pattern of patterns) {
            const match = pattern.exec(file.content);
            if (!match) continue;
            const before = file.content.slice(0, match.index).trimEnd();
            const jsdocStart = before.lastIndexOf('/**');
            const jsdocEnd = before.lastIndexOf('*/');
            const jsdocBody = before.slice(jsdocStart + 3, jsdocEnd).trim();
            expect(jsdocBody.length).toBeGreaterThan(5);
          }
        });
      }
    }
  });
});
