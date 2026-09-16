import { Game } from './core/Game';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas #game-canvas not found!');
    return;
  }

  const game = new Game(canvas);
  await game.init();

  // Expose on window for debugging if needed
  (window as unknown as { __game: Game }).__game = game;
});
