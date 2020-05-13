import {TinyMonster} from "./TinyMonster";
import {SummonMonster} from "./SummonMonster";
import {BossMonster} from "./BossMonster";
import {MonsterState} from "./MonsterState";
import {DungeonMap} from "../../dungeon";
import {MonsterRace, MonsterType} from "./Monster";
import {SceneController} from "../../scene";
import {BossConfig, MonsterConfig, SummonMonsterConfig, TinyMonsterConfig} from "./MonsterConfig";

export class MonsterManager {
  private readonly _controller: SceneController;
  private _config!: MonsterConfig;

  constructor(controller: SceneController) {
    this._controller = controller;
  }

  init(): void {
    this._config = this._controller.loader.resources['monster.config.json'].data;
  }

  private modify(value: number, modifier: number, length: number): number {
    return Math.floor(value + value * modifier * length);
  }

  spawnRandomMinion(race: MonsterRace, dungeon: DungeonMap, x: number, y: number): TinyMonster | null {
    const minions = this._config.tiny.filter(c => c.race === race && c.type === MonsterType.MINION);
    const config = dungeon.rng.select(minions);
    if (!config) {
      console.warn("no minion config found", race);
      return null;
    }
    return this.spawnTinyMonster(config, dungeon, x, y);
  }

  spawnRandomTinyMonster(dungeon: DungeonMap, x: number, y: number): TinyMonster {
    const race = this.bossConfig(dungeon.level).race;
    const filtered = this._config.tiny.filter(config => {
      return config.race === race ||
        (config.race != MonsterRace.DEMON &&
          config.race != MonsterRace.ORC &&
          config.race != MonsterRace.ZOMBIE);
    });
    const config = dungeon.rng.select(filtered);
    if (config === null) throw "No tiny monster config found";
    return this.spawnTinyMonster(config, dungeon, x, y);
  }

  spawnTinyMonster(config: TinyMonsterConfig, dungeon: DungeonMap, x: number, y: number): TinyMonster {
    const state = new MonsterState({
      name: config.name,
      healthMax: this.modify(config.health, 0.1, dungeon.level),
      health: this.modify(config.health, 0.1, dungeon.level),
      baseDamage: this.modify(config.damage, 0.1, dungeon.level),
      speed: config.speed,
      coins: 0,

      level: dungeon.level,
      luck: config.luck,
      xp: 35 + 5 * dungeon.level,
      race: config.race,
      type: config.type,

      viewRange: 7,
      width: 1,
      height: 1
    });
    const weaponId = state.luck < dungeon.rng.float() ? dungeon.rng.select(config.weapons) : null;
    if (weaponId) {
      const weapon = this._controller.weaponManager.monsterWeapon(weaponId);
      state.inventory.equipment.weapon.set(weapon);
    }
    return new TinyMonster(state, dungeon, x, y);
  }

  spawnRandomSummonMonster(dungeon: DungeonMap, x: number, y: number): SummonMonster {
    const race = this.bossConfig(dungeon.level).race;
    const filtered = this._config.summon.filter(config => {
      return config.race === race ||
        (config.race != MonsterRace.DEMON &&
          config.race != MonsterRace.ORC &&
          config.race != MonsterRace.ZOMBIE);
    });
    const config = dungeon.rng.select(filtered);
    if (config === null) throw "No summon monster config found";
    return this.spawnSummonMonster(config, dungeon, x, y);
  }

  spawnSummonMonster(config: SummonMonsterConfig, dungeon: DungeonMap, x: number, y: number): SummonMonster {
    const state = new MonsterState({
      name: config.name,
      healthMax: this.modify(config.health, 0.1, dungeon.level),
      health: this.modify(config.health, 0.1, dungeon.level),
      baseDamage: this.modify(config.damage, 0.1, dungeon.level),
      speed: config.speed,
      coins: 0,

      level: dungeon.level,
      luck: config.luck,
      xp: 35 + 5 * dungeon.level,
      race: config.race,
      type: MonsterType.SUMMON,

      viewRange: 7,
      width: 1,
      height: 1
    });

    const weaponId = state.luck < dungeon.rng.float() ? dungeon.rng.select(config.weapons) : null;
    if (weaponId) {
      const weapon = this._controller.weaponManager.monsterWeapon(weaponId);
      state.inventory.equipment.weapon.set(weapon);
    }
    return new SummonMonster(state, dungeon, x, y);
  }

  spawnLevelBossMonster(dungeon: DungeonMap, x: number, y: number): BossMonster {
    const config = this.bossConfig(dungeon.level);
    return this.spawnBossMonster(config, dungeon, x, y);
  }

  spawnBossMonster(config: BossConfig, dungeon: DungeonMap, x: number, y: number): BossMonster {
    const state = new MonsterState({
      name: config.name,
      healthMax: this.modify(config.health, 0.1, dungeon.level),
      health: this.modify(config.health, 0.1, dungeon.level),
      baseDamage: this.modify(config.damage, 0.1, dungeon.level),
      speed: config.speed,
      coins: 0,

      level: dungeon.level,
      luck: config.luck,
      xp: 200 + 20 * dungeon.level,
      race: config.race,
      type: MonsterType.BOSS,

      viewRange: 7,
      width: 2,
      height: 2
    });

    const weaponId = state.luck < dungeon.rng.float() ? dungeon.rng.select(config.weapons) : null;
    if (weaponId) {
      const weapon = this._controller.weaponManager.monsterWeapon(weaponId);
      state.inventory.equipment.weapon.set(weapon);
    }
    return new BossMonster(state, dungeon, x, y);
  }

  bossConfig(level: number): BossConfig {
    return this._config.boss[Math.floor((level - 1) / 5) % this._config.boss.length];
  }
}