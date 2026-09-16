import type { IncomingMessage, ServerResponse } from 'http';
import { getTopScores, saveScore } from '../app/serverFunctions/db';

type VercelReq = IncomingMessage & {
  body?: any;
};

type VercelRes = ServerResponse & {
  status?: (statusCode: number) => VercelRes;
  json?: (data: any) => void;
};

// Robust helper to parse body whether already parsed by Vercel or incoming as stream
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

    // 2. GET /api/scores -> Retrieve top leaderboard entries
    if (req.method === 'GET') {
      const scores = await getTopScores(15);
      return send(res, 200, scores);
    }

    // 3. POST /api/scores -> Save pilot score
    if (req.method === 'POST') {
      const body = await parseRequestBody(req);
      const name = body?.name || 'Racer';
      const score = Number(body?.score || 0);
      const distance = Number(body?.distance || 0);
      const coins = Number(body?.coins || 0);

      const result = await saveScore({ name, score, distance, coins });
      return send(res, 200, result);
    }

    // 4. Method not allowed
    return send(res, 405, { error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Unhandled API exception in /api/scores:', error);
    return send(res, 500, { error: error?.message || 'Internal Server Error' });
  }
}
