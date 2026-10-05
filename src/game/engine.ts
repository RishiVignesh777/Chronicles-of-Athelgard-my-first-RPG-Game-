/**
 * ==============================================================================
 * ⚔️ ZERO-DEPENDENCY HTML5 CANVAS 2D ACTION RPG GAME ENGINE
 * ==============================================================================
 * High-performance, top-down Action RPG engine supporting multiple levels,
 * level transitions, collision grids, audio synthesis, and modular asset loading.
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
import { LevelManager } from './LevelManager';
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

  // Level Manager (State Machine for Multi-Level Transitions & Victory)
  public levelManager: LevelManager;

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

    // Initialize Level Manager
    this.levelManager = new LevelManager(this);

    this.initInputListeners();
  }

  // Active level map accessor
  public get currentMap(): number[][] {
    return this.levelManager.getCurrentLevel().mapData;
  }

  // ============================================================================
  // 1. ASSET LOADER (Promise-Based with Procedural Fallbacks)
  // ============================================================================
  public async loadAssets(): Promise<void> {
    this.isLoaded = false;
    this.loadProgress = 10;
    this.loadError = null;

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
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          this.loadedImages.set(key, img);
          completed++;
          this.loadProgress = Math.round((completed / total) * 100);
          resolve();
        };

        img.onerror = () => {
          console.warn(`[AssetLoader] Fallback texture generated for ${key}`);
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
      await this.levelManager.loadLevel(this.levelManager.currentLevelIndex);
    } catch (err) {
      console.error('Fatal error loading assets:', err);
      this.loadError = 'Failed to load assets: ' + String(err);
    }
  }

  // ============================================================================
  // 2. INPUT HANDLER (Keyboard, Touch/Virtual, Gamepad)
  // ============================================================================
  private initInputListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // If in Victory screen, Spacebar restarts
      if (this.levelManager.isGameComplete && e.code === 'Space') {
        this.levelManager.restartGame();
        return;
      }

      if (e.code === 'KeyE') {
        this.interactAction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('click', () => {
      if (this.levelManager.isGameComplete) {
        this.levelManager.restartGame();
      }
    });

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
  }

  // ============================================================================
  // 3. COLLISION DETECTION (Grid-Based AABB Against Solid Tiles)
  // ============================================================================
  public isSolidTile(col: number, row: number): boolean {
    const map = this.currentMap;
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
      return true; // Map bounds are solid
    }
    const tileId = map[row][col];
    const meta = this.config.tileSetMeta.tiles[tileId];
    if (!meta) return true;

    // Opened chests are passable
    if (tileId === 8) {
      const ch = this.chests.find(c => c.col === col && c.row === row);
      if (ch && ch.opened) return false;
    }

    return meta.solid;
  }

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

    if (!this.checkTileCollision(boxX, currentBoxY, boxW, boxH)) {
      entity.x = newX;
    }

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

    this.camera.targetX = this.player.x + 16 - viewW / 2;
    this.camera.targetY = this.player.y + 16 - viewH / 2;

    const lerp = Math.min(1.0, dt * params.cameraLerpSpeed);
    this.camera.x += (this.camera.targetX - this.camera.x) * lerp;
    this.camera.y += (this.camera.targetY - this.camera.y) * lerp;

    this.clampCamera();

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

    const map = this.currentMap;
    const mapCols = map[0]?.length || 32;
    const mapRows = map.length || 20;
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
    if (this.player.state === 'attack' || this.levelManager.isTransitioning || this.levelManager.isGameComplete) return;

    this.player.state = 'attack';
    this.player.attackTimer = 0;
    this.player.animTimer = 0;

    soundEffects.playSwordSwing();

    const params = this.config.gameplayParams;
    const pCenter = { x: this.player.x + 16, y: this.player.y + 16 };
    let strikeX = pCenter.x;
    let strikeY = pCenter.y;

    if (this.player.direction === 'down') strikeY += params.attackRange;
    else if (this.player.direction === 'up') strikeY -= params.attackRange;
    else if (this.player.direction === 'left') strikeX -= params.attackRange;
    else if (this.player.direction === 'right') strikeX += params.attackRange;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const eCenter = { x: enemy.x + 16, y: enemy.y + 16 };
      const dist = Math.hypot(strikeX - eCenter.x, strikeY - eCenter.y);

      if (dist <= params.attackArcRadius) {
        const dmg = params.playerAttackDamage + Math.floor(Math.random() * 6);
        enemy.health -= dmg;
        enemy.hurtTimer = 0.3;

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

    // 1. Update Level Manager State Machine (transitions, victory, exit collisions)
    this.levelManager.update(dt);

    // If game is complete (Victory state), freeze game loop physics & movement!
    if (this.levelManager.isGameComplete) {
      this.onStateUpdate?.(this);
      return;
    }

    const params = this.config.gameplayParams;

    // If currently fading between levels, freeze player movement
    if (this.levelManager.isTransitioning) {
      this.player.vx = 0;
      this.player.vy = 0;
      this.onStateUpdate?.(this);
      return;
    }

    // 2. Process Input
    let inputX = 0;
    let inputY = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

    if (this.virtualInput.dx !== 0 || this.virtualInput.dy !== 0) {
      inputX = this.virtualInput.dx;
      inputY = this.virtualInput.dy;
    }

    if ((this.keys['Space'] || this.virtualInput.attack) && this.player.state !== 'attack') {
      this.triggerPlayerAttack();
    }

    // 3. Player Movement & Animation
    if (this.player.state === 'attack') {
      this.player.attackTimer += dt;
      this.player.animTimer += dt;
      if (this.player.attackTimer >= params.attackDuration) {
        this.player.state = 'idle';
        this.player.attackTimer = 0;
      }
    } else {
      const len = Math.hypot(inputX, inputY);
      if (len > 0.05) {
        this.player.state = 'walk';
        const normX = inputX / len;
        const normY = inputY / len;

        if (Math.abs(normX) > Math.abs(normY)) {
          this.player.direction = normX > 0 ? 'right' : 'left';
        } else {
          this.player.direction = normY > 0 ? 'down' : 'up';
        }

        this.player.vx = normX * params.playerSpeed;
        this.player.vy = normY * params.playerSpeed;
        this.player.animTimer += dt;

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

    if (this.player.isInvulnerable) {
      this.player.invulnerableTimer -= dt;
      if (this.player.invulnerableTimer <= 0) {
        this.player.isInvulnerable = false;
      }
    }

    // Spikes check (Tile 9)
    const pCol = Math.floor((this.player.x + 16) / params.tileSize);
    const pRow = Math.floor((this.player.y + 20) / params.tileSize);
    if (this.currentMap[pRow]?.[pCol] === 9 && !this.player.isInvulnerable && !this.godMode) {
      this.player.health = Math.max(0, this.player.health - 8);
      this.player.isInvulnerable = true;
      this.player.invulnerableTimer = 0.5;
      soundEffects.playPlayerHurt();
      this.addFloatingText(this.player.x + 16, this.player.y, '-8 SPIKES', '#ff2222');
      this.triggerScreenShake(2.5, 0.2);
    }

    // 4. Enemies AI
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

      if (distToPlayer <= params.enemyAggroRadius) {
        const angle = Math.atan2(pCenter.y - eCenter.y, pCenter.x - eCenter.x);
        evx = Math.cos(angle) * params.enemySpeed;
        evy = Math.sin(angle) * params.enemySpeed;

        enemy.direction = Math.abs(evx) > Math.abs(evy) ? (evx > 0 ? 'right' : 'left') : (evy > 0 ? 'down' : 'up');

        if (distToPlayer <= 22 && !this.player.isInvulnerable && !this.godMode) {
          this.player.health = Math.max(0, this.player.health - params.enemyDamage);
          this.player.isInvulnerable = true;
          this.player.invulnerableTimer = 0.8;
          soundEffects.playPlayerHurt();
          this.triggerScreenShake(3.0, 0.25);
          this.addFloatingText(this.player.x + 16, this.player.y, `-${params.enemyDamage}`, '#ff1e1e');
        }
      } else {
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

      this.moveEntityWithSlide(enemy, evx, evy, dt, enemy.hitboxWidth, enemy.hitboxHeight, 14);
      const dirCapitalized = enemy.direction.charAt(0).toUpperCase() + enemy.direction.slice(1);
      enemy.currentAnim = enemy.hurtTimer > 0 ? 'hurt' : `walk${dirCapitalized}`;
    }

    // 5. Update Particles & Floating Text
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      if (p.life >= p.maxLife) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.lifetime += dt;
      if (ft.lifetime >= ft.maxLifetime) this.floatingTexts.splice(i, 1);
    }

    this.updateCamera(dt);
    this.onStateUpdate?.(this);
  }

  // ============================================================================
  // RENDER PIPELINE
  // ============================================================================
  public render(): void {
    const scale = this.config.gameplayParams.renderScale;
    const ts = this.config.gameplayParams.tileSize;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#0b0f19';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.isLoaded) {
      this.renderLoadingScreen();
      return;
    }

    this.ctx.save();
    this.ctx.scale(scale, scale);

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

    // 7. Debug Colliders
    if (this.showColliders) {
      this.renderDebugColliders(ts);
    }

    this.ctx.restore();

    // 8. Draw Screen Space HUD (Health, Gold, Minimap, Current Level)
    this.renderHUD();

    // 9. Draw Level Transition Overlays & Victory Screen
    this.levelManager.renderOverlays(this.ctx, this.canvas.width, this.canvas.height);
  }

  private renderLoadingScreen(): void {
    this.ctx.fillStyle = '#f0f4f8';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LOADING RPG REALM ASSETS...', this.canvas.width / 2, this.canvas.height / 2 - 20);

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
    const map = this.currentMap;
    const tilesMeta = this.config.tileSetMeta.tiles;

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
          this.ctx.fillStyle = meta?.colorFallback || '#444';
          this.ctx.fillRect(dx, dy, ts, ts);
        }
      }
    }
  }

  private renderChests(ts: number): void {
    for (const chest of this.chests) {
      const dx = chest.col * ts;
      const dy = chest.row * ts;
      if (chest.opened) {
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        this.ctx.fillRect(dx, dy, ts, ts);
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('OPEN', dx + 16, dy + 20);
      } else {
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

    if (this.player.isInvulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
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

    this.ctx.strokeStyle = '#00ff66';
    this.ctx.lineWidth = 1;
    const pBoxX = this.player.x + (32 - params.playerHitboxWidth) / 2;
    const pBoxY = this.player.y + params.playerHitboxOffsetY;
    this.ctx.strokeRect(pBoxX, pBoxY, params.playerHitboxWidth, params.playerHitboxHeight);

    this.ctx.strokeStyle = '#ff3333';
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const eBoxX = enemy.x + (32 - enemy.hitboxWidth) / 2;
      const eBoxY = enemy.y + 14;
      this.ctx.strokeRect(eBoxX, eBoxY, enemy.hitboxWidth, enemy.hitboxHeight);
      this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + 16, enemy.y + 16, params.enemyAggroRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private renderHUD(): void {
    const hpPct = Math.max(0, this.player.health / this.player.maxHealth);
    const curLevel = this.levelManager.getCurrentLevel();

    // Top-Left HP & Level Badge
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.ctx.fillRect(16, 16, 230, 68);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(16, 16, 230, 68);

    // Current Level Name
    this.ctx.fillStyle = curLevel.themeColor || '#38bdf8';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LVL ${this.levelManager.currentLevelIndex + 1}/${this.levelManager.levels.length}: ${curLevel.name.slice(0, 20)}`, 24, 32);

    // Health Bar
    this.ctx.fillStyle = '#dc2626';
    this.ctx.fillRect(24, 42, 214 * hpPct, 10);
    this.ctx.strokeStyle = '#991b1b';
    this.ctx.strokeRect(24, 42, 214, 10);

    // Gold & Kills
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = '11px monospace';
    this.ctx.fillText(`HP: ${Math.round(this.player.health)}  |  GOLD: ${this.player.gold}  |  KILLS: ${this.player.kills}`, 24, 70);

    if (this.showMinimap) {
      this.renderMinimap();
    }
  }

  private renderMinimap(): void {
    const map = this.currentMap;
    const cols = map[0].length;
    const rows = map.length;
    const mmScale = 3;
    const mmW = cols * mmScale;
    const mmH = rows * mmScale;
    const mmX = this.canvas.width - mmW - 16;
    const mmY = 16;

    this.ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    this.ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    this.ctx.strokeStyle = '#475569';
    this.ctx.strokeRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = map[r][c];
        let color = '#2e7d32';
        if (tile === 1) color = '#8d6e63';
        else if (tile === 2) color = '#1565c0';
        else if (tile === 3 || tile === 6) color = '#455a64';
        else if (tile === 8) color = '#ffd700';
        else if (tile === 10) color = '#a855f7';

        this.ctx.fillStyle = color;
        this.ctx.fillRect(mmX + c * mmScale, mmY + r * mmScale, mmScale, mmScale);
      }
    }

    const ts = this.config.gameplayParams.tileSize;
    const pBlipX = mmX + (this.player.x / ts) * mmScale;
    const pBlipY = mmY + (this.player.y / ts) * mmScale;
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillRect(pBlipX - 1, pBlipY - 1, 3, 3);

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

    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt > 0.1) dt = 0.1;

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
