# Agent Architecture Experiment Protocol

## Purpose

Compare a solo implementation with an implementation led by an agent who delegates to two specialists in sequence. The only treatment difference is who performs implementation and how the handoffs are managed. Product requirements, plan, verification, settings, and environment are shared.

## Frozen run conditions

- **Source revision:** start both worktrees from the same frozen protocol commit, whose parent is the clean project baseline `2c7e312d8d7dc4bf85de8cf69dafd5a859c2b7d3`. Record the frozen commit SHA in both run reports.
- **Worktree:** each run starts in its own worktree from that commit. Each starts with no `game/` directory. Do not transfer code, assets, notes, test output, or browser state between runs.
- **Project workspace:** both runs use `game/` at the repository root. All implementation files, generated output, and run-specific evidence stay inside that directory.
- **Prompt parity:** both task prompts use the identical `docs/prompts/shared-game-run.md` body. Their only instruction difference is the treatment section in `solo-agent.md` or `orchestrated-agent.md`. Browser session and port assignments below are isolation settings, not treatment instructions.
- **Model and reasoning:** `gpt-6.1-sol`, `xhigh`. Do not override these settings. The two specialists inherit the same model and reasoning settings in the delegated treatment.
- **Resource limit:** 90 minutes of elapsed time per run, starting when the run task begins. This includes planning, implementation, specialist work and waits, verification, and reporting. Record start/end times and stop at the limit.
- **Available design skills:** the same six repository skills are available to both runs: `game-brief-to-player-experience`, `seeded-dungeon-generation`, `top-down-action-gameplay-implementation`, `roguelite-progression-design`, `combat-and-encounter-design`, and `game-ux-readability`. Read and apply relevant guidance in both treatments.
- **Excluded skill:** do not load or invoke `orchestrated-development` in either run. The sequential treatment is defined only by its prompt below.
- **Environment and tools:** use the same local Linux host, installed runtimes, browser automation capabilities, permissions, and network access. Record versions and any deviation in both reports.
- **Run order:** run Solo first, then Sequential Delegation. Run one condition at a time to avoid competing for CPU, browser input, and usage limits. Do not inspect or reuse the first run's implementation when running the second.
- **Browser isolation:** use a separate named Chrome session/profile and loopback port for each run. These assignments isolate the runs; they do not change the game requirements.

| Treatment | Chrome session/profile | Server port |
| --- | --- | ---: |
| Solo | `🧪 Solo Rerun` | 8101 |
| Sequential Delegation | `🧪 Delegated Rerun` | 8102 |

### Frozen input checksums

These hashes identify the specification and treatment prompts. The frozen protocol commit also pins this protocol and the six skill files.

| Input | SHA-256 |
| --- | --- |
| `docs/specs/GAME_SPECIFICATION.md` | `39b81f2fee290781189c4d847c883d7d501aa1f6a8d55a5b44a00b81c194caaf` |
| `docs/prompts/shared-game-run.md` | `a118613f15fd1dc5c6a5c1d51673774bf24522b50ad84d828e55e331288f2d49` |
| `docs/prompts/solo-agent.md` | `29fd9f9b2e10f7fcadbbc3fb82adbec7d10624f19c1ba3526774639dac63f84c` |
| `docs/prompts/orchestrated-agent.md` | `93584de54e1ac86834aa82452f13aeb8cea87be159489fcbe29cdcf5e796c451` |

Record the frozen protocol commit SHA in both run reports instead of hashing this self-referential protocol file.

## Shared implementation plan

Both runs implement the same plan from `docs/specs/GAME_SPECIFICATION.md`:

1. Build a self-contained browser game using HTML Canvas, CSS, and JavaScript ES modules. Use procedural vector visuals and synthesized Web Audio. Add no production or test dependencies; use the built-in Python static server and Node test runner.
2. Keep the implementation in focused modules for seeded dungeon generation, game state and combat, rendering and input, and audio. Document setup, controls, launch, seeds, and verification in `game/README.md` and `game/VERIFICATION.md`.
3. Add a menu seed field and support `?seed=<unsigned 32-bit integer>`. Precompute layouts, encounters, and all reward offers from a seeded generator. Use seeds `17` and `42`; repeating a seed must reproduce the same generated content, and the pair must differ in layouts, encounters, and offers.
4. Generate a connected route with a safe start, three combat rooms, and a final boss room. Vary room layouts and encounters by seed. Lock combat-room exits until all enemies are defeated, then open them and present two distinct upgrade choices.
5. Implement normalized WASD/arrow movement, mouse aiming, and attacks with Space or the primary mouse button. Track health, enforce its bounds, and grant temporary invulnerability after damage.
6. Include melee pursuers, telegraphed ranged attackers, and elites with a distinct attack. Give the boss at least two recognizable patterns, including a telegraphed area attack. Attacks must be avoidable through movement or positioning.
7. Provide at least four materially different run upgrades covering damage, attack cadence, movement, and survival. Apply and display selected upgrades, preserve them through the run, and reset them with health and room progress on a fresh run.
8. Implement Main Menu, Playing, Game Over, and Victory states. Both end states offer restart and return-to-menu actions. The HUD shows health, upgrades, room progress, and active/cleared status. Provide distinguishable damage, defeat, and invulnerability feedback and at least two event-linked audio cues unlocked after a user gesture.
9. Add dependency-free Node tests for seed repeatability and variation, route shape and connectivity, room locks, reward choices and effects, state/reset behavior, and enemy/boss mechanics. Run `node --test` from `game/`.

