/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect } from 'react';
import { GameState, MAP_SIZE } from './types';
import { COLORS } from './constants';

interface GameCanvasProps {
  state: GameState;
  onResize: (w: number, h: number) => void;
}

export const GameCanvas = ({ state, onResize }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        onResize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [onResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { player, bots, bullets, loot, zone } = state;
      const w = canvas.width;
      const h = canvas.height;

      // Camera Offset
      const offsetX = w / 2 - player.x;
      const offsetY = h / 2 - player.y;

      ctx.clearRect(0, 0, w, h);

      // Background (Grass)
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Map Bound
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

      // Grass Texture (Simplified dots)
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < 2000; i += 200) {
        for (let j = 0; j < 2000; j += 200) {
          ctx.beginPath();
          ctx.arc(i * 2, j * 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Loot
      loot.forEach(item => {
        ctx.fillStyle = item.type === 'WEAPON' ? COLORS.LOOT_WEAPON : 
                       item.type === 'HEALTH' ? COLORS.LOOT_HEALTH : COLORS.LOOT_ARMOR;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        // Glow for loot
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Bullets
      bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bots
      bots.forEach(bot => {
        renderPlayer(ctx, bot);
      });

      // Player
      renderPlayer(ctx, player);

      // Zone
      ctx.fillStyle = COLORS.ZONE;
      ctx.beginPath();
      // Outer rectangle (Whole map)
      ctx.rect(-MAP_SIZE, -MAP_SIZE, MAP_SIZE * 3, MAP_SIZE * 3);
      // Inner circle (Counter-clockwise to create a hole)
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2, true);
      ctx.fill();

      ctx.strokeStyle = COLORS.ZONE_BORDER;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const renderPlayer = (ctx: CanvasRenderingContext2D, p: any) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Body
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Direction Marker
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.radius - 5, -2, 10, 4);

      // Health Bar above player
      ctx.restore();
      ctx.save();
      ctx.translate(p.x, p.y);
      const barW = 30;
      const barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW/2, -p.radius - 10, barW, barH);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-barW/2, -p.radius - 10, barW * (p.health / p.maxHealth), barH);
      
      ctx.restore();
    };

    render();
  }, [state]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full bg-[#064e3b] cursor-crosshair"
    />
  );
};
