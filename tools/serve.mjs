import http from 'node:http';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const meta = JSON.parse(await readFile(path.join(dist, 'build-meta.json'), 'utf8'));
const port = Number(process.env.PORT || 4173);
const feedbackMock = process.env.FEEDBACK_MOCK === '1';
let mockIssueNumber = 9000;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.zip': 'application/zip'
};

http.createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    if (meta.base && pathname.startsWith(meta.base)) pathname = pathname.slice(meta.base.length) || '/';
    if (feedbackMock && pathname === '/api/feedback' && request.method === 'POST') {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 32 * 1024) throw new Error('Feedback payload too large');
        chunks.push(chunk);
      }
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!payload.question || !payload.slug) throw new Error('Invalid feedback payload');
      mockIssueNumber += 1;
      const body = JSON.stringify({
        number: mockIssueNumber,
        title: `[Mock] ${payload.question.slice(0, 40)}`,
        htmlUrl: `https://github.com/Lijinzh/ScholarAnalysis/issues/${mockIssueNumber}`,
      });
      response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
      response.end(body);
      return;
    }
    let file = path.join(dist, pathname.replace(/^\//, ''));
    if (pathname.endsWith('/')) file = path.join(file, 'index.html');
    const details = await stat(file);
    const type = mime[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = request.headers.range;
    if (range && type.startsWith('video/')) {
      const [startText, endText] = range.replace('bytes=', '').split('-');
      const start = Number(startText);
      const end = endText ? Number(endText) : Math.min(start + 4 * 1024 * 1024, details.size - 1);
      response.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${details.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': type,
      });
      createReadStream(file, { start, end }).pipe(response);
      return;
    }
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': details.size, 'Accept-Ranges': 'bytes' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`ScholarAnalysis: http://127.0.0.1:${port}${meta.base || '/'}`));
