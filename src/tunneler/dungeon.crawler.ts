import {Point, CellType, Direction, RoomSize, SpawnedCell, FillRect, Room, IPoint} from "./model";
import {Config} from "./config"
import {WallCrawler} from "./wall.crawler";
import {TunnelCrawler} from "./tunnel.crawler";
import {RoomCrawler} from "./room.crawler";
import {Crawler} from "./crawler";
import {RNG} from "../rng";

export class DungeonCrawler {
  readonly rng: RNG;
  readonly config: Config;

  private readonly map: CellType[];
  private readonly rooms: Room[] = [];
  private readonly mapFlagsDirections: boolean[] = [];
  private readonly crawlers: (Crawler | null)[] = [];

  activeGeneration: number = 0;
  private currSmallRoomsLabyrinth: number = 0;
  private currMediumRoomsLabyrinth: number = 0;
  private currLargeRoomsLabyrinth: number = 0;
  private currSmallRoomsDungeon: number = 0;
  private currMediumRoomsDungeon: number = 0;
  private currLargeRoomsDungeon: number = 0;

  private readonly mobInfo: SpawnedCell[] = [];
  private readonly treasInfo: SpawnedCell[] = [];

  private isOpen(pos: Point): boolean {
    //returns false inside-room/tunnel-open squares, for use in CreateRoom
    let type: CellType = this.getMap(pos);
    return (type === CellType.OPEN) || (type === CellType.NON_JOIN_OPEN) || (type === CellType.INSIDE_TUNNEL_OPEN) || (type === CellType.INSIDE_ANTEROOM_OPEN) || (type === CellType.GUARANTEED_OPEN) || (type === CellType.NON_JOIN_GUARANTEED_OPEN);
  }

  private static isActive(pos: Point, Active: Point[]): boolean {
    for (let i of Active) {
      if ((pos.x === i.x) && (pos.y === i.y))
        return true;
    }
    return false;
  }

  setMap(point: IPoint, data: CellType): void {
    const x = point.x;
    const y = point.y;
    console.assert(data !== undefined);
    console.assert((x < this.config.width) && (y < this.config.height) && (x >= 0) && (y >= 0));
    this.map[x * this.config.height + y] = data;
  }

  getMap(point: IPoint): CellType {
    const x = point.x;
    const y = point.y;
    console.assert((x < this.config.width) && (y < this.config.height) && (x >= 0) && (y >= 0));
    return this.map[x * this.config.height + y];
  }

  isMoreRoomsLabyrinth(size: RoomSize | null = null): boolean {
    if (size !== null) {
      switch (size) {
        case RoomSize.SMALL:
          return (this.config.numSmallRoomsInLabyrinth > this.currSmallRoomsLabyrinth);
        case RoomSize.MEDIUM:
          return (this.config.numMediumRoomsInLabyrinth > this.currMediumRoomsLabyrinth);
        case RoomSize.LARGE:
          return (this.config.numLargeRoomsInLabyrinth > this.currLargeRoomsLabyrinth);
      }
    } else {
      return (this.isMoreRoomsLabyrinth(RoomSize.SMALL) || this.isMoreRoomsLabyrinth(RoomSize.MEDIUM) || this.isMoreRoomsLabyrinth(RoomSize.LARGE));
    }
  }

  isMoreRoomsDungeon(size: RoomSize | null): boolean {
    if (size !== null) {
      switch (size) {
        case RoomSize.SMALL:
          return (this.config.numSmallRoomsInDungeon > this.currSmallRoomsDungeon);
        case RoomSize.MEDIUM:
          return (this.config.numMediumRoomsInDungeon > this.currMediumRoomsDungeon);
        case RoomSize.LARGE:
          return (this.config.numLargeRoomsInDungeon > this.currLargeRoomsDungeon);
      }
    } else {
      return (this.isMoreRoomsDungeon(RoomSize.SMALL) || this.isMoreRoomsDungeon(RoomSize.MEDIUM) || this.isMoreRoomsDungeon(RoomSize.LARGE));
    }
  }

  builtRoomDungeon(size: RoomSize): void {
    if (RoomSize.SMALL === size)
      this.currSmallRoomsDungeon++;
    else if (RoomSize.MEDIUM === size)
      this.currMediumRoomsDungeon++;
    else if (RoomSize.LARGE === size)
      this.currLargeRoomsDungeon++;
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
    this.rooms.push(r);
  }

  private isChecked(pos: Point): boolean {
    console.assert((pos.x < this.config.width) && (pos.y < this.config.height) && (pos.x >= 0) && (pos.y >= 0));
    return this.mapFlagsDirections[pos.x * this.config.height + pos.y];
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
    this.mapFlagsDirections[pos.x * this.config.height + pos.y] = true;
  }

