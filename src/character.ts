import {Resources} from "./resources";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {HeroCharacter} from "./hero";
import {Publisher} from "./observable";
import {PathFinding} from "./pathfinding";
// @ts-ignore
import * as PIXI from "pixi.js";

const TILE_SIZE = 16;

export enum AnimationState {
  Idle = 0, Run = 1, Hit = 2
}

export interface Character {
  readonly name: string;
  readonly healthMax: Publisher<number>;
  readonly health: Publisher<number>;
  readonly dead: Publisher<boolean>;

  readonly speed: number;

  hill(health: number): void;
  hitDamage(damage: number): void;
}

export interface MonsterCharacter extends Character {
  readonly luck: number;
  readonly damage: number;
  readonly xp: number;
}

export interface CharacterView {
  readonly character: Character
  readonly x: number;
  readonly y: number;

  update(delta: number): void;
  destroy(): void;
  hitDamage(by: Character, damage: number): void;
  resetPosition(x: number, y: number): void;
}

export abstract class BaseCharacterView extends PIXI.Container implements CharacterView {
  protected readonly resources: Resources;
  protected readonly dungeon: DungeonLevel;

  abstract readonly character: Character;

  get x(): number {
    return this.pos_x;
  }

  get y(): number {
    return this.pos_y;
  }

  protected readonly grid_width: number; // grid width
  protected readonly grid_height: number; // grid width
  private pos_x: number; // grid pos
  private pos_y: number; // grid pos
  private new_x: number;
  private new_y: number;
  protected is_left: boolean;
  private animationState: AnimationState;

  protected duration: number;
  protected sprite: PIXI.AnimatedSprite;

  protected constructor(dungeon: DungeonLevel, width: number, height: number, x: number, y: number) {
    super();
    super.zIndex = DungeonZIndexes.character;
    this.dungeon = dungeon;
    this.resources = dungeon.controller.resources;
    this.grid_width = width;
    this.grid_height = height;
    this.pos_x = x;
    this.pos_y = y;
    this.new_x = x;
    this.new_y = y;
  }

  protected init(): void {
    this.setAnimation(AnimationState.Idle);
    this.resetPosition(this.pos_x, this.pos_y);
    this.dungeon.container.addChild(this);
  }

  destroy(): void {
    super.destroy();
    this.clearMap(this.x, this.y);
    this.clearMap(this.new_x, this.new_y);
    this.onDestroy();
  }

  protected abstract onDestroy(): void;

  update(delta: number): void {
    this.duration += delta;
    this.animate();
  }

  protected setSprite(postfix: string): void {
    this.sprite?.destroy();
    this.sprite = this.resources.animated(this.character.name + postfix);
    this.sprite.loop = false;
    this.sprite.animationSpeed = this.character.speed;
    this.sprite.anchor.set(0, 1);
    this.sprite.position.y = TILE_SIZE - 2;
    this.sprite.zIndex = 1;
    this.sprite.play();
    super.addChild(this.sprite);
    this.duration = 0;

    if (this.is_left) {
      this.sprite.position.x = this.sprite.width;
      this.sprite.scale.x = -1;
    } else {
      this.sprite.position.x = 0;
      this.sprite.scale.x = 1;
    }

    this.onSetSprite();
  }

  protected abstract onSetSprite(): void;

  protected setAnimation(state: AnimationState) {
    switch (state) {
      case AnimationState.Idle:
        this.animationState = state;
        this.onSetAnimationIdle();
        break;
      case AnimationState.Run:
        this.animationState = state;
        this.onSetAnimationRun();
        break;
      case AnimationState.Hit:
        if (!this.character.dead.get()) {
          this.animationState = state;
          this.onSetAnimationHit();
        }
        break;
    }
  };

  protected onSetAnimationIdle(): void {
    this.setSprite('_idle');
  }

  protected onSetAnimationRun(): void {
    this.setSprite('_run');
  }

  protected abstract onSetAnimationHit(): void;

  protected animate(): void {
    switch (this.animationState) {
      case AnimationState.Idle:
        this.animateIdle();
        break;
      case AnimationState.Run:
        this.animateRun();
        break;
      case AnimationState.Hit:
        this.animateHit();
        break;
    }
  }

  protected abstract animateIdle(): void;

