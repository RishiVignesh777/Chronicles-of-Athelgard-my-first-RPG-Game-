/**
 * ==============================================================================
 * 🎮 ASSETCONFIG - MULTI-LEVEL 2D ACTION RPG CONFIGURATION & MODDING HUB
 * ==============================================================================
 * Designed so that ANY non-programmer can swap out game assets, paste in custom
 * levels from editors like Tiled, and tune combat balance in one central place.
 *
 * HOW TO ADD OR MODIFY LEVELS:
 * Simply add or edit objects in the 'levels' array below!
 * Each level requires:
 *   - name: Title displayed during transition banner
 *   - mapData: 2D grid matrix of tile IDs
 *   - playerSpawn: [col, row] or { col: number, row: number } start location
 *   - exitTile: Tile ID (e.g. 10 for Portal) or specific [col, row] coordinate
 *   - tilesetUrl: (Optional) URL for unique level tileset (null = use default)
 *
 * TILE IDS REFERENCE (Default Tileset):
 *   0 = Grass (Walkable)
 *   1 = Cobblestone Path (Walkable)
 *   2 = Deep Water (Solid)
 *   3 = Stone Wall (Solid)
 *   4 = Wood Floor (Walkable)
 *   5 = Ancient Tree (Solid)
 *   6 = Dungeon Wall (Solid)
 *   7 = Dungeon Floor (Walkable)
 *   8 = Treasure Chest (Solid / Interactable with 'E' or walk up)
 *   9 = Spikes / Hazard (Deals damage)
 *  10 = Portal Gate (Level Transition Exit)
 *  11 = Sand / Desert (Walkable)
 * ==============================================================================
 */

export interface AnimationDef {
  row: number;
  startFrame: number;
  frameCount: number;
  speed: number;
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
  cameraLerpSpeed: number;       // Camera smoothing factor
  enemySpeed: number;            // Enemy patrol and chase speed
  enemyHealth: number;           // Enemy starting hit points
  enemyDamage: number;           // Damage inflicted on touching player
  enemyAggroRadius: number;      // Distance in pixels when enemy chases player
  tileSize: number;              // World grid tile dimension (32px)
  renderScale: number;           // Zoom scaling factor (e.g. 2.0x)
}

export type PlayerSpawnPoint = [number, number] | { col: number; row: number };
export type ExitTileSpec = number | [number, number] | { col: number; row: number };

export interface LevelConfig {
  name: string;
  tilesetUrl?: string | null;            // Optional custom tileset URL (null = default)
  playerSpawn: PlayerSpawnPoint;         // Starting grid coordinate [col, row] or {col, row}
  exitTile: ExitTileSpec;                // Tile ID (e.g. 10) or coordinate [col, row] that triggers next level
  exitTileId?: number;                   // Alias for convenience with Tiled exports
  mapData: number[][];                   // 2D grid matrix
  enemySpawns?: Array<{ col: number; row: number; health?: number }>;
  themeColor?: string;                   // Banner theme accent
}

export interface AssetConfigType {
  // Global external sprite assets
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

  // MULTI-LEVEL CONFIGURATION ARRAY (Replaces single levelMap)
  levels: LevelConfig[];

  // Action RPG Gameplay balance parameters
  gameplayParams: GameplayParams;
}

// ==============================================================================
// DEFAULT GAME LEVELS (3 Diverse, Handcrafted Action RPG Stages)
// ==============================================================================