  constructor(config: Config, rng: RNG) {
    this.rng = rng;
    this.config = config;

    console.assert(config.childDelayProbabilityForGenerationCrawlers.length === 11);
    console.assert(config.childDelayProbabilityForGenerationRoomCrawlers.length === 11);
    console.assert(config.roomAspectRatio >= 0 && config.roomAspectRatio <= 1, "roomAspectRatio must be a double between 0 and 1");
    console.assert(config.genSpeedUpOnAnteroom >= 1, "Please use genSpeedUpOnAnteroom >= 1; parameter reset to 1");
    console.assert(!config.crawlersInAnterooms || (config.crawlersInAnterooms && config.crawlersInTunnels), "when you allow Crawlers in Anterooms, you must also allow them in Tunnels");

    this.map = [];
    for (let i = 0; i < this.config.width * this.config.height; i++) {
      this.map[i] = this.config.background;
      this.mapFlagsDirections[i] = false;
    }

    for (let i = 0; i < 4; i++) {
      this.crawlers[i] = null;
    }

    this.setRect(0, 0, this.config.width - 1, 0, CellType.GUARANTEED_CLOSED);
    this.setRect(0, 0, 0, this.config.height - 1, CellType.GUARANTEED_CLOSED);
    this.setRect(this.config.width - 1, 0, this.config.width - 1, this.config.height - 1, CellType.GUARANTEED_CLOSED);
    this.setRect(0, this.config.height - 1, this.config.width - 1, this.config.height - 1, CellType.GUARANTEED_CLOSED);

    for (const des of this.config.design) {
      this.setRectFill(des);
    }

    for (const entry of this.config.openings) {
      switch (entry) {
        case Direction.NORTH:
          this.setRect(0, Math.floor(this.config.height / 2) - 1, 2, Math.floor(this.config.height / 2) + 1, CellType.GUARANTEED_OPEN);
          break;
        case Direction.WEST:
          this.setRect(Math.floor(this.config.width / 2) - 1, 0, Math.floor(this.config.width / 2) + 1, 2, CellType.GUARANTEED_OPEN);
          break;
        case Direction.EAST:
          this.setRect(Math.floor(this.config.width / 2) - 1, this.config.height - 3, Math.floor(this.config.width / 2) + 1, this.config.height - 1, CellType.GUARANTEED_OPEN);
          break;
        case Direction.SOUTH:
          this.setRect(this.config.width - 3, Math.floor(this.config.height / 2) - 1, this.config.width - 1, Math.floor(this.config.height / 2) + 1, CellType.GUARANTEED_OPEN);
          break;
        case Direction.NORTH_WEST:
          this.setRect(0, 0, 2, 2, CellType.GUARANTEED_OPEN);
          break;
        case Direction.NORTH_EAST:
          this.setRect(0, this.config.height - 3, 2, this.config.height - 1, CellType.GUARANTEED_OPEN);
          break;
        case Direction.SOUTH_WEST:
          this.setRect(this.config.width - 3, 0, this.config.width - 1, 2, CellType.GUARANTEED_OPEN);
          break;
        case Direction.SOUTH_EAST:
          this.setRect(this.config.width - 3, this.config.height - 3, this.config.width - 1, this.config.height - 1, CellType.GUARANTEED_OPEN);
          break;
        default:
          console.assert(false);
          break;
      }
    }

    for (let generation = 0; generation < config.randCrawler.perGeneration.length; generation++) {
      let crawlersPer1000Squares: number = config.randCrawler.perGeneration[generation];
      if (crawlersPer1000Squares > 0) {//otherwise nothing to do
        let crawlersPerTopBottomWall: number = Math.floor((this.config.height * crawlersPer1000Squares) / 1000);
        if (crawlersPerTopBottomWall === 0) {//there's less than one Crawler on the wall, use probabilities
          if (this.rng.int % 1000 < (this.config.height * crawlersPer1000Squares))
            crawlersPerTopBottomWall = 1;
        }
        let yIndex: number = 0;
        for (let ind: number = 0; ind < crawlersPerTopBottomWall; ind++) {//create Crawlers at the top and borrom walls, heading inwards
          yIndex = 2 + this.rng.int % (this.config.height - 4);
          let locationNorth = new Point(0, yIndex);
          let directionSouth = Point.SOUTH;   //going South
          this.createWallCrawler(locationNorth, directionSouth, 0, this.getMaxAgeCrawlers(generation), generation, directionSouth, this.getStepLength(generation), 1,
            this.getCorridorWidth(generation), this.mutate2(config.randCrawler.straightSingleSpawnProbability), this.mutate2(config.randCrawler.straightDoubleSpawnProbability),
            this.mutate2(config.randCrawler.turnSingleSpawnProbability), this.mutate2(config.randCrawler.turnDoubleSpawnProbability), this.mutate2(config.randCrawler.changeDirectionProbability));
          //now for the South wall
          yIndex = 2 + this.rng.int % (this.config.height - 4);
          let locationSouth = new Point(this.config.width - 1, yIndex);
          let directionNorth = Point.NORTH;   //going North
          this.createWallCrawler(locationSouth, directionNorth, 0, this.getMaxAgeCrawlers(generation), generation, directionNorth, this.getStepLength(generation), 1,
            this.getCorridorWidth(generation), this.mutate2(config.randCrawler.straightSingleSpawnProbability), this.mutate2(config.randCrawler.straightDoubleSpawnProbability),
            this.mutate2(config.randCrawler.turnSingleSpawnProbability), this.mutate2(config.randCrawler.turnDoubleSpawnProbability), this.mutate2(config.randCrawler.changeDirectionProbability));
        }//end North and South walls

        //now do the east and West walls
        let crawlersPerLeftRightWall: number = Math.floor((this.config.width * crawlersPer1000Squares) / 1000);
        if (crawlersPerLeftRightWall === 0) {//there's less than one Crawler on the wall, use probabilities
          if (this.rng.int % 1000 < (this.config.width * crawlersPer1000Squares))
            crawlersPerLeftRightWall = 1;
        }
        let xIndex: number = 0;
        for (let ind: number = 0; ind < crawlersPerLeftRightWall; ind++) {//create Crawlers at the left and right walls, heading inwards
          xIndex = 2 + this.rng.int % (this.config.width - 4);
          let locationWest = new Point(xIndex, 0);
          let directionEast = Point.EAST;   // going East
          let intFwd = directionEast;      // intended direction = start direction
          this.createWallCrawler(locationWest, directionEast, 0, this.getMaxAgeCrawlers(generation), generation, intFwd, this.getStepLength(generation), 1,
            this.getCorridorWidth(generation), this.mutate2(config.randCrawler.straightSingleSpawnProbability), this.mutate2(config.randCrawler.straightDoubleSpawnProbability),
            this.mutate2(config.randCrawler.turnSingleSpawnProbability), this.mutate2(config.randCrawler.turnDoubleSpawnProbability), this.mutate2(config.randCrawler.changeDirectionProbability));
          //now for the East wall
          xIndex = 2 + this.rng.int % (this.config.width - 4);
          let locEast = new Point(xIndex, this.config.height - 1);
          let directionWest = Point.WEST;   // going West
          intFwd = directionWest;      // intended direction = start direction
          this.createWallCrawler(locEast, directionWest, 0, this.getMaxAgeCrawlers(generation), generation, intFwd, this.getStepLength(generation), 1,
            this.getCorridorWidth(generation), this.mutate2(config.randCrawler.straightSingleSpawnProbability), this.mutate2(config.randCrawler.straightDoubleSpawnProbability),
            this.mutate2(config.randCrawler.turnSingleSpawnProbability), this.mutate2(config.randCrawler.turnDoubleSpawnProbability), this.mutate2(config.randCrawler.changeDirectionProbability));
        }//end East and West walls
      }//end creating Crawlers for this generation
    }

    for (const cd of config.crawlers) {
      this.createWallCrawler(cd.location, cd.direction, -cd.age, cd.maxAge, cd.generation, cd.intendedDirection, cd.stepLength,
        cd.opening, cd.corridorWidth, cd.straightSingleSpawnProbability, cd.straightDoubleSpawnProbability,
        cd.turnSingleSpawnProbability, cd.turnDoubleSpawnProbability, cd.changeDirectionProbability);
    }

    for (let [first, second] of config.crawlerPairs) {
      let firstIsOpen: boolean = true;
      if (this.rng.boolean)
        firstIsOpen = false;
      this.createWallCrawler(first.location, first.direction, -first.age, first.maxAge, first.generation, first.intendedDirection, first.stepLength, (firstIsOpen ? 1 : 0), first.corridorWidth, first.straightSingleSpawnProbability, first.straightDoubleSpawnProbability,
        first.turnSingleSpawnProbability, first.turnDoubleSpawnProbability, first.changeDirectionProbability);
      //also close the square where the Crawlers start:
      this.setMap(first.location, CellType.CLOSED);

      //now the second one:
      this.createWallCrawler(second.location, second.direction, -second.age, second.maxAge, second.generation, second.intendedDirection, second.stepLength, (firstIsOpen ? 1 : 0), second.corridorWidth, second.straightSingleSpawnProbability, second.straightDoubleSpawnProbability,
        second.turnSingleSpawnProbability, second.turnDoubleSpawnProbability, second.changeDirectionProbability);
      //also close the square where the Crawlers start:
      this.setMap(second.location, CellType.CLOSED);   //could be two different starting locations, so be sure
    }

    for (let td of config.tunnelCrawlers) {
      this.createTunnelCrawler(td.location, td.direction, -td.age, td.maxAge, td.generation, td.intendedDirection,
        td.stepLength, td.tunnelWidth, td.straightDoubleSpawnProbability, td.turnDoubleSpawnProbability, td.changeDirectionProbability,
        td.makeRoomsRightProbability, td.makeRoomsLeftProbability, td.joinPreference);
    }
  }

