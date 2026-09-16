# Highway Rush — YouTube Playable Endless Runner

## 1. Project Goal

Build a small, polished **3D endless driving game** designed to eventually be published as a **YouTube Playable**.

The player controls a car driving at high speed on an endless highway.

The core gameplay loop is:

```text
DRIVE
  ↓
DODGE TRAFFIC
  ↓
COLLECT COINS
  ↓
DRIVE FASTER
  ↓
SURVIVE LONGER
  ↓
CRASH
  ↓
TRY AGAIN
```

The game should feel immediately accessible, fast and satisfying.

The experience should take inspiration from the gameplay simplicity of three-lane endless runners, but it must have an **original automobile-focused identity**.

Do not clone Subway Surfers, its characters, environments, assets, branding, sounds or UI.

---

# 2. Artistic Direction

## Theme

**Highway Rush**

A stylish, semi-realistic arcade driving game where the player drives a sports car through an endless highway.

The highway can pass through different environments:

- Modern city
- Coastal highway
- Desert highway
- Mountain highway
- Night city
- Sunset highway

The game should feel like a modern mobile arcade racing game.

---

# 3. Visual Style

Use a:

**Semi-realistic / stylized / modern / colorful**

visual direction.

The cars should look recognizable and attractive without requiring highly detailed simulations.

Prefer:

- clean low-poly geometry
- realistic proportions
- simplified materials
- strong silhouettes
- readable road markings
- controlled lighting
- subtle reflections
- dynamic skyboxes
- atmospheric perspective

Avoid photorealism.

The game must remain lightweight enough for a browser-based playable.

---

# 4. Player Car

The player controls one primary car.

The car should be:

- sporty
- recognizable
- visually distinctive
- slightly exaggerated
- centered near the bottom of the screen

Example concept:

```text
                CAMERA
                   ↓

          ┌───────────────┐
          │   TRAFFIC     │
          │ 🚗  🚚  🚙    │
          │               │
          │     🪙        │
          │               │
          │       🚗      │
          └───────────────┘
                PLAYER
```

The player car moves forward automatically.

The player does **not** control acceleration directly in the MVP.

---

# 5. Road

The road consists of exactly **three lanes**.

```text
       LEFT       CENTER       RIGHT
        │           │           │
        │           │           │
        │           │           │
        │           │           │
        │           │           │
```

Use clear lane markings.

The highway should communicate speed through:

- road movement
- lane markings
- passing traffic
- camera movement
- subtle screen effects

The road should never visually become confusing.

---

# 6. Controls

The controls are intentionally simple.

## Desktop

```text
← / A     Change to left lane
→ / D     Change to right lane
Space     Optional boost
P         Pause
```

## Mobile

```text
Swipe left   → Change to left lane
Swipe right  → Change to right lane
Tap          → Optional boost
```

The primary interaction is changing lanes.

Do not require complex steering.

---

# 7. Lane Switching

The car should smoothly move between the three lanes.

Example:

```ts
const LANES = [-1, 0, 1];
```

The car should never teleport.

Use smooth but responsive interpolation.

The transition should be fast enough that the player can react to approaching traffic.

Do not make lane switching sluggish.

---

# 8. Forward Movement

The car continuously drives forward.

The player should feel like they are moving quickly even if the actual world is being recycled.

Use world movement rather than physically moving an enormous highway.

Conceptually:

```text
PLAYER CAR
    │
    │ stays approximately here
    ▼
────────────────────────
        ROAD
────────────────────────
        ↑
        │
  world moves toward
      the camera
```

This makes the game much easier to optimize.

---

# 9. Speed

The game should progressively become faster.

Example:

```text
0 sec       80 km/h
30 sec     100 km/h
60 sec     120 km/h
90 sec     140 km/h
120 sec    160 km/h
```

These are starting values only.

Tune the actual values based on gameplay feel.

The speed should continuously increase without becoming immediately impossible.

---

# 10. Traffic

Traffic is the primary obstacle.

Generate vehicles driving on the highway.

Examples:

- cars
- vans
- SUVs
- trucks
- buses

The traffic should have different speeds.

Example:

