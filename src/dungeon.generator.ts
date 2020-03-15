import {DungeonMap, MapCell} from "./dungeon.map";
import {RNG} from "./rng";
import {Hero, HeroAI} from "./hero";
import {Resources} from "./resources";
import {SceneController} from "./scene";
import {TinyMonster, TinyMonsterAI, tinyMonsterNames} from "./tiny.monster";
import {BossMonster, BossMonsterAI, mossMonsterNames} from "./boss.monster";
import {NpcAI, NpcCharacter, npcCharacters} from "./npc";
import {LightType} from "./dungeon.light";
import {CharacterView} from "./character";
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
  };

  protected replaceWallRandomly(dungeon: DungeonMap): void {
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
              const is_top = dungeon.cell(x, y + 1).hasFloor;
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

  protected placeHero(dungeon: DungeonMap, hero: Hero): CharacterView {
    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && !cell.hasCharacter) {
          free.push([x, y]);
        }
      }
    }
    if (free.length === 0) {
      throw "hero not placed";
    }
    let [x, y] = this.rng.choice(free);
    const ai = new HeroAI(hero, dungeon, x, y);
    const view = ai.view;
    dungeon.light.addLight(view.position, LightType.HERO);
    return view;
  }

  protected placeMonsters(dungeon: DungeonMap, hero: CharacterView): void {
    const min_hero_distance = 10;
    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && !cell.hasCharacter) {
          const distance = Math.sqrt(Math.pow(hero.pos_x - x, 2) + Math.pow(hero.pos_y - y, 2));
          if (distance > min_hero_distance) {
            free.push([x, y]);
          }
        }
      }
    }

    const monster_percent = 3;
    const monster_count = Math.floor(free.length * monster_percent / 100);
    for (let m = 0; m < monster_count && free.length > 0; m++) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);
      const name = this.rng.choice(tinyMonsterNames);
      const monster = new TinyMonster(name, 1);
      new TinyMonsterAI(monster, dungeon, x, y);
      dungeon.cell(x, y).character = monster;
    }
  }

  protected placeNpc(dungeon: DungeonMap, hero: CharacterView): void {
    const max_hero_distance = 10;

    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && !cell.hasCharacter) {
          const distance = Math.sqrt(Math.pow(hero.pos_x - x, 2) + Math.pow(hero.pos_y - y, 2));
          if (distance < max_hero_distance) {
            free.push([x, y]);
          }
        }
      }
    }

    const npc_count = 5;
    for (let n = 0; n < npc_count && free.length > 0; n++) {
      const i = this.rng.nextRange(0, free.length);
      let [[x, y]] = free.splice(i, 1);
      const config = this.rng.choice(npcCharacters);
      const npc = new NpcCharacter(config.name);
      new NpcAI(npc, config, dungeon, x, y);
      dungeon.cell(x, y).character = npc;
    }
  }

  protected placeBoss(dungeon: DungeonMap, hero: CharacterView): void {
    const min_hero_distance = 20;

    const free: [number, number][] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        if (dungeon.cell(x, y).hasFloor &&
          !dungeon.cell(x, y).hasCharacter && !dungeon.cell(x + 1, y).hasCharacter &&
          !dungeon.cell(x, y - 1).hasCharacter && !dungeon.cell(x + 1, y - 1).hasCharacter
        ) {
          const distance = Math.sqrt(Math.pow(hero.pos_x - x, 2) + Math.pow(hero.pos_y - y, 2));
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

  protected placeLadder(dungeon: DungeonMap, hero: CharacterView) {
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
          const distance = Math.sqrt(Math.pow(hero.pos_x - x, 2) + Math.pow(hero.pos_y - y, 2));
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