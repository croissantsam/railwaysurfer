import * as THREE from 'three';
import { GameScene } from '../rendering/Scene';
import { HighwaySegment } from '../highway/HighwaySegment';

export interface EnvironmentTheme {
  name: string;
  skyColor: number;
  fogNear: number;
  fogFar: number;
  sunColor: number;
  sunIntensity: number;
  ambientColor: number;
  groundColor: number;
  primaryDecorColor: number;
}

export const ENVIRONMENTS: EnvironmentTheme[] = [
  {
    name: 'NEON CITY',
    skyColor: 0x111a2f,   // Slightly lighter night sky
    fogNear: 60,
    fogFar: 240,
    sunColor: 0x00d4ff,
    sunIntensity: 1.2,
    ambientColor: 0x3344aa, // Brighter blue ambient
    groundColor: 0x1a2035, // Noticeably lighter ground
    primaryDecorColor: 0x1e2840,
  },
  {
    name: 'SUNSET HIGHWAY',
    skyColor: 0x6b2a40,   // Richer sunset purple-red
    fogNear: 50,
    fogFar: 220,
    sunColor: 0xff8855,
    sunIntensity: 1.8,
    ambientColor: 0x884455, // Much brighter warm ambient
    groundColor: 0x3a2028, // Lighter reddish dirt
    primaryDecorColor: 0x3d1f2a,
  },
  {
    name: 'COASTAL DRIVE',
    skyColor: 0x2a88cc,   // Vibrant day-blue sky
    fogNear: 65,
    fogFar: 280,
    sunColor: 0xfff8e0,
    sunIntensity: 2.0,
    ambientColor: 0x66aacc, // Bright coastal blue ambient
    groundColor: 0x1e5033, // Green coastal grass
    primaryDecorColor: 0x205f80,
  },
  {
    name: 'DESERT CANYON',
    skyColor: 0xcc7744,   // Warm sandy orange sky
    fogNear: 50,
    fogFar: 220,
    sunColor: 0xffd488,
    sunIntensity: 1.8,
    ambientColor: 0x996633, // Strong warm ambient
    groundColor: 0x8a4a28, // Bright terracotta ground
    primaryDecorColor: 0x7a3820,
  },
];

const BIOME_SPAN_METERS = 750;
const TRANSITION_ZONE_METERS = 160;

export class EnvironmentManager {
  private gameScene: GameScene;
  private sceneryRoot: THREE.Group;

  // Parallax scenery items
  private cityBuildings: THREE.Group[] = [];
  private mountainPeaks: THREE.Mesh[] = [];
  private palmTrees: THREE.Group[] = [];
  private windTurbines: THREE.Group[] = [];
  private desertCacti: THREE.Group[] = [];
  private oceanWaterMesh: THREE.Mesh | null = null;

  // Shared materials for high performance
  private buildingMaterial: THREE.MeshStandardMaterial;
  private windowWarmMat: THREE.MeshBasicMaterial;
  private windowCyanMat: THREE.MeshBasicMaterial;
  private mountainMaterial: THREE.MeshStandardMaterial;
  private palmTrunkMat: THREE.MeshStandardMaterial;
  private palmLeavesMat: THREE.MeshStandardMaterial;
  private turbineMat: THREE.MeshStandardMaterial;
  private cactusMat: THREE.MeshStandardMaterial;

  // Working color instances to avoid allocations during lerp
  private tempSkyCol = new THREE.Color();
  private tempSunCol = new THREE.Color();
  private tempAmbCol = new THREE.Color();
  private tempGroundCol = new THREE.Color();
  private tempDecorCol = new THREE.Color();
  private fromSky = new THREE.Color();
  private toSky = new THREE.Color();
  private fromSun = new THREE.Color();
  private toSun = new THREE.Color();
  private fromAmb = new THREE.Color();
  private toAmb = new THREE.Color();
  private fromGround = new THREE.Color();
  private toGround = new THREE.Color();
  private fromDecor = new THREE.Color();
  private toDecor = new THREE.Color();

