const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');

const PORT = 3008;
//npm start

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Normalize URL
  let url = req.url.split('?')[0];
  if (url === '/') {
    url = '/index.html';
  }

  // Get file path
  const filePath = path.join(__dirname, url);
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Read file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
      } else {
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      if (contentType === 'text/html') {
        const liveReloadScript = `
          <!-- Live Reload WebSocket Client -->
          <script>
            // Connect to WebSocket server
            (function() {
              function connectWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const host = window.location.host;
                const ws = new WebSocket(protocol + '//' + host);

                console.log('Connecting to WebSocket server…');

                ws.onopen = () => {
                  console.log('WebSocket connection established');
                };

                ws.onmessage = (event) => {
                  if (event.data === 'reload') {
                    console.log('Live reload triggered, refreshing page…');
                    window.location.reload();
                  }
                };

                ws.onclose = () => {
                  console.log('WebSocket connection closed. Reconnecting in 3 seconds…');
                  setTimeout(connectWebSocket, 3000);
                };

                ws.onerror = (error) => {
                  console.error('WebSocket error:', error);
                };

                window.addEventListener('pagehide', () => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                  }
                });

                window.addEventListener('beforeunload', () => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                  }
                });
              }
              connectWebSocket();
            })();
          <\/script>
        `;
        const modifiedContent = content.toString().replace('</body>', `${liveReloadScript}</body>`);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(modifiedContent, 'utf-8');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    }
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Set up file watcher
const watcher = chokidar.watch('.', {
  ignored: /(^|[\/\\])\..|(node_modules)/, // ignore dotfiles and node_modules
  persistent: true,
  cwd: __dirname,
  depth: 1
});

watcher.on('change', (path) => {
  console.log(`File ${path} has been changed`);
  // Notify all clients to reload
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Live reload enabled - browser will refresh automatically when files change');
  console.log('Press Ctrl+C to stop the server');
});

// Keep the process alive
setInterval(() => {
  console.log('Server is still running...');
}, 60000); // Log every minute to keep the process alive

// Handle server errors
server.on('error', (err) => {
  console.error(`Server error: ${err.message}`);
});

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nServer shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep the process running even if there's an error
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

