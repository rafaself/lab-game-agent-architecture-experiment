# Ember Vault

A complete single-player Canvas dungeon escape. Carry the ember through three
combat chambers, choose an upgrade after each, and defeat the Warden. All art
is procedural vector drawing; all sounds are synthesized with Web Audio.

## Launch on Linux

Requirements: Python 3 and a modern browser. No installation or dependencies.
From the repository root:

```sh
cd runs/solo
python3 -m http.server 8101 --bind 127.0.0.1
```

Open <http://127.0.0.1:8101/?seed=17>. Click **Enter the vault** to start and
unlock audio. Keep the tab focused. Stop the server with Ctrl+C.

## Controls and route

| Action | Input |
| --- | --- |
| Move | WASD or arrow keys; diagonals use the same speed |
| Aim | Mouse pointer, in the direction of the visible golden weapon |
| Fire | Hold Space or primary mouse button; bolts travel about 690 pixels |
| Pause / resume | Escape or the Pause / Resume button |
| Sound | Sound on / Sound off button |

Move through the glowing door on the **east** wall to advance. A safe threshold
leads to three combat rooms and then the boss. Both doors seal while enemies
live. Clear a combat chamber, choose one of two upgrades, then continue.
Cleared chambers can be revisited without respawning enemies or rewards.
Doors open immediately on the last enemy defeat; the reward overlay pauses
travel until a choice is made. Rewards and pause screens stop simulation.
Leaving the tab pauses the game.

Stalkers pursue and mark a small strike circle; move out before the strike.
Seers stop and show a dashed sightline before shooting; sidestep the shot.
Lancers warn with a broad amber lane, then charge along it; move across the lane.
The Warden alternates warned radial volleys and three delayed area blasts.
Find a gap between bolts and leave blast circles while they fill.

White sparks mark hits, gold shards mark enemy defeats, a red ring marks damage,
and a cyan shield with flickering player art marks 1.05 seconds of invulnerability.
Attack, damage, enemy defeat, reward, victory and defeat have distinct cues.

## Seeds and upgrades

Enter any unsigned 32-bit decimal seed, including 0, in the menu or use
`?seed=<number>`. The reroll button chooses a new seed. Restart repeats the
current seed with full health, base stats, no upgrades, fresh enemies and room 1.
Invalid menu input is rejected; an invalid URL seed falls back to 17.

Test seeds **17** and **42** reproduce all layouts, enemy composition and
placement, and reward offers. Their differences are recorded in
[evidence/seeds.json](evidence/seeds.json). Generation precomputes five connected
rooms, three of five obstacle layouts, all enemy spawns and all reward offers.
Each room keeps an open horizontal route between its doors.

| Upgrade | Effect | Tactical benefit |
| --- | --- | --- |
| Tempered edge | +8 damage per bolt | Faster elite and boss kills |
| Quickening | Cooldown multiplied by 0.75 | Sustained pressure on moving foes |
| Windstep | Speed multiplied by 1.18 | More room to dodge |
| Ember heart | +30 maximum health and heal 30 | A larger margin for mistakes |

The first two selections collectively offer all four categories; the third
offers two distinct choices from the same pool. Effects stack if selected again,
persist across rooms, and reset on every fresh run. Choosing one excludes the
other. Cadence and damage combine; speed helps avoid damage; heart restores
health without improving damage. Numeric tuning is an implementation assumption,
not a claim of competitive balance. No permanent progression or storage.

## Verification and structure

Verification used Node 25.9.0. Tests use the native runner and standard library:

```sh
cd runs/solo
node --test
node verify-seeds.js
```

[VERIFICATION.md](VERIFICATION.md) contains A1–A8 outcomes, exact evidence labels,
browser observations, limitations, environment and run timing.

- `dungeon.js`: seeded generation and signatures.
- `state.js`, `combat.js`, `physics.js`: run state, movement and combat.
- `renderer.js`, `input.js`, `main.js`: Canvas art, keyboard/mouse and UI.
- `audio.js`: user-gesture audio unlock and synthesized event cues.
- `test/`: Node tests for generation, collisions, combat and state transitions.
- `RUN.json`, `evidence/`: experiment metadata and local verification artifacts.

Player experience: read the danger, reposition, fire, choose a useful upgrade,
then push deeper. Keyboard and mouse are required for play; the responsive
interface supports smaller screens but has no touch-control scheme.
