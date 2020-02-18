import {TinyMonster, tinyMonsterNames} from "./tiny.monster";
import {Coins, Drop, HealthBigFlask, HealthFlask} from "./drop";
import {RNG} from "./rng";
import {TileRegistry} from "./tilemap";
import {Scene} from "./scene";
import {HeroMonster} from "./hero";
import {Monster} from "./monster";

const x_dist = 2;
const y_dist = 3;

export class Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  expand() {
    const a = this;
    return new Rect(
      a.x - x_dist,
      a.y - y_dist,
      a.w + x_dist + x_dist,
      a.h + y_dist + y_dist
    );
  }

  expandV() {
    const a = this;
    return new Rect(
      a.x - x_dist,
      a.y,
      a.w + x_dist + x_dist,
      a.h
    );
  }

  expandH() {
    const a = this;
    return new Rect(
      a.x,
      a.y - y_dist,
      a.w,
      a.h + y_dist + y_dist
    );
  }

  isOverlap(b: Rect) {
    const a = this;
    return a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
  }
}

export class Level {
  private readonly rng: RNG;
  private readonly registry: TileRegistry;
  private readonly scene: Scene;
  readonly level: number;
  readonly w: number;
  readonly h: number;
  log: string[];
  private readonly rooms: Rect[];
  private readonly corridorsV: Rect[];
  private readonly corridorsH: Rect[];
  readonly floor: string[][];
  readonly drop: Drop[][];
  readonly wall: string[][];

  monsterList: TinyMonster[];
  readonly hero: HeroMonster;
  readonly monsters: Monster[][];

  constructor(rng: RNG, registry: TileRegistry, scene: Scene, hero: HeroMonster, l: number, time: number) {
    this.rng = rng;
    this.registry = registry;
    this.scene = scene;
    this.level = l;
    this.w = 200;
    this.h = 120;

    this.log = [];
    this.rooms = [];
    this.corridorsV = [];
    this.corridorsH = [];

    this.floor = this.createBuffer(() => null);
    this.drop = this.createBuffer(() => null);
    this.wall = this.createBuffer(() => null);

    this.monsterList = [];
    this.hero = hero;
    this.monsters = this.createBuffer(() => null);

    this.generate(time);
    this.fill();
    this.replace();
  }

  createBuffer<T>(defaultValue: () => T): T[][] {
    const rows: T[][] = [];
    for (let y = 0; y < this.h; y++) {
      const row: T[] = [];
      rows.push(row);
      for (let x = 0; x < this.w; x++) {
        row.push(defaultValue());
      }
    }
    return rows;
  };

  generate(time: number) {
    const rooms_total = 1 + this.level;
    const monsters_total = 3 + this.level;
    const drop_total = 5 + this.level;

    // create rooms
    for (let r = 0; r < rooms_total; r++) {
      this.generateRoom();
    }

    // create monsters
    for (let m = 0; m < monsters_total; m++) {
      const r = this.rng.nextRange(1, this.rooms.length);
      const room = this.rooms[r];
      for (let t = 0; t < 10; t++) {
        const x = room.x + this.rng.nextRange(0, room.w);
        const y = room.y + this.rng.nextRange(0, room.h);
        if (!this.monsters[y][x]) {
          const name = this.rng.choice(tinyMonsterNames);
          const monster = new TinyMonster(this.rng, this.registry, this, x, y, name, time);
          this.monsterList.push(monster);
          this.monsters[y][x] = monster;
          break;
        }
      }
    }

    // create drop
    for (let d = 0; d < drop_total; d++) {
      const room = this.rng.choice(this.rooms);
      for (let t = 0; t < 10; t++) {
        const x = room.x + this.rng.nextRange(0, room.w);
        const y = room.y + this.rng.nextRange(0, room.h);
        if (!this.drop[y][x]) {
          this.randomDrop(x, y);
          break;
        }
      }
    }

    // position of hero
    {
      const room = this.rooms[0];
      const hero_x = room.x + (room.w >> 1);
      const hero_y = room.y + (room.h >> 1);
      this.hero.setLevel(this);
      this.hero.resetPosition(hero_x, hero_y);
      this.monsters[hero_y][hero_x] = this.hero;
    }
  };

