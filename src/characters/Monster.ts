import {DungeonMap} from "../dungeon";
import {Hero, HeroController} from "./Hero";
import {BaseCharacterController, Character, ScanDirection} from "./Character";
import {CharacterViewOptions} from "./CharacterView";
import {CharacterHitController, MonsterAlarmEvent} from "./CharacterState";

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
  abstract readonly max_distance: number;
  readonly interacting: boolean = false;

  private readonly _spawned: MonsterController[] = [];

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

  scanHit(): void {
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

  protected abstract spawnMinion(x: number, y: number): MonsterController | null;

  scanHero(direction: ScanDirection, distance: number = this.max_distance): HeroController[] {
    return this.scanObjects(direction, distance, c => c instanceof HeroController)
      .filter(o => this.raycastIsVisible(o.x, o.y)) as HeroController[];
  }

  scanMonsters(direction: ScanDirection): MonsterController[] {
    return this.scanObjects(direction, this.max_distance, c => c instanceof MonsterController && c !== this) as MonsterController[];
  }

  sendAlarm(hero: HeroController): void {
    const event = new MonsterAlarmEvent(hero);
    console.log("send alarm", event);
    for (const monster of this.scanMonsters(ScanDirection.AROUND)) {
      monster.onEvent(event);
    }
  }
}

export class MonsterHitController implements CharacterHitController {
  private readonly _controller: MonsterController;

  constructor(controller: MonsterController) {
    this._controller = controller;
  }

  onHit(): void {
    this._controller.scanHit();
  }

  onComboFinished(): void {
  }

  onComboHit(): void {
    this._controller.scanHit();
  }

  onComboStarted(): void {
  }

  continueCombo(): boolean {
    return true;
  }
}