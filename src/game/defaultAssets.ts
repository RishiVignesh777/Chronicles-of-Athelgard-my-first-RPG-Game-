/**
 * Procedural Sprite & Tile Generators for Default Out-Of-The-Box Assets.
 * Generates Base64 Data URIs so the game has zero external dependencies,
 * zero network delay, and runs completely offline out of the box!
 */

export function generateDefaultTileset(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const size = 32;
  // 4 columns x 4 rows of 32x32 tiles
  canvas.width = size * 4;
  canvas.height = size * 4;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  // Tile 0: Grass (col 0, row 0)
  ctx.fillStyle = '#3a7d44';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#489454';
  // grass tufts
  ctx.fillRect(4, 6, 2, 4);
  ctx.fillRect(6, 4, 4, 2);
  ctx.fillRect(20, 18, 2, 5);
  ctx.fillRect(22, 16, 4, 2);
  ctx.fillStyle = '#2f6637';
  ctx.fillRect(5, 10, 2, 2);
  ctx.fillRect(21, 23, 2, 2);
  // tiny flower
  ctx.fillStyle = '#fff475';
  ctx.fillRect(12, 12, 2, 2);
  ctx.fillStyle = '#e85d75';
  ctx.fillRect(11, 12, 1, 2);
  ctx.fillRect(14, 12, 1, 2);

  // Tile 1: Dirt / Cobblestone Path (col 1, row 0)
  ctx.fillStyle = '#c7a26b';
  ctx.fillRect(size, 0, size, size);
  ctx.fillStyle = '#b38d56';
  ctx.fillRect(size + 4, 4, 10, 8);
  ctx.fillRect(size + 18, 8, 10, 8);
  ctx.fillRect(size + 6, 18, 12, 10);
  ctx.fillStyle = '#8f6e3e';
  ctx.strokeRect(size + 4.5, 4.5, 9, 7);
  ctx.strokeRect(size + 18.5, 8.5, 9, 7);
  ctx.strokeRect(size + 6.5, 18.5, 11, 9);

  // Tile 2: Water (col 2, row 0) - SOLID
  ctx.fillStyle = '#2a6fa8';
  ctx.fillRect(size * 2, 0, size, size);
  ctx.fillStyle = '#3988c7';
  ctx.fillRect(size * 2 + 4, 6, 12, 2);
  ctx.fillRect(size * 2 + 16, 20, 10, 2);
  ctx.fillStyle = '#8ec5fc';
  ctx.fillRect(size * 2 + 6, 7, 6, 1);
  ctx.fillRect(size * 2 + 18, 21, 5, 1);

  // Tile 3: Stone Wall (col 3, row 0) - SOLID
  ctx.fillStyle = '#595d66';
  ctx.fillRect(size * 3, 0, size, size);
  ctx.fillStyle = '#737882';
  ctx.fillRect(size * 3 + 2, 2, 12, 12);
  ctx.fillRect(size * 3 + 16, 2, 14, 12);
  ctx.fillRect(size * 3 + 2, 16, 28, 14);
  ctx.fillStyle = '#3c3e45';
  ctx.fillRect(size * 3, 0, size, 2);
  ctx.fillRect(size * 3, 14, size, 2);
  ctx.fillRect(size * 3 + 14, 0, 2, 14);
  ctx.fillRect(size * 3, 30, size, 2);

  // Tile 4: Wood Floor (col 0, row 1)
  ctx.fillStyle = '#8c5835';
  ctx.fillRect(0, size, size, size);
  ctx.fillStyle = '#9e6740';
  ctx.fillRect(0, size + 2, size, 6);
  ctx.fillRect(0, size + 10, size, 6);
  ctx.fillRect(0, size + 18, size, 6);
  ctx.fillRect(0, size + 26, size, 5);
  ctx.fillStyle = '#5e381f';
  ctx.fillRect(0, size + 8, size, 2);
  ctx.fillRect(0, size + 16, size, 2);
  ctx.fillRect(0, size + 24, size, 2);
  ctx.fillRect(16, size, 2, 8);
  ctx.fillRect(8, size + 8, 2, 8);
  ctx.fillRect(24, size + 16, 2, 8);

  // Tile 5: Ancient Tree (col 1, row 1) - SOLID
  ctx.fillStyle = '#285e33';
  ctx.beginPath();
  ctx.arc(size + 16, size + 14, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c4524';
  ctx.beginPath();
  ctx.arc(size + 16, size + 14, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#398048';
  ctx.beginPath();
  ctx.arc(size + 13, size + 11, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#613b1c';
  ctx.fillRect(size + 13, size + 22, 6, 10);

  // Tile 6: Dungeon Wall (col 2, row 1) - SOLID
  ctx.fillStyle = '#2f2c38';
  ctx.fillRect(size * 2, size, size, size);
  ctx.fillStyle = '#423e4f';
  ctx.fillRect(size * 2 + 2, size + 2, 12, 12);
  ctx.fillRect(size * 2 + 16, size + 2, 14, 12);
  ctx.fillRect(size * 2 + 2, size + 16, 28, 14);
  ctx.fillStyle = '#1b1921';
  ctx.fillRect(size * 2, size + 14, size, 2);
  ctx.fillRect(size * 2 + 14, size, 2, 14);

  // Tile 7: Dungeon Floor (col 3, row 1)
  ctx.fillStyle = '#222026';
  ctx.fillRect(size * 3, size, size, size);
  ctx.fillStyle = '#2f2d36';
  ctx.fillRect(size * 3 + 1, size + 1, size - 2, size - 2);
  ctx.fillStyle = '#18171c';
  ctx.strokeRect(size * 3 + 2.5, size + 2.5, size - 5, size - 5);

  // Tile 8: Treasure Chest (col 0, row 2) - SOLID & INTERACTABLE
  ctx.fillStyle = '#3a7d44';
  ctx.fillRect(0, size * 2, size, size);
  ctx.fillStyle = '#8f5223';
  ctx.fillRect(6, size * 2 + 8, 20, 16);
  ctx.fillStyle = '#b36b36';
  ctx.fillRect(7, size * 2 + 9, 18, 6);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(5, size * 2 + 14, 22, 3);
  ctx.fillRect(14, size * 2 + 14, 4, 6);
  ctx.fillStyle = '#111';
  ctx.fillRect(15, size * 2 + 16, 2, 3);

  // Tile 9: Spikes / Trap (col 1, row 2) - SOLID
  ctx.fillStyle = '#222026';
  ctx.fillRect(size, size * 2, size, size);
  ctx.fillStyle = '#8a9499';
  for (let sx = 0; sx < 4; sx++) {
    for (let sy = 0; sy < 4; sy++) {
      ctx.beginPath();
      ctx.moveTo(size + 4 + sx * 7, size * 2 + 8 + sy * 6);
      ctx.lineTo(size + 7 + sx * 7, size * 2 + 3 + sy * 6);
      ctx.lineTo(size + 10 + sx * 7, size * 2 + 8 + sy * 6);
      ctx.fill();
    }
  }

  // Tile 10: Magic Portal / Gate (col 2, row 2)
  ctx.fillStyle = '#1e1633';
  ctx.fillRect(size * 2, size * 2, size, size);
  ctx.fillStyle = '#8b4df5';
  ctx.beginPath();
  ctx.arc(size * 2 + 16, size * 2 + 16, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9b6ff';
  ctx.beginPath();
  ctx.arc(size * 2 + 16, size * 2 + 16, 7, 0, Math.PI * 2);
  ctx.fill();

  // Tile 11: Sand / Desert (col 3, row 2)
  ctx.fillStyle = '#d6b876';
  ctx.fillRect(size * 3, size * 2, size, size);
  ctx.fillStyle = '#c7a760';
  ctx.fillRect(size * 3 + 5, size * 2 + 6, 6, 2);
  ctx.fillRect(size * 3 + 18, size * 2 + 16, 8, 2);

  return canvas.toDataURL('image/png');
}

export function generateDefaultPlayerSpriteSheet(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const fw = 32;
  const fh = 32;
  const cols = 6;
  const rows = 12; // 4 idle + 4 walk + 4 attack
  canvas.width = fw * cols;
  canvas.height = fh * rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  const directions = ['down', 'up', 'left', 'right'];

  // Helper to draw adventurer body
  function drawPlayer(x: number, y: number, dir: string, walkFrame = 0, isAttacking = false, attackProg = 0) {
    const cx = x + 16;
    const cy = y + 16;
    const bob = (walkFrame % 2 === 1) ? -1 : 0;

    // Shadow
    ctx!.fillStyle = 'rgba(0,0,0,0.3)';
    ctx!.beginPath();
    ctx!.ellipse(cx, cy + 12, 7, 3, 0, 0, Math.PI * 2);
    ctx!.fill();

    // Legs
    ctx!.fillStyle = '#3a2c1f';
    if (dir === 'down' || dir === 'up') {
      const legOff = (walkFrame === 1) ? 2 : (walkFrame === 3) ? -2 : 0;
      ctx!.fillRect(cx - 5, cy + 7 + legOff, 3, 5);
      ctx!.fillRect(cx + 2, cy + 7 - legOff, 3, 5);
    } else {
      const stride = (walkFrame === 1 || walkFrame === 3) ? 3 : 0;
      ctx!.fillRect(cx - 3 - stride, cy + 7, 3, 5);
      ctx!.fillRect(cx + 1 + stride, cy + 7, 3, 5);
    }

    // Tunic Body
    ctx!.fillStyle = '#2274a5'; // Adventurer Blue
    ctx!.fillRect(cx - 6, cy - 1 + bob, 12, 9);
    // Belt
    ctx!.fillStyle = '#8a5a36';
    ctx!.fillRect(cx - 6, cy + 5 + bob, 12, 2);
    ctx!.fillStyle = '#f1c40f'; // buckle
    ctx!.fillRect(cx - 1, cy + 5 + bob, 2, 2);

    // Head
    ctx!.fillStyle = '#ffdbac'; // Skin
    ctx!.fillRect(cx - 5, cy - 10 + bob, 10, 9);

    // Hair / Cap
    ctx!.fillStyle = '#175676'; // Cap
    ctx!.fillRect(cx - 6, cy - 12 + bob, 12, 5);
    ctx!.fillStyle = '#f39c12'; // Feather on cap
    ctx!.fillRect(cx + 2, cy - 14 + bob, 2, 4);

    // Eyes / Facing details
    ctx!.fillStyle = '#1c1c1c';
    if (dir === 'down') {
      ctx!.fillRect(cx - 3, cy - 7 + bob, 2, 2);
      ctx!.fillRect(cx + 1, cy - 7 + bob, 2, 2);
      // Shield on left hand
      ctx!.fillStyle = '#c0392b';
      ctx!.fillRect(cx - 9, cy + 1 + bob, 4, 7);
      ctx!.fillStyle = '#f1c40f';
      ctx!.fillRect(cx - 8, cy + 3 + bob, 2, 3);
    } else if (dir === 'up') {
      // Back of head
      ctx!.fillStyle = '#175676';
      ctx!.fillRect(cx - 5, cy - 10 + bob, 10, 6);
      // Quiver / backpack
      ctx!.fillStyle = '#6d4c41';
      ctx!.fillRect(cx - 4, cy + bob, 8, 6);
    } else if (dir === 'left') {
      ctx!.fillRect(cx - 4, cy - 7 + bob, 2, 2);
      // Shield forward
      ctx!.fillStyle = '#c0392b';
      ctx!.fillRect(cx - 8, cy + 1 + bob, 4, 7);
    } else if (dir === 'right') {
      ctx!.fillRect(cx + 2, cy - 7 + bob, 2, 2);
      // Shield behind
      ctx!.fillStyle = '#c0392b';
      ctx!.fillRect(cx + 4, cy + 1 + bob, 4, 7);
    }

    // Sword in hand or swing animation
    if (!isAttacking) {
      ctx!.fillStyle = '#bdc3c7'; // blade
      if (dir === 'down' || dir === 'left') {
        ctx!.fillRect(cx + 6, cy + 2 + bob, 2, 6);
        ctx!.fillStyle = '#f39c12';
        ctx!.fillRect(cx + 5, cy + 4 + bob, 4, 2);
      } else {
        ctx!.fillRect(cx - 8, cy + 2 + bob, 2, 6);
        ctx!.fillStyle = '#f39c12';
        ctx!.fillRect(cx - 9, cy + 4 + bob, 4, 2);
      }
    } else {
      // Slashing sword swing animation
      const slashAngle = (attackProg * Math.PI) - (Math.PI / 2);
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.fillStyle = '#ecf0f1';
      ctx!.strokeStyle = '#00f0ff';
      ctx!.lineWidth = 2;

      let sx = 0, sy = 0;
      if (dir === 'down') {
        sx = Math.sin(slashAngle) * 14;
        sy = 6 + Math.cos(slashAngle) * 6;
      } else if (dir === 'up') {
        sx = -Math.sin(slashAngle) * 14;
        sy = -10 - Math.cos(slashAngle) * 6;
      } else if (dir === 'left') {
        sx = -10 - Math.cos(slashAngle) * 6;
        sy = Math.sin(slashAngle) * 14;
      } else {
        sx = 10 + Math.cos(slashAngle) * 6;
        sy = Math.sin(slashAngle) * 14;
      }

      // Blade stroke
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(sx - 1, sy - 1, 4, 4);
      // Blade trail
      ctx!.beginPath();
      ctx!.arc(0, 0, 14, 0, Math.PI * 2);
      ctx!.stroke();

      ctx!.restore();
    }
  }

  // Row 0-3: Idle (down, up, left, right) - 4 frames
  for (let d = 0; d < 4; d++) {
    const dir = directions[d];
    const row = d;
    for (let f = 0; f < 4; f++) {
      drawPlayer(f * fw, row * fh, dir, 0);
    }
  }

  // Row 4-7: Walk (down, up, left, right) - 6 frames
  for (let d = 0; d < 4; d++) {
    const dir = directions[d];
    const row = 4 + d;
    for (let f = 0; f < 6; f++) {
      drawPlayer(f * fw, row * fh, dir, f % 4);
    }
  }

  // Row 8-11: Attack (down, up, left, right) - 4 frames
  for (let d = 0; d < 4; d++) {
    const dir = directions[d];
    const row = 8 + d;
    for (let f = 0; f < 4; f++) {
      const prog = (f + 1) / 4;
      drawPlayer(f * fw, row * fh, dir, 0, true, prog);
    }
  }

  return canvas.toDataURL('image/png');
}

export function generateDefaultEnemySpriteSheet(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const fw = 32;
  const fh = 32;
  const cols = 4;
  const rows = 5; // walk 4 dirs + hurt
  canvas.width = fw * cols;
  canvas.height = fh * rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;
  const directions = ['down', 'up', 'left', 'right'];

  function drawGoblin(x: number, y: number, dir: string, step = 0, isHurt = false) {
    const cx = x + 16;
    const cy = y + 16;
    const bob = (step % 2 === 1) ? -1 : 0;

    // Shadow
    ctx!.fillStyle = 'rgba(0,0,0,0.3)';
    ctx!.beginPath();
    ctx!.ellipse(cx, cy + 12, 7, 3, 0, 0, Math.PI * 2);
    ctx!.fill();

    // Color tint (red if hurt, goblin green otherwise)
    ctx!.fillStyle = isHurt ? '#ff4d4d' : '#4e8c3f';

    // Body
    ctx!.fillRect(cx - 6, cy - 2 + bob, 12, 9);

    // Legs
    ctx!.fillStyle = isHurt ? '#cc3333' : '#335e29';
    const stride = (step === 1) ? 2 : (step === 3) ? -2 : 0;
    ctx!.fillRect(cx - 5 + stride, cy + 7, 3, 5);
    ctx!.fillRect(cx + 2 - stride, cy + 7, 3, 5);

    // Head
    ctx!.fillStyle = isHurt ? '#ff7373' : '#62aa51';
    ctx!.fillRect(cx - 7, cy - 11 + bob, 14, 10);

    // Goblin Ears
    ctx!.fillStyle = isHurt ? '#ff4d4d' : '#4e8c3f';
    ctx!.beginPath();
    ctx!.moveTo(cx - 7, cy - 8 + bob);
    ctx!.lineTo(cx - 13, cy - 10 + bob);
    ctx!.lineTo(cx - 7, cy - 5 + bob);
    ctx!.fill();

    ctx!.beginPath();
    ctx!.moveTo(cx + 7, cy - 8 + bob);
    ctx!.lineTo(cx + 13, cy - 10 + bob);
    ctx!.lineTo(cx + 7, cy - 5 + bob);
    ctx!.fill();

    // Eyes (glowing ruby / menacing)
    if (dir !== 'up') {
      ctx!.fillStyle = isHurt ? '#ffffff' : '#ffeb3b';
      if (dir === 'down') {
        ctx!.fillRect(cx - 4, cy - 8 + bob, 2, 2);
        ctx!.fillRect(cx + 2, cy - 8 + bob, 2, 2);
        ctx!.fillStyle = '#d32f2f'; // iris
        ctx!.fillRect(cx - 3, cy - 8 + bob, 1, 2);
        ctx!.fillRect(cx + 3, cy - 8 + bob, 1, 2);
      } else if (dir === 'left') {
        ctx!.fillRect(cx - 5, cy - 8 + bob, 2, 2);
        ctx!.fillStyle = '#d32f2f';
        ctx!.fillRect(cx - 5, cy - 8 + bob, 1, 2);
      } else if (dir === 'right') {
        ctx!.fillRect(cx + 3, cy - 8 + bob, 2, 2);
        ctx!.fillStyle = '#d32f2f';
        ctx!.fillRect(cx + 4, cy - 8 + bob, 1, 2);
      }
    }

    // Spiked Club weapon
    ctx!.fillStyle = '#5c4033';
    ctx!.fillRect(cx + 6, cy + 2 + bob, 3, 7);
    ctx!.fillStyle = '#9e9e9e';
    ctx!.fillRect(cx + 5, cy + bob, 5, 3);
  }

  // Row 0-3: Walk 4 directions (4 frames each)
  for (let d = 0; d < 4; d++) {
    const dir = directions[d];
    for (let f = 0; f < 4; f++) {
      drawGoblin(f * fw, d * fh, dir, f);
    }
  }

  // Row 4: Hurt (2 frames)
  for (let f = 0; f < 4; f++) {
    drawGoblin(f * fw, 4 * fh, 'down', 0, true);
  }

  return canvas.toDataURL('image/png');
}
