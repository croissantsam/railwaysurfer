import * as THREE from 'three';

export type VehicleType = 'sedan' | 'suv' | 'truck' | 'sports' | 'van' | 'bus';

const VEHICLE_COLORS = [
  0xe63946, // Red
  0xf4a261, // Amber
  0x2a9d8f, // Teal
  0x457b9d, // Slate blue
  0xf1faee, // White
  0x343a40, // Charcoal
  0xffb703, // Taxi Yellow
  0x8338ec, // Purple
];

export class TrafficVehicle {
  public mesh: THREE.Group;
  public boundingBox: THREE.Box3 = new THREE.Box3();
  public type: VehicleType = 'sedan';
  public laneIndex: number = 1;
  public targetLaneX: number = 0;

  // Speeds in km/h
  public speedKmh: number = 60;
  public lengthMeters: number = 4.2;

  // Near miss detection state
  public nearMissTriggered: boolean = false;

  private wheels: THREE.Mesh[] = [];
  private bodyMesh!: THREE.Mesh;
  private subGroup: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();
    this.subGroup = new THREE.Group();
    this.mesh.add(this.subGroup);
    this.buildModel('sedan', 0xe63946);
    this.updateBoundingBox();
  }

  spawn(type: VehicleType, laneIndex: number, laneX: number, startZ: number, speedKmh: number): void {
    this.type = type;
    this.laneIndex = laneIndex;
    this.targetLaneX = laneX;
    this.speedKmh = speedKmh;
    this.nearMissTriggered = false;

    const randomColor = VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];
    this.buildModel(type, randomColor);

    this.mesh.position.set(laneX, 0, startZ);
    this.mesh.visible = true;
    this.updateBoundingBox();
  }

  private buildModel(type: VehicleType, colorHex: number): void {
    // Clear existing subGroup children
    while (this.subGroup.children.length > 0) {
      this.subGroup.remove(this.subGroup.children[0]);
    }
    this.wheels = [];

    const paintMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.2,  // Reduced from 0.6 — car colors visible without env map
      roughness: 0.45,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e2840,
      metalness: 0.1,  // Reduced from 0.8 — not pitch black
      roughness: 0.3,
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,  // Slightly lighter rubber
      roughness: 0.9,
      metalness: 0.0,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xbbbbbb,
      metalness: 0.3,  // Reduced from 0.8
      roughness: 0.4,
    });

    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2.0,  // Much more visible taillights
      roughness: 0.0,
      metalness: 0.0,
    });

    const headLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.0,  // Bright headlights
      roughness: 0.0,
      metalness: 0.0,
    });

    let width = 1.9;
    let height = 0.6;
    let length = 4.2;
    let cabinHeight = 0.55;
    let cabinLength = 2.2;
    let cabinOffsetZ = -0.1;

    switch (type) {
      case 'sports':
        width = 1.85;
        height = 0.5;
        length = 4.3;
        cabinHeight = 0.45;
        cabinLength = 1.9;
        break;
      case 'suv':
        width = 2.05;
        height = 0.75;
        length = 4.6;
        cabinHeight = 0.75;
        cabinLength = 2.8;
        cabinOffsetZ = 0.2;
        break;
      case 'van':
        width = 2.1;
        height = 1.1;
        length = 5.2;
        cabinHeight = 0.9;
        cabinLength = 4.0;
        cabinOffsetZ = 0.1;
        break;
      case 'truck':
        width = 2.4;
        height = 0.8;
        length = 7.5;
        cabinHeight = 1.8;
        cabinLength = 5.0;
        cabinOffsetZ = 0.8;
        break;
      case 'bus':
        width = 2.5;
        height = 1.4;
        length = 9.0;
        cabinHeight = 1.2;
        cabinLength = 8.2;
        cabinOffsetZ = 0;
        break;
      case 'sedan':
      default:
        break;
    }

    this.lengthMeters = length;

    // 1. Lower Body Chassis
    const bodyGeom = new THREE.BoxGeometry(width, height, length);
    this.bodyMesh = new THREE.Mesh(bodyGeom, paintMat);
    this.bodyMesh.position.y = height / 2 + 0.35;
    this.bodyMesh.castShadow = true;
    this.subGroup.add(this.bodyMesh);

    // 2. Cabin / Cargo Box
    if (type === 'truck') {
      // Driver cab in front
      const cabGeom = new THREE.BoxGeometry(width * 0.95, 1.4, 2.0);
      const cab = new THREE.Mesh(cabGeom, paintMat);
      cab.position.set(0, 1.1, -2.4);
      cab.castShadow = true;
      this.subGroup.add(cab);

      // Cargo box in back — light grey, slightly emissive so it's visible
      const cargoMat = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        roughness: 0.6,
        metalness: 0.0,
      });
      const boxGeom = new THREE.BoxGeometry(width * 1.05, 2.4, 5.0);
      const box = new THREE.Mesh(boxGeom, cargoMat);
      box.position.set(0, 1.65, 0.9);
      box.castShadow = true;
      this.subGroup.add(box);
    } else {
      const cabinGeom = new THREE.BoxGeometry(width * 0.88, cabinHeight, cabinLength);
      const cabin = new THREE.Mesh(cabinGeom, glassMat);
      cabin.position.set(0, height + cabinHeight / 2 + 0.33, cabinOffsetZ);
      cabin.castShadow = true;
      this.subGroup.add(cabin);
    }

    // 3. Headlights & Taillights
    const lightW = width * 0.2;
    [-width * 0.35, width * 0.35].forEach(x => {
      // Front headlights
      const hl = new THREE.Mesh(new THREE.BoxGeometry(lightW, 0.12, 0.08), headLightMat);
      hl.position.set(x, 0.6, -length / 2 - 0.02);
      this.subGroup.add(hl);

      // Rear taillights
      const tl = new THREE.Mesh(new THREE.BoxGeometry(lightW, 0.12, 0.08), tailLightMat);
      tl.position.set(x, 0.65, length / 2 + 0.02);
      this.subGroup.add(tl);
    });

    // 4. Wheels
    const wheelRadius = type === 'truck' || type === 'bus' ? 0.45 : 0.35;
    const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.28, 12);
    wheelGeom.rotateZ(Math.PI / 2);
    const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, 0.3, 8);
    rimGeom.rotateZ(Math.PI / 2);

    const wheelOffsetZ = length * 0.32;
    const wheelPositions = [
      [-width / 2 - 0.04, wheelRadius, -wheelOffsetZ],
      [width / 2 + 0.04, wheelRadius, -wheelOffsetZ],
      [-width / 2 - 0.04, wheelRadius, wheelOffsetZ],
      [width / 2 + 0.04, wheelRadius, wheelOffsetZ],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeom, tireMat);
      tire.castShadow = true;
      wGroup.add(tire);
      const rim = new THREE.Mesh(rimGeom, rimMat);
      wGroup.add(rim);

      wGroup.position.set(wx, wy, wz);
      this.subGroup.add(wGroup);
      this.wheels.push(tire);
    });
  }

  update(delta: number, playerSpeedKmh: number): void {
    if (!this.mesh.visible) return;

    // Relative forward movement towards player (player at z=0)
    // relative speed = (playerSpeed - trafficSpeed)
    const relativeSpeedMps = (playerSpeedKmh - this.speedKmh) / 3.6;
    this.mesh.position.z += relativeSpeedMps * delta;

    // Smooth lane alignment if lane changed
    this.mesh.position.x += (this.targetLaneX - this.mesh.position.x) * Math.min(delta * 6, 1);

    // Rotate wheels based on actual car speed
    const wheelAngularSpeed = (this.speedKmh / 3.6) / 0.38;
    this.wheels.forEach(w => {
      w.rotation.x += wheelAngularSpeed * delta;
    });

    this.updateBoundingBox();
  }

  updateBoundingBox(): void {
    const width = this.type === 'truck' || this.type === 'bus' ? 2.5 : 2.0;
    const height = this.type === 'truck' || this.type === 'bus' ? 2.5 : 1.5;
    this.boundingBox.setFromCenterAndSize(
      new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + height / 2, this.mesh.position.z),
      new THREE.Vector3(width * 0.9, height, this.lengthMeters * 0.95)
    );
  }

  reset(): void {
    this.mesh.visible = false;
    this.nearMissTriggered = false;
  }
}
