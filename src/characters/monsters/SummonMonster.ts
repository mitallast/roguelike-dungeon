import {Monster, MonsterHitController} from "./Monster";
import {DungeonMap, DungeonZIndexes} from "../../dungeon";
import {FiniteStateMachine} from "../../fsm";
import {MonsterState} from "./MonsterState";

export class SummonMonster extends Monster {
  private readonly _spawn: number = 3;
  private readonly _spawned: Monster[] = [];

  constructor(state: MonsterState, dungeon: DungeonMap, x: number, y: number) {
    super(state, dungeon, {
      x: x,
      y: y,
      width: 1,
      height: 1,
      static: false,
      interacting: false,
      animation: state.name + "_idle",
      zIndex: DungeonZIndexes.character,
    });
    this.init();
  }

  protected onDead(): void {
    if (Math.random() < this.state.luck) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }

  protected spawnMinions(): boolean {
    for (let i = this._spawned.length - 1; i >= 0; i--) {
      if (this._spawned[i].state.dead.get()) {
        this._spawned.splice(i, 1);
      }
    }
    if (this._spawned.length < this._spawn) {
      if (Math.random() > 0.1) {
        return false;
      }
      const cell = this.findSpawnCell();
      if (!cell) {
        console.warn(`spawn cell not found at ${this.x}:${this.y}`, this.state.race, this.state.type);
        return false;
      }
      const minion = this._dungeon.controller.monsterManager.spawnRandomMinion(this.state.race, this._dungeon, cell.x, cell.y);
      if (minion) {
        cell.object = minion;
        this._spawned.push(minion);
        return true;
      } else {
        console.warn("minion not spawned", this.state.race, this.state.type);
        return false;
      }
    }
    return false;
  }

  protected fsm(): FiniteStateMachine<SummonMonsterFsmState> {
    const fsm = new FiniteStateMachine<SummonMonsterFsmState>(SummonMonsterFsmState.PATROLLING, [
      SummonMonsterFsmState.PATROLLING,
      SummonMonsterFsmState.ATTACK,
    ]);

    const patrolling = this.patrolling();
    const attack = this.attack();

    fsm.state(SummonMonsterFsmState.PATROLLING)
      .nested(patrolling)
      .transitionTo(SummonMonsterFsmState.ATTACK)
      .condition(() => patrolling.isFinal)
      .condition(() => patrolling.current === SummonMonsterPatrollingFsmState.GO_ATTACK);

    fsm.state(SummonMonsterFsmState.ATTACK)
      .nested(attack)
      .transitionTo(SummonMonsterFsmState.PATROLLING)
      .condition(() => attack.isFinal)
      .condition(() => attack.current === SummonMonsterAttackFsmState.GO_PATROLLING);

    return fsm;
  }

  private patrolling(): FiniteStateMachine<SummonMonsterPatrollingFsmState> {
    const fsm = new FiniteStateMachine<SummonMonsterPatrollingFsmState>(SummonMonsterPatrollingFsmState.IDLE, [
      SummonMonsterPatrollingFsmState.IDLE,
      SummonMonsterPatrollingFsmState.RANDOM_MOVE,
      SummonMonsterPatrollingFsmState.GO_ATTACK,
    ]);

    const idle = this.idle();
    const run = this.run();

    // idle
    fsm.state(SummonMonsterPatrollingFsmState.IDLE)
      .nested(idle)
      .onEnter(() => this.spawnMinions());

    fsm.state(SummonMonsterPatrollingFsmState.IDLE)
      .transitionTo(SummonMonsterPatrollingFsmState.GO_ATTACK)
      .condition(() => this.scanHero());

    fsm.state(SummonMonsterPatrollingFsmState.IDLE)
      .transitionTo(SummonMonsterPatrollingFsmState.RANDOM_MOVE)
      .condition(() => idle.isFinal)
      .condition(() => this.randomMove());

    fsm.state(SummonMonsterPatrollingFsmState.IDLE)
      .transitionTo(SummonMonsterPatrollingFsmState.IDLE)
      .condition(() => idle.isFinal);

    // random move
    fsm.state(SummonMonsterPatrollingFsmState.RANDOM_MOVE)
      .nested(run);

    fsm.state(SummonMonsterPatrollingFsmState.RANDOM_MOVE)
      .transitionTo(SummonMonsterPatrollingFsmState.GO_ATTACK)
      .condition(() => run.isFinal)
      .condition(() => this.scanHero());

    fsm.state(SummonMonsterPatrollingFsmState.RANDOM_MOVE)
      .transitionTo(SummonMonsterPatrollingFsmState.IDLE)
      .condition(() => run.isFinal);

    return fsm;
  }

