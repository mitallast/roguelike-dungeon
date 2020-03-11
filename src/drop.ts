import {RNG} from "./rng";
import {HeroCharacter} from "./hero";
import {Resources} from "./resources";
import {InventoryCell} from "./inventory";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {View} from "./view";
import {Colors, Sizes} from "./ui";
// @ts-ignore
import * as PIXI from "pixi.js";

const TILE_SIZE = 16;

export interface Drop {
  pickedUp(hero: HeroCharacter): boolean;
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

  pickedUp(hero: HeroCharacter): void {
    if (this.drop.pickedUp(hero)) {
      this.level.cell(this.x, this.y).drop = null;
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }

  update(_delta: number): void {
    if (this.sprite instanceof PIXI.AnimatedSprite) {
      this.sprite.play();
    }
  }
}

export interface UsableDrop extends Drop {
  info(): DropInfo;
  same(item: UsableDrop): boolean;
  use(cell: InventoryCell, hero: HeroCharacter): void;
}

export interface DropInfo {
  name: string;
  health?: number;
  speed?: number;
  distance?: number;
  damage?: number;
}

export class Coins implements Drop {
  private readonly resources: Resources;
  private readonly coins: number;

  constructor(rng: RNG, resources: Resources) {
    this.resources = resources;
    this.coins = rng.nextRange(1, 30)
  }

  pickedUp(hero: HeroCharacter): boolean {
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
      name: "Health flask",
      health: this.health
    };
  }

  pickedUp(hero: HeroCharacter): boolean {
    return hero.inventory.add(this);
  };

  same(item: UsableDrop): boolean {
    return item instanceof HealthFlask;
  };

  use(cell: InventoryCell, hero: HeroCharacter) {
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
      name: "Big health flask",
      health: this.health
    };
  }

  pickedUp(hero: HeroCharacter): boolean {
    return hero.inventory.add(this);
  };

  sprite(): PIXI.Sprite | PIXI.AnimatedSprite {
    return this.resources.sprite("flask_big_red.png");
  }

  same(item: UsableDrop): boolean {
    return item instanceof HealthBigFlask;
  };

  use(cell: InventoryCell, hero: HeroCharacter) {
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
      name: this.name.replace(/weapon_/, ''),
      speed: this.speed,
      distance: this.distance,
      damage: this.damage,
    };
  }

  sprite(): PIXI.Sprite {
    return this.resources.sprite(this.name + ".png");
  }

  pickedUp(hero: HeroCharacter): boolean {
    return hero.inventory.add(this);
  }

  same(_item: UsableDrop): boolean {
    return false;
  }

  use(cell: InventoryCell, hero: HeroCharacter): void {
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
  private readonly _sprite_size: number;
  private _sprite: PIXI.Sprite | PIXI.AnimatedSprite | null = null;
  private readonly _title: PIXI.BitmapText;
  private readonly _description: PIXI.BitmapText;

  constructor(options: {
    width?: number,
    height?: number,
  }) {
    super();

    this._width = options.width || 400;
    this._height = options.height || 400;
    this._sprite_size = 128 + (Sizes.uiMargin << 1);

    const background = new PIXI.Graphics()
      .beginFill(Colors.uiBackground, 0.3)
      .drawRect(0, 0, this._width, this._height)
      .endFill()
      .beginFill(Colors.uiNotSelected, 0.3)
      .drawRect(Sizes.uiMargin, Sizes.uiMargin + 32 + Sizes.uiMargin, this._sprite_size, this._sprite_size)
      .endFill();

    this._title = new PIXI.BitmapText("", {font: {name: "alagard", size: 32}});
    this._title.anchor = new PIXI.Point(0.5, 0);
    this._title.position.set(this._width >> 1, Sizes.uiMargin);

    this._description = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this._description.position.set(
      Sizes.uiMargin + this._sprite_size + Sizes.uiMargin,
      Sizes.uiMargin + 32 + Sizes.uiMargin
    );

    super.addChild(background, this._title, this._description);
  }

  set drop(drop: UsableDrop | null) {
    this._sprite?.destroy();
    this._sprite = null;
    this._title.text = "";
    this._description.text = "";

    if (drop) {
      const sprite = this._sprite = drop.sprite();
      super.addChild(sprite);
      sprite.anchor = new PIXI.Point(0.5, 0.5);
      sprite.position.set(
        Sizes.uiMargin + (this._sprite_size >> 1),
        Sizes.uiMargin + (this._sprite_size >> 1) + 32 + Sizes.uiMargin
      );
      const s_w = sprite.width;
      const s_h = sprite.height;
      const max_size = this._sprite_size - Sizes.uiMargin;
      if (s_w > s_h) {
        this._sprite.width = max_size;
        this._sprite.height = (max_size / s_w) * s_h;
      } else {
        this._sprite.height = max_size;
        this._sprite.width = (max_size / s_h) * s_w;
      }

      const info = drop.info();

      this._title.text = info.name;

      const text: string[] = [];
      if (info.health) text.push(`health: ${info.health}`);
      if (info.speed) text.push(`speed: ${info.speed}`);
      if (info.distance) text.push(`distance: ${info.distance}`);
      if (info.damage) text.push(`damage: ${info.damage}`);
      this._description.text = text.join("\n");
    }
  }
}