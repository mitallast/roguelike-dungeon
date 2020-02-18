import {RNG} from "./rng";
import {HeroMonster} from "./hero";
import {Tile, TileRegistry} from "./tilemap";
import {InventoryCell} from "./inventory";

export interface Drop {
  readonly tile: Tile
  pickedUp(hero: HeroMonster): boolean;
}

export interface UsableDrop extends Drop {
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, hero: HeroMonster): void;
}

export class Coins implements Drop {
  readonly tile: Tile;
  private readonly coins: number;

  constructor(rng: RNG, registry: TileRegistry) {
    this.tile = registry.get("coin_anim");
    this.coins = rng.nextRange(1, 30)
  }

  pickedUp(hero: HeroMonster): boolean {
    hero.addCoins(this.coins);
    return true;
  };
}

export class HealthFlask implements UsableDrop {
  readonly tile: Tile;
  private readonly health: number;

  constructor(registry: TileRegistry) {
    this.tile = registry.get("flask_red");
    this.health = 2;
  }

  pickedUp(hero: HeroMonster): boolean {
    return hero.inventory.add(this);

  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  };

  use(cell: InventoryCell, hero: HeroMonster) {
    hero.hill(this.health);
    cell.count--;
    if (cell.count <= 0) {
      cell.item = null;
      cell.count = 0;
    }
  };
}

export class HealthBigFlask implements UsableDrop {
  readonly tile: Tile;
  private readonly health: number;

  constructor(registry: TileRegistry) {
    this.tile = registry.get("flask_big_red");
    this.health = 5;
  }

  pickedUp(hero: HeroMonster): boolean {
    return hero.inventory.add(this);
  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  };

  use(cell: InventoryCell, hero: HeroMonster) {
    hero.hill(this.health);
    cell.count--;
    if (cell.count <= 0) {
      cell.item = null;
      cell.count = 0;
    }
  };
}

export const weaponNames = [
  "weapon_knife",
  "weapon_rusty_sword",
  "weapon_regular_sword",
  "weapon_red_gem_sword",
  "weapon_big_hammer",
  "weapon_hammer",
  "weapon_baton_with_spikes",
  "weapon_mace",
  "weapon_katana",
  "weapon_saw_sword",
  "weapon_anime_sword",
  "weapon_axe",
  "weapon_machete",
  "weapon_cleaver",
  "weapon_duel_sword",
  "weapon_knight_sword",
  "weapon_golden_sword",
  "weapon_lavish_sword",
  "weapon_red_magic_staff",
  "weapon_green_magic_staff",
];

export class WeaponConfig {
  readonly tileName: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly level: number;

  constructor(tileName: string, speed: number, distance: number, damage: number, level: number) {
    this.tileName = tileName;
    this.speed = speed;
    this.distance = distance;
    this.damage = damage;
    this.level = level;
  }

  create(registry: TileRegistry): Weapon {
    return new Weapon(registry.get(this.tileName), this.speed, this.distance, this.damage);
  }

  static configs: WeaponConfig[] = [
    new WeaponConfig("weapon_knife", 100, 1, 3, 1),
    new WeaponConfig("weapon_rusty_sword", 100, 1, 4, 1),
    new WeaponConfig("weapon_regular_sword", 100, 1, 5, 3),
    new WeaponConfig("weapon_red_gem_sword", 100, 1, 6, 3),

    new WeaponConfig("weapon_big_hammer", 300, 2, 10, 5),
    new WeaponConfig("weapon_hammer", 200, 1, 7, 5),
    new WeaponConfig("weapon_baton_with_spikes", 200, 1, 7, 5),
    new WeaponConfig("weapon_mace", 200, 1, 7, 5),

    new WeaponConfig("weapon_katana", 100, 1, 8, 7),
    new WeaponConfig("weapon_saw_sword", 200, 1, 9, 7),
    new WeaponConfig("weapon_anime_sword", 200, 1, 12, 7),
    new WeaponConfig("weapon_axe", 200, 1, 12, 7),

    new WeaponConfig("weapon_machete", 100, 1, 11, 9),
    new WeaponConfig("weapon_cleaver", 100, 1, 12, 9),
    new WeaponConfig("weapon_duel_sword", 100, 1, 13, 9),
    new WeaponConfig("weapon_knight_sword", 100, 1, 14, 9),

    new WeaponConfig("weapon_golden_sword", 100, 1, 15, 11),
    new WeaponConfig("weapon_lavish_sword", 100, 1, 16, 11),
  ];
}

export class Weapon implements UsableDrop {
  readonly tile: Tile;
  frame: number;
  readonly numOfFrames: number;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;

  constructor(tile: Tile, speed: number, distance: number, damage: number) {
    this.tile = tile;
    this.frame = 0;
    this.numOfFrames = 4;
    this.speed = speed;
    this.distance = distance;
    this.damage = damage;
  }

  pickedUp(hero: HeroMonster): boolean {
    return hero.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return false;
  }

  use(cell: InventoryCell, hero: HeroMonster): void {
    const prev = hero.weapon;
    hero.weapon = this;
    if (prev) {
      cell.item = prev;
      cell.count = 1;
    } else {
      cell.item = null;
      cell.count = 0;
    }
  }
}