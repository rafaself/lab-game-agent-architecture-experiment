# Stage 1 core handoff

Specialist 1 implemented this stage in the fresh Sequential Delegation worktree from frozen commit `c1d131aa5d471434e857fd73042351a05157d72c`. All six frozen game skills and the shared/treatment/protocol/specification documents were read. No other run, dependencies, external services, or browser session were used. Only `game/` was written. Model and reasoning settings were inherited without override.

The player loop is: travel east, read attack warnings, aim and strike, clear a room, choose one upgrade, continue to the Warden, defeat it. The safe start teaches movement and the exit; combat 1 combines melee/ranged, combat 2 introduces the charging elite, combat 3 combines roles, and the boss alternates a projectile fan and marked area explosions. The design follows the supplied implementation plan without extra progression systems.

## Owned files

- `rng.mjs`: unsigned seed parsing, seeded PRNG, shuffle, immutable content helper.
- `dungeon.mjs`: immutable route, obstacle layouts, encounters and reward offers; signatures.
- `geometry.mjs`: circle movement/collision, line obstruction and small visibility paths.
- `upgrades.mjs`: four distinct effects and base player statistics.
- `events.mjs`: event queue and temporary visual effects.
- `combat.mjs`: slash, damage, enemy AI, projectiles, elite charge, boss patterns.
- `model.mjs`: run states, fixed-step updates, doors/locks, rewards and reset.
- `tests/*.test.mjs`: generation, model, combat and ordinary-input full-run checks.
- `signatures.mjs`, `seed-signatures.json`: repeatable generation evidence.
- `CORE_HANDOFF.md`: this contract and Stage 1 evidence.

The lead owns `RUN_RECORD.md` and final `VERIFICATION.md`. Stage 2 owns the HTML/CSS, renderer, browser input, audio, README and its presentation evidence. No package file is necessary: browser ES modules and `.mjs` tests use built-in runtimes.

## Browser integration contract

Import from `model.mjs`: `createGame`, `startRun`, `returnToMenu`, `updateGame`, `chooseReward`, `currentRoom`, `isRoomLocked`, `drainEvents`, `WORLD`, `FIXED_STEP`. Import `UPGRADES` from `upgrades.mjs`, `parseSeed` from `rng.mjs`, and optionally `dungeonSignatures` from `dungeon.mjs`.

```js
const game = createGame({ seed: parseSeed(urlSeed) }); // phase === 'menu'
startRun(game, seed);                                // resets every run field
updateGame(game, frameDeltaSeconds, {
  moveX: right - left, moveY: down - up,
  aimX: pointerWorldX, aimY: pointerWorldY,
  attack: spaceHeld || primaryButtonHeld,
});
const { definition, runtime } = currentRoom(game);
const events = drainEvents(game); // consume once per rendered frame
chooseReward(game, upgradeId);    // true only for a currently offered choice
returnToMenu(game);
```

Use one requestAnimationFrame loop. `updateGame` uses fixed 1/120-second simulation steps independent of normal render-frame partitions. It clamps a single elapsed gap to 0.25 seconds to prevent large background-tab jumps. Input is sampled for those steps; key handlers must clear held state on window blur and when screens change. Convert pointer positions into world coordinates using the canvas's displayed bounds. The world is always 960 × 600; renderer/CSS may scale it responsively.

`phase` is exactly `menu`, `playing`, `game-over`, or `victory`. A reward is a modal substate of `playing`: `game.pendingReward = { roomIndex, offers: [id, id] }`. It pauses simulation until a valid selection. No transition logic needs duplicating in the UI. Both end-screen restart buttons call `startRun(game, game.seed)` and menu buttons call `returnToMenu(game)`.

