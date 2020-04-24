import {Coins, Drop, HealthBigFlask, HealthFlask, WeaponConfig} from "./drop";
import {Hero} from "./hero";
import {CharacterAI} from "./character";
import {DungeonLight} from "./dungeon.light";
import {SceneController} from "./scene";
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export interface DungeonZIndexScheme {
  readonly character: number
  readonly hero: number
  readonly drop: number
  readonly floor: number
  readonly wallBack: number
  readonly wall: number
  readonly row: number
}

export const DungeonZIndexes: DungeonZIndexScheme = {
  character: 60,
  hero: 70,
  drop: 50,
  floor: 1,
  wallBack: 2,
  wall: 100,
  row: 256
};

export class DungeonMap {
  readonly controller: SceneController;
  readonly ticker: PIXI.Ticker;

  readonly level: number;

  readonly width: number;
  readonly height: number;

  private readonly cells: MapCell[][];

  readonly container: PIXI.Container;
  readonly light: DungeonLight;
  readonly lighting: PIXI.Sprite;
  readonly scale: number = 2;

  constructor(controller: SceneController, ticker: PIXI.Ticker, level: number, width: number, height: number) {
    this.controller = controller;
    this.ticker = ticker;
    this.level = level;
    this.width = width;
    this.height = height;

    this.cells = [];
    for (let y = 0; y < this.width; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.height; x++) {
        this.cells[y][x] = new MapCell(this, x, y);
      }
    }

    this.container = new PIXI.Container();
    this.container.zIndex = 0;
    this.container.sortableChildren = true;
    this.container.scale.set(this.scale, this.scale);

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
        this.cells[y][x].destroy();
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
    return this.cells[y][x];
  }

  remove(x: number, y: number, character: CharacterAI): void {
    for (let dx = 0; dx < character.width; dx++) {
      for (let dy = 0; dy < character.height; dy++) {
        const cell = this.cell(x + dx, y - dy);
        const c = cell.character;
        if (c && (c === character)) {
          cell.character = null;
        }
      }
    }
  }

  set(x: number, y: number, character: CharacterAI): void {
    for (let dx = 0; dx < character.width; dx++) {
      for (let dy = 0; dy < character.height; dy++) {
        this.cell(x + dx, y - dy).character = character;
      }
    }
  }

  available(x: number, y: number, character: CharacterAI): boolean {
    for (let dx = 0; dx < character.width; dx++) {
      for (let dy = 0; dy < character.height; dy++) {
        // check is floor exists
        if (!this.cell(x + dx, y - dy).hasFloor) {
          return false;
        }
        // check is no monster
        const m = this.cell(x + dx, y - dy).character;
        if (m && m !== character) {
          return false;
        }
      }
    }
    return true;
  }

  camera(x: number, y: number): void {
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;
    const p_x = (c_w >> 1) - x * this.scale;
    const p_y = (c_h >> 1) - y * this.scale;

    this.container.position.set(p_x, p_y);
    this.light.container.position.set(p_x, p_y);
  }
}

export class MapCell {
  private readonly dungeon: DungeonMap;
  readonly x: number;
  readonly y: number;
  private _floor: PIXI.Sprite | PIXI.AnimatedSprite | null = null;
  private _wall: PIXI.Sprite | PIXI.AnimatedSprite | null = null;
  private _dropSprite: PIXI.Sprite | PIXI.AnimatedSprite | null = null;
  private _drop: Drop | null = null;
  private _character: CharacterAI | null = null;

