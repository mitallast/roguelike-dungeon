import {Rect} from "./geometry";
import {DungeonLevel} from "./dungeon.level";
import {TunnelingAlgorithm} from "./tunneling";
import {BaseDungeonGenerator, GenerateOptions} from "./dungeon.generator";
import {SceneController} from "./scene";

export class TunnelingDungeonGenerator extends BaseDungeonGenerator {
  private gen: TunnelingAlgorithm;

  get percent(): number {
    return this.gen?.percent;
  }

  constructor(controller: SceneController) {
    super(controller);
  }

  async generate(options: GenerateOptions): Promise<DungeonLevel> {
    const rooms_total = 1 + options.level;
    const is_boss = options.level % 5 === 0;
    const level_size = 200;

    this.gen = new TunnelingAlgorithm(this.rng, level_size, level_size);
    await this.gen.generate(rooms_total);

    const dungeon = new DungeonLevel(this.controller, options.hero, options.level, level_size, level_size);
    this.gen.rooms.forEach(r => TunnelingDungeonGenerator.fillRoom(dungeon, r));
    this.gen.corridorsH.forEach(r => TunnelingDungeonGenerator.fillCorridorH(dungeon, r));
    this.gen.corridorsV.forEach(r => TunnelingDungeonGenerator.fillCorridorV(dungeon, r));

    this.replaceFloorRandomly(dungeon);
    this.replaceWallRandomly(dungeon);

    this.placeHero(dungeon);
    this.placeLadder(dungeon);

    this.placeMonsters(dungeon);
    if (is_boss) {
      this.placeBoss(dungeon);
    }

    this.placeDrop(dungeon);

    dungeon.container.sortChildren();
    dungeon.light.loadMap();
    return dungeon;
  }

