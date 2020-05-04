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
  readonly perGeneration: readonly number[];
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

export interface Config {
  readonly width: number;
  readonly height: number;
  readonly background: TunnelerCellType;
  readonly openings: readonly Direction[]; // openings (in edge od dungeon wall)
  readonly design: readonly FillRect[]; // design elements (pre-placed rooms, etc)
  readonly stepLengths: readonly number[];
  readonly corridorWidths: readonly number[];
  readonly maxAgesCrawlers: readonly number[];
  readonly maxAgesTunnelCrawlers: readonly number[];
  readonly crawlers: readonly CrawlerConfig[];
  readonly tunnelCrawlers: readonly TunnelCrawlerConfig[];
  readonly crawlerPairs: readonly (readonly [CrawlerConfig, CrawlerConfig])[];

  readonly childDelayProbabilityForGenerationTunnelCrawlers: readonly number[];
  readonly childDelayProbabilityForGenerationCrawlers: readonly number[];
  readonly childDelayProbabilityForGenerationRoomCrawlers: readonly number[];

  readonly roomSizeProbabilitySidewaysRooms: readonly (readonly [number, number, number])[];
  readonly roomSizeProbabilityBranching: readonly (readonly [number, number, number])[];

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

  readonly joinPreference: readonly number[];
  readonly sizeUpProbability: readonly number[];
  readonly sizeDownProbability: readonly number[];
  readonly patience: number;
  readonly tunnelJoinDist: number;
  readonly sizeUpGenDelay: number;
  readonly columnsInTunnels: boolean;
  readonly roomAspectRatio: number;
  readonly anteroomProbability: readonly number[];
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