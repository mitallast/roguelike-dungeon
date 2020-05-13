import {MonsterRace, MonsterType} from "./Monster";

export interface BossConfig {
  readonly name: string;
  readonly race: MonsterRace;
  readonly health: number;
  readonly damage: number;
  readonly luck: number;
  readonly xp: number;
  readonly speed: number;
  readonly weapons: string[];
}

export interface SummonMonsterConfig {
  readonly name: string;
  readonly race: MonsterRace;
  readonly health: number;
  readonly damage: number;
  readonly luck: number;
  readonly xp: number;
  readonly speed: number;
  readonly spawn: number;
  readonly weapons: string[];
}

export interface TinyMonsterConfig {
  readonly name: string;
  readonly race: MonsterRace;
  readonly health: number;
  readonly damage: number;
  readonly luck: number;
  readonly xp: number;
  readonly speed: number;
  readonly type: MonsterType.NORMAL | MonsterType.MINION;
  readonly weapons: string[];
}

export interface MonsterConfig {
  readonly boss: BossConfig[];
  readonly tiny: TinyMonsterConfig[];
  readonly summon: SummonMonsterConfig[];
}