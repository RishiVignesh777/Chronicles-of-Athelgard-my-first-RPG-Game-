/**
 * ==============================================================================
 * 🗺️ LEVEL MANAGER (STATE MACHINE & LEVEL TRANSITION CONTROLLER)
 * ==============================================================================
 * Handles:
 * 1. Loading: Tearing down previous map collisions, swapping tilesets, & parsing new grid.
 * 2. Transitioning: Detecting AABB intersection with exitTile & running smooth fade transitions.
 * 3. Resetting: Clearing active enemies, chests, particles, & spawning player at playerSpawn.
 * 4. Game Complete: Transitioning to the Victory state when the final level exit is reached.
 * ==============================================================================
 */

import { LevelConfig, PlayerSpawnPoint, ExitTileSpec } from './AssetConfig';
import { GameEngine } from './engine';
import { soundEffects } from './soundEffects';

export class LevelManager {
  public engine: GameEngine;
  public currentLevelIndex: number = 0;

  // Transition state
  public isTransitioning: boolean = false;
  public transitionProgress: number = 0; // 0 -> 1 (fade out) -> 0 (fade in)
  public transitionPhase: 'in' | 'out' = 'out';
  public pendingLevelIndex: number | null = null;

  // Level intro banner
  public bannerTimer: number = 0;
  public bannerText: string = '';
  public bannerColor: string = '#60a5fa';

  // Game Victory state
  public isGameComplete: boolean = false;
  public victoryTimer: number = 0;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  public get levels(): LevelConfig[] {
    return this.engine.config.levels;
  }

  public getCurrentLevel(): LevelConfig {
    if (!this.levels || this.levels.length === 0) {
      throw new Error('No levels defined in AssetConfig.levels');
    }
    const idx = Math.max(0, Math.min(this.currentLevelIndex, this.levels.length - 1));
    return this.levels[idx];
  }

