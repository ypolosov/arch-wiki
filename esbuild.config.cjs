const path = require('path');
const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: [path.join(__dirname, 'src/cli/main.ts')],
    outfile: path.join(__dirname, 'dist/cli.cjs'),
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    bundle: true,
    sourcemap: true,
    // Inline all deps (gray-matter, zod, cac) so the target needs no node_modules.
    external: [],
    banner: { js: '#!/usr/bin/env node' },
    logLevel: 'info',
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
