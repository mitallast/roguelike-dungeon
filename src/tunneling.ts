import {ImmutableRect, MutableRect, Rect} from "./geometry";
import {RNG} from "./rng";
import {yields} from "./concurency";

const room_min_w = 5;
const room_min_h = 5;
const room_max_w = 20;
const room_max_h = 20;
const room_min_x = 2;
const room_min_y = 2;

const max_corr_dist = 20;
const max_corr_width = 5;

const x_dist = 2;
const y_dist = 2;

const min_corr_dist_x = (x_dist << 1) + 1;
const min_corr_dist_y = (y_dist << 1) + 1;

const skew = 3;

export class TunnelingAlgorithm {
  private readonly possible: Possible[] = [];

  readonly rooms: Rect[] = [];
  readonly corridorsV: Rect[] = [];
  readonly corridorsH: Rect[] = [];

  private readonly rng: RNG;
  private readonly width: number;
  private readonly height: number;

  private percentValue: number = 0;

  get percent(): number {
    return this.percentValue;
  }

  constructor(rng: RNG, width: number, height: number) {
    this.rng = rng;
    this.width = width;
    this.height = height;
  }

  private isOverlap(a: Rect) {
    const f = a.isOverlap.bind(a);
    return this.rooms.some(f) ||
      this.corridorsV.some(f) ||
      this.corridorsH.some(f);
  };

  private valid(rect: Rect): boolean {
    return rect.x >= 0 && rect.y >= 0 && rect.w > 0 && rect.h > 0 &&
      rect.x + rect.w < this.width &&
      rect.y + rect.h < this.height &&
      !this.isOverlap(rect);
  }

  async generate(total: number): Promise<boolean> {
    console.log("generate rooms");
    // clear
    this.percentValue = 0;
    this.rooms.splice(0, this.rooms.length);
    this.corridorsH.splice(0, this.corridorsH.length);
    this.corridorsV.splice(0, this.corridorsV.length);

    let count = 0;
    if (this.generateFirstRoom()) {
      count++;
      this.percentValue = count * 100.0 / total;
      await yields(100);

      while (this.rooms.length < total) {
        if (!this.generateNextRoom()) {
          return false;
        }
        count++;
        this.percentValue = count * 100.0 / total;
        await yields(100);
      }
      return true;
    }
    return false;
  }

  private generateFirstRoom(): boolean {
    const room_w = this.rng.nextRange(room_min_w, room_max_w);
    const room_h = this.rng.nextRange(room_min_h, room_max_h);

    const min_x = Math.max(room_min_x, (this.width >> 1) - room_w);
    const min_y = Math.max(room_min_y, (this.height >> 1) - room_h);

    const max_x = Math.min(this.width - room_min_x - room_w, (this.width >> 1) + room_w);
    const max_y = Math.min(this.height - room_min_y - room_h, (this.height >> 1) + room_h);

    const room = new ImmutableRect(
      this.nextRange(min_x, max_x),
      this.nextRange(min_y, max_y),
      room_w,
      room_h
    );

    if (!this.isOverlap(room.expand())) {
      this.rooms.push(room);
      return true;
    }
    return false;
  }

