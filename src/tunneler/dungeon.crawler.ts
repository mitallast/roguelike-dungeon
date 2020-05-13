import {
  Point,
  TunnelerCellType,
  Direction,
  RoomSize,
  FillRect,
  Room,
  ImmutablePoint,
  DungeonCrawlerConfig
} from "./model";
import {WallCrawler} from "./wall.crawler";
import {TunnelCrawler} from "./tunnel.crawler";
import {RoomCrawler} from "./room.crawler";
import {Crawler} from "./crawler";
import {RNG} from "../rng";

export class DungeonCrawler {
  readonly rng: RNG;
  readonly config: DungeonCrawlerConfig;

  private readonly _map: TunnelerCellType[];
  private readonly _rooms: Room[] = [];
  private readonly _mapFlagsDirections: boolean[] = [];
  private readonly _crawlers: (Crawler | null)[] = [];

  activeGeneration: number = 0;
  private _currSmallRoomsLabyrinth: number = 0;
  private _currMediumRoomsLabyrinth: number = 0;
  private _currLargeRoomsLabyrinth: number = 0;
  private _currSmallRoomsDungeon: number = 0;
  private _currMediumRoomsDungeon: number = 0;
  private _currLargeRoomsDungeon: number = 0;

  private isOpen(pos: ImmutablePoint): boolean {
    //returns false inside-room/tunnel-open squares, for use in CreateRoom
    const type: TunnelerCellType = this.getMap(pos);
    return (type === TunnelerCellType.OPEN) ||
      (type === TunnelerCellType.NON_JOIN_OPEN) ||
      (type === TunnelerCellType.INSIDE_TUNNEL_OPEN) ||
      (type === TunnelerCellType.INSIDE_ANTEROOM_OPEN) ||
      (type === TunnelerCellType.GUARANTEED_OPEN) ||
      (type === TunnelerCellType.NON_JOIN_GUARANTEED_OPEN);
  }

  private static isActive(pos: ImmutablePoint, Active: ImmutablePoint[]): boolean {
    for (const i of Active) {
      if ((pos.x === i.x) && (pos.y === i.y))
        return true;
    }
    return false;
  }

  setMap(point: ImmutablePoint, data: TunnelerCellType): void {
    const x = point.x;
    const y = point.y;
    console.assert(data !== undefined);
    console.assert((x < this.config.width) && (y < this.config.height) && (x >= 0) && (y >= 0));
    this._map[x * this.config.height + y] = data;
  }

  getMap(point: ImmutablePoint): TunnelerCellType {
    const x = point.x;
    const y = point.y;
    console.assert((x < this.config.width) && (y < this.config.height) && (x >= 0) && (y >= 0));
    return this._map[x * this.config.height + y];
  }

  isMapOpen(point: ImmutablePoint): boolean {
    switch (this.getMap(point)) {
      case TunnelerCellType.OPEN:
      case TunnelerCellType.GUARANTEED_OPEN:
      case TunnelerCellType.NON_JOIN_OPEN:
      case TunnelerCellType.NON_JOIN_GUARANTEED_OPEN:
      case TunnelerCellType.INSIDE_ROOM_OPEN:
      case TunnelerCellType.INSIDE_TUNNEL_OPEN:
      case TunnelerCellType.INSIDE_ANTEROOM_OPEN:
      case TunnelerCellType.H_DOOR:
      case TunnelerCellType.V_DOOR:
        return true;
      default:
        return false;
    }
  }

  isMoreRoomsLabyrinth(size: RoomSize | null = null): boolean {
    if (size !== null) {
      switch (size) {
        case RoomSize.SMALL:
          return (this.config.numSmallRoomsInLabyrinth > this._currSmallRoomsLabyrinth);
        case RoomSize.MEDIUM:
          return (this.config.numMediumRoomsInLabyrinth > this._currMediumRoomsLabyrinth);
        case RoomSize.LARGE:
          return (this.config.numLargeRoomsInLabyrinth > this._currLargeRoomsLabyrinth);
      }
    } else {
      return (this.isMoreRoomsLabyrinth(RoomSize.SMALL) || this.isMoreRoomsLabyrinth(RoomSize.MEDIUM) || this.isMoreRoomsLabyrinth(RoomSize.LARGE));
    }
  }

  isMoreRoomsDungeon(size: RoomSize | null): boolean {
    if (size !== null) {
      switch (size) {
        case RoomSize.SMALL:
          return (this.config.numSmallRoomsInDungeon > this._currSmallRoomsDungeon);
        case RoomSize.MEDIUM:
          return (this.config.numMediumRoomsInDungeon > this._currMediumRoomsDungeon);
        case RoomSize.LARGE:
          return (this.config.numLargeRoomsInDungeon > this._currLargeRoomsDungeon);
      }
    } else {
      return (this.isMoreRoomsDungeon(RoomSize.SMALL) || this.isMoreRoomsDungeon(RoomSize.MEDIUM) || this.isMoreRoomsDungeon(RoomSize.LARGE));
    }
  }

