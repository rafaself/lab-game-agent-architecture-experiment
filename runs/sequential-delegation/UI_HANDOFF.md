# Stage 2 presentation handoff

Specialist 2 implemented this stage after the lead accepted Stage 1 at 06:25:24 UTC. Stage 2 began reading the assigned fresh worktree at 06:26:42 UTC; implementation and checks completed at approximately 06:42 UTC. Model/reasoning settings were inherited without override. All frozen shared/treatment/protocol/specification documents, the six repository game skills, and `CORE_HANDOFF.md` were read. No dependencies, other run, browser session, external service, push, publication, or files outside `game/` were used. No agents were spawned. Stage 1 core files and tests were preserved.

## Owned files

- `index.html`: menu, seed form, live HUD, arena, rewards, Game Over/Victory panels, both end-screen actions, sound control, control instructions.
- `styles.css`: responsive dark/gold/teal presentation, readable cards and indicators, keyboard focus, reduced-motion preference.
- `input.mjs`: WASD/arrows, held Space/primary click, scaled pointer conversion, editable-control handling, held-state release on blur/cancel/screen changes.
- `audio.mjs`: gesture-unlocked, event-linked synthesized Web Audio and mute control.
- `renderer.mjs`: procedural room/door/obstacle art, four distinct enemy silhouettes, aimed player blade/slash, actual model warnings, bolts, health bars, damage/protection/defeat effects, boss health.
- `ui.mjs`: live model-derived HUD, stacked gift chips, route progress, reward buttons, model-state screens and notices.
- `presentation.mjs`: frame integration; samples input, updates model, clears held state on screen transitions, drains events exactly once, sends the same event batch to audio and UI, renders.
- `main.mjs`: menu and end action callbacks using the accepted core API; DPR canvas setup, URL seed support, one RAF loop, visibility release, isolated read-only snapshot.
- `tests/presentation.test.mjs`: nine focused presentation/input/audio integration checks.
- `README.md`: Linux launch, controls/aim, rules, combat cues, seeds 17/42, gift effects, commands and browser verification procedure.
- `UI_HANDOFF.md`: this evidence and contract.

The lead retains ownership of `RUN_RECORD.md`, final `VERIFICATION.md`, and `evidence/`; this stage did not edit them.

## Integration choices

The model remains the sole authority for movement normalization, damage, locks, rewards, state transitions, and reset. UI callbacks call `startRun`, `returnToMenu`, or `chooseReward`; no duplicated transition or combat rules were added. A reward is a paused `playing` substate. Both end screens provide Fresh run (same seed) and Main menu. Menu starts update the URL with the chosen unsigned 32-bit seed; invalid URL seeds use the existing parser's fallback of 17. Invalid out-of-range menu seeds receive a visible error.

The world is rendered at 960×600, with a capped DPR backing store and CSS aspect-ratio scaling. Input converts the displayed canvas rectangle to world coordinates. Mouse aim retains the last in-arena pointer; without a pointer, the model's initial east aim remains. Holding Space or primary click repeats the model's attack cadence. Movement/attack release on blur, pointer cancellation, hidden document, and screen changes. Clicking Sound during play returns keyboard focus to the arena.

Triangles identify melee, violet diamonds with an eye/bow identify ranged, horned gold hexagons identify elites, and a larger crowned hexagon identifies the Warden. Gold circles show the actual 48px melee strike; aimed lines use locked model origins/angles; the elite lane uses its 221px charge range; fan warnings show all five projectile directions. Nova warning circles use each live hazard's actual clamped position/radius, with progress from its timer. The player has a pale aim blade, visible 108px slash, red damage flash/border, dashed pulsing teal protection, and a separate defeat burst. Projectiles and individual/large boss health are visible.

The HUD displays current/max health, protection, room number/name, live hostile count and lock/clear status, route marks, damage/cooldown/speed, and selected upgrades with stacks. Reward cards use authoritative names/effects from `UPGRADES`. Audio schedules distinct attack, damage, enemy defeat, enemy warning, clear, upgrade, and end cues after a user gesture. It consumes the drained event queue once per frame; no periodic or polling-generated gameplay cues exist. The sound button honors mute, and the game remains visually readable with audio disabled.

`window.dungeonSnapshot()` returns a structured clone of live phase, seed/time, player, room index, pending offers, definitions, runtime rooms, and effects. It is an observation aid, with no commands or setters and no live object reference. No cheat or automatic-play feature was added.

## Commands and observed evidence

All commands used the assigned fresh worktree explicitly. From `game/`:

```sh
node --test
for source_file in *.mjs tests/*.mjs; do node --check "$source_file" || exit; done
```

At 06:41:13 UTC: **35 tests, 35 pass, 0 fail, 0 skipped**, exit 0; Node runner duration **154.302434ms**. All 26 accepted core tests still pass. The nine new tests cover pointer scaling/outside rejection; shared keyboard/mouse inputs; held-state/form handling; actual model diagonal normalization; once-only event draining and screen release; HUD data; fixed warning fields and fan directions; nova circle rendering plus archetype fixtures without state mutation; gesture-gated distinct audio scheduling and mute. Syntax checks exited 0 for every source and test module.

From the fresh worktree root:

```sh
git diff --check
git status --short
```

Whitespace check exited 0. Repository status remains `?? game/`; no tracked changes or output outside the assigned directory. This stage adds only the listed presentation files and test. The final sound-button focus change and wording correction are reviewed source edits after the first complete pass; the lead should include them in final checks.

## Acceptance evidence and limitations

No browser interaction was performed during Stage 2, preserving the required source-review-before-final-walkthrough order. The requested Chrome provider was unavailable according to the lead; the lead prepared the isolated in-app browser alternative. Stage 2 records browser checks as **pending** and makes no `browser verified` claim. Audio tests prove scheduling and distinguishable tone definitions, not audible output.

- A1 presentation/control integration: adequate **automated only** support, with documented launch and browser controls pending.
- A2 screens/actions: implemented against accepted state APIs; core automated state/reset checks pass. Actual menu, reward, and both end-screen buttons remain browser pending.
- A3–A7: preserved Stage 1 automated support; renderer/HUD/choices expose those states for the final walkthrough.
- A8 HUD/feedback/audio: adequate **automated only** support for live HUD derivation, rendering calls, and cue scheduling; actual readability and audible event cues remain browser pending.

The lead owns final Outcome/Evidence fields and must apply the protocol's exact labels. No known implementation blocker at handoff. Visual polish, real-browser focus/control behavior, audibility, and balance remain unverified until the lead's walkthrough. Browser input must remain ordinary player input; do not use the snapshot to alter health, enemies, room progress, or transitions.
