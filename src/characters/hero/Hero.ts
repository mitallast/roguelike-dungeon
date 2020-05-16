import * as PIXI from "pixi.js";
import {Character, HitController, ScanDirection} from "../Character";
import {DungeonMap, DungeonObject, DungeonZIndexes} from "../../dungeon";
import {UsableDrop} from "../../drop";
import {DigitKey, Joystick} from "../../input";
import {Monster} from "../monsters";
import {FiniteStateMachine} from "../../fsm";
import {HeroState} from "./HeroState";
import {AttackType} from "../CharacterState";

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

  scanHit(combo: number, attackType: AttackType): void {
    const weapon = this.state.weapon;
    const distance = weapon?.distance || 1;
    const direction = this.view.isLeft ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const monsters = this.scanMonsters(direction, distance);

    const damage = this.state._damage(combo, attackType);
    for (const monster of monsters) {
      monster.state.hitDamage(this, damage);
    }
    if (monsters.length > 0) {
      PIXI.sound.play('hit_damage', {speed: weapon?.speed || 1});
    }
  }

  private dashToClosestMonster(): boolean {
    const [monster] = this.scanMonsters(ScanDirection.AROUND, 12);
    if (monster) {
      this.lookAt(monster);
      const point = this.raycastDash(monster);
      return this.move(point.x, point.y);
    } else {
      return false;
    }
  }

  private raycastDash(object: DungeonObject): PIXI.Point {
    let x0 = this.x;
    let y0 = this.y;

    const x1 = object.x;
    const y1 = object.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);

    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let err = (dx > dy ? dx : -dy) / 2;

    const destination = new PIXI.Point(x0, y0);
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

      const cell = this._dungeon.cell(x0, y0);
      if (!cell.hasFloor) break;
      if (cell.collide(this)) break;

      destination.set(x0, y0);
    }

    return destination;
  }

  private raycastDodge(sx: number, sy: number, distance: number): PIXI.Point {
    let x0 = this.x;
    let y0 = this.y;
    const destination = new PIXI.Point(x0, y0);
    for (let d = 0; d < distance; d++) {
      x0 += sx;
      y0 += sy;
      const cell = this._dungeon.cell(x0, y0);
      if (!cell.hasFloor) break;
      if (cell.collide(this)) break;
      destination.set(x0, y0);
    }
    return destination;
  }

  private lookAtClosestMonster(maxDistance?: number): void {
    const distance = maxDistance || this.state.weapon?.distance || 1;
    const [monster] = this.scanMonsters(ScanDirection.AROUND, distance);
    if (monster) this.lookAt(monster);
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
      filter: monster => {
        return !monster.state.dead.get() &&
          this.distanceTo(monster) <= maxDistance &&
          this.checkDirection(direction, monster) &&
          this.raycastIsVisible(monster);
      },
      sort: (a: Monster, b: Monster): number => this.metric(a) - this.metric(b)
    });
  }

  protected fsm(): FiniteStateMachine<any> {
    const joystick = this._dungeon.controller.joystick;

    const fsm = new FiniteStateMachine<HeroBrainState>(HeroBrainState.IDLE, [
      HeroBrainState.IDLE,
      HeroBrainState.RUN,
      HeroBrainState.DODGE,
      HeroBrainState.HIT_TRIGGERED,
      HeroBrainState.LIGHT_ATTACK,
      HeroBrainState.CHARGED_DASH,
      HeroBrainState.CHARGED_ATTACK,
    ]);

    const idle = this.idle();
    const run = this.run();
    const dash = this.dash();
    const lightAttack = this.hit(new HeroHitController(this, joystick, AttackType.LIGHT));
    const chargedAttack = this.hit(new HeroHitController(this, joystick, AttackType.CHARGED));

    // IDLE
    fsm.state(HeroBrainState.IDLE)
      .nested(idle)
      .onEnter(() => this.scanDrop())
      .onUpdate(() => this.processInventory())
      .onUpdate(() => this.processModal());

    fsm.state(HeroBrainState.IDLE)
      .transitionTo(HeroBrainState.HIT_TRIGGERED)
      .condition(() => joystick.hit.once());

    fsm.state(HeroBrainState.IDLE)
      .transitionTo(HeroBrainState.DODGE)
      .condition(() => joystick.dodge.once())
      .condition(() => this.state.hasStamina(this.state.dashStamina))
      .condition(() => this.processDodge());

    fsm.state(HeroBrainState.IDLE)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.IDLE)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => idle.isFinal);

    // RUN
    fsm.state(HeroBrainState.RUN)
      .nested(run)
      .onEnter(() => this.scanDrop())
      .onUpdate(() => this.processInventory());

    fsm.state(HeroBrainState.RUN)
      .transitionTo(HeroBrainState.HIT_TRIGGERED)
      .condition(() => run.isFinal)
      .condition(() => joystick.hit.once())

    fsm.state(HeroBrainState.RUN)
      .transitionTo(HeroBrainState.DODGE)
      .condition(() => run.isFinal)
      .condition(() => joystick.dodge.once())
      .condition(() => this.state.hasStamina(this.state.dashStamina))
      .condition(() => this.processDodge());

    fsm.state(HeroBrainState.RUN)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => run.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.RUN)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => run.isFinal)

    // DODGE
    fsm.state(HeroBrainState.DODGE)
      .nested(dash)
      .onEnter(() => this.state.spendStamina(this.state.dashStamina));

    fsm.state(HeroBrainState.DODGE)
      .transitionTo(HeroBrainState.HIT_TRIGGERED)
      .condition(() => dash.isFinal)
      .condition(() => joystick.hit.once());

    fsm.state(HeroBrainState.DODGE)
      .transitionTo(HeroBrainState.DODGE)
      .condition(() => dash.isFinal)
      .condition(() => joystick.dodge.once())
      .condition(() => this.state.hasStamina(this.state.dashStamina))
      .condition(() => this.processDodge());

    fsm.state(HeroBrainState.DODGE)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => dash.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.DODGE)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => dash.isFinal);

    // HIT_TRIGGERED
    fsm.state(HeroBrainState.HIT_TRIGGERED)
      .onUpdate(() => this.lookAtClosestMonster(7))

    fsm.state(HeroBrainState.HIT_TRIGGERED)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => this.scanMonsters(ScanDirection.AROUND, 1).length === 0)
      .condition(() => this.scanAndInteract());

    fsm.state(HeroBrainState.HIT_TRIGGERED)
      .transitionTo(HeroBrainState.CHARGED_DASH)
      .condition(() => !joystick.hit.triggered && joystick.hit.duration > 500)
      .condition(() => this.state.hasStamina(this.state.dashStamina + this.state.hitStamina))
      .condition(() => this.dashToClosestMonster());

    fsm.state(HeroBrainState.HIT_TRIGGERED)
      .transitionTo(HeroBrainState.LIGHT_ATTACK)
      .condition(() => !joystick.hit.triggered)
      .condition(() => this.state.hasStamina(this.state.hitStamina));

    fsm.state(HeroBrainState.HIT_TRIGGERED)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => !joystick.hit.triggered);

    // LIGHT_ATTACK
    fsm.state(HeroBrainState.LIGHT_ATTACK)
      .nested(lightAttack)
      .onEnter(() => this.lookAtClosestMonster(1));

    fsm.state(HeroBrainState.LIGHT_ATTACK)
      .transitionTo(HeroBrainState.HIT_TRIGGERED)
      .condition(() => lightAttack.isFinal)
      .condition(() => joystick.hit.once())

    fsm.state(HeroBrainState.LIGHT_ATTACK)
      .transitionTo(HeroBrainState.DODGE)
      .condition(() => lightAttack.isFinal)
      .condition(() => joystick.dodge.once())
      .condition(() => this.state.hasStamina(this.state.dashStamina))
      .condition(() => this.processDodge());

    fsm.state(HeroBrainState.LIGHT_ATTACK)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => lightAttack.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.LIGHT_ATTACK)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => lightAttack.isFinal);

    // CHARGED_DASH
    fsm.state(HeroBrainState.CHARGED_DASH)
      .nested(dash)
      .transitionTo(HeroBrainState.CHARGED_ATTACK)
      .condition(() => dash.isFinal);

    // CHARGED_ATTACK
    fsm.state(HeroBrainState.CHARGED_ATTACK)
      .nested(chargedAttack)
      .onEnter(() => this.lookAtClosestMonster(1));

    fsm.state(HeroBrainState.CHARGED_ATTACK)
      .transitionTo(HeroBrainState.HIT_TRIGGERED)
      .condition(() => chargedAttack.isFinal)
      .condition(() => joystick.hit.once())

    fsm.state(HeroBrainState.CHARGED_ATTACK)
      .transitionTo(HeroBrainState.DODGE)
      .condition(() => chargedAttack.isFinal)
      .condition(() => joystick.dodge.once())
      .condition(() => this.state.hasStamina(this.state.dashStamina))
      .condition(() => this.processDodge());

    fsm.state(HeroBrainState.CHARGED_ATTACK)
      .transitionTo(HeroBrainState.RUN)
      .condition(() => chargedAttack.isFinal)
      .condition(() => this.processMove());

    fsm.state(HeroBrainState.CHARGED_ATTACK)
      .transitionTo(HeroBrainState.IDLE)
      .condition(() => chargedAttack.isFinal);

    return fsm;
  }

  private processMove(): boolean {
    const [dx, dy] = this._dungeon.controller.joystick.direction;
    return this.tryMove(dx, dy);
  }

  private processDodge(): boolean {
    const [sx, sy] = this._dungeon.controller.joystick.direction;
    if (sx !== 0 || sy !== 0) {
      const destination = this.raycastDodge(sx, sy, 7);
      return this.move(destination.x, destination.y);
    }
    return false;
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
  }

  private processModal(): void {
    const joystick = this._dungeon.controller.joystick;
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
  private readonly _joystick: Joystick;
  private readonly _attackType: AttackType;

  constructor(controller: Hero, joystick: Joystick, attackType: AttackType) {
    this._controller = controller;
    this._joystick = joystick;
    this._attackType = attackType;
  }

  continueCombo(): boolean {
    return this._joystick.hit.once() &&
      this._controller.state.hasStamina(this._controller.state.hitStamina);
  }

  onHit(combo: number): void {
    this._controller.scanHit(combo, this._attackType);
  }
}

const enum HeroBrainState {
  IDLE = 0,
  RUN = 1,
  DODGE = 2,
  HIT_TRIGGERED = 3,
  LIGHT_ATTACK = 4,
  CHARGED_DASH = 5,
  CHARGED_ATTACK = 6,
}