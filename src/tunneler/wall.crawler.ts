import {TunnelerCellType, Point} from "./model";
import {DungeonCrawler} from "./dungeon.crawler";
import {Crawler} from "./crawler";
import {RNG} from "../rng";

export class WallCrawler extends Crawler {
  private readonly intendedDirection: Point; // intended Direction, the direction the Crawler should be heading (0 , 0) <==> can head anywhere
  private readonly stepLength: number;       // maximal number of wall tiles this crawler can lay down in one iteration
  private readonly opening: number;          // opening = 1 <==> leave opening at end of wall = 0 no opening in this wall
  private readonly corridorWidth: number;
  private readonly straightSingleSpawnProbability: number; // probability to make a single child when going straight
  private readonly straightDoubleSpawnProbability: number; // probability to make two children when going straight
  private readonly turnSingleSpawnProbability: number;     // probability to make a single child when turning
  private readonly turnDoubleSpawnProbability: number;     // probability to make two children when turning (=changing direction)
  private readonly changeDirectionProbability: number;

  constructor(rng: RNG, dungeonCrawler: DungeonCrawler, location: Point, direction: Point, age: number, maxAge: number, generation: number,
              intendedDirection: Point, stepLength: number, opening: number,
              corridorWidth: number, straightSingleSpawnProbability: number, straightDoubleSpawnProbability: number,
              turnSingleSpawnProbability: number, turnDoubleSpawnProbability: number, changeDirectionProbability: number) {
    super(rng, dungeonCrawler, location, direction, age, maxAge, generation);
    this.intendedDirection = intendedDirection;
    this.stepLength = stepLength;
    this.opening = opening;
    this.corridorWidth = corridorWidth;
    this.straightSingleSpawnProbability = straightSingleSpawnProbability;
    this.straightDoubleSpawnProbability = straightDoubleSpawnProbability;
    this.turnSingleSpawnProbability = turnSingleSpawnProbability;
    this.turnDoubleSpawnProbability = turnDoubleSpawnProbability;
    this.changeDirectionProbability = changeDirectionProbability;

    console.assert(corridorWidth >= 0);
  }

  protected freePredicate(type: TunnelerCellType): boolean {
    if (this.config.crawlersInTunnels && this.config.crawlersInAnterooms) {
      // here we're also allowing IT_OPEN and IA_OPEN
      if (!this.contains(type, TunnelerCellType.OPEN, TunnelerCellType.NON_JOIN_OPEN, TunnelerCellType.GUARANTEED_OPEN,
        TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN, TunnelerCellType.NON_JOIN_GUARANTEED_OPEN)) {
        // encountered a non-floor square
        return true;
      }
    } else if (this.config.crawlersInTunnels) {
      // here we're also allowing IT_OPEN but not IA_OPEN
      if (!this.contains(type, TunnelerCellType.OPEN, TunnelerCellType.NON_JOIN_OPEN, TunnelerCellType.GUARANTEED_OPEN,
        TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.NON_JOIN_GUARANTEED_OPEN)) {
        // encountered a non-floor square
        return true;
      }
    } else {
      if (!this.contains(type, TunnelerCellType.OPEN, TunnelerCellType.NON_JOIN_OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.NON_JOIN_GUARANTEED_OPEN)) {
        // encountered a non-floor square
        return true;
      }
    }
    return false;
  }

