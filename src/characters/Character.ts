import * as PIXI from "pixi.js";
import {DungeonMap, DungeonMapCell, DungeonObject} from "../dungeon";
import {Observable, ObservableVar} from "../observable";
import {UsableDrop, Weapon, WeaponAnimation} from "../drop";
import {PathFinding} from "../pathfinding";
import {HeroController} from "./Hero";
import {Inventory} from "../inventory";
import {CharacterView, CharacterViewOptions} from "./CharacterView";
import {Animator} from "./Animator";
import {FiniteStateMachine} from "../fsm";

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

export interface CharacterController extends DungeonObject {
  readonly x: number;
  readonly y: number;
  readonly newX: number;
  readonly newY: number;

  readonly width: number;
  readonly height: number;
  readonly character: Character;
  readonly view: CharacterView;
  readonly animator: Animator;
  readonly dungeon: DungeonMap;

  setPosition(x: number, y: number): void;
  setDestination(x: number, y: number): void;
  hasDestination(): boolean;
  moveToDestination(): void;
  resetDestination(): void;
  lookAt(character: CharacterController): void;

  destroy(): void;
}

export const enum ScanDirection {
  LEFT = 1,
  RIGHT = 2,
  AROUND = 4
}

export abstract class BaseCharacterController implements CharacterController {
  abstract readonly character: Character;

  readonly static: boolean = false;
  abstract readonly interacting: boolean;

  readonly view: CharacterView;
  readonly animator: Animator;
  readonly dungeon: DungeonMap;

  private _x: number;
  private _y: number;
  private _newX: number = -1;
  private _newY: number = -1;

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get newX(): number {
    return this._newX;
  }

  get newY(): number {
    return this._newY;
  }

  readonly width: number;
  readonly height: number;

  protected abstract readonly _fsm: FiniteStateMachine<any>;

  protected constructor(dungeon: DungeonMap, options: CharacterViewOptions) {
    this.dungeon = dungeon;
    this.width = options.width;
    this.height = options.height;
    this._x = options.x;
    this._y = options.y;
    this.view = new CharacterView(
      dungeon.layer,
      dungeon.controller.resources,
      options.zIndex,
      options.width,
      options.onPosition
    );
    this.animator = new Animator(this.view);
  }

  init(): void {
    this.setPosition(this._x, this._y);
    this.character.killedBy.subscribe(this.handleKilledBy, this);
    this.character.dead.subscribe(this.handleDead, this);
    this.character.inventory.equipment.weapon.item.subscribe(this.onWeaponUpdate, this);
    this._fsm.start();
    this.dungeon.ticker.add(this._fsm.update, this._fsm);
  }

  destroy(): void {
    this.dungeon.ticker.remove(this._fsm.update, this._fsm);
    // this._fsm.stop(); // @todo implement stop?
    this.character.killedBy.unsubscribe(this.handleKilledBy, this);
    this.character.dead.unsubscribe(this.handleDead, this);
    this.character.inventory.equipment.weapon.item.unsubscribe(this.onWeaponUpdate, this);
    this.dungeon.remove(this._x, this._y, this);
    if (this._newX !== -1 && this._newY !== -1) {
      this.dungeon.remove(this._newX, this._newY, this);
    }
    this.view.destroy();
  }

  collide(object: DungeonObject): boolean {
    return this !== object;
  }

  distanceTo(that: CharacterController): number {
    /**
     * https://stackoverflow.com/questions/4449285/efficient-algorithm-for-shortest-distance-between-two-line-segments-in-1d
     *
     * <code>d = (s1 max s2 - e1 min e2) max 0</code>
     *
     * @param s1 first segment start
     * @param e1 first segment end
     * @param s2 second segment start
     * @param e2 second segment end
     * @return distance between two line segments in 1d
     */
    const segmentDistance = (s1: number, e1: number, s2: number, e2: number): number => {
      return Math.max(0, Math.max(s1, s2) - Math.min(e1, e2));
    };
    // Chebyshev distance
    const dx = segmentDistance(this.x, this.x + this.width, that.x, that.x + that.width);
    const dy = segmentDistance(this.y, this.y + this.height, that.y, that.y + that.height);

    return Math.max(dx, dy);
  }

  abstract interact(hero: HeroController): void;

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

