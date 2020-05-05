import {DungeonMap} from "../dungeon";
import {Hero, HeroAI} from "./Hero";
import {BaseCharacterAI, Character, CharacterAI, ScanDirection} from "./Character";
import {IdleAnimationController} from "./AnimationController";
import {CharacterViewOptions} from "./CharacterView";

export enum MonsterCategory {
  DEMON = 1,
  ZOMBIE = 2,
  ORC = 3,
  SLIME = 4,
  UNDEAD = 5,
}

export enum MonsterType {
  NORMAL = 1,
  LEADER = 2,
  MINION = 3,
}

export enum MonsterState {
  READY = 0,
  ALARM = 1,
}

export abstract class Monster extends Character {
  readonly level: number;
  readonly luck: number;
  readonly xp: number;

  readonly category: MonsterCategory;
  readonly type: MonsterType;
  readonly spawn: number;

  protected constructor(options: {
    name: string;
    speed: number;
    healthMax: number;
    level: number;
    luck: number;
    baseDamage: number;
    xp: number;
    category: MonsterCategory;
    type: MonsterType;
    spawn: number;
  }) {
    super({
      name: options.name,
      speed: options.speed,
      healthMax: options.healthMax,
      baseDamage: options.baseDamage,
      coins: 0,
    });
    this.level = options.level;
    this.luck = options.luck;
    this.xp = options.xp;
    this.category = options.category;
    this.type = options.type;
    this.spawn = options.spawn;
  }
}

export abstract class MonsterAI extends BaseCharacterAI {
  abstract readonly character: Monster;
  abstract readonly max_distance: number;
  readonly interacting: boolean = false;

  private _state: MonsterState = MonsterState.READY;
  private _lastPath: PIXI.Point[] = [];
  private readonly _spawned: MonsterAI[] = [];

  protected constructor(dungeon: DungeonMap, options: CharacterViewOptions) {
    super(dungeon, options);
  }

  interact(): void {
  }

  protected onKilledBy(by: Character): void {
    if (by && by instanceof Hero) {
      this.dungeon.log(`${this.character.name} killed by ${by.name}`);
      by.addXp(this.character.xp);
    }
  }

  protected ready(): void {
    this._state = MonsterState.READY;
  }

  protected sendAlarm(hero: HeroAI): void {
    this._state = MonsterState.ALARM;
    for (const monster of this.scanMonsters(ScanDirection.AROUND, this.max_distance)) {
      monster.alarm(hero);
    }
  }

  alarm(hero: HeroAI): void {
    if (!this.character.dead.get() &&
      this.character.type !== MonsterType.LEADER &&
      this._state === MonsterState.READY &&
      this.animation instanceof IdleAnimationController
    ) {
      this.moveTo(hero);
    }
  }

  get state(): MonsterState {
    return this._state;
  }

  protected randomMove(): boolean {
    const randomMovePercent = 0.1;
    if (Math.random() < randomMovePercent) {
      const moveX = Math.floor(Math.random() * 3) - 1;
      const moveY = Math.floor(Math.random() * 3) - 1;
      if (this.move(moveX, moveY)) {
        return true;
      }
    }
    return false;
  }

  protected moveToHero(): boolean {
    const [hero] = this.scanHero(ScanDirection.AROUND, this.max_distance);
    if (hero) {
      this.lookAt(hero);
      this.sendAlarm(hero);
      const distX = Math.abs(this.x - hero.x);
      const distY = Math.abs(this.y - hero.y);
      if (distX > this.width || distY > this.height) {
        return this.moveTo(hero);
      } else if (this.character.luck < this.dungeon.rng.float()) {
        this.hit();
        return true;
      }
    }
    return false;
  }

  protected moveTo(character: CharacterAI): boolean {
    this._lastPath = this.findPath(character);
    return this.moveByPath();
  }

  protected moveByPath(): boolean {
    if (this._lastPath.length > 0) {
      const next = this._lastPath[0];
      const deltaX = next.x - this.x;
      const deltaY = next.y - this.y;
      if (this.move(deltaX, deltaY)) {
        this._lastPath.splice(0, 1);
        return true;
      } else {
        this._lastPath = [];
        return false;
      }
    } else {
      return false;
    }
  }

  protected scanHit(): void {
    const weapon = this.character.weapon;
    const direction = this.view.isLeft ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const distance = weapon?.distance || 1;
    const heroes = this.scanHero(direction, distance);
    for (const hero of heroes) {
      hero.character.hitDamage(this.character, this.character.damage);
    }
  }

  protected spawnMinions(): boolean {
    for (let i = this._spawned.length - 1; i >= 0; i--) {
      if (this._spawned[i].character.dead.get()) {
        this._spawned.splice(i, 1);
      }
    }
    if (this._spawned.length < this.character.spawn) {
      if (Math.random() > 0.1) {
        return false;
      }
      const cell = this.findSpawnCell();
      if (!cell) {
        console.warn(`spawn cell not found at ${this.x}:${this.y}`, this.character.category, this.character.type);
        return false;
      }
      const minion = this.spawnMinion(cell.x, cell.y);
      if (minion) {
        cell.object = minion;
        this._spawned.push(minion);
        return true;
      } else {
        console.warn("minion not spawned", this.character.category, this.character.type);
        return false;
      }
    }
    return false;
  }

  protected abstract spawnMinion(x: number, y: number): MonsterAI | null;

  protected scanHero(direction: ScanDirection, maxDistance: number): HeroAI[] {
    return this.scanObjects(direction, maxDistance, c => c instanceof HeroAI)
      .filter(o => this.raycastIsVisible(o.x, o.y)) as HeroAI[];
  }

  protected scanMonsters(direction: ScanDirection, maxDistance: number): MonsterAI[] {
    return this.scanObjects(direction, maxDistance, c => c instanceof MonsterAI) as MonsterAI[];
  }
}