import * as THREE from 'three';

export class Coin {
  public mesh: THREE.Group;
  public boundingBox: THREE.Box3 = new THREE.Box3();
  public collected: boolean = false;
  public laneIndex: number = 1;

  private coinMesh: THREE.Mesh;
  private static sharedGeometry: THREE.CylinderGeometry | null = null;
  private static sharedMaterial: THREE.MeshStandardMaterial | null = null;

  constructor() {
    this.mesh = new THREE.Group();

    if (!Coin.sharedGeometry) {
      Coin.sharedGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16);
      Coin.sharedGeometry.rotateX(Math.PI / 2);
    }

    if (!Coin.sharedMaterial) {
      Coin.sharedMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x664400,
        emissiveIntensity: 0.4,
      });
    }

    this.coinMesh = new THREE.Mesh(Coin.sharedGeometry, Coin.sharedMaterial);
    this.coinMesh.castShadow = true;
    this.mesh.add(this.coinMesh);

    // Inner relief detail
    const innerGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.14, 8);
    innerGeom.rotateX(Math.PI / 2);
    const innerMesh = new THREE.Mesh(innerGeom, Coin.sharedMaterial);
    this.mesh.add(innerMesh);

    this.updateBoundingBox();
  }

  spawn(x: number, y: number, z: number, laneIndex: number): void {
    this.mesh.position.set(x, y, z);
    this.laneIndex = laneIndex;
    this.collected = false;
    this.mesh.visible = true;
    this.coinMesh.scale.set(1, 1, 1);
    this.updateBoundingBox();
  }

  update(delta: number, worldMoveZ: number): void {
    if (!this.mesh.visible) return;

    // Move forward along with world
    this.mesh.position.z += worldMoveZ;

    // Rotate and hover
    this.coinMesh.rotation.y += delta * 4.0;
    this.coinMesh.position.y = 0.8 + Math.sin(this.mesh.position.z * 0.2) * 0.15;

    this.updateBoundingBox();
  }

  updateBoundingBox(): void {
    this.boundingBox.setFromCenterAndSize(
      this.mesh.position,
      new THREE.Vector3(1.2, 1.2, 1.2)
    );
  }

  reset(): void {
    this.mesh.visible = false;
    this.collected = false;
  }
}
