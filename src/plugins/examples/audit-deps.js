const fs = require('fs');
const path = require('path');

/**
 * audit-deps — przykładowa wtyczka ADM
 *
 * Analizuje package.json w bieżącym katalogu i raportuje:
 * - Liczbę zależności produkcyjnych i deweloperskich
 * - Czy są outdated (wymaga npm outdated)
 * - Podstawowe statystyki
 */
module.exports = {
  name: 'audit-deps',
  description: 'Audytuje zależności projektu (package.json)',

  async execute(args, context) {
    const { logger } = context;
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, 'package.json');

    if (!fs.existsSync(pkgPath)) {
      logger.warn('Nie znaleziono package.json w bieżącym katalogu.');
      return 'Brak package.json — uruchom w katalogu projektu Node.js.';
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    const lines = [];
    lines.push(`📦 Audyt zależności: ${pkg.name || 'nieznany projekt'}`);
    lines.push(`   Zależności:       ${deps.length}`);
    lines.push(`   Dev dependencies:  ${devDeps.length}`);
    lines.push(`   Łącznie:          ${deps.length + devDeps.length}`);

    if (deps.length > 0) {
      lines.push('');
      lines.push('   Zależności:');
      deps.forEach(d => lines.push(`     • ${d}`));
    }

    if (devDeps.length > 0) {
      lines.push('');
      lines.push('   Dev dependencies:');
      devDeps.forEach(d => lines.push(`     • ${d}`));
    }

    // Sprawdź czy jest lockfile
    const hasLock = fs.existsSync(path.join(cwd, 'package-lock.json'))
      || fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'));
    if (!hasLock && (deps.length + devDeps.length) > 0) {
      lines.push('');
      lines.push('   ⚠ Brak lockfile — rozważ npm install lub pnpm install');
    }

    logger.success(`Audyt zakończony dla ${pkg.name || 'projektu'}`);
    return lines.join('\n');
  },
};
