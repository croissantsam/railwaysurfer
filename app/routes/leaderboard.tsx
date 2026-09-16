import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { getTopScores, submitScore, LeaderboardEntry } from '../serverFunctions/scores';

export const Route = createFileRoute('/leaderboard')({
  loader: async () => {
    try {
      const scores = await getTopScores();
      return { scores };
    } catch (err) {
      console.error('Leaderboard loader error:', err);
      return { scores: [] };
    }
  },
  component: LeaderboardRouteComponent,
});

function LeaderboardRouteComponent() {
  const loaderData = Route.useLoaderData();
  const navigate = useNavigate();
  const [scores, setScores] = useState<LeaderboardEntry[]>(loaderData?.scores || []);
  const [isLoading, setIsLoading] = useState(false);
  const [testName, setTestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchScores = async () => {
    setIsLoading(true);
    try {
      const freshScores = await getTopScores();
      setScores(freshScores);
    } catch (err) {
      console.error('Failed to fetch top scores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitScore({
        data: {
          name: testName.trim(),
          score: 85000 + Math.floor(Math.random() * 45000),
          distance: 1800 + Math.floor(Math.random() * 800),
          coins: 20 + Math.floor(Math.random() * 15),
        },
      });
      setTestName('');
      await fetchScores();
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <div className="title-area">
          <span className="leaderboard-badge">SQLITE HALL OF FAME</span>
          <h1 className="leaderboard-title">ONLINE LEADERBOARD</h1>
          <p className="leaderboard-subtitle">
            Worldwide elite rankings stored securely in persistent SQLite database.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="arcade-btn secondary refresh-btn"
            onClick={fetchScores}
            disabled={isLoading}
          >
            {isLoading ? 'REFRESHING...' : '🔄 REFRESH'}
          </button>
          <button
            type="button"
            className="arcade-btn pulse play-btn"
            onClick={() => navigate({ to: '/' })}
          >
            PLAY NOW 🎮
          </button>
        </div>
      </div>

      {/* Podium for Top 3 */}
      {scores.length >= 3 && (
        <div className="podium-section">
          {/* 2nd Place */}
          <div className="podium-card silver">
            <div className="podium-rank-badge">🥈 2ND</div>
            <div className="podium-name">{scores[1].name}</div>
            <div className="podium-score">{scores[1].score.toLocaleString()} PTS</div>
            <div className="podium-meta">
              <span>{scores[1].distance}m</span> • <span>🪙 {scores[1].coins}</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="podium-card gold champion">
            <div className="champion-crown">👑</div>
            <div className="podium-rank-badge">🥇 CHAMPION</div>
            <div className="podium-name">{scores[0].name}</div>
            <div className="podium-score gold-text">{scores[0].score.toLocaleString()} PTS</div>
            <div className="podium-meta">
              <span>{scores[0].distance}m</span> • <span>🪙 {scores[0].coins}</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="podium-card bronze">
            <div className="podium-rank-badge">🥉 3RD</div>
            <div className="podium-name">{scores[2].name}</div>
            <div className="podium-score">{scores[2].score.toLocaleString()} PTS</div>
            <div className="podium-meta">
              <span>{scores[2].distance}m</span> • <span>🪙 {scores[2].coins}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="col-rank">RANK</th>
              <th className="col-pilot">PILOT</th>
              <th className="col-score">SCORE</th>
              <th className="col-distance">DISTANCE</th>
              <th className="col-coins">COINS</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-scores">
                  No scores recorded yet. Be the first to enter history!
                </td>
              </tr>
            ) : (
              scores.map((entry, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                return (
                  <tr key={entry.id || index} className={`leaderboard-row ${isTop3 ? 'top-row' : ''}`}>
                    <td className="col-rank">
                      <span className={`rank-pill rank-${rank}`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                    </td>
                    <td className="col-pilot font-bold">{entry.name}</td>
                    <td className="col-score score-highlight">{entry.score.toLocaleString()}</td>
                    <td className="col-distance">{entry.distance.toLocaleString()} m</td>
                    <td className="col-coins">🪙 {entry.coins}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual pilot registration / test entry card */}
      <div className="custom-entry-card">
        <div className="custom-entry-info">
          <h3>CLAIM YOUR PILOT CALLSIGN</h3>
          <p>Register your callsign on the SQLite leaderboard to compete in daily events.</p>
        </div>
        <form onSubmit={handleQuickSubmit} className="custom-entry-form">
          <input
            type="text"
            placeholder="Your Callsign..."
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            maxLength={18}
          />
          <button type="submit" className="arcade-btn secondary" disabled={isSubmitting || !testName.trim()}>
            {isSubmitting ? 'JOINING...' : 'REGISTER PILOT'}
          </button>
        </form>
      </div>
    </div>
  );
}
