export class GameOverScreen {
  private element: HTMLElement | null;
  private btnReplay: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private bestScoreEl: HTMLElement | null;
  private coinsEl: HTMLElement | null;
  private distanceEl: HTMLElement | null;

  constructor(onReplay: () => void) {
    this.element = document.getElementById('game-over-screen');
    this.btnReplay = document.getElementById('btn-replay');
    this.scoreEl = document.getElementById('go-score');
    this.bestScoreEl = document.getElementById('go-best-score');
    this.coinsEl = document.getElementById('go-coins');
    this.distanceEl = document.getElementById('go-distance');

    if (this.btnReplay) {
      this.btnReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        onReplay();
      });
    }
  }

  show(score: number, bestScore: number, coins: number, distanceMeters: number): void {
    if (this.scoreEl) this.scoreEl.textContent = Math.floor(score).toLocaleString();
    if (this.bestScoreEl) this.bestScoreEl.textContent = Math.floor(bestScore).toLocaleString();
    if (this.coinsEl) this.coinsEl.textContent = `🪙 ${coins}`;
    if (this.distanceEl) this.distanceEl.textContent = `${Math.floor(distanceMeters)} m`;

    this.element?.classList.add('active');
  }

  hide(): void {
    this.element?.classList.remove('active');
  }

  isVisible(): boolean {
    return !!this.element?.classList.contains('active');
  }
}
