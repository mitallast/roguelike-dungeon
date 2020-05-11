import {DungeonMap, DungeonZIndexes} from "../dungeon";
import {MonsterCategory, Monster, MonsterType, MonsterHitController} from "./Monster";
import {Colors} from "../ui";
import {WeaponConfig, monsterWeapons, Weapon} from "../drop";
import {BossHealthView} from "./BossHealthView";
import {SpawningMonsterController} from "./SpawningMonster";
import {FiniteStateMachine} from "../fsm";

export interface BossConfig {
  readonly name: string;
  readonly category: MonsterCategory;
  readonly weapons: readonly WeaponConfig[];
}

export const bossMonsters: BossConfig[] = [
  {
    name: "big_zombie", category: MonsterCategory.ZOMBIE, weapons: [
      monsterWeapons.anime_sword,
      monsterWeapons.baton_with_spikes,
      monsterWeapons.big_hammer,
      monsterWeapons.cleaver,
      monsterWeapons.mace,
    ]
  },
  {
    name: "ogre", category: MonsterCategory.ORC, weapons: [
      monsterWeapons.anime_sword,
      monsterWeapons.baton_with_spikes,
      monsterWeapons.big_hammer,
      monsterWeapons.cleaver,
      monsterWeapons.mace,
    ]
  },
  {name: "big_demon", category: MonsterCategory.DEMON, weapons: []},
];

export class BossMonster extends Monster {
  constructor(config: BossConfig, level: number) {
    super({
      name: config.name,
      category: config.category,
      type: MonsterType.SUMMON,
      speed: 0.5,
      healthMax: 50 + Math.floor(level * 10),
      level: level,
      luck: 0.9,
      baseDamage: 5 + 0.5 * level,
      xp: 100 + 50 * level,
      spawn: 5,
    });
  }
}

export class BossMonsterController extends SpawningMonsterController {
  readonly character: BossMonster;
  readonly maxDistance: number = 7;

  protected readonly _fsm: FiniteStateMachine<BossState>;

  constructor(config: BossConfig, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      width: 2,
      height: 2,
      x: x,
      y: y,
      zIndex: DungeonZIndexes.character,
      static: false,
      interacting: false
    });
    this.character = new BossMonster(config, dungeon.level);
    const weapon = Weapon.select(this.dungeon.rng, config.weapons);
    if (weapon) {
      this.character.inventory.equipment.weapon.set(weapon);
    }
    this._fsm = this.fsm();
    this.init();

    const screen = dungeon.controller.screen;
    const healthView = new BossHealthView(this.character);
    healthView.zIndex = 13;
    healthView.position.set((screen.width >> 1), 64);
    dungeon.controller.scene!.addChild(healthView);
  }

  protected onDead(): void {
    this.dungeon.controller.showBanner({
      text: this.dungeon.rng.boolean() ? "VICTORY ACHIEVED" : "YOU DEFEATED",
      color: Colors.uiYellow
    });
    for (let i = 0; i < 9; i++) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }

  private fsm(): FiniteStateMachine<BossState> {
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
      .transitionTo(BossPatrollingState.IDLE)
      .condition(() => idle.isFinal)
      .condition(() => this.spawnMinions());

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
    const rng = this.dungeon.rng;

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
      .condition(() => rng.float() < this.character.luck);

    fsm.state(BossAttackState.INITIAL)
      .transitionTo(BossAttackState.RUN)
      .condition(() => this.heroIsNear)
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
      .condition(() => rng.float() < this.character.luck);

    fsm.state(BossAttackState.IDLE)
      .transitionTo(BossAttackState.RUN)
      .condition(() => idle.isFinal)
      .condition(() => this.heroIsNear)
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
      .condition(() => rng.float() < this.character.luck);

    fsm.state(BossAttackState.RUN)
      .transitionTo(BossAttackState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.heroIsNear)
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
      .condition(() => this.heroIsNear)
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