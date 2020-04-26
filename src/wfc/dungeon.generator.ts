import {DungeonMap} from '../dungeon.map';
import {BaseDungeonGenerator, GenerateOptions} from '../dungeon.generator';
import {SceneController} from "../scene";
import {DungeonCrawlerConstraint, EvenSimpleTiledModel, TilesetRules} from "./even.simple.tiled";
import {Resolution} from "./model";
import {Config} from "../tunneler/config";
import {yields} from "../concurency";

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

    await yields(10);

    const model = this.model = new EvenSimpleTiledModel(this.resources, tileset, this.rng, config.width, config.height, [
      new DungeonCrawlerConstraint(config)
    ]);

    console.time("model loop run");
    let state;
    while (true) {
      console.time("model run");
      state = await model.run(10000);
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

    const dungeon = this.createDungeon(options, model.FMX, model.FMY);

    const observed = model.observed!;
    for (let y = 0; y < model.FMY; y++) {
      for (let x = 0; x < model.FMX; x++) {
        const i = x + y * model.FMX;
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
    this.replaceFloorRandomly(dungeon);

    await yields();
    this.replaceWallRandomly(dungeon);

    const hero = this.placeHero(dungeon, options.hero);
    await yields();

    this.placeLadder(dungeon, hero);
    await yields();

    const is_bonfire = options.level % 5 === 1
    if (is_bonfire) {
      this.placeBonfire(dungeon, hero);
      await yields();
    }

    this.placeNpc(dungeon, hero);
    await yields();

    this.placeMonsters(dungeon, hero);
    await yields();

    const is_boss = options.level % 5 === 0;
    if (is_boss) {
      this.placeBoss(dungeon, hero);
      await yields();
    }

    this.placeDrop(dungeon);
    await yields();

    dungeon.light.loadMap();
    await yields();
    return dungeon;
  }
}