  protected animateRun(): void {
    const delta = this.duration / (this.sprite.totalFrames / this.sprite.animationSpeed);
    const t_x = this.x * TILE_SIZE + TILE_SIZE * (this.new_x - this.x) * delta;
    const t_y = this.y * TILE_SIZE + TILE_SIZE * (this.new_y - this.y) * delta;
    super.position.set(t_x, t_y);

    if (!this.sprite.playing) {
      this.resetPosition(this.new_x, this.new_y);
      if (!this.action()) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  protected abstract animateHit(): void;

  protected abstract action(): boolean;

  protected move(mx: number, my: number): boolean {
    if (mx > 0) this.is_left = false;
    if (mx < 0) this.is_left = true;
    if (this.animationState === AnimationState.Idle || this.animationState === AnimationState.Run) {
      const new_x = this.x + mx;
      const new_y = this.y + my;
      for (let dx = 0; dx < this.grid_width; dx++) {
        for (let dy = 0; dy < this.grid_height; dy++) {
          // check is floor exists
          if (!this.dungeon.cell(new_x + dx, new_y - dy).hasFloor) {
            return false;
          }
          // check is no monster
          const m = this.dungeon.character(new_x + dx, new_y - dy);
          if (m && m !== this) {
            return false;
          }
        }
      }
      this.markNewPosition(new_x, new_y);
      this.setAnimation(AnimationState.Run);
      return true;
    }
    return false;
  }

  resetPosition(x: number, y: number): void {
    this.clearMap(this.x, this.y);
    this.clearMap(this.new_x, this.new_y);
    this.pos_x = x;
    this.pos_y = y;
    this.markNewPosition(this.x, this.y);
    super.position.set(x * TILE_SIZE, y * TILE_SIZE);
  }

  protected clearMap(x: number, y: number): void {
    if (x >= 0 && y >= 0) {
      for (let dx = 0; dx < this.grid_width; dx++) {
        for (let dy = 0; dy < this.grid_height; dy++) {
          const m = this.dungeon.character(x + dx, y - dy);
          if (m && (m === this)) {
            this.dungeon.setCharacter(x + dx, y - dy, null);
          }
        }
      }
    }
  }

  protected markNewPosition(x: number, y: number) {
    for (let dx = 0; dx < this.grid_width; dx++) {
      for (let dy = 0; dy < this.grid_height; dy++) {
        this.dungeon.setCharacter(x + dx, y - dy, this);
      }
    }
    this.new_x = x;
    this.new_y = y;
  }

  abstract hitDamage(by: Character, damage: number): void;
}

export abstract class BaseMonsterView extends BaseCharacterView {
  abstract readonly character: MonsterCharacter;
  protected abstract readonly max_distance: number;

  protected constructor(dungeon: DungeonLevel, width: number, height: number, x: number, y: number) {
    super(dungeon, width, height, x, y);
  }

  protected action(): boolean {
    const hero = this.dungeon.hero;
    if (!hero.character.dead.get()) {
      const [dist_x, dist_y] = this.distanceToHero();
      const is_hero_near = dist_x <= this.max_distance && dist_y <= this.max_distance;
      if (is_hero_near) {
        if (dist_x > 1 || dist_y > 1) {
          return this.pathTo(hero.x, hero.y);
        } else {
          this.setAnimation(AnimationState.Hit);
          return true;
        }
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

  protected distanceToHero(): [number, number] {
    let min_dist_x: number = null;
    let min_dist_y: number = null;

    for (let dx = 0; dx < this.grid_width; dx++) {
      for (let dy = 0; dy < this.grid_height; dy++) {
        const dist_x = Math.abs(this.x + dx - this.dungeon.hero.x);
        const dist_y = Math.abs(this.y - dy - this.dungeon.hero.y);
        min_dist_x = min_dist_x === null ? dist_x : Math.min(dist_x, min_dist_x);
        min_dist_y = min_dist_y === null ? dist_y : Math.min(dist_y, min_dist_y);
      }
    }
    return [min_dist_x, min_dist_y];
  }

  protected pathTo(to_x: number, to_y: number): boolean {
    const dungeon = this.dungeon;
    const pf = new PathFinding(dungeon.width, dungeon.height);
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const m = dungeon.character(x, y);
        if (m && m !== this && m !== dungeon.hero) {
          pf.mark(x, y);
        } else if (dungeon.cell(x, y).hasFloor) {
          pf.clear(x, y);
        }
      }
    }

    const start = new PIXI.Point(this.x, this.y);
    const end = new PIXI.Point(to_x, to_y);
    const path = pf.find(start, end);
    if (path.length > 0) {
      const next = path[0];
      const d_x = next.x - this.x;
      const d_y = next.y - this.y;
      return this.move(d_x, d_y);
    } else {
      return false;
    }
  }

  protected onSetAnimationHit(): void {
    this.setSprite('_idle');
  }

  protected animateIdle(): void {
    if (!this.sprite.playing) {
      if (!this.action()) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  protected animateHit(): void {
    if (!this.sprite.playing) {
      if (Math.random() < this.character.luck) {
        this.dungeon.hero.hitDamage(this.character, this.character.damage);
      }
      if (!this.action()) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  hitDamage(by: Character, damage: number) {
    if (!this.character.dead.get()) {
      this.dungeon.log.push(`${this.character.name} damaged ${damage} by ${by.name}`);
      this.character.hitDamage(damage);
      if (this.character.dead.get()) {
        this.dungeon.log.push(`${this.character.name} killed by ${by.name}`);
        this.destroy();
        if (by instanceof HeroCharacter) {
          by.addXp(this.character.xp);
        }
        this.onDead();
      }
    }
  }

  protected onSetSprite(): void {
  }

  protected abstract onDead(): void;
}