import {TinyMonster, tinyMonsterNames} from "./tiny.monster";
import {HeroState} from "./hero";
import {BossMonster, mossMonsterNames} from "./boss.monster";
import {DungeonScene} from "./dungeon";
import {Rect} from "./geometry";
import {DungeonLevel, DungeonZIndexes} from "./dungeon.level";
import {TunnelingAlgorithm} from "./tunneling";
import {BaseDungeonGenerator} from "./dungeon.generator";

export class TunnelingDungeonGenerator extends BaseDungeonGenerator {
  private readonly level_size: number;

  constructor(scene: DungeonScene, heroState: HeroState, level_size: number = 200) {
    super(scene, heroState);
    this.level_size = level_size;
  }

  generate(level: number): DungeonLevel {
    const monsters_total = 3 + level;
    const drop_total = 5 + level;
    const is_boss = level % 5 === 0;

    const dungeon = new DungeonLevel(this.scene, this.heroState, level, this.level_size, this.level_size);

    const rooms_total = 1 + dungeon.level;
    const gen = new TunnelingAlgorithm(this.rng, dungeon.width, dungeon.height);
    gen.generate(rooms_total);
    gen.rooms.forEach(r => this.fillRoom(dungeon, r));
    gen.corridorsH.forEach(r => this.fillCorridorH(dungeon, r));
    gen.corridorsV.forEach(r => this.fillCorridorV(dungeon, r));

    this.replaceFloorRandomly(dungeon);
    this.replaceLadder(dungeon, gen);
    this.replaceWallRandomly(dungeon);

    for (let m = 0; m < monsters_total; m++) {
      this.generateMonster(dungeon, gen, is_boss);
    }
    if (is_boss) {
      this.generateBoss(dungeon, gen);
    }

    for (let d = 0; d < drop_total; d++) {
      this.generateDrop(dungeon, gen);
    }

    const first = gen.rooms[0];
    const hero_x = first.x + (first.w >> 1);
    const hero_y = first.y + (first.h >> 1);
    dungeon.hero.resetPosition(hero_x, hero_y);
    dungeon.monsterMap[hero_y][hero_x] = dungeon.hero;
    dungeon.container.sortChildren();
    dungeon.light.loadMap();
    return dungeon;
  }

  private generateMonster(dungeon: DungeonLevel, gen: TunnelingAlgorithm, isBoss: boolean): void {
    const max_room = gen.rooms.length - (isBoss ? 1 : 0);
    if (max_room > 1) {
      const r = this.rng.nextRange(1, max_room);
      const room = gen.rooms[r];
      for (let t = 0; t < 10; t++) {
        const x = room.x + this.rng.nextRange(0, room.w);
        const y = room.y + this.rng.nextRange(0, room.h);
        if (!dungeon.monsterMap[y][x]) {
          const name = this.rng.choice(tinyMonsterNames);
          const monster = new TinyMonster(dungeon, x, y, name);
          dungeon.monsters.push(monster);
          dungeon.monsterMap[y][x] = monster;
          break;
        }
      }
    }
  }

  private generateBoss(dungeon: DungeonLevel, gen: TunnelingAlgorithm): void {
    const room = gen.rooms[gen.rooms.length - 1];
    for (let t = 0; t < 10; t++) {
      const x = room.x + this.rng.nextRange(1, room.w - 1);
      const y = room.y + this.rng.nextRange(1, room.h - 1);
      if (
        !dungeon.monsterMap[y][x] && !dungeon.monsterMap[y][x + 1] &&
        !dungeon.monsterMap[y - 1][x] && !dungeon.monsterMap[y - 1][x + 1]
      ) {
        const name = mossMonsterNames[Math.floor(dungeon.level / 5) % mossMonsterNames.length];
        dungeon.boss = new BossMonster(this.registry, dungeon, x, y, name);
        return;
      }
    }
  }

  private generateDrop(dungeon: DungeonLevel, gen: TunnelingAlgorithm): void {
    const room = this.rng.choice(gen.rooms);
    for (let t = 0; t < 64; t++) {
      const x = room.x + this.rng.nextRange(0, room.w);
      const y = room.y + this.rng.nextRange(0, room.h);
      if (!dungeon.hasDrop(x, y)) {
        dungeon.randomDrop(x, y);
        return;
      }
    }
  }

