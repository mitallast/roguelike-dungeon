import {Resources} from "./resources";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {Character, CharacterState, CharacterWrapper} from "./character";
import {View} from "./view";
// @ts-ignore
import * as PIXI from "pixi.js";
import {PathFinding} from "./pathfinding";
import {HeroView} from "./hero";

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

export class TinyMonster implements Character, View {
  private readonly level: DungeonLevel;
  private readonly resources: Resources;
  private readonly wrapper: CharacterWrapper;

  x: number;
  y: number;
  new_x: number;
  new_y: number;
  is_left: boolean = false;
  state: CharacterState;

  readonly name: string;
  private readonly healthMax: number = 10;
  private health: number = this.healthMax;
  private readonly damage: number = 1.5;
  private readonly luck: number = 0.3;
  private readonly speed: number = 0.2;
  private readonly xp: number = 35;

  private duration: number;
  sprite: PIXI.AnimatedSprite;
  readonly container: PIXI.Container;

  constructor(level: DungeonLevel, x: number, y: number, name: string) {
    this.level = level;
    this.resources = level.controller.resources;
    this.wrapper = new CharacterWrapper(this);
    this.name = name;
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
    this.level.characterMap[this.y][this.x] = null;
    this.level.characterMap[this.new_y][this.new_x] = null;
    this.level.monsters = this.level.monsters.filter(s => s !== this);

    this.sprite?.destroy();
    this.container.destroy();
  }

  private setSprite(postfix: string): void {
    this.sprite?.destroy();
    this.sprite = this.resources.animated(this.name + postfix);
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
        const delta = this.duration / (this.sprite.totalFrames / this.speed);
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
  };

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
    // search hero near
    const max_distance = 7;
    const scan_x_min = Math.max(0, this.x - max_distance);
    const scan_y_min = Math.max(0, this.y - max_distance);
    const scan_x_max = Math.min(this.level.width, this.x + max_distance);
    const scan_y_max = Math.min(this.level.height, this.y + max_distance);

    const is_hero_near = !this.level.hero.heroState.dead.get()
      && this.level.hero.x >= scan_x_min && this.level.hero.x <= scan_x_max
      && this.level.hero.y >= scan_y_min && this.level.hero.y <= scan_y_max;

    if (is_hero_near) {
      const dist_x = Math.abs(this.x - this.level.hero.x);
      const dist_y = Math.abs(this.y - this.level.hero.y);

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
      } else if (Math.random() < this.luck) {
        this.level.hero.hitDamage(this, this.damage);
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
      const cell = this.level.cell(new_x, new_y);

      // check is floor exists
      if (!cell.hasFloor) return false;

      // check is no monster
      if (this.level.characterMap[new_y][new_x]) return false;

      this.markNewPosition(new_x, new_y);
      this.setAnimation(CharacterState.Run);
      return true;
    }
    return false;
  };

  private markNewPosition(x: number, y: number) {
    this.level.characterMap[y][x] = this.wrapper;
    this.new_x = x;
    this.new_y = y;
  }

  private resetPosition(x: number, y: number) {
    if (this.x >= 0 && this.y >= 0) {
      this.level.characterMap[this.y][this.x] = null;
    }
    this.x = x;
    this.y = y;
    this.new_x = x;
    this.new_y = y;
    this.level.characterMap[y][x] = this;
    this.container.position.set(x * TILE_SIZE, y * TILE_SIZE);
  };

  hitDamage(character: Character, damage: number) {
    this.level.log.push(`${this.name} damaged ${damage} by ${name}`);
    this.health = Math.max(0, this.health - damage);
    if (this.health <= 0) {
      this.level.log.push(`${this.name} killed by ${name}`);
      this.destroy();
      if (character instanceof HeroView) {
        character.heroState.addXp(this.xp);
      }
      if (Math.random() < this.luck) {
        this.level.cell(this.x, this.y).randomDrop();
      }
    }
  };
}