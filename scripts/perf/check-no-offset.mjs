#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const repoDirs = [join(root, 'apps/web/src/server/repositories'), join(root, 'packages/db/src')];

const banned = /\bOFFSET\b/i;
let violations = [];

for (const dir of repoDirs) {
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    if (!file.isFile() || !file.name.endsWith('.ts')) {
      continue;
    }
    const path = join(dir, file.name);
    const text = readFileSync(path, 'utf8');
    if (banned.test(text)) {
      violations.push(path);
    }
  }
}

if (violations.length > 0) {
  console.error('OFFSET pagination is banned. Use cursor/keyset pagination instead:\n');
  for (const path of violations) {
    console.error(`  - ${path}`);
  }
  process.exit(1);
}

console.log('OK: no OFFSET in repositories');