```text
PLAYER → 🚗

        🚙
             🚚
   🚗
                 🚐
```

The player must change lanes to avoid collisions.

Traffic should move relative to the player.

---

# 11. Traffic AI

Traffic does not need sophisticated AI.

Use simple behaviors:

```text
- Maintain lane
- Move at predefined speed
- Occasionally change lane
- Spawn ahead
- Despawn behind player
```

Do not use a complex physics engine.

The traffic system should be deterministic enough to guarantee playable situations.

---

# 12. Collision

Collision with another vehicle causes Game Over.

Use simple bounding volumes.

For example:

```text
Player Car
    ↓
Bounding Box

Traffic Car
    ↓
Bounding Box
```

Only test collisions against nearby vehicles.

Never test the player against every object in the world.

---

# 13. Obstacles

In addition to traffic vehicles, introduce static highway obstacles.

Examples:

- traffic cones
- road barriers
- construction barriers
- broken-down vehicles
- road blocks

Example:

```text
LEFT       CENTER       RIGHT

 🚗          🚧           🚗
 PLAYER       ↑
```

Obstacle types should be introduced progressively.

Do not overwhelm the player during the first few seconds.

---

# 14. Coins

Add collectible coins on the highway.

Coins can appear:

- in a lane
- in a line
- in a zig-zag
- around traffic
- in higher-risk positions

Example:

```text
🚗     🪙     🚗
   🪙      🪙
       🪙
```

Collecting coins increases the score.

Example:

```ts
score += 10;
coinsCollected += 1;
```

Coins should have simple animations and visual feedback.

Avoid expensive physics.

---

# 15. Risk / Reward

Some coins should intentionally be placed in risky positions.

Example:

```text
SAFE:

🚗      🪙      🚗


RISKY:

🚗      🚚      🪙
             ↑
       dangerous
```

This creates a reason for players to take risks rather than simply staying in the safest lane.

---

# 16. Score

Score increases based on:

- distance
- survival time
- coins
- optional near misses

Example:

```ts
score += distance * scoreMultiplier;
```

Potential bonus:

```ts
score += nearMissBonus;
```

Keep the scoring system easy to understand.

---

# 17. Near Misses

Add a small bonus when the player narrowly avoids another vehicle.

Example:

```text
PLAYER → 🚗
          │
          │  very close
          ↓
        🚚
```

Display a short notification:

```text
NEAR MISS!
+100
```

Near misses should provide feedback but must not become necessary for survival.

---

# 18. Difficulty Progression

Difficulty increases gradually.

Increase difficulty through:

- player speed
- traffic density
- traffic speed
- obstacle frequency
- traffic combinations
- coin patterns

Example:

```text
BEGINNING

🚗          🚗


MID GAME

🚗    🚚    🚙


LATE GAME

🚙    🚚    🚗
   🚗     🚐
🚚    🚙
```

Do not generate impossible situations.

---

# 19. Procedural Highway

The highway must be generated procedurally.

Do not create a giant static level.

Use reusable highway segments.

Example:

```text
Segment A
Segment B
Segment C
Segment D
Segment E

        ↓

Recycle A

        ↓

Segment F
```

Only maintain a limited number of active segments.

---

# 20. Highway Segments

Create reusable segment types:

```text
straight
traffic-light
light-traffic
heavy-traffic
coin-line
coin-zigzag
construction
truck-section
mixed
```

Each segment defines:

- length
- traffic
- obstacles
- coins
- decorations

Example:

```ts
interface HighwaySegment {
  length: number;
  type: HighwaySegmentType;
  objects: HighwayObject[];
}
```

---

# 21. Procedural Safety

The generator must always guarantee a valid path.

Never create:

```text
🚧    🚚    🚧
```

if this blocks all three lanes at the same time.

At least one lane must remain safely traversable.

The generator should validate every generated configuration.

Create tests that generate thousands of segments and verify that they are playable.

---

# 22. Object Pooling

Use object pooling aggressively.

Pool:

- traffic cars
- trucks
- obstacles
- coins
- highway segments
- particles

Avoid:

```ts
new Mesh(...)
```

inside the gameplay loop.

Prefer:

