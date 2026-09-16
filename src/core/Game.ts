import { StateManager, GameState } from './GameState';
import { GameLoop } from './GameLoop';
import { GameRenderer } from '../rendering/Renderer';
import { GameScene } from '../rendering/Scene';
import { ChaseCamera } from '../camera/ChaseCamera';
import { PlayerCar } from '../player/PlayerCar';
import { Highway } from '../highway/Highway';
import { CollisionSystem } from '../collision/CollisionSystem';
import { InputManager } from '../input/InputManager';
import { AudioManager } from '../audio/AudioManager';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { HUD } from '../ui/HUD';
import { StartScreen } from '../ui/StartScreen';
import { GameOverScreen } from '../ui/GameOverScreen';
import { DebugPanel } from '../ui/DebugPanel';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { YouTubePlatformAdapter } from '../platform/YouTubePlatformAdapter';
import { garageStore } from '../garage/GarageStore';

export class Game {
  public stateManager: StateManager;
  private gameLoop: GameLoop;
  private renderer: GameRenderer;
  private gameScene: GameScene;
  private camera: ChaseCamera;
  public player: PlayerCar;
  private highway: Highway;
  private collisionSystem: CollisionSystem;
  private inputManager: InputManager;
  private audioManager: AudioManager;
  private envManager: EnvironmentManager;
  private platform: PlatformAdapter;

  // React / UI integration callbacks
  public onGameOver?: (score: number, coins: number, distance: number) => void;
  public onCoinCollected?: (totalCoins: number) => void;
  public onStateChange?: (state: GameState) => void;

  // UI
  private hud: HUD;
  private startScreen: StartScreen;
  private gameOverScreen: GameOverScreen;
  private debugPanel: DebugPanel;
  private pauseModal: HTMLElement | null;

  // Gameplay Metrics
  private readonly BASE_START_SPEED_KMH: number = 80;
  private readonly MAX_SPEED_KMH: number = 320; // 4x Max Speed
  private baseSpeedKmh: number = 80;
  private currentSpeedKmh: number = 80;
  private isBoosting: boolean = false;
  private score: number = 0;
  private coinsCount: number = 0;
  private distanceTraveled: number = 0;
  private survivalTimeSec: number = 0;
  private currentEnvName: string = 'NEON CITY';

  // Lives & Shield System (3 lives, 1 life regenerated every 60 seconds)
  private readonly MAX_LIVES: number = 3;
  private lives: number = 3;
  private lifeRegenTimerSec: number = 0;
  private readonly LIFE_REGEN_INTERVAL_SEC: number = 60.0;

  constructor(canvas: HTMLCanvasElement) {
    this.platform = new YouTubePlatformAdapter();
    this.stateManager = new StateManager();

    this.renderer = new GameRenderer(canvas);
    this.gameScene = new GameScene();
    this.camera = new ChaseCamera();

    this.audioManager = new AudioManager(this.platform.isAudioMuted());

    // Initialize player with selected car from garage
    this.player = new PlayerCar(garageStore.getSelectedCar());
    this.gameScene.scene.add(this.player.mesh);

    this.highway = new Highway(this.gameScene.scene);
    this.collisionSystem = new CollisionSystem();
    this.envManager = new EnvironmentManager(this.gameScene);

    // UI
    this.hud = new HUD();
    this.debugPanel = new DebugPanel();
    this.debugPanel.onGodModeToggle = (enabled) => {
      this.collisionSystem.godMode = enabled;
    };

    this.startScreen = new StartScreen(() => this.startGame());
    this.gameOverScreen = new GameOverScreen(() => this.restartGame());
    this.pauseModal = document.getElementById('pause-screen');

    this.inputManager = new InputManager();
    this.setupInputHandlers();
    this.setupUIButtons();

    this.gameLoop = new GameLoop((delta, elapsed) => this.update(delta, elapsed));

    this.stateManager.onStateChange((newState) => this.handleStateTransition(newState));
  }

  async init(): Promise<void> {
    await this.platform.initialize();

    // Hook platform pause/resume
    this.platform.onPause(() => {
      if (this.stateManager.state === 'playing') {
        this.pauseGame();
      }
    });

    this.platform.onResume(() => {
      if (this.stateManager.state === 'paused') {
        this.resumeGame();
      }
    });

    this.stateManager.setState('ready');
    this.gameLoop.start();
  }

