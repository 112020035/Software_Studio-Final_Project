# Software Studio Final Project TODO

Last updated: 2026-05-11

## Project Summary

- Game type: side-scrolling / stage-based adventure built in Cocos Creator 2.4.8.
- Story premise: a cat-like alien loses spaceship parts while exploring space. To return to planet GJ94hl6, the player collects replacement parts from space junk.
- Core loop:
  1. Fly or move through the main space-junk area.
  2. Touch a trigger object / collectible part.
  3. Get pulled into an abnormal dimension, like a black hole or planet portal.
  4. Clear the related mini game.
  5. Receive the spaceship part and either return to the main area or unlock the next planet / stage.
- Required modes and systems:
  - Story intro and ending.
  - Single-player / two-player selection.
  - Two-player online or invite-code flow if time allows.
  - Inventory / collection log for spaceship parts and funny earth trash.
  - Three mini games connected from the main game.

## Proposal Notes

- Motivation: combine story, puzzle solving, physics-based spaceship control, and multiplayer cooperation.
- Setting:
  - The universe has bugs that force players into alternate dimensions when collecting junk.
  - Each needed part is locked behind a mini-game challenge.
  - If the alien leaves the junk area without enough parts, the return trip fails.
- Main controls from proposal:
  - WASD / arrow keys: movement, thrust, steering.
  - Space: interact or emergency brake.
  - Tab: clue notebook / mission list.
  - Left click: collect clues or operate puzzle UI.
  - Right click: special action such as aim, analyze, or inspect clue.
  - Enter: chat.
  - V: mark signal.
  - F: cooperative action.
- High-risk systems:
  - Physics flight control with thrust, inertia, rotation torque.
  - Gravity / inertia / limited fuel.
  - Landing judgment using speed, angle, and stable contact.
  - Integrating mini-game challenges into the main game progression.
- High-value extras:
  - Intro landing animation and ending return animation.
  - Funny crash / failure animation.
  - Collectible earth trash with alien-style comments.
  - Unlockable ship skins or thrust effects.
  - Random events such as gravity anomalies, meteor showers, dust, or supply capsules.

## Scene Plan

### Main Game

- Build a main space-junk scene where the player can move horizontally and interact with objects.
- Place three trigger objects for the three mini games.
- Each trigger should contain:
  - mini-game id
  - required state, if any
  - portal / transition animation
  - return position after clearing
- On trigger collision:
  - pause or fade out main scene
  - save current progress
  - load the target mini-game scene
- After mini-game clear:
  - add the related spaceship part to inventory
  - mark trigger as cleared
  - unlock the next planet / stage or return to original position

### Mini Games

- Mini game 1: horizontal side-scrolling dodge game.
- Mini game 2: vertical upward two-player cooperation game, inspired by Pico Park / Fireboy and Watergirl style teamwork.
- Mini game 3: combat / monster-fighting game.

### Story / Meta Systems

- Opening: alien arrives or crashes into the space-junk area.
- Mode select: single-player / two-player.
- Inventory: tracks parts and optional trash collectibles.
- Ending: spaceship repaired, alien returns home.

## Mini Game 2: Two-Player Cooperation Plan

Owner focus: this is the main implementation target for the current developer.

### Design Goal

- Make a compact vertical platforming level where two players must cooperate to climb upward.
- The challenge should feel like Pico Park:
  - simple controls
  - readable obstacles
  - cooperation required, not just two players racing separately
  - frequent small puzzles instead of one huge puzzle
- The level should be clearable in around 1 to 3 minutes for demo.

### Core Mechanics

- Two controllable characters:
  - Player 1: keyboard A / D / W or arrow-key variant.
  - Player 2: separate keys, for example J / L / I or numpad / second keyboard layout.
- Platformer movement:
  - horizontal movement
  - jump
  - grounded detection
  - respawn when falling
- Camera:
  - follows the average or bounding box of both players
  - prevents one player from leaving the other too far behind
  - vertical progress should feel stable and readable
