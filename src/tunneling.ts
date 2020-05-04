import {ImmutableRect, MutableRect, Rect} from "./geometry";
import {RNG} from "./rng";

export interface TunnelingOptions {
  readonly roomMinW?: number;
  readonly roomMinH?: number;
  readonly roomMaxW?: number;
  readonly roomMaxH?: number;
  readonly roomMinX?: number;
  readonly roomMinY?: number;

  readonly maxCorrDist?: number;
  readonly maxCorrWidth?: number;

  readonly skew?: number;

  readonly xDist?: number;
  readonly yDist?: number;

  readonly minCorrDistX?: number;
  readonly minCorrDistY?: number;

  readonly maxRooms?: number;

  readonly debug?: boolean;
}

export class TunnelingAlgorithm {
  private readonly _possible: Possible[] = [];

  readonly rooms: Rect[] = [];
  readonly corridorsV: Rect[] = [];
  readonly corridorsH: Rect[] = [];

  private readonly _rng: RNG;
  private readonly _width: number;
  private readonly _height: number;

  private readonly _roomMinW: number;
  private readonly _roomNinH: number;
  private readonly _roomMaxW: number;
  private readonly _roomMaxH: number;
  private readonly _roomMinX: number;
  private readonly _roomMinY: number;

  private readonly MaxCorrDist: number;
  private readonly MaxCorrWidth: number;

  private readonly _skew: number;

  private readonly _xDist: number;
  private readonly _yDist: number;

  private readonly MinCorrDistX: number;
  private readonly MinCorrDistY: number;

  private readonly MaxRooms: number;

  private readonly _debug: boolean;

  constructor(rng: RNG, width: number, height: number, options: TunnelingOptions) {
    this._rng = rng;
    this._width = width;
    this._height = height;

    this._roomMinW = options.roomMinW || 5;
    this._roomNinH = options.roomMinH || 5;
    this._roomMaxW = options.roomMaxW || 20;
    this._roomMaxH = options.roomMaxH || 20;
    this._roomMinX = options.roomMinX || 2;
    this._roomMinY = options.roomMinY || 2;

    this.MaxCorrDist = options.maxCorrDist || 20;
    this.MaxCorrWidth = options.maxCorrWidth || 5;

    this._skew = options.skew || 3;

    this._xDist = options.xDist || 2;
    this._yDist = options.yDist || 2;

    this.MinCorrDistX = options.minCorrDistX || (this._xDist << 1) + 1;
    this.MinCorrDistY = options.minCorrDistY || (this._yDist << 1) + 1;

    this.MaxRooms = options.maxRooms || 0;

    this._debug = options.debug || false;
  }

  private isOverlap(a: Rect): boolean {
    const f = a.isOverlap.bind(a);
    return this.rooms.some(f) ||
      this.corridorsV.some(f) ||
      this.corridorsH.some(f);
  }

  private valid(rect: Rect): boolean {
    return rect.x >= 0 && rect.y >= 0 && rect.w > 0 && rect.h > 0 &&
      rect.x + rect.w < this._width &&
      rect.y + rect.h < this._height &&
      !this.isOverlap(rect);
  }

  generate(): boolean {
    this.rooms.splice(0, this.rooms.length);
    this.corridorsH.splice(0, this.corridorsH.length);
    this.corridorsV.splice(0, this.corridorsV.length);

    if (this.generateFirstRoom()) {
      if (this.MaxRooms > 0) {
        while (this.rooms.length < this.MaxRooms) {
          if (!this.generateNextRoom()) {
            return false;
          }
        }
        return true;
      } else {
        while (this.generateNextRoom()) {
          console.log("generate next room");
        }
        return true;
      }
    }
    return false;
  }

