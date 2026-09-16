export interface PlatformAdapter {
  initialize(): Promise<void>;
  showInterstitial(): Promise<void>;
  showRewardedAd(): Promise<boolean>;
  submitScore(score: number): Promise<void>;
  getBestScore(): number;
  saveBestScore(score: number): void;
  isAudioMuted(): boolean;
  setAudioMuted(muted: boolean): void;
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
}
