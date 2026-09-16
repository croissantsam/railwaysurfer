export type InputAction = 'left' | 'right' | 'jump' | 'boost-start' | 'boost-end' | 'pause' | 'any-key' | 'toggle-debug';

export class InputManager {
  private listeners: Array<(action: InputAction) => void> = [];

  // Touch tracking
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private minSwipeDistance: number = 30;

  constructor() {
    this.bindKeyboard();
    this.bindTouch();
  }

  onAction(callback: (action: InputAction) => void): void {
    this.listeners.push(callback);
  }

  private emit(action: InputAction): void {
    this.listeners.forEach(cb => cb(action));
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Notify any key (for starting / restarting)
      this.emit('any-key');

      if (e.repeat) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.emit('left');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.emit('right');
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.emit('jump');
          break;
        case 'Space':
          e.preventDefault();
          this.emit('boost-start');
          break;
        case 'KeyP':
        case 'Escape':
          this.emit('pause');
          break;
        case 'Backquote':
          this.emit('toggle-debug');
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.emit('boost-end');
      }
    });
  }

  private bindTouch(): void {
    window.addEventListener('touchstart', (e) => {
      this.emit('any-key');
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = performance.now();
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const deltaX = e.changedTouches[0].clientX - this.touchStartX;
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        const duration = performance.now() - this.touchStartTime;

        // Check if vertical swipe up (Jump)
        if (deltaY < -this.minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
          try { navigator.vibrate?.(25); } catch { /* ignore */ }
          this.emit('jump');
        } else if (Math.abs(deltaX) > this.minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
          // Check if horizontal swipe
          if (deltaX < 0) {
            this.emit('left');
          } else {
            this.emit('right');
          }
        } else if (duration < 250 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
          // Quick tap - temporary boost trigger
          this.emit('boost-start');
          setTimeout(() => this.emit('boost-end'), 300);
        }
      }
    }, { passive: true });

    // Touch zones binding for direct tap controls
    const leftZone = document.getElementById('touch-left');
    const rightZone = document.getElementById('touch-right');
    const boostZone = document.getElementById('touch-boost');

    // Dedicated mobile control buttons
    const btnLeft = document.getElementById('mobile-btn-left');
    const btnRight = document.getElementById('mobile-btn-right');
    const btnBoost = document.getElementById('mobile-btn-boost');
    const btnJump = document.getElementById('mobile-btn-jump');

    const handleLeft = (e: Event) => {
      e.preventDefault();
      try { navigator.vibrate?.(20); } catch { /* ignore */ }
      this.emit('left');
    };

    const handleRight = (e: Event) => {
      e.preventDefault();
      try { navigator.vibrate?.(20); } catch { /* ignore */ }
      this.emit('right');
    };

    const handleBoostStart = (e: Event) => {
      e.preventDefault();
      try { navigator.vibrate?.(35); } catch { /* ignore */ }
      this.emit('boost-start');
    };

    const handleBoostEnd = (e: Event) => {
      e.preventDefault();
      this.emit('boost-end');
    };

    const handleJump = (e: Event) => {
      e.preventDefault();
      try { navigator.vibrate?.(25); } catch { /* ignore */ }
      this.emit('jump');
    };

    leftZone?.addEventListener('pointerdown', handleLeft);
    rightZone?.addEventListener('pointerdown', handleRight);
    boostZone?.addEventListener('pointerdown', handleBoostStart);
    boostZone?.addEventListener('pointerup', handleBoostEnd);

    btnLeft?.addEventListener('pointerdown', handleLeft);
    btnRight?.addEventListener('pointerdown', handleRight);
    btnBoost?.addEventListener('pointerdown', handleBoostStart);
    btnBoost?.addEventListener('pointerup', handleBoostEnd);
    btnJump?.addEventListener('pointerdown', handleJump);
  }

  dispose(): void {
    this.listeners = [];
  }
}
