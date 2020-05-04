import {Resources} from "./resources";
import {DungeonMap, DungeonZIndexes, MapCell, DungeonObject} from "./dungeon.map";
import {Observable, ObservableVar} from "./observable";
import {UsableDrop, Weapon, WeaponAnimation} from "./drop";
import {LinearCurve} from "./curves";
import {PathFinding} from "./pathfinding";
import {HeroAI} from "./hero";
import {Inventory} from "./inventory";
import {
  Animation,
  AnimationClip,
  AnimationCurveClip,
  AnimationEventClip,
  AnimationKeyFrameClip,
  SpriteAnimationClip
} from "./animation";
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
    this.view = new DefaultCharacterView(dungeon, options.zIndex, options.width, options.on_position);
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
    this.view.weapon.setWeapon(weapon as (Weapon | null));
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

export interface AnimationController {
  readonly isPlaying: boolean;
  start(): void;
  update(deltaTime: number): void;
  cancel(): void;
  finish(): void;
}

export abstract class BaseAnimationController implements AnimationController {
  protected readonly ai: CharacterAI;
  protected readonly view: CharacterView;
  protected readonly spriteName: string;

  protected readonly animation: Animation

  protected constructor(ai: CharacterAI, spriteName: string) {
    this.ai = ai;
    this.view = ai.view;
    this.spriteName = spriteName;
    this.animation = new Animation();
  }

  get isPlaying(): boolean {
    return this.animation.isPlaying;
  }

  abstract start(): void;

