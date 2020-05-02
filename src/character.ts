import {Resources} from "./resources";
import {DungeonMap, DungeonZIndexes, MapCell, DungeonObject} from "./dungeon.map";
import {Observable, ObservableVar} from "./observable";
import {UsableDrop, Weapon} from "./drop";
import {LinearCurve} from "./curves";
import {PathFinding} from "./pathfinding";
import {HeroAI} from "./hero";
import {Inventory} from "./inventory";
import {Animation, AnimationClip, AnimationCurveClip, SpriteAnimationClip} from "./animation";
import * as PIXI from "pixi.js";

const TILE_SIZE = 16;

export abstract class Character {
  readonly name: string;

  protected readonly _speed: ObservableVar<number>;
  get speed(): number {
    return this._speed.get();
  }

  protected readonly _healthMax: ObservableVar<number>;
  get healthMax(): Observable<number> {
    return this._healthMax;
  }

  protected readonly _health: ObservableVar<number>;
  get health(): Observable<number> {
    return this._health;
  }

  protected readonly _dead: ObservableVar<boolean>;
  get dead(): Observable<boolean> {
    return this._dead;
  }

  protected readonly _killedBy: ObservableVar<Character | null>;
  get killedBy(): Observable<Character | null> {
    return this._killedBy;
  }

  protected readonly _coins: ObservableVar<number>;

  get coins(): Observable<number> {
    return this._coins;
  }

  addCoins(coins: number): void {
    this._coins.update(c => c + coins);
  }

  decreaseCoins(coins: number): boolean {
    const current = this._coins.get();
    if (current >= coins) {
      this._coins.set(current - coins);
      return true;
    } else {
      return false;
    }
  }

  protected readonly _baseDamage: ObservableVar<number>;

  readonly inventory: Inventory = new Inventory(this);

  get weapon(): Weapon | null {
    return this.inventory.equipment.weapon.item.get() as Weapon || null;
  }

  get damage(): number {
    return this._baseDamage.get() + (this.weapon?.damage || 0);
  }

  protected constructor(options: {
    readonly name: string;
    readonly speed: number;
    readonly healthMax: number;
    readonly baseDamage: number;
    readonly coins: number;
  }) {
    this.name = options.name;
    this._speed = new ObservableVar(options.speed);
    this._healthMax = new ObservableVar(options.healthMax);
    this._health = new ObservableVar(options.healthMax);
    this._dead = new ObservableVar<boolean>(false);
    this._killedBy = new ObservableVar<Character | null>(null);
    this._baseDamage = new ObservableVar<number>(options.baseDamage);
    this._coins = new ObservableVar(options.coins);
  }

