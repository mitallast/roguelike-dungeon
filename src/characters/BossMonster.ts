import {DungeonMap, DungeonZIndexes} from "../dungeon";
import {MonsterAI, MonsterCategory, Monster, MonsterType} from "./Monster";
import {TinyMonsterAI, tinyMonsters} from "./TinyMonster"
import {Colors} from "../ui";
import {WeaponConfig, monsterWeapons, Weapon} from "../drop";
import {BossHealthView} from "./BossHealthView";
import {HitAnimationController} from "./AnimationController";

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

export class BossMonster extends Monster {
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

    const screen = dungeon.controller.app.screen;
    const healthView = new BossHealthView(this.character);
    healthView.zIndex = 13;
    healthView.position.set((screen.width >> 1), 64);
    dungeon.controller.stage.addChild(healthView);
  }

  action(finished: boolean): boolean {
    if (!this.character.dead.get() && finished) {
      const hit = this.animation instanceof HitAnimationController;

      if (finished && hit) {
        this.scanHit();
      }

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
