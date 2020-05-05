import {DungeonMap, MapCell} from "./dungeon.map";
import {RNG} from "./rng";
import {
  Hero,
  HeroAI,
  TinyMonsterAI,
  tinyMonsters,
  BossConfig,
  BossMonsterAI,
  bossMonsters,
  MonsterCategory,
  NpcAI,
  NPCs
} from "./characters";
import {Resources} from "./resources";
import {SceneController} from "./scene";
import {LightType} from "./dungeon.light";
import {DungeonBonfire} from "./dungeon.bonfire";
import * as PIXI from 'pixi.js';

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

  protected distance(
    a: { readonly x: number; readonly y: number },
    b: { readonly x: number; readonly y: number },
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
    dungeon.light.addLight(ai.view.point, LightType.HERO);
    return ai;
  }

  protected placeNpc(rng: RNG, dungeon: DungeonMap, hero: HeroAI): void {
    const maxHeroDistance = 10;
    const npcCount = 5;
    for (let n = 0; n < npcCount; n++) {
      const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
        return this.distance(hero, cell) < maxHeroDistance;
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
    const totalSpace = dungeon.width * dungeon.height;
    const floorSpace = Math.floor(totalSpace * 0.4);
    const spawnSpace = Math.floor(floorSpace * 0.2);
    const monsterCount = Math.floor(spawnSpace * 0.07);

    console.log(`floor_space: ${floorSpace}`);
    console.log(`monster_count: ${monsterCount}`);

    for (let m = 0; m < monsterCount; m++) {
      if (!this.placeMonster(rng, dungeon, hero)) {
        break;
      }
    }
  }

  protected placeMonster(rng: RNG, dungeon: DungeonMap, hero: HeroAI): boolean {
    const monsterCategory = this.bossConfig(dungeon).category;
    const filteredMonsters = tinyMonsters.filter(config => {
      return config.category === monsterCategory ||
        (config.category != MonsterCategory.DEMON &&
          config.category != MonsterCategory.ORC &&
          config.category != MonsterCategory.ZOMBIE);
    });

    if (filteredMonsters.length === 0) {
      console.warn("no tiny monster config found");
      return false;
    }

    const minHeroDistance = 15;
    const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
      return this.distance(hero, cell) > minHeroDistance;
    });

    if (free.length === 0) {
      console.warn("no free place for tiny monster");
      return false;
    }

    const i = rng.range(0, free.length);
    const [cell] = free.splice(i, 1);
    const config = rng.select(filteredMonsters)!;
    new TinyMonsterAI(config, dungeon, cell.x, cell.y);
    return true;
  }

  protected placeBoss(rng: RNG, dungeon: DungeonMap, hero: HeroAI): void {
    const minHeroDistance = 20;
    const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
      return this.distance(hero, cell) > minHeroDistance;
    });

    if (free.length > 0) {
      const i = rng.range(0, free.length);
      const [cell] = free.splice(i, 1);
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

    const dropPercent = 3;
    const dropCount = Math.floor(free.length * dropPercent / 100.0);

    for (let d = 0; d < dropCount && free.length > 0; d++) {
      const i = rng.range(0, free.length);
      free.splice(i, 1)[0].randomDrop();
    }
  }

  protected placeLadder(rng: RNG, dungeon: DungeonMap, hero: HeroAI): void {
    const free3: [MapCell, number][] = [];
    const free1: [MapCell, number][] = [];
    const directions: [number, number][] = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    for (let y = 1; y < dungeon.height - 1; y++) {
      for (let x = 1; x < dungeon.height - 1; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor) {
          let c = 0;
          for (const [dx, dy] of directions) {
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
    const maxHeroDistance = 10;
    const free = this.findFreePositions(dungeon, 2, 2).filter(cell => {
      return this.distance(hero, cell) < maxHeroDistance;
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