import {MonsterController, MonsterType} from "./Monster";
import {DungeonMap} from "../dungeon";
import {CharacterViewOptions} from "./CharacterView";
import {TinyMonsterController, tinyMonsters} from "./TinyMonster";

export abstract class SpawningMonsterController extends MonsterController {
  private readonly _spawned: MonsterController[] = [];

  protected constructor(dungeon: DungeonMap, options: CharacterViewOptions) {
    super(dungeon, options);
  }

  protected spawnMinions(): boolean {
    for (let i = this._spawned.length - 1; i >= 0; i--) {
      if (this._spawned[i].character.dead.get()) {
        this._spawned.splice(i, 1);
      }
    }
    if (this._spawned.length < this.character.spawn) {
      if (Math.random() > 0.1) {
        return false;
      }
      const cell = this.findSpawnCell();
      if (!cell) {
        console.warn(`spawn cell not found at ${this.x}:${this.y}`, this.character.category, this.character.type);
        return false;
      }
      const minion = this.spawnMinion(cell.x, cell.y);
      if (minion) {
        cell.object = minion;
        this._spawned.push(minion);
        return true;
      } else {
        console.warn("minion not spawned", this.character.category, this.character.type);
        return false;
      }
    }
    return false;
  }

  private spawnMinion(x: number, y: number): MonsterController | null {
    const minions = tinyMonsters.filter(c => c.category === this.character.category && c.type === MonsterType.MINION);
    if (minions.length === 0) {
      console.warn("no minion config found", this.character.category);
      return null;
    }
    const config = this.dungeon.rng.select(minions)!;
    return new TinyMonsterController(config, this.dungeon, x, y);
  }
}