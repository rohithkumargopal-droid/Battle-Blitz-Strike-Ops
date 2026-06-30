/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  IN_GAME = 'IN_GAME',
  VICTORY = 'VICTORY',
  GAMEOVER = 'GAMEOVER',
}

export enum WeaponType {
  PISTOL = 'PISTOL',
  RIFLE = 'RIFLE',
  SHOTGUN = 'SHOTGUN',
  NONE = 'NONE',
}

export interface Weapon {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  reloadTime: number;
  ammoCapacity: number;
  currentAmmo: number;
  range: number;
  spread: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  speed: number;
  angle: number;
  weapon: Weapon | null;
  kills: number;
  isBot: boolean;
  targetX?: number;
  targetY?: number;
  lastShootTime: number;
  isReloading: boolean;
  reloadStartTime: number;
}

export interface LootItem extends Entity {
  type: 'WEAPON' | 'HEALTH' | 'ARMOR' | 'AMMO';
  value: any;
}

export interface Bullet extends Entity {
  ownerId: string;
  vx: number;
  vy: number;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
}

export interface GameState {
  status: GameStatus;
  player: Player;
  bots: Player[];
  bullets: Bullet[];
  loot: LootItem[];
  zone: {
    x: number;
    y: number;
    radius: number;
    targetRadius: number;
    shrinkRate: number;
  };
  mapWidth: number;
  mapHeight: number;
  lastTime: number;
}

export const MAP_SIZE = 4000;
export const INITIAL_PLAYER_HEALTH = 100;
export const INITIAL_PLAYER_ARMOR = 0;
export const MAX_BOTS = 49; // Total 50 players including user
