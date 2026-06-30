/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Player, 
  GameState, 
  GameStatus, 
  MAP_SIZE, 
  INITIAL_PLAYER_HEALTH, 
  INITIAL_PLAYER_ARMOR,
  WeaponType,
  LootItem
} from './types';
import { WEAPONS } from './constants';

const createPlayer = (id: string, isBot: boolean): Player => {
  const x = Math.random() * MAP_SIZE;
  const y = Math.random() * MAP_SIZE;
  return {
    id,
    x,
    y,
    radius: 15,
    color: isBot ? '#ef4444' : '#3b82f6',
    health: INITIAL_PLAYER_HEALTH,
    maxHealth: INITIAL_PLAYER_HEALTH,
    armor: INITIAL_PLAYER_ARMOR,
    maxArmor: 100,
    speed: 4,
    angle: 0,
    weapon: WEAPONS[WeaponType.PISTOL](),
    kills: 0,
    isBot,
    lastShootTime: 0,
    isReloading: false,
    reloadStartTime: 0,
  };
};

const createLoot = (count: number): LootItem[] => {
  const items: LootItem[] = [];
  const types: ('WEAPON' | 'HEALTH' | 'ARMOR' | 'AMMO')[] = ['WEAPON', 'HEALTH', 'ARMOR', 'AMMO'];
  const weaponTypes = [WeaponType.RIFLE, WeaponType.SHOTGUN];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    let value: any = 10;
    if (type === 'WEAPON') {
      const wt = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
      value = WEAPONS[wt]();
    }

    items.push({
      id: `loot-${i}`,
      x: Math.random() * MAP_SIZE,
      y: Math.random() * MAP_SIZE,
      radius: 10,
      color: '#fbbf24',
      type,
      value,
    });
  }
  return items;
};

export const createInitialState = (): GameState => {
  const bots: Player[] = [];
  for (let i = 0; i < 49; i++) {
    bots.push(createPlayer(`bot-${i}`, true));
  }

  return {
    status: GameStatus.MENU,
    player: createPlayer('player', false),
    bots,
    bullets: [],
    loot: createLoot(200),
    zone: {
      x: MAP_SIZE / 2,
      y: MAP_SIZE / 2,
      radius: MAP_SIZE / 0.7, // Start larger than map
      targetRadius: MAP_SIZE / 2,
      shrinkRate: 0.1,
    },
    mapWidth: MAP_SIZE,
    mapHeight: MAP_SIZE,
    lastTime: Date.now(),
  };
};

