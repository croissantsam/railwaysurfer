import * as THREE from 'three';
import { CarDefinition, CARS } from '../garage/CarDefinitions';

export const LANE_WIDTH = 3.5;
export const LANES = [-LANE_WIDTH, 0, LANE_WIDTH] as const;

export class PlayerCar {
  public mesh: THREE.Group;
  public currentLaneIndex: number = 1; // 0 = Left, 1 = Center, 2 = Right
  public targetX: number = 0;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public carDef: CarDefinition;

  // Wheels for rotation
  private wheels: THREE.Mesh[] = [];

  // Visual cues
  private bodyMesh!: THREE.Mesh;
  private paintMaterial!: THREE.MeshStandardMaterial;
  private cabinMaterial!: THREE.MeshStandardMaterial;
  private stripeMaterial!: THREE.MeshStandardMaterial;
  private brakeLightMaterial!: THREE.MeshStandardMaterial;
  private headlightMaterial!: THREE.MeshStandardMaterial;
  private nitroJetMeshes: THREE.Mesh[] = [];

  // Dynamic animation state
  private rollAngle: number = 0;
  private isBoosting: boolean = false;
  private bounceTime: number = 0;

  // Jump State
  public isJumping: boolean = false;
  private jumpTimer: number = 0;
  private readonly JUMP_DURATION: number = 0.95;
  private readonly JUMP_HEIGHT: number = 4.4;

  // Invulnerability state after hit
  public isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;

  // Collision bounding box
  public boundingBox: THREE.Box3 = new THREE.Box3();
  public readonly boundsSize: THREE.Vector3 = new THREE.Vector3(1.8, 1.2, 4.0);

  constructor(carDef?: CarDefinition) {
    this.carDef = carDef || CARS[0];
    this.mesh = new THREE.Group();
    this.createCarModel();
    this.mesh.position.copy(this.position);
    this.updateBoundingBox();
  }

  public jump(): boolean {
    if (this.isJumping) return false;
    this.isJumping = true;
    this.jumpTimer = 0;
    return true;
  }

  public setCarDefinition(carDef: CarDefinition): void {
    this.carDef = carDef;
    // Update materials directly
    if (this.paintMaterial) {
      this.paintMaterial.color.setHex(carDef.color);
      this.paintMaterial.emissive.setHex(carDef.emissiveColor);
    }
    if (this.cabinMaterial) {
      this.cabinMaterial.color.setHex(carDef.cabinColor);
    }
    if (this.stripeMaterial) {
      this.stripeMaterial.color.setHex(carDef.accentColor);
    }
  }

