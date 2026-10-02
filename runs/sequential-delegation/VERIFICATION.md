# Sequential Delegation run 2 verification

The game is implemented in this fresh worktree. Exactly two specialists performed sequential implementation stages, and the lead reviewed and accepted each actual source handoff before the browser walkthrough. All 35 dependency-free Node tests pass. Final acceptance is conservative: the available browser automation could not hold keyboard input, so the complete interactive walkthrough remains incomplete. No model calls or forced health, enemy, room, reward, or phase changes were used as browser evidence.

## A1–A8 acceptance record

Each row uses exactly one protocol Evidence label. Partial browser observations are described separately and do not upgrade an entire check to browser verified.

| Check | Outcome | Evidence | Evidence and limitation |
| --- | --- | --- | --- |
| A1 — Launch and controls | INCOMPLETE | automated only | The documented Python launch served the game; browser menu, seed field, Start, HUD, mouse aim, and primary-button drag triggering an attack cooldown were observed. Input/model tests pass for WASD/arrows, diagonal normalization, Space/primary-held sampling, scale and release. The browser tool cannot sustain keys; its documented key taps produced no observable movement or Space attack. Full WASD/arrows/diagonal/Space/hit behavior in the browser was not exercised. |
| A2 — Run states | INCOMPLETE | automated only | Menu Start and clean initial/reloaded state were observed. Core tests cover zero-health Game Over, boss Victory, both state API resets, menu return, and all health/upgrades/rooms/encounters/hazards reset fields. End-screen UI callbacks were inspected. Ordinary browser play could not reach either end screen, so both end-screen buttons and fresh resets after earned upgrades remain unexercised. |
| A3 — Dungeon | PASS | automated only | Tests establish safe start + three combat rooms + boss, symmetric connected route, corridor clearance, both exits locked with hostiles and open after clear, paused rewards, and 996 reachable spawn paths across 100 seeds. Both documented seeds complete ordinary-model-input full runs. The browser shows five route marks and the safe open start. Combat-door attempts and opening were not observed through browser traversal. |
| A4 — Enemies and combat | INCOMPLETE | automated only | Tests demonstrate melee pursuit/strike, aimed ranged warning/bolt, distinct elite charge, player/enemy damage, range/cooldown/obstruction, bounded health/protection, avoidability, and distinct hit/defeat events/effects. Renderer source and fixtures were reviewed. Running-browser combat silhouettes, warnings, damage/protection/defeat differentiation and actual hits were not fully observed. |
| A5 — Rewards | INCOMPLETE | automated only | Tests confirm two distinct choices at every clear, all four effect categories across each run, different material stat effects, persistence and reset, and ordinary-model-input selections through Victory. HUD and authoritative card/state wiring were reviewed. Actual browser reward screens, selecting three gifts, and visible/gameplay effects could not be exercised. |
| A6 — Boss and victory | INCOMPLETE | automated only | Model tests show a 240-HP boss alternating a five-bolt fan and three warned nova circles, successful evasion of both, nova damage when not evaded, and Victory upon defeat. Rendering fixtures use actual hazard positions and five fan directions. The boss's recognizable live warnings, evasion, defeat and Victory UI were not observed through browser play. |
| A7 — Variation and repeatability | PASS | automated only | `node signatures.mjs` generates 17 and 42 twice each and asserts repeatability plus different layouts, encounters and offers. Independent regeneration matches seed-signatures.json. Reloads in the running browser yielded equal same-seed isolated content copies and differences in all three categories. Browser seed labels/field were visible and menu selection updated the URL; every generated combat layout/offer was not visited visually. |
| A8 — Feedback and HUD | INCOMPLETE | automated only | Browser menu/start visibly show health, stats, room progress, safe/open status, upgrade placeholder and controls. HUD/renderer tests and event-linked distinct audio scheduling tests pass. Damage/protection/selected-gift feedback was not observed during live combat. No live audio capture or auditory observation was available, so no event cue is claimed heard. Sound remained enabled. |

No complete check is labeled browser verified. A3/A7 have adequate automated evidence for their data/mechanics criteria. The other checks retain INCOMPLETE because required interactive or auditory evidence is missing. No observed failing core assertion was left unresolved; this does not establish that all browser behavior is defect-free.

## Final commands and results

From this worktree's `game/`:

```sh
node --test
sha256sum -c evidence/stage1-manifest.sha256
for source_file in *.mjs tests/*.mjs; do node --check "$source_file" || exit; done
node signatures.mjs > evidence/stage1-signatures.json
cmp seed-signatures.json evidence/stage1-signatures.json
python3 -m http.server 8102 --bind 127.0.0.1
```

- Independent integrated Node run: 35 tests, 35 passed, 0 failed, 0 skipped; exit 0; 121.163851ms. The suite contains 26 core and nine presentation checks.
- Accepted Stage 1 source/test manifest: all twelve entries OK; Stage 2 changed no core file.
- All module syntax checks: exit 0.
- Signature artifact comparison: exact match, exit 0. Each signature command generates each seed twice.
- `git diff --check`: exit 0. Because all game files are new/untracked, a separate explicit whitespace scan also checked new HTML/CSS/module/test content and found no trailing whitespace.
- Server launch works at http://127.0.0.1:8102/?seed=17. Process session 85206 remains running for review; log is evidence/server.log. The server's request timestamps use America/Sao_Paulo.
- Browser console warn/error query returned an empty list after seed checks.
- See evidence/final-checks.txt, evidence/stage1-tests.txt, evidence/stage1-source.diff, evidence/stage2-source.diff and seed-signatures.json.

