import {DungeonMap, DungeonZIndexes} from "../../dungeon";
import {Monster, MonsterHitController} from "./Monster";
import {FiniteStateMachine} from "../../fsm";
import {MonsterState} from "./MonsterState";

export class TinyMonster extends Monster {

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

  protected fsm(): FiniteStateMachine<TinyMonsterState> {
    const fsm = new FiniteStateMachine<TinyMonsterState>(TinyMonsterState.PATROLLING, [
      TinyMonsterState.PATROLLING,
      TinyMonsterState.ALARM,
      TinyMonsterState.ATTACK,
    ]);

    const patrolling = this.patrolling();
    const alarm = this.alarm();
    const attack = this.attack();

    // patrolling

    fsm.state(TinyMonsterState.PATROLLING)
      .nested(patrolling);

    fsm.state(TinyMonsterState.PATROLLING)
      .transitionTo(TinyMonsterState.ATTACK)
      .condition(() => patrolling.isFinal)
      .condition(() => patrolling.current === TinyMonsterPatrollingState.GO_ATTACK);

    fsm.state(TinyMonsterState.PATROLLING)
      .transitionTo(TinyMonsterState.ALARM)
      .condition(() => patrolling.isFinal)
      .condition(() => patrolling.current === TinyMonsterPatrollingState.GO_ALARM);

    // alarm

    fsm.state(TinyMonsterState.ALARM)
      .nested(alarm);

    fsm.state(TinyMonsterState.ALARM)
      .transitionTo(TinyMonsterState.ATTACK)
      .condition(() => alarm.isFinal)
      .condition(() => alarm.current === TinyMonsterAlarmState.GO_ATTACK)

    fsm.state(TinyMonsterState.ALARM)
      .transitionTo(TinyMonsterState.PATROLLING)
      .condition(() => alarm.isFinal)
      .condition(() => alarm.current === TinyMonsterAlarmState.GO_PATROLLING);

    // attack

    fsm.state(TinyMonsterState.ATTACK)
      .nested(attack);

    fsm.state(TinyMonsterState.ATTACK)
      .transitionTo(TinyMonsterState.ALARM)
      .condition(() => attack.isFinal)
      .condition(() => attack.current === TinyMonsterAttackState.GO_ALARM);

    return fsm;
  }

  private patrolling(): FiniteStateMachine<TinyMonsterPatrollingState> {
    const fsm = new FiniteStateMachine<TinyMonsterPatrollingState>(TinyMonsterPatrollingState.IDLE, [
      TinyMonsterPatrollingState.IDLE,
      TinyMonsterPatrollingState.RANDOM_MOVE,
      TinyMonsterPatrollingState.GO_ALARM,
      TinyMonsterPatrollingState.GO_ATTACK,
    ]);

    const idle = this.idle();
    const run = this.run();

    // idle
    fsm.state(TinyMonsterPatrollingState.IDLE)
      .nested(idle);

    fsm.state(TinyMonsterPatrollingState.IDLE)
      .transitionTo(TinyMonsterPatrollingState.GO_ATTACK)
      .condition(() => this.scanHero());

    fsm.state(TinyMonsterPatrollingState.IDLE)
      .transitionTo(TinyMonsterPatrollingState.GO_ALARM)
      .condition(() => idle.isFinal)
      .condition(() => this.hasPath);

    fsm.state(TinyMonsterPatrollingState.IDLE)
      .transitionTo(TinyMonsterPatrollingState.RANDOM_MOVE)
      .condition(() => idle.isFinal)
      .condition(() => this.randomMove());

    fsm.state(TinyMonsterPatrollingState.IDLE)
      .transitionTo(TinyMonsterPatrollingState.IDLE)
      .condition(() => idle.isFinal);

    // random move
    fsm.state(TinyMonsterPatrollingState.RANDOM_MOVE)
      .nested(run);

    fsm.state(TinyMonsterPatrollingState.RANDOM_MOVE)
      .transitionTo(TinyMonsterPatrollingState.GO_ATTACK)
      .condition(() => run.isFinal)
      .condition(() => this.scanHero());

    fsm.state(TinyMonsterPatrollingState.RANDOM_MOVE)
      .transitionTo(TinyMonsterPatrollingState.GO_ALARM)
      .condition(() => run.isFinal)
      .condition(() => this.hasPath);

    fsm.state(TinyMonsterPatrollingState.RANDOM_MOVE)
      .transitionTo(TinyMonsterPatrollingState.IDLE)
      .condition(() => run.isFinal);

    return fsm;
  }

