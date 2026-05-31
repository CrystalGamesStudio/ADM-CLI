#!/usr/bin/env node
const { runInstallers } = require('../src/installers');

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run') || process.env.ADM_DRY_RUN === '1';
  const res = await runInstallers({ dryRun: dry });
  if (res.dryRun) {
    console.log('ADM INSTALLERS - DRY RUN');
    console.log(JSON.stringify(res.planned, null, 2));
    process.exit(0);
  }
  console.log('Execution not implemented in run-installers.js (safe stub)');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
