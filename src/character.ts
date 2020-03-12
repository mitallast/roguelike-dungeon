import {Resources} from "./resources";
import {DungeonCell, DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {HeroCharacter} from "./hero";
import {ObservableVar, Observable} from "./observable";
import {PathFinding} from "./pathfinding";
import * as PIXI from "pixi.js";

const TILE_SIZE = 16;

export enum AnimationState {
  Idle = 0, Run = 1, Hit = 2
}

export abstract class Character {
  readonly name: string;
  readonly speed: number;

  protected readonly _healthMax: ObservableVar<number>;
  protected readonly _health: ObservableVar<number>;
  private readonly _dead: ObservableVar<boolean>;
  private readonly _killedBy: ObservableVar<Character | null>;

  get healthMax(): Observable<number> {
    return this._healthMax;
  }

  get health(): Observable<number> {
    return this._health;
  }

  get dead(): Observable<boolean> {
    return this._dead;
  }

  get killedBy(): Observable<Character | null> {
    return this._killedBy;
  }

  protected constructor(options: {
    name: string,
    speed: number,
    healthMax: number,
  }) {
    this.name = options.name;
    this.speed = options.speed;
    this._healthMax = new ObservableVar(options.healthMax);
    this._health = new ObservableVar(options.healthMax);
    this._dead = new ObservableVar<boolean>(false);
    this._killedBy = new ObservableVar<Character | null>(null);
  }

  hill(health: number): void {
    this._health.update(h => Math.min(this._healthMax.get(), h + health));
  }

  hitDamage(by: Character, damage: number): void {
    if (!this._dead.get()) {
      this._health.update((h) => Math.max(0, h - damage));
      if (this._health.get() === 0) {
        this._killedBy.set(by);
        this._dead.set(true);
      }
    }
  }
}

export abstract class MonsterCharacter extends Character {
  readonly level: number;
  readonly luck: number;
  readonly damage: number;
  readonly xp: number;

  protected constructor(options: {
    name: string,
    speed: number,
    healthMax: number,
    level: number,
    luck: number,
    damage: number,
    xp: number,
  }) {
    super(options);
    this.level = options.level;
    this.luck = options.luck;
    this.damage = options.damage;
    this.xp = options.xp;
  }
}

export interface CharacterView {
  readonly character: Character
  readonly x: number;
  readonly y: number;

  destroy(): void;
  resetPosition(x: number, y: number): void;
}

export abstract class BaseCharacterView extends PIXI.Container implements CharacterView {
  protected readonly dungeon: DungeonLevel;
  protected readonly resources: Resources;
  protected readonly ticker: PIXI.Ticker;

  abstract readonly character: Character;

  get x(): number {
    return this.pos_x;
  }

  get y(): number {
    return this.pos_y;
  }

  protected readonly grid_width: number; // grid width
  protected readonly grid_height: number; // grid width
  protected pos_x: number; // grid pos
  protected pos_y: number; // grid pos
  private new_x: number;
  private new_y: number;
  private _is_left: boolean = false;

  protected get is_left(): boolean {
    return this._is_left;
  }

  protected set is_left(is_left: boolean) {
    this._is_left = is_left;
    this.updateSpriteOrientation();
    this.onSetOrientation();
  }

  private animationState: AnimationState | null = null;

  protected sprite: PIXI.AnimatedSprite | null = null;
  protected spriteTime: number = 0;
  protected spritePlay: boolean = false;

  protected constructor(dungeon: DungeonLevel, width: number, height: number, x: number, y: number) {
    super();
    super.zIndex = DungeonZIndexes.character;
    this.dungeon = dungeon;
    this.resources = dungeon.controller.resources;
    this.ticker = dungeon.ticker;
    this.grid_width = width;
    this.grid_height = height;
    this.pos_x = x;
    this.pos_y = y;
    this.new_x = x;
    this.new_y = y;
  }

  protected init(): void {
    this.ticker.add(this.update, this);
    this.setAnimation(AnimationState.Idle);
    this.resetPosition(this.pos_x, this.pos_y);
    this.dungeon.container.addChild(this);
    this.character.killedBy.subscribe(this.handleKilledBy, this);
    this.character.dead.subscribe(this.handleDead, this);
  }

  destroy(): void {
    super.destroy();
    this.ticker.remove(this.update, this);
    this.character.killedBy.unsubscribe(this.handleKilledBy, this);
    this.character.dead.unsubscribe(this.handleDead, this);
    this.clearMap(this.pos_x, this.pos_y);
    this.clearMap(this.new_x, this.new_y);
    this.onDestroy();
  }

  protected abstract onDestroy(): void;

  private update(deltaTime: number): void {
    this.updateSprite(deltaTime);
    this.animate();
  }

  private updateSprite(deltaTime: number): void {
    const sprite = this.sprite!;
    const elapsed = sprite.animationSpeed * deltaTime;
    const previousFrame = sprite.currentFrame;
    this.spriteTime += elapsed;

    let currentFrame = Math.floor(this.spriteTime) % sprite.totalFrames;
    if (currentFrame < 0) {
      currentFrame += sprite.totalFrames;
    }

    if (this.spriteTime < 0) {
      this.spriteTime = 0;
      this.spritePlay = false;
    } else if (this.spriteTime >= sprite.totalFrames) {
      this.spriteTime = sprite.totalFrames - 1;
      this.spritePlay = false;
    } else if (previousFrame !== currentFrame) {
      this.sprite?.gotoAndStop(currentFrame);
    }
  }

  protected setSprite(postfix: string): void {
    this.sprite?.destroy();
    this.sprite = this.resources.animated(this.character.name + postfix, false);
    this.sprite.loop = false;
    this.sprite.animationSpeed = this.character.speed;
    this.sprite.anchor.set(0, 1);
    this.sprite.position.y = TILE_SIZE - 2;
    this.sprite.zIndex = 1;
    this.spriteTime = 0;
    this.spritePlay = true;
    super.addChild(this.sprite);
    this.updateSpriteOrientation();
    this.onSetSprite();
  }

  protected abstract onSetOrientation(): void;

  private updateSpriteOrientation(): void {
    if (this.sprite) {
      if (this._is_left) {
        this.sprite.position.x = this.sprite.width;
        this.sprite.scale.x = -1;
      } else {
        this.sprite.position.x = 0;
        this.sprite.scale.x = 1;
      }
    }
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
    if (this.sprite) {
      const delta = this.spriteTime / this.sprite.totalFrames;
      const t_x = this.x * TILE_SIZE + TILE_SIZE * (this.new_x - this.x) * delta;
      const t_y = this.y * TILE_SIZE + TILE_SIZE * (this.new_y - this.y) * delta;
      super.position.set(t_x, t_y);
    }

    if (!this.sprite || !this.spritePlay) {
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

  private handleKilledBy(by: Character | null): void {
    if (by) this.onKilledBy(by);
  }

  private handleDead(dead: boolean): void {
    if (dead) this.onDead();
  }

  protected abstract onKilledBy(by: Character): void;

  protected abstract onDead(): void;

  protected findDropCell(): (DungeonCell | null) {
    const max_distance = 5;
    const pos_x = this.x;
    const pos_y = this.y;
    const is_left = this.is_left;
    const is_dead = this.character.dead.get();

    let closestCell: DungeonCell | null = null;
    let closestDistance: number | null = null;

    const metric = (a: DungeonCell) => {
      return Math.sqrt(Math.pow(a.x - pos_x, 2) + Math.pow(a.y - pos_y, 2)) +
        (a.y !== pos_y ? 0.5 : 0) + // boost X
        (is_left ? (a.x < pos_x ? 0 : 1) : (a.x > pos_x ? 0 : 0.5)); // boost side
    };

    for (let x = Math.max(0, pos_x - max_distance); x < pos_x + max_distance; x++) {
      for (let y = Math.max(0, this.y - max_distance); y < this.y + max_distance; y++) {
        if (!(x === pos_x && y === this.y) || is_dead) {
          const cell = this.dungeon.cell(x, y);
          if (cell.hasFloor && !cell.hasDrop) {
            const distance = metric(cell);
            if (closestDistance === null || closestDistance > distance) {
              closestCell = cell;
              closestDistance = distance;
            }
          }
        }
      }
    }

    return closestCell;
  }
}

export abstract class BaseMonsterView extends BaseCharacterView {
  abstract readonly character: MonsterCharacter;
  protected abstract readonly max_distance: number;

  protected constructor(dungeon: DungeonLevel, width: number, height: number, x: number, y: number) {
    super(dungeon, width, height, x, y);
  }

  protected action(): boolean {
    if (!this.character.dead.get()) {
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
    }
    return false;
  }

  protected distanceToHero(): [number, number] {
    let min_dist_x: number = -1;
    let min_dist_y: number = -1;

    for (let dx = 0; dx < this.grid_width; dx++) {
      for (let dy = 0; dy < this.grid_height; dy++) {
        const dist_x = Math.abs(this.x + dx - this.dungeon.hero.x);
        const dist_y = Math.abs(this.y - dy - this.dungeon.hero.y);
        min_dist_x = min_dist_x === -1 ? dist_x : Math.min(dist_x, min_dist_x);
        min_dist_y = min_dist_y === -1 ? dist_y : Math.min(dist_y, min_dist_y);
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

  protected onSetOrientation(): void {
  }

  protected onSetAnimationHit(): void {
    this.setSprite('_idle');
  }

  protected animateIdle(): void {
    if (!this.sprite || !this.spritePlay) {
      if (!this.action()) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  protected animateHit(): void {
    if (!this.sprite || !this.spritePlay) {
      if (Math.random() < this.character.luck) {
        this.dungeon.hero.character.hitDamage(this.character, this.character.damage);
      }
      if (!this.action()) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  protected onKilledBy(by: Character): void {
    if (by && by instanceof HeroCharacter) {
      this.dungeon.log(`${this.character.name} killed by ${by.name}`);
      by.addXp(this.character.xp);
    }
  }

  protected onDead(): void {
    this.setAnimation(AnimationState.Idle);
    if (Math.random() < this.character.luck) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }

  protected onSetSprite(): void {
  }
}