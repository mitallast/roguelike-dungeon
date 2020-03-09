import {RNG} from "./rng";
import {HeroState} from "./hero";
import {Resources} from "./resources";
import {InventoryCell} from "./inventory";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {View} from "./view";
// @ts-ignore
import * as PIXI from "pixi.js";
import {Colors} from "./colors";

const TILE_SIZE = 16;
const MARGIN = 40;

export interface Drop {
  pickedUp(hero: HeroState): boolean;
  sprite(): PIXI.Sprite | PIXI.AnimatedSprite;
  dropView(dungeon: DungeonLevel, x: number, y: number): DropView;
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

  pickedUp(hero: HeroState): void {
    if (this.drop.pickedUp(hero)) {
      this.level.cell(this.x, this.y).drop = null;
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
  info(): DropInfo;
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, hero: HeroState): void;
}

export interface DropInfo {
  health?: number
  speed?: number
  distance?: number
  damage?: number
}

export class Coins implements Drop {
  private readonly resources: Resources;
  private readonly coins: number;

  constructor(rng: RNG, resources: Resources) {
    this.resources = resources;
    this.coins = rng.nextRange(1, 30)
  }

  pickedUp(hero: HeroState): boolean {
    hero.addCoins(this.coins);
    return true;
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.resources.animated("coin");
  }

  dropView(level: DungeonLevel, x: number, y: number): DropView {
    return new DropView(this, level, x, y);
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
      health: this.health
    };
  }

  pickedUp(hero: HeroState): boolean {
    return hero.inventory.add(this);
  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  };

  use(cell: InventoryCell, hero: HeroState) {
    hero.hill(this.health);
    cell.decrease();
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.resources.sprite("flask_red.png");
  }

  dropView(level: DungeonLevel, x: number, y: number): DropView {
    return new DropView(this, level, x, y);
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
      health: this.health
    };
  }

  pickedUp(hero: HeroState): boolean {
    return hero.inventory.add(this);
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.resources.sprite("flask_big_red.png");
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  };

  use(cell: InventoryCell, hero: HeroState) {
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

  create(resources: Resources): Weapon {
    return new Weapon(resources, this.name, this.speed, this.distance, this.damage);
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
  private readonly resources: Resources;
  private readonly name: string;
  readonly speed: number;
  readonly distance: number;
  readonly damage: number;

  constructor(resources: Resources, name: string, speed: number, distance: number, damage: number) {
    this.resources = resources;
    this.name = name;
    this.speed = speed;
    this.distance = distance;
    this.damage = damage;
  }

  info(): DropInfo {
    return {
      speed: this.speed,
      distance: this.distance,
      damage: this.damage,
    };
  }

  sprite(): PIXI.Sprite {
    return this.resources.sprite(this.name + ".png");
  }

  pickedUp(hero: HeroState): boolean {
    return hero.inventory.add(this);
  }

  same(item: UsableDrop): boolean {
    return false;
  }

  use(cell: InventoryCell, hero: HeroState): void {
    const prev = hero.inventory.equipment.weapon.get();
    hero.inventory.equipment.weapon.set(this);
    cell.clear();
    if (prev) {
      cell.set(prev);
    }
  }

  dropView(level: DungeonLevel, x: number, y: number): DropView {
    return new DropView(this, level, x, y);
  }
}

export class DropCardView extends PIXI.Container {
  private readonly _width: number;
  private readonly _height: number;
  private _drop: UsableDrop;
  private _sprite: PIXI.Sprite | PIXI.AnimatedSprite;
  private _description: PIXI.BitmapText;

  constructor(options: {
    width?: number,
    height?: number,
  }) {
    super();

    this._width = options.width || 200;
    this._height = options.height || 400;

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(0, 0, this._width, this._height)
      .endFill();

    this._description = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._description.position.set(MARGIN, this._width + MARGIN);

    super.addChild(background, this._description);
  }

  set drop(drop: UsableDrop) {
    this._drop = null;
    this._sprite?.destroy();
    this._sprite = null;
    this._description.text = null;

    if (drop) {
      this._drop = drop;
      const sprite = this._sprite = drop.sprite();
      super.addChild(sprite);
      sprite.anchor.set(0.5, 0.5);
      sprite.position.set(this._width >> 1, this._width >> 1);
      const s_w = sprite.width;
      const s_h = sprite.height;
      const max_size = this._width - (MARGIN << 1);
      if (s_w > s_h) {
        this._sprite.width = max_size;
        this._sprite.height = (max_size / s_w) * s_h;
      } else {
        this._sprite.height = max_size;
        this._sprite.width = (max_size / s_h) * s_w;
      }

      const info = drop.info();
      const text: string[] = [];

      if (info.health) text.push(`health: ${info.health}`);
      if (info.speed) text.push(`speed: ${info.speed}`);
      if (info.distance) text.push(`distance: ${info.distance}`);
      if (info.damage) text.push(`damage: ${info.damage}`);

      this._description.text = text.join("\n");
    }
  }
}