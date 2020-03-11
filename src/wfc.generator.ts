import {DungeonLevel} from './dungeon.level';
import {BaseDungeonGenerator, GenerateOptions} from './dungeon.generator';
import {BorderConstraint, Color, Constraint, OverlappingModel, PathConstraint, Resolution, Tile} from './wfc';
import {SceneController} from "./scene";

export class WfcDungeonGenerator extends BaseDungeonGenerator {
  private model: OverlappingModel<TileSet> | null = null;

  get percent(): number {
    return this.model?.percent || 0;
  }

  constructor(controller: SceneController) {
    super(controller);
  }

  async generate(options: GenerateOptions): Promise<DungeonLevel> {
    const sample: TileSetOptions[][] = this.controller.app.loader.resources['sample.json'].data;
    const input: Tile<TileSet>[][] = sample.map(m => m.map(o => new TileSet(o).tile));
    const floorTiles: Tile<TileSet>[] = [];
    for (let row of input) {
      for (let tile of row) {
        if (tile.value.floor && !tile.value.wall) {
          if (!floorTiles.find(t => t.equals(tile))) {
            floorTiles.push(tile);
          }
        }
      }
    }

    const constraints: Constraint<TileSet>[] = [
      new BorderConstraint(new TileSet({color: 0x000000}).tile),
      new PathConstraint(floorTiles)
    ];
    const level_size = 70;
    const model = this.model = new OverlappingModel<TileSet>(input, 2, this.controller.rng, level_size, level_size, true, false, 1, 0, constraints);

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

    const dungeon = new DungeonLevel(this.controller, options.hero, options.level, model.FMX, model.FMY);
    for (let y = 0; y < model.FMY; y++) {
      let dy = y < model.FMY - model.N + 1 ? 0 : model.N - 1;
      for (let x = 0; x < model.FMX; x++) {
        let dx = x < model.FMX - model.N + 1 ? 0 : model.N - 1;
        let tileset = model.tiles[model.patterns[model.observed[x - dx + (y - dy) * model.FMX]][dx + dy * model.N]].value;
        let cell = dungeon.cell(x, y);

        if (tileset.floor) {
          cell.floor = tileset.floor;
        }
        if (tileset.wall) {
          cell.wall = tileset.wall;
          cell.zIndex = tileset.zIndex || 0;
        }
      }
    }

    this.replaceFloorRandomly(dungeon);
    this.replaceWallRandomly(dungeon);

    this.placeHero(dungeon);
    this.placeLadder(dungeon);

    const is_boss = options.level % 5 === 0;

    this.placeMonsters(dungeon);
    if (is_boss) {
      this.placeBoss(dungeon);
    }

    this.placeDrop(dungeon);

    dungeon.container.sortChildren();
    dungeon.light.loadMap();
    return dungeon;
  }
}

export interface TileSetOptions {
  readonly floor?: string;
  readonly wall?: string;
  readonly zIndex?: number;
  readonly color: number;
}

class TileSet {
  readonly floor: string | null;
  readonly wall: string | null;
  readonly zIndex: number | null;
  readonly color: Color;

  constructor(options: TileSetOptions) {
    this.floor = options.floor || null;
    this.wall = options.wall || null;
    this.zIndex = options.zIndex || null;
    this.color = Color.fromRgb(options.color);
  }

  equals(that: TileSet) {
    return this.floor === that.floor &&
      this.wall === that.wall &&
      this.zIndex === that.zIndex;
  }

  get tile(): Tile<TileSet> {
    return new Tile<TileSet>(this, this.color, (a, b) => a.equals(b));
  }
}