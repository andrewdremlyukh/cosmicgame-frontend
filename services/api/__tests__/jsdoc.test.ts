// lexicon-allow-start: service test fixtures mirror the backend-sealed API surface

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SERVICE_DIR = resolve(__dirname, '..');

const SERVICE_FILES = [
  'client.ts',
  'rounds.ts',
  'tokens.ts',
  'anchoring.ts',
  'donations.ts',
  'users.ts',
  'stellarSelection.ts',
  'marketing.ts',
  'system.ts',
] as const;

type FileEntry = {
  name: string;
  content: string;
  exports: string[];
};

const JSDOC_PATTERN = /\/\*\*[\s\S]*?\*\//;

function getExportedFunctionNames(source: string): string[] {
  const names: string[] = [];
  const fnDecl = /export\s+(?:async\s+)?function\s+(\w+)/g;
  const arrowDecl = /export\s+const\s+(\w+)\s*=/g;
  let match: RegExpExecArray | null;
  while ((match = fnDecl.exec(source)) !== null) names.push(match[1]!);
  while ((match = arrowDecl.exec(source)) !== null) names.push(match[1]!);
  return names;
}

function hasJSDocBefore(source: string, fnName: string): boolean {
  const fnPatterns = [
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${fnName}\\b`),
    new RegExp(`export\\s+const\\s+${fnName}\\s*=`),
  ];

  for (const pattern of fnPatterns) {
    const match = pattern.exec(source);
    if (!match) continue;

    const before = source.slice(0, match.index);
    const trimmed = before.trimEnd();
    return trimmed.endsWith('*/') && JSDOC_PATTERN.test(trimmed.slice(-500));
  }
  return false;
}

const files: FileEntry[] = SERVICE_FILES.map((name) => {
  const content = readFileSync(resolve(SERVICE_DIR, name), 'utf-8');
  return { name, content, exports: getExportedFunctionNames(content) };
});

const EXPECTED_COUNTS: Record<string, number> = {
  'client.ts': 21,
  'rounds.ts': 15,
  'tokens.ts': 18,
  'anchoring.ts': 20,
  'donations.ts': 14,
  'users.ts': 11,
  'stellarSelection.ts': 3,
  'marketing.ts': 2,
  'system.ts': 3,
};

describe('API service JSDoc coverage', () => {
  describe('every exported function has a JSDoc comment', () => {
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

  describe('exported function counts match expectations', () => {
    it.each(SERVICE_FILES)('%s has the expected number of exports', (name) => {
      const file = files.find((f) => f.name === name)!;
      expect(file.exports).toHaveLength(EXPECTED_COUNTS[name]!);
    });
  });

  describe('no function is missing from the inventory', () => {
    it('total exported functions across all service files is 107', () => {
      const total = files.reduce((sum, f) => sum + f.exports.length, 0);
      expect(total).toBe(107);
    });
  });

  describe('JSDoc quality', () => {
    for (const file of files) {
      for (const fn of file.exports) {
        it(`${file.name}:${fn} JSDoc is not empty`, () => {
          const fnPatterns = [
            new RegExp(`export\\s+(?:async\\s+)?function\\s+${fn}\\b`),
            new RegExp(`export\\s+const\\s+${fn}\\s*=`),
          ];
          for (const pattern of fnPatterns) {
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

// lexicon-allow-end