// Level 1: "The Whispering Woods"
const LEVEL_1_MAP: number[][] = [
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

// Level 2: "The Crypt of Malice"
const LEVEL_2_MAP: number[][] = [
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  [6, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 7, 7, 6, 8, 7, 7, 6, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 6],
  [6, 7, 6, 6, 7, 6, 7, 6, 6, 6, 6, 6, 6, 7, 6, 6, 6, 7, 6, 7, 6, 6, 6, 6, 7, 6, 7, 6, 6, 6, 7, 6],
  [6, 7, 6, 8, 7, 6, 7, 7, 7, 9, 7, 7, 6, 7, 7, 7, 6, 7, 7, 7, 6, 8, 7, 6, 7, 6, 7, 7, 7, 6, 7, 6],
  [6, 7, 6, 6, 7, 6, 6, 6, 7, 9, 7, 6, 6, 6, 6, 7, 6, 6, 6, 7, 6, 6, 7, 6, 7, 6, 6, 6, 7, 6, 7, 6],
  [6, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 6, 7, 7, 7, 6, 7, 7, 7, 6],
  [6, 6, 6, 6, 6, 6, 7, 6, 6, 6, 7, 6, 7, 6, 6, 6, 6, 7, 6, 6, 6, 6, 7, 6, 6, 6, 7, 6, 6, 6, 6, 6],
  [6, 7, 7, 7, 7, 6, 7, 7, 7, 6, 7, 7, 7, 6, 9, 9, 6, 7, 7, 7, 7, 6, 7, 7, 7, 6, 7, 7, 7, 7, 7, 6],
  [6, 7, 6, 6, 7, 6, 6, 6, 7, 6, 6, 6, 7, 6, 9, 9, 6, 7, 6, 6, 7, 6, 6, 6, 7, 6, 6, 6, 6, 6, 7, 6],
  [6, 7, 6, 7, 7, 7, 7, 6, 7, 7, 7, 6, 7, 6, 7, 7, 6, 7, 6, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 6, 7, 6],
  [6, 7, 6, 7, 6, 6, 7, 6, 6, 6, 7, 6, 7, 6, 6, 6, 6, 7, 6, 7, 6, 6, 7, 6, 6, 6, 6, 6, 7, 6, 7, 6],
  [6, 7, 7, 7, 6, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 6],
  [6, 6, 6, 7, 6, 7, 6, 6, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 6, 6, 6, 6, 7, 6, 7, 6, 6, 6],
  [6, 7, 7, 7, 6, 7, 6, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 8, 7, 6, 7, 6, 7, 7, 7, 6],
  [6, 7, 6, 6, 6, 7, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 7, 6, 7, 6, 6, 6, 7, 6],
  [6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 7, 7, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 6, 7, 7, 6, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 6],
  [6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 7, 6],
  [6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
];

// Level 3: "The Citadel of the Fallen King" (Final Boss Chamber & Master Gateway)
const LEVEL_3_MAP: number[][] = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 8, 4, 4, 4, 10, 4, 4, 4, 8, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3],
  [3, 4, 3, 3, 3, 3, 3, 3, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 3, 3, 3, 3, 3, 3, 3, 4, 4, 3],
  [3, 4, 3, 7, 7, 7, 7, 7, 3, 4, 3, 3, 3, 4, 4, 4, 4, 4, 3, 3, 3, 4, 3, 7, 7, 7, 7, 7, 3, 4, 4, 3],
  [3, 4, 3, 7, 8, 7, 8, 7, 3, 4, 4, 4, 3, 4, 4, 4, 4, 4, 3, 4, 4, 4, 3, 7, 8, 7, 8, 7, 3, 4, 4, 3],
  [3, 4, 3, 7, 7, 7, 7, 7, 3, 4, 4, 4, 3, 4, 4, 4, 4, 4, 3, 4, 4, 4, 3, 7, 7, 7, 7, 7, 3, 4, 4, 3],
  [3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 4, 4, 3, 3, 4, 4, 4, 3, 3, 4, 4, 4, 3, 3, 3, 4, 3, 3, 3, 4, 4, 3],
  [3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3],
  [3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 3],
  [3, 1, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 4, 4, 1, 3],
  [3, 1, 4, 3, 8, 4, 4, 3, 4, 4, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 4, 4, 3, 4, 4, 8, 3, 4, 4, 1, 3],
  [3, 1, 4, 3, 4, 4, 4, 3, 4, 4, 3, 7, 7, 3, 4, 4, 4, 3, 7, 7, 3, 4, 4, 3, 4, 4, 4, 3, 4, 4, 1, 3],
  [3, 1, 4, 3, 3, 4, 3, 3, 4, 4, 3, 7, 7, 3, 4, 4, 4, 3, 7, 7, 3, 4, 4, 3, 3, 4, 3, 3, 4, 4, 1, 3],
  [3, 1, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 4, 4, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
];

export const DEFAULT_LEVELS: LevelConfig[] = [
  {
    name: "Chapter 1: The Whispering Woods",
    tilesetUrl: null, // Uses default tileset
    playerSpawn: [2, 2], // [col, row]
    exitTile: 10,        // Tile 10 = Portal Gate
    exitTileId: 10,
    themeColor: '#34d399',
    mapData: LEVEL_1_MAP,
    enemySpawns: [
      { col: 14, row: 8, health: 50 },
      { col: 18, row: 9, health: 50 },
      { col: 26, row: 4, health: 50 },
      { col: 28, row: 13, health: 50 },
      { col: 23, row: 15, health: 50 },
      { col: 6, row: 11, health: 50 },
      { col: 9, row: 14, health: 50 }
    ]
  },
  {
    name: "Chapter 2: The Crypt of Malice",
    tilesetUrl: null,
    playerSpawn: [1, 1], // [col, row]
    exitTile: 10,
    exitTileId: 10,
    themeColor: '#a78bfa',
    mapData: LEVEL_2_MAP,
    enemySpawns: [
      { col: 8, row: 3, health: 65 },
      { col: 19, row: 3, health: 65 },
      { col: 10, row: 7, health: 70 },
      { col: 21, row: 7, health: 70 },
      { col: 14, row: 11, health: 75 },
      { col: 18, row: 11, health: 75 },
      { col: 15, row: 15, health: 80 },
      { col: 23, row: 17, health: 80 }
    ]
  },
  {
    name: "Chapter 3: Citadel of the Fallen King",
    tilesetUrl: null,
    playerSpawn: [15, 18], // Starts outside royal gates
    exitTile: 10,          // Golden throne portal triggers "Victory! You Win!"
    exitTileId: 10,
    themeColor: '#fbbf24',
    mapData: LEVEL_3_MAP,
    enemySpawns: [
      { col: 6, row: 9, health: 90 },
      { col: 24, row: 9, health: 90 },
      { col: 15, row: 10, health: 100 },
      { col: 10, row: 13, health: 110 },
      { col: 20, row: 13, health: 110 },
      { col: 15, row: 5, health: 150 } // Royal Elite Champion
    ]
  }
];

export const DEFAULT_ASSET_CONFIG: AssetConfigType = {
  // 1. External Sprite & Tileset URLs (Empty = auto-injects default high-res base64)
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
      10: { name: 'Portal Gate (Exit)', solid: false, col: 2, row: 2, colorFallback: '#8b4df5', isInteractable: true },
      11: { name: 'Sand', solid: false, col: 3, row: 2, colorFallback: '#d6b876' },
    }
  },

  // 4. MULTI-LEVEL CONFIGURATION ARRAY
  levels: DEFAULT_LEVELS,

  // 5. Action RPG Gameplay Tuning Parameters
  gameplayParams: {
    playerSpeed: 155,            // Pixels per second
    playerHealth: 100,           // Max hit points
    playerAttackDamage: 35,      // Slash damage
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
