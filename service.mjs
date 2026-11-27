import { compute } from '@prisma/composer-prisma-cloud';
import nodeBuild from '@prisma/composer/node';

// The dashboard is a static SPA; the build output directory (dist/) holds the
// compiled dashboard plus this declaration and the server that serves it.
export default compute({
  name: 'web',
  deps: {},
  build: nodeBuild({
    module: import.meta.url,
    dir: './dist',
    entry: './server.mjs',
    dependencies: 'external',
  }),
});