  builtRoomDungeon(size: RoomSize): void {
    if (RoomSize.SMALL === size)
      this._currSmallRoomsDungeon++;
    else if (RoomSize.MEDIUM === size)
      this._currMediumRoomsDungeon++;
    else if (RoomSize.LARGE === size)
      this._currLargeRoomsDungeon++;
  }

  getStepLength(generation: number): number {
    if (generation >= this.config.stepLengths.length)
      return this.config.stepLengths[this.config.stepLengths.length - 1];
    else return this.config.stepLengths[generation];
  }

  getCorridorWidth(generation: number): number {
    if (generation >= this.config.corridorWidths.length)
      return this.config.corridorWidths[this.config.corridorWidths.length - 1];
    else return this.config.corridorWidths[generation];
  }

  getMaxAgeCrawlers(generation: number): number {
    if (generation >= this.config.maxAgesCrawlers.length)
      return this.config.maxAgesCrawlers[this.config.maxAgesCrawlers.length - 1];
    else return this.config.maxAgesCrawlers[generation];
  }

  addRoom(r: Room): void {
    this._rooms.push(r);
  }

  get rooms(): Room[] {
    return [...this._rooms];
  }

  private isChecked(pos: Point): boolean {
    console.assert((pos.x < this.config.width) && (pos.y < this.config.height) && (pos.x >= 0) && (pos.y >= 0));
    return this._mapFlagsDirections[pos.x * this.config.height + pos.y];
  }

  private static isCheckedList(pos: Point, checked: Point[]): boolean {
    for (let i: number = 0; i < checked.length; i++) {
      if ((pos.x === checked[i].x) && (pos.y === checked[i].y))
        return true;
    }
    return false;
  }

  private setChecked(pos: Point): void {
    console.assert((pos.x < this.config.width) && (pos.y < this.config.height) && (pos.x >= 0) && (pos.y >= 0));
    this._mapFlagsDirections[pos.x * this.config.height + pos.y] = true;
  }

