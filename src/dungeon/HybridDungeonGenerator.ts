import {SceneController} from "../scene";
import {DungeonCrawlerConstraint, EvenSimpleTiledModel, TilesetRules} from "../wfc/even.simple.tiled";
import {Resolution} from "../wfc/model";
import {Config, Room} from "../tunneler";
import {yields} from "../concurency";
import {RNG} from "../rng";
import {BaseDungeonGenerator, GenerateOptions} from "./DungeonGenerator";
import {DungeonMap, DungeonMapCell} from "./DungeonMap";
import {
  BossConfig,
  BossMonsterController, bossMonsters,
  Hero,
  HeroController,
  MonsterCategory,
  NpcController,
  NPCs, SummonMonsterController, summonMonsters, TinyMonsterController,
  tinyMonsters
} from "../characters";
import {DungeonBonfire} from "./DungeonBonfire";
import {DungeonLightType} from "./DungeonLight";

export class HybridDungeonGenerator extends BaseDungeonGenerator {
  private _model: EvenSimpleTiledModel | null = null;

  get percent(): number {
    return this._model?.percent || 0;
  }

  constructor(controller: SceneController) {
    super(controller);
  }

  async generate(options: GenerateOptions): Promise<DungeonMap> {
    const tileset: TilesetRules = this.controller.loader.resources['dungeon.rules.4.json'].data;
    const config: Config = this.controller.loader.resources['dungeon.design.json'].data;

    const hero = options.hero;
    let seed: number;
    if (hero.dungeonSeeds.has(options.level)) {
      seed = hero.dungeonSeeds.get(options.level)!;
      console.log(`dungeon level ${options.level} exists seed: ${seed}`);
    } else {
      seed = this.controller.rng.int();
      console.log(`dungeon level ${options.level} new seed: ${seed}`);
      hero.dungeonSeeds.set(options.level, seed);
    }
    const rng = RNG.seeded(seed);

    await yields(10);

    const crawlerConstraint = new DungeonCrawlerConstraint(config);
    this._model = new EvenSimpleTiledModel(this.resources, tileset, rng, config.width, config.height, [crawlerConstraint]);

    console.time("model loop run");
    let state;
    for (; ;) {
      console.time("model run");
      state = await this._model.run(10000);
      console.timeEnd("model run");
      if (state !== Resolution.Decided) {
        console.error("failed run model");
      } else {
        console.log("success run model");
        break;
      }
      await yields();
    }
    console.timeEnd("model loop run");

    const dungeon = this.createDungeon(rng, seed, options.level, this._model.FMX, this._model.FMY);

    const observed = this._model.observed!;
    for (let y = 0; y < this._model.FMY; y++) {
      for (let x = 0; x < this._model.FMX; x++) {
        const i = x + y * this._model.FMX;
        const [floor, wall] = tileset.cells[observed[i]];
        if (floor >= 0) {
          dungeon.cell(x, y).floorName = tileset.tiles[floor];
        }
        if (wall >= 0) {
          dungeon.cell(x, y).wallName = tileset.tiles[wall];
        }
      }
    }

    const rooms = crawlerConstraint.crawler!.rooms
      .sort(Room.compare)
      .reverse();

    for (const room of rooms) {
      console.log(`room size=${room.inside.length} center=${room.center()}`);
    }

    await yields();
    this.replaceFloorRandomly(rng, dungeon);

    await yields();
    this.replaceWallRandomly(rng, dungeon);

    const isBoss = options.level % 5 === 0;
    if (isBoss) {
      await this.placeWithBoss(rng, dungeon, rooms, options.hero);
    } else {
      await this.placeWithoutBoss(rng, dungeon, rooms, options.hero);
    }

    await this.placeDrop(rng, dungeon);

    dungeon.light.loadMap();
    await yields();
    return dungeon;
  }

