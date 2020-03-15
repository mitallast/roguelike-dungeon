import {DungeonMap} from "./dungeon.map";
import {Hero} from "./hero";
import {PathFinding} from "./pathfinding";
import {BaseCharacterAI, Character, HitAnimation, CharacterViewOptions} from "./character";
import * as PIXI from "pixi.js";

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

export abstract class BaseMonsterAI extends BaseCharacterAI {
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
    this.view.destroy();
  }

  lookupHero(max_distance: number): [number, number, Hero] | null {
    const pos_x = this.view.pos_x;
    const pos_y = this.view.pos_y;
    const min_x = Math.max(0, pos_x - max_distance);
    const min_y = Math.max(0, pos_y - max_distance);
    const max_x = Math.min(this.dungeon.width - 1, pos_x + max_distance);
    const max_y = Math.min(this.dungeon.height - 1, pos_y + max_distance);

    let heroDistance = -1;
    let hero: [number, number, Hero] | null = null;

    for (let x = min_x; x <= max_x; x++) {
      for (let y = min_y; y <= max_y; y++) {
        const cell = this.dungeon.cell(x, y);
        if (cell.hasCharacter) {
          const character = cell.character;
          if (character instanceof Hero && !character.dead.get()) {
            const distance = Math.sqrt(
              Math.pow(x - pos_x, 2) +
              Math.pow(y - pos_y, 2)
            );
            if (heroDistance === -1 || distance < heroDistance) {
              heroDistance = distance;
              hero = [x, y, character]
            }
          }
        }
      }
    }
    return hero;
  }

  pathTo(to_x: number, to_y: number, character: Character): boolean {
    const dungeon = this.dungeon;
    const pf = new PathFinding(dungeon.width, dungeon.height);
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const cell = dungeon.cell(x, y);
        const m = cell.character;
        if (m && m !== this.character && m !== character) {
          pf.mark(x, y);
        } else if (cell.hasFloor) {
          pf.clear(x, y);
        }
      }
    }

    const start = new PIXI.Point(this.view.pos_x, this.view.pos_y);
    const end = new PIXI.Point(to_x, to_y);
    const path = pf.find(start, end);
    if (path.length > 0) {
      const next = path[0];
      const d_x = next.x - this.view.pos_x;
      const d_y = next.y - this.view.pos_y;
      return this.move(d_x, d_y);
    } else {
      return false;
    }
  }

  action(): boolean {
    if (!this.character.dead.get()) {
      const pos_x = this.view.pos_x;
      const pos_y = this.view.pos_y;
      const lookup = this.lookupHero(this.max_distance);
      if (lookup) {
        const [x, y, hero] = lookup;
        const dist_x = Math.abs(pos_x - x);
        const dist_y = Math.abs(pos_y - y);
        if (dist_x > 1 || dist_y > 1) {
          return this.pathTo(x, y, hero);
        } else {
          this.hit();
          return true;
        }
      }

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
    return false;
  }

  hit(): void {
    this.animation = new HitAnimation(this.view, this.dungeon.ticker, {
      sprite: this.character.name + '_idle',
      speed: this.character.speed,
      finish: () => {
        const lookup = this.lookupHero(1);
        if (lookup && Math.random() < this.character.luck) {
          const [, , hero] = lookup;
          hero.hitDamage(this.character, this.character.damage);
          if (hero.dead.get()) {
            return;
          }
        }
        if (!this.action()) {
          this.idle();
        }
      }
    });
  }

  protected onPositionChanged(): void {
  }
}