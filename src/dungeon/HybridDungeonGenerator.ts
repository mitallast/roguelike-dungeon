import {SceneController} from "../scene";
import {DungeonCrawlerConstraint, EvenSimpleTiledModel, TilesetRules} from "../wfc/even.simple.tiled";
import {Resolution} from "../wfc/model";
import {Config} from "../tunneler";
import {yields} from "../concurency";
import {RNG} from "../rng";
import {BaseDungeonGenerator, GenerateOptions} from "./DungeonGenerator";
import {DungeonMap} from "./DungeonMap";

export class HybridDungeonGenerator extends BaseDungeonGenerator {
  private _model: EvenSimpleTiledModel | null = null;

  get percent(): number {
    return this._model?.percent || 0;
  }

  constructor(controller: SceneController) {
    super(controller);
  }

  async generate(options: GenerateOptions): Promise<DungeonMap> {
    const tileset: TilesetRules = this.controller.loader.resources['dungeon.rules.4.json'].data;
    const config: Config = this.controller.loader.resources['dungeon.design.json'].data;

    const hero = options.hero;
    let seed: number;
    if (hero.dungeonSeeds.has(options.level)) {
      seed = hero.dungeonSeeds.get(options.level)!;
      console.log(`dungeon level ${options.level} exists seed: ${seed}`);
    } else {
      seed = this.controller.rng.int();
      console.log(`dungeon level ${options.level} new seed: ${seed}`);
      hero.dungeonSeeds.set(options.level, seed);
    }
    const rng = RNG.seeded(seed);

    await yields(10);

    const crawler = new DungeonCrawlerConstraint(config);
    this._model = new EvenSimpleTiledModel(this.resources, tileset, rng, config.width, config.height, [crawler]);

    console.time("model loop run");
    let state;
    for (; ;) {
      console.time("model run");
      state = await this._model.run(10000);
      console.timeEnd("model run");
      if (state !== Resolution.Decided) {
        console.error("failed run model");
      } else {
        console.log("success run model");
        break;
      }
      await yields();
    }
    console.timeEnd("model loop run");

    const dungeon = this.createDungeon(rng, seed, options.level, this._model.FMX, this._model.FMY);

    const observed = this._model.observed!;
    for (let y = 0; y < this._model.FMY; y++) {
      for (let x = 0; x < this._model.FMX; x++) {
        const i = x + y * this._model.FMX;
        const [floor, wall] = tileset.cells[observed[i]];
        if (floor >= 0) {
          dungeon.cell(x, y).floorName = tileset.tiles[floor];
        }
        if (wall >= 0) {
          dungeon.cell(x, y).wallName = tileset.tiles[wall];
        }
      }
    }

    await yields();
    this.replaceFloorRandomly(rng, dungeon);

    await yields();
    this.replaceWallRandomly(rng, dungeon);

    const heroAI = this.placeHero(rng, dungeon, options.hero);
    await yields();

    this.placeLadder(rng, dungeon, heroAI);
    await yields();

    const isBonfire = options.level % 5 === 1
    if (isBonfire) {
      this.placeBonfire(rng, dungeon, heroAI);
      await yields();
    }

    this.placeNpc(rng, dungeon, heroAI);
    await yields();

    this.placeMonsters(rng, dungeon, heroAI);
    await yields();

    const isBoss = options.level % 5 === 0;
    if (isBoss) {
      this.placeBoss(rng, dungeon, heroAI);
      await yields();
    }

    this.placeDrop(rng, dungeon);
    await yields();

    dungeon.light.loadMap();
    await yields();
    return dungeon;
  }
}