  heal(health: number): void {
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

export interface CharacterAI extends DungeonObject {
  readonly x: number;
  readonly y: number;

  readonly width: number;
  readonly height: number;
  readonly character: Character;
  readonly view: CharacterView;
  readonly dungeon: DungeonMap;

  readonly animation: AnimationController;

  setPosition(x: number, y: number): void;
  lookAt(character: CharacterAI): void;

  destroy(): void;
}

export enum ScanDirection {
  LEFT = 1,
  RIGHT = 2,
  AROUND = 4
}

export abstract class BaseCharacterAI implements DungeonObject {
  abstract readonly character: Character;

  readonly static: boolean = false;
  abstract readonly interacting: boolean;

  readonly view: CharacterView;
  readonly dungeon: DungeonMap;

  private _animation: AnimationController | null = null;
  private _x: number;
  private _y: number;

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  readonly width: number;
  readonly height: number;

  set animation(animation: AnimationController) {
    this._animation?.cancel();
    this._animation = animation;
    this._animation.start();
  }

  get animation(): AnimationController {
    return this._animation!;
  }

  protected constructor(dungeon: DungeonMap, options: CharacterViewOptions) {
    this.dungeon = dungeon;
    this.width = options.width;
    this.height = options.height;
    this._x = options.x;
    this._y = options.y;
    this.view = new BaseCharacterView(dungeon, options.zIndex, options.width, options.on_position);
  }

  init(): void {
    this.setPosition(this._x, this._y);
    this.character.killedBy.subscribe(this.handleKilledBy, this);
    this.character.dead.subscribe(this.handleDead, this);
    this.character.inventory.equipment.weapon.item.subscribe(this.onWeaponUpdate, this);
    this.idle();
    this.dungeon.ticker.add(this.update, this);
  }

  destroy(): void {
    this.dungeon.ticker.remove(this.update, this);
    this._animation?.cancel();
    this.character.killedBy.unsubscribe(this.handleKilledBy, this);
    this.character.dead.unsubscribe(this.handleDead, this);
    this.character.inventory.equipment.weapon.item.unsubscribe(this.onWeaponUpdate, this);
    this.dungeon.remove(this._x, this._y, this);
    this.view.destroy();
  }

  collide(object: DungeonObject): boolean {
    return this !== object;
  }

  abstract interact(hero: HeroAI): void;

  private handleKilledBy(by: Character | null): void {
    if (by) this.onKilledBy(by);
  }

  private handleDead(dead: boolean): void {
    if (dead) {
      this.onDead();
    }
  }

  private onWeaponUpdate(weapon: UsableDrop | null): void {
    this.view.setWeapon(weapon as Weapon);
  }

  protected abstract onKilledBy(by: Character): void;

  protected abstract onDead(): void;

  protected findDropCell(max_distance: number = 5): (MapCell | null) {
    return this.findCell(max_distance, cell => cell.hasFloor && !cell.hasObject && !cell.hasDrop);
  }

  protected findSpawnCell(max_distance: number = 5): (MapCell | null) {
    return this.findCell(max_distance, cell => cell.hasFloor && !cell.hasObject);
  }

  protected findCell(max_distance: number, predicate: (cell: MapCell) => boolean): (MapCell | null) {
    const pos_x = this.x;
    const pos_y = this.y;
    const is_left = this.view.isLeft;

    let closestCell: MapCell | null = null;
    let closestDistance: number | null = null;

    const metric = (a: MapCell) => {
      return Math.max(Math.abs(a.x - pos_x), Math.abs(a.y - pos_y)) +
        (a.y !== pos_y ? 0.5 : 0) + // boost X
        (a.x === pos_x && a.y === pos_y ? 0 : 1) + // boost self
        (is_left ? (a.x < pos_x ? 0 : 1) : (a.x > pos_x ? 0 : 0.5)); // boost side
    };

    const min_x = Math.max(0, pos_x - max_distance);
    const max_x = Math.min(this.dungeon.width - 1, pos_x + max_distance);
    const min_y = Math.max(0, pos_y - max_distance);
    const max_y = Math.min(this.dungeon.width - 1, pos_y + max_distance);

    for (let x = min_x; x <= max_x; x++) {
      for (let y = min_y; y <= max_y; y++) {
        const cell = this.dungeon.cell(x, y);
        if (cell.hasFloor && predicate(cell)) {
          const distance = metric(cell);
          if (closestDistance === null || closestDistance > distance) {
            closestCell = cell;
            closestDistance = distance;
          }
        }
      }
    }

    return closestCell;
  }

  protected move(mx: number, my: number): boolean {
    if (mx > 0) this.view.isLeft = false;
    if (mx < 0) this.view.isLeft = true;
    const new_x = this.x + mx;
    const new_y = this.y + my;
    if (this.dungeon.available(new_x, new_y, this)) {
      this.run(new_x, new_y);
      return true;
    } else {
      return false;
    }
  }

  protected findPath(character: CharacterAI): PIXI.Point[] {
    const dungeon = this.dungeon;
    const pf = new PathFinding(dungeon.width, dungeon.height);
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const cell = dungeon.cell(x, y);
        const m = cell.object;
        if (cell.hasFloor && (!cell.collide(this) || m === character)) {
          pf.clear(x, y);
        } else {
          pf.mark(x, y);
        }
      }
    }

    const start = new PIXI.Point(this.x, this.y);
    const end = new PIXI.Point(character.x, character.y);
    return pf.find(start, end);
  }

