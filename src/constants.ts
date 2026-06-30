/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponType, Weapon } from './types';

export const WEAPONS: Record<WeaponType, () => Weapon> = {
  [WeaponType.PISTOL]: () => ({
    type: WeaponType.PISTOL,
    name: 'G18',
    damage: 15,
    fireRate: 400,
    reloadTime: 1200,
    ammoCapacity: 12,
    currentAmmo: 12,
    range: 600,
    spread: 0.05,
  }),
  [WeaponType.RIFLE]: () => ({
    type: WeaponType.RIFLE,
    name: 'AK47',
    damage: 25,
    fireRate: 150,
    reloadTime: 2500,
    ammoCapacity: 30,
    currentAmmo: 30,
    range: 1200,
    spread: 0.1,
  }),
  [WeaponType.SHOTGUN]: () => ({
    type: WeaponType.SHOTGUN,
    name: 'M1014',
    damage: 8, // Per pellet
    fireRate: 800,
    reloadTime: 3000,
    ammoCapacity: 6,
    currentAmmo: 6,
    range: 400,
    spread: 0.3,
  }),
  [WeaponType.NONE]: () => (null as unknown as Weapon),
};

export const COLORS = {
  PLAYER: '#3b82f6',
  BOT: '#ef4444',
  ZONE: 'rgba(255, 0, 0, 0.2)',
  ZONE_BORDER: '#ff0000',
  GRASS: '#166534',
  BULLET: '#facc15',
  LOOT_WEAPON: '#fbbf24',
  LOOT_HEALTH: '#10b981',
  LOOT_ARMOR: '#6366f1',
};
