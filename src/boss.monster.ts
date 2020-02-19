import {RNG} from "./rng";
import {Tile, TileRegistry} from "./tilemap";
import {Level} from "./level";
import {Monster, MonsterState, MovingMonsterWrapper} from "./monster";
import {Weapon} from "./drop";

export const mossMonsterNames = [
  "ogre",
  "big_zombie",
  "big_demon",
];

export class BossMonster implements Monster {
  private readonly rng: RNG;
  private readonly registry: TileRegistry;
  private readonly level: Level;
  x: number;
  y: number;
  new_x: number;
  new_y: number;
  is_left: boolean;
  readonly name: string;
  readonly healthMax: number;
  health: number;
  private readonly damage: number;
  private readonly luck: number;
  readonly speed: number;
  state: MonsterState;
  tile: Tile;
  frame: number;
  start: number;
  weapon: Weapon;
  private readonly wrapper: MovingMonsterWrapper;

  constructor(rng: RNG, registry: TileRegistry, level: Level, x: number, y: number, name: string, time: number) {
    this.rng = rng;
    this.registry = registry;
    this.level = level;
    this.x = x;
    this.y = y;
    this.new_x = x;
    this.new_y = y;
    this.is_left = false;
    this.name = name;
    this.healthMax = 50 + Math.floor(level.level * 10);
    this.health = this.healthMax;
    this.damage = 7;
    this.luck = 0.5;
    this.speed = 100;
    this.wrapper = new MovingMonsterWrapper(this);
    this.setAnimation(MonsterState.Idle, time);
  }

  setAnimation(state: MonsterState, time: number) {
    switch (state) {
      case MonsterState.Idle:
        this.state = state;
        this.tile = this.registry.get(this.name + "_idle_anim");
        this.frame = 0;
        this.start = time;
        break;
      case MonsterState.Run:
        this.state = state;
        this.tile = this.registry.get(this.name + "_run_anim");
        this.frame = 0;
        this.start = time;
        break;
    }
  };

  animate(time: number) {
    this.frame = Math.floor((time - this.start) / this.speed);
    if (this.frame >= this.tile.numOfFrames) {
      if (this.state === MonsterState.Run) {
        // console.log("finish run animation");
        // clear prev
        this.level.monsters[this.y][this.x] = null;
        this.level.monsters[this.y][this.x + 1] = null;
        this.level.monsters[this.y - 1][this.x] = null;
        this.level.monsters[this.y - 1][this.x + 1] = null;

        // mark new
        this.level.monsters[this.new_y][this.new_x] = this;
        this.level.monsters[this.new_y][this.new_x + 1] = this.wrapper;
        this.level.monsters[this.new_y - 1][this.new_x] = this.wrapper;
        this.level.monsters[this.new_y - 1][this.new_x + 1] = this.wrapper;

        this.x = this.new_x;
        this.y = this.new_y;
      }

      this.setAnimation(MonsterState.Idle, time);

      // search hero near
      const max_distance = 5;
      const scan_x_min = Math.max(0, this.x - max_distance);
      const scan_y_min = Math.max(0, this.y - max_distance);
      const scan_x_max = Math.min(this.level.w, this.x + max_distance);
      const scan_y_max = Math.min(this.level.h, this.y + max_distance);

      const is_hero_near = !this.level.hero.dead
        && this.level.hero.x >= scan_x_min && this.level.hero.x <= scan_x_max
        && this.level.hero.y >= scan_y_min && this.level.hero.y <= scan_y_max;

      // console.log("hero is near", scan_x_min, scan_x_max, scan_y_min, scan_y_max);

      if (is_hero_near) {
        const dist_x = Math.abs(this.x - this.level.hero.x);
        const dist_y = Math.abs(this.y - this.level.hero.y);

        if (dist_x > 1) {
          const move_x = Math.max(-1, Math.min(1, this.level.hero.x - this.x));
          if (this.move(move_x, 0, time)) {
            console.log("move to hero x");
            return;
          }
        }
        if (dist_y > 0) {
          const move_y = Math.max(-1, Math.min(1, this.level.hero.y - this.y));
          if (this.move(0, move_y, time)) {
            console.log("move to hero y");
            return;
          }
        }

        if (dist_x <= 1 && dist_y <= 1 && this.rng.nextFloat() < this.luck) {
          this.level.hero.hitDamage(this.damage, this.name, time);
          return;
        }
      }

      // random move ?
      const random_move_percent = 0.5;
      if (this.rng.nextFloat() < random_move_percent) {
        const move_x = this.rng.nextRange(-1, 2);
        const move_y = this.rng.nextRange(-1, 2);
        console.log("random move", move_x, move_y);
        if (this.move(move_x, move_y, time)) {
          return;
        }
      }
    }
  };

  move(d_x: number, d_y: number, time: number) {
    this.is_left = d_x < 0;
    if (this.state === MonsterState.Idle) {
      // monster use space [x..x+1; y..y-1]

      const new_x = this.x + d_x;
      const new_y = this.y + d_y;

      for (let test_x = new_x; test_x <= new_x + 1; test_x++) {
        for (let test_y = new_y - 1; test_y <= new_y; test_y++) {
          // check is floor exists
          if (!this.level.floor[test_y][test_x]) {
            return false;
          }
          // check is no monster
          const m = this.level.monsters[test_y][test_x];
          if (m && m !== this && m !== this.wrapper) {
            return false;
          }
        }
      }

      // start move animation
      // mark as used
      this.level.monsters[new_y][new_x] = this.wrapper;
      this.level.monsters[new_y][new_x + 1] = this.wrapper;
      this.level.monsters[new_y - 1][new_x] = this.wrapper;
      this.level.monsters[new_y - 1][new_x + 1] = this.wrapper;
      // reuse current level, because prev mark can override it
      this.level.monsters[this.y][this.x] = this;
      this.new_x = new_x;
      this.new_y = new_y;
      this.setAnimation(MonsterState.Run, time);
      return true;
    }
    return false;
  };

  hitDamage(damage: number, name: string, time: number) {
    this.level.log.push(`${this.name} damaged ${damage} by ${name}`);
    this.health = Math.max(0, this.health - damage);
    if (this.health <= 0) {
      this.level.log.push(`${this.name} killed by ${name}`);

      this.level.monsters[this.y][this.x] = null;
      this.level.monsters[this.y][this.x + 1] = null;
      this.level.monsters[this.y - 1][this.x] = null;
      this.level.monsters[this.y - 1][this.x + 1] = null;


      this.level.monsters[this.new_y][this.new_x] = null;
      this.level.monsters[this.new_y][this.new_x + 1] = null;
      this.level.monsters[this.new_y - 1][this.new_x] = null;
      this.level.monsters[this.new_y - 1][this.new_x + 1] = null;

      this.level.boss = null;
      if (this.rng.nextFloat() < this.luck) {
        this.level.randomDrop(this.x, this.y);
      }
    }
  };
}