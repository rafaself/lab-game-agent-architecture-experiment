# Verification Record

## Run conditions

- Treatment: solo implementation; 0 coding agents or external implementation collaborators.
- Baseline repository revision: `2c7e312d8d7dc4bf85de8cf69dafd5a859c2b7d3` (`main`; clean before implementation).
- Specification SHA-256: `39b81f2fee290781189c4d847c883d7d501aa1f6a8d55a5b44a00b81c194caaf`.
- Solo prompt SHA-256: `b28194e24c7f125c558cdfc87464b313e2bf1523eaf809f5ef9ebb09f4794110`.
- Orchestrated prompt SHA-256: `b83253168e5de96bc1f8ac4ac4cc6932e5cbb8c9e4d0c0030826225c079ec691`.
- Environment: Linux `7.2.7-100.fc43.x86_64`; Node.js `v25.9.0`; Python `3.14.7`; Google Chrome `154.0.8037.57` and Firefox `156.0` are installed.
- Browser interaction: the Codex in-app browser loaded the local game at `http://127.0.0.1:8000/?seed=17`. Its available input actions did not provide a sustained held-key sequence; movement could not be confirmed visually there.
- Dependencies: none added; runtime uses browser APIs, and tests use Node's built-in test runner.
- Model/settings: GPT-6 family as identified by the runtime; exact model variant and reasoning setting were not exposed to this task.
- Resource limit: 90 minutes, as selected before implementation. The run completed within the limit; precise elapsed usage was not separately metered.
- Verification date: 2026-10-01 (America/Sao_Paulo).

## Commands and browser run

- Started the documented static server from this directory with `python3 -m http.server 8000 --bind 127.0.0.1`. It served the game successfully.
- Opened `http://127.0.0.1:8000/?seed=17` in the in-app browser. The menu showed seed `17`; clicking **Start run** reached the live game HUD with 8/8 health, room 1 of 5, cleared start room, no relics, and seed `17`.
- Checked the browser console for errors after launch; none were reported.
- Ran `node --test` from this directory after implementation: **18 tests passed, 0 failed**.
- Model-level controls and combat tests exercise held movement, normalized diagonal speed, aimed attacks, attacks by each enemy role, room-gate traversal, boss attacks, and end-state transitions. The in-app browser interface could not hold a movement key long enough to manually traverse and fight through a complete run, so checks that require that full interactive session are explicitly marked below.

## Acceptance checks

| Check | Result | Evidence and limitation |
| --- | --- | --- |
| **A1 — Launch and controls** | **NOT VERIFIED** | The documented Python server launched and the browser reached the menu and a seeded live run. `node --test` confirms the game model responds to held movement and aimed attacks. A sustained keyboard-and-mouse play sequence was not confirmed in the browser because the available browser controls only send short key presses. |
| **A2 — Run states** | **NOT VERIFIED** | Tests verify zero health enters Game Over, reducing the boss to zero enters Victory, and `startRun()` restores health/relics/room progress. The page contains Run Again and Main Menu actions for both end states; those end-state UI buttons were not manually exercised in the browser. |
| **A3 — Dungeon** | **PASS — automated** | Tests verify a five-room start → three combat → boss route, traversal through an open gate, blocked combat exits, and exits opening on room clear. |
| **A4 — Enemies and combat** | **NOT VERIFIED** | Tests verify melee windup and damage, ranged aim and projectile damage, elite charge warning and lane damage, aimed player damage, and invulnerability. Rendering code supplies role colors/shapes and attack warnings, but a live browser fight was not manually completed to verify those cues in play. |
| **A5 — Rewards** | **PASS — automated** | Tests verify three reward events with two distinct options each, all four different effects appearing per run, selected effects changing player stats, and a fresh run clearing upgrades. |
| **A6 — Boss and victory** | **PASS — automated** | Tests verify the boss charge and radial projectile patterns, and that a boss defeat transitions to Victory. A full boss fight was not manually completed in the browser. |
| **A7 — Variation and repeatability** | **PASS** | Repeating seed `17` produces the same generation signature. Seeds `17` and `42` differ in combat layouts, encounter composition, and event-level relic pairings; both outputs are listed in `README.md`. |
| **A8 — Feedback and HUD** | **NOT VERIFIED** | The browser HUD visibly showed health, room progress/state, upgrade list, and seed. Node tests verify distinct Web Audio attack and damage tones are scheduled after activation and can be muted. Actual audible playback and in-combat visual feedback were not confirmed during a live browser fight. |

## Test suite coverage

The 18 Node tests cover seed validation and deterministic signatures; required route types; guaranteed enemy archetypes; offer count and effect diversity; differences between the two documented seeds; upgrade effects; health clamping and invulnerability; door lock/open rules; gate traversal; fresh-run reset; boss pattern cycling and Victory; Game Over; movement normalization; targeted attack hits; melee/ranged/elite behavior; and distinct, muteable Web Audio cues.

No critical defect was found by the automated checks. Upgrade and enemy values are initial tuning; balance was not established through extended play. The unverified portions above are limited to sustained browser input and live audiovisual play-through, not to the corresponding model-level mechanics.
