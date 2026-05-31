#!/usr/bin/env node
// Post-install launcher — runs adm setup after installation
const { execSync } = require('child_process');
const path = require('path');

const bin = path.join(__dirname, '..', 'bin', 'adm');
const args = process.argv.slice(2).join(' ');

try {
  execSync(`node "${bin}" setup ${args}`, { stdio: 'inherit' });
} catch (err) {
  console.error('Post-install setup failed. Run `adm setup` manually.');
  process.exit(1);
}
