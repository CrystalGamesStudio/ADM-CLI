/**
 * TDD — AI Knowledge system
 *
 * Assumptions:
 * - Input: version string + project root path
 * - Output: compact knowledge summary string (for system message)
 * - Cache file: ~/.adm/ai-knowledge.json with { version, summary, updatedAt }
 * - Boundary: no cache file → builds from docs, cache with same version → reads cache,
 *   cache with different version → rebuilds
 * - Source docs: README.md, PRD (plans/prd-v2.md), command list
 * - Mock: filesystem (fs module) — system boundary
 * - NOT tested: actual file content parsing quality, AI summarization
 */
const path = require('path');

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const fs = require('fs');

const { getKnowledge, buildKnowledge, KNOWLEDGE_DIR, KNOWLEDGE_FILE } = require('../../../src/ai/knowledge');

describe('AI Knowledge system', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildKnowledge — first run', () => {
    test('reads README.md and PRD to build summary', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('README.md')) return '# ADM CLI\nDeveloper assistant CLI tool.';
        if (filePath.endsWith('prd-v2.md')) return '# PRD\n## Commands\n- /help\n- /ai';
        return '';
      });

      const result = buildKnowledge('v0.2.0', '/project/root');

      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        'utf8',
      );
      expect(result).toContain('ADM CLI');
    });

    test('writes cache file after building', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockReturnValue('# ADM\nA tool.');

      buildKnowledge('v0.2.0', '/project/root');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('ai-knowledge.json'),
        expect.any(String),
        'utf8',
      );
      const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(written.version).toBe('v0.2.0');
      expect(written.summary).toBeTruthy();
    });

    test('creates ~/.adm/ directory if missing', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockReturnValue('# ADM');

      buildKnowledge('v0.2.0', '/project/root');

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        KNOWLEDGE_DIR,
        { recursive: true },
      );
    });
  });

  describe('getKnowledge — cache behavior', () => {
    test('returns cached summary when version matches', () => {
      const cached = { version: 'v0.2.0', summary: 'cached knowledge about ADM', updatedAt: '2026-01-01' };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(cached));

      const result = getKnowledge('v0.2.0', '/project/root');

      expect(result).toBe('cached knowledge about ADM');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('rebuilds cache when version changes', () => {
      const cached = { version: 'v0.1.0', summary: 'old knowledge', updatedAt: '2026-01-01' };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('ai-knowledge.json')) return JSON.stringify(cached);
        if (filePath.endsWith('README.md')) return '# ADM v0.2.0\nNew version';
        return '';
      });

      const result = getKnowledge('v0.2.0', '/project/root');

      expect(fs.writeFileSync).toHaveBeenCalled();
      const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(written.version).toBe('v0.2.0');
    });

    test('returns null when no docs are available', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockReturnValue('');

      const result = getKnowledge('v0.2.0', '/project/root');

      expect(result).toBeNull();
    });
  });
});