  constructor(config: DungeonCrawlerConfig, rng: RNG) {
    this.rng = rng;
    this.config = config;

    console.assert(config.childDelayProbabilityForGenerationCrawlers.length === 11);
    console.assert(config.childDelayProbabilityForGenerationRoomCrawlers.length === 11);
    console.assert(config.roomAspectRatio >= 0 && config.roomAspectRatio <= 1, "roomAspectRatio must be a double between 0 and 1");
    console.assert(config.genSpeedUpOnAnteroom >= 1, "Please use genSpeedUpOnAnteroom >= 1; parameter reset to 1");
    console.assert(!config.crawlersInAnterooms || (config.crawlersInAnterooms && config.crawlersInTunnels), "when you allow Crawlers in Anterooms, you must also allow them in Tunnels");

    this._map = [];
    for (let i = 0; i < this.config.width * this.config.height; i++) {
      this._map[i] = this.config.background;
      this._mapFlagsDirections[i] = false;
    }

    for (let i = 0; i < 4; i++) {
      this._crawlers[i] = null;
    }

    this.setRect(0, 0, this.config.width - 1, 0, TunnelerCellType.GUARANTEED_CLOSED);
    this.setRect(0, 0, 0, this.config.height - 1, TunnelerCellType.GUARANTEED_CLOSED);
    this.setRect(this.config.width - 1, 0, this.config.width - 1, this.config.height - 1, TunnelerCellType.GUARANTEED_CLOSED);
    this.setRect(0, this.config.height - 1, this.config.width - 1, this.config.height - 1, TunnelerCellType.GUARANTEED_CLOSED);

    for (const des of this.config.design) {
      this.setRectFill(des);
    }

    for (const entry of this.config.openings) {
      switch (entry) {
        case Direction.NORTH:
          this.setRect(0, Math.floor(this.config.height / 2) - 1, 2, Math.floor(this.config.height / 2) + 1, TunnelerCellType.GUARANTEED_OPEN);
          break;
        case Direction.WEST:
          this.setRect(Math.floor(this.config.width / 2) - 1, 0, Math.floor(this.config.width / 2) + 1, 2, TunnelerCellType.GUARANTEED_OPEN);
          break;
        case Direction.EAST:
          this.setRect(Math.floor(this.config.width / 2) - 1, this.config.height - 3, Math.floor(this.config.width / 2) + 1, this.config.height - 1, TunnelerCellType.GUARANTEED_OPEN);
          break;
        case Direction.SOUTH:
          this.setRect(this.config.width - 3, Math.floor(this.config.height / 2) - 1, this.config.width - 1, Math.floor(this.config.height / 2) + 1, TunnelerCellType.GUARANTEED_OPEN);
          break;
        case Direction.NORTH_WEST:
          this.setRect(0, 0, 2, 2, TunnelerCellType.GUARANTEED_OPEN);
          break;
        case Direction.NORTH_EAST:
          this.setRect(0, this.config.height - 3, 2, this.config.height - 1, TunnelerCellType.GUARANTEED_OPEN);
          break;
        case Direction.SOUTH_WEST:
          this.setRect(this.config.width - 3, 0, this.config.width - 1, 2, TunnelerCellType.GUARANTEED_OPEN);
          break;
        case Direction.SOUTH_EAST:
          this.setRect(this.config.width - 3, this.config.height - 3, this.config.width - 1, this.config.height - 1, TunnelerCellType.GUARANTEED_OPEN);
          break;
        default:
          console.assert(false);
          break;
      }
    }

    const spawnRandomWallCrawler = (location: Point, direction: Point, generation: number): void => {
      this.createWallCrawler(location, direction, 0,
        this.getMaxAgeCrawlers(generation), generation, direction,
        this.getStepLength(generation), 1,
        this.getCorridorWidth(generation),
        this.mutate2(config.randCrawler.straightSingleSpawnProbability),
        this.mutate2(config.randCrawler.straightDoubleSpawnProbability),
        this.mutate2(config.randCrawler.turnSingleSpawnProbability),
        this.mutate2(config.randCrawler.turnDoubleSpawnProbability),
        this.mutate2(config.randCrawler.changeDirectionProbability)
      );
    };

    for (let generation = 0; generation < config.randCrawler.perGeneration.length; generation++) {
      const crawlersPer1000Squares: number = config.randCrawler.perGeneration[generation];
      if (crawlersPer1000Squares > 0) { // otherwise nothing to do
        let crawlersPerTopBottomWall: number = Math.floor((this.config.height * crawlersPer1000Squares) / 1000);
        if (crawlersPerTopBottomWall === 0) {
          // there's less than one crawler on the wall, use probabilities
          if (this.rng.range(0, 1000) < (this.config.height * crawlersPer1000Squares))
            crawlersPerTopBottomWall = 1;
        }
        let yIndex: number = 0;
        for (let ind: number = 0; ind < crawlersPerTopBottomWall; ind++) {
          // create crawlers at the top and bottom walls, heading inwards
          yIndex = 2 + this.rng.range(0, this.config.height - 4);
          spawnRandomWallCrawler(new Point(0, yIndex), Point.SOUTH, generation);
          yIndex = 2 + this.rng.range(0, this.config.height - 4);
          spawnRandomWallCrawler(new Point(this.config.width - 1, yIndex), Point.NORTH, generation);
        }

        //now do the east and West walls
        let crawlersPerLeftRightWall: number = Math.floor((this.config.width * crawlersPer1000Squares) / 1000);
        if (crawlersPerLeftRightWall === 0) {//there's less than one Crawler on the wall, use probabilities
          if (this.rng.range(0, 1000) < (this.config.width * crawlersPer1000Squares))
            crawlersPerLeftRightWall = 1;
        }
        let xIndex: number = 0;
        for (let i: number = 0; i < crawlersPerLeftRightWall; i++) {
          // create crawlers at the left and right walls, heading inwards
          xIndex = 2 + this.rng.range(0, this.config.width - 4);
          spawnRandomWallCrawler(new Point(xIndex, 0), Point.EAST, generation);
          xIndex = 2 + this.rng.range(0, this.config.width - 4);
          spawnRandomWallCrawler(new Point(xIndex, this.config.height - 1), Point.EAST, generation);
        }
      }
    }

    for (const cd of config.crawlers) {
      this.createWallCrawler(cd.location, cd.direction, -cd.age, cd.maxAge, cd.generation, cd.intendedDirection, cd.stepLength,
        cd.opening, cd.corridorWidth, cd.straightSingleSpawnProbability, cd.straightDoubleSpawnProbability,
        cd.turnSingleSpawnProbability, cd.turnDoubleSpawnProbability, cd.changeDirectionProbability);
    }

    for (const [first, second] of config.crawlerPairs) {
      let firstIsOpen: boolean = true;
      if (this.rng.boolean())
        firstIsOpen = false;
      this.createWallCrawler(first.location, first.direction, -first.age, first.maxAge, first.generation, first.intendedDirection, first.stepLength, (firstIsOpen ? 1 : 0), first.corridorWidth, first.straightSingleSpawnProbability, first.straightDoubleSpawnProbability,
        first.turnSingleSpawnProbability, first.turnDoubleSpawnProbability, first.changeDirectionProbability);
      //also close the square where the Crawlers start:
      this.setMap(first.location, TunnelerCellType.CLOSED);

      //now the second one:
      this.createWallCrawler(second.location, second.direction, -second.age, second.maxAge, second.generation, second.intendedDirection, second.stepLength, (firstIsOpen ? 1 : 0), second.corridorWidth, second.straightSingleSpawnProbability, second.straightDoubleSpawnProbability,
        second.turnSingleSpawnProbability, second.turnDoubleSpawnProbability, second.changeDirectionProbability);
      //also close the square where the Crawlers start:
      this.setMap(second.location, TunnelerCellType.CLOSED);   //could be two different starting locations, so be sure
    }

    for (const td of config.tunnelCrawlers) {
      this.createTunnelCrawler(td.location, td.direction, -td.age, td.maxAge, td.generation, td.intendedDirection,
        td.stepLength, td.tunnelWidth, td.straightDoubleSpawnProbability, td.turnDoubleSpawnProbability, td.changeDirectionProbability,
        td.makeRoomsRightProbability, td.makeRoomsLeftProbability, td.joinPreference);
    }
  }