```ts
pool.acquire();
pool.release(object);
```

This reduces:

- garbage collection
- memory usage
- frame-time spikes

---

# 23. World Recycling

Never allow the highway to grow indefinitely.

When a segment moves behind the player:

```ts
segmentPool.release(segment);
```

Then reuse it at the front.

Conceptually:

```text
              PLAYER
                🚗
                 ↓

[OLD] [ACTIVE] [ACTIVE] [ACTIVE] [ACTIVE]
  ↑
recycle

                         ↓
                     generate
```

The number of active segments should remain bounded.

---

# 24. Camera

Use a third-person chase camera.

The camera should be positioned behind and slightly above the car.

Example:

```text
             CAMERA
                📷
                 \
                  \
                   🚗
                 PLAYER
```

The car should remain visible at the bottom-center of the screen.

The camera should communicate speed without excessive shaking.

---

# 25. Camera Effects

Use subtle effects:

- slight camera movement at high speed
- small camera shake on collision
- subtle FOV increase with speed
- subtle motion blur only if performance allows

Do not use expensive post-processing by default.

Performance is more important than visual effects.

---

# 26. Environment

The environment should change over time.

Possible environments:

### City

- skyscrapers
- street lights
- signs
- bridges

### Coast

- ocean
- palm trees
- cliffs

### Desert

- sand
- mountains
- signs
- dry vegetation

### Night

- city lights
- illuminated buildings
- headlights

### Sunset

- warm sky
- long shadows
- distant skyline

All environments must use lightweight geometry.

---

# 27. Dynamic Environment

Do not create all environments simultaneously.

Load or activate only what is necessary.

A run could transition:

```text
CITY
  ↓
COAST
  ↓
DESERT
  ↓
CITY NIGHT
```

Environment changes should primarily be visual.

They should not introduce complex gameplay systems.

---

# 28. Traffic Visual Design

Create several original vehicle silhouettes.

Example categories:

```text
Sports Car
Sedan
SUV
Van
Pickup
Truck
Bus
```

The player's car must be visually distinct from traffic.

Use different colors/materials for traffic vehicles.

Do not use real-world trademarks or copyrighted vehicle designs.

---

# 29. Player Car Visual Feedback

The player car should react visually to gameplay.

Examples:

- brake lights
- headlights
- subtle suspension movement
- wheel rotation
- small body movement
- acceleration effect

Keep animations lightweight.

---

# 30. Wheels

Wheels should visually rotate based on speed.

Do not use expensive physics.

Simple mathematical rotation is sufficient.

```ts
wheel.rotation.x += speed * delta;
```

Tune the axis according to the actual model.

---

# 31. Audio

Add lightweight sound effects:

- engine
- lane change
- coin pickup
- near miss
- collision
- optional boost
- optional music

The engine sound can change pitch based on speed.

Do not require audio for gameplay.

Handle browser autoplay restrictions gracefully.

---

# 32. UI

The HUD should be minimal.

Example:

```text
┌─────────────────────────────┐
│ SCORE 12,450     🪙 124     │
│                         180 │
│                         KM/H│
│                             │
│                             │
│             🚗              │
│                             │
└─────────────────────────────┘
```

Show:

- score
- coins
- speed

Avoid unnecessary UI elements.

---

# 33. Game Over

When the player crashes:

```text
        GAME OVER

        SCORE
        12,450

        COINS
        124

        BEST
        18,920

      [ REPLAY ]
```

The replay button should immediately restart the game.

Do not make players navigate through multiple menus.

---

# 34. Game States

Use:

```ts
type GameState =
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "game-over";
```

Keep gameplay state separate from UI state.

---

# 35. Start Experience

The player should enter the game extremely quickly.

Target:

```text
LOAD
 ↓
READY
 ↓
DRIVE
```

Avoid long splash screens.

Avoid unnecessary menus.

The player should understand the controls almost immediately.

---

# 36. YouTube Playables Architecture

Keep all YouTube-specific functionality behind an abstraction.

Example:

```ts
interface PlatformAdapter {
  initialize(): Promise<void>;
  showInterstitial(): Promise<void>;
  showRewardedAd(): Promise<boolean>;
  submitScore(score: number): Promise<void>;
}
```

