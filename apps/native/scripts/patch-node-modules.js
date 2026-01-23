#!/usr/bin/env bun
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
    // Standard resolution (works when package is resolvable from this package)
    const pkgPath = require.resolve(pkg + '/package.json');
    return path.dirname(pkgPath);
  } catch (err) {
    return null;
  }
}

// Find repository root by looking for bun.lock or .git
async function findRepoRoot(start = process.cwd()) {
  let dir = start;
  const { root } = path.parse(dir);
  while (dir !== root) {
    try {
      const files = await fs.readdir(dir);
      if (files.includes('bun.lock') || files.includes('.git')) {
        return dir;
      }
    } catch (e) {
      // ignore
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

async function findPkgDirsPnpm(pkgName) {
  const found = new Set();

  // 1) try normal resolution
  const viaResolve = await tryResolve(pkgName);
  if (viaResolve) found.add(viaResolve);

  // 2) search common locations from repo root
  const repoRoot = await findRepoRoot();
  const nm = path.join(repoRoot, 'node_modules');

  // helper to push if exists
  async function tryAdd(p) {
    try {
      await fs.access(p);
      found.add(p);
    } catch (e) {
      // not found
    }
  }

  // node_modules/<pkg>/package.json
  await tryAdd(path.join(nm, pkgName));

  // workspace packages (packages/*, apps/*)
  for (const workspaceFolder of ['packages', 'apps', 'libs', 'modules']) {
    const wf = path.join(repoRoot, workspaceFolder);
    try {
      const subs = await fs.readdir(wf);
      for (const sub of subs) {
        const candidate = path.join(wf, sub, 'node_modules', pkgName);
        await tryAdd(candidate);
        // also check if the package itself matches the name (local workspace package)
        const localCandidate = path.join(wf, sub);
        try {
          const pkgJson = await fs.readFile(path.join(localCandidate, 'package.json'), 'utf8');
          if (pkgJson.includes(`"name": "${pkgName}"`)) {
            await tryAdd(localCandidate);
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore missing workspace folder
    }
  }

  return Array.from(found);
}

async function patchFile(filePath, replacementFn, marker) {
  try {
    const original = await fs.readFile(filePath, 'utf8');

    // Accept either a direct marker string or wrapped C-style comment marker
    const combinedMarkers = [marker, `/* ${marker} */`, `// ${marker}`];
    if (combinedMarkers.some((m) => original.includes(m))) {
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

    // ensure writeable (package manager store might make files read-only). If not writeable, try making it writeable.
    try {
      await fs.chmod(filePath, 0o644);
    } catch (e) {
      // ignore chmod errors
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
  const pkgs = process.argv.slice(2);
  const pkgName = pkgs[0] || 'react-native-css-interop';

  const pkgDirs = await findPkgDirsPnpm(pkgName);

  if (!pkgDirs || pkgDirs.length === 0) {
    log(`Package ${pkgName} not found in this workspace / node_modules, skipping.`);
    process.exit(0);
  }

  log(`Found ${pkgDirs.length} package location(s) for ${pkgName}:`);
  pkgDirs.forEach((d) => log(' -', d));

  const filesToTry = [
    ['dist/css-to-rn/parseDeclaration.js', replaceParseAspectRatioJS],
    ['src/css-to-rn/parseDeclaration.ts', replaceParseAspectRatioTS],
  ];

  const marker = 'integral-app: parseAspectRatio guard';

  for (const pkgDir of pkgDirs) {
    for (const [relativePath, fn] of filesToTry) {
      const file = path.join(pkgDir, relativePath);
      try {
        await fs.access(file);
        await patchFile(file, fn, marker);
      } catch (e) {
        log('File not present (skipping):', file);
      }
    }
  }

  log('Done. If you still see the original error, try reinstalling node_modules, run this script from the repo root, or run it with the package name as an argument.');
})();
