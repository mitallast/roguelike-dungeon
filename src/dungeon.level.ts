import {TinyMonster} from "./tiny.monster";
import {Coins, Drop, DropView, HealthBigFlask, HealthFlask, WeaponConfig} from "./drop";
import {HeroState, HeroView} from "./hero";
import {Monster} from "./monster";
import {BossMonster} from "./boss.monster";
import {DungeonLightView} from "./dungeon.light";
import {View} from "./view";
// @ts-ignore
import * as PIXI from 'pixi.js';
import {SceneController} from "./scene";

const TILE_SIZE = 16;

export interface DungeonZIndexScheme {
  readonly monster: number
  readonly drop: number
  readonly floor: number
  readonly wallBack: number
  readonly wallFront: number
}

export const DungeonZIndexes: DungeonZIndexScheme = {
  monster: 60,
  drop: 50,
  floor: 1,
  wallBack: 2,
  wallFront: 100,
};

export class DungeonLevel {
  readonly controller: SceneController;

  readonly level: number;

  readonly width: number;
  readonly height: number;

  readonly hero: HeroView;
  boss: BossMonster;
  monsters: TinyMonster[] = [];

  private readonly cells: DungeonCellView[][];
  readonly monsterMap: Monster[][];

  log: string[] = [];

  readonly container: PIXI.Container;
  readonly light: DungeonLightView;
  readonly lighting: PIXI.Sprite;
  readonly scale: number = 2;

  private stop: boolean = false;

  constructor(controller: SceneController, heroState: HeroState, level: number, width: number, height: number) {
    this.controller = controller;
    this.level = level;
    this.width = width;
    this.height = height;

    this.cells = this.createBuffer();
    for (let y = 0; y < this.width; y++) {
      for (let x = 0; x < this.height; x++) {
        this.cells[y][x] = new DungeonCellView(this, x, y);
      }
    }

    this.monsterMap = this.createBuffer();

    this.container = new PIXI.Container();
    this.container.zIndex = 0;
    this.container.scale.set(this.scale, this.scale);

    this.hero = new HeroView(this, heroState);

    this.light = new DungeonLightView(this);
    this.light.layer.zIndex = 1;
    this.light.container.scale.set(this.scale, this.scale);

    this.lighting = new PIXI.Sprite(this.light.layer.getRenderTexture());
    this.lighting.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    this.lighting.zIndex = 2;
  }

  private createBuffer<T>(): T[][] {
    const rows: T[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: T[] = [];
      rows.push(row);
      for (let x = 0; x < this.width; x++) {
        row.push(null);
      }
    }
    return rows;
  };

  cell(x: number, y: number): DungeonCellView {
    return this.cells[y][x];
  }

  exit() {
    this.stop = true;
    this.controller.generateDungeon({
      level: this.level + 1,
      hero: this.hero.heroState,
    });
  };

  dead() {
    this.stop = true;
    this.controller.dead();
  }

  update(delta: number): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x]?.update(delta);
      }
    }

    this.hero.update(delta);
    if (this.stop) return;

    this.boss?.update(delta);
    if (this.stop) return;

    for (let i = 0; i < this.monsters.length; i++) {
      this.monsters[i].update(delta);
      if (this.stop) return;
    }

    this.light.update(delta);

    const t_x = this.hero.container.position.x;
    const t_y = this.hero.container.position.y;
    const c_w = this.controller.app.screen.width;
    const c_h = this.controller.app.screen.height;
    const p_x = (c_w >> 1) - t_x * this.scale;
    const p_y = (c_h >> 1) - t_y * this.scale;

    this.container.position.set(p_x, p_y);
    this.light.container.position.set(p_x, p_y);
  }

  destroy(): void {
    this.lighting.destroy();
    this.light.destroy();
    this.hero.destroy();
    this.boss?.destroy();
    this.monsters.forEach(m => m.destroy());

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x].destroy();
      }
    }
  }
}

export class DungeonCellView implements View {
  private readonly dungeon: DungeonLevel;
  readonly x: number;
  readonly y: number;
  private floorSprite: PIXI.Sprite | PIXI.AnimatedSprite = null;
  private wallSprite: PIXI.Sprite | PIXI.AnimatedSprite = null;
  private dropView: DropView = null;

  constructor(dungeon: DungeonLevel, x: number, y: number) {
    this.dungeon = dungeon;
    this.x = x;
    this.y = y;
  }

  set floor(name: string) {
    this.floorSprite?.destroy();
    this.floorSprite = null;
    if (name) {
      this.floorSprite = this.sprite(name, DungeonZIndexes.floor);
    }
  }

  get floor(): string {
    return this.floorSprite?.name;
  }

  get hasFloor(): boolean {
    return !!this.floorSprite;
  }

  set wallBack(name: string) {
    this.wallSprite?.destroy();
    this.wallSprite = null;
    if (name) {
      this.wallSprite = this.sprite(name, DungeonZIndexes.wallBack);
    }
  }

  set wallFront(name: string) {
    this.wallSprite?.destroy();
    this.wallSprite = null;
    if (name) {
      this.wallSprite = this.sprite(name, DungeonZIndexes.wallFront);
    }
  }

  get wall(): string {
    return this.wallSprite?.name;
  }

  set wall(name: string) {
    this.wallFront = name;
  }

  set zIndex(zIndex: number) {
    if (this.wallSprite) {
      this.wallSprite.zIndex = zIndex;
    }
  }

  get hasWall(): boolean {
    return !!this.wallSprite;
  }

  set drop(drop: Drop) {
    this.dropView?.destroy();
    this.dropView = null;
    if (drop) {
      this.dropView = drop.dropView(this.dungeon, this.x, this.y);
    }
  }

  pickedUp(hero: HeroView): void {
    if (this.dropView) {
      this.dropView.pickedUp(hero);
    }
  }

  get hasDrop(): boolean {
    return !!this.dropView;
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

  private sprite(name: string, zIndex: number): PIXI.Sprite | PIXI.AnimatedSprite {
    let sprite: PIXI.Sprite | PIXI.AnimatedSprite;
    if (!name.endsWith('.png')) {
      const anim = sprite = this.dungeon.controller.resources.animated(name);
      anim.animationSpeed = 0.2;
    } else {
      sprite = this.dungeon.controller.resources.sprite(name);
    }
    sprite.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
    sprite.zIndex = zIndex;
    this.dungeon.container.addChild(sprite);
    return sprite;
  }

  destroy(): void {
    this.floorSprite?.destroy();
    this.wallSprite?.destroy();
    this.dropView?.destroy();
  }

  update(delta: number): void {
    if (this.floorSprite instanceof PIXI.AnimatedSprite) {
      this.floorSprite.play();
    }
    if (this.wallSprite instanceof PIXI.AnimatedSprite) {
      this.wallSprite.play();
    }
    this.dropView?.update(delta);
  }

  get isLadder(): boolean {
    return this.floor === 'floor_ladder.png';
  }
}

export class DungeonTitleView implements View {
  readonly container: PIXI.Container;
  private readonly title: PIXI.BitmapText;

  constructor() {
    this.container = new PIXI.Container();
    this.title = new PIXI.BitmapText("", {font: {name: 'alagard', size: 32}});
    this.title.anchor = 0.5;
    this.title.position.set(0, 16);
    this.container.addChild(this.title);
  }

  setLevel(level: number) {
    this.title.text = `LEVEL ${level}`;
  }

  destroy(): void {
    this.title.destroy();
    this.container.destroy();
  }

  update(delta: number): void {
  }
}