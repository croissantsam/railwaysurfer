import { PlayerCar } from '../player/PlayerCar';
import { TrafficVehicle } from '../traffic/TrafficVehicle';
import { Obstacle } from '../objects/Obstacle';
import { Coin } from '../objects/Coin';

export interface CollisionResult {
  crashed: boolean;
  crashEntity?: TrafficVehicle | Obstacle;
  coinsCollected: Coin[];
  nearMissVehicle?: TrafficVehicle;
}

export class CollisionSystem {
  public godMode: boolean = false;

  checkCollisions(
    player: PlayerCar,
    vehicles: TrafficVehicle[],
    obstacles: Obstacle[],
    coins: Coin[]
  ): CollisionResult {
    const result: CollisionResult = {
      crashed: false,
      coinsCollected: [],
    };

    const playerBox = player.boundingBox;
    const playerZ = player.mesh.position.z;
    const playerX = player.mesh.position.x;

    // 1. Check traffic vehicles (only nearby vehicles within 12m)
    for (const v of vehicles) {
      const distZ = Math.abs(v.mesh.position.z - playerZ);
      if (distZ > 12) continue;

      // Crash test (if bounding boxes intersect and player is not invulnerable)
      if (!this.godMode && !player.isInvulnerable && playerBox.intersectsBox(v.boundingBox)) {
        result.crashed = true;
        result.crashEntity = v;
        return result;
      }

      // Near-Miss test:
      // Condition: Passing within close lateral distance (between 1.7m and 2.8m in X)
      // and close longitudinal alignment (|distZ| < 2.5m)
      if (!v.nearMissTriggered && distZ < 2.5) {
        const distX = Math.abs(v.mesh.position.x - playerX);
        // Adjacent lane or close edge pass
        if (distX > 1.8 && distX < 3.2) {
          v.nearMissTriggered = true;
          result.nearMissVehicle = v;
        }
      }
    }

    // 2. Check obstacles (only nearby within 8m)
    for (const obs of obstacles) {
      if (Math.abs(obs.mesh.position.z - playerZ) > 8) continue;

      if (!this.godMode && !player.isInvulnerable && playerBox.intersectsBox(obs.boundingBox)) {
        result.crashed = true;
        result.crashEntity = obs;
        return result;
      }
    }

    // 3. Check coin pickups (only nearby within 6m)
    for (const c of coins) {
      if (c.collected) continue;
      if (Math.abs(c.mesh.position.z - playerZ) > 5) continue;

      if (playerBox.intersectsBox(c.boundingBox)) {
        c.collected = true;
        result.coinsCollected.push(c);
      }
    }

    return result;
  }
}
