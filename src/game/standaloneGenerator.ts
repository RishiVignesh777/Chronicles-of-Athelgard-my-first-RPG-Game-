/**
 * Single-File Standalone HTML Game Generator with Multi-Level Engine.
 * Generates a 100% self-contained index.html with inline CSS and Vanilla JavaScript
 * featuring the GameLevels array at the top for easy modding and pasting of custom maps.
 */

import { AssetConfigType } from './AssetConfig';

export function generateStandaloneIndexHtml(config: AssetConfigType): string {
  const levelsJson = JSON.stringify(config.levels, null, 2);
  const playerMetaJson = JSON.stringify(config.playerSpriteMeta, null, 2);
  const enemyMetaJson = JSON.stringify(config.enemySpriteMeta, null, 2);
  const tilesMetaJson = JSON.stringify(config.tileSetMeta, null, 2);
  const gameplayParamsJson = JSON.stringify(config.gameplayParams, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Chronicles of Aethelgard - 2D Action RPG Engine</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    #game-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #1a202c 0%, #080a10 100%);
    }
    canvas {
      display: block;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      background-color: #000;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
    }
    #hint-bar {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 12px;
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.1);
      pointer-events: none;
      z-index: 10;
    }
    #mobile-controls {
      display: none;
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      padding: 0 24px;
      justify-content: space-between;
      pointer-events: none;
    }
    @media (pointer: coarse), (max-width: 768px) {
      #mobile-controls {
        display: flex;
      }
    }
    .touch-btn {
      pointer-events: auto;
      background: rgba(30, 41, 59, 0.75);
      border: 2px solid rgba(148, 163, 184, 0.4);
      color: #fff;
      font-weight: bold;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
    }
    .d-pad {
      display: grid;
      grid-template-columns: repeat(3, 48px);
      grid-template-rows: repeat(3, 48px);
      gap: 4px;
    }
    .action-btn {
      width: 72px;
      height: 72px;
      background: rgba(220, 38, 38, 0.75);
      border-color: rgba(248, 113, 113, 0.6);
      font-size: 14px;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div id="hint-bar">WASD / Arrow Keys: Move &bull; SPACE: Slash Attack &bull; Step on Portal (Tile 10) to advance!</div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <div id="mobile-controls">
      <div class="d-pad">
        <div></div>
        <button class="touch-btn" id="btn-up">&#9650;</button>
        <div></div>
        <button class="touch-btn" id="btn-left">&#9664;</button>
        <div></div>
        <button class="touch-btn" id="btn-right">&#9654;</button>
        <div></div>
        <button class="touch-btn" id="btn-down">&#9660;</button>
        <div></div>
      </div>
      <button class="touch-btn action-btn" id="btn-attack">SLASH</button>
    </div>
  </div>

  <script>
  /**
   * ==============================================================================
   * 🗺️ GAME LEVELS CONFIGURATION (MULTI-LEVEL ACTION RPG)
   * ==============================================================================
   * To add or modify levels, simply paste or edit the objects in 'GameLevels' below!
   * Each level definition contains:
   *   - name: Level title displayed in the transition banner
   *   - tilesetUrl: (Optional) URL to custom tileset image, or null for default
   *   - playerSpawn: [col, row] or { col: X, row: Y } starting position
   *   - exitTile: Tile ID (e.g. 10 for portal) or [col, row] coordinate
   *   - mapData: 2D array matrix of tile IDs (compatible with Tiled map exports)
   *
   * Tile ID Reference:
   *   0 = Grass (Walkable)
   *   1 = Cobblestone Path (Walkable)
   *   2 = Deep Water (Solid)
   *   3 = Stone Wall (Solid)
   *   4 = Wood Floor (Walkable)
   *   5 = Ancient Tree (Solid)
   *   6 = Dungeon Wall (Solid)
   *   7 = Dungeon Floor (Walkable)
   *   8 = Treasure Chest (Solid / Interactable)
   *   9 = Spikes (Damage Hazard)
   *  10 = Portal Gate (Level Transition Exit)
   * ==============================================================================
   */
  const GameLevels = ${levelsJson};

  const AssetConfig = {
    playerSpriteSheet: "${config.playerSpriteSheet || ''}",
    enemySpriteSheet: "${config.enemySpriteSheet || ''}",
    tileSet: "${config.tileSet || ''}",
    playerSpriteMeta: ${playerMetaJson},
    enemySpriteMeta: ${enemyMetaJson},
    tileSetMeta: ${tilesMetaJson},
    levels: GameLevels,
    gameplayParams: ${gameplayParamsJson}
  };

  // --- Procedural Fallbacks ---
  function genTileset() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#3a7d44'; ctx.fillRect(0,0,32,32); ctx.fillStyle = '#489454'; ctx.fillRect(4,6,2,4); ctx.fillRect(20,18,2,5);
    ctx.fillStyle = '#c7a26b'; ctx.fillRect(32,0,32,32); ctx.fillStyle = '#b38d56'; ctx.fillRect(36,4,10,8);
    ctx.fillStyle = '#2a6fa8'; ctx.fillRect(64,0,32,32); ctx.fillStyle = '#3988c7'; ctx.fillRect(68,6,12,2);
    ctx.fillStyle = '#595d66'; ctx.fillRect(96,0,32,32); ctx.fillStyle = '#737882'; ctx.fillRect(98,2,12,12);
    ctx.fillStyle = '#8c5835'; ctx.fillRect(0,32,32,32);
    ctx.fillStyle = '#285e33'; ctx.beginPath(); ctx.arc(48, 46, 13, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2f2c38'; ctx.fillRect(64,32,32,32);
    ctx.fillStyle = '#222026'; ctx.fillRect(96,32,32,32);
    ctx.fillStyle = '#3a7d44'; ctx.fillRect(0,64,32,32); ctx.fillStyle = '#8f5223'; ctx.fillRect(6,72,20,16); ctx.fillStyle = '#ffd700'; ctx.fillRect(5,78,22,3);
    ctx.fillStyle = '#222026'; ctx.fillRect(32,64,32,32); ctx.fillStyle = '#8a9499'; ctx.fillRect(38,70,4,20);
    ctx.fillStyle = '#1e1633'; ctx.fillRect(64,64,32,32); ctx.fillStyle = '#8b4df5'; ctx.beginPath(); ctx.arc(80,80,12,0,Math.PI*2); ctx.fill();
    return c.toDataURL();
  }

  function genPlayer() {
    const c = document.createElement('canvas'); c.width = 192; c.height = 384;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    for (let r=0; r<12; r++) {
      for (let f=0; f<6; f++) {
        const x = f*32+16, y = r*32+16;
        ctx.fillStyle = '#2274a5'; ctx.fillRect(x-6, y-4, 12, 10);
        ctx.fillStyle = '#ffdbac'; ctx.fillRect(x-5, y-11, 10, 8);
        ctx.fillStyle = '#175676'; ctx.fillRect(x-6, y-13, 12, 4);
        ctx.fillStyle = '#111'; ctx.fillRect(x-3, y-8, 2, 2); ctx.fillRect(x+1, y-8, 2, 2);
        ctx.fillStyle = '#fff'; ctx.fillRect(x+7, y-2, 2, 8);
      }
    }
    return c.toDataURL();
  }

  function genEnemy() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 160;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    for (let r=0; r<5; r++) {
      for (let f=0; f<4; f++) {
        const x = f*32+16, y = r*32+16;
        const hurt = (r===4);
        ctx.fillStyle = hurt ? '#ff4d4d' : '#4e8c3f'; ctx.fillRect(x-6, y-4, 12, 10);
        ctx.fillStyle = hurt ? '#ff7373' : '#62aa51'; ctx.fillRect(x-7, y-12, 14, 9);
        ctx.fillStyle = '#ff0000'; ctx.fillRect(x-4, y-9, 2, 2); ctx.fillRect(x+2, y-9, 2, 2);
        ctx.fillStyle = '#5c4033'; ctx.fillRect(x+6, y-1, 3, 8);
      }
    }
    return c.toDataURL();
  }

  // --- Sound Synthesis ---
  const Audio = {
    ctx: null,
    init() { if (!this.ctx && window.AudioContext) this.ctx = new AudioContext(); },
    swing() {
      this.init(); if (!this.ctx) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(70, t+0.12);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.01, t+0.12);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t+0.13);
    },
    hit() {
      this.init(); if (!this.ctx) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(40, t+0.1);
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.01, t+0.1);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t+0.11);
    },
    levelUp() {
      this.init(); if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.frequency.setValueAtTime(f, t + i*0.08);
        g.gain.setValueAtTime(0.2, t + i*0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + i*0.08 + 0.25);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t + i*0.08); o.stop(t + i*0.08 + 0.28);
      });
    },
    victory() {
      this.init(); if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, t + i*0.12);
        g.gain.setValueAtTime(0.18, t + i*0.12);
        g.gain.exponentialRampToValueAtTime(0.001, t + i*0.12 + 0.5);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t + i*0.12); o.stop(t + i*0.12 + 0.55);
      });
    }
  };

  // --- Engine & Level Manager Setup ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const images = {};

  function resize() {
    canvas.width = Math.min(window.innerWidth, 1200);
    canvas.height = Math.min(window.innerHeight, 800);
  }
  window.addEventListener('resize', resize);
  resize();

  const player = {
    x: 64, y: 64, dir: 'down', state: 'idle', animTimer: 0,
    health: AssetConfig.gameplayParams.playerHealth, maxHp: AssetConfig.gameplayParams.playerHealth,
    atkTimer: 0, gold: 0, kills: 0
  };
  const camera = { x: 0, y: 0 };
  const keys = {};
  let enemies = [];
  const floatingTexts = [];

  // ============================================================================
  // LEVEL MANAGER STATE MACHINE
  // ============================================================================
  const LevelManager = {
    currentIndex: 0,
    isTransitioning: false,
    transitionAlpha: 0,
    transitionPhase: 'out',
    bannerTimer: 0,
    isGameComplete: false,

    get current() {
      return GameLevels[this.currentIndex] || GameLevels[0];
    },

    loadLevel(index) {
      if (index >= GameLevels.length) {
        this.triggerVictory();
        return;
      }

      this.currentIndex = index;
      const lvl = this.current;
      const ts = AssetConfig.gameplayParams.tileSize;

      // 1. Teardown active entities
      enemies = [];
      floatingTexts.length = 0;

      // 2. Set Player Spawn
      let spawnC = 1, spawnR = 1;
      if (Array.isArray(lvl.playerSpawn)) {
        spawnC = lvl.playerSpawn[0]; spawnR = lvl.playerSpawn[1];
      } else if (lvl.playerSpawn) {
        spawnC = lvl.playerSpawn.col ?? 1; spawnR = lvl.playerSpawn.row ?? 1;
      }
      player.x = spawnC * ts;
      player.y = spawnR * ts;
      player.state = 'idle';

      // 3. Spawn enemies
      if (lvl.enemySpawns && lvl.enemySpawns.length > 0) {
        lvl.enemySpawns.forEach(sp => {
          enemies.push({ x: sp.col * ts, y: sp.row * ts, health: sp.health || 50, dead: false, animTimer: 0, hurtTimer: 0 });
        });
      } else {
        // Default spawns
        enemies.push(
          { x: (spawnC + 5) * ts, y: (spawnR + 4) * ts, health: 50, dead: false, animTimer: 0, hurtTimer: 0 },
          { x: (spawnC + 8) * ts, y: (spawnR + 6) * ts, health: 50, dead: false, animTimer: 0, hurtTimer: 0 }
        );
      }

      // 4. Center Camera
      const scale = AssetConfig.gameplayParams.renderScale;
      camera.x = player.x + 16 - canvas.width / (2 * scale);
      camera.y = player.y + 16 - canvas.height / (2 * scale);

      // 5. Intro Banner
      this.bannerTimer = 3.0;
    },

    checkExit() {
      if (this.isTransitioning || this.isGameComplete) return;

      const lvl = this.current;
      const ts = AssetConfig.gameplayParams.tileSize;
      const pCol = Math.floor((player.x + 16) / ts);
      const pRow = Math.floor((player.y + 20) / ts);

      let triggered = false;
      if (Array.isArray(lvl.exitTile)) {
        if (pCol === lvl.exitTile[0] && pRow === lvl.exitTile[1]) triggered = true;
      } else if (typeof lvl.exitTile === 'object' && lvl.exitTile !== null) {
        if (pCol === lvl.exitTile.col && pRow === lvl.exitTile.row) triggered = true;
      } else {
        const exitId = typeof lvl.exitTile === 'number' ? lvl.exitTile : (lvl.exitTileId ?? 10);
        if (lvl.mapData[pRow]?.[pCol] === exitId) triggered = true;
      }

      if (triggered) {
        this.nextLevel();
      }
    },

    nextLevel() {
      if (this.isTransitioning || this.isGameComplete) return;
      const nextIdx = this.currentIndex + 1;

      if (nextIdx >= GameLevels.length) {
        this.triggerVictory();
        return;
      }

      Audio.levelUp();
      this.isTransitioning = true;
      this.transitionPhase = 'out';
      this.transitionAlpha = 0;
    },

    triggerVictory() {
      this.isGameComplete = true;
      Audio.victory();
    },

    restartGame() {
      this.isGameComplete = false;
      player.gold = 0;
      player.kills = 0;
      player.health = AssetConfig.gameplayParams.playerHealth;
      this.loadLevel(0);
    },

    update(dt) {
      if (this.isGameComplete) return;

      if (this.bannerTimer > 0) this.bannerTimer -= dt;

      if (this.isTransitioning) {
        if (this.transitionPhase === 'out') {
          this.transitionAlpha += dt * 2.5;
          if (this.transitionAlpha >= 1.0) {
            this.transitionAlpha = 1.0;
            this.transitionPhase = 'in';
            this.loadLevel(this.currentIndex + 1);
          }
        } else {
          this.transitionAlpha -= dt * 2.5;
          if (this.transitionAlpha <= 0) {
            this.transitionAlpha = 0;
            this.isTransitioning = false;
          }
        }
      } else {
        this.checkExit();
      }
    }
  };

  // --- Collision Helpers ---
  function isSolid(c, r) {
    const map = LevelManager.current.mapData;
    if (r < 0 || r >= map.length || c < 0 || c >= map[0].length) return true;
    const tile = map[r][c];
    const meta = AssetConfig.tileSetMeta.tiles[tile];
    return meta ? meta.solid : true;
  }

  function checkAABB(x, y, w, h) {
    const ts = AssetConfig.gameplayParams.tileSize;
    const sC = Math.floor(x/ts), eC = Math.floor((x+w-0.01)/ts);
    const sR = Math.floor(y/ts), eR = Math.floor((y+h-0.01)/ts);
    for (let r=sR; r<=eR; r++) {
      for (let c=sC; c<=eC; c++) {
        if (isSolid(c, r)) return true;
      }
    }
    return false;
  }

  function move(ent, vx, vy, dt, bw, bh, offY) {
    const nx = ent.x + vx * dt;
    if (!checkAABB(nx + (32 - bw) / 2, ent.y + offY, bw, bh)) ent.x = nx;
    const ny = ent.y + vy * dt;
    if (!checkAABB(ent.x + (32 - bw) / 2, ny + offY, bw, bh)) ent.y = ny;
  }

  function doAttack() {
    if (player.state === 'attack' || LevelManager.isTransitioning || LevelManager.isGameComplete) return;
    player.state = 'attack'; player.atkTimer = 0;
    Audio.swing();
    const range = AssetConfig.gameplayParams.attackRange;
    let sx = player.x + 16, sy = player.y + 16;
    if (player.dir === 'down') sy += range;
    else if (player.dir === 'up') sy -= range;
    else if (player.dir === 'left') sx -= range;
    else sx += range;

    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.hypot(sx - (e.x + 16), sy - (e.y + 16)) <= 38) {
        Audio.hit();
        const dmg = AssetConfig.gameplayParams.playerAttackDamage;
        e.health -= dmg; e.hurtTimer = 0.25;
        floatingTexts.push({ x: e.x + 16, y: e.y, text: '-' + dmg, life: 0 });
        if (e.health <= 0) {
          e.dead = true; player.kills++; player.gold += 15;
          floatingTexts.push({ x: e.x + 16, y: e.y - 12, text: '+15G', life: 0, color: '#ffd700' });
        }
      }
    }
  }

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      if (LevelManager.isGameComplete) LevelManager.restartGame();
      else doAttack();
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  canvas.addEventListener('click', () => {
    if (LevelManager.isGameComplete) LevelManager.restartGame();
  });

  const touch = { u: false, d: false, l: false, r: false };
  function bind(id, k) {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); touch[k] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); touch[k] = false; });
  }
  bind('btn-up', 'u'); bind('btn-down', 'd'); bind('btn-left', 'l'); bind('btn-right', 'r');
  const atkEl = document.getElementById('btn-attack');
  if (atkEl) atkEl.addEventListener('touchstart', (e) => { e.preventDefault(); doAttack(); });

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    LevelManager.update(dt);

    if (!LevelManager.isGameComplete && !LevelManager.isTransitioning) {
      let dx = 0, dy = 0;
      if (keys['KeyW'] || keys['ArrowUp'] || touch.u) dy -= 1;
      if (keys['KeyS'] || keys['ArrowDown'] || touch.d) dy += 1;
      if (keys['KeyA'] || keys['ArrowLeft'] || touch.l) dx -= 1;
      if (keys['KeyD'] || keys['ArrowRight'] || touch.r) dx += 1;

      const spd = AssetConfig.gameplayParams.playerSpeed;
      if (player.state === 'attack') {
        player.atkTimer += dt;
        if (player.atkTimer >= AssetConfig.gameplayParams.attackDuration) player.state = 'idle';
      } else {
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          player.state = 'walk';
          const nx = dx / len, ny = dy / len;
          if (Math.abs(nx) > Math.abs(ny)) player.dir = nx > 0 ? 'right' : 'left';
          else player.dir = ny > 0 ? 'down' : 'up';
          move(player, nx * spd, ny * spd, dt, 18, 14, 16);
        } else {
          player.state = 'idle';
        }
      }
      player.animTimer += dt;

      for (const e of enemies) {
        if (e.dead) continue;
        if (e.hurtTimer > 0) e.hurtTimer -= dt;
        e.animTimer += dt;
        const d = Math.hypot(player.x - e.x, player.y - e.y);
        if (d < AssetConfig.gameplayParams.enemyAggroRadius) {
          const ang = Math.atan2(player.y - e.y, player.x - e.x);
          move(e, Math.cos(ang) * AssetConfig.gameplayParams.enemySpeed, Math.sin(ang) * AssetConfig.gameplayParams.enemySpeed, dt, 20, 18, 14);
        }
      }

      const scale = AssetConfig.gameplayParams.renderScale;
      camera.x += (player.x + 16 - canvas.width / (2 * scale) - camera.x) * Math.min(1, dt * 6.5);
      camera.y += (player.y + 16 - canvas.height / (2 * scale) - camera.y) * Math.min(1, dt * 6.5);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      floatingTexts[i].y -= 25 * dt;
      floatingTexts[i].life += dt;
      if (floatingTexts[i].life >= 0.8) floatingTexts.splice(i, 1);
    }

    // --- Render Frame ---
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const scale = AssetConfig.gameplayParams.renderScale;
    ctx.scale(scale, scale);
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    const ts = AssetConfig.gameplayParams.tileSize;
    const map = LevelManager.current.mapData;
    for (let r=0; r<map.length; r++) {
      for (let c=0; c<map[r].length; c++) {
        const id = map[r][c];
        const meta = AssetConfig.tileSetMeta.tiles[id];
        if (images.tileset && meta) {
          ctx.drawImage(images.tileset, meta.col * ts, meta.row * ts, ts, ts, c * ts, r * ts, ts, ts);
        } else {
          ctx.fillStyle = meta ? meta.colorFallback : '#222';
          ctx.fillRect(c * ts, r * ts, ts, ts);
        }
      }
    }

    for (const e of enemies) {
      if (e.dead) continue;
      if (images.enemy) {
        const frame = Math.floor(e.animTimer * 6) % 4;
        ctx.drawImage(images.enemy, frame * 32, (e.hurtTimer > 0 ? 4 : 0) * 32, 32, 32, Math.floor(e.x), Math.floor(e.y), 32, 32);
      }
    }

    if (images.player) {
      const dMap = { down: 0, up: 1, left: 2, right: 3 };
      const row = (player.state === 'attack' ? 8 : (player.state === 'walk' ? 4 : 0)) + dMap[player.dir];
      const frame = Math.floor(player.animTimer * 8) % 4;
      ctx.drawImage(images.player, frame * 32, row * 32, 32, 32, Math.floor(player.x), Math.floor(player.y), 32, 32);
    }

    for (const ft of floatingTexts) {
      ctx.fillStyle = ft.color || '#ff4444';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();

    // Screen HUD
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(16, 16, 210, 60);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(16, 16, 210, 60);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('LVL ' + (LevelManager.currentIndex + 1) + '/' + GameLevels.length + ': ' + LevelManager.current.name.slice(0, 18), 26, 32);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('HP: ' + player.health + ' / ' + player.maxHp, 26, 48);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GOLD: ' + player.gold + ' | KILLS: ' + player.kills, 26, 64);

    // Intro Banner
    if (LevelManager.bannerTimer > 0 && !LevelManager.isTransitioning && !LevelManager.isGameComplete) {
      ctx.fillStyle = 'rgba(15,23,42,0.88)';
      ctx.fillRect(0, canvas.height * 0.22 - 24, canvas.width, 48);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(LevelManager.current.name.toUpperCase(), canvas.width / 2, canvas.height * 0.22 + 6);
      ctx.textAlign = 'left';
    }

    // Transition Fade
    if (LevelManager.isTransitioning && LevelManager.transitionAlpha > 0) {
      ctx.fillStyle = 'rgba(11, 15, 25, ' + LevelManager.transitionAlpha + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Victory Screen
    if (LevelManager.isGameComplete) {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2, cy = canvas.height / 2;
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('★ YOU WIN! ★', cx, cy - 60);
      ctx.font = '16px monospace';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('THE REALM OF AETHELGARD IS SAVED!', cx, cy - 20);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('FINAL SCORE: ' + (player.gold * 10 + player.kills * 100), cx, cy + 20);
      ctx.fillText('GOLD COLLECTED: ' + player.gold + ' | ENEMIES SLAIN: ' + player.kills, cx, cy + 50);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('PRESS [SPACE] OR CLICK TO RESTART QUEST', cx, cy + 100);
      ctx.textAlign = 'left';
    }

    requestAnimationFrame(loop);
  }

  // Load assets & start Level 1
  Promise.all([
    new Promise(r => { const i = new Image(); i.crossOrigin='anonymous'; i.onload = () => { images.player=i; r(); }; i.onerror = () => { const f=new Image(); f.onload=()=>{images.player=f; r();}; f.src=genPlayer(); }; i.src=AssetConfig.playerSpriteSheet||genPlayer(); }),
    new Promise(r => { const i = new Image(); i.crossOrigin='anonymous'; i.onload = () => { images.enemy=i; r(); }; i.onerror = () => { const f=new Image(); f.onload=()=>{images.enemy=f; r();}; f.src=genEnemy(); }; i.src=AssetConfig.enemySpriteSheet||genEnemy(); }),
    new Promise(r => { const i = new Image(); i.crossOrigin='anonymous'; i.onload = () => { images.tileset=i; r(); }; i.onerror = () => { const f=new Image(); f.onload=()=>{images.tileset=f; r();}; f.src=genTileset(); }; i.src=AssetConfig.tileSet||genTileset(); })
  ]).then(() => {
    LevelManager.loadLevel(0);
    requestAnimationFrame(loop);
  });
  </script>
</body>
</html>`;
}
