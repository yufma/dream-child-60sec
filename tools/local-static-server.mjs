import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';


const root = resolve(process.argv[2] || 'dist/client');
const port = Number(process.argv[3] || 4173);
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mp3', 'audio/mpeg'],
  ['.png', 'image/png'],
  ['.wav', 'audio/wav'],
]);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = resolve(root, `.${pathname}`);
    if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    const data = await readFile(filePath);
    const contentType = mimeTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Content-Type', contentType);

    const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      if (start > end || start >= data.length) {
        response.writeHead(416, { 'Content-Range': `bytes */${data.length}` }).end();
        return;
      }
      const chunk = data.subarray(start, end + 1);
      response.writeHead(206, {
        'Content-Length': chunk.length,
        'Content-Range': `bytes ${start}-${end}/${data.length}`,
      });
      response.end(chunk);
      return;
    }

    response.writeHead(200, { 'Content-Length': data.length });
    response.end(data);
  } catch (error) {
    response.writeHead(error?.code === 'ENOENT' ? 404 : 500).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Local game ready at http://127.0.0.1:${port}/`);
});