  constructor(dungeon: DungeonMap, x: number, y: number) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
  }

  destroy(): void {
    this._floor?.destroy();
    this._floor = null;
    this._wall?.destroy();
    this._wall = null;
    this._dropSprite?.destroy();
    this._dropSprite = null;
    this._character?.destroy();
    this._character = null;
  }

  set floor(name: string | null) {
    this._floor?.destroy();
    this._floor = null;
    if (name) {
      this._floor = this.sprite(name);
      this._floor.zIndex = DungeonZIndexes.floor;
    }
  }

  get floor(): string | null {
    return this._floor?.name || null;
  }

  get hasFloor(): boolean {
    return !!this._floor;
  }

  get wall(): string | null {
    return this._wall?.name || null;
  }

  set wall(name: string | null) {
    this._wall?.destroy();
    this._wall = null;
    if (name) {
      this._wall = this.sprite(name);
      this._wall.zIndex = this.zIndex + DungeonZIndexes.wall;
    }
  }

  private get zIndex(): number {
    return this.y * DungeonZIndexes.row;
  }

  get hasWall(): boolean {
    return !!this._wall;
  }

  set drop(drop: Drop | null) {
    this._dropSprite?.destroy();
    this._dropSprite = null;
    this._drop = null;
    if (drop) {
      this._drop = drop;
      this._dropSprite = drop.sprite();
      this._dropSprite.position.set(
        this.x * TILE_SIZE + (TILE_SIZE >> 1) - (this._dropSprite.width >> 1),
        this.y * TILE_SIZE + TILE_SIZE - 2
      );
      this._dropSprite.anchor.set(0, 1);
      this._dropSprite.zIndex = this.zIndex + DungeonZIndexes.drop;
      if (this._dropSprite instanceof PIXI.AnimatedSprite) {
        this._dropSprite.animationSpeed = 0.2;
        this._dropSprite.play();
      }
      this.dungeon.container.addChild(this._dropSprite);
    }
  }

  pickedUp(hero: Hero): boolean {
    if (this._drop?.pickedUp(hero)) {
      this._dropSprite?.destroy();
      this._dropSprite = null;
      this._drop = null;
      return true;
    }
    return false;
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

    const rng = this.dungeon.controller.rng;
    const resources = this.dungeon.controller.resources;

    const weight_coins = 20;
    const weight_health_flask = 10;
    const weight_health_big_flask = 10;
    const weight_weapon = 10;
    const sum = weight_coins + weight_health_flask + weight_health_big_flask + weight_weapon;

    let remaining_distance = rng.nextFloat() * sum;
    if ((remaining_distance -= weight_weapon) <= 0) {
      const available = WeaponConfig.configs.filter(c => c.level <= this.dungeon.level);
      this.drop = rng.choice(available).create(this.dungeon.controller.resources);
    } else if ((remaining_distance -= weight_health_big_flask) <= 0) {
      this.drop = new HealthBigFlask(resources);
    } else if ((remaining_distance -= weight_health_flask) <= 0) {
      this.drop = new HealthFlask(resources);
    } else if ((remaining_distance - weight_coins) <= 0) {
      this.drop = new Coins(rng, resources);
    }
    return this.hasDrop;
  };

  get character(): CharacterAI | null {
    return this._character;
  }

  set character(character: CharacterAI | null) {
    this._character = character;
  }

  get hasCharacter(): boolean {
    return this._character != null;
  }

  private sprite(name: string): PIXI.Sprite | PIXI.AnimatedSprite {
    let sprite: PIXI.Sprite | PIXI.AnimatedSprite;
    if (!name.endsWith('.png')) {
      const anim = sprite = this.dungeon.controller.resources.animated(name);
      anim.animationSpeed = 0.2;
      anim.play();
    } else {
      sprite = this.dungeon.controller.resources.sprite(name);
    }
    sprite.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
    this.dungeon.container.addChild(sprite);
    return sprite;
  }

  get isLadder(): boolean {
    return this.floor === 'floor_ladder.png';
  }
}

export class DungeonTitle extends PIXI.Container {
  private readonly title: PIXI.BitmapText;

  constructor() {
    super();
    this.title = new PIXI.BitmapText("", {font: {name: 'alagard', size: 32}});
    this.title.anchor = 0.5;
    this.title.position.set(0, 16);
    this.addChild(this.title);
  }

  set level(level: number) {
    this.title.text = `LEVEL ${level}`;
  }

  destroy(): void {
    this.title.destroy();
  }
}