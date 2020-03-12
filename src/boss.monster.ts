import {DungeonLevel} from "./dungeon.level";
import {MonsterCharacter, BaseMonsterView} from "./character";
import {Colors} from "./ui";
import {BarView} from "./bar.view";
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

export class BossHealthView extends PIXI.Container{
  private readonly boss: BossMonster;
  private readonly health: BarView;

  private readonly widthMax: number;
  private readonly pointWidth: number;

  private destroyed = false;

  constructor(boss: BossMonster) {
    super();
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
    this.health.position.set(-(this.widthMax >> 1), 0);
    this.addChild(this.health);

    boss.health.subscribe(this.updateHealth, this);
    boss.dead.subscribe(this.updateDead, this);
  }

  destroy(): void {
    if (!this.destroyed) {
      super.destroy();
      this.destroyed = true;
      this.boss.health.unsubscribe(this.updateHealth, this);
      this.boss.dead.unsubscribe(this.updateDead, this);
    }
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
}
