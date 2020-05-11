import {DungeonMap, DungeonObject} from "../dungeon";
import {Hero, HeroController} from "./Hero";
import {Character, CharacterController, CharacterControllerOptions, HitController, ScanDirection} from "./Character";
import {PathPoint} from "../pathfinding";

export enum MonsterCategory {
  DEMON = 1,
  ZOMBIE = 2,
  ORC = 3,
  SLIME = 4,
  UNDEAD = 5,
}

export enum MonsterType {
  NORMAL = 1,
  SUMMON = 2,
  MINION = 3,
}

export class Monster extends Character {
  readonly level: number;
  readonly luck: number;
  readonly xp: number;

  readonly category: MonsterCategory;
  readonly type: MonsterType;

  constructor(options: {
    name: string;
    speed: number;
    healthMax: number;
    level: number;
    luck: number;
    baseDamage: number;
    xp: number;
    category: MonsterCategory;
    type: MonsterType;
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
  }
}

export interface MonsterControllerOptions extends CharacterControllerOptions {
  readonly maxDistance: number;
}

export abstract class MonsterController extends CharacterController {
  static type: (o: DungeonObject) => o is MonsterController =
    (o: DungeonObject): o is MonsterController => {
      return o instanceof MonsterController;
    };

  abstract readonly character: Monster;

  readonly maxDistance: number;
  private _path: PathPoint[] = [];
  private _hero: HeroController | null = null;

  get hasPath(): boolean {
    return this._path.length > 0;
  }

  protected constructor(dungeon: DungeonMap, options: MonsterControllerOptions) {
    super(dungeon, options);
    this.maxDistance = options.maxDistance
  }

  protected onKilledBy(by: Character): void {
    if (by && by instanceof Hero) {
      this._dungeon.log(`${this.character.name} killed by ${by.name}`);
      by.addXp(this.character.xp);
    }
  }

  scanHit(combo: number): void {
    const weapon = this.character.weapon;
    const direction = this.view.isLeft ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const distance = weapon?.distance || 1;
    const heroes = this.scanHeroes(direction, distance);
    const damage = this.character.damage + combo;
    for (const hero of heroes) {
      hero.character.hitDamage(this.character, damage);
    }
  }

  private onAlarm(hero: HeroController): void {
    this._path = this.findPath(hero);
  }

  protected scanHeroes(direction: ScanDirection, maxDistance: number = this.maxDistance): HeroController[] {
    return this._dungeon.registry.query<HeroController>({
      type: HeroController.type,
      filter: hero => {
        return !hero.character.dead.get() &&
          this.distanceTo(hero) <= maxDistance &&
          this.checkDirection(direction, hero) &&
          this.raycastIsVisible(hero);
      }
    });
  }

  protected scanHero(): boolean {
    if (this._hero !== null && this._hero.character.dead.get()) {
      this._hero = null;
    }
    if (this._hero !== null && this.distanceTo(this._hero) <= this.maxDistance) {
      return true;
    }
    const [hero] = this.scanHeroes(ScanDirection.AROUND, this.maxDistance);
    if (hero) {
      this._hero = hero;
      for (const monster of this.scanMonsters()) {
        monster.onAlarm(hero);
      }
    }
    return false;
  }

  protected get heroOnAttack(): boolean {
    if (this._hero !== null && this._hero.character.dead.get()) {
      this._hero = null;
    }
    const maxDistance = this.character.weapon?.distance || 1;
    return this._hero !== null && this.distanceTo(this._hero) <= maxDistance;
  }

  protected get heroIsNear(): boolean {
    if (this._hero !== null && this._hero.character.dead.get()) {
      this._hero = null;
    }
    return this._hero !== null && this.distanceTo(this._hero) <= this.maxDistance;
  }

  protected moveToHero(): boolean {
    if (this._hero !== null && this._hero.character.dead.get()) {
      this._hero = null;
    }
    return this._hero !== null && this.moveTo(this._hero);
  }

  protected lookAtHero(): void {
    if (this._hero !== null && this._hero.character.dead.get()) {
      this._hero = null;
    }
    if (this._hero !== null) {
      this.lookAt(this._hero);
    }
  }

  protected runAway(): boolean {
    if (this._hero !== null && this._hero.character.dead.get()) {
      this._hero = null;
    }
    if (this._hero !== null) {
      const dx = Math.min(1, Math.max(-1, this.x - this._hero.x));
      const dy = Math.min(1, Math.max(-1, this.y - this._hero.y));
      return this.tryMove(dx, dy);
    }
    return false;
  }

  private scanMonsters(): MonsterController[] {
    return this._dungeon.registry.query<MonsterController>({
      type: MonsterController.type,
      filter: monster => {
        return !monster.character.dead.get() &&
          this.distanceTo(monster) <= this.maxDistance;
      }
    });
  }

  protected moveByPath(): boolean {
    if (this._path.length > 0) {
      const next = this._path[0];
      const deltaX = next.x - this.x;
      const deltaY = next.y - this.y;
      if (this.move(deltaX, deltaY)) {
        this._path.splice(0, 1);
        return true;
      } else {
        this._path = [];
        return false;
      }
    } else {
      return false;
    }
  }

  protected moveTo(hero: HeroController): boolean {
    this._path = this.findPath(hero);
    return this.moveByPath();
  }
}

export class MonsterHitController implements HitController {
  private readonly _controller: MonsterController;

  constructor(controller: MonsterController) {
    this._controller = controller;
  }

  onHit(combo: number): void {
    this._controller.scanHit(combo);
  }

  continueCombo(): boolean {
    return true;
  }
}