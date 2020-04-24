import {DungeonMap} from "./dungeon.map";
import {Hero, HeroAI} from "./hero";
import {BaseCharacterAI, Character, CharacterViewOptions, HitAnimation, ScanDirection} from "./character";

export abstract class MonsterCharacter extends Character {
  readonly level: number;
  readonly luck: number;
  readonly damage: number;
  readonly xp: number;

  protected constructor(options: {
    name: string,
    speed: number,
    healthMax: number,
    level: number,
    luck: number,
    damage: number,
    xp: number,
  }) {
    super(options);
    this.level = options.level;
    this.luck = options.luck;
    this.damage = options.damage;
    this.xp = options.xp;
  }
}

export abstract class MonsterAI extends BaseCharacterAI {
  abstract readonly character: MonsterCharacter;
  abstract readonly max_distance: number;

  protected constructor(dungeon: DungeonMap, options: CharacterViewOptions) {
    super(dungeon, options);
  }

  protected onKilledBy(by: Character): void {
    if (by && by instanceof Hero) {
      this.dungeon.log(`${this.character.name} killed by ${by.name}`);
      by.addXp(this.character.xp);
    }
  }

  protected onDead(): void {
    if (Math.random() < this.character.luck) {
      this.findDropCell()?.randomDrop();
    }
    this.destroy();
  }

  action(finished: boolean): boolean {
    if (!this.character.dead.get()) {
      const pos_x = this.x;
      const pos_y = this.y;
      const [hero] = this.scanHero(ScanDirection.AROUND, this.max_distance);
      if (hero) {
        const dist_x = Math.abs(pos_x - hero.x);
        const dist_y = Math.abs(pos_y - hero.y);
        if (dist_x > 1 || dist_y > 1) {
          return this.moveTo(hero);
        } else {
          this.hit();
          return true;
        }
      }

      if (finished) {
        // random move ?
        const random_move_percent = 0.1;
        if (Math.random() < random_move_percent) {
          const move_x = Math.floor(Math.random() * 3) - 1;
          const move_y = Math.floor(Math.random() * 3) - 1;
          if (this.move(move_x, move_y)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  hit(): void {
    this.animation = new HitAnimation(this, this.dungeon.ticker, {
      sprite: this.character.name + '_idle',
      speed: this.character.speed,
      finish: () => {
        const [hero] = this.scanHero(ScanDirection.AROUND, 1);
        if (hero && Math.random() < this.character.luck) {
          hero.character.hitDamage(this.character, this.character.damage);
          if (hero.character.dead.get()) {
            return;
          }
        }
        if (!this.action(true)) {
          this.idle();
        }
      }
    });
  }

  protected scanHero(direction: ScanDirection, max_distance: number): HeroAI[] {
    return this.scan(direction, max_distance, c => c instanceof HeroAI) as HeroAI[];
  }
}