The implementation plan sets a consistent scope beyond the minimums in the game specification. Both treatments receive these same requirements.

## Shared acceptance checklist

Record two fields for every check: **Outcome** (`PASS`, `FAIL`, or `INCOMPLETE`) and **Evidence** (exactly one of `browser verified`, `automated only`, or `not verified`). Add concise evidence and any limitation.

| Check | Acceptance criteria |
| --- | --- |
| **A1 — Launch and controls** | The documented Linux launch works. In the browser, the player moves with WASD and arrow keys and attacks with Space and the primary mouse button using the documented aim behavior. |
| **A2 — Run states** | The menu starts a run; zero health reaches Game Over; defeating the boss reaches Victory. Both end screens support a fresh run and a return to the menu. A fresh run resets health, upgrades, rooms, and encounters. |
| **A3 — Dungeon** | The route contains a start, three connected combat rooms, and a boss room. Combat exits remain blocked while hostiles live and open after the room is cleared. |
| **A4 — Enemies and combat** | Melee, ranged, and elite behaviors match the specification. Player and enemy attacks deal damage, enemy attacks are avoidable, and damage, defeat, and invulnerability feedback are distinguishable. |
| **A5 — Rewards** | Every combat-room selection offers two different choices. At least four effects covering damage, cadence, movement, and survival appear across the run. A selected effect applies and persists, and a fresh run resets it. |
| **A6 — Boss and victory** | The boss has health and at least two recognizable attack patterns, including a distinct telegraphed attack. Defeating it completes the run and reaches Victory. |
| **A7 — Variation and repeatability** | Seeds 17 and 42 differ in layouts, encounters, and offers. Repeating either seed reproduces its layout, encounter composition, and reward offers. |
| **A8 — Feedback and HUD** | Health, upgrades, room progress, and active/cleared state are visible and understandable. At least two distinct audio cues are heard for their corresponding gameplay events after a user gesture. |

### Evidence labels

- **browser verified:** every part of the check was exercised in the running browser, manually or through browser automation, and the expected result was observed. For audio, the event cue must be audible.
- **automated only:** unit, model, or non-UI integration checks support the criterion, but the complete browser behavior was not observed. Note any partial browser observations separately in the evidence text.
- **not verified:** neither browser evidence nor adequate automated evidence supports the criterion.

Tests written by a run can support `automated only`; they do not by themselves establish `browser verified`. Use `INCOMPLETE` when a defect or missing evidence prevents a pass. Never use a different evidence label for either run.

## Shared browser test procedure

Use the treatment's assigned Chrome session and port. From `game/`, launch:

```sh
python3 -m http.server <assigned-port> --bind 127.0.0.1
```

Open `http://127.0.0.1:<assigned-port>/?seed=17`. Keep sound enabled and record observable results in `game/VERIFICATION.md`. Use the same procedure in both runs.

1. **Launch and controls (A1):** Confirm the menu and documented controls. Start seed 17. Hold WASD, then arrow keys, long enough to observe movement; test diagonal normalization. Aim with the mouse and attack with Space, then attack with the primary mouse button. Confirm hits and visible attack feedback.
2. **Dungeon and enemies (A3, A4):** Traverse the route. In each combat room, attempt the exit while a hostile remains and confirm it is blocked. Observe and fight melee, ranged, and elite enemies, including their cues. Confirm a cleared room opens its exit. Observe player damage, invulnerability feedback, and enemy defeat feedback.
3. **Rewards and reset (A5, A2):** Clear each combat room. Confirm two different choices appear, select upgrades from different effect categories, and verify their HUD entries and gameplay effects. Start a fresh run and confirm health, upgrades, room progress, and encounters reset.
4. **Game Over (A2):** In a separate run, allow health to reach zero. Confirm Game Over, then exercise both fresh-run and menu actions and verify the fresh-run reset.
5. **Boss and Victory (A6, A2):** Clear the route, observe both boss patterns and their warnings, evade at least one of each, attack the boss to defeat it, and confirm Victory. Exercise both Victory actions.
6. **HUD and audio (A8):** During the browser walkthrough, confirm health, upgrades, room progress, and active/cleared room state. After starting the run from a user gesture, listen for at least two event-linked cues, such as attack and damage.
7. **Seeds (A7):** Reload seed 17 and seed 42 in the assigned browser session. Run the same-seed automated signature checks twice for each seed and compare the documented layout, encounters, and offers. Compare the two seeds for all three types of variation.

Use browser automation capable of holding and releasing keys, or manual browser input, for the interactive checks. If the available browser tool cannot sustain input, try one reasonable supported alternative. Do not classify unit tests or simulated model calls as browser verification. Record the limitation and use `automated only` or `not verified` as defined above.

## Evaluation and run record

Evaluate both workspaces with this checklist and browser procedure, the same commands, seeds, environment, and reviewer. Where practical, hide the treatment labels during subjective ratings. Keep acceptance outcomes separate from subjective 1–5 ratings for control responsiveness, combat readability, upgrade choice quality, run-to-run variety, and overall coherence. Record whether a reviewer knew the treatment.

For each run, record:

- Treatment, run order, source commit, specification and prompt checksums.
- Model/reasoning setting, environment, tools, permissions, network, and runtime versions.
- Start/end time, actual elapsed time, and any interruption or limit hit.
- Specialist count, task ownership, handoff order, rework cycles, and lead-authored code with reasons.
- A1–A8 outcome and evidence label, commands and results, launch and seed reproduction, critical defects, reviewer ratings, deviations, and comparability.
