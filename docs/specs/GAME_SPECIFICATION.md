# Dungeon Escape: Game Specification

## 1. Purpose

Build a complete, single-player, 2D top-down roguelite action game for Linux. A run takes the player through connected dungeon rooms, combat encounters, run-scoped upgrades, and a final boss. Defeating the boss completes the escape.

The implementation may choose its language, engine, architecture, and asset pipeline. Requirements below describe observable behavior rather than implementation details.

## 2. Design goals

- Responsive, predictable movement and attacks.
- Readable combat that rewards positioning and dodging.
- Upgrade choices that change the current run.
- Room, encounter, and reward variation between runs.
- Clear visual, audio, and state feedback.

Visual clarity takes priority over graphical complexity.

## 3. Controls

The game must be playable with a keyboard and mouse on Linux.

- Move with WASD or the arrow keys.
- Use the primary attack with Space or the primary mouse button.
- Show the controls on the menu or in the run instructions.
- A controller is optional.

The attack direction may follow the last movement direction or the mouse pointer, but it must be clear and usable.

## 4. Run flow and game states

A run follows this sequence:

1. Start a new run from the main menu.
2. Explore and clear the dungeon's non-boss rooms.
3. Collect at least one upgrade before the boss.
4. Reach and defeat the final boss to win and escape.
5. If player health reaches zero first, show Game Over.

The game must provide Main Menu, Playing, Game Over, and Victory states. Game Over and Victory must each offer a way to start a fresh run or return to the main menu.

Starting a fresh run resets health, run upgrades, room progress, and encounter state. No permanent meta-progression is required.

## 5. Player and combat

The player must be able to move, attack enemies, take damage, and be defeated.

- Track current and maximum health; current health stays between zero and maximum health.
- The basic attack has a defined hit area or range, can damage enemies, and has visible feedback.
- Taking damage reduces health and briefly grants invulnerability so one continuous contact does not cause repeated hits.
- Make damage, defeat, and invulnerability feedback distinguishable from ordinary movement and attacks.
- Enemy attacks must be avoidable through movement or positioning.

## 6. Enemies

Include at least three enemy archetypes:

- **Melee:** pursues the player and attacks at close range.
- **Ranged:** attacks from a distance and gives a readable cue before or during its attack.
- **Elite:** is stronger than a regular enemy and has at least one distinguishing trait, such as higher health, higher damage, a different movement speed, or a distinct attack.

The boss must have health and at least two recognizable attack patterns. At least one pattern must distinguish it from regular enemies.

All enemy types can detect or react to the player, take damage, attack, and be defeated.

## 7. Dungeon and rooms

A generated run must contain:

- One starting room.
- At least two non-boss combat rooms before the boss.
- One final boss room.
- Traversable connections between consecutive rooms.
- At least one reward opportunity before the boss.

A combat room blocks its exits while hostile enemies remain and opens them after all are defeated. The player must receive a visible indication of whether the room is still active or cleared.

Run generation must provide multiple possible room layouts, enemy encounters, and upgrade offers. Provide a documented seed input through a development option, command-line argument, or equivalent. The same seed must reproduce the same layout, encounter composition, and upgrade offers. Document two test seeds that produce different layouts, encounters, and offers.

## 8. Rewards and upgrades

Upgrades last until the current run ends and reset when a fresh run starts.

- Provide at least three distinct upgrade effects during a run.
- Offer at least two different upgrade choices at each upgrade selection.
- Let the player select one option and return to exploration.
- At least one choice must affect combat; another must affect movement or survival.
- Choices must have different effects, not just different names.

Possible effects include increased damage, faster movement, more maximum health, or a modified attack. A reward may also provide healing or another temporary advantage.

## 9. User interface, visuals, and audio

The main menu must include a Start option. During play, the HUD must show player health, current upgrades, and room progress.

Maintain a consistent visual style and make the player, enemies, attacks, environment, rewards, and room state distinguishable.

Provide at least two distinct audio cues selected from player attack, enemy attack, damage received, enemy defeated, victory, and defeat. Audio must reinforce the corresponding gameplay event.

## 10. Completion and acceptance checklist

The project is complete when it can be launched on Linux by following its documentation and passes these checks:

- **A1 — Launch and controls:** The documented launch steps work. The player can move and attack using the documented controls.
- **A2 — Run states:** The main menu starts a run; zero health reaches Game Over; defeating the boss reaches Victory. Both end states allow a fresh run or return to the menu.
- **A3 — Dungeon:** A run has the required room counts and connected route. Combat exits stay blocked until the room is clear and then open.
- **A4 — Enemies and combat:** The three archetypes behave as specified; player and enemy attacks can deal damage; damage, defeat, and invulnerability are communicated.
- **A5 — Rewards:** Before the boss, a run offers at least three distinct upgrade effects across its selection events, with at least two choices per event. The selected effect applies, persists through the run, and resets on a fresh run.
- **A6 — Boss and victory:** The boss has health and at least two attack patterns, including one distinct pattern; defeating it completes the escape.
- **A7 — Variation and repeatability:** The two documented test seeds produce the documented differences. Repeating a seed reproduces its layout, encounters, and upgrade offers.
- **A8 — Feedback and HUD:** The required health, upgrade, and room-progress information is visible; room state is clear; at least two distinct audio cues play for their events.

For each check, the project documentation should name the command or manual steps used and summarize the observed result. Report any check that could not be verified.

## 11. Technical freedom

The development team may choose the programming language, game engine, architecture, project organization, and assets. Prioritize a reliable, maintainable implementation and a complete playable run.