  private setRectFill(rect: FillRect): void {
    this.setRect(rect.startX, rect.startY, rect.endX, rect.endY, rect.type);
  }

  private setRect(startX: number, startY: number, endX: number, endY: number, data: CellType): void {
    if ((endX < startX) || (endY < startY)) {
      console.error(`Refuse to set incorrectly specified rectangle; sX = ${startX} sY=${startY} eX=${endX} endY=${endY}`);
      return;
    } else {
      for (let x = startX; x <= endX; x++)
        for (let y = startY; y <= endY; y++)
          this.setMap({x: x, y: y}, data);
    }
  }

  createWallCrawler(location: IPoint, direction: IPoint, age: number, maxAge: number, generation: number,
                    intendedDirection: IPoint, stepLength: number, opening: number,
                    corridorWidth: number, straightSingleSpawnProbability: number, straightDoubleSpawnProbability: number,
                    turnSingleSpawnProbability: number, turnDoubleSpawnProbability: number, changeDirectionProbability: number): void {
    let crawler = new WallCrawler(this.rng, this, Point.from(location), Point.from(direction), age, maxAge, generation,
      Point.from(intendedDirection), stepLength, opening,
      corridorWidth, straightSingleSpawnProbability, straightDoubleSpawnProbability,
      turnSingleSpawnProbability, turnDoubleSpawnProbability, changeDirectionProbability);

    for (let i = 0; i < this.crawlers.length; i++) {
      if (this.crawlers[i] === null) {
        this.crawlers[i] = crawler;
        return;
      }
    }

    this.crawlers.push(crawler);
  }

  createTunnelCrawler(location: IPoint, direction: IPoint, age: number, maxAge: number, generation: number,
                      intendedDirection: IPoint, stepLength: number, tunnelWidth: number, straightDoubleSpawnProbability: number, turnDoubleSpawnProbability: number,
                      changeDirectionProbability: number, makeRoomsRightProbability: number, makeRoomsLeftProbability: number, joinPreference: number): void {
    let crawler = new TunnelCrawler(this.rng, this, Point.from(location), Point.from(direction), age, maxAge, generation,
      Point.from(intendedDirection), stepLength, tunnelWidth, straightDoubleSpawnProbability, turnDoubleSpawnProbability,
      changeDirectionProbability, makeRoomsRightProbability, makeRoomsLeftProbability, joinPreference);

    for (let i = 0; i < this.crawlers.length; i++) {
      if (this.crawlers[i] === null) {
        this.crawlers[i] = crawler;
        return;
      }
    }

    this.crawlers.push(crawler);
  }

  createRoomCrawler(location: IPoint, direction: IPoint, age: number, maxAge: number, generation: number, defaultWidth: number, size: RoomSize): void {
    const crawler = new RoomCrawler(this.rng, this, Point.from(location), Point.from(direction), age, maxAge, generation, defaultWidth, size);

    for (let i = 0; i < this.crawlers.length; i++) {
      if (this.crawlers[i] === null) {
        this.crawlers[i] = crawler;
        return;
      }
    }

    this.crawlers.push(crawler);
  }

