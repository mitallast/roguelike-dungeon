import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {MonsterAI, MonsterCategory, MonsterCharacter, MonsterType} from "./monster";
import {TinyMonster, TinyMonsterAI, tinyMonsters} from "./tiny.monster"
import {Colors} from "./ui";
import {BarView} from "./bar.view";
import {IdleAnimation} from "./character";
import * as PIXI from 'pixi.js';

export interface BossConfig {
  readonly name: string;
  readonly category: MonsterCategory;
}

export const bossMonsters: BossConfig[] = [
  {name: "big_zombie", category: MonsterCategory.ZOMBIE},
  {name: "big_demon", category: MonsterCategory.DEMON},
  {name: "ogre", category: MonsterCategory.ORC},
];

export class BossMonster extends MonsterCharacter {
  constructor(config: BossConfig, level: number) {
    super({
      name: config.name,
      category: config.category,
      type: MonsterType.LEADER,
      speed: 0.5,
      healthMax: 50 + Math.floor(level * 10),
      level: level,
      luck: 0.4,
      damage: 7 + 0.5 * level,
      xp: 100 + 50 * level,
      spawn: 5,
    });
  }
}

export class BossMonsterAI extends MonsterAI {
  readonly character: BossMonster;
  readonly max_distance: number = 7;

  constructor(character: BossMonster, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      width: 2,
      height: 2,
      x: x,
      y: y,
      zIndex: DungeonZIndexes.character
    });
    this.character = character;
    this.init();

    const c_w = dungeon.controller.app.screen.width;
    const healthView = new BossHealthView(this.character);
    healthView.zIndex = 13;
    healthView.position.set((c_w >> 1), 64);
    dungeon.controller.stage.addChild(healthView);
  }

  protected action(finished: boolean): boolean {
    if (!this.character.dead.get()) {
      const idle = this.animation instanceof IdleAnimation;

      if (finished && this.spawnMinions()) {
        return false;
      }

      if ((idle || finished) && this.moveToHero()) {
        return true;
      }

      if ((idle || finished) && this.moveByPath()) {
        return true;
      }

      if (finished && this.randomMove()) {
        return true;
      }
    }
    return false;
  }

  protected drop(): void {
    for (let i = 0; i < 9; i++) {
      this.findDropCell()?.randomDrop();
    }
  }

  protected spawnMinion(x: number, y: number): MonsterAI | null {
    const minions = tinyMonsters.filter(c => c.category === this.character.category && c.type !== MonsterType.LEADER);
    if (minions.length === 0) {
      console.warn("no minion config found", this.character.category);
      return null;
    }
    const config = this.dungeon.controller.rng.choice(minions);
    const character = new TinyMonster(config, this.dungeon.level);
    return new TinyMonsterAI(character, this.dungeon, x, y);
  }
}

export class BossHealthView extends PIXI.Container {
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
      super.destroy({children: true});
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