  // ============================================================================
  // 1. LEVEL LOADING & TEARDOWN
  // ============================================================================
  public async loadLevel(levelIndex: number): Promise<void> {
    if (levelIndex < 0 || levelIndex >= this.levels.length) return;

    this.currentLevelIndex = levelIndex;
    const level = this.levels[levelIndex];
    const ts = this.engine.config.gameplayParams.tileSize;

    // 1. Takedown current entities & world state
    this.engine.enemies = [];
    this.engine.chests = [];
    this.engine.particles = [];
    this.engine.floatingTexts = [];

    // 2. Custom Tileset handling (if specified by level, swap or fallback)
    if (level.tilesetUrl && level.tilesetUrl.trim() !== '') {
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            this.engine.loadedImages.set('tileset', img);
            resolve();
          };
          img.onerror = () => {
            console.warn(`[LevelManager] Failed to load custom tileset for "${level.name}". Falling back to default.`);
            resolve();
          };
          img.src = level.tilesetUrl!;
        });
      } catch {
        // Fallback safety
      }
    }

    // 3. Resolve Player Spawn coordinates
    const spawnColRow = this.parseColRow(level.playerSpawn);
    this.engine.player.x = spawnColRow.col * ts;
    this.engine.player.y = spawnColRow.row * ts;
    this.engine.player.vx = 0;
    this.engine.player.vy = 0;
    this.engine.player.state = 'idle';

    // 4. Register Chests & Interactables from Map Data
    const map = level.mapData;
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        if (map[r][c] === 8) {
          this.engine.chests.push({ col: c, row: r, opened: false });
        }
      }
    }

    // 5. Spawn Enemies
    if (level.enemySpawns && level.enemySpawns.length > 0) {
      let idCounter = 1;
      for (const sp of level.enemySpawns) {
        this.engine.enemies.push({
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
          health: sp.health || this.engine.config.gameplayParams.enemyHealth,
          maxHealth: sp.health || this.engine.config.gameplayParams.enemyHealth,
          hitboxWidth: 20,
          hitboxHeight: 18,
          hurtTimer: 0,
          isDead: false,
          patrolTimer: Math.random() * 3,
          targetPatrolX: sp.col * ts,
          targetPatrolY: sp.row * ts
        });
      }
    } else {
      // Procedural enemy spawns on safe floor tiles
      this.spawnProceduralEnemies(map, ts);
    }

    // 6. Camera Snap to player spawn
    const scale = this.engine.config.gameplayParams.renderScale;
    this.engine.camera.x = this.engine.player.x + 16 - (this.engine.canvas.width / (2 * scale));
    this.engine.camera.y = this.engine.player.y + 16 - (this.engine.canvas.height / (2 * scale));

    // 7. Show Level Intro Banner
    this.bannerText = level.name;
    this.bannerColor = level.themeColor || '#38bdf8';
    this.bannerTimer = 3.2; // Show for 3.2 seconds
  }

  private spawnProceduralEnemies(map: number[][], ts: number): void {
    let idCounter = 1;
    const pCol = Math.floor(this.engine.player.x / ts);
    const pRow = Math.floor(this.engine.player.y / ts);

    for (let r = 2; r < map.length - 2; r += 3) {
      for (let c = 2; c < map[r].length - 2; c += 4) {
        const tile = map[r][c];
        const distFromSpawn = Math.hypot(c - pCol, r - pRow);
        // Place on walkable floor (0, 1, 4, 7) away from spawn
        if ((tile === 0 || tile === 1 || tile === 4 || tile === 7) && distFromSpawn > 5) {
          if (Math.random() > 0.45 && this.engine.enemies.length < 9) {
            this.engine.enemies.push({
              id: idCounter++,
              x: c * ts,
              y: r * ts,
              spawnX: c * ts,
              spawnY: r * ts,
              vx: 0,
              vy: 0,
              direction: 'down',
              currentAnim: 'walkDown',
              animTimer: Math.random() * 2,
              health: this.engine.config.gameplayParams.enemyHealth,
              maxHealth: this.engine.config.gameplayParams.enemyHealth,
              hitboxWidth: 20,
              hitboxHeight: 18,
              hurtTimer: 0,
              isDead: false,
              patrolTimer: Math.random() * 3,
              targetPatrolX: c * ts,
              targetPatrolY: r * ts
            });
          }
        }
      }
    }
  }

  // ============================================================================
  // 2. LEVEL TRANSITIONS & AABB EXIT DETECTION
  // ============================================================================
  public checkLevelExitCollision(): void {
    if (this.isTransitioning || this.isGameComplete) return;

    const level = this.getCurrentLevel();
    const ts = this.engine.config.gameplayParams.tileSize;

    // Player AABB center & feet
    const pCenter = { x: this.engine.player.x + 16, y: this.engine.player.y + 20 };
    const pCol = Math.floor(pCenter.x / ts);
    const pRow = Math.floor(pCenter.y / ts);

    let isAtExit = false;

    // Check by Exit Coordinate [col, row]
    if (Array.isArray(level.exitTile)) {
      if (pCol === level.exitTile[0] && pRow === level.exitTile[1]) {
        isAtExit = true;
      }
    } else if (typeof level.exitTile === 'object' && level.exitTile !== null) {
      if (pCol === level.exitTile.col && pRow === level.exitTile.row) {
        isAtExit = true;
      }
    } else {
      // Check by Exit Tile ID (e.g. Tile 10 = Portal Gate)
      const targetTileId = typeof level.exitTile === 'number' ? level.exitTile : (level.exitTileId ?? 10);
      const currentTile = level.mapData[pRow]?.[pCol];
      if (currentTile === targetTileId) {
        isAtExit = true;
      }
    }

    if (isAtExit) {
      this.triggerLevelTransition();
    }
  }

  public triggerLevelTransition(targetIndex?: number): void {
    if (this.isTransitioning || this.isGameComplete) return;

    const nextIndex = targetIndex !== undefined ? targetIndex : this.currentLevelIndex + 1;

    // Check if this is the final level completion -> VICTORY!
    if (nextIndex >= this.levels.length) {
      this.triggerVictory();
      return;
    }

    soundEffects.playLevelComplete();
    this.engine.spawnBurstParticles(
      this.engine.player.x + 16,
      this.engine.player.y + 16,
      '#a855f7',
      24
    );

    this.isTransitioning = true;
    this.transitionPhase = 'out'; // Fade to black
    this.transitionProgress = 0;
    this.pendingLevelIndex = nextIndex;
  }

  // ============================================================================
  // 3. GAME COMPLETE / VICTORY STATE
  // ============================================================================
  public triggerVictory(): void {
    this.isGameComplete = true;
    this.victoryTimer = 0;
    soundEffects.playVictoryFanfare();

    this.engine.spawnBurstParticles(
      this.engine.player.x + 16,
      this.engine.player.y + 16,
      '#ffd700',
      40
    );

    this.engine.onNotification?.('QUEST COMPLETE! You have conquered the Chronicles of Aethelgard!');
  }

  public restartGame(): void {
    this.isGameComplete = false;
    this.victoryTimer = 0;
    this.currentLevelIndex = 0;
    this.engine.player.gold = 0;
    this.engine.player.score = 0;
    this.engine.player.kills = 0;
    this.engine.player.health = this.engine.config.gameplayParams.playerHealth;
    this.loadLevel(0);
  }

  // ============================================================================
  // UPDATE LOOP (Handles transitions, banners, and victory timer)
  // ============================================================================
  public update(dt: number): void {
    // 1. Victory Timer
    if (this.isGameComplete) {
      this.victoryTimer += dt;
      // Ambient celebration sparkles
      if (Math.random() < 0.3) {
        const randX = this.engine.player.x + (Math.random() - 0.5) * 200;
        const randY = this.engine.player.y + (Math.random() - 0.5) * 200;
        this.engine.spawnBurstParticles(randX, randY, '#facc15', 3);
      }
      return;
    }

    // 2. Banner Timer
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }

    // 3. Transition Animation State Machine
    if (this.isTransitioning) {
      const speed = 2.4; // Transition fade speed
      if (this.transitionPhase === 'out') {
        this.transitionProgress += dt * speed;
        if (this.transitionProgress >= 1.0) {
          this.transitionProgress = 1.0;
          this.transitionPhase = 'in';

          // Swap map while screen is fully black
          if (this.pendingLevelIndex !== null) {
            this.loadLevel(this.pendingLevelIndex);
            this.pendingLevelIndex = null;
          }
        }
      } else {
        // Fade back in
        this.transitionProgress -= dt * speed;
        if (this.transitionProgress <= 0) {
          this.transitionProgress = 0;
          this.isTransitioning = false;
        }
      }
    } else {
      // Check for exit trigger
      this.checkLevelExitCollision();
    }
  }

  // ============================================================================
  // RENDER TRANSITION & VICTORY OVERLAYS
  // ============================================================================
  public renderOverlays(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // 1. Transition Fade Screen
    if (this.isTransitioning && this.transitionProgress > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(11, 15, 25, ${Math.min(1.0, this.transitionProgress)})`;
      ctx.fillRect(0, 0, width, height);

      // Swirling portal icon or text
      if (this.transitionProgress > 0.5) {
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ENTERING PORTAL...', width / 2, height / 2);
      }
      ctx.restore();
    }

    // 2. Level Intro Title Banner
    if (this.bannerTimer > 0 && !this.isTransitioning && !this.isGameComplete) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const alpha = Math.min(1.0, this.bannerTimer < 0.6 ? this.bannerTimer / 0.6 : 1.0);
      ctx.globalAlpha = alpha;

      const bannerY = height * 0.22;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, bannerY - 26, width, 52);
      ctx.strokeStyle = this.bannerColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, bannerY - 26);
      ctx.lineTo(width, bannerY - 26);
      ctx.moveTo(0, bannerY + 26);
      ctx.lineTo(width, bannerY + 26);
      ctx.stroke();

      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = this.bannerColor;
      ctx.textAlign = 'center';
      ctx.fillText(this.bannerText.toUpperCase(), width / 2, bannerY + 6);
      ctx.restore();
    }

    // 3. Victory Screen Overlay
    if (this.isGameComplete) {
      this.renderVictoryScreen(ctx, width, height);
    }
  }

  private renderVictoryScreen(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Dark semi-transparent victory backdrop
    ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Victory Trophy Box
    const boxW = Math.min(520, width - 40);
    const boxH = 340;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Glowing Headline
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.fillText('★ YOU WIN! ★', cx, boxY + 54);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '14px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('THE REALM OF AETHELGARD IS SAVED!', cx, boxY + 86);

    // Divider line
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 30, boxY + 104);
    ctx.lineTo(boxX + boxW - 30, boxY + 104);
    ctx.stroke();

    // Stats Grid
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    const leftCol = boxX + 60;
    const rightCol = boxX + boxW - 140;

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL GOLD:', leftCol, boxY + 140);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${this.engine.player.gold} COINS`, rightCol, boxY + 140);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ENEMIES SLAIN:', leftCol, boxY + 172);
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${this.engine.player.kills}`, rightCol, boxY + 172);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('LEVELS COMPLETED:', leftCol, boxY + 204);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${this.levels.length} / ${this.levels.length}`, rightCol, boxY + 204);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('QUEST SCORE:', leftCol, boxY + 236);
    ctx.fillStyle = '#a855f7';
    ctx.fillText(`${this.engine.player.score + this.engine.player.gold * 10}`, rightCol, boxY + 236);

    // Call to Action Prompt
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#4ade80';
    const pulse = Math.sin(Date.now() / 250) * 0.2 + 0.8;
    ctx.globalAlpha = pulse;
    ctx.fillText('PRESS [SPACE] OR CLICK BELOW TO PLAY AGAIN', cx, boxY + 295);
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  // Helper to parse either [col, row] or { col, row }
  private parseColRow(pt: PlayerSpawnPoint): { col: number; row: number } {
    if (Array.isArray(pt)) {
      return { col: pt[0], row: pt[1] };
    }
    if (typeof pt === 'object' && pt !== null) {
      return { col: pt.col ?? 0, row: pt.row ?? 0 };
    }
    return { col: 1, row: 1 };
  }
}