  private setupInputHandlers(): void {
    this.inputManager.onAction((action) => {
      const state = this.stateManager.state;

      // Unlock Web Audio on first user action
      this.audioManager.unlock();

      if (state === 'ready') {
        if (action === 'any-key') {
          this.startGame();
          return;
        }
      }

      if (state === 'game-over') {
        if (action === 'any-key' || action === 'boost-start') {
          this.restartGame();
          return;
        }
      }

      if (action === 'toggle-debug') {
        this.debugPanel.toggle();
        return;
      }

      if (state !== 'playing') {
        if (action === 'pause' && state === 'paused') {
          this.resumeGame();
        }
        return;
      }

      // In-Game actions
      switch (action) {
        case 'left':
          if (this.player.changeLane(-1)) {
            this.audioManager.playLaneChange();
          }
          break;
        case 'right':
          if (this.player.changeLane(1)) {
            this.audioManager.playLaneChange();
          }
          break;
        case 'jump':
          if (this.player.jump()) {
            this.audioManager.playJump();
          }
          break;
        case 'boost-start':
          this.isBoosting = true;
          this.player.setBoost(true);
          this.audioManager.playBoost();
          break;
        case 'boost-end':
          this.isBoosting = false;
          this.player.setBoost(false);
          break;
        case 'pause':
          this.pauseGame();
          break;
      }
    });
  }

