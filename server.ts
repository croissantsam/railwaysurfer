import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './app/serverFunctions/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const url = req.url?.split('?')[0] || '/';

  // 1. API: Scores Leaderboard
  if (url === '/api/scores') {
    if (req.method === 'GET') {
      try {
        const db = getDb();
        const result = await db.execute(`
          SELECT id, name, score, distance, coins, created_at 
          FROM leaderboard 
          ORDER BY score DESC 
          LIMIT 15
        `);
        const rows = result.rows.map((r) => ({
          id: Number(r.id),
          name: String(r.name),
          score: Number(r.score),
          distance: Number(r.distance),
          coins: Number(r.coins),
          created_at: String(r.created_at),
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'DB Error' }));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body || '{}');
          const name = String(data.name || 'Racer').trim().slice(0, 18);
          const score = Math.max(0, Math.floor(data.score || 0));
          const distance = Math.max(0, Math.floor(data.distance || 0));
          const coins = Math.max(0, Math.floor(data.coins || 0));

          const db = getDb();
          const result = await db.execute({
            sql: 'INSERT INTO leaderboard (name, score, distance, coins) VALUES (?, ?, ?, ?)',
            args: [name, score, distance, coins],
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, id: Number(result.lastInsertRowid ?? 0) }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || 'DB Error' }));
        }
      });
      return;
    }
  }

  // 2. Static file serving for SPA
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Highway Rush production server running at http://localhost:${PORT}`);
});
