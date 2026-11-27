// Static file server for the built dashboard. Deployed as part of the dist/
// build output and started by Prisma Compute; everything it serves lives in
// ./build next to this file.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import service from './service.mjs';

const buildDir = resolve(import.meta.dirname, 'build');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function send(res, filePath) {
  const data = await readFile(filePath);
  const ext = extname(filePath).toLowerCase();
  // Vite emits content-hashed asset names under /statics; only they are
  // immutable, everything else must revalidate so deploys go live at once.
  const immutable = filePath.includes(`${sep}statics${sep}`) && /\.[0-9a-f]{8,}\.[^.]+$/.test(filePath);
  res.writeHead(200, {
    'content-type': contentTypes[ext] ?? 'application/octet-stream',
    'content-length': data.length,
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  res.end(data);
}

function notFound(res) {
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    notFound(res);
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    notFound(res);
    return;
  }

  // Resolve inside the build directory only; anything else is a 404.
  const filePath = normalize(join(buildDir, pathname));
  if (filePath !== buildDir && !filePath.startsWith(buildDir + sep)) {
    notFound(res);
    return;
  }

  const candidates = [];
  if (pathname.endsWith('/')) candidates.push(join(filePath, 'index.html'));
  else candidates.push(filePath, `${filePath}/index.html`);
  // SPA fallback, mirroring the panel's 404.html fallback for client routes.
  candidates.push(join(buildDir, '404.html'), join(buildDir, 'index.html'));

  for (const candidate of candidates) {
    try {
      const s = await stat(candidate);
      if (s.isDirectory()) continue;
      await send(res, candidate);
      return;
    } catch (err) {
      if (err?.code !== 'ENOENT') {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Internal error');
        return;
      }
    }
  }

  notFound(res);
});

const port = service.port();
server.listen(port, '0.0.0.0', () => {
  console.log(`dashboard listening on 0.0.0.0:${port}`);
});
