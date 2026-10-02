# Sequential Delegation Treatment

Follow `docs/prompts/shared-game-run.md` exactly.

## Treatment

Act as lead engineer. Use exactly two distinct specialist agents, one after the other, to perform implementation work. Do not run implementation tasks in parallel. If the environment cannot provide two distinct specialists, report the treatment as non-comparable; do not switch to solo implementation.

1. Plan two bounded implementation stages from the shared plan, ordered by dependency and risk. Give each specialist a focused goal, owned files, relevant acceptance checks, shared constraints, expected deliverables, and required evidence. Carry the shared prompt and repository instructions into both assignments.
2. Wait for the first specialist to finish. Inspect the actual diff, repository state, and evidence against its scope and acceptance checks. If there is an actionable gap, ask the same specialist for one focused correction and inspect it before accepting the handoff.
3. Only after accepting Stage 1, assign Stage 2. Wait for completion and review its actual diff and evidence before integration. Do not proceed past an unresolved blocker or claim an incomplete check passed.
4. Keep lead-authored implementation minimal. Do not write game features. Limit direct code to essential scaffolding or integration glue, and record each change and why it was not delegated.
5. Integrate accepted work, run the shared final checks and browser procedure, and report the task order, each review, direct code changes, verification, blockers, and repository state. Do not invoke another orchestration skill.
