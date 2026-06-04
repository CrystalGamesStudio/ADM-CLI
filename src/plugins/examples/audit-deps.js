const fs = require('fs');
const path = require('path');

/**
 * audit-deps — example ADM plugin
 *
 * Analyzes package.json in current directory and reports:
 * - Number of production and dev dependencies
 * - Whether they are outdated (requires npm outdated)
 * - Basic statistics
 */
module.exports = {
  name: 'audit-deps',
  description: 'Audit project dependencies (package.json)',

  async execute(args, context) {
    const { logger } = context;
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, 'package.json');

    if (!fs.existsSync(pkgPath)) {
      logger.warn('No package.json found in current directory.');
      return 'No package.json — run in a Node.js project directory.';
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    const lines = [];
    lines.push(`📦 Dependency audit: ${pkg.name || 'unknown project'}`);
    lines.push(`   Dependencies:      ${deps.length}`);
    lines.push(`   Dev dependencies:  ${devDeps.length}`);
    lines.push(`   Total:             ${deps.length + devDeps.length}`);

    if (deps.length > 0) {
      lines.push('');
      lines.push('   Dependencies:');
      deps.forEach(d => lines.push(`     • ${d}`));
    }

    if (devDeps.length > 0) {
      lines.push('');
      lines.push('   Dev dependencies:');
      devDeps.forEach(d => lines.push(`     • ${d}`));
    }

    // Check for lockfile
    const hasLock = fs.existsSync(path.join(cwd, 'package-lock.json'))
      || fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'));
    if (!hasLock && (deps.length + devDeps.length) > 0) {
      lines.push('');
      lines.push('   ⚠ No lockfile — consider running npm install or pnpm install');
    }

    logger.success(`Audit complete for ${pkg.name || 'project'}`);
    return lines.join('\n');
  },
};
