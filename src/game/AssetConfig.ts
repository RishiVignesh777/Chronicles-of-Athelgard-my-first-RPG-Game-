/**
 * ==============================================================================
 * 🎮 ASSETCONFIG - THE CENTRAL RPG CONFIGURATION & MODDING HUB
 * ==============================================================================
 * Designed specifically so ANY non-programmer can swap out game assets,
 * maps, and balance parameters simply by editing the values below!
 *
 * HOW TO CUSTOMIZE:
 * 1. To use your own character: Paste your sprite sheet URL into 'playerSpriteSheet'.
 *    (e.g., https://i.imgur.com/your_player.png or GitHub raw link).
 * 2. To change enemies: Paste URL into 'enemySpriteSheet'.
 * 3. To change environment: Paste URL into 'tileSet'.
 * 4. To build your own world: Change the numbers in 'levelMap' matrix:
 *      0 = Grass (Walkable)
 *      1 = Cobblestone Path (Walkable)
 *      2 = Deep Water (Solid Collider)
 *      3 = Stone Wall (Solid Collider)
 *      4 = Wood Planks (Walkable)
 *      5 = Forest Tree (Solid Collider)
 *      6 = Dungeon Wall (Solid Collider)
 *      7 = Dungeon Floor (Walkable)
 *      8 = Treasure Chest (Solid / Interactable)
 *      9 = Spikes / Trap (Hazard)
 *     10 = Portal Gate (Teleport / Win)
 *     11 = Sand Path (Walkable)
 * 5. Tweak 'gameplayParams' to balance speed, attack power, health, and camera.
 * ==============================================================================
 */

export interface AnimationDef {
  row: number;
  startFrame: number;
  frameCount: number;
  speed: number; // frames per second
}

export interface SpriteSheetMeta {
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, AnimationDef>;
}

export interface TileMeta {
  name: string;
  solid: boolean;
  col: number;
  row: number;
  colorFallback: string;
  isInteractable?: boolean;
  isHazard?: boolean;
}

export interface GameplayParams {
  playerSpeed: number;           // Movement speed in pixels/sec
  playerHealth: number;          // Starting and maximum player HP
  playerAttackDamage: number;    // Damage dealt per sword swing
  playerHitboxWidth: number;     // Physical AABB collision width
  playerHitboxHeight: number;    // Physical AABB collision height
  playerHitboxOffsetY: number;   // Offset from sprite top to feet collider
  attackRange: number;           // Sword strike forward distance (pixels)
  attackArcRadius: number;       // Radius of melee cleave
  attackDuration: number;        // Sword animation duration in seconds
  cameraLerpSpeed: number;       // Camera smoothing factor (higher = snappier)
  enemySpeed: number;            // Enemy patrol and chase speed
  enemyHealth: number;           // Enemy starting hit points
  enemyDamage: number;           // Damage inflicted on touching player
  enemyAggroRadius: number;      // Distance in pixels when enemy chases player
  tileSize: number;              // World grid tile dimension (e.g. 32px)
  renderScale: number;           // Zoom scaling factor (e.g. 2.0x for crisp pixel art)
}

export interface AssetConfigType {
  // External URLs (can be external HTTPS URLs or Base64 data URIs)
  playerSpriteSheet: string;
  enemySpriteSheet: string;
  tileSet: string;

  // Slicing definitions for sprite animation engine
  playerSpriteMeta: SpriteSheetMeta;
  enemySpriteMeta: SpriteSheetMeta;
  tileSetMeta: {
    tileSize: number;
    tiles: Record<number, TileMeta>;
  };

  // 2D Array Matrix representing the game world map
  levelMap: number[][];

  // Tunable gameplay variables
  gameplayParams: GameplayParams;
}

// Default Level 1: "The Forest of Valerius & The Ancient Keep"
export const DEFAULT_LEVEL_MAP: number[][] = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 3, 6, 6, 6, 6, 6, 6, 6, 6, 3, 0, 0, 0, 5, 5, 0, 0, 0, 8, 3],
  [3, 0, 0, 5, 0, 0, 5, 0, 0, 1, 1, 1, 3, 7, 7, 7, 7, 7, 7, 7, 7, 3, 0, 5, 0, 5, 0, 0, 0, 0, 0, 3],
  [3, 0, 5, 5, 0, 0, 0, 0, 1, 1, 0, 1, 3, 7, 9, 7, 7, 7, 9, 7, 7, 3, 0, 5, 5, 0, 0, 2, 2, 2, 0, 3],
  [3, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 4, 7, 7, 7, 8, 7, 7, 7, 7, 4, 1, 1, 1, 1, 2, 2, 2, 2, 0, 3],
  [3, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 3, 7, 7, 7, 7, 7, 7, 7, 7, 3, 0, 0, 0, 1, 2, 2, 2, 2, 0, 3],
  [3, 5, 0, 0, 1, 0, 0, 5, 5, 0, 0, 1, 3, 6, 6, 4, 4, 6, 6, 6, 6, 3, 0, 0, 0, 1, 1, 1, 2, 2, 0, 3],
  [3, 5, 5, 0, 1, 0, 5, 5, 5, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 2, 2, 0, 3],
  [3, 0, 0, 0, 1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 3],
  [3, 0, 2, 2, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 3],
  [3, 0, 2, 2, 1, 2, 2, 0, 5, 5, 5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 5, 0, 0, 1, 1, 1, 0, 0, 1, 0, 3],
  [3, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 0, 0, 0, 1, 1, 1, 1, 0, 3],
  [3, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 5, 0, 0, 0, 0, 0, 1, 0, 3],
  [3, 0, 0, 2, 2, 2, 0, 0, 0, 8, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3],
  [3, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 5, 5, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 3],
  [3, 5, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 0, 0, 1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3],
  [3, 5, 5, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 1, 0, 5, 5, 5, 0, 0, 0, 0, 10, 0, 0, 0, 0, 1, 0, 3],
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 3],
  [3, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
];