  // determines how many rows ahead are free to build in, leaving the
  // clearances leftFree and rightFree; Upon returning, leftFree and rightFree give info on
  // how many columns to the left and right are *actually* buildable
  // (the returned values must be >= those that were passed in initially)
  // to check ahead of a crawler, pass in location for position, and direction for heading
  stepAhead(): boolean {
    if (this.generation !== this.dungeonCrawler.activeGeneration) {
      console.assert(this.generation > this.dungeonCrawler.activeGeneration);  //make sure all old ones are actually deleted
      return true;  //nothing's done with crawlers of different generations
    }

    //if age >= maxAge, the crawler returns false and will be deleted
    //if age < 0 the crawler returns true so as not to be deleted, but does not perform a step - it is dormant
    this.age++;
    if (this.age >= this.maxAge) {
      return false;
    } else if (this.age < 0) {
      return true;
    }

    //this builds a section of wall and possibly a room, positions the crawler at a new spot, and may create new crawlers
    let [frontFree, leftFree, rightFree] = this.frontFree(this.location, this.direction, this.corridorWidth, this.corridorWidth);

    const right = this.rightDirection();
    const left = right.negative;
    let test = right;

    //if we want to join up with a wall up front, do so now
    if ((this.opening === 0) && (frontFree < this.config.joinDistance)) {
      if (this.join(frontFree)) {
        // the wall has been joined, the crawler will be deleted
        return false;
      }
    }

    let tilesLaid = this.stepLength;
    if (frontFree > this.corridorWidth) {
      //we can place at least one wall tile without becoming too narrow
      //we build wall tiles in the heading of the crawler - determine how many
      if ((frontFree - this.corridorWidth) < this.stepLength) {
        tilesLaid = frontFree - this.corridorWidth;
      }

      for (let i = 1; i <= tilesLaid; i++) {
        test = this.location.plus(this.direction.multiply(i));
        if (this.opening === 1) {
          this.dungeonCrawler.setMap(test, TunnelerCellType.CLOSED);
        } else {
          console.assert(this.opening === 0);
          this.dungeonCrawler.setMap(test, TunnelerCellType.NON_JOIN_CLOSED);  //otherwise closed spaces can form
        }
      }

      //now relocate the crawler at the front of this wall section, possibly changing direction
      //right now Test is where we laid the last floor tile, and where the crawler should move
      this.location = test;

      //now creating parameters needed for making children
      let diceRoll = this.rng.range(0, 100);
      let childGeneration = this.generation + 1;   //default
      let summedProbability = 0;
      for (let i = 0; i <= 10; i++) {
        summedProbability = summedProbability + this.getChildDelayProbabilityForGenerationCrawlers(i);
        if (diceRoll < summedProbability) {
          childGeneration = this.generation + i;
          break;
        }
      }
      //determine other parameters
      const options = {
        straightSingleSpawnProbability: this.dungeonCrawler.mutate(this.straightSingleSpawnProbability),
        straightDoubleSpawnProbability: this.dungeonCrawler.mutate(this.straightDoubleSpawnProbability),
        turnSingleSpawnProbability: this.dungeonCrawler.mutate(this.turnSingleSpawnProbability),
        turnDoubleSpawnProbability: this.dungeonCrawler.mutate(this.turnDoubleSpawnProbability),
        changeDirectionProbability: this.dungeonCrawler.mutate(this.changeDirectionProbability),
      };

      if (this.rng.range(0, 100) < this.changeDirectionProbability) {   //roll of the dice
        // change the direction
        // keep the old direction for future reference
        let oldDirection = this.direction;
        // first compare the current heading to the intended heading to see where we can go
        if (((this.intendedDirection.x === 0) && (this.intendedDirection.y === 0)) ||   //we can go anywhere
          ((this.intendedDirection.x === this.direction.x) && (this.intendedDirection.y === this.direction.y))) {//we can go left or right as we choose,  and go randomly in 50% of the cases
          let random = this.rng.range(0, 4);
          if (random === 0) {
            this.direction = right;
          } else if (random === 1) {
            this.direction = left;
          } else {
            // we go where there is more room
            if ((rightFree > leftFree) || ((rightFree === leftFree) && this.rng.boolean())) {
              this.direction = right;
            } else {
              this.direction = left;
            }
          }
        } else {
          // the intendedHeading leaves us no choice where to go
          if ((this.intendedDirection.x === 0) || (this.intendedDirection.y === 0)) {
            // the intended heading is one of the four pure directions, and our new heading must be the intended heading
            this.direction = this.intendedDirection;
          } else {
            // the intended heading must be in one of the four intermediate directions
            console.assert(!this.intendedDirection.equal(0, 0));
            this.direction = this.intendedDirection.minus(this.direction);
          }
        }

        // make children now
        if (this.rng.range(0, 100) < this.turnDoubleSpawnProbability) {
          this.spawnWallCrawler(this.direction.negative, this.direction.negative, childGeneration, options);
          this.spawnWallCrawler(oldDirection, oldDirection, childGeneration, options);
        } else if (this.rng.range(0, 100) < this.turnSingleSpawnProbability) {
          // create a child looking the other way
          this.spawnWallCrawler(this.direction.negative, this.direction.negative, childGeneration, options);
        }
      } else {
        // we keep going straight on

        // create child if appropriate
        if (this.rng.range(0, 100) < this.straightDoubleSpawnProbability) {
          // create two children
          this.spawnWallCrawler(right, right, childGeneration, options);
          this.spawnWallCrawler(left, left, childGeneration, options);
        } else if (this.rng.range(0, 100) < this.straightSingleSpawnProbability) {
          // create a child looking sideways
          if (leftFree > rightFree || leftFree === rightFree && this.rng.boolean()) {
            test = left;
          } else {
            test = right;
          }
          if (this.rng.range(0, 3) === 0) {
            //however, in a third of all cases, we choose the other side:
            test = test.negative;
          }
          this.spawnWallCrawler(test, test, childGeneration, options);
        }//end create single Crawler when going straight
      }//end we go straight, making children section
    } else {
      // frontFree <= corridorWidth

      //we relocate the crawler to look sideways, but only if there is more room that way
      if (this.direction.equals(this.intendedDirection) || this.intendedDirection.equal(0, 0)) {
        // we can relocate both ways, and check where we have more room

        // these are different from leftFree and rightFree
        let [rightFree] = this.frontFree(this.location, right, this.corridorWidth, this.corridorWidth);
        let [leftFree] = this.frontFree(this.location, left, this.corridorWidth, this.corridorWidth);

        if ((rightFree <= this.corridorWidth) && (leftFree <= this.corridorWidth)) {
          // we cannot relocate because there is not enough room either way to build
          return false;   // this crawler is toast!
        } else if ((rightFree > 2 * this.corridorWidth + 1) && (leftFree > 2 * this.corridorWidth + 1)) {
          // rightFree or leftFree must be > corridorWidth

          // lots of room on both sides, we choose randomly
          if (this.rng.boolean()) {
            this.direction = right;
          } else {
            this.direction = left;
          }
        } else if (rightFree > leftFree)
          this.direction = right;
        else if (leftFree > rightFree)
          this.direction = left;
        else if (this.rng.boolean()) { //rightFree === leftFree , we go randomly after all
          this.direction = right;
        } else {
          this.direction = left;
        }

        //well, which way is forward, right or left? the age old question, will it be answered here??

        //crawler has now been relocated
      } else {
        //we can relocate only in the direction of the intended heading
        if ((this.intendedDirection.x === 0) || (this.intendedDirection.y === 0)) {
          //the intended heading is one of the four pure directions, and our new heading must be the intended heading
          //check whether we have room enough there
          let [directionFree] = this.frontFree(this.location, this.intendedDirection, this.corridorWidth, this.corridorWidth);
          if (directionFree > this.corridorWidth) {
            this.direction = this.intendedDirection;
          } else {
            //we cannot relocate because there is not enough room either way to build
            //this crawler is toast
            return false;
          }
        } else {
          //the intended heading must be in one of the four intermediate directions
          console.assert(!this.intendedDirection.equal(0, 0));
          test = this.intendedDirection.minus(this.direction);   //only other possible heading
          let [testFree] = this.frontFree(this.location, test, this.corridorWidth, this.corridorWidth);
          if (testFree > this.corridorWidth) {
            this.direction = test;
          } else {
            //we cannot relocate because there is not enough room either way to build
            //this crawler is toast
            return false;
          }
        }
      }
    }
    return true; // to indicate success
  }

