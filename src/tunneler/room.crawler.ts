import {TunnelerCellType, Point, Room, RoomSize} from "./model";
import {DungeonCrawler} from "./dungeon.crawler";
import {Crawler} from "./crawler";
import {RNG} from "../rng";

export class RoomCrawler extends Crawler {
  private readonly defaultWidth: number; // we try to build a room with defaultWidth to the left and right of the room crawler start position
  // so that the total width is 2 * defaultWidth + 1, however, this is not guaranteed
  private readonly size: RoomSize; // actual sizes of small, etc rooms are read from file - this size can be overridden by category

  constructor(rng: RNG, dungeonCrawler: DungeonCrawler, location: Point, direction: Point, age: number, maxAge: number,
              generation: number, defaultWidth: number, size: RoomSize) {
    super(rng, dungeonCrawler, location, direction, age, maxAge, generation);
    this.defaultWidth = defaultWidth;
    this.size = size;
  }

  stepAhead(): boolean {
    if (!this.dungeonCrawler.isMoreRoomsDungeon(this.size)) {
      return false;
    }

    if (this.generation !== this.dungeonCrawler.activeGeneration) {
      console.assert(this.generation > this.dungeonCrawler.activeGeneration);  // make sure all old ones are actually deleted
      return true;  // nothing's done with crawlers of different generations
    }

    // if age >= maxAge, the crawler returns false and will be deleted
    // if age < 0 the crawler returns true so as not to be deleted, but does not perform a step - it is dormant
    this.age++;
    if (this.age >= this.maxAge)
      return false;
    else if (this.age < 0)
      return true;

    const right = this.rightDirection();

    let defaultWidth = this.defaultWidth;
    const minSize = this.getMinRoomSize(this.size);
    const maxSize = this.getMaxRoomSize(this.size);
    let leftFree: number;
    let rightFree: number;
    let frontFree: number;

    do {
      [frontFree, leftFree, rightFree] = this.frontFree(this.location, this.direction, defaultWidth + 1, defaultWidth + 1);

      // we can build a room with dimensions frontFree - 2 = length; width = leftFree + rightFree - 1;
      // or inside that square - is this OK?
      let length = frontFree - 2;
      let width = leftFree + rightFree - 1;

      if (length < 2) {
        break;
      }

      if (width / length < this.config.roomAspectRatio) {
        // room aspect is not acceptable, length too large
        length = Math.floor(width / this.config.roomAspectRatio);
        if (width / length < this.config.roomAspectRatio) {
          console.error("length = " + length + ", width = " + width + ", but width/length should be >= " + this.config.roomAspectRatio)
        }
      }
      if (length / width < this.config.roomAspectRatio) {
        // width too large
        width = Math.floor(length / this.config.roomAspectRatio);
        if (length / width < this.config.roomAspectRatio) {
          console.error("length = " + length + ", width = " + width + ", but length/width should be >= " + this.config.roomAspectRatio);
        }
      }
      if (width / length < this.config.roomAspectRatio) {
        // this shouldn't happen
        console.error("The Emperor suggests you make your roomAspectRatio in the design file smaller...");
        return false; // we abort this room
      }
      // the aspect ratio is now acceptable, but is the room the right size?
      while (length * width > maxSize) {
        // too big, we reduce the larger dimension
        if (length > width)
          length--;
        else if (width > length)
          width--;
        else if ((this.rng.int % 100) < 50)
          length--;
        else
          width--;
      }
      // no need to retest aspectRatio because we have only been reducing the larger dimension
      console.assert(length * width <= maxSize);
      if (length * width >= minSize) {
        // we can build the room
        const room = new Room();
        if (leftFree <= rightFree) {
          // we be mindful of the left edge of the open area
          if ((2 * leftFree - 1) > width) {
            // we can build the room on center
            this.attachRoom(room, right, length, (width >> 1) - width + 1, width >> 2);
          } else {
            // attach room to the left side
            this.attachRoom(room, right, length, -leftFree + 1, -leftFree + width);
          }
          if (this.direction.x === 0) {
            this.dungeonCrawler.setMap(this.location.plus(this.direction), TunnelerCellType.V_DOOR);
          } else {
            console.assert(this.direction.y === 0);
            this.dungeonCrawler.setMap(this.location.plus(this.direction), TunnelerCellType.H_DOOR);
          }
        } else {
          // we be mindful of the right edge of the open area
          if ((2 * rightFree - 1) > width) {
            // we can build the room on center
            this.attachRoom(room, right, length, -(width >> 1), -(width >> 1) + width - 1);
          } else {
            // attach room to the right side
            this.attachRoom(room, right, length, rightFree - width, rightFree - 1);
          }
          if (this.direction.x === 0) {
            this.dungeonCrawler.setMap(this.location.plus(this.direction), TunnelerCellType.V_DOOR);
          } else {
            console.assert(this.direction.y === 0);
            this.dungeonCrawler.setMap(this.location.plus(this.direction), TunnelerCellType.H_DOOR);
          }
        }
        this.dungeonCrawler.builtRoomDungeon(this.size); // for counting
        room.inDungeon = true;  // this room's in the dungeon part
        this.dungeonCrawler.addRoom(room);
        return false;
      } else {
        defaultWidth++; // repeat with wider sweep, shorter length
      }
    } while ((frontFree - 2) >= ((2 * defaultWidth + 1) * this.config.roomAspectRatio));

    // we look direction with a wider and wider sweep until frontFree becomes too short to get an acceptable room aspect ratio
    // when that happens, we know we have not enough room to build the Room we want, so we bail out
    // it has built its room or failed to do so and must be deleted now
    return false;
  }

  private attachRoom(room: Room, right: Point, length: number, from: number, to: number): void {
    for (let direction = 1; direction <= length; direction++) {
      for (let sideDistance = from; sideDistance <= to; sideDistance++) {
        const point = this.location.plus(this.direction.multiply(direction + 1)).plus(right.multiply(sideDistance));
        this.dungeonCrawler.setMap(point, TunnelerCellType.INSIDE_ROOM_OPEN);
        room.inside.push(point);
      }
    }
  }

  private getMinRoomSize(size: RoomSize): number {
    switch (size) {
      case RoomSize.SMALL:
        return this.config.minRoomSize;
      case RoomSize.MEDIUM:
        return this.config.mediumRoomSize;
      case RoomSize.LARGE:
        return this.config.largeRoomSize;
    }
  }

  private getMaxRoomSize(size: RoomSize): number {
    switch (size) {
      case RoomSize.SMALL:
        return (this.config.mediumRoomSize - 1);
      case RoomSize.MEDIUM:
        return (this.config.largeRoomSize - 1);
      case RoomSize.LARGE:
        return (this.config.maxRoomSize - 1);
    }
  }
}

