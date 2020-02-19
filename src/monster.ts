import {Tile} from "./tilemap";
import {Weapon} from "./drop";

export enum MonsterState {
  Idle = 0, Run = 1, Hit = 2
}

export interface Monster {
  x: number
  y: number
  new_x: number
  new_y: number
  is_left: boolean
  frame: number
  start: number
  speed: number
  tile: Tile
  state: MonsterState
  weapon: Weapon
  hitDamage(damage: number, name: string, time: number): void;
  animate(time: number): void;
}

export class MovingMonsterWrapper implements Monster {
  private readonly monster: Monster;

  constructor(monster: Monster) {
    this.monster = monster;
  }

  hitDamage(damage: number, name: string, time: number) {
    this.monster.hitDamage(damage, name, time);
  }

  get x(): number {
    return this.monster.x;
  }

  get y(): number {
    return this.monster.y;
  }

  get new_x(): number {
    return this.monster.new_x;
  }

  get new_y(): number {
    return this.monster.new_y;
  }

  get is_left(): boolean {
    return this.monster.is_left;
  }

  get frame(): number {
    return this.monster.frame;
  }

  get start(): number {
    return this.monster.start;
  }

  get speed(): number {
    return this.monster.speed;
  }

  get tile(): Tile {
    return this.monster.tile;
  }

  get state(): MonsterState {
    return this.monster.state;
  }

  get weapon(): Weapon {
    return this.monster.weapon;
  }

  animate(time: number): void {
  }
}