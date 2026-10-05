/**
 * ==============================================================================
 * ⚔️ ZERO-DEPENDENCY HTML5 CANVAS 2D ACTION RPG GAME ENGINE
 * ==============================================================================
 * A modular, high-performance, top-down Action RPG engine built in pure Vanilla
 * JavaScript / TypeScript with zero external libraries.
 * ==============================================================================
 */

import {
  AssetConfigType,
  DEFAULT_ASSET_CONFIG,
  SpriteSheetMeta
} from './AssetConfig';
import {
  generateDefaultEnemySpriteSheet,
  generateDefaultPlayerSpriteSheet,
  generateDefaultTileset
} from './defaultAssets';
import { soundEffects } from './soundEffects';

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface EnemyEntity {
  id: number;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  vx: number;
  vy: number;
  direction: 'down' | 'up' | 'left' | 'right';
  currentAnim: string;
  animTimer: number;
  health: number;
  maxHealth: number;
  hitboxWidth: number;
  hitboxHeight: number;
  hurtTimer: number;
  isDead: boolean;
  patrolTimer: number;
  targetPatrolX: number;
  targetPatrolY: number;
}

export interface ChestEntity {
  col: number;
  row: number;
  opened: boolean;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public config: AssetConfigType;

  // Asset Loader & Cache
  public loadedImages: Map<string, HTMLImageElement> = new Map();
  public isLoaded: boolean = false;
  public loadError: string | null = null;
  public loadProgress: number = 0;

  // Game Loop timing
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public fps: number = 0;
  private fpsCounter: number = 0;
  private fpsTimer: number = 0;

