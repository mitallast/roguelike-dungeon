import * as PIXI from "pixi.js";
import {Character, HitController, ScanDirection} from "../Character";
import {DungeonMap, DungeonObject, DungeonZIndexes} from "../../dungeon";
import {UsableDrop} from "../../drop";
import {DigitKey, Joystick, KeyBind} from "../../input";
import {Monster} from "../monsters";
import {FiniteStateMachine} from "../../fsm";
import {HeroState} from "./HeroState";

export const heroNames = [
  "elf_f",
  "elf_m",
  "knight_f",
  "knight_m",
  "wizard_f",
  "wizard_m",
];

export class Hero extends Character {
  static type: (o: DungeonObject) => o is Hero =
    (o: DungeonObject): o is Hero => {
      return o instanceof Hero;
    };

  readonly state: HeroState;

  constructor(state: HeroState, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      x: x,
      y: y,
      width: 1,
      height: 1,
      zIndex: DungeonZIndexes.hero,
      static: false,
      interacting: false,
      animation: state.name + "_idle",
      onPosition: (x: number, y: number) => dungeon.camera.setPosition(x, y),
    });
    this.state = state;
    this.init();
  }

  init(): void {
    super.init();
    this.state.inventory.drop.subscribe(this.onDrop, this);
  }

  destroy(): void {
    this.state.inventory.drop.unsubscribe(this.onDrop, this);
    super.destroy();
  }

  protected onDead(): void {
    this.destroy();
    this.state.destroySession();
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
    if (cell.drop?.pickedUp(this)) {
      PIXI.sound.play('fruit_collect');
    }
  }

  scanHit(combo: number): void {
    const weapon = this.state.weapon;
    const distance = weapon?.distance || 1;
    const direction = this.view.isLeft ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const monsters = this.scanMonsters(direction, distance);

    const damage = this.state.damage + combo; // @todo improve?
    for (const monster of monsters) {
      monster.state.hitDamage(this, damage);
    }
    if (monsters.length > 0) {
      PIXI.sound.play('hit_damage', {speed: weapon?.speed || 1});
    }
  }

  private lookAtMonsters(): void {
    const distance = this.state.weapon?.distance || 1;
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

  private scanMonsters(direction: ScanDirection, maxDistance: number): Monster[] {
    return this._dungeon.registry.query<Monster>({
      type: Monster.type,
      filter: m => {
        return this.distanceTo(m) <= maxDistance && this.checkDirection(direction, m);
      }
    });
  }

  protected monstersHealth(direction: ScanDirection, maxDistance: number): number {
    return this.scanMonsters(direction, maxDistance)
      .map(m => m.state.health.get())
      .reduce((a, b) => a + b, 0);
  }

  protected fsm(): FiniteStateMachine<any> {
    const joystick = this._dungeon.controller.joystick;

    const fsm = new FiniteStateMachine<HeroBrainState>(HeroBrainState.IDLE, [
      HeroBrainState.IDLE,
      HeroBrainState.RUN,
      HeroBrainState.HIT,
      HeroBrainState.ON_HIT
    ]);

    const idle = this.idle();
    const run = this.run();
    const hit = this.hit(new HeroHitController(this, this._dungeon.controller.joystick));

    // idle
    fsm.state(HeroBrainState.IDLE)
      .nested(idle)
      .onEnter(() => this.scanDrop())
      .onUpdate(() => this.processInventory());

    fsm.state(HeroBrainState.IDLE)
      .transitionTo(HeroBrainState.ON_HIT)
      .condition(() => joystick.hit.once());

    fsm.state(HeroBrainState.IDLE)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.IDLE)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => idle.isFinal);

    // run
    fsm.state(HeroBrainState.RUN)
      .nested(run)
      .onEnter(() => this.scanDrop())
      .onUpdate(() => this.processInventory());

    fsm.state(HeroBrainState.RUN)
      .transitionTo(HeroBrainState.ON_HIT)
      .condition(() => run.isFinal)
      .condition(() => joystick.hit.once())

    fsm.state(HeroBrainState.RUN)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.RUN)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => run.isFinal)

    // hit
    fsm.state(HeroBrainState.HIT)
      .nested(hit)
      .onEnter(() => this.scanDrop())
      .onEnter(() => this.lookAtMonsters())
      .onUpdate(() => this.processInventory());

    fsm.state(HeroBrainState.HIT)
      .transitionTo(HeroBrainState.ON_HIT)
      .condition(() => hit.isFinal)
      .condition(() => joystick.hit.once())

    fsm.state(HeroBrainState.HIT)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => hit.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.HIT)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => hit.isFinal);

    // on hit pressed
    fsm.state(HeroBrainState.ON_HIT)
      .transitionTo(HeroBrainState.HIT)
      .condition(() => this.scanMonsters(ScanDirection.AROUND, 1).length > 0)
      .condition(() => this.state.spendHitStamina());

    fsm.state(HeroBrainState.ON_HIT)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => this.scanAndInteract())
      .action(() => joystick.hit.reset());

    fsm.state(HeroBrainState.ON_HIT)
      .transitionTo(HeroBrainState.HIT)
      .condition(() => this.state.spendHitStamina());

    fsm.state(HeroBrainState.ON_HIT)
      .transitionTo(HeroBrainState.IDLE);

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
    const inventory = this.state.inventory;
    for (let d = 0; d <= 9; d++) {
      const digit = (d + 1) % 10;
      if (joystick.digit(digit as DigitKey).once()) {
        this.state.inventory.belt.cell(d).use(this.state);
      }
    }
    if (joystick.drop.once()) {
      inventory.equipment.weapon.drop();
    }
    if (joystick.inventory.once()) {
      this._dungeon.controller.showInventory(this.state);
    }
    if (joystick.stats.once()) {
      this._dungeon.controller.showStats(this.state);
    }
  }
}

class HeroHitController implements HitController {
  private readonly _controller: Hero;
  private readonly _joystick: Joystick

  constructor(controller: Hero, joystick: Joystick) {
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

const enum HeroBrainState {
  IDLE = 0,
  RUN = 1,
  HIT = 2,
  ON_HIT = 3,
}