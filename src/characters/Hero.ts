import * as PIXI from "pixi.js";
import {Character, CharacterController, HitController, ScanDirection} from "./Character";
import {DungeonMap, DungeonObject, DungeonZIndexes} from "../dungeon";
import {UsableDrop} from "../drop";
import {Observable, ObservableVar} from "../observable";
import {DigitKey, Joystick, KeyBind} from "../input";
import {PersistentState} from "../persistent.state";
import {MonsterController} from "./Monster";
import {FiniteStateMachine} from "../fsm";

export const heroCharacterNames = [
  "elf_f",
  "elf_m",
  "knight_f",
  "knight_m",
  "wizard_f",
  "wizard_m",
];

export interface HeroSave {
  readonly coins: number;
  readonly baseDamage: number;
  readonly level: number;
  readonly levelXp: number;
  readonly skillPoints: number;
  readonly xp: number;
  readonly healthMax: number;
  readonly speed: number;
}

const initial: HeroSave = {
  coins: 0,
  baseDamage: 3,
  level: 1,
  levelXp: 0,
  skillPoints: 0,
  xp: 0,
  healthMax: 30,
  speed: 1,
};

export class Hero extends Character {
  private readonly _persistent: PersistentState;

  private readonly _level: ObservableVar<number>;
  private readonly _levelXp: ObservableVar<number>;
  private readonly _skillPoints: ObservableVar<number>;
  private readonly _xp: ObservableVar<number>;

  readonly dungeonSeeds = new Map<number, number>();
  readonly bonfires = new Set<number>();

  get level(): Observable<number> {
    return this._level;
  }

  get levelXp(): Observable<number> {
    return this._levelXp;
  }

  get skillPoints(): Observable<number> {
    return this._skillPoints;
  }

  get xp(): Observable<number> {
    return this._xp;
  }

  addXp(value: number): void {
    this._xp.update((v) => {
      let newXp = v + value;
      for (; ;) {
        const levelXp = this._levelXp.get();
        if (newXp >= levelXp) {
          newXp = newXp - levelXp;
          this._level.update((v) => v + 1);
          this._levelXp.update((v) => v + 1000);
          this._skillPoints.update((v) => v + 1);
        } else {
          break;
        }
      }
      return newXp;
    });
  }

  increaseHealth(): void {
    this._skillPoints.update((points) => {
      if (points > 0) {
        points--;
        this._healthMax.update((h) => h + 1);
        this._health.update((h) => h + 1);
      }
      return points;
    });
  }

  private constructor(name: string, state: HeroSave, persistent: PersistentState) {
    super({
      name: name,
      speed: state.speed,
      healthMax: state.healthMax,
      baseDamage: state.baseDamage,
      coins: state.coins,
    });
    this._persistent = persistent;
    this._level = new ObservableVar(state.level);
    this._levelXp = new ObservableVar(state.levelXp);
    this._skillPoints = new ObservableVar(state.skillPoints);
    this._xp = new ObservableVar(state.xp);
    this.subscribe();
  }

  private subscribe(): void {
    this._coins.subscribe(this.save, this);
    this._baseDamage.subscribe(this.save, this);
    this._level.subscribe(this.save, this);
    this._levelXp.subscribe(this.save, this);
    this._skillPoints.subscribe(this.save, this);
    this._xp.subscribe(this.save, this);
    this._healthMax.subscribe(this.save, this);
    this._speed.subscribe(this.save, this);
  }

  private save(): void {
    this._persistent.global.save(this.name, this.state);
  }

  private get state(): HeroSave {
    return {
      coins: this._coins.get(),
      baseDamage: this._baseDamage.get(),
      level: this._level.get(),
      levelXp: this._levelXp.get(),
      skillPoints: this._skillPoints.get(),
      xp: this._xp.get(),
      healthMax: this._healthMax.get(),
      speed: this._speed.get(),
    };
  }

  static load(name: string, persistent: PersistentState): Hero {
    const state: HeroSave = persistent.global.load(name) || initial;
    return new Hero(name, state, persistent);
  }
}

export class HeroController extends CharacterController {
  static type: (o: DungeonObject) => o is HeroController =
    (o: DungeonObject): o is HeroController => {
      return o instanceof HeroController;
    };

  readonly character: Hero;

