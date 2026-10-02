# Game agent architecture experiment

This repository compares a solo engineer with a lead agent that assigns two
specialists sequentially and reviews each handoff. The controlled runs share
a frozen specification, implementation plan, acceptance checklist, skills,
model/reasoning settings, and a 90-minute limit.

## Saved implementations

| Implementation | Location | Launch documentation |
| --- | --- | --- |
| Controlled Solo run | `runs/solo/` | [Solo README](runs/solo/README.md) |
| Controlled Sequential Delegation run | `runs/sequential-delegation/` | [Delegated README](runs/sequential-delegation/README.md) |
| Earlier Solo implementation | `solo-agent/` | [Earlier README](solo-agent/README.md) |

Both controlled games use Canvas, JavaScript modules, CSS, and synthesized Web
Audio, with no package installation required. From the repository root, launch
each in a separate terminal:

```sh
cd runs/solo
python3 -m http.server 8101 --bind 127.0.0.1
```

```sh
cd runs/sequential-delegation
python3 -m http.server 8102 --bind 127.0.0.1
```

Open [Solo, seed 17](http://127.0.0.1:8101/?seed=17) and
[Sequential Delegation, seed 17](http://127.0.0.1:8102/?seed=17). Both also
support seed 42 and a menu seed field. Each game's README documents controls,
tests, and seed reproduction.

## Protocol and run evidence

- [Frozen experiment protocol](docs/EXPERIMENT_PROTOCOL.md).
- [Game specification](docs/specs/GAME_SPECIFICATION.md).
- [Shared run instructions](docs/prompts/shared-game-run.md).
- [Solo treatment](docs/prompts/solo-agent.md).
- [Sequential treatment](docs/prompts/orchestrated-agent.md).
- [Solo verification](runs/solo/VERIFICATION.md) and [run record](runs/solo/RUN.json).
- [Delegated verification](runs/sequential-delegation/VERIFICATION.md) and
  [run record](runs/sequential-delegation/RUN_RECORD.md).

The controlled outputs originally lived in separate worktrees under `game/`,
starting at `c1d131aa5d471434e857fd73042351a05157d72c`. They are preserved here
under separate run directories. Runtime code, tests, and saved evidence were
copied unchanged; the game READMEs were updated for their repository locations.
Original run records, handoff diffs, manifests, and verification notes retain
their historical paths, timestamps, and outcomes.
