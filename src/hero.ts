import {Inventory} from "./inventory";
import {BaseCharacterAI, Character, HitAnimation, IdleAnimation} from "./character";
import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {UsableDrop, Weapon} from "./drop";
import {ObservableVar, Observable} from "./observable";
import {BarView} from "./bar.view";
import {Colors, Sizes} from "./ui";
import {DigitKey, KeyBind} from "./input";
import {PersistentState} from "./persistent.state";
import {MonsterCharacter} from "./monster";
import {NpcCharacter} from "./npc";
import * as PIXI from "pixi.js";

export const heroCharacterNames = [
  "elf_f",
  "elf_m",
  "knight_f",
  "knight_m",
  "wizard_f",
  "wizard_m",
];

export interface GlobalHeroState {
  readonly coins: number;
  readonly baseDamage: number;
  readonly level: number;
  readonly levelXp: number;
  readonly skillPoints: number;
  readonly xp: number;
  readonly healthMax: number;
  readonly speed: number;
}

const defaultGlobalState: GlobalHeroState = {
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
  private readonly persistent: PersistentState;
  private readonly _coins: ObservableVar<number>;

  get coins(): Observable<number> {
    return this._coins;
  }

  addCoins(coins: number): void {
    this._coins.update(c => c + coins);
  }

  private readonly _baseDamage: ObservableVar<number>;

  get damage(): number {
    const weapon = this.inventory.equipment.weapon.item.get() as Weapon;
    return this._baseDamage.get() + (weapon?.damage || 0);
  }

  readonly inventory: Inventory = new Inventory(this);

  private readonly _level: ObservableVar<number>;
  private readonly _levelXp: ObservableVar<number>;
  private readonly _skillPoints: ObservableVar<number>;
  private readonly _xp: ObservableVar<number>;

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
      while (true) {
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

  private constructor(name: string, state: GlobalHeroState, persistent: PersistentState) {
    super({
      name: name,
      speed: state.speed,
      healthMax: state.healthMax
    });
    this.persistent = persistent;
    this._coins = new ObservableVar(state.coins);
    this._baseDamage = new ObservableVar<number>(state.baseDamage);
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
    this.persistent.global.save(this.name, this.state);
  }

  private get state(): GlobalHeroState {
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
    let state: GlobalHeroState = persistent.global.load(name) || defaultGlobalState;
    return new Hero(name, state, persistent);
  }
}

export class HeroAI extends BaseCharacterAI {
  readonly character: Hero;

  constructor(character: Hero, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {x: x, y: y, zIndex: DungeonZIndexes.hero});
    this.character = character;
    this.init();
    this.character.inventory.equipment.weapon.item.subscribe(this.onWeaponUpdate, this);
    this.character.inventory.drop.subscribe(this.onDrop, this);
  }

  destroy(): void {
    super.destroy();
    this.character.inventory.equipment.weapon.item.unsubscribe(this.onWeaponUpdate, this);
    this.character.inventory.drop.unsubscribe(this.onDrop, this);
  }

  protected onKilledBy(by: Character): void {
    this.dungeon.log(`${this.character.name} killed by ${by.name}`);
  }

  protected onDead(): void {
    this.dungeon.controller.dead();
  }

  private onDrop(event: [UsableDrop, number]): void {
    let [drop] = event;
    const cell = this.findDropCell();
    if (cell) {
      cell.drop = drop;
    }
  }

  private onWeaponUpdate(weapon: UsableDrop | null): void {
    this.view.setWeapon(weapon as Weapon);
  }

  action(finished: boolean): boolean {
    if (!this.character.dead.get()) {

      const idle = this.animation instanceof IdleAnimation;

      if (finished) {
        this.scanDrop();
      }

      const joystick = this.dungeon.controller.joystick;

      if (idle && joystick.inventory.once()) {
        this.dungeon.controller.showInventory(this.character);
        this.idle();
        return true;
      }

      for (let d = 0; d <= 9; d++) {
        const digit = (d + 1) % 10;
        if (joystick.digit(digit as DigitKey).once()) {
          const cell = this.character.inventory.belt.cell(d);
          const item = cell.item.get();
          if (item && (item instanceof Weapon || idle)) {
            cell.use();
          }
        }
      }

      if (idle && joystick.drop.once()) {
        this.character.inventory.equipment.weapon.drop();
      }

      if (idle || finished) {
        const triggered = joystick.hit.triggered;
        const once = joystick.hit.once();

        if (triggered || once) {
          if (this.dungeon.cell(this.view.pos_x, this.view.pos_y).isLadder) {
            this.dungeon.controller.updateHero({
              level: this.dungeon.level + 1,
              hero: this.character,
            });
            return true;
          }
        }

        if (once) {
          const npc = this.scanNpc(this.view.is_left);
          if (npc.length > 0) {
            this.dungeon.controller.showDialog(this.character, npc[0]);
            this.idle();
            return true;
          }
        }

        if (triggered || once) {
          this.hit();
          return true;
        }
      }

      if (idle || finished) {
        const d_x = HeroAI.delta(joystick.moveLeft, joystick.moveRight);
        const d_y = HeroAI.delta(joystick.moveUp, joystick.moveDown);

        if (d_x !== 0 || d_y !== 0) {
          if (this.move(d_x, d_y)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private static delta(a: KeyBind, b: KeyBind): number {
    if (a.triggered) {
      return -1;
    } else if (b.triggered) {
      return 1;
    } else {
      return 0;
    }
  }

  scanDrop() {
    const cell = this.dungeon.cell(this.view.pos_x, this.view.pos_y);
    if (cell.hasDrop) {
      if (cell.pickedUp(this.character)) {
        PIXI.sound.play('fruit_collect');
      }
    }
  }

  scanNpc(is_left: boolean): NpcCharacter[] {
    return this.scan(is_left, 1, c => c instanceof NpcCharacter) as NpcCharacter[];
  }

  scanMonsters(is_left: boolean): MonsterCharacter[] {
    const weapon = this.character.inventory.equipment.weapon.item.get() as Weapon;
    return this.scan(is_left, weapon?.distance || 1, c => c instanceof MonsterCharacter) as MonsterCharacter[];
  }

  monstersHealth(is_left: boolean): number {
    return this.scanMonsters(is_left).map(m => m.health.get()).reduce((a, b) => a + b, 0);
  }

  scanHit() {
    const monsters = this.scanMonsters(this.view.is_left);
    for (let monster of monsters) {
      monster.hitDamage(this.character, this.character.damage);
    }
    if (monsters.length > 0) {
      const weapon = this.character.inventory.equipment.weapon.item.get();
      const speed = weapon ? (weapon as Weapon).speed : 1;
      PIXI.sound.play('hit_damage', {speed: speed});
    }
  }

  hit(): void {
    const weapon = this.character.inventory.equipment.weapon.item.get() as Weapon;
    this.animation = new HitAnimation(this.view, this.dungeon.ticker, {
      sprite: this.character.name + '_idle',
      speed: weapon?.speed || this.character.speed,
      curve: weapon?.curve,
      start: () => this.lookAtMonsters(),
      finish: () => {
        this.scanHit();
        if (!this.action(true)) {
          this.idle();
        }
      },
    });
  }

  protected onPositionChanged(): void {
    this.dungeon.camera(this.view.position.x, this.view.position.y);
  }

  protected lookAtMonsters(): void {
    const leftHealthSum = this.monstersHealth(true);
    const rightHealthSum = this.monstersHealth(false);
    if (leftHealthSum > 0 && leftHealthSum > rightHealthSum) {
      this.view.is_left = true;
    } else if (rightHealthSum > 0 && rightHealthSum > leftHealthSum) {
      this.view.is_left = false;
    }
  }
}

export class HeroStateView extends PIXI.Container {
  private readonly heroState: Hero;
  private readonly health: BarView;
  private readonly xp: BarView;
  private readonly coins: PIXI.BitmapText;

  private readonly fixedHPSize: boolean;
  private readonly hpBarSize: number;
  private readonly maxBarSize: number;
  private readonly maxBarInnerSize: number;

  constructor(heroState: Hero, options: {
    fixedHPSize: boolean
    hpBarSize?: number
    maxBarSize?: number
  }) {
    super();
    this.fixedHPSize = options.fixedHPSize;
    this.hpBarSize = options.hpBarSize || 8;
    this.maxBarSize = options.maxBarSize || 256;
    this.maxBarInnerSize = this.maxBarSize - (Sizes.uiBorder << 1);

    const barHeight = 18 + (Sizes.uiBorder << 1);
    const offsetY = barHeight + Sizes.uiMargin;

    this.heroState = heroState;
    this.health = new BarView({
      color: Colors.uiRed,
      width: 0,
      widthMax: this.maxBarInnerSize
    });
    this.xp = new BarView({
      color: Colors.uiYellow,
      width: 0,
      widthMax: this.maxBarInnerSize
    });
    this.xp.position.set(0, offsetY);

    this.coins = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this.coins.position.set(0, offsetY * 2);

    super.addChild(this.health, this.xp, this.coins);

    heroState.health.subscribe(this.updateHealth, this);
    heroState.healthMax.subscribe(this.updateHealthMax, this);
    heroState.level.subscribe(this.updateXp, this);
    heroState.levelXp.subscribe(this.updateXp, this);
    heroState.skillPoints.subscribe(this.updateXp, this);
    heroState.xp.subscribe(this.updateXp, this);
    heroState.coins.subscribe(this.updateCoins, this);
  }

  destroy(): void {
    super.destroy();
    this.heroState.health.unsubscribe(this.updateHealth, this);
    this.heroState.healthMax.unsubscribe(this.updateHealthMax, this);
    this.heroState.level.unsubscribe(this.updateXp, this);
    this.heroState.levelXp.unsubscribe(this.updateXp, this);
    this.heroState.skillPoints.unsubscribe(this.updateXp, this);
    this.heroState.xp.unsubscribe(this.updateXp, this);
    this.heroState.coins.unsubscribe(this.updateCoins, this);
  }

  private updateHealthMax(healthMax: number) {
    const health = this.heroState.health.get();
    if (!this.fixedHPSize) {
      this.health.widthMax = this.hpBarSize * healthMax;
    }
    this.health.label = `${health}/${healthMax}`;
  }

  private updateHealth(health: number) {
    const healthMax = this.heroState.healthMax.get();
    if (this.fixedHPSize) {
      this.health.width = Math.floor(this.maxBarInnerSize * health / healthMax);
    } else {
      this.health.width = this.hpBarSize * health;
    }
    this.health.label = `${health}/${healthMax}`;
  }

  private updateXp() {
    const level = this.heroState.level.get();
    const levelXp = this.heroState.levelXp.get();
    const skillPoints = this.heroState.skillPoints.get();
    const xp = this.heroState.xp.get();

    this.xp.widthMax = this.maxBarInnerSize;
    this.xp.width = Math.floor(this.maxBarInnerSize * xp / levelXp);
    this.xp.label = `L:${level} XP:${xp}/${levelXp} SP:${skillPoints}`;
  }

  private updateCoins(coins: number) {
    this.coins.text = `$${coins}`;
  }
}

