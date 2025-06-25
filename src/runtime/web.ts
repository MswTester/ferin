import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { WebSocketServer } from 'ws';
import { CompiledResult } from '../types';

export async function startWebServer(compiled: CompiledResult, port: number = 3000) {
  const app = express();
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../assets')));
  
  // Main route
  app.get('/', (req, res) => {
    const html = generateHTML(compiled);
    res.send(html);
  });
  
  // API routes
  app.get('/api/reload', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  const server = app.listen(port, () => {
    console.log(`=€ Ferin web server running at http://localhost:${port}`);
  });
  
  return server;
}

export async function startWebDevServer(compiled: CompiledResult, port: number = 3000) {
  const app = express();
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../assets')));
  
  // Main route with hot reload
  app.get('/', (req, res) => {
    const html = generateHTML(compiled, true);
    res.send(html);
  });
  
  // Hot reload script
  app.get('/hot-reload.js', (req, res) => {
    const script = `
(function() {
  const ws = new WebSocket('ws://localhost:${port + 1}');
  ws.onmessage = function(event) {
    if (event.data === 'reload') {
      window.location.reload();
    }
  };
  
  ws.onclose = function() {
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
})();
`;
    res.setHeader('Content-Type', 'application/javascript');
    res.send(script);
  });
  
  const server = app.listen(port, () => {
    console.log(`=% Ferin dev server running at http://localhost:${port}`);
  });
  
  // WebSocket server for hot reload
  const wss = new WebSocketServer({ port: port + 1 });
  
  return { server, wss };
}

function generateHTML(compiled: CompiledResult, devMode: boolean = false): string {
  const hotReloadScript = devMode ? '<script src="/hot-reload.js"></script>' : '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ferin App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${compiled.css ? `<style>${compiled.css}</style>` : ''}
</head>
<body>
  <div id="app"></div>
  
  <script>
${compiled.js}
  </script>
  
  ${hotReloadScript}
</body>
</html>
`;
}

export function triggerReload(wss: WebSocketServer) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send('reload');
    }
  });
}