  generateRoom() {
    const room_min_w = 5;
    const room_min_h = 3;
    const room_max_w = 15;
    const room_max_h = 10;
    const room_min_x = 2;
    const room_min_y = 2;

    const max_corr_dist = 12;

    while (true) {
      const room_w = this.rng.nextRange(room_min_w, room_max_w);
      const room_h = this.rng.nextRange(room_min_h, room_max_h);

      const room = new Rect(
        this.rng.nextRange(room_min_x, this.w - 2 - room_w),
        this.rng.nextRange(room_min_y, this.h - 2 - room_h),
        room_w,
        room_h
      );

      if (!this.isOverlap(room.expand())) {
        // free position found
        if (this.rooms.length === 0) {
          this.rooms.push(room);
          break;
        } else {
          // find connection
          const a = room;
          let connected = false;

          // find closest room
          for (let i = 0; i < this.rooms.length; i++) {
            let b = this.rooms[i];

            // try calculate horizontal distance
            const max_x = Math.max(a.x, b.x);
            const min_x_w = Math.min(a.x + a.w, b.x + b.w);
            if (max_x + 5 <= min_x_w) {
              let rect;
              if (a.y + a.h < b.y) {
                rect = new Rect(
                  max_x + 2,
                  a.y + a.h,
                  min_x_w - max_x - 4,
                  b.y - a.y - a.h
                );
              } else {
                rect = new Rect(
                  max_x + 2,
                  b.y + b.h,
                  min_x_w - max_x - 4,
                  a.y - b.y - b.h
                );
              }
              if (rect.h < max_corr_dist && !this.isOverlap(rect.expandV())) {
                this.corridorsV.push(rect);
                connected = true;
              }
            }

            // try calculate vertical distance
            const max_y = Math.max(a.y, b.y);
            const min_y_h = Math.min(a.y + a.h, b.y + b.h);
            if (max_y + 3 <= min_y_h) {
              let rect;
              if (a.x + a.w < b.x) {
                rect = new Rect(
                  a.x + a.w,
                  max_y + 1,
                  b.x - a.x - a.w,
                  min_y_h - max_y - 2
                );
              } else {
                rect = new Rect(
                  b.x + b.w,
                  max_y + 1,
                  a.x - b.x - b.w,
                  min_y_h - max_y - 2,
                );
              }
              if (rect.w < max_corr_dist && !this.isOverlap(rect.expandH())) {
                this.corridorsH.push(rect);
                connected = true;
              }
            }
          }

          if (connected) {
            this.rooms.push(room);
            break;
          }
        }
      }
    }
  }

  isOverlap(a: Rect) {
    const f = a.isOverlap.bind(a);
    return this.rooms.some(f) ||
      this.corridorsV.some(f) ||
      this.corridorsH.some(f);
  };

  randomDrop(x: number, y: number) {
    if (this.rng.nextFloat() < 0.5) {
      this.drop[y][x] = new Coins(this.rng);
    } else if (this.rng.nextFloat() < 0.3) {
      this.drop[y][x] = new HealthFlask();
    } else if (this.rng.nextFloat() < 0.3) {
      this.drop[y][x] = new HealthBigFlask();
    }
  };

  fill() {
    this.rooms.forEach(r => this.fillRoom(r.x, r.y, r.w, r.h));
    this.corridorsH.forEach(r => this.fillCorridorH(r.x, r.y, r.w, r.h));
    this.corridorsV.forEach(r => this.fillCorridorV(r.x, r.y, r.w, r.h));
  };