Implement:

```text
PlatformAdapter
      │
      ├── LocalPlatformAdapter
      │
      └── YouTubePlatformAdapter
```

The game must work completely without the YouTube SDK during local development.

Do not couple the game engine to YouTube APIs.

---

# 37. Advertising

Advertising should be handled by the platform layer.

The gameplay itself must not depend on advertisements.

Potential rewarded experience:

```text
GAME OVER

Continue your run?

[ WATCH AD ]
[ END RUN ]
```

If a rewarded advertisement is unavailable, the game must still work normally.

Do not implement advertising before the core gameplay is polished.

---

# 38. Score Submission

Create:

```ts
interface ScoreService {
  submit(score: number): Promise<void>;
}
```

Use:

```text
LocalScoreService
```

during development and:

```text
YouTubeScoreService
```

for production.

Never make the game crash because score submission fails.

---

# 39. Performance

Performance is a first-class requirement.

Target:

```text
60 FPS whenever hardware allows it
```

Avoid:

- allocations inside the game loop
- excessive draw calls
- huge textures
- high-poly traffic
- expensive shadows
- expensive post-processing
- unnecessary transparency
- unnecessary physics
- large world coordinates
- continuously growing arrays

Prefer:

- object pooling
- shared geometries
- shared materials
- instancing
- low-poly models
- simple lighting
- bounded world state

---

# 40. Rendering Strategy

Use Three.js efficiently.

Prefer:

```text
Shared Geometry
      ↓
Shared Material
      ↓
Many Reused Meshes
```

instead of creating unique geometry/material combinations for every vehicle.

Use instancing where appropriate.

Measure draw calls before optimizing.

---

# 41. Memory

Memory must remain bounded.

The number of active:

- vehicles
- coins
- obstacles
- segments
- particles

must have an upper limit.

No gameplay system should continuously allocate memory for the entire duration of a run.

---

# 42. Bundle Size

Keep the production bundle small.

Avoid unnecessary dependencies.

Inspect:

```text
dist/
```

after production builds.

Identify large dependencies and assets.

Do not add a dependency when a small local implementation is sufficient.

---

# 43. TypeScript

Use strict TypeScript.

Prefer:

```ts
interface
type
readonly
const
```

Avoid `any`.

Do not use `@ts-ignore` unless there is a documented technical reason.

Keep modules focused.

---

# 44. Recommended Architecture

```text
src/
├── core/
│   ├── Game.ts
│   ├── GameLoop.ts
│   └── GameState.ts
│
├── player/
│   ├── PlayerCar.ts
│   ├── CarController.ts
│   └── CarPhysics.ts
│
├── traffic/
│   ├── TrafficManager.ts
│   ├── TrafficVehicle.ts
│   └── TrafficSpawner.ts
│
├── highway/
│   ├── Highway.ts
│   ├── HighwaySegment.ts
│   └── HighwayGenerator.ts
│
├── objects/
│   ├── Coin.ts
│   ├── Obstacle.ts
│   └── ObjectPool.ts
│
├── collision/
│   └── CollisionSystem.ts
│
├── input/
│   ├── KeyboardInput.ts
│   ├── TouchInput.ts
│   └── InputManager.ts
│
├── camera/
│   └── ChaseCamera.ts
│
├── environment/
│   ├── EnvironmentManager.ts
│   ├── CityEnvironment.ts
│   ├── CoastEnvironment.ts
│   ├── DesertEnvironment.ts
│   └── NightEnvironment.ts
│
├── rendering/
│   ├── Renderer.ts
│   └── Scene.ts
│
├── audio/
│   └── AudioManager.ts
│
├── ui/
│   ├── HUD.ts
│   ├── StartScreen.ts
│   └── GameOverScreen.ts
│
├── platform/
│   ├── PlatformAdapter.ts
│   ├── LocalPlatformAdapter.ts
│   └── YouTubePlatformAdapter.ts
│
└── main.ts
```

Simplify this architecture if the implementation does not require all modules.

Do not create abstractions merely for architectural aesthetics.

---