  protected idle(): void {
    this.animation = new IdleAnimationController(this);
  }

  protected run(new_x: number, new_y: number): void {
    this.animation = new RunAnimationController(this, new_x, new_y);
  }

  protected hit(): void {
    this.animation = new HitAnimationController(this);
  }

  abstract action(finished: boolean): boolean;

  private update(deltaTime: number): void {
    const animation = this._animation!;
    animation.update(deltaTime);
    const finished = !animation.isPlaying;
    if (!this.action(finished) && finished) {
      this.idle();
    }
  }

  setPosition(x: number, y: number): void {
    this.dungeon.remove(this._x, this._y, this);
    this._x = Math.floor(x);
    this._y = Math.floor(y);
    this.dungeon.set(this._x, this._y, this);
    this.view.setPosition(x, y);
  }

  lookAt(character: CharacterAI): void {
    if (character.x < this.x) this.view.isLeft = true;
    if (character.x > this.x) this.view.isLeft = false;
  }

  protected scanObjects(direction: ScanDirection, max_distance: number, predicate: (object: DungeonObject) => boolean): DungeonObject[] {
    const objects = this.scanCells(direction, max_distance, cell => cell.hasObject && predicate(cell.object!))
      .map(cell => cell.object!);
    const set = new Set(objects); // distinct
    return [...set];
  }

  protected scanCells(direction: ScanDirection, max_distance: number, predicate: (cell: MapCell) => boolean): MapCell[] {
    const pos_x = this.x;
    const pos_y = this.y;

    const scan_left = direction === ScanDirection.AROUND || direction === ScanDirection.LEFT;
    const scan_right = direction === ScanDirection.AROUND || direction === ScanDirection.RIGHT;

    const scan_x_min = scan_left ? Math.max(0, pos_x - max_distance) : pos_x;
    const scan_x_max = scan_right ? Math.min(this.dungeon.width - 1, pos_x + max_distance) : pos_x;

    const scan_y_min = Math.max(0, pos_y - max_distance);
    const scan_y_max = Math.min(this.dungeon.height - 1, pos_y + max_distance);

    const cells: MapCell[] = [];

    for (let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
      for (let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
        const cell = this.dungeon.cell(s_x, s_y);
        if (predicate(cell)) {
          cells.push(cell);
        }
      }
    }
    return cells;
  }

  protected raycastIsVisible(x1: number, y1: number): boolean {
    let x0 = this.x;
    let y0 = this.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);

    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let err = (dx > dy ? dx : -dy) / 2;

    while (true) {
      if (x0 === x1 && y0 === y1) break;

      let e2 = err;
      if (e2 > -dx) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dy) {
        err += dx;
        y0 += sy;
      }

      if (x0 === x1 && y0 === y1) break;

      const cell = this.dungeon.cell(x0, y0);
      if (!cell.hasFloor) return false;
      if (cell.collide(this)) return false;
    }

    return true;
  }
}

interface AnimationController {
  readonly isPlaying: boolean;
  start(): void;
  update(deltaTime: number): void;
  cancel(): void;
  finish(): void;
}

export class IdleAnimationController implements AnimationController {
  private readonly ai: CharacterAI;
  private readonly view: CharacterView;
  private readonly spriteName: string;

  private readonly animation: Animation

  constructor(ai: CharacterAI) {
    this.ai = ai;
    this.view = ai.view;
    this.spriteName = this.ai.character.name + '_idle';

    this.animation = new Animation();
  }

  get isPlaying(): boolean {
    return this.animation.isPlaying;
  }

  start(): void {
    this.animation.clear();
    this.animation.add(this.view.setSprite(this.spriteName, this.ai.character.speed));
    this.animation.start();
  }

  update(deltaTime: number): void {
    this.animation.update(deltaTime);
    if (!this.animation.isPlaying) {
      this.finish();
    }
  }