- Cooperation rules:
  - both players must reach the goal zone to clear
  - one player can stand on buttons to create platforms for the other
  - one player can act as a step / elevator passenger if feasible
  - doors or barriers require two switches or timed switches

### Suggested Level Beats

1. Tutorial climb:
   - simple platforms
   - both players learn movement and jump timing
2. Two-switch door:
   - Player A stands on a floor button
   - Player B passes through and activates the next button
   - door stays open only when both cooperate
3. Moving platform section:
   - one player controls platform direction with a switch
   - the other rides upward
   - swap roles halfway
4. Timing / hazard section:
   - lasers, spikes, or moving blocks
   - hazards reset player position but should not hard-lock the level
5. Final gate:
   - both players stand in separate goal zones
   - mini game sends clear event back to main game

### Implementation Tasks

- [ ] Create `MiniGame2` scene.
- [ ] Add tile / platform layout for a vertical level.
- [ ] Create two player prefabs with different colors or silhouettes.
- [ ] Implement shared platformer controller.
- [ ] Add input mapping for Player 1 and Player 2.
- [ ] Add camera follow behavior for two players.
- [ ] Add checkpoint / respawn zones.
- [ ] Add switches, doors, and moving platforms.
- [ ] Add hazards with reset behavior.
- [ ] Add goal zones that require both players.
- [ ] Add mini-game clear callback / scene transition.
- [ ] Add temporary UI: restart, progress, clear/fail text.
- [ ] Tune jump height, gravity, platform spacing, and camera speed.

### Acceptance Criteria

- Two players can be controlled at the same time on one keyboard.
- The level cannot be cleared by only one player.
- Falling or touching hazards resets players without breaking the scene.
- Camera keeps both players visible during normal play.
- Reaching the final goal marks mini game 2 as cleared and returns to the main flow.
- Demo version can be completed reliably by first-time players after a short explanation.

## Development Milestones

### By 2026-05-24

- Story:
  - complete story outline
  - implement single-player / two-player selection
  - prototype invite-code flow if networking is chosen
- Main game:
  - playable movement
  - smooth transition into mini games
  - at least three trigger objects
- Mini games:
  - each mini game has a playable level
  - mini game 2 has full two-player local co-op prototype
- Polish:
  - inventory prototype
  - basic sound effects
  - mini-game difficulty pass
  - placeholder art replaced where most visible
  - optional main-game gravity / stability effects

### By 2026-06-06

- Integrate all scenes into one complete flow.
- Finish inventory and part collection state.
- Finish intro / ending flow at minimum placeholder quality.
- Run full playthrough testing.
- Fix scene transition, respawn, input, and progression bugs.
- Add final UI prompts and feedback.

### By 2026-06-13

- Demo-ready build.
- Prepare fallback path if two-player online is unstable:
  - local two-player mode remains the guaranteed demo version.
  - online / invite code becomes bonus if stable.
- Freeze risky features and focus on reliability.

## Recommended Implementation Order

1. Build the scene transition contract first:
   - main game trigger
   - mini-game scene load
   - clear result
   - return to main game
2. Implement mini game 2 with placeholder blocks and capsules.
3. Add cooperation objects one at a time:
   - switch
   - door
   - moving platform
   - hazard
   - goal
4. Add inventory state and connect the cleared mini game to a collected part.
5. Polish movement feel, camera, and level readability.
6. Add art, animation, audio, and UI.

## Future Codex Notes

- Prefer small, scene-specific scripts first. Extract shared helpers only after more than one mini game needs them.
- Keep mini-game clear data explicit, for example `miniGameId`, `rewardItemId`, and `returnScene`.
- For Cocos Creator 2.4.8, check existing project conventions before adding TypeScript or JavaScript files.
- Do not make online co-op block the demo. Local two-player should be the stable baseline.
- When implementing mini game 2, start with graybox geometry and keyboard controls before adding final art.
