import {TunnelerCellType, Point, RoomSize} from "./model";
import {DungeonCrawler} from "./dungeon.crawler";
import {Crawler} from "./crawler";
import {RNG} from "../rng";

export class TunnelCrawler extends Crawler {
  private readonly _intendedDirection: Point;    // intended Direction, the direction the tunnel crawler should be heading
  // (0 , 0) <==> can head anywhere
  private readonly _stepLength: number;                // maximal length of tunnel for one iteration
  private readonly _tunnelWidth: number;               // actual width is 1 + 2*tunnelWidth, ensuring all width's are uneven numbers
  //with a well defined center where the tunnel crawler resideth
  private readonly _straightDoubleSpawnProbability: number;   //probability to make two children when going straight
  private readonly _turnDoubleSpawnProbability: number;       //probability to make two children when turning (=changing direction)
  //in both the above cases an anteroom is produced, and one or both of the spawns can be room crawlers
  //whether room crawlers are produced is governed by the dungeon crawler class based on need for rooms and the "patience"-param
  private readonly _changeDirectionProbability: number;

  private readonly _makeRoomsRightProbability: number; // prob to make a small room off to the right side IN THE MIDDLE OF ONE STEP
  private readonly _makeRoomsLeftProbability: number;  // prob to make a small room off to the left side IN THE MIDDLE OF ONE STEP
  // these are small rooms that at high probabilities typically follow each other like rooms on a corridor

  private readonly _joinPreference: number; // when time comes to join another tunnel or to make a terminating room, this preference decides
  // 0 <==> make room always;   100 <==> join always; joinPreference is probability to call Join-method

  constructor(rng: RNG, dungeonCrawler: DungeonCrawler, location: Point, direction: Point, age: number, maxAge: number, generation: number,
              intendedDirection: Point, stepLength: number, tunnelWidth: number, straightDoubleSpawnProbability: number, turnDoubleSpawnProbability: number,
              changeDirectionProbability: number, makeRoomsRightProbability: number, makeRoomsLeftProbability: number, joinPreference: number) {
    super(rng, dungeonCrawler, location, direction, age, maxAge, generation);

    this._intendedDirection = intendedDirection;
    this._stepLength = stepLength;
    this._tunnelWidth = tunnelWidth;
    this._straightDoubleSpawnProbability = straightDoubleSpawnProbability;
    this._turnDoubleSpawnProbability = turnDoubleSpawnProbability;
    this._changeDirectionProbability = changeDirectionProbability;
    this._makeRoomsRightProbability = makeRoomsRightProbability;
    this._makeRoomsLeftProbability = makeRoomsLeftProbability;
    this._joinPreference = joinPreference;
  }

