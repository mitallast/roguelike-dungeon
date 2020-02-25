import {TileRegistry} from "./tilemap";
import {DungeonLevel} from "./dungeon.level";
import {Monster, MonsterState, MovingMonsterWrapper} from "./monster";
import {View} from "./view";
// @ts-ignore
import * as PIXI from "pixi.js";

const TILE_SIZE = 16;

export const tinyMonsterNames = [
  "tiny_zombie",
  "goblin",
  "imp",
  "skeleton",
  "muddy",
  "swampy",
  "zombie",
  "ice_zombie",
];

export class TinyMonster implements Monster, View {
  private readonly level: DungeonLevel;
  private readonly registry: TileRegistry;
  private readonly wrapper: MovingMonsterWrapper;

  x: number;
  y: number;
  new_x: number;
  new_y: number;
  is_left: boolean = false;
  state: MonsterState;

  private readonly name: string;
  private readonly healthMax: number = 10;
  private health: number = this.healthMax;
  private readonly damage: number = 1.5;
  private readonly luck: number = 0.3;
  private readonly speed: number = 0.2;

  private duration: number;
  sprite: PIXI.AnimatedSprite;
  readonly container: PIXI.Container;

  constructor(level: DungeonLevel, x: number, y: number, name: string) {
    this.level = level;
    this.registry = level.scene.registry;
    this.wrapper = new MovingMonsterWrapper(this);
    this.name = name;
    this.container = new PIXI.Container();
    this.container.zIndex = 100; // @todo maintain zIndex
    this.level.container.addChild(this.container);
    this.setAnimation(MonsterState.Idle);
    this.resetPosition(x, y);
  }

  update(delta: number): void {
    this.duration += delta;
    this.animate();
  }

  destroy(): void {
    this.level.monsterMap[this.y][this.x] = null;
    this.level.monsterMap[this.new_y][this.new_x] = null;
    this.level.monsters = this.level.monsters.filter(s => s !== this);

    this.sprite?.destroy();
    this.container.destroy();
  }

  private setSprite(postfix: string): void {
    this.sprite?.destroy();
    this.sprite = this.registry.animated(this.name + postfix);
    this.sprite.loop = false;
    this.sprite.animationSpeed = this.speed;
    this.sprite.anchor.set(0, 1);
    this.sprite.position.y = TILE_SIZE - 2;
    this.sprite.zIndex = 1;
    this.sprite.play();
    this.container.addChild(this.sprite);
    this.duration = 0;

    if (this.is_left) {
      this.sprite.position.x = this.sprite.width;
      this.sprite.scale.x = -1;
    } else {
      this.sprite.position.x = 0;
      this.sprite.scale.x = 1;
    }
  }

  setAnimation(state: MonsterState) {
    switch (state) {
      case MonsterState.Idle:
        this.state = state;
        this.setSprite('_idle');
        break;
      case MonsterState.Run:
        this.state = state;
        this.setSprite('_run');
        break;
    }
  };

  animate() {
    switch (this.state) {
      case MonsterState.Idle:
        if (!this.sprite.playing) {
          if (!this.action()) {
            this.setAnimation(MonsterState.Idle);
          }
        }
        break;
      case MonsterState.Run:
        const delta = this.duration / (this.sprite.totalFrames / this.speed);
        const t_x = this.x * TILE_SIZE + TILE_SIZE * (this.new_x - this.x) * delta;
        const t_y = this.y * TILE_SIZE + TILE_SIZE * (this.new_y - this.y) * delta;
        this.container.position.set(t_x, t_y);

        if (!this.sprite.playing) {
          this.resetPosition(this.new_x, this.new_y);
          if (!this.action()) {
            this.setAnimation(MonsterState.Idle);
          }
        }
        break;
    }
  };

  action(): boolean {
    // search hero near
    const max_distance = 3;
    const scan_x_min = Math.max(0, this.x - max_distance);
    const scan_y_min = Math.max(0, this.y - max_distance);
    const scan_x_max = Math.min(this.level.width, this.x + max_distance);
    const scan_y_max = Math.min(this.level.height, this.y + max_distance);

    const is_hero_near = !this.level.hero.dead
      && this.level.hero.x >= scan_x_min && this.level.hero.x <= scan_x_max
      && this.level.hero.y >= scan_y_min && this.level.hero.y <= scan_y_max;

    if (is_hero_near) {
      const dist_x = Math.abs(this.x - this.level.hero.x);
      const dist_y = Math.abs(this.y - this.level.hero.y);

      if (dist_x > 1) {
        const move_x = Math.max(-1, Math.min(1, this.level.hero.x - this.x));
        if (this.move(move_x, 0)) {
          console.log("move to hero x");
          return true;
        }
      }
      if (dist_y > 0) {
        const move_y = Math.max(-1, Math.min(1, this.level.hero.y - this.y));
        if (this.move(0, move_y)) {
          console.log("move to hero y");
          return true;
        }
      }

      if (dist_x <= 1 && dist_y <= 1 && Math.random() < this.luck) {
        this.level.hero.hitDamage(this.damage, this.name);
        return true;
      }
    }

    // random move ?
    const random_move_percent = 0.1;
    if (Math.random() < random_move_percent) {
      const move_x = Math.floor(Math.random() * 3) - 1;
      const move_y = Math.floor(Math.random() * 3) - 1;
      if (this.move(move_x, move_y)) {
        return true;
      }
    }

    return false;
  }

  move(d_x: number, d_y: number) {
    this.is_left = d_x < 0;
    if (this.state === MonsterState.Idle) {
      const new_x = this.x + d_x;
      const new_y = this.y + d_y;

      // check is floor exists
      if (!this.level.floorMap[new_y][new_x]) return false;

      // check is no monster
      if (this.level.monsterMap[new_y][new_x]) return false;

      this.markNewPosition(new_x, new_y);
      this.setAnimation(MonsterState.Run);
      return true;
    }
    return false;
  };

  markNewPosition(x: number, y: number) {
    this.level.monsterMap[y][x] = this.wrapper;
    this.new_x = x;
    this.new_y = y;
  }

  resetPosition(x: number, y: number) {
    if (this.x >= 0 && this.y >= 0) {
      this.level.monsterMap[this.y][this.x] = null;
    }
    this.x = x;
    this.y = y;
    this.new_x = x;
    this.new_y = y;
    this.level.monsterMap[y][x] = this;
    this.container.position.set(x * TILE_SIZE, y * TILE_SIZE);
  };

  hitDamage(damage: number, name: string) {
    this.level.log.push(`${this.name} damaged ${damage} by ${name}`);
    this.health = Math.max(0, this.health - damage);
    if (this.health <= 0) {
      this.level.log.push(`${this.name} killed by ${name}`);
      this.destroy();
      if (Math.random() < this.luck) {
        this.level.randomDrop(this.x, this.y);
      }
    }
  };
}