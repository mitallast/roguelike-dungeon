import {DungeonMap, DungeonObject, DungeonZIndexes} from "../../dungeon";
import {Monster, MonsterHitController} from "./Monster";
import {FiniteStateMachine} from "../../fsm";
import {MonsterState} from "./MonsterState";
import {Colors} from "../../ui";

export class BossMonster extends Monster {
  static type: (o: DungeonObject) => o is BossMonster =
    (o: DungeonObject): o is BossMonster => {
      return o instanceof BossMonster;
    };

  constructor(state: MonsterState, dungeon: DungeonMap, x: number, y: number) {
    super(state, dungeon, {
      width: 2,
      height: 2,
      x: x,
      y: y,
      animation: state.name + "_idle",
      zIndex: DungeonZIndexes.character,
      static: false,
      interacting: false,
    });
    this.init();
  }

  protected onDead(): void {
    this._dungeon.controller.showBanner({
      text: this._dungeon.rng.boolean() ? "VICTORY ACHIEVED" : "YOU DEFEATED",
      color: Colors.uiYellow
    });
    for (let i = 0; i < 9; i++) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }

  protected fsm(): FiniteStateMachine<BossState> {
    const fsm = new FiniteStateMachine<BossState>(BossState.PATROLLING, [
      BossState.PATROLLING,
      BossState.ALARM,
      BossState.ATTACK,
    ]);

    const patrolling = this.patrolling();
    const alarm = this.alarm();
    const attack = this.attack();

    // patrolling

    fsm.state(BossState.PATROLLING)
      .onEnter(() => patrolling.start())
      .onUpdate(deltaTime => patrolling.update(deltaTime))
      .onEvent(event => patrolling.handle(event));

    fsm.state(BossState.PATROLLING)
      .transitionTo(BossState.ATTACK)
      .condition(() => patrolling.isFinal)
      .condition(() => patrolling.current === BossPatrollingState.GO_ATTACK);

    fsm.state(BossState.PATROLLING)
      .transitionTo(BossState.ALARM)
      .condition(() => patrolling.isFinal)
      .condition(() => patrolling.current === BossPatrollingState.GO_ALARM);

    // alarm

    fsm.state(BossState.ALARM)
      .onEnter(() => alarm.start())
      .onUpdate(deltaTime => alarm.update(deltaTime));

    fsm.state(BossState.ALARM)
      .transitionTo(BossState.ATTACK)
      .condition(() => alarm.isFinal)
      .condition(() => alarm.current === BossAlarmState.GO_ATTACK)

    fsm.state(BossState.ALARM)
      .transitionTo(BossState.PATROLLING)
      .condition(() => alarm.isFinal)
      .condition(() => alarm.current === BossAlarmState.GO_PATROLLING);

    // attack

    fsm.state(BossState.ATTACK)
      .onEnter(() => attack.start())
      .onUpdate(deltaTime => attack.update(deltaTime));

    fsm.state(BossState.ATTACK)
      .transitionTo(BossState.ALARM)
      .condition(() => attack.isFinal)
      .condition(() => attack.current === BossAttackState.GO_ALARM);

    return fsm;
  }

  private patrolling(): FiniteStateMachine<BossPatrollingState> {
    const fsm = new FiniteStateMachine<BossPatrollingState>(BossPatrollingState.IDLE, [
      BossPatrollingState.IDLE,
      BossPatrollingState.RANDOM_MOVE,
      BossPatrollingState.GO_ALARM,
      BossPatrollingState.GO_ATTACK,
    ]);

    const idle = this.idle();
    const run = this.run();

    // idle
    fsm.state(BossPatrollingState.IDLE)
      .nested(idle);

    fsm.state(BossPatrollingState.IDLE)
      .transitionTo(BossPatrollingState.GO_ATTACK)
      .condition(() => this.scanHero());

    fsm.state(BossPatrollingState.IDLE)
      .transitionTo(BossPatrollingState.GO_ALARM)
      .condition(() => this.hasPath);

    fsm.state(BossPatrollingState.IDLE)
      .transitionTo(BossPatrollingState.RANDOM_MOVE)
      .condition(() => idle.isFinal)
      .condition(() => this.randomMove());

    fsm.state(BossPatrollingState.IDLE)
      .transitionTo(BossPatrollingState.IDLE)
      .condition(() => idle.isFinal);

    // random move
    fsm.state(BossPatrollingState.RANDOM_MOVE)
      .nested(run);

    fsm.state(BossPatrollingState.RANDOM_MOVE)
      .transitionTo(BossPatrollingState.GO_ATTACK)
      .condition(() => run.isFinal)
      .condition(() => this.scanHero());

    fsm.state(BossPatrollingState.RANDOM_MOVE)
      .transitionTo(BossPatrollingState.GO_ALARM)
      .condition(() => run.isFinal)
      .condition(() => this.hasPath);

    fsm.state(BossPatrollingState.RANDOM_MOVE)
      .transitionTo(BossPatrollingState.IDLE)
      .condition(() => run.isFinal);

    return fsm;
  }

