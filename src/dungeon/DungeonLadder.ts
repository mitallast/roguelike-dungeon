import {DungeonMap} from "./DungeonMap";
import {Hero} from "../characters/hero";
import {DungeonFloor} from "./DungeonFloor";

export class DungeonLadder extends DungeonFloor {
  constructor(dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, x, y, 'floor_ladder.png', true);
  }

  interact(hero: Hero): void {
    this._dungeon.controller.generateDungeon({
      level: this._dungeon.level + 1,
      hero: hero.state.name,
    });
  }
}