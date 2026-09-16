import { createClient, Client } from '@libsql/client';

let dbInstance: Client | null = null;

export function getDb(): Client {
  if (!dbInstance) {
    dbInstance = createClient({
      url: 'file:highway-rush.db',
    });

    // Initialize schema synchronously in an async-invoked self-starter
    initDatabase(dbInstance).catch((err) => {
      console.error('Failed to initialize database schema:', err);
    });
  }
  return dbInstance;
}

export async function initDatabase(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      distance INTEGER NOT NULL DEFAULT 0,
      coins INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if seeded
  const countRes = await db.execute('SELECT COUNT(*) as count FROM leaderboard');
  const count = Number(countRes.rows[0]?.count ?? 0);

  if (count === 0) {
    // Seed initial champions
    const initialRecords = [
      { name: 'ApexRacer', score: 145000, distance: 3200, coins: 45 },
      { name: 'TurboViper', score: 112000, distance: 2600, coins: 38 },
      { name: 'NeonGhost', score: 98000, distance: 2200, coins: 29 },
      { name: 'DriftKing', score: 85000, distance: 1950, coins: 22 },
      { name: 'ShadowPilot', score: 72000, distance: 1700, coins: 18 },
      { name: 'CyberBlade', score: 59000, distance: 1400, coins: 15 },
    ];

    for (const r of initialRecords) {
      await db.execute({
        sql: 'INSERT INTO leaderboard (name, score, distance, coins) VALUES (?, ?, ?, ?)',
        args: [r.name, r.score, r.distance, r.coins],
      });
    }
  }
}
