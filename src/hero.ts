import {Inventory} from "./inventory";
import {Tile, TileRegistry} from "./tilemap";
import {Joystick} from "./input";
import {Monster, MonsterState, MovingMonsterWrapper} from "./monster";
import {Level} from "./level";
import {Weapon} from "./drop";

export const heroMonsterNames = [
  "elf_f",
  "elf_m",
  "knight_f",
  "knight_m",
  "wizard_f",
  "wizard_m",
];

export class HeroMonster implements Monster {
  private registry: TileRegistry;
  private joystick: Joystick;
  x: number;
  y: number;
  new_x: number;
  new_y: number;
  is_left: boolean;
  readonly name: string;
  readonly healthMax: number;
  health: number;
  coins: number;
  private readonly baseDamage: number;
  dead: boolean;
  weapon: Weapon;
  readonly speed: number;
  readonly inventory: Inventory;
  private level: Level;
  state: MonsterState;
  tile: Tile;
  frame: number;
  start: number;

  constructor(registry: TileRegistry, joystick: Joystick, x: number, y: number, name: string, weapon: Weapon, time: number) {
    this.registry = registry;
    this.joystick = joystick;
    this.x = x;
    this.y = y;
    this.new_x = x;
    this.new_y = y;
    this.is_left = false;
    this.name = name;
    this.healthMax = 30;
    this.health = this.healthMax;
    this.coins = 0;
    this.baseDamage = 1;
    this.dead = false;
    this.weapon = weapon;
    this.speed = 100;
    this.inventory = new Inventory();
    this.setAnimation(MonsterState.Idle, time);
  }

  get damage(): number {
    return this.baseDamage + (this.weapon ? this.weapon.damage : 0);
  }

  setLevel(level: Level) {
    this.level = level;
  };

  setAnimation(state: MonsterState, time: number) {
    switch (state) {
      case MonsterState.Idle:
        this.state = state;
        this.tile = this.registry.get(this.name + "_idle_anim");
        this.frame = 0;
        this.start = time;
        break;
      case MonsterState.Run:
        if (!this.dead) {
          this.state = state;
          this.tile = this.registry.get(this.name + "_run_anim");
          this.frame = 0;
          this.start = time;
        }
        break;
      case MonsterState.Hit:
        if (!this.dead) {
          this.state = state;
          this.tile = this.registry.get(this.name + "_hit_anim");
          this.frame = 0;
          if (this.weapon) {
            this.weapon.frame = 0;
          }
          this.start = time;
        }
        break;
    }
  }

  animate(time: number) {
    switch (this.state) {
      case MonsterState.Idle:
        this.frame = Math.floor((time - this.start) / this.speed);
        if (!this.action(time)) {
          if (this.frame >= this.tile.numOfFrames) {
            this.setAnimation(MonsterState.Idle, time);
          }
        }
        break;
      case MonsterState.Run:
        this.frame = Math.floor((time - this.start) / this.speed);
        if (this.frame >= this.tile.numOfFrames) {
          this.level.monsters[this.y][this.x] = null;
          this.level.monsters[this.new_y][this.new_x] = this;
          this.x = this.new_x;
          this.y = this.new_y;
          this.scanDrop();
          if (!this.action(time)) {
            this.setAnimation(MonsterState.Idle, time);
          }
        }
        break;
      case MonsterState.Hit:
        if (this.weapon) {
          this.weapon.frame = Math.floor((time - this.start) / this.weapon.speed);
          if (this.weapon.frame >= this.weapon.numOfFrames) {
            this.scanHit(time);
            this.scanDrop();
            if (!this.action(time)) {
              this.setAnimation(MonsterState.Idle, time);
            }
          }
        } else {
          this.frame = Math.floor((time - this.start) / this.speed);
          if (this.frame >= this.tile.numOfFrames) {
            this.scanHit(time);
            this.scanDrop();
            if (!this.action(time)) {
              this.setAnimation(MonsterState.Idle, time);
            }
          }
        }
        break;
    }
  };

  action(time: number) {
    if (this.dead) {
      if (!this.joystick.hit.processed) {
        this.joystick.hit.processed = true;
        this.level.restart();
      }
    } else {
      this.scanDrop();
      for (let d = 0; d < 10; d++) {
        const digit = (d + 1) % 10;
        if (!this.joystick.digit(digit).processed) {
          this.joystick.digit(digit).processed = true;
          this.inventory.cells[d].use(this);
        }
      }
      if (!this.joystick.drop.processed) {
        this.joystick.drop.processed = true;
        this.dropWeapon();
      }

      if (this.joystick.hit.triggered && !this.joystick.hit.processed) {
        this.joystick.hit.processed = true;
        if (this.level.floor[this.y][this.x].name === "floor_ladder") {
          this.level.exit(time);
        } else {
          this.setAnimation(MonsterState.Hit, time);
        }
        return true;
      }
      if (this.joystick.moveUp.triggered || !this.joystick.moveUp.processed) {
        this.joystick.moveUp.processed = true;
        if (this.move(0, -1, time)) {
          return true;
        }
      }
      if (this.joystick.moveDown.triggered || !this.joystick.moveDown.processed) {
        this.joystick.moveDown.processed = true;
        if (this.move(0, 1, time)) {
          return true;
        }
      }
      if (this.joystick.moveLeft.triggered || !this.joystick.moveLeft.processed) {
        this.joystick.moveLeft.processed = true;
        this.is_left = true;
        if (this.move(-1, 0, time)) {
          return true;
        }
      }
      if (this.joystick.moveRight.triggered || !this.joystick.moveRight.processed) {
        this.joystick.moveRight.processed = true;
        this.is_left = false;
        if (this.move(1, 0, time)) {
          return true;
        }
      }
    }
    return false;
  };

