import {DungeonMap} from "./DungeonMap";
import {HeroController} from "../characters";
import {DungeonFloor} from "./DungeonFloor";

export class DungeonLadder extends DungeonFloor {
  constructor(dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, x, y, 'floor_ladder.png', true);
  }

  interact(hero: HeroController): void {
    this._dungeon.controller.updateHero(hero.character, this._dungeon.level + 1);
  }
}