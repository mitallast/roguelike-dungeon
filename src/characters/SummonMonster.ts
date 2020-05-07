import {
  CharacterHitState,
  CharacterIdleState,
  CharacterRunState,
  CharacterState,
  CharacterStateMachine
} from "./CharacterStateMachine";
import {Monster, MonsterCategory, MonsterHitController, MonsterType} from "./Monster";
import {DungeonMap, DungeonZIndexes} from "../dungeon";
import {monsterWeapons, Weapon, WeaponConfig} from "../drop";
import {HeroController} from "./Hero";
import {ScanDirection} from "./Character";
import {SpawningMonsterController} from "./SpawningMonster";

export interface SummonMonsterConfig {
  readonly name: string;
  readonly category: MonsterCategory;
  readonly luck: number;
  readonly weapons: readonly WeaponConfig[];
}

const knife = monsterWeapons.knife;

export const summonMonsters: SummonMonsterConfig[] = [
  {name: "orc_shaman", category: MonsterCategory.ORC, luck: 0.4, weapons: [knife]},
  {name: "necromancer", category: MonsterCategory.UNDEAD, luck: 0.4, weapons: [knife]},
];

export class SummonMonster extends Monster {
  constructor(config: SummonMonsterConfig, level: number) {
    super({
      name: config.name,
      category: config.category,
      type: MonsterType.SUMMON,
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

export class SummonMonsterController extends SpawningMonsterController {
  readonly character: SummonMonster;

  readonly max_distance: number = 7;

  protected readonly _fsm: SummonMonsterStateMachine;

  constructor(config: SummonMonsterConfig, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      x: x,
      y: y,
      width: 1,
      height: 1,
      zIndex: DungeonZIndexes.character
    });
    this.character = new SummonMonster(config, dungeon.level);
    const weapon = config.luck < this.dungeon.rng.float() ? Weapon.select(this.dungeon.rng, config.weapons) : null;
    if (weapon) {
      this.character.inventory.equipment.weapon.set(weapon);
    }
    this._fsm = new SummonMonsterStateMachine(this);
    this.init();
  }

  protected onDead(): void {
    if (Math.random() < this.character.luck) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }
}

export class SummonMonsterStateMachine implements CharacterStateMachine {
  private readonly _controller: SummonMonsterController;
  private readonly _patrolling: SummonMonsterPatrollingState;
  private readonly _attack: SummonMonsterAttackState;

  private _currentState: SummonMonsterPatrollingState | SummonMonsterAttackState;

  constructor(controller: SummonMonsterController) {
    this._controller = controller;
    this._patrolling = new SummonMonsterPatrollingState(this, controller);
    this._attack = new SummonMonsterAttackState(this, controller);
    this._currentState = this._patrolling;
  }

  start(): void {
    this._currentState = this._patrolling;
    this._currentState.onEnter();
  }

  stop(): void {
    this._currentState.stop();
  }

  private transition(state: SummonMonsterPatrollingState | SummonMonsterAttackState): void {
    this._currentState.onExit();
    this._currentState = state;
    this._currentState.onEnter();
  }

  patrolling(): void {
    this.transition(this._patrolling);
  }

  attack(hero: HeroController): void {
    this._attack.attack(hero);
    this.transition(this._attack);
  }

  onUpdate(deltaTime: number): void {
    if (this._controller.character.dead.get()) {
      this.stop();
      return;
    }
    this._currentState.onUpdate(deltaTime);
  }

  onFinished(): void {
  }

  onEvent(event: any): void {
    this._currentState.onEvent(event);
  }
}

export class SummonMonsterPatrollingState implements CharacterStateMachine, CharacterState {
  private readonly _fsm: SummonMonsterStateMachine;
  private readonly _controller: SummonMonsterController;
  private readonly _idle: CharacterIdleState;
  private readonly _run: CharacterRunState;

  private _currentState: CharacterIdleState | CharacterRunState;

  constructor(fsm: SummonMonsterStateMachine, controller: SummonMonsterController) {
    this._fsm = fsm;
    this._controller = controller;
    this._idle = new CharacterIdleState(this, controller);
    this._run = new CharacterRunState(this, controller);
    this._currentState = this._idle;
  }

  // fsm

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

  onUpdate(deltaTime: number): void {
    this._currentState.onUpdate(deltaTime);
  }

  onFinished(): void {
    this.decision();
  }

  onEvent(_: any): void {
  }

  // state

  onEnter(): void {
    this._currentState = this._idle;
    this._currentState.onEnter();
    this.decision();
  }

  onExit(): void {
  }

  private decision(): void {
    const [hero] = this._controller.scanHero(ScanDirection.AROUND);
    if (hero) {
      this._controller.sendAlarm(hero);
      this._fsm.attack(hero);
      return;
    }
    if (this._controller.randomMove()) {
      this.transition(this._run);
      return;
    }
    this._controller.spawnMinions();
    this.transition(this._idle);
  }
}

export class SummonMonsterAttackState implements CharacterStateMachine, CharacterState {
  private readonly _fsm: SummonMonsterStateMachine;
  private readonly _controller: SummonMonsterController;
  private readonly _idle: CharacterIdleState;
  private readonly _run: CharacterRunState;
  private readonly _hit: CharacterHitState;

  private _currentState: CharacterIdleState | CharacterRunState | CharacterHitState;
  private _hero: HeroController | null = null;

  constructor(fsm: SummonMonsterStateMachine, controller: SummonMonsterController) {
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
  }

  // fsm

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

  onUpdate(deltaTime: number): void {
    this._currentState.onUpdate(deltaTime);
  }

  onFinished(): void {
    this.decision();
  }

  onEvent(_: any): void {
  }

  // state

  onEnter(): void {
    if (!this._hero || this._hero.character.dead.get()) {
      this._fsm.patrolling();
      return;
    }
    this._controller.lookAt(this._hero);
    this._currentState = this._idle;
    this._currentState.onEnter();

    this.decision();
  }

  onExit(): void {
  }

  private decision(): void {
    if (!this._hero || this._hero.character.dead.get()) {
      this._fsm.patrolling();
      return;
    }

    const distance = this._controller.distanceTo(this._hero);

    if (distance > this._controller.max_distance) {
      this._fsm.patrolling();
      return;
    }

    this._controller.lookAt(this._hero);

    if (distance === this._controller.max_distance) {
      this._controller.spawnMinions();
      this.transition(this._idle);
      return;
    }

    if (distance > 0) {
      const dx = Math.min(1, Math.max(-1, this._controller.x - this._hero.x));
      const dy = Math.min(1, Math.max(-1, this._controller.y - this._hero.y));
      if (this._controller.startMove(dx, dy) || this._controller.startMove(dx, 0) || this._controller.startMove(0, dy)) {
        this.transition(this._run);
        return;
      }
    }

    if (distance === 0) {
      if (this._controller.character.luck < this._controller.dungeon.rng.float()) {
        this.transition(this._hit);
        return;
      }
    }

    this._controller.spawnMinions();

    this.transition(this._idle);
  }
}