  stepAhead(): boolean {
    const dungeonCrawler = this.dungeonCrawler;
    if (this.generation !== dungeonCrawler.activeGeneration) {
      console.assert(this.generation > dungeonCrawler.activeGeneration);  //make sure all old ones are actually deleted
      return true;  //nothing's done with crawlers of different generations
    }

    //if age >= maxAge, the crawler returns false and will be deleted
    //if age < 0 the crawler returns true so as not to be deleted, but does not perform a step - it is dormant

    this.age++;
    if (this.age >= this.maxAge)
      return false;
    else if (this.age < 0)
      return true;

    console.assert(this._tunnelWidth >= 0);
    const [frontFree, leftFree, rightFree] = this.frontFree(this.location, this.direction, this._tunnelWidth + 1, this._tunnelWidth + 1);
    if (frontFree === 0) {
      return false; // can't do a thing, eliminate this tunnel crawler
    }

    const [sizeSideways, sizeBranching] = this.sidewaysBranchingRoomSizes();

    const right = this.rightDirection();
    const left = right.negative;

    // now... creating parameters needed for making room crawlers
    const roomGeneration = this.roomGeneration();

    // if room is running out, or maxAge is reached, join or build terminating room
    if ((frontFree < (2 * this._stepLength)) || ((this.maxAge - 1) === this.age)) {
      return this.joinOrBuildTerminatingRoom(sizeBranching, frontFree, leftFree, rightFree, right, left);
    }

    // if we get here, we must have:
    console.assert(frontFree >= 2 * this._stepLength);

    console.assert(this._stepLength > 0);
    this.buildTunnel(this._stepLength, this._tunnelWidth);
    // build side rooms if desired
    if (this.rng.range(0, 100) < this._makeRoomsRightProbability) {
      const spawnPoint = this.location.plus(this.direction.multiply((this._stepLength >> 1 + 1))).plus(right.multiply(this._tunnelWidth));
      // use this and right in room crawler;
      // let it execute with one step delay, to let the tunnel crawler get ahead, possibly going sideways and blocking room
      this.spawnRoomCrawler(spawnPoint, right, -1, 2, roomGeneration, sizeSideways, false);
    }
    if (this.rng.range(0, 100) < this._makeRoomsLeftProbability) {
      const spawnPoint = this.location.plus(this.direction.multiply((this._stepLength >> 1 + 1))).plus(left.multiply(this._tunnelWidth));
      // use this and left in room crawler;
      // let it execute with one step delay, to let the tunnel crawler get ahead, possibly going sideways and blocking room
      this.spawnRoomCrawler(spawnPoint, left, -1, 2, roomGeneration, sizeSideways, false);
    }

    //relocate the tunnel crawler to the front of the new tunnel section
    this.location = this.location.plus(this.direction.multiply(this._stepLength));

    const smallAnteroomPossible = this.isAnteroomPossible(right, this._tunnelWidth + 2, this._tunnelWidth + 2, 2 * this._tunnelWidth + 5);
    const largeAnteroomPossible = this.isAnteroomPossible(right, this._tunnelWidth + 3, this._tunnelWidth + 3, 2 * this._tunnelWidth + 7);

    let sizeUpTunnel = false;
    let sizeDownTunnel = false;
    const diceRoll = this.rng.range(0, 100);
    const sizeUpProbability = this.getSizeUpProbability(this.generation);
    const sizeDownProbability = sizeUpProbability + this.getSizeDownProbability(this.generation);
    if (diceRoll < sizeUpProbability) {
      sizeUpTunnel = true;
    } else if (diceRoll < sizeDownProbability) {
      sizeDownTunnel = true;
    }
    // if none if these is true, we stay at the same tunnel size

    if (sizeUpTunnel && !largeAnteroomPossible) {
      // we cannot build the anteroom we need, thus we don't branch here
      return true;
    }

    // but we may want to change direction
    const changeDirection = this.isChangeDirection();
    const doSpawn = this.isSpawn(changeDirection);
    if (!changeDirection && !doSpawn) {
      // nothing else to do
      return true;
    }

    const doSpawnRoom = this.isSpawnRoom(doSpawn);

    // now creating parameters needed for making children
    const diceRollSpawn = this.rng.range(0, 100);
    let childGeneration = this.generation + 1; // default
    if (doSpawn) {
      if (!sizeUpTunnel) {
        let summedProbability = 0;
        for (let i = 0; i <= 10; i++) {
          summedProbability = summedProbability + this.getChildDelayProbabilityForGenerationTunnelCrawlers(i);
          if (diceRollSpawn < summedProbability) {
            childGeneration = this.generation + i;
            break;
          }
        }
      } else {
        // these get special fast treatment:
        childGeneration = this.generation + this.config.sizeUpGenDelay;
      }
    }

    const options = this.mutateOptions();
    const spawnPoints = this.determineSpawnPoints(sizeUpTunnel, doSpawn, smallAnteroomPossible, right, left);
    if (spawnPoints === true) {
      return true;
    }
    const [spawnPointDirection, spawnPointRight, spawnPointLeft, builtAnteroom] = spawnPoints;

    // locations on the anteroom where tunnel crawler will be spawned or repositioned
    let usedRight = false;
    let usedLeft = false; // to keep track which points have been used

    // keep the old direction for future reference
    const oldDirection = this.direction;   // in case direction changes we will need this

    let goStraight = false; // straight (direct) line
    if (changeDirection) {
      // change the direction
      // first check for available space
      const [frontFreeRight] = this.frontFree(spawnPointRight, right, this._tunnelWidth + 1, this._tunnelWidth + 1);
      const [frontFreeLeft] = this.frontFree(spawnPointLeft, left, this._tunnelWidth + 1, this._tunnelWidth + 1);

      if (this._intendedDirection.equal(0, 0) || this._intendedDirection.equals(this.direction)) {
        // we can go left or right as we choose
        if ((!sizeUpTunnel) || (!doSpawn)) {
          // we go where there is more room
          if ((frontFreeRight > frontFreeLeft) || ((frontFreeRight === frontFreeLeft) && this.rng.boolean())) {
            if (frontFreeRight > 0) {
              this.location = spawnPointRight;
              this.direction = right;
              usedRight = true;
            }
          } else if (frontFreeLeft > 0) {
            this.location = spawnPointLeft;
            this.direction = left;
            usedLeft = true;
          }
        } else {
          // we spawn a child with a larger this.tunnelWidth param
          // we go where there is less room to leave the greater room for the large child
          console.assert(doSpawn); // check whether this always holds, otherwise switch here
          if ((frontFreeRight < frontFreeLeft) || ((frontFreeRight === frontFreeLeft) && this.rng.boolean())) {
            if (frontFreeRight > 0) {
              this.location = spawnPointRight;
              this.direction = right;
              usedRight = true;
            }
          } else if (frontFreeLeft > 0) {
            this.location = spawnPointLeft;
            this.direction = left;
            usedLeft = true;
          }
        }
      } else {
        // the intendedHeading leaves us no choice where to go
        if ((this._intendedDirection.x === 0) || (this._intendedDirection.y === 0)) {
          // the intended heading is one of the four pure directions, and our new heading must be the intended heading
          this.direction = this._intendedDirection;
          if ((this.direction.equals(right))) {
            if (frontFreeRight > 0) {
              usedRight = true;
              this.location = spawnPointRight;
            }
          } else if (frontFreeLeft > 0) {
            console.assert(this.direction.equals(left));
            this.location = spawnPointLeft;
            usedLeft = true;
          }
        } else {
          // the intended heading must be in one of the four intermediate directions
          console.assert(!this._intendedDirection.equal(0, 0));
          this.direction = this._intendedDirection.minus(this.direction);
          if (this.direction.equals(right)) {
            if (frontFreeRight > 0) {
              usedRight = true;
              this.location = spawnPointRight;
            }
          } else if (frontFreeLeft > 0) {
            console.assert(this.direction.equals(left));
            this.location = spawnPointLeft;
            usedLeft = true;
          }
        }
      }

      // make 2 children now
      if (doSpawn) {
        let spawnPoint: Point = Point.ZERO;
        let spawnDirection: Point = Point.ZERO;
        if (usedLeft) {
          spawnPoint = spawnPointRight;
          spawnDirection = right;
        } else if (usedRight) {
          spawnPoint = spawnPointLeft;
          spawnDirection = left;
        } else {
          // we could not change direction for lack of space, going straight instead
          goStraight = true;
        }

        if (!goStraight) {
          const diceRoll = this.rng.range(0, 100);
          // first spawning to the left or right (the way the old tunnel crawler didn't take):
          if (doSpawnRoom && (diceRoll < 50)) {
            this.spawnRoomCrawler(spawnPoint, spawnDirection, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
          } else {
            // let it execute right away
            this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPoint, spawnDirection, childGeneration, spawnDirection, options);
          }

          // now spawning in the old direction
          if (doSpawnRoom && (diceRoll >= 50)) {
            this.spawnRoomCrawler(spawnPointDirection, oldDirection, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
          } else {
            this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPointDirection, oldDirection, childGeneration, oldDirection, options);
          }
        }
      }
    } else {
      goStraight = true;
    }

    if (goStraight) {
      // first relocate the tunnel crawler:
      this.location = spawnPointDirection;
      // now create children if appropriate
      const diceRoll = this.rng.range(0, 100);

      // first spawning to the right:
      if (doSpawnRoom && (diceRoll < 50)) {
        this.spawnRoomCrawler(spawnPointRight, right, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
      } else {
        this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPointRight, right, childGeneration, right, options);
      }

      // now spawning to the left:
      if (doSpawnRoom && (diceRoll >= 50)) {
        this.spawnRoomCrawler(spawnPointRight, left, 0, 2, roomGeneration, sizeBranching, builtAnteroom);
      } else {
        this.spawnTunnelCrawler(sizeUpTunnel, sizeDownTunnel, spawnPointLeft, left, childGeneration, left, options);
      }
    }

    // to indicate success
    return true;
  }

