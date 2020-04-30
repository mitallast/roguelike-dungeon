import {DungeonMap} from '../dungeon.map';
import {BaseDungeonGenerator, GenerateOptions} from '../dungeon.generator';
import {SceneController} from "../scene";
import {DungeonCrawlerConstraint, EvenSimpleTiledModel, TilesetRules} from "./even.simple.tiled";
import {Resolution} from "./model";
import {Config} from "../tunneler/config";
import {yields} from "../concurency";
import {RNG} from "../rng";

export class HybridDungeonGenerator extends BaseDungeonGenerator {
  private model: EvenSimpleTiledModel | null = null;

  get percent(): number {
    return this.model?.percent || 0;
  }

  constructor(controller: SceneController) {
    super(controller);
  }

  async generate(options: GenerateOptions): Promise<DungeonMap> {
    const tileset: TilesetRules = this.controller.app.loader.resources['dungeon.rules.4.json'].data;
    const config: Config = this.controller.app.loader.resources['dungeon.design.json'].data;

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
    const rng = new RNG(seed);

    await yields(10);

    const crawler = new DungeonCrawlerConstraint(config);
    this.model = new EvenSimpleTiledModel(this.resources, tileset, rng, config.width, config.height, [crawler]);

    console.time("model loop run");
    let state;
    while (true) {
      console.time("model run");
      state = await this.model.run(10000);
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

    const dungeon = this.createDungeon(rng, seed, options.level, this.model.FMX, this.model.FMY);

    const observed = this.model.observed!;
    for (let y = 0; y < this.model.FMY; y++) {
      for (let x = 0; x < this.model.FMX; x++) {
        const i = x + y * this.model.FMX;
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

    const is_bonfire = options.level % 5 === 1
    if (is_bonfire) {
      this.placeBonfire(rng, dungeon, heroAI);
      await yields();
    }

    this.placeNpc(rng, dungeon, heroAI);
    await yields();

    this.placeMonsters(rng, dungeon, heroAI);
    await yields();

    const is_boss = options.level % 5 === 0;
    if (is_boss) {
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
