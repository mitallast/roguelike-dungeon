import {Resources} from "./resources";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {Character, CharacterState, CharacterWrapper} from "./character";
import {View} from "./view";
import {Observable, Subscription} from "./observable";
import {Colors} from "./ui";
import {PathFinding} from "./pathfinding";
// @ts-ignore
import * as PIXI from 'pixi.js';
import {BarView} from "./bar.view";

const TILE_SIZE = 16;

export const mossMonsterNames = [
  "ogre",
  "big_zombie",
  "big_demon",
];

export class BossState {
  readonly name: string;
  readonly healthMax: number;
  readonly health: Observable<number>;
  readonly damage: number;
  readonly luck: number;
  readonly speed: number;
  readonly dead: Observable<boolean>;
  readonly xp: number;

  constructor(name: string, level: number) {
    this.name = name;
    this.healthMax = 50 + Math.floor(level * 10);
    this.health = new Observable<number>(this.healthMax);
    this.damage = 7;
    this.luck = 0.3;
    this.speed = 0.2;
    this.dead = new Observable<boolean>(false);
    this.xp = 100 + 50 * level;
  }
}

export class BossMonster implements Character, View {
  private readonly resources: Resources;
  private readonly level: DungeonLevel;
  private readonly wrapper: CharacterWrapper;

  readonly bossState: BossState;

  x: number;
  y: number;
  new_x: number;
  new_y: number;
  is_left: boolean;
  state: CharacterState;

  get name(): string {
    return this.bossState.name;
  }

  private duration: number;
  private sprite: PIXI.AnimatedSprite;
  readonly container: PIXI.Container;

  constructor(resources: Resources, dungeon: DungeonLevel, x: number, y: number, name: string) {
    this.level = dungeon;
    this.resources = dungeon.controller.resources;
    this.wrapper = new CharacterWrapper(this);

    this.bossState = new BossState(name, dungeon.level);

    this.container = new PIXI.Container();
    this.container.zIndex = DungeonZIndexes.character;
    this.level.container.addChild(this.container);
    this.setAnimation(CharacterState.Idle);
    this.resetPosition(x, y);
  }

  update(delta: number): void {
    this.duration += delta;
    this.animate();
  }

  destroy(): void {
    this.clearMap(this.x, this.y);
    this.clearMap(this.new_x, this.new_y);
    this.sprite?.destroy();
    this.container.destroy();
    this.level.boss = null;
  }