  private isAnteroomPossible(right: Point, leftFree: number, rightFree: number, minFrontFree: number): boolean {
    const dungeonCrawler = this.dungeonCrawler;
    let anteroomPossible = false;
    console.assert(this._tunnelWidth >= 0);
    console.assert(dungeonCrawler.getMap(this.location) === TunnelerCellType.INSIDE_TUNNEL_OPEN);

    // temporary, so we can step back to see it's free in our own row
    dungeonCrawler.setMap(this.location, TunnelerCellType.CLOSED);
    for (let m = 1; m <= this._tunnelWidth; m++) {
      console.assert(dungeonCrawler.getMap(this.location.plus(right.multiply(m))) === TunnelerCellType.INSIDE_TUNNEL_OPEN);
      console.assert(dungeonCrawler.getMap(this.location.minus(right.multiply(m))) === TunnelerCellType.INSIDE_TUNNEL_OPEN);
      dungeonCrawler.setMap(this.location.plus(right.multiply(m)), TunnelerCellType.CLOSED);
      dungeonCrawler.setMap(this.location.minus(right.multiply(m)), TunnelerCellType.CLOSED);
    }

    const [frontFree] = this.frontFree(this.location.minus(this.direction), this.direction, leftFree, rightFree);
    if (frontFree >= minFrontFree) {
      anteroomPossible = true;
    }
    // revert
    dungeonCrawler.setMap(this.location, TunnelerCellType.INSIDE_TUNNEL_OPEN);
    for (let m = 1; m <= this._tunnelWidth; m++) {
      dungeonCrawler.setMap(this.location.plus(right.multiply(m)), TunnelerCellType.INSIDE_TUNNEL_OPEN);
      dungeonCrawler.setMap(this.location.minus(right.multiply(m)), TunnelerCellType.INSIDE_TUNNEL_OPEN);
    }

    return anteroomPossible;
  }

  private determineSpawnPoints(
    sizeUpTunnel: boolean,
    doSpawn: boolean,
    smallAnteroomPossible: boolean,
    right: Point,
    left: Point,
  ): true | [Point, Point, Point, boolean] {
    const dungeonCrawler = this.dungeonCrawler;
    if (sizeUpTunnel) {
      if (this.rng.range(0, 100) < this.getAnteroomProbability(this._tunnelWidth) || doSpawn) {
        // if we spawn this would look weird without anteroom
        const result = this.buildAnteroom(2 * this._tunnelWidth + 5, this._tunnelWidth + 2);
        console.assert(result);
        const spawnDirection = this.location.plus(this.direction.multiply(2 * this._tunnelWidth + 5));
        const spawnRight = this.location.plus(this.direction.multiply(this._tunnelWidth + 3)).plus(right.multiply(this._tunnelWidth + 2));
        const spawnLeft = this.location.plus(this.direction.multiply(this._tunnelWidth + 3)).plus(left.multiply(this._tunnelWidth + 2));
        return [spawnDirection, spawnRight, spawnLeft, true];
      }
    } else {
      if (this.rng.range(0, 100) < this.getAnteroomProbability(this._tunnelWidth) && smallAnteroomPossible) {
        const result = this.buildAnteroom(2 * this._tunnelWidth + 3, this._tunnelWidth + 1);
        console.assert(result);
        const spawnDirection = this.location.plus(this.direction.multiply(2 * this._tunnelWidth + 3));
        const spawnRight = this.location.plus(this.direction.multiply(this._tunnelWidth + 2)).plus(right.multiply(this._tunnelWidth + 1));
        const spawnLeft = this.location.plus(this.direction.multiply(this._tunnelWidth + 2)).plus(left.multiply(this._tunnelWidth + 1));
        return [spawnDirection, spawnRight, spawnLeft, true];
      }
    }

    // determine spawn points without anteroom:
    const spawnDirection = this.location;
    const spawnRight = this.location.minus(this.direction.multiply(this._tunnelWidth)).plus(right.multiply(this._tunnelWidth));
    const spawnLeft = this.location.minus(this.direction.multiply(this._tunnelWidth)).plus(left.multiply(this._tunnelWidth));
    if (this.dungeonCrawler.getMap(spawnRight) !== TunnelerCellType.INSIDE_TUNNEL_OPEN ||
      dungeonCrawler.getMap(spawnLeft) !== TunnelerCellType.INSIDE_TUNNEL_OPEN) {
      // we didn't make a long enough step so we cannot really go back on this tunnel, bail out!
      return true;
    } else {
      return [spawnDirection, spawnRight, spawnLeft, false];
    }
  }

