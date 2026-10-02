# Dungeon Escape · The Last Gate

A dependency-free Canvas roguelite for a Linux keyboard and mouse. Travel through a quiet start, three combat chambers, and the Warden's arena. Clear each chamber, take one run upgrade, then defeat the Warden to escape. All visuals are procedural vectors; sound is synthesized with Web Audio.

## Launch

From the experiment repository root:

```sh
cd runs/sequential-delegation
python3 -m http.server 8102 --bind 127.0.0.1
```

Open `http://127.0.0.1:8102/?seed=17` in the dedicated **🧪 Delegated Rerun** browser session. Keep sound enabled. The documented server uses only the loopback interface. No installation, package manager, production dependency, or test dependency is needed.

## Controls and rules

- **WASD or arrow keys:** move. Diagonal movement has the same speed as axial movement.
- **Mouse:** aim the blade toward the pointer within the arena. The sword shows the aim direction. Initial aim is east until the pointer moves over the arena.
- **Hold Space or the primary mouse button:** repeat slashes at the current attack cadence. Slashes reach 108 world pixels and hit a visible forward arc. Pillars block slashes and bolts.
- **East/west doorway:** walk through its middle opening. The east door advances the route; west returns to the previous room. Both doors lock while any hostile lives. The boss arena has no east exit.
- **Upgrade cards:** click or focus with Tab and press Enter to take one of the two gifts. Combat waits during the choice.
- **End screens:** Fresh run restarts the same seed with health, upgrades, rooms, and encounters reset. Main menu returns to the seed selector.
- **Sound on/off:** toggle synthesized cues. Starting a run or another keyboard/mouse gesture unlocks audio. Browser/device audio policies can affect audibility.

Held keys and primary click release on window blur, pointer cancellation, hidden document, and screen changes. No pause/cheat/automated-play controls are present.

The top HUD displays current/max health, protection state, room number/name, hostile count, exit lock or cleared state, slash damage, cooldown, and movement speed. The five marks track the route. Selected gifts remain visible below the arena, including repeated stacks.

## Reading combat

| Actor / warning | What to do |
| --- | --- |
| Teal round player, pale directional blade | Aim at a nearby enemy and strike while repositioning. |
| Red triangular melee, gold circle | Step outside the circle before its close strike. |
| Violet diamond ranged, dashed aim line | Move across the fixed line or use a pillar. |
| Horned gold hexagon elite, broad charge lane | Move perpendicular to the lane before the charge. |
| Crowned Warden, five fan lanes | Reposition before the spreading bolts launch. |
| Three hatched nova circles with filling time rings | Leave the actual marked circles before they explode. |

Damage briefly flashes the player red and the arena border. Temporary protection uses a dashed teal shield and pulsing body. Enemy damage flashes pale; enemy defeat makes a separate radial burst. Player defeat removes the body and produces a red burst plus Game Over. Audio distinguishes the short downward slash, low damage sound, rising enemy defeat sound, warning, reward, and end events. Visual information remains available with sound off.

## Seeds and gifts

The menu accepts a decimal unsigned 32-bit seed (`0` through `4294967295`). The URL accepts `?seed=<value>`; invalid URL values fall back to `17`. Starting through the menu updates the URL. A fresh run uses the same seed; edit the menu to generate a different dungeon. Layouts, enemy compositions, initial timers, and all offers are precomputed from the seed.

| Seed | Combat layouts | Encounters in rooms 2 / 3 / 4 | Reward pairs |
| --- | --- | --- | --- |
| 17 | barricades-mirror / split-hall / barricades-mirror | melee+ranged+ranged / elite+melee / elite+ranged+melee | survival/cadence / damage/movement / movement/cadence |
| 42 | barricades / split-hall / barricades-mirror | melee+ranged+ranged / elite+melee+ranged / elite+ranged+melee | damage/survival / cadence/movement / survival/cadence |

Tempered Edge adds 8 damage. Quick Hands reduces cooldown by 25%, with a 0.16s floor. Windstep adds 18% speed. Heart Vessel adds 25 maximum health and heals 25. Effects stack, persist for the current run, and reset on a fresh run. All four categories appear among the first two offer pairs. These numbers are tuning assumptions; no player-balance claim is made.

## Verification

From `runs/sequential-delegation/`:

```sh
node --test
node signatures.mjs
```

The signature command generates each of seeds 17 and 42 twice, asserts same-seed repeatability and all three inter-seed variations, and prints full definitions and SHA-256 signatures. `seed-signatures.json` records the core handoff's generated output.

The Node suite covers generation, route/locks, combat and boss behavior, damage/protection, rewards/resets, complete ordinary-model-input runs, scaled pointer input, key/button release, frame event consumption, warning rendering geometry, live HUD data, and synthesized audio scheduling. Rendering and audio tests use instrumented fixtures; they establish automated evidence, not browser appearance or audibility.

For browser checks, follow A1–A8 and the exact procedure in `../../docs/EXPERIMENT_PROTOCOL.md`: exercise both movement schemes and attack controls, blocked/open doors, every enemy and boss pattern, damage/protection/defeat, all rewards, both end screens and their two actions, fresh-run reset, visible HUD, audible event cues, and seed 17/42 reloads. `VERIFICATION.md` is the lead's authoritative record of outcomes and exact evidence labels. `CORE_HANDOFF.md` and `UI_HANDOFF.md` describe stage ownership and evidence.

`window.dungeonSnapshot()` returns an isolated copy of the live model for read-only inspection. It exposes no setters or commands and cannot modify the run. Ordinary browser input is still required for browser acceptance evidence.
