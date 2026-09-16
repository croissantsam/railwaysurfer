export interface DebugStats {
  fps: number;
  frameTimeMs: number;
  speedKmh: number;
  activeSegments: number;
  activeTraffic: number;
  activeCoins: number;
  activeObstacles: number;
  drawCalls: number;
  triangles: number;
}

export class DebugPanel {
  private panel: HTMLElement | null;
  private fpsEl: HTMLElement | null;
  private msEl: HTMLElement | null;
  private speedEl: HTMLElement | null;
  private segmentsEl: HTMLElement | null;
  private trafficEl: HTMLElement | null;
  private coinsEl: HTMLElement | null;
  private obstaclesEl: HTMLElement | null;
  private drawCallsEl: HTMLElement | null;
  private trianglesEl: HTMLElement | null;
  private godModeCheckbox: HTMLInputElement | null;

  public onGodModeToggle?: (enabled: boolean) => void;

  constructor() {
    this.panel = document.getElementById('debug-panel');
    this.fpsEl = document.getElementById('dbg-fps');
    this.msEl = document.getElementById('dbg-ms');
    this.speedEl = document.getElementById('dbg-speed');
    this.segmentsEl = document.getElementById('dbg-segments');
    this.trafficEl = document.getElementById('dbg-traffic');
    this.coinsEl = document.getElementById('dbg-coins');
    this.obstaclesEl = document.getElementById('dbg-obstacles');
    this.drawCallsEl = document.getElementById('dbg-drawcalls');
    this.trianglesEl = document.getElementById('dbg-triangles');
    this.godModeCheckbox = document.getElementById('dbg-godmode') as HTMLInputElement | null;

    if (this.godModeCheckbox) {
      this.godModeCheckbox.addEventListener('change', () => {
        this.onGodModeToggle?.(!!this.godModeCheckbox?.checked);
      });
    }
  }

  toggle(): void {
    if (!this.panel) return;
    this.panel.classList.toggle('hidden');
  }

  update(stats: DebugStats): void {
    if (!this.panel || this.panel.classList.contains('hidden')) return;

    if (this.fpsEl) this.fpsEl.textContent = stats.fps.toString();
    if (this.msEl) this.msEl.textContent = `${stats.frameTimeMs} ms`;
    if (this.speedEl) this.speedEl.textContent = `${Math.floor(stats.speedKmh)} km/h`;
    if (this.segmentsEl) this.segmentsEl.textContent = stats.activeSegments.toString();
    if (this.trafficEl) this.trafficEl.textContent = stats.activeTraffic.toString();
    if (this.coinsEl) this.coinsEl.textContent = stats.activeCoins.toString();
    if (this.obstaclesEl) this.obstaclesEl.textContent = stats.activeObstacles.toString();
    if (this.drawCallsEl) this.drawCallsEl.textContent = stats.drawCalls.toString();
    if (this.trianglesEl) this.trianglesEl.textContent = stats.triangles.toString();
  }
}
