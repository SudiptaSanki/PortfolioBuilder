/* Genre Lab / Collection static server - Node fallback (no dependencies) */
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const port = parseInt(process.argv[2], 10) || 8000;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.txt': 'text/plain', '.pdf': 'application/pdf' };
http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(root, u));
  if (!fp.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log('Serving http://127.0.0.1:' + port + '/index.html - Ctrl+C to stop'));
