import {DungeonMap, DungeonZIndexes} from "../dungeon";
import {MonsterController, MonsterCategory, Monster, MonsterType, MonsterHitController} from "./Monster";
import {ScanDirection} from "./Character";
import {monsterWeapons, Weapon, WeaponConfig} from "../drop";
import {HeroController} from "./Hero";
import {
  CharacterHitState,
  CharacterIdleState,
  CharacterRunState,
  CharacterState,
  CharacterStateMachine,
  MonsterAlarmEvent,
} from "./CharacterState";

export interface TinyMonsterConfig {
  readonly name: string;
  readonly category: MonsterCategory;
  readonly type: MonsterType.NORMAL | MonsterType.MINION;
  readonly luck: number;
  readonly weapons: readonly WeaponConfig[];
}

const knife = monsterWeapons.knife;

export const tinyMonsters: TinyMonsterConfig[] = [
  {name: "chort", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "wogol", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "imp", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "ice_zombie", category: MonsterCategory.ZOMBIE, type: MonsterType.NORMAL, luck: 0.3, weapons: [knife]},
  {name: "tiny_zombie", category: MonsterCategory.ZOMBIE, type: MonsterType.NORMAL, luck: 0.3, weapons: [knife]},
  {name: "zombie", category: MonsterCategory.ZOMBIE, type: MonsterType.NORMAL, luck: 0.3, weapons: [knife]},
  {name: "masked_orc", category: MonsterCategory.ORC, type: MonsterType.NORMAL, luck: 0.3, weapons: [knife]},
  {name: "orc_warrior", category: MonsterCategory.ORC, type: MonsterType.MINION, luck: 0.3, weapons: [knife]},
  {name: "goblin", category: MonsterCategory.ORC, type: MonsterType.MINION, luck: 0.3, weapons: [knife]},
  {name: "swampy", category: MonsterCategory.SLIME, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "muddy", category: MonsterCategory.SLIME, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "skeleton", category: MonsterCategory.UNDEAD, type: MonsterType.MINION, luck: 0.3, weapons: [knife]},
];

export class TinyMonster extends Monster {
  constructor(config: TinyMonsterConfig, level: number) {
    super({
      name: config.name,
      category: config.category,
      type: config.type,
      speed: 0.8,
      healthMax: 10 + Math.floor(level * 2),
      level: level,
      luck: config.luck,
      baseDamage: 1 + 0.5 * level,
      xp: 35 + 5 * level,
      spawn: 3,
    });
  }
}

export class TinyMonsterController extends MonsterController {
  readonly character: TinyMonster;
  readonly max_distance: number = 5;

  protected readonly _fsm: TinyMonsterStateMachine;

  constructor(config: TinyMonsterConfig, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      x: x,
      y: y,
      width: 1,
      height: 1,
      zIndex: DungeonZIndexes.character
    });
    this.character = new TinyMonster(config, dungeon.level);
    const weapon = config.luck < this.dungeon.rng.float() ? Weapon.select(this.dungeon.rng, config.weapons) : null;
    if (weapon) {
      this.character.inventory.equipment.weapon.set(weapon);
    }
    this._fsm = new TinyMonsterStateMachine(this);
    this.init();
  }

  protected onDead(): void {
    if (Math.random() < this.character.luck) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }
}

export class TinyMonsterStateMachine implements CharacterStateMachine {
  private readonly _controller: TinyMonsterController;
  private readonly _patrolling: TinyMonsterPatrollingState;
  private readonly _alarm: TinyMonsterAlarmState;
  private readonly _attack: TinyMonsterAttackState;

  private _currentState: TinyMonsterPatrollingState | TinyMonsterAlarmState | TinyMonsterAttackState;

  constructor(controller: TinyMonsterController) {
    this._controller = controller;
    this._patrolling = new TinyMonsterPatrollingState(this, controller);
    this._alarm = new TinyMonsterAlarmState(this, controller);
    this._attack = new TinyMonsterAttackState(this, controller);
    this._currentState = this._patrolling;
  }

  start(): void {
    this._currentState = this._patrolling;
    this._currentState.onEnter();
  }

  stop(): void {
    this._currentState.stop();
  }

  private transition(state: TinyMonsterPatrollingState | TinyMonsterAlarmState | TinyMonsterAttackState): void {
    this._currentState.onExit();
    this._currentState = state;
    this._currentState.onEnter();
  }

  patrolling(): void {
    this.transition(this._patrolling);
  }

  alarm(hero: HeroController | null): void {
    if (hero) {
      this._alarm.onAlarm(hero);
    }
    this.transition(this._alarm);
  }