export const updateGame = (state: GameState, keys: Set<string>, mouse: { x: number, y: number, down: boolean }): GameState => {
  const now = Date.now();
  const dt = (now - state.lastTime) / 1000;
  if (state.status !== GameStatus.IN_GAME) return { ...state, lastTime: now };

  const newState = { ...state, lastTime: now };
  const { player, bots, bullets, loot, zone } = newState;

  // 1. Update Player
  if (keys.has('w')) player.y -= player.speed;
  if (keys.has('s')) player.y += player.speed;
  if (keys.has('a')) player.x -= player.speed;
  if (keys.has('d')) player.x += player.speed;

  // Clamp player to map
  player.x = Math.max(0, Math.min(MAP_SIZE, player.x));
  player.y = Math.max(0, Math.min(MAP_SIZE, player.y));

  // Player Direction (Angle towards mouse)
  // Note: Mouse coordinates are screen space, need to convert or handle in component
  // For now, let's assume the component passes world coordinates for mouse
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Shooting
  if (mouse.down && player.weapon && !player.isReloading) {
    if (now - player.lastShootTime > player.weapon.fireRate) {
      if (player.weapon.currentAmmo > 0) {
        player.weapon.currentAmmo--;
        player.lastShootTime = now;
        
        // Spawn Bullet
        if (player.weapon.type === WeaponType.SHOTGUN) {
          for (let i = 0; i < 5; i++) {
            const spread = (Math.random() - 0.5) * player.weapon.spread;
            newState.bullets.push(createBullet(player, player.angle + spread));
          }
        } else {
          newState.bullets.push(createBullet(player, player.angle));
        }

        if (player.weapon.currentAmmo === 0) {
          player.isReloading = true;
          player.reloadStartTime = now;
        }
      }
    }
  }

  // Reloading
  if (player.isReloading && now - player.reloadStartTime > (player.weapon?.reloadTime || 0)) {
    if (player.weapon) {
      player.weapon.currentAmmo = player.weapon.ammoCapacity;
    }
    player.isReloading = false;
  }

  // 2. Update Bots
  newState.bots = bots.filter(bot => bot.health > 0).map(bot => {
    // Basic AI: Move towards center of zone
    const dx = zone.x - bot.x;
    const dy = zone.y - bot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > zone.radius * 0.8) {
      bot.x += (dx / dist) * bot.speed * 0.8;
      bot.y += (dy / dist) * bot.speed * 0.8;
    } else {
      // Random wandering/patrol
      if (!bot.targetX || Math.random() < 0.01) {
        bot.targetX = bot.x + (Math.random() - 0.5) * 400;
        bot.targetY = bot.y + (Math.random() - 0.5) * 400;
      }
      const tdx = bot.targetX - bot.x;
      const tdy = bot.targetY - bot.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tdist > 5) {
        bot.x += (tdx / tdist) * bot.speed * 0.5;
        bot.y += (tdy / tdist) * bot.speed * 0.5;
      }
    }

    // Bot Shooting Logic
    const distToPlayer = Math.sqrt(Math.pow(bot.x - player.x, 2) + Math.pow(bot.y - player.y, 2));
    if (distToPlayer < 500 && !bot.isReloading) {
      bot.angle = Math.atan2(player.y - bot.y, player.x - bot.x);
      if (now - bot.lastShootTime > (bot.weapon?.fireRate || 500)) {
        if (bot.weapon && bot.weapon.currentAmmo > 0) {
          bot.weapon.currentAmmo--;
          bot.lastShootTime = now;
          newState.bullets.push(createBullet(bot, bot.angle));
        } else {
          bot.isReloading = true;
          bot.reloadStartTime = now;
        }
      }
    }

    if (bot.isReloading && now - bot.reloadStartTime > (bot.weapon?.reloadTime || 2000)) {
      if (bot.weapon) bot.weapon.currentAmmo = bot.weapon.ammoCapacity;
      bot.isReloading = false;
    }

    // Damage from zone
    const dToZone = Math.sqrt(Math.pow(bot.x - zone.x, 2) + Math.pow(bot.y - zone.y, 2));
    if (dToZone > zone.radius) {
      bot.health -= 0.5;
    }

    return bot;
  });

  // 3. Update Bullets
  newState.bullets = bullets.filter(bullet => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.distanceTraveled += Math.sqrt(bullet.vx**2 + bullet.vy**2);

    if (bullet.distanceTraveled > bullet.maxDistance) return false;

    // Collsion check with bots or player
    if (bullet.ownerId === 'player') {
      for (const bot of newState.bots) {
        const dist = Math.sqrt(Math.pow(bot.x - bullet.x, 2) + Math.pow(bot.y - bullet.y, 2));
        if (dist < bot.radius + bullet.radius) {
          bot.health -= bullet.damage;
          if (bot.health <= 0) player.kills++;
          return false;
        }
      }
    } else {
      // Bot bullet hitting player
      const dist = Math.sqrt(Math.pow(player.x - bullet.x, 2) + Math.pow(player.y - bullet.y, 2));
      if (dist < player.radius + bullet.radius) {
        if (player.armor > 0) {
          player.armor -= bullet.damage;
          if (player.armor < 0) {
             player.health += player.armor;
             player.armor = 0;
          }
        } else {
          player.health -= bullet.damage;
        }
        return false;
      }
    }

    return true;
  });

  // 4. Update Zone
  if (zone.radius > zone.targetRadius) {
    zone.radius -= zone.shrinkRate;
  } else {
    // New circle targets
    zone.targetRadius *= 0.7;
    zone.shrinkRate *= 1.2;
  }

  // Player Damage from Zone
  const distToZone = Math.sqrt(Math.pow(player.x - zone.x, 2) + Math.pow(player.y - zone.y, 2));
  if (distToZone > zone.radius) {
    player.health -= 0.2;
  }

  // 5. Looting (Automatic for now)
  newState.loot = loot.filter(l => {
    const d = Math.sqrt(Math.pow(player.x - l.x, 2) + Math.pow(player.y - l.y, 2));
    if (d < player.radius + l.radius) {
      if (l.type === 'HEALTH') player.health = Math.min(player.maxHealth, player.health + 20);
      if (l.type === 'ARMOR') player.armor = Math.min(player.maxArmor, player.armor + 20);
      if (l.type === 'WEAPON') player.weapon = l.value;
      if (l.type === 'AMMO' && player.weapon) player.weapon.currentAmmo = player.weapon.ammoCapacity;
      return false;
    }
    return true;
  });

  // 6. Win/Loss Conditions
  if (player.health <= 0) newState.status = GameStatus.GAMEOVER;
  if (newState.bots.length === 0) newState.status = GameStatus.VICTORY;

  return newState;
};

const createBullet = (owner: Player, angle: number) => {
  const speed = 15;
  return {
    id: `b-${owner.id}-${Date.now()}-${Math.random()}`,
    x: owner.x + Math.cos(angle) * (owner.radius + 5),
    y: owner.y + Math.sin(angle) * (owner.radius + 5),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 3,
    color: '#facc15',
    ownerId: owner.id,
    damage: owner.weapon?.damage || 10,
    distanceTraveled: 0,
    maxDistance: owner.weapon?.range || 800,
  };
};

