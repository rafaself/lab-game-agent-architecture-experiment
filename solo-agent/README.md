# Dungeon Escape

Dungeon Escape is a single-player top-down roguelite. Clear three combat chambers, choose a relic after each, then defeat the Hollow Crown to escape. The game uses browser Canvas, plain JavaScript modules, CSS, procedural vector art, and synthesized Web Audio. It has no package or production runtime dependencies.

## Run on Linux

Requirements: Python 3 and a modern browser with Canvas and Web Audio support.

From this directory, start the local static server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://localhost:8000](http://localhost:8000) in a browser. No install or build step is needed. To stop the server, press `Ctrl+C` in its terminal.

## Controls

- Move with **WASD** or the **arrow keys**. Diagonal movement is normalized.
- Move the mouse to aim.
- Attack with **Space** or the **left mouse button**.
- Toggle sound with the button below the game. Starting a run unlocks browser audio; visual cues remain available if audio is muted or unsupported.

Enemies show their attack direction or danger area before striking. Melee enemies close in and wind up a short-range hit, ranged enemies aim and fire a bolt, elites charge through a marked lane, and the boss alternates a charge with a radial bolt burst. Move out of each warning area to avoid damage.

## Seeds and run flow

Enter an unsigned 32-bit decimal seed (`0` to `4294967295`) on the menu, or pass one in the URL. For example:

```text
http://localhost:8000/?seed=17
```

An empty seed field creates a random seed, which is shown in the HUD. A run precomputes all room layouts, enemy encounters, and relic offers from its seed; entering the same seed reproduces that content. Run-time combat does not change the generated content.

Two repeatable test seeds:

| Seed | Combat layouts | Encounters, in order | Relic offers, in order |
| --- | --- | --- | --- |
| `17` | Sunken Court, Quiet Garden, Crossroads | 2 melee + 1 ranged; 2 melee + 1 ranged; 1 elite + 1 melee + 1 ranged + 1 elite | Windstep / Echo Thread; Tempered Edge / Heartwood; Windstep / Tempered Edge |
| `42` | Twin Pillars, Long Hall, Quiet Garden | 2 melee; 2 melee + 1 ranged; 1 elite + 1 melee + 1 ranged + 1 elite | Heartwood / Echo Thread; Tempered Edge / Windstep; Heartwood / Tempered Edge |

Each combat room offers two different relics. All four effects appear somewhere in every run: Tempered Edge adds damage, Echo Thread shortens attack recovery, Windstep raises movement speed, and Heartwood increases and restores health. Effects stack and last until the run ends. “Run again” repeats the same seed with fresh health, rooms, and relics; return to the menu to enter another seed or leave it blank for a new random run.

## Verification

Run the dependency-free system tests with Node.js 18 or newer:

```sh
node --test
```

The test suite covers generation repeatability and variation, route and gate rules, enemy attacks, attack damage, health bounds and invulnerability, relic application/reset, boss patterns and victory, and Web Audio cue synthesis. See [VERIFICATION.md](./VERIFICATION.md) for Linux run evidence and results for checks A1–A8.
