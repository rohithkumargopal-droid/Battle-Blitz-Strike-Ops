/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, GameState, WeaponType } from './types';
import { Crosshair, Shield, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface HUDProps {
  state: GameState;
}

export const HUD = ({ state }: HUDProps) => {
  const { player, bots } = state;
  const aliveCount = bots.length + (player.health > 0 ? 1 : 0);

  return (
    <div className="fixed inset-0 pointer-events-none select-none font-sans text-white">
      {/* Top Left: Survivor Count */}
      <div className="absolute top-6 left-6 flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 border border-white/10 rounded-lg">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider opacity-60">Alive</span>
          <span className="text-2xl font-bold font-mono leading-none tracking-tighter">{aliveCount}</span>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider opacity-60">Kills</span>
          <span className="text-2xl font-bold font-mono leading-none tracking-tighter text-yellow-400">{player.kills}</span>
        </div>
      </div>

      {/* Center Top: Zone Warning */}
      {state.zone.radius < 500 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
           <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="bg-red-600/80 backdrop-blur-md px-6 py-1 rounded-full border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
           >
            <span className="text-xs font-bold uppercase tracking-widest">Zone Shrinking</span>
           </motion.div>
        </div>
      )}

      {/* Bottom Center: Health & Armor */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest px-1">
            <div className="flex items-center gap-1">
              <Shield size={10} className="text-blue-400" />
              <span>Armor</span>
            </div>
            <span>{Math.ceil(player.armor)}</span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(player.armor / player.maxArmor) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest px-1">
            <div className="flex items-center gap-1">
              <Zap size={10} className="text-yellow-400" />
              <span>Health</span>
            </div>
            <span>{Math.ceil(player.health)}</span>
          </div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${(player.health / player.maxHealth) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Right: Weapon Status */}
      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[160px]">
          <div className="flex justify-between items-start mb-1">
             <span className="text-[10px] uppercase tracking-widest opacity-60">Primary</span>
             <Target size={14} className="opacity-40" />
          </div>
          <div className="text-2xl font-bold tracking-tighter mb-2">
            {player.weapon?.name || 'Unarmed'}
          </div>
          <div className="flex items-baseline gap-1">
             <span className="text-4xl font-mono font-black text-yellow-400">
               {player.isReloading ? '--' : player.weapon?.currentAmmo || 0}
             </span>
             <span className="text-xl font-mono opacity-40">/ {player.weapon?.ammoCapacity || 0}</span>
          </div>
          {player.isReloading && (
            <div className="mt-2 text-[10px] text-yellow-400 uppercase font-black tracking-widest animate-pulse">
              Reloading...
            </div>
          )}
        </div>
      </div>

      {/* Top Right: Mini Map */}
      <div className="absolute top-6 right-6 w-32 h-32 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
         <div className="relative w-full h-full">
            {/* Zone in Minimap */}
            <div 
              className="absolute border border-red-500/50 bg-red-500/10 rounded-full"
              style={{
                left: `${(state.zone.x / state.mapWidth) * 100}%`,
                top: `${(state.zone.y / state.mapHeight) * 100}%`,
                width: `${(state.zone.radius / state.mapWidth) * 200}%`,
                height: `${(state.zone.radius / state.mapHeight) * 200}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
            {/* Player In Minimap */}
            <div 
               className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_#3b82f6]"
               style={{
                 left: `${(player.x / state.mapWidth) * 100}%`,
                 top: `${(player.y / state.mapHeight) * 100}%`,
                 transform: 'translate(-50%, -50%)'
               }}
            />
            {/* Bots In Minimap */}
            {bots.map(bot => (
              <div 
                key={bot.id}
                className="absolute w-1 h-1 bg-red-500 rounded-full"
                style={{
                  left: `${(bot.x / state.mapWidth) * 100}%`,
                  top: `${(bot.y / state.mapHeight) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
         </div>
      </div>

      {/* Kill Feed (Simplified) */}
      <div className="absolute top-24 left-6 flex flex-col gap-1">
        {state.bots.slice(0, 3).filter(b => b.health < 20).map(b => (
          <div key={b.id} className="text-[10px] text-red-400/80 uppercase font-bold animate-out fade-out duration-1000">
             Enemy {b.id.slice(-4)} is wounded
          </div>
        ))}
      </div>
    </div>
  );
};
