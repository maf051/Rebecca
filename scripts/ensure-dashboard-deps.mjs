// Ensures the dashboard workspace's dependencies are resolvable. Normally
// `npm install` at the repo root installs them (workspaces hoist most to the
// root node_modules and nest the rest under dashboard/node_modules); if the
// install was partial, this re-runs it. The install always runs at the
// repository root: running `npm ci` inside the workspace directory would
// replace the root install with the dashboard's own lockfile.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dashboard = join(root, 'dashboard');

function resolvable(name) {
  return (
    existsSync(join(dashboard, 'node_modules', name, 'package.json')) ||
    existsSync(join(root, 'node_modules', name, 'package.json'))
  );
}

const missing = ['framer-motion', 'react', 'vite', 'vitest'].filter((name) => !resolvable(name));
if (missing.length === 0) {
  process.exit(0);
}

console.log(`dashboard dependencies missing (${missing.join(', ')}); installing...`);
const result = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
