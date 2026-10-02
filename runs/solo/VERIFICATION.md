# Solo run verification

Implemented **Ember Vault** in `game/`. Six acceptance checks pass; two remain
incomplete because the available browser tools cannot verify held keys or let
the reviewer hear audio. No acceptance claim below substitutes model calls for
actual browser play.

## Frozen conditions and timing

| Field | Record |
| --- | --- |
| Treatment / order | Solo / first in Solo-then-Sequential |
| Frozen source | `c1d131aa5d471434e857fd73042351a05157d72c` |
| Parent baseline | `2c7e312d8d7dc4bf85de8cf69dafd5a859c2b7d3` |
| Worktree | `/home/rafa/.codex/worktrees/3895/lab-game-agent-architecture-experiment` |
| Initial state | Clean detached HEAD at frozen source; no `game/` directory |
| Model / reasoning | Task metadata pinned to `gpt-6.1-sol` / `xhigh`; no overrides |
| Start UTC | `2026-10-02 05:01:12 UTC` |
| Start São Paulo | `2026-10-02 02:01:12 -03:00` |
| End UTC | `2026-10-02 06:04:53 UTC` |
| End São Paulo | `2026-10-02 03:04:53 -0300` |
| Actual elapsed | 63 minutes 41 seconds (3821 seconds) |
| Deadline | `2026-10-02 06:31:12 UTC` / `03:31:12 -03:00` |
| Interruptions / limit | No external interruption or resource-limit hit. Game pauses during review did not pause the experiment clock. |
| Specialist count | 0; no coding agents or external implementation collaborators |
| Ownership / handoffs | Sole engineer owned all source, tests, design application, integration, verification and reporting. No handoffs. |
| Lead-authored code | Entire implementation, required by Solo treatment |

All six frozen repository design skills were read and applied: brief-to-player
experience, seeded generation, top-down gameplay, run progression, combat and
encounters, and UX readability. No unrelated or orchestration skill was loaded.
The prescribed Canvas / CSS / ES modules / Web Audio / Python server / Node test
runner stack was used. No production or test dependencies were added.

| Frozen input | Verified SHA-256 |
| --- | --- |
| Specification | `39b81f2fee290781189c4d847c883d7d501aa1f6a8d55a5b44a00b81c194caaf` |
| Shared prompt | `a118613f15fd1dc5c6a5c1d51673774bf24522b50ad84d828e55e331288f2d49` |
| Solo prompt | `29fd9f9b2e10f7fcadbbc3fb82adbec7d10624f19c1ba3526774639dac63f84c` |
| Sequential prompt checksum | `93584de54e1ac86834aa82452f13aeb8cea87be159489fcbe29cdcf5e796c451` |

## Acceptance outcomes

Evidence labels follow the frozen protocol exactly. `automated only` rows can
include partial browser observations; those observations do not promote a row
to `browser verified`.

