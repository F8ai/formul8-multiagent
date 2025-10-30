#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function findModelComparisonFiles(rootDir) {
  const files = fs.readdirSync(rootDir);
  return files
    .filter(f => f.startsWith('model-comparison-') && f.endsWith('.json'))
    .map(f => path.join(rootDir, f));
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

function main() {
  const repoRoot = process.cwd();
  const docsDir = path.join(repoRoot, 'docs');
  const targetDir = path.join(docsDir, 'test-results', 'latest-comparison-3');

  ensureDir(targetDir);

  const files = findModelComparisonFiles(repoRoot);
  if (files.length === 0) {
    console.log('No model-comparison-*.json files found in repo root.');
  }

  const manifest = { models: [] };

  for (const abs of files) {
    const filename = path.basename(abs);
    const dest = path.join(targetDir, filename);
    copyFile(abs, dest);

    // Derive key from filename: model-comparison-<key>-<timestamp>.json
    const match = filename.match(/^model-comparison-([^-]+)-/);
    const key = match ? match[1] : filename.replace('.json', '');

    // Use web path relative to docs/models.html
    const webPath = `test-results/latest-comparison-3/${filename}`;

    manifest.models.push({ key, path: webPath, file: filename });
  }

  const manifestPath = path.join(targetDir, 'index.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Wrote manifest with ${manifest.models.length} models at: ${path.relative(repoRoot, manifestPath)}`);
  if (files.length > 0) {
    console.log('Copied files:');
    for (const f of files) {
      console.log(' -', path.relative(repoRoot, path.join(targetDir, path.basename(f))));
    }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('Failed to publish model comparison files:', e);
    process.exit(1);
  }
}
