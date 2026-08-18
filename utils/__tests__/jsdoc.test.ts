import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UTILS_DIR = resolve(__dirname, '..');

const UTIL_FILES = [
  'alert.ts',
  'analytics.ts',
  'contractErrors.ts',
  'contractWrite.ts',
  'endurance.ts',
  'errors.ts',
  'format.ts',
  'metadata.ts',
  'seo.ts',
  'urls.ts',
  'wallet.ts',
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
  const arrowDecl = /export\s+const\s+(\w+)\s*=/g;
  const defaultFnDecl = /export\s+default\s+function\s+(\w+)/g;

  let match: RegExpExecArray | null;
  while ((match = fnDecl.exec(source)) !== null) {
    if (!source.slice(Math.max(0, match.index - 10), match.index).includes('default')) {
      names.push(match[1]!);
    }
  }
  while ((match = arrowDecl.exec(source)) !== null) names.push(match[1]!);
  while ((match = defaultFnDecl.exec(source)) !== null) names.push(match[1]!);

  return names;
}

function hasJSDocBefore(source: string, fnName: string): boolean {
  const patterns = [
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${fnName}\\b`),
    new RegExp(`export\\s+const\\s+${fnName}\\s*=`),
    new RegExp(`export\\s+default\\s+function\\s+${fnName}\\b`),
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

const files: FileEntry[] = UTIL_FILES.map((name) => {
  const content = readFileSync(resolve(UTILS_DIR, name), 'utf-8');
  return { name, content, exports: getExportedNames(content) };
});

const EXPECTED_COUNTS: Record<string, number> = {
  'alert.ts': 1,
  'analytics.ts': 3,
  'contractErrors.ts': 6,
  'contractWrite.ts': 1,
  'endurance.ts': 3,
  'errors.ts': 6,
  'format.ts': 23,
  'metadata.ts': 1,
  'seo.ts': 1,
  'urls.ts': 7,
  'wallet.ts': 2,
};

describe('Utils JSDoc coverage', () => {
  describe('every exported function/constant has a JSDoc comment', () => {
    for (const file of files) {
      describe(file.name, () => {
        for (const fn of file.exports) {
          it(`${fn} has JSDoc`, () => {
            expect(hasJSDocBefore(file.content, fn)).toBe(true);
          });
        }
      });
    }
  });

  describe('exported counts match expectations', () => {
    it.each(UTIL_FILES)('%s has the expected number of exports', (name) => {
      const file = files.find((f) => f.name === name)!;
      expect(file.exports).toHaveLength(EXPECTED_COUNTS[name]!);
    });
  });

  describe('no function is missing from the inventory', () => {
    it('total exported functions/constants across all util files is 54', () => {
      const total = files.reduce((sum, f) => sum + f.exports.length, 0);
      expect(total).toBe(54);
    });
  });

  describe('JSDoc quality', () => {
    for (const file of files) {
      for (const fn of file.exports) {
        it(`${file.name}:${fn} JSDoc is not empty`, () => {
          const patterns = [
            new RegExp(`export\\s+(?:async\\s+)?function\\s+${fn}\\b`),
            new RegExp(`export\\s+const\\s+${fn}\\s*=`),
            new RegExp(`export\\s+default\\s+function\\s+${fn}\\b`),
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
