import {DungeonCellView, DungeonLevel} from "./dungeon.level";
import {RNG} from "./rng";
import {HeroState} from "./hero";
import {TileRegistry} from "./tilemap";
import {SceneController} from "./scene";
import {TinyMonster, tinyMonsterNames} from "./tiny.monster";
import {BossMonster, mossMonsterNames} from "./boss.monster";

export interface DungeonGenerator {
  readonly percent: number;
  generate(level: number): Promise<DungeonLevel>;
}

export abstract class BaseDungeonGenerator implements DungeonGenerator {
  protected readonly rng: RNG;
  protected readonly registry: TileRegistry;
  protected readonly controller: SceneController;
  protected readonly heroState: HeroState;

  abstract readonly percent: number;

  protected constructor(controller: SceneController, heroState: HeroState) {
    this.rng = controller.rng;
    this.registry = controller.registry;
    this.controller = controller;
    this.heroState = heroState;
  }

  abstract generate(level: number): Promise<DungeonLevel>;

  protected replaceFloorRandomly(dungeon: DungeonLevel): void {
    const replacements = ['floor_2.png', 'floor_3.png', 'floor_4.png', 'floor_5.png', 'floor_6.png', 'floor_7.png', 'floor_8.png'];
    const percent = 0.2;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && this.rng.nextFloat() < percent) {
          cell.floor = this.rng.choice(replacements);
        }
      }
    }
  };

  protected replaceWallRandomly(dungeon: DungeonLevel): void {
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
        const cell = dungeon.cell(x, y);
        if (cell.hasWall) {
          if (cell.wall === 'wall_mid.png') {
            if (this.rng.nextFloat() < percent) {
              const is_top = !!dungeon.cell(x, y + 1).hasFloor;
              let replacements: string[];
              if (is_top) {
                replacements = wall_mid_top_replaces;
              } else {
                replacements = wall_mid_bottom_replaces;
              }
              const replacement = this.rng.choice(replacements);
              switch (replacement) {
                case 'wall_goo.png':
                  dungeon.cell(x, y).wallBack = 'wall_goo.png';
                  dungeon.cell(x, y + 1).floor = 'wall_goo_base.png';
                  break;
                case 'wall_fountain_mid_red':
                  dungeon.cell(x, y - 1).wallBack = 'wall_fountain_top.png';
                  dungeon.cell(x, y).wallBack = 'wall_fountain_mid_red';
                  dungeon.cell(x, y + 1).floor = 'wall_fountain_basin_red';
                  break;
                case 'wall_fountain_mid_blue':
                  dungeon.cell(x, y - 1).wallBack = 'wall_fountain_top.png';
                  dungeon.cell(x, y).wallBack = 'wall_fountain_mid_blue';
                  dungeon.cell(x, y + 1).floor = 'wall_fountain_basin_blue';
                  break;
                default:
                  if (is_top) {
                    dungeon.cell(x, y).wallBack = replacement;
                  } else {
                    dungeon.cell(x, y).wallFront = replacement;
                  }
                  break;
              }
            }
          } else {
          }
        }
      }
    }
  }

  protected placeHero(dungeon: DungeonLevel): void {
    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        if (dungeon.cell(x, y).hasFloor && !dungeon.monsterMap[y][x]) {
          free.push([x, y]);
        }
      }
    }
    if (free.length === 0) {
      throw "hero not placed";
    }
    let [x, y] = this.rng.choice(free);
    dungeon.hero.resetPosition(x, y);
  }

  protected placeMonsters(dungeon: DungeonLevel, count: number): void {
    const min_hero_distance = 10;
    const hero = dungeon.hero;

    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        if (dungeon.cell(x, y).hasFloor && !dungeon.monsterMap[y][x]) {
          const distance = Math.sqrt(Math.pow(hero.x - x, 2) + Math.pow(hero.y - y, 2));
          if (distance > min_hero_distance) {
            free.push([x, y]);
          }
        }
      }
    }

    for (let m = 0; m < count && free.length > 0; m++) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);
      const name = this.rng.choice(tinyMonsterNames);
      const monster = new TinyMonster(dungeon, x, y, name);
      dungeon.monsters.push(monster);
      dungeon.monsterMap[y][x] = monster;
    }
  }

  protected placeBoss(dungeon: DungeonLevel): void {
    const min_hero_distance = 20;
    const hero = dungeon.hero;

    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        if (dungeon.cell(x, y).hasFloor &&
          !dungeon.monsterMap[y][x] && !dungeon.monsterMap[y][x + 1] &&
          !dungeon.monsterMap[y - 1][x] && !dungeon.monsterMap[y - 1][x + 1]
        ) {
          const distance = Math.sqrt(Math.pow(hero.x - x, 2) + Math.pow(hero.y - y, 2));
          if (distance > min_hero_distance) {
            free.push([x, y]);
          }
        }
      }
    }
    if (free.length > 0) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);

      const name = mossMonsterNames[Math.floor(dungeon.level / 5) % mossMonsterNames.length];
      dungeon.boss = new BossMonster(this.registry, dungeon, x, y, name);
    } else {
      console.error("boss not placed");
    }
  }

  protected placeDrop(dungeon: DungeonLevel, count: number): void {
    const free: DungeonCellView[] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && !cell.hasDrop) {
          free.push(cell);
        }
      }
    }

    for (let d = 0; d < count && free.length > 0; d++) {
      const i = this.rng.nextRange(0, free.length);
      free.splice(i, 1)[0].randomDrop();
    }
  }

  protected placeLadder(dungeon: DungeonLevel) {
    const hero = dungeon.hero;
    const free3: [DungeonCellView, number][] = [];
    const free1: [DungeonCellView, number][] = [];
    const directions: [number, number][] = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    for (let y = 1; y < dungeon.height - 1; y++) {
      for (let x = 1; x < dungeon.height - 1; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor) {
          let c = 0;
          for (let [dx, dy] of directions) {
            if (dungeon.cell(x + dx, y + dy).hasFloor) {
              c++
            }
          }
          const distance = Math.sqrt(Math.pow(hero.x - x, 2) + Math.pow(hero.y - y, 2));
          if (c === directions.length) {
            free3.push([cell, distance]);
          } else {
            free1.push([cell, distance]);
          }
        }
      }
    }

    free3.sort((a, b) => a[1] - b[1]);
    free1.sort((a, b) => a[1] - b[1]);

    const free = [...free1, ...free3].reverse().splice(0, 10);

    if (free.length == 0) {
      throw "ladder not set";
    }

    this.rng.choice(free)[0].floor = 'floor_ladder.png';
  }
}