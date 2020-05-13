import {WeaponAnimation} from "./WeaponAnimation";

export interface WeaponConfig {
  readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly level: number;
  readonly price: number;
  readonly animations: WeaponAnimationConfig;
}

export interface WeaponAnimationConfig {
  readonly idle: string;
  readonly run: string;
  readonly hit: string[];
}

export interface WeaponsConfig {
  readonly animations: Partial<Record<string, WeaponAnimation>>;
  readonly weapons: {
    readonly hero: Partial<Record<string, WeaponConfig>>;
    readonly npc: Partial<Record<string, WeaponConfig>>;
    readonly monster: Partial<Record<string, WeaponConfig>>;
  };
}