  private static fillRoom(dungeon: DungeonLevel, room: Rect): void {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;

    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        dungeon.cell(r_x, r_y).floor = 'floor_1.png';
      }
    }

    // fill top wall
    dungeon.cell(x, y - 2).wallBack = 'wall_corner_top_left.png';
    dungeon.cell(x, y - 1).wallBack = 'wall_corner_left.png';

    if (w > 1) {
      for (let r_x = x + 1; r_x < x + w - 1; r_x++) {
        dungeon.cell(r_x, y - 2).wallBack = 'wall_top_mid.png';
        dungeon.cell(r_x, y - 1).wallBack = 'wall_mid.png';
      }

      dungeon.cell(x + w - 1, y - 2).wallBack = 'wall_corner_top_right.png';
      dungeon.cell(x + w - 1, y - 1).wallBack = 'wall_corner_right.png';
    }
    // fill bottom wall
    dungeon.cell(x, y + h - 1).wallFront = 'wall_corner_bottom_left.png';
    dungeon.cell(x, y + h).wallFront = 'wall_left.png';
    if (w > 1) {
      for (let r_x = x + 1; r_x < x + w - 1; r_x++) {
        dungeon.cell(r_x, y + h - 1).wallFront = 'wall_top_mid.png';
        dungeon.cell(r_x, y + h).wallFront = 'wall_mid.png';
      }
      dungeon.cell(x + w - 1, y + h - 1).wallFront = 'wall_corner_bottom_right.png';
      dungeon.cell(x + w - 1, y + h).wallFront = 'wall_right.png';
    }
    // fill right wall
    for (let r_y = y; r_y < y + h - 1; r_y++) {
      dungeon.cell(x, r_y).wallFront = 'wall_side_mid_right.png';
    }
    // fill left wall
    for (let r_y = y; r_y < y + h - 1; r_y++) {
      dungeon.cell(x + w - 1, r_y).wallFront = 'wall_side_mid_left.png';
    }
  }

  private static fillCorridorH(dungeon: DungeonLevel, room: Rect): void {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;

    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        dungeon.cell(r_x, r_y).floor = 'floor_1.png';
      }
    }

    // connect with room top left
    switch (dungeon.cell(x - 1, y - 2).wall) {
      case 'wall_corner_top_right.png':
        dungeon.cell(x - 1, y - 2).wallBack = 'wall_top_mid.png';
        break;
      case 'wall_side_mid_left.png':
        break;
      default:
        console.log('top left 2', dungeon.cell(x - 1, y - 2).wall);
        break;
    }
    switch (dungeon.cell(x - 1, y - 1).wall) {
      case 'wall_corner_right.png':
        dungeon.cell(x - 1, y - 1).wallBack = 'wall_mid.png';
        break;
      case 'wall_side_mid_left.png':
        dungeon.cell(x - 1, y - 1).wallFront = 'wall_side_front_left.png';
        break;
      default:
        console.log('top left 1', dungeon.cell(x - 1, y - 1).wall);
        break;
    }

    // connect with room mid left
    if (h > 1) {
      for (let l_y = y; l_y < y + h - 1; l_y++) {
        if (dungeon.cell(x - 1, l_y).wall === 'wall_side_mid_left.png') {
          dungeon.cell(x - 1, l_y).wall = null;
        } else {
          console.log('mid left', dungeon.cell(x - 1, l_y).wall);
        }
      }
    }

    // connect with room bottom left
    switch (dungeon.cell(x - 1, y + h - 1).wall) {
      case 'wall_side_mid_left.png':
        dungeon.cell(x - 1, y + h - 1).wallFront = 'wall_side_top_left.png';
        break;
      case 'wall_corner_bottom_right.png':
        dungeon.cell(x - 1, y + h - 1).wallFront = 'wall_top_mid.png';
        break;
      default:
        console.log('bottom left 0', dungeon.cell(x - 1, y + h - 1));
        break;
    }
    switch (dungeon.cell(x - 1, y + h).wall) {
      case 'wall_side_mid_left.png':
        break;
      case 'wall_right.png':
        dungeon.cell(x - 1, y + h).wallFront = 'wall_mid.png';
        break;
      default:
        console.log('bottom left 1', dungeon.cell(x - 1, y + h).wall);
        break;
    }

    // connect with room top right
    switch (dungeon.cell(x + w, y - 2).wall) {
      case 'wall_corner_top_left.png':
        dungeon.cell(x + w, y - 2).wallBack = 'wall_top_mid.png';
        break;
      case 'wall_side_mid_right.png':
        break;
      default:
        console.log('top right 2', dungeon.cell(x + w, y - 2).wall);
        break;
    }
    switch (dungeon.cell(x + w, y - 1).wall) {
      case 'wall_corner_left.png':
        dungeon.cell(x + w, y - 1).wallBack = 'wall_mid.png';
        break;
      case 'wall_side_mid_right.png':
        dungeon.cell(x + w, y - 1).wallBack = 'wall_side_front_right.png';
        break;
      default:
        console.log('top right 1', dungeon.cell(x + w, y - 1).wall);
        break;
    }

    // connect with room mid right
    if (h > 1) {
      for (let l_y = y; l_y < y + h - 1; l_y++) {
        if (dungeon.cell(x + w, l_y).wall === 'wall_side_mid_right.png') {
          dungeon.cell(x + w, l_y).wall = null;
        } else {
          console.log('mid right', dungeon.cell(x + w, l_y).wall);
        }
      }
    }

    // connect with room bottom right
    switch (dungeon.cell(x + w, y + h - 1).wall) {
      case 'wall_side_mid_right.png':
        dungeon.cell(x + w, y + h - 1).wallFront = 'wall_side_top_right.png';
        break;
      case 'wall_corner_bottom_left.png':
        dungeon.cell(x + w, y + h - 1).wallFront = 'wall_top_mid.png';
        break;
      default:
        console.log('bottom right 0', dungeon.cell(x + w, y + h - 1).wall);
        break;
    }
    switch (dungeon.cell(x + w, y + h).wall) {
      case 'wall_side_mid_right.png':
        break;
      case 'wall_left.png':
        dungeon.cell(x + w, y + h).wallFront = 'wall_mid.png';
        break;
      default:
        console.log('bottom right +1', dungeon.cell(x + w, y + h).wall);
        break;
    }

    // fill top wall
    for (let r_x = x; r_x < x + w; r_x++) {
      dungeon.cell(r_x, y - 2).wallBack = 'wall_top_mid.png';
      dungeon.cell(r_x, y - 1).wallBack = 'wall_mid.png';
    }

    // fill bottom wall
    for (let r_x = x; r_x < x + w; r_x++) {
      dungeon.cell(r_x, y + h - 1).wallFront = 'wall_top_mid.png';
      dungeon.cell(r_x, y + h).wallFront = 'wall_mid.png';
    }
  }

  private static fillCorridorV(dungeon: DungeonLevel, room: Rect): void {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;

    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        dungeon.cell(r_x, r_y).floor = 'floor_1.png';
      }
    }

    // connect with room top left
    switch (dungeon.cell(x - 1, y - 1).wall) {
      case 'wall_top_mid.png':
        dungeon.cell(x - 1, y - 1).wallBack = 'wall_corner_top_right.png';
        break;
      default:
        console.log('top left -1 -1', dungeon.cell(x - 1, y - 1).wall);
        break;
    }
    switch (dungeon.cell(x - 1, y).wall) {
      case 'wall_mid.png':
        dungeon.cell(x - 1, y).wallBack = 'wall_corner_right.png';
        break;
      default:
        console.log('top left 0 -1', dungeon.cell(x - 1, y).wall);
        break;
    }

    // connect with room top mid
    for (let r_x = x; r_x < x + w; r_x++) {
      if (dungeon.cell(r_x, y - 1).wall === 'wall_top_mid.png') {
        dungeon.cell(r_x, y - 1).wall = null;
      } else {
        console.log('top mid -1', dungeon.cell(r_x, y - 1).wall);
      }
      if (dungeon.cell(r_x, y).wall === 'wall_mid.png') {
        dungeon.cell(r_x, y).wall = null;
      } else {
        console.log('top mid 0', dungeon.cell(r_x, y).wall);
      }
    }

    // connect with room top right
    if (dungeon.cell(x + w, y - 1).wall === 'wall_top_mid') {
      dungeon.cell(x + w, y - 1).wallBack = 'wall_corner_top_left';
    } else {
      console.log('top right -1 1', dungeon.cell(x + w, y - 1).wall);
    }
    if (dungeon.cell(x + w, y).wall === 'wall_mid.png') {
      dungeon.cell(x + w, y).wallBack = 'wall_corner_left.png';
    } else {
      console.log('top right 0 -1', dungeon.cell(x + w, y).wall);
    }

    // connect with room bottom left
    if (dungeon.cell(x - 1, y + h - 2).wall === 'wall_top_mid.png') {
      dungeon.cell(x - 1, y + h - 2).wallFront = 'wall_corner_bottom_right.png';
    } else {
      console.log('bottom left -2 -1', dungeon.cell(x - 1, y + h - 2).wall);
    }
    if (dungeon.cell(x - 1, y + h - 1).wall === 'wall_mid.png') {
      dungeon.cell(x - 1, y + h - 1).wallFront = 'wall_corner_front_right.png';
    } else {
      console.log('top left 0 -1', dungeon.cell(x - 1, y + h - 1).wall);
    }

    // connect with room bottom mid
    for (let r_x = x; r_x < x + w; r_x++) {
      if (dungeon.cell(r_x, y + h - 2).wall === 'wall_top_mid.png') {
        dungeon.cell(r_x, y + h - 2).wall = null;
      } else {
        console.log('bottom mid -2', dungeon.cell(r_x, y + h - 2).wall);
      }
      if (dungeon.cell(r_x, y + h - 1).wall === 'wall_mid.png') {
        dungeon.cell(r_x, y + h - 1).wall = null;
      } else {
        console.log('bottom mid -1', dungeon.cell(r_x, y + h - 1).wall);
      }
    }

    // connect with room bottom right
    if (dungeon.cell(x + w, y + h - 2).wall === 'wall_top_mid.png') {
      dungeon.cell(x + w, y + h - 2).wallFront = 'wall_corner_bottom_left.png';
    } else {
      console.log('bottom right -2 -1', dungeon.cell(x + w, y + h - 2).wall);
    }
    if (dungeon.cell(x + w, y + h - 1).wall === 'wall_mid.png') {
      dungeon.cell(x + w, y + h - 1).wallFront = 'wall_corner_front_left.png';
    } else {
      console.log('bottom right 0 -1', dungeon.cell(x + w, y + h - 1).wall);
    }

    // fill side walls
    for (let r_y = y + 1; r_y < y + h - 2; r_y++) {
      dungeon.cell(x - 1, r_y).wallFront = 'wall_side_mid_left.png';
      dungeon.cell(x + w, r_y).wallFront = 'wall_side_mid_right.png';
    }
  }
}