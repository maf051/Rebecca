// Assembles the deployable build output: the dashboard's static build plus
// the server and its service declaration, all inside dist/.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of ['server.mjs', 'service.mjs']) {
  cpSync(join(root, file), join(dist, file));
}
cpSync(join(root, 'dashboard', 'build'), join(dist, 'build'), { recursive: true });

console.log('dist/ assembled');
