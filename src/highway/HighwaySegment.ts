import * as THREE from 'three';

export const SEGMENT_LENGTH = 40; // 40 meters per segment
export const ROAD_WIDTH = 13.5;   // 3 lanes * 3.5m + shoulders

export class HighwaySegment {
  public mesh: THREE.Group;
  public length: number = SEGMENT_LENGTH;

  private static roadMaterial: THREE.MeshStandardMaterial | null = null;
  private static lineMaterial: THREE.MeshBasicMaterial | null = null;
  private static guardrailMaterial: THREE.MeshStandardMaterial | null = null;
  private static poleMaterial: THREE.MeshStandardMaterial | null = null;
  private static gantryMaterial: THREE.MeshStandardMaterial | null = null;
  private static signMaterial: THREE.MeshStandardMaterial | null = null;
  public static groundMaterial: THREE.MeshStandardMaterial | null = null;

  constructor(segmentIndex: number = 0) {
    this.mesh = new THREE.Group();
    this.buildSegment(segmentIndex);
  }

  private buildSegment(segmentIndex: number): void {
    if (!HighwaySegment.roadMaterial) {
      // Slightly lighter asphalt — visible under all lighting conditions
      HighwaySegment.roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c3040,
        roughness: 0.85,
        metalness: 0.0, // No metalness without envmap → avoids black look
      });

