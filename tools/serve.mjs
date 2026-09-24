// Local test server for the dive (uses only Node's built-in modules).
// Run:  node tools/serve.mjs          then open http://localhost:8080
//       node tools/serve.mjs 9000     (another port)
// Serves the project folder with the right file types for ES modules, keeps connections open (so the
// many small module files load quickly), and tells the browser not to cache, so every reload shows your latest change.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(join(fileURLToPath(import.meta.url), '..', '..'));
const PORT = Number(process.argv[2] || 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.ktx2': 'image/ktx2', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf'
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }   // never serve files outside the project
  let info;
  try { info = statSync(file); } catch { info = null; }
  if (!info || !info.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); console.log('404', path); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Deep Drift is running at http://localhost:${PORT}  (press Ctrl+C to stop)`));
