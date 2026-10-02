---
name: seeded-dungeon-generation
description: Design or implement seeded procedural dungeons with connected rooms, varied encounters, and reproducible rewards.
---

# Seeded Dungeon Generation

Use this skill when designing or implementing procedural room layouts, encounter placement, or seeded dungeon variation.

- Start from the required room types, route constraints, and progression rules in the specification.
- Generate a traversable route from the starting room to the required ending room. Check that every required room is reachable and that optional branches do not strand the player.
- Use the supplied seed as the source of procedural choices. The same seed and inputs must reproduce the same layout, encounter composition, and reward offers.
- Ensure the supported seed space can produce meaningful differences in layouts, encounters, and rewards. Use documented examples to demonstrate those differences.
- Keep generation within the existing project architecture. Avoid adding a general-purpose generator when a small graph or room-pool approach meets the requirements.
- Make room-clear and exit-lock rules explicit so generation cannot create a route that remains blocked by missing or unreachable enemies.

When implementing, expose seed input through the project's established configuration or development interface and document it. Report the seed examples and any generation limits.
