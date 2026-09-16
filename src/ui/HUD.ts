export class HUD {
  private scoreEl: HTMLElement | null;
  private coinsEl: HTMLElement | null;
  private speedEl: HTMLElement | null;
  private speedBarEl: HTMLElement | null;
  private multiplierEl: HTMLElement | null;
  private envBadgeEl: HTMLElement | null;
  private nearMissBanner: HTMLElement | null;
  private nearMissTimeout: number | null = null;
  private speedStreakFx: HTMLElement | null;

  // Lives and Shield
  private heartElements: HTMLElement[] = [];
  private lifeRegenFill: HTMLElement | null;
  private lifeAlertBanner: HTMLElement | null;
  private lifeAlertTitle: HTMLElement | null;
  private lifeAlertDesc: HTMLElement | null;
  private lifeAlertTimeout: number | null = null;
  private damageFlashFx: HTMLElement | null;

  constructor() {
    this.scoreEl = document.getElementById('hud-score');
    this.coinsEl = document.getElementById('hud-coins');
    this.speedEl = document.getElementById('hud-speed');
    this.speedBarEl = document.getElementById('speed-bar-fill');
    this.multiplierEl = document.getElementById('hud-multiplier');
    this.envBadgeEl = document.getElementById('hud-env-name');
    this.nearMissBanner = document.getElementById('near-miss-banner');
    this.speedStreakFx = document.getElementById('speed-streak-fx');

    // Lives elements
    const h1 = document.getElementById('life-1');
    const h2 = document.getElementById('life-2');
    const h3 = document.getElementById('life-3');
    this.heartElements = [h1, h2, h3].filter((h): h is HTMLElement => h !== null);

    this.lifeRegenFill = document.getElementById('life-regen-fill');
    this.lifeAlertBanner = document.getElementById('life-alert-banner');
    this.lifeAlertTitle = document.getElementById('life-alert-title');
    this.lifeAlertDesc = document.getElementById('life-alert-desc');
    this.damageFlashFx = document.getElementById('damage-flash-fx');
  }

  update(
    score: number,
    coins: number,
    speedKmh: number,
    envName: string,
    isBoosting: boolean,
    speedMultiplier: number = 1.0,
    lives: number = 3,
    regenProgress: number = 0
  ): void {
    if (this.scoreEl) {
      this.scoreEl.textContent = Math.floor(score).toLocaleString();
    }
    if (this.coinsEl) {
      this.coinsEl.textContent = coins.toString();
    }
    if (this.speedEl) {
      this.speedEl.textContent = Math.floor(speedKmh).toString();
    }
    if (this.multiplierEl) {
      this.multiplierEl.textContent = `${speedMultiplier.toFixed(1)}x`;
      if (speedMultiplier >= 2.5) {
        this.multiplierEl.classList.add('hyper');
      } else {
        this.multiplierEl.classList.remove('hyper');
      }
    }
    if (this.speedBarEl) {
      // Clamped percentage between 80 (1x) and 320 km/h (4x)
      const pct = Math.min(Math.max((speedKmh - 80) / (320 - 80), 0.05), 1) * 100;
      this.speedBarEl.style.width = `${pct}%`;
    }
    if (this.envBadgeEl && this.envBadgeEl.textContent !== envName) {
      this.envBadgeEl.textContent = envName;
    }
    if (this.speedStreakFx) {
      const opacity = isBoosting
        ? 0.85
        : speedKmh > 160
        ? ((speedKmh - 160) / 160) * 0.7
        : 0;
      this.speedStreakFx.style.opacity = opacity.toString();
    }

    // Update Hearts
    this.heartElements.forEach((heart, idx) => {
      if (idx < lives) {
        heart.classList.remove('lost');
        heart.textContent = '❤️';
      } else {
        heart.classList.add('lost');
        heart.textContent = '💔';
      }
    });

    // Update 60s life regen progress bar (only active if lives < 3)
    if (this.lifeRegenFill) {
      if (lives < 3) {
        this.lifeRegenFill.style.width = `${Math.min(regenProgress * 100, 100)}%`;
        this.lifeRegenFill.parentElement!.style.opacity = '1';
      } else {
        this.lifeRegenFill.style.width = '100%';
        this.lifeRegenFill.parentElement!.style.opacity = '0.35';
      }
    }
  }

  showDamageAlert(livesRemaining: number): void {
    // Red screen flash
    if (this.damageFlashFx) {
      this.damageFlashFx.style.opacity = '0.9';
      setTimeout(() => {
        if (this.damageFlashFx) this.damageFlashFx.style.opacity = '0';
      }, 250);
    }

    if (!this.lifeAlertBanner) return;

    if (this.lifeAlertTimeout !== null) {
      window.clearTimeout(this.lifeAlertTimeout);
    }

    this.lifeAlertBanner.classList.remove('heal');
    if (this.lifeAlertTitle) this.lifeAlertTitle.textContent = 'SHIELD DAMAGED!';
    if (this.lifeAlertDesc) {
      this.lifeAlertDesc.textContent = `${livesRemaining} LIFE${livesRemaining > 1 ? 'S' : ''} REMAINING`;
    }

    this.lifeAlertBanner.classList.remove('banner-hidden');

    this.lifeAlertTimeout = window.setTimeout(() => {
      this.lifeAlertBanner?.classList.add('banner-hidden');
      this.lifeAlertTimeout = null;
    }, 1800);
  }

  showHealAlert(newLivesCount: number): void {
    if (!this.lifeAlertBanner) return;

    if (this.lifeAlertTimeout !== null) {
      window.clearTimeout(this.lifeAlertTimeout);
    }

    // Pulse the restored heart icon
    const restoredHeartIdx = newLivesCount - 1;
    if (this.heartElements[restoredHeartIdx]) {
      this.heartElements[restoredHeartIdx].classList.add('pulse-heal');
      setTimeout(() => {
        this.heartElements[restoredHeartIdx]?.classList.remove('pulse-heal');
      }, 700);
    }

    this.lifeAlertBanner.classList.add('heal');
    if (this.lifeAlertTitle) this.lifeAlertTitle.textContent = 'SHIELD REPAIRED!';
    if (this.lifeAlertDesc) this.lifeAlertDesc.textContent = `+1 LIFE RESTORED (❤️ ${newLivesCount}/3)`;

    this.lifeAlertBanner.classList.remove('banner-hidden');

    this.lifeAlertTimeout = window.setTimeout(() => {
      this.lifeAlertBanner?.classList.add('banner-hidden');
      this.lifeAlertTimeout = null;
    }, 2000);
  }

  showNearMiss(): void {
    if (!this.nearMissBanner) return;

    if (this.nearMissTimeout !== null) {
      window.clearTimeout(this.nearMissTimeout);
    }

    this.nearMissBanner.classList.remove('banner-hidden');

    this.nearMissTimeout = window.setTimeout(() => {
      this.nearMissBanner?.classList.add('banner-hidden');
      this.nearMissTimeout = null;
    }, 1200);
  }
}
