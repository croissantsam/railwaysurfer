import * as THREE from 'three';
import { HighwaySegment, SEGMENT_LENGTH } from './HighwaySegment';
import { HighwayGenerator, SpawnItem } from './HighwayGenerator';
import { ObjectPool } from '../objects/ObjectPool';
import { TrafficVehicle, VehicleType } from '../traffic/TrafficVehicle';
import { Coin } from '../objects/Coin';
import { Obstacle, ObstacleType } from '../objects/Obstacle';
import { LANES } from '../player/PlayerCar';

export class Highway {
  public scene: THREE.Scene;
  private segments: HighwaySegment[] = [];
  private generator: HighwayGenerator;

  // Pools
  public trafficPool: ObjectPool<TrafficVehicle>;
  public coinPool: ObjectPool<Coin>;
  public obstaclePool: ObjectPool<Obstacle>;

  // Active items
  public activeVehicles: TrafficVehicle[] = [];
  public activeCoins: Coin[] = [];
  public activeObstacles: Obstacle[] = [];

  // World bounds (8 segments = 320m forward road buffer for 4x speed)
  private readonly NUM_SEGMENTS = 8;
  private readonly RECYCLE_Z = 30; // Behind player

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generator = new HighwayGenerator();

    // Initialize Pools
    this.trafficPool = new ObjectPool<TrafficVehicle>(
      () => {
        const v = new TrafficVehicle();
        this.scene.add(v.mesh);
        v.mesh.visible = false;
        return v;
      },
      (v) => v.reset(),
      12
    );

    this.coinPool = new ObjectPool<Coin>(
      () => {
        const c = new Coin();
        this.scene.add(c.mesh);
        c.mesh.visible = false;
        return c;
      },
      (c) => c.reset(),
      25
    );

    this.obstaclePool = new ObjectPool<Obstacle>(
      () => {
        const o = new Obstacle();
        this.scene.add(o.mesh);
        o.mesh.visible = false;
        return o;
      },
      (o) => o.reset(),
      10
    );

    this.initSegments();
  }

  private initSegments(): void {
    // Spawn initial segments from Z = 20 down to Z = -220
    for (let i = 0; i < this.NUM_SEGMENTS; i++) {
      const seg = new HighwaySegment(i);
      const z = 20 - i * SEGMENT_LENGTH;
      seg.setZ(z);
      this.scene.add(seg.mesh);
      this.segments.push(seg);

      // Only spawn items on segments ahead of player (i >= 2)
      if (i >= 2) {
        this.populateSegment(z, 0);
      }
    }
  }

  private populateSegment(segmentZ: number, difficultyFactor: number): void {
    const items = this.generator.generateSegment(difficultyFactor);

    items.forEach((item: SpawnItem) => {
      const laneX = LANES[item.laneIndex];
      const spawnZ = segmentZ + item.zOffset;

      if (item.kind === 'vehicle') {
        const vehicle = this.trafficPool.acquire();
        vehicle.spawn(
          item.typeVariant as VehicleType,
          item.laneIndex,
          laneX,
          spawnZ,
          item.speedKmh || 60
        );
        this.activeVehicles.push(vehicle);
      } else if (item.kind === 'obstacle') {
        const obstacle = this.obstaclePool.acquire();
        obstacle.spawn(item.typeVariant as ObstacleType, laneX, spawnZ, item.laneIndex);
        this.activeObstacles.push(obstacle);
      } else if (item.kind === 'coin') {
        const coin = this.coinPool.acquire();
        coin.spawn(laneX, 0.8, spawnZ, item.laneIndex);
        this.activeCoins.push(coin);
      }
    });
  }

  update(delta: number, playerSpeedKmh: number, difficultyFactor: number): void {
    const worldMoveZ = (playerSpeedKmh / 3.6) * delta;

    // 1. Move and recycle highway segments
    for (const seg of this.segments) {
      seg.setZ(seg.getZ() + worldMoveZ);

      if (seg.getZ() > this.RECYCLE_Z) {
        // Find furthest segment in front (lowest Z)
        let minZ = 0;
        for (const s of this.segments) {
          if (s.getZ() < minZ) minZ = s.getZ();
        }

        const newZ = minZ - SEGMENT_LENGTH;
        seg.setZ(newZ);
        this.populateSegment(newZ, difficultyFactor);
      }
    }

    // 2. Update traffic vehicles
    for (let i = this.activeVehicles.length - 1; i >= 0; i--) {
      const v = this.activeVehicles[i];
      v.update(delta, playerSpeedKmh);

      // Despawn if passed behind player or too far ahead
      if (v.mesh.position.z > 25 || v.mesh.position.z < -340) {
        this.trafficPool.release(v);
        this.activeVehicles.splice(i, 1);
      }
    }

    // 3. Update obstacles
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const o = this.activeObstacles[i];
      o.update(delta, worldMoveZ);

      if (o.mesh.position.z > 25) {
        this.obstaclePool.release(o);
        this.activeObstacles.splice(i, 1);
      }
    }

    // 4. Update coins
    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const c = this.activeCoins[i];
      c.update(delta, worldMoveZ);

      if (c.mesh.position.z > 25 || c.collected) {
        this.coinPool.release(c);
        this.activeCoins.splice(i, 1);
      }
    }
  }

  reset(): void {
    // Release all active entities
    while (this.activeVehicles.length > 0) {
      this.trafficPool.release(this.activeVehicles.pop()!);
    }
    while (this.activeObstacles.length > 0) {
      this.obstaclePool.release(this.activeObstacles.pop()!);
    }
    while (this.activeCoins.length > 0) {
      this.coinPool.release(this.activeCoins.pop()!);
    }

    // Reset segments
    for (let i = 0; i < this.segments.length; i++) {
      const z = 20 - i * SEGMENT_LENGTH;
      this.segments[i].setZ(z);
      if (i >= 2) {
        this.populateSegment(z, 0);
      }
    }
  }

  getActiveSegmentCount(): number {
    return this.segments.length;
  }
}
