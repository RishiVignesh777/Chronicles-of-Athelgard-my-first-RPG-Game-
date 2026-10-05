/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  DEFAULT_ASSET_CONFIG,
  AssetConfigType,
  LevelConfig
} from './game/AssetConfig';
import { GameEngine } from './game/engine';
import { soundEffects } from './game/soundEffects';
import { generateStandaloneIndexHtml } from './game/standaloneGenerator';
import {
  Sword,
  Shield,
  Sliders,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  Flame,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trophy,
  Compass
} from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Active runtime AssetConfig state
  const [config, setConfig] = useState<AssetConfigType>(() => {
    return JSON.parse(JSON.stringify(DEFAULT_ASSET_CONFIG));
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'levels' | 'assets' | 'balance' | 'export' | 'debug'>('levels');
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showColliders, setShowColliders] = useState(false);
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
    currentLevelIndex: 0,
    currentLevelName: 'Chapter 1',
    totalLevels: 3,
    isVictory: false
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
      const curLvl = eng.levelManager.getCurrentLevel();
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
        currentLevelIndex: eng.levelManager.currentLevelIndex,
        currentLevelName: curLvl?.name || 'Realm',
        totalLevels: eng.levelManager.levels.length,
        isVictory: eng.levelManager.isGameComplete
      });
      setSelectedLevelIdx(eng.levelManager.currentLevelIndex);
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

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.enabled = next;
  };

  const toggleColliders = () => {
    const next = !showColliders;
    setShowColliders(next);
    if (engineRef.current) engineRef.current.showColliders = next;
  };

  const toggleGodMode = () => {
    const next = !godMode;
    setGodMode(next);
    if (engineRef.current) engineRef.current.godMode = next;
    setNotification(next ? 'God Mode Enabled: Invulnerable!' : 'God Mode Disabled');
    setTimeout(() => setNotification(null), 2500);
  };

  // Switch Level directly
  const handleSelectLevel = (idx: number) => {
    if (!engineRef.current) return;
    setSelectedLevelIdx(idx);
    engineRef.current.levelManager.isGameComplete = false;
    engineRef.current.levelManager.loadLevel(idx);
    setNotification(`Jumped to Level ${idx + 1}: ${config.levels[idx]?.name}`);
    setTimeout(() => setNotification(null), 2500);
  };

  // Add a new custom level
  const handleAddNewLevel = () => {
    const newLvlNum = config.levels.length + 1;
    const newLevel: LevelConfig = {
      name: `Chapter ${newLvlNum}: The Hidden Caverns`,
      tilesetUrl: null,
      playerSpawn: [2, 2],
      exitTile: 10,
      exitTileId: 10,
      themeColor: '#f43f5e',
      mapData: Array(20).fill(0).map((_, r) =>
        Array(32).fill(0).map((_, c) => {
          if (r === 0 || r === 19 || c === 0 || c === 31) return 3;
          if (r === 16 && c === 28) return 10; // portal
          if (r === 2 && c === 28) return 8;  // chest
          if ((r + c) % 8 === 0) return 5;    // tree
          return 0; // grass
        })
      )
    };

    setConfig(prev => {
      const updated = {
        ...prev,
        levels: [...prev.levels, newLevel]
      };
      if (engineRef.current) {
        engineRef.current.config.levels = updated.levels;
      }
      return updated;
    });

    setNotification(`Added Chapter ${newLvlNum}! Total levels: ${config.levels.length + 1}`);
    setTimeout(() => setNotification(null), 2500);
  };

  // Reload assets
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

  // Map tile editing for the currently viewed level
  const paintTileAt = (r: number, c: number) => {
    setConfig(prev => {
      const updatedLevels = [...prev.levels];
      const curLvl = updatedLevels[selectedLevelIdx];
      if (!curLvl) return prev;

      const newMap = curLvl.mapData.map(row => [...row]);
      if (newMap[r] && newMap[r][c] !== undefined) {
        newMap[r][c] = selectedTileId;
      }
      updatedLevels[selectedLevelIdx] = { ...curLvl, mapData: newMap };

      if (engineRef.current) {
        engineRef.current.config.levels = updatedLevels;
      }
      return { ...prev, levels: updatedLevels };
    });
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
    setNotification('Downloaded complete single-file index.html with all levels!');
    setTimeout(() => setNotification(null), 3000);
  };

  const activeLevel = config.levels[selectedLevelIdx] || config.levels[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header & Level Bar */}
      <header className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between z-20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow">
            <Sword className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              Chronicles of Aethelgard
              <span className="text-[10px] text-emerald-400 font-mono">MULTI-LEVEL ACTION RPG</span>
            </h1>
          </div>
        </div>

        {/* Level Switcher in Nav Bar */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 text-xs">
          <button
            onClick={() => handleSelectLevel(Math.max(0, stats.currentLevelIndex - 1))}
            disabled={stats.currentLevelIndex === 0}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Previous Level"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <div className="font-mono text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">LVL {stats.currentLevelIndex + 1}/{stats.totalLevels}:</span>
            <span className="text-slate-100 font-semibold truncate max-w-[130px] sm:max-w-xs">
              {stats.currentLevelName}
            </span>
          </div>
          <button
            onClick={() => handleSelectLevel(Math.min(stats.totalLevels - 1, stats.currentLevelIndex + 1))}
            disabled={stats.currentLevelIndex >= stats.totalLevels - 1}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Next Level"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Live In-Game Status Badges */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>HP: <span className="text-red-400 font-bold">{Math.round(stats.hp)}</span>/{stats.maxHp}</div>
          <div>GOLD: <span className="text-amber-400 font-bold">{stats.gold}</span></div>
          <div>KILLS: <span className="text-emerald-400 font-bold">{stats.kills}</span></div>
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
            <span>Level Studio</span>
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
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/85 border border-slate-800 px-4 py-1.5 rounded text-xs text-slate-300 flex items-center gap-3 backdrop-blur pointer-events-none shadow-lg">
            <span>WASD: Walk</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-red-400 font-semibold">SPACE: Slash</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-purple-400 font-semibold">Enter Portal (Tile 10) to Advance Level!</span>
          </div>

          {/* Toast Notification Banner */}
          {notification && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-indigo-950/95 border border-indigo-500/80 text-indigo-200 px-4 py-2 rounded-lg text-xs font-semibold shadow-2xl z-30 animate-bounce">
              {notification}
            </div>
          )}

          {/* Virtual On-Screen Gamepad for Mobile/Touch */}
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

        {/* Level Studio Drawer (Collapsible Right Side Panel) */}
        {panelOpen && (
          <aside className="w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Panel Tabs Header */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-xs">
              <button
                onClick={() => setActiveTab('levels')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'levels' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Levels ({config.levels.length})
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'assets' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sprites
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`flex-1 py-2 px-1 text-center font-medium rounded transition-colors ${
                  activeTab === 'balance' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tuner
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
              {/* TAB 1: LEVELS & MAP MANAGER */}
              {activeTab === 'levels' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Level Selector:</span>
                    <button
                      onClick={handleAddNewLevel}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3 h-3" />
                      Add Level
                    </button>
                  </div>

                  {/* Level Cards List */}
                  <div className="space-y-2">
                    {config.levels.map((lvl, idx) => {
                      const isCurrent = stats.currentLevelIndex === idx;
                      const isViewing = selectedLevelIdx === idx;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border transition-all ${
                            isViewing
                              ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={lvl.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setConfig(prev => {
                                    const updated = [...prev.levels];
                                    updated[idx] = { ...updated[idx], name: val };
                                    if (engineRef.current) engineRef.current.config.levels = updated;
                                    return { ...prev, levels: updated };
                                  });
                                }}
                                className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 text-slate-100 font-semibold text-xs focus:outline-none px-1"
                              />
                            </div>
                            <button
                              onClick={() => handleSelectLevel(idx)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                isCurrent
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500'
                                  : 'bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white'
                              }`}
                            >
                              {isCurrent ? 'Active' : 'Play'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Spawn: [{Array.isArray(lvl.playerSpawn) ? lvl.playerSpawn.join(',') : `${lvl.playerSpawn.col},${lvl.playerSpawn.row}`}]</span>
                            <span>Exit Tile: {typeof lvl.exitTile === 'number' ? lvl.exitTile : '10 (Portal)'}</span>
                            <span>Grid: {lvl.mapData[0]?.length || 32}x{lvl.mapData.length || 20}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tile Palette & Live Painter for Selected Level */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Tile Palette:</span>
                      <span className="text-[10px] text-slate-400">Click to paint on grid</span>
                    </div>

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
                              className="w-5 h-5 rounded"
                              style={{ backgroundColor: t.colorFallback }}
                            />
                            <span className="text-[9px] font-mono truncate w-full text-center">
                              {id}: {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold text-slate-300">
                        Map Painter: {activeLevel?.name}
                      </span>
                      <span className="text-[10px] text-slate-500">Click cell to paint</span>
                    </div>

                    <div
                      className="border border-slate-700 rounded p-1 bg-black overflow-auto max-h-52"
                      onMouseDown={() => setIsPainting(true)}
                      onMouseUp={() => setIsPainting(false)}
                      onMouseLeave={() => setIsPainting(false)}
                    >
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `repeat(${activeLevel?.mapData[0]?.length || 32}, 8px)`,
                          gridTemplateRows: `repeat(${activeLevel?.mapData.length || 20}, 8px)`,
                          gap: '1px'
                        }}
                      >
                        {activeLevel?.mapData.map((row, r) =>
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

              {/* TAB 2: SPRITES CONFIG */}
              {activeTab === 'assets' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-indigo-200 text-[11px] leading-relaxed">
                    <strong>AssetConfig External URLs:</strong>
                    <br />
                    Paste any direct image URL (Imgur, GitHub raw, itch.io) to swap character or enemy art. Leave blank to use built-in procedural pixel art.
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Player Sprite Sheet URL
                    </label>
                    <input
                      type="text"
                      value={config.playerSpriteSheet}
                      onChange={(e) => setConfig({ ...config, playerSpriteSheet: e.target.value })}
                      placeholder="https://.../player.png (or empty for default)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Enemy Sprite Sheet URL
                    </label>
                    <input
                      type="text"
                      value={config.enemySpriteSheet}
                      onChange={(e) => setConfig({ ...config, enemySpriteSheet: e.target.value })}
                      placeholder="https://.../enemy.png (or empty for default)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Default TileSet URL
                    </label>
                    <input
                      type="text"
                      value={config.tileSet}
                      onChange={(e) => setConfig({ ...config, tileSet: e.target.value })}
                      placeholder="https://.../tileset.png (or empty for default)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  <button
                    onClick={handleApplyAssets}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md shadow flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Apply & Reload Assets
                  </button>
                </div>
              )}

              {/* TAB 3: GAMEPLAY TUNER */}
              {activeTab === 'balance' && (
                <div className="space-y-4">
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

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Slash Damage:</span>
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
                </div>
              )}

              {/* TAB 4: EXPORT STANDALONE */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-emerald-200 text-[11px] leading-relaxed">
                    <strong>Zero-Dependency Standalone File:</strong>
                    <br />
                    Download a single self-contained <code className="text-white font-mono">index.html</code> file with pure HTML, inline CSS, and Vanilla JavaScript. It contains your exact <code className="text-white font-mono">GameLevels</code> array at the top of the script tag and runs instantly in any browser!
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
                      {standaloneHtmlCode.slice(0, 1500)}...
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: CHEATS & DEV TOOLS */}
              {activeTab === 'debug' && (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (!engineRef.current) return;
                      engineRef.current.levelManager.triggerVictory();
                    }}
                    className="w-full py-2 bg-amber-950 hover:bg-amber-900 border border-amber-500 rounded font-medium flex items-center justify-center gap-2 text-amber-200"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Test Victory State ("You Win!")</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!engineRef.current) return;
                      engineRef.current.levelManager.triggerLevelTransition();
                    }}
                    className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500 rounded font-medium flex items-center justify-center gap-2 text-indigo-200"
                  >
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span>Trigger Next Level Transition</span>
                  </button>

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
                      setNotification('Health restored to full!');
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
                      engineRef.current.player.gold += 100;
                      setNotification('+100 Gold added!');
                      setTimeout(() => setNotification(null), 2000);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-medium flex items-center justify-center gap-2 text-amber-300"
                  >
                    <span>+100 Gold Coins</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!engineRef.current) return;
                      engineRef.current.levelManager.restartGame();
                      setNotification('Game reset to Level 1!');
                      setTimeout(() => setNotification(null), 2000);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-medium flex items-center justify-center gap-2 text-slate-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart Campaign (Level 1)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>MULTI-LEVEL ENGINE</span>
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