  mutate(input: number): number {
    let output: number = input - this.config.mutator + (this.rng.int % (2 * this.config.mutator + 1));
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
        return (this.rng.int % (2 * input + 1));
    } else {
      if (input > 100)
        return 100;
      else
        return (2 * input - 100 + this.rng.int % (200 - 2 * input + 1));
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
      let startX: number = 1 + this.rng.int % (this.config.width - 4);     // [1 , ... , dimX-2]
      let startY: number = 1 + this.rng.int % (this.config.height - 4);    // [1 , ... , dimY-2]
      let test = new Point(startX, startY);

      //now make a starting direction
      if ((this.rng.int % 100) < 50)
        startX = 0;
      else
        startY = 0;
      if (startX === 0) {
        if ((this.rng.int % 100) < 50)
          startY = -1;
        else
          startY = 1;
      } else {
        console.assert(startY === 0);
        if ((this.rng.int % 100) < 50)
          startX = -1;
        else
          startX = 1;
      }
      let direction = new Point(startX, startY);
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

        if (this.getMap(test) !== CellType.INSIDE_TUNNEL_OPEN)
          continue;   //not in a tunnel
        //now test the 8 adjacent points, which must all be inside a tunnel for this to work
        if ((this.getMap(test.plus(direction)) !== CellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction)) !== CellType.INSIDE_TUNNEL_OPEN) ||
          (this.getMap(test.plus(orthogonal)) !== CellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(orthogonal)) !== CellType.INSIDE_TUNNEL_OPEN) ||
          (this.getMap(test.plus(direction).plus(orthogonal)) !== CellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction).plus(orthogonal)) !== CellType.INSIDE_TUNNEL_OPEN) ||
          (this.getMap(test.plus(direction).minus(orthogonal)) !== CellType.INSIDE_TUNNEL_OPEN) || (this.getMap(test.minus(direction).minus(orthogonal)) !== CellType.INSIDE_TUNNEL_OPEN))
          continue;   //no space to run Crawler

        this.setMap(test, CellType.CLOSED);  //closed square for the Crawler to sit on
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
        if ((this.rng.int % 100) < this.config.tunnelCrawlerClosedProbability)
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
    for (let i: number = 0; i < this.crawlers.length; i++) {
      if (null !== this.crawlers[i]) {
        if (!this.crawlers[i]!.stepAhead()) {  //if the crawler cannot do anything any more
          this.crawlers[i] = null;
        }
      }
    }

    return false;
  }

  private advanceGeneration(): boolean {
    let isCrawlerExists: boolean = false;
    let highestNegativeAge: number = 0;  //used to advance the ages of all crawler of this generation if they are all dormant
    for (let i: number = 0; i < this.crawlers.length; i++) {
      if (null !== this.crawlers[i]) {
        isCrawlerExists = true;
        if (this.crawlers[i]!.generation === this.activeGeneration) {  //if the crawler is of the current generation
          let a: number = this.crawlers[i]!.age;
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
      for (let i: number = 0; i < this.crawlers.length; i++) {
        if (null !== this.crawlers[i]) {
          if (this.crawlers[i]!.generation === this.activeGeneration)   //if the crawler is of the current generation
            this.crawlers[i]!.age -= highestNegativeAge;
        }
      }
      return isCrawlerExists;
    }
  }

  plonkDownStuff(): void {
    let numRooms: number = this.rooms.length;
    if (numRooms > 0) {
      this.rooms.sort(Room.compare);
    }

    const mobsInDungeonRooms = [...this.config.mobsInDungeonRooms];
    const mobsInDungeonOpen = [...this.config.mobsInDungeonOpen];
    const mobsInLabyrinthRooms = [...this.config.mobsInLabyrinthRooms];
    const mobsInLabyrinthOpen = [...this.config.mobsInLabyrinthOpen];
    const treasureInDungeon = [...this.config.treasureInDungeon];
    const treasureInLabyrinth = [...this.config.treasureInLabyrinth];

    let numMomsInDungeonRooms: number = 0;
    let numMobsInDungeonOpen: number = 0;
    let numMobsInLabyrinthRooms: number = 0;
    let numMobsInLabyrinthOpen: number = 0;
    let numTreasureInDungeon: number = 0;
    let numTreasureInLabyrinth: number = 0;
    let numLabyrinthRooms: number = 0;
    let numDungeonRooms: number = 0;
    //now count'em:
    let i: number;
    let dimMOBsDR = mobsInDungeonRooms.length;
    for (let i = 0; i < dimMOBsDR; i++)
      numMomsInDungeonRooms += mobsInDungeonRooms[i];
    let dimMOBsDO: number = mobsInDungeonOpen.length;
    for (i = 0; i < dimMOBsDO; i++)
      numMobsInDungeonOpen += mobsInDungeonOpen[i];
    let dimMOBsLR: number = mobsInLabyrinthRooms.length;
    for (i = 0; i < dimMOBsLR; i++)
      numMobsInLabyrinthRooms += mobsInLabyrinthRooms[i];
    let dimMobsInLabyrinthOpen: number = mobsInLabyrinthOpen.length;
    for (i = 0; i < dimMobsInLabyrinthOpen; i++)
      numMobsInLabyrinthOpen += mobsInLabyrinthOpen[i];
    let dimTreasD: number = treasureInDungeon.length;
    for (i = 0; i < dimTreasD; i++)
      numTreasureInDungeon += treasureInDungeon[i];
    let dimTreasL: number = treasureInLabyrinth.length;
    for (i = 0; i < dimTreasL; i++)
      numTreasureInLabyrinth += treasureInLabyrinth[i];
    for (i = 0; i < this.rooms.length; i++) {
      if (this.rooms[i].inDungeon)  //if true the room is inside the dungeon part, otherwise in the labyrinth
        numDungeonRooms++;
      else
        numLabyrinthRooms++;
    }
    console.assert(numRooms === numLabyrinthRooms + numDungeonRooms);

    //estimate how many groups we will have to plonk down
    let numGroupsMOBsDR: number;
    if (this.config.avgGroupSizeForMobsInDungeonRooms > 1)
      numGroupsMOBsDR = Math.floor(numMomsInDungeonRooms / this.config.avgGroupSizeForMobsInDungeonRooms);
    else
      numGroupsMOBsDR = numMomsInDungeonRooms;
    //  numGroupsMOBsDO: number = numMOBsDO/groupSizeMOBDO;
    let numGroupsMOBsLR: number;
    if (this.config.avgGroupSizeForMobsInLabyrinthRooms > 1)
      numGroupsMOBsLR = Math.floor(numMobsInLabyrinthRooms / this.config.avgGroupSizeForMobsInLabyrinthRooms);
    else
      numGroupsMOBsLR = numMobsInLabyrinthRooms;
    //  numGroupsMOBsLO: number = numMOBsLO/groupSizeMOBLO;
    let numGroupsTreasD: number;
    if (this.config.avgGroupSizeTreasureDungeon)
      numGroupsTreasD = Math.floor(numTreasureInDungeon / this.config.avgGroupSizeTreasureDungeon);
    else
      numGroupsTreasD = numTreasureInDungeon;
    let numGroupsTreasL: number;
    if (this.config.avgGroupSizeTreasureLabyrinth > 1)
      numGroupsTreasL = Math.floor(numTreasureInLabyrinth / this.config.avgGroupSizeTreasureLabyrinth);
    else
      numGroupsTreasL = numTreasureInLabyrinth;

    //bail out if things don't look right:
    if (numGroupsMOBsDR > numDungeonRooms) {
      console.error("Design file demands more groups of MOBs in dungeon rooms than we have such rooms. Aborting plunking.");
      return;
    }
    if (numGroupsMOBsLR > numLabyrinthRooms) {
      console.error("Design file demands more groups of MOBs in labyrinth rooms than we have such rooms. Aborting plunking.");
      return;
    }
    if (numGroupsTreasD > numDungeonRooms) {
      console.error("Design file demands more groups of treasure in dungeon rooms than we have such rooms. Aborting plunking.");
      return;
    }
    if (numGroupsTreasL > numLabyrinthRooms) {
      console.error("Design file demands more groups of treasure in labyrinth rooms than we have such rooms. Aborting plunking.");
      return;
    }

    //well, it's time to start plunking in earnest
    //start with dungeon rooms
    let currRoom: Room = new Room();
    let currIndex: number = 0;
    let firstRoom: boolean = true;
    let gSizeM: number;
    let gSizeT: number;
    while ((numMomsInDungeonRooms > 0) || (numTreasureInDungeon > 0))   //in dungeon rooms
    {
      let mobType: number[] = [];
      let treasureType: number[] = [];   //what types of MOBs and treasure to put into this room
      let locations: Point[] = [];   //where to put it
      //get the next room to plonk in to
      let notFound: boolean = true;
      while ((notFound) && (currIndex < numRooms)) {
        currRoom = this.rooms[currIndex++];
        if (currRoom.inDungeon)  //if currentRoom is a dungeon room
          notFound = false;
      }

      //now plonk down some stuff in currRoom
      if (firstRoom) {//make a big group
        gSizeM = this.config.avgGroupSizeForMobsInDungeonRooms + this.config.groupSizeVarianceForMobsInDungeonRooms;
        gSizeT = this.config.avgGroupSizeTreasureDungeon + this.config.groupSizeVarianceForTreasureInDungeon;
      } else {//make a random size group
        gSizeM = this.config.avgGroupSizeForMobsInDungeonRooms - this.config.groupSizeVarianceForMobsInDungeonRooms + this.rng.int % (2 * this.config.groupSizeVarianceForMobsInDungeonRooms + 1);
        if (gSizeM < 1)
          gSizeM = 1;
        gSizeT = this.config.avgGroupSizeTreasureDungeon - this.config.groupSizeVarianceForTreasureInDungeon + this.rng.int % (2 * this.config.groupSizeVarianceForTreasureInDungeon + 1);
        if (gSizeT < 1)
          gSizeT = 1;
      }

      //get MOBtype
      if (numMomsInDungeonRooms > 0) {
        console.assert(dimMOBsDR > 0);   //otherwise the for loop starts at -1
        if (firstRoom) {
          for (i = dimMOBsDR - 1; i >= 0; i--)
            if (mobsInDungeonRooms[i] > 0) { //we actually want a mob of type i
              mobType.push(i);  //hold it to insert in room later
              mobsInDungeonRooms[i]--;   //one less of this type to insert
              numMomsInDungeonRooms--;
              gSizeM--;              //one less to find
              break;                 //we get the biggest MOB for the largest room, but only this once we use special case treatment
            }
        }
        while (gSizeM > 0)   //we need more monster types for our group
        {
          i = this.rng.int % dimMOBsDR;
          if (mobsInDungeonRooms[i] > 0) {//we actually want a MOB of type i
            mobType.push(i);  //hold it to insert in room later
            mobsInDungeonRooms[i]--;   //one less of this type to insert
            numMomsInDungeonRooms--;
            gSizeM--;              //one less to find
          }
          if (numMomsInDungeonRooms === 0)
            break;   //none left to place
        }
      }

      //get treasType
      if (numTreasureInDungeon > 0) {
        console.assert(dimTreasD > 0);   //otherwise the for loop starts at -1
        if (firstRoom) {
          for (i = dimTreasD - 1; i >= 0; i--)
            if (treasureInDungeon[i] > 0) {//we actually want a treasure of type i
              treasureType.push(i);  //hold it to insert in room later
              treasureInDungeon[i]--;         //one less of this type to insert
              numTreasureInDungeon--;
              gSizeT--;              //one less to find
              break;              //we get the biggest treasure for the largest room, but only this once we use special case treatment
            }
          firstRoom = false;
        }
        while (gSizeT > 0)   //we want more treasure types for our group
        {
          i = this.rng.int % dimTreasD;
          if (treasureInDungeon[i] > 0) {//we actually want a treasure of type i
            treasureType.push(i);  //hold it to insert in room later
            treasureInDungeon[i]--;         //one less of this type to insert
            numTreasureInDungeon--;
            gSizeT--;              //one less to find
          }
          if (numTreasureInDungeon === 0)
            break;   //we've run out of treasure
        }
      }

      //get Locations to insert MOBs and treasure
      let count: number = mobType.length + treasureType.length;   //number of squares in the room we need
      if (count >= currRoom.inside.length) {
        console.error("Too much treasure and MOBs for the size of the room, bailing out from plonking.");
        return;
      }
      while (count > 0) {
        let square: Point = currRoom.randomSquare();
        let isUnique: boolean = true;
        for (i = 0; i < locations.length; i++)
          if (square === locations[i]) {
            isUnique = false;
            break;
          }
        if (isUnique) //we haven't found this square before
        {
          locations.push(square);
          count--;   //we need one less
        }
      }//count > 0

      //now we have everything assembled, MOBtypes, treasureTypes, and Locations, and we can simply assign:
      console.assert((mobType.length + treasureType.length) === locations.length);
      for (i = 0; i < mobType.length; i++) {
        const spawn = new SpawnedCell(locations[i].x, locations[i].y, mobType[i]);
        this.mobInfo.push(spawn);
      }
      for (i = 0; i < treasureType.length; i++) {
        const spawn = new SpawnedCell(locations[mobType.length + i].x, locations[mobType.length + i].y, treasureType[i]);
        this.treasInfo.push(spawn);
      }

      if (currIndex === numRooms) {
        console.error("Ran out of rooms while plonking in dungeon, aborting plunking...");
        return;
      }
    }//  while( ( numMOBsDR > 0 ) || ( numTreasD > 0 ) )

    //now do the same thing for the labyrinth
    currIndex = 0;   //start again at Rooms[0]
    firstRoom = true;
    while ((numMobsInLabyrinthRooms > 0) || (numTreasureInLabyrinth > 0))   //in labyrinth rooms
    {
      let mobType: number[] = [];
      let treasureType: number[] = [];   //what types of MOBs and treasure to put into this room
      let locations: Point[] = [];   //where to put it
      //get the next room to plonk in to
      let notFound: boolean = true;
      while ((notFound) && (currIndex < numRooms)) {
        currRoom = this.rooms[currIndex++];
        if (!currRoom.inDungeon)  //if currentRoom is not a dungeon room it's a labyrinth room!
          notFound = false;
      }

      //now plonk down some stuff in currRoom
      if (firstRoom) {//make a big group
        gSizeM = this.config.avgGroupSizeForMobsInLabyrinthRooms + this.config.groupSizeVarianceForMobsInLabyrinthRooms;
        gSizeT = this.config.avgGroupSizeTreasureLabyrinth + this.config.groupSizeVarianceForTreasureInLabyrinth;
      } else {//make a random size group
        gSizeM = this.config.avgGroupSizeForMobsInLabyrinthRooms - this.config.groupSizeVarianceForMobsInLabyrinthRooms + this.rng.int % (2 * this.config.groupSizeVarianceForMobsInLabyrinthRooms + 1);
        if (gSizeM < 1)
          gSizeM = 1;
        gSizeT = this.config.avgGroupSizeTreasureLabyrinth - this.config.groupSizeVarianceForTreasureInLabyrinth + this.rng.int % (2 * this.config.groupSizeVarianceForTreasureInLabyrinth + 1);
        if (gSizeT < 1)
          gSizeT = 1;
      }

      //get MOBtype
      if (numMobsInLabyrinthRooms > 0) {
        console.assert(dimMOBsLR > 0);   //otherwise the for loop starts at -1
        if (firstRoom) {
          for (i = dimMOBsLR - 1; i >= 0; i--)
            if (mobsInLabyrinthRooms[i] > 0) {//we actually want a MOB of type i
              mobType.push(i);  //hold it to insert in room later
              mobsInLabyrinthRooms[i]--;   //one less of this type to insert
              numMobsInLabyrinthRooms--;
              gSizeM--;              //one less to find
              break;                 //we get the biggest MOB for the largest room, but only this once we use special case treatment
            }
        }
        while (gSizeM > 0)   //we need more monster types for our group
        {
          i = this.rng.int % dimMOBsLR;
          if (mobsInLabyrinthRooms[i] > 0) {//we actually want a MOB of type i
            mobType.push(i);  //hold it to insert in room later
            mobsInLabyrinthRooms[i]--;   //one less of this type to insert
            numMobsInLabyrinthRooms--;
            gSizeM--;              //one less to find
          }
          if (numMobsInLabyrinthRooms === 0)
            break;   //none left to place
        }
      }

      //get treasType
      if (numTreasureInLabyrinth > 0) {
        console.assert(dimTreasL > 0);   //otherwise the for loop starts at -1
        if (firstRoom) {
          for (i = dimTreasL - 1; i >= 0; i--)
            if (treasureInLabyrinth[i] > 0) {//we actually want a treasure of type i
              treasureType.push(i);  //hold it to insert in room later
              treasureInLabyrinth[i]--;         //one less of this type to insert
              numTreasureInLabyrinth--;
              gSizeT--;              //one less to find
              break;                 //we get the biggest treasure for the largest room, but only this once we use special case treatment
            }
          firstRoom = false;
        }
        while (gSizeT > 0)   //we want more treasure types for our group
        {
          i = this.rng.int % dimTreasL;
          if (treasureInLabyrinth[i] > 0) {//we actually want a treasure of type i
            treasureType.push(i);  //hold it to insert in room later
            treasureInLabyrinth[i]--;         //one less of this type to insert
            numTreasureInLabyrinth--;
            gSizeT--;              //one less to find
          }
          if (numTreasureInLabyrinth === 0)
            break;   //we've run out of treasure
        }
      }

      //get Locations to insert MOBs and treasure
      let count: number = mobType.length + treasureType.length;   //number of squares in the room we need
      if (count >= currRoom.inside.length) {
        console.error("Too much treasure and MOBs for the size of the labyrinth room, bailing out from plonking.");
        return;
      }
      while (count > 0) {
        let square = currRoom.randomSquare();
        let isUnique: boolean = true;
        for (i = 0; i < locations.length; i++)
          if (square === locations[i]) {
            isUnique = false;
            break;
          }
        if (isUnique) //we haven't found this square before
        {
          locations.push(square);
          count--;   //we need one less
        }
      }//count > 0

      //now we have everything assembled, MOBtypes, treasureTypes, and Locations, and we can simply assign:
      console.assert((mobType.length + treasureType.length) === locations.length);
      for (i = 0; i < mobType.length; i++) {
        let spawn = new SpawnedCell(locations[i].x, locations[i].y, mobType[i]);
        this.mobInfo.push(spawn);
      }
      for (i = 0; i < treasureType.length; i++) {
        let spawn = new SpawnedCell(locations[mobType.length + i].x, locations[mobType.length + i].y, treasureType[i]);
        this.treasInfo.push(spawn);
      }

      if (currIndex === numRooms) {
        console.error("Ran out of rooms while plonking in labyrinth, aborting plunking...");
        return;
      }
    }//  while( ( numMOBsLR > 0 ) || ( numTreasL > 0 ) )

    //we finished placing stuff in rooms, now do it in the open:
    //first for labyrinth
    let mobType: number[] = [];   //what types of MOBs and treasure to plonk
    let locations: Point[] = [];   //where to plonk it
    let tries: number = 0;
    while ((numMobsInLabyrinthOpen > 0) && (tries < this.config.width * this.config.height)) {
      tries++;
      //get candidate starting point
      let test = new Point(1 + (this.rng.int % (this.config.width - 3)), 1 + (this.rng.int % (this.config.height - 3)));
      //now make a starting direction
      let startX: number = 0;
      let startY: number = 0;
      if ((this.rng.int % 100) < 50)
        startX = 0;
      else
        startY = 0;
      if (startX === 0) {
        if ((this.rng.int % 100) < 50)
          startY = -1;
        else
          startY = 1;
      } else {
        console.assert(startY === 0);
        if ((this.rng.int % 100) < 50)
          startX = -1;
        else
          startX = 1;
      }
      let direction = new Point(startX, startY);

      //now search through the dungeon for an OPEN square, which must be inside the labyrinth part
      //start at Start and go towards direction until we find a suitable place or reach the end of the map
      let notFound: boolean = true;
      while (notFound) {
        test = test.plus(direction);
        if ((test.x < 2) || (test.y < 2) || (test.x > this.config.width - 3) || (test.y > this.config.height - 3))
          break;   //end the loop, we're running off the map

        if (this.getMap(test) !== CellType.OPEN)
          continue;   //not in a tunnel

        let isUnique: boolean = true;
        for (i = 0; i < locations.length; i++)
          if (test === locations[i]) {
            isUnique = false;
            break;
          }
        if (isUnique) //we haven't found this square before
          locations.push(test);
        else
          continue;  //find another test spot

        notFound = false;

        for (i = 0; i < mobsInLabyrinthOpen.length; i++)
          if (mobsInLabyrinthOpen[i] > 0) {//we actually want a MOB of type i
            mobsInLabyrinthOpen[i]--;   //one less of this type to insert
            mobType.push(i);
            numMobsInLabyrinthOpen--;
            break;
          }
        //now they're put into MOBtype and Locations instead to avoid duplication
// 	  SpawnInfo spawn( Test.first , Test.second , i );
// 	  MOBInfo.push(spawn);

      }//while notFound
    }// while(numMOBsLO > 0)

    //now for dungeon, in the open
    tries = 0;
    while ((numMobsInDungeonOpen > 0) && (tries < this.config.width * this.config.height)) {
      tries++;
      //get candidate starting point
      let test = new Point(1 + (this.rng.int % (this.config.width - 3)), 1 + (this.rng.int % (this.config.height - 3)));
      //now make a starting direction
      let startX: number = 0;
      let startY: number = 0;
      if ((this.rng.int % 100) < 50)
        startX = 0;
      else
        startY = 0;
      if (startX === 0) {
        if ((this.rng.int % 100) < 50)
          startY = -1;
        else
          startY = 1;
      } else {
        console.assert(startY === 0);
        if ((this.rng.int % 100) < 50)
          startX = -1;
        else
          startX = 1;
      }
      let direction = new Point(startX, startY);

      //what are we looking for, tunnel or anteroom?
      let target: CellType;
      if ((this.rng.int % 100) < this.config.inAnteroomProbability)
        target = CellType.INSIDE_ANTEROOM_OPEN;
      else
        target = CellType.INSIDE_TUNNEL_OPEN;

      //now search through the dungeon for a target square, which must be inside the dungeon part
      //start at Start and go towards direction until we find a suitable place or reach the end of the map
      let notFound: boolean = true;
      while (notFound) {
        test = test.plus(direction);
        if ((test.x < 2) || (test.y < 2) || (test.x > this.config.width - 3) || (test.y > this.config.height - 3))
          break;   //end the loop, we're running off the map

        if (this.getMap(test) !== target)
          continue;   //not on target
        if ((this.getMap(test.plus(direction)) === target) && (this.getMap(test.plus(direction).plus(direction)) === target))
          continue;   //otherwise all MOBs stand next to a wall

        let isUnique: boolean = true;
        for (i = 0; i < locations.length; i++)
          if (test === locations[i]) {
            isUnique = false;
            break;
          }
        if (isUnique) //we haven't found this square before
          locations.push(test);
        else
          continue; //find another test spot

        notFound = false;  //we must'a found it!

        for (i = 0; i < mobsInDungeonOpen.length; i++)
          if (mobsInDungeonOpen[i] > 0) {//we actually want a MOB of type i
            mobsInDungeonOpen[i]--;   //one less of this type to insert
            mobType.push(i);
            numMobsInDungeonOpen--;
            break;
          }

// 	  SpawnInfo spawn( Test.first , Test.second , i );
// 	  MOBInfo.push(spawn);

      }//while notFound
    }// while(numMOBsDO > 0)

    console.assert(mobType.length === locations.length);
    for (i = 0; i < mobType.length; i++) {
      let spawn = new SpawnedCell(locations[i].x, locations[i].y, mobType[i]);
      this.mobInfo.push(spawn);
    }

  }

  putPlonkOnMap(): void { //this is provisional and will just show in 3 different colors for different types
    let PROV1: number = 2;
    let PROV2: number = 4;    //PROVISIONAL VALUES, USERS MUST CHANGE THIS
    let i: number;

    for (i = 0; i < this.mobInfo.length; i++) {
      if (this.mobInfo[i].type < PROV1)
        this.setMap(this.mobInfo[i], CellType.MOB1);
      else if (this.mobInfo[i].type < PROV2)
        this.setMap(this.mobInfo[i], CellType.MOB2);
      else
        this.setMap(this.mobInfo[i], CellType.MOB3);
    }

    for (i = 0; i < this.treasInfo.length; i++) {
      console.assert(this.getMap(this.treasInfo[i]) === CellType.INSIDE_ROOM_OPEN);
      if (this.treasInfo[i].type < PROV1)
        this.setMap(this.treasInfo[i], CellType.TREASURE_1);
      else if (this.treasInfo[i].type < PROV2)
        this.setMap(this.treasInfo[i], CellType.TREASURE_2);
      else
        this.setMap(this.treasInfo[i], CellType.TREASURE_3);
    }
  }

  private createRoom(rect: FillRect): boolean {//we randomly pick a spot in the dungeon, and check whether it can be made into a room by placing a single door tile
    if ((this.config.width < 10) || (this.config.height < 10))
      return false;   //avoid triggering console.assertions in ridiculously small dungeons

    if ((rect.endX - rect.startX) <= 5)
      return false;
    if ((rect.endY - rect.startY) <= 5)
      return false;   //too small to mess with, see next lines

    let startX: number = rect.startX + 1 + this.rng.int % (rect.endX - rect.startX - 3);     // [startX + 1 , ... , endX - 1]
    let startY: number = rect.startY + 1 + this.rng.int % (rect.endY - rect.startY - 3);     // [startY + 1 ,     , endY - 1]
    let start = new Point(startX, startY);

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
    let RoomSquaresChecked: Point[] = [];
    let RoomSquaresActive: Point[] = [];
    let ActiveFoundThisTurn: Point[] = [];


    RoomSquaresActive.push(start);

    let numberFound: number;
    while (stillFindingMultiples) {//we expand our chacked area, but not into areas where we find just one open square - these are door candidates
      stillFindingMultiples = false;
      for (let actIt = 0; actIt < RoomSquaresActive.length; /*increment inside loop*/) {
        let Curr = RoomSquaresActive[actIt];
        numberFound = 0;
        //check the entire neighborhood of our square for open squares:
        if (this.isOpen(Curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(Curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(Curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(Curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.WEST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(Curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(Curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(Curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
          numberFound++;
        if (this.isOpen(Curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
          !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
          numberFound++;

        if (numberFound > 2) {
          stillFindingMultiples = true;
          //process this square
          if (this.isOpen(Curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.NORTH));
          if (this.isOpen(Curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.SOUTH));
          if (this.isOpen(Curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.EAST));
          if (this.isOpen(Curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.WEST));
          if (this.isOpen(Curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.NORTH_EAST));
          if (this.isOpen(Curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.NORTH_WEST));
          if (this.isOpen(Curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.SOUTH_EAST));
          if (this.isOpen(Curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.SOUTH_WEST));

          if (!DungeonCrawler.isCheckedList(Curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(Curr);
            this.setChecked(Curr);
          }

          //erase Curr from the active list and increment iterator
          RoomSquaresActive.splice(actIt, 1);
          actIt++;
        } else if (numberFound === 2) {//special treatment to prevent a common occurrence of going through perfectly good door locations in two steps,
          // each time seeing two open squares
          let found: number = 0;
          if (this.isOpen(Curr.plus(Point.NORTH)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.NORTH), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(Curr.plus(Point.NORTH));
            found++;
          }
          if (this.isOpen(Curr.plus(Point.SOUTH)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.SOUTH), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(Curr.plus(Point.SOUTH));
            found++;
          }
          if (this.isOpen(Curr.plus(Point.EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.EAST), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(Curr.plus(Point.EAST));
            found++;
          }
          if (this.isOpen(Curr.plus(Point.WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.WEST), ActiveFoundThisTurn)) {
            ActiveFoundThisTurn.push(Curr.plus(Point.WEST));
            found++;
          }
          if (found === 1) {//good chance we catch the door if we bail out now
            actIt++;
            continue;
          }
          if (this.isOpen(Curr.plus(Point.NORTH_EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.NORTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.NORTH_EAST));
          if (this.isOpen(Curr.plus(Point.NORTH_WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.NORTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.NORTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.NORTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.NORTH_WEST));
          if (this.isOpen(Curr.plus(Point.SOUTH_EAST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH_EAST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_EAST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_EAST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.SOUTH_EAST));
          if (this.isOpen(Curr.plus(Point.SOUTH_WEST)) && !DungeonCrawler.isCheckedList(Curr.plus(Point.SOUTH_WEST), RoomSquaresChecked) &&
            !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_WEST), RoomSquaresActive) && !DungeonCrawler.isActive(Curr.plus(Point.SOUTH_WEST), ActiveFoundThisTurn))
            ActiveFoundThisTurn.push(Curr.plus(Point.SOUTH_WEST));

          if (!DungeonCrawler.isCheckedList(Curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(Curr);
            this.setChecked(Curr);
          }

          RoomSquaresActive.splice(actIt, 1); //erase Curr from the active list and increment iterator
          actIt++;
        } else if (numberFound ==
          1) {//this one is a door candidate and so is held back and processed again when we don't find multiples any more
          actIt++;
        } else {
          console.assert(numberFound === 0);    //overly cautious, right?
          if (!DungeonCrawler.isCheckedList(Curr, RoomSquaresChecked)) {
            RoomSquaresChecked.push(Curr);
            this.setChecked(Curr);
          }

          RoomSquaresActive.splice(actIt, 1);   //erase Curr from the active list and increment iterator
          actIt++;
        }

        if (RoomSquaresChecked.length > maxRS)
          return false;
      }//end for loop

      //merge newly found actives into list
      for (let Curr of ActiveFoundThisTurn) {
        if ((this.getMap(Curr) === CellType.GUARANTEED_OPEN) || (this.getMap(Curr) === CellType.NON_JOIN_GUARANTEED_OPEN))
          return false;   //to prevent us from building rooms that enclose exits... exits always have G_OPEN squares!!!
        if (!DungeonCrawler.isCheckedList(Curr, RoomSquaresChecked) && !DungeonCrawler.isActive(Curr, RoomSquaresActive))
          RoomSquaresActive.push(Curr);
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
        if ((this.getMap(curr) === CellType.GUARANTEED_OPEN) || (this.getMap(curr) === CellType.NON_JOIN_GUARANTEED_OPEN))
          return false;   //to prevent us from building rooms that enclose exits... exits always have G_OPEN squares!!!
        if (!DungeonCrawler.isCheckedList(curr, RoomSquaresChecked) && !DungeonCrawler.isActive(curr, RoomSquaresActive))
          RoomSquaresActive.push(curr);
      }
      ActiveFoundThisTurn.splice(0, ActiveFoundThisTurn.length);
    }//proceeding

    if (squaresFindingMultiples > 1)
      return false;   //this has several openings, and may thus be not a room, but a passage
    else if (squaresFindingMultiples === 0) {//this can happen when two Crawlers that are seeded into tunnels close on each other, a closed room is created - fill it!
      console.assert(RoomSquaresChecked.length > 0);  //make sure of this if violated
      console.log("FILLING CLOSED ROOM");
      for (let i: number = 0; i !== RoomSquaresChecked.length; i++) {
        console.assert((this.getMap(RoomSquaresChecked[i]) === CellType.OPEN) || (this.getMap(RoomSquaresChecked[i]) === CellType.NON_JOIN_OPEN) ||
          (this.getMap(RoomSquaresChecked[i]) === CellType.INSIDE_TUNNEL_OPEN) || (this.getMap(RoomSquaresChecked[i]) === CellType.INSIDE_ANTEROOM_OPEN));
        this.setMap(RoomSquaresChecked[i], CellType.CLOSED);
      }
    } else {//build a room
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

      if (this.getMap(curr.plus(Point.WEST)) === CellType.V_DOOR || this.getMap(curr.plus(Point.EAST)) === CellType.V_DOOR ||
        this.getMap(curr.plus(Point.WEST)) === CellType.H_DOOR || this.getMap(curr.plus(Point.EAST)) === CellType.H_DOOR ||
        this.getMap(curr.plus(Point.NORTH)) === CellType.V_DOOR || this.getMap(curr.plus(Point.SOUTH)) === CellType.V_DOOR ||
        this.getMap(curr.plus(Point.NORTH)) === CellType.H_DOOR || this.getMap(curr.plus(Point.SOUTH)) === CellType.H_DOOR)
        return false;

      if (RoomSquaresChecked.length < this.config.mediumRoomSize)
        if (!this.isMoreRoomsLabyrinth(RoomSize.SMALL))
          return false;
        else
          this.currSmallRoomsLabyrinth++;
      else if (RoomSquaresChecked.length < this.config.largeRoomSize)
        if (!this.isMoreRoomsLabyrinth(RoomSize.MEDIUM))
          return false;
        else
          this.currMediumRoomsLabyrinth++;
      else if (RoomSquaresChecked.length < this.config.maxRoomSize)
        if (!this.isMoreRoomsLabyrinth(RoomSize.LARGE))
          return false;
        else
          this.currLargeRoomsLabyrinth++;
      else
        return false;  //room too big, we don't want it

      console.assert(RoomSquaresActive.length === 1);
      curr = RoomSquaresActive[0];
      if (this.isOpen(curr.plus(Point.NORTH))) {
        console.assert(this.isOpen(curr.plus(Point.SOUTH)));
        this.setMap(curr, CellType.H_DOOR);
      } else if (this.isOpen(curr.plus(Point.WEST))) {
        console.assert(this.isOpen(curr.plus(Point.EAST)));
        this.setMap(curr, CellType.V_DOOR);
      }

      let newRoom: Room = new Room();

      for (let i: number = 0; i !== RoomSquaresChecked.length; i++) {
        console.assert((this.getMap(RoomSquaresChecked[i]) === CellType.OPEN) || (this.getMap(RoomSquaresChecked[i]) === CellType.NON_JOIN_OPEN) ||
          (this.getMap(RoomSquaresChecked[i]) === CellType.INSIDE_TUNNEL_OPEN) || (this.getMap(RoomSquaresChecked[i]) === CellType.INSIDE_ANTEROOM_OPEN));
        this.setMap(RoomSquaresChecked[i], CellType.INSIDE_ROOM_OPEN);
        newRoom.inside.push(RoomSquaresChecked[i]);
      }

      newRoom.inDungeon = false;  //this room is not in the dungeon, but in the labyrinth
      this.rooms.push(newRoom);
    }
    return true;
  }

  generate(): void {
    //create the dungeon
    while (true) {
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
      while (true) {
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
    if (this.config.background === CellType.OPEN) {
      let rect = new FillRect(0, 0, this.config.width, this.config.height, this.config.background);
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
    for (let rect of this.config.design) {
      if (rect.type !== CellType.OPEN)
        continue;   //we onlt make rooms in the labyrinth part

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

    ///////////////////////////////////////////////////////////////////////////
    //PlonkDownStuff is included for demo purposes to show how to access rooms and tunnels
    //you should write your own version of this function
    //PlonkDownStuff();
    /////////////////////////////////HERE ATTENTION !!
    //PutPlonkOnMap();
    //////////////////////////////////////////////////
    ///* ATTENTION: In this version, the method  PutPlonkOnMap() puts MOBs and treasure on the map literally, by changing the SquareData of the Map square where the stuff goes. This is just for demonstration purposes to make it easier to show stuff without having an engine for rendering objects. If you use the DungeonCrawler in your own program, you must refrain from calling this function, and instead write your own function that puts stuff on the map as objects and leaves the MapData as it is.
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  }

  debug(): void {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = this.config.width * scale;
    canvas.height = this.config.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        let color = 'rgb(0,0,0)';
        switch (this.getMap({x: x, y: y})) {
          case CellType.OPEN:
            color = 'rgb(26,255,0)';
            break;
          case CellType.CLOSED:
            color = 'rgb(255,248,0)';
            break;
          case CellType.GUARANTEED_OPEN:
            color = 'rgb(255,157,0)';
            break;
          case CellType.GUARANTEED_CLOSED:
            color = 'rgb(255,50,0)';
            break;
          case CellType.NON_JOIN_OPEN:
            color = 'rgb(255,0,62)';
            break;
          case CellType.NON_JOIN_CLOSED:
            color = 'rgb(255,0,134)';
            break;
          case CellType.NON_JOIN_GUARANTEED_OPEN:
            color = 'rgb(224,0,255)';
            break;
          case CellType.NON_JOIN_GUARANTEED_CLOSED:
            color = 'rgb(126,0,255)';
            break;
          case CellType.INSIDE_ROOM_OPEN:
            color = 'rgb(60,0,255)';
            break;
          case CellType.INSIDE_TUNNEL_OPEN:
            color = 'rgb(0,0,255)';
            break;
          case CellType.INSIDE_ANTEROOM_OPEN:
            color = 'rgb(0,78,255)';
            break;
          case CellType.H_DOOR:
            color = 'rgb(0,145,255)';
            break;
          case CellType.V_DOOR:
            color = 'rgb(0,204,255)';
            break;
          case CellType.MOB1:
            color = 'rgb(0,255,189)';
            break;
          case CellType.MOB2:
            color = 'rgb(1,255,102)';
            break;
          case CellType.MOB3:
            color = 'rgb(36,255,0)';
            break;
          case CellType.TREASURE_1:
            color = 'rgb(130,255,0)';
            break;
          case CellType.TREASURE_2:
            color = 'rgb(253,255,146)';
            break;
          case CellType.TREASURE_3:
            color = 'rgb(158,210,106)';
            break;
          case CellType.COLUMN:
            color = 'rgb(138,108,46)';
            break;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    console.log('%c ', `
      font-size: 1px;
      padding: ${canvas.height / 2}px ${canvas.width / 2}px;
      background: no-repeat url(${canvas.toDataURL('image/png')});
      background-size: ${canvas.width}px ${canvas.height}px;
    `);
  }
}