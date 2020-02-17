import {TinyMonster, tinyMonsterNames} from "./tiny.monster.js";
import {Coins, HealthBigFlask, HealthFlask} from "./drop.js";

export class Level {
  constructor(registry, scene, hero, l, time) {
    this.registry = registry;
    this.scene = scene;
    this.level = l;
    this.w = 200;
    this.h = 120;

    this.log = [];
    this.rooms = [];
    this.corridorsV = [];
    this.corridorsH = [];

    this.floor = this.createBuffer(() => false);
    this.drop = this.createBuffer(() => false);
    this.wall = this.createBuffer(() => false);

    this.monsterList = [];
    this.hero = hero;
    this.monsters = this.createBuffer(() => false);

    this.generate(time);
    this.fill();
    this.replace();
  }
  createBuffer(defaultValue) {
    const rows = [];
    for (let y = 0; y < this.h; y++) {
      const row = [];
      rows.push(row);
      for (let x = 0; x < this.w; x++) {
        row.push(defaultValue());
      }
    }
    return rows;
  };
  generate(time) {
    const rooms_total = 1 + this.level;
    const monsters_total = 2 + this.level;
    const drop_total = 5 + this.level;

    const room_min_w = 5;
    const room_min_h = 3;
    const room_max_w = 15;
    const room_max_h = 10;
    const room_min_x = 2;
    const room_min_y = 2;

    const retries = 200;
    const max_corr_dist = 12;

    // create rooms
    for (let r = 0; r < rooms_total; r++) {
      const room_w = Math.floor(Math.random() * (room_max_w - room_min_w) + room_min_w);
      const room_h = Math.floor(Math.random() * (room_max_h - room_min_h) + room_min_h);

      const room_max_x = this.w - 2 - room_w;
      const room_max_y = this.h - 2 - room_h;

      const room = {
        x: 0,
        y: 0,
        w: room_w,
        h: room_h
      };

      for (let t = 0; t < retries; t++) {

        room.x = Math.floor(Math.random() * (room_max_x - room_min_x) + room_min_x);
        room.y = Math.floor(Math.random() * (room_max_y - room_min_y) + room_min_y);

        if (!this.isRoomOverlap(room)) {
          // free position found
          if (this.rooms.length === 0) {
            this.rooms.push(room);
            break;
          } else {
            // find connection
            const a = room;
            let connected = false;

            // console.log("try find corridor", a);

            // find closest room
            for (let i = 0; i < this.rooms.length; i++) {
              let b = this.rooms[i];

              // try calculate horizontal distance
              const max_x = Math.max(a.x, b.x);
              const min_x_w = Math.min(a.x + a.w, b.x + b.w);
              if (max_x + 5 <= min_x_w) {
                let rect;
                if (a.y + a.h < b.y) {
                  rect = {
                    y: a.y + a.h,
                    x: max_x + 2,
                    h: b.y - a.y - a.h,
                    w: min_x_w - max_x - 4,
                  }
                } else {
                  rect = {
                    y: b.y + b.h,
                    x: max_x + 2,
                    h: a.y - b.y - b.h,
                    w: min_x_w - max_x - 4,
                  }
                }
                if (rect.h < max_corr_dist && !this.isCorrVOverlap(rect)) {
                  // console.log("has vertical", b);
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
                  rect = {
                    x: a.x + a.w,
                    y: max_y + 1,
                    w: b.x - a.x - a.w,
                    h: min_y_h - max_y - 2,
                  };
                } else {
                  rect = {
                    x: b.x + b.w,
                    y: max_y + 1,
                    w: a.x - b.x - b.w,
                    h: min_y_h - max_y - 2,
                  };
                }
                if (rect.w < max_corr_dist && !this.isCorrHOverlap(rect)) {
                  // console.log("has horizontal", b);
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

    // create monsters
    for (let m = 0; m < monsters_total; m++) {
      const r = Math.floor(Math.random() * (this.rooms.length - 2)) + 1;
      const room = this.rooms[r];
      for (let t = 0; t < 10; t++) {
        const x = Math.floor(Math.random() * room.w) + room.x;
        const y = Math.floor(Math.random() * room.h) + room.y;
        if (!this.monsters[y][x]) {
          const n = Math.floor(Math.random() * tinyMonsterNames.length);
          const name = tinyMonsterNames[n];
          const monster = new TinyMonster(this.registry, this, x, y, name, time);
          this.monsterList.push(monster);
          this.monsters[y][x] = monster;
          break;
        }
      }
    }

    // create drop
    for (let d = 0; d < drop_total; d++) {
      const r = Math.floor(Math.random() * this.rooms.length);
      const room = this.rooms[r];
      for (let t = 0; t < 10; t++) {
        const x = Math.floor(Math.random() * room.w) + room.x;
        const y = Math.floor(Math.random() * room.h) + room.y;
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
  randomDrop(x, y) {
    if (Math.random() < 0.5) {
      this.drop[y][x] = new Coins();
    } else if (Math.random() < 0.3) {
      this.drop[y][x] = new HealthFlask();
    } else if (Math.random() < 0.3) {
      this.drop[y][x] = new HealthBigFlask();
    }
  };
  isRoomOverlap(a) {
    const min_dist = 5;
    const a_dist = {
      x: a.x - min_dist,
      y: a.y - min_dist,
      w: a.w + min_dist + min_dist,
      h: a.h + min_dist + min_dist
    };
    for (let i = 0; i < this.rooms.length; i++) {
      let b = this.rooms[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    for (let i = 0; i < this.corridorsV.length; i++) {
      let b = this.corridorsV[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    for (let i = 0; i < this.corridorsH.length; i++) {
      let b = this.corridorsH[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    return false;
  };
  isCorrHOverlap(a) {
    const min_dist = 3;
    const a_dist = {
      x: a.x,
      y: a.y - min_dist,
      w: a.w,
      h: a.h + min_dist + min_dist
    };
    for (let i = 0; i < this.rooms.length; i++) {
      let b = this.rooms[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    for (let i = 0; i < this.corridorsV.length; i++) {
      let b = this.corridorsV[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    for (let i = 0; i < this.corridorsH.length; i++) {
      let b = this.corridorsH[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    return false;
  };
  isCorrVOverlap(a) {
    const min_dist = 2;
    const a_dist = {
      x: a.x - min_dist,
      y: a.y,
      w: a.w + min_dist + min_dist,
      h: a.h
    };
    for (let i = 0; i < this.rooms.length; i++) {
      let b = this.rooms[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    for (let i = 0; i < this.corridorsV.length; i++) {
      let b = this.corridorsV[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    for (let i = 0; i < this.corridorsH.length; i++) {
      let b = this.corridorsH[i];
      if (this.isRectOverlapWith(a_dist, b)) {
        return true;
      }
    }
    return false;
  };
  isRectOverlapWith(a, b) {
    return a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
  };
  fill() {
    this.rooms.forEach(r => this.fillRoom(r.x, r.y, r.w, r.h));
    this.corridorsH.forEach(r => this.fillCorridorH(r.x, r.y, r.w, r.h));
    this.corridorsV.forEach(r => this.fillCorridorV(r.x, r.y, r.w, r.h));
  };
  fillRoom(x, y, w, h) {
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
  fillCorridorH(x, y, w, h) {
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
            this.wall[l_y][x - 1] = false;
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
            this.wall[l_y][x + w] = false;
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
  fillCorridorV(x, y, w, h) {
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
          this.wall[y - 1][r_x] = false;
          break;
        default:
          console.log("top mid -1", this.wall[y - 1][r_x]);
          break;
      }
      switch (this.wall[y][r_x]) {
        case "wall_mid":
          this.wall[y][r_x] = false;
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
          this.wall[y + h - 2][r_x] = false;
          break;
        default:
          console.log("bottom mid -2", this.wall[y + h - 2][r_x]);
          break;
      }
      switch (this.wall[y + h - 1][r_x]) {
        case "wall_mid":
          this.wall[y + h - 1][r_x] = false;
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
        if (this.floor[y][x] && Math.random() < percent) {
          const i = Math.floor(Math.random() * replacements.length);
          this.floor[y][x] = replacements[i];
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
              if (Math.random() < percent) {
                const is_top = !!this.floor[y + 1][x];
                let replacements;
                if (is_top) {
                  replacements = wall_mid_top_replaces;
                } else {
                  replacements = wall_mid_bottom_replaces;
                }
                const i = Math.floor(Math.random() * replacements.length);
                const replacement = replacements[i];
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
  exit(time) {
    this.scene.setLevel(new Level(this.registry, this.scene, this.hero, this.level + 1, time))
  };
  animate(time) {
    this.monsterList.forEach(m => m.animate(time));
    this.hero.animate(time);
  };
}