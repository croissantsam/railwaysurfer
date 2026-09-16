import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { getDb } from './app/serverFunctions/db';

function sqliteApiPlugin(): Plugin {
  return {
    name: 'sqlite-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/scores')) {
          return next();
        }

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
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(rows));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Server error' }));
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
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, id: Number(result.lastInsertRowid ?? 0) }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sqliteApiPlugin()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },
});
