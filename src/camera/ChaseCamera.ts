import * as THREE from 'three';

export class ChaseCamera {
  public camera: THREE.PerspectiveCamera;
  private targetOffset: THREE.Vector3 = new THREE.Vector3(0, 3.4, 7.8);
  private lookAtOffset: THREE.Vector3 = new THREE.Vector3(0, 1.1, -12);

  private baseFov: number = 55;
  private currentFov: number = 55;

  // Camera shake state
  private shakeIntensity: number = 0;
  private shakeDecay: number = 4.5;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 4, 8);
    this.camera.lookAt(0, 1.2, -10);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  triggerShake(intensity: number = 0.4): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  update(playerPos: THREE.Vector3, speedKmh: number, delta: number): void {
    // Dynamic FOV based on speed (widens up to 4x speed for exhilarating speed feel)
    const speedFactor = Math.min(Math.max((speedKmh - 80) / (320 - 80), 0), 1);
    const targetFov = this.baseFov + speedFactor * 22;
    this.currentFov += (targetFov - this.currentFov) * Math.min(delta * 5, 1);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    // Camera smoothly follows player's X (lane) with slight lag for natural weight
    const targetX = playerPos.x * 0.65;
    this.camera.position.x += (targetX - this.camera.position.x) * Math.min(delta * 12, 1);
    this.camera.position.y = this.targetOffset.y;
    this.camera.position.z = playerPos.z + this.targetOffset.z;

    // Apply trauma / shake if active
    if (this.shakeIntensity > 0.001) {
      const shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      const shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
    }

    const lookTarget = new THREE.Vector3(
      playerPos.x * 0.4,
      playerPos.y + this.lookAtOffset.y,
      playerPos.z + this.lookAtOffset.z
    );
    this.camera.lookAt(lookTarget);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