`game.player` has `x`, `y`, `radius`, `aimAngle`, `health`, `maxHealth`, `speed`, `damage`, `attackCooldown`, `attackRange`, `attackHalfAngle`, `cooldown`, `invulnerable`, `damageFlash`, and `upgrades` (an ordered list of selected IDs, including stacks). Display current effect values and upgrade names/descriptions from `UPGRADES`. Health is bounded; `invulnerable > 0` is the remaining protected duration. Damage flash and invulnerability need visibly different treatment.

`game.roomIndex` is 0–4. `game.dungeon.rooms` are immutable generated definitions. Each definition has `index`, `kind` (`start`/`combat`/`boss`), `name`, `layout`, `obstacles` (`x/y/width/height`), `encounters`, `offers`, `previous`, and `next`. `game.rooms` contains mutable runtime objects with `visited`, `cleared`, `rewardClaimed`, `enemies`, `projectiles`, and `hazards`. Show active/cleared plus hostile count using live enemy health. Do not mutate generated definitions or use them as combat state.

The east/west doorway occupies y=236–364 in the 28px wall. Render both doors when the corresponding connection is non-null. Movement across the wall within the doorway enters the next/previous room only when `isRoomLocked(game)` is false; both combat exits lock while any enemy lives. Start has no west exit; boss has no east exit. The boss's defeat transitions immediately to Victory. Room entry places the player near the opposite door at y=300 and grants 0.55 seconds of entry protection. Every obstacle layout preserves a horizontal 44px-plus clearance corridor at y=300. Enemy paths route around obstacles, and attacks/projectiles are blocked by them.

## Combat rendering and cues

Enemy runtime fields include `id`, `kind`, position/radius, `health`, `maxHealth`, `damageFlash`, `state` (`idle`, `windup`, `charging`, `dead`), `cooldown`, and `attack`. Ignore enemies with zero health as live actors; their distinct defeat visual is an effect. Give each archetype a different silhouette/mark, with health visible especially for elites and the boss.

During `windup`, `enemy.attack` has `kind`, `timer`, `duration`, origin `x/y`, locked `targetX/targetY`, and `angle`. These targets stay fixed through the warning. Use `1 - timer/duration` for cue progress:

| Enemy/pattern | Warning and action | Player response |
| --- | --- | --- |
| Melee / `melee` | 0.48s windup; radius 48 circle; close strike | Step outside circle; slash has longer reach |
| Ranged / `shot` | 0.85s aimed line; one 235px/s bolt | Move across the locked line or use a pillar |
| Elite / `charge` | 1.0s line warning; `range: 221`; 340px/s charge for 0.65s | Move perpendicular; walls stop the charge |
| Boss / `fan` | 1.0s cone warning; five 195px/s bolts at angle offsets −0.56, −0.28, 0, 0.28, 0.56 | Reposition before launch and avoid the spreading lanes |
| Boss / `nova` | 1.25s warning; three independently visible circular hazard zones | Leave the marked circles before explosion |

The elite's `charging` attack retains its angle, timer/duration and range. Show a strong direction/trail during charge. Boss nova zones live in `runtime.hazards` with `x/y/radius`, `timer/duration`, `active` (0.3s explosion), `kind: 'nova'`. When timer reaches zero the zone deals damage; it then disappears after its active duration. Use circles for actual hazard positions rather than the boss's target fields, because zones are clamped away from the arena edge. Projectiles have `x/y`, `vx/vy`, `radius`, `kind`, `remaining`, and `damage`.

`game.effects` are visual objects with `kind`, `remaining`, and `duration`, plus position/shape fields. Supported kinds: `slash` (`angle/range/halfAngle`), `player-damage`, `player-defeat`, `enemy-hit`, `enemy-defeat` (`radius`), `melee-strike` (`radius`), and `nova-explosion` (`radius`). Draw slash as an obvious 108px aimed arc; draw defeat as a burst/disappearance that differs from damage flash. Effects use simulation time and pause at end/reward screens.