  protected animateWeapon(animation: WeaponAnimation, animationSpeed: number): void {
    const positionClip = new AnimationEventClip(animationSpeed, this.view.weapon.setPosition, this.view.weapon);
    positionClip.addEvents(animation.pos);
    this.animation.add(positionClip);

    const angleClip = new AnimationKeyFrameClip<[number]>(animationSpeed, this.view.weapon.setAngle, this.view.weapon);
    angleClip.addFrames(animation.angle);
    this.animation.add(angleClip);
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

export class IdleAnimationController extends BaseAnimationController {
  constructor(ai: CharacterAI) {
    super(ai, ai.character.name + '_idle');
  }

  start(): void {
    const clip = this.view.animation(this.spriteName, this.ai.character.speed * 0.2);
    this.animation.add(clip);
    const weapon = this.ai.character.weapon;
    if (weapon) {
      this.animateWeapon(weapon.animations.idle, clip.animationSpeed);
    }
    this.animation.start();
  }
}

export class RunAnimationController extends BaseAnimationController {
  private readonly _x: number;
  private readonly _y: number;
  private readonly _new_x: number;
  private readonly _new_y: number;

  constructor(ai: CharacterAI, new_x: number, new_y: number) {
    super(ai, ai.character.name + '_run');
    this._x = this.ai.x;
    this._y = this.ai.y;
    this._new_x = new_x;
    this._new_y = new_y;
  }

  start(): void {
    const clip = this.view.animation(this.spriteName, this.ai.character.speed * 0.2);
    this.ai.dungeon.set(this._new_x, this._new_y, this.ai);
    this.animation.clear();
    this.animation.add(clip);
    this.animation.add(new AnimationCurveClip(
      LinearCurve.matrix(
        [this._x, this._y],
        [this._new_x, this._new_y],
      ),
      clip.duration,
      clip.animationSpeed,
      this.view.setPosition,
      this.view
    ));

    const weapon = this.ai.character.weapon;
    if (weapon) {
      this.animateWeapon(weapon.animations.run, clip.animationSpeed);
    }
    this.animation.start();
  }

  cancel(): void {
    super.cancel();
    this.ai.dungeon.remove(this._x, this._y, this.ai);
    this.ai.dungeon.remove(this._new_x, this._new_y, this.ai);
    this.ai.setPosition(this.ai.x, this.ai.y);
  }

  finish(): void {
    super.finish();
    this.ai.dungeon.remove(this._x, this._y, this.ai);
    this.ai.dungeon.remove(this._new_x, this._new_y, this.ai);
    this.ai.setPosition(this._new_x, this._new_y);
  }
}

export class HitAnimationController extends BaseAnimationController {
  constructor(ai: CharacterAI) {
    super(ai, ai.character.name + '_idle');
  }

  start(): void {
    const weapon = this.ai.character.weapon;
    const clip = this.view.animation(this.spriteName, (weapon ? weapon.speed : this.ai.character.speed) * 0.2);
    this.animation.clear();
    this.animation.add(clip);

    if (weapon) {
      this.animateWeapon(weapon.animations.hit, clip.animationSpeed);
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
  }

  finish(): void {
    this.animation.stop();
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
  readonly point: PIXI.IPoint;
  isLeft: boolean;

  readonly weapon: WeaponView;

  setPosition(x: number, y: number): void;
  animation(spriteName: string, speed: number): AnimationClip;
  destroy(): void
}

export class DefaultCharacterView extends PIXI.Container implements CharacterView {
  private readonly _resources: Resources;

  private readonly _baseZIndex: number;
  private readonly _gridWidth: number;
  private _isLeft: boolean = false;
  private _sprite: PIXI.AnimatedSprite | null = null;
  private readonly _weapon: DefaultWeaponView;

  readonly point: PIXI.IPoint = new PIXI.Point(0, 0);
  private readonly _onPosition: ((x: number, y: number) => void) | null;

  get isLeft(): boolean {
    return this._isLeft;
  }

  set isLeft(isLeft: boolean) {
    this._isLeft = isLeft;
    this.updatePosition();
  }

  get weapon(): WeaponView {
    return this._weapon;
  }

  constructor(dungeon: DungeonMap, zIndex: number, gridWidth: number, onPosition?: (x: number, y: number) => void) {
    super();
    this._resources = dungeon.controller.resources;
    this._baseZIndex = zIndex;
    this._gridWidth = gridWidth;
    this._onPosition = onPosition || null;
    this._weapon = new DefaultWeaponView(this._resources);
    this._weapon.zIndex = 2;
    this._weapon.position.set(TILE_SIZE * this._gridWidth, TILE_SIZE - 4);
    this.addChild(this._weapon);
    dungeon.container.addChild(this);
  }

  setPosition(x: number, y: number): void {
    // pixel perfect
    const tx = Math.round(x * TILE_SIZE * 2) / 2;
    const ty = Math.round(y * TILE_SIZE * 2) / 2;
    this.point.set(tx, ty);
    this.updatePosition();
    this.zIndex = this._baseZIndex + Math.floor(y) * DungeonZIndexes.row;
    if (this._onPosition) {
      this._onPosition(tx, ty);
    }
  }

  private updatePosition() {
    // process left/right direction
    this.scale.set(this._isLeft ? -1 : 1, 1);
    // if left, add offset x
    this.position.set(this.point.x + (this._isLeft ? this._gridWidth * TILE_SIZE : 0), this.point.y);
  }

  animation(spriteName: string, speed: number): AnimationClip {
    this._sprite?.destroy();
    this._sprite = this._resources.animated(spriteName, {
      autoUpdate: false,
      loop: false,
      animationSpeed: speed,
    });
    this._sprite.anchor.set(0, 1);
    this._sprite.position.y = TILE_SIZE - 2;
    this._sprite.position.x = 0;
    if (this._sprite.width > this._gridWidth * TILE_SIZE) {
      this._sprite.position.x -= (this._sprite.width - this._gridWidth * TILE_SIZE) / 2;
    }
    this._sprite.zIndex = 1;
    this.addChild(this._sprite);
    return new SpriteAnimationClip(this._sprite);
  }
}

export interface WeaponView {
  setWeapon(weapon: Weapon | null): void;
  setPosition(x: number, y: number): void;
  setAngle(angle: number): void;
  destroy(): void;
}

export class DefaultWeaponView extends PIXI.Container implements WeaponView {
  private readonly _resources: Resources;
  private _sprite: PIXI.Sprite | null = null;

  constructor(resources: Resources) {
    super();
    this._resources = resources;
  }

  destroy() {
    this._sprite?.destroy();
    this._sprite = null;
    super.destroy();
  }

  setWeapon(weapon: Weapon | null): void {
    this._sprite?.destroy();
    this._sprite = null;
    if (weapon) {
      this._sprite = this._resources.sprite(weapon.spriteName);
      this._sprite.anchor.set(0.5, 1);
      this.addChild(this._sprite);
    }
  }

  setAngle(angle: number): void {
    if (this._sprite) {
      this._sprite.angle = angle;
    }
  }

  setPosition(x: number, y: number): void {
    if (this._sprite) {
      this._sprite.position.set(x, y);
    }
  }
}