import {Inventory} from "./inventory";
import {Resources} from "./resources";
import {Joystick} from "./input";
import {Character, CharacterState} from "./character";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {Weapon} from "./drop";
import {Observable, Publisher, Subscription} from "./observable";
import {View} from "./view";
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

export class HeroState {
  readonly name: string;

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

export class HeroView implements Character, View {
  private readonly level: DungeonLevel;
  private readonly resources: Resources;
  private readonly joystick: Joystick;
  readonly heroState: HeroState;

  x: number = -1;
  y: number = -1;
  new_x: number = -1;
  new_y: number = -1;
  is_left: boolean = false;
  state: CharacterState;

  get name(): string {
    return this.heroState.name;
  }

  private readonly speed: number = 0.2;
  private duration: number;

  // view
  private sprite: PIXI.AnimatedSprite;

  private weaponSprite: PIXI.Sprite = null;
  private readonly weaponSub: Subscription;

  readonly container: PIXI.Container;

  constructor(level: DungeonLevel, heroState: HeroState) {
    this.level = level;
    this.resources = level.controller.resources;
    this.joystick = level.controller.joystick;
    this.heroState = heroState;
    this.container = new PIXI.Container();
    this.container.zIndex = DungeonZIndexes.character;
    this.level.container.addChild(this.container);
    this.setAnimation(CharacterState.Idle);

    this.weaponSub = this.heroState.inventory.equipment.weapon.subscribe(this.onWeaponUpdate.bind(this));
  }

  update(delta: number): void {
    this.duration += delta;
    this.animate();
  }

  destroy(): void {
    this.weaponSub.unsubscribe();
    this.sprite?.destroy();
    this.weaponSprite?.destroy();
    this.container.destroy();
  }

  private setSprite(postfix: string): void {
    this.sprite?.destroy();
    this.sprite = this.resources.animated(this.heroState.name + postfix);
    this.sprite.loop = false;
    this.sprite.animationSpeed = this.speed;
    this.sprite.anchor.set(0, 1);
    this.sprite.position.y = TILE_SIZE - 2;
    this.sprite.zIndex = 1;
    this.sprite.play();
    this.container.addChild(this.sprite);
    this.container.sortChildren();
    this.duration = 0;

    if (this.is_left) {
      this.sprite.position.x = this.sprite.width;
      this.sprite.scale.x = -1;
      if (this.weaponSprite) {
        this.weaponSprite.position.x = 0;
        this.weaponSprite.scale.x = -1;
      }
    } else {
      this.sprite.position.x = 0;
      this.sprite.scale.x = 1;
      if (this.weaponSprite) {
        this.weaponSprite.position.x = TILE_SIZE;
        this.weaponSprite.scale.x = 1;
      }
    }
  }

  private setAnimation(state: CharacterState) {
    switch (state) {
      case CharacterState.Idle:
        this.state = state;
        this.setSprite('_idle');
        break;
      case CharacterState.Run:
        if (!this.heroState.dead.get()) {
          this.state = state;
          this.setSprite('_run');
        }
        break;
      case CharacterState.Hit:
        if (!this.heroState.dead.get()) {
          this.state = state;
          this.setSprite('_idle');
          if (this.heroState.inventory.equipment.weapon.get()) {
            this.sprite.animationSpeed = this.heroState.inventory.equipment.weapon.get().speed;
          }
        }
        break;
    }
  }

