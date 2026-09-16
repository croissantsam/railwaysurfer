import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Game } from '../../src/core/Game';
import { submitScore } from '../serverFunctions/scores';
import { garageStore } from '../../src/garage/GarageStore';

export const Route = createFileRoute('/')({
  component: GameRouteComponent,
});

function GameRouteComponent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const navigate = useNavigate();

  // Game Over Modal State
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverStats, setGameOverStats] = useState({ score: 0, coins: 0, distance: 0 });
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highway_rush_player_name') || '';
    }
    return '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedCarName, setSelectedCarName] = useState('');

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new Game(canvasRef.current);
    gameRef.current = game;
    setSelectedCarName(garageStore.getSelectedCar().name);

    game.onGameOver = (score, coins, distance) => {
      setGameOverStats({ score, coins, distance });
      setIsGameOver(true);
      setHasSubmitted(false);
      setSubmitError(null);
    };

    game.init();

    // Clean up when leaving route
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const handleRestart = () => {
    setIsGameOver(false);
    gameRef.current?.restartGame();
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('highway_rush_player_name', playerName.trim());
      }
      await submitScore({
        data: {
          name: playerName.trim(),
          score: gameOverStats.score,
          distance: gameOverStats.distance,
          coins: gameOverStats.coins,
        },
      });
      setHasSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit score:', err);
      setSubmitError(err?.message || 'Failed to submit score. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="game-wrapper">
      <div id="game-container">
        <canvas id="game-canvas" ref={canvasRef} />

        {/* In-Game HUD */}
        <div id="hud" className="ui-layer">
          <div className="hud-top">
            <div className="hud-card score-card">
              <span className="hud-label">SCORE</span>
              <span id="hud-score" className="hud-value">0</span>
            </div>

            <div className="hud-center-group">
              <div className="hud-center-badge" id="hud-env-badge">
                <span id="hud-env-name">NEON CITY</span>
              </div>
              <div className="hud-lives-card" id="hud-lives-card">
                <div className="lives-container" id="hud-lives-container">
                  <span className="life-heart active" id="life-1">❤️</span>
                  <span className="life-heart active" id="life-2">❤️</span>
                  <span className="life-heart active" id="life-3">❤️</span>
                </div>
                <div className="life-regen-track" id="life-regen-track" title="Next heart in 60s">
                  <div className="life-regen-fill" id="life-regen-fill" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>

            <div className="hud-card coin-card">
              <div className="coin-icon">🪙</div>
              <span id="hud-coins" className="hud-value">0</span>
            </div>
          </div>

          {/* Life / Damage Alert banner */}
          <div id="life-alert-banner" className="banner-hidden">
            <div id="life-alert-title" className="life-alert-title">SHIELD BROKEN!</div>
            <div id="life-alert-desc" className="life-alert-desc">-1 LIFE</div>
          </div>

          {/* Near Miss notification banner */}
          <div id="near-miss-banner" className="banner-hidden">
            <div className="near-miss-text">NEAR MISS!</div>
            <div className="near-miss-bonus">+100</div>
          </div>

          {/* Screen Flash Overlays */}
          <div id="damage-flash-fx"></div>
          <div id="speed-streak-fx"></div>

          {/* Bottom HUD: Speedometer & Controls */}
          <div className="hud-bottom">
            <div className="speedometer-container">
              <div className="speed-number">
                <span id="hud-speed">80</span>
                <span className="speed-unit">KM/H</span>
                <span id="hud-multiplier" className="speed-mult">1.0x</span>
              </div>
              <div className="speed-bar-track">
                <div id="speed-bar-fill" className="speed-bar-fill" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div className="hud-actions">
              <button id="btn-audio-toggle" className="icon-btn" aria-label="Toggle Sound">🔊</button>
              <button id="btn-pause" className="icon-btn" aria-label="Pause Game">⏸</button>
            </div>
          </div>

          {/* Touch zones for gesture swipes / taps */}
          <div id="touch-controls" className="touch-zones">
            <div className="touch-zone left" id="touch-left" aria-label="Left Lane"></div>
            <div className="touch-zone center" id="touch-boost" aria-label="Nitro Boost"></div>
            <div className="touch-zone right" id="touch-right" aria-label="Right Lane"></div>
          </div>

          {/* Dedicated Visual Mobile Buttons */}
          <div className="mobile-controls-panel">
            <button id="mobile-btn-left" className="mobile-touch-btn lane-btn" aria-label="Steer Left">
              <span className="btn-icon">◀</span>
              <span className="btn-text">LEFT</span>
            </button>
            <button id="mobile-btn-jump" className="mobile-touch-btn jump-btn" aria-label="Jump Over Obstacles">
              <span className="btn-icon">⬆️</span>
              <span className="btn-text">JUMP</span>
            </button>
            <button id="mobile-btn-boost" className="mobile-touch-btn boost-btn" aria-label="Nitro Boost">
              <span className="btn-icon">🚀</span>
              <span className="btn-text">NITRO</span>
            </button>
            <button id="mobile-btn-right" className="mobile-touch-btn lane-btn" aria-label="Steer Right">
              <span className="btn-icon">▶</span>
              <span className="btn-text">RIGHT</span>
            </button>
          </div>
        </div>

        {/* Start / Ready Screen */}
        <div id="start-screen" className="ui-layer overlay-screen active">
          <div className="screen-content">
            <div className="game-logo">
              <h1 className="glitch-title" data-text="HIGHWAY RUSH">HIGHWAY RUSH</h1>
              <p className="tagline">ENDLESS 3D HIGH-SPEED ARCADE</p>
              {selectedCarName && (
                <div className="selected-car-pill">
                  Car: <span className="car-pill-name">{selectedCarName}</span>
                </div>
              )}
            </div>

            <div className="control-hints">
              <div className="hint-group">
                <span className="hint-key">← / A</span>
                <span className="hint-key">→ / D</span>
                <span className="hint-desc">Change Lane</span>
              </div>
              <div className="hint-group">
                <span className="hint-key">↑ / W</span>
                <span className="hint-desc">Jump Over Cars</span>
              </div>
              <div className="hint-group">
                <span className="hint-key">SPACE</span>
                <span className="hint-desc">Nitro Boost</span>
              </div>
              <div className="hint-group mobile-hint">
                <span className="hint-key">TOUCH</span>
                <span className="hint-desc">On-screen Buttons / Swipe</span>
              </div>
            </div>

            <button
              id="btn-start"
              className="arcade-btn pulse"
              onClick={() => {
                gameRef.current?.startGame();
              }}
            >
              <span>DRIVE NOW</span>
            </button>

            <div className="start-footer-links">
              <button
                type="button"
                className="sub-btn"
                onClick={() => navigate({ to: '/garage' })}
              >
                🚗 Change Car ({garageStore.getTotalCoins()} 🪙)
              </button>
              <button
                type="button"
                className="sub-btn"
                onClick={() => navigate({ to: '/leaderboard' })}
              >
                🏆 Online Rankings
              </button>
            </div>
          </div>
        </div>

        {/* Pause Screen */}
        <div id="pause-screen" className="ui-layer overlay-screen">
          <div className="screen-content modal-card">
            <h2 className="screen-title">GAME PAUSED</h2>
            <div className="btn-stack">
              <button
                id="btn-resume"
                className="arcade-btn"
                onClick={() => {
                  gameRef.current?.resumeGame();
                }}
              >
                RESUME
              </button>
              <button
                id="btn-restart-pause"
                className="arcade-btn secondary"
                onClick={() => {
                  gameRef.current?.resumeGame();
                  handleRestart();
                }}
              >
                RESTART
              </button>
              <button
                type="button"
                className="arcade-btn ghost"
                onClick={() => navigate({ to: '/garage' })}
              >
                GARAGE
              </button>
            </div>
          </div>
        </div>

        {/* Game Over Screen (Standard UI Layer) */}
        <div id="game-over-screen" className="ui-layer overlay-screen">
          <div className="screen-content modal-card game-over-card">
            <div className="crash-badge">CRASHED!</div>
            <h2 className="screen-title danger">GAME OVER</h2>

            <div className="stats-grid">
              <div className="stat-item primary-stat">
                <span className="stat-label">FINAL SCORE</span>
                <span id="go-score" className="stat-value">0</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">BEST RECORD</span>
                <span id="go-best-score" className="stat-value gold">0</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">COINS COLLECTED</span>
                <span id="go-coins" className="stat-value">🪙 0</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">DISTANCE</span>
                <span id="go-distance" className="stat-value">0 m</span>
              </div>
            </div>

            <button
              id="btn-replay"
              className="arcade-btn pulse"
              onClick={() => {
                handleRestart();
              }}
            >
              <span>REPLAY</span>
            </button>
          </div>
        </div>

        {/* React Online Score Submission & Game Over Overlay */}
        {isGameOver && (
          <div className="online-score-overlay">
            <div className="online-score-modal animate-scale-up">
              <div className="modal-header">
                <span className="modal-tag">ONLINE CLASSEMENT</span>
                <h3 className="modal-title">SUBMIT YOUR RECORD</h3>
              </div>

              <div className="modal-score-summary">
                <div className="summary-chip">
                  <span className="chip-label">SCORE</span>
                  <span className="chip-value gold">{gameOverStats.score.toLocaleString()}</span>
                </div>
                <div className="summary-chip">
                  <span className="chip-label">DISTANCE</span>
                  <span className="chip-value">{gameOverStats.distance} m</span>
                </div>
                <div className="summary-chip">
                  <span className="chip-label">COINS</span>
                  <span className="chip-value">+{gameOverStats.coins} 🪙</span>
                </div>
              </div>

              {!hasSubmitted ? (
                <form onSubmit={handleSubmitScore} className="score-form">
                  <div className="form-group">
                    <label htmlFor="player-name-input">PILOT NAME</label>
                    <input
                      id="player-name-input"
                      type="text"
                      maxLength={18}
                      placeholder="Enter your name..."
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  {submitError && <div className="form-error">{submitError}</div>}
                  <button
                    type="submit"
                    className="arcade-btn submit-btn"
                    disabled={isSubmitting || !playerName.trim()}
                  >
                    {isSubmitting ? 'SAVING RECORD...' : 'POST TO LEADERBOARD 🏆'}
                  </button>
                </form>
              ) : (
                <div className="submit-success">
                  <span className="success-icon">✅</span>
                  <h4>RECORD SAVED TO SQLITE!</h4>
                  <p>Check where you rank on the worldwide leaderboard.</p>
                  <button
                    type="button"
                    className="arcade-btn secondary"
                    onClick={() => navigate({ to: '/leaderboard' })}
                  >
                    VIEW LEADERBOARD 🏆
                  </button>
                </div>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="arcade-btn pulse restart-btn"
                  onClick={handleRestart}
                >
                  PLAY AGAIN 🏎️
                </button>
                <button
                  type="button"
                  className="action-btn ghost"
                  onClick={() => navigate({ to: '/garage' })}
                >
                  GARAGE 🚗
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Performance Debug Panel */}
        <div id="debug-panel" className="debug-panel hidden">
          <div className="debug-header">PERFORMANCE STATS</div>
          <div className="debug-row"><span>FPS:</span> <span id="dbg-fps">60</span></div>
          <div className="debug-row"><span>Frame:</span> <span id="dbg-ms">16.6 ms</span></div>
          <div className="debug-row"><span>Speed:</span> <span id="dbg-speed">80 km/h</span></div>
          <div className="debug-row"><span>Segments:</span> <span id="dbg-segments">0</span></div>
          <div className="debug-row"><span>Traffic:</span> <span id="dbg-traffic">0</span></div>
          <div className="debug-row"><span>Coins:</span> <span id="dbg-coins">0</span></div>
          <div className="debug-row"><span>Obstacles:</span> <span id="dbg-obstacles">0</span></div>
          <div className="debug-row"><span>Draw Calls:</span> <span id="dbg-drawcalls">0</span></div>
          <div className="debug-row"><span>Triangles:</span> <span id="dbg-triangles">0</span></div>
          <div className="debug-row">
            <label><input type="checkbox" id="dbg-godmode" /> Invincible</label>
          </div>
        </div>
      </div>
    </div>
  );
}
