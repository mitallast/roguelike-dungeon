import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {MonsterAI, MonsterCategory, MonsterCharacter, MonsterType} from "./monster";
import {ScanDirection} from "./character";
import {monsterWeapons, Weapon, WeaponConfig} from "./drop";

export interface TinyMonsterConfig {
  readonly name: string;
  readonly category: MonsterCategory;
  readonly type: MonsterType;
  readonly luck: number;
  readonly weapons: readonly WeaponConfig[];
}

export const tinyMonsters: TinyMonsterConfig[] = [
  {name: "chort", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "wogol", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "imp", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3, weapons: []},

  {
    name: "ice_zombie",
    category: MonsterCategory.ZOMBIE,
    type: MonsterType.NORMAL,
    luck: 0.3,
    weapons: [monsterWeapons.knife]
  },
  {
    name: "tiny_zombie",
    category: MonsterCategory.ZOMBIE,
    type: MonsterType.NORMAL,
    luck: 0.3,
    weapons: [monsterWeapons.knife]
  },
  {
    name: "zombie",
    category: MonsterCategory.ZOMBIE,
    type: MonsterType.NORMAL,
    luck: 0.3,
    weapons: [monsterWeapons.knife]
  },

  {
    name: "orc_shaman",
    category: MonsterCategory.ORC,
    type: MonsterType.LEADER,
    luck: 0.4,
    weapons: [monsterWeapons.knife]
  },
  {
    name: "masked_orc",
    category: MonsterCategory.ORC,
    type: MonsterType.NORMAL,
    luck: 0.3,
    weapons: [monsterWeapons.knife]
  },
  {
    name: "orc_warrior",
    category: MonsterCategory.ORC,
    type: MonsterType.MINION,
    luck: 0.3,
    weapons: [monsterWeapons.knife]
  },
  {name: "goblin", category: MonsterCategory.ORC, type: MonsterType.MINION, luck: 0.3, weapons: [monsterWeapons.knife]},

  {name: "swampy", category: MonsterCategory.SLIME, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {name: "muddy", category: MonsterCategory.SLIME, type: MonsterType.NORMAL, luck: 0.3, weapons: []},
  {
    name: "necromancer",
    category: MonsterCategory.UNDEAD,
    type: MonsterType.LEADER,
    luck: 0.4,
    weapons: [monsterWeapons.knife]
  },
  {
    name: "skeleton",
    category: MonsterCategory.UNDEAD,
    type: MonsterType.MINION,
    luck: 0.3,
    weapons: [monsterWeapons.knife]
  },
];

export class TinyMonster extends MonsterCharacter {
  constructor(config: TinyMonsterConfig, level: number, weapon: Weapon | null) {
    super({
      name: config.name,
      category: config.category,
      type: config.type,
      speed: 0.8,
      healthMax: 10 + Math.floor(level * 2),
      level: level,
      luck: config.luck,
      baseDamage: 1 + 0.5 * level,
      xp: 35 + 5 * level,
      spawn: 3,
      weapon: weapon,
    });
  }
}

export class TinyMonsterAI extends MonsterAI {
  readonly character: TinyMonster;
  readonly max_distance: number = 5;

  constructor(config: TinyMonsterConfig, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      x: x,
      y: y,
      width: 1,
      height: 1,
      zIndex: DungeonZIndexes.character
    });
    const weapon = config.luck < this.dungeon.rng.float() ?
      Weapon.select(this.dungeon.controller.resources, this.dungeon.rng, config.weapons) : null;
    this.character = new TinyMonster(config, dungeon.level, weapon);
    this.view.setWeapon(this.character.weapon);
    this.init();
  }

  protected action(finished: boolean): boolean {
    if (!this.character.dead.get() && finished) {
      const leader = this.character.type === MonsterType.LEADER;
      if (leader) {
        if (this.spawnMinions()) {
          return false;
        }
        if (this.moveFromHeroOrAttack()) {
          return true;
        }
        this.ready();
      } else {
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
    }
    return false;
  }

  private moveFromHeroOrAttack(): boolean {
    const [hero] = this.scanHero(ScanDirection.AROUND, this.max_distance);
    if (hero) {
      this.lookAt(hero);
      this.sendAlarm(hero);
      const dist_x = Math.abs(this.x - hero.x);
      const dist_y = Math.abs(this.y - hero.y);
      if (dist_x > this.width || dist_y > this.height) {
        const dx = Math.min(1, Math.max(-1, this.x - hero.x));
        const dy = Math.min(1, Math.max(-1, this.y - hero.y));
        console.log("move from hero");
        return this.move(dx, dy) || this.move(dx, 0) || this.move(0, dy);
      } else if (this.character.luck < this.dungeon.rng.float()) {
        console.log("attack hero");
        this.hit();
        return true;
      }
    }
    return false;
  }


  protected onDead(): void {
    if (Math.random() < this.character.luck) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }

  protected spawnMinion(x: number, y: number): MonsterAI | null {
    const minions = tinyMonsters.filter(c => c.category === this.character.category && c.type === MonsterType.MINION);
    if (minions.length === 0) {
      console.warn("no minion config found", this.character.category);
      return null;
    }
    const config = this.dungeon.rng.select(minions)!;
    return new TinyMonsterAI(config, this.dungeon, x, y);
  }
}