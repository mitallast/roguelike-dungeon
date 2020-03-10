import {DungeonLevel} from "./dungeon.level";
import {MonsterCharacter, BaseMonsterView} from "./character";
import {View} from "./view";
import {Subscription} from "./observable";
import {Colors} from "./ui";
import {BarView} from "./bar.view";
// @ts-ignore
import * as PIXI from 'pixi.js';

export const mossMonsterNames = [
  "ogre",
  "big_zombie",
  "big_demon",
];

export class BossMonster extends MonsterCharacter {
  constructor(name: string, level: number) {
    super({
      name: name,
      speed: 0.2,
      healthMax: 50 + Math.floor(level * 10),
      level: level,
      luck: 0.4,
      damage: 7 + 0.5 * level,
      xp: 100 + 50 * level,
    });
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