  private animate() {
    switch (this.state) {
      case CharacterState.Idle:
        if (!this.action()) {
          if (!this.sprite.playing) {
            this.setAnimation(CharacterState.Idle);
          }
        }
        break;
      case CharacterState.Run:
        const delta = this.duration / (this.sprite.totalFrames / this.sprite.animationSpeed);
        const t_x = this.x * TILE_SIZE + TILE_SIZE * (this.new_x - this.x) * delta;
        const t_y = this.y * TILE_SIZE + TILE_SIZE * (this.new_y - this.y) * delta;
        this.container.position.set(t_x, t_y);

        if (!this.sprite.playing) {
          this.resetPosition(this.new_x, this.new_y);
          if (!this.action()) {
            this.setAnimation(CharacterState.Idle);
          }
        }
        break;
      case CharacterState.Hit:
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
            this.setAnimation(CharacterState.Idle);
          }
        }
        break;
    }
  }

  private action() {
    if (!this.heroState.dead.get()) {
      this.scanDrop();
      for (let d = 0; d < 10; d++) {
        const digit = (d + 1) % 10;
        if (!this.joystick.digit(digit).processed) {
          this.joystick.digit(digit).processed = true;
          this.heroState.inventory.belt.cell(d).use();
        }
      }
      if (!this.joystick.drop.processed) {
        this.joystick.drop.processed = true;
        this.dropWeapon();
      }

      if (this.joystick.hit.triggered || !this.joystick.hit.processed) {
        if (this.level.cell(this.x, this.y).isLadder) {
          this.joystick.hit.reset();
          this.level.exit();
        } else {
          this.joystick.hit.processed = true;
          this.setAnimation(CharacterState.Hit);
        }
        return true;
      }

      let d_y = 0;
      if (this.joystick.moveUp.triggered || !this.joystick.moveUp.processed) {
        this.joystick.moveUp.processed = true;
        d_y = -1;
      } else if (this.joystick.moveDown.triggered || !this.joystick.moveDown.processed) {
        this.joystick.moveDown.processed = true;
        d_y = 1;
      }

      let d_x = 0;
      if (this.joystick.moveLeft.triggered || !this.joystick.moveLeft.processed) {
        this.joystick.moveLeft.processed = true;
        this.is_left = true;
        d_x = -1;
      } else if (this.joystick.moveRight.triggered || !this.joystick.moveRight.processed) {
        this.joystick.moveRight.processed = true;
        this.is_left = false;
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
    if (this.heroState.inventory.equipment.weapon.get()) {
      const max_distance = 5;
      let left_x = this.x;
      let right_x = this.x;
      let min_y = this.y;
      let max_y = this.y;
      // find free floor cell;

      // scan from center by x
      for (let dist_x = 0; dist_x < max_distance; dist_x++) {
        left_x--;
        right_x++;
        min_y--;
        max_y++;

        // scan from center by y
        let t_y = this.y;
        let b_y = this.y;
        for (let dist_y = 0; dist_y <= dist_x; dist_y++) {
          let scan_x = this.is_left ? [left_x, right_x] : [right_x, left_x];
          let scan_y = [t_y, b_y];

          for (let i = 0; i < 2; i++) {
            let s_x = scan_x[i];
            for (let j = 0; j < 2; j++) {
              let s_y = scan_y[j];
              if (s_x >= 0 && s_y >= 0) {
                const cell = this.level.cell(s_x, s_y);
                if (!cell.hasDrop && cell.hasFloor) {
                  cell.drop = this.heroState.inventory.equipment.weapon.get();
                  this.heroState.inventory.equipment.weapon.set(null);
                  return;
                }
              }
            }
          }

          t_y--;
          b_y++;
        }

        // after reach max y, scan to center by x
        for (let dist_r = 0; dist_r < dist_x; dist_x++) {
          left_x++;
          right_x--;

          let scan_x = this.is_left ? [left_x, right_x] : [right_x, left_x];
          let scan_y = [t_y, b_y];

          for (let i = 0; i < 2; i++) {
            let s_x = scan_x[i];
            for (let j = 0; j < 2; j++) {
              let s_y = scan_y[j];
              if (s_x >= 0 && s_y >= 0) {
                const cell = this.level.cell(s_x, s_y);
                if (!cell.hasDrop && cell.hasFloor) {
                  cell.drop = this.heroState.inventory.equipment.weapon.get();
                  this.heroState.inventory.equipment.weapon.set(null);
                  return;
                }
              }
            }
          }
        }
      }
    }
  }

  private scanDrop() {
    const cell = this.level.cell(this.x, this.y);
    if (cell.hasDrop) {
      cell.pickedUp(this.heroState);
    }
  }

  private scanHit() {
    const max_distance = this.heroState.inventory.equipment.weapon.get()?.distance || 1;
    // search only left or right path
    const scan_x_min = this.is_left ? Math.max(0, this.x - max_distance) : this.x;
    const scan_x_max = this.is_left ? this.x : Math.min(this.level.width, this.x + max_distance);

    const scan_y_min = Math.max(0, this.y - max_distance);
    const scan_y_max = Math.min(this.level.height - 1, this.y + max_distance);

    const hitSet = new Set<Character>();

    for (let s_y = scan_y_min; s_y <= scan_y_max; s_y++) {
      for (let s_x = scan_x_min; s_x <= scan_x_max; s_x++) {
        // not self
        if (!(s_x === this.x && s_y === this.y)) {
          const monster = this.level.characterMap[s_y][s_x];
          if (monster) {
            hitSet.add(monster);
          }
        }
      }
    }
    console.log(hitSet);
    for (let monster of hitSet) {
      monster.hitDamage(this, this.heroState.damage);
    }
  }

  private move(d_x: number, d_y: number) {
    if (!this.heroState.dead.get() && this.state === CharacterState.Idle || this.state === CharacterState.Run) {
      const new_x = this.x + d_x;
      const new_y = this.y + d_y;

      const cell = this.level.cell(new_x, new_y);

      // check is floor exists
      if (!cell.hasFloor) return false;
      // check is no monster
      if (this.level.characterMap[new_y][new_x]) return false;

      this.markNewPosition(new_x, new_y);
      this.setAnimation(CharacterState.Run);
      return true;
    }
    return false;
  }

  private markNewPosition(x: number, y: number) {
    this.level.characterMap[y][x] = this;
    this.new_x = x;
    this.new_y = y;
  }

  resetPosition(x: number, y: number) {
    if (this.x >= 0 && this.y >= 0) {
      this.level.characterMap[this.y][this.x] = null;
    }
    this.x = x;
    this.y = y;
    this.new_x = x;
    this.new_y = y;
    this.level.characterMap[y][x] = this;
    this.container.position.set(x * TILE_SIZE, y * TILE_SIZE);
  }

  hitDamage(monster: Character, damage: number) {
    if (!this.heroState.dead.get()) {
      this.level.log.push(`${this.heroState.name} damaged ${damage} by ${monster.name}`);
      this.heroState.hitDamage(damage);
      if (this.heroState.dead.get()) {
        this.level.log.push(`${this.heroState.name} killed by ${name}`);
        this.setAnimation(CharacterState.Idle);
        this.level.dead();
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
      this.container.addChild(this.weaponSprite);
      this.container.sortChildren();
    }
  }
}

export class HeroStateView extends PIXI.Container {
  private readonly heroState: HeroState;
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

  constructor(heroState: HeroState, options: {
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

