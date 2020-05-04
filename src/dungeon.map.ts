import {Coins, Drop, HealthBigFlask, HealthFlask, Weapon} from "./drop";
import {Hero, HeroAI} from "./hero";
import {DungeonLight} from "./dungeon.light";
import {SceneController} from "./scene";
import {RNG} from "./rng";
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export interface DungeonZIndexScheme {
  readonly character: number;
  readonly hero: number;
  readonly drop: number;
  readonly static: number;
  readonly floor: number;
  readonly wall: number;
  readonly row: number;
}

export const DungeonZIndexes: DungeonZIndexScheme = {
  character: 60,
  hero: 70,
  drop: 50,
  static: 40,
  floor: 1,
  wall: 100,
  row: 256
};

export class DungeonMap {
  readonly controller: SceneController;
  readonly ticker: PIXI.Ticker;
  readonly rng: RNG;

  readonly seed: number;
  readonly level: number;

  readonly width: number;
  readonly height: number;

  private readonly _cells: MapCell[][];

  readonly container: PIXI.Container;
  readonly floorContainer: PIXI.Container;
  readonly light: DungeonLight;
  readonly lighting: PIXI.Sprite;
  readonly scale: number = 2;

  constructor(controller: SceneController, ticker: PIXI.Ticker, rng: RNG, seed: number, level: number, width: number, height: number) {
    this.controller = controller;
    this.ticker = ticker;
    this.rng = rng;
    this.seed = seed;
    this.level = level;
    this.width = width;
    this.height = height;

    this._cells = [];
    for (let y = 0; y < this.width; y++) {
      this._cells[y] = [];
      for (let x = 0; x < this.height; x++) {
        this._cells[y][x] = new MapCell(this, x, y);
      }
    }

    this.container = new PIXI.Container();
    this.container.zIndex = 0;
    this.container.sortableChildren = true;
    this.container.scale.set(this.scale, this.scale);

    this.floorContainer = new PIXI.Container();
    this.floorContainer.zIndex = DungeonZIndexes.floor;
    this.floorContainer.sortableChildren = false;
    this.floorContainer.cacheAsBitmap = true;
    this.container.addChild(this.floorContainer);

    this.light = new DungeonLight(this);
    this.light.layer.zIndex = 1;
    this.light.container.scale.set(this.scale, this.scale);

    this.lighting = new PIXI.Sprite(this.light.layer.getRenderTexture());
    this.lighting.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    this.lighting.zIndex = 2;
  }

  destroy(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this._cells[y][x].destroy();
      }
    }
    this.lighting.destroy();
    this.light.destroy();
    this.container.destroy({children: true});
  }

  log(message: string): void {
    console.info(message);
  }

  cell(x: number, y: number): MapCell {
    return this._cells[y][x];
  }

  remove(x: number, y: number, object: DungeonObject): void {
    for (let dx = 0; dx < object.width; dx++) {
      for (let dy = 0; dy < object.height; dy++) {
        const cell = this.cell(x + dx, y - dy);
        const c = cell.object;
        if (c && (c === object)) {
          cell.object = null;
        }
      }
    }
  }

  set(x: number, y: number, object: DungeonObject): void {
    for (let dx = 0; dx < object.width; dx++) {
      for (let dy = 0; dy < object.height; dy++) {
        this.cell(x + dx, y - dy).object = object;
      }
    }
  }

  available(x: number, y: number, object: DungeonObject): boolean {
    for (let dx = 0; dx < object.width; dx++) {
      for (let dy = 0; dy < object.height; dy++) {
        const cell = this.cell(x + dx, y - dy);
        if (!cell.hasFloor || cell.collide(object)) {
          return false;
        }
      }
    }
    return true;
  }

  camera(x: number, y: number): void {
    const screen = this.controller.app.screen;
    const posX = (screen.width >> 1) - x * this.scale;
    const posY = (screen.height >> 1) - y * this.scale;
    this.container.position.set(posX, posY);
    this.light.container.position.set(posX, posY);
  }

  sprite(x: number, y: number, name: string): PIXI.Sprite | PIXI.AnimatedSprite {
    const sprite = this.controller.resources.sprite(name);
    sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
    this.container.addChild(sprite);
    return sprite;
  }

  animated(x: number, y: number, name: string): PIXI.AnimatedSprite {
    const animated = this.controller.resources.animated(name);
    animated.position.set(x * TILE_SIZE, y * TILE_SIZE);
    animated.play();
    this.container.addChild(animated);
    return animated;
  }
}