  private setRectFill(rect: FillRect): void {
    this.setRect(rect.startX, rect.startY, rect.endX, rect.endY, rect.type);
  }

  private setRect(startX: number, startY: number, endX: number, endY: number, data: TunnelerCellType): void {
    if ((endX < startX) || (endY < startY)) {
      console.error(`Refuse to set incorrectly specified rectangle; sX = ${startX} sY=${startY} eX=${endX} endY=${endY}`);
      return;
    } else {
      for (let x = startX; x <= endX; x++)
        for (let y = startY; y <= endY; y++)
          this.setMap({x: x, y: y}, data);
    }
  }

  createWallCrawler(location: ImmutablePoint, direction: ImmutablePoint, age: number, maxAge: number, generation: number,
                    intendedDirection: ImmutablePoint, stepLength: number, opening: number,
                    corridorWidth: number, straightSingleSpawnProbability: number, straightDoubleSpawnProbability: number,
                    turnSingleSpawnProbability: number, turnDoubleSpawnProbability: number, changeDirectionProbability: number): void {
    const crawler = new WallCrawler(this.rng, this, Point.from(location), Point.from(direction), age, maxAge, generation,
      Point.from(intendedDirection), stepLength, opening,
      corridorWidth, straightSingleSpawnProbability, straightDoubleSpawnProbability,
      turnSingleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability);

    for (let i = 0; i < this._crawlers.length; i++) {
      if (this._crawlers[i] === null) {
        this._crawlers[i] = crawler;
        return;
      }
    }

    this._crawlers.push(crawler);
  }

  createTunnelCrawler(location: ImmutablePoint, direction: ImmutablePoint, age: number, maxAge: number, generation: number,
                      intendedDirection: ImmutablePoint, stepLength: number, tunnelWidth: number, straightDoubleSpawnProbability: number, turnDoubleSpawnProbability: number,
                      changeDirectionProbability: number, makeRoomsRightProbability: number, makeRoomsLeftProbability: number, joinPreference: number): void {
    const crawler = new TunnelCrawler(this.rng, this, Point.from(location), Point.from(direction), age, maxAge, generation,
      Point.from(intendedDirection), stepLength, tunnelWidth, straightDoubleSpawnProbability, turnDoubleSpawnProbability,
      changeDirectionProbability, makeRoomsRightProbability, makeRoomsLeftProbability, joinPreference);

    for (let i = 0; i < this._crawlers.length; i++) {
      if (this._crawlers[i] === null) {
        this._crawlers[i] = crawler;
        return;
      }
    }

    this._crawlers.push(crawler);
  }

  createRoomCrawler(location: ImmutablePoint, direction: ImmutablePoint, age: number, maxAge: number, generation: number, defaultWidth: number, size: RoomSize): void {
    const crawler = new RoomCrawler(this.rng, this, Point.from(location), Point.from(direction), age, maxAge, generation, defaultWidth, size);

    for (let i = 0; i < this._crawlers.length; i++) {
      if (this._crawlers[i] === null) {
        this._crawlers[i] = crawler;
        return;
      }
    }

    this._crawlers.push(crawler);
  }

  mutate(input: number): number {
    const output: number = input - this.config.mutator + this.rng.range(0, 2 * this.config.mutator + 1);
    if (output < 0)
      return 0;
    else
      return output;
  }

  private mutate2(input: number): number {
    if (input <= 50) {
      if (input < 0)
        return 0;
      else
        return this.rng.range(0, 2 * input + 1);
    } else {
      if (input > 100)
        return 100;
      else
        return 2 * input - 100 + this.rng.range(0, 200 - 2 * input + 1);
    }
  }

