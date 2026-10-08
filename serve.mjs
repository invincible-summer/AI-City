/**
 * 零依赖静态服务器。用 Node 内置模块直接跑原生 ESM（ESM 不能走 file://，必须经 http）。
 * 端口不写死：默认让内核分配一个空闲端口；PORT=xxxx 可指定。
 *
 *   node serve.mjs            # 自动选端口
 *   PORT=5173 node serve.mjs  # 指定端口，被占用时自动顺延
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT) || 0;      // 0 = 由内核分配空闲端口
const HOST = process.env.HOST || '127.0.0.1';
const MAX_PORT_TRIES = 20;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.glsl': 'text/plain; charset=utf-8',
};

function resolveTarget(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  let rel = normalize(decoded).replace(/^([/\\])+/, '');
  if (rel === '' || rel === '.') rel = 'index.html';
  const abs = resolve(join(ROOT, rel));
  // 防止 ../ 逃出项目根目录
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null;
  return abs;
}

function tryFile(abs) {
  try {
    const st = statSync(abs);
    if (st.isDirectory()) {
      const idx = join(abs, 'index.html');
      statSync(idx);
      return idx;
    }
    return abs;
  } catch {
    return null;
  }
}

const server = createServer((req, res) => {
  const target = resolveTarget(req.url || '/');
  if (!target) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  const file = tryFile(target);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  createReadStream(file).pipe(res);
});

// 注册一次，listen 重试时不会重复打印
server.on('listening', () => {
  const { port } = server.address();
  console.log(`[serve] ${ROOT}`);
  console.log(`[serve] ready: http://${HOST}:${port}/`);
});

function listen(port, attempt = 0) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_TRIES) {
      listen(port + 1, attempt + 1);
      return;
    }
    console.error('[serve] failed to start:', err.message);
    process.exit(1);
  });
  server.listen(port, HOST);
}

listen(PORT);