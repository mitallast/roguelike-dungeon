import {DungeonLevel} from "./dungeon.level";
import {MonsterCharacter, BaseMonsterView} from "./character";
import {View} from "./view";
import {Observable, Publisher, Subscription} from "./observable";
import {Colors} from "./ui";
import {BarView} from "./bar.view";
// @ts-ignore
import * as PIXI from 'pixi.js';

export const mossMonsterNames = [
  "ogre",
  "big_zombie",
  "big_demon",
];

export class BossMonster implements MonsterCharacter {
  readonly name: string;

  private readonly _healthMax: Observable<number>;
  private readonly _health: Observable<number>;
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

  readonly damage: number = 7;
  readonly luck: number = 0.4;
  readonly speed: number = 0.2;
  readonly xp: number;

  constructor(name: string, level: number) {
    this.name = name;
    this._healthMax = new Observable(50 + Math.floor(level * 10));
    this._health = new Observable(this._healthMax.get());
    this.xp = 100 + 50 * level;
  }
}

export class BossMonsterView extends BaseMonsterView {
  readonly character: BossMonster;

  protected readonly max_distance: number = 7;

  constructor(character: BossMonster, dungeon: DungeonLevel, x: number, y: number) {
    super(dungeon, 2, 2, x, y);
    this.character = character;
    this.init();
  }

  protected onDead(): void {
    if (Math.random() < this.character.luck) {
      this.dungeon.cell(this.x, this.y).randomDrop();
    }
  }

  protected onDestroy(): void {
    this.dungeon.boss = null;
  }
}

export class BossHealthView implements View {
  readonly container: PIXI.Container;
  private readonly boss: BossMonster;
  private readonly health: BarView;

  private readonly widthMax: number;
  private readonly pointWidth: number;

  private readonly healthSub: Subscription;
  private readonly deadSub: Subscription;

  private destroyed = false;

  constructor(boss: BossMonster) {
    this.container = new PIXI.Container();
    this.boss = boss;

    const HEALTH_MAX_WIDTH = 500;
    const HEALTH_WIDTH = 4;
    this.pointWidth = Math.min(HEALTH_WIDTH, Math.floor(HEALTH_MAX_WIDTH / boss.healthMax.get()));

    this.widthMax = this.pointWidth * boss.healthMax.get();

    this.health = new BarView({
      color: Colors.uiRed,
      widthMax: this.widthMax,
      labelCenter: true
    });
    (this.health as PIXI.Container).position.set(-(this.widthMax >> 1), 0);
    this.container.addChild(this.health);

    this.healthSub = boss.health.subscribe(this.updateHealth.bind(this));
    this.deadSub = boss.dead.subscribe(this.updateDead.bind(this));
  }

  updateHealth(health: number) {
    this.health.width = this.pointWidth * health;
    this.health.label = `${this.boss.name} - ${health}`;
  }

  updateDead(dead: boolean) {
    if (dead) {
      this.destroy();
    }
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this.healthSub.unsubscribe();
      this.deadSub.unsubscribe();
      this.container.destroy();
    }
  }

  update(delta: number): void {
  }
}
