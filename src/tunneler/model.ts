export interface ImmutablePoint {
  readonly x: number;
  readonly y: number;
}

export class Point implements ImmutablePoint {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {
  }

  plus(that: Point): Point {
    return new Point(this.x + that.x, this.y + that.y);
  }

  minus(that: Point): Point {
    return new Point(this.x - that.x, this.y - that.y);
  }

  multiply(value: number): Point {
    return new Point(this.x * value, this.y * value);
  }

  get negative(): Point {
    return new Point(-this.x, -this.y);
  }

  equal(x: number, y: number): boolean {
    return this.x === x && this.y === y;
  }

  equals(that: ImmutablePoint): boolean {
    return this.x === that.x && this.y === that.y;
  }

  toString(): string {
    return `{x: ${this.x}, y: ${this.y}}`;
  }

  static from(point: ImmutablePoint): Point {
    return new Point(point.x, point.y);
  }

  static NORTH: Point = new Point(-1, 0);
  static SOUTH: Point = new Point(1, 0);
  static EAST: Point = new Point(0, 1);
  static WEST: Point = new Point(0, -1);

  static NORTH_EAST: Point = new Point(-1, 1);
  static SOUTH_EAST: Point = new Point(1, 1);
  static SOUTH_WEST: Point = new Point(1, -1);
  static NORTH_WEST: Point = new Point(-1, -1);

  static ZERO: Point = new Point(0, 0);
}

export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,

  NORTH_EAST = 4,
  SOUTH_EAST = 5,
  SOUTH_WEST = 6,
  NORTH_WEST = 7,

  // north, east (=right), south (=down) , west (=left), plus mixed directions
  // XX is for ease of reading files. this is the comment marker on the next line
  // XX also means "no intended direction"
}

export enum TunnelerCellType {
  OPEN = 0,
  CLOSED = 1,
  GUARANTEED_OPEN = 2,
  GUARANTEED_CLOSED = 3,
  // these cannot be joined by crawlers with others of their own kind
  NON_JOIN_OPEN = 4,
  NON_JOIN_CLOSED = 5,
  NON_JOIN_GUARANTEED_OPEN = 6,
  NON_JOIN_GUARANTEED_CLOSED = 7,
  INSIDE_ROOM_OPEN = 8,
  INSIDE_TUNNEL_OPEN = 9,
  INSIDE_ANTEROOM_OPEN = 10,
  H_DOOR = 11, // horizontal door, varies over y-axis
  V_DOOR = 12, // vertical door, over x-axis(up and down)
  COLUMN = 13
}

export enum RoomSize {
  SMALL, MEDIUM, LARGE
}

export class Room {
  readonly inside: Point[];
  inDungeon: boolean;   // if this is false, the room is part of the labyrinth

  constructor(inside: Point[] = []) {
    this.inside = inside;
    this.inDungeon = false;
  }

  randomSquare(): Point {
    return this.inside[Math.floor(Math.random() * this.inside.length)];
  }

  center(): Point {
    // find centroid
    let centroidX = 0;
    let centroidY = 0;
    for (const point of this.inside) {
      centroidX += point.x;
      centroidY += point.y;
    }
    centroidX /= this.inside.length;
    centroidY /= this.inside.length;

    // chebyshev distance
    const distance = (point: Point): number => Math.max(Math.abs(centroidX - point.x), Math.abs(centroidY - point.y));

    // find closest to centroid
    let closest = this.inside[0];
    let closestDistance = distance(closest);
    for (const point of this.inside) {
      const pointDistance = distance(point);
      if (pointDistance < closestDistance) {
        closest = point;
        closestDistance = pointDistance;
      }
    }
    return closest;
  }

  static compare(first: Room, second: Room): number {
    return first.inside.length - second.inside.length;
  }
}

export class FillRect {
  constructor(public readonly startX: number, public readonly startY: number,
              public readonly endX: number, public readonly endY: number,
              public readonly type: TunnelerCellType) {
  }
}