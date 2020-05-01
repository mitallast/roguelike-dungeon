import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {MonsterAI, MonsterCategory, MonsterCharacter, MonsterType} from "./monster";
import {TinyMonsterAI, tinyMonsters} from "./tiny.monster"
import {Colors} from "./ui";
import {BarView} from "./bar.view";
import {WeaponConfig, monsterWeapons, Weapon} from "./drop";
import * as PIXI from 'pixi.js';

export interface BossConfig {
  readonly name: string;
  readonly category: MonsterCategory;
  readonly weapons: readonly WeaponConfig[];
}

export const bossMonsters: BossConfig[] = [
  {
    name: "big_zombie", category: MonsterCategory.ZOMBIE, weapons: [
      monsterWeapons.anime_sword,
      monsterWeapons.baton_with_spikes,
      monsterWeapons.big_hammer,
      monsterWeapons.cleaver,
      monsterWeapons.mace,
    ]
  },
  {name: "big_demon", category: MonsterCategory.DEMON, weapons: []},
  {
    name: "ogre", category: MonsterCategory.ORC, weapons: [
      monsterWeapons.anime_sword,
      monsterWeapons.baton_with_spikes,
      monsterWeapons.big_hammer,
      monsterWeapons.cleaver,
      monsterWeapons.mace,
    ]
  },
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
      baseDamage: 5 + 0.5 * level,
      xp: 100 + 50 * level,
      spawn: 5,
    });
  }
}

export class BossMonsterAI extends MonsterAI {
  readonly character: BossMonster;
  readonly max_distance: number = 7;

  constructor(config: BossConfig, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      width: 2,
      height: 2,
      x: x,
      y: y,
      zIndex: DungeonZIndexes.character
    });
    this.character = new BossMonster(config, dungeon.level);
    const weapon = Weapon.select(this.dungeon.rng, config.weapons);
    if (weapon) {
      this.character.inventory.equipment.weapon.set(weapon);
    }
    this.init();

    const c_w = dungeon.controller.app.screen.width;
    const healthView = new BossHealthView(this.character);
    healthView.zIndex = 13;
    healthView.position.set((c_w >> 1), 64);
    dungeon.controller.stage.addChild(healthView);
  }

  protected action(finished: boolean): boolean {
    if (!this.character.dead.get() && finished) {
      if (this.spawnMinions()) {
        return false;
      }

      if (this.moveToHero()) {
        return true;
      }

      if (this.moveByPath()) {
        return true;
      }

      this.ready();

      if (this.randomMove()) {
        return true;
      }
    }
    return false;
  }

  protected onDead(): void {
    this.dungeon.controller.showBanner({
      text: this.dungeon.rng.boolean() ? "VICTORY ACHIEVED" : "YOU DEFEATED",
      color: Colors.uiYellow
    });
    for (let i = 0; i < 9; i++) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }

  protected spawnMinion(x: number, y: number): MonsterAI | null {
    const minions = tinyMonsters.filter(c => c.category === this.character.category && c.type !== MonsterType.LEADER);
    if (minions.length === 0) {
      console.warn("no minion config found", this.character.category);
      return null;
    }
    const config = this.dungeon.rng.select(minions)!;
    return new TinyMonsterAI(config, this.dungeon, x, y);
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
    this.pointWidth = Math.min(HEALTH_WIDTH, Math.floor(HEALTH_MAX_WIDTH / this.boss.healthMax.get()));

    this.widthMax = this.pointWidth * this.boss.healthMax.get();

    this.health = new BarView({
      color: Colors.uiRed,
      widthMax: this.widthMax,
      labelCenter: true
    });
    this.health.position.set(-(this.widthMax >> 1), 0);
    this.addChild(this.health);

    this.boss.health.subscribe(this.updateHealth, this);
    this.boss.dead.subscribe(this.updateDead, this);
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this.boss.health.unsubscribe(this.updateHealth, this);
      this.boss.dead.unsubscribe(this.updateDead, this);
      this.health.destroy();
      super.destroy();
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