export const DEFAULT_ASSET_CONFIG: AssetConfigType = {
  // 1. External Sprite & Tileset URLs (Set to "" initially; engine auto-injects default high-res base64 if empty)
  // Non-programmers can replace these with their own URLs (e.g. "https://raw.githubusercontent.com/.../hero.png")
  playerSpriteSheet: "",
  enemySpriteSheet: "",
  tileSet: "",

  // 2. Sprite Sheet Metadata & Frame Slicing
  playerSpriteMeta: {
    frameWidth: 32,
    frameHeight: 32,
    animations: {
      idleDown:   { row: 0, startFrame: 0, frameCount: 4, speed: 6 },
      idleUp:     { row: 1, startFrame: 0, frameCount: 4, speed: 6 },
      idleLeft:   { row: 2, startFrame: 0, frameCount: 4, speed: 6 },
      idleRight:  { row: 3, startFrame: 0, frameCount: 4, speed: 6 },
      walkDown:   { row: 4, startFrame: 0, frameCount: 6, speed: 10 },
      walkUp:     { row: 5, startFrame: 0, frameCount: 6, speed: 10 },
      walkLeft:   { row: 6, startFrame: 0, frameCount: 6, speed: 10 },
      walkRight:  { row: 7, startFrame: 0, frameCount: 6, speed: 10 },
      attackDown: { row: 8, startFrame: 0, frameCount: 4, speed: 14 },
      attackUp:   { row: 9, startFrame: 0, frameCount: 4, speed: 14 },
      attackLeft: { row: 10, startFrame: 0, frameCount: 4, speed: 14 },
      attackRight:{ row: 11, startFrame: 0, frameCount: 4, speed: 14 },
    }
  },

  enemySpriteMeta: {
    frameWidth: 32,
    frameHeight: 32,
    animations: {
      walkDown: { row: 0, startFrame: 0, frameCount: 4, speed: 6 },
      walkUp:   { row: 1, startFrame: 0, frameCount: 4, speed: 6 },
      walkLeft: { row: 2, startFrame: 0, frameCount: 4, speed: 6 },
      walkRight:{ row: 3, startFrame: 0, frameCount: 4, speed: 6 },
      hurt:     { row: 4, startFrame: 0, frameCount: 2, speed: 8 },
    }
  },

  // 3. Tile Attributes, Collision Solid Flags & Tileset Mapping
  tileSetMeta: {
    tileSize: 32,
    tiles: {
      0: { name: 'Grass', solid: false, col: 0, row: 0, colorFallback: '#3a7d44' },
      1: { name: 'Path', solid: false, col: 1, row: 0, colorFallback: '#c7a26b' },
      2: { name: 'Water', solid: true, col: 2, row: 0, colorFallback: '#2a6fa8' },
      3: { name: 'Stone Wall', solid: true, col: 3, row: 0, colorFallback: '#595d66' },
      4: { name: 'Wood Floor', solid: false, col: 0, row: 1, colorFallback: '#8c5835' },
      5: { name: 'Tree', solid: true, col: 1, row: 1, colorFallback: '#285e33' },
      6: { name: 'Dungeon Wall', solid: true, col: 2, row: 1, colorFallback: '#2f2c38' },
      7: { name: 'Dungeon Floor', solid: false, col: 3, row: 1, colorFallback: '#222026' },
      8: { name: 'Treasure Chest', solid: true, col: 0, row: 2, colorFallback: '#8f5223', isInteractable: true },
      9: { name: 'Spikes', solid: false, col: 1, row: 2, colorFallback: '#8a9499', isHazard: true },
      10: { name: 'Portal', solid: false, col: 2, row: 2, colorFallback: '#8b4df5', isInteractable: true },
      11: { name: 'Sand', solid: false, col: 3, row: 2, colorFallback: '#d6b876' },
    }
  },

  // 4. Map Grid (32 columns x 20 rows)
  levelMap: DEFAULT_LEVEL_MAP,

  // 5. Action RPG Gameplay Tuning Parameters
  gameplayParams: {
    playerSpeed: 155,            // Pixels per second
    playerHealth: 100,           // Max hit points
    playerAttackDamage: 34,      // Slash damage
    playerHitboxWidth: 18,       // Collision box width
    playerHitboxHeight: 14,      // Collision box height
    playerHitboxOffsetY: 16,     // Hitbox placed at player feet
    attackRange: 32,             // Sword reach
    attackArcRadius: 36,         // Slash arc coverage
    attackDuration: 0.28,        // Animation length in seconds
    cameraLerpSpeed: 6.5,        // Camera smoothness
    enemySpeed: 70,              // Goblin chase speed
    enemyHealth: 60,             // Goblin hit points
    enemyDamage: 15,             // Goblin attack damage
    enemyAggroRadius: 175,       // Goblin vision radius
    tileSize: 32,                // Size of each grid tile
    renderScale: 2.0             // Canvas scaling multiplier
  }
};
