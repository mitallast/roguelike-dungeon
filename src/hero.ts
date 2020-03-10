import {Inventory} from "./inventory";
import {AnimationState, BaseCharacterView, BaseMonsterView, Character, CharacterView} from "./character";
import {DungeonCellView, DungeonLevel} from "./dungeon.level";
import {Weapon} from "./drop";
import {Observable, Publisher, Subscription} from "./observable";
import {BarView} from "./bar.view";
import {Colors, Sizes} from "./ui";
// @ts-ignore
import * as PIXI from "pixi.js";

export const heroMonsterNames = [
  "elf_f",
  "elf_m",
  "knight_f",
  "knight_m",
  "wizard_f",
  "wizard_m",
];

export class HeroCharacter implements Character {
  readonly name: string;

  readonly speed: number = 0.2;

  private readonly _healthMax: Observable<number> = new Observable(30);
  private readonly _health: Observable<number> = new Observable(this._healthMax.get());
  private readonly _dead: Observable<boolean> = new Observable(false);

  get healthMax(): Publisher<number> {
    return this._healthMax;
  }

  get health(): Publisher<number> {
    return this._health;
  }

  get dead(): Publisher<boolean> {
    return this._dead;
  }

  hill(health: number): void {
    this._health.update(h => Math.min(this._healthMax.get(), h + health));
  }

  hitDamage(damage: number): void {
    this._health.update((h) => Math.max(0, h - damage));
    if (this._health.get() === 0) {
      this._dead.set(true);
    }
  }

  private readonly _coins: Observable<number> = new Observable(0);

  get coins(): Publisher<number> {
    return this._coins;
  }

  addCoins(coins: number): void {
    this._coins.update(c => c + coins);
  }

  readonly baseDamage: number = 0;

  get damage(): number {
    return this.baseDamage + (this.inventory.equipment.weapon.get()?.damage || 0);
  }

  readonly inventory: Inventory = new Inventory(this);

  private readonly _level: Observable<number> = new Observable(0);
  private readonly _levelXp: Observable<number> = new Observable(1000);
  private readonly _skillPoints: Observable<number> = new Observable(0);

  private readonly _xp: Observable<number> = new Observable(0);

  get level(): Publisher<number> {
    return this._level;
  }

  get levelXp(): Publisher<number> {
    return this._levelXp;
  }

  get skillPoints(): Publisher<number> {
    return this._skillPoints;
  }

  get xp(): Publisher<number> {
    return this._xp;
  }

