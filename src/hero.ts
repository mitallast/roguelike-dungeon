import {Inventory} from "./inventory";
import {AnimationState, BaseCharacterView, Character, MonsterCharacter} from "./character";
import {DungeonLevel} from "./dungeon.level";
import {UsableDrop, Weapon} from "./drop";
import {ObservableVar, Observable} from "./observable";
import {BarView} from "./bar.view";
import {Colors, Sizes} from "./ui";
import {DigitKey} from "./input";
import * as PIXI from "pixi.js";

export const heroMonsterNames = [
  "elf_f",
  "elf_m",
  "knight_f",
  "knight_m",
  "wizard_f",
  "wizard_m",
];

export class HeroCharacter extends Character {
  private readonly _coins: ObservableVar<number> = new ObservableVar(0);

  get coins(): Observable<number> {
    return this._coins;
  }

  addCoins(coins: number): void {
    this._coins.update(c => c + coins);
  }

  readonly baseDamage: number = 3;

  get damage(): number {
    const weapon = this.inventory.equipment.weapon.item.get() as Weapon;
    return this.baseDamage + (weapon?.damage || 0);
  }

  readonly inventory: Inventory = new Inventory(this);

  private readonly _level: ObservableVar<number> = new ObservableVar(0);
  private readonly _levelXp: ObservableVar<number> = new ObservableVar(1000);
  private readonly _skillPoints: ObservableVar<number> = new ObservableVar(0);

  private readonly _xp: ObservableVar<number> = new ObservableVar(0);

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

  constructor(name: string) {
    super({
      name: name,
      speed: 0.2,
      healthMax: 30
    });
  }
}

const TILE_SIZE = 16;

export class HeroView extends BaseCharacterView {
  readonly character: HeroCharacter;

  private weaponSprite: PIXI.Sprite | null = null;

  constructor(character: HeroCharacter, dungeon: DungeonLevel, x: number, y: number) {
    super(dungeon, 1, 1, x, y);
    this.character = character;
    this.init();
    this.character.inventory.equipment.weapon.item.subscribe(this.onWeaponUpdate, this);
    this.character.inventory.drop.subscribe(this.onDrop, this);
  }

  protected onDestroy(): void {
    this.character.inventory.equipment.weapon.item.unsubscribe(this.onWeaponUpdate, this);
    this.character.inventory.drop.unsubscribe(this.onDrop, this);
  }

  protected action(): boolean {
    if (!this.character.dead.get()) {

      this.scanDrop();
      const joystick = this.dungeon.controller.joystick;

      if (!joystick.inventory.processed) {
        joystick.inventory.processed = true;
        this.dungeon.controller.showInventory(this.character);
        return true;
      }

      for (let d = 0; d <= 9; d++) {
        const digit = (d + 1) % 10;
        if (!joystick.digit(digit as DigitKey).processed) {
          joystick.digit(digit as DigitKey).processed = true;
          this.character.inventory.belt.cell(d).use();
        }
      }
      if (!joystick.drop.processed) {
        joystick.drop.processed = true;
        this.character.inventory.equipment.weapon.drop();
      }

      if (joystick.hit.triggered || !joystick.hit.processed) {
        if (this.dungeon.cell(this.x, this.y).isLadder) {
          joystick.hit.reset();
          this.dungeon.exit();
        } else {
          joystick.hit.processed = true;
          this.setAnimation(AnimationState.Hit);
        }
        return true;
      }

      let d_y = 0;
      if (joystick.moveUp.triggered || !joystick.moveUp.processed) {
        joystick.moveUp.processed = true;
        d_y = -1;
      } else if (joystick.moveDown.triggered || !joystick.moveDown.processed) {
        joystick.moveDown.processed = true;
        d_y = 1;
      }

      let d_x = 0;
      if (joystick.moveLeft.triggered || !joystick.moveLeft.processed) {
        joystick.moveLeft.processed = true;
        d_x = -1;
      } else if (joystick.moveRight.triggered || !joystick.moveRight.processed) {
        joystick.moveRight.processed = true;
        d_x = 1;
      }

      if (d_x !== 0 || d_y !== 0) {
        if (this.move(d_x, d_y)) {
          return true;
        }
      }
    }
    return false;
  }

  private onDrop(event: [UsableDrop, number]): void {
    let [drop] = event;
    const cell = this.findDropCell();
    if (cell) {
      cell.drop = drop;
    }
  }