  private async placeWithoutBoss(rng: RNG, dungeon: DungeonMap, rooms: Room[], hero: Hero): Promise<void> {
    const spawnRoom = rooms.shift()!; // 1st biggest room
    const exitRoom = rooms.shift()!; // 2nd biggest room

    const heroAI = await this.placeHero(rng, dungeon, hero, spawnRoom);
    await this.placeLadder(rng, dungeon, exitRoom);
    await this.placeBonfire(rng, dungeon, heroAI, spawnRoom);
    await this.placeNpc(rng, dungeon, spawnRoom);

    await this.placeMonsters(rng, dungeon, spawnRoom);
  }

  private async placeWithBoss(rng: RNG, dungeon: DungeonMap, rooms: Room[], hero: Hero): Promise<void> {
    const bossRoom = rooms.shift()!; // 1st biggest room
    const spawnRoom = rooms.shift()!; //  2nd biggest room

    const heroAI = await this.placeHero(rng, dungeon, hero, spawnRoom);

    await this.placeNpc(rng, dungeon, spawnRoom);
    await this.placeBonfire(rng, dungeon, heroAI, spawnRoom);

    await this.placeLadder(rng, dungeon, bossRoom);
    await this.placeBoss(rng, dungeon, bossRoom);

    await this.placeMonsters(rng, dungeon, spawnRoom);
  }

  private async placeHero(rng: RNG, dungeon: DungeonMap, hero: Hero, room: Room): Promise<HeroController> {
    const cell = this.findSpawnCellInRoom(rng, dungeon, 3, 3, room);
    if (cell) {
      const ai = new HeroController(hero, dungeon, cell.x + 1, cell.y - 2);
      dungeon.light.addLight(ai.view, DungeonLightType.HERO);
      return ai;
    } else {
      throw "error place bonfire";
    }
  }

  private async placeLadder(rng: RNG, dungeon: DungeonMap, room: Room): Promise<void> {
    const cell = this.findSpawnCellInRoom(rng, dungeon, 3, 3, room);
    if (cell) {
      dungeon.cell(cell.x + 1, cell.y - 1).ladder();
    } else {
      throw "error place bonfire";
    }
  }

  private async placeBonfire(rng: RNG, dungeon: DungeonMap, hero: HeroController, room: Room): Promise<void> {
    const cell = this.findSpawnCellInRoom(rng, dungeon, 3, 3, room);
    if (cell) {
      const light = hero.character.bonfires.has(dungeon.level);
      new DungeonBonfire(dungeon, cell.x + 1, cell.y - 1, light);
    } else {
      throw "error place bonfire";
    }
  }

  private async placeNpc(rng: RNG, dungeon: DungeonMap, room: Room): Promise<void> {
    const npcCount = 5;
    for (let i = 0; i < npcCount; i++) {
      const cell = this.findSpawnCellInRoom(rng, dungeon, 2, 2, room);
      if (cell) {
        const config = rng.select(NPCs)!;
        new NpcController(config, dungeon, cell.x, cell.y);
      } else {
        break;
      }
    }
  }

  private async placeBoss(rng: RNG, dungeon: DungeonMap, room: Room): Promise<void> {
    const cell = this.findSpawnCellInRoom(rng, dungeon, 4, 4, room);
    if (cell) {
      const config = this.bossConfig(dungeon);
      new BossMonsterController(config, dungeon, cell.x + 1, cell.y - 1);
    } else {
      throw "error place boos";
    }
  }

  private async placeMonsters(rng: RNG, dungeon: DungeonMap, exclude: Room): Promise<void> {
    const totalSpace = dungeon.width * dungeon.height;
    const floorSpace = Math.floor(totalSpace * 0.4);
    const spawnSpace = Math.floor(floorSpace * 0.2);
    const tinyMonsterCount = Math.floor(spawnSpace * 0.15);
    const summonMonsterCount = Math.floor(spawnSpace * 0.01);


    console.log(`total space: ${floorSpace}`);
    console.log(`floor space: ${floorSpace}`);
    console.log(`spawn space: ${spawnSpace}`);
    console.log(`tiny monster count: ${tinyMonsterCount}`);
    console.log(`summon monster count: ${summonMonsterCount}`);

    const category = this.bossConfig(dungeon).category;

    for (let m = 0; m < tinyMonsterCount; m++) {
      if (!await this.placeTinyMonster(rng, dungeon, exclude, category)) {
        break;
      }
    }
    for (let m = 0; m < summonMonsterCount; m++) {
      if (!await this.placeSummonMonster(rng, dungeon, exclude, category)) {
        break;
      }
    }
  }

