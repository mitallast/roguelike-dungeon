import {DungeonLevel} from "./dungeon.level";
import {MonsterCharacter, BaseMonsterView} from "./character";

export const tinyMonsterNames = [
  "tiny_zombie",
  "goblin",
  "imp",
  "skeleton",
  "muddy",
  "swampy",
  "zombie",
  "ice_zombie",
];

export class TinyMonster extends MonsterCharacter {
  constructor(name: string, level: number) {
    super({
      name: name,
      speed: 0.2,
      healthMax: 10 + Math.floor(level * 2),
      level: level,
      luck: 0.3,
      damage: 3 + 0.5 * level,
      xp: 35 + 5 * level,
    });
  }
}

export class TinyMonsterView extends BaseMonsterView {
  readonly character: TinyMonster;

  protected readonly max_distance: number = 5;

  constructor(character: TinyMonster, dungeon: DungeonLevel, x: number, y: number) {
    super(dungeon, 1, 1, x, y);
    this.character = character;
    this.init();
  }

  protected onDestroy(): void {
    this.dungeon.monsters = this.dungeon.monsters.filter(s => s !== this);
  }
}