  addXp(value: number): void {
    console.log("add xp", value);
    this._xp.update((v) => {
      let newXp = v + value;
      console.log("newXp", newXp);
      while (true) {
        const levelXp = this._levelXp.get();
        if (newXp >= levelXp) {
          console.log("add level");
          newXp = newXp - levelXp;
          this._level.update((v) => v + 1);
          this._levelXp.update((v) => v + 1000);
          this._skillPoints.update((v) => v + 1);
        } else {
          console.log("no new level");
          break;
        }
      }
      console.log("newXp", newXp);
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
    this.name = name;
  }
}

const TILE_SIZE = 16;

export class HeroView extends BaseCharacterView {
  readonly character: HeroCharacter;

  private weaponSprite: PIXI.Sprite = null;
  private readonly weaponSub: Subscription;

  constructor(character: HeroCharacter, dungeon: DungeonLevel, x: number, y: number) {
    super(dungeon, 1, 1, x, y);
    this.character = character;
    this.init();
    this.weaponSub = this.character.inventory.equipment.weapon.subscribe(this.onWeaponUpdate.bind(this));
  }

  protected action(): boolean {
    if (!this.character.dead.get()) {

      this.scanDrop();
      const joystick = this.dungeon.controller.joystick;

      for (let d = 0; d < 10; d++) {
        const digit = (d + 1) % 10;
        if (!joystick.digit(digit).processed) {
          joystick.digit(digit).processed = true;
          this.character.inventory.belt.cell(d).use();
        }
      }
      if (!joystick.drop.processed) {
        joystick.drop.processed = true;
        this.dropWeapon();
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

  private dropWeapon() {
    if (this.character.inventory.equipment.weapon.get()) {
      const max_distance = 5;
      const pos_x = this.x;
      const pos_y = this.y;
      const is_left = this.is_left;

      const cells: DungeonCellView[] = [];
      for (let x = Math.max(0, pos_x - max_distance); x < pos_x + max_distance; x++) {
        for (let y = Math.max(0, this.y - max_distance); y < this.y + max_distance; y++) {
          if (!(x === pos_x && y === this.y)) {
            const cell = this.dungeon.cell(x, y);
            if (cell.hasFloor && !cell.hasDrop) {
              cells.push(cell);
            }
          }
        }
      }

      const metric = (a: DungeonCellView) => {
        return Math.sqrt(Math.pow(a.x - pos_x, 2) + Math.pow(a.y - pos_y, 2)) +
          (a.y !== pos_y ? 1 : 0) + // boost X
          (is_left ? (a.x < pos_x ? 0 : 1) : (a.x > pos_x ? 0 : 1)); // boost side
      };

      if (cells.length > 0) {
        cells.sort((a, b) => metric(a) - metric(b));
        const cell = cells[0];
        cell.drop = this.character.inventory.equipment.weapon.get();
        this.character.inventory.equipment.weapon.set(null);
        return;
      }
    }
  }

  private onWeaponUpdate(weapon: Weapon): void {
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
      (this as PIXI.Container).addChild(this.weaponSprite);
      (this as PIXI.Container).sortChildren();
    }
  }

  protected onSetSprite(): void {
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

  private scanHit() {
    const max_distance = this.character.inventory.equipment.weapon.get()?.distance || 1;

    const scan_x_min = this.is_left ? Math.max(0, this.x - max_distance) : this.x;
    const scan_x_max = this.is_left ? this.x : Math.min(this.dungeon.width, this.x + max_distance);

    const scan_y_min = Math.max(0, this.y - max_distance);
    const scan_y_max = Math.min(this.dungeon.height - 1, this.y + max_distance);

    const hitSet = new Set<CharacterView>();

    for (let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
      for (let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
        if (!(s_x === this.x && s_y === this.y)) {
          const monster = this.dungeon.character(s_x, s_y);
          if (monster && monster instanceof BaseMonsterView) {
            hitSet.add(monster);
          }
        }
      }
    }
    for (let monster of hitSet) {
      monster.hitDamage(this.character, this.character.damage);
    }
  }

  protected onSetAnimationHit(): void {
    this.setSprite('_idle');
    if (this.character.inventory.equipment.weapon.get()) {
      this.sprite.animationSpeed = this.character.inventory.equipment.weapon.get().speed;
    }
  }

  protected animateIdle(): void {
    if (!this.action()) {
      if (!this.sprite.playing) {
        this.setAnimation(AnimationState.Idle);
      }
    }
  }

  protected animateHit(): void {
    if (this.weaponSprite) {
      const delta = this.duration / (this.sprite.totalFrames / this.sprite.animationSpeed);
      this.weaponSprite.angle = (this.is_left ? -90 : 90) * delta;
    }

    if (!this.sprite.playing) {
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

  hitDamage(by: Character, damage: number): void {
    if (!this.character.dead.get()) {
      this.dungeon.log.push(`${this.character.name} damaged ${damage} by ${by.name}`);
      this.character.hitDamage(damage);
      if (this.character.dead.get()) {
        this.dungeon.log.push(`${this.character.name} killed by ${name}`);
        this.setAnimation(AnimationState.Idle);
        this.dungeon.dead();
      }
    }
  }

  protected onDestroy(): void {
    this.weaponSub.unsubscribe();
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

  private readonly healthSub: Subscription;
  private readonly healthMaxSub: Subscription;
  private readonly levelSub: Subscription;
  private readonly levelXpSub: Subscription;
  private readonly skillPointsSub: Subscription;
  private readonly xpSub: Subscription;
  private readonly coinsSub: Subscription;

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
    (this.xp as PIXI.Container).position.set(0, offsetY);

    this.coins = new PIXI.BitmapText("", {font: {name: "alagard", size: 16}});
    this.coins.position.set(0, offsetY * 2);

    super.addChild(this.health, this.xp, this.coins);

    this.healthSub = heroState.health.subscribe(this.updateHealth.bind(this));
    this.healthMaxSub = heroState.healthMax.subscribe(this.updateHealthMax.bind(this));
    this.levelSub = heroState.level.subscribe(this.updateXp.bind(this));
    this.levelXpSub = heroState.levelXp.subscribe(this.updateXp.bind(this));
    this.skillPointsSub = heroState.skillPoints.subscribe(this.updateXp.bind(this));
    this.xpSub = heroState.xp.subscribe(this.updateXp.bind(this));
    this.coinsSub = heroState.coins.subscribe(this.updateCoins.bind(this));
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

  destroy(): void {
    super.destroy();
    this.healthSub.unsubscribe();
    this.levelSub.unsubscribe();
    this.levelXpSub.unsubscribe();
    this.skillPointsSub.unsubscribe();
    this.xpSub.unsubscribe();
    this.coinsSub.unsubscribe();
  }
}

