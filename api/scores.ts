import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  distance: number;
  coins: number;
  created_at: string;
}

const INITIAL_CHAMPIONS: LeaderboardEntry[] = [
  { id: 1, name: 'ApexRacer', score: 145000, distance: 3200, coins: 45, created_at: '2026-03-01 12:00:00' },
  { id: 2, name: 'TurboViper', score: 112000, distance: 2600, coins: 38, created_at: '2026-03-02 14:15:00' },
  { id: 3, name: 'NeonGhost', score: 98000, distance: 2200, coins: 29, created_at: '2026-03-03 16:30:00' },
  { id: 4, name: 'DriftKing', score: 85000, distance: 1950, coins: 22, created_at: '2026-03-04 18:45:00' },
  { id: 5, name: 'ShadowPilot', score: 72000, distance: 1700, coins: 18, created_at: '2026-03-05 20:00:00' },
  { id: 6, name: 'CyberBlade', score: 59000, distance: 1400, coins: 15, created_at: '2026-03-06 21:20:00' },
];

function getFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'highway-rush-leaderboard.json');
  }
  return path.resolve(process.cwd(), 'highway-rush-leaderboard.json');
}

function readLocalEntries(): LeaderboardEntry[] {
  const filePath = getFilePath();
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(INITIAL_CHAMPIONS, null, 2), 'utf-8');
      return [...INITIAL_CHAMPIONS];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [...INITIAL_CHAMPIONS];
  } catch {
    return [...INITIAL_CHAMPIONS];
  }
}

function writeLocalEntries(entries: LeaderboardEntry[]): void {
  const filePath = getFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing to leaderboard storage:', err);
  }
}

function hasTurso(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL);
}

async function getTopScores(limit: number = 15): Promise<LeaderboardEntry[]> {
  if (hasTurso()) {
    try {
      const { createClient } = await import('@libsql/client/web');
      const client = createClient({
        url: (process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL)!,
        authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
      });
      const res = await client.execute({
        sql: 'SELECT id, name, score, distance, coins, created_at FROM leaderboard ORDER BY score DESC LIMIT ?',
        args: [limit],
      });
      return res.rows.map((r) => ({
        id: Number(r.id),
        name: String(r.name),
        score: Number(r.score),
        distance: Number(r.distance),
        coins: Number(r.coins),
        created_at: String(r.created_at),
      }));
    } catch (err) {
      console.error('Turso query error, falling back to local:', err);
    }
  }

  const entries = readLocalEntries();
  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit);
}

async function saveScore(data: {
  name: string;
  score: number;
  distance: number;
  coins: number;
}): Promise<{ success: boolean; id: number }> {
  const cleanName = String(data.name || 'Racer').trim().slice(0, 18) || 'Racer';
  const cleanScore = Math.max(0, Math.floor(data.score || 0));
  const cleanDistance = Math.max(0, Math.floor(data.distance || 0));
  const cleanCoins = Math.max(0, Math.floor(data.coins || 0));

  if (hasTurso()) {
    try {
      const { createClient } = await import('@libsql/client/web');
      const client = createClient({
        url: (process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL)!,
        authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
      });
      const res = await client.execute({
        sql: 'INSERT INTO leaderboard (name, score, distance, coins) VALUES (?, ?, ?, ?)',
        args: [cleanName, cleanScore, cleanDistance, cleanCoins],
      });
      return { success: true, id: Number(res.lastInsertRowid ?? Date.now()) };
    } catch (err) {
      console.error('Turso insert error, falling back to local:', err);
    }
  }

  const entries = readLocalEntries();
  const maxId = entries.reduce((max, item) => Math.max(max, item.id), 0);
  const newEntry: LeaderboardEntry = {
    id: maxId + 1,
    name: cleanName,
    score: cleanScore,
    distance: cleanDistance,
    coins: cleanCoins,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);
  writeLocalEntries(entries);

  return { success: true, id: newEntry.id };
}

type VercelReq = IncomingMessage & {
  body?: any;
};

type VercelRes = ServerResponse & {
  status?: (statusCode: number) => VercelRes;
  json?: (data: any) => void;
};

async function parseRequestBody(req: VercelReq): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }

  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function send(res: VercelRes, statusCode: number, payload: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: VercelReq, res: VercelRes) {
  try {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.statusCode = 200;
      res.end();
      return;
    }

    // 2. GET /api/scores -> Leaderboard records
    if (req.method === 'GET') {
      const scores = await getTopScores(15);
      return send(res, 200, scores);
    }

    // 3. POST /api/scores -> Submit new score
    if (req.method === 'POST') {
      const body = await parseRequestBody(req);
      const name = body?.name || 'Racer';
      const score = Number(body?.score || 0);
      const distance = Number(body?.distance || 0);
      const coins = Number(body?.coins || 0);

      const result = await saveScore({ name, score, distance, coins });
      return send(res, 200, result);
    }

    return send(res, 405, { error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Unhandled API exception in /api/scores:', error);
    return send(res, 500, { error: error?.message || 'Internal Server Error' });
  }
}
