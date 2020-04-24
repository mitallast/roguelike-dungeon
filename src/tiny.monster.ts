import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {MonsterAI, MonsterCategory, MonsterCharacter, MonsterType} from "./monster";
import {IdleAnimation, ScanDirection} from "./character";

export interface TinyMonsterConfig {
  readonly name: string;
  readonly category: MonsterCategory;
  readonly type: MonsterType;
  readonly luck: number;
}

export const tinyMonsters: TinyMonsterConfig[] = [
  {name: "chort", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3},
  {name: "wogol", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3},
  {name: "imp", category: MonsterCategory.DEMON, type: MonsterType.NORMAL, luck: 0.3},

  {name: "ice_zombie", category: MonsterCategory.ZOMBIE, type: MonsterType.NORMAL, luck: 0.3},
  {name: "tiny_zombie", category: MonsterCategory.ZOMBIE, type: MonsterType.NORMAL, luck: 0.3},
  {name: "zombie", category: MonsterCategory.ZOMBIE, type: MonsterType.NORMAL, luck: 0.3},

  {name: "orc_shaman", category: MonsterCategory.ORC, type: MonsterType.LEADER, luck: 0.4},
  {name: "masked_orc", category: MonsterCategory.ORC, type: MonsterType.NORMAL, luck: 0.3},
  {name: "orc_warrior", category: MonsterCategory.ORC, type: MonsterType.MINION, luck: 0.3},
  {name: "goblin", category: MonsterCategory.ORC, type: MonsterType.MINION, luck: 0.3},

  {name: "swampy", category: MonsterCategory.SLIME, type: MonsterType.NORMAL, luck: 0.3},
  {name: "muddy", category: MonsterCategory.SLIME, type: MonsterType.NORMAL, luck: 0.3},
  {name: "necromancer", category: MonsterCategory.UNDEAD, type: MonsterType.LEADER, luck: 0.4},
  {name: "skeleton", category: MonsterCategory.UNDEAD, type: MonsterType.MINION, luck: 0.3},
];

export class TinyMonster extends MonsterCharacter {
  constructor(config: TinyMonsterConfig, level: number) {
    super({
      name: config.name,
      category: config.category,
      type: config.type,
      speed: 0.8,
      healthMax: 10 + Math.floor(level * 2),
      level: level,
      luck: config.luck,
      damage: 3 + 0.5 * level,
      xp: 35 + 5 * level,
      spawn: 3
    });
  }
}

export class TinyMonsterAI extends MonsterAI {
  readonly character: TinyMonster;
  readonly max_distance: number = 5;

  constructor(character: TinyMonster, dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, {
      x: x,
      y: y,
      width: 1,
      height: 1,
      zIndex: DungeonZIndexes.character
    });
    this.character = character;
    this.init();
  }

  protected action(finished: boolean): boolean {
    if (!this.character.dead.get()) {
      const idle = this.animation instanceof IdleAnimation;

      const leader = this.character.type === MonsterType.LEADER;
      if (leader) {
        if (finished && this.spawnMinions()) {
          return false;
        }
        if ((idle || finished)) {
          return this.moveFromHeroOrAttack();
        }
      } else {
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
    }
    return false;
  }

  private moveFromHeroOrAttack(): boolean {
    const [hero] = this.scanHero(ScanDirection.AROUND, this.max_distance);
    if (hero) {
      this.sendAlarm(hero);
      const dist_x = Math.abs(this.x - hero.x);
      const dist_y = Math.abs(this.y - hero.y);
      if (dist_x > this.width || dist_y > this.height) {
        const dx = Math.min(1, Math.max(-1, this.x - hero.x));
        const dy = Math.min(1, Math.max(-1, this.y - hero.y));
        console.log("move from hero");
        return this.move(dx, dy) || this.move(dx, 0) || this.move(0, dy);
      } else {
        console.log("attack hero");
        this.lookAt(hero);
        this.hit();
        return true;
      }
    }
    return false;
  }

  protected drop(): void {
    if (Math.random() < this.character.luck) {
      this.findDropCell()?.randomDrop();
    }
  }

  protected spawnMinion(x: number, y: number): MonsterAI | null {
    const minions = tinyMonsters.filter(c => c.category === this.character.category && c.type === MonsterType.MINION);
    if (minions.length === 0) {
      console.warn("no minion config found", this.character.category);
      return null;
    }
    const config = this.dungeon.controller.rng.choice(minions);
    const character = new TinyMonster(config, this.dungeon.level);
    return new TinyMonsterAI(character, this.dungeon, x, y);
  }
}