# 45. Development Phases

## Phase 1 — Driving Prototype

Implement only:

- Three.js scene
- highway
- player car
- three lanes
- automatic forward movement
- lane switching
- chase camera
- basic traffic

The game must already be playable.

---

## Phase 2 — Core Gameplay

Add:

- collision
- Game Over
- restart
- coins
- score
- speed
- increasing difficulty

---

## Phase 3 — Procedural Highway

Add:

- highway segments
- traffic spawning
- object pooling
- segment recycling
- procedural validation

---

## Phase 4 — Visual Polish

Add:

- original car models
- traffic variety
- environments
- lighting
- particles
- wheel animation
- engine audio
- UI polish
- camera effects

---

## Phase 5 — Optimization

Measure:

- FPS
- frame time
- memory
- draw calls
- triangles
- bundle size
- loading time

Optimize based on measurements.

Do not perform speculative micro-optimizations.

---

## Phase 6 — YouTube Integration

Only after the local game is stable:

- YouTube platform adapter
- Playables SDK
- lifecycle handling
- advertising
- rewarded ads
- score submission

---

# 46. Testing

Test:

- lane switching
- traffic collision
- coins
- score
- speed progression
- Game Over
- restart
- procedural generation
- mobile gestures
- keyboard
- resize
- pause/resume
- environment transitions
- object pooling

Generate thousands of procedural highway configurations automatically.

Verify that:

1. At least one lane is always traversable.
2. No impossible traffic combination is generated.
3. Objects are correctly recycled.
4. Memory does not continuously increase.
5. The game can run indefinitely until the player crashes.

---

# 47. Performance Debug Panel

During development, provide an optional debug panel showing:

```text
FPS
Frame Time
Speed
Active Highway Segments
Active Traffic Vehicles
Active Coins
Active Obstacles
Draw Calls
Triangles
```

Disable it in production.

---

# 48. Mobile UX

The game must feel natural on touch devices.

Gestures:

```text
Swipe ← →   Change lane
```

Touch interactions must be responsive.

Do not depend on hover.

Touch targets should be sufficiently large.

---

# 49. Responsive Rendering

Handle browser resizing correctly.

Update:

- renderer dimensions
- camera aspect ratio
- projection matrix

Do not recreate the entire scene when the viewport changes.

---

# 50. Error Handling

Optional systems must fail gracefully.

Examples:

```text
Audio unavailable
    ↓
Game continues

YouTube API unavailable
    ↓
Local adapter

Optional asset unavailable
    ↓
Fallback asset
```

Never leave the player with a blank screen.

---

# 51. Definition of Done — MVP

The MVP is complete when a player can:

1. Open the game.
2. Start driving immediately.
3. Drive automatically.
4. Change between three lanes.
5. Avoid traffic.
6. Avoid road obstacles.
7. Collect coins.
8. Increase their score.
9. See their speed.
10. Experience increasing difficulty.
11. Crash.
12. See their final score.
13. Restart immediately.
14. Play with keyboard.
15. Play with touch gestures.
16. Continue driving indefinitely until they crash.

The game should feel like a **real arcade driving game**, not a Three.js technical demo.

---

# 52. Core Design Principle

Do not build:

> "Subway Surfers with a car."

Build:

> **A fast, original arcade highway game with the simplicity and replayability of an endless runner.**

The fundamental loop should be:

```text
             HIGHWAY
                ↓
        🚗 DRIVE FORWARD
                ↓
        🚙 DODGE TRAFFIC
                ↓
           🪙 COLLECT
                ↓
          SPEED INCREASES
                ↓
           🚚 MORE TRAFFIC
                ↓
              CRASH
                ↓
          "ONE MORE RUN"
```

Gameplay responsiveness and replayability are more important than graphical complexity.

---

# 53. Final Rule

Build the **driving experience first**.

The first milestone should already feel satisfying with only:

```text
🚗
HIGHWAY
3 LANES
TRAFFIC
CAMERA
LANE SWITCHING
```

Then add coins, obstacles, progression, environments, polish, optimization and finally YouTube Playables integration.

**Do not build a huge game. Build a tiny game that is extremely fun to replay.**