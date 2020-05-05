/* eslint-disable @typescript-eslint/camelcase */

import {weaponAnimations, WeaponAnimationSet} from "./WeaponAnimation";

export interface WeaponConfig {
  readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly level: number;
  readonly price: number;
  readonly animations: WeaponAnimationSet;
}

export interface Weapons extends Record<string, WeaponConfig> {
  readonly knife: WeaponConfig;
  readonly rusty_sword: WeaponConfig;
  readonly regular_sword: WeaponConfig;
  readonly red_gem_sword: WeaponConfig;
  readonly hammer: WeaponConfig;
  readonly big_hammer: WeaponConfig;
  readonly baton_with_spikes: WeaponConfig;
  readonly mace: WeaponConfig;
  readonly katana: WeaponConfig;
  readonly saw_sword: WeaponConfig;
  readonly anime_sword: WeaponConfig;
  readonly axe: WeaponConfig;
  readonly machete: WeaponConfig;
  readonly cleaver: WeaponConfig;
  readonly duel_sword: WeaponConfig;
  readonly knight_sword: WeaponConfig;
  readonly golden_sword: WeaponConfig;
  readonly lavish_sword: WeaponConfig;
}

export const weapons: Weapons = {
  knife: {
    name: "weapon_knife",
    speed: 1.4,
    distance: 1,
    damage: 2,
    level: 1,
    price: 12,
    animations: weaponAnimations.knife
  },
  rusty_sword: {
    name: "weapon_rusty_sword",
    speed: 1.0,
    distance: 1,
    damage: 4,
    level: 1,
    price: 15,
    animations: weaponAnimations.rusty_sword
  },
  regular_sword: {
    name: "weapon_regular_sword",
    speed: 1.0,
    distance: 1,
    damage: 5,
    level: 3,
    price: 20,
    animations: weaponAnimations.regular_sword
  },
  red_gem_sword: {
    name: "weapon_red_gem_sword",
    speed: 1.0,
    distance: 1,
    damage: 6,
    level: 3,
    price: 30,
    animations: weaponAnimations.red_gem_sword
  },
  hammer: {
    name: "weapon_hammer",
    speed: 0.7,
    distance: 1,
    damage: 7,
    level: 5,
    price: 38,
    animations: weaponAnimations.hammer
  },
  big_hammer: {
    name: "weapon_big_hammer",
    speed: 0.5,
    distance: 2,
    damage: 10,
    level: 5,
    price: 40,
    animations: weaponAnimations.big_hammer
  },
  baton_with_spikes: {
    name: "weapon_baton_with_spikes",
    speed: 0.6,
    distance: 1,
    damage: 7,
    level: 5,
    price: 42,
    animations: weaponAnimations.baton_with_spikes
  },
  mace: {
    name: "weapon_mace",
    speed: 0.6,
    distance: 1,
    damage: 7,
    level: 5,
    price: 45,
    animations: weaponAnimations.mace
  },
  katana: {
    name: "weapon_katana",
    speed: 1.5,
    distance: 1,
    damage: 8,
    level: 7,
    price: 100,
    animations: weaponAnimations.katana
  },
  saw_sword: {
    name: "weapon_saw_sword",
    speed: 1.5,
    distance: 1,
    damage: 9,
    level: 7,
    price: 110,
    animations: weaponAnimations.saw_sword
  },
  anime_sword: {
    name: "weapon_anime_sword",
    speed: 0.7,
    distance: 1,
    damage: 12,
    level: 7,
    price: 130,
    animations: weaponAnimations.anime_sword
  },
  axe: {
    name: "weapon_axe",
    speed: 0.8,
    distance: 1,
    damage: 12,
    level: 7,
    price: 115,
    animations: weaponAnimations.axe
  },
  machete: {
    name: "weapon_machete",
    speed: 1.0,
    distance: 1,
    damage: 11,
    level: 9,
    price: 150,
    animations: weaponAnimations.machete
  },
  cleaver: {
    name: "weapon_cleaver",
    speed: 1.0,
    distance: 1,
    damage: 12,
    level: 9,
    price: 160,
    animations: weaponAnimations.cleaver
  },
  duel_sword: {
    name: "weapon_duel_sword",
    speed: 1.5,
    distance: 1,
    damage: 13,
    level: 9,
    price: 170,
    animations: weaponAnimations.duel_sword
  },
  knight_sword: {
    name: "weapon_knight_sword",
    speed: 1.5,
    distance: 1,
    damage: 14,
    level: 9,
    price: 180,
    animations: weaponAnimations.knight_sword
  },
  golden_sword: {
    name: "weapon_golden_sword",
    speed: 1.5,
    distance: 1,
    damage: 15,
    level: 11,
    price: 220,
    animations: weaponAnimations.golden_sword
  },
  lavish_sword: {
    name: "weapon_lavish_sword",
    speed: 1.5,
    distance: 1,
    damage: 16,
    level: 11,
    price: 240,
    animations: weaponAnimations.lavish_sword
  },
};