  constructor(gameScene: GameScene) {
    this.gameScene = gameScene;
    this.sceneryRoot = new THREE.Group();
    this.gameScene.scene.add(this.sceneryRoot);

    // Initialize optimized shared materials
    // Low metalness to avoid black appearance without an environment map
    this.buildingMaterial = new THREE.MeshStandardMaterial({
      color: ENVIRONMENTS[0].primaryDecorColor,
      roughness: 0.8,
      metalness: 0.0,
    });

    this.windowWarmMat = new THREE.MeshBasicMaterial({ color: 0xffe680 });
    this.windowCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    this.mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x301a28,
      roughness: 0.9,
      flatShading: true,
    });

    this.palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.8 });
    this.palmLeavesMat = new THREE.MeshStandardMaterial({ color: 0x1f883d, roughness: 0.6 });
    this.turbineMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.4, roughness: 0.4 });
    this.cactusMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });

    this.buildCitySkyline();
    this.buildMountains();
    this.buildPalmTrees();
    this.buildWindTurbines();
    this.buildDesertRockAndCacti();
    this.buildOcean();

    // Set initial environment
    this.applyInterpolatedTheme(0, 0, 0);
  }

  // 1. Futuristic City Skyline with illuminated windows and antennas
  private buildCitySkyline(): void {
    const count = 30;
    const windowGeom = new THREE.BoxGeometry(0.8, 0.4, 0.08);

    for (let i = 0; i < count; i++) {
      const bGroup = new THREE.Group();
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (19 + Math.random() * 32);
      const z = -280 + i * 20;
      const h = 18 + Math.random() * 42;
      const w = 9 + Math.random() * 11;
      const d = 9 + Math.random() * 11;

      // Main tower body
      const mainGeom = new THREE.BoxGeometry(w, h, d);
      const mainMesh = new THREE.Mesh(mainGeom, this.buildingMaterial);
      mainMesh.position.y = h / 2;
      mainMesh.castShadow = true;
      bGroup.add(mainMesh);

      // Rooftop communications spire / antenna
      const spireH = 5 + Math.random() * 8;
      const spireGeom = new THREE.CylinderGeometry(0.12, 0.25, spireH, 6);
      const spire = new THREE.Mesh(spireGeom, this.buildingMaterial);
      spire.position.set(0, h + spireH / 2, 0);
      bGroup.add(spire);

      // Blinking red beacon on antenna top
      const beaconGeom = new THREE.SphereGeometry(0.25, 6, 6);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.set(0, h + spireH, 0);
      bGroup.add(beacon);

      // Glowing windows grid on building facades facing the road
      const numFloorRows = Math.floor(h / 3.5);
      for (let floor = 2; floor < numFloorRows; floor++) {
        const floorY = floor * 3.5;
        const mat = Math.random() > 0.4 ? this.windowWarmMat : this.windowCyanMat;
        [-w * 0.3, 0, w * 0.3].forEach(wx => {
          if (Math.random() > 0.3) {
            const win = new THREE.Mesh(windowGeom, mat);
            win.position.set(wx, floorY, side > 0 ? -d / 2 - 0.05 : d / 2 + 0.05);
            bGroup.add(win);
          }
        });
      }

      bGroup.position.set(x, 0, z);
      this.sceneryRoot.add(bGroup);
      this.cityBuildings.push(bGroup);
    }
  }

  // 2. Distant mountain peaks for Sunset and Desert
  private buildMountains(): void {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (55 + Math.random() * 45);
      const z = -280 + i * 36;
      const r = 24 + Math.random() * 28;
      const h = 35 + Math.random() * 45;

      const mGeom = new THREE.ConeGeometry(r, h, 6);
      const mesh = new THREE.Mesh(mGeom, this.mountainMaterial);
      mesh.position.set(x, h / 2, z);
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.scale.set(1 + Math.random() * 0.5, 1, 1 + Math.random() * 0.5);

      this.sceneryRoot.add(mesh);
      this.mountainPeaks.push(mesh);
    }
  }

  // 3. Coastal Palm Trees
  private buildPalmTrees(): void {
    const count = 20;
    const leafGeom = new THREE.ConeGeometry(1.6, 3.2, 5);
    leafGeom.rotateX(Math.PI / 2.5);

    for (let i = 0; i < count; i++) {
      const tree = new THREE.Group();
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (10 + Math.random() * 14);
      const z = -260 + i * 26;

      // Curved Trunk
      const trunkH = 6 + Math.random() * 3;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, trunkH, 6),
        this.palmTrunkMat
      );
      trunk.position.set(0, trunkH / 2, 0);
      trunk.rotation.z = side * 0.12;
      tree.add(trunk);

      // Palm Crown Leaves (5 fan leaves)
      const crown = new THREE.Group();
      crown.position.set(0, trunkH, 0);
      for (let j = 0; j < 6; j++) {
        const leaf = new THREE.Mesh(leafGeom, this.palmLeavesMat);
        leaf.rotation.y = (j / 6) * Math.PI * 2;
        crown.add(leaf);
      }
      tree.add(crown);

      tree.position.set(x, 0, z);
      tree.visible = false; // Initially hidden until Coastal
      this.sceneryRoot.add(tree);
      this.palmTrees.push(tree);
    }
  }

  // 4. Wind Turbines (for Sunset and Desert plains)
  private buildWindTurbines(): void {
    const count = 10;
    const bladeGeom = new THREE.BoxGeometry(0.3, 7.5, 0.08);

    for (let i = 0; i < count; i++) {
      const turbine = new THREE.Group();
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (32 + Math.random() * 20);
      const z = -280 + i * 55;
      const poleH = 22 + Math.random() * 6;

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.7, poleH, 8),
        this.turbineMat
      );
      pole.position.y = poleH / 2;
      turbine.add(pole);

      const nacelle = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 2.2),
        this.turbineMat
      );
      nacelle.position.set(0, poleH, 0);
      turbine.add(nacelle);

      const rotor = new THREE.Group();
      rotor.position.set(0, poleH, 1.2);
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(bladeGeom, this.turbineMat);
        blade.position.y = 3.8;
        const bladeArm = new THREE.Group();
        bladeArm.rotation.z = (b / 3) * Math.PI * 2;
        bladeArm.add(blade);
        rotor.add(bladeArm);
      }
      turbine.add(rotor);
      (turbine as unknown as { rotorGroup: THREE.Group }).rotorGroup = rotor;

      turbine.position.set(x, 0, z);
      turbine.visible = false;
      this.sceneryRoot.add(turbine);
      this.windTurbines.push(turbine);
    }
  }

  // 5. Desert Saguaro Cacti & Red Rock formations
  private buildDesertRockAndCacti(): void {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const cactus = new THREE.Group();
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (9 + Math.random() * 12);
      const z = -270 + i * 32;

      const stemH = 3.5 + Math.random() * 2;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, stemH, 8),
        this.cactusMat
      );
      stem.position.y = stemH / 2;
      cactus.add(stem);

      [-1, 1].forEach((armSide, idx) => {
        const armH = 1.8;
        const armV = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, armH, 6),
          this.cactusMat
        );
        armV.position.set(armSide * 0.8, stemH * 0.6 + idx * 0.4, 0);
        cactus.add(armV);

        const armHori = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6),
          this.cactusMat
        );
        armHori.rotation.z = Math.PI / 2;
        armHori.position.set(armSide * 0.4, stemH * 0.5 + idx * 0.4, 0);
        cactus.add(armHori);
      });

      cactus.position.set(x, 0, z);
      cactus.visible = false;
      this.sceneryRoot.add(cactus);
      this.desertCacti.push(cactus);
    }
  }

  // 6. Ocean water plane along coast
  private buildOcean(): void {
    const oceanGeom = new THREE.PlaneGeometry(160, 360);
    oceanGeom.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0f4c81,
      roughness: 0.15,
      metalness: 0.85,
    });
    this.oceanWaterMesh = new THREE.Mesh(oceanGeom, oceanMat);
    this.oceanWaterMesh.position.set(110, -0.6, -100);
    this.oceanWaterMesh.visible = false;
    this.sceneryRoot.add(this.oceanWaterMesh);
  }

  update(delta: number, worldMoveZ: number, distanceTraveledMeters: number): string {
    const totalBiomes = ENVIRONMENTS.length;
    const currentBiomeIdx = Math.floor(distanceTraveledMeters / BIOME_SPAN_METERS) % totalBiomes;
    const nextBiomeIdx = (currentBiomeIdx + 1) % totalBiomes;

    // Calculate progress within current biome block
    const localDistance = distanceTraveledMeters % BIOME_SPAN_METERS;
    const transitionStart = BIOME_SPAN_METERS - TRANSITION_ZONE_METERS;

    let blendT = 0;
    if (localDistance > transitionStart) {
      const rawT = (localDistance - transitionStart) / TRANSITION_ZONE_METERS;
      // Smooth cubic ease-in-out S-curve for ultra-natural color blending
      blendT = rawT * rawT * (3 - 2 * rawT);
    }

    // Apply seamless color & fog interpolation
    this.applyInterpolatedTheme(currentBiomeIdx, nextBiomeIdx, blendT);

    // Determine which biomes are relevant right now
    const currentName = ENVIRONMENTS[currentBiomeIdx].name;
    const nextName = ENVIRONMENTS[nextBiomeIdx].name;

    const showCity = (currentName === 'NEON CITY' || currentName === 'SUNSET HIGHWAY') ||
      (blendT > 0.1 && (nextName === 'NEON CITY' || nextName === 'SUNSET HIGHWAY'));

    const showMountains = (currentName === 'SUNSET HIGHWAY' || currentName === 'DESERT CANYON') ||
      (blendT > 0.1 && (nextName === 'SUNSET HIGHWAY' || nextName === 'DESERT CANYON'));

    const showPalms = (currentName === 'COASTAL DRIVE') ||
      (blendT > 0.1 && nextName === 'COASTAL DRIVE');

    const showTurbines = (currentName === 'SUNSET HIGHWAY' || currentName === 'DESERT CANYON') ||
      (blendT > 0.1 && (nextName === 'SUNSET HIGHWAY' || nextName === 'DESERT CANYON'));

    const showCacti = (currentName === 'DESERT CANYON') ||
      (blendT > 0.1 && nextName === 'DESERT CANYON');

    const showOcean = (currentName === 'COASTAL DRIVE') ||
      (blendT > 0.05 && nextName === 'COASTAL DRIVE');

    // 1. Parallax movement & Fog-based Natural Recycling for Buildings
    const parallaxCityZ = worldMoveZ * 0.72;
    for (const b of this.cityBuildings) {
      b.position.z += parallaxCityZ;
      if (b.position.z > 40) {
        b.position.z -= 30 * 20;
        // Only appear at front if city is active/approaching
        b.visible = showCity;
      }
    }

    // 2. Mountains (far horizon)
    const parallaxMtnZ = worldMoveZ * 0.45;
    for (const m of this.mountainPeaks) {
      m.position.z += parallaxMtnZ;
      if (m.position.z > 40) {
        m.position.z -= 16 * 36;
        m.visible = showMountains;
      }
    }

    // 3. Palm trees
    const parallaxTreeZ = worldMoveZ * 0.9;
    for (const t of this.palmTrees) {
      t.position.z += parallaxTreeZ;
      if (t.position.z > 30) {
        t.position.z -= 20 * 26;
        t.visible = showPalms;
      }
    }

    // 4. Wind Turbines
    const parallaxTurbineZ = worldMoveZ * 0.6;
    for (const tu of this.windTurbines) {
      tu.position.z += parallaxTurbineZ;
      if (tu.position.z > 40) {
        tu.position.z -= 10 * 55;
        tu.visible = showTurbines;
      }
      const rotor = (tu as unknown as { rotorGroup?: THREE.Group }).rotorGroup;
      if (rotor) {
        rotor.rotation.z += delta * 1.5;
      }
    }

    // 5. Desert Cacti
    for (const c of this.desertCacti) {
      c.position.z += parallaxTreeZ;
      if (c.position.z > 30) {
        c.position.z -= 16 * 32;
        c.visible = showCacti;
      }
    }

    // 6. Ocean Water smooth transition
    if (this.oceanWaterMesh) {
      this.oceanWaterMesh.visible = showOcean;
      if (showOcean) {
        const targetX = (currentName === 'COASTAL DRIVE') ? 100 : 160;
        this.oceanWaterMesh.position.x += (targetX - this.oceanWaterMesh.position.x) * Math.min(delta * 2, 1);
      }
    }

    // Return the dominant biome name for the HUD badge
    return blendT >= 0.5 ? ENVIRONMENTS[nextBiomeIdx].name : ENVIRONMENTS[currentBiomeIdx].name;
  }

  private applyInterpolatedTheme(fromIdx: number, toIdx: number, t: number): void {
    const envA = ENVIRONMENTS[fromIdx];
    const envB = ENVIRONMENTS[toIdx];

    this.fromSky.setHex(envA.skyColor);
    this.toSky.setHex(envB.skyColor);
    this.tempSkyCol.copy(this.fromSky).lerp(this.toSky, t);

    this.fromSun.setHex(envA.sunColor);
    this.toSun.setHex(envB.sunColor);
    this.tempSunCol.copy(this.fromSun).lerp(this.toSun, t);

    this.fromAmb.setHex(envA.ambientColor);
    this.toAmb.setHex(envB.ambientColor);
    this.tempAmbCol.copy(this.fromAmb).lerp(this.toAmb, t);

    this.fromGround.setHex(envA.groundColor);
    this.toGround.setHex(envB.groundColor);
    this.tempGroundCol.copy(this.fromGround).lerp(this.toGround, t);

    this.fromDecor.setHex(envA.primaryDecorColor);
    this.toDecor.setHex(envB.primaryDecorColor);
    this.tempDecorCol.copy(this.fromDecor).lerp(this.toDecor, t);

    const fogNear = envA.fogNear + (envB.fogNear - envA.fogNear) * t;
    const fogFar = envA.fogFar + (envB.fogFar - envA.fogFar) * t;
    const sunIntensity = envA.sunIntensity + (envB.sunIntensity - envA.sunIntensity) * t;

    // Apply smoothly to Scene
    this.gameScene.setThemeColorsInterpolated(
      this.tempSkyCol,
      fogNear,
      fogFar,
      this.tempSunCol,
      sunIntensity,
      this.tempAmbCol
    );

    // Apply smoothly to Materials
    this.buildingMaterial.color.copy(this.tempDecorCol);
    this.mountainMaterial.color.copy(this.tempDecorCol);

    if (HighwaySegment.groundMaterial) {
      HighwaySegment.groundMaterial.color.copy(this.tempGroundCol);
    }
  }

  reset(): void {
    this.applyInterpolatedTheme(0, 0, 0);

    // Reset initial visibilities
    this.cityBuildings.forEach(b => (b.visible = true));
    this.mountainPeaks.forEach(m => (m.visible = false));
    this.palmTrees.forEach(p => (p.visible = false));
    this.windTurbines.forEach(w => (w.visible = false));
    this.desertCacti.forEach(c => (c.visible = false));
    if (this.oceanWaterMesh) {
      this.oceanWaterMesh.visible = false;
    }
  }
}