  private onWeaponUpdate(weapon: UsableDrop | null): void {
    this.weaponSprite?.destroy();
    this.weaponSprite = null;
    if (weapon) {
      this.weaponSprite = weapon.sprite();
      this.weaponSprite.zIndex = 2;
      this.weaponSprite.position.x = TILE_SIZE;
      this.weaponSprite.position.y = TILE_SIZE - 4;
      if (this.is_left) {
        this.weaponSprite.position.x = 0;
        this.weaponSprite.scale.x = -1;
      }
      this.weaponSprite.anchor.set(0.5, 1);
      this.addChild(this.weaponSprite);
      this.sortChildren();
    }
  }

  protected onSetSprite(): void {
    this.updateWeaponOrientation();
  }

  protected onSetOrientation(): void {
    this.updateWeaponOrientation();
  }

  private updateWeaponOrientation(): void {
    if (this.weaponSprite) {
      if (this.is_left) {
        this.weaponSprite.position.x = 0;
        this.weaponSprite.scale.x = -1;
      } else {
        this.weaponSprite.position.x = TILE_SIZE;
        this.weaponSprite.scale.x = 1;
      }
    }
  }

  private scanDrop() {
    const cell = this.dungeon.cell(this.x, this.y);
    if (cell.hasDrop) {
      cell.pickedUp(this.character);
    }
  }

  private scanMonsters(is_left: boolean): MonsterCharacter[] {
    const weapon = this.character.inventory.equipment.weapon.item.get() as Weapon;
    const max_distance = weapon?.distance || 1;

    const scan_x_min = is_left ? Math.max(0, this.x - max_distance) : this.x;
    const scan_x_max = is_left ? this.x : Math.min(this.dungeon.width, this.x + max_distance);

    const scan_y_min = Math.max(0, this.y - max_distance);
    const scan_y_max = Math.min(this.dungeon.height - 1, this.y + max_distance);

    const monsters = new Set<MonsterCharacter>();

    for (let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
      for (let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
        if (!(s_x === this.x && s_y === this.y)) {
          const view = this.dungeon.character(s_x, s_y);
          if (view && view.character instanceof MonsterCharacter) {
            monsters.add(view.character);
          }
        }
      }
    }
    return [...monsters];
  }

  private scanHit() {
    const monsters = this.scanMonsters(this.is_left);
    for (let monster of monsters) {
      monster.hitDamage(this.character, this.character.damage);
    }
  }

  protected onSetAnimationHit(): void {
    this.setSprite('_idle');
    const weapon = this.character.inventory.equipment.weapon.item.get();
    if (this.sprite && weapon instanceof Weapon) {
      this.sprite.animationSpeed = weapon.speed;
    }

    // automatically rotate hero to monsters
    const leftHealthSum = this.scanMonsters(true).map(m => m.health.get()).reduce((a, b) => a + b, 0);
    const rightHealthSum = this.scanMonsters(false).map(m => m.health.get()).reduce((a, b) => a + b, 0);
    if (leftHealthSum > 0 && leftHealthSum > rightHealthSum) {
      this.is_left = true;
    } else if (rightHealthSum > 0 && rightHealthSum > leftHealthSum) {
      this.is_left = false;
    }
  }

  protected animateIdle(): void {
    if (!this.action()) {
      if (!this.sprite || !this.spritePlay) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  protected animateHit(): void {
    if (this.weaponSprite && this.sprite) {
      const delta = this.spriteTime / this.sprite.totalFrames;
      this.weaponSprite.angle = (this.is_left ? -90 : 90) * delta;
    }

    if (!this.sprite || !this.spritePlay) {
      if (this.weaponSprite) {
        this.weaponSprite.angle = 0;
      }

      this.scanHit();
      this.scanDrop();
      if (!this.action()) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  protected onKilledBy(by: Character): void {
    this.dungeon.log(`${this.character.name} killed by ${by.name}`);
  }

  protected onDead(): void {
    this.setAnimation(AnimationState.Idle);
    this.dungeon.dead();
  }
}

export class HeroStateView extends PIXI.Container {
  private readonly heroState: HeroCharacter;
  private readonly health: BarView;
  private readonly xp: BarView;
  private readonly coins: PIXI.BitmapText;

  private readonly fixedHPSize: boolean;
  private readonly hpBarSize: number;
  private readonly maxBarSize: number;
  private readonly maxBarInnerSize: number;

  constructor(heroState: HeroCharacter, options: {
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

