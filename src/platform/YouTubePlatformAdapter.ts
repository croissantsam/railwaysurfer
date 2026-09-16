import { PlatformAdapter } from './PlatformAdapter';
import { LocalPlatformAdapter } from './LocalPlatformAdapter';

declare global {
  interface Window {
    YT_PLAYABLES?: {
      gameReady?: () => void;
      sendScore?: (data: { score: number }) => void;
      showInterstitial?: () => Promise<void>;
      showRewarded?: () => Promise<{ adFinished: boolean }>;
      onPause?: (cb: () => void) => void;
      onResume?: (cb: () => void) => void;
      isAudioMuted?: () => boolean;
      onAudioMuted?: (cb: (muted: boolean) => void) => void;
    };
  }
}

export class YouTubePlatformAdapter implements PlatformAdapter {
  private fallback: LocalPlatformAdapter = new LocalPlatformAdapter();
  private hasSDK: boolean = false;

  async initialize(): Promise<void> {
    await this.fallback.initialize();
    if (typeof window !== 'undefined' && window.YT_PLAYABLES) {
      this.hasSDK = true;
      try {
        window.YT_PLAYABLES.gameReady?.();
      } catch (e) {
        console.warn('[YouTubePlatformAdapter] gameReady failed:', e);
      }
    }
  }

  async showInterstitial(): Promise<void> {
    if (this.hasSDK && window.YT_PLAYABLES?.showInterstitial) {
      try {
        await window.YT_PLAYABLES.showInterstitial();
        return;
      } catch (e) {
        console.warn('[YouTubePlatformAdapter] showInterstitial failed:', e);
      }
    }
    return this.fallback.showInterstitial();
  }

  async showRewardedAd(): Promise<boolean> {
    if (this.hasSDK && window.YT_PLAYABLES?.showRewarded) {
      try {
        const result = await window.YT_PLAYABLES.showRewarded();
        return !!result?.adFinished;
      } catch (e) {
        console.warn('[YouTubePlatformAdapter] showRewarded failed:', e);
      }
    }
    return this.fallback.showRewardedAd();
  }

  async submitScore(score: number): Promise<void> {
    await this.fallback.submitScore(score);
    if (this.hasSDK && window.YT_PLAYABLES?.sendScore) {
      try {
        window.YT_PLAYABLES.sendScore({ score });
      } catch (e) {
        console.warn('[YouTubePlatformAdapter] sendScore failed:', e);
      }
    }
  }

  getBestScore(): number {
    return this.fallback.getBestScore();
  }

  saveBestScore(score: number): void {
    this.fallback.saveBestScore(score);
  }

  isAudioMuted(): boolean {
    if (this.hasSDK && window.YT_PLAYABLES?.isAudioMuted) {
      try {
        return window.YT_PLAYABLES.isAudioMuted();
      } catch {
        // Fallback
      }
    }
    return this.fallback.isAudioMuted();
  }

  setAudioMuted(muted: boolean): void {
    this.fallback.setAudioMuted(muted);
  }

  onPause(callback: () => void): void {
    if (this.hasSDK && window.YT_PLAYABLES?.onPause) {
      window.YT_PLAYABLES.onPause(callback);
    }
    this.fallback.onPause(callback);
  }

  onResume(callback: () => void): void {
    if (this.hasSDK && window.YT_PLAYABLES?.onResume) {
      window.YT_PLAYABLES.onResume(callback);
    }
    this.fallback.onResume(callback);
  }
}