  private setupUIButtons(): void {
    // Pause button
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.stateManager.state === 'playing') {
          this.pauseGame();
        }
      });
    }

    // Audio toggle button
    const btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audioManager.unlock();
        const muted = this.audioManager.toggleMute();
        this.platform.setAudioMuted(muted);
        btnAudio.textContent = muted ? '🔇' : '🔊';
      });
      btnAudio.textContent = this.platform.isAudioMuted() ? '🔇' : '🔊';
    }

    // Pause modal resume / restart
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resumeGame();
      });
    }

    const btnRestartPause = document.getElementById('btn-restart-pause');
    if (btnRestartPause) {
      btnRestartPause.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resumeGame();
        this.restartGame();
      });
    }
  }

  private handleStateTransition(newState: GameState): void {
    this.onStateChange?.(newState);

    switch (newState) {
      case 'ready':
        this.startScreen.show();
        this.gameOverScreen.hide();
        this.pauseModal?.classList.remove('active');
        break;

      case 'playing':
        this.startScreen.hide();
        this.gameOverScreen.hide();
        this.pauseModal?.classList.remove('active');
        break;

      case 'paused':
        this.pauseModal?.classList.add('active');
        break;

      case 'game-over':
        this.audioManager.stopEngine();
        const best = Math.max(this.score, this.platform.getBestScore());
        this.platform.submitScore(this.score);
        this.gameOverScreen.show(this.score, best, this.coinsCount, this.distanceTraveled);
        this.onGameOver?.(Math.floor(this.score), this.coinsCount, Math.floor(this.distanceTraveled));
        break;
    }
  }

  startGame(): void {
    this.player.setCarDefinition(garageStore.getSelectedCar());
    this.stateManager.setState('playing');
  }

  pauseGame(): void {
    if (this.stateManager.state === 'playing') {
      this.stateManager.setState('paused');
    }
  }

  resumeGame(): void {
    if (this.stateManager.state === 'paused') {
      this.stateManager.setState('playing');
    }
  }

  restartGame(): void {
    this.score = 0;
    this.coinsCount = 0;
    this.distanceTraveled = 0;
    this.survivalTimeSec = 0;
    this.baseSpeedKmh = this.BASE_START_SPEED_KMH;
    this.currentSpeedKmh = this.BASE_START_SPEED_KMH;
    this.isBoosting = false;
    this.lives = this.MAX_LIVES;
    this.lifeRegenTimerSec = 0;

    this.player.setCarDefinition(garageStore.getSelectedCar());
    this.player.reset();
    this.highway.reset();
    this.envManager.reset();

    this.stateManager.setState('playing');
  }

  private update(delta: number, _elapsed: number): void {
    const isPlaying = this.stateManager.state === 'playing';

    if (isPlaying) {
      this.survivalTimeSec += delta;

      // 60-Second Life Regeneration System:
      // If lives are missing (< 3), after every 60s of driving recover +1 life!
      if (this.lives < this.MAX_LIVES) {
        this.lifeRegenTimerSec += delta;
        if (this.lifeRegenTimerSec >= this.LIFE_REGEN_INTERVAL_SEC) {
          this.lifeRegenTimerSec = 0;
          this.lives = Math.min(this.MAX_LIVES, this.lives + 1);
          this.audioManager.playLifeRecover();
          this.hud.showHealAlert(this.lives);
        }
      } else {
        this.lifeRegenTimerSec = 0;
      }

      // Speed progression: accelerates continuously up to 4.0x (320 km/h)
      this.baseSpeedKmh = Math.min(
        this.BASE_START_SPEED_KMH + this.survivalTimeSec * 2.65,
        this.MAX_SPEED_KMH
      );
      const boostBonus = this.player.carDef?.stats?.boostMultiplier ?? 1.0;
      const boostSpeed = 45 * boostBonus;
      const targetSpeed = this.isBoosting
        ? Math.min(this.baseSpeedKmh + boostSpeed, 380)
        : this.baseSpeedKmh;
      this.currentSpeedKmh += (targetSpeed - this.currentSpeedKmh) * Math.min(delta * 4, 1);

      const speedMultiplier = this.currentSpeedKmh / this.BASE_START_SPEED_KMH;

      // Distance and score (scaled by car score bonus)
      const speedMps = this.currentSpeedKmh / 3.6;
      const distanceDelta = speedMps * delta;
      this.distanceTraveled += distanceDelta;
      const carScoreMult = 1.0 + (this.player.carDef?.stats?.speedMultiplierBonus ?? 0);
      this.score += distanceDelta * 1.5 * carScoreMult;

      // Difficulty factor (0 to 1 over 100 seconds)
      const difficulty = Math.min(this.survivalTimeSec / 100, 1.0);

      // Update player
      this.player.update(delta, this.currentSpeedKmh);

      // Update highway & world items
      this.highway.update(delta, this.currentSpeedKmh, difficulty);

      // Update environment
      this.currentEnvName = this.envManager.update(delta, distanceDelta, this.distanceTraveled);

      // Check collisions & pickups
      const collisionResult = this.collisionSystem.checkCollisions(
        this.player,
        this.highway.activeVehicles,
        this.highway.activeObstacles,
        this.highway.activeCoins
      );

      // 1. Crash / Damage Check (3-Lives system)
      if (collisionResult.crashed) {
        if (this.lives > 1) {
          // Lose 1 life, trigger invulnerability grace period (scales with car shield stat)
          this.lives -= 1;
          this.player.triggerDamageGracePeriod();
          this.audioManager.playDamage();
          this.camera.triggerShake(0.65);
          this.hud.showDamageAlert(this.lives);

          // Speed impact penalty
          this.currentSpeedKmh = Math.max(80, this.currentSpeedKmh * 0.72);

          // Clear nearby obstacles and vehicles in front of player
          for (let i = this.highway.activeVehicles.length - 1; i >= 0; i--) {
            const v = this.highway.activeVehicles[i];
            if (Math.abs(v.mesh.position.z - this.player.mesh.position.z) < 14) {
              this.highway.trafficPool.release(v);
              this.highway.activeVehicles.splice(i, 1);
            }
          }
          for (let i = this.highway.activeObstacles.length - 1; i >= 0; i--) {
            const o = this.highway.activeObstacles[i];
            if (Math.abs(o.mesh.position.z - this.player.mesh.position.z) < 12) {
              this.highway.obstaclePool.release(o);
              this.highway.activeObstacles.splice(i, 1);
            }
          }
        } else {
          // Last life lost: Game Over
          this.lives = 0;
          this.audioManager.playCrash();
          this.camera.triggerShake(0.9);
          this.stateManager.setState('game-over');
          return;
        }
      }

      // 2. Near Miss
      if (collisionResult.nearMissVehicle) {
        this.score += 100 * carScoreMult;
        this.audioManager.playNearMiss();
        this.camera.triggerShake(0.25);
        this.hud.showNearMiss();
      }

      // 3. Coin pickups
      if (collisionResult.coinsCollected.length > 0) {
        collisionResult.coinsCollected.forEach(() => {
          this.coinsCount += 1;
          this.score += 250 * carScoreMult;
          garageStore.addCoins(1);
          this.audioManager.playCoin();
        });
        this.onCoinCollected?.(garageStore.getTotalCoins());
      }

      // Audio engine update
      this.audioManager.setSpeed(this.currentSpeedKmh, this.isBoosting);

      // Update HUD with lives and regen progress
      const regenProgress = this.lives < this.MAX_LIVES
        ? this.lifeRegenTimerSec / this.LIFE_REGEN_INTERVAL_SEC
        : 1.0;

      this.hud.update(
        this.score,
        this.coinsCount,
        this.currentSpeedKmh,
        this.currentEnvName,
        this.isBoosting,
        speedMultiplier,
        this.lives,
        regenProgress
      );
    }

    // Camera update (always updates for smooth rendering)
    this.camera.update(this.player.mesh.position, this.currentSpeedKmh, delta);

    // Render 3D Scene
    this.renderer.render(this.gameScene.scene, this.camera.camera);

    // Update Debug Stats
    this.debugPanel.update({
      fps: this.gameLoop.fps,
      frameTimeMs: this.gameLoop.frameTimeMs,
      speedKmh: this.currentSpeedKmh,
      activeSegments: this.highway.getActiveSegmentCount(),
      activeTraffic: this.highway.activeVehicles.length,
      activeCoins: this.highway.activeCoins.length,
      activeObstacles: this.highway.activeObstacles.length,
      drawCalls: this.renderer.getDrawCalls(),
      triangles: this.renderer.getTriangles(),
    });
  }

  destroy(): void {
    this.gameLoop.stop();
    this.audioManager.stopEngine();
    this.renderer.dispose();
    this.inputManager.dispose();
  }
}
