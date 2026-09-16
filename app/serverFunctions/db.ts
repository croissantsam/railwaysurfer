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
  } catch (err) {
    console.error('Error reading leaderboard store:', err);
    return [...INITIAL_CHAMPIONS];
  }
}

function writeLocalEntries(entries: LeaderboardEntry[]): void {
  const filePath = getFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing leaderboard store:', err);
  }
}

// Check if a remote Turso LibSQL database is configured via environment variables
function hasTursoConfig(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL);
}

async function getTursoClient() {
  // Use @libsql/client/web which uses pure fetch (zero native C++ dependencies)
  const { createClient } = await import('@libsql/client/web');
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL!;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
  return createClient({ url, authToken });
}

export async function getTopScores(limit: number = 15): Promise<LeaderboardEntry[]> {
  if (hasTursoConfig()) {
    try {
      const client = await getTursoClient();
      await initTursoSchema(client);
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
      console.error('Turso fetch failed, falling back to local store:', err);
    }
  }

  // Pure file / in-memory store
  const entries = readLocalEntries();
  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit);
}

export async function saveScore(data: {
  name: string;
  score: number;
  distance: number;
  coins: number;
}): Promise<{ success: boolean; id: number }> {
  const cleanName = String(data.name || 'Racer').trim().slice(0, 18) || 'Racer';
  const cleanScore = Math.max(0, Math.floor(data.score || 0));
  const cleanDistance = Math.max(0, Math.floor(data.distance || 0));
  const cleanCoins = Math.max(0, Math.floor(data.coins || 0));

  if (hasTursoConfig()) {
    try {
      const client = await getTursoClient();
      await initTursoSchema(client);
      const res = await client.execute({
        sql: 'INSERT INTO leaderboard (name, score, distance, coins) VALUES (?, ?, ?, ?)',
        args: [cleanName, cleanScore, cleanDistance, cleanCoins],
      });
      return { success: true, id: Number(res.lastInsertRowid ?? Date.now()) };
    } catch (err) {
      console.error('Turso insert failed, falling back to local store:', err);
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

let tursoInitPromise: Promise<void> | null = null;
async function initTursoSchema(client: any): Promise<void> {
  if (tursoInitPromise) return tursoInitPromise;
  tursoInitPromise = (async () => {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        score INTEGER NOT NULL,
        distance INTEGER NOT NULL DEFAULT 0,
        coins INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const countRes = await client.execute('SELECT COUNT(*) as count FROM leaderboard');
    const count = Number(countRes.rows[0]?.count ?? 0);
    if (count === 0) {
      for (const r of INITIAL_CHAMPIONS) {
        await client.execute({
          sql: 'INSERT INTO leaderboard (name, score, distance, coins) VALUES (?, ?, ?, ?)',
          args: [r.name, r.score, r.distance, r.coins],
        });
      }
    }
  })();
  return tursoInitPromise;
}

// Backward-compatibility shim for getDb().execute(...)
export function getDb() {
  return {
    async execute(queryOrObj: any) {
      const sql = typeof queryOrObj === 'string' ? queryOrObj : queryOrObj.sql;
      const args = (typeof queryOrObj === 'object' && queryOrObj.args) || [];

      if (/SELECT.*FROM\s+leaderboard/i.test(sql)) {
        const scores = await getTopScores(15);
        return {
          rows: scores.map((s) => ({
            id: s.id,
            name: s.name,
            score: s.score,
            distance: s.distance,
            coins: s.coins,
            created_at: s.created_at,
          })),
        };
      }

      if (/INSERT\s+INTO\s+leaderboard/i.test(sql)) {
        const [name, score, distance, coins] = args;
        const res = await saveScore({ name, score, distance, coins });
        return { lastInsertRowid: res.id };
      }

      return { rows: [] };
    },
  };
}

export async function initDatabase(_db?: any): Promise<void> {
  // Ensure local file or remote schema is initialized
  if (!hasTursoConfig()) {
    readLocalEntries();
  }
}