export class MapCell {
  private readonly _dungeon: DungeonMap;
  readonly x: number;
  readonly y: number;
  private _floor: DungeonFloor | null = null;
  private _wall: DungeonWall | null = null;
  private _drop: DungeonDrop | null = null;
  private _object: DungeonObject | null = null;

  constructor(dungeon: DungeonMap, x: number, y: number) {
    this._dungeon = dungeon;
    this.x = x;
    this.y = y;
  }

  destroy(): void {
    this._floor?.destroy();
    this._floor = null;
    this._wall?.destroy();
    this._wall = null;
    this._drop?.destroy();
    this._drop = null;
    this._object?.destroy();
    this._object = null;
  }

  set floorName(name: string | null) {
    this._floor?.destroy();
    this._floor = null;
    if (name) {
      this._floor = new DefaultDungeonFloor(this._dungeon, this.x, this.y, name);
    }
  }

  get floorName(): string | null {
    return this._floor?.name || null;
  }

  get floor(): DungeonFloor | null {
    return this._floor;
  }

  get hasFloor(): boolean {
    return !!this._floor;
  }

  get wallName(): string | null {
    return this._wall?.name || null;
  }

  set wallName(name: string | null) {
    this._wall?.destroy();
    this._wall = null;
    if (name) {
      this._wall = new DungeonWall(this._dungeon, this.x, this.y, name);
    }
  }

  get wall(): DungeonWall | null {
    return this._wall;
  }

  set dropItem(drop: Drop | null) {
    this._drop?.destroy();
    this._drop = null;
    if (drop) {
      this._drop = new DungeonDrop(this._dungeon, this.x, this.y, drop);
    }
  }

  get drop(): DungeonDrop | null {
    return this._drop;
  }

  get hasDrop(): boolean {
    return !!this._drop;
  }

  randomDrop(): boolean {
    // linear scan - weighted random selection
    // def weighted_random(weights):
    //     remaining_distance = random() * sum(weights)
    //     for i, weight in enumerate(weights):
    //         remaining_distance -= weight
    //         if remaining_distance < 0:
    //             return i

    const rng = this._dungeon.rng;

    const weightCoins = 20;
    const weightHealthFlask = 10;
    const weightHealthBigFlask = 10;
    const weightWeapon = 10;
    const sum = weightCoins + weightHealthFlask + weightHealthBigFlask + weightWeapon;

    let remainingDistance = rng.float() * sum;
    if ((remainingDistance -= weightWeapon) <= 0) {
      this.dropItem = Weapon.create(rng, this._dungeon.level);
    } else if ((remainingDistance -= weightHealthBigFlask) <= 0) {
      this.dropItem = new HealthBigFlask();
    } else if ((remainingDistance -= weightHealthFlask) <= 0) {
      this.dropItem = new HealthFlask();
    } else if ((remainingDistance - weightCoins) <= 0) {
      this.dropItem = new Coins(rng);
    }
    return this.hasDrop;
  }

  get object(): DungeonObject | null {
    return this._object;
  }

  set object(object: DungeonObject | null) {
    if (object && !(this._object === null || this._object === object)) {
      console.log("current char", this._object);
      console.log("new char", object);
      throw "error while set char to cell";
    }
    this._object = object;
  }

  get hasObject(): boolean {
    return this._object != null;
  }

  ladder(): void {
    this._floor?.destroy();
    this._floor = new DungeonLadder(this._dungeon, this.x, this.y);
  }

  get interacting(): boolean {
    return this._floor?.interacting ||
      this._wall?.interacting ||
      this._drop?.interacting ||
      this._object?.interacting || false;
  }

  interact(hero: HeroAI): void {
    if (this._object && this._object.interacting) {
      this._object.interact(hero);
    } else if (this._drop && this._drop.interacting) {
      this._drop.interact(hero);
    } else if (this._wall && this._wall.interacting) {
      this._wall.interact(hero);
    } else if (this._floor && this._floor.interacting) {
      this._floor.interact(hero);
    }
  }