  private generateFirstRoom(): boolean {
    const roomW = this._rng.range(this._roomMinW, this._roomMaxW);
    const roomH = this._rng.range(this._roomNinH, this._roomMaxH);

    const minX = Math.max(this._roomMinX, (this._width >> 1) - roomW);
    const minY = Math.max(this._roomMinY, (this._height >> 1) - roomH);

    const maxX = Math.min(this._width - this._roomMinX - roomW, (this._width >> 1) + roomW);
    const maxY = Math.min(this._height - this._roomMinY - roomH, (this._height >> 1) + roomH);

    const room = new ImmutableRect(
      this.nextRange(minX, maxX),
      this.nextRange(minY, maxY),
      roomW,
      roomH
    );

    if (!this.isOverlap(room.expand())) {
      this.rooms.push(room);
      return true;
    }
    return false;
  }

  private generateNextRoom(): boolean {
    if (this._debug) console.log("generate next room");
    // clear
    this._possible.splice(0, this._possible.length);

    this.rooms.forEach((room) => {
      const topC = this.findTopCorridorArea(room);
      const bottomC = this.findBottomCorridorArea(room);
      const rightC = this.findRightCorridorArea(room);
      const leftC = this.findLeftCorridorArea(room);

      if (topC) {
        if (this._debug) console.log("possible top corridor area", room, topC);
        const topR = this.findTopRoomArea(topC);
        if (topR) {
          if (this._debug) console.log("add possible top room area", room, topC, topR);
          this._possible.push(new Possible(topR, topC, Direction.TOP));
        }
      }
      if (bottomC) {
        if (this._debug) console.log("possible bottom corridor area", room, bottomC);
        const bottomR = this.findBottomRoomArea(bottomC);
        if (bottomR) {
          if (this._debug) console.log("add possible bottom room area", room, bottomC, bottomR);
          this._possible.push(new Possible(bottomR, bottomC, Direction.BOTTOM));
        }
      }
      if (rightC) {
        if (this._debug) console.log("possible right corridor area", room, rightC);
        const rightR = this.findRightRoomArea(rightC);
        if (rightR) {
          if (this._debug) console.log("add possible right room area", room, rightC, rightR);
          this._possible.push(new Possible(rightR, rightC, Direction.RIGHT));
        }
      }
      if (leftC) {
        if (this._debug) console.log("possible left corridor area", room, leftC);
        const leftR = this.findLeftRoomArea(leftC);
        if (leftR) {
          if (this._debug) console.log("add possible left room area", room, leftC, leftR);
          this._possible.push(new Possible(leftR, leftC, Direction.LEFT));
        }
      }
    });

    if (this._debug) console.log("possible", [...this._possible]);
    if (this._debug) console.log("rooms", [...this.rooms]);
    if (this._debug) console.log("corridorsV", [...this.corridorsV]);
    if (this._debug) console.log("corridorsH", [...this.corridorsH]);

    while (this._possible.length > 0) {
      const i = this._rng.range(0, this._possible.length);
      const possible = this._possible[i];
      this._possible.splice(i, 1);

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
    buffer.h = this.MinCorrDistY;
    buffer.y -= this.MinCorrDistY;
    buffer.x += this._xDist;
    buffer.w -= this._xDist << 1;

    let h = -1;
    let y = -1;
    for (; buffer.h <= this.MaxCorrDist; buffer.h++, buffer.y--) {
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
    buffer.h = this.MinCorrDistY;
    buffer.x += this._xDist;
    buffer.w -= this._xDist << 1;

    let h = -1;
    for (; buffer.h < this.MaxCorrDist; buffer.h++) {
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
    buffer.y += this._yDist;
    buffer.h -= this._yDist << 1;

    let w = -1;
    for (; buffer.w < this.MaxCorrDist; buffer.w++) {
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
    buffer.w = this.MinCorrDistX;
    buffer.x -= this.MinCorrDistX;
    buffer.y += this._yDist;
    buffer.h -= this._yDist << 1;

    let w = -1;
    let x = -1;
    for (; buffer.w <= this.MaxCorrDist; buffer.w++, buffer.x--) {
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
    buffer.h -= this.MinCorrDistY; // shift bottom
    buffer.x -= this._xDist; // shift to min width
    buffer.w += this._xDist << 1;

    if (buffer.h < this._roomNinH) { // shift to min height
      const d = this._roomNinH - buffer.h;
      buffer.h += d;
      buffer.y -= d;
    }

    // find max height
    let y = buffer.y;
    let h = buffer.h;
    for (; buffer.h <= this._roomMaxH; buffer.h++, buffer.y--) {
      if (this.valid(buffer)) {
        h = buffer.h;
        y = buffer.y;
      } else {
        buffer.h = h;
        buffer.y = y;
        break;
      }
    }

    if (y >= 0 && h >= 0) {
      // find min x
      let x = buffer.x;
      let w = buffer.w;
      for (const minX = corridor.x + this._xDist + 1 - this._roomMaxW;
           buffer.x > minX;
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
      for (const maxX = corridor.x + corridor.w - this._xDist - 1 + this._roomMaxW;
           buffer.x + buffer.w < maxX;
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
    buffer.y += this.MinCorrDistY; // shift top
    buffer.h -= this.MinCorrDistY; // shift top
    buffer.x -= this._xDist; // shift to min width
    buffer.w += this._xDist << 1;

    if (buffer.h < this._roomNinH) { // shift to min height
      buffer.h = this._roomNinH;
    }

    // find max height
    let h = buffer.h;
    for (; buffer.h <= this._roomMaxH; buffer.h++) {
      if (this.valid(buffer)) {
        h = buffer.h;
      } else {
        buffer.h = h;
        break;
      }
    }

    if (h >= 0) {

      // find min x
      let x = buffer.x;
      let w = buffer.w;
      for (const minX = corridor.x + this._xDist + 1 - this._roomMaxW;
           buffer.x > minX;
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
      for (const maxX = corridor.x + corridor.w - this._xDist - 1 + this._roomMaxW;
           buffer.x + buffer.w < maxX;
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
    buffer.x += this.MinCorrDistX; // shift left
    buffer.w -= this.MinCorrDistX;
    buffer.y -= this._yDist;  // shift to min height
    buffer.h += this._yDist << 1;

    if (buffer.w < this._roomMinW) {
      buffer.w = this._roomMinW;
    }

    // find max width
    let w = buffer.w;
    for (; buffer.w <= this._roomMaxW; buffer.w++) {
      if (this.valid(buffer)) {
        w = buffer.w;
      } else {
        buffer.w = w;
        break;
      }
    }

    if (w >= 0) {
      // find min y
      let y = buffer.y;
      let h = buffer.h;
      for (const minY = corridor.y + this._yDist + 1 - this._roomMaxH;
           buffer.y > minY;
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
      for (const maxY = corridor.y + corridor.h - this._yDist - 1 + this._roomMaxH;
           buffer.y + buffer.h < maxY;
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
    buffer.w -= this.MinCorrDistX; // shift right
    buffer.y -= this._yDist; // shift to min height
    buffer.h += this._yDist << 1;

    if (buffer.w < this._roomMinW) { // shift to min width
      const d = this._roomMinW - buffer.w;
      buffer.w += d;
      buffer.x -= d;
    }

    // find max width
    let x = buffer.x;
    let w = buffer.w;
    for (; buffer.w <= this._roomMaxW; buffer.w++, buffer.x--) {
      if (this.valid(buffer)) {
        w = buffer.w;
        x = buffer.x;
      } else {
        buffer.x = x;
        buffer.w = w;
        break;
      }
    }

    if (x >= 0 && w >= 0) {

      // find min y
      let y = buffer.y;
      let h = buffer.h;
      for (const minY = corridor.y + this._yDist + 1 - this._roomMaxH;
           buffer.y > minY;
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
      for (const maxY = corridor.y - this._yDist - 1 + this._roomMaxH;
           buffer.y + buffer.h < maxY;
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
      if (this._debug) console.warn("left room area not valid", corridor, buffer);
    }
    return null;
  }

  // generate rooms

  private generateTopRoom(possible: Possible): boolean {
    const corrW = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.w));
    const corrH = this.nextRange(this.MinCorrDistY, possible.corridor.h);
    const corrY = possible.corridor.y + (possible.corridor.h - corrH);
    const corrX = this.nextRange(possible.corridor.x, possible.corridor.x + possible.corridor.w - corrW);
    const corr = new ImmutableRect(corrX, corrY, corrW, corrH);

    if (this.valid(corr.expandV())) {
      const roomMinY = Math.max(3, possible.room.y, corr.y - this._roomMaxH);
      const roomY = this.nextRange(roomMinY, corr.y - this._roomNinH);
      const roomH = corr.y - roomY;

      const roomMaxX = corr.x - this._xDist;
      const roomMinX = Math.max(2, possible.room.x, corr.x + corr.w + this._xDist - this._roomMaxW);
      const roomX = this.nextRange(roomMinX, roomMaxX);

      const roomMinRightX = corr.x + corr.w + this._xDist;
      const roomMaxRightX = Math.min(possible.room.x + possible.room.w, roomX + this._roomMaxW);

      const roomRightX = this.nextRange(roomMinRightX, roomMaxRightX);
      const roomW = roomRightX - roomX;
      const room = new ImmutableRect(roomX, roomY, roomW, roomH);

      if (this.valid(room.expand())) {
        if (this._debug) console.log("add top room", corr, room);
        this.corridorsV.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        if (this._debug) console.warn("top room not valid");
      }
    } else {
      if (this._debug) console.warn("top corridor not valid");
    }
    return false;
  }

  private generateBottomRoom(possible: Possible): boolean {
    const corrY = possible.corridor.y;
    const corrW = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.w));
    const corrH = this.nextRange(this.MinCorrDistY, possible.corridor.h);
    const corrX = this.nextRange(possible.corridor.x, possible.corridor.x + possible.corridor.w - corrW);
    const corr = new ImmutableRect(corrX, corrY, corrW, corrH);

    if (this.valid(corr.expandV())) {
      const roomY = corr.y + corr.h;
      const roomMinY = roomY + this._roomNinH;
      const roomMaxY = Math.min(possible.room.y + possible.room.h, roomMinY + this._roomMaxH);
      const roomBottomY = this.nextRange(roomMinY, roomMaxY);
      const roomH = roomBottomY - roomY;

      const roomMaxX = corr.x - this._xDist;
      const roomMinX = Math.max(2, possible.room.x, corr.x + corr.w + this._xDist - this._roomMaxW);
      const roomX = this.nextRange(roomMinX, roomMaxX);

      const roomMinRightX = corr.x + corr.w + this._xDist;
      const roomMaxRightX = Math.min(possible.room.x + possible.room.w, roomX + this._roomMaxW);

      const roomRightX = this.nextRange(roomMinRightX, roomMaxRightX);
      const roomW = roomRightX - roomX;
      const room = new ImmutableRect(roomX, roomY, roomW, roomH);

      if (this.valid(room.expand())) {
        if (this._debug) console.log("add bottom room", corr, room);
        this.corridorsV.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        if (this._debug) console.warn("bottom room not valid", corr, room);
      }
    } else {
      if (this._debug) console.warn("bottom corridor not valid", corr);
    }
    return false;
  }

  private generateRightRoom(possible: Possible): boolean {
    const corrX = possible.corridor.x;
    const corrH = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.h));
    const corrW = this.nextRange(this.MinCorrDistX, possible.corridor.w);
    const corrY = this.nextRange(possible.corridor.y, possible.corridor.y + possible.corridor.h - corrH);
    const corr = new ImmutableRect(corrX, corrY, corrW, corrH);

    if (this.valid(corr.expandH())) {
      const roomX = corr.x + corr.w;
      const roomMinX = roomX + this._roomMinW;
      const roomMaxX = Math.min(possible.room.x + possible.room.w, roomMinX + this._roomMaxW);
      const roomRightX = this.nextRange(roomMinX, roomMaxX);
      const roomW = roomRightX - roomX;

      const roomMaxY = corr.y - this._yDist;
      const roomMinY = Math.max(2, possible.room.y, corr.y + corr.h + this._yDist - this._roomMaxH);
      const roomY = this.nextRange(roomMinY, roomMaxY);

      const roomMinBottomY = corr.y + corr.h + this._yDist;
      const roomMaxBottomY = Math.min(possible.room.y + possible.room.h, roomY + this._roomMaxH);

      const roomBottomY = this.nextRange(roomMinBottomY, roomMaxBottomY);
      const roomH = roomBottomY - roomY;

      const room = new ImmutableRect(roomX, roomY, roomW, roomH);

      if (this.valid(room.expand())) {
        if (this._debug) console.log("add right room", corr, room);
        this.corridorsH.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        if (this._debug) console.warn("right room not valid", corr, room);
      }
    } else {
      if (this._debug) console.warn("right corridor not valid", corr);
    }

    return false;
  }

  private generateLeftRoom(possible: Possible): boolean {
    const corrH = this.nextRange(1, Math.min(this.MaxCorrWidth, possible.corridor.h));
    const corrW = this.nextRange(this.MinCorrDistX, possible.corridor.w);
    const corrX = possible.corridor.x + (possible.corridor.w - corrW);
    const corrY = this.nextRange(possible.corridor.y, possible.corridor.y + possible.corridor.h - corrH);
    const corr = new ImmutableRect(corrX, corrY, corrW, corrH);

    if (this.valid(corr.expandH())) {
      const roomMinX = Math.max(2, possible.room.x, corr.x - this._roomMaxW);
      const roomX = this.nextRange(roomMinX, corr.x - this._roomMinW);
      const roomW = corr.x - roomX;

      const roomMaxY = corr.y - this._yDist;
      const roomMinY = Math.max(3, possible.room.y, corr.y + corr.h + this._yDist - this._roomMaxH);
      const roomY = this.nextRange(roomMinY, roomMaxY);

      const roomMinBottomY = corr.y + corr.h + this._yDist;
      const roomMaxBottomY = Math.min(possible.room.y + possible.room.h, roomY + this._roomMaxH);

      const roomBottomY = this.nextRange(roomMinBottomY, roomMaxBottomY);
      const roomH = roomBottomY - roomY;
      const room = new ImmutableRect(roomX, roomY, roomW, roomH);

      if (this.valid(room.expand())) {
        if (this._debug) console.log("add left room", corr, room);
        this.corridorsH.push(corr);
        this.rooms.push(room);
        this.connectWithOthers(room);
        return true;
      } else {
        if (this._debug) console.warn("left room not valid");
      }
    } else {
      if (this._debug) console.warn("left corridor not valid");
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
      const b = this.rooms[i];

      // try calculate horizontal distance
      const maxX = Math.max(a.x, b.x);
      const minWidthX = Math.min(a.x + a.w, b.x + b.w);
      if (maxX + 5 <= minWidthX) {
        let rect: ImmutableRect;
        if (a.y + a.h < b.y) {
          rect = new ImmutableRect(
            maxX + 2,
            a.y + a.h,
            minWidthX - maxX - 4,
            b.y - a.y - a.h
          );
        } else {
          rect = new ImmutableRect(
            maxX + 2,
            b.y + b.h,
            minWidthX - maxX - 4,
            a.y - b.y - b.h
          );
        }
        if (this._debug) console.log("test v corr", rect);
        if (rect.w < this.MaxCorrDist && this.valid(rect.expandV())) {
          if (this._debug) console.log("add v corr", rect);
          this.corridorsV.push(rect);
        }
      }

      // try calculate vertical distance
      const maxY = Math.max(a.y, b.y);
      const minHeightY = Math.min(a.y + a.h, b.y + b.h);
      if (maxY + 3 <= minHeightY) {
        let rect: ImmutableRect;
        if (a.x + a.w < b.x) {
          rect = new ImmutableRect(
            a.x + a.w,
            maxY + 1,
            b.x - a.x - a.w,
            minHeightY - maxY - 2
          );
        } else {
          rect = new ImmutableRect(
            b.x + b.w,
            maxY + 1,
            a.x - b.x - b.w,
            minHeightY - maxY - 2,
          );
        }

        if (this._debug) console.log("test h corr", rect);
        if (rect.h < this.MaxCorrDist && this.valid(rect.expandH())) {
          if (this._debug) console.log("add h corr", rect);
          this.corridorsH.push(rect);
        }
      }
    }
  }

  private nextRange(min: number, max: number): number {
    return Math.round(this._rng.skewNormal(min, max, this._skew));
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