      HighwaySegment.lineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });

      // Guardrail: lighter grey, low metalness so ambient light shows it
      HighwaySegment.guardrailMaterial = new THREE.MeshStandardMaterial({
        color: 0x9aabbc,
        metalness: 0.2,
        roughness: 0.5,
      });

      // Pole: medium slate, readable under ambient light
      HighwaySegment.poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        metalness: 0.2,
        roughness: 0.6,
      });

      // Gantry: visible blue-grey
      HighwaySegment.gantryMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a6878,
        metalness: 0.2,
        roughness: 0.5,
      });

      HighwaySegment.signMaterial = new THREE.MeshStandardMaterial({
        color: 0x00aa44, // Brighter highway green
        roughness: 0.4,
        metalness: 0.0,
        emissive: 0x005522,
        emissiveIntensity: 0.6,
      });

      // Ground: noticeably lighter than the road, visible terrain
      HighwaySegment.groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x252a3a,
        roughness: 0.95,
        metalness: 0.0,
      });
    }

    // 1. Road Surface Plane
    const roadGeom = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
    roadGeom.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeom, HighwaySegment.roadMaterial);
    roadMesh.receiveShadow = true;
    this.mesh.add(roadMesh);

    // Ground terrain beside the road (Left & Right terrain strips, each 45m wide)
    const groundGeom = new THREE.PlaneGeometry(50, SEGMENT_LENGTH);
    groundGeom.rotateX(-Math.PI / 2);

    const leftGround = new THREE.Mesh(groundGeom, HighwaySegment.groundMaterial!);
    leftGround.position.set(-31.75, -0.05, 0);
    leftGround.receiveShadow = true;
    this.mesh.add(leftGround);

    const rightGround = new THREE.Mesh(groundGeom, HighwaySegment.groundMaterial!);
    rightGround.position.set(31.75, -0.05, 0);
    rightGround.receiveShadow = true;
    this.mesh.add(rightGround);

    // 2. Dashed Lane Markings (Lanes dividers at X = -1.75 and X = 1.75)
    const dashLength = 4.0;
    const dashWidth = 0.22;
    const dashGeom = new THREE.PlaneGeometry(dashWidth, dashLength);
    dashGeom.rotateX(-Math.PI / 2);

    const laneDividersX = [-1.75, 1.75];
    laneDividersX.forEach(x => {
      for (let z = -SEGMENT_LENGTH / 2 + 2; z < SEGMENT_LENGTH / 2; z += 8.0) {
        const dash = new THREE.Mesh(dashGeom, HighwaySegment.lineMaterial!);
        dash.position.set(x, 0.012, z);
        this.mesh.add(dash);
      }
    });

    // 3. Continuous Outer Shoulder Lines (Solid lines at X = -5.3 and X = 5.3)
    const sideLineGeom = new THREE.PlaneGeometry(0.28, SEGMENT_LENGTH);
    sideLineGeom.rotateX(-Math.PI / 2);
    const sideYellowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    [-5.3, 5.3].forEach(x => {
      const sideLine = new THREE.Mesh(sideLineGeom, sideYellowMat);
      sideLine.position.set(x, 0.015, 0);
      this.mesh.add(sideLine);
    });

    // 4. Guardrails on both sides (at X = -6.4 and X = 6.4)
    const railGeom = new THREE.BoxGeometry(0.2, 0.55, SEGMENT_LENGTH);
    [-6.4, 6.4].forEach(x => {
      const rail = new THREE.Mesh(railGeom, HighwaySegment.guardrailMaterial!);
      rail.position.set(x, 0.45, 0);
      rail.castShadow = true;
      this.mesh.add(rail);

      // Guardrail posts every 8m
      for (let z = -SEGMENT_LENGTH / 2 + 4; z < SEGMENT_LENGTH / 2; z += 8) {
        const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 6);
        const post = new THREE.Mesh(postGeom, HighwaySegment.guardrailMaterial!);
        post.position.set(x, 0.35, z);
        this.mesh.add(post);

        // Reflective red/white safety reflectors on guardrail posts
        const reflGeom = new THREE.BoxGeometry(0.06, 0.12, 0.06);
        const reflMat = new THREE.MeshBasicMaterial({ color: x < 0 ? 0xff3300 : 0xffffff });
        const reflector = new THREE.Mesh(reflGeom, reflMat);
        reflector.position.set(x < 0 ? x + 0.12 : x - 0.12, 0.55, z);
        this.mesh.add(reflector);
      }
    });

    // 5. Street Light on one side of segment
    const hasLight = (segmentIndex % 2) === 0;
    if (hasLight) {
      const lightSide = (segmentIndex % 4 === 0) ? -7.2 : 7.2;
      const poleGeom = new THREE.CylinderGeometry(0.12, 0.18, 7.5, 8);
      const pole = new THREE.Mesh(poleGeom, HighwaySegment.poleMaterial!);
      pole.position.set(lightSide, 3.75, 0);
      pole.castShadow = true;
      this.mesh.add(pole);

      // Curved cantilever arm reaching over highway
      const armGeom = new THREE.BoxGeometry(3.0, 0.12, 0.12);
      const arm = new THREE.Mesh(armGeom, HighwaySegment.poleMaterial!);
      arm.position.set(lightSide > 0 ? lightSide - 1.4 : lightSide + 1.4, 7.4, 0);
      this.mesh.add(arm);

      // Lamp bulb with bright emissive glow
      const bulbGeom = new THREE.BoxGeometry(0.8, 0.14, 0.35);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x00f0ff,
        emissiveIntensity: 3.5, // Boosted glow — visible in bright scene
        roughness: 0.0,
        metalness: 0.0,
      });
      const bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.set(lightSide > 0 ? lightSide - 2.5 : lightSide + 2.5, 7.3, 0);
      this.mesh.add(bulb);
    }

    // 6. Overhead Highway Gantry Sign (Every 3rd segment)
    if (segmentIndex % 3 === 1) {
      this.buildOverheadGantry();
    }

    // 7. Roadside Neon Billboard (Every 4th segment)
    if (segmentIndex % 4 === 2) {
      this.buildRoadsideBillboard(segmentIndex);
    }

    // 8. Overhead Highway Flyover Bridge (Every 7th segment)
    if (segmentIndex % 7 === 5) {
      this.buildOverpassBridge();
    }
  }

  private buildOverheadGantry(): void {
    const gantry = new THREE.Group();
    const gantryH = 6.2;
    const spanW = 14.8;

    // Dual vertical lattice support towers (Left & Right)
    const towerGeom = new THREE.BoxGeometry(0.4, gantryH, 0.4);
    [-spanW / 2, spanW / 2].forEach(x => {
      const tower = new THREE.Mesh(towerGeom, HighwaySegment.gantryMaterial!);
      tower.position.set(x, gantryH / 2, 0);
      tower.castShadow = true;
      gantry.add(tower);
    });

    // Horizontal truss across the entire 3 lanes
    const trussGeom = new THREE.BoxGeometry(spanW, 0.6, 0.5);
    const truss = new THREE.Mesh(trussGeom, HighwaySegment.gantryMaterial!);
    truss.position.set(0, gantryH, 0);
    truss.castShadow = true;
    gantry.add(truss);

    // Green highway direction sign boards
    const signGeom = new THREE.BoxGeometry(4.2, 1.6, 0.12);
    const sign1 = new THREE.Mesh(signGeom, HighwaySegment.signMaterial!);
    sign1.position.set(-2.5, gantryH - 0.2, 0.3);
    gantry.add(sign1);

    // Blue airport / route sign board
    const blueSignMat = new THREE.MeshStandardMaterial({
      color: 0x0044aa,
      roughness: 0.3,
      emissive: 0x002255,
      emissiveIntensity: 0.6,
    });
    const sign2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 0.12), blueSignMat);
    sign2.position.set(2.5, gantryH - 0.2, 0.3);
    gantry.add(sign2);

    // Warning amber beacon lights
    const amberBeaconMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 2.5,
    });
    [-4.2, 4.2].forEach(bx => {
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8), amberBeaconMat);
      beacon.position.set(bx, gantryH + 0.4, 0);
      gantry.add(beacon);
    });

    gantry.position.z = -5;
    this.mesh.add(gantry);
  }

  private buildRoadsideBillboard(seed: number): void {
    const side = (seed % 2 === 0) ? -9.5 : 9.5;
    const board = new THREE.Group();

    // Steel support column
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 8.5, 8),
      HighwaySegment.poleMaterial!
    );
    pole.position.set(side, 4.25, 0);
    pole.castShadow = true;
    board.add(pole);

    // Glowing Neon Billboard frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 3.4, 0.35),
      HighwaySegment.gantryMaterial!
    );
    frame.position.set(side, 9.5, 0);
    frame.castShadow = true;
    board.add(frame);

    // Neon Billboard screen with bright color
    const neonColors = [0x00f0ff, 0xff0077, 0xffaa00, 0x7700ff];
    const neonColor = neonColors[seed % neonColors.length];
    const screenMat = new THREE.MeshStandardMaterial({
      color: neonColor,
      emissive: neonColor,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.0, 0.1), screenMat);
    screen.position.set(side, 9.5, side > 0 ? -0.15 : 0.15);
    screen.rotation.y = side > 0 ? -0.15 : 0.15; // Angled toward player
    board.add(screen);

    this.mesh.add(board);
  }

  private buildOverpassBridge(): void {
    const bridge = new THREE.Group();
    const bridgeH = 6.8;
    const bridgeW = 34.0;
    const bridgeD = 7.0;

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x5a6070, // Lighter concrete — visible under ambient light
      roughness: 0.85,
      metalness: 0.0,
    });

    // Bridge deck spanning across highway
    const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, 1.2, bridgeD), concreteMat);
    deck.position.set(0, bridgeH, 0);
    deck.castShadow = true;
    bridge.add(deck);

    // Bridge side railings
    [-bridgeD / 2, bridgeD / 2].forEach(bz => {
      const railing = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, 0.8, 0.2), HighwaySegment.guardrailMaterial!);
      railing.position.set(0, bridgeH + 0.9, bz);
      bridge.add(railing);
    });

    // Support pillars on the sides
    [-11.5, 11.5].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, bridgeH, 12), concreteMat);
      pillar.position.set(px, bridgeH / 2, 0);
      pillar.castShadow = true;
      bridge.add(pillar);
    });

    bridge.position.z = 8;
    this.mesh.add(bridge);
  }

  setZ(z: number): void {
    this.mesh.position.z = z;
  }

  getZ(): number {
    return this.mesh.position.z;
  }

  reset(): void {
    this.mesh.visible = true;
  }
}
