export type UpdateCallback = (delta: number, elapsed: number) => void;

export class GameLoop {
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private updateFn: UpdateCallback;

  // Profiling stats
  public fps: number = 60;
  public frameTimeMs: number = 16.6;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  constructor(updateFn: UpdateCallback) {
    this.updateFn = updateFn;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.fpsTimer = this.lastTime;
    this.frameCount = 0;
    this.loop(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const frameStart = performance.now();
    // Clamping delta to avoid tunneling if frame rate drops
    const rawDelta = (currentTime - this.lastTime) / 1000;
    const delta = Math.min(Math.max(rawDelta, 0.001), 0.1);
    this.lastTime = currentTime;

    // Track FPS
    this.frameCount++;
    if (currentTime - this.fpsTimer >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = currentTime;
    }

    // Run game update
    this.updateFn(delta, currentTime / 1000);

    this.frameTimeMs = Math.round((performance.now() - frameStart) * 10) / 10;
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
