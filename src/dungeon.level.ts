import {TinyMonster} from "./tiny.monster";
import {Coins, Drop, DropView, HealthBigFlask, HealthFlask, WeaponConfig} from "./drop";
import {HeroView, HeroState} from "./hero";
import {Monster} from "./monster";
import {BossMonster} from "./boss.monster";
import {DungeonScene} from "./dungeon";
import {DungeonLightView} from "./dungeon.light";
import {Rect} from "./geometry";
import {View} from "./view";
// @ts-ignore
import * as PIXI from 'pixi.js';

const TILE_SIZE = 16;

export class DungeonLevel {
  readonly scene: DungeonScene;

  readonly level: number;

  readonly width: number;
  readonly height: number;

  readonly hero: HeroView;
  boss: BossMonster;
  monsters: TinyMonster[] = [];
  readonly rooms: Rect[] = [];
  readonly corridorsV: Rect[] = [];
  readonly corridorsH: Rect[] = [];

  readonly floorMap: FloorView[][];
  readonly wallMap: WallView[][];
  readonly dropMap: DropView[][];
  readonly monsterMap: Monster[][];

  log: string[] = [];

  readonly container: PIXI.Container;
  readonly light: DungeonLightView;
  readonly lighting: PIXI.Sprite;
  readonly scale: number = 2;

  private stop: boolean = false;

  constructor(scene: DungeonScene, heroState: HeroState, level: number, width: number, height: number) {
    this.scene = scene;
    this.level = level;
    this.width = width;
    this.height = height;

    this.floorMap = this.createBuffer();
    this.wallMap = this.createBuffer();
    this.dropMap = this.createBuffer();
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

  createBuffer<T>(): T[][] {
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

  randomDrop(x: number, y: number): boolean {
    const weight_coins = 20;
    const weight_health_flask = 10;
    const weight_health_big_flask = 10;
    const weight_weapon = 10;

    // linear scan - weighted random selection
    // def weighted_random(weights):
    //     remaining_distance = random() * sum(weights)
    //     for i, weight in enumerate(weights):
    //         remaining_distance -= weight
    //         if remaining_distance < 0:
    //             return i

    const sum = weight_coins + weight_health_flask + weight_health_big_flask + weight_weapon;

    let remaining_distance = this.scene.rng.nextFloat() * sum;

    remaining_distance -= weight_weapon;
    if (remaining_distance <= 0) {
      const available = WeaponConfig.configs.filter(c => c.level <= this.level);
      const drop = this.scene.rng.choice(available).create(this.scene.registry);
      this.setDrop(x, y, drop);
      return true;
    }
    remaining_distance -= weight_health_big_flask;
    if (remaining_distance <= 0) {
      const drop = new HealthBigFlask(this.scene.registry);
      this.setDrop(x, y, drop);
      return true;
    }
    remaining_distance -= weight_health_flask;
    if (remaining_distance <= 0) {
      const drop = new HealthFlask(this.scene.registry);
      this.setDrop(x, y, drop);
      return true;
    }
    remaining_distance -= weight_coins;
    if (remaining_distance <= 0) {
      const drop = new Coins(this.scene.rng, this.scene.registry);
      this.setDrop(x, y, drop);
      return true;
    }
    return false;
  };

  hasDrop(x: number, y: number): boolean {
    return !!this.dropMap[y][x];
  }

  getDrop(x: number, y: number): DropView {
    return this.dropMap[y][x];
  }

  setDrop(x: number, y: number, drop: Drop) {
    this.dropMap[y][x]?.destroy();
    this.dropMap[y][x] = null;
    if (drop) {
      this.dropMap[y][x] = drop.dropView(this, x, y);
    }
  }

  setFloor(x: number, y: number, name: string): void {
    if (this.floorMap[y][x]) {
      this.floorMap[y][x].destroy();
    }

    if (!name.endsWith('.png')) {
      const sprite = this.scene.registry.animated(name);
      sprite.animationSpeed = 0.2;
      sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
      sprite.zIndex = 1;
      this.container.addChild(sprite);
      this.floorMap[y][x] = new FloorView(sprite);
    } else {
      const sprite = this.scene.registry.sprite(name);
      sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
      sprite.zIndex = 1;
      this.container.addChild(sprite);
      this.floorMap[y][x] = new FloorView(sprite);
    }
  }

  setWall(x: number, y: number, name: string): void {
    if (this.wallMap[y][x]) {
      this.wallMap[y][x].destroy();
      this.wallMap[y][x] = null;
    }

    if (name) { // maybe null
      if (!name.endsWith('.png')) {
        const sprite = this.scene.registry.animated(name);
        sprite.animationSpeed = 0.2;
        sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
        sprite.zIndex = 3; // @todo maintain zIndex with monsters
        this.container.addChild(sprite);
        this.wallMap[y][x] = new WallView(sprite);
      } else {
        const sprite = this.scene.registry.sprite(name);
        sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
        sprite.zIndex = 3; // @todo maintain zIndex with monsters
        this.container.addChild(sprite);
        this.wallMap[y][x] = new WallView(sprite);
      }
    }
  }

  exit() {
    this.stop = true;
    this.scene.nextLevel();
  };

  dead() {
    this.stop = true;
    this.scene.dead();
  }

  update(delta: number): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.floorMap[y][x]?.update(delta);
        this.wallMap[y][x]?.update(delta);
        this.dropMap[y][x]?.update(delta);
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

    this.container.sortChildren();

    const t_x = this.hero.container.position.x;
    const t_y = this.hero.container.position.y;
    const c_w = this.scene.controller.app.screen.width;
    const c_h = this.scene.controller.app.screen.height;
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
        this.floorMap[y][x]?.destroy();
        this.wallMap[y][x]?.destroy();
        this.dropMap[y][x]?.destroy();
      }
    }
  }
}

export class FloorView implements View {
  private readonly sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(sprite: PIXI.Sprite | PIXI.AnimatedSprite) {
    this.sprite = sprite;
  }

  get name(): string {
    return this.sprite.name;
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

export class WallView implements View {
  private readonly sprite: PIXI.Sprite | PIXI.AnimatedSprite;

  constructor(sprite: PIXI.Sprite | PIXI.AnimatedSprite) {
    this.sprite = sprite;
  }

  get name(): string {
    return this.sprite.name;
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

export class DungeonTitleView implements View {
  readonly container: PIXI.Container;
  private readonly title: PIXI.Text;

  constructor() {
    this.container = new PIXI.Container();
    const style = new PIXI.TextStyle({
      fontFamily: "silkscreennormal",
      fontSize: 20,
      fill: "white"
    });
    this.title = new PIXI.Text("", style);
    this.title.anchor.set(0.5, 0);
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