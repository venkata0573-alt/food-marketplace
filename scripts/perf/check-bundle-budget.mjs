#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const budget = JSON.parse(readFileSync(join(root, 'budgets/first-load-js.json'), 'utf8'));

let sharedKb = Number(process.env.FIRST_LOAD_JS_SHARED_KB ?? NaN);

if (!Number.isFinite(sharedKb) && process.env.SKIP_BUNDLE_REBUILD !== '1') {
  const build = spawnSync('pnpm', ['--filter', '@food-marketplace/web', 'build'], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = `${build.stdout}\n${build.stderr}`;
  const match = output.match(/First Load JS shared by all\s+(\d+(?:\.\d+)?)\s*kB/i);
  if (!match) {
    console.error('Could not parse First Load JS from next build output');
    console.error(output.slice(-4000));
    process.exit(1);
  }
  sharedKb = Number(match[1]);
}

if (!Number.isFinite(sharedKb)) {
  console.error('Set FIRST_LOAD_JS_SHARED_KB or run without SKIP_BUNDLE_REBUILD');
  process.exit(1);
}

if (sharedKb > budget.maxGzipKb) {
  console.error(
    `First-load JS shared chunk ${sharedKb} kB exceeds budget ${budget.maxGzipKb} kB gzipped`,
  );
  process.exit(1);
}

const chunkDir = join(root, 'apps/web/.next/static/chunks');
if (existsSync(chunkDir)) {
  const mainApp = spawnSync(
    'bash',
    ['-lc', 'ls apps/web/.next/static/chunks/main-app-*.js 2>/dev/null | head -1'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  ).stdout.trim();
  if (mainApp) {
    const gzipKb = gzipSync(readFileSync(join(root, mainApp))).length / 1024;
    if (gzipKb > budget.maxGzipKb) {
      console.error(`main-app gzip ${gzipKb.toFixed(1)} kB exceeds ${budget.maxGzipKb} kB`);
      process.exit(1);
    }
  }
}

console.log(`OK: first-load JS within budget (shared ${sharedKb} kB, max ${budget.maxGzipKb} kB)`);
