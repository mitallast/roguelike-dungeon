import {RNG} from "./rng";
import {HeroView} from "./hero";
import {TileRegistry} from "./tilemap";
import {InventoryCell} from "./inventory";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {View} from "./view";
// @ts-ignore
import * as PIXI from "pixi.js";

const TILE_SIZE = 16;

export interface Drop {
  pickedUp(hero: HeroView): boolean;
  sprite(): PIXI.Sprite | PIXI.AnimatedSprite;
  dropView(level: DungeonLevel, x: number, y: number): DropView;
}

export class DropView implements View {
  private readonly drop: Drop;
  private readonly level: DungeonLevel;
  private readonly sprite: PIXI.Sprite | PIXI.AnimatedSprite;
  private readonly x: number;
  private readonly y: number;

  constructor(drop: Drop, level: DungeonLevel, x: number, y: number) {
    this.drop = drop;
    this.level = level;
    this.x = x;
    this.y = y;
    this.sprite = drop.sprite();
    this.sprite.position.set(
      x * TILE_SIZE + (TILE_SIZE >> 1) - (this.sprite.width >> 1),
      y * TILE_SIZE + TILE_SIZE - 2
    );
    this.sprite.anchor.set(0, 1);
    this.sprite.zIndex = DungeonZIndexes.drop;
    if (this.sprite instanceof PIXI.AnimatedSprite) {
      this.sprite.animationSpeed = 0.2;
    }
    level.container.addChild(this.sprite);
    level.container.sortChildren();
  }

  pickedUp(hero: HeroView): void {
    if (this.drop.pickedUp(hero)) {
      this.level.setDrop(this.x, this.y, null);
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }

  update(delta: number): void {
    if (this.sprite instanceof PIXI.AnimatedSprite) {
      this.sprite.play();
    }
  }
}

export interface UsableDrop extends Drop {
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, hero: HeroView): void;
}

export class Coins implements Drop {
  private readonly registry: TileRegistry;
  private readonly coins: number;

  constructor(rng: RNG, registry: TileRegistry) {
    this.registry = registry;
    this.coins = rng.nextRange(1, 30)
  }

  pickedUp(hero: HeroView): boolean {
    hero.addCoins(this.coins);
    return true;
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.registry.animated("coin");
  }

  dropView(level: DungeonLevel, x: number, y: number): DropView {
    return new DropView(this, level, x, y);
  }
}

export class HealthFlask implements UsableDrop {
  private readonly registry: TileRegistry;
  private readonly health: number;

  constructor(registry: TileRegistry) {
    this.registry = registry;
    this.health = 2;
  }

  pickedUp(hero: HeroView): boolean {
    return hero.addInventory(this);
  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  };

  use(cell: InventoryCell, hero: HeroView) {
    hero.hill(this.health);
    cell.decrease();
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.registry.sprite("flask_red.png");
  }

  dropView(level: DungeonLevel, x: number, y: number): DropView {
    return new DropView(this, level, x, y);
  }
}

export class HealthBigFlask implements UsableDrop {
  private readonly registry: TileRegistry;
  private readonly health: number;

  constructor(registry: TileRegistry) {
    this.registry = registry;
    this.health = 5;
  }

  pickedUp(hero: HeroView): boolean {
    return hero.addInventory(this);
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.registry.sprite("flask_big_red.png");
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  };

  use(cell: InventoryCell, hero: HeroView) {
    hero.hill(this.health);
    cell.decrease();
  };

  dropView(level: DungeonLevel, x: number, y: number): DropView {
    return new DropView(this, level, x, y);
  }
}

export class WeaponConfig {
  readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;
  readonly level: number;

  constructor(name: string, speed: number, distance: number, damage: number, level: number) {
    this.name = name;
    this.speed = speed;
    this.distance = distance;
    this.damage = damage;
    this.level = level;
  }

  create(registry: TileRegistry): Weapon {
    return new Weapon(registry, this.name, this.speed, this.distance, this.damage);
  }

  static configs: WeaponConfig[] = [
    new WeaponConfig("weapon_knife", 0.2, 1, 3, 1),
    new WeaponConfig("weapon_rusty_sword", 0.2, 1, 4, 1),
    new WeaponConfig("weapon_regular_sword", 0.2, 1, 5, 3),
    new WeaponConfig("weapon_red_gem_sword", 0.2, 1, 6, 3),

    new WeaponConfig("weapon_big_hammer", 0.5, 2, 10, 5),
    new WeaponConfig("weapon_hammer", 0.4, 1, 7, 5),
    new WeaponConfig("weapon_baton_with_spikes", 0.4, 1, 7, 5),
    new WeaponConfig("weapon_mace", 0.4, 1, 7, 5),

    new WeaponConfig("weapon_katana", 0.2, 1, 8, 7),
    new WeaponConfig("weapon_saw_sword", 0.4, 1, 9, 7),
    new WeaponConfig("weapon_anime_sword", 0.4, 1, 12, 7),
    new WeaponConfig("weapon_axe", 0.4, 1, 12, 7),

    new WeaponConfig("weapon_machete", 0.2, 1, 11, 9),
    new WeaponConfig("weapon_cleaver", 0.2, 1, 12, 9),
    new WeaponConfig("weapon_duel_sword", 0.2, 1, 13, 9),
    new WeaponConfig("weapon_knight_sword", 0.2, 1, 14, 9),

    new WeaponConfig("weapon_golden_sword", 0.2, 1, 15, 11),
    new WeaponConfig("weapon_lavish_sword", 0.2, 1, 16, 11),
  ];
}

export class Weapon implements UsableDrop {
  private readonly registry: TileRegistry;
  private readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;

  constructor(registry: TileRegistry, name: string, speed: number, distance: number, damage: number) {
    this.registry = registry;
    this.name = name;
    this.speed = speed;
    this.distance = distance;
    this.damage = damage;
  }

  sprite(): PIXI.Sprite {
    return this.registry.sprite(this.name + ".png");
  }

  pickedUp(hero: HeroView): boolean {
    return hero.addInventory(this);
  }

  same(item: UsableDrop): boolean {
    return false;
  }

  use(cell: InventoryCell, hero: HeroView): void {
    const prev = hero.setWeapon(this);
    cell.clear();
    if (prev) {
      cell.set(prev);
    }
  }

  dropView(level: DungeonLevel, x: number, y: number): DropView {
    return new DropView(this, level, x, y);
  }
}