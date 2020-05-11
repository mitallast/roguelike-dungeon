import * as PIXI from 'pixi.js';
import {DungeonMap} from "./DungeonMap";
import {RNG} from "../rng";
import {Hero} from "../characters";
import {Resources} from "../resources";
import {SceneController} from "../scene";

export interface GenerateOptions {
  readonly level: number;
  readonly hero: Hero;
}

export interface DungeonGenerator {
  readonly percent: number;
  generate(options: GenerateOptions): Promise<DungeonMap>;
}

export abstract class BaseDungeonGenerator implements DungeonGenerator {
  protected readonly resources: Resources;
  protected readonly controller: SceneController;

  abstract readonly percent: number;

  protected constructor(controller: SceneController) {
    this.resources = controller.resources;
    this.controller = controller;
  }

  protected createDungeon(rng: RNG, seed: number, level: number, width: number, height: number): DungeonMap {
    return new DungeonMap(this.controller, new PIXI.Ticker(), rng, seed, level, width, height);
  }

  abstract generate(options: GenerateOptions): Promise<DungeonMap>;

  protected replaceFloorRandomly(rng: RNG, dungeon: DungeonMap): void {
    const replacements = ['floor_2.png', 'floor_3.png', 'floor_4.png', 'floor_5.png', 'floor_6.png', 'floor_7.png', 'floor_8.png'];
    const percent = 0.2;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && rng.float() < percent) {
          cell.floorName = rng.select(replacements);
        }
      }
    }
  }

  protected replaceWallRandomly(rng: RNG, dungeon: DungeonMap): void {
    const banners: string[] = [
      'wall_banner_red.png',
      'wall_banner_blue.png',
      'wall_banner_green.png',
      'wall_banner_yellow.png',
    ];
    const goo: string[] = [
      'wall_goo.png',
    ];
    const fountains: string[] = [
      'wall_fountain_mid_red',
      'wall_fountain_mid_blue',
    ];
    const holes: string[] = [
      'wall_hole_1.png',
      'wall_hole_2.png',
    ];
    const percent = 0.3;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.wallName === 'wall_mid.png') {
          if (rng.float() < percent) {
            const replacements = [...holes];
            const hasFloor = y + 1 < dungeon.height && dungeon.cell(x, y + 1).floorName === 'floor_1.png';
            if (hasFloor) {
              replacements.push(...banners);
              replacements.push(...goo);
            }
            const hasTop = y > 0 && dungeon.cell(x, y - 1).wallName === 'wall_top_mid.png';
            if (hasTop && hasFloor) {
              replacements.push(...fountains)
            }
            const replacement = rng.select(replacements);
            switch (replacement) {
              case 'wall_goo.png':
                dungeon.cell(x, y).wallName = 'wall_goo.png';
                dungeon.cell(x, y + 1).floorName = 'wall_goo_base.png';
                break;
              case 'wall_fountain_mid_red':
                dungeon.cell(x, y - 1).wallName = 'wall_fountain_top.png';
                dungeon.cell(x, y).wallName = 'wall_fountain_mid_red';
                dungeon.cell(x, y + 1).floorName = 'wall_fountain_basin_red';
                break;
              case 'wall_fountain_mid_blue':
                dungeon.cell(x, y - 1).wallName = 'wall_fountain_top.png';
                dungeon.cell(x, y).wallName = 'wall_fountain_mid_blue';
                dungeon.cell(x, y + 1).floorName = 'wall_fountain_basin_blue';
                break;
              default:
                dungeon.cell(x, y).wallName = replacement;
                break;
            }
          }
        }
      }
    }
  }
}