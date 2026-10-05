/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  DEFAULT_ASSET_CONFIG,
  DEFAULT_LEVEL_MAP,
  AssetConfigType
} from './game/AssetConfig';
import { GameEngine } from './game/engine';
import { soundEffects } from './game/soundEffects';
import { generateStandaloneIndexHtml } from './game/standaloneGenerator';
import {
  Sword,
  Shield,
  Map as MapIcon,
  Sliders,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Eye,
  RotateCcw,
  Sparkles,
  Maximize2,
  Code,
  Layers,
  Image as ImageIcon,
  Flame,
  Info
} from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Active runtime AssetConfig state
  const [config, setConfig] = useState<AssetConfigType>(() => {
    return JSON.parse(JSON.stringify(DEFAULT_ASSET_CONFIG));
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'assets' | 'map' | 'balance' | 'export' | 'debug'>('assets');
  const [panelOpen, setPanelOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showColliders, setShowColliders] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [godMode, setGodMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Live Engine stats
  const [stats, setStats] = useState({
    hp: 100,
    maxHp: 100,
    gold: 0,
    kills: 0,
    score: 0,
    fps: 60,
    playerX: 0,
    playerY: 0,
    enemiesRemaining: 0,
  });

  // Map painting tool state
  const [selectedTileId, setSelectedTileId] = useState<number>(0);
  const [isPainting, setIsPainting] = useState<boolean>(false);

  // Initialize and mount engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, config);
    engineRef.current = engine;

    engine.onStateUpdate = (eng) => {
      setStats({
        hp: eng.player.health,
        maxHp: eng.player.maxHealth,
        gold: eng.player.gold,
        kills: eng.player.kills,
        score: eng.player.score,
        fps: eng.fps,
        playerX: Math.round(eng.player.x),
        playerY: Math.round(eng.player.y),
        enemiesRemaining: eng.enemies.filter(e => !e.isDead).length,
      });
    };

    engine.onNotification = (msg) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3500);
    };

    engine.loadAssets().then(() => {
      engine.start();
    });

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  // Sync canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !engineRef.current) return;
      const container = canvasRef.current.parentElement;
      if (container) {
        canvasRef.current.width = container.clientWidth;
        canvasRef.current.height = container.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update audio toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.enabled = next;
  };

  // Update colliders toggle
  const toggleColliders = () => {
    const next = !showColliders;
    setShowColliders(next);
    if (engineRef.current) engineRef.current.showColliders = next;
  };

  // Update minimap toggle
  const toggleMinimap = () => {
    const next = !showMinimap;
    setShowMinimap(next);
    if (engineRef.current) engineRef.current.showMinimap = next;
  };

  // Toggle god mode
  const toggleGodMode = () => {
    const next = !godMode;
    setGodMode(next);
    if (engineRef.current) engineRef.current.godMode = next;
    setNotification(next ? 'God Mode Enabled: Invulnerable!' : 'God Mode Disabled');
    setTimeout(() => setNotification(null), 2500);
  };

  // Reload assets when user changes URLs
  const handleApplyAssets = () => {
    if (!engineRef.current) return;
    engineRef.current.config.playerSpriteSheet = config.playerSpriteSheet;
    engineRef.current.config.enemySpriteSheet = config.enemySpriteSheet;
    engineRef.current.config.tileSet = config.tileSet;
    engineRef.current.loadAssets().then(() => {
      setNotification('Assets reloaded successfully!');
      setTimeout(() => setNotification(null), 2500);
    });
  };

  // Live update gameplay params
  const handleParamChange = (key: keyof typeof config.gameplayParams, value: number) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        gameplayParams: {
          ...prev.gameplayParams,
          [key]: value
        }
      };
      if (engineRef.current) {
        engineRef.current.config.gameplayParams[key] = value;
      }
      return updated;
    });
  };

  // Map tile editing
  const paintTileAt = (r: number, c: number) => {
    setConfig(prev => {
      const newMap = prev.levelMap.map(row => [...row]);
      if (newMap[r] && newMap[r][c] !== undefined) {
        newMap[r][c] = selectedTileId;
      }
      if (engineRef.current) {
        engineRef.current.config.levelMap = newMap;
      }
      return { ...prev, levelMap: newMap };
    });
  };

  // Reset World / Player
  const handleResetWorld = () => {
    if (!engineRef.current) return;
    engineRef.current.initWorld();
    setNotification('World & Enemies Reset!');
    setTimeout(() => setNotification(null), 2500);
  };

  // Preset switchers
  const loadPreset = (presetName: string) => {
    let newMap = DEFAULT_LEVEL_MAP;
    if (presetName === 'dungeon') {
      // Dungeon labyrinth
      newMap = Array(20).fill(0).map((_, r) =>
        Array(32).fill(0).map((_, c) => {
          if (r === 0 || r === 19 || c === 0 || c === 31) return 6;
          if (r % 4 === 0 && c > 4 && c < 28 && c !== 16) return 6;
          if ((r + c) % 9 === 0) return 9; // spikes
          if ((r * c) % 47 === 0) return 8; // chests
          return 7; // dungeon floor
        })
      );
    } else if (presetName === 'islands') {
      // Island archipelago with water
      newMap = Array(20).fill(0).map((_, r) =>
        Array(32).fill(0).map((_, c) => {
          if (r === 0 || r === 19 || c === 0 || c === 31) return 3;
          const distToCenter = Math.hypot(c - 16, r - 10);
          if (distToCenter > 13) return 2; // ocean
          if (distToCenter > 10) return 11; // beach
          if (r === 10 || c === 16) return 1; // path
          if ((r + c) % 7 === 0) return 5; // tree
          return 0; // grass
        })
      );
    }

    setConfig(prev => {
      const updated = { ...prev, levelMap: newMap };
      if (engineRef.current) {
        engineRef.current.config.levelMap = newMap;
        engineRef.current.initWorld();
      }
      return updated;
    });
    setNotification(`Loaded "${presetName.toUpperCase()}" realm preset!`);
    setTimeout(() => setNotification(null), 2500);
  };

  // Standalone index.html export
  const standaloneHtmlCode = useMemo(() => {
    return generateStandaloneIndexHtml(config);
  }, [config]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(standaloneHtmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadStandalone = () => {
    const blob = new Blob([standaloneHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotification('Downloaded complete single-file index.html!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header & Fast Actions */}
      <header className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between z-20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow">
            <Sword className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              Chronicles of Aethelgard
              <span className="text-[10px] text-emerald-400 font-mono">2D ACTION RPG ENGINE</span>
            </h1>
          </div>
        </div>

        {/* Live In-Game Status Badges */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>HP: <span className="text-red-400 font-bold">{Math.round(stats.hp)}</span>/{stats.maxHp}</div>
          <div>GOLD: <span className="text-amber-400 font-bold">{stats.gold}</span></div>
          <div>ENEMIES: <span className="text-emerald-400 font-bold">{stats.enemiesRemaining}</span></div>
          <div>POS: <span className="text-sky-400 font-bold">{stats.playerX},{stats.playerY}</span></div>
          <div>FPS: <span className="text-purple-400 font-bold">{stats.fps}</span></div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute 8-bit Audio' : 'Unmute 8-bit Audio'}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={toggleColliders}
            title="Toggle Collision Wireframes"
            className={`p-2 rounded text-xs flex items-center gap-1.5 transition-colors ${
              showColliders ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Colliders</span>
          </button>

          <button
            onClick={handleDownloadStandalone}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export index.html</span>
          </button>

          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              panelOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Modder's Studio</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage + Side Drawer */}
      <div className="relative flex-1 w-full h-[calc(100vh-3rem)] overflow-hidden flex">
        {/* Canvas Game Area */}
        <div className="relative flex-1 h-full w-full bg-black flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Quick HUD Overlay at Top Center */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded text-xs text-slate-300 flex items-center gap-3 backdrop-blur pointer-events-none shadow-lg">
            <span>WASD / Arrows to Walk</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-red-400 font-semibold">SPACE to Slash</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-amber-400 font-semibold">E to Open Chests</span>
          </div>

          {/* Toast Notification Banner */}
          {notification && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-indigo-950/95 border border-indigo-500/80 text-indigo-200 px-4 py-2 rounded-lg text-xs font-semibold shadow-2xl z-30 animate-bounce">
              {notification}
            </div>
          )}

          {/* Virtual On-Screen Gamepad for Mobile/Touch & Quick Testing */}
          <div className="absolute bottom-5 left-6 flex flex-col items-center gap-1 pointer-events-auto md:hidden">
            <button
              onMouseDown={() => { if (engineRef.current) engineRef.current.virtualInput.dy = -1; }}
              onMouseUp={() => { if (engineRef.current) engineRef.current.virtualInput.dy = 0; }}
              onTouchStart={() => { if (engineRef.current) engineRef.current.virtualInput.dy = -1; }}
              onTouchEnd={() => { if (engineRef.current) engineRef.current.virtualInput.dy = 0; }}
              className="w-11 h-11 rounded-lg bg-slate-800/80 active:bg-indigo-600 text-white font-bold flex items-center justify-center border border-slate-700"
            >
              ▲
            </button>
            <div className="flex gap-1">
              <button
                onMouseDown={() => { if (engineRef.current) engineRef.current.virtualInput.dx = -1; }}
                onMouseUp={() => { if (engineRef.current) engineRef.current.virtualInput.dx = 0; }}
                onTouchStart={() => { if (engineRef.current) engineRef.current.virtualInput.dx = -1; }}
                onTouchEnd={() => { if (engineRef.current) engineRef.current.virtualInput.dx = 0; }}
                className="w-11 h-11 rounded-lg bg-slate-800/80 active:bg-indigo-600 text-white font-bold flex items-center justify-center border border-slate-700"
              >
                ◀
              </button>
              <button
                onMouseDown={() => { if (engineRef.current) engineRef.current.virtualInput.dy = 1; }}
                onMouseUp={() => { if (engineRef.current) engineRef.current.virtualInput.dy = 0; }}
                onTouchStart={() => { if (engineRef.current) engineRef.current.virtualInput.dy = 1; }}
                onTouchEnd={() => { if (engineRef.current) engineRef.current.virtualInput.dy = 0; }}
                className="w-11 h-11 rounded-lg bg-slate-800/80 active:bg-indigo-600 text-white font-bold flex items-center justify-center border border-slate-700"
              >
                ▼
              </button>
              <button
                onMouseDown={() => { if (engineRef.current) engineRef.current.virtualInput.dx = 1; }}
                onMouseUp={() => { if (engineRef.current) engineRef.current.virtualInput.dx = 0; }}
                onTouchStart={() => { if (engineRef.current) engineRef.current.virtualInput.dx = 1; }}
                onTouchEnd={() => { if (engineRef.current) engineRef.current.virtualInput.dx = 0; }}
                className="w-11 h-11 rounded-lg bg-slate-800/80 active:bg-indigo-600 text-white font-bold flex items-center justify-center border border-slate-700"
              >
                ▶
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 flex gap-3 pointer-events-auto md:hidden">
            <button
              onClick={() => { if (engineRef.current) engineRef.current.interactAction(); }}
              className="w-14 h-14 rounded-full bg-amber-600/90 active:bg-amber-500 text-white font-bold text-xs flex items-center justify-center border-2 border-amber-400 shadow-xl"
            >
              USE
            </button>
            <button
              onMouseDown={() => { if (engineRef.current) engineRef.current.virtualInput.attack = true; }}
              onMouseUp={() => { if (engineRef.current) engineRef.current.virtualInput.attack = false; }}
              onTouchStart={() => { if (engineRef.current) engineRef.current.virtualInput.attack = true; }}
              onTouchEnd={() => { if (engineRef.current) engineRef.current.virtualInput.attack = false; }}
              className="w-16 h-16 rounded-full bg-red-600/90 active:bg-red-500 text-white font-bold text-xs flex items-center justify-center border-2 border-red-400 shadow-xl"
            >
              SLASH
            </button>
          </div>
        </div>

        {/* Modder's Studio Drawer (Collapsible Right Side Panel) */}
        {panelOpen && (
          <aside className="w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Panel Tabs Header */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-xs">
              <button
                onClick={() => setActiveTab('assets')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'assets' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Assets
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'map' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Map Editor
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'balance' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gameplay
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'export' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Export
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'debug' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cheats
              </button>
            </div>

            {/* Tab Contents Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
              {/* TAB 1: ASSETCONFIG URLS */}
              {activeTab === 'assets' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-indigo-200 text-[11px] leading-relaxed">
                    <strong>AssetConfig External URLs:</strong>
                    <br />
                    Paste any direct image URL (Imgur, GitHub raw, Discord cdn, itch.io) to instantly swap character, enemy, or environment art. Leave blank to use built-in procedural pixel art.
                  </div>

                  {/* Player Sprite Sheet URL */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Player Sprite Sheet URL
                    </label>
                    <input
                      type="text"
                      value={config.playerSpriteSheet}
                      onChange={(e) => setConfig({ ...config, playerSpriteSheet: e.target.value })}
                      placeholder="https://.../player_spritesheet.png (or empty for default)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Expects 32x32 frames: 4 rows Idle, 4 rows Walk, 4 rows Attack.
                    </p>
                  </div>

                  {/* Enemy Sprite Sheet URL */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Enemy Sprite Sheet URL
                    </label>
                    <input
                      type="text"
                      value={config.enemySpriteSheet}
                      onChange={(e) => setConfig({ ...config, enemySpriteSheet: e.target.value })}
                      placeholder="https://.../enemy_spritesheet.png (or empty for default)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Expects 32x32 frames: 4 rows Walk (4 dirs) + 1 row Hurt.
                    </p>
                  </div>

                  {/* Tileset URL */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      TileSet Image URL
                    </label>
                    <input
                      type="text"
                      value={config.tileSet}
                      onChange={(e) => setConfig({ ...config, tileSet: e.target.value })}
                      placeholder="https://.../tileset.png (or empty for default)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      4x4 grid of 32x32 tiles (Grass, Path, Water, Wall, etc.).
                    </p>
                  </div>

                  <button
                    onClick={handleApplyAssets}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md shadow flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Apply & Reload Assets
                  </button>

                  <div className="pt-2 border-t border-slate-800">
                    <h3 className="text-slate-400 font-semibold mb-2">Preset Sprite Packs</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setConfig({ ...config, playerSpriteSheet: '', enemySpriteSheet: '', tileSet: '' });
                          setTimeout(handleApplyAssets, 50);
                        }}
                        className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
                      >
                        <div className="font-semibold text-slate-200">Default Pixel Art</div>
                        <div className="text-[10px] text-slate-400">Offline Procedural Base64</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MAP EDITOR & TILE PAINTER */}
              {activeTab === 'map' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Tile Palette:</span>
                    <span className="text-[10px] text-slate-400">Click to pick, then paint below</span>
                  </div>

                  {/* Tile Swatches */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(config.tileSetMeta.tiles).map(([idStr, t]) => {
                      const id = Number(idStr);
                      const isSelected = selectedTileId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedTileId(id)}
                          className={`p-1.5 rounded flex flex-col items-center gap-1 border transition-all ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-950/80 shadow-md ring-1 ring-indigo-400'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: t.colorFallback }}
                          />
                          <span className="text-[9px] font-mono truncate w-full text-center">
                            {t.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* World Presets */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="font-semibold text-slate-300 block mb-2">Map Presets:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => loadPreset('forest')}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-[10px] font-medium"
                      >
                        Forest Keep
                      </button>
                      <button
                        onClick={() => loadPreset('dungeon')}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-[10px] font-medium"
                      >
                        Catacombs
                      </button>
                      <button
                        onClick={() => loadPreset('islands')}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-[10px] font-medium"
                      >
                        Archipelago
                      </button>
                    </div>
                  </div>

                  {/* Interactive Mini Level Painter */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-300">Live Map Painter</span>
                      <span className="text-[10px] text-slate-400">Click cell to paint</span>
                    </div>
                    <div
                      className="border border-slate-700 rounded p-1 bg-black overflow-auto max-h-56"
                      onMouseDown={() => setIsPainting(true)}
                      onMouseUp={() => setIsPainting(false)}
                      onMouseLeave={() => setIsPainting(false)}
                    >
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `repeat(${config.levelMap[0]?.length || 32}, 8px)`,
                          gridTemplateRows: `repeat(${config.levelMap.length || 20}, 8px)`,
                          gap: '1px'
                        }}
                      >
                        {config.levelMap.map((row, r) =>
                          row.map((cellId, c) => {
                            const meta = config.tileSetMeta.tiles[cellId];
                            const bg = meta?.colorFallback || '#333';
                            return (
                              <div
                                key={`${r}-${c}`}
                                onMouseDown={() => paintTileAt(r, c)}
                                onMouseEnter={() => { if (isPainting) paintTileAt(r, c); }}
                                className="w-2 h-2 hover:opacity-75 cursor-pointer"
                                style={{ backgroundColor: bg }}
                                title={`${meta?.name || 'Tile'} (${c},${r})`}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GAMEPLAY TUNER */}
              {activeTab === 'balance' && (
                <div className="space-y-4">
                  <p className="text-slate-400 text-[11px]">
                    Adjust variables in real-time to fine-tune combat feel, player movement, enemy aggression, and camera.
                  </p>

                  {/* Player Speed */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Player Move Speed:</span>
                      <span className="font-mono text-indigo-400">{config.gameplayParams.playerSpeed} px/s</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={300}
                      step={5}
                      value={config.gameplayParams.playerSpeed}
                      onChange={(e) => handleParamChange('playerSpeed', Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Player Attack Damage */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Player Slash Damage:</span>
                      <span className="font-mono text-red-400">{config.gameplayParams.playerAttackDamage} DMG</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={config.gameplayParams.playerAttackDamage}
                      onChange={(e) => handleParamChange('playerAttackDamage', Number(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>

                  {/* Attack Range */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Sword Reach / Range:</span>
                      <span className="font-mono text-cyan-400">{config.gameplayParams.attackRange} px</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={60}
                      step={2}
                      value={config.gameplayParams.attackRange}
                      onChange={(e) => handleParamChange('attackRange', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Enemy Chase Speed */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Enemy Chase Speed:</span>
                      <span className="font-mono text-emerald-400">{config.gameplayParams.enemySpeed} px/s</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={140}
                      step={5}
                      value={config.gameplayParams.enemySpeed}
                      onChange={(e) => handleParamChange('enemySpeed', Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Enemy Aggro Radius */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Enemy Aggro Radius:</span>
                      <span className="font-mono text-amber-400">{config.gameplayParams.enemyAggroRadius} px</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={350}
                      step={10}
                      value={config.gameplayParams.enemyAggroRadius}
                      onChange={(e) => handleParamChange('enemyAggroRadius', Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* Camera Smoothness */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Camera Lerp Speed:</span>
                      <span className="font-mono text-purple-400">{config.gameplayParams.cameraLerpSpeed}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={0.5}
                      value={config.gameplayParams.cameraLerpSpeed}
                      onChange={(e) => handleParamChange('cameraLerpSpeed', Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  {/* Render Zoom Scale */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Render Zoom Scale:</span>
                      <span className="font-mono text-sky-400">{config.gameplayParams.renderScale}x</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={3.0}
                      step={0.5}
                      value={config.gameplayParams.renderScale}
                      onChange={(e) => handleParamChange('renderScale', Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: EXPORT STANDALONE INDEX.HTML */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-emerald-200 text-[11px] leading-relaxed">
                    <strong>Zero-Dependency Standalone File:</strong>
                    <br />
                    Download a single self-contained <code className="text-white font-mono">index.html</code> file with pure HTML, inline CSS, and Vanilla JavaScript. It contains your exact AssetConfig at the top of the script tag and runs instantly in any browser!
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadStandalone}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md shadow flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download index.html
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-md border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>Generated Code Preview:</span>
                      <span>{standaloneHtmlCode.length.toLocaleString()} bytes</span>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 rounded p-2.5 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-60 leading-tight">
                      {standaloneHtmlCode.slice(0, 1200)}...
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: CHEATS & DEV TOOLS */}
              {activeTab === 'debug' && (
                <div className="space-y-3">
                  <button
                    onClick={toggleGodMode}
                    className={`w-full py-2 rounded font-medium flex items-center justify-center gap-2 border transition-colors ${
                      godMode ? 'bg-red-950 border-red-500 text-red-300' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>{godMode ? 'God Mode Active (Immortal)' : 'Enable God Mode'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!engineRef.current) return;
                      engineRef.current.player.health = engineRef.current.player.maxHealth;
                      setNotification('Health fully restored!');
                      setTimeout(() => setNotification(null), 2000);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-medium flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Heal Player to Full</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!engineRef.current) return;
                      engineRef.current.enemies.push({
                        id: Date.now(),
                        x: engineRef.current.player.x + (Math.random() > 0.5 ? 60 : -60),
                        y: engineRef.current.player.y + (Math.random() > 0.5 ? 60 : -60),
                        spawnX: engineRef.current.player.x,
                        spawnY: engineRef.current.player.y,
                        vx: 0,
                        vy: 0,
                        direction: 'down',
                        currentAnim: 'walkDown',
                        animTimer: 0,
                        health: engineRef.current.config.gameplayParams.enemyHealth,
                        maxHealth: engineRef.current.config.gameplayParams.enemyHealth,
                        hitboxWidth: 20,
                        hitboxHeight: 18,
                        hurtTimer: 0,
                        isDead: false,
                        patrolTimer: 2,
                        targetPatrolX: engineRef.current.player.x,
                        targetPatrolY: engineRef.current.player.y
                      });
                      setNotification('Spawned hostile Goblin enemy nearby!');
                      setTimeout(() => setNotification(null), 2000);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-medium flex items-center justify-center gap-2"
                  >
                    <Sword className="w-4 h-4 text-amber-400" />
                    <span>Spawn Enemy at Player</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!engineRef.current) return;
                      engineRef.current.player.gold += 100;
                      setNotification('Added +100 Gold Coins!');
                      setTimeout(() => setNotification(null), 2000);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-medium flex items-center justify-center gap-2 text-amber-300"
                  >
                    <span>+100 Gold Coins</span>
                  </button>

                  <button
                    onClick={handleResetWorld}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-medium flex items-center justify-center gap-2 text-slate-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Game & Respawn All</span>
                  </button>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>ZERO-DEP CANVAS 2D</span>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Close Studio &times;
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