  private createSeedCrawlersInTunnels(): void {
    // this method creates "number=seedCrawlersInTunnels" Crawlers in the middle of tunnels
    let numberFound: number = 0;
    let tries: number = 0;
    // need a Crawler to be able to look around on the map, the DungeonCrawler itself cannot do this
    new WallCrawler(this.rng, this, new Point(2, 2), Point.SOUTH, 0, 1, 0, Point.SOUTH,
      1, 0, 1, 0, 0, 0, 0, 0);

    while ((numberFound < this.config.seedCrawlersInTunnels) && (tries < this.config.width * this.config.height)) {
      tries++;   //no I will NOT put this in the conditional above!
      let startX: number = 1 + this.rng.range(0, this.config.width - 4);     // [1 , ... , dimX-2]
      let startY: number = 1 + this.rng.range(0, this.config.height - 4);    // [1 , ... , dimY-2]
      let test = new Point(startX, startY);

      //now make a starting direction
      if (this.rng.range(0, 100) < 50)
        startX = 0;
      else
        startY = 0;
      if (startX === 0) {
        if (this.rng.range(0, 100) < 50)
          startY = -1;
        else
          startY = 1;
      } else {
        console.assert(startY === 0);
        if (this.rng.range(0, 100) < 50)
          startX = -1;
        else
          startX = 1;
      }
      const direction = new Point(startX, startY);
      let orthogonal: Point;
      if (direction.x === 0) {
        orthogonal = new Point(direction.y, 0);
      } else if (direction.y === 0) {
        orthogonal = new Point(0, -direction.x);
      } else {
        throw "illegal direction";
      }

      // now search through the dungeon for a tunnel with width at least 3 (tunnelWidth=1) so we can run a crawler down the middle
      // start at start and go towards direction until find a suitable place or reach the end of the map
      let notFound: boolean = true;
      while (notFound) {
        test = test.plus(direction);
        if ((test.x < 2) || (test.y < 2) || (test.x > this.config.width - 3) || (test.y > this.config.height - 3)) {
          break; // end the loop, running off the map
        }

        if (this.getMap(test) !== TunnelerCellType.INSIDE_TUNNEL_OPEN)
          continue;   //not in a tunnel
        //now test the 8 adjacent points, which must all be inside a tunnel for this to work
        if ((this.getMap(test.plus(direction)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) ||
          (this.getMap(test.plus(orthogonal)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(orthogonal)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) ||
          (this.getMap(test.plus(direction).plus(orthogonal)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction).plus(orthogonal)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) ||
          (this.getMap(test.plus(direction).minus(orthogonal)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction).minus(orthogonal)) !== TunnelerCellType.INSIDE_TUNNEL_OPEN))
          continue;   //no space to run Crawler

        this.setMap(test, TunnelerCellType.CLOSED);  //closed square for the Crawler to sit on
        //create 4 Crawlers looking in all 4 directions
        this.createWallCrawler(test, direction, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength, 1,
          1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability,
          this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
        this.createWallCrawler(test, orthogonal, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength, 1,
          1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability,
          this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
        this.createWallCrawler(test, orthogonal.negative, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction, this.config.tunnelCrawlerStats.stepLength,
          1, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability, this.config.tunnelCrawlerStats.turnSingleSpawnProbability,
          this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
        // if we want a closed crawler in here, we let it look back to where it camne from, because it can close there fast and reliably
        if (this.rng.range(0, 100) < this.config.tunnelCrawlerClosedProbability)
          this.createWallCrawler(test, direction.negative, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction,
            this.config.tunnelCrawlerStats.stepLength, 0, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability,
            this.config.tunnelCrawlerStats.turnSingleSpawnProbability, this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);
        else
          this.createWallCrawler(test, direction.negative, 0, this.config.tunnelCrawlerStats.maxAge, this.activeGeneration + 1, direction,
            this.config.tunnelCrawlerStats.stepLength, 1, 1, this.config.tunnelCrawlerStats.straightSingleSpawnProbability, this.config.tunnelCrawlerStats.straightDoubleSpawnProbability,
            this.config.tunnelCrawlerStats.turnSingleSpawnProbability, this.config.tunnelCrawlerStats.turnDoubleSpawnProbability, this.config.tunnelCrawlerStats.changeDirectionProbability);

        notFound = false;
        numberFound++;

      }//while loop notFound

    }//while loop memberFound, tries
  }

  private makeIteration(): boolean {
    for (let i: number = 0; i < this._crawlers.length; i++) {
      if (null !== this._crawlers[i]) {
        if (!this._crawlers[i]!.stepAhead()) {  //if the crawler cannot do anything any more
          this._crawlers[i] = null;
        }
      }
    }

    return false;
  }

  private advanceGeneration(): boolean {
    let isCrawlerExists: boolean = false;
    let highestNegativeAge: number = 0;  //used to advance the ages of all crawler of this generation if they are all dormant
    for (let i: number = 0; i < this._crawlers.length; i++) {
      if (null !== this._crawlers[i]) {
        isCrawlerExists = true;
        if (this._crawlers[i]!.generation === this.activeGeneration) {  //if the crawler is of the current generation
          const a: number = this._crawlers[i]!.age;
          if (a >= 0)
            return true;  //this crawler is still active, we cannot advance generation
          else if ((highestNegativeAge === 0) || (a > highestNegativeAge))
            highestNegativeAge = a;
        }
      }
    }
    //if we get here, there are either no active crawler left in the current activeGeneration
    //or they are all dormant
    if (highestNegativeAge === 0) {
      //no active crawler left
      this.activeGeneration++;
      return isCrawlerExists;
    } else {
      console.assert(highestNegativeAge < 0);
      for (let i: number = 0; i < this._crawlers.length; i++) {
        if (null !== this._crawlers[i]) {
          if (this._crawlers[i]!.generation === this.activeGeneration)   //if the crawler is of the current generation
            this._crawlers[i]!.age -= highestNegativeAge;
        }
      }
      return isCrawlerExists;
    }
  }

  private createRoom(rect: FillRect): boolean {//we randomly pick a spot in the dungeon, and check whether it can be made into a room by placing a single door tile
    if ((this.config.width < 10) || (this.config.height < 10))
      return false;   //avoid triggering console.assertions in ridiculously small dungeons

    if ((rect.endX - rect.startX) <= 5)
      return false;
    if ((rect.endY - rect.startY) <= 5)
      return false;   //too small to mess with, see next lines

    const startX: number = rect.startX + 1 + this.rng.range(0, rect.endX - rect.startX - 3);     // [startX + 1 , ... , endX - 1]
    const startY: number = rect.startY + 1 + this.rng.range(0, rect.endY - rect.startY - 3);     // [startY + 1 ,     , endY - 1]
    const start = new Point(startX, startY);

    if (!this.isOpen(start))
      return false;   //bad choice of start position
    if (this.isChecked(start))
      return false;   //this position has been checked before and found wanting (it might still yield a room, though)

    let maxRS: number = this.config.maxRoomSize;
    if (!this.isMoreRoomsLabyrinth(RoomSize.LARGE))
      maxRS = this.config.largeRoomSize;
    if (!this.isMoreRoomsLabyrinth(RoomSize.LARGE) && !this.isMoreRoomsLabyrinth(RoomSize.MEDIUM))
      maxRS = this.config.mediumRoomSize;
    if (!this.isMoreRoomsLabyrinth())
      return false;

    let stillFindingMultiples: boolean = true;
    const RoomSquaresChecked: Point[] = [];
    const RoomSquaresActive: Point[] = [];
    const ActiveFoundThisTurn: Point[] = [];

    RoomSquaresActive.push(start);

    let numberFound: number;
    while (stillFindingMultiples) {//we expand our chacked area, but not into areas where we find just one open square - these are door candidates
      stillFindingMultiples = false;
      for (let actIt = 0; actIt < RoomSquaresActive.length; /*increment inside loop*/) {
        const curr = RoomSquaresActive[actIt];
        numberFound = 0;
        //check the entire neighborhood of our square for open squares:
        if (this.isOpen(curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.WEST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
          numberFound++;

        if (numberFound > 2) {
          stillFindingMultiples = true;
          //process this square
          if (this.isOpen(curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH));
          if (this.isOpen(curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH));
          if (this.isOpen(curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.EAST));
          if (this.isOpen(curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.WEST));
          if (this.isOpen(curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH_EAST));
          if (this.isOpen(curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH_WEST));
          if (this.isOpen(curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH_EAST));
          if (this.isOpen(curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH_WEST));

          if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(curr);
            this.setChecked(curr);
          }

          //erase Curr from the active list and increment iterator
          RoomSquaresActive.splice(actIt, 1);
          actIt++;
        } else if (numberFound === 2) {//special treatment to prevent a common occurrence of going through perfectly good door locations in two steps,
          // each time seeing two open squares
          let found: number = 0;
          if (this.isOpen(curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH));
            found++;
          }
          if (this.isOpen(curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH));
            found++;
          }
          if (this.isOpen(curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.EAST), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(curr.plus(Point.EAST));
            found++;
          }
          if (this.isOpen(curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.WEST), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(curr.plus(Point.WEST));
            found++;
          }
          if (found === 1) {//good chance we catch the door if we bail out now
            actIt++;
            continue;
          }
          if (this.isOpen(curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH_EAST));
          if (this.isOpen(curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH_WEST));
          if (this.isOpen(curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH_EAST));
          if (this.isOpen(curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH_WEST));

          if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(curr);
            this.setChecked(curr);
          }

          RoomSquaresActive.splice(actIt, 1); //erase Curr from the active list and increment iterator
          actIt++;
        } else if (numberFound ==
          1) {//this one is a door candidate and so is held back and processed again when we don't find multiples any more
          actIt++;
        } else {
          console.assert(numberFound === 0);    //overly cautious, right?
          if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(curr);
            this.setChecked(curr);
          }

          RoomSquaresActive.splice(actIt, 1);   //erase Curr from the active list and increment iterator
          actIt++;
        }

        if (RoomSquaresChecked.length > maxRS)
          return false;
      }//end for loop

      //merge newly found actives into list
      for (const curr of ActiveFoundThisTurn) {
        if ((this.getMap(curr) === TunnelerCellType.GUARANTEED_OPEN) || (this.getMap(curr) === TunnelerCellType.NON_JOIN_GUARANTEED_OPEN))
          return false;   //to prevent us from building rooms that enclose exits... exits always have G_OPEN squares!!!
        if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked) && !DungeonCrawler.isActive(curr, RoomSquaresActive))
          RoomSquaresActive.push(curr);
      }
      ActiveFoundThisTurn.splice(0, ActiveFoundThisTurn.length);
    }//end stillFinding Multiples

