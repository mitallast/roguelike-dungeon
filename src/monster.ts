import {DungeonMap} from "./dungeon.map";
import {Hero, HeroAI} from "./hero";
import {BaseCharacterAI, Character, CharacterAI, CharacterViewOptions, IdleAnimation, ScanDirection} from "./character";
import {Weapon} from "./drop";

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

export abstract class MonsterCharacter extends Character {
  readonly level: number;
  readonly luck: number;
  readonly baseDamage: number;
  readonly xp: number;

  readonly category: MonsterCategory;
  readonly type: MonsterType;
  readonly spawn: number;

  readonly weapon: Weapon | null;

  get damage(): number {
    return this.baseDamage + (this.weapon?.damage || 0);
  }

  protected constructor(options: {
    name: string,
    speed: number,
    healthMax: number,
    level: number,
    luck: number,
    baseDamage: number,
    xp: number,
    category: MonsterCategory,
    type: MonsterType,
    spawn: number,
    weapon: Weapon | null,
  }) {
    super(options);
    this.level = options.level;
    this.luck = options.luck;
    this.baseDamage = options.baseDamage;
    this.xp = options.xp;
    this.category = options.category;
    this.type = options.type;
    this.spawn = options.spawn;
    this.weapon = options.weapon
  }
}

export abstract class MonsterAI extends BaseCharacterAI {
  abstract readonly character: MonsterCharacter;
  abstract readonly max_distance: number;
  readonly interacting: boolean = false;

  private _state: MonsterState = MonsterState.READY;
  private last_path: PIXI.Point[] = [];
  private readonly spawned: MonsterAI[] = [];

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

  protected onDead(): void {
    this.drop();
    this.destroy();
  }

  protected abstract drop(): void;

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
      this.animation instanceof IdleAnimation
    ) {
      this.moveTo(hero);
    }
  }

  get state(): MonsterState {
    return this._state;
  }

  protected randomMove(): boolean {
    const random_move_percent = 0.1;
    if (Math.random() < random_move_percent) {
      const move_x = Math.floor(Math.random() * 3) - 1;
      const move_y = Math.floor(Math.random() * 3) - 1;
      if (this.move(move_x, move_y)) {
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
      const dist_x = Math.abs(this.x - hero.x);
      const dist_y = Math.abs(this.y - hero.y);
      if (dist_x > this.width || dist_y > this.height) {
        return this.moveTo(hero);
      } else if (this.character.luck < this.dungeon.rng.nextFloat()) {
        this.hit();
        return true;
      }
    }
    return false;
  }

  protected moveTo(character: CharacterAI): boolean {
    this.last_path = this.findPath(character);
    return this.moveByPath();
  }

  protected moveByPath(): boolean {
    if (this.last_path.length > 0) {
      const next = this.last_path[0];
      const d_x = next.x - this.x;
      const d_y = next.y - this.y;
      if (this.move(d_x, d_y)) {
        this.last_path.splice(0, 1);
        return true;
      } else {
        this.last_path = [];
        return false;
      }
    } else {
      return false;
    }
  }

  protected scanHit(): void {
    const weapon = this.character.weapon;
    const direction = this.view.is_left ? ScanDirection.LEFT : ScanDirection.RIGHT;
    const distance = weapon?.distance || 1;
    const heroes = this.scanHero(direction, distance);
    for (const hero of heroes) {
      hero.character.hitDamage(this.character, this.character.damage);
    }
  }

  protected spawnMinions(): boolean {
    for (let i = this.spawned.length - 1; i >= 0; i--) {
      if (this.spawned[i].character.dead.get()) {
        this.spawned.splice(i, 1);
      }
    }
    if (this.spawned.length < this.character.spawn) {
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
        this.spawned.push(minion);
        return true;
      } else {
        console.warn("minion not spawned", this.character.category, this.character.type);
        return false;
      }
    }
    return false;
  }

  protected abstract spawnMinion(x: number, y: number): MonsterAI | null;

  protected scanHero(direction: ScanDirection, max_distance: number): HeroAI[] {
    return this.scanObjects(direction, max_distance, c => c instanceof HeroAI)
      .filter(o => this.raycastIsVisible(o.x, o.y)) as HeroAI[];
  }

  protected scanMonsters(direction: ScanDirection, max_distance: number): MonsterAI[] {
    return this.scanObjects(direction, max_distance, c => c instanceof MonsterAI) as MonsterAI[];
  }
}