## Browser procedure and limitations

Requested provider/session: Chrome / 🧪 Delegated Rerun. `cua.createBrowserTab('chrome', ...)` failed with `Browser is not available: chrome`. Available providers were this chat's own Codex MCP Apps and Codex In-app Browser; no existing browser tabs or Solo browser state were inspected. A new empty in-app tab was created and the browser session named 🧪 Delegated Rerun. This is a substitute provider, not the assigned dedicated Chrome profile.

Actual browser user agent: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36`; viewport 1280 × 720, DPR 1. Browser.getVersion was not supported through raw CDP; no standalone-Chrome version equivalence is asserted.

After both source handoff reviews:

1. Opened seed 17 with the documented launch. Observed the menu, all control instructions, Start and HUD. Saved evidence/menu-seed17.jpg.
2. Clicked Enter the dungeon through ordinary UI. Live state was Playing with 100/100 HP, no gifts, room 1/5, safe cleared start and initialized encounters in the other rooms.
3. Attempted supported tab-scoped CDP held KeyD input. It was rejected: `This method is not supported through raw CDP. Use tab.cua.type(...) or tab.cua.keypress(...) instead.` No key-down was dispatched by the rejected command.
4. Tried the documented supported alternatives: native-wrapper `pressKey('d')`, then locator `press('ArrowRight')` and `press('Space')`. Player position remained x=92/y=300 and cooldown remained zero. These APIs provide taps rather than a sustained key-down/up interval. The full control/traversal procedure could not continue through ordinary movement. No hidden API, unrelated input mechanism, event injection, simulated model update, or forced state transition was substituted.
5. Ordinary primary-button drag inside the arena changed aim toward the pointer and produced a nonzero attack cooldown (0.1616667s observed after the drag), confirming partial pointer/attack input. Saved evidence/playing-seed17.jpg. No enemy hit was claimed from the safe start.
6. Reloaded seed 17 and loaded/reloaded seed 42. Read-only `window.dungeonSnapshot()` returns an isolated clone and provides no commands/setters. Browser-generated content copies repeat for each seed and differ in layouts, encounter composition and offers. Saved evidence/menu-seed42.jpg and evidence/browser-seed-comparison.json.
7. Edited the menu field from 42 to 17 and clicked Start. Seed label/URL changed to 17 and Playing initialized at base health/stats/room state. Reloaded to the seed-17 menu, kept Sound on, and marked the tab as the deliverable. Saved evidence/final-menu-seed17.jpg.

Evidence/browser-observations.json records timestamps and isolated live snapshots. These observations are not classified as a complete browser walkthrough. The lack of a supported sustained-key method prevents verification of real held-key behavior here; tap results alone do not establish a game defect. Live audible cues were not observed.

## Seed reproduction

| Seed | Combat layouts | Encounter types by combat room | Reward pairs |
| --- | --- | --- | --- |
| 17 | barricades-mirror / split-hall / barricades-mirror | melee+ranged+ranged / elite+melee / elite+ranged+melee | survival/cadence / damage/movement / movement/cadence |
| 42 | barricades / split-hall / barricades-mirror | melee+ranged+ranged / elite+melee+ranged / elite+ranged+melee | damage/survival / cadence/movement / survival/cadence |

Start the loopback server from game/, load the documented URL or enter either seed in the menu, and run `node signatures.mjs` to reproduce full definitions and SHA-256 values. Model combat does not mutate generated definitions.

## Reviewer, ratings, defects and comparability

The lead reviewer knew this was Sequential Delegation. No blinded rating is claimed. Acceptance outcomes above are separate from subjective ratings.

| Subjective dimension (1–5) | Rating | Reason |
| --- | --- | --- |
| Control responsiveness | Not rated | Sustained browser movement unavailable. |
| Combat readability | Not rated | Live combat walkthrough could not be reached. |
| Upgrade choice quality | Not rated | No live selection/play comparison. |
| Run-to-run variety | Not rated | Data variation verified; experiential variety not played. |
| Overall coherence | Not rated | Menu/start/HUD observed, complete run not played. |

No unresolved automated assertion or actionable source-review blocker was found. Remaining risks are unverified interactive controls, live combat/readability, reward/end buttons, audible audio output, and subjective balance. No production/test dependency was added.

Implementation treatment conditions were met: frozen source/input checksums, fresh empty game/ worktree, exactly two distinct inherited-setting specialists, sequential implementation, reviewed handoffs, shared skills, dependency-free plan, no lead-authored game features, and no Solo inspection/reuse. Deviations: assigned Chrome profile unavailable; in-app substitute used; supported input could not perform the full shared browser procedure; no audible observation; subjective ratings therefore omitted. Browser/provider parity and full acceptance-procedure parity are not met, so this run must not be treated as an unqualified comparable completion against the frozen experiment protocol.

Timing, source settings, detailed ownership, handoff reviews, and final repository state are recorded in RUN_RECORD.md.