  private joinOrBuildTerminatingRoom(sizeBranching: RoomSize, frontFree: number, leftFree: number, rightFree: number,
                                     right: Point, left: Point): boolean {
    const dungeonCrawler = this.dungeonCrawler;

    // first check out what's ahead of us
    let guaranteedClosedAhead = false;
    let openAhead = false;
    let roomAhead = false;

    // first see whether we can join straight ahead at full width
    let count = 0;
    for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
      const test = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i));
      const cell = dungeonCrawler.getMap(test);
      if (this.contains(cell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN)) {
        openAhead = true;
        count++;
      } else if (this.contains(cell, TunnelerCellType.GUARANTEED_CLOSED, TunnelerCellType.NON_JOIN_GUARANTEED_CLOSED)) {
        guaranteedClosedAhead = true;
        // start counting fresh, we only want consecutive OPEN squares counted
        count = 0;
      } else if (cell === TunnelerCellType.INSIDE_ROOM_OPEN) {
        roomAhead = true;
        // start counting fresh, we only want consecutive OPEN squares counted
        count = 0;
      } else
        count = 0;
    }

    // if we try to join because reaching maxAge, we must also check that the distance to the tunnel to be joined is not too large:
    if ((this.rng.range(0, 100) <= this._joinPreference) &&
      // if this is true, we don't have enough room to build a room and must join in any case
      ((this.age < this.maxAge - 1) || (frontFree <= this.config.tunnelJoinDist)) || frontFree < 5) {
      const result = this.joinOtherTunnel(count, frontFree, leftFree, rightFree, openAhead, roomAhead, guaranteedClosedAhead, right);
      if (result != null) {
        return result;
      }
      // we give up, we have failed in our attempt to join, so let's try and build a room instead
    }

    // if we get here we build a room, if we want one
    if (dungeonCrawler.isMoreRoomsDungeon(sizeBranching)) {
      this.spawnRoomCrawler(this.location, this.direction, 0, 2, this.generation, sizeBranching, false);
    }

    // also, in case this room crawler fails or wasn't created, let's create a tunnel crawler that executes a bit later:
    const joinPreference = this.rng.range(0, 11) * 10;
    if ((this._joinPreference !== 100) || (this._makeRoomsLeftProbability !== this.config.lastChanceTunnelCrawler.makeRoomsLeftProbability) ||
      (this._makeRoomsRightProbability !== this.config.lastChanceTunnelCrawler.makeRoomsRightProbability) ||
      (this._changeDirectionProbability !== this.config.lastChanceTunnelCrawler.changeDirectionProbability) ||
      (this._straightDoubleSpawnProbability !== this.config.lastChanceTunnelCrawler.straightDoubleSpawnProbability) ||
      (this._turnDoubleSpawnProbability !== this.config.lastChanceTunnelCrawler.turnDoubleSpawnProbability) ||
      (this._tunnelWidth !== 0)) // this condition prevents an infinite loop of tunnel crawlers creating identical children
    {
      const [frontFreeRight] = this.frontFree(this.location.plus(right.multiply(this._tunnelWidth)), right, this._tunnelWidth + 1, this._tunnelWidth + 1);
      const [frontFreeLeft] = this.frontFree(this.location.minus(right.multiply(this._tunnelWidth)), left, this._tunnelWidth + 1, this._tunnelWidth + 1);
      const [frontFreeBack] = this.frontFree(this.location, this.direction.negative, this._tunnelWidth + 1, this._tunnelWidth + 1);

      const fork = (location: Point, direction: Point, generation: number, intendedDirection: Point): void => {
        this.dungeonCrawler.createTunnelCrawler(location, direction, 0, this.maxAge,
          generation, intendedDirection, 3, 0,
          this.config.lastChanceTunnelCrawler.straightDoubleSpawnProbability, this.config.lastChanceTunnelCrawler.turnDoubleSpawnProbability,
          this.config.lastChanceTunnelCrawler.changeDirectionProbability, this.config.lastChanceTunnelCrawler.makeRoomsRightProbability,
          this.config.lastChanceTunnelCrawler.makeRoomsLeftProbability, joinPreference);
      };

      if (this._tunnelWidth === 0) {
        if ((this._makeRoomsLeftProbability === this.config.lastChanceTunnelCrawler.makeRoomsLeftProbability) &&
          (this._makeRoomsRightProbability === this.config.lastChanceTunnelCrawler.makeRoomsRightProbability) &&
          (this._changeDirectionProbability === this.config.lastChanceTunnelCrawler.changeDirectionProbability) &&
          (this._straightDoubleSpawnProbability === this.config.lastChanceTunnelCrawler.straightDoubleSpawnProbability) &&
          (this._turnDoubleSpawnProbability === this.config.lastChanceTunnelCrawler.turnDoubleSpawnProbability)) {
          //we have a child of one spawned here which may be stuck, so redirect it
          if (frontFree >= frontFreeRight && frontFree >= frontFreeLeft && frontFree >= frontFreeBack) {
            fork(this.location, this.direction, this.generation + 1, this.direction);
          } else if (frontFreeBack >= frontFreeRight && frontFreeBack >= frontFreeLeft) {
            fork(this.location, this.direction.negative, this.generation + this.config.genDelayLastChance, this.direction.negative);
          } else if (frontFreeRight >= frontFreeLeft || (frontFreeRight === frontFreeLeft) && (this.rng.range(0, 100) < 50)) {
            fork(this.location, right, this.generation + this.config.genDelayLastChance, right);
          } else {
            fork(this.location, left, this.generation + this.config.genDelayLastChance, left);
          }
        } else {
          fork(this.location, this.direction, this.generation + this.config.genDelayLastChance, this.direction);
        }
      } else {
        // here the forks at the end of wide tunnels get created
        if (guaranteedClosedAhead) {
          //we go left and right
          fork(this.location.plus(right.multiply(this._tunnelWidth)), right, this.generation + this.config.genDelayLastChance, right);
          fork(this.location.minus(right.multiply(this._tunnelWidth)), left, this.generation + this.config.genDelayLastChance, left);
        } else if (frontFreeRight >= frontFreeLeft || frontFreeRight === frontFreeLeft && this.rng.range(0, 100) < 50) {
          fork(this.location.plus(right.multiply(this._tunnelWidth)), right, this.generation + this.config.genDelayLastChance, right);
          fork(this.location.minus(right.multiply(this._tunnelWidth)), this.direction, this.generation + this.config.genDelayLastChance, this.direction);
        } else {
          fork(this.location.plus(right.multiply(this._tunnelWidth)), this.direction, this.generation + this.config.genDelayLastChance, this.direction);
          fork(this.location.minus(right.multiply(this._tunnelWidth)), this.direction, this.generation + this.config.genDelayLastChance, this.direction);
        }
      }
    }

    // end "room is running out or maxAge is reached"
    return false;
  }

  private joinOtherTunnel(
    count: number,
    frontFree: number,
    leftFree: number,
    rightFree: number,
    openAhead: boolean,
    roomAhead: boolean,
    guaranteedClosedAhead: boolean,
    right: Point
  ): boolean | null {
    const dungeonCrawler = this.dungeonCrawler;
    // try to join other tunnel
    // for the full width of the tunnel, we are faced with open squares
    if ((2 * this._tunnelWidth + 1) === count) {
      this.buildTunnel(frontFree, this._tunnelWidth);
      return false;   //delete this tunnel crawler
    }

    if (openAhead) {
      return this.buildSmallerTunnel(frontFree, dungeonCrawler, right);
    } // openAhead === true

    if (roomAhead && (this._tunnelWidth === 0)) {
      // make a small entry into the room, we don't do this for wider corridors
      if (frontFree > 1) {
        //otherwise we can make adjacent doors into end-of-tunnel room
        const test = this.location.plus(this.direction.multiply(frontFree + 1));
        const cell = dungeonCrawler.getMap(test);
        console.assert(cell === TunnelerCellType.INSIDE_ROOM_OPEN);
        this.buildTunnel(frontFree - 1, 0);
        if (this.direction.x === 0)
          dungeonCrawler.setMap(this.location.plus(this.direction.multiply(frontFree)), TunnelerCellType.V_DOOR);
        else {
          console.assert(this.direction.y === 0);
          dungeonCrawler.setMap(this.location.plus(this.direction.multiply(frontFree)), TunnelerCellType.H_DOOR);
        }
        return false;
      }
    }

    if (guaranteedClosedAhead) {
      // if this didn't work, we often are at the edge of the map, looking towards the edge
      // change direction - this code only good for tunnelWidth === 0, but other cases have not been observed
      if (this._tunnelWidth === 0) {
        // this condition prevents an infinite loop of tunnel crawlers creating identical children
        if (this._joinPreference !== 100 ||
          this._makeRoomsLeftProbability !== 20 ||
          this._makeRoomsRightProbability !== 20 ||
          this._changeDirectionProbability !== 30 ||
          this._straightDoubleSpawnProbability !== 0 ||
          this._turnDoubleSpawnProbability !== 0 ||
          this._tunnelWidth !== 0
        ) {
          const joinPreference = this.rng.range(0, 11) * 10;
          const direction = leftFree >= rightFree ? right.negative : right;
          dungeonCrawler.createTunnelCrawler(this.location, direction, 0, this.maxAge, this.generation + 1, direction, 3, 0, 0, 0, 30, 20, 20, joinPreference);
        }
        return false; //create a new one and delete this one
      }
    }

    if (!openAhead && !guaranteedClosedAhead) {
      if (this.isSpecialCase(frontFree, right)) {
        const isJoined = this.buildTunnel(frontFree, this._tunnelWidth);
        console.assert(isJoined);
        // treat the next row manually
        for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
          dungeonCrawler.setMap(this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i)), TunnelerCellType.INSIDE_TUNNEL_OPEN);
        }

        // keep going while we are still in contact with another tunnel on one side
        let directionLength = frontFree + 2;
        let contactInNextRow = true;
        let rowAfterIsOK = true;
        while (contactInNextRow && rowAfterIsOK) {
          for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
            const test = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(i));
            const cell = dungeonCrawler.getMap(test);
            if (cell !== TunnelerCellType.CLOSED) {
              contactInNextRow = false;
              break;
            }
          }
          //now check for contact
          let testRight = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(this._tunnelWidth + 1));
          let testLeft = this.location.plus(this.direction.multiply(directionLength)).minus(right.multiply(this._tunnelWidth + 1));
          let rightCell = dungeonCrawler.getMap(testRight);
          let leftCell = dungeonCrawler.getMap(testLeft);
          if (
            !this.contains(rightCell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN) &&
            !this.contains(leftCell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN)
          ) {
            contactInNextRow = false;
            break;
          }
          if ((rightCell === TunnelerCellType.INSIDE_ROOM_OPEN) || (leftCell === TunnelerCellType.INSIDE_ROOM_OPEN)) {
            contactInNextRow = false;
            break;
          }

          //now check the row after:
          for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
            const test = this.location.plus(this.direction.multiply(directionLength + 1)).plus(right.multiply(i));
            const cell = dungeonCrawler.getMap(test);
            if (cell !== TunnelerCellType.CLOSED) {
              rowAfterIsOK = false;
            }
          }

          //now check the two outlying squares
          testRight = this.location.plus(this.direction.multiply(directionLength + 1)).plus(right.multiply(this._tunnelWidth + 1));
          testLeft = this.location.plus(this.direction.multiply(directionLength + 1)).minus(right.multiply(this._tunnelWidth + 1));
          rightCell = dungeonCrawler.getMap(testRight);
          leftCell = dungeonCrawler.getMap(testLeft);
          if (
            !this.contains(rightCell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN, TunnelerCellType.CLOSED) &&
            !this.contains(leftCell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN, TunnelerCellType.CLOSED)
          ) {
            rowAfterIsOK = false;
          }

          if ((rightCell === TunnelerCellType.INSIDE_ROOM_OPEN) || (leftCell === TunnelerCellType.INSIDE_ROOM_OPEN))
            rowAfterIsOK = false;
          //however, if the entire row after is IT_OPEN, it's also OK
          let allOpen = true;
          for (let i = -this._tunnelWidth - 1; i <= this._tunnelWidth + 1; i++) {
            const test = this.location.plus(this.direction.multiply(directionLength + 1)).plus(right.multiply(i));
            const cell = dungeonCrawler.getMap(test);
            if ((cell !== TunnelerCellType.INSIDE_TUNNEL_OPEN) && (cell !== TunnelerCellType.INSIDE_ANTEROOM_OPEN)) {
              allOpen = false;
            }
          }
          if (allOpen) {
            rowAfterIsOK = true;
          }

          // build another row
          if (contactInNextRow && rowAfterIsOK) {
            for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
              dungeonCrawler.setMap(this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(i)), TunnelerCellType.INSIDE_TUNNEL_OPEN);
            }
          }

          directionLength++; // try the next row
        } // contactInNextRow && rowAfterIsOK
        return false;   // delete this tunnel crawler
      } // weHaveSpecialCase
      // now treat the case that a room blocks the path off center, only for tunnelWidth === 0:
      if (this._tunnelWidth === 0) {
        if (dungeonCrawler.getMap(this.location.plus(this.direction.multiply(frontFree + 1))) === TunnelerCellType.CLOSED) {
          //look sideways, and turn away from the room
          if (dungeonCrawler.getMap(this.location.plus(this.direction.multiply(frontFree + 1)).plus(right)) === TunnelerCellType.INSIDE_ROOM_OPEN) {
            this.direction = right.negative;
            if (this.direction.equals(this._intendedDirection.negative)) {
              this.direction = this._intendedDirection;   //to prevent heading off in the wrong direction
            }
            return true;
          } else if (dungeonCrawler.getMap(this.location.plus(this.direction.multiply(frontFree + 1)).minus(right)) === TunnelerCellType.INSIDE_ROOM_OPEN) {
            this.direction = right;
            if (this.direction.equals(this._intendedDirection.negative)) {
              this.direction = this._intendedDirection;   //to prevent heading off in the wrong direction
            }
            return true;
          }
        }
      }
    } // if( (!openAhead) && (!gClosedAhead) )

    // we give up, we have failed in our attempt to join
    return null;
  }

  private isSpecialCase(frontFree: number, right: Point): boolean {
    const dungeonCrawler = this.dungeonCrawler;
    // treat special case that can arise when frontFree was in fact based on an OPEN square that's tunnelWidth+1 off center
    let isSpecialCase = true;
    // test that assumption:
    for (let i = -this._tunnelWidth; i <= this._tunnelWidth; i++) {
      const test = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i));
      const cell = dungeonCrawler.getMap(test);
      if (cell !== TunnelerCellType.CLOSED) {
        isSpecialCase = false;
        break;
      }
    }
    // now test to the side
    const testRight = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(this._tunnelWidth + 1));
    const testLeft = this.location.plus(this.direction.multiply(frontFree + 1)).minus(right.multiply(this._tunnelWidth + 1));
    const rightCell = dungeonCrawler.getMap(testRight);
    const leftCell = dungeonCrawler.getMap(testLeft);
    if (
      !this.contains(rightCell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN) &&
      !this.contains(leftCell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN)
    ) {
      isSpecialCase = false;
    }

    if ((rightCell === TunnelerCellType.INSIDE_ROOM_OPEN) || (leftCell === TunnelerCellType.INSIDE_ROOM_OPEN)) {
      isSpecialCase = false;
    }

    // test next row to prevent collision with rooms
    for (let i = -this._tunnelWidth - 1; i <= this._tunnelWidth + 1; i++) {
      const test = this.location.plus(this.direction.multiply(frontFree + 2)).plus(right.multiply(i));
      const cell = dungeonCrawler.getMap(test);
      if (cell === TunnelerCellType.INSIDE_ROOM_OPEN) {
        isSpecialCase = false;
        break;
      }
    }
    return isSpecialCase;
  }

  private spawnTunnelCrawler(
    sizeUpTunnel: boolean,
    sizeDownTunnel: boolean,
    location: Point,
    direction: Point,
    generation: number,
    intendedDirection: Point,
    options: {
      readonly straightDoubleSpawnProbability: number;
      readonly turnDoubleSpawnProbability: number;
      readonly changeDirectionProbability: number;
      readonly makeRoomsRightProbability: number;
      readonly makeRoomsLeftProbability: number;
      readonly joinPreference: number;
    }
  ): void {
    let tunnelWidth = this._tunnelWidth;
    let stepLength = this._stepLength;
    if (sizeUpTunnel) {
      tunnelWidth++;
      stepLength = stepLength + 2; // @TODO: make better stepLength changes
    } else if (sizeDownTunnel) {
      tunnelWidth--;
      if (tunnelWidth < 0) {
        tunnelWidth = 0;
      }
      stepLength = stepLength - 2; // @TODO: make better stepLength changes
      if (stepLength < 3) {
        stepLength = 3;
      }
    }
    this.dungeonCrawler.createTunnelCrawler(
      location,
      direction,
      0,
      this.getMaxAgeTunnelCrawlers(generation),
      generation,
      intendedDirection,
      stepLength,
      tunnelWidth,
      options.straightDoubleSpawnProbability,
      options.turnDoubleSpawnProbability,
      options.changeDirectionProbability,
      options.makeRoomsRightProbability,
      options.makeRoomsLeftProbability,
      options.joinPreference
    );
  }

  private spawnRoomCrawler(location: Point, direction: Point, age: number, maxAge: number,
                           generation: number, size: RoomSize, builtAnteroom: boolean): void {
    const defaultWidth = Math.max(1, 2 * this._tunnelWidth);
    if (builtAnteroom) {
      generation = this.generation + Math.floor((generation - this.generation) / (this.config.genSpeedUpOnAnteroom));
    }
    this.dungeonCrawler.createRoomCrawler(location, direction, age, maxAge, generation, defaultWidth, size);
  }

  private buildSmallerTunnel(frontFree: number, dungeonCrawler: DungeonCrawler, right: Point): boolean {
    // we have OPEN squares ahead, but not for the full width of the Tunnel, make the tunnel smaller and join anyway
    // we join with the first OPEN square we find, and narrow the tunnel to width 1
    const test = this.location.plus(this.direction.multiply(frontFree + 1));
    const cell = dungeonCrawler.getMap(test);
    if (this.contains(cell, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN)) {
      // small opening straight ahead
      if (!this.buildTunnel(frontFree, 0)) {
        console.error("openAhead, failed to join, frontFree = " + frontFree);
      }
      return false;
    }

    let offset = 0;
    for (let i = 1; i <= this._tunnelWidth; i++) {
      const testP = this.location.plus(this.direction.multiply(frontFree + 1)).plus(right.multiply(i));
      const cellP = dungeonCrawler.getMap(testP);
      if (this.contains(cellP, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN)) {
        offset = i;
        break;
      }
      const testM = this.location.plus(this.direction.multiply(frontFree + 1)).minus(right.multiply(i));
      const cellM = dungeonCrawler.getMap(testM);
      if (this.contains(cellM, TunnelerCellType.OPEN, TunnelerCellType.GUARANTEED_OPEN, TunnelerCellType.INSIDE_TUNNEL_OPEN, TunnelerCellType.INSIDE_ANTEROOM_OPEN)) {
        offset = -i;
        break;
      }
    }
    console.assert(offset !== 0); // because openAhead === true and center has been eliminated earler
    for (let i = 1; i <= frontFree; i++) { // build the narrow tunnel by hand:
      const point = this.location.plus(this.direction.multiply(i)).plus(right.multiply(offset));
      dungeonCrawler.setMap(point, TunnelerCellType.INSIDE_TUNNEL_OPEN);
    }
    // we tunneled and joined, so:
    return false;
  }

  private roomGeneration(): number {
    const diceRoll = this.rng.range(0, 100);
    let roomGeneration = this.generation; // default
    let summedProbability = 0;
    for (let i = 0; i <= 10; i++) {
      summedProbability = summedProbability + this.getChildDelayProbabilityForGenerationRoomCrawlers(i);
      if (diceRoll < summedProbability) {
        roomGeneration = this.generation + i;
        break;
      }
    }

    return roomGeneration;
  }

  private sidewaysBranchingRoomSizes(): [RoomSize, RoomSize] {
    let sizeSideways: RoomSize;
    let sizeBranching: RoomSize;
    const probabilityMediumSideways = this.getRoomSizeProbabilitySideways(this._tunnelWidth, RoomSize.MEDIUM);
    const probabilitySmallSideways = this.getRoomSizeProbabilitySideways(this._tunnelWidth, RoomSize.SMALL);
    const probabilityMediumBranching = this.getRoomSizeProbabilityBranching(this._tunnelWidth, RoomSize.MEDIUM);
    const probSmallBranching = this.getRoomSizeProbabilityBranching(this._tunnelWidth, RoomSize.SMALL);

    const diceRoll = this.rng.range(0, 100);
    if (diceRoll < probabilitySmallSideways)
      sizeSideways = RoomSize.SMALL;
    else if (diceRoll < (probabilitySmallSideways + probabilityMediumSideways))
      sizeSideways = RoomSize.MEDIUM;
    else
      sizeSideways = RoomSize.LARGE;

    if (diceRoll < probSmallBranching)
      sizeBranching = RoomSize.SMALL;
    else if (diceRoll < (probSmallBranching + probabilityMediumBranching))
      sizeBranching = RoomSize.MEDIUM;
    else
      sizeBranching = RoomSize.LARGE;

    return [sizeSideways, sizeBranching];
  }

  private isChangeDirection(): boolean {
    return this.rng.range(0, 100) < this._changeDirectionProbability;
  }

  private isSpawn(changeDirection: boolean): boolean {
    if (changeDirection && this.rng.range(0, 100) < this._turnDoubleSpawnProbability) {
      return true;
    } else if (!changeDirection && this.rng.range(0, 100) < this._straightDoubleSpawnProbability) {
      return true;
    }
    return false;
  }

  private isSpawnRoom(doSpawn: boolean): boolean {
    return doSpawn && this.rng.range(0, 100) > this.config.patience;
  }

  private buildAnteroom(length: number, width: number): boolean {
    if ((length < 3) || (width < 1)) {
      console.error("Anteroom must be at least 3x3");
      return false;
    }
    const [frontFree] = this.frontFree(this.location, this.direction, width + 1, width + 1);
    if (frontFree <= length) {
      //frontFree must be >= length + 1 in order to proceed
      return false;
    }

    const right = this.rightDirection();

    for (let directionLength = 1; directionLength <= length; directionLength++) {
      for (let side = -width; side <= width; side++) {
        const current = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
        this.dungeonCrawler.setMap(current, TunnelerCellType.INSIDE_ANTEROOM_OPEN);
      }
    }

    if ((width >= 3) && (length >= 7) && this.config.columnsInTunnels) {
      // we place columns in the corners
      const directionLength = 2;
      this.placeColumns(width, directionLength, right);
    }

    return true;
  }

  private buildTunnel(length: number, width: number): boolean {
    if ((length < 1) || (width < 0)) {
      console.error("Trying to build zero size tunnel with length = " + length + "; width =  " + width);
      return false;
    }

    const [frontFree] = this.frontFree(this.location, this.direction, width + 1, width + 1);
    if (frontFree < length) {
      // frontFree must be >= length in order to proceed
      return false;
    }

    const right = this.rightDirection();

    for (let directionLength = 1; directionLength <= length; directionLength++) {
      for (let side = -width; side <= width; side++) {
        const current = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
        this.dungeonCrawler.setMap(current, TunnelerCellType.INSIDE_TUNNEL_OPEN);
      }
    }

    //if width >=3 and length >=7 (anteroom 7x7 or larger) we place columns
    if ((width >= 3) && (length >= 7) && this.config.columnsInTunnels) {
      const numCols = Math.floor((length - 1) / 6);   // =1 for length >= 7; =2 for length >= 13; =3 for length >= 19;
      console.assert(numCols > 0);
      for (let i = 0; i < numCols; i++) {
        const directionLength = 2 + i * 3;  //2 , 5 , 8 ,
        this.placeColumns(width, directionLength, right);
      }
    }
    return true;
  }

  private placeColumns(width: number, directionLength: number, right: Point): void {
    let side = -width + 1;   // one before the last opened square
    let point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
    this.dungeonCrawler.setMap(point, TunnelerCellType.COLUMN);
    side = width - 1;   // one before the last opened square
    point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
    this.dungeonCrawler.setMap(point, TunnelerCellType.COLUMN);

    directionLength = directionLength - 1;
    side = -width + 1; // one before the last opened square
    point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
    this.dungeonCrawler.setMap(point, TunnelerCellType.COLUMN);
    side = width - 1; // one before the last opened square
    point = this.location.plus(this.direction.multiply(directionLength)).plus(right.multiply(side));
    this.dungeonCrawler.setMap(point, TunnelerCellType.COLUMN);
  }

  private getChildDelayProbabilityForGenerationRoomCrawlers(generation: number): number {
    if ((0 <= generation) && (generation <= 10)) {
      return this.config.childDelayProbabilityForGenerationRoomCrawlers[generation];
    } else {
      return 0;
    }
  }

  private getChildDelayProbabilityForGenerationTunnelCrawlers(generation: number): number {
    if ((0 <= generation) && (generation <= 10)) {
      return this.config.childDelayProbabilityForGenerationTunnelCrawlers[generation];
    } else {
      return 0;
    }
  }

  private getAnteroomProbability(tunnelWidth: number): number {
    if (tunnelWidth >= this.config.anteroomProbability.length) {
      return 100;
    } else {
      return this.config.anteroomProbability[tunnelWidth];
    }
  }

  private getSizeUpProbability(generation: number): number {
    if (generation >= this.config.sizeUpProbability.length) {
      return this.config.sizeUpProbability[this.config.sizeUpProbability.length - 1];
    } else {
      return this.config.sizeUpProbability[generation];
    }
  }

  private getSizeDownProbability(generation: number): number {
    if (generation >= this.config.sizeDownProbability.length) {
      return this.config.sizeDownProbability[this.config.sizeDownProbability.length - 1];
    } else {
      return this.config.sizeDownProbability[generation];
    }
  }

  private getMaxAgeTunnelCrawlers(generation: number): number {
    if (generation >= this.config.maxAgesTunnelCrawlers.length) {
      return this.config.maxAgesTunnelCrawlers[this.config.maxAgesTunnelCrawlers.length - 1];
    } else {
      return this.config.maxAgesTunnelCrawlers[generation];
    }
  }

  private getRoomSizeProbabilitySideways(tunnelWidth: number, size: RoomSize): number {
    if (tunnelWidth >= this.config.roomSizeProbabilitySidewaysRooms.length) {
      if (RoomSize.LARGE === size) {
        return 100;
      } else {
        return 0;
      }
    } else {
      switch (size) {
        case RoomSize.LARGE:
          return (this.config.roomSizeProbabilitySidewaysRooms[tunnelWidth][2]);
        case RoomSize.MEDIUM:
          return (this.config.roomSizeProbabilitySidewaysRooms[tunnelWidth][1]);
        case RoomSize.SMALL:
          return (this.config.roomSizeProbabilitySidewaysRooms[tunnelWidth][0]);
      }
    }
  }

  private getRoomSizeProbabilityBranching(tunnelWidth: number, size: RoomSize): number {
    if (tunnelWidth >= this.config.roomSizeProbabilityBranching.length) {
      if (RoomSize.LARGE === size) {
        return 100;
      } else {
        return 0;
      }
    } else {
      switch (size) {
        case RoomSize.LARGE:
          return (this.config.roomSizeProbabilityBranching[tunnelWidth][2]);
        case RoomSize.MEDIUM:
          return (this.config.roomSizeProbabilityBranching[tunnelWidth][1]);
        case RoomSize.SMALL:
          return (this.config.roomSizeProbabilityBranching[tunnelWidth][0]);
      }
    }
  }

  private mutateOptions(): {
    readonly straightDoubleSpawnProbability: number;
    readonly turnDoubleSpawnProbability: number;
    readonly changeDirectionProbability: number;
    readonly makeRoomsRightProbability: number;
    readonly makeRoomsLeftProbability: number;
    readonly joinPreference: number;
  } {
    return {
      straightDoubleSpawnProbability: this.dungeonCrawler.mutate(this._straightDoubleSpawnProbability),
      turnDoubleSpawnProbability: this.dungeonCrawler.mutate(this._turnDoubleSpawnProbability),
      changeDirectionProbability: this.dungeonCrawler.mutate(this._changeDirectionProbability),
      makeRoomsRightProbability: this.dungeonCrawler.mutate(this._makeRoomsRightProbability),
      makeRoomsLeftProbability: this.dungeonCrawler.mutate(this._makeRoomsLeftProbability),
      joinPreference: this.dungeonCrawler.mutate(this._joinPreference),
    };
  }
}