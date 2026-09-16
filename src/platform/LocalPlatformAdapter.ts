import { PlatformAdapter } from './PlatformAdapter';

export class LocalPlatformAdapter implements PlatformAdapter {
  private readonly HIGH_SCORE_KEY = 'highway_rush_best_score';
  private readonly AUDIO_MUTE_KEY = 'highway_rush_muted';
  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];

  async initialize(): Promise<void> {
    // Listen to document visibility for auto-pause
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseCallbacks.forEach(cb => cb());
      } else {
        this.resumeCallbacks.forEach(cb => cb());
      }
    });
  }

  async showInterstitial(): Promise<void> {
    console.log('[LocalPlatformAdapter] Mock Interstitial ad shown');
  }

  async showRewardedAd(): Promise<boolean> {
    console.log('[LocalPlatformAdapter] Mock Rewarded ad watched');
    return true;
  }

  async submitScore(score: number): Promise<void> {
    const best = this.getBestScore();
    if (score > best) {
      this.saveBestScore(score);
    }
  }

  getBestScore(): number {
    try {
      const val = localStorage.getItem(this.HIGH_SCORE_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  saveBestScore(score: number): void {
    try {
      localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
    } catch {
      // Ignore in restricted environments
    }
  }

  isAudioMuted(): boolean {
    try {
      return localStorage.getItem(this.AUDIO_MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  setAudioMuted(muted: boolean): void {
    try {
      localStorage.setItem(this.AUDIO_MUTE_KEY, muted.toString());
    } catch {
      // Ignore
    }
  }

  onPause(callback: () => void): void {
    this.pauseCallbacks.push(callback);
  }

  onResume(callback: () => void): void {
    this.resumeCallbacks.push(callback);
  }
}