| Check | Outcome | Evidence | Observed result and limitation |
| --- | --- | --- | --- |
| A1 — Launch and controls | INCOMPLETE | automated only | Documented Python launch and menu worked. Real browser WASD/arrow tap series moved the player; a D+S chord moved diagonally. Space and primary mouse clicks fired aimed bolts and hit foes. Node checks cover all eight movement keys, sustain/release, normalized diagonals and pointer scaling. The browser connector rejects key-hold commands, so sustained key holds and their complete browser normalization check remain unverified. |
| A2 — Run states | PASS | browser verified | Menu started runs. Enemy damage reached zero health and Game Over. Boss defeat reached Victory. Both Fresh run and Main menu actions were exercised from both end screens. Fresh runs showed 100/100 health, base 22 damage / 0.30s cadence / 235 speed, no upgrades, room 1 and fresh full-health encounters. |
| A3 — Dungeon | PASS | browser verified | Traversed threshold, three combat chambers and boss. Attempting west exits with live foes kept the player in each chamber. Final-build observations show `exitLocked=true` with hostiles and `false` immediately after the last defeat in all three rooms. Reward selection pauses travel while doors are already open; subsequent east-door traversal advances normally. |
| A4 — Enemies and combat | PASS | browser verified | Stalker pursuit and close strike circles, Seer sightline and projectiles, and Lancer charge lane and dash were observed. Bolts reduced enemy health and caused defeat. Enemy attacks reduced player health. Cover/distance prevented hits during fights, and movement evaded boss patterns. Damage rings, gold defeat shards, and cyan flickering shields were visually distinct; health stayed unchanged during shield samples despite continuing pressure. |
| A5 — Rewards | PASS | browser verified | Each of the three selections showed two different offers. Across browser runs all four effects were chosen: damage 22→30, cadence 0.30→0.22s displayed, speed 235→277, and health/max health increased by 30. Effects and upgrade chips persisted across chambers; repeated Ember hearts stacked. End-screen Fresh run reset all effects. |
| A6 — Boss and victory | PASS | browser verified | Warden health bar and damage were observed. Radial-volley spokes and three filling area circles had distinct warnings. South then north movement evaded both first patterns with health remaining 82/130. Attacking defeated the boss and completed the run. Final source reached Victory on both 17 and 42. |
| A7 — Variation and repeatability | PASS | automated only | Final browser traversals confirmed different layouts, compositions and early offers for 17/42. `node verify-seeds.js` passed two independent repeat checks per seed, comparing all generated layouts, spawns/compositions and offers; all three cross-seed signatures differ. Complete same-seed signatures were established by automation, not by replaying every possible choice in the browser. |
| A8 — Feedback and HUD | INCOMPLETE | automated only | Browser HUD showed health, stats, upgrades, numbered room route and active/cleared state. Sound remained enabled. A start gesture unlocked Web Audio, and attack/damage/defeat/upgrade/victory event counts were observed. System output captured actual attack audio with a nonzero peak. The tool interface does not support audio listening; two event-linked cues could not be heard by the reviewer, so the full check remains incomplete. |

## Commands and evidence

From `game/`:

```sh
python3 -m http.server 8101 --bind 127.0.0.1
node --test
node verify-seeds.js
```

- Launch: opened `http://127.0.0.1:8101/?seed=17`, also used seed 42 and the menu seed field. Asset requests succeeded; see [server.log](evidence/server.log).
- Tests: **18 passed, 0 failed**. Includes 500 generation seeds, connectivity and open lanes, safe spawns, locks, all upgrade effects, reset/health/state behavior, attacks and cadence, all enemy mechanisms, both boss patterns and input edges. See [node-tests.txt](evidence/node-tests.txt).
- Repeatability: **four repeat checks plus three independent variation checks passed**. See [seed-checks.txt](evidence/seed-checks.txt) and complete [seeds.json](evidence/seeds.json).
- Browser console: no captured warnings or errors; see [browser-console.json](evidence/browser-console.json).
- Browser observations: [browser-steps.json](evidence/browser-steps.json) records real inputs, timestamps and read-only DOM observations of running state. It includes earlier navigation failures and earlier generator iterations. Entries beginning `final composition`, `final seed`, or `seed 17 final` describe the final encounter generation; final generation truth is in `seeds.json`.
- Visual evidence: [menu](evidence/01-menu.png), [HUD and attack](evidence/02-playing.png), [locked exit / elite cue](evidence/03-combat-locked.png), [damage and shield](evidence/07-damage-shield.png), [enemy defeat](evidence/08-enemy-defeat.png), [melee warning](evidence/13-cue-melee.png), [ranged warning](evidence/13-cue-ranged.png), [elite warning](evidence/13-cue-elite.png), [boss volley](evidence/10-boss-volley.png), [area warning](evidence/11-boss-area-warning.png), [Game Over](evidence/06-game-over.png), [final seed 17 Victory](evidence/20-final-victory.png), [final seed 42 Victory](evidence/21-final-seed-42-victory.png).
- Audio capture: [browser-attack.wav](evidence/browser-attack.wav), 24 kHz mono, approximately 10.92 seconds, peak 3157 of 32767. [attack-listen.wav](evidence/attack-listen.wav) is a trimmed excerpt. Output was captured while real Space attacks occurred after user-gesture unlock; direct listening was unavailable.
- Repository scope: only `game/` changed. Frozen input checksums were checked; tracked repository diff and whitespace checks passed. Source hashes are in [source-sha256.txt](evidence/source-sha256.txt).