  attack(hero: HeroController): void {
    this._attack.attack(hero);
    this.transition(this._attack);
  }

  onFinished(): void {
  }

  onEvent(event: any): void {
    this._currentState.onEvent(event);
  }

  onUpdate(deltaTime: number): void {
    if (this._controller.character.dead.get()) {
      this.stop();
      return;
    }
    this._currentState.onUpdate(deltaTime);
  }
}

export class TinyMonsterPatrollingState implements CharacterState, CharacterStateMachine {
  private readonly _fsm: TinyMonsterStateMachine;
  private readonly _controller: TinyMonsterController;
  private readonly _idle: CharacterIdleState;
  private readonly _run: CharacterRunState;

  private _currentState: CharacterIdleState | CharacterRunState;

  constructor(fsm: TinyMonsterStateMachine, controller: TinyMonsterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._idle = new CharacterIdleState(this, controller);
    this._run = new CharacterRunState(this, controller);
    this._currentState = this._idle;
  }

  start(): void {
  }

  stop(): void {
    this._currentState.onExit();
  }

  private transition(state: CharacterIdleState | CharacterRunState): void {
    this._currentState.onExit();
    this._currentState = state;
    this._currentState.onEnter();
  }

  onEnter(): void {
    this._currentState = this._idle;
    this._currentState.onEnter();
  }

  onExit(): void {
  }

  onUpdate(deltaTime: number): void {
    this._currentState.onUpdate(deltaTime);
  }

  onEvent(event: any): void {
    if (event instanceof MonsterAlarmEvent) {
      const distance = this._controller.distanceTo(event.hero);
      if (distance > this._controller.max_distance) {
        this._fsm.alarm(event.hero);
      } else {
        this._fsm.attack(event.hero);
      }
    }
  }

  onFinished(): void {
    if (this.scanHero()) {
      return;
    }
    if (this.randomMove()) {
      return;
    }
    this.transition(this._idle);
  }

  private scanHero(): boolean {
    const [hero] = this._controller.scanHero(ScanDirection.AROUND);
    if (hero) {
      this._controller.sendAlarm(hero);
      this._fsm.attack(hero);
      return true;
    }
    return false;
  }

  private randomMove(): boolean {
    if (Math.random() < 0.1) {
      const moveX = Math.floor(Math.random() * 3) - 1;
      const moveY = Math.floor(Math.random() * 3) - 1;
      if (this.move(moveX, moveY)) {
        return true;
      }
    }
    return false;
  }

  private move(velocityX: number, velocityY: number): boolean {
    if (velocityX > 0) this._controller.view.isLeft = false;
    if (velocityX < 0) this._controller.view.isLeft = true;
    const newX = this._controller.x + velocityX;
    const newY = this._controller.y + velocityY;
    if (this._controller.dungeon.available(newX, newY, this._controller)) {
      this._controller.setDestination(newX, newY);
      this.transition(this._run);
      return true;
    } else {
      return false;
    }
  }
}

export class TinyMonsterAlarmState implements CharacterState, CharacterStateMachine {
  private readonly _fsm: TinyMonsterStateMachine;
  private readonly _controller: TinyMonsterController;
  private readonly _idle: CharacterIdleState;
  private readonly _run: CharacterRunState;

  private _currentState: CharacterIdleState | CharacterRunState;
  private _lastPath: PIXI.Point[] = [];
  private _alarmCountDown = 0;

  constructor(fsm: TinyMonsterStateMachine, controller: TinyMonsterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._idle = new CharacterIdleState(this, controller);
    this._run = new CharacterRunState(this, controller);
    this._currentState = this._idle;
  }

  onAlarm(hero: HeroController): void {
    this._controller.lookAt(hero);
    this._lastPath = this._controller.findPath(hero);
  }

  start(): void {
  }

  stop(): void {
    this._currentState.onExit();
  }

  private transition(state: CharacterIdleState | CharacterRunState): void {
    this._currentState.onExit();
    this._currentState = state;
    this._currentState.onEnter();
  }

  onEnter(): void {
    this._alarmCountDown = 10;
    this._currentState = this._idle;
    this._currentState.onEnter();
    if (this.lookupHero()) {
      return;
    }
    if (this.moveByPath()) {
      return;
    }
  }

  onUpdate(deltaTime: number): void {
    this._currentState.onUpdate(deltaTime);
  }

  onExit(): void {
    this._lastPath = [];
  }

  onEvent(_: any): void {
  }

  onFinished(): void {
    if (this.lookupHero()) {
      return;
    }
    if (this.moveByPath()) {
      return;
    }
    this._alarmCountDown--;
    if (this._alarmCountDown > 0) {
      this.transition(this._idle);
    } else {
      this._fsm.patrolling();
    }
  }