    //now our tactic changes, and we pursue each of our active suares until it either runs out (into a dead end) or find multiples again
    //if we end up with only ONE active square that finds multiples, we build a door and make a room
    let proceeding: boolean = true;
    let squaresFindingMultiples: number = 0;
    let curr: Point = Point.ZERO;
    while (proceeding)  //through 1 square wide tunnels
    {
      squaresFindingMultiples = 0;
      proceeding = false;
      for (let actIt = 0; actIt < RoomSquaresActive.length; /*increment inside loop*/) {
        curr = RoomSquaresActive[actIt];
        numberFound = 0;
        //check the entire neighborhood of our square for open squares:
        if (this.isOpen(curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.WEST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
          numberFound++;

        if (numberFound > 1) {
          squaresFindingMultiples++;
          actIt++;   //we leave Curr for later processing, IF it's the only one
        } else if (numberFound === 1) {//apparently we're in a corridor one square wide
          proceeding = true;
          if (this.isOpen(curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH));
          if (this.isOpen(curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH));
          if (this.isOpen(curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.EAST));
          if (this.isOpen(curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.WEST));
          if (this.isOpen(curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH_EAST));
          if (this.isOpen(curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.NORTH_WEST));
          if (this.isOpen(curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH_EAST));
          if (this.isOpen(curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(curr.plus(Point.SOUTH_WEST));

          if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(curr);
            this.setChecked(curr);
          }

          RoomSquaresActive.splice(actIt, 1);   //erase Curr from the active list and increment iterator
          // actIt++;
        } else {
          console.assert(numberFound === 0);    //overly cautious, for sure

          if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(curr);
            this.setChecked(curr);
          }

          RoomSquaresActive.splice(actIt, 1);   //erase Curr from the active list and increment iterator
          // actIt++;
        }
      }
      //merge newly found actives into list
      for (curr of ActiveFoundThisTurn) {
        if ((this.getMap(curr) === TunnelerCellType.GUARANTEED_OPEN) || (this.getMap(curr) === TunnelerCellType.NON_JOIN_GUARANTEED_OPEN))
          return false;   //to prevent us from building rooms that enclose exits... exits always have G_OPEN squares!!!
        if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked) && !DungeonCrawler.isActive(curr, RoomSquaresActive))
          RoomSquaresActive.push(curr);
      }
      ActiveFoundThisTurn.splice(0, ActiveFoundThisTurn.length);
    } // proceeding

