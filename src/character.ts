export enum CharacterState {
  Idle = 0, Run = 1, Hit = 2
}

export interface Character {
  name: string
  x: number
  y: number
  new_x: number
  new_y: number
  is_left: boolean
  state: CharacterState
  hitDamage(character: Character, damage: number): void;
}

export class CharacterWrapper implements Character {
  private readonly character: Character;

  constructor(character: Character) {
    this.character = character;
  }

  get name(): string {
    return this.character.name;
  }

  get x(): number {
    return this.character.x;
  }

  get y(): number {
    return this.character.y;
  }

  get new_x(): number {
    return this.character.new_x;
  }

  get new_y(): number {
    return this.character.new_y;
  }

  get is_left(): boolean {
    return this.character.is_left;
  }

  get state(): CharacterState {
    return this.character.state;
  }

  hitDamage(character: Character, damage: number) {
    // @todo what if is character has 2 tiles?!
    this.character.hitDamage(character, damage);
  }
}