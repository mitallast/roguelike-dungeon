import {TunnelerCellType, IPoint, Point} from "./model";
import {DungeonCrawler} from "./dungeon.crawler";
import {Config} from "./config";
import {RNG} from "../rng";

export abstract class Crawler {
  protected readonly rng: RNG;
  protected readonly dungeonCrawler: DungeonCrawler;
  protected readonly config: Config;
  protected location: Point;
  protected direction: Point; // the direction the crawler is facing
  age: number;
  readonly maxAge: number;
  readonly generation: number;

  protected constructor(rng: RNG,
                        dungeonCrawler: DungeonCrawler,
                        location: Point,
                        direction: Point,
                        age: number,
                        maxAge: number,
                        generation: number) {
    this.rng = rng;
    this.dungeonCrawler = dungeonCrawler;
    this.config = dungeonCrawler.config;
    this.location = location;
    this.direction = direction;
    this.age = age;
    this.maxAge = maxAge;
    this.generation = generation;

    console.assert(this.valid(location));
    console.assert(this.validDirection(direction));
  }

  abstract stepAhead(): boolean;

  protected rightDirection(): Point {
    // assign the "right" direction based on direction
    if (this.direction.x === 0) {
      return new Point(this.direction.y, 0);
    } else if (this.direction.y === 0) {
      return new Point(0, -this.direction.x);
    } else {
      throw "illegal direction";
    }
  }

  protected valid(point: IPoint): boolean {
    return point.x >= 0 && point.y >= 0 && point.x < this.config.width && point.y < this.config.height;
  }

  protected validDirection(direction: IPoint): boolean {
    return (direction.x === 0 && (direction.y === -1 || direction.y === 1)) || (direction.y === 0 && (direction.x === -1 || direction.x === 1))
  }

  protected frontFree(position: Point, heading: Point, leftFree: number, rightFree: number) {
    // returns the number of rows free in front of position, looking towards heading
    // must hold, make sure no smaller parameters are ever passed

    console.assert((leftFree >= 1) && (rightFree >= 1));
    console.assert(this.valid(position));
    console.assert(heading.x === 0 && ((heading.y === 1) || (heading.y === -1)) || heading.y === 0 && ((heading.x === 1) || (heading.x === -1)));

    let right: Point;
    if (heading.x === 0) {
      right = new Point(heading.y, 0);
    } else if (heading.y === 0) {
      right = new Point(0, -heading.x);
    } else {
      throw "invalid heading";
    }
    const frontFree = this.findFrontFree(leftFree, rightFree, position, right, heading);
    console.assert(frontFree >= 0);

    if (frontFree > 0) {
      leftFree = this.findLeftFree(leftFree, frontFree, position, right, heading);
      rightFree = this.findRightFree(rightFree, frontFree, position, right, heading);
    }

    return [frontFree, leftFree, rightFree];
  }

  protected findFrontFree(leftFree: number, rightFree: number, position: Point, right: Point, heading: Point) {
    let frontFree = 0;
    while (true) {
      frontFree++;
      for (let i = -leftFree; i <= rightFree; i++) {
        const cell = position.plus(right.multiply(i)).plus(heading.multiply(frontFree));
        if (!this.valid(cell)) {
          return Math.max(0, frontFree - 1);
        }
        if (this.freePredicate(this.dungeonCrawler.getMap(cell))) {
          return Math.max(0, frontFree - 1);
        }
      }
    }
  }

  protected findLeftFree(leftFree: number, frontFree: number, position: Point, right: Point, heading: Point) {
    while (true) {
      leftFree++;
      for (let i = 1; i <= frontFree; i++) {
        const cell = position.minus(right.multiply(leftFree)).plus(heading.multiply(i));
        if (!this.valid(cell)) {
          return leftFree - 1;
        }
        if (this.freePredicate(this.dungeonCrawler.getMap(cell))) {
          return leftFree - 1;
        }
      }
    }
  }

  protected findRightFree(rightFree: number, frontFree: number, position: Point, right: Point, heading: Point) {
    while (true) {
      rightFree++;
      for (let i = 1; i <= frontFree; i++) {
        const cell = position.plus(right.multiply(rightFree)).plus(heading.multiply(i));
        if (!this.valid(cell)) {
          return rightFree - 1;
        }
        if (this.freePredicate(this.dungeonCrawler.getMap(cell))) {
          return rightFree - 1;
        }
      }
    }
  }

  protected freePredicate(type: TunnelerCellType): boolean {
    return (type !== TunnelerCellType.CLOSED) && (type !== TunnelerCellType.NON_JOIN_CLOSED);
  }

  protected contains<T>(value: T, ...options: T[]): boolean {
    for (const option of options) {
      if (value === option) {
        return true;
      }
    }
    return false;
  }
}