  fillRoom(x: number, y: number, w: number, h: number) {
    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        this.floor[r_y][r_x] = "floor_1";
      }
    }
    // fill top wall
    this.wall[y - 2][x] = "wall_corner_top_left";
    this.wall[y - 1][x] = "wall_corner_left";
    if (w > 1) {
      for (let r_x = x + 1; r_x < x + w - 1; r_x++) {
        this.wall[y - 2][r_x] = "wall_top_mid";
        this.wall[y - 1][r_x] = "wall_mid";
      }
      this.wall[y - 2][x + w - 1] = "wall_corner_top_right";
      this.wall[y - 1][x + w - 1] = "wall_corner_right";
    }
    // fill bottom wall
    this.wall[y + h - 1][x] = "wall_corner_bottom_left";
    this.wall[y + h][x] = "wall_left";
    if (w > 1) {
      for (let r_x = x + 1; r_x < x + w - 1; r_x++) {
        this.wall[y + h - 1][r_x] = "wall_top_mid";
        this.wall[y + h][r_x] = "wall_mid"
      }
      this.wall[y + h - 1][x + w - 1] = "wall_corner_bottom_right";
      this.wall[y + h][x + w - 1] = "wall_right";
    }
    // fill right wall
    for (let r_y = y; r_y < y + h - 1; r_y++) {
      this.wall[r_y][x] = "wall_side_mid_right";
    }
    // fill left wall
    for (let r_y = y; r_y < y + h - 1; r_y++) {
      this.wall[r_y][x + w - 1] = "wall_side_mid_left";
    }
  };

  fillCorridorH(x: number, y: number, w: number, h: number) {
    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        this.floor[r_y][r_x] = "floor_1";
      }
    }

    // connect with room top left
    switch (this.wall[y - 2][x - 1]) {
      case "wall_corner_top_right":
        this.wall[y - 2][x - 1] = "wall_top_mid";
        break;
      case "wall_side_mid_left":
        break;
      default:
        console.log("top left 2", this.wall[y - 2][x - 1]);
        break;
    }
    switch (this.wall[y - 1][x - 1]) {
      case "wall_corner_right":
        this.wall[y - 1][x - 1] = "wall_mid";
        break;
      case "wall_side_mid_left":
        this.wall[y - 1][x - 1] = "wall_side_front_left";
        break;
      default:
        console.log("top left 1", this.wall[y - 1][x - 1]);
        break;
    }

    // connect with room mid left
    if (h > 1) {
      for (let l_y = y; l_y < y + h - 1; l_y++) {
        switch (this.wall[l_y][x - 1]) {
          case "wall_side_mid_left":
            this.wall[l_y][x - 1] = null;
            break;
          default:
            console.log("mid left", this.wall[l_y][x - 1]);
            break;
        }
      }
    }

    // connect with room bottom left
    switch (this.wall[y + h - 1][x - 1]) {
      case "wall_side_mid_left":
        this.wall[y + h - 1][x - 1] = "wall_side_top_left";
        break;
      case "wall_corner_bottom_right":
        this.wall[y + h - 1][x - 1] = "wall_top_mid";
        break;
      default:
        console.log("bottom left 0", this.wall[y + h - 1][x - 1]);
        break;
    }
    switch (this.wall[y + h][x - 1]) {
      case "wall_side_mid_left":
        break;
      case "wall_right":
        this.wall[y + h][x - 1] = "wall_mid";
        break;
      default:
        console.log("bottom left 1", this.wall[y + h][x - 1]);
        break;
    }

    // connect with room top right
    switch (this.wall[y - 2][x + w]) {
      case "wall_corner_top_left":
        this.wall[y - 2][x + w] = "wall_top_mid";
        break;
      case "wall_side_mid_right":
        break;
      default:
        console.log("top right 2", this.wall[y - 2][x + w]);
        break;
    }
    switch (this.wall[y - 1][x + w]) {
      case "wall_corner_left":
        this.wall[y - 1][x + w] = "wall_mid";
        break;
      case "wall_side_mid_right":
        this.wall[y - 1][x + w] = "wall_side_front_right";
        break;
      default:
        console.log("top right 1", this.wall[y - 1][x + w]);
        break;
    }

    // connect with room mid right
    if (h > 1) {
      for (let l_y = y; l_y < y + h - 1; l_y++) {
        switch (this.wall[l_y][x + w]) {
          case "wall_side_mid_right":
            this.wall[l_y][x + w] = null;
            break;
          default:
            console.log("mid right", this.wall[l_y][x + w]);
            break;
        }
      }
    }

    // connect with room bottom right
    switch (this.wall[y + h - 1][x + w]) {
      case "wall_side_mid_right":
        this.wall[y + h - 1][x + w] = "wall_side_top_right";
        break;
      case "wall_corner_bottom_left":
        this.wall[y + h - 1][x + w] = "wall_top_mid";
        break;
      default:
        console.log("bottom right 0", this.wall[y + h - 1][x + w]);
        break;
    }
    switch (this.wall[y + h][x + w]) {
      case "wall_side_mid_right":
        break;
      case "wall_left":
        this.wall[y + h][x + w] = "wall_mid";
        break;
      default:
        console.log("bottom right +1", this.wall[y + h][x + w]);
        break;
    }

    // fill top wall
    for (let r_x = x; r_x < x + w; r_x++) {
      this.wall[y - 2][r_x] = "wall_top_mid";
      this.wall[y - 1][r_x] = "wall_mid";
    }

    // fill bottom wall
    for (let r_x = x; r_x < x + w; r_x++) {
      this.wall[y + h - 1][r_x] = "wall_top_mid";
      this.wall[y + h][r_x] = "wall_mid"
    }
  };

  fillCorridorV(x: number, y: number, w: number, h: number) {
    // fill floor
    for (let r_y = y; r_y < y + h; r_y++) {
      for (let r_x = x; r_x < x + w; r_x++) {
        this.floor[r_y][r_x] = "floor_1";
      }
    }

    // connect with room top left
    switch (this.wall[y - 1][x - 1]) {
      case "wall_top_mid":
        this.wall[y - 1][x - 1] = "wall_corner_top_right";
        break;
      default:
        console.log("top left -1 -1", this.wall[y - 1][x - 1]);
        break;
    }
    switch (this.wall[y][x - 1]) {
      case "wall_mid":
        this.wall[y][x - 1] = "wall_corner_right";
        break;
      default:
        console.log("top left 0 -1", this.wall[y][x - 1]);
        break;
    }

    // connect with room top mid
    for (let r_x = x; r_x < x + w; r_x++) {
      switch (this.wall[y - 1][r_x]) {
        case "wall_top_mid":
          this.wall[y - 1][r_x] = null;
          break;
        default:
          console.log("top mid -1", this.wall[y - 1][r_x]);
          break;
      }
      switch (this.wall[y][r_x]) {
        case "wall_mid":
          this.wall[y][r_x] = null;
          break;
        default:
          console.log("top mid 0", this.wall[y][r_x]);
          break;
      }
    }

    // connect with room top right
    switch (this.wall[y - 1][x + w]) {
      case "wall_top_mid":
        this.wall[y - 1][x + w] = "wall_corner_top_left";
        break;
      default:
        console.log("top right -1 1", this.wall[y - 1][x + w]);
        break;
    }
    switch (this.wall[y][x + w]) {
      case "wall_mid":
        this.wall[y][x + w] = "wall_corner_left";
        break;
      default:
        console.log("top right 0 -1", this.wall[y][x + w]);
        break;
    }


    // connect with room bottom left
    switch (this.wall[y + h - 2][x - 1]) {
      case "wall_top_mid":
        this.wall[y + h - 2][x - 1] = "wall_corner_bottom_right";
        break;
      default:
        console.log("bottom left -2 -1", this.wall[y + h - 2][x - 1]);
        break;
    }
    switch (this.wall[y + h - 1][x - 1]) {
      case "wall_mid":
        this.wall[y + h - 1][x - 1] = "wall_corner_front_right";
        break;
      default:
        console.log("top left 0 -1", this.wall[y + h - 1][x - 1]);
        break;
    }

    // connect with room bottom mid
    for (let r_x = x; r_x < x + w; r_x++) {
      switch (this.wall[y + h - 2][r_x]) {
        case "wall_top_mid":
          this.wall[y + h - 2][r_x] = null;
          break;
        default:
          console.log("bottom mid -2", this.wall[y + h - 2][r_x]);
          break;
      }
      switch (this.wall[y + h - 1][r_x]) {
        case "wall_mid":
          this.wall[y + h - 1][r_x] = null;
          break;
        default:
          console.log("bottom mid -1", this.wall[y + h - 1][r_x]);
          break;
      }
    }

    // connect with room bottom right
    switch (this.wall[y + h - 2][x + w]) {
      case "wall_top_mid":
        this.wall[y + h - 2][x + w] = "wall_corner_bottom_left";
        break;
      default:
        console.log("bottom right -2 -1", this.wall[y + h - 2][x - 1]);
        break;
    }
    switch (this.wall[y + h - 1][x + w]) {
      case "wall_mid":
        this.wall[y + h - 1][x + w] = "wall_corner_front_left";
        break;
      default:
        console.log("bottom right 0 -1", this.wall[y + h - 1][x - 1]);
        break;
    }

    // fill side walls
    for (let r_y = y + 1; r_y < y + h - 2; r_y++) {
      this.wall[r_y][x - 1] = "wall_side_mid_left";
      this.wall[r_y][x + w] = "wall_side_mid_right";
    }
  };

  replace() {
    this.replaceFloorRandomly();
    this.replaceLadder();
    this.replaceWallRandomly();
  };

  replaceFloorRandomly() {
    const replacements = ["floor_2", "floor_3", "floor_4", "floor_5", "floor_6", "floor_7", "floor_8"];
    const percent = 0.2;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.floor[y][x] && this.rng.nextFloat() < percent) {
          this.floor[y][x] = this.rng.choice(replacements);
        }
      }
    }
  };

  replaceLadder() {
    // replace one tile in last room as ladder = out from level!
    const last = this.rooms[this.rooms.length - 1];

    const ladder_x = last.x + (last.w >> 1);
    const ladder_y = last.y + (last.h >> 1);
    console.log(ladder_x, ladder_y, last);
    this.floor[ladder_y][ladder_x] = "floor_ladder";
  };

  replaceWallRandomly() {
    const wall_mid_top_replaces = [
      "wall_hole_1",
      "wall_hole_2",
      "wall_banner_red",
      "wall_banner_blue",
      "wall_banner_green",
      "wall_banner_yellow",
      "wall_goo",
      "wall_fountain_mid_red_anim",
      "wall_fountain_mid_blue_anim",
    ];
    const wall_mid_bottom_replaces = [
      "wall_hole_1",
      "wall_hole_2",
    ];
    const percent = 0.2;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.wall[y][x]) {
          switch (this.wall[y][x]) {
            case "wall_mid":
              if (this.rng.nextFloat() < percent) {
                const is_top = !!this.floor[y + 1][x];
                let replacements: string[];
                if (is_top) {
                  replacements = wall_mid_top_replaces;
                } else {
                  replacements = wall_mid_bottom_replaces;
                }
                const replacement = this.rng.choice(replacements);
                switch (replacement) {
                  case "wall_goo":
                    this.wall[y][x] = "wall_goo";
                    this.floor[y + 1][x] = "wall_goo_base";
                    break;
                  case "wall_fountain_mid_red_anim":
                    this.wall[y - 1][x] = "wall_fountain_top";
                    this.wall[y][x] = "wall_fountain_mid_red_anim";
                    this.floor[y + 1][x] = "wall_fountain_basin_red_anim";
                    break;
                  case "wall_fountain_mid_blue_anim":
                    this.wall[y - 1][x] = "wall_fountain_top";
                    this.wall[y][x] = "wall_fountain_mid_blue_anim";
                    this.floor[y + 1][x] = "wall_fountain_basin_blue_anim";
                    break;
                  default:
                    this.wall[y][x] = replacement;
                    break;
                }
              }
              break;
            default:
              // console.log("replace", this.wall[y][x]);
              break;
          }
        }
      }
    }
  };

  exit(time: number) {
    this.scene.setLevel(new Level(this.rng, this.registry, this.scene, this.hero, this.level + 1, time))
  };

  animate(time: number) {
    this.monsterList.forEach(m => m.animate(time));
    this.hero.animate(time);
  };
}