  private spawnWallCrawler(direction: Point,
                           intendedDirection: Point,
                           generation: number,
                           options: {
                             readonly straightSingleSpawnProbability: number
                             readonly straightDoubleSpawnProbability: number
                             readonly turnSingleSpawnProbability: number
                             readonly turnDoubleSpawnProbability: number
                             readonly changeDirectionProbability: number
                           }
  ): void {

    if (this.rng.range(0, 100) < this.config.noHeadingProbability) {
      intendedDirection = Point.ZERO;  //set to (0 , 0) to indicate no intended heading
    }

    this.dungeonCrawler.createWallCrawler(
      this.location,
      direction, 0,
      this.dungeonCrawler.getMaxAgeCrawlers(generation),
      generation,
      intendedDirection,
      this.dungeonCrawler.getStepLength(generation), 1,
      this.dungeonCrawler.getCorridorWidth(generation),
      options.straightSingleSpawnProbability,
      options.straightDoubleSpawnProbability,
      options.turnSingleSpawnProbability,
      options.turnDoubleSpawnProbability,
      options.changeDirectionProbability
    );
  }

  private join(frontFree: number) {
    // joins the wall made by this crawler to an existing wall if possible - returns true if successful, false if nothing was done
    // parameter frontFree is passed in to avoid having to compute it again - this must be the number of rows free in front of
    // the crawler as computed by LookAhead or we get bad results

    let right = this.rightDirection();

    // find the location of a wall tile in row frontFree + 1 - first we check straight ahead
    let test = this.location.plus(this.direction.multiply(frontFree + 1));
    if (!this.valid(test)) {
      // we have started outside the dungeon
      return false;
    }

    let type = this.dungeonCrawler.getMap(test);
    if (this.contains(type, TunnelerCellType.CLOSED, TunnelerCellType.GUARANTEED_CLOSED)) {
      //this is a joinable wall tile
      for (let i = 1; i <= frontFree; i++) {
        const point = this.location.plus(this.direction.multiply(i));
        if (!this.valid(point)) {
          return false;
        }
        // these guys cannot be joined, or closed spaces are possible
        this.dungeonCrawler.setMap(point, TunnelerCellType.NON_JOIN_CLOSED);
      }
      // the wall has been joined
      return true;
    } else if (this.contains(type, TunnelerCellType.NON_JOIN_CLOSED, TunnelerCellType.NON_JOIN_GUARANTEED_CLOSED)) {
      // a non-joinable type is straight ahead, we bail out
      return false;
    }

    //now we have to check sideways, which is much more difficult - however, if we don;t do that, too many walls stay unconnected
    let wall = new Point();
    let sidestep = 0;
    // checking the width of the corridor
    for (let i = 1; i <= this.corridorWidth; i++) {
      let point = this.location.plus(right.multiply(i)).plus(this.direction.multiply(frontFree + 1));
      if (!this.valid(point)) {
        // we have started outside the dungeon
        return false;
      }
      type = this.dungeonCrawler.getMap(point);
      if (this.contains(type, TunnelerCellType.CLOSED, TunnelerCellType.GUARANTEED_CLOSED, TunnelerCellType.NON_JOIN_CLOSED, TunnelerCellType.NON_JOIN_GUARANTEED_CLOSED)) {
        wall = point;
        sidestep = i;
        break;
      }

      // now the same thing towards the other side
      point = this.location.minus(right.multiply(i).plus(this.direction.multiply(frontFree + 1)));
      if (!this.valid(point)) {
        // we have started outside the dungeon
        return false;
      }
      type = this.dungeonCrawler.getMap(point);
      if (this.contains(type, TunnelerCellType.CLOSED, TunnelerCellType.GUARANTEED_CLOSED, TunnelerCellType.NON_JOIN_CLOSED, TunnelerCellType.NON_JOIN_GUARANTEED_CLOSED)) {
        wall = point;
        sidestep = -i;
        break;
      }
    }

    if ((wall.x !== 0) || (wall.y !== 0)) {
      // we must have found a wall tile, or else the value of frontFree was wrong
      // that's assuming we passed in corrWidth for leftFree and rightFree ---   DO THAT ALWAYS
      // in rare instances wew return from here, wonder why
      return false;
    }
    if (sidestep !== 0) {
      // failed assert replaced with this
      return false;
    }
    if (this.contains(type, TunnelerCellType.NON_JOIN_CLOSED, TunnelerCellType.NON_JOIN_GUARANTEED_CLOSED)) {
      // this is a grid type that we cannot connect a wall to
      return false;
    }

    // if we get here, Wall is the position of a joinable wall tile.
    // Now check whether we can get there without blocking paths to the side
    // int mCW = pDungeonMaker -> ShowMCW();
    // if we use the current corridorWidth, too many Crawlers never close their walls
    if (sidestep < 0) {
      // Wall is to the left, look rig
      test = right;
    } else {
      // Wall is to the right, look left
      test = right.negative;
    }

    //if free >= 1 + abs(sidestep) we can build a connecting wall without blocking another corridor
    let [free] = this.frontFree(wall, test, 1, 1);
    let abs_sidestep: number;
    let factor_sidestep: number;
    if (sidestep > 0) {
      abs_sidestep = sidestep;
      factor_sidestep = 1;
    } else {
      abs_sidestep = -sidestep;
      factor_sidestep = -1;
    }
    if (free < abs_sidestep + 1) {
      return false;
    }

    // if we get here there is enough room to construct the connecting wall, so we do it
    for (let i = 1; i <= frontFree + 1; i++) {
      const point = this.location.plus(this.direction.multiply(i));
      if (!this.valid(point)) {
        // we have started outside the dungeon
        return false;
      }
      this.dungeonCrawler.setMap(point, TunnelerCellType.NON_JOIN_CLOSED);
    }
    // this has built the straight section direction, now turn left or right
    for (let i = 1; i < abs_sidestep; i++) {
      const point = this.location.plus(right.multiply(i * factor_sidestep)).plus(this.direction.multiply(frontFree + 1));
      if (!this.valid(point)) {
        // we have started outside the dungeon
        return false;
      }
      // we have started outside the dungeon
      this.dungeonCrawler.setMap(point, TunnelerCellType.NON_JOIN_CLOSED);
    }

    // the wall hath been joined !! (we hope)
    return true;
  }

  private getChildDelayProbabilityForGenerationCrawlers(generation: number): number {
    if ((0 <= generation) && (generation <= 10)) {
      return this.config.childDelayProbabilityForGenerationCrawlers[generation];
    } else {
      return 0;
    }
  }
}