  cancel(): void {
    this.animation.stop();
  }

  finish(): void {
    this.animation.stop();
  }
}

export class RunAnimationController implements AnimationController {
  private readonly ai: CharacterAI;
  private readonly view: CharacterView;
  private readonly spriteName: string

  private readonly x: number;
  private readonly y: number;
  private readonly new_x: number;
  private readonly new_y: number;

  private readonly animation: Animation

  get isPlaying(): boolean {
    return this.animation.isPlaying;
  }

  constructor(ai: CharacterAI, new_x: number, new_y: number) {
    this.ai = ai;
    this.view = ai.view;
    this.spriteName = ai.character.name + '_run';

    this.x = this.ai.x;
    this.y = this.ai.y;
    this.new_x = new_x;
    this.new_y = new_y;

    this.animation = new Animation();
  }

  start(): void {
    const speed = this.ai.character.speed;
    this.ai.dungeon.set(this.new_x, this.new_y, this.ai);
    this.animation.clear();
    this.animation.add(this.view.setSprite(this.spriteName, speed));
    this.animation.add(new AnimationCurveClip(
      [this.x, this.y],
      [this.new_x, this.new_y],
      LinearCurve.matrix(2),
      this.view.sprite!.totalFrames,
      this.view.sprite!.animationSpeed,
      this.view.setPosition,
      this.view
    ));
    this.animation.start();
  }

  update(deltaTime: number): void {
    this.animation.update(deltaTime);
    if (!this.animation.isPlaying) {
      this.finish();
    }
  }

  cancel(): void {
    this.animation.stop();
    this.ai.dungeon.remove(this.x, this.y, this.ai);
    this.ai.dungeon.remove(this.new_x, this.new_y, this.ai);
    this.ai.setPosition(this.ai.x, this.ai.y);
  }

  finish(): void {
    this.animation.stop();
    this.ai.dungeon.remove(this.x, this.y, this.ai);
    this.ai.dungeon.remove(this.new_x, this.new_y, this.ai);
    this.ai.setPosition(this.new_x, this.new_y);
  }
}

export class HitAnimationController implements AnimationController {
  private readonly ai: CharacterAI;
  private readonly view: CharacterView;
  private readonly spriteName: string;

  private readonly animation: Animation

  get isPlaying(): boolean {
    return this.animation.isPlaying;
  }

  constructor(ai: CharacterAI) {
    this.ai = ai;
    this.view = ai.view;
    this.spriteName = ai.character.name + '_idle';

    this.animation = new Animation();
  }

  start(): void {
    const weapon = this.ai.character.weapon;
    const speed = weapon ? weapon.speed : this.ai.character.speed;

    this.animation.clear();
    this.animation.add(this.view.setSprite(this.spriteName, speed));
    if (weapon) {
      const weaponSprite = this.view.weaponSprite!;
      this.animation.add(new AnimationCurveClip(
        [0], [this.view.isLeft ? -90 : 90],
        t => [weapon.curve(t)],
        this.view.sprite!.totalFrames,
        this.view.sprite!.animationSpeed,
        (angle) => weaponSprite.angle = angle,
        this
      ));
    }
    this.animation.start();
  }

  update(deltaTime: number): void {
    this.animation.update(deltaTime);
    if (!this.animation.isPlaying) {
      this.finish();
    }
  }

  cancel(): void {
    this.animation.stop();
    let weapon = this.view.weaponSprite;
    if (weapon) {
      weapon.angle = 0;
    }
  }

  finish(): void {
    this.animation.stop();
    let weapon = this.view.weaponSprite;
    if (weapon) {
      weapon.angle = 0;
    }
  }
}

export interface CharacterViewOptions {
  readonly width: number
  readonly height: number
  readonly x: number
  readonly y: number
  readonly zIndex: number
  readonly on_position?: (x: number, y: number) => void;
}

export interface CharacterView {
  readonly x: number;
  readonly y: number;

  isLeft: boolean;

  readonly sprite: PIXI.AnimatedSprite | null;
  readonly weaponSprite: PIXI.Sprite | null;

