import {DungeonMap, MapCell} from "./dungeon.map";
import {RNG} from "./rng";
import {Hero, HeroAI} from "./hero";
import {Resources} from "./resources";
import {SceneController} from "./scene";
import {TinyMonsterAI, tinyMonsters} from "./tiny.monster";
import {BossConfig, BossMonsterAI, bossMonsters} from "./boss.monster";
import {NpcAI, NPCs} from "./npc";
import {LightType} from "./dungeon.light";
import {MonsterCategory} from "./monster";
import {DungeonBonfire} from "./dungeon.bonfire";
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
            const has_floor = y + 1 < dungeon.height && dungeon.cell(x, y + 1).floorName === 'floor_1.png';
            if (has_floor) {
              replacements.push(...banners);
              replacements.push(...goo);
            }
            const has_top = y > 0 && dungeon.cell(x, y - 1).wallName === 'wall_top_mid.png';
            if (has_top && has_floor) {
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

  protected distance(
    a: { readonly x: number, readonly y: number },
    b: { readonly x: number, readonly y: number },
  ): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  protected findFreePositions(dungeon: DungeonMap, width: number, height: number): MapCell[] {
    const free: MapCell[] = [];
    for (let y = height; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width - width; x++) {
        let valid = true;
        for (let dy = 0; dy < height && valid; dy++) {
          for (let dx = 0; dx < width && valid; dx++) {
            const cell = dungeon.cell(x + dx, y - dy);
            valid = cell.hasFloor && !cell.hasObject;
          }
        }
        if (valid) free.push(dungeon.cell(x, y));
      }
    }
    return free;
  }

  protected placeHero(rng: RNG, dungeon: DungeonMap, hero: Hero): HeroAI {
    const free = this.findFreePositions(dungeon, 2, 2);
    if (free.length === 0) {
      throw "hero not placed";
    }
    const cell = rng.select(free)!;
    const ai = new HeroAI(hero, dungeon, cell.x, cell.y);
    dungeon.light.addLight(ai.view, LightType.HERO);
    return ai;
  }

  protected placeNpc(rng: RNG, dungeon: DungeonMap, hero: HeroAI): void {
    const max_hero_distance = 10;
    const npc_count = 5;
    for (let n = 0; n < npc_count; n++) {
      const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
        return this.distance(hero, cell) < max_hero_distance;
      });
      if (free.length === 0) {
        console.warn("no free place for npc");
      }
      const i = rng.range(0, free.length);
      const [cell] = free.splice(i, 1);
      const config = rng.select(NPCs)!;
      new NpcAI(config, dungeon, this.controller, cell.x, cell.y);
    }
  }

  protected placeMonsters(rng: RNG, dungeon: DungeonMap, hero: HeroAI): void {
    const total_space = dungeon.width * dungeon.height;
    const floor_space = Math.floor(total_space * 0.4);
    const spawn_space = Math.floor(floor_space * 0.2);
    const monster_count = Math.floor(spawn_space * 0.07);

    console.log(`floor_space: ${floor_space}`);
    console.log(`monster_count: ${monster_count}`);

    for (let m = 0; m < monster_count; m++) {
      if (!this.placeMonster(rng, dungeon, hero)) {
        break;
      }
    }
  }

  protected placeMonster(rng: RNG, dungeon: DungeonMap, hero: HeroAI): boolean {
    const monster_category = this.bossConfig(dungeon).category;
    const filtered_monsters = tinyMonsters.filter(config => {
      return config.category === monster_category ||
        (config.category != MonsterCategory.DEMON &&
          config.category != MonsterCategory.ORC &&
          config.category != MonsterCategory.ZOMBIE);
    });

    if (filtered_monsters.length === 0) {
      console.warn("no tiny monster config found");
      return false;
    }

    const min_hero_distance = 15;
    const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
      return this.distance(hero, cell) > min_hero_distance;
    });

    if (free.length === 0) {
      console.warn("no free place for tiny monster");
      return false;
    }

    const i = rng.range(0, free.length);
    let [cell] = free.splice(i, 1);
    const config = rng.select(filtered_monsters)!;
    new TinyMonsterAI(config, dungeon, cell.x, cell.y);
    return true;
  }

  protected placeBoss(rng: RNG, dungeon: DungeonMap, hero: HeroAI): void {
    const min_hero_distance = 20;
    const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
      return this.distance(hero, cell) > min_hero_distance;
    });

    if (free.length > 0) {
      const i = rng.range(0, free.length);
      let [cell] = free.splice(i, 1);
      const config = this.bossConfig(dungeon);
      new BossMonsterAI(config, dungeon, cell.x, cell.y);
    } else {
      console.error("boss not placed");
    }
  }

  protected bossConfig(dungeon: DungeonMap): BossConfig {
    return bossMonsters[Math.floor(dungeon.level / 5) % bossMonsters.length];
  }

  protected placeDrop(rng: RNG, dungeon: DungeonMap): void {
    const free: MapCell[] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && !cell.hasDrop && !cell.hasObject) {
          free.push(cell);
        }
      }
    }

    const drop_percent = 3;
    const drop_count = Math.floor(free.length * drop_percent / 100.0);

    for (let d = 0; d < drop_count && free.length > 0; d++) {
      const i = rng.range(0, free.length);
      free.splice(i, 1)[0].randomDrop();
    }
  }

  protected placeLadder(rng: RNG, dungeon: DungeonMap, hero: HeroAI) {
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
          const distance = this.distance(hero, {x: x, y: y});
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

    rng.select(free)![0].ladder();
  }

  protected placeBonfire(rng: RNG, dungeon: DungeonMap, hero: HeroAI): DungeonBonfire {
    const max_hero_distance = 10;
    const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
      return this.distance(hero, cell) < max_hero_distance;
    });
    if (free.length > 0) {
      const cell = rng.select(free)!;
      const light = hero.character.bonfires.has(dungeon.level);
      return new DungeonBonfire(dungeon, cell.x, cell.y, light);
    } else {
      throw "bonfire not placed";
    }
  }
}