  private async placeTinyMonster(rng: RNG, dungeon: DungeonMap, exclude: Room, category: MonsterCategory): Promise<boolean> {
    const filteredMonsters = tinyMonsters.filter(config => {
      return config.category === category ||
        (config.category != MonsterCategory.DEMON &&
          config.category != MonsterCategory.ORC &&
          config.category != MonsterCategory.ZOMBIE);
    });
    if (filteredMonsters.length === 0) {
      console.warn("no tiny monster config found");
      return false;
    }
    const cell = this.findSpawnCellExcludeRoom(rng, dungeon, 2, 2, exclude);
    if (cell === null) {
      console.warn("no free place for tiny monster");
      return false;
    }
    const config = rng.select(filteredMonsters)!;
    new TinyMonsterController(config, dungeon, cell.x, cell.y);
    return true;
  }

  private async placeSummonMonster(rng: RNG, dungeon: DungeonMap, exclude: Room, category: MonsterCategory): Promise<boolean> {
    const filteredSummonMonsters = summonMonsters.filter(config => {
      return config.category === category ||
        (config.category != MonsterCategory.DEMON &&
          config.category != MonsterCategory.ORC &&
          config.category != MonsterCategory.ZOMBIE);
    });
    if (filteredSummonMonsters.length === 0) {
      console.warn("no summon monster config found");
      return false;
    }
    const cell = this.findSpawnCellExcludeRoom(rng, dungeon, 3, 3, exclude);
    if (cell === null) {
      console.warn("no free place for tiny monster");
      return false;
    }
    const config = rng.select(filteredSummonMonsters)!;
    new SummonMonsterController(config, dungeon, cell.x + 1, cell.y - 1);
    return true;
  }

  private async placeDrop(rng: RNG, dungeon: DungeonMap): Promise<void> {
    const free: DungeonMapCell[] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.height; x++) {
        const cell = dungeon.cell(x, y);
        if (cell.hasFloor && !cell.hasDrop && !cell.hasObject) {
          free.push(cell);
        }
      }
    }

    const dropCount = Math.floor(free.length * 0.01);

    for (let d = 0; d < dropCount && free.length > 0; d++) {
      const i = rng.range(0, free.length);
      free.splice(i, 1)[0].randomDrop();
    }
  }

  private findSpawnCellExcludeRoom(rng: RNG, dungeon: DungeonMap, width: number, height: number, room: Room): DungeonMapCell | null {
    const excludePoints = new Set<string>(room.inside.map(p => `${p.x}:${p.y}`));
    const free: DungeonMapCell[] = [];
    for (let y = height; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width - width; x++) {
        let valid = true;
        for (let dy = 0; dy < height && valid; dy++) {
          for (let dx = 0; dx < width && valid; dx++) {
            const cell = dungeon.cell(x + dx, y - dy);
            valid = cell.hasFloor && !cell.hasObject && !excludePoints.has(`${cell.x}:${cell.y}`);
            if (!valid) break;
          }
          if (!valid) break;
        }
        if (valid) {
          free.push(dungeon.cell(x, y));
        }
      }
    }
    return rng.select(free);
  }

  private findSpawnCellInRoom(rng: RNG, dungeon: DungeonMap, width: number, height: number, room: Room): DungeonMapCell | null {
    const free: DungeonMapCell[] = [];
    for (const point of room.inside) {
      const x = point.x;
      const y = point.y;
      let valid = true;
      for (let dy = 0; dy < height && valid; dy++) {
        for (let dx = 0; dx < width && valid; dx++) {
          const cell = dungeon.cell(x + dx, y - dy);
          valid = cell.hasFloor && !cell.hasObject;
        }
      }
      if (valid) {
        free.push(dungeon.cell(x, y));
      }
    }
    return rng.select(free);
  }

  private bossConfig(dungeon: DungeonMap): BossConfig {
    return bossMonsters[Math.floor((dungeon.level - 1) / 5) % bossMonsters.length];
  }
}