  private generateNextRoom(): boolean {
    // clear
    this.possible.splice(0, this.possible.length);

    this.rooms.forEach((room) => {
      const topC = this.findTopCorridorArea(room);
      const bottomC = this.findBottomCorridorArea(room);
      const rightC = this.findRightCorridorArea(room);
      const leftC = this.findLeftCorridorArea(room);

      if (topC) {
        // console.log("possible top corridor area", room, topC);
        const topR = this.findTopRoomArea(topC);
        if (topR) {
          // console.log("add possible top room area", room, topC, topR);
          this.possible.push(new Possible(topR, topC, Direction.TOP));
        }
      }
      if (bottomC) {
        const bottomR = this.findBottomRoomArea(bottomC);
        if (bottomR) {
          // console.log("add possible bottom room area", room, bottomC, bottomR);
          this.possible.push(new Possible(bottomR, bottomC, Direction.BOTTOM));
        }
      }
      if (rightC) {
        const rightR = this.findRightRoomArea(rightC);
        if (rightR) {
          // console.log("add possible right room area", room, rightC, rightR);
          this.possible.push(new Possible(rightR, rightC, Direction.RIGHT));
        }
      }
      if (leftC) {
        const leftR = this.findLeftRoomArea(leftC);
        if (leftR) {
          // console.log("add possible left room area", room, leftC, leftR);
          this.possible.push(new Possible(leftR, leftC, Direction.LEFT));
        }
      }
    });

    console.log("possible", [...this.possible]);
    console.log("rooms", [...this.rooms]);
    console.log("corridorsV", [...this.corridorsV]);
    console.log("corridorsH", [...this.corridorsH]);

    while (this.possible.length > 0) {
      const i = this.rng.nextRange(0, this.possible.length);
      const possible = this.possible[i];
      this.possible.splice(i, 1);

      switch (possible.direction) {
        case Direction.TOP:
          if (this.generateTopRoom(possible)) {
            return true;
          }
          break;
        case Direction.BOTTOM:
          if (this.generateBottomRoom(possible)) {
            return true;
          }
          break;
        case Direction.RIGHT:
          if (this.generateRightRoom(possible)) {
            return true;
          }
          break;
        case Direction.LEFT:
          if (this.generateLeftRoom(possible)) {
            return true;
          }
          break;
      }
    }
    return false;
  }

  // generate corridor area

  private findTopCorridorArea(room: Rect): Rect | null {
    const buffer = MutableRect.from(room);
    buffer.h = min_corr_dist_y;
    buffer.y -= min_corr_dist_y;
    buffer.x += x_dist;
    buffer.w -= x_dist << 1;

    let h = -1;
    let y = -1;
    for (; buffer.h <= max_corr_dist; buffer.h++, buffer.y--) {
      if (this.valid(buffer)) {
        h = buffer.h;
        y = buffer.y;
      } else {
        break;
      }
    }

    if (h >= 0 && y >= 0) {
      buffer.h = h;
      buffer.y = y;
      return buffer.immutable();
    } else {
      return null;
    }
  }

  private findBottomCorridorArea(room: Rect): Rect | null {
    const buffer = MutableRect.from(room);
    buffer.y += room.h;
    buffer.h = min_corr_dist_y;
    buffer.x += x_dist;
    buffer.w -= x_dist << 1;

    let h = -1;
    for (; buffer.h < max_corr_dist; buffer.h++) {
      if (this.valid(buffer)) {
        h = buffer.h;
      } else {
        break;
      }
    }

    if (h >= 0) {
      buffer.h = h;
      return buffer.immutable();
    } else {
      return null;
    }
  }

  private findRightCorridorArea(room: Rect): Rect | null {
    const buffer = MutableRect.from(room);
    buffer.x += buffer.w;
    buffer.y += y_dist;
    buffer.h -= y_dist << 1;

    let w = -1;
    for (; buffer.w < max_corr_dist; buffer.w++) {
      if (this.valid(buffer)) {
        w = buffer.w;
      } else {
        break;
      }
    }

    if (w >= 0) {
      buffer.w = w;
      return buffer.immutable();
    } else {
      return null;
    }
  }

  private findLeftCorridorArea(room: Rect): Rect | null {
    const buffer = MutableRect.from(room);
    buffer.w = min_corr_dist_x;
    buffer.x -= min_corr_dist_x;
    buffer.y += y_dist;
    buffer.h -= y_dist << 1;

    let w = -1;
    let x = -1;
    for (; buffer.w <= max_corr_dist; buffer.w++, buffer.x--) {
      if (this.valid(buffer)) {
        w = buffer.w;
        x = buffer.x;
      } else {
        break;
      }
    }

    if (w >= 0 && x >= 0) {
      buffer.w = w;
      buffer.x = x;
      return buffer.immutable();
    } else {
      return null;
    }
  }