Event queue types: `run-started`, `menu-opened`, `room-entered`, `door-blocked`, `player-attack`, `player-damaged`, `game-over`, `enemy-damaged`, `enemy-defeated`, `enemy-telegraph`, `enemy-attack`, `hazard-exploded`, `room-cleared`, `reward-offered`, `upgrade-selected`, `victory`. Each has simulation `time`, plus relevant IDs, position, amount, source, pattern, room index or offers. Drain once per frame, even on paused screens. Map at least `player-attack` and `player-damaged`/`enemy-defeated` to distinct synthesized Web Audio cues after a user gesture unlocks the context. Audio browser/audibility evidence remains Stage 2/lead work.

## Tuning assumptions

Base player: 100 HP, speed 205px/s, damage 20, slash reach 108px, half-angle 0.95 radians, cooldown 0.42s, damage protection 0.85s. Melee: 36 HP/8 damage; ranged: 30 HP/10 damage; elite: 70 HP/15 damage; boss: 240 HP/16 damage. The room pool is deliberately small and readable; this is a short complete run, not a content-rich dungeon generator. Difficulty and reward values are assumptions, not claimed balanced by player testing.

Damage adds 8; cadence multiplies cooldown by 0.75 (floor 0.16s); movement multiplies speed by 1.18; survival adds/heals 25 HP. Effects stack and last only for the current run. Two different IDs are offered per combat clear. Across the first two rewards all four categories necessarily appear, and a seeded third pair permits reinforcement. Survival has an immediate recovery benefit; damage/cadence combine for offense; movement makes warning evasion easier. No permanent progression.

## Verification evidence at handoff

Working directory for every command: `/home/rafa/.codex/worktrees/delegated-rerun/lab-game-agent-architecture-experiment/game`.

```sh
node --test
node signatures.mjs > seed-signatures.json
```

Final Stage 1 Node result at 06:21 UTC: 26 tests, 26 pass, 0 fail, 0 skipped; exit 0; runner reported 143.37345ms. The initial suite had one failed boss evasion scenario because the test player later stood in a fan bolt's spreading path. The corrected scenario continues repositioning; core behavior was unchanged. Final tests demonstrate aimed hit range/cooldown/obstruction, damage/invulnerability, melee pursuit/telegraph and dodge, ranged aim lock/projectile/dodge, elite charge/hit/dodge/recovery, alternating boss fan/nova and evasion, nova damage, defeat events, fixed-step equivalence, route/locks/rewards/reset, and immutable generation. The 100-seed geometry test checked all 996 enemy spawn paths to the entry corridor.

Two integration tests reach Victory with ordinary model inputs only, traversing each doorway and choosing every reward without mutating health, enemies, room progress or cooldowns. An exploratory execution of the same controller completed seed 17 in 26.225 simulation seconds at 89/125 HP with survival/damage/cadence; seed 42 completed in 28.658 seconds at 83/150 HP with survival/cadence/survival. These are automated feasibility evidence, not browser or player-balance evidence.

`signatures.mjs` generates both seeds twice, asserts equal repeated content and all three inter-seed differences, and emits full room definitions plus SHA-256 signatures. `seed-signatures.json` is its exact output. Compact differences:

| Seed | Combat layouts | Encounters by combat room | Offers by combat room |
| --- | --- | --- | --- |
| 17 | barricades-mirror; split-hall; barricades-mirror | melee+ranged+ranged; elite+melee; elite+ranged+melee | survival/cadence; damage/movement; movement/cadence |
| 42 | barricades; split-hall; barricades-mirror | melee+ranged+ranged; elite+melee+ranged; elite+ranged+melee | damage/survival; cadence/movement; survival/cadence |

Stage 1 supports A2–A7 with Evidence `automated only`. A1 and A8 require presentation and browser work; no browser claim is made here. No known core blocker at handoff. Browser interaction, rendered warning readability, audible cues, and end-screen buttons are not verified by this stage. Stage 2 should preserve the API and may request the same core specialist for a focused correction if review finds a defect.