  private fillRoom(dungeon: DungeonLevel, room: Rect): void {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;

    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        dungeon.setFloor(r_x, r_y, 'floor_1.png');
      }
    }

    // fill top wall
    dungeon.setWall(x, y - 2, 'wall_corner_top_left.png', DungeonZIndexes.wallBack);
    dungeon.setWall(x, y - 1, 'wall_corner_left.png', DungeonZIndexes.wallBack);

    if (w > 1) {
      for (let r_x = x + 1; r_x < x + w - 1; r_x++) {
        dungeon.setWall(r_x, y - 2, 'wall_top_mid.png', DungeonZIndexes.wallBack);
        dungeon.setWall(r_x, y - 1, 'wall_mid.png', DungeonZIndexes.wallBack);
      }

      dungeon.setWall(x + w - 1, y - 2, 'wall_corner_top_right.png', DungeonZIndexes.wallBack);
      dungeon.setWall(x + w - 1, y - 1, 'wall_corner_right.png', DungeonZIndexes.wallBack);
    }
    // fill bottom wall
    dungeon.setWall(x, y + h - 1, 'wall_corner_bottom_left.png', DungeonZIndexes.wallFront);
    dungeon.setWall(x, y + h, 'wall_left.png', DungeonZIndexes.wallFront);
    if (w > 1) {
      for (let r_x = x + 1; r_x < x + w - 1; r_x++) {
        dungeon.setWall(r_x, y + h - 1, 'wall_top_mid.png', DungeonZIndexes.wallFront);
        dungeon.setWall(r_x, y + h, 'wall_mid.png', DungeonZIndexes.wallFront);
      }
      dungeon.setWall(x + w - 1, y + h - 1, 'wall_corner_bottom_right.png', DungeonZIndexes.wallFront);
      dungeon.setWall(x + w - 1, y + h, 'wall_right.png', DungeonZIndexes.wallFront);
    }
    // fill right wall
    for (let r_y = y; r_y < y + h - 1; r_y++) {
      dungeon.setWall(x, r_y, 'wall_side_mid_right.png', DungeonZIndexes.wallFront);
    }
    // fill left wall
    for (let r_y = y; r_y < y + h - 1; r_y++) {
      dungeon.setWall(x + w - 1, r_y, 'wall_side_mid_left.png', DungeonZIndexes.wallFront);
    }
  }

  private fillCorridorH(dungeon: DungeonLevel, room: Rect): void {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;

    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        dungeon.setFloor(r_x, r_y, 'floor_1.png');
      }
    }

    // connect with room top left
    switch (dungeon.wallMap[y - 2][x - 1].name) {
      case 'wall_corner_top_right.png':
        dungeon.setWall(x - 1, y - 2, 'wall_top_mid.png', DungeonZIndexes.wallBack);
        break;
      case 'wall_side_mid_left.png':
        break;
      default:
        console.log('top left 2', dungeon.wallMap[y - 2][x - 1].name);
        break;
    }
    switch (dungeon.wallMap[y - 1][x - 1].name) {
      case 'wall_corner_right.png':
        dungeon.setWall(x - 1, y - 1, 'wall_mid.png', DungeonZIndexes.wallBack);
        break;
      case 'wall_side_mid_left.png':
        dungeon.setWall(x - 1, y - 1, 'wall_side_front_left.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('top left 1', dungeon.wallMap[y - 1][x - 1].name);
        break;
    }

    // connect with room mid left
    if (h > 1) {
      for (let l_y = y; l_y < y + h - 1; l_y++) {
        switch (dungeon.wallMap[l_y][x - 1].name) {
          case 'wall_side_mid_left.png':
            dungeon.setWall(x - 1, l_y, null, 0);
            break;
          default:
            console.log('mid left', dungeon.wallMap[l_y][x - 1].name);
            break;
        }
      }
    }

    // connect with room bottom left
    switch (dungeon.wallMap[y + h - 1][x - 1].name) {
      case 'wall_side_mid_left.png':
        dungeon.setWall(x - 1, y + h - 1, 'wall_side_top_left.png', DungeonZIndexes.wallFront);
        break;
      case 'wall_corner_bottom_right.png':
        dungeon.setWall(x - 1, y + h - 1, 'wall_top_mid.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('bottom left 0', dungeon.wallMap[y + h - 1][x - 1].name);
        break;
    }
    switch (dungeon.wallMap[y + h][x - 1].name) {
      case 'wall_side_mid_left.png':
        break;
      case 'wall_right.png':
        dungeon.setWall(x - 1, y + h, 'wall_mid.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('bottom left 1', dungeon.wallMap[y + h][x - 1].name);
        break;
    }

    // connect with room top right
    switch (dungeon.wallMap[y - 2][x + w].name) {
      case 'wall_corner_top_left.png':
        dungeon.setWall(x + w, y - 2, 'wall_top_mid.png', DungeonZIndexes.wallBack);
        break;
      case 'wall_side_mid_right.png':
        break;
      default:
        console.log('top right 2', dungeon.wallMap[y - 2][x + w].name);
        break;
    }
    switch (dungeon.wallMap[y - 1][x + w].name) {
      case 'wall_corner_left.png':
        dungeon.setWall(x + w, y - 1, 'wall_mid.png', DungeonZIndexes.wallBack);
        break;
      case 'wall_side_mid_right.png':
        dungeon.setWall(x + w, y - 1, 'wall_side_front_right.png', DungeonZIndexes.wallBack);
        break;
      default:
        console.log('top right 1', dungeon.wallMap[y - 1][x + w].name);
        break;
    }

    // connect with room mid right
    if (h > 1) {
      for (let l_y = y; l_y < y + h - 1; l_y++) {
        switch (dungeon.wallMap[l_y][x + w].name) {
          case 'wall_side_mid_right.png':
            dungeon.setWall(x + w, l_y, null, 0);
            break;
          default:
            console.log('mid right', dungeon.wallMap[l_y][x + w].name);
            break;
        }
      }
    }

    // connect with room bottom right
    switch (dungeon.wallMap[y + h - 1][x + w].name) {
      case 'wall_side_mid_right.png':
        dungeon.setWall(x + w, y + h - 1, 'wall_side_top_right.png', DungeonZIndexes.wallFront);
        break;
      case 'wall_corner_bottom_left.png':
        dungeon.setWall(x + w, y + h - 1, 'wall_top_mid.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('bottom right 0', dungeon.wallMap[y + h - 1][x + w].name);
        break;
    }
    switch (dungeon.wallMap[y + h][x + w].name) {
      case 'wall_side_mid_right.png':
        break;
      case 'wall_left.png':
        dungeon.setWall(x + w, y + h, 'wall_mid.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('bottom right +1', dungeon.wallMap[y + h][x + w].name);
        break;
    }

    // fill top wall
    for (let r_x = x; r_x < x + w; r_x++) {
      dungeon.setWall(r_x, y - 2, 'wall_top_mid.png', DungeonZIndexes.wallBack);
      dungeon.setWall(r_x, y - 1, 'wall_mid.png', DungeonZIndexes.wallBack);
    }

    // fill bottom wall
    for (let r_x = x; r_x < x + w; r_x++) {
      dungeon.setWall(r_x, y + h - 1, 'wall_top_mid.png', DungeonZIndexes.wallFront);
      dungeon.setWall(r_x, y + h, 'wall_mid.png', DungeonZIndexes.wallFront);
    }
  }

  private fillCorridorV(dungeon: DungeonLevel, room: Rect): void {
    const x = room.x;
    const y = room.y;
    const w = room.w;
    const h = room.h;

    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        dungeon.setFloor(r_x, r_y, 'floor_1.png');
      }
    }

    // connect with room top left
    switch (dungeon.wallMap[y - 1][x - 1].name) {
      case 'wall_top_mid.png':
        dungeon.setWall(x - 1, y - 1, 'wall_corner_top_right.png', DungeonZIndexes.wallBack);
        break;
      default:
        console.log('top left -1 -1', dungeon.wallMap[y - 1][x - 1].name);
        break;
    }
    switch (dungeon.wallMap[y][x - 1].name) {
      case 'wall_mid.png':
        dungeon.setWall(x - 1, y, 'wall_corner_right.png', DungeonZIndexes.wallBack);
        break;
      default:
        console.log('top left 0 -1', dungeon.wallMap[y][x - 1].name);
        break;
    }

    // connect with room top mid
    for (let r_x = x; r_x < x + w; r_x++) {
      switch (dungeon.wallMap[y - 1][r_x].name) {
        case 'wall_top_mid.png':
          dungeon.setWall(r_x, y - 1, null, 0);
          break;
        default:
          console.log('top mid -1', dungeon.wallMap[y - 1][r_x].name);
          break;
      }
      switch (dungeon.wallMap[y][r_x].name) {
        case 'wall_mid.png':
          dungeon.setWall(r_x, y, null, 0);
          break;
        default:
          console.log('top mid 0', dungeon.wallMap[y][r_x].name);
          break;
      }
    }

    // connect with room top right
    switch (dungeon.wallMap[y - 1][x + w].name) {
      case 'wall_top_mid':
        dungeon.setWall(x + w, y - 1, 'wall_corner_top_left', DungeonZIndexes.wallBack);
        break;
      default:
        console.log('top right -1 1', dungeon.wallMap[y - 1][x + w].name);
        break;
    }
    switch (dungeon.wallMap[y][x + w].name) {
      case 'wall_mid.png':
        dungeon.setWall(x + w, y, 'wall_corner_left.png', DungeonZIndexes.wallBack);
        break;
      default:
        console.log('top right 0 -1', dungeon.wallMap[y][x + w].name);
        break;
    }


    // connect with room bottom left
    switch (dungeon.wallMap[y + h - 2][x - 1].name) {
      case 'wall_top_mid.png':
        dungeon.setWall(x - 1, y + h - 2, 'wall_corner_bottom_right.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('bottom left -2 -1', dungeon.wallMap[y + h - 2][x - 1].name);
        break;
    }
    switch (dungeon.wallMap[y + h - 1][x - 1].name) {
      case 'wall_mid.png':
        dungeon.setWall(x - 1, y + h - 1, 'wall_corner_front_right.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('top left 0 -1', dungeon.wallMap[y + h - 1][x - 1].name);
        break;
    }

    // connect with room bottom mid
    for (let r_x = x; r_x < x + w; r_x++) {
      switch (dungeon.wallMap[y + h - 2][r_x].name) {
        case 'wall_top_mid.png':
          dungeon.setWall(r_x, y + h - 2, null, 0);
          break;
        default:
          console.log('bottom mid -2', dungeon.wallMap[y + h - 2][r_x].name);
          break;
      }
      switch (dungeon.wallMap[y + h - 1][r_x].name) {
        case 'wall_mid.png':
          dungeon.setWall(r_x, y + h - 1, null, 0);
          break;
        default:
          console.log('bottom mid -1', dungeon.wallMap[y + h - 1][r_x].name);
          break;
      }
    }

    // connect with room bottom right
    switch (dungeon.wallMap[y + h - 2][x + w].name) {
      case 'wall_top_mid.png':
        dungeon.setWall(x + w, y + h - 2, 'wall_corner_bottom_left.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('bottom right -2 -1', dungeon.wallMap[y + h - 2][x - 1].name);
        break;
    }
    switch (dungeon.wallMap[y + h - 1][x + w].name) {
      case 'wall_mid.png':
        dungeon.setWall(x + w, y + h - 1, 'wall_corner_front_left.png', DungeonZIndexes.wallFront);
        break;
      default:
        console.log('bottom right 0 -1', dungeon.wallMap[y + h - 1][x - 1].name);
        break;
    }

    // fill side walls
    for (let r_y = y + 1; r_y < y + h - 2; r_y++) {
      dungeon.setWall(x - 1, r_y, 'wall_side_mid_left.png', DungeonZIndexes.wallFront);
      dungeon.setWall(x + w, r_y, 'wall_side_mid_right.png', DungeonZIndexes.wallFront);
    }
  }

  private replaceLadder(dungeon: DungeonLevel, gen: TunnelingAlgorithm) {
    // replace one tile in last room as ladder = out from level!
    const last = gen.rooms[gen.rooms.length - 1];
    const ladder_x = last.x + (last.w >> 1);
    const ladder_y = last.y + (last.h >> 1);
    dungeon.setFloor(ladder_x, ladder_y, 'floor_ladder.png');
  };
}