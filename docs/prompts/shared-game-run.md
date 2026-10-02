# Shared Game Build Prompt

Build the game in `docs/specs/GAME_SPECIFICATION.md` by following the implementation plan, acceptance checklist, and browser procedure in `docs/EXPERIMENT_PROTOCOL.md`.

## Workspace and constraints

- Work only in a new `game/` directory at the repository root. The directory starts empty. Keep source, tests, run documentation, screenshots, logs, and generated artifacts inside it.
- Treat `docs/`, `.agents/skills/`, and the rest of the repository as read-only. Do not transfer code, assets, notes, test output, or browser state from another run.
- Use the pinned run settings: `gpt-6.1-sol` with `xhigh` reasoning. Do not override them. Any worker in the delegated treatment inherits the same settings.
- Complete the run within the protocol's 90-minute elapsed-time limit. Record start and end times. If the limit expires, stop and report the remaining work.
- Use the same six repository design skills in `.agents/skills/`: `game-brief-to-player-experience`, `seeded-dungeon-generation`, `top-down-action-gameplay-implementation`, `roguelite-progression-design`, `combat-and-encounter-design`, and `game-ux-readability`. Read and apply relevant guidance.
- Do not load or invoke `orchestrated-development` or unrelated skills.
- Do not add production or test dependencies. Do not push, publish, deploy, or modify anything outside `game/`.
- Do not ask the user to perform implementation work. Do not report an acceptance check as complete without evidence.

## Delivery

Implement and document the complete game, run `node --test`, launch it using the assigned session and port in the protocol, and follow the shared browser procedure. In `game/VERIFICATION.md`, record every A1–A8 Outcome and its exact Evidence label from the protocol, plus commands, observed evidence, and limitations. State any deviation from the frozen run conditions.
