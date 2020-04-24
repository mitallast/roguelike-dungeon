import {DungeonMap, MapCell} from "./dungeon.map";
import {RNG} from "./rng";
import {Hero, HeroAI} from "./hero";
import {Resources} from "./resources";
import {SceneController} from "./scene";
import {TinyMonster, TinyMonsterAI, tinyMonsterNames} from "./tiny.monster";
import {BossMonster, BossMonsterAI, mossMonsterNames} from "./boss.monster";
import {NpcAI, npcCharacters} from "./npc";
import {LightType} from "./dungeon.light";
import * as PIXI from 'pixi.js';

export interface GenerateOptions {
  readonly level: number
  readonly hero: Hero
}

export interface DungeonGenerator {
  readonly percent: number;
  generate(options: GenerateOptions): Promise<DungeonMap>;
}

export abstract class BaseDungeonGenerator implements DungeonGenerator {
  protected readonly rng: RNG;
  protected readonly resources: Resources;
  protected readonly controller: SceneController;

  abstract readonly percent: number;

  protected constructor(controller: SceneController) {
    this.rng = controller.rng;
    this.resources = controller.resources;
    this.controller = controller;
  }

  protected createDungeon(options: GenerateOptions, width: number, height: number): DungeonMap {
    return new DungeonMap(this.controller, new PIXI.Ticker(), options.level, width, height);
  }

  abstract generate(options: GenerateOptions): Promise<DungeonMap>;

  protected replaceFloorRandomly(dungeon: DungeonMap): void {
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
  }

  protected replaceWallRandomly(dungeon: DungeonMap): void {
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
        if (cell.wall === 'wall_mid.png') {
          if (this.rng.nextFloat() < percent) {
            const replacements = [...holes];
            const has_floor = y + 1 < dungeon.height && dungeon.cell(x, y + 1).floor === 'floor_1.png';
            if (has_floor) {
              replacements.push(...banners);
              replacements.push(...goo);
            }
            const has_top = y > 0 && dungeon.cell(x, y - 1).wall === 'wall_top_mid.png';
            if (has_top && has_floor) {
              replacements.push(...fountains)
            }
            const replacement = this.rng.choice(replacements);
            switch (replacement) {
              case 'wall_goo.png':
                dungeon.cell(x, y).wall = 'wall_goo.png';
                dungeon.cell(x, y + 1).floor = 'wall_goo_base.png';
                break;
              case 'wall_fountain_mid_red':
                dungeon.cell(x, y - 1).wall = 'wall_fountain_top.png';
                dungeon.cell(x, y).wall = 'wall_fountain_mid_red';
                dungeon.cell(x, y + 1).floor = 'wall_fountain_basin_red';
                break;
              case 'wall_fountain_mid_blue':
                dungeon.cell(x, y - 1).wall = 'wall_fountain_top.png';
                dungeon.cell(x, y).wall = 'wall_fountain_mid_blue';
                dungeon.cell(x, y + 1).floor = 'wall_fountain_basin_blue';
                break;
              default:
                dungeon.cell(x, y).wall = replacement;
                break;
            }
          }
        }
      }
    }
  }

  protected findFreePositions(dungeon: DungeonMap, width: number, height: number): [number, number][] {
    const free: [number, number][] = [];

    for (let y = 0; y < dungeon.height - height; y++) {
      for (let x = 0; x < dungeon.width - width; x++) {

        let valid = true;
        for (let dy = 0; dy < height && valid; dy++) {
          for (let dx = 0; dx < width && valid; dx++) {
            const cell = dungeon.cell(x + dx, y + dy);
            valid = cell.hasFloor && !cell.hasCharacter;
          }
        }

        if (valid) free.push([x, y]);
      }
    }

    return free;
  }

  protected placeHero(dungeon: DungeonMap, hero: Hero): HeroAI {
    const free = this.findFreePositions(dungeon, 2, 2);
    if (free.length === 0) {
      throw "hero not placed";
    }
    let [x, y] = this.rng.choice(free);
    const ai = new HeroAI(hero, dungeon, x, y);
    dungeon.light.addLight(ai.view, LightType.HERO);
    return ai;
  }

  protected placeNpc(dungeon: DungeonMap, hero: HeroAI): void {
    const max_hero_distance = 10;
    const free = this.findFreePositions(dungeon, 2, 2).filter(point => {
      const [x, y] = point;
      const distance = Math.sqrt(Math.pow(hero.x - x, 2) + Math.pow(hero.y - y, 2));
      return distance < max_hero_distance;
    });

    const npc_count = 5;
    for (let n = 0; n < npc_count && free.length > 0; n++) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);
      const config = this.rng.choice(npcCharacters);
      dungeon.cell(x, y).character = new NpcAI(config, dungeon, this.controller, x, y);
    }
  }

  protected placeMonsters(dungeon: DungeonMap, hero: HeroAI): void {
    const min_hero_distance = 15;
    const free: [number, number][] = this.findFreePositions(dungeon, 2, 2).filter(point => {
      const [x, y] = point;
      const distance = Math.sqrt(Math.pow(hero.x - x, 2) + Math.pow(hero.y - y, 2));
      return distance > min_hero_distance;
    });

    const monster_percent = 3;
    const monster_count = Math.floor(free.length * monster_percent / 100);
    for (let m = 0; m < monster_count && free.length > 0; m++) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);
      const name = this.rng.choice(tinyMonsterNames);
      const monster = new TinyMonster(name, 1);
      dungeon.cell(x, y).character = new TinyMonsterAI(monster, dungeon, x, y);
    }
  }

  protected placeBoss(dungeon: DungeonMap, hero: HeroAI): void {
    const min_hero_distance = 20;
    const free = this.findFreePositions(dungeon, 2, 2).filter(point => {
      const [x, y] = point;
      const distance = Math.sqrt(Math.pow(hero.x - x, 2) + Math.pow(hero.y - y, 2));
      return distance > min_hero_distance;
    });

    if (free.length > 0) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);

      const name = mossMonsterNames[Math.floor(dungeon.level / 5) % mossMonsterNames.length];
      const boss = new BossMonster(name, dungeon.level);
      new BossMonsterAI(boss, dungeon, x, y);
    } else {
      console.error("boss not placed");
    }
  }

  protected placeDrop(dungeon: DungeonMap): void {
    const free: MapCell[] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && !cell.hasDrop) {
          free.push(cell);
        }
      }
    }

    const drop_percent = 3;
    const drop_count = Math.floor(free.length * drop_percent / 100.0);

    for (let d = 0; d < drop_count && free.length > 0; d++) {
      const i = this.rng.nextRange(0, free.length);
      free.splice(i, 1)[0].randomDrop();
    }
  }

  protected placeLadder(dungeon: DungeonMap, hero: HeroAI) {
    const free3: [MapCell, number][] = [];
    const free1: [MapCell, number][] = [];
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