  constructor(character: Hero, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      x: x,
      y: y,
      width: 1,
      height: 1,
      zIndex: DungeonZIndexes.hero,
      static: false,
      interacting: false,
      onPosition: (x: number, y: number) => dungeon.camera.setPosition(x, y),
    });
    this.character = character;
    this.init();
  }

  init(): void {
    super.init();
    this.character.inventory.drop.subscribe(this.onDrop, this);
  }

  destroy(): void {
    this.character.inventory.drop.unsubscribe(this.onDrop, this);
    super.destroy();
  }

  protected onKilledBy(by: Character): void {
    this._dungeon.log(`${this.character.name} killed by ${by.name}`);
  }

  protected onDead(): void {
    this.destroy();
    this._dungeon.controller.dead();
  }

  private onDrop(event: [UsableDrop, number]): void {
    const [drop] = event;
    const cell = this.findDropCell();
    if (cell) {
      cell.dropItem = drop;
    }
  }

  private scanDrop(): void {
    const cell = this._dungeon.cell(this.x, this.y);
    if (cell.drop?.pickedUp(this.character)) {
      PIXI.sound.play('fruit_collect');
    }
  }

  scanHit(combo: number): void {
    const weapon = this.character.weapon;
    const distance = weapon?.distance || 1;
    const direction = this.view.isLeft ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const monsters = this.scanMonsters(direction, distance);

    const damage = this.character.damage + combo; // @todo improve?
    for (const monster of monsters) {
      monster.character.hitDamage(this.character, damage);
    }
    if (monsters.length > 0) {
      PIXI.sound.play('hit_damage', {speed: weapon?.speed || 1});
    }
  }

  private lookAtMonsters(): void {
    const weapon = this.character.weapon;
    const distance = weapon?.distance || 1;
    const leftHealthSum = this.monstersHealth(ScanDirection.LEFT, distance);
    const rightHealthSum = this.monstersHealth(ScanDirection.RIGHT, distance);
    if (leftHealthSum > 0 && leftHealthSum > rightHealthSum) {
      this.view.isLeft = true;
    } else if (rightHealthSum > 0 && rightHealthSum > leftHealthSum) {
      this.view.isLeft = false;
    }
  }

  private scanAndInteract(): boolean {
    const direction = this.view.isLeft ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const [object] = this.scanCells(direction, 1, c => c.interacting);
    if (object) {
      object.interact(this);
      return true;
    }
    return false;
  }

  private scanMonsters(direction: ScanDirection, maxDistance: number): MonsterController[] {
    return this._dungeon.registry.query<MonsterController>({
      type: MonsterController.type,
      filter: m => {
        return this.distanceTo(m) <= maxDistance && this.checkDirection(direction, m);
      }
    });
  }

  protected monstersHealth(direction: ScanDirection, maxDistance: number): number {
    return this.scanMonsters(direction, maxDistance).map(m => m.character.health.get()).reduce((a, b) => a + b, 0);
  }

  protected fsm(): FiniteStateMachine<HeroState> {
    const joystick = this._dungeon.controller.joystick;

    const fsm = new FiniteStateMachine<HeroState>(HeroState.IDLE, [
      HeroState.IDLE,
      HeroState.RUN,
      HeroState.HIT,
      HeroState.ON_HIT
    ]);

    const idle = this.idle();
    const run = this.run();
    const hit = this.hit(new HeroHitController(this, this._dungeon.controller.joystick));

    // idle
    fsm.state(HeroState.IDLE)
      .nested(idle)
      .onEnter(() => this.scanDrop())
      .onUpdate(() => this.processInventory());

    fsm.state(HeroState.IDLE)
      .transitionTo(HeroState.ON_HIT)
      .condition(() => joystick.hit.once());

    fsm.state(HeroState.IDLE)
      .transitionTo(HeroState.RUN)
      .condition(() => this.processMove());

    fsm.state(HeroState.IDLE)
      .transitionTo(HeroState.IDLE)
      .condition(() => idle.isFinal);

    // run
    fsm.state(HeroState.RUN)
      .nested(run)
      .onEnter(() => this.scanDrop())
      .onUpdate(() => this.processInventory());

    fsm.state(HeroState.RUN)
      .transitionTo(HeroState.ON_HIT)
      .condition(() => run.isFinal)
      .condition(() => joystick.hit.once())

    fsm.state(HeroState.RUN)
      .transitionTo(HeroState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroState.RUN)
      .transitionTo(HeroState.IDLE)
      .condition(() => run.isFinal)

    // hit
    fsm.state(HeroState.HIT)
      .nested(hit)
      .onEnter(() => this.scanDrop())
      .onEnter(() => this.lookAtMonsters())
      .onUpdate(() => this.processInventory());

    fsm.state(HeroState.HIT)
      .transitionTo(HeroState.ON_HIT)
      .condition(() => hit.isFinal)
      .condition(() => joystick.hit.once())

    fsm.state(HeroState.HIT)
      .transitionTo(HeroState.RUN)
      .condition(() => hit.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroState.HIT)
      .transitionTo(HeroState.IDLE)
      .condition(() => hit.isFinal);

    // on hit pressed
    fsm.state(HeroState.ON_HIT)
      .transitionTo(HeroState.HIT)
      .condition(() => this.scanMonsters(ScanDirection.AROUND, 1).length > 0);

    fsm.state(HeroState.ON_HIT)
      .transitionTo(HeroState.IDLE)
      .condition(() => this.scanAndInteract())
      .action(() => joystick.hit.reset());

    fsm.state(HeroState.ON_HIT)
      .transitionTo(HeroState.HIT);

    return fsm;
  }

  private delta(a: KeyBind, b: KeyBind): number {
    if (a.repeat()) {
      return -1;
    } else if (b.repeat()) {
      return 1;
    } else {
      return 0;
    }
  }

  private processMove(): boolean {
    const joystick = this._dungeon.controller.joystick;
    const dx = this.delta(joystick.moveLeft, joystick.moveRight);
    const dy = this.delta(joystick.moveUp, joystick.moveDown);
    return this.tryMove(dx, dy);
  }

  private processInventory(): void {
    const joystick = this._dungeon.controller.joystick;
    const inventory = this.character.inventory;
    for (let d = 0; d <= 9; d++) {
      const digit = (d + 1) % 10;
      if (joystick.digit(digit as DigitKey).once()) {
        this.character.inventory.belt.cell(d).use();
      }
    }
    if (joystick.drop.once()) {
      inventory.equipment.weapon.drop();
    }
    if (joystick.inventory.once()) {
      this._dungeon.controller.showInventory(this.character);
    }
  }
}

class HeroHitController implements HitController {
  private readonly _controller: HeroController;
  private readonly _joystick: Joystick

  constructor(controller: HeroController, joystick: Joystick) {
    this._controller = controller;
    this._joystick = joystick;
  }

  continueCombo(): boolean {
    return this._joystick.hit.once();
  }

  onHit(combo: number): void {
    this._controller.scanHit(combo);
  }
}

const enum HeroState {
  IDLE = 0,
  RUN = 1,
  HIT = 2,
  ON_HIT = 3,
}