  private createCarModel(): void {
    // 1. Shared Materials
    this.paintMaterial = new THREE.MeshStandardMaterial({
      color: this.carDef.color,
      metalness: 0.35,
      roughness: 0.25,
      emissive: this.carDef.emissiveColor,
      emissiveIntensity: 0.3,
    });

    this.cabinMaterial = new THREE.MeshStandardMaterial({
      color: this.carDef.cabinColor,
      metalness: 0.3,
      roughness: 0.3,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2e3a,
      metalness: 0.2,
      roughness: 0.6,
    });

    const wheelRubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,  // Slightly lighter rubber
      roughness: 0.85,
      metalness: 0.0,
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.5,  // Reduced from 0.9
      roughness: 0.25,
    });

    this.headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 4.0, // Very bright headlights
      roughness: 0.0,
      metalness: 0.0,
    });

    this.brakeLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1e38,
      emissive: 0xff1e38,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.0,
    });

    // 2. Main Chassis Body
    const bodyGeom = new THREE.BoxGeometry(1.9, 0.55, 4.3);
    this.bodyMesh = new THREE.Mesh(bodyGeom, this.paintMaterial);
    this.bodyMesh.position.y = 0.55;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.mesh.add(this.bodyMesh);

    // Front nose taper / hood slope
    const hoodGeom = new THREE.BoxGeometry(1.82, 0.35, 1.4);
    const hoodMesh = new THREE.Mesh(hoodGeom, this.paintMaterial);
    hoodMesh.position.set(0, 0.48, -1.5);
    hoodMesh.rotation.x = 0.08;
    hoodMesh.castShadow = true;
    this.mesh.add(hoodMesh);

    // Carbon fiber front splitter
    const splitterGeom = new THREE.BoxGeometry(2.0, 0.08, 0.6);
    const splitterMesh = new THREE.Mesh(splitterGeom, trimMaterial);
    splitterMesh.position.set(0, 0.26, -2.15);
    this.mesh.add(splitterMesh);

    // 3. Sport Cabin / Cockpit Roof
    const cabinGeom = new THREE.BoxGeometry(1.45, 0.5, 2.1);
    const cabinMesh = new THREE.Mesh(cabinGeom, this.cabinMaterial);
    cabinMesh.position.set(0, 0.98, 0.1);
    cabinMesh.castShadow = true;
    this.mesh.add(cabinMesh);

    // Aerodynamic Rear Wing / Spoiler
    const spoilerStandsGeom = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    [-0.6, 0.6].forEach(x => {
      const stand = new THREE.Mesh(spoilerStandsGeom, trimMaterial);
      stand.position.set(x, 1.0, 1.95);
      this.mesh.add(stand);
    });
    const spoilerBladeGeom = new THREE.BoxGeometry(1.9, 0.06, 0.45);
    const spoilerBlade = new THREE.Mesh(spoilerBladeGeom, trimMaterial);
    spoilerBlade.position.set(0, 1.2, 1.95);
    spoilerBlade.castShadow = true;
    this.mesh.add(spoilerBlade);

    // Racing Stripes down center
    const stripeGeom = new THREE.BoxGeometry(0.35, 0.02, 4.3);
    this.stripeMaterial = new THREE.MeshStandardMaterial({
      color: this.carDef.accentColor,
      metalness: 0.3,
      roughness: 0.3,
    });
    const stripe = new THREE.Mesh(stripeGeom, this.stripeMaterial);
    stripe.position.set(0, 0.83, 0);
    this.mesh.add(stripe);

    // 4. Headlights (Angled front)
    [-0.72, 0.72].forEach(x => {
      const lightGeom = new THREE.BoxGeometry(0.35, 0.12, 0.1);
      const lightMesh = new THREE.Mesh(lightGeom, this.headlightMaterial);
      lightMesh.position.set(x, 0.58, -2.16);
      this.mesh.add(lightMesh);
    });

    // 5. Taillights (Rear strip)
    [-0.68, 0.68].forEach(x => {
      const tailGeom = new THREE.BoxGeometry(0.42, 0.12, 0.1);
      const tailMesh = new THREE.Mesh(tailGeom, this.brakeLightMaterial);
      tailMesh.position.set(x, 0.65, 2.16);
      this.mesh.add(tailMesh);
    });

    // 6. Wheels (4 sport wheels)
    const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    wheelGeom.rotateZ(Math.PI / 2);

    const rimGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 8);
    rimGeom.rotateZ(Math.PI / 2);

    const wheelPositions = [
      [-0.95, 0.38, -1.3],  // Front Left
      [0.95, 0.38, -1.3],   // Front Right
      [-0.95, 0.38, 1.35],  // Rear Left
      [0.95, 0.38, 1.35],   // Rear Right
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheelGroup = new THREE.Group();
      const tireMesh = new THREE.Mesh(wheelGeom, wheelRubberMaterial);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      const rimMesh = new THREE.Mesh(rimGeom, rimMaterial);
      wheelGroup.add(rimMesh);

      wheelGroup.position.set(x, y, z);
      this.mesh.add(wheelGroup);
      this.wheels.push(tireMesh);
    });

    // 7. Nitro Jet exhaust nozzles
    const jetGeom = new THREE.ConeGeometry(0.18, 0.8, 8);
    jetGeom.rotateX(Math.PI / 2);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
    });

    [-0.35, 0.35].forEach(x => {
      const jet = new THREE.Mesh(jetGeom, jetMat);
      jet.position.set(x, 0.45, 2.6);
      this.mesh.add(jet);
      this.nitroJetMeshes.push(jet);
    });
  }

  changeLane(direction: -1 | 1): boolean {
    const nextLane = this.currentLaneIndex + direction;
    if (nextLane >= 0 && nextLane < LANES.length) {
      this.currentLaneIndex = nextLane;
      this.targetX = LANES[this.currentLaneIndex];
      // Initiate lane roll tilt
      this.rollAngle = direction * -0.16;
      return true;
    }
    return false;
  }

  setBoost(active: boolean): void {
    this.isBoosting = active;
    const opacity = active ? 0.9 : 0;
    this.nitroJetMeshes.forEach(jet => {
      (jet.material as THREE.MeshBasicMaterial).opacity = opacity;
    });
  }

  update(delta: number, speedKmh: number): void {
    // 1. Smooth responsive lane interpolation scaling with speed & car handling stat
    const handlingBase = this.carDef?.stats?.handlingLerp ?? 16.0;
    const lerpSpeed = handlingBase + (speedKmh / 320) * 8.0;
    const prevX = this.position.x;
    this.position.x += (this.targetX - this.position.x) * Math.min(delta * lerpSpeed, 1);

    // Roll tilt during lane transition
    const dx = this.position.x - prevX;
    const targetRoll = -dx * 0.45;
    this.rollAngle += (targetRoll - this.rollAngle) * Math.min(delta * 12, 1);
    this.mesh.rotation.z = this.rollAngle;
    this.mesh.rotation.y = -this.rollAngle * 0.35; // Slight yaw steer

    // 2. Wheel rotation proportional to speed
    // speedKmh to m/s: (speedKmh / 3.6)
    const wheelAngularSpeed = (speedKmh / 3.6) / 0.38;
    this.wheels.forEach(wheel => {
      wheel.rotation.x += wheelAngularSpeed * delta;
    });

    // 3. Jump Physics & Road vibration/suspension bounce
    let currentY = 0;
    let pitchAngle = 0;
    if (this.isJumping) {
      this.jumpTimer += delta;
      const progress = this.jumpTimer / this.JUMP_DURATION;
      if (progress >= 1.0) {
        this.isJumping = false;
        this.jumpTimer = 0;
        currentY = 0;
        pitchAngle = 0;
      } else {
        // High parabolic leap over vehicles and obstacles
        currentY = Math.sin(progress * Math.PI) * this.JUMP_HEIGHT;
        // Pitch tilt: upward on takeoff, downward on landing
        if (progress < 0.45) {
          pitchAngle = -0.22 * Math.sin((progress / 0.45) * Math.PI);
        } else {
          const descent = (progress - 0.45) / 0.55;
          pitchAngle = 0.18 * Math.sin(descent * Math.PI);
        }
      }
    } else {
      this.bounceTime += delta * 25;
      currentY = Math.sin(this.bounceTime) * 0.015 * (speedKmh / 120);
    }
    this.position.y = currentY;
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.rotation.x = pitchAngle;

    // 4. Boost flame pulsation
    if (this.isBoosting) {
      const scaleZ = 1.0 + Math.random() * 0.4;
      this.nitroJetMeshes.forEach(jet => {
        jet.scale.set(1, 1, scaleZ);
      });
    }

    // 5. Invulnerability grace period & blinking
    if (this.isInvulnerable) {
      this.invulnerableTimer -= delta;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
        this.mesh.visible = true;
      } else {
        // High frequency blinking (12Hz)
        this.mesh.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
      }
    } else {
      this.mesh.visible = true;
    }

    this.updateBoundingBox();
  }

  triggerDamageGracePeriod(durationSeconds?: number): void {
    this.isInvulnerable = true;
    this.invulnerableTimer = durationSeconds ?? (this.carDef?.stats?.invulnerabilityDuration ?? 2.4);
  }

  updateBoundingBox(): void {
    const half = this.boundsSize.clone().multiplyScalar(0.5);
    this.boundingBox.min.set(
      this.mesh.position.x - half.x,
      this.mesh.position.y,
      this.mesh.position.z - half.z
    );
    this.boundingBox.max.set(
      this.mesh.position.x + half.x,
      this.mesh.position.y + this.boundsSize.y,
      this.mesh.position.z + half.z
    );
  }

  reset(): void {
    this.currentLaneIndex = 1;
    this.targetX = 0;
    this.position.set(0, 0, 0);
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.rollAngle = 0;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.mesh.visible = true;
    this.setBoost(false);
    this.updateBoundingBox();
  }
}