  // generate room area

  private findTopRoomArea(corridor: Rect): Rect | null {
    const buffer = MutableRect.from(corridor);
    buffer.h -= min_corr_dist_y; // shift bottom
    buffer.x -= x_dist; // shift to min width
    buffer.w += x_dist << 1;

    if (buffer.h < room_min_h) { // shift to min height
      const d = room_min_h - buffer.h;
      buffer.h += d;
      buffer.y -= d;
    }

    // find max height
    let y = -1;
    let h = -1;
    for (; buffer.h <= room_max_h; buffer.h++, buffer.y--) {
      if (this.valid(buffer)) {
        h = buffer.h;
        y = buffer.y;
      } else {
        break;
      }
    }

    if (y >= 0 && h >= 0) {
      buffer.h = h;
      buffer.y = y;

      // find min x
      let x = buffer.x;
      let w = buffer.w;
      for (const min_x = corridor.x + x_dist + 1 - room_max_w;
           buffer.x > min_x;
           buffer.x--, buffer.w++
      ) {
        if (this.valid(buffer)) {
          x = buffer.x;
          w = buffer.w;
        } else {
          break;
        }
      }
      buffer.x = x;
      buffer.w = w;

      // find max x
      for (const max_x = corridor.x + corridor.w - x_dist - 1 + room_max_w;
           buffer.x + buffer.w < max_x;
           buffer.w++
      ) {
        if (this.valid(buffer)) {
          w = buffer.w;
        } else {
          break;
        }
      }
      buffer.w = w;
      return buffer.immutable();
    }
    return null;
  }

  private findBottomRoomArea(corridor: Rect): Rect | null {
    const buffer = MutableRect.from(corridor);
    buffer.y += min_corr_dist_y; // shift top
    buffer.h -= min_corr_dist_y; // shift top
    buffer.x -= x_dist; // shift to min width
    buffer.w += x_dist << 1;

    if (buffer.h < room_min_h) { // shift to min height
      buffer.h = room_min_h;
    }

    // find max height
    let h = -1;
    for (; buffer.h <= room_max_h; buffer.h++) {
      if (this.valid(buffer)) {
        h = buffer.h;
      } else {
        break;
      }
    }

    if (h >= 0) {
      buffer.h = h;

      // find min x
      let x = buffer.x;
      let w = buffer.w;
      for (const min_x = corridor.x + x_dist + 1 - room_max_w;
           buffer.x > min_x;
           buffer.x--, buffer.w++
      ) {
        if (this.valid(buffer)) {
          x = buffer.x;
          w = buffer.w;
        } else {
          break;
        }
      }
      buffer.x = x;
      buffer.w = w;

      // find max x
      for (const max_x = corridor.x + corridor.w - x_dist - 1 + room_max_w;
           buffer.x + buffer.w < max_x;
           buffer.w++
      ) {
        if (this.valid(buffer)) {
          w = buffer.w;
        } else {
          break;
        }
      }
      buffer.w = w;
      return buffer.immutable();
    }

    return null;
  }

