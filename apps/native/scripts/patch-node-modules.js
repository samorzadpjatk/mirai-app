#!/usr/bin/env node
/*
  Patch script for react-native-css-interop parseAspectRatio
  - Idempotent: will not reapply if already patched
  - Backs up original files to <file>.integral-app.bak
  Run automatically via package.json predev hook
*/
import fs from 'fs/promises';
import path from 'path';

function log(...args) {
  console.log('[patch-node-modules]', ...args);
}

async function tryResolve(pkg) {
  try {
    // resolve the package.json to locate package root
    const pkgPath = require.resolve(pkg + '/package.json');
    return path.dirname(pkgPath);
  } catch (err) {
    return null;
  }
}

async function patchFile(filePath, replacementFn, marker) {
  try {
    const original = await fs.readFile(filePath, 'utf8');
    if (original.includes(marker)) {
      log('Already patched:', filePath);
      return { patched: false, reason: 'already-patched' };
    }

    const patched = replacementFn(original);
    if (patched === original) {
      log('No change needed for', filePath);
      return { patched: false, reason: 'no-change' };
    }

    // backup
    const bakPath = filePath + '.integral-app.bak';
    try {
      await fs.stat(bakPath);
      // backup exists
    } catch (e) {
      await fs.writeFile(bakPath, original, 'utf8');
      log('Backup created:', bakPath);
    }

    await fs.writeFile(filePath, patched, 'utf8');
    log('Patched:', filePath);
    return { patched: true };
  } catch (err) {
    log('Error patching', filePath, err && err.message);
    return { patched: false, reason: err && err.message };
  }
}

function replaceParseAspectRatioJS(src) {
  const marker = '/* integral-app: parseAspectRatio guard */';
  const re = /function\s+parseAspectRatio\([\s\S]*?\n\}/m;
  if (!re.test(src)) return src;

  const replacement = `function parseAspectRatio(aspectRatio) {
    ${marker}
    // Defensive: ensure the incoming structure is valid to avoid runtime throws
    if (!aspectRatio) {
      return "auto";
    }
    if (aspectRatio.auto) {
      return "auto";
    }
    if (!aspectRatio.ratio || !Array.isArray(aspectRatio.ratio) || aspectRatio.ratio.length < 2) {
      return "auto";
    }
    if (aspectRatio.ratio[0] === aspectRatio.ratio[1]) {
      return 1;
    }
    return aspectRatio.ratio.join(" / ");
  }`;

  return src.replace(re, replacement);
}

function replaceParseAspectRatioTS(src) {
  const marker = '/* integral-app: parseAspectRatio guard */';
  const re = /function\s+parseAspectRatio\([\s\S]*?\n\}/m;
  if (!re.test(src)) return src;

  const replacement = `function parseAspectRatio(
  // This is missing types
  aspectRatio: any,
): RuntimeValueDescriptor {
  ${marker}
  // Defensive: ensure shape is valid
  if (!aspectRatio) {
    return "auto";
  }
  if (aspectRatio.auto) {
    return "auto";
  }
  if (!aspectRatio.ratio || !Array.isArray(aspectRatio.ratio) || aspectRatio.ratio.length < 2) {
    // Fallback to 'auto' to avoid crashes when ratio is malformed
    return "auto";
  }
  if (aspectRatio.ratio[0] === aspectRatio.ratio[1]) {
    return 1;
  } else {
    return aspectRatio.ratio.join(" / ");
  }
}
`;
  return src.replace(re, replacement);
}

(async function main() {
  const pkgDir = await tryResolve('react-native-css-interop');
  if (!pkgDir) {
    log('Package react-native-css-interop not found in node_modules, skipping.');
    process.exit(0);
  }

  log('Found package at', pkgDir);

  const filesToPatch = [
    { file: path.join(pkgDir, 'dist', 'css-to-rn', 'parseDeclaration.js'), fn: replaceParseAspectRatioJS },
    { file: path.join(pkgDir, 'src', 'css-to-rn', 'parseDeclaration.ts'), fn: replaceParseAspectRatioTS },
  ];

  for (const { file, fn } of filesToPatch) {
    try {
      await fs.access(file);
      await patchFile(file, fn, 'integral-app: parseAspectRatio guard');
    } catch (e) {
      log('File not present, skipping:', file);
    }
  }

  log('Done. If you still see the original error, try reinstalling node_modules or run this script manually.');
})();