Browser play used UI key taps and mouse clicks, never direct game-state mutation,
teleportation, health overrides, or scripted model calls. Read-only `data-*`
attributes on Canvas expose frame observations for verification. Synthetic model
setup occurs only inside the Node tests and supports the automated evidence.

## Final seed differences

`M` = melee, `R` = ranged, `E` = elite. Ordering and exact positions are also seeded.

| Seed | Combat layouts, in route order | Room 2 / room 3 enemy counts | Reward pairs, in route order |
| --- | --- | --- | --- |
| 17 | Split sanctum; Sunken corners; Broken colonnade | 1M + 1R + 2E / 2M + 2R + 1E | Quickening / Ember heart; Windstep / Tempered edge; Ember heart / Quickening |
| 42 | Twin pillars; Sunken corners; Split sanctum | 1M + 2R + 1E / 3M + 1R + 1E | Windstep / Ember heart; Quickening / Tempered edge; Ember heart / Quickening |

Both first combat rooms have one of each archetype. The start and boss room types
are fixed; the three intermediate layouts, spawns and offers vary. All offers
are precomputed, so player input and audio do not affect generated content.

## Environment, deviations and review

- Linux `7.2.7-100.fc43.x86_64`, x86_64; Node `25.9.0`; Python `3.14.7`.
- Installed Chrome reports `154.0.8037.57`; **it was not the connected browser used**. The connected in-app Chromium engine version was not exposed by the permitted version-query capability.
- Tools: shell/file editing, Python static server, native Node tests, CUA browser API with DOM/AX/screenshot observations and UI keypress/click APIs, PipeWire/PulseAudio output monitor capture. Filesystem unrestricted, approval policy `never`, network enabled; the game uses no external services or asset requests.
- **Browser deviation:** creating assigned Chrome session/profile `🧪 Solo Rerun` failed with `Browser is not available: chrome`. The supported inventory exposed only MCP Apps and the in-app browser. A fresh in-app tab was used and its automation session named `🧪 Solo Rerun`, always on port **8101**. A dedicated Chrome profile could not be guaranteed. This limits strict environment comparability with a run that obtains the prescribed Chrome connection.
- **Input limitation:** the advertised raw CDP capability rejected `Input.dispatchKeyEvent`; the supported keypress alternative could not hold a key. Rapid tap sequences exercised actual UI movement and attacks. Complete held-input browser evidence remains missing, recorded under A1.
- **Audio limitation:** loopback capture contained output, but the attempted audio-listening tool response said `audio content omitted because you do not support audio input`. Audible review remains missing, recorded under A8.
- **Rework:** four implementation refinements: short input-edge buffering/focus, viewport sizing, immediate last-enemy door opening, and stronger composition variation between 17/42. Verification driver corrections handled actual door arrival and stale target positions. All time is included in elapsed time. There were no worker remediation cycles.
- **Isolation:** no implementation, assets, notes, test outputs or browser state from another run were inspected or reused. `docs/`, skills and other repository files stayed read-only. No push, publication, deployment or dependency installation occurred.
- **Open defects:** no known functional blocker remains. A1/A8 evidence gaps and the browser environment deviation remain unresolved. Touch input, a human balance study, and independent/blind evaluation were outside this run.
- **Cleanup:** The Solo browser tab was closed and its owned server stopped after verification, releasing resources before the Sequential condition. Relaunch using README instructions.

Subjective scores are separate from acceptance outcomes. Reviewer: the sole
implementing agent; treatment known; no blind or independent reviewer. Ratings
are provisional from a tap-input walkthrough and do not establish held-input
feel or audible quality.

| Dimension | Score (1–5) | Basis |
| --- | ---: | --- |
| Control responsiveness | 3 | Tap edges and aim work; held-input feel unverified |
| Combat readability | 4 | Shape and text cues, distinct warnings and shield; small Canvas text at short viewport heights |
| Upgrade choice quality | 3 | Four clear material effects; mainly immediate power versus survival decisions |
| Run-to-run variety | 3 | Layouts, compositions, positions and offers differ; route stays linear |
| Overall coherence | 4 | Complete five-room flow, consistent art, working end states and reset |
