# Dungeon Escape - Game Specification

## 1. Game Overview

## Title

Dungeon Escape

## Genre

2D Top-Down Roguelite Action Game

## Game Concept

Dungeon Escape is a single-player action roguelite where the player explores a dangerous dungeon composed of interconnected rooms, defeats enemies, collects temporary upgrades, and attempts to defeat the final guardian to escape.

Each playthrough should provide a slightly different experience through randomized dungeon layouts, enemy encounters, and upgrade choices.

The game should focus on:

- Responsive controls.
- Simple but engaging combat.
- Meaningful progression during each run.
- Replayability through procedural variation.
- Clear visual and gameplay feedback.

---

# 2. Core Gameplay Loop

The player experience should follow this loop:

1. Start a new dungeon run.
2. Enter the dungeon.
3. Explore rooms.
4. Encounter enemies.
5. Defeat enemies using combat mechanics.
6. Receive rewards and upgrades.
7. Continue exploring deeper areas.
8. Reach the final encounter.
9. Defeat the boss.
10. Complete the run.

If the player loses all health:

- The run ends.
- The player returns to the initial state.
- A new run can be started.

---

# 3. Player Character

## Overview

The player controls a character exploring the dungeon and fighting enemies.

The player should feel responsive and predictable, allowing precise movement and combat decisions.

---

## Movement

The player must be able to:

- Move freely in multiple directions.
- Navigate dungeon rooms.
- Avoid enemy attacks.
- Position strategically during combat.

Movement should feel responsive, with minimal input delay.

---

## Health System

The player has:

- Maximum health.
- Current health.

The player:

- Loses health when receiving damage.
- Cannot have health above the maximum value.
- Is defeated when health reaches zero.

The game should clearly communicate:

- Current health.
- Damage received.
- Death state.

---

## Player Attack

The player must have a basic attack ability.

The attack should:

- Damage enemies.
- Have a defined range or area.
- Have appropriate feedback.
- Support upgrades or modifications.

Examples of feedback:

- Attack animation.
- Visual effects.
- Sound effects.

---

## Damage and Invulnerability

When receiving damage:

- The player loses health.
- The player briefly becomes invulnerable.
- The player receives visual feedback.

This prevents continuous damage from a single interaction.

---

# 4. Combat System

## Overview

Combat is real-time and should require player positioning and decision-making.

The player should need to:

- Avoid attacks.
- Choose targets.
- Manage distance.
- Adapt to different enemy behaviors.

---

## Combat Requirements

The system must support:

- Player attacks.
- Enemy attacks.
- Damage calculation.
- Health reduction.
- Entity defeat.
- Combat feedback.

---

# 5. Enemy System

The dungeon contains multiple enemy types with different behaviors.

Enemies should:

- Exist inside dungeon rooms.
- Detect or react to the player.
- Attack the player.
- Receive damage.
- Be defeated.

---

# 6. Enemy Types

The game must include at least three enemy archetypes.

---

## 6.1 Melee Enemy

### Description

A close-range enemy focused on pursuing and attacking the player.

### Behavior

The enemy should:

- Detect the player.
- Move toward the player.
- Attack when within range.
- Deal contact or close-range damage.

### Gameplay Purpose

Creates pressure and forces the player to manage positioning.

---

## 6.2 Ranged Enemy

### Description

An enemy that attacks from distance.

### Behavior

The enemy should:

- Maintain distance from the player.
- Launch ranged attacks.
- Create areas of danger the player must avoid.

### Gameplay Purpose

Introduces a different combat challenge compared to melee enemies.

---

## 6.3 Elite Enemy

### Description

A stronger enemy variant that creates a higher difficulty encounter.

### Behavior

The elite enemy should have at least one difference from regular enemies:

Examples:

- More health.
- Higher damage.
- Faster movement.
- Unique attack behavior.
- Special ability.

### Gameplay Purpose

Creates memorable encounters and prepares the player for the boss.

---

# 7. Dungeon System

## Overview

The game takes place inside a dungeon composed of connected rooms.

The dungeon should feel different across multiple playthroughs.

---

## Dungeon Requirements

The dungeon must include:

- Starting area.
- Multiple exploration rooms.
- Enemy encounter rooms.
- Reward opportunities.
- Final boss room.

---

## Procedural Variation

The dungeon generation should provide variation between runs.

Possible approaches:

- Random room selection.
- Random room connections.
- Random encounter placement.
- Random reward placement.

The exact generation method is open.

---

# 8. Room System

Each room represents a gameplay area.

Rooms may contain:

- Enemies.
- Rewards.
- Obstacles.
- Special events.
- Boss encounters.

---

## Room Completion

A combat room should:

- Prevent progression while enemies remain.
- Allow progression after enemies are defeated.

The player should receive clear feedback about room state.

---

# 9. Progression System

## Overview

During each run, the player becomes stronger through temporary upgrades.

Progression should create meaningful choices.

---

## Upgrade System Requirements

The game must include:

- Multiple upgrade options.
- Different upgrade effects.
- Permanent effects during the current run.

Examples:

### Damage Upgrade

Effect:

- Increases attack damage.

---

### Speed Upgrade

Effect:

- Improves player movement speed.

---

### Health Upgrade

Effect:

- Increases maximum health.

---

### Attack Modifier

Effect:

- Changes attack behavior.

Examples:

- Additional projectile.
- Larger attack area.
- Faster attacks.

---

# 10. Reward System

The player should receive rewards during exploration.

Rewards may include:

- Character upgrades.
- Healing.
- Temporary advantages.
- Other gameplay improvements.

Rewards should encourage continued exploration.

---

# 11. Boss Encounter

## Overview

The dungeon ends with a final boss encounter.

The boss should represent the final challenge of the run.

---

## Boss Requirements

The boss must:

- Have significantly higher difficulty than regular enemies.
- Have a health system.
- Have unique behavior.
- Require the player to use learned mechanics.

---

## Victory Condition

The player wins when:

- The boss is defeated.

After victory:

- The game displays a completion state.

---

# 12. User Interface

The game must provide basic navigation and gameplay information.

---

## Main Menu

Required:

- Start new game option.

Optional:

- Settings.
- Exit option.

---

## Gameplay HUD

The HUD should display relevant information:

Required:

- Player health.

Recommended:

- Current upgrades.
- Progress information.

---

## Game States

The game must support:

## Playing

Normal gameplay state.

## Game Over

Displayed after player defeat.

Must allow restarting.

## Victory

Displayed after completing the dungeon.

---

# 13. Visual Direction

The game should have a coherent visual identity.

Requirements:

- Consistent art style.
- Clear distinction between:
  - player;
  - enemies;
  - attacks;
  - environment;
  - rewards.

Visual clarity is more important than graphical complexity.

---

# 14. Audio Direction

The game should include basic audio feedback.

Examples:

- Player attack.
- Enemy attack.
- Damage received.
- Enemy defeated.
- Victory.
- Defeat.

Audio should improve player feedback.

---

# 15. Completion Criteria

The game is considered complete when:

- The player can start a new run.
- The player can explore a dungeon.
- The player can fight enemies.
- The player can collect upgrades.
- The player can reach the final boss.
- The player can defeat the boss.
- The player can win or lose a complete run.
- The project can be executed following the provided documentation.

---

# 16. Technical Freedom

The implementation details are intentionally unspecified.

The development team may choose:

- Programming language.
- Game engine.
- Architecture.
- Project organization.
- Asset pipeline.
- Internal systems.

The final implementation should prioritize:

- Maintainability.
- Reliability.
- Clear structure.
- Complete gameplay experience.