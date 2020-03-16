import {RNG} from "./rng";
import {Hero} from "./hero";
import {Resources} from "./resources";
import {InventoryCell} from "./inventory";
import * as PIXI from "pixi.js";

export interface Drop {
  pickedUp(hero: Hero): boolean;
  sprite(): PIXI.Sprite | PIXI.AnimatedSprite;
}

export interface UsableDrop extends Drop {
  info(): DropInfo;
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, hero: Hero): void;
}

export interface DropInfo {
  name: string;
  health?: number;
  speed?: number;
  distance?: number;
  damage?: number;
  price?: number;
}

export class Coins implements Drop {
  private readonly resources: Resources;
  private readonly coins: number;

  constructor(rng: RNG, resources: Resources) {
    this.resources = resources;
    this.coins = rng.nextRange(1, 30)
  }

  pickedUp(hero: Hero): boolean {
    hero.addCoins(this.coins);
    return true;
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.resources.animated("coin");
  }
}

export class HealthFlask implements UsableDrop {
  private readonly resources: Resources;
  private readonly health: number;

  constructor(resources: Resources) {
    this.resources = resources;
    this.health = 2;
  }

  info(): DropInfo {
    return {
      name: "Health flask",
      health: this.health
    };
  }

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  };

  use(cell: InventoryCell, hero: Hero) {
    hero.hill(this.health);
    cell.decrease();
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.resources.sprite("flask_red.png");
  }
}

export class HealthBigFlask implements UsableDrop {
  private readonly resources: Resources;
  private readonly health: number;

  constructor(resources: Resources) {
    this.resources = resources;
    this.health = 5;
  }

  info(): DropInfo {
    return {
      name: "Big health flask",
      health: this.health
    };
  }

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.resources.sprite("flask_big_red.png");
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  };

  use(cell: InventoryCell, hero: Hero) {
    hero.hill(this.health);
    cell.decrease();
  };
}

export class WeaponConfig {
  readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly level: number;
  readonly price: number;

  constructor(name: string, speed: number, distance: number, damage: number, level: number, price: number) {
    this.name = name;
    this.speed = speed;
    this.distance = distance;
    this.damage = damage;
    this.level = level;
    this.price = price;
  }

  create(resources: Resources): Weapon {
    return new Weapon(resources, this);
  }

  static configs: WeaponConfig[] = [
    new WeaponConfig("weapon_knife", 0.2, 1, 3, 1, 12),
    new WeaponConfig("weapon_rusty_sword", 0.2, 1, 4, 1, 15),
    new WeaponConfig("weapon_regular_sword", 0.2, 1, 5, 3, 20),
    new WeaponConfig("weapon_red_gem_sword", 0.2, 1, 6, 3, 30),

    new WeaponConfig("weapon_hammer", 0.4, 1, 7, 5, 38),
    new WeaponConfig("weapon_big_hammer", 0.5, 2, 10, 5, 40),
    new WeaponConfig("weapon_baton_with_spikes", 0.4, 1, 7, 5, 42),
    new WeaponConfig("weapon_mace", 0.4, 1, 7, 5, 45),

    new WeaponConfig("weapon_katana", 0.2, 1, 8, 7, 100),
    new WeaponConfig("weapon_saw_sword", 0.4, 1, 9, 7, 110),
    new WeaponConfig("weapon_anime_sword", 0.4, 1, 12, 7, 130),
    new WeaponConfig("weapon_axe", 0.4, 1, 12, 7, 115),

    new WeaponConfig("weapon_machete", 0.2, 1, 11, 9, 150),
    new WeaponConfig("weapon_cleaver", 0.2, 1, 12, 9, 160),
    new WeaponConfig("weapon_duel_sword", 0.2, 1, 13, 9, 170),
    new WeaponConfig("weapon_knight_sword", 0.2, 1, 14, 9, 180),

    new WeaponConfig("weapon_golden_sword", 0.2, 1, 15, 11, 220),
    new WeaponConfig("weapon_lavish_sword", 0.2, 1, 16, 11, 240),
  ];
}

export class Weapon implements UsableDrop {
  private readonly resources: Resources;
  private readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly price: number;

  constructor(resources: Resources, config: WeaponConfig) {
    this.resources = resources;
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

  sprite(): PIXI.Sprite {
    return this.resources.sprite(this.name + ".png");
  }

  pickedUp(hero: Hero): boolean {
    return hero.inventory.add(this);
  }

  same(_item: UsableDrop): boolean {
    return false;
  }

  use(cell: InventoryCell, hero: Hero): void {
    const prev = hero.inventory.equipment.weapon.item.get();
    hero.inventory.equipment.weapon.clear();
    hero.inventory.equipment.weapon.set(this);
    cell.clear();
    if (prev) {
      cell.set(prev);
    }
  }
}