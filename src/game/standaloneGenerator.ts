/**
 * Single-File Standalone HTML Game Generator.
 * Creates a 100% self-contained index.html with inline CSS and Vanilla JavaScript
 * that can be opened directly in ANY web browser with zero build tools or dependencies!
 */

import { AssetConfigType } from './AssetConfig';

export function generateStandaloneIndexHtml(config: AssetConfigType): string {
  const configJson = JSON.stringify(config, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>2D Action RPG Engine - Standalone</title>
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
  </style>
</head>
<body>
  <div id="game-container">
    <div id="hint-bar">WASD / Arrow Keys to Move &bull; SPACE to Attack &bull; E to Open Chests</div>
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
   * 🎮 ASSETCONFIG - USER CUSTOMIZATION HUB
   * ==============================================================================
   * Easily replace external URLs below with your own Imgur or GitHub raw URLs!
   * If any URL fails to load, the engine automatically falls back to procedural
   * colored geometric sprites so the game never crashes.
   * ==============================================================================
   */
  const AssetConfig = ${configJson};

  // ============================================================================
  // PROCEDURAL DEFAULT ASSET GENERATORS (Fallback if external URLs are empty)
  // ============================================================================
  function createProceduralTileset() {
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size * 4;
    canvas.height = size * 4;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Grass (0)
    ctx.fillStyle = '#3a7d44';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#489454';
    ctx.fillRect(4, 6, 2, 4);
    ctx.fillRect(20, 18, 2, 5);

    // Path (1)
    ctx.fillStyle = '#c7a26b';
    ctx.fillRect(size, 0, size, size);
    ctx.fillStyle = '#b38d56';
    ctx.fillRect(size + 4, 4, 10, 8);
    ctx.fillRect(size + 18, 8, 10, 8);

    // Water (2)
    ctx.fillStyle = '#2a6fa8';
    ctx.fillRect(size * 2, 0, size, size);
    ctx.fillStyle = '#3988c7';
    ctx.fillRect(size * 2 + 4, 6, 12, 2);

    // Wall (3)
    ctx.fillStyle = '#595d66';
    ctx.fillRect(size * 3, 0, size, size);
    ctx.fillStyle = '#737882';
    ctx.fillRect(size * 3 + 2, 2, 12, 12);
    ctx.fillRect(size * 3 + 16, 2, 14, 12);

    // Wood Floor (4)
    ctx.fillStyle = '#8c5835';
    ctx.fillRect(0, size, size, size);

    // Tree (5)
    ctx.fillStyle = '#285e33';
    ctx.beginPath();
    ctx.arc(size + 16, size + 14, 13, 0, Math.PI * 2);
    ctx.fill();

    // Dungeon Wall (6)
    ctx.fillStyle = '#2f2c38';
    ctx.fillRect(size * 2, size, size, size);

    // Dungeon Floor (7)
    ctx.fillStyle = '#222026';
    ctx.fillRect(size * 3, size, size, size);

    // Chest (8)
    ctx.fillStyle = '#3a7d44';
    ctx.fillRect(0, size * 2, size, size);
    ctx.fillStyle = '#8f5223';
    ctx.fillRect(6, size * 2 + 8, 20, 16);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(5, size * 2 + 14, 22, 3);

    // Spikes (9)
    ctx.fillStyle = '#222026';
    ctx.fillRect(size, size * 2, size, size);
    ctx.fillStyle = '#8a9499';
    ctx.fillRect(size + 6, size * 2 + 6, 4, 20);
    ctx.fillRect(size + 18, size * 2 + 6, 4, 20);

    // Portal (10)
    ctx.fillStyle = '#1e1633';
    ctx.fillRect(size * 2, size * 2, size, size);
    ctx.fillStyle = '#8b4df5';
    ctx.beginPath();
    ctx.arc(size * 2 + 16, size * 2 + 16, 12, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL();
  }

  function createProceduralPlayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 32 * 6;
    canvas.height = 32 * 12;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 6; c++) {
        const x = c * 32 + 16;
        const y = r * 32 + 16;
        // Body
        ctx.fillStyle = '#2274a5';
        ctx.fillRect(x - 6, y - 4, 12, 10);
        // Head
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(x - 5, y - 11, 10, 8);
        // Cap
        ctx.fillStyle = '#175676';
        ctx.fillRect(x - 6, y - 13, 12, 4);
        // Eyes
        ctx.fillStyle = '#111';
        ctx.fillRect(x - 3, y - 8, 2, 2);
        ctx.fillRect(x + 1, y - 8, 2, 2);
        // Sword
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 7, y - 2, 2, 8);
      }
    }
    return canvas.toDataURL();
  }

  function createProceduralEnemy() {
    const canvas = document.createElement('canvas');
    canvas.width = 32 * 4;
    canvas.height = 32 * 5;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const x = c * 32 + 16;
        const y = r * 32 + 16;
        const isHurt = (r === 4);
        // Goblin Body
        ctx.fillStyle = isHurt ? '#ff4d4d' : '#4e8c3f';
        ctx.fillRect(x - 6, y - 4, 12, 10);
        // Head
        ctx.fillStyle = isHurt ? '#ff7373' : '#62aa51';
        ctx.fillRect(x - 7, y - 12, 14, 9);
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - 4, y - 9, 2, 2);
        ctx.fillRect(x + 2, y - 9, 2, 2);
        // Club
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(x + 6, y - 1, 3, 8);
      }
    }
    return canvas.toDataURL();
  }

  // ============================================================================
  // AUDIO SYNTHESIZER (Pure Web Audio API)
  // ============================================================================
  const Sound = {
    ctx: null,
    init() {
      if (!this.ctx && window.AudioContext) {
        this.ctx = new AudioContext();
      }
    },
    playSwing() {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.setValueAtTime(400, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + 0.13);
    },
    playHit() {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + 0.11);
    }
  };

  // ============================================================================
  // GAME INITIALIZATION & RUNTIME
  // ============================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const images = {};

  // Auto-resize canvas
  function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth, 1200);
    canvas.height = Math.min(window.innerHeight, 800);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 1. Asset Loader
  async function loadAllAssets() {
    const urls = {
      player: AssetConfig.playerSpriteSheet || createProceduralPlayer(),
      enemy: AssetConfig.enemySpriteSheet || createProceduralEnemy(),
      tileset: AssetConfig.tileSet || createProceduralTileset()
    };

    const promises = Object.entries(urls).map(([key, url]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { images[key] = img; resolve(); };
        img.onerror = () => {
          console.warn('Fallback asset loaded for', key);
          const fallback = new Image();
          fallback.onload = () => { images[key] = fallback; resolve(); };
          if (key === 'player') fallback.src = createProceduralPlayer();
          else if (key === 'enemy') fallback.src = createProceduralEnemy();
          else fallback.src = createProceduralTileset();
        };
        img.src = url;
      });
    });

    await Promise.all(promises);
  }

  // 2. Game State
  const player = {
    x: 140,
    y: 140,
    vx: 0,
    vy: 0,
    direction: 'down',
    state: 'idle',
    animTimer: 0,
    health: AssetConfig.gameplayParams.playerHealth,
    maxHealth: AssetConfig.gameplayParams.playerHealth,
    attackTimer: 0,
    gold: 0,
    kills: 0
  };

  const camera = { x: 0, y: 0 };
  const keys = {};
  const enemies = [
    { x: 320, y: 220, spawnX: 320, spawnY: 220, health: 50, dir: 'down', animTimer: 0, hurtTimer: 0, dead: false },
    { x: 580, y: 300, spawnX: 580, spawnY: 300, health: 50, dir: 'left', animTimer: 0, hurtTimer: 0, dead: false },
    { x: 740, y: 140, spawnX: 740, spawnY: 140, health: 50, dir: 'up', animTimer: 0, hurtTimer: 0, dead: false }
  ];
  const floatingTexts = [];

  // 3. Collision Logic
  function isSolid(col, row) {
    const map = AssetConfig.levelMap;
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return true;
    const tileId = map[row][col];
    const meta = AssetConfig.tileSetMeta.tiles[tileId];
    return meta ? meta.solid : true;
  }

  function checkAABB(x, y, w, h) {
    const ts = AssetConfig.gameplayParams.tileSize;
    const sC = Math.floor(x / ts);
    const eC = Math.floor((x + w - 0.01) / ts);
    const sR = Math.floor(y / ts);
    const eR = Math.floor((y + h - 0.01) / ts);
    for (let r = sR; r <= eR; r++) {
      for (let c = sC; c <= eC; c++) {
        if (isSolid(c, r)) return true;
      }
    }
    return false;
  }

  function moveWithSlide(ent, vx, vy, dt, bw, bh, offY) {
    const nx = ent.x + vx * dt;
    if (!checkAABB(nx + (32 - bw) / 2, ent.y + offY, bw, bh)) {
      ent.x = nx;
    }
    const ny = ent.y + vy * dt;
    if (!checkAABB(ent.x + (32 - bw) / 2, ny + offY, bw, bh)) {
      ent.y = ny;
    }
  }

  // 4. Attack Handler
  function attack() {
    if (player.state === 'attack') return;
    player.state = 'attack';
    player.attackTimer = 0;
    Sound.playSwing();

    const range = AssetConfig.gameplayParams.attackRange;
    let sx = player.x + 16;
    let sy = player.y + 16;
    if (player.direction === 'down') sy += range;
    else if (player.direction === 'up') sy -= range;
    else if (player.direction === 'left') sx -= range;
    else sx += range;

    for (const e of enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(sx - (e.x + 16), sy - (e.y + 16));
      if (dist <= 36) {
        Sound.playHit();
        const dmg = AssetConfig.gameplayParams.playerAttackDamage;
        e.health -= dmg;
        e.hurtTimer = 0.25;
        floatingTexts.push({ x: e.x + 16, y: e.y, text: '-' + dmg, life: 0 });
        if (e.health <= 0) {
          e.dead = true;
          player.kills++;
          player.gold += 15;
          floatingTexts.push({ x: e.x + 16, y: e.y - 14, text: '+15G', life: 0, color: '#ffd700' });
        }
      }
    }
  }

  // 5. Input Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') attack();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Mobile buttons
  const touchInputs = { up: false, down: false, left: false, right: false };
  function bindTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); touchInputs[key] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); touchInputs[key] = false; });
  }
  bindTouch('btn-up', 'up');
  bindTouch('btn-down', 'down');
  bindTouch('btn-left', 'left');
  bindTouch('btn-right', 'right');
  const btnAtk = document.getElementById('btn-attack');
  if (btnAtk) {
    btnAtk.addEventListener('touchstart', (e) => { e.preventDefault(); attack(); });
  }

  // 6. Game Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Movement
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp'] || touchInputs.up) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown'] || touchInputs.down) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft'] || touchInputs.left) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight'] || touchInputs.right) dx += 1;

    const spd = AssetConfig.gameplayParams.playerSpeed;
    if (player.state === 'attack') {
      player.attackTimer += dt;
      if (player.attackTimer >= AssetConfig.gameplayParams.attackDuration) {
        player.state = 'idle';
      }
    } else {
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        player.state = 'walk';
        const nx = dx / len;
        const ny = dy / len;
        if (Math.abs(nx) > Math.abs(ny)) player.direction = nx > 0 ? 'right' : 'left';
        else player.direction = ny > 0 ? 'down' : 'up';
        moveWithSlide(player, nx * spd, ny * spd, dt, 18, 14, 16);
      } else {
        player.state = 'idle';
      }
    }
    player.animTimer += dt;

    // Enemies
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.hurtTimer > 0) e.hurtTimer -= dt;
      e.animTimer += dt;
      const dist = Math.hypot((player.x + 16) - (e.x + 16), (player.y + 16) - (e.y + 16));
      if (dist < AssetConfig.gameplayParams.enemyAggroRadius) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        const evx = Math.cos(angle) * AssetConfig.gameplayParams.enemySpeed;
        const evy = Math.sin(angle) * AssetConfig.gameplayParams.enemySpeed;
        moveWithSlide(e, evx, evy, dt, 20, 18, 14);
      }
    }

    // Camera Lerp
    const scale = AssetConfig.gameplayParams.renderScale || 2.0;
    const targetCamX = player.x + 16 - canvas.width / (2 * scale);
    const targetCamY = player.y + 16 - canvas.height / (2 * scale);
    camera.x += (targetCamX - camera.x) * Math.min(1, dt * 6);
    camera.y += (targetCamY - camera.y) * Math.min(1, dt * 6);

    // Floating text
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      floatingTexts[i].y -= 25 * dt;
      floatingTexts[i].life += dt;
      if (floatingTexts[i].life >= 0.8) floatingTexts.splice(i, 1);
    }

    // Render
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    // Draw Tiles
    const ts = AssetConfig.gameplayParams.tileSize;
    const map = AssetConfig.levelMap;
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const id = map[r][c];
        const meta = AssetConfig.tileSetMeta.tiles[id];
        if (images.tileset && meta) {
          ctx.drawImage(images.tileset, meta.col * ts, meta.row * ts, ts, ts, c * ts, r * ts, ts, ts);
        } else {
          ctx.fillStyle = meta ? meta.colorFallback : '#333';
          ctx.fillRect(c * ts, r * ts, ts, ts);
        }
      }
    }

    // Draw Enemies
    for (const e of enemies) {
      if (e.dead) continue;
      if (images.enemy) {
        const frame = Math.floor(e.animTimer * 6) % 4;
        ctx.drawImage(images.enemy, frame * 32, (e.hurtTimer > 0 ? 4 : 0) * 32, 32, 32, Math.floor(e.x), Math.floor(e.y), 32, 32);
      }
    }

    // Draw Player
    if (images.player) {
      const dirMap = { down: 0, up: 1, left: 2, right: 3 };
      const row = (player.state === 'attack' ? 8 : (player.state === 'walk' ? 4 : 0)) + dirMap[player.direction];
      const frame = Math.floor(player.animTimer * 8) % 4;
      ctx.drawImage(images.player, frame * 32, row * 32, 32, 32, Math.floor(player.x), Math.floor(player.y), 32, 32);
    }

    // Floating text
    for (const ft of floatingTexts) {
      ctx.fillStyle = ft.color || '#ff4444';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(16, 16, 180, 48);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('HP: ' + player.health + '/' + player.maxHealth, 26, 36);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('GOLD: ' + player.gold + ' | KILLS: ' + player.kills, 26, 54);

    requestAnimationFrame(gameLoop);
  }

  // Start engine once assets are loaded
  loadAllAssets().then(() => {
    requestAnimationFrame(gameLoop);
  });
  </script>
</body>
</html>`;
}