    if (squaresFindingMultiples > 1)
      return false;   //this has several openings, and may thus be not a room, but a passage
    else if (squaresFindingMultiples === 0) { // this can happen when two Crawlers that are seeded into tunnels close on each other, a closed room is created - fill it!
      console.assert(RoomSquaresChecked.length > 0);  // make sure of this if violated
      console.log("FILLING CLOSED ROOM");
      for (let i: number = 0; i !== RoomSquaresChecked.length; i++) {
        console.assert((this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.OPEN) || (this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.NON_JOIN_OPEN) ||
          (this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.INSIDE_TUNNEL_OPEN) || (this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.INSIDE_ANTEROOM_OPEN));
        this.setMap(RoomSquaresChecked[i], TunnelerCellType.CLOSED);
      }
    } else {
      // build a room
      console.assert(squaresFindingMultiples === 1);
      //there's just one square left on the active list, and it's in a place where we want to build a door
      //normally, anyway ...
      if (RoomSquaresChecked.length < this.config.minRoomSize)
        return false;  //we want no doors in front of too small rooms

      //check that we do not turn a corridor into a room, that looks bad
      let diffX: boolean = false;
      let diffY: boolean = false;
      for (let i: number = 0; i !== RoomSquaresChecked.length; i++) {
        if (RoomSquaresChecked[i].x !== RoomSquaresChecked[0].x)
          diffX = true;
        if (RoomSquaresChecked[i].y !== RoomSquaresChecked[0].y)
          diffY = true;
      }
      if (!diffX || !diffY)//we have a corridor, all squares along one line
        return false;

      if (this.getMap(curr.plus(Point.WEST)) === TunnelerCellType.V_DOOR || this.getMap(curr.plus(Point.EAST)) === TunnelerCellType.V_DOOR ||
        this.getMap(curr.plus(Point.WEST)) === TunnelerCellType.H_DOOR || this.getMap(curr.plus(Point.EAST)) === TunnelerCellType.H_DOOR ||
        this.getMap(curr.plus(Point.NORTH)) === TunnelerCellType.V_DOOR || this.getMap(curr.plus(Point.SOUTH)) === TunnelerCellType.V_DOOR ||
        this.getMap(curr.plus(Point.NORTH)) === TunnelerCellType.H_DOOR || this.getMap(curr.plus(Point.SOUTH)) === TunnelerCellType.H_DOOR)
        return false;

      if (RoomSquaresChecked.length < this.config.mediumRoomSize)
        if (!this.isMoreRoomsLabyrinth(RoomSize.SMALL))
          return false;
        else
          this._currSmallRoomsLabyrinth++;
      else if (RoomSquaresChecked.length < this.config.largeRoomSize)
        if (!this.isMoreRoomsLabyrinth(RoomSize.MEDIUM))
          return false;
        else
          this._currMediumRoomsLabyrinth++;
      else if (RoomSquaresChecked.length < this.config.maxRoomSize)
        if (!this.isMoreRoomsLabyrinth(RoomSize.LARGE))
          return false;
        else
          this._currLargeRoomsLabyrinth++;
      else
        return false;  //room too big, we don't want it

      console.assert(RoomSquaresActive.length === 1);
      curr = RoomSquaresActive[0];
      if (this.isOpen(curr.plus(Point.NORTH))) {
        console.assert(this.isOpen(curr.plus(Point.SOUTH)));
        this.setMap(curr, TunnelerCellType.H_DOOR);
      } else if (this.isOpen(curr.plus(Point.WEST))) {
        console.assert(this.isOpen(curr.plus(Point.EAST)));
        this.setMap(curr, TunnelerCellType.V_DOOR);
      }

      const newRoom: Room = new Room();

      for (let i: number = 0; i !== RoomSquaresChecked.length; i++) {
        console.assert((this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.OPEN) || (this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.NON_JOIN_OPEN) ||
          (this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.INSIDE_TUNNEL_OPEN) || (this.getMap(RoomSquaresChecked[i]) === TunnelerCellType.INSIDE_ANTEROOM_OPEN));
        this.setMap(RoomSquaresChecked[i], TunnelerCellType.INSIDE_ROOM_OPEN);
        newRoom.inside.push(RoomSquaresChecked[i]);
      }

      newRoom.inDungeon = false;  // this room is not in the dungeon, but in the labyrinth
      this._rooms.push(newRoom);
    }
    return true;
  }

  generate(): void {
    //create the dungeon
    for (; ;) {
      if (this.activeGeneration === this.config.tunnelCrawlerGeneration)
        this.createSeedCrawlersInTunnels();

      while (this.makeIteration()) {
        // stops when no more change on map
      }
      if (!this.advanceGeneration())  // there are crawler left
        break;
    }
    //normal dungeon is now done

    //now treat extra features, first Crawlers seeded in Tunnels after the normal run is finished
    //run through the dungeon creation process again with newly seeded Crawlers in Tunnels:
    if ((this.config.tunnelCrawlerGeneration < 0) || (this.activeGeneration < this.config.tunnelCrawlerGeneration)) {
      this.createSeedCrawlersInTunnels();
      for (; ;) {
        while (this.makeIteration()) { /* stops when no change on map */
        }
        if (!this.advanceGeneration())  //! there are crawlers left
          break;
      }
    }//end seeding Crawlers in Tunnels after normal run is finished

    //now create rooms in labyrinth part
    //first do this for the entire map if bg=OPEN
    let counter: number = 0;
    let number: number = 0;
    if (this.config.background === TunnelerCellType.OPEN) {
      const rect = new FillRect(0, 0, this.config.width, this.config.height, this.config.background);
      counter = 0;
      number = this.config.width * this.config.height;   //size of the square
      while (this.isMoreRoomsLabyrinth()) {
        if (this.createRoom(rect)) {/*we have been successful*/
        } else
          counter++;
        if (counter > number)
          break;
      }
    }

    //now create rooms inside OPEN squares that were placed in the design:
    for (const rect of this.config.design) {
      if (rect.type !== TunnelerCellType.OPEN)
        continue;   //we only make rooms in the labyrinth part

      counter = 0;
      number = (rect.endX - rect.startX) * (rect.endY - rect.startY);   //size of the square
      while (this.isMoreRoomsLabyrinth()) {
        if (this.createRoom(rect)) { /*we have been successful*/
        } else
          counter++;
        if (counter > number)
          break;
      }
    }
  }
}