  dropWeapon() {
    if (this.weapon) {
      const max_distance = 5;
      let left_x = this.x;
      let right_x = this.x;
      let min_y = this.y;
      let max_y = this.y;
      // find free floor cell;

      // scan from center by x
      for (let dist_x = 0; dist_x < max_distance; dist_x++) {
        left_x--;
        right_x++;
        min_y--;
        max_y++;

        // scan from center by y
        let t_y = this.y;
        let b_y = this.y;
        for (let dist_y = 0; dist_y <= dist_x; dist_y++) {
          let scan_x = this.is_left ? [left_x, right_x] : [right_x, left_x];
          let scan_y = [t_y, b_y];

          for (let i = 0; i < 2; i++) {
            let s_x = scan_x[i];
            for (let j = 0; j < 2; j++) {
              let s_y = scan_y[j];
              if (s_x >= 0 && s_y >= 0) {
                if (!this.level.drop[s_y][s_x] && this.level.floor[s_y][s_x]) {
                  const drop = this.weapon;
                  this.weapon = null;
                  this.level.drop[s_y][s_x] = drop;
                  return;
                }
              }
            }
          }

          t_y--;
          b_y++;
        }

        // after reach max y, scan to center by x
        for (let dist_r = 0; dist_r < dist_x; dist_x++) {
          left_x++;
          right_x--;

          let scan_x = this.is_left ? [left_x, right_x] : [right_x, left_x];
          let scan_y = [t_y, b_y];

          for (let i = 0; i < 2; i++) {
            let s_x = scan_x[i];
            for (let j = 0; j < 2; j++) {
              let s_y = scan_y[j];
              if (s_x >= 0 && s_y >= 0) {
                if (!this.level.drop[s_y][s_x] && this.level.floor[s_y][s_x]) {
                  const drop = this.weapon;
                  this.weapon = null;
                  this.level.drop[s_y][s_x] = drop;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }

  scanDrop() {
    if (this.level.drop[this.y][this.x]) {
      const drop = this.level.drop[this.y][this.x];
      if (drop.pickedUp(this)) {
        this.level.drop[this.y][this.x] = null;
      }
    }
  };

  scanHit(time: number) {
    const max_distance = this.weapon ? this.weapon.distance : 1;
    // search only left or right path
    const scan_x_min = this.is_left ? Math.max(0, this.x - max_distance) : this.x;
    const scan_x_max = this.is_left ? this.x : Math.min(this.level.w, this.x + max_distance);

    const scan_y_min = Math.max(0, this.y - max_distance);
    const scan_y_max = Math.min(this.level.h, this.y + max_distance);

    for (let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
      for (let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
        // not self
        if (!(s_x === this.x && s_y === this.y)) {
          const monster = this.level.monsters[s_y][s_x];
          if (monster) {
            monster.hitDamage(this.damage, this.name, time);
          }
        }
      }
    }
  };

  move(d_x: number, d_y: number, time: number) {
    if (!this.dead && this.state === MonsterState.Idle) {
      const new_x = this.x + d_x;
      const new_y = this.y + d_y;

      // check is floor exists
      if (!this.level.floor[new_y][new_x]) return false;

      // check is no monster
      if (this.level.monsters[new_y][new_x]) return false;

      // start move animation
      this.level.monsters[new_y][new_x] = new MovingMonsterWrapper(this); // mark as used
      this.new_x = new_x;
      this.new_y = new_y;
      this.setAnimation(MonsterState.Run, time);
      return true;
    }
    return false;
  };

  resetPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.new_x = x;
    this.new_y = y;
  };

  hitDamage(damage: number, name: string, time: number) {
    if (!this.dead) {
      this.level.log.push(`${this.name} damaged ${damage} by ${name}`);
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.level.log.push(`${this.name} killed by ${name}`);
        this.setAnimation(MonsterState.Idle, time);
        this.dead = true;
      }
    }
  };

  hill(health: number) {
    this.health = Math.min(this.healthMax, this.health + health);
  };

  addCoins(coins: number) {
    this.coins = this.coins + coins;
  };
}