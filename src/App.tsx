/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameStatus, GameState } from './types';
import { createInitialState, updateGame } from './engine';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Play, LogIn, Trophy, Skull } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [keys] = useState<Set<string>>(new Set());
  const [mouse] = useState({ x: 0, y: 0, down: false });
  const [viewSize, setViewSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const animationFrameRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => keys.add(e.key.toLowerCase()), [keys]);
  const handleKeyUp = useCallback((e: KeyboardEvent) => keys.delete(e.key.toLowerCase()), [keys]);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Convert screen coordinates to world coordinates
    const w = window.innerWidth;
    const h = window.innerHeight;
    mouse.x = e.clientX - w / 2 + state.player.x;
    mouse.y = e.clientY - h / 2 + state.player.y;
  }, [state.player.x, state.player.y]);

  const handleMouseDown = useCallback(() => mouse.down = true, [mouse]);
  const handleMouseUp = useCallback(() => mouse.down = false, [mouse]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp]);

  useEffect(() => {
    const loop = () => {
      if (state.status === GameStatus.IN_GAME) {
        setState(prev => updateGame(prev, keys, mouse));
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [state.status]);

  const startGame = () => {
    setState({ ...createInitialState(), status: GameStatus.IN_GAME });
  };

  useEffect(() => {
    if (state.status === GameStatus.VICTORY) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [state.status]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {state.status === GameStatus.MENU && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center text-white"
          >
            {/* Background Image Placeholder with Filter */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center grayscale brightness-50 opacity-40 scale-110"
              style={{ backgroundImage: 'url("https://picsum.photos/seed/tactical/1920/1080")' }}
            />
            
            <div className="z-10 text-center space-y-8 max-w-xl px-6">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                  Battle Blitz
                </h1>
                <p className="text-yellow-400 font-bold uppercase tracking-[0.5em] text-sm">Strike Ops</p>
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid gap-4"
              >
                <button 
                  onClick={startGame}
                  className="group relative bg-yellow-400 text-black px-12 py-4 rounded-full font-black text-xl uppercase italic tracking-tighter flex items-center justify-center gap-3 overflow-hidden transition-transform active:scale-95"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Play fill="black" />
                  Start Match
                </button>
                <button className="bg-white/10 hover:bg-white/20 px-12 py-3 rounded-full font-bold uppercase tracking-widest text-xs border border-white/10 transition-colors">
                  Loadout & Armory
                </button>
              </motion.div>

              <div className="pt-12 text-[10px] uppercase tracking-widest opacity-40 font-bold">
                Daily Mission: Win 3 matches to earn Elite Crate
              </div>
            </div>
          </motion.div>
        )}

        {state.status === GameStatus.IN_GAME && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full relative"
          >
            <GameCanvas state={state} onResize={(w, h) => setViewSize({ w, h })} />
            <HUD state={state} />
          </motion.div>
        )}

        {(state.status === GameStatus.VICTORY || state.status === GameStatus.GAMEOVER) && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl text-white"
          >
            <div className="text-center p-12 rounded-3xl border border-white/10 bg-white/5 space-y-8 max-w-md w-full">
              {state.status === GameStatus.VICTORY ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(250,204,21,0.4)]">
                    <Trophy size={40} color="black" />
                  </div>
                  <h2 className="text-6xl font-black italic tracking-tighter uppercase text-yellow-400">Booyah!</h2>
                  <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Battle Royale Victory</p>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                    <Skull size={40} color="white" />
                  </div>
                  <h2 className="text-6xl font-black italic tracking-tighter uppercase text-red-600">Game Over</h2>
                  <p className="text-white/60 font-bold uppercase tracking-widest text-xs">You placed #{state.bots.length + 1}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase opacity-40 mb-1">Kills</div>
                  <div className="text-2xl font-mono font-bold text-yellow-400">{state.player.kills}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase opacity-40 mb-1">XP Gained</div>
                  <div className="text-2xl font-mono font-bold">{state.player.kills * 150 + (state.status === GameStatus.VICTORY ? 500 : 0)}</div>
                </div>
              </div>

              <button 
                onClick={() => setState(prev => ({ ...prev, status: GameStatus.MENU }))}
                className="w-full bg-white text-black py-4 rounded-full font-black uppercase italic tracking-tighter flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors active:scale-95"
              >
                <LogIn size={20} />
                Return to Base
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
