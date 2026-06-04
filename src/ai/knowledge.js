const fs = require('fs');
const path = require('path');
const os = require('os');

const KNOWLEDGE_DIR = path.join(os.homedir(), '.adm');
const KNOWLEDGE_FILE = path.join(KNOWLEDGE_DIR, 'ai-knowledge.json');

const SOURCE_DOCS = ['README.md', path.join('plans', 'prd-v2.md')];

function buildKnowledge(version, projectRoot) {
  const parts = [];

  for (const doc of SOURCE_DOCS) {
    const filePath = path.join(projectRoot, doc);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Take first 500 chars per doc for compactness
      const compact = content.substring(0, 500).trim();
      if (compact) {
        parts.push(`--- ${path.basename(doc)} ---\n${compact}`);
      }
    } catch {
      // doc missing — skip
    }
  }

  if (parts.length === 0) return null;

  const summary = parts.join('\n\n');
  const cache = {
    version,
    summary,
    updatedAt: new Date().toISOString(),
  };

  // Ensure ~/.adm/ exists
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(cache, null, 2), 'utf8');

  return summary;
}

function getKnowledge(version, projectRoot) {
  // Try reading cache
  try {
    const raw = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
    const cached = JSON.parse(raw);
    if (cached.version === version) {
      return cached.summary;
    }
    // Version changed — rebuild
  } catch {
    // No cache — build fresh
  }

  return buildKnowledge(version, projectRoot);
}

module.exports = { getKnowledge, buildKnowledge, KNOWLEDGE_DIR, KNOWLEDGE_FILE };
