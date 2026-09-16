import { SEGMENT_LENGTH } from './HighwaySegment';

export type SegmentPatternType =
  | 'straight'
  | 'coin-line'
  | 'coin-zigzag'
  | 'light-traffic'
  | 'heavy-traffic'
  | 'construction'
  | 'truck-section'
  | 'mixed';

export interface SpawnItem {
  kind: 'vehicle' | 'obstacle' | 'coin';
  laneIndex: 0 | 1 | 2;
  zOffset: number; // relative to segment center (-18 to +18)
  typeVariant: string; // vehicle type or obstacle type
  speedKmh?: number;
}

export class HighwayGenerator {
  private lastBlockedLanes: Set<number> = new Set();

  /**
   * Generates a safe, playable set of obstacles, traffic and coins for a segment.
   * Guaranteed: Never blocks all 3 lanes simultaneously.
   * Guaranteed: Adequate longitudinal clearance between alternating lane blocks.
   */
  generateSegment(difficultyFactor: number): SpawnItem[] {
    const items: SpawnItem[] = [];

    // Choose pattern based on difficulty
    const pattern = this.choosePattern(difficultyFactor);

    switch (pattern) {
      case 'straight':
        // Safe breathing room, maybe a gentle line of coins
        this.addCoinLine(items, Math.floor(Math.random() * 3) as 0 | 1 | 2, -12, 4);
        this.lastBlockedLanes.clear();
        break;

      case 'coin-line':
        {
          const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          this.addCoinLine(items, lane, -14, 6);
          this.lastBlockedLanes.clear();
        }
        break;

      case 'coin-zigzag':
        this.addCoinZigZag(items);
        this.lastBlockedLanes.clear();
        break;

      case 'light-traffic':
        {
          // Exactly one vehicle in a random lane
          const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          const vType = difficultyFactor > 0.4 && Math.random() > 0.5 ? 'suv' : 'sedan';
          const speed = 55 + Math.random() * 25 + difficultyFactor * 80;
          items.push({
            kind: 'vehicle',
            laneIndex: lane,
            zOffset: (Math.random() - 0.5) * 10,
            typeVariant: vType,
            speedKmh: speed,
          });

          // Reward player with coins in the adjacent safe lane
          const safeLane = ((lane + 1) % 3) as 0 | 1 | 2;
          this.addCoinLine(items, safeLane, -12, 3);

          this.lastBlockedLanes = new Set([lane]);
        }
        break;

      case 'construction':
        {
          // 1 or 2 obstacle barriers/cones, ensuring at least one lane is totally open
          const openLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          const blockedLanes = [0, 1, 2].filter(l => l !== openLane) as Array<0 | 1 | 2>;

          // For early difficulty, block only 1 lane. For higher difficulty, block 2 lanes but staggered longitudinally!
          if (difficultyFactor > 0.5 && Math.random() > 0.4) {
            // Staggered by 16m distance so player can easily maneuver
            items.push({
              kind: 'obstacle',
              laneIndex: blockedLanes[0],
              zOffset: -10,
              typeVariant: 'barrier',
            });
            items.push({
              kind: 'obstacle',
              laneIndex: blockedLanes[1],
              zOffset: 10,
              typeVariant: 'cone',
            });
          } else {
            // Single blocked lane
            const blocked = blockedLanes[0];
            items.push({
              kind: 'obstacle',
              laneIndex: blocked,
              zOffset: 0,
              typeVariant: Math.random() > 0.5 ? 'barrier' : 'cone',
            });
          }

          // Place coins in the clear path
          this.addCoinLine(items, openLane, -8, 4);
          this.lastBlockedLanes = new Set(blockedLanes);
        }
        break;

      case 'heavy-traffic':
        {
          // 2 vehicles staggered longitudinally, leaving guaranteed open lane
          const openLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          const blockedLanes = [0, 1, 2].filter(l => l !== openLane) as Array<0 | 1 | 2>;

          items.push({
            kind: 'vehicle',
            laneIndex: blockedLanes[0],
            zOffset: -10,
            typeVariant: 'sedan',
            speedKmh: 60 + Math.random() * 20 + difficultyFactor * 80,
          });

          items.push({
            kind: 'vehicle',
            laneIndex: blockedLanes[1],
            zOffset: 8,
            typeVariant: Math.random() > 0.5 ? 'van' : 'suv',
            speedKmh: 50 + Math.random() * 15 + difficultyFactor * 70,
          });

          // Risky coin line near one of the vehicles
          this.addCoinLine(items, openLane, -6, 3);
          this.lastBlockedLanes = new Set(blockedLanes);
        }
        break;

      case 'truck-section':
        {
          // Big slow truck in one lane, with optional car in another staggered lane
          const truckLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          items.push({
            kind: 'vehicle',
            laneIndex: truckLane,
            zOffset: 0,
            typeVariant: Math.random() > 0.3 ? 'truck' : 'bus',
            speedKmh: 45 + Math.random() * 15 + difficultyFactor * 60,
          });

          // Place high-reward coins immediately behind truck (risky drafting!)
          items.push({
            kind: 'coin',
            laneIndex: truckLane,
            zOffset: 8,
            typeVariant: 'coin',
          });
          items.push({
            kind: 'coin',
            laneIndex: truckLane,
            zOffset: 12,
            typeVariant: 'coin',
          });

          const openLanes = [0, 1, 2].filter(l => l !== truckLane) as Array<0 | 1 | 2>;
          this.lastBlockedLanes = new Set([truckLane]);
          if (difficultyFactor > 0.6 && Math.random() > 0.5) {
            // Add a staggered car in one of the other lanes
            items.push({
              kind: 'vehicle',
              laneIndex: openLanes[0],
              zOffset: -12,
              typeVariant: 'sports',
              speedKmh: 75 + difficultyFactor * 85,
            });
          }
        }
        break;

      case 'mixed':
      default:
        {
          // 1 obstacle + 1 car, guaranteed 1 open lane throughout
          const openLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          const otherLanes = [0, 1, 2].filter(l => l !== openLane) as Array<0 | 1 | 2>;

          items.push({
            kind: 'obstacle',
            laneIndex: otherLanes[0],
            zOffset: -8,
            typeVariant: 'cone',
          });

          items.push({
            kind: 'vehicle',
            laneIndex: otherLanes[1],
            zOffset: 10,
            typeVariant: 'sedan',
            speedKmh: 65 + difficultyFactor * 80,
          });

          this.addCoinLine(items, openLane, -10, 4);
          this.lastBlockedLanes = new Set(otherLanes);
        }
        break;
    }

    // Double check procedural safety: validation step
    this.validateSafety(items);

    return items;
  }

