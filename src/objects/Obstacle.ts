import * as THREE from 'three';

export type ObstacleType = 'cone' | 'barrier';

export class Obstacle {
  public mesh: THREE.Group;
  public boundingBox: THREE.Box3 = new THREE.Box3();
  public type: ObstacleType = 'cone';
  public laneIndex: number = 1;

  private coneGroup: THREE.Group;
  private barrierGroup: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();

    // 1. Cone model
    this.coneGroup = new THREE.Group();
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      roughness: 0.4,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
    });

    const baseGeom = new THREE.BoxGeometry(0.7, 0.08, 0.7);
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.04;
    this.coneGroup.add(base);

    const coneGeom = new THREE.ConeGeometry(0.28, 0.95, 10);
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.y = 0.5;
    cone.castShadow = true;
    this.coneGroup.add(cone);

    const bandGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 10);
    const band = new THREE.Mesh(bandGeom, stripeMat);
    band.position.y = 0.5;
    this.coneGroup.add(band);

    this.mesh.add(this.coneGroup);

    // 2. Barrier model (Road Construction Barricade)
    this.barrierGroup = new THREE.Group();
    const legsMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.8,
      roughness: 0.3,
    });
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xff9900,
      roughness: 0.4,
    });

    // A-frame legs
    [-0.9, 0.9].forEach(x => {
      const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
      const leg = new THREE.Mesh(legGeom, legsMat);
      leg.position.set(x, 0.6, 0);
      leg.castShadow = true;
      this.barrierGroup.add(leg);
    });

    // Top horizontal warning plank
    const boardGeom = new THREE.BoxGeometry(2.1, 0.35, 0.08);
    const board = new THREE.Mesh(boardGeom, boardMat);
    board.position.set(0, 0.85, 0);
    board.castShadow = true;
    this.barrierGroup.add(board);

    // Lower warning plank
    const board2 = new THREE.Mesh(boardGeom, boardMat);
    board2.position.set(0, 0.4, 0);
    this.barrierGroup.add(board2);

    this.mesh.add(this.barrierGroup);
    this.barrierGroup.visible = false;

    this.updateBoundingBox();
  }

  spawn(type: ObstacleType, x: number, z: number, laneIndex: number): void {
    this.type = type;
    this.laneIndex = laneIndex;
    this.mesh.position.set(x, 0, z);

    if (type === 'cone') {
      this.coneGroup.visible = true;
      this.barrierGroup.visible = false;
    } else {
      this.coneGroup.visible = false;
      this.barrierGroup.visible = true;
    }

    this.mesh.visible = true;
    this.updateBoundingBox();
  }

  update(_delta: number, worldMoveZ: number): void {
    if (!this.mesh.visible) return;
    this.mesh.position.z += worldMoveZ;
    this.updateBoundingBox();
  }

  updateBoundingBox(): void {
    const size = this.type === 'cone'
      ? new THREE.Vector3(0.9, 1.1, 0.9)
      : new THREE.Vector3(2.2, 1.3, 0.8);
    this.boundingBox.setFromCenterAndSize(
      new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + size.y / 2, this.mesh.position.z),
      size
    );
  }

  reset(): void {
    this.mesh.visible = false;
  }
}