  findPath(character: CharacterController): PIXI.Point[] {
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

  setPosition(x: number, y: number): void {
    this.resetDestination();
    this.dungeon.remove(this._x, this._y, this);
    this._x = Math.floor(x);
    this._y = Math.floor(y);
    this.dungeon.set(this._x, this._y, this);
    this.view.setPosition(x, y);
  }

  setDestination(x: number, y: number): void {
    this.resetDestination();
    this._newX = x;
    this._newY = y;
    this.dungeon.set(this._newX, this._newY, this);
  }

  tryMove(dx: number, dy: number): boolean {
    return ((dx !== 0 || dy !== 0) && this.move(dx, dy)) ||
      (dx !== 0 && this.move(dx, 0)) ||
      (dy !== 0 && this.move(0, dy))
  }

  move(dx: number, dy: number): boolean {
    if (dx > 0) this.view.isLeft = false;
    if (dx < 0) this.view.isLeft = true;
    const newX = this._x + dx;
    const newY = this._y + dy;
    if (this.dungeon.available(newX, newY, this)) {
      this.setDestination(newX, newY);
      return true;
    } else {
      return false;
    }
  }

  randomMove(): boolean {
    if (Math.random() < 0.1) {
      const moveX = Math.floor(Math.random() * 3) - 1;
      const moveY = Math.floor(Math.random() * 3) - 1;
      if (this.tryMove(moveX, moveY)) {
        return true;
      }
    }
    return false;
  }

  hasDestination(): boolean {
    return this._newX !== -1 && this._newY !== -1;
  }

  moveToDestination(): void {
    if (this._newX !== -1 && this._newY !== -1) {
      this.setPosition(this._newX, this._newY);
    }
  }

  resetDestination(): void {
    if (this._newX !== -1 && this._newY !== -1) {
      this.dungeon.remove(this._newX, this._newY, this);
      this.dungeon.set(this._x, this._y, this);
      this._newX = -1;
      this._newY = -1;
    }
  }

  lookAt(character: CharacterController): void {
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
    const width = this.width;
    const isLeft = this.view.isLeft;

    const scanLeft = direction === ScanDirection.AROUND || direction === ScanDirection.LEFT;
    const scanRight = direction === ScanDirection.AROUND || direction === ScanDirection.RIGHT;

    const scanMinX = scanLeft ? Math.max(0, posX - maxDistance) : posX + (width - 1);
    const scanMaxX = scanRight ? Math.min(this.dungeon.width - 1, posX + (width - 1) + maxDistance) : posX;

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

    const metric = (a: DungeonMapCell): number => {
      return Math.max(Math.abs(a.x - posX), Math.abs(a.y - posY)) +
        (a.y !== posY ? 0.5 : 0) + // boost X
        (a.x === posX && a.y === posY ? 0 : 1) + // boost self
        (isLeft ? (a.x < posX ? 0 : 1) : (a.x > posX ? 0 : 0.5)); // boost side
    };

    cells.sort((a: DungeonMapCell, b: DungeonMapCell) => metric(a) - metric(b));

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

  protected idle(): FiniteStateMachine<IdleState> {
    const character = this.character;
    const animator = this.animator;
    const fsm = new FiniteStateMachine<IdleState>(IdleState.PLAY, [IdleState.PLAY, IdleState.COMPLETE]);
    fsm.state(IdleState.PLAY)
      .onEnter(() => {
        const speed = character.speed * 0.2;
        animator.clear();
        animator.animateCharacter(speed, character.name + "_idle", 4);
        const weapon = character.weapon;
        if (weapon) {
          animator.animateWeapon(speed, weapon.animations.idle);
        }
        animator.start();
      })
      .onUpdate(deltaTime => animator.update(deltaTime))
      .onExit(() => animator.stop())
      .transitionTo(IdleState.COMPLETE)
      .condition(() => !animator.isPlaying);
    return fsm;
  }

  protected run(): FiniteStateMachine<RunState> {
    const character = this.character;
    const animator = this.animator;
    const fsm = new FiniteStateMachine<RunState>(RunState.PLAY, [RunState.PLAY, RunState.PLAY, RunState.COMPLETE]);
    fsm.state(RunState.PLAY)
      .onEnter(() => {
        const speed = character.speed * 0.2;
        animator.clear();
        animator.animateCharacter(speed, character.name + "_run", 4);
        animator.animateMove(speed, this);
        const weapon = character.weapon;
        if (weapon) {
          animator.animateWeapon(speed, weapon.animations.run);
        }
        animator.start();
      })
      .onExit(() => {
        if (animator.isPlaying) {
          this.resetDestination();
          animator.stop();
        } else {
          this.moveToDestination();
        }
      })
      .onUpdate(deltaTime => animator.update(deltaTime))
      .transitionTo(RunState.COMPLETE).condition(() => !animator.isPlaying);
    return fsm;
  }

  protected hit(hitController: HitController): FiniteStateMachine<HitState> {
    const character = this.character;

    const simple = this.simpleHit(hitController);
    const combo = this.comboHit(hitController);

    const fsm = new FiniteStateMachine<HitState>(HitState.INITIAL, [
      HitState.INITIAL,
      HitState.SIMPLE_HIT,
      HitState.COMBO_HIT,
      HitState.COMPLETE
    ]);

    fsm.state(HitState.INITIAL)
      .transitionTo(HitState.COMBO_HIT)
      .condition(() => character.weapon !== null)
      .condition(() => character.weapon!.animations.combo !== undefined);

    fsm.state(HitState.INITIAL)
      .transitionTo(HitState.SIMPLE_HIT);

    fsm.state(HitState.SIMPLE_HIT)
      .nested(simple)
      .transitionTo(HitState.COMPLETE)
      .condition(() => simple.isFinal);

    fsm.state(HitState.COMBO_HIT)
      .nested(combo)
      .transitionTo(HitState.COMPLETE)
      .condition(() => combo.isFinal);
    return fsm;
  }

  private simpleHit(hitController: HitController): FiniteStateMachine<SimpleHitState> {
    const character = this.character;
    const animator = this.animator;
    const fsm = new FiniteStateMachine<SimpleHitState>(SimpleHitState.INITIAL, [SimpleHitState.INITIAL, SimpleHitState.PLAY, SimpleHitState.COMPLETE]);
    fsm.state(SimpleHitState.INITIAL)
      .onEnter(() => {
        const weapon = character.weapon;
        animator.clear();
        if (weapon) {
          const speed = weapon.speed * 0.2;
          animator.animateCharacter(speed, character.name + "_idle", 4);
          animator.animateWeapon(speed, weapon.animations.hit);
        } else {
          const speed = character.speed * 0.2;
          animator.animateCharacter(speed, character.name + "_idle", 4);
        }
        animator.start();
      })
      .transitionTo(SimpleHitState.PLAY);
    fsm.state(SimpleHitState.PLAY).onUpdate(deltaTime => animator.update(deltaTime));
    fsm.state(SimpleHitState.PLAY).transitionTo(SimpleHitState.COMPLETE).condition(() => !animator.isPlaying);
    fsm.state(SimpleHitState.COMPLETE).onEnter(() => hitController.onHit(1)).onEnter(() => animator.stop());
    return fsm;
  }

  private comboHit(hitController: HitController): FiniteStateMachine<ComboHitState> {
    const character = this.character;
    const animator = this.animator;
    let hits = 0;
    let speed = 0;
    let combo: readonly WeaponAnimation[] = [];
    const fsm = new FiniteStateMachine<ComboHitState>(ComboHitState.FIRST_HIT, [ComboHitState.FIRST_HIT, ComboHitState.NEXT_HIT, ComboHitState.COMPLETE]);

    // first hit
    fsm.state(ComboHitState.FIRST_HIT)
      .onEnter(() => {
        const weapon = character.weapon!;
        combo = weapon.animations.combo!;
        speed = weapon.speed * 0.2;
        hits = 0;
        animator.clear();
        animator.animateCharacter(speed, character.name + "_idle", 4);
        animator.animateWeapon(speed, combo[0]);
        animator.start();
        hits++
      })
      .onUpdate(deltaTime => animator.update(deltaTime))
      .onExit(() => hitController.onHit(hits));

    fsm.state(ComboHitState.FIRST_HIT)
      .transitionTo(ComboHitState.NEXT_HIT)
      .condition(() => !animator.isPlaying)
      .condition(() => hitController.continueCombo());

    fsm.state(ComboHitState.FIRST_HIT)
      .transitionTo(ComboHitState.COMPLETE)
      .condition(() => !animator.isPlaying)
      .condition(() => !hitController.continueCombo());

    // next hit
    fsm.state(ComboHitState.NEXT_HIT)
      .onEnter(() => {
        animator.clear();
        animator.animateCharacter(speed, character.name + "_idle", 4);
        animator.animateWeapon(speed, combo[hits]);
        animator.start();
        hits++;
      })
      .onUpdate(deltaTime => animator.update(deltaTime))
      .onExit(() => hitController.onHit(hits));

    fsm.state(ComboHitState.NEXT_HIT)
      .transitionTo(ComboHitState.NEXT_HIT)
      .condition(() => !animator.isPlaying)
      .condition(() => hits < combo.length)
      .condition(() => hitController.continueCombo());

    fsm.state(ComboHitState.NEXT_HIT)
      .transitionTo(ComboHitState.NEXT_HIT)
      .condition(() => !animator.isPlaying)
      .condition(() => hits < combo.length)
      .condition(() => !hitController.continueCombo());

    fsm.state(ComboHitState.NEXT_HIT)
      .transitionTo(ComboHitState.COMPLETE)
      .condition(() => !animator.isPlaying)
      .condition(() => hits === combo.length);

    return fsm;
  }
}

export const enum IdleState {
  PLAY = 0,
  COMPLETE = 1,
}

export const enum RunState {
  PLAY = 0,
  COMPLETE = 1,
}

export const enum HitState {
  INITIAL = 0,
  SIMPLE_HIT = 1,
  COMBO_HIT = 2,
  COMPLETE = 3,
}

export const enum SimpleHitState {
  INITIAL = 0,
  PLAY = 1,
  COMPLETE = 2,
}

export const enum ComboHitState {
  FIRST_HIT = 0,
  NEXT_HIT = 1,
  COMPLETE = 2,
}

export interface HitController {
  onHit(combo: number): void;
  continueCombo(): boolean;
}