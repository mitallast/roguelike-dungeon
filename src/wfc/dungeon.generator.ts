import {DungeonMap} from '../dungeon.map';
import {BaseDungeonGenerator, GenerateOptions} from '../dungeon.generator';
import {SceneController} from "../scene";
import {BorderConstraint, EvenSimpleTiledModel, PathConstraint, RoomConstraint, Tileset} from "./even.simple.tiled";
import {Resolution} from "./model";

export class HybridDungeonGenerator extends BaseDungeonGenerator {
  private model: EvenSimpleTiledModel | null = null;

  get percent(): number {
    return this.model?.percent || 0;
  }

  constructor(controller: SceneController) {
    super(controller);
  }

  async generate(options: GenerateOptions): Promise<DungeonMap> {
    const tileset: Tileset = this.controller.app.loader.resources['dungeon.rules.json'].data;

    const pathCells = tileset.cells.filter(c => c.path).map(c => c.id);
    const borderCells = tileset.cells.filter(c => c.border).map(c => c.id);
    const model = this.model = new EvenSimpleTiledModel(this.resources, tileset, this.rng, 70, 70, [
      new BorderConstraint(borderCells),
      new RoomConstraint(pathCells, {
        room_max_w: 10,
        room_max_h: 10,
        max_corr_dist: 10
      }),
      new PathConstraint(pathCells),
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
    }
    console.timeEnd("model loop run");

    const dungeon = this.createDungeon(options, model.FMX, model.FMY);

    const observed = model.observed!;
    for (let y = 0; y < model.FMY; y++) {
      for (let x = 0; x < model.FMX; x++) {
        const i = x + y * model.FMX;
        const cell = model.cells[observed[i]];
        if (cell.floor) {
          dungeon.cell(x, y).floor = cell.floor;
        }
        if (cell.wall) {
          dungeon.cell(x, y).wall = cell.wall;
          if (cell.zIndex) {
            dungeon.cell(x, y).zIndex = cell.zIndex;
          }
        }
      }
    }

    this.replaceFloorRandomly(dungeon);
    this.replaceWallRandomly(dungeon);

    const hero = this.placeHero(dungeon, options.hero);
    this.placeLadder(dungeon, hero);

    const is_boss = options.level % 5 === 0;

    this.placeNpc(dungeon, hero);
    this.placeMonsters(dungeon, hero);
    if (is_boss) {
      this.placeBoss(dungeon, hero);
    }

    this.placeDrop(dungeon);

    dungeon.container.sortChildren();
    dungeon.light.loadMap();
    return dungeon;
  }
}