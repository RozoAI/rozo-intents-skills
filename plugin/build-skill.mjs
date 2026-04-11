#!/usr/bin/env node
// Build a Claude Skill package from the repo.
//
// Output layout: build/skill/rozo-intents/
//   SKILL.md                 (router, version stamped from version.json)
//   skills/                  (sub-skills: send-payment, check-balance, ...)
//   scripts/dist/            (runtime scripts, .d.ts stripped)
//   references/              (chain/api/wallet reference docs)
//   LICENSE.md
//
// Usage: node plugin/build-skill.mjs

import { join } from 'node:path';
import {
  REPO_ROOT,
  BUILD_ROOT,
  loadVersionInfo,
  cleanDir,
  copyTree,
  stampVersionInFile,
  log,
} from './build-lib.mjs';

const versionInfo = loadVersionInfo();
const outDir = join(BUILD_ROOT, 'skill', versionInfo.name);

log('skill', `Building ${versionInfo.name}@${versionInfo.version}`);
log('skill', `Output: ${outDir}`);

// 1. Clean + create output dir
cleanDir(outDir);

// 2. Copy router SKILL.md to the top of the skill package
copyTree(
  join(REPO_ROOT, 'skills', versionInfo.name, 'SKILL.md'),
  join(outDir, 'SKILL.md'),
);

// 3. Copy sub-skills (every skills/* except the router itself)
const subSkills = ['send-payment', 'check-balance', 'parse-qr', 'payment-status'];
for (const name of subSkills) {
  copyTree(
    join(REPO_ROOT, 'skills', name),
    join(outDir, 'skills', name),
  );
}

// 4. Copy runtime scripts (scripts/dist only — no src, no node_modules)
copyTree(
  join(REPO_ROOT, 'scripts', 'dist'),
  join(outDir, 'scripts', 'dist'),
);

// 5. Copy references
copyTree(
  join(REPO_ROOT, 'references'),
  join(outDir, 'references'),
);

// 6. Copy LICENSE
copyTree(
  join(REPO_ROOT, 'LICENSE.md'),
  join(outDir, 'LICENSE.md'),
);

// 7. Stamp __VERSION__ in the router SKILL.md
stampVersionInFile(join(outDir, 'SKILL.md'), versionInfo.version);

log('skill', 'Done.');
