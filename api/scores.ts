import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, initDatabase } from '../app/serverFunctions/db';

type VercelReq = IncomingMessage & {
  body?: any;
  query?: Record<string, string | string[]>;
};

type VercelRes = ServerResponse & {
  status?: (statusCode: number) => VercelRes;
  json?: (data: any) => void;
};

// Helper to extract parsed JSON body across different serverless runtimes
async function parseBody(req: VercelReq): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendResponse(res: VercelRes, statusCode: number, data: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: VercelReq, res: VercelRes) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 200;
    res.end();
    return;
  }

  const db = getDb();
  await initDatabase(db).catch(() => {});

  if (req.method === 'GET') {
    try {
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

      return sendResponse(res, 200, rows);
    } catch (err: any) {
      console.error('Error fetching scores:', err);
      return sendResponse(res, 500, { error: err?.message || 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const name = String(body.name || 'Racer').trim().slice(0, 18);
      const score = Math.max(0, Math.floor(body.score || 0));
      const distance = Math.max(0, Math.floor(body.distance || 0));
      const coins = Math.max(0, Math.floor(body.coins || 0));

      const result = await db.execute({
        sql: 'INSERT INTO leaderboard (name, score, distance, coins) VALUES (?, ?, ?, ?)',
        args: [name, score, distance, coins],
      });

      return sendResponse(res, 200, {
        success: true,
        id: Number(result.lastInsertRowid ?? 0),
      });
    } catch (err: any) {
      console.error('Error saving score:', err);
      return sendResponse(res, 500, { error: err?.message || 'Server error' });
    }
  }

  return sendResponse(res, 405, { error: 'Method Not Allowed' });
}
