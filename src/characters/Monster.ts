import {DungeonMap} from "../dungeon";
import {Hero, HeroController} from "./Hero";
import {BaseCharacterController, Character, HitController, ScanDirection} from "./Character";
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
  SUMMON = 2,
  MINION = 3,
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

export abstract class MonsterController extends BaseCharacterController {
  abstract readonly character: Monster;
  abstract readonly maxDistance: number;
  readonly interacting: boolean = false;

  private _path: PIXI.Point[] = [];
  private _hero: HeroController | null = null;

  get hasPath(): boolean {
    return this._path.length > 0;
  }

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

  protected scanHeroes(direction: ScanDirection, distance: number = this.maxDistance): HeroController[] {
    return this.scanObjects(direction, distance, c => c instanceof HeroController)
      .filter(o => !(o as HeroController).character.dead.get())
      .filter(o => this.raycastIsVisible(o.x, o.y)) as HeroController[];
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
      for (const monster of this.scanMonsters(ScanDirection.AROUND)) {
        monster.onAlarm(hero);
      }
    }
    return false;
  }

  protected get heroOnAttack(): boolean {
    if (this._hero !== null && this._hero.character.dead.get()) {
      this._hero = null;
    }
    return this._hero !== null && this.distanceTo(this._hero) === 0;
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

  private scanMonsters(direction: ScanDirection): MonsterController[] {
    return this.scanObjects(direction, this.maxDistance, c => c instanceof MonsterController && c !== this) as MonsterController[];
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