export const weaponConfigs: readonly WeaponConfig[] = Object.getOwnPropertyNames(weapons).map(w => weapons[w]);

export interface MonsterWeapons extends Record<string, WeaponConfig> {
  readonly knife: WeaponConfig;
  readonly baton_with_spikes: WeaponConfig;
  readonly anime_sword: WeaponConfig;
  readonly big_hammer: WeaponConfig;
  readonly mace: WeaponConfig;
  readonly cleaver: WeaponConfig;
}

export const monsterWeapons: MonsterWeapons = {
  knife: {
    name: "weapon_knife",
    speed: 0.7,
    distance: 1,
    damage: 0.5,
    level: 1,
    price: 0,
    animations: weaponAnimations.knife
  },
  baton_with_spikes: {
    name: "weapon_baton_with_spikes",
    speed: 0.3,
    distance: 1,
    damage: 3,
    level: 5,
    price: 0,
    animations: weaponAnimations.baton_with_spikes
  },
  anime_sword: {
    name: "weapon_anime_sword",
    speed: 0.4,
    distance: 1,
    damage: 4,
    level: 10,
    price: 0,
    animations: weaponAnimations.anime_sword
  },
  big_hammer: {
    name: "weapon_big_hammer",
    speed: 0.3,
    distance: 2,
    damage: 5,
    level: 15,
    price: 0,
    animations: weaponAnimations.big_hammer
  },
  mace: {
    name: "weapon_mace",
    speed: 0.6,
    distance: 1,
    damage: 6,
    level: 20,
    price: 0,
    animations: weaponAnimations.mace
  },
  cleaver: {
    name: "weapon_cleaver",
    speed: 0.5,
    distance: 1,
    damage: 7,
    level: 25,
    price: 0,
    animations: weaponAnimations.cleaver
  },
};

export interface NpcWeapons extends Record<string, WeaponConfig> {
  readonly knife: WeaponConfig;
  readonly hammer: WeaponConfig;
  readonly cleaver: WeaponConfig;
  readonly axe: WeaponConfig;
  readonly regular_sword: WeaponConfig;
  readonly knight_sword: WeaponConfig;
}

export const npcWeapons: NpcWeapons = {
  knife: {
    name: "weapon_knife",
    speed: 1.4,
    distance: 1,
    damage: 2,
    level: 1,
    price: 12,
    animations: weaponAnimations.knife
  },
  hammer: {
    name: "weapon_hammer",
    speed: 0.7,
    distance: 1,
    damage: 7,
    level: 5,
    price: 38,
    animations: weaponAnimations.hammer
  },
  cleaver: {
    name: "weapon_cleaver",
    speed: 1.0,
    distance: 1,
    damage: 12,
    level: 9,
    price: 160,
    animations: weaponAnimations.cleaver
  },
  axe: {
    name: "weapon_axe",
    speed: 0.8,
    distance: 1,
    damage: 12,
    level: 7,
    price: 115,
    animations: weaponAnimations.axe
  },
  regular_sword: {
    name: "weapon_regular_sword",
    speed: 1.0,
    distance: 1,
    damage: 5,
    level: 3,
    price: 20,
    animations: weaponAnimations.regular_sword
  },
  knight_sword: {
    name: "weapon_knight_sword",
    speed: 1.5,
    distance: 1,
    damage: 14,
    level: 9,
    price: 180,
    animations: weaponAnimations.knight_sword
  },
}