  // Viewport Camera
  public camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    shake: 0,
    shakeDuration: 0
  };

  // Player Entity
  public player = {
    x: 128,
    y: 128,
    vx: 0,
    vy: 0,
    direction: 'down' as 'down' | 'up' | 'left' | 'right',
    state: 'idle' as 'idle' | 'walk' | 'attack',
    animTimer: 0,
    health: 100,
    maxHealth: 100,
    attackTimer: 0,
    attackCooldown: 0,
    gold: 0,
    score: 0,
    kills: 0,
    isInvulnerable: false,
    invulnerableTimer: 0,
  };

  // Enemies & Interactables
  public enemies: EnemyEntity[] = [];
  public chests: ChestEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  // Input State
  public keys: Record<string, boolean> = {};
  public virtualInput = {
    dx: 0,
    dy: 0,
    attack: false,
    interact: false
  };

  // Debug & Display Settings
  public showColliders: boolean = false;
  public showMinimap: boolean = true;
  public godMode: boolean = false;

  // Callbacks for UI updates
  public onStateUpdate?: (engine: GameEngine) => void;
  public onNotification?: (msg: string) => void;

  constructor(canvas: HTMLCanvasElement, customConfig?: AssetConfigType) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.config = customConfig || JSON.parse(JSON.stringify(DEFAULT_ASSET_CONFIG));

    this.initInputListeners();
  }

  // ============================================================================
  // 1. ASSET LOADER (Promise-Based with Procedural Fallbacks)
  // ============================================================================
  public async loadAssets(): Promise<void> {
    this.isLoaded = false;
    this.loadProgress = 10;
    this.loadError = null;

    // Provide default generated base64 sprites if user config is empty
    if (!this.config.playerSpriteSheet || this.config.playerSpriteSheet.trim() === '') {
      this.config.playerSpriteSheet = generateDefaultPlayerSpriteSheet();
    }
    if (!this.config.enemySpriteSheet || this.config.enemySpriteSheet.trim() === '') {
      this.config.enemySpriteSheet = generateDefaultEnemySpriteSheet();
    }
    if (!this.config.tileSet || this.config.tileSet.trim() === '') {
      this.config.tileSet = generateDefaultTileset();
    }

    const assetsToLoad = [
      { key: 'player', url: this.config.playerSpriteSheet, fallbackType: 'player' },
      { key: 'enemy', url: this.config.enemySpriteSheet, fallbackType: 'enemy' },
      { key: 'tileset', url: this.config.tileSet, fallbackType: 'tileset' }
    ];

    let completed = 0;
    const total = assetsToLoad.length;

    const loadSingleImage = (key: string, url: string, fallbackType: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Support external CORS images (Imgur, GitHub, etc.)

        img.onload = () => {
          this.loadedImages.set(key, img);
          completed++;
          this.loadProgress = Math.round((completed / total) * 100);
          resolve();
        };

        img.onerror = () => {
          console.warn(`[AssetLoader] Failed to load external URL for ${key} (${url}). Generating high-quality procedural fallback.`);
          // Generate fallback texture so the game never crashes
          let fallbackDataUrl = '';
          if (fallbackType === 'player') fallbackDataUrl = generateDefaultPlayerSpriteSheet();
          else if (fallbackType === 'enemy') fallbackDataUrl = generateDefaultEnemySpriteSheet();
          else fallbackDataUrl = generateDefaultTileset();

          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            this.loadedImages.set(key, fallbackImg);
            completed++;
            this.loadProgress = Math.round((completed / total) * 100);
            resolve();
          };
          fallbackImg.src = fallbackDataUrl;
        };

        img.src = url;
      });
    };

    try {
      await Promise.all(assetsToLoad.map(a => loadSingleImage(a.key, a.url, a.fallbackType)));
      this.isLoaded = true;
      this.initWorld();
    } catch (err) {
      console.error('Fatal error loading assets:', err);
      this.loadError = 'Failed to load assets: ' + String(err);
    }
  }

  // ============================================================================
  // WORLD INITIALIZATION (Spawn player, parse map, spawn enemies and chests)
  // ============================================================================
  public initWorld(): void {
    const map = this.config.levelMap;
    const ts = this.config.gameplayParams.tileSize;

    // Reset lists
    this.enemies = [];
    this.chests = [];
    this.particles = [];
    this.floatingTexts = [];

    // Find spawn tile or default
    let spawnFound = false;
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const tile = map[r][c];
        // Path (1) or Wood Floor (4) or Grass (0)
        if (!spawnFound && (tile === 1 || tile === 4 || tile === 0)) {
          this.player.x = c * ts + 8;
          this.player.y = r * ts + 8;
          spawnFound = true;
        }

        // Register chests
        if (tile === 8) {
          this.chests.push({ col: c, row: r, opened: false });
        }
      }
    }

    // Spawn initial patrolling enemies
    const enemySpawns = [
      { col: 14, row: 8 },
      { col: 18, row: 9 },
      { col: 26, row: 4 },
      { col: 28, row: 13 },
      { col: 23, row: 15 },
      { col: 6, row: 11 },
      { col: 9, row: 14 }
    ];

    let idCounter = 1;
    for (const sp of enemySpawns) {
      if (sp.row < map.length && sp.col < map[0].length && !this.isSolidTile(sp.col, sp.row)) {
        this.enemies.push({
          id: idCounter++,
          x: sp.col * ts,
          y: sp.row * ts,
          spawnX: sp.col * ts,
          spawnY: sp.row * ts,
          vx: 0,
          vy: 0,
          direction: 'down',
          currentAnim: 'walkDown',
          animTimer: Math.random() * 2,
          health: this.config.gameplayParams.enemyHealth,
          maxHealth: this.config.gameplayParams.enemyHealth,
          hitboxWidth: 20,
          hitboxHeight: 18,
          hurtTimer: 0,
          isDead: false,
          patrolTimer: Math.random() * 3,
          targetPatrolX: sp.col * ts,
          targetPatrolY: sp.row * ts
        });
      }
    }

    // Reset Player Stats
    this.player.health = this.config.gameplayParams.playerHealth;
    this.player.maxHealth = this.config.gameplayParams.playerHealth;
    this.player.isInvulnerable = false;
    this.player.invulnerableTimer = 0;
    this.player.state = 'idle';

    // Camera initial snap
    this.camera.x = this.player.x - (this.canvas.width / (2 * this.config.gameplayParams.renderScale));
    this.camera.y = this.player.y - (this.canvas.height / (2 * this.config.gameplayParams.renderScale));
    this.clampCamera();
  }

  // ============================================================================
  // 2. INPUT HANDLER (Keyboard, Touch/Virtual, Gamepad)
  // ============================================================================
  private initInputListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        // Prevent scrolling page while playing
        e.preventDefault();
      }
      if (e.code === 'KeyE') {
        this.interactAction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.clampCamera();
    });
  }

  public interactAction(): void {
    const ts = this.config.gameplayParams.tileSize;
    const pCenter = { x: this.player.x + 16, y: this.player.y + 16 };

    // Check adjacent chests
    for (const chest of this.chests) {
      if (!chest.opened) {
        const chestCenter = { x: chest.col * ts + 16, y: chest.row * ts + 16 };
        const dist = Math.hypot(pCenter.x - chestCenter.x, pCenter.y - chestCenter.y);
        if (dist <= 48) {
          chest.opened = true;
          // Spawn gold & sound
          const goldAmount = Math.floor(Math.random() * 35) + 25;
          this.player.gold += goldAmount;
          this.player.score += 150;
          soundEffects.playChestOpen();
          this.addFloatingText(chestCenter.x, chestCenter.y - 10, `+${goldAmount} GOLD!`, '#ffd700');
          this.spawnBurstParticles(chestCenter.x, chestCenter.y, '#ffd700', 16);
          this.onNotification?.(`Opened chest! Found ${goldAmount} Gold Coins!`);
          return;
        }
      }
    }

    // Check Portal
    const playerCol = Math.floor((this.player.x + 16) / ts);
    const playerRow = Math.floor((this.player.y + 16) / ts);
    if (this.config.levelMap[playerRow]?.[playerCol] === 10) {
      soundEffects.playChestOpen();
      this.addFloatingText(this.player.x + 16, this.player.y - 20, 'PORTAL ACTIVATED! YOU WIN!', '#d9b6ff');
      this.spawnBurstParticles(this.player.x + 16, this.player.y + 16, '#8b4df5', 25);
      this.onNotification?.('Victory! You discovered the Ancient Portal of Valerius!');
    }
  }

  // ============================================================================
  // 3. COLLISION DETECTION (Grid-Based AABB Against Solid Tiles)
  // ============================================================================
  public isSolidTile(col: number, row: number): boolean {
    const map = this.config.levelMap;
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
      return true; // Map bounds are solid
    }
    const tileId = map[row][col];
    const meta = this.config.tileSetMeta.tiles[tileId];
    if (!meta) return true; // Undefined tiles treated as walls

    // If it's an opened chest, it becomes walkable
    if (tileId === 8) {
      const ch = this.chests.find(c => c.col === col && c.row === row);
      if (ch && ch.opened) return false;
    }

    return meta.solid;
  }

  /**
   * Tests AABB box vs all overlapping solid tiles in the grid
   */
  public checkTileCollision(boxX: number, boxY: number, boxW: number, boxH: number): boolean {
    const ts = this.config.gameplayParams.tileSize;
    const startCol = Math.floor(boxX / ts);
    const endCol = Math.floor((boxX + boxW - 0.01) / ts);
    const startRow = Math.floor(boxY / ts);
    const endRow = Math.floor((boxY + boxH - 0.01) / ts);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.isSolidTile(c, r)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Moves entity with separate X and Y collision resolution to slide smoothly along walls
   */
  public moveEntityWithSlide(
    entity: { x: number; y: number },
    vx: number,
    vy: number,
    dt: number,
    boxW: number,
    boxH: number,
    offsetY: number
  ): void {
    const newX = entity.x + vx * dt;
    const boxX = newX + (32 - boxW) / 2;
    const currentBoxY = entity.y + offsetY;

    // Try Horizontal Move
    if (!this.checkTileCollision(boxX, currentBoxY, boxW, boxH)) {
      entity.x = newX;
    }

    // Try Vertical Move
    const newY = entity.y + vy * dt;
    const currentBoxX = entity.x + (32 - boxW) / 2;
    const boxY = newY + offsetY;

    if (!this.checkTileCollision(currentBoxX, boxY, boxW, boxH)) {
      entity.y = newY;
    }
  }

  // ============================================================================
  // 4. CAMERA SYSTEM (Smooth exponential lerp & boundary clamping)
  // ============================================================================
  private updateCamera(dt: number): void {
    const params = this.config.gameplayParams;
    const scale = params.renderScale;
    const viewW = this.canvas.width / scale;
    const viewH = this.canvas.height / scale;

    // Camera target is player center
    this.camera.targetX = this.player.x + 16 - viewW / 2;
    this.camera.targetY = this.player.y + 16 - viewH / 2;

    // Smooth Lerp
    const lerp = Math.min(1.0, dt * params.cameraLerpSpeed);
    this.camera.x += (this.camera.targetX - this.camera.x) * lerp;
    this.camera.y += (this.camera.targetY - this.camera.y) * lerp;

    this.clampCamera();

    // Screen Shake decay
    if (this.camera.shakeDuration > 0) {
      this.camera.shakeDuration -= dt;
      if (this.camera.shakeDuration <= 0) {
        this.camera.shake = 0;
      }
    }
  }

  private clampCamera(): void {
    const params = this.config.gameplayParams;
    const scale = params.renderScale;
    const viewW = this.canvas.width / scale;
    const viewH = this.canvas.height / scale;

    const mapCols = this.config.levelMap[0]?.length || 32;
    const mapRows = this.config.levelMap.length || 20;
    const mapPixelW = mapCols * params.tileSize;
    const mapPixelH = mapRows * params.tileSize;

    const maxX = Math.max(0, mapPixelW - viewW);
    const maxY = Math.max(0, mapPixelH - viewH);

    this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
    this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
  }

  public triggerScreenShake(intensity: number, duration: number = 0.2): void {
    this.camera.shake = intensity;
    this.camera.shakeDuration = duration;
  }

  // ============================================================================
  // COMBAT & ATTACK EXECUTION
  // ============================================================================
  private triggerPlayerAttack(): void {
    if (this.player.state === 'attack') return;

    this.player.state = 'attack';
    this.player.attackTimer = 0;
    this.player.animTimer = 0;

    soundEffects.playSwordSwing();

    // Determine sword hitbox in front of player
    const params = this.config.gameplayParams;
    const pCenter = { x: this.player.x + 16, y: this.player.y + 16 };
    let strikeX = pCenter.x;
    let strikeY = pCenter.y;

    if (this.player.direction === 'down') strikeY += params.attackRange;
    else if (this.player.direction === 'up') strikeY -= params.attackRange;
    else if (this.player.direction === 'left') strikeX -= params.attackRange;
    else if (this.player.direction === 'right') strikeX += params.attackRange;

    // Check hit against active enemies
    let hitCount = 0;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const eCenter = { x: enemy.x + 16, y: enemy.y + 16 };
      const dist = Math.hypot(strikeX - eCenter.x, strikeY - eCenter.y);

      if (dist <= params.attackArcRadius) {
        hitCount++;
        const dmg = params.playerAttackDamage + Math.floor(Math.random() * 6);
        enemy.health -= dmg;
        enemy.hurtTimer = 0.3;

        // Knockback away from player
        const angle = Math.atan2(eCenter.y - pCenter.y, eCenter.x - pCenter.x);
        enemy.x += Math.cos(angle) * 14;
        enemy.y += Math.sin(angle) * 14;

        this.addFloatingText(eCenter.x, eCenter.y - 12, `-${dmg}`, '#ff4444');
        this.spawnBurstParticles(eCenter.x, eCenter.y, '#ff3b30', 8);

        if (enemy.health <= 0) {
          enemy.isDead = true;
          this.player.kills++;
          this.player.score += 100;
          this.player.gold += Math.floor(Math.random() * 15) + 5;
          soundEffects.playEnemyDefeat();
          this.triggerScreenShake(3.5, 0.25);
          this.spawnBurstParticles(eCenter.x, eCenter.y, '#ffd700', 14);
          this.addFloatingText(eCenter.x, eCenter.y - 20, '+GOLD', '#ffd700');
        } else {
          soundEffects.playHit();
          this.triggerScreenShake(1.5, 0.12);
        }
      }
    }
  }

  // ============================================================================
  // 5. ANIMATION CONTROLLER & DRAWING
  // ============================================================================
  private drawAnimatedSprite(
    img: HTMLImageElement,
    meta: SpriteSheetMeta,
    animName: string,
    animTimer: number,
    destX: number,
    destY: number,
    destW: number,
    destH: number,
    tintRed: boolean = false
  ): void {
    const anim = meta.animations[animName] || Object.values(meta.animations)[0];
    if (!anim) return;

    const frameIndex = Math.floor(animTimer * anim.speed) % anim.frameCount;
    const col = anim.startFrame + frameIndex;
    const row = anim.row;
    const fw = meta.frameWidth;
    const fh = meta.frameHeight;

    const sx = col * fw;
    const sy = row * fh;

    if (tintRed) {
      this.ctx.save();
      this.ctx.filter = 'brightness(1.5) sepia(1) saturate(5) hue-rotate(-50deg)';
    }

    this.ctx.drawImage(
      img,
      sx, sy, fw, fh,
      Math.floor(destX), Math.floor(destY), destW, destH
    );

    if (tintRed) {
      this.ctx.restore();
    }
  }

  // ============================================================================
  // PARTICLES & COMBAT FLOATING TEXT
  // ============================================================================
  public addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      lifetime: 0,
      maxLifetime: 0.8
    });
  }

  public spawnBurstParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 60 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.3
      });
    }
  }

  // ============================================================================
  // GAME UPDATE LOOP (Delta Time Math)
  // ============================================================================
  public update(dt: number): void {
    if (!this.isLoaded || this.isPaused) return;

    const params = this.config.gameplayParams;

    // 1. Process Input Vector
    let inputX = 0;
    let inputY = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

    // Apply Virtual / Touch input if present
    if (this.virtualInput.dx !== 0 || this.virtualInput.dy !== 0) {
      inputX = this.virtualInput.dx;
      inputY = this.virtualInput.dy;
    }

    // Spacebar attack
    if ((this.keys['Space'] || this.virtualInput.attack) && this.player.state !== 'attack') {
      this.triggerPlayerAttack();
    }

    // 2. Player State & Movement
    if (this.player.state === 'attack') {
      this.player.attackTimer += dt;
      this.player.animTimer += dt;
      if (this.player.attackTimer >= params.attackDuration) {
        this.player.state = 'idle';
        this.player.attackTimer = 0;
      }
    } else {
      // Normalize diagonal velocity so diagonal movement isn't 1.414x faster
      const len = Math.hypot(inputX, inputY);
      if (len > 0.05) {
        this.player.state = 'walk';
        const normX = inputX / len;
        const normY = inputY / len;

        // Facing direction
        if (Math.abs(normX) > Math.abs(normY)) {
          this.player.direction = normX > 0 ? 'right' : 'left';
        } else {
          this.player.direction = normY > 0 ? 'down' : 'up';
        }

        this.player.vx = normX * params.playerSpeed;
        this.player.vy = normY * params.playerSpeed;
        this.player.animTimer += dt;

        // Move with smooth wall sliding
        this.moveEntityWithSlide(
          this.player,
          this.player.vx,
          this.player.vy,
          dt,
          params.playerHitboxWidth,
          params.playerHitboxHeight,
          params.playerHitboxOffsetY
        );
      } else {
        this.player.state = 'idle';
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.animTimer += dt;
      }
    }

    // Invulnerability timer countdown
    if (this.player.isInvulnerable) {
      this.player.invulnerableTimer -= dt;
      if (this.player.invulnerableTimer <= 0) {
        this.player.isInvulnerable = false;
      }
    }

    // Hazard tiles check (Spikes - tile 9)
    const pCol = Math.floor((this.player.x + 16) / params.tileSize);
    const pRow = Math.floor((this.player.y + 20) / params.tileSize);
    if (this.config.levelMap[pRow]?.[pCol] === 9 && !this.player.isInvulnerable && !this.godMode) {
      this.player.health = Math.max(0, this.player.health - 8);
      this.player.isInvulnerable = true;
      this.player.invulnerableTimer = 0.5;
      soundEffects.playPlayerHurt();
      this.addFloatingText(this.player.x + 16, this.player.y, '-8 SPIKES', '#ff2222');
      this.triggerScreenShake(2.5, 0.2);
    }

    // 3. Enemies AI (Patrol & Chase)
    const pCenter = { x: this.player.x + 16, y: this.player.y + 16 };
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      if (enemy.hurtTimer > 0) {
        enemy.hurtTimer -= dt;
      }

      enemy.animTimer += dt;
      const eCenter = { x: enemy.x + 16, y: enemy.y + 16 };
      const distToPlayer = Math.hypot(pCenter.x - eCenter.x, pCenter.y - eCenter.y);

      let evx = 0;
      let evy = 0;

      // Aggro logic: If within radius, chase player
      if (distToPlayer <= params.enemyAggroRadius) {
        const angle = Math.atan2(pCenter.y - eCenter.y, pCenter.x - eCenter.x);
        evx = Math.cos(angle) * params.enemySpeed;
        evy = Math.sin(angle) * params.enemySpeed;

        if (Math.abs(evx) > Math.abs(evy)) {
          enemy.direction = evx > 0 ? 'right' : 'left';
        } else {
          enemy.direction = evy > 0 ? 'down' : 'up';
        }

        // Damage player on contact
        if (distToPlayer <= 22 && !this.player.isInvulnerable && !this.godMode) {
          this.player.health = Math.max(0, this.player.health - params.enemyDamage);
          this.player.isInvulnerable = true;
          this.player.invulnerableTimer = 0.8;
          soundEffects.playPlayerHurt();
          this.triggerScreenShake(3.0, 0.25);
          this.addFloatingText(this.player.x + 16, this.player.y, `-${params.enemyDamage}`, '#ff1e1e');
        }
      } else {
        // Patrol wandering
        enemy.patrolTimer -= dt;
        if (enemy.patrolTimer <= 0) {
          enemy.patrolTimer = Math.random() * 3 + 2;
          const wanderAngle = Math.random() * Math.PI * 2;
          const wanderDist = Math.random() * 40;
          enemy.targetPatrolX = enemy.spawnX + Math.cos(wanderAngle) * wanderDist;
          enemy.targetPatrolY = enemy.spawnY + Math.sin(wanderAngle) * wanderDist;
        }

        const toTargetX = enemy.targetPatrolX - enemy.x;
        const toTargetY = enemy.targetPatrolY - enemy.y;
        const pDist = Math.hypot(toTargetX, toTargetY);
        if (pDist > 6) {
          evx = (toTargetX / pDist) * (params.enemySpeed * 0.45);
          evy = (toTargetY / pDist) * (params.enemySpeed * 0.45);
          enemy.direction = Math.abs(evx) > Math.abs(evy) ? (evx > 0 ? 'right' : 'left') : (evy > 0 ? 'down' : 'up');
        }
      }

      // Move enemy with tile collision
      this.moveEntityWithSlide(enemy, evx, evy, dt, enemy.hitboxWidth, enemy.hitboxHeight, 14);

      // Animation selection
      const dirCapitalized = enemy.direction.charAt(0).toUpperCase() + enemy.direction.slice(1);
      enemy.currentAnim = enemy.hurtTimer > 0 ? 'hurt' : `walk${dirCapitalized}`;
    }

    // 4. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt; // Rise up
      ft.lifetime += dt;
      if (ft.lifetime >= ft.maxLifetime) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 6. Camera Follow
    this.updateCamera(dt);

    // Notify listeners
    this.onStateUpdate?.(this);
  }

  // ============================================================================
  // RENDER PIPELINE
  // ============================================================================
  public render(): void {
    const scale = this.config.gameplayParams.renderScale;
    const ts = this.config.gameplayParams.tileSize;

    // Reset transform & clear
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#111317';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.isLoaded) {
      this.renderLoadingScreen();
      return;
    }

    // Apply Camera & Scaling transforms
    this.ctx.save();
    this.ctx.scale(scale, scale);

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.camera.shake > 0) {
      shakeX = (Math.random() - 0.5) * this.camera.shake;
      shakeY = (Math.random() - 0.5) * this.camera.shake;
    }

    this.ctx.translate(
      -Math.floor(this.camera.x + shakeX),
      -Math.floor(this.camera.y + shakeY)
    );

    // 1. Draw Visible Map Tiles
    this.renderTiles(ts);

    // 2. Draw Chests
    this.renderChests(ts);

    // 3. Draw Enemies
    this.renderEnemies();

    // 4. Draw Player Character
    this.renderPlayer();

    // 5. Draw Particles
    this.renderParticles();

    // 6. Draw Floating Combat Text
    this.renderFloatingTexts();

    // 7. Debug Colliders Wireframe (if toggled)
    if (this.showColliders) {
      this.renderDebugColliders(ts);
    }

    this.ctx.restore();

    // 8. Draw Screen Space HUD (Health, Gold, Minimap)
    this.renderHUD();
  }

  private renderLoadingScreen(): void {
    this.ctx.fillStyle = '#f0f4f8';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LOADING RPG REALM ASSETS...', this.canvas.width / 2, this.canvas.height / 2 - 20);

    // Progress bar
    const barW = 280;
    const barH = 14;
    const barX = (this.canvas.width - barW) / 2;
    const barY = this.canvas.height / 2 + 10;

    this.ctx.strokeStyle = '#4a5568';
    this.ctx.strokeRect(barX, barY, barW, barH);
    this.ctx.fillStyle = '#3182ce';
    this.ctx.fillRect(barX + 2, barY + 2, (barW - 4) * (this.loadProgress / 100), barH - 4);

    this.ctx.font = '13px monospace';
    this.ctx.fillStyle = '#a0aec0';
    this.ctx.fillText(`${this.loadProgress}%`, this.canvas.width / 2, barY + 34);
  }

  private renderTiles(ts: number): void {
    const tilesetImg = this.loadedImages.get('tileset');
    const map = this.config.levelMap;
    const tilesMeta = this.config.tileSetMeta.tiles;

    // View frustum culling
    const scale = this.config.gameplayParams.renderScale;
    const minCol = Math.max(0, Math.floor(this.camera.x / ts));
    const maxCol = Math.min(map[0].length - 1, Math.ceil((this.camera.x + this.canvas.width / scale) / ts));
    const minRow = Math.max(0, Math.floor(this.camera.y / ts));
    const maxRow = Math.min(map.length - 1, Math.ceil((this.camera.y + this.canvas.height / scale) / ts));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileId = map[r][c];
        const meta = tilesMeta[tileId];
        const dx = c * ts;
        const dy = r * ts;

        if (tilesetImg) {
          const col = meta ? meta.col : 0;
          const row = meta ? meta.row : 0;
          this.ctx.drawImage(tilesetImg, col * ts, row * ts, ts, ts, dx, dy, ts, ts);
        } else {
          // Color fallback
          this.ctx.fillStyle = meta?.colorFallback || '#444';
          this.ctx.fillRect(dx, dy, ts, ts);
        }
      }
    }
  }

  private renderChests(ts: number): void {
    const tilesetImg = this.loadedImages.get('tileset');
    for (const chest of this.chests) {
      const dx = chest.col * ts;
      const dy = chest.row * ts;
      if (chest.opened) {
        // Draw open chest indicator
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        this.ctx.fillRect(dx, dy, ts, ts);
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('OPEN', dx + 16, dy + 20);
      } else {
        // Glowing aura for unopened treasure
        this.ctx.fillStyle = 'rgba(255, 235, 59, 0.15)';
        this.ctx.beginPath();
        this.ctx.arc(dx + 16, dy + 16, 18, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private renderEnemies(): void {
    const enemyImg = this.loadedImages.get('enemy');
    if (!enemyImg) return;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      this.drawAnimatedSprite(
        enemyImg,
        this.config.enemySpriteMeta,
        enemy.currentAnim,
        enemy.animTimer,
        enemy.x,
        enemy.y,
        32,
        32,
        enemy.hurtTimer > 0
      );

      // Enemy Health Bar
      const hpPct = Math.max(0, enemy.health / enemy.maxHealth);
      const barW = 24;
      const barH = 3;
      const barX = enemy.x + 4;
      const barY = enemy.y - 4;

      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(barX, barY, barW, barH);
      this.ctx.fillStyle = enemy.hurtTimer > 0 ? '#ff3b30' : '#4cd964';
      this.ctx.fillRect(barX, barY, barW * hpPct, barH);
    }
  }

  private renderPlayer(): void {
    const playerImg = this.loadedImages.get('player');
    if (!playerImg) return;

    // Flash when invulnerable
    if (this.player.isInvulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
      return; // Skip rendering frame for flicker
    }

    const dirCapitalized = this.player.direction.charAt(0).toUpperCase() + this.player.direction.slice(1);
    const animName = `${this.player.state}${dirCapitalized}`;

    this.drawAnimatedSprite(
      playerImg,
      this.config.playerSpriteMeta,
      animName,
      this.player.animTimer,
      this.player.x,
      this.player.y,
      32,
      32
    );

    // Draw sword slash visual arc during attack
    if (this.player.state === 'attack') {
      const pCenter = { x: this.player.x + 16, y: this.player.y + 16 };
      const range = this.config.gameplayParams.attackRange;
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();

      if (this.player.direction === 'down') {
        this.ctx.arc(pCenter.x, pCenter.y + 10, range * 0.7, 0, Math.PI);
      } else if (this.player.direction === 'up') {
        this.ctx.arc(pCenter.x, pCenter.y - 10, range * 0.7, Math.PI, Math.PI * 2);
      } else if (this.player.direction === 'left') {
        this.ctx.arc(pCenter.x - 10, pCenter.y, range * 0.7, Math.PI * 0.5, Math.PI * 1.5);
      } else {
        this.ctx.arc(pCenter.x + 10, pCenter.y, range * 0.7, -Math.PI * 0.5, Math.PI * 0.5);
      }
      this.ctx.stroke();
    }
  }

  private renderParticles(): void {
    for (const p of this.particles) {
      const alpha = 1.0 - (p.life / p.maxLife);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, alpha);
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    this.ctx.globalAlpha = 1.0;
  }

  private renderFloatingTexts(): void {
    for (const ft of this.floatingTexts) {
      const alpha = 1.0 - (ft.lifetime / ft.maxLifetime);
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = Math.max(0, alpha);
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
    }
    this.ctx.globalAlpha = 1.0;
  }

  private renderDebugColliders(ts: number): void {
    const params = this.config.gameplayParams;

    // Player Hitbox
    this.ctx.strokeStyle = '#00ff66';
    this.ctx.lineWidth = 1;
    const pBoxX = this.player.x + (32 - params.playerHitboxWidth) / 2;
    const pBoxY = this.player.y + params.playerHitboxOffsetY;
    this.ctx.strokeRect(pBoxX, pBoxY, params.playerHitboxWidth, params.playerHitboxHeight);

    // Enemy Hitboxes
    this.ctx.strokeStyle = '#ff3333';
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const eBoxX = enemy.x + (32 - enemy.hitboxWidth) / 2;
      const eBoxY = enemy.y + 14;
      this.ctx.strokeRect(eBoxX, eBoxY, enemy.hitboxWidth, enemy.hitboxHeight);
      // Aggro circle
      this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + 16, enemy.y + 16, params.enemyAggroRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private renderHUD(): void {
    const hpPct = Math.max(0, this.player.health / this.player.maxHealth);

    // Health Bar Container (Top-Left)
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(16, 16, 210, 54);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(16, 16, 210, 54);

    // Health Bar
    this.ctx.fillStyle = '#dc2626';
    this.ctx.fillRect(24, 38, 194 * hpPct, 12);
    this.ctx.strokeStyle = '#991b1b';
    this.ctx.strokeRect(24, 38, 194, 12);

    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`HP: ${Math.round(this.player.health)} / ${this.player.maxHealth}`, 24, 32);

    // Gold & Kills Badge (Top-Left under HP)
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = '11px monospace';
    this.ctx.fillText(`GOLD: ${this.player.gold}  |  KILLS: ${this.player.kills}`, 24, 62);

    // Top-Right Minimap
    if (this.showMinimap) {
      this.renderMinimap();
    }
  }

  private renderMinimap(): void {
    const map = this.config.levelMap;
    const cols = map[0].length;
    const rows = map.length;
    const mmScale = 3;
    const mmW = cols * mmScale;
    const mmH = rows * mmScale;
    const mmX = this.canvas.width - mmW - 16;
    const mmY = 16;

    this.ctx.fillStyle = 'rgba(10, 14, 23, 0.8)';
    this.ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    this.ctx.strokeStyle = '#475569';
    this.ctx.strokeRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = map[r][c];
        let color = '#2e7d32'; // grass
        if (tile === 1) color = '#8d6e63'; // path
        else if (tile === 2) color = '#1565c0'; // water
        else if (tile === 3 || tile === 6) color = '#455a64'; // wall
        else if (tile === 8) color = '#ffd700'; // chest
        else if (tile === 10) color = '#9c27b0'; // portal

        this.ctx.fillStyle = color;
        this.ctx.fillRect(mmX + c * mmScale, mmY + r * mmScale, mmScale, mmScale);
      }
    }

    // Player Blip (cyan)
    const ts = this.config.gameplayParams.tileSize;
    const pBlipX = mmX + (this.player.x / ts) * mmScale;
    const pBlipY = mmY + (this.player.y / ts) * mmScale;
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillRect(pBlipX - 1, pBlipY - 1, 3, 3);

    // Enemy Blips (red)
    this.ctx.fillStyle = '#ff3333';
    for (const e of this.enemies) {
      if (e.isDead) continue;
      const eBlipX = mmX + (e.x / ts) * mmScale;
      const eBlipY = mmY + (e.y / ts) * mmScale;
      this.ctx.fillRect(eBlipX - 1, eBlipY - 1, 2, 2);
    }
  }

  // ============================================================================
  // MAIN GAME LOOP (requestAnimationFrame with Delta Time)
  // ============================================================================
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Delta time calculation in seconds
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta time to 0.1s to prevent huge jumps if tab was blurred/throttled
    if (dt > 0.1) dt = 0.1;

    // FPS Counter
    this.fpsCounter++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
    }

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
