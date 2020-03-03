import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {RNG} from "./rng";
import {DungeonScene} from "./dungeon";
import {HeroState} from "./hero";
import {TileRegistry} from "./tilemap";
import {SceneController} from "./scene";

export interface DungeonGenerator {
  generate(level: number): DungeonLevel;
}

export abstract class BaseDungeonGenerator implements DungeonGenerator {
  protected readonly rng: RNG;
  protected readonly registry: TileRegistry;
  protected readonly controller: SceneController;
  protected readonly scene: DungeonScene;
  protected readonly heroState: HeroState;

  protected constructor(scene: DungeonScene, heroState: HeroState) {
    this.rng = scene.controller.rng;
    this.registry = scene.controller.registry;
    this.controller = scene.controller;
    this.scene = scene;
    this.heroState = heroState;
  }

  abstract generate(level: number): DungeonLevel;

  protected replaceFloorRandomly(dungeon: DungeonLevel) {
    const replacements = ['floor_2.png', 'floor_3.png', 'floor_4.png', 'floor_5.png', 'floor_6.png', 'floor_7.png', 'floor_8.png'];
    const percent = 0.2;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.floorMap[y][x] && this.rng.nextFloat() < percent) {
          dungeon.setFloor(x, y, this.rng.choice(replacements));
        }
      }
    }
  };

  protected replaceWallRandomly(dungeon: DungeonLevel) {
    const wall_mid_top_replaces = [
      'wall_hole_1.png',
      'wall_hole_2.png',
      'wall_banner_red.png',
      'wall_banner_blue.png',
      'wall_banner_green.png',
      'wall_banner_yellow.png',
      'wall_goo.png',
      'wall_fountain_mid_red',
      'wall_fountain_mid_blue',
    ];
    const wall_mid_bottom_replaces = [
      'wall_hole_1.png',
      'wall_hole_2.png',
    ];
    const percent = 0.2;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.wallMap[y][x]) {
          switch (dungeon.wallMap[y][x].name) {
            case 'wall_mid.png':
              if (this.rng.nextFloat() < percent) {
                const is_top = !!dungeon.floorMap[y + 1][x];
                let replacements: string[];
                if (is_top) {
                  replacements = wall_mid_top_replaces;
                } else {
                  replacements = wall_mid_bottom_replaces;
                }
                const replacement = this.rng.choice(replacements);
                switch (replacement) {
                  case 'wall_goo.png':
                    dungeon.setWall(x, y, 'wall_goo.png', DungeonZIndexes.wallBack);
                    dungeon.setFloor(x, y + 1, 'wall_goo_base.png');
                    break;
                  case 'wall_fountain_mid_red':
                    dungeon.setWall(x, y - 1, 'wall_fountain_top.png', DungeonZIndexes.wallBack);
                    dungeon.setWall(x, y, 'wall_fountain_mid_red', DungeonZIndexes.wallBack);
                    dungeon.setFloor(x, y + 1, 'wall_fountain_basin_red');
                    break;
                  case 'wall_fountain_mid_blue':
                    dungeon.setWall(x, y - 1, 'wall_fountain_top.png', DungeonZIndexes.wallBack);
                    dungeon.setWall(x, y, 'wall_fountain_mid_blue', DungeonZIndexes.wallBack);
                    dungeon.setFloor(x, y + 1, 'wall_fountain_basin_blue');
                    break;
                  default:
                    dungeon.setWall(x, y, replacement, is_top ? DungeonZIndexes.wallBack : DungeonZIndexes.wallFront);
                    break;
                }
              }
              break;
            default:
              // console.log('replace', dungeon.wallMap[y][x]);
              break;
          }
        }
      }
    }
  }
}