#!/usr/bin/env node
// Build a Claude Code Plugin package from the repo.
//
// Produces TWO artifacts:
//
// A. The plugin itself at build/plugin/rozo-intents/
//      .claude-plugin/
//        plugin.json                (rendered from plugin/plugin.json.tmpl)
//      skills/
//        rozo-intents/SKILL.md      (router)
//        send-payment/ check-balance/ parse-qr/ payment-status/
//      scripts/dist/                (runtime scripts, .d.ts stripped)
//      references/
//      LICENSE.md
//
// B. The repo-root marketplace manifest at .claude-plugin/marketplace.json
//    (NOTE: this lives at the REPO ROOT, not inside build/). It turns this
//    whole git repo into an installable Claude Code plugin marketplace via
//    the git-subdir source type, pointing at the plugin artifact above.
//
// After building, commit both the marketplace.json and build/plugin/* and
// push to GitHub. Users install with:
//
//   /plugin marketplace add RozoAI/rozo-intents-skills
//   /plugin install rozo-intents@rozo-hub
//
// Usage: node plugin/build-plugin.mjs

import { join } from 'node:path';
import {
  REPO_ROOT,
  BUILD_ROOT,
  loadVersionInfo,
  cleanDir,
  copyTree,
  renderTemplate,
  writeRendered,
  stampVersionInFile,
  substitutionsFrom,
  log,
} from './build-lib.mjs';

const versionInfo = loadVersionInfo();
const outDir = join(BUILD_ROOT, 'plugin', versionInfo.name);
const substitutions = substitutionsFrom(versionInfo);

log('plugin', `Building ${versionInfo.name}@${versionInfo.version}`);
log('plugin', `Output: ${outDir}`);

// 1. Clean + create plugin output dir
cleanDir(outDir);

// 2. Render .claude-plugin/plugin.json (inside the plugin artifact)
writeRendered(
  join(outDir, '.claude-plugin', 'plugin.json'),
  renderTemplate(join(REPO_ROOT, 'plugin', 'plugin.json.tmpl'), substitutions),
);

// 3. Copy the full skills/ tree (router + sub-skills)
copyTree(
  join(REPO_ROOT, 'skills'),
  join(outDir, 'skills'),
);

// 4. Copy runtime scripts (dist only)
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

// 7. Stamp __VERSION__ in the router SKILL.md inside the plugin
stampVersionInFile(
  join(outDir, 'skills', versionInfo.name, 'SKILL.md'),
  versionInfo.version,
);

// 8. Render the REPO-ROOT marketplace manifest.
//    This is what turns the git repo itself into an installable marketplace.
//    Lives at <repo>/.claude-plugin/marketplace.json — NOT inside build/.
const rootMarketplacePath = join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
writeRendered(
  rootMarketplacePath,
  renderTemplate(join(REPO_ROOT, 'plugin', 'marketplace.json.tmpl'), substitutions),
);
log('plugin', `Wrote repo-root marketplace manifest: ${rootMarketplacePath}`);

log('plugin', 'Done.');
