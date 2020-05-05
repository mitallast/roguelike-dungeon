import * as PIXI from "pixi.js";
import {DungeonMap, DungeonMapCell, DungeonObject} from "../dungeon";
import {Observable, ObservableVar} from "../observable";
import {UsableDrop, Weapon} from "../drop";
import {PathFinding} from "../pathfinding";
import {HeroAI} from "./Hero";
import {Inventory} from "../inventory";
import {CharacterView, CharacterViewOptions, DefaultCharacterView} from "./CharacterView";
import {
  AnimationController,
  HitAnimationController,
  IdleAnimationController,
  RunAnimationController
} from "./AnimationController";

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
    this.view = new DefaultCharacterView(dungeon, options.zIndex, options.width, options.onPosition);
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

  protected findDropCell(maxDistance: number = 5): (DungeonMapCell | null) {
    return this.findCell(maxDistance, cell => cell.hasFloor && !cell.hasObject && !cell.hasDrop);
  }

  protected findSpawnCell(maxDistance: number = 5): (DungeonMapCell | null) {
    return this.findCell(maxDistance, cell => cell.hasFloor && !cell.hasObject);
  }

  protected findCell(maxDistance: number, predicate: (cell: DungeonMapCell) => boolean): (DungeonMapCell | null) {
    const posX = this.x;
    const posY = this.y;
    const isLeft = this.view.isLeft;

    let closestCell: DungeonMapCell | null = null;
    let closestDistance: number | null = null;

    const metric = (a: DungeonMapCell): number => {
      return Math.max(Math.abs(a.x - posX), Math.abs(a.y - posY)) +
        (a.y !== posY ? 0.5 : 0) + // boost X
        (a.x === posX && a.y === posY ? 0 : 1) + // boost self
        (isLeft ? (a.x < posX ? 0 : 1) : (a.x > posX ? 0 : 0.5)); // boost side
    };

    const minX = Math.max(0, posX - maxDistance);
    const maxX = Math.min(this.dungeon.width - 1, posX + maxDistance);
    const minY = Math.max(0, posY - maxDistance);
    const maxY = Math.min(this.dungeon.width - 1, posY + maxDistance);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
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
    const newX = this.x + mx;
    const newY = this.y + my;
    if (this.dungeon.available(newX, newY, this)) {
      this.run(newX, newY);
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

  protected run(newX: number, newY: number): void {
    this.animation = new RunAnimationController(this, newX, newY);
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

  protected scanObjects(direction: ScanDirection, maxDistance: number, predicate: (object: DungeonObject) => boolean): DungeonObject[] {
    const objects = this.scanCells(direction, maxDistance, cell => cell.hasObject && predicate(cell.object!))
      .map(cell => cell.object!);
    const set = new Set(objects); // distinct
    return [...set];
  }

  protected scanCells(direction: ScanDirection, maxDistance: number, predicate: (cell: DungeonMapCell) => boolean): DungeonMapCell[] {
    const posX = this.x;
    const posY = this.y;

    const scanLeft = direction === ScanDirection.AROUND || direction === ScanDirection.LEFT;
    const scanRight = direction === ScanDirection.AROUND || direction === ScanDirection.RIGHT;

    const scanMinX = scanLeft ? Math.max(0, posX - maxDistance) : posX;
    const scanMaxX = scanRight ? Math.min(this.dungeon.width - 1, posX + maxDistance) : posX;

    const scanMinY = Math.max(0, posY - maxDistance);
    const scanMaxY = Math.min(this.dungeon.height - 1, posY + maxDistance);

    const cells: DungeonMapCell[] = [];

    for (let scanY = scanMinY; scanY <= scanMaxY; scanY++) {
      for (let scanX = scanMinX; scanX <= scanMaxX; scanX++) {
        const cell = this.dungeon.cell(scanX, scanY);
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

    for (; ;) {
      if (x0 === x1 && y0 === y1) break;

      const e2 = err;
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