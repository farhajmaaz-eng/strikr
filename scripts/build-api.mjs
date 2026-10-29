import { build } from 'esbuild';

await build({
  entryPoints: ['server/api-entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'api/generate.js',
  legalComments: 'none',
  banner: {
    js: '// Generated from server/api-entry.ts by scripts/build-api.mjs. Do not edit directly.',
  },
});

console.log('api/generate.js bundled');
