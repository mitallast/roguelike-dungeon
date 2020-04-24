import {DungeonMap, DungeonZIndexes} from "./dungeon.map";
import {MonsterCharacter, MonsterAI} from "./monster";

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
      speed: 0.8,
      healthMax: 10 + Math.floor(level * 2),
      level: level,
      luck: 0.3,
      damage: 3 + 0.5 * level,
      xp: 35 + 5 * level,
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
}