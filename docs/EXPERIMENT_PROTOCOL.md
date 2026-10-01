# Agent Architecture Experiment Protocol

## Purpose

Compare a solo implementation workflow with a lead engineer coordinating specialist agents. The game specification and all non-treatment conditions should be the same. Record deviations instead of treating an altered run as directly comparable.

## Conditions to hold constant

Before either run, record and freeze:

- Repository revision and the exact versions or checksums of the specification and prompts.
- Model/version and reasoning setting.
- Available tools, permissions, network access, and execution environment.
- A resource limit, such as elapsed time or token budget, selected before the runs.
- The evaluator, acceptance checklist, seed values, and review procedure.

Start each run from the same clean revision in a separate, empty project workspace. Do not transfer code, assets, notes, or other outputs between runs. Keep dependency and cache conditions the same where practical; record any differences.

Use the same specification and identical shared prompt text. The intended treatment difference is solo implementation versus sequential specialist implementation with minimal direct code changes by the lead. Do not give one run additional product requirements or a different quality bar.

## Run procedure

1. Record the frozen conditions above.
2. Run each prompt in its named workspace from the same starting revision.
3. Allow the solo run no coding agents or external implementation collaborators.
4. Require the orchestrated run to use at least two distinct specialist agents, one active task at a time. The lead must delegate implementation and keep direct code changes minimal. If the runtime cannot support two specialists, record the deviation and mark the run non-comparable.
5. Apply the same preselected resource limit to both runs. Record interruptions, approvals, unavailable tools, and other deviations.
6. Evaluate both completed workspaces using the same commands, acceptance checklist, Linux environment, and two test seeds from the specification.

## Evaluation

Report separate results rather than collapsing them into one score:

- Acceptance checks passed, failed, or not verified, with evidence for each.
- Documented launch and seed-reproduction results.
- Build, test, and other verification commands, including failures and commands not run.
- Critical defects found during the same review process.
- Elapsed time and available token or resource use.
- Number of specialist agents used and their task areas.
- Delegation order and task completion/rework cycles.
- Lead-authored code changes, with files, approximate lines, and reasons.
- Any deviations from the frozen conditions.

Use the same reviewers for both builds and, where practical, hide which workflow produced each build. Rate these dimensions separately on a 1–5 scale: control responsiveness, combat readability, upgrade choice quality, run-to-run variety, and overall coherence. A score of 1 means missing or unusable; 3 means functional with noticeable weaknesses; 5 means clear and consistently strong. Scores of 2 and 4 are intermediate. Freeze the rubric before reviewing either build. Keep subjective ratings separate from acceptance-check results and record whether reviewers knew the workflow.

## Results record

Use one record per run:

- Run ID and treatment:
- Repository revision:
- Prompt/specification revision or checksums:
- Model/version and reasoning setting:
- Environment, tools, permissions, and network:
- Resource limit and actual use:
- Specialist-agent count and task areas:
- Sequential task order and rework cycles:
- Lead-authored code changes and reasons:
- Acceptance checks: pass / fail / not verified, with evidence:
- Launch and seed-reproduction results:
- Verification commands and outcomes:
- Critical defects:
- Deviations and comparability:
- Reviewer ratings and whether the workflow was hidden:
