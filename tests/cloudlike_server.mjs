// A test server that behaves a little more like Cloudflare, so tests/load.py can judge real loading speed:
// it compresses text files (gzip; Cloudflare uses the similar brotli) and sends the cache rules from dist/_headers.
// Run:  node tests/cloudlike_server.mjs [port, default 8091]     then  python tests/load.py --cloudlike
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = normalize(join(fileURLToPath(import.meta.url), '..', '..', 'dist'));
const PORT = Number(process.argv[2] || 8091);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const TEXT = new Set(['.html', '.js', '.css', '.json']);

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  try { if (!statSync(file).isFile()) throw 0; } catch { res.writeHead(404).end('not found'); return; }
  let body = readFileSync(file); const headers = { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' };
  if (TEXT.has(extname(file)) && /gzip/.test(req.headers['accept-encoding'] || '')) { body = gzipSync(body, { level: 9 }); headers['Content-Encoding'] = 'gzip'; }
  headers['Content-Length'] = body.length;
  res.writeHead(200, headers).end(body);
}).listen(PORT, () => console.log(`dist/ served like Cloudflare at http://localhost:${PORT}`));