  private alarm(): FiniteStateMachine<BossAlarmState> {
    const fsm = new FiniteStateMachine<BossAlarmState>(BossAlarmState.IDLE, [
      BossAlarmState.INITIAL,
      BossAlarmState.IDLE,
      BossAlarmState.RUN,
      BossAlarmState.GO_ATTACK,
      BossAlarmState.GO_PATROLLING,
    ]);

    const idle = this.idle();
    const run = this.run();

    let alarmCountdown = 0;

    // initial
    fsm.state(BossAlarmState.INITIAL)
      .onEnter(() => alarmCountdown = 10);

    fsm.state(BossAlarmState.INITIAL)
      .transitionTo(BossAlarmState.RUN)
      .condition(() => this.moveByPath());

    fsm.state(BossAlarmState.INITIAL)
      .transitionTo(BossAlarmState.IDLE);

    // idle
    fsm.state(BossAlarmState.IDLE)
      .nested(idle);

    fsm.state(BossAlarmState.IDLE)
      .transitionTo(BossAlarmState.GO_ATTACK)
      .condition(() => this.scanHero());

    fsm.state(BossAlarmState.IDLE)
      .transitionTo(BossAlarmState.RUN)
      .condition(() => idle.isFinal)
      .condition(() => this.moveByPath());

    fsm.state(BossAlarmState.IDLE)
      .transitionTo(BossAlarmState.IDLE)
      .condition(() => idle.isFinal)
      .condition(() => --alarmCountdown > 0)

    fsm.state(BossAlarmState.IDLE)
      .transitionTo(BossAlarmState.GO_PATROLLING)
      .condition(() => idle.isFinal)

    // run
    fsm.state(BossAlarmState.RUN)
      .nested(run);

    fsm.state(BossAlarmState.RUN)
      .transitionTo(BossAlarmState.GO_ATTACK)
      .condition(() => run.isFinal)
      .condition(() => this.scanHero());

    fsm.state(BossAlarmState.RUN)
      .transitionTo(BossAlarmState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.moveByPath());

    fsm.state(BossAlarmState.RUN)
      .transitionTo(BossAlarmState.IDLE)
      .condition(() => run.isFinal)

    return fsm;
  }

  private attack(): FiniteStateMachine<BossAttackState> {
    const rng = this._dungeon.rng;

    const fsm = new FiniteStateMachine<BossAttackState>(BossAttackState.INITIAL, [
      BossAttackState.INITIAL,
      BossAttackState.IDLE,
      BossAttackState.RUN,
      BossAttackState.HIT,
      BossAttackState.GO_ALARM,
    ]);

    const idle = this.idle();
    const run = this.run();
    const hit = this.hit(new MonsterHitController(this));

    // initial
    fsm.state(BossAttackState.INITIAL)
      .transitionTo(BossAttackState.HIT)
      .condition(() => this.heroOnAttack)
      .condition(() => rng.float() < this.state.luck)
      .condition(() => this.state.spendHitStamina());

    fsm.state(BossAttackState.INITIAL)
      .transitionTo(BossAttackState.RUN)
      .condition(() => this.moveToHero());

    fsm.state(BossAttackState.INITIAL)
      .transitionTo(BossAttackState.IDLE)
      .condition(() => this.heroIsNear)

    fsm.state(BossAttackState.INITIAL)
      .transitionTo(BossAttackState.GO_ALARM)

    // idle
    fsm.state(BossAttackState.IDLE)
      .nested(idle)
      .onEnter(() => this.lookAtHero());

    fsm.state(BossAttackState.IDLE)
      .transitionTo(BossAttackState.HIT)
      .condition(() => idle.isFinal)
      .condition(() => this.heroOnAttack)
      .condition(() => rng.float() < this.state.luck)
      .condition(() => this.state.spendHitStamina());

    fsm.state(BossAttackState.IDLE)
      .transitionTo(BossAttackState.RUN)
      .condition(() => idle.isFinal)
      .condition(() => this.moveToHero());

    fsm.state(BossAttackState.IDLE)
      .transitionTo(BossAttackState.IDLE)
      .condition(() => idle.isFinal)
      .condition(() => this.heroIsNear);

    fsm.state(BossAttackState.IDLE)
      .transitionTo(BossAttackState.GO_ALARM)
      .condition(() => idle.isFinal);

    // run
    fsm.state(BossAttackState.RUN)
      .nested(run);

    fsm.state(BossAttackState.RUN)
      .transitionTo(BossAttackState.HIT)
      .condition(() => run.isFinal)
      .condition(() => this.heroOnAttack)
      .condition(() => rng.float() < this.state.luck)
      .condition(() => this.state.spendHitStamina());

    fsm.state(BossAttackState.RUN)
      .transitionTo(BossAttackState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.moveToHero());

    fsm.state(BossAttackState.RUN)
      .transitionTo(BossAttackState.IDLE)
      .condition(() => run.isFinal);

    // hit
    fsm.state(BossAttackState.HIT)
      .nested(hit)
      .onEnter(() => this.lookAtHero());

    fsm.state(BossAttackState.HIT)
      .transitionTo(BossAttackState.RUN)
      .condition(() => hit.isFinal)
      .condition(() => this.moveToHero());

    fsm.state(BossAttackState.HIT)
      .transitionTo(BossAttackState.IDLE)
      .condition(() => hit.isFinal);

    return fsm;
  }
}

const enum BossState {
  PATROLLING = 0,
  ALARM = 1,
  ATTACK = 2,
}

const enum BossPatrollingState {
  IDLE = 0,
  RANDOM_MOVE = 1,
  GO_ALARM = 2,
  GO_ATTACK = 3,
}

const enum BossAlarmState {
  INITIAL = 0,
  IDLE = 1,
  RUN = 2,
  GO_ATTACK = 3,
  GO_PATROLLING = 4,
}

const enum BossAttackState {
  INITIAL = 0,
  IDLE = 1,
  RUN = 2,
  HIT = 3,
  GO_ALARM = 4,
}