  protected lookupHero(): boolean {
    const [hero] = this._controller.scanHero(ScanDirection.AROUND);
    if (hero) {
      this._fsm.attack(hero);
      return true;
    }
    return false;
  }

  protected moveByPath(): boolean {
    if (this._lastPath.length > 0) {
      const next = this._lastPath[0];
      const deltaX = next.x - this._controller.x;
      const deltaY = next.y - this._controller.y;
      if (this.move(deltaX, deltaY)) {
        this._lastPath.splice(0, 1);
        return true;
      } else {
        this._lastPath = [];
        return false;
      }
    } else {
      return false;
    }
  }

  private move(velocityX: number, velocityY: number): boolean {
    if (velocityX > 0) this._controller.view.isLeft = false;
    if (velocityX < 0) this._controller.view.isLeft = true;
    const newX = this._controller.x + velocityX;
    const newY = this._controller.y + velocityY;
    if (this._controller.dungeon.available(newX, newY, this._controller)) {
      this._controller.setDestination(newX, newY);
      this.transition(this._run);
      return true;
    } else {
      return false;
    }
  }
}

export class TinyMonsterAttackState implements CharacterState, CharacterStateMachine {
  private readonly _fsm: TinyMonsterStateMachine;
  private readonly _controller: TinyMonsterController;
  private readonly _idle: CharacterIdleState;
  private readonly _run: CharacterRunState;
  private readonly _hit: CharacterHitState;

  private _currentState: CharacterIdleState | CharacterRunState | CharacterHitState;
  private _hero: HeroController | null = null;
  private _lastPath: PIXI.Point[] = [];

  constructor(fsm: TinyMonsterStateMachine, controller: TinyMonsterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._idle = new CharacterIdleState(this, controller);
    this._run = new CharacterRunState(this, controller);
    this._hit = new CharacterHitState(this, controller, new MonsterHitController(controller));
    this._currentState = this._idle;
  }

  attack(hero: HeroController): void {
    this._controller.lookAt(hero);
    this._hero = hero;
    this._lastPath = this._controller.findPath(hero);
  }

  start(): void {
  }

  stop(): void {
    this._currentState.onExit();
  }

  private transition(state: CharacterIdleState | CharacterRunState | CharacterHitState): void {
    this._currentState.onExit();
    this._currentState = state;
    this._currentState.onEnter();
  }

  onEnter(): void {
    if (!this._hero || this._hero.character.dead.get()) {
      this._fsm.patrolling();
      return;
    }
    this._currentState = this._idle;
    this._currentState.onEnter();

    this.decision();
  }

  onUpdate(deltaTime: number): void {
    this._currentState.onUpdate(deltaTime);
  }

  onExit(): void {
    this._hero = null;
  }

  onEvent(_: any): void {
  }

  onFinished(): void {
    this.decision();
  }

  private decision(): void {
    if (!this._hero || this._hero.character.dead.get()) {
      this._fsm.alarm(null);
      return;
    }

    const distance = this._controller.distanceTo(this._hero);

    if (distance > this._controller.max_distance) {
      this._fsm.alarm(null);
      return;
    }

    this._controller.lookAt(this._hero);

    if (distance > 0) {
      if (this.moveTo(this._hero)) {
        return;
      }
      if (this.moveByPath()) {
        return;
      }
      this.transition(this._idle);
    } else {
      if (this._controller.character.luck < this._controller.dungeon.rng.float()) {
        this.transition(this._hit);
        return;
      }
      this.transition(this._idle);
    }
  }

  private moveTo(hero: HeroController): boolean {
    this._lastPath = this._controller.findPath(hero);
    return this.moveByPath();
  }

  private moveByPath(): boolean {
    if (this._lastPath.length > 0) {
      const next = this._lastPath[0];
      const deltaX = next.x - this._controller.x;
      const deltaY = next.y - this._controller.y;
      if (this.move(deltaX, deltaY)) {
        this._lastPath.splice(0, 1);
        return true;
      } else {
        this._lastPath = [];
        return false;
      }
    } else {
      return false;
    }
  }

  private move(velocityX: number, velocityY: number): boolean {
    if (velocityX > 0) this._controller.view.isLeft = false;
    if (velocityX < 0) this._controller.view.isLeft = true;
    const newX = this._controller.x + velocityX;
    const newY = this._controller.y + velocityY;
    if (this._controller.dungeon.available(newX, newY, this._controller)) {
      this._controller.setDestination(newX, newY);
      this.transition(this._run);
      return true;
    } else {
      return false;
    }
  }
}