  private alarm(): FiniteStateMachine<TinyMonsterAlarmState> {
    const fsm = new FiniteStateMachine<TinyMonsterAlarmState>(TinyMonsterAlarmState.IDLE, [
      TinyMonsterAlarmState.INITIAL,
      TinyMonsterAlarmState.IDLE,
      TinyMonsterAlarmState.RUN,
      TinyMonsterAlarmState.GO_ATTACK,
      TinyMonsterAlarmState.GO_PATROLLING,
    ]);

    const idle = this.idle();
    const run = this.run();

    let alarmCountdown = 0;

    // initial
    fsm.state(TinyMonsterAlarmState.INITIAL)
      .onEnter(() => alarmCountdown = 10);

    fsm.state(TinyMonsterAlarmState.INITIAL)
      .transitionTo(TinyMonsterAlarmState.RUN)
      .condition(() => this.moveByPath());

    fsm.state(TinyMonsterAlarmState.INITIAL)
      .transitionTo(TinyMonsterAlarmState.IDLE);

    // idle
    fsm.state(TinyMonsterAlarmState.IDLE)
      .nested(idle);

    fsm.state(TinyMonsterAlarmState.IDLE)
      .transitionTo(TinyMonsterAlarmState.GO_ATTACK)
      .condition(() => this.scanHero());

    fsm.state(TinyMonsterAlarmState.IDLE)
      .transitionTo(TinyMonsterAlarmState.RUN)
      .condition(() => idle.isFinal)
      .condition(() => this.moveByPath());

    fsm.state(TinyMonsterAlarmState.IDLE)
      .transitionTo(TinyMonsterAlarmState.IDLE)
      .condition(() => idle.isFinal)
      .condition(() => --alarmCountdown > 0)

    fsm.state(TinyMonsterAlarmState.IDLE)
      .transitionTo(TinyMonsterAlarmState.GO_PATROLLING)
      .condition(() => idle.isFinal)

    // run
    fsm.state(TinyMonsterAlarmState.RUN)
      .nested(run);

    fsm.state(TinyMonsterAlarmState.RUN)
      .transitionTo(TinyMonsterAlarmState.GO_ATTACK)
      .condition(() => run.isFinal)
      .condition(() => this.scanHero());

    fsm.state(TinyMonsterAlarmState.RUN)
      .transitionTo(TinyMonsterAlarmState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.moveByPath());

    fsm.state(TinyMonsterAlarmState.RUN)
      .transitionTo(TinyMonsterAlarmState.IDLE)
      .condition(() => run.isFinal)

    return fsm;
  }

  private attack(): FiniteStateMachine<TinyMonsterAttackState> {
    const rng = this._dungeon.rng;

    const fsm = new FiniteStateMachine<TinyMonsterAttackState>(TinyMonsterAttackState.INITIAL, [
      TinyMonsterAttackState.INITIAL,
      TinyMonsterAttackState.IDLE,
      TinyMonsterAttackState.RUN,
      TinyMonsterAttackState.HIT,
      TinyMonsterAttackState.GO_ALARM,
    ]);

    const idle = this.idle();
    const run = this.run();
    const hit = this.hit(new MonsterHitController(this));

    // initial
    fsm.state(TinyMonsterAttackState.INITIAL)
      .transitionTo(TinyMonsterAttackState.HIT)
      .condition(() => this.heroOnAttack)
      .condition(() => this.state.spendHitStamina());

    fsm.state(TinyMonsterAttackState.INITIAL)
      .transitionTo(TinyMonsterAttackState.RUN)
      .condition(() => this.moveToHero());

    fsm.state(TinyMonsterAttackState.INITIAL)
      .transitionTo(TinyMonsterAttackState.IDLE)
      .condition(() => this.heroIsNear)

    fsm.state(TinyMonsterAttackState.INITIAL)
      .transitionTo(TinyMonsterAttackState.GO_ALARM)

    // idle
    fsm.state(TinyMonsterAttackState.IDLE)
      .nested(idle)
      .onEnter(() => this.lookAtHero());

    fsm.state(TinyMonsterAttackState.IDLE)
      .transitionTo(TinyMonsterAttackState.HIT)
      .condition(() => idle.isFinal)
      .condition(() => this.heroOnAttack)
      .condition(() => rng.float() < this.state.luck)
      .condition(() => this.state.spendHitStamina());

    fsm.state(TinyMonsterAttackState.IDLE)
      .transitionTo(TinyMonsterAttackState.RUN)
      .condition(() => idle.isFinal)
      .condition(() => this.moveToHero());

    fsm.state(TinyMonsterAttackState.IDLE)
      .transitionTo(TinyMonsterAttackState.IDLE)
      .condition(() => idle.isFinal)
      .condition(() => this.heroIsNear);

    fsm.state(TinyMonsterAttackState.IDLE)
      .transitionTo(TinyMonsterAttackState.GO_ALARM)
      .condition(() => idle.isFinal);

    // run
    fsm.state(TinyMonsterAttackState.RUN)
      .nested(run);

    fsm.state(TinyMonsterAttackState.RUN)
      .transitionTo(TinyMonsterAttackState.HIT)
      .condition(() => run.isFinal)
      .condition(() => this.heroOnAttack)
      .condition(() => rng.float() < this.state.luck)
      .condition(() => this.state.spendHitStamina());

    fsm.state(TinyMonsterAttackState.RUN)
      .transitionTo(TinyMonsterAttackState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.moveToHero());

    fsm.state(TinyMonsterAttackState.RUN)
      .transitionTo(TinyMonsterAttackState.IDLE)
      .condition(() => run.isFinal);

    // hit
    fsm.state(TinyMonsterAttackState.HIT)
      .nested(hit)
      .onEnter(() => this.lookAtHero());

    fsm.state(TinyMonsterAttackState.HIT)
      .transitionTo(TinyMonsterAttackState.RUN)
      .condition(() => hit.isFinal)
      .condition(() => this.moveToHero());

    fsm.state(TinyMonsterAttackState.HIT)
      .transitionTo(TinyMonsterAttackState.IDLE)
      .condition(() => hit.isFinal);

    return fsm;
  }
}

const enum TinyMonsterState {
  PATROLLING = 0,
  ALARM = 1,
  ATTACK = 2,
}

const enum TinyMonsterPatrollingState {
  IDLE = 0,
  RANDOM_MOVE = 1,
  GO_ALARM = 2,
  GO_ATTACK = 3,
}

const enum TinyMonsterAlarmState {
  INITIAL = 0,
  IDLE = 1,
  RUN = 2,
  GO_ATTACK = 3,
  GO_PATROLLING = 4,
}

const enum TinyMonsterAttackState {
  INITIAL = 0,
  IDLE = 1,
  RUN = 2,
  HIT = 3,
  GO_ALARM = 4,
}
