import {TunnelerCellType, Direction, FillRect, ImmutablePoint} from "./model";

export interface CrawlerConfig {
  readonly location: ImmutablePoint;
  readonly direction: ImmutablePoint;
  readonly intendedDirection: ImmutablePoint;

  readonly age: number;
  readonly maxAge: number;
  readonly generation: number;
  readonly stepLength: number;
  readonly opening: number;
  readonly corridorWidth: number;
  readonly straightSingleSpawnProbability: number;
  readonly straightDoubleSpawnProbability: number;
  readonly turnSingleSpawnProbability: number;
  readonly turnDoubleSpawnProbability: number;
  readonly changeDirectionProbability: number;
}

export interface RandCrawlerConfig {
  readonly perGeneration: number[];
  readonly straightSingleSpawnProbability: number;
  readonly straightDoubleSpawnProbability: number;
  readonly turnSingleSpawnProbability: number;
  readonly turnDoubleSpawnProbability: number;
  readonly changeDirectionProbability: number;
}

export interface TunnelCrawlerConfig {
  readonly location: ImmutablePoint;
  readonly direction: ImmutablePoint;
  readonly intendedDirection: ImmutablePoint;

  readonly age: number;
  readonly maxAge: number;
  readonly generation: number;
  readonly stepLength: number;
  readonly tunnelWidth: number;
  readonly straightDoubleSpawnProbability: number;
  readonly turnDoubleSpawnProbability: number;
  readonly changeDirectionProbability: number;
  readonly makeRoomsRightProbability: number;
  readonly makeRoomsLeftProbability: number;
  readonly joinPreference: number;
}

export interface DungeonCrawlerConfig {
  readonly width: number;
  readonly height: number;
  readonly background: TunnelerCellType;
  readonly openings: Direction[]; // openings (in edge od dungeon wall)
  readonly design: FillRect[]; // design elements (pre-placed rooms, etc)
  readonly stepLengths: number[];
  readonly corridorWidths: number[];
  readonly maxAgesCrawlers: number[];
  readonly maxAgesTunnelCrawlers: number[];
  readonly crawlers: CrawlerConfig[];
  readonly tunnelCrawlers: TunnelCrawlerConfig[];
  readonly crawlerPairs: [CrawlerConfig, CrawlerConfig][];

  readonly childDelayProbabilityForGenerationTunnelCrawlers: number[];
  readonly childDelayProbabilityForGenerationCrawlers: number[];
  readonly childDelayProbabilityForGenerationRoomCrawlers: number[];

  readonly roomSizeProbabilitySidewaysRooms: number[][];
  readonly roomSizeProbabilityBranching: number[][];

  readonly mutator: number;
  readonly noHeadingProbability: number;
  readonly joinDistance: number;

  readonly minRoomSize: number;
  readonly mediumRoomSize: number;
  readonly largeRoomSize: number;
  readonly maxRoomSize: number;

  readonly numSmallRoomsInLabyrinth: number;
  readonly numMediumRoomsInLabyrinth: number;
  readonly numLargeRoomsInLabyrinth: number;

  readonly numSmallRoomsInDungeon: number;
  readonly numMediumRoomsInDungeon: number;
  readonly numLargeRoomsInDungeon: number;

  readonly randCrawler: RandCrawlerConfig;

  readonly joinPreference: number[];
  readonly sizeUpProbability: number[];
  readonly sizeDownProbability: number[];
  readonly patience: number;
  readonly tunnelJoinDist: number;
  readonly sizeUpGenDelay: number;
  readonly columnsInTunnels: boolean;
  readonly roomAspectRatio: number;
  readonly anteroomProbability: number[];
  readonly genSpeedUpOnAnteroom: number;
  readonly crawlersInTunnels: boolean;
  readonly crawlersInAnterooms: boolean;
  readonly seedCrawlersInTunnels: number;
  readonly tunnelCrawlerStats: CrawlerConfig;
  readonly inAnteroomProbability: number;
  readonly tunnelCrawlerGeneration: number;
  readonly tunnelCrawlerClosedProbability: number;
  readonly lastChanceTunnelCrawler: TunnelCrawlerConfig;
  readonly genDelayLastChance: number;
}