import {DungeonMap, DungeonObject} from "../../dungeon";
import {Hero} from "../hero";
import {Character, CharacterOptions, HitController, ScanDirection} from "../Character";
import {PathPoint} from "../../pathfinding";
import {MonsterState} from "./MonsterState";

export const enum MonsterRace {
  DEMON = "demon",
  ZOMBIE = "zombie",
  ORC = "orc",
  SLIME = "slime",
  UNDEAD = "undead",
}

export const enum MonsterType {
  NORMAL = "normal",
  SUMMON = "summon",
  MINION = "minion",
  BOSS = "boss",
}

export abstract class Monster extends Character {
  static type: (o: DungeonObject) => o is Monster =
    (o: DungeonObject): o is Monster => {
      return o instanceof Monster;
    };

  readonly state: MonsterState;

  private _path: PathPoint[] = [];

  get hasPath(): boolean {
    return this._path.length > 0;
  }

  protected constructor(state: MonsterState, dungeon: DungeonMap, options: CharacterOptions) {
    super(dungeon, options);
    this.state = state;
  }

  scanHit(combo: number): void {
    const weapon = this.state.weapon;
    const direction = this.view.isLeft ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const distance = weapon?.distance || 1;
    const heroes = this.scanHeroes(direction, distance);
    const damage = this.state.damage + combo;
    for (const hero of heroes) {
      hero.state.hitDamage(this, damage);
    }
  }

  private onAlarm(hero: Hero): void {
    if (this.distanceTo(hero) <= this.state.viewRange * 2) {
      this._path = this.findPath(hero);
    }
  }

  protected scanHeroes(direction: ScanDirection, maxDistance: number = this.state.viewRange): Hero[] {
    return this._dungeon.registry.query<Hero>({
      type: Hero.type,
      filter: hero => {
        return !hero.state.dead.get() &&
          this.distanceTo(hero) <= maxDistance &&
          this.checkDirection(direction, hero) &&
          this.raycastIsVisible(hero);
      }
    });
  }

  protected scanHero(): boolean {
    const [hero] = this.scanHeroes(ScanDirection.AROUND, this.state.viewRange);
    if (hero) {
      for (const monster of this.scanMonsters()) {
        monster.onAlarm(hero);
      }
      return true;
    }
    return false;
  }

  protected get heroOnAttack(): boolean {
    const maxDistance = this.state.weapon?.distance || 1;
    return this.scanHeroes(ScanDirection.AROUND, maxDistance).length > 0;
  }

  protected get heroIsNear(): boolean {
    return this.scanHeroes(ScanDirection.AROUND).length > 0;
  }

  protected moveToHero(): boolean {
    const [hero] = this.scanHeroes(ScanDirection.AROUND);
    if (hero) {
      this.lookAt(hero);
      return this.moveTo(hero);
    } else {
      return false;
    }
  }

  protected lookAtHero(): void {
    const [hero] = this.scanHeroes(ScanDirection.AROUND);
    if (hero) {
      this.lookAt(hero);
    }
  }

  protected runAway(): boolean {
    const [hero] = this.scanHeroes(ScanDirection.AROUND);
    if (!hero) {
      return false;
    }
    const dx = Math.min(1, Math.max(-1, this.x - hero.x));
    const dy = Math.min(1, Math.max(-1, this.y - hero.y));
    return this.tryMove(dx, dy);
  }

  private scanMonsters(): Monster[] {
    return this._dungeon.registry.query<Monster>({
      type: Monster.type,
      filter: monster => {
        return !monster.state.dead.get() &&
          this.distanceTo(monster) <= this.state.viewRange &&
          this.raycastIsVisible(monster)
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

  protected moveTo(hero: Hero): boolean {
    this._path = this.findPath(hero);
    return this.moveByPath();
  }
}

export class MonsterHitController implements HitController {
  private readonly _controller: Monster;

  constructor(controller: Monster) {
    this._controller = controller;
  }

  onHit(combo: number): void {
    this._controller.scanHit(combo);
  }

  continueCombo(): boolean {
    return true;
  }
}