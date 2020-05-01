import {RNG} from "./rng";
import {Hero} from "./hero";
import {InventoryCell} from "./inventory";
import {BezierCurve, Curve} from "./curves";

export interface Drop {
  readonly spriteName: string;
  pickedUp(hero: Hero): boolean;
}

export interface UsableDrop extends Drop {
  info(): DropInfo;
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, hero: Hero): void;
}

export interface DropInfo {
  readonly name: string;
  readonly health?: number;
  readonly speed?: number;
  readonly distance?: number;
  readonly damage?: number;
  readonly price?: number;
}

export class Coins implements Drop {
  readonly spriteName: string = "coin"; // @animated

  private readonly coins: number;

  constructor(rng: RNG) {
    this.coins = rng.range(1, 30);
  }

  pickedUp(hero: Hero): boolean {
    hero.addCoins(this.coins);
    return true;
  }
}

export class HealthFlask implements UsableDrop {
  readonly spriteName: string = "flask_red.png";

  private readonly health: number = 2;

  info(): DropInfo {
    return {
      name: "Health flask",
      health: this.health
    };
  }

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  }

  use(cell: InventoryCell, hero: Hero) {
    hero.heal(this.health);
    cell.decrease();
  }
}

export class HealthBigFlask implements UsableDrop {
  readonly spriteName: string = "flask_big_red.png";

  private readonly health: number = 5;

  info(): DropInfo {
    return {
      name: "Big health flask",
      health: this.health
    };
  }

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  }

  use(cell: InventoryCell, hero: Hero) {
    hero.heal(this.health);
    cell.decrease();
  }
}

export interface WeaponConfig {
  readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly level: number;
  readonly price: number;
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
  knife: {name: "weapon_knife", speed: 1.4, distance: 1, damage: 2, level: 1, price: 12},
  rusty_sword: {name: "weapon_rusty_sword", speed: 1.0, distance: 1, damage: 4, level: 1, price: 15},
  regular_sword: {name: "weapon_regular_sword", speed: 1.0, distance: 1, damage: 5, level: 3, price: 20},
  red_gem_sword: {name: "weapon_red_gem_sword", speed: 1.0, distance: 1, damage: 6, level: 3, price: 30},
  hammer: {name: "weapon_hammer", speed: 0.7, distance: 1, damage: 7, level: 5, price: 38},
  big_hammer: {name: "weapon_big_hammer", speed: 0.5, distance: 2, damage: 10, level: 5, price: 40},
  baton_with_spikes: {name: "weapon_baton_with_spikes", speed: 0.6, distance: 1, damage: 7, level: 5, price: 42},
  mace: {name: "weapon_mace", speed: 0.6, distance: 1, damage: 7, level: 5, price: 45},
  katana: {name: "weapon_katana", speed: 1.5, distance: 1, damage: 8, level: 7, price: 100},
  saw_sword: {name: "weapon_saw_sword", speed: 1.5, distance: 1, damage: 9, level: 7, price: 110},
  anime_sword: {name: "weapon_anime_sword", speed: 0.7, distance: 1, damage: 12, level: 7, price: 130},
  axe: {name: "weapon_axe", speed: 0.8, distance: 1, damage: 12, level: 7, price: 115},
  machete: {name: "weapon_machete", speed: 1.0, distance: 1, damage: 11, level: 9, price: 150},
  cleaver: {name: "weapon_cleaver", speed: 1.0, distance: 1, damage: 12, level: 9, price: 160},
  duel_sword: {name: "weapon_duel_sword", speed: 1.5, distance: 1, damage: 13, level: 9, price: 170},
  knight_sword: {name: "weapon_knight_sword", speed: 1.5, distance: 1, damage: 14, level: 9, price: 180},
  golden_sword: {name: "weapon_golden_sword", speed: 1.5, distance: 1, damage: 15, level: 11, price: 220},
  lavish_sword: {name: "weapon_lavish_sword", speed: 1.5, distance: 1, damage: 16, level: 11, price: 240},
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
  knife: {name: "weapon_knife", speed: 0.7, distance: 1, damage: 0.5, level: 1, price: 0},
  baton_with_spikes: {name: "weapon_baton_with_spikes", speed: 0.3, distance: 1, damage: 3, level: 5, price: 0},
  anime_sword: {name: "weapon_anime_sword", speed: 0.4, distance: 1, damage: 4, level: 10, price: 0},
  big_hammer: {name: "weapon_big_hammer", speed: 0.3, distance: 2, damage: 5, level: 15, price: 0},
  mace: {name: "weapon_mace", speed: 0.6, distance: 1, damage: 6, level: 20, price: 0},
  cleaver: {name: "weapon_cleaver", speed: 0.5, distance: 1, damage: 7, level: 25, price: 0},
};

export class Weapon implements UsableDrop {
  private readonly name: string;
  readonly speed: number;
  readonly curve: Curve<number> = BezierCurve.line(0, -0.5, -1, 0, 1, 2, 0);
  readonly distance: number;
  readonly damage: number;
  readonly price: number;

  get spriteName(): string {
    return this.name + ".png";
  }

  constructor(config: WeaponConfig) {
    this.name = config.name;
    this.speed = config.speed;
    this.distance = config.distance;
    this.damage = config.damage;
    this.price = config.price;
  }

  info(): DropInfo {
    return {
      name: this.name.replace(/weapon_/, ''),
      speed: this.speed,
      distance: this.distance,
      damage: this.damage,
      price: this.price
    };
  }

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  }

  same(_item: UsableDrop): boolean {
    return false;
  }

  use(cell: InventoryCell, _: Hero): void {
    cell.equip();
  }

  static create(rng: RNG, level: number): Weapon | null {
    const available = weaponConfigs.filter(c => c.level <= level);
    if (available.length > 0) {
      const config = rng.select(available)!;
      return new Weapon(config);
    } else {
      return null;
    }
  }

  static select(rng: RNG, weapons: readonly WeaponConfig[]): Weapon | null {
    if (weapons.length > 0) {
      const config = rng.select(weapons)!;
      return new Weapon(config);
    } else {
      return null;
    }
  }
}