  setPosition(x: number, y: number): void;
  setSprite(name: string, speed: number): AnimationClip;
  setWeapon(weapon: Weapon | null): void;

  destroy(): void
}

export class BaseCharacterView extends PIXI.Container implements CharacterView {
  private readonly resources: Resources;

  private readonly _baseZIndex: number;
  private readonly _gridWidth: number;
  private _isLeft: boolean = false;
  private _sprite: PIXI.AnimatedSprite | null = null;
  private _weaponSprite: PIXI.Sprite | null = null;
  private readonly onPosition: ((x: number, y: number) => void) | null;

  get isLeft(): boolean {
    return this._isLeft;
  }

  set isLeft(is_left: boolean) {
    this._isLeft = is_left;
    this.updateSpriteOrientation();
    this.updateWeaponOrientation();
  }

  get sprite() {
    return this._sprite;
  }

  get weaponSprite() {
    return this._weaponSprite;
  }

  constructor(dungeon: DungeonMap, zIndex: number, grid_width: number, on_position?: (x: number, y: number) => void) {
    super();
    this.resources = dungeon.controller.resources;
    this._baseZIndex = zIndex;
    this._gridWidth = grid_width;
    this.onPosition = on_position || null;
    dungeon.container.addChild(this);
  }

  destroy(): void {
    this._sprite?.destroy();
    this._sprite = null;
    this._weaponSprite?.destroy();
    this._weaponSprite = null;
    super.destroy();
  }

  setPosition(x: number, y: number): void {
    // pixel perfect
    const t_x = Math.floor(x * TILE_SIZE);
    const t_y = Math.floor(y * TILE_SIZE);
    this.position.set(t_x, t_y);
    this.zIndex = this._baseZIndex + Math.floor(y) * DungeonZIndexes.row;
    if (this.onPosition) {
      this.onPosition(t_x, t_y);
    }
  }

  setSprite(name: string, speed: number): AnimationClip {
    this._sprite?.destroy();
    this._sprite = this.resources.animated(name, {
      autoUpdate: false,
      loop: false,
      animationSpeed: 0.2 * speed,
    });
    this._sprite.anchor.set(0, 1);
    this._sprite.position.y = TILE_SIZE - 2;
    this._sprite.zIndex = 1;
    this.addChild(this._sprite);
    this.updateSpriteOrientation();
    this.updateWeaponOrientation();
    return new SpriteAnimationClip(this._sprite);
  }

  setWeapon(weapon: Weapon | null): void {
    this._weaponSprite?.destroy();
    this._weaponSprite = null;
    if (weapon) {
      this._weaponSprite = this.resources.sprite(weapon.spriteName);
      this._weaponSprite.zIndex = 2;
      this._weaponSprite.position.x = TILE_SIZE;
      this._weaponSprite.position.y = TILE_SIZE - 4;
      if (this.isLeft) {
        this._weaponSprite.position.x = 0;
        this._weaponSprite.scale.x = -1;
      }
      this._weaponSprite.anchor.set(0.5, 1);
      this.addChild(this._weaponSprite);
      this.sortChildren();
    }
  }

  private updateSpriteOrientation(): void {
    if (this._sprite) {
      if (this._isLeft) {
        this._sprite.position.x = this._sprite.width;
        if (this._sprite.width > this._gridWidth * TILE_SIZE) {
          this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
        }
        this._sprite.scale.x = -1;
      } else {
        this._sprite.position.x = 0;
        if (this._sprite.width > this._gridWidth * TILE_SIZE) {
          this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
        }
        this._sprite.scale.x = 1;
      }
    }
  }

  private updateWeaponOrientation(): void {
    if (this._weaponSprite) {
      if (this.isLeft) {
        this._weaponSprite.position.x = 0;
        this._weaponSprite.scale.x = -1;
      } else {
        this._weaponSprite.position.x = TILE_SIZE * this._gridWidth;
        this._weaponSprite.scale.x = 1;
      }
    }
  }
}