  private findRightRoomArea(corridor: Rect): Rect | null {
    const buffer = MutableRect.from(corridor);
    buffer.x += min_corr_dist_x; // shift left
    buffer.w -= min_corr_dist_x;
    buffer.y -= y_dist;  // shift to min height
    buffer.h += y_dist << 1;

    if (buffer.w < room_min_w) {
      buffer.w = room_min_w;
    }

    // find max width
    let w = -1;
    for (; buffer.w <= room_max_w; buffer.w++) {
      if (this.valid(buffer)) {
        w = buffer.w;
      } else {
        break;
      }
    }

    if (w >= 0) {
      buffer.w = w;

      // find min y
      let y = buffer.y;
      let h = buffer.h;
      for (const min_y = corridor.y + y_dist + 1 - room_max_h;
           buffer.y > min_y;
           buffer.y--, buffer.h++
      ) {
        if (this.valid(buffer)) {
          y = buffer.y;
          h = buffer.h;
        } else {
          buffer.y = y;
          buffer.h = h;
          break;
        }
      }

      // find max y
      for (const max_y = corridor.y + corridor.h - y_dist - 1 + room_max_h;
           buffer.y + buffer.h < max_y;
           buffer.h++
      ) {
        if (this.valid(buffer)) {
          h = buffer.h;
        } else {
          buffer.h = h;
          break;
        }
      }
      return buffer.immutable();
    }

    return null;
  }

  private findLeftRoomArea(corridor: Rect): Rect | null {
    const buffer = MutableRect.from(corridor);
    buffer.w -= min_corr_dist_x; // shift right
    buffer.y -= y_dist; // shift to min height
    buffer.h += y_dist << 1;

    if (buffer.w < room_min_w) { // shift to min width
      const d = room_min_w - buffer.w;
      buffer.w += d;
      buffer.x -= d;
    }

    // find max width
    let x = -1;
    let w = -1;
    for (; buffer.w <= room_max_w; buffer.w++, buffer.x--) {
      if (this.valid(buffer)) {
        w = buffer.w;
        x = buffer.x;
      } else {
        break;
      }
    }

    if (x >= 0 && w >= 0) {
      buffer.x = x;
      buffer.w = w;

      // find min y
      let y = buffer.y;
      let h = buffer.h;
      for (const min_y = corridor.y + y_dist + 1 - room_max_h;
           buffer.y > min_y;
           buffer.y--, buffer.h++
      ) {
        if (this.valid(buffer)) {
          y = buffer.y;
          h = buffer.h;
        } else {
          break;
        }
      }
      buffer.y = y;
      buffer.h = h;

      // find max y
      for (const max_y = corridor.y - y_dist - 1 + room_max_h;
           buffer.y + buffer.h < max_y;
           buffer.h++
      ) {
        if (this.valid(buffer)) {
          h = buffer.h;
        } else {
          break;
        }
      }
      buffer.h = h;
      return buffer.immutable();
    } else {
      console.warn("left room area not valid", corridor, buffer);
    }
    return null;
  }

  // generate rooms

  private generateTopRoom(possible: Possible): boolean {
    const corr_w = this.nextRange(1, Math.min(max_corr_width, possible.corridor.w));
    const corr_h = this.nextRange(min_corr_dist_y, possible.corridor.h);
    const corr_y = possible.corridor.y + (possible.corridor.h - corr_h);
    const corr_x = this.nextRange(possible.corridor.x, possible.corridor.x + possible.corridor.w - corr_w);
    const corr = new ImmutableRect(corr_x, corr_y, corr_w, corr_h);

    if (this.valid(corr.expandV())) {
      const room_min_y = Math.max(3, possible.room.y, corr.y - room_max_h);
      const room_y = this.nextRange(room_min_y, corr.y - room_min_h);
      const room_h = corr.y - room_y;

      const room_max_x = corr.x - x_dist;
      const room_min_x = Math.max(2, possible.room.x, corr.x + corr.w + x_dist - room_max_w);
      const room_x = this.nextRange(room_min_x, room_max_x);

      const room_min_right_x = corr.x + corr.w + x_dist;
      const room_max_right_x = Math.min(possible.room.x + possible.room.w, room_x + room_max_w);

      const room_right_x = this.nextRange(room_min_right_x, room_max_right_x);
      const room_w = room_right_x - room_x;
      const room = new ImmutableRect(room_x, room_y, room_w, room_h);

      if (this.valid(room.expand())) {
        console.log("add top room", corr, room);
        this.corridorsV.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        console.warn("top room not valid");
      }
    } else {
      console.warn("top corridor not valid");
    }
    return false;
  }

