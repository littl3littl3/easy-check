const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = 5177;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8'
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://localhost:${port}`);
  const safePath = path
    .normalize(decodeURIComponent(url.pathname))
    .replace(/^(\.\.[/\\])+/, '');
  const requestedPath = path.join(root, safePath === '/' ? 'preview.html' : safePath);

  if (!requestedPath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(requestedPath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': types[path.extname(requestedPath)] || 'application/octet-stream'
    });
    response.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview server running at http://127.0.0.1:${port}`);
});
