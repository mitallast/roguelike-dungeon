export enum MonsterState {
  Idle = 0, Run = 1, Hit = 2
}

export interface Monster {
  name: string
  x: number
  y: number
  new_x: number
  new_y: number
  is_left: boolean
  state: MonsterState
  hitDamage(monster: Monster, damage: number): void;
}

export class MovingMonsterWrapper implements Monster {
  private readonly monster: Monster;

  constructor(monster: Monster) {
    this.monster = monster;
  }

  get name(): string {
    return this.monster.name;
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

  get state(): MonsterState {
    return this.monster.state;
  }

  hitDamage(monster: Monster, damage: number) {
    this.monster.hitDamage(monster, damage);
  }
}