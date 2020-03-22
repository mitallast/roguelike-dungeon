import {Resources} from "./resources";
import {MapCell, DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {ObservableVar, Observable} from "./observable";
import {UsableDrop} from "./drop";
import * as PIXI from "pixi.js";

const TILE_SIZE = 16;

export abstract class Character {
  readonly name: string;

  protected readonly _speed: ObservableVar<number>;

  get speed(): number {
    return this._speed.get();
  }

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
    this._speed = new ObservableVar(options.speed);
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

export interface CharacterAI {
  destroy(): void;
}

export abstract class BaseCharacterAI implements CharacterAI {
  abstract readonly character: Character;
  readonly view: CharacterView;
  readonly dungeon: DungeonMap;

  private _animation: Animation | null = null;

  set animation(animation: Animation) {
    this._animation?.terminate();
    this._animation = animation;
    this._animation.run()
  }

  protected constructor(dungeon: DungeonMap, options: CharacterViewOptions) {
    this.dungeon = dungeon;
    this.view = new CharacterView(this, dungeon.controller.resources, options);
  }

  init(): void {
    this.dungeon.container.addChild(this.view);
    this.resetPosition(this.view.pos_x, this.view.pos_y);
    this.character.killedBy.subscribe(this.handleKilledBy, this);
    this.character.dead.subscribe(this.handleDead, this);
    this.idle();
  }

  destroy(): void {
    this._animation?.terminate();
    this.character.killedBy.unsubscribe(this.handleKilledBy, this);
    this.character.dead.unsubscribe(this.handleDead, this);
    this.clearMap(this.view.pos_x, this.view.pos_y);
    this.clearMap(this.view.new_x, this.view.new_y);
  }

  private handleKilledBy(by: Character | null): void {
    if (by) this.onKilledBy(by);
  }

  private handleDead(dead: boolean): void {
    if (dead) {
      this.onDead();
    }
  }

  protected abstract onKilledBy(by: Character): void;

  protected abstract onDead(): void;

  protected findDropCell(): (MapCell | null) {
    const max_distance = 5;
    const pos_x = this.view.pos_x;
    const pos_y = this.view.pos_y;
    const is_left = this.view.is_left;
    const is_dead = this.character.dead.get();

    let closestCell: MapCell | null = null;
    let closestDistance: number | null = null;

    const metric = (a: MapCell) => {
      return Math.sqrt(Math.pow(a.x - pos_x, 2) + Math.pow(a.y - pos_y, 2)) +
        (a.y !== pos_y ? 0.5 : 0) + // boost X
        (is_left ? (a.x < pos_x ? 0 : 1) : (a.x > pos_x ? 0 : 0.5)); // boost side
    };

    for (let x = Math.max(0, pos_x - max_distance); x < pos_x + max_distance; x++) {
      for (let y = Math.max(0, pos_y - max_distance); y < pos_y + max_distance; y++) {
        if (!(x === pos_x && y === pos_y) || is_dead) {
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

  move(mx: number, my: number): boolean {
    if (mx > 0) this.view.is_left = false;
    if (mx < 0) this.view.is_left = true;
    const new_x = this.view.pos_x + mx;
    const new_y = this.view.pos_y + my;
    for (let dx = 0; dx < this.view.grid_width; dx++) {
      for (let dy = 0; dy < this.view.grid_height; dy++) {
        // check is floor exists
        if (!this.dungeon.cell(new_x + dx, new_y - dy).hasFloor) {
          return false;
        }
        // check is no monster
        const m = this.dungeon.cell(new_x + dx, new_y - dy).character;
        if (m && m !== this.character) {
          return false;
        }
      }
    }
    this.markNewPosition(new_x, new_y);
    this.run();
    return true;
  }

  idle(): void {
    this.animation = new IdleAnimation(this.view, this.dungeon.ticker, {
      sprite: this.character.name + '_idle',
      speed: this.character.speed,
      update: (animation) => {
        if (this.action(false)) {
          animation.terminate();
        }
      },
      finish: () => {
        if (!this.action(true)) {
          this.idle();
        }
      }
    });
  }

  run(): void {
    this.animation = new RunAnimation(this.view, this.dungeon.ticker, {
      sprite: this.character.name + '_run',
      speed: this.character.speed,
      update: (animation) => this.updatePosition(animation.spriteTime),
      finish: () => {
        this.resetPosition(this.view.new_x, this.view.new_y);
        if (!this.action(true)) {
          this.idle();
        }
      }
    });
  }

  abstract hit(): void;

  abstract action(finished: boolean): boolean;

  protected abstract onPositionChanged(): void;

  resetPosition(x: number, y: number): void {
    this.clearMap(this.view.pos_x, this.view.pos_y);
    this.clearMap(this.view.new_x, this.view.new_y);
    this.view.pos_x = x;
    this.view.pos_y = y;
    this.markNewPosition(this.view.pos_x, this.view.pos_y);
    this.updatePosition();
  }

  updatePosition(spriteTime: number = 0): void {
    let pos_x = this.view.pos_x;
    let pos_y = this.view.pos_y;
    let new_x = this.view.new_x;
    let new_y = this.view.new_y;
    if (pos_x !== new_x || pos_y !== new_y) {
      const delta = spriteTime / this.view.sprite!.totalFrames;
      pos_x += (new_x - pos_x) * delta;
      pos_y += (new_y - pos_y) * delta;
    }
    this.view.position.set(pos_x * TILE_SIZE, pos_y * TILE_SIZE);
    this.onPositionChanged();
  }

  clearMap(x: number, y: number): void {
    if (x >= 0 && y >= 0) {
      for (let dx = 0; dx < this.view.grid_width; dx++) {
        for (let dy = 0; dy < this.view.grid_height; dy++) {
          const cell = this.dungeon.cell(x + dx, y - dy);
          const m = cell.character;
          if (m && (m === this.character)) {
            cell.character = null;
          }
        }
      }
    }
  }

  markNewPosition(x: number, y: number) {
    for (let dx = 0; dx < this.view.grid_width; dx++) {
      for (let dy = 0; dy < this.view.grid_height; dy++) {
        this.dungeon.cell(x + dx, y - dy).character = this.character;
      }
    }
    this.view.new_x = x;
    this.view.new_y = y;
  }

  protected scan(is_left: boolean, max_distance: number, predicate: (character: Character) => boolean): Character[] {
    const scan_x_min = is_left ? Math.max(0, this.view.pos_x - max_distance) : this.view.pos_x;
    const scan_x_max = is_left ? this.view.pos_x : Math.min(this.dungeon.width, this.view.pos_x + max_distance);

    const scan_y_min = Math.max(0, this.view.pos_y - max_distance);
    const scan_y_max = Math.min(this.dungeon.height - 1, this.view.pos_y + max_distance);

    const set = new Set<Character>();

    for (let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
      for (let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
        if (!(s_x === this.view.pos_x && s_y === this.view.pos_y)) {
          const cell = this.dungeon.cell(s_x, s_y);
          const character = cell.character;
          if (character && predicate(character)) {
            set.add(character);
          }
        }
      }
    }
    return [...set];
  }
}

interface AnimationOptions {
  readonly sprite: string;
  readonly speed: number;
  readonly start?: (animation: Animation) => void;
  readonly update?: (animation: Animation) => void;
  readonly finish: (animation: Animation) => void;
}

export abstract class Animation {
  protected readonly view: CharacterView;
  protected readonly ticker: PIXI.Ticker;

  protected readonly sprite: string;
  protected readonly speed: number;
  protected readonly on_start: ((animation: Animation) => void) | null;
  protected readonly on_update: ((animation: Animation) => void) | null;
  protected readonly on_finish: ((animation: Animation) => void);

  protected _spriteTime: number = 0;
  protected _spritePlay: boolean = false;
  protected _terminated: boolean = false;

  get spriteTime(): number {
    return this._spriteTime;
  }

  protected constructor(view: CharacterView, ticker: PIXI.Ticker, options: AnimationOptions) {
    this.view = view;
    this.ticker = ticker;
    this.sprite = options.sprite;
    this.speed = options.speed;
    this.on_start = options.start || null;
    this.on_update = options.update || null;
    this.on_finish = options.finish;
  }

  run(): void {
    this._spritePlay = true;
    this._terminated = false;
    this.start();
    this.ticker.add(this.tick, this);
    if (this.on_start) this.on_start(this);
  }

  private tick(deltaTime: number): void {
    this.updateSprite(deltaTime);
    this.update(deltaTime);
    if (this.on_update) this.on_update(this);
    if (!this._terminated && !this._spritePlay) {
      this.terminate();
      this.finish();
      if (this.on_finish) this.on_finish(this);
    }
  }

  terminate(): void {
    if (!this._terminated) {
      this._terminated = true;
      this.ticker.remove(this.tick, this);
    }
  }

  protected abstract start(): void;

  protected abstract update(deltaTime: number): void;

  protected abstract finish(): void;

  private updateSprite(deltaTime: number): void {
    const sprite = this.view.sprite!;
    const elapsed = sprite.animationSpeed * deltaTime;
    const previousFrame = sprite.currentFrame;
    this._spriteTime += elapsed;

    let currentFrame = Math.floor(this._spriteTime) % sprite.totalFrames;
    if (currentFrame < 0) {
      currentFrame += sprite.totalFrames;
    }

    if (this._spriteTime < 0) {
      this._spriteTime = 0;
      this._spritePlay = false;
    } else if (this._spriteTime >= sprite.totalFrames) {
      this._spriteTime = sprite.totalFrames - 1;
      this._spritePlay = false;
    } else if (previousFrame !== currentFrame) {
      sprite.gotoAndStop(currentFrame);
    }
  }
}

export class IdleAnimation extends Animation {
  constructor(view: CharacterView, ticker: PIXI.Ticker, options: AnimationOptions) {
    super(view, ticker, options);
  }

  protected start(): void {
    this.view.setSprite(this.sprite, this.speed);
  }

  protected update(_deltaTime: number): void {
  }

  protected finish(): void {
  }
}

export class RunAnimation extends Animation {
  constructor(view: CharacterView, ticker: PIXI.Ticker, options: AnimationOptions) {
    super(view, ticker, options);
  }

  protected start(): void {
    this.view.setSprite(this.sprite, this.speed);
  }

  protected update(_deltaTime: number): void {
  }

  protected finish(): void {
  }
}

export class HitAnimation extends Animation {
  constructor(view: CharacterView, ticker: PIXI.Ticker, options: AnimationOptions) {
    super(view, ticker, options);
  }

  protected start(): void {
    this.view.setSprite(this.sprite, this.speed);
  }

  protected update(_deltaTime: number): void {
    const weapon = this.view.weaponSprite;
    if (weapon) {
      const sprite = this.view.sprite!;
      const delta = this._spriteTime / sprite.totalFrames;
      weapon.angle = (this.view.is_left ? -90 : 90) * delta;
    }
  }

  protected finish(): void {
    const weapon = this.view.weaponSprite;
    if (weapon) {
      weapon.angle = 0;
    }
  }
}

export interface CharacterViewOptions {
  width?: number
  height?: number
  x: number
  y: number
}

export class CharacterView extends PIXI.Container {
  private readonly ai: CharacterAI;
  private readonly resources: Resources;

  readonly grid_width: number; // grid width
  readonly grid_height: number; // grid width
  pos_x: number; // grid pos
  pos_y: number; // grid pos
  new_x: number;
  new_y: number;
  private _is_left: boolean = false;

  get is_left(): boolean {
    return this._is_left;
  }

  set is_left(is_left: boolean) {
    this._is_left = is_left;
    this.updateSpriteOrientation();
    this.updateWeaponOrientation();
  }

  sprite: PIXI.AnimatedSprite | null = null;

  weaponSprite: PIXI.Sprite | null = null;

  constructor(ai: CharacterAI, resources: Resources, options: CharacterViewOptions) {
    super();
    this.ai = ai;
    this.resources = resources;
    this.grid_width = options.width || 1;
    this.grid_height = options.height || 1;
    this.pos_x = options.x;
    this.pos_y = options.y;
    this.new_x = options.x;
    this.new_y = options.y;
    this.zIndex = DungeonZIndexes.character;
  }

  destroy(): void {
    this.sprite?.destroy();
    this.sprite = null;
    this.weaponSprite?.destroy();
    this.weaponSprite = null;
    this.ai.destroy();
    super.destroy();
  }

  setSprite(name: string, speed: number): void {
    this.sprite?.destroy();
    this.sprite = this.resources.animated(name, false);
    this.sprite.loop = false;
    this.sprite.animationSpeed = speed;
    this.sprite.anchor.set(0, 1);
    this.sprite.position.y = TILE_SIZE - 2;
    if (this.sprite.width > this.grid_width * TILE_SIZE) {
      this.sprite.position.x = 0 - (this.sprite.width - this.grid_width * TILE_SIZE) / 2;
    }
    this.sprite.zIndex = 1;
    this.addChild(this.sprite);
    this.updateSpriteOrientation();
    this.updateWeaponOrientation();
  }

  private updateSpriteOrientation(): void {
    if (this.sprite) {
      if (this._is_left) {
        this.sprite.position.x = this.sprite.width;
        if (this.sprite.width > this.grid_width * TILE_SIZE) {
          this.sprite.position.x += (this.sprite.width - this.grid_width * TILE_SIZE) / 2;
        }
        this.sprite.scale.x = -1;
      } else {
        this.sprite.position.x = 0;
        if (this.sprite.width > this.grid_width * TILE_SIZE) {
          this.sprite.position.x -= (this.sprite.width - this.grid_width * TILE_SIZE) / 2;
        }
        this.sprite.scale.x = 1;
      }
    }
  }

  setWeapon(weapon: UsableDrop | null): void {
    this.weaponSprite?.destroy();
    this.weaponSprite = null;
    if (weapon) {
      this.weaponSprite = weapon.sprite();
      this.weaponSprite.zIndex = 2;
      this.weaponSprite.position.x = TILE_SIZE;
      this.weaponSprite.position.y = TILE_SIZE - 4;
      if (this.is_left) {
        this.weaponSprite.position.x = 0;
        this.weaponSprite.scale.x = -1;
      }
      this.weaponSprite.anchor.set(0.5, 1);
      this.addChild(this.weaponSprite);
      this.sortChildren();
    }
  }

  private updateWeaponOrientation(): void {
    if (this.weaponSprite) {
      if (this.is_left) {
        this.weaponSprite.position.x = 0;
        this.weaponSprite.scale.x = -1;
      } else {
        this.weaponSprite.position.x = TILE_SIZE;
        this.weaponSprite.scale.x = 1;
      }
    }
  }
}
