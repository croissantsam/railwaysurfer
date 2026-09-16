export interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  distance: number;
  coins: number;
  created_at: string;
}

export async function getTopScores(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/scores');
    if (!res.ok) throw new Error('Network response error');
    return await res.json();
  } catch (err) {
    console.error('getTopScores error:', err);
    return [];
  }
}

export async function submitScore(input: {
  data: {
    name: string;
    score: number;
    distance?: number;
    coins?: number;
  };
}): Promise<{ success: boolean; id: number }> {
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input.data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to submit score');
    }
    return await res.json();
  } catch (err: any) {
    console.error('submitScore error:', err);
    throw err;
  }
}
