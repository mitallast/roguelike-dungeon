import {DungeonMap} from "./DungeonMap";
import {HeroController} from "../characters";
import {DungeonFloor} from "./DungeonFloor";

export class DungeonLadder extends DungeonFloor {
  readonly interacting: boolean = true;

  constructor(dungeon: DungeonMap, x: number, y: number) {
    super(dungeon, x, y, 'floor_ladder.png');
  }

  interact(hero: HeroController): void {
    this.dungeon.controller.updateHero(hero.character, this.dungeon.level + 1);
  }
}