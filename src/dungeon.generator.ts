import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {RNG} from "./rng";
import {DungeonScene} from "./dungeon";
import {HeroState} from "./hero";
import {TileRegistry} from "./tilemap";
import {SceneController} from "./scene";
import {TinyMonster, tinyMonsterNames} from "./tiny.monster";
import {BossMonster, mossMonsterNames} from "./boss.monster";

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

  protected replaceFloorRandomly(dungeon: DungeonLevel): void {
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

  protected placeHero(dungeon: DungeonLevel): void {
    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        if (dungeon.floorMap[y][x] && !dungeon.monsterMap[y][x]) {
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
        if (dungeon.floorMap[y][x] && !dungeon.monsterMap[y][x]) {
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
        if (dungeon.floorMap[y][x] &&
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
    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        if (dungeon.floorMap[y][x] && !dungeon.hasDrop(x, y)) {
          free.push([x, y]);
        }
      }
    }

    for (let d = 0; d < count && free.length > 0; d++) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);

      dungeon.randomDrop(x, y);
    }
  }

  protected placeLadder(dungeon: DungeonLevel) {
    const hero = dungeon.hero;
    const free3: [number, number, number][] = [];
    const free1: [number, number, number][] = [];
    const directions: [number, number][] = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    for (let y = 1; y < dungeon.height - 1; y++) {
      for (let x = 1; x < dungeon.height - 1; x++) {
        if (dungeon.floorMap[y][x]) {
          let c = 0;
          for (let [dx, dy] of directions) {
            if (dungeon.floorMap[y + dy][x + dx]) {
              c++
            }
          }
          const distance = Math.sqrt(Math.pow(hero.x - x, 2) + Math.pow(hero.y - y, 2));
          if (c === directions.length) {
            free3.push([x, y, distance]);
          } else {
            free1.push([x, y, distance]);
          }
        }
      }
    }

    free3.sort((a, b) => a[2] - b[2]);
    free1.sort((a, b) => a[2] - b[2]);

    const free = [...free1, ...free3].reverse().splice(0, 10);

    if (free.length == 0) {
      throw "ladder not set";
    }

    let [x, y] = this.rng.choice(free);
    dungeon.setFloor(x, y, 'floor_ladder.png');
  }
}