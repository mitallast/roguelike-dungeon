import {DungeonLevel} from "./dungeon.level";
import {MonsterCharacter, BaseMonsterView} from "./character";
import {Observable, Publisher} from "./observable";

export const tinyMonsterNames = [
  "tiny_zombie",
  "goblin",
  "imp",
  "skeleton",
  "muddy",
  "swampy",
  "zombie",
  "ice_zombie",
];

export class TinyMonster implements MonsterCharacter {
  readonly name: string;

  private readonly _healthMax: Observable<number>;
  private readonly _health: Observable<number>;
  private readonly _dead: Observable<boolean> = new Observable(false);

  get healthMax(): Publisher<number> {
    return this._healthMax;
  }

  get health(): Publisher<number> {
    return this._health;
  }

  get dead(): Publisher<boolean> {
    return this._dead;
  }

  hill(health: number): void {
    this._health.update(h => Math.min(this._healthMax.get(), h + health));
  }

  hitDamage(damage: number): void {
    this._health.update((h) => Math.max(0, h - damage));
    if (this._health.get() === 0) {
      this._dead.set(true);
    }
  }

  readonly damage: number = 4;
  readonly luck: number = 0.3;
  readonly speed: number = 0.2;
  readonly xp: number;

  constructor(name: string, level: number) {
    this.name = name;
    this._healthMax = new Observable<number>(10 + Math.floor(level * 2));
    this._health = new Observable<number>(this._healthMax.get());
    this.xp = 35 + 5 * level;
  }
}

export class TinyMonsterView extends BaseMonsterView {
  readonly character: TinyMonster;

  protected readonly max_distance: number = 5;

  constructor(character: TinyMonster, dungeon: DungeonLevel, x: number, y: number) {
    super(dungeon, 1, 1, x, y);
    this.character = character;
    this.init();
  }

  protected onDead(): void {
    if (Math.random() < this.character.luck) {
      this.dungeon.cell(this.x, this.y).randomDrop();
    }
  }

  protected onDestroy(): void {
    this.dungeon.monsters = this.dungeon.monsters.filter(s => s !== this);
  }
}