  private generateBottomRoom(possible: Possible): boolean {
    const corr_y = possible.corridor.y;
    const corr_w = this.nextRange(1, Math.min(max_corr_width, possible.corridor.w));
    const corr_h = this.nextRange(min_corr_dist_y, possible.corridor.h);
    const corr_x = this.nextRange(possible.corridor.x, possible.corridor.x + possible.corridor.w - corr_w);
    const corr = new ImmutableRect(corr_x, corr_y, corr_w, corr_h);

    if (this.valid(corr.expandV())) {
      const room_y = corr.y + corr.h;
      const room_min_y = room_y + room_min_h;
      const room_max_y = Math.min(possible.room.y + possible.room.h, room_min_y + room_max_h);
      const room_bottom_y = this.nextRange(room_min_y, room_max_y);
      const room_h = room_bottom_y - room_y;

      const room_max_x = corr.x - x_dist;
      const room_min_x = Math.max(2, possible.room.x, corr.x + corr.w + x_dist - room_max_w);
      const room_x = this.nextRange(room_min_x, room_max_x);

      const room_min_right_x = corr.x + corr.w + x_dist;
      const room_max_right_x = Math.min(possible.room.x + possible.room.w, room_x + room_max_w);

      const room_right_x = this.nextRange(room_min_right_x, room_max_right_x);
      const room_w = room_right_x - room_x;
      const room = new ImmutableRect(room_x, room_y, room_w, room_h);

      if (this.valid(room.expand())) {
        console.log("add bottom room", corr, room);
        this.corridorsV.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        console.warn("bottom room not valid", corr, room);
      }
    } else {
      console.warn("bottom corridor not valid", corr);
    }
    return false;
  }

  private generateRightRoom(possible: Possible): boolean {
    const corr_x = possible.corridor.x;
    const corr_h = this.nextRange(1, Math.min(max_corr_width, possible.corridor.h));
    const corr_w = this.nextRange(min_corr_dist_x, possible.corridor.w);
    const corr_y = this.nextRange(possible.corridor.y, possible.corridor.y + possible.corridor.h - corr_h);
    const corr = new ImmutableRect(corr_x, corr_y, corr_w, corr_h);

    if (this.valid(corr.expandH())) {
      const room_x = corr.x + corr.w;
      const room_min_x = room_x + room_min_w;
      const room_max_x = Math.min(possible.room.x + possible.room.w, room_min_x + room_max_w);
      const room_right_x = this.nextRange(room_min_x, room_max_x);
      const room_w = room_right_x - room_x;

      const room_max_y = corr.y - y_dist;
      const room_min_y = Math.max(2, possible.room.y, corr.y + corr.h + y_dist - room_max_h);
      const room_y = this.nextRange(room_min_y, room_max_y);

      const room_min_bottom_y = corr.y + corr.h + y_dist;
      const room_max_bottom_y = Math.min(possible.room.y + possible.room.h, room_y + room_max_h);

      const room_bottom_y = this.nextRange(room_min_bottom_y, room_max_bottom_y);
      const room_h = room_bottom_y - room_y;
      console.log({
        room_min_bottom_y: room_min_bottom_y,
        room_max_bottom_y: room_max_bottom_y,
        room_bottom_y: room_bottom_y,
        room_h: room_h,
      });

      const room = new ImmutableRect(room_x, room_y, room_w, room_h);

      if (this.valid(room.expand())) {
        console.log("add right room", corr, room);
        this.corridorsH.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        console.warn("right room not valid", corr, room);
      }
    } else {
      console.warn("right corridor not valid", corr);
    }

    return false;
  }

