import { HighwayGenerator } from '../src/highway/HighwayGenerator';

function runSafetyTests(segmentCount: number = 10000): void {
  console.log(`Starting Highway Procedural Safety Test across ${segmentCount} generated segments...`);

  const generator = new HighwayGenerator();
  let blockedCount = 0;
  let totalItems = 0;

  for (let i = 0; i < segmentCount; i++) {
    const difficulty = (i % 100) / 100; // Cycles through all difficulty tiers 0.0 to 1.0
    const items = generator.generateSegment(difficulty);
    totalItems += items.length;

    // Check all slices in segment (-20 to +20 in steps of 1m)
    for (let z = -20; z <= 20; z += 1.0) {
      const blockedLanes = new Set<number>();

      for (const item of items) {
        if (item.kind === 'vehicle' || item.kind === 'obstacle') {
          // Check collision footprint
          const margin = item.typeVariant === 'truck' || item.typeVariant === 'bus' ? 4.8 : 3.2;
          if (Math.abs(item.zOffset - z) < margin) {
            blockedLanes.add(item.laneIndex);
          }
        }
      }

      if (blockedLanes.size >= 3) {
        blockedCount++;
        console.error(`FAILED: All 3 lanes blocked at segment ${i}, Z slice ${z}!`);
        break;
      }
    }
  }

  if (blockedCount === 0) {
    console.log(`✅ SUCCESS: 100% of ${segmentCount} segments verified! ZERO unnavigable paths.`);
    console.log(`Total procedural elements generated: ${totalItems}`);
  } else {
    console.error(`❌ FAILURE: Detected ${blockedCount} unnavigable segment configurations.`);
    process.exit(1);
  }
}

runSafetyTests(10000);