  private choosePattern(difficulty: number): SegmentPatternType {
    const roll = Math.random();

    if (difficulty < 0.2) {
      // Early game: mostly straight, coin lines, occasional single car
      if (roll < 0.35) return 'straight';
      if (roll < 0.7) return 'coin-line';
      if (roll < 0.85) return 'coin-zigzag';
      return 'light-traffic';
    } else if (difficulty < 0.5) {
      // Mid game
      if (roll < 0.2) return 'coin-line';
      if (roll < 0.45) return 'light-traffic';
      if (roll < 0.65) return 'construction';
      if (roll < 0.85) return 'truck-section';
      return 'coin-zigzag';
    } else {
      // Late game
      if (roll < 0.15) return 'coin-line';
      if (roll < 0.35) return 'heavy-traffic';
      if (roll < 0.55) return 'truck-section';
      if (roll < 0.75) return 'construction';
      if (roll < 0.9) return 'mixed';
      return 'coin-zigzag';
    }
  }

  private addCoinLine(items: SpawnItem[], lane: 0 | 1 | 2, startZ: number, count: number): void {
    const spacing = 3.5;
    for (let i = 0; i < count; i++) {
      items.push({
        kind: 'coin',
        laneIndex: lane,
        zOffset: startZ + i * spacing,
        typeVariant: 'coin',
      });
    }
  }

  private addCoinZigZag(items: SpawnItem[]): void {
    const lanes: Array<0 | 1 | 2> = [0, 1, 2, 1, 0];
    let z = -14;
    lanes.forEach(lane => {
      items.push({
        kind: 'coin',
        laneIndex: lane,
        zOffset: z,
        typeVariant: 'coin',
      });
      z += 6.5;
    });
  }

  /**
   * Validates that at no point in the segment all three lanes are blocked simultaneously.
   */
  public validateSafety(items: SpawnItem[]): boolean {
    const blockingItems = items.filter(it => it.kind === 'vehicle' || it.kind === 'obstacle');

    // Slice segment into 5m test windows
    for (let z = -SEGMENT_LENGTH / 2; z <= SEGMENT_LENGTH / 2; z += 4) {
      const blockedLanesInSlice = new Set<number>();
      blockingItems.forEach(item => {
        // Vehicle/obstacle covers roughly +/- 5m window
        if (Math.abs(item.zOffset - z) <= 5.5) {
          blockedLanesInSlice.add(item.laneIndex);
        }
      });

      // If all 3 lanes are blocked in this slice, remove one blocking item to guarantee an open lane!
      if (blockedLanesInSlice.size >= 3) {
        const itemToRemove = blockingItems.find(it => Math.abs(it.zOffset - z) <= 5.5);
        if (itemToRemove) {
          const idx = items.indexOf(itemToRemove);
          if (idx !== -1) {
            items.splice(idx, 1);
          }
        }
        return false; // Corrected
      }
    }

    return true;
  }
}