  private generateLeftRoom(possible: Possible): boolean {
    const corr_h = this.nextRange(1, Math.min(max_corr_width, possible.corridor.h));
    const corr_w = this.nextRange(min_corr_dist_x, possible.corridor.w);
    const corr_x = possible.corridor.x + (possible.corridor.w - corr_w);
    const corr_y = this.nextRange(possible.corridor.y, possible.corridor.y + possible.corridor.h - corr_h);
    const corr = new ImmutableRect(corr_x, corr_y, corr_w, corr_h);

    if (this.valid(corr.expandH())) {
      const room_min_x = Math.max(2, possible.room.x, corr.x - room_max_w);
      const room_x = this.nextRange(room_min_x, corr.x - room_min_w);
      const room_w = corr.x - room_x;

      const room_max_y = corr.y - y_dist;
      const room_min_y = Math.max(3, possible.room.y, corr.y + corr.h + y_dist - room_max_h);
      const room_y = this.nextRange(room_min_y, room_max_y);

      const room_min_bottom_y = corr.y + corr.h + y_dist;
      const room_max_bottom_y = Math.min(possible.room.y + possible.room.h, room_y + room_max_h);

      const room_bottom_y = this.nextRange(room_min_bottom_y, room_max_bottom_y);
      const room_h = room_bottom_y - room_y;
      const room = new ImmutableRect(room_x, room_y, room_w, room_h);

      if (this.valid(room.expand())) {
        console.log("add left room", corr, room);
        this.corridorsH.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        console.warn("left room not valid");
      }
    } else {
      console.warn("left corridor not valid");
    }
    return false;
  }

  // additional

  private connectWithOthers(room: Rect): void {
    // @todo maybe refactor to using precomputed this.possible?

    // old version of connections:

    // find connection
    const a = room;

    // connect with all possible rooms
    for (let i = 0; i < this.rooms.length - 1; i++) {
      let b = this.rooms[i];

      // try calculate horizontal distance
      const max_x = Math.max(a.x, b.x);
      const min_x_w = Math.min(a.x + a.w, b.x + b.w);
      if (max_x + 5 <= min_x_w) {
        let rect: ImmutableRect;
        if (a.y + a.h < b.y) {
          rect = new ImmutableRect(
            max_x + 2,
            a.y + a.h,
            min_x_w - max_x - 4,
            b.y - a.y - a.h
          );
        } else {
          rect = new ImmutableRect(
            max_x + 2,
            b.y + b.h,
            min_x_w - max_x - 4,
            a.y - b.y - b.h
          );
        }
        console.log("test v corr", rect);
        if (rect.w < max_corr_dist && this.valid(rect.expandV())) {
          console.log("add v corr", rect);
          this.corridorsV.push(rect);
        }
      }

      // try calculate vertical distance
      const max_y = Math.max(a.y, b.y);
      const min_y_h = Math.min(a.y + a.h, b.y + b.h);
      if (max_y + 3 <= min_y_h) {
        let rect: ImmutableRect;
        if (a.x + a.w < b.x) {
          rect = new ImmutableRect(
            a.x + a.w,
            max_y + 1,
            b.x - a.x - a.w,
            min_y_h - max_y - 2
          );
        } else {
          rect = new ImmutableRect(
            b.x + b.w,
            max_y + 1,
            a.x - b.x - b.w,
            min_y_h - max_y - 2,
          );
        }

        console.log("test h corr", rect);
        if (rect.h < max_corr_dist && this.valid(rect.expandH())) {
          console.log("add h corr", rect);
          this.corridorsH.push(rect);
        }
      }
    }
  }

  private nextRange(min: number, max: number): number {
    return Math.round(this.rng.nextNormal(min, max, skew));
  }
}

enum Direction {
  TOP = 0, RIGHT = 1, BOTTOM = 2, LEFT = 3
}

class Possible {
  readonly room: Rect;
  readonly corridor: Rect;
  readonly direction: Direction;

  constructor(room: Rect, corridor: Rect, direction: Direction) {
    this.room = room;
    this.corridor = corridor;
    this.direction = direction;
  }
}