  private setSprite(postfix: string): void {
    this.sprite?.destroy();
    this.sprite = this.resources.animated(this.bossState.name + postfix);
    this.sprite.loop = false;
    this.sprite.animationSpeed = this.bossState.speed;
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

  private setAnimation(state: CharacterState) {
    switch (state) {
      case CharacterState.Idle:
        this.state = state;
        this.setSprite('_idle');
        break;
      case CharacterState.Run:
        this.state = state;
        this.setSprite('_run');
        break;
    }
  };

  private animate() {
    switch (this.state) {
      case CharacterState.Idle:
        if (!this.sprite.playing) {
          if (!this.action()) {
            this.setAnimation(CharacterState.Idle);
          }
        }
        break;
      case CharacterState.Run:
        const delta = this.duration / (this.sprite.totalFrames / this.bossState.speed);
        const t_x = this.x * TILE_SIZE + TILE_SIZE * (this.new_x - this.x) * delta;
        const t_y = this.y * TILE_SIZE + TILE_SIZE * (this.new_y - this.y) * delta;
        this.container.position.set(t_x, t_y);

        if (!this.sprite.playing) {
          this.resetPosition(this.new_x, this.new_y);
          if (!this.action()) {
            this.setAnimation(CharacterState.Idle);
          }
        }
        break;
    }
  }

  private action(): boolean {
    if (this.scanHero()) {
      return true;
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

  private scanHero(): boolean {
    const max_distance = 7;
    const scan_x_min = Math.max(0, this.x - max_distance);
    const scan_y_min = Math.max(0, this.y - max_distance - 1);
    const scan_x_max = Math.min(this.level.width, this.x + max_distance + 1);
    const scan_y_max = Math.min(this.level.height, this.y + max_distance);

    const is_hero_near = !this.level.hero.heroState.dead.get()
      && this.level.hero.x >= scan_x_min && this.level.hero.x <= scan_x_max
      && this.level.hero.y >= scan_y_min && this.level.hero.y <= scan_y_max;

    if (is_hero_near) {
      const dist_x = Math.min(
        Math.abs(this.x - this.level.hero.x), // from left
        Math.abs(this.x + 1 - this.level.hero.x), // from right
      );

      const dist_y = Math.min(
        Math.abs(this.y - this.level.hero.y), // from bottom
        Math.abs(this.y - this.level.hero.y - 1), // from top
      );

      if (dist_x > 1 || dist_y > 1) {
        const level = this.level;
        const pf = new PathFinding(level.width, level.height);

        for (let y = 0; y < level.height; y++) {
          for (let x = 0; x < level.width; x++) {
            const m = level.characterMap[y][x];
            if (m && m !== this && m !== this.wrapper && m !== level.hero) {
              pf.mark(x, y);
            } else if (level.cell(x, y).hasFloor) {
              pf.clear(x, y);
            }
          }
        }

        const start = new PIXI.Point(this.x, this.y);
        const end = new PIXI.Point(level.hero.x, level.hero.y);
        const path = pf.find(start, end);
        if (path.length > 0) {
          const next = path[0];
          const d_x = next.x - this.x;
          const d_y = next.y - this.y;
          return this.move(d_x, d_y);
        }
      } else if (Math.random() < this.bossState.luck) {
        this.level.hero.hitDamage(this, this.bossState.damage);
        return true;
      }
    }

    return false;
  }

  private move(d_x: number, d_y: number) {
    this.is_left = d_x < 0;
    if (this.state === CharacterState.Idle) {

      const new_x = this.x + d_x;
      const new_y = this.y + d_y;

      for (let test_x = new_x; test_x <= new_x + 1; test_x++) {
        for (let test_y = new_y - 1; test_y <= new_y; test_y++) {
          // check is floor exists
          if (!this.level.cell(test_x, test_y).hasFloor) {
            return false;
          }
          // check is no monster
          const m = this.level.characterMap[test_y][test_x];
          if (m && m !== this && m !== this.wrapper) {
            return false;
          }
        }
      }

      this.markNewPosition(new_x, new_y);
      this.setAnimation(CharacterState.Run);
      return true;
    }
    return false;
  }

  hitDamage(character: Character, damage: number) {
    this.level.log.push(`${this.bossState.name} damaged ${damage} by ${name}`);
    this.bossState.health.update(h => Math.max(0, h - damage));
    if (this.bossState.health.get() <= 0) {
      this.level.log.push(`${this.bossState.name} killed by ${name}`);
      this.bossState.dead.set(true);
      this.destroy();
      if (Math.random() < this.bossState.luck) {
        this.level.cell(this.x, this.y).randomDrop();
      }
    }
  }

  private markNewPosition(x: number, y: number) {
    this.level.characterMap[y][x] = this.wrapper;
    this.level.characterMap[y][x + 1] = this.wrapper;
    this.level.characterMap[y - 1][x] = this.wrapper;
    this.level.characterMap[y - 1][x + 1] = this.wrapper;
    // reuse current level, because prev mark can override it
    this.level.characterMap[this.y][this.x] = this;
    this.new_x = x;
    this.new_y = y;
  }

  private resetPosition(x: number, y: number) {
    this.clearMap(this.x, this.y);
    this.clearMap(this.new_x, this.new_y);
    this.x = x;
    this.y = y;
    this.new_x = x;
    this.new_y = y;
    this.level.characterMap[y][x] = this;
    this.level.characterMap[y][x + 1] = this.wrapper;
    this.level.characterMap[y - 1][x] = this.wrapper;
    this.level.characterMap[y - 1][x + 1] = this.wrapper;
    this.container.position.set(x * TILE_SIZE, y * TILE_SIZE);
  };

  private clearMap(x: number, y: number): void {
    if (x >= 0 && y >= 0) {
      for (let test_x = x; test_x <= x + 1; test_x++) {
        for (let test_y = y - 1; test_y <= y; test_y++) {
          // check is no monster
          const m = this.level.characterMap[test_y][test_x];
          if (m && (m === this || m === this.wrapper)) {
            this.level.characterMap[test_y][test_x] = null;
          }
        }
      }
    }
  }
}

export class BossHealthView implements View {
  readonly container: PIXI.Container;
  private readonly boss: BossState;
  private readonly health: BarView;

  private readonly widthMax: number;
  private readonly pointWidth: number;

  private readonly healthSub: Subscription;
  private readonly deadSub: Subscription;

  private destroyed = false;

  constructor(boss: BossState) {
    this.container = new PIXI.Container();
    this.boss = boss;

    const HEALTH_MAX_WIDTH = 500;
    const HEALTH_WIDTH = 4;
    this.pointWidth = Math.min(HEALTH_WIDTH, Math.floor(HEALTH_MAX_WIDTH / boss.healthMax));

    this.widthMax = this.pointWidth * boss.healthMax;

    this.health = new BarView({
      color: Colors.uiRed,
      widthMax: this.widthMax,
      labelCenter: true
    });
    (this.health as PIXI.Container).position.set(-(this.widthMax >> 1), 0);
    this.container.addChild(this.health);

    this.healthSub = boss.health.subscribe(this.updateHealth.bind(this));
    this.deadSub = boss.dead.subscribe(this.updateDead.bind(this));
  }

  updateHealth(health: number) {
    this.health.width = this.pointWidth * health;
    this.health.label = `${this.boss.name} - ${health}`;
  }

  updateDead(dead: boolean) {
    if (dead) {
      this.destroy();
    }
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this.healthSub.unsubscribe();
      this.deadSub.unsubscribe();
      this.container.destroy();
    }
  }

  update(delta: number): void {
  }
}
