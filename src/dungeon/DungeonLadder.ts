import {DungeonMap} from "./DungeonMap";
import {HeroAI} from "../characters";
import {DungeonFloor} from "./DungeonFloor";

export class DungeonLadder extends DungeonFloor {
  readonly interacting: boolean = true;

  constructor(dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, x, y, 'floor_ladder.png');
  }

  interact(hero: HeroAI): void {
    this.dungeon.controller.updateHero(hero.character, this.dungeon.level + 1);
  }
}