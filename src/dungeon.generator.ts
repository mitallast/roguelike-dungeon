import {DungeonLevel} from "./dungeon.level";

export interface DungeonGenerator {
  generate(level: number): DungeonLevel;
}