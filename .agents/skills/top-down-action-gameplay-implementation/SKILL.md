---
name: top-down-action-gameplay-implementation
description: Implement or debug the player movement, attacks, health, damage, and state transitions in a 2D top-down action game.
---

# Top-Down Action Gameplay Implementation

Use this skill for code work on a 2D top-down action game's core player and combat loop. For design-only work, use the relevant design guidance without introducing an implementation plan.

- Inspect the existing engine, input model, update loop, collision behavior, and project conventions before changing code. Reuse the current stack and avoid unnecessary dependencies.
- Keep movement consistent across frame rates and prevent faster diagonal movement when movement is unrestricted.
- Define how an attack targets, applies damage, and gives feedback. Prevent one continuous overlap from producing unintended repeated damage.
- Keep current health within its valid range, handle defeat once, and make temporary invulnerability behavior explicit.
- Ensure game-state transitions stop incompatible input and that starting a fresh run resets all run-specific state.
- Implement only the mechanics required by the request. Keep numerical values configurable where the project already supports that pattern; don't invent a framework to tune a few constants.

Verify the changed interactions with the project's existing checks or a focused in-game check when appropriate, and report any behavior that remains unverified.