  private attack(): FiniteStateMachine<SummonMonsterAttackFsmState> {
    const rng = this._dungeon.rng;

    const fsm = new FiniteStateMachine<SummonMonsterAttackFsmState>(SummonMonsterAttackFsmState.INITIAL, [
      SummonMonsterAttackFsmState.INITIAL,
      SummonMonsterAttackFsmState.DECISION,
      SummonMonsterAttackFsmState.IDLE,
      SummonMonsterAttackFsmState.RUN_AWAY,
      SummonMonsterAttackFsmState.HIT,
      SummonMonsterAttackFsmState.GO_PATROLLING,
    ]);

    const idle = this.idle();
    const run = this.run();
    const hit = this.hit(new MonsterHitController(this));

    // initial
    fsm.state(SummonMonsterAttackFsmState.INITIAL);

    fsm.state(SummonMonsterAttackFsmState.INITIAL)
      .transitionTo(SummonMonsterAttackFsmState.GO_PATROLLING)
      .condition(() => !this.heroIsNear);

    fsm.state(SummonMonsterAttackFsmState.INITIAL)
      .transitionTo(SummonMonsterAttackFsmState.DECISION)
      .condition(() => this.heroIsNear);

    // decision
    fsm.state(SummonMonsterAttackFsmState.DECISION)
      .transitionTo(SummonMonsterAttackFsmState.HIT)
      .condition(() => this.heroOnAttack)
      .condition(() => rng.float() < this.state.luck)
      .condition(() => this.state.spendHitStamina());

    fsm.state(SummonMonsterAttackFsmState.DECISION)
      .transitionTo(SummonMonsterAttackFsmState.RUN_AWAY)
      .condition(() => this.heroIsNear)
      .condition(() => this.runAway());

    fsm.state(SummonMonsterAttackFsmState.DECISION)
      .transitionTo(SummonMonsterAttackFsmState.IDLE)
      .condition(() => this.heroIsNear);

    fsm.state(SummonMonsterAttackFsmState.DECISION)
      .transitionTo(SummonMonsterAttackFsmState.GO_PATROLLING);

    // idle
    fsm.state(SummonMonsterAttackFsmState.IDLE)
      .nested(idle)
      .onEnter(() => this.spawnMinions())
      .transitionTo(SummonMonsterAttackFsmState.DECISION)
      .condition(() => idle.isFinal)

    // run away
    fsm.state(SummonMonsterAttackFsmState.RUN_AWAY)
      .nested(run)
      .transitionTo(SummonMonsterAttackFsmState.DECISION)
      .condition(() => run.isFinal)

    // hit
    fsm.state(SummonMonsterAttackFsmState.HIT)
      .nested(hit)
      .onEnter(() => this.lookAtHero())
      .transitionTo(SummonMonsterAttackFsmState.IDLE)
      .condition(() => hit.isFinal)

    return fsm;
  }
}

const enum SummonMonsterFsmState {
  PATROLLING = 0,
  ATTACK = 1,
}

const enum SummonMonsterPatrollingFsmState {
  IDLE = 0,
  RANDOM_MOVE = 1,
  GO_ATTACK = 2,
}

const enum SummonMonsterAttackFsmState {
  INITIAL = 0,
  DECISION = 1,
  IDLE = 2,
  RUN_AWAY = 3,
  HIT = 4,
  GO_PATROLLING = 5,
}