  collide(object: DungeonObject): boolean {
    return (this._object && this._object.collide(object)) ||
      (this._wall && this._wall.collide(object)) ||
      false;
  }
}

export interface DungeonObject {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  readonly static: boolean;
  readonly interacting: boolean;

  interact(hero: HeroAI): void;
  collide(object: DungeonObject): boolean;

  destroy(): void;
}

export abstract class DungeonFloor implements DungeonObject {
  readonly dungeon: DungeonMap;

  readonly x: number;
  readonly y: number;
  readonly height: number = 1;
  readonly width: number = 1;

  readonly static: boolean = true;
  abstract readonly interacting: boolean;

  readonly name: string;
  protected readonly sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  protected constructor(dungeon: DungeonMap, x: number, y: number, name: string) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this.name = name;
    this.sprite = this.dungeon.controller.resources.sprite(name);
    this.sprite.zIndex = DungeonZIndexes.floor;
    this.sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
    if (this.sprite instanceof PIXI.AnimatedSprite) {
      this.dungeon.container.addChild(this.sprite);
    } else {
      this.dungeon.floorContainer.addChild(this.sprite);
    }
  }

  abstract interact(hero: HeroAI): void;

  collide(): boolean {
    return false;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

export class DefaultDungeonFloor extends DungeonFloor {
  readonly interacting: boolean = false;

  constructor(dungeon: DungeonMap, x: number, y: number, name: string) {
    super(dungeon, x, y, name);
  }

  interact(): void {
  }
}

export class DungeonLadder extends DungeonFloor {
  readonly interacting: boolean = true;

  constructor(dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, x, y, 'floor_ladder.png');
  }

  interact(hero: HeroAI): void {
    this.dungeon.controller.updateHero(hero.character, this.dungeon.level + 1);
  }
}

export class DungeonWall implements DungeonObject {
  readonly dungeon: DungeonMap;

  readonly x: number;
  readonly y: number;
  readonly height: number = 1;
  readonly width: number = 1;

  readonly static: boolean = true;
  readonly interacting: boolean = false;

  readonly name: string;
  protected readonly sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(dungeon: DungeonMap, x: number, y: number, name: string) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this.name = name;
    this.sprite = dungeon.sprite(x, y, name);
    this.sprite.zIndex = DungeonZIndexes.wall + y * DungeonZIndexes.row;
  }

  interact(_: HeroAI): void {
  }

  collide(_: DungeonObject): boolean {
    return !this.dungeon.cell(this.x, this.y).hasFloor;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

export class DungeonDrop implements DungeonObject {
  readonly dungeon: DungeonMap;
  readonly drop: Drop;

  readonly x: number;
  readonly y: number;
  readonly height: number = 1;
  readonly width: number = 1;

  readonly static: boolean = true;
  readonly interacting: boolean = false;

  private readonly _sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(dungeon: DungeonMap, x: number, y: number, drop: Drop) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
    this.drop = drop;
    this._sprite = dungeon.sprite(x, y, drop.spriteName);
    this._sprite.zIndex = DungeonZIndexes.drop + y * DungeonZIndexes.row;
    this._sprite.x += (TILE_SIZE >> 1);
    this._sprite.y += TILE_SIZE - 2;
    this._sprite.anchor.set(0.5, 1);
  }

  pickedUp(hero: Hero): boolean {
    if (this.drop.pickedUp(hero)) {
      this.dungeon.cell(this.x, this.y).dropItem = null;
      return true;
    } else {
      return false;
    }
  }

  interact(_: HeroAI): void {
  }

  collide(_: DungeonObject): boolean {
    return false;
  }

  destroy(): void {
    this._sprite.destroy();
  }
}

export class DungeonTitle extends PIXI.Container {
  private readonly _title: PIXI.BitmapText;

  constructor() {
    super();
    this._title = new PIXI.BitmapText("", {font: {name: 'alagard', size: 32}});
    this._title.anchor = 0.5;
    this._title.position.set(0, 16);
    this.addChild(this._title);
  }

  set level(level: number) {
    this._title.text = `LEVEL ${level}`;
  }